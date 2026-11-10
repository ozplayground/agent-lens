'use client';

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, History, Laptop, Moon, Plus, Sun } from 'lucide-react';
import {
  ChatMessage,
  ScopeMode,
  ChatSourceDetailResponse,
  FocusFilters,
  DEFAULT_FOCUS_FILTERS,
  toChatFocusFilter,
  fromChatFocusFilter,
  applySlidingWindow,
  ChatMessageHistory,
  chatMessageItemToUiMessage,
  ModelTier,
  ModelSwitchEvent,
  ChatTimelineItem,
  TIER_TO_MODEL,
  DEFAULT_MODEL_TIER,
} from '@/types/chat';
import ChatHeader from './ChatHeader';
import ChatMessageList from './ChatMessageList';
import ChatPromptInput from './ChatPromptInput';
import FocusCapsule from './FocusCapsule';
import FocusBottomSheet from './FocusBottomSheet';
import ChatSidebar from './ChatSidebar';
import ChatHistoryDrawer from './ChatHistoryDrawer';
import { useChatSessions } from './useChatSessions';
import { fetchChatSourceDetail, openChatStream } from '@/lib/chatApi';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { parseChatSsePayload } from '@/lib/contract';
import { ToastRegion, useToast } from '@/components/ui/Toast';
import { useTheme } from '@/context/ThemeContext';
import CommandPalette, { type PaletteCommand } from '@/components/CommandPalette';

/** 기사 이관(`sourceId`)·첫 질문(`q`)은 URL 로만 받는다 (ChatPage 가 prop 을 넘기지 않아 지웠다, FE-08). */
export interface ChatWorkspaceProps {
  className?: string;
}

