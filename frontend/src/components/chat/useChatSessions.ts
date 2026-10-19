'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChatSessionMeta,
  ChatSessionSummary,
  ChatSessionDetail,
  ChatMessage,
  ScopeMode,
  FocusFilters,
  generateAutoTitle,
  summaryToSessionMeta,
  toChatFocusFilter,
  fromChatFocusFilter,
  uiMessageToChatMessageItem,
  chatMessageItemToUiMessage,
} from '@/types/chat';

const STORAGE_INDEX_KEY = 'agentlens_chat_sessions_index';
const STORAGE_SESSION_PREFIX = 'agentlens_chat_session_';
const MAX_SESSIONS = 30;

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
  const [sessions, setSessions] = useState<ChatSessionMeta[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const cached = localStorage.getItem(STORAGE_INDEX_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}
    return [];
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isMountedRef = useRef<boolean>(true);

  // 1. Fetch sessions from API and sync with LocalStorage (Dual-Layer)
  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/chat/sessions?limit=${MAX_SESSIONS}`);
      if (!res.ok) {
        throw new Error(`세션 목록 조회 실패 (${res.status})`);
      }

      const summaries: ChatSessionSummary[] = await res.json();
      const metas = summaries.map(summaryToSessionMeta);

      if (isMountedRef.current) {
        setSessions(metas);
        try {
          localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(metas));
        } catch {}
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        // Fall back to local storage if available
        try {
          const cached = localStorage.getItem(STORAGE_INDEX_KEY);
          if (cached) {
            setSessions(JSON.parse(cached));
          } else {
            setError(
              err instanceof Error ? err.message : '세션 목록을 불러오지 못했습니다.'
            );
          }
        } catch {
          setError('세션 목록을 불러오지 못했습니다.');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchSessions();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchSessions]);

  // 2. Load Session Detail (with L1 Local Cache + L2 Server Fetch)
  const loadSessionDetail = useCallback(
    async (sessionId: string): Promise<ChatSessionDetail | null> => {
      // Check L1 cache first
      let cachedDetail: ChatSessionDetail | null = null;
      try {
        const cachedStr = localStorage.getItem(`${STORAGE_SESSION_PREFIX}${sessionId}`);
        if (cachedStr) {
          cachedDetail = JSON.parse(cachedStr);
        }
      } catch {}

      try {
        const res = await fetch(`/api/chat/sessions/${sessionId}`);
        if (res.ok) {
          const detail: ChatSessionDetail = await res.json();
          try {
            localStorage.setItem(
              `${STORAGE_SESSION_PREFIX}${sessionId}`,
              JSON.stringify(detail)
            );
          } catch {}
          return detail;
        } else if (res.status === 404) {
          return cachedDetail;
        }
      } catch {
        return cachedDetail;
      }

      return cachedDetail;
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
        const nextList = [updatedMeta, ...filtered].slice(0, MAX_SESSIONS);

        try {
          localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(nextList));

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
      try {
        await fetch('/api/chat/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: sessionId,
            title: resolvedTitle,
            scope_mode: scopeMode,
            active_source_id: activeSourceId || null,
            active_filters: focusFilters ? toChatFocusFilter(focusFilters) : null,
            messages: messages.map((m) => uiMessageToChatMessageItem(m, sessionId)),
          }),
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
      const res = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error(`대화 삭제 실패 (${res.status})`);
      }
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
