'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChatSessionMeta,
  ChatSessionDetail,
  ChatMessage,
  ScopeMode,
  FocusFilters,
  generateAutoTitle,
  summaryToSessionMeta,
  toChatFocusFilter,
  uiMessageToChatMessageItem,
} from '@/types/chat';
import { deleteChatSession, fetchChatSessionDetail, fetchChatSessions, saveChatSession } from '@/lib/chatApi';

const STORAGE_INDEX_KEY = 'agentlens_chat_sessions_index';
const STORAGE_SESSION_PREFIX = 'agentlens_chat_session_';
const MAX_SESSIONS = 30;

/**
 * 저장된 세션 목록을 읽는다. 배열이 아니거나 깨졌으면 빈 목록, id·제목이 문자열이 아닌 항목은 버린다 (FE-18).
 * 다른 탭·수동 편집·이전 형식의 값으로 화면이 죽지 않게 한다.
 */
function readStoredIndex(): ChatSessionMeta[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_INDEX_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is ChatSessionMeta =>
        typeof s === 'object' && s !== null && typeof s.id === 'string' && typeof s.title === 'string'
    );
  } catch {
    return [];
  }
}

/** 저장된 세션 상세. 객체에 문자열 id 와 메시지 배열이 없으면 null (FE-18). */
function readStoredDetail(sessionId: string): ChatSessionDetail | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(`${STORAGE_SESSION_PREFIX}${sessionId}`) || 'null');
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'id' in parsed &&
      typeof parsed.id === 'string' &&
      'messages' in parsed &&
      Array.isArray(parsed.messages)
    ) {
      return parsed as ChatSessionDetail;
    }
  } catch {}
  return null;
}

/** 세션 상세 캐시 키를 모두 지운다 (FE-26). */
function removeAllStoredDetails() {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_SESSION_PREFIX)) keys.push(key);
  }
  keys.forEach((key) => localStorage.removeItem(key));
}

export interface UseChatSessionsReturn {
  sessions: ChatSessionMeta[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  fetchSessions: () => Promise<void>;
  createOrUpdateSession: (params: {
    sessionId: string;
    title?: string;
    scopeMode: ScopeMode;
    activeSourceId?: number | null;
    activeSourceTitle?: string;
    focusFilters?: FocusFilters | null;
    messages: ChatMessage[];
  }) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  loadSessionDetail: (sessionId: string) => Promise<ChatSessionDetail | null>;
  resetSessions: () => void;
}

export function useChatSessions(): UseChatSessionsReturn {
  const [sessions, setSessions] = useState<ChatSessionMeta[]>(() =>
    typeof window === 'undefined' ? [] : readStoredIndex()
  );

  // 마운트하자마자 목록을 불러오므로 첫 상태는 로딩 중이다.
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isMountedRef = useRef<boolean>(true);

  // 1. Fetch sessions from API and sync with LocalStorage (Dual-Layer)
  // 상태 초기화 없이 요청과 결과 반영만 한다 (마운트 시 바로 부른다).
  const loadSessions = useCallback((): Promise<void> => {
    // 상태 반영은 모두 응답 콜백 안에서 한다.
    return fetchChatSessions(MAX_SESSIONS)
      .then((summaries) => {
        const metas = summaries.map(summaryToSessionMeta);

        if (isMountedRef.current) {
          setSessions(metas);
          try {
            localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(metas));
          } catch {}
        }
      })
      .catch((err: unknown) => {
        if (isMountedRef.current) {
          // 저장된 목록이 있으면 그것으로 보이고, 없거나 깨졌으면 오류를 보인다.
          const cached = readStoredIndex();
          if (cached.length > 0) {
            setSessions(cached);
          } else {
            setSessions([]);
            setError(err instanceof Error ? err.message : '세션 목록을 불러오지 못했습니다.');
          }
        }
      })
      .finally(() => {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      });
  }, []);