const SOURCE_NOT_FOUND_MESSAGE = '요청하신 기사를 찾을 수 없어 전체 소식 모드로 시작합니다.';
const SOURCE_LOAD_FAILED_MESSAGE = '기사 정보를 불러오지 못해 전체 소식 모드로 시작합니다. 연결 상태를 확인해 주세요.';
const SESSION_LOAD_FAILED_MESSAGE = '대화를 불러오지 못했습니다.';
const TRUNCATED_STREAM_MESSAGE = '응답이 중간에 끊겼습니다. 다시 시도해 주세요.';
/** URL 의 session_id 는 UUID 만 받는다 (FE-24). backend 도 UUID 로 파싱한다. */
const SESSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function ChatWorkspace({
  className = '',
}: ChatWorkspaceProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const toast = useToast();

  // Dual-Layer Session Management Hook
  const {
    sessions,
    isLoading: isSessionsLoading,
    error: sessionsError,
    searchQuery,
    setSearchQuery,
    fetchSessions,
    createOrUpdateSession,
    deleteSession,
    loadSessionDetail,
  } = useChatSessions();

  // Active Chat State
  const [sessionId, setSessionId] = useState<string>(() => generateUUID());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [scopeMode, setScopeMode] = useState<ScopeMode>('global');
  const [activeSource, setActiveSource] = useState<ChatSourceDetailResponse | null>(null);
  const [focusFilters, setFocusFilters] = useState<FocusFilters>(DEFAULT_FOCUS_FILTERS);
  const [selectedTier, setSelectedTier] = useState<ModelTier>(DEFAULT_MODEL_TIER);
  const [modelSwitchEvents, setModelSwitchEvents] = useState<ModelSwitchEvent[]>([]);

  // UI Panels & Drawer States
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState<boolean>(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [viewportHeight, setViewportHeight] = useState<string>('100dvh');

  const abortControllerRef = useRef<AbortController | null>(null);
  // 전송·재시도 콜백이 토큰마다 새로 만들어지지 않도록 최신 목록은 ref 로 읽는다 (FE-10).
  // 커밋과 같은 때(useLayoutEffect) 맞춘다: 지연 effect 로 맞추면 화면에 오류가 그려진 직후 누른
  // 다시 시도가 옛 값(스트리밍 중)을 읽어 질문만 지우고 요청을 보내지 않는다 (FE-04 간헐 실패).
  const messagesRef = useRef<ChatMessage[]>(messages);
  useLayoutEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  const initialHandoverDoneRef = useRef<boolean>(false);
  const initialSessionLoadedRef = useRef<boolean>(false);

  // Actual backend search result sources count (honestly reflects true sources.length from API)
  const actualSourceCount = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === 'assistant' && msg.sources && msg.sources.length > 0) {
        return msg.sources.length;
      }
    }
    return undefined;
  }, [messages]);

  // Track visualViewport for mobile virtual keyboard
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      if (window.visualViewport) {
        setViewportHeight(`${window.visualViewport.height}px`);
      }
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    handleResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  const handleStopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setStreamingMessageId(null);
    setMessages((prev) =>
      prev.map((msg) =>
        msg.status === 'streaming' ? { ...msg, status: 'aborted' } : msg
      )
    );
  }, []);

  // Compute composite timeline containing messages and model switch events
  const timelineItems = useMemo<ChatTimelineItem[]>(() => {
    const items: (ChatTimelineItem & { timestamp: string })[] = [];
    for (const msg of messages) {
      items.push({
        type: 'message',
        data: msg,
        timestamp: msg.timestamp || new Date().toISOString(),
      });
    }
    for (const ev of modelSwitchEvents) {
      items.push({
        type: 'model_switch',
        data: ev,
        timestamp: ev.timestamp,
      });
    }
    items.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    return items;
  }, [messages, modelSwitchEvents]);

  // Model Tier Change Handler
  const handleSelectTier = useCallback(
    (newTier: ModelTier) => {
      setSelectedTier((prev) => {
        if (prev === newTier) return prev;
        if (messages.length > 0) {
          const switchEvent: ModelSwitchEvent = {
            id: `switch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            type: 'model_switch',
            previousTier: prev,
            newTier,
            timestamp: new Date().toISOString(),
          };
          setModelSwitchEvents((events) => [...events, switchEvent]);
        }
        return newTier;
      });
    },
    [messages.length]
  );

  // New Chat Handler
  const handleNewChat = useCallback(() => {
    handleStopGenerating();
    const nextId = generateUUID();
    setSessionId(nextId);
    setMessages([]);
    setModelSwitchEvents([]);
    setSelectedTier(DEFAULT_MODEL_TIER);
    setInputPrompt('');
    setActiveSource(null);
    setScopeMode('global');
    setFocusFilters(DEFAULT_FOCUS_FILTERS);
  }, [handleStopGenerating]);

  // Select Session and Hydrate Context
  const handleSelectSession = useCallback(
    async (targetSessionId: string) => {
      if (isStreaming) {
        handleStopGenerating();
      }

      // 상세를 받은 뒤에 세션을 바꾼다. 받지 못하면 지금 대화를 그대로 두고 알린다 (FE-40):
      // 먼저 바꾸면 이전 대화가 화면에 남은 채 다음 저장이 그 대화를 새 세션 id 로 저장한다.
      const detail = await loadSessionDetail(targetSessionId);
      if (!detail) {
        toast.show({ message: SESSION_LOAD_FAILED_MESSAGE, tone: 'danger' });
        return;
      }
      setSessionId(targetSessionId);
      setScopeMode(detail.scope_mode);
      setActiveSource(detail.active_source || null);
      setFocusFilters(
        detail.active_filters ? fromChatFocusFilter(detail.active_filters) : DEFAULT_FOCUS_FILTERS
      );
      setMessages(
        detail.messages.map((item) =>
          chatMessageItemToUiMessage(item, detail.scope_mode, detail.active_source_id)
        )
      );
      setIsDrawerOpen(false);
    },
    [isStreaming, handleStopGenerating, loadSessionDetail, toast]
  );

  // Delete Session Handler
  const handleDeleteSession = useCallback(
    async (idToDelete: string) => {
      await deleteSession(idToDelete);
      if (idToDelete === sessionId) {
        handleNewChat();
      }
    },
    [deleteSession, sessionId, handleNewChat]
  );

  // Send Message with Multi-Turn History
  const handleSendMessage = useCallback(
    async (
      promptToSend: string,
      options?: {
        scope?: ScopeMode;
        sourceId?: number | null;
        sourceDetail?: ChatSourceDetailResponse | null;
      }
    ) => {
      const trimmed = promptToSend.trim();
      if (!trimmed || isStreaming) return;

      const targetSource = options?.sourceDetail !== undefined ? options.sourceDetail : activeSource;
      const targetSourceId = options?.sourceId !== undefined ? (options.sourceId ?? undefined) : (targetSource?.id ?? undefined);
      const targetScope: ScopeMode = options?.scope ?? ((targetSourceId || targetSource) ? 'scoped' : scopeMode);
      const targetTitle = targetSource?.title;

      const userMsgId = 'msg-user-' + Math.random().toString(36).substring(2, 9);
      const assistantMsgId = 'msg-asst-' + Math.random().toString(36).substring(2, 9);
      const now = new Date().toISOString();

      const userMessage: ChatMessage = {
        id: userMsgId,
        role: 'user',
        content: trimmed,
        timestamp: now,
        scope: targetScope,
        source_id: targetSourceId,
        applied_filters: toChatFocusFilter(focusFilters),
        status: 'sent',
      };

      const initialAssistantMessage: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: now,
        scope: targetScope,
        source_id: targetSourceId,
        status: 'streaming',
        sources: [],
        model_tier: selectedTier,
        model_used: TIER_TO_MODEL[selectedTier],
      };

      // 이번 턴 앞의 대화. 갱신 함수는 받은 prev 를 기록만 한다 (두 번 실행돼도 같은 값).
      // 재시도는 실패한 쌍을 지운 직후 부르므로 콜백이 잡은 `messages` 보다 prev 가 정확하다.
      let earlierMessages = messagesRef.current;
      setMessages((prev) => {
        earlierMessages = prev;
        return [...prev, userMessage, initialAssistantMessage];
      });

      // 보조 메시지는 지역 변수로 누적하고 화면에는 그 값을 그대로 반영한다.
      let assistantFinal = initialAssistantMessage;
      const updateAssistant = (patch: Partial<ChatMessage>) => {
        assistantFinal = { ...assistantFinal, ...patch };
        const next = assistantFinal;
        setMessages((prev) => prev.map((msg) => (msg.id === assistantMsgId ? next : msg)));
      };

      // 세션 저장은 턴마다 한 번, 상태 갱신 함수 밖에서 한다 (완료 또는 중단일 때만).
      const saveTurn = () => {
        void createOrUpdateSession({
          sessionId,
          scopeMode: targetScope,
          activeSourceId: targetSourceId,
          activeSourceTitle: targetTitle,
          focusFilters,
          messages: [...earlierMessages, userMessage, assistantFinal],
        });
      };

      setInputPrompt('');
      setIsStreaming(true);
      setStreamingMessageId(assistantMsgId);

      // 답이 완료된 턴만 history 로 보낸다. 실패·중단 턴의 질문과 재시도 대상 질문은 빠진다 (FE-04).
      const historyPayload: ChatMessageHistory[] = applySlidingWindow(
        messagesRef.current
          .filter((m, i, arr) =>
            m.role === 'assistant'
              ? m.status === 'completed'
              : arr[i + 1]?.role === 'assistant' && arr[i + 1]?.status === 'completed'
          )
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }))
      );

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        // 첫 응답까지만 시간 제한을 두고, 오류 응답은 backend message 로 던진다 (FE-07).
        const res = await openChatStream(
          {
            question: trimmed,
            scope: targetScope,
            source_id: targetSourceId,
            session_id: sessionId,
            history: historyPayload,
            filters: toChatFocusFilter(focusFilters),
            model: TIER_TO_MODEL[selectedTier],
            model_tier: selectedTier,
            // 서버도 이 턴을 같은 id 로 저장해 saveTurn 과 겹쳐도 한 벌만 남는다 (계약 8.1, BUG-02R).
            // 호출마다 새 id 라 재시도는 새 id 로 저장된다.
            user_message_id: userMsgId,
            assistant_message_id: assistantMsgId,
          },
          controller.signal
        );

        if (!res.body) {
          throw new Error('응답 스트림을 찾을 수 없습니다.');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let receivedDone = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            buffer += decoder.decode();
          } else {
            buffer += decoder.decode(value, { stream: true });
          }

          let parts: string[];
          if (done) {
            const trimmedBuffer = buffer.trim();
            parts = trimmedBuffer ? trimmedBuffer.split('\n\n') : [];
            buffer = '';
          } else {
            parts = buffer.split('\n\n');
            buffer = parts.pop() || '';
          }

          for (const block of parts) {
            const lines = block.split('\n');
            let eventType = '';
            let dataStr = '';

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                eventType = line.slice(7).trim();
              } else if (line.startsWith('data: ')) {
                dataStr = line.slice(6).trim();
              }
            }

            if (!dataStr) continue;

            try {
              // 이벤트 payload 를 계약 스키마로 확인하고 그 타입을 그대로 쓴다 (실패 정책은 lib/contract.ts, D-33·FE-38).
              // 검증에 실패하면 받은 값을 그대로 주므로 필드 확인(`data.step` 등)은 남겨 둔다.
              const raw: unknown = JSON.parse(dataStr);

              if (eventType === 'status') {
                const data = parseChatSsePayload('status', raw);
                if (data.step) {
                  updateAssistant({
                    current_status: data,
                    step_history: [...(assistantFinal.step_history || []), data],
                  });
                }
              } else if (eventType === 'sources') {
                const data = parseChatSsePayload('sources', raw);
                if (data.sources) {
                  updateAssistant({
                    sources: data.sources,
                    applied_filters: data.applied_filters,
                    is_relaxed: data.is_relaxed ?? false,
                    // 화면 타입은 null 을 받지 않는다. 표시 쪽은 null·undefined 를 같이 본다.
                    primary_count: data.primary_count ?? undefined,
                    supplementary_count: data.supplementary_count ?? undefined,
                  });
                }
              } else if (eventType === 'token') {
                const data = parseChatSsePayload('token', raw);
                if (typeof data.token === 'string') {
                  updateAssistant({ content: assistantFinal.content + data.token });
                }
              } else if (eventType === 'done') {
                const data = parseChatSsePayload('done', raw);
                receivedDone = true;
                updateAssistant({
                  status: 'completed',
                  model_used: data.model || TIER_TO_MODEL[selectedTier] || 'claude-sonnet-5-5',
                  model_tier: data.model_tier || selectedTier,
                  latency_ms: data.latency_ms,
                  usage: data.usage,
                });
              } else if (eventType === 'error') {
                const data = parseChatSsePayload('error', raw);
                throw new Error(data.message || '스트리밍 에러가 발생했습니다.');
              }
            } catch (err: unknown) {
              if (err instanceof Error && err.name === 'AbortError') return;
              if (eventType === 'error') throw err;
            }
          }

          if (done) break;
        }

        // 사용자가 중단한 뒤 본문이 오류 없이 끝나도 중단이다 (FE-34).
        const stoppedByUser = controller.signal.aborted;
        // `done` 없이 끝난 스트림은 잘린 답이다. 완료로 표시·저장하지 않고 오류로 보인다.
        if (!receivedDone && !stoppedByUser) {
          throw new Error(TRUNCATED_STREAM_MESSAGE);
        }
        if (stoppedByUser) {
          updateAssistant({ status: 'aborted' });
        }

        saveTurn();
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          updateAssistant({ status: 'aborted' });
          saveTurn();
        } else {
          const errMsg =
            err instanceof Error ? err.message : '네트워크 지연으로 응답이 중단되었습니다.';
          updateAssistant({ status: 'error', errorMessage: errMsg });
        }
      } finally {
        setIsStreaming(false);
        setStreamingMessageId(null);
        abortControllerRef.current = null;
      }
    },
    [isStreaming, scopeMode, activeSource, sessionId, focusFilters, selectedTier, createOrUpdateSession]
  );

  // Handle URL search params (sourceId, q, session_id)
  useEffect(() => {
    if (initialHandoverDoneRef.current) return;
    initialHandoverDoneRef.current = true;

    const paramSessionId = searchParams?.get('session_id');
    if (paramSessionId && SESSION_ID_PATTERN.test(paramSessionId) && !initialSessionLoadedRef.current) {
      initialSessionLoadedRef.current = true;
      handleSelectSession(paramSessionId);
      return;
    }

    const paramSourceId =
      searchParams?.get('sourceId') || null;
    const paramQuestion = searchParams?.get('q') || null;

    if (paramSourceId) {
      const id = parseInt(paramSourceId, 10);
      if (!isNaN(id)) {
        // 기사가 없으면(404) null, 연결·서버 오류는 던진다. 문구를 나눠 알린다 (FE-41).
        const startGlobal = (message: string) => {
          toast.show({ message, tone: 'warning' });
          setScopeMode('global');
          setActiveSource(null);
          if (paramQuestion) {
            handleSendMessage(paramQuestion, {
              scope: 'global',
              sourceId: null,
              sourceDetail: null,
            });
          }
        };
        fetchChatSourceDetail(id)
          .then((data) => {
            if (!data) {
              startGlobal(SOURCE_NOT_FOUND_MESSAGE);
              return;
            }
            setActiveSource(data);
            setScopeMode('scoped');
            if (paramQuestion) {
              handleSendMessage(paramQuestion, {
                scope: 'scoped',
                sourceId: data.id,
                sourceDetail: data,
              });
            }
          })
          .catch(() => startGlobal(SOURCE_LOAD_FAILED_MESSAGE));
        return;
      }
    }

    if (paramQuestion) {
      // 다른 분기(fetch 후 전송)와 같이 effect 본문 밖에서 전송을 시작한다.
      queueMicrotask(() => {
        handleSendMessage(paramQuestion);
      });
    }
  }, [searchParams, handleSendMessage, handleSelectSession, toast]);

  // 챗 커맨드 팔레트 명령 (spec 설계 6). 테마 제목 규칙은 피드 팔레트와 같다.
  const paletteCommands = useMemo<PaletteCommand[]>(
    () => [
      {
        id: 'feed',
        title: '뉴스 피드로 이동',
        subtitle: '수집된 AI 에이전트 소식 목록으로 돌아갑니다',
        icon: <ArrowLeft />,
        perform: () => router.push('/'),
      },
      {
        id: 'theme',
        title:
          theme === 'system'
            ? '라이트 모드로 전환 (현재 시스템)'
            : theme === 'dark'
              ? '시스템 모드로 전환'
              : '다크 모드로 전환',
        subtitle: '시스템 및 개인 선호 테마 순환 토글 (Light -> Dark -> System)',
        icon: theme === 'dark' ? <Moon /> : theme === 'system' ? <Laptop /> : <Sun />,
        perform: () => toggleTheme(),
      },
      {
        id: 'new-chat',
        title: '새 대화 시작',
        subtitle: '현재 대화를 닫고 빈 대화로 시작합니다',
        icon: <Plus />,
        perform: () => handleNewChat(),
      },
      {
        id: 'history',
        title: '대화 기록 열기',
        subtitle: '저장된 대화 목록을 엽니다',
        icon: <History />,
        perform: () => {
          if (isDesktop) setIsSidebarOpen(true);
          else setIsDrawerOpen(true);
        },
      },
    ],
    [router, theme, toggleTheme, handleNewChat, isDesktop]
  );

  const handleRemoveSource = useCallback(() => {
    setActiveSource(null);
    setScopeMode('global');
  }, []);

  // 재시도 콜백은 바뀌지 않아야 메모된 메시지가 다시 그려지지 않는다 (FE-10). 전송 함수는 ref 로 부른다.
  const sendMessageRef = useRef(handleSendMessage);
  useLayoutEffect(() => {
    sendMessageRef.current = handleSendMessage;
  }, [handleSendMessage]);

  const handleRetryMessage = useCallback(
    (messageId: string) => {
      const current = messagesRef.current;
      const msgIndex = current.findIndex((m) => m.id === messageId);
      if (msgIndex > 0 && current[msgIndex - 1].role === 'user') {
        const questionText = current[msgIndex - 1].content;
        setMessages((prev) => prev.filter((_, idx) => idx !== msgIndex && idx !== msgIndex - 1));
        sendMessageRef.current(questionText);
      }
    },
    []
  );

  return (
    <div
      style={{ height: viewportHeight }}
      className={`w-full max-w-full flex flex-row bg-canvas text-fg overflow-hidden overflow-x-hidden ${className}`}
    >
      {/* Desktop History Sidebar (Collapsible) */}
      <ChatSidebar
        sessions={sessions}
        activeSessionId={sessionId}
        isOpen={isSidebarOpen}
        isLoading={isSessionsLoading}
        error={sessionsError}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onToggleCollapse={() => setIsSidebarOpen((prev) => !prev)}
        onRetryLoad={fetchSessions}
        isStreaming={isStreaming}
        className="hidden lg:flex"
      />

      {/* Main Chat Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden overflow-x-hidden relative">
        {/* Header */}
        <ChatHeader
          scopeMode={scopeMode}
          onScopeChange={setScopeMode}
          activeSource={activeSource}
          onRemoveSource={handleRemoveSource}
          onNewChat={handleNewChat}
          onToggleHistoryDrawer={() => {
            if (isDesktop) {
              setIsSidebarOpen((prev) => !prev);
            } else {
              setIsDrawerOpen((prev) => !prev);
            }
          }}
          isHistoryOpen={isDesktop ? isSidebarOpen : isDrawerOpen}
          isSidebarOpen={isSidebarOpen}
          isCommandPaletteOpen={isPaletteOpen}
          onToggleCommandPalette={() => setIsPaletteOpen((prev) => !prev)}
          isStreaming={isStreaming}
        />

        {/* Message List & Welcome View */}
        <ChatMessageList
          messages={messages}
          timelineItems={timelineItems}
          isStreaming={isStreaming}
          streamingMessageId={streamingMessageId || undefined}
          onSelectPromptSuggestion={(prompt) => {
            setInputPrompt(prompt);
            handleSendMessage(prompt);
          }}
          onRetryMessage={handleRetryMessage}
        />

        {/* 입력 영역 감싸개: `relative` 라서 composer 알림 영역이 입력 영역 바로 위에 붙는다.
            입력 영역의 overflow-x-hidden 상자 밖에 두어 알림이 잘리지 않는다 (spec 14.7 C-2). */}
        <div className="relative w-full max-w-full shrink-0">
          <ToastRegion placement="composer" />

          {/* Pinned Bottom Composer Bar with Focus Capsule — 열 맞춤: 바깥 px-4 md:px-6, 안쪽 mx-auto w-full max-w-3xl */}
          <div className="w-full max-w-full overflow-x-hidden border-t border-border bg-surface px-4 md:px-6">
            <div
              data-composer=""
              className="max-w-3xl mx-auto w-full flex flex-col gap-2 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            >
              {/* Focus Capsule Toolbar */}
              <div className="flex items-center justify-between">
                <FocusCapsule
                  filters={focusFilters}
                  scopedSource={activeSource}
                  onClick={() => setIsBottomSheetOpen(true)}
                  onReset={() => setFocusFilters(DEFAULT_FOCUS_FILTERS)}
                  isOpen={isBottomSheetOpen}
                  matchedCount={actualSourceCount}
                />
              </div>

              <ChatPromptInput
                value={inputPrompt}
                onChange={setInputPrompt}
                onSubmit={handleSendMessage}
                onStopGenerating={handleStopGenerating}
                isStreaming={isStreaming}
                scopeMode={scopeMode}
                selectedTier={selectedTier}
                onSelectTier={handleSelectTier}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Slide-over Drawer (< 1024px) */}
      <ChatHistoryDrawer
        isOpen={isDrawerOpen && !isDesktop}
        onClose={() => setIsDrawerOpen(false)}
        sessions={sessions}
        activeSessionId={sessionId}
        isLoading={isSessionsLoading}
        error={sessionsError}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onRetryLoad={fetchSessions}
        isStreaming={isStreaming}
      />

      {/* Focus Bottom Sheet Drawer */}
      <FocusBottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        filters={focusFilters}
        onApplyFilters={(next) => setFocusFilters(next)}
        onResetFilters={() => setFocusFilters(DEFAULT_FOCUS_FILTERS)}
        targetCount={actualSourceCount}
      />

      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        commands={paletteCommands}
      />

    </div>
  );
}
