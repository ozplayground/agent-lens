'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, X } from 'lucide-react';
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
import { mockSearchChunks } from '@/mocks/fixtures/chat';
import ChatHeader from './ChatHeader';
import ChatMessageList from './ChatMessageList';
import ChatPromptInput from './ChatPromptInput';
import FocusCapsule from './FocusCapsule';
import FocusBottomSheet from './FocusBottomSheet';
import ChatSidebar from './ChatSidebar';
import ChatHistoryDrawer from './ChatHistoryDrawer';
import { useChatSessions } from './useChatSessions';

export interface ChatWorkspaceProps {
  initialSourceId?: number;
  initialQuestion?: string;
  className?: string;
}

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
  initialSourceId,
  initialQuestion,
  className = '',
}: ChatWorkspaceProps) {
  const searchParams = useSearchParams();

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
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [viewportHeight, setViewportHeight] = useState<string>('100dvh');

  const abortControllerRef = useRef<AbortController | null>(null);
  const initialHandoverDoneRef = useRef<boolean>(false);
  const initialSessionLoadedRef = useRef<boolean>(false);

  // Real-time matching target count prediction
  const targetCount = useMemo(() => {
    let chunks = [...mockSearchChunks];
    if (focusFilters.category !== 'all') {
      chunks = chunks.filter((c) => c.category === focusFilters.category);
    }
    if (focusFilters.highSignalOnly) {
      chunks = chunks.filter((c) => c.quality_score >= 7.8);
    }
    if (focusFilters.timeRange !== 'all') {
      if (focusFilters.timeRange === '24h' && focusFilters.category === 'harness') {
        return 0;
      }
    }
    return chunks.length;
  }, [focusFilters]);

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
    const items: { type: 'message' | 'model_switch'; data: any; timestamp: string }[] = [];
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
    return items as ChatTimelineItem[];
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

      setSessionId(targetSessionId);

      const detail = await loadSessionDetail(targetSessionId);
      if (detail) {
        setScopeMode(detail.scope_mode);
        setActiveSource(detail.active_source || null);
        setFocusFilters(
          detail.active_filters
            ? fromChatFocusFilter(detail.active_filters)
            : DEFAULT_FOCUS_FILTERS
        );
        setMessages(
          detail.messages.map((item) =>
            chatMessageItemToUiMessage(item, detail.scope_mode, detail.active_source_id)
          )
        );
      }
      setIsDrawerOpen(false);
    },
    [isStreaming, handleStopGenerating, loadSessionDetail]
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
    async (promptToSend: string) => {
      const trimmed = promptToSend.trim();
      if (!trimmed || isStreaming) return;

      const userMsgId = 'msg-user-' + Math.random().toString(36).substring(2, 9);
      const assistantMsgId = 'msg-asst-' + Math.random().toString(36).substring(2, 9);
      const now = new Date().toISOString();

      const userMessage: ChatMessage = {
        id: userMsgId,
        role: 'user',
        content: trimmed,
        timestamp: now,
        scope: scopeMode,
        source_id: activeSource?.id,
        applied_filters: toChatFocusFilter(focusFilters),
        status: 'sent',
      };

      const initialAssistantMessage: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: now,
        scope: scopeMode,
        source_id: activeSource?.id,
        status: 'streaming',
        sources: [],
        model_tier: selectedTier,
        model_used: TIER_TO_MODEL[selectedTier],
      };

      setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
      setInputPrompt('');
      setIsStreaming(true);
      setStreamingMessageId(assistantMsgId);

      // Multi-turn sliding window history from existing messages
      const historyPayload: ChatMessageHistory[] = applySlidingWindow(
        messages
          .filter((m) => m.status === 'completed' || m.status === 'sent')
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }))
      );


      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const res = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: trimmed,
            scope: scopeMode,
            source_id: activeSource?.id,
            session_id: sessionId,
            history: historyPayload,
            filters: toChatFocusFilter(focusFilters),
            model: TIER_TO_MODEL[selectedTier],
            model_tier: selectedTier,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.message || `서버 에러 (${res.status})`);
        }

        if (!res.body) {
          throw new Error('응답 스트림을 찾을 수 없습니다.');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

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
              const data = JSON.parse(dataStr);

              if (eventType === 'status' && data.step) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? {
                          ...msg,
                          current_status: data,
                          step_history: [...(msg.step_history || []), data],
                        }
                      : msg
                  )
                );
              } else if (eventType === 'sources' && data.sources) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? {
                          ...msg,
                          sources: data.sources,
                          applied_filters: data.applied_filters,
                          is_relaxed: data.is_relaxed ?? false,
                          primary_count: data.primary_count,
                          supplementary_count: data.supplementary_count,
                        }
                      : msg
                  )
                );
              } else if (eventType === 'token' && typeof data.token === 'string') {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? { ...msg, content: msg.content + data.token }
                      : msg
                  )
                );
              } else if (eventType === 'done') {
                setMessages((prev) => {
                  const updated = prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? {
                          ...msg,
                          status: 'completed' as const,
                          model_used: data.model || TIER_TO_MODEL[selectedTier] || 'gemini-2.5-flash',
                          model_tier: data.model_tier || selectedTier,
                          latency_ms: data.latency_ms,
                          usage: data.usage,
                        }
                      : msg
                  );

                  // Commit completed turn to dual-layer session store
                  createOrUpdateSession({
                    sessionId,
                    scopeMode,
                    activeSourceId: activeSource?.id,
                    activeSourceTitle: activeSource?.title,
                    focusFilters,
                    messages: updated,
                  });

                  return updated;
                });
              } else if (eventType === 'error') {
                throw new Error(data.message || '스트리밍 에러가 발생했습니다.');
              }
            } catch (err: unknown) {
              if (err instanceof Error && err.name === 'AbortError') return;
              if (eventType === 'error') throw err;
            }
          }
        }

        // Finalize completed status
        setMessages((prev) => {
          const final = prev.map((msg) =>
            msg.id === assistantMsgId && msg.status === 'streaming'
              ? {
                  ...msg,
                  status: 'completed' as const,
                  model_tier: msg.model_tier || selectedTier,
                  model_used: msg.model_used || TIER_TO_MODEL[selectedTier],
                }
              : msg
          );
          createOrUpdateSession({
            sessionId,
            scopeMode,
            activeSourceId: activeSource?.id,
            activeSourceTitle: activeSource?.title,
            focusFilters,
            messages: final,
          });
          return final;
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          setMessages((prev) => {
            const abortedList = prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, status: 'aborted' as const } : msg
            );
            createOrUpdateSession({
              sessionId,
              scopeMode,
              activeSourceId: activeSource?.id,
              activeSourceTitle: activeSource?.title,
              focusFilters,
              messages: abortedList,
            });
            return abortedList;
          });
        } else {
          const errMsg =
            err instanceof Error ? err.message : '네트워크 지연으로 응답이 중단되었습니다.';
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    status: 'error',
                    errorMessage: errMsg,
                  }
                : msg
            )
          );
        }
      } finally {
        setIsStreaming(false);
        setStreamingMessageId(null);
        abortControllerRef.current = null;
      }
    },
    [isStreaming, scopeMode, activeSource, sessionId, focusFilters, messages, createOrUpdateSession]
  );

  // Handle URL search params (sourceId, q, session_id)
  useEffect(() => {
    if (initialHandoverDoneRef.current) return;
    initialHandoverDoneRef.current = true;

    const paramSessionId = searchParams?.get('session_id');
    if (paramSessionId && !initialSessionLoadedRef.current) {
      initialSessionLoadedRef.current = true;
      handleSelectSession(paramSessionId);
      return;
    }

    const paramSourceId =
      searchParams?.get('sourceId') || (initialSourceId ? String(initialSourceId) : null);
    const paramQuestion = searchParams?.get('q') || initialQuestion || null;

    if (paramSourceId) {
      const id = parseInt(paramSourceId, 10);
      if (!isNaN(id)) {
        fetch(`/api/chat/sources/${id}`)
          .then(async (res) => {
            if (res.ok) {
              const data = (await res.json()) as ChatSourceDetailResponse;
              setActiveSource(data);
              setScopeMode('scoped');
              if (paramQuestion) {
                handleSendMessage(paramQuestion);
              }
            } else {
              setToastMessage('요청하신 기사를 찾을 수 없어 전체 뉴스 모드로 시작합니다.');
              setScopeMode('global');
              setActiveSource(null);
              if (paramQuestion) {
                handleSendMessage(paramQuestion);
              }
            }
          })
          .catch(() => {
            setToastMessage('요청하신 기사를 찾을 수 없어 전체 뉴스 모드로 시작합니다.');
            setScopeMode('global');
            setActiveSource(null);
            if (paramQuestion) {
              handleSendMessage(paramQuestion);
            }
          });
        return;
      }
    }

    if (paramQuestion) {
      handleSendMessage(paramQuestion);
    }
  }, [searchParams, initialSourceId, initialQuestion, handleSendMessage, handleSelectSession]);

  const handleRemoveSource = useCallback(() => {
    setActiveSource(null);
    setScopeMode('global');
  }, []);

  const handleRetryMessage = useCallback(
    (messageId: string) => {
      const msgIndex = messages.findIndex((m) => m.id === messageId);
      if (msgIndex > 0 && messages[msgIndex - 1].role === 'user') {
        const questionText = messages[msgIndex - 1].content;
        setMessages((prev) => prev.filter((_, idx) => idx !== msgIndex && idx !== msgIndex - 1));
        handleSendMessage(questionText);
      }
    },
    [messages, handleSendMessage]
  );

  return (
    <div
      style={{ height: viewportHeight }}
      className={`w-full max-w-full flex flex-row bg-slate-50 overflow-hidden overflow-x-hidden ${className}`}
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
        {/* Warning Toast */}
        {toastMessage && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center justify-between z-40 animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-medium">{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="p-1 rounded hover:bg-amber-100 text-amber-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Header */}
        <ChatHeader
          scopeMode={scopeMode}
          onScopeChange={setScopeMode}
          activeSource={activeSource}
          onRemoveSource={handleRemoveSource}
          onNewChat={handleNewChat}
          onToggleHistoryDrawer={() => {
            if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
              setIsSidebarOpen((prev) => !prev);
            } else {
              setIsDrawerOpen((prev) => !prev);
            }
          }}
          isHistoryOpen={isDrawerOpen || isSidebarOpen}
          showNewChatButton={!isSidebarOpen}
          isStreaming={isStreaming}
          selectedTier={selectedTier}
          onSelectTier={handleSelectTier}
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
          onCopyMessage={() => {}}
        />

        {/* Pinned Bottom Composer Bar with Focus Capsule */}
        <div className="w-full max-w-full overflow-x-hidden border-t border-slate-200 bg-white/90 backdrop-blur-xs p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-xs shrink-0">
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-2">
            {/* Focus Capsule Toolbar */}
            <div className="flex items-center justify-between">
              <FocusCapsule
                filters={focusFilters}
                scopedSource={scopeMode === 'scoped' ? activeSource : null}
                onClick={() => setIsBottomSheetOpen(true)}
                onReset={() => setFocusFilters(DEFAULT_FOCUS_FILTERS)}
                isOpen={isBottomSheetOpen}
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

      {/* Mobile Slide-over Drawer (< 1024px) */}
      <ChatHistoryDrawer
        isOpen={isDrawerOpen}
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
        targetCount={targetCount}
      />
    </div>
  );
}
