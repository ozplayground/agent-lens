'use client';

import React, { useId, useMemo } from 'react';
import { X, History } from 'lucide-react';
import { ChatSessionMeta } from '@/types/chat';
import { Drawer } from '@/components/ui/Drawer';
import { IconButton } from '@/components/ui/IconButton';
import ChatSidebarHeader from './ChatSidebarHeader';
import SessionList from './SessionList';

export interface ChatHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSessionMeta[];
  activeSessionId: string | null;
  isLoading?: boolean;
  error?: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onRetryLoad?: () => void;
  isStreaming?: boolean;
}

/**
 * 1024px 미만의 대화 기록 드로어 (spec 설계 5·6). `Drawer side="left"` 라서 Escape·배경막·포커스·스크롤 잠금은
 * 공통 오버레이 규칙을 따른다. 헤더의 `aria-controls="chat-history-drawer"` 가 이 대화상자를 가리킨다.
 */
export default function ChatHistoryDrawer({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  isLoading = false,
  error = null,
  searchQuery,
  onSearchChange,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRetryLoad,
  isStreaming = false,
}: ChatHistoryDrawerProps) {
  const titleId = useId();

  const filteredSessions = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return sessions;
    return sessions.filter((s) => s.title.toLowerCase().includes(trimmed));
  }, [sessions, searchQuery]);

  const handleSelectSessionAndClose = (sessionId: string) => {
    onSelectSession(sessionId);
    onClose();
  };

  const handleNewChatAndClose = () => {
    onNewChat();
    onClose();
  };

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      side="left"
      labelledBy={titleId}
      backdropTestId="drawer-backdrop"
      panelProps={{ id: 'chat-history-drawer' }}
      bodyClassName="flex flex-col p-0"
      header={
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border pl-4 pr-2">
          <div className="flex min-w-0 items-center gap-2">
            <History aria-hidden="true" className="size-4 shrink-0 text-accent" />
            <h2 id={titleId} className="truncate text-base font-semibold text-fg">
              대화 기록
            </h2>
          </div>
          <IconButton label="대화 기록 드로어 닫기" icon={<X />} onClick={onClose} />
        </div>
      }
    >
      <nav aria-label="대화 기록 목록" className="flex min-h-0 flex-1 flex-col">
        <ChatSidebarHeader
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onNewChat={handleNewChatAndClose}
          totalSessionsCount={sessions.length}
          isStreaming={isStreaming}
        />

        <SessionList
          sessions={filteredSessions}
          activeSessionId={activeSessionId}
          isLoading={isLoading}
          error={error}
          searchQuery={searchQuery}
          onSelectSession={handleSelectSessionAndClose}
          onDeleteSession={onDeleteSession}
          onRetryLoad={onRetryLoad}
          onNewChat={handleNewChatAndClose}
          onClearSearch={() => onSearchChange('')}
        />
      </nav>
    </Drawer>
  );
}