  // 다시 불러오기: 로딩·오류 상태를 초기화한 뒤 요청한다.
  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    await loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    isMountedRef.current = true;
    loadSessions();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadSessions]);

  // 2. Load Session Detail (with L1 Local Cache + L2 Server Fetch)
  const loadSessionDetail = useCallback(
    async (sessionId: string): Promise<ChatSessionDetail | null> => {
      // 서버 값이 먼저다. 서버에 없거나(404) 실패하면 저장된 상세를 쓴다.
      try {
        const detail = await fetchChatSessionDetail(sessionId);
        if (detail) {
          try {
            localStorage.setItem(`${STORAGE_SESSION_PREFIX}${sessionId}`, JSON.stringify(detail));
          } catch {}
          return detail;
        }
      } catch {}
      return readStoredDetail(sessionId);
    },
    []
  );

  // 3. Create or Update Session (Auto-Titling, FIFO Eviction, Dual-Layer Persist)
  const createOrUpdateSession = useCallback(
    async ({
      sessionId,
      title,
      scopeMode,
      activeSourceId,
      activeSourceTitle,
      focusFilters,
      messages,
    }: {
      sessionId: string;
      title?: string;
      scopeMode: ScopeMode;
      activeSourceId?: number | null;
      activeSourceTitle?: string;
      focusFilters?: FocusFilters | null;
      messages: ChatMessage[];
    }) => {
      if (messages.length === 0) return;

      // Determine Title
      let resolvedTitle = title;
      if (!resolvedTitle || resolvedTitle === '새 대화') {
        const firstUserMsg = messages.find((m) => m.role === 'user');
        resolvedTitle = firstUserMsg
          ? generateAutoTitle(firstUserMsg.content)
          : '새 대화';
      }

      const now = new Date().toISOString();

      setSessions((prev) => {
        const existing = prev.find((s) => s.id === sessionId);
        const updatedMeta: ChatSessionMeta = {
          id: sessionId,
          title: resolvedTitle,
          createdAt: existing?.createdAt || now,
          updatedAt: now,
          messageCount: messages.length,
          scopeMode,
          activeSourceId,
          activeSourceTitle: activeSourceTitle || existing?.activeSourceTitle,
          focusFilters,
          lastMessagePreview: messages[messages.length - 1]?.content.slice(0, 60),
        };

        // Prepend and enforce FIFO limit of 30
        const filtered = prev.filter((s) => s.id !== sessionId);
        const ordered = [updatedMeta, ...filtered];
        const nextList = ordered.slice(0, MAX_SESSIONS);

        try {
          localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(nextList));
          // 목록에서 밀려난 세션의 상세 캐시도 지운다 (FE-26)
          for (const evicted of ordered.slice(MAX_SESSIONS)) {
            localStorage.removeItem(`${STORAGE_SESSION_PREFIX}${evicted.id}`);
          }

          // Also save detailed session
          const detailToSave: ChatSessionDetail = {
            id: sessionId,
            title: resolvedTitle,
            created_at: updatedMeta.createdAt,
            updated_at: updatedMeta.updatedAt,
            scope_mode: scopeMode,
            active_source_id: activeSourceId || null,
            active_filters: focusFilters ? toChatFocusFilter(focusFilters) : null,
            messages: messages.map((m) => uiMessageToChatMessageItem(m, sessionId)),
          };
          localStorage.setItem(
            `${STORAGE_SESSION_PREFIX}${sessionId}`,
            JSON.stringify(detailToSave)
          );
        } catch {}

        return nextList;
      });

      // Background sync to server API
      // 서버 저장이 실패해도 로컬 저장으로 이어 쓴다 (다음 성공 때 서버가 따라온다).
      try {
        await saveChatSession({
          id: sessionId,
          title: resolvedTitle,
          scope_mode: scopeMode,
          active_source_id: activeSourceId || null,
          active_filters: focusFilters ? toChatFocusFilter(focusFilters) : null,
          messages: messages.map((m) => uiMessageToChatMessageItem(m, sessionId)),
        });
      } catch {}
    },
    []
  );

  // 4. Delete Session
  const deleteSession = useCallback(async (sessionId: string) => {
    // 1. Optimistic local removal
    setSessions((prev) => {
      const nextList = prev.filter((s) => s.id !== sessionId);
      try {
        localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(nextList));
        localStorage.removeItem(`${STORAGE_SESSION_PREFIX}${sessionId}`);
      } catch {}
      return nextList;
    });

    // 2. Server API deletion
    try {
      await deleteChatSession(sessionId);
    } catch (err: unknown) {
      // Re-fetch on failure to sync
      fetchSessions();
      throw err;
    }
  }, [fetchSessions]);

  const resetSessions = useCallback(() => {
    setSessions([]);
    try {
      localStorage.removeItem(STORAGE_INDEX_KEY);
      removeAllStoredDetails();
    } catch {}
  }, []);

  return {
    sessions,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    fetchSessions,
    createOrUpdateSession,
    deleteSession,
    loadSessionDetail,
    resetSessions,
  };
}
