'use client';

import React, { useMemo } from 'react';
import { ChatSessionMeta } from '@/types/chat';
import ChatSidebarHeader from './ChatSidebarHeader';
import SessionList from './SessionList';

export interface ChatSidebarProps {
  sessions: ChatSessionMeta[];
  activeSessionId: string | null;
  isOpen: boolean;
  isLoading?: boolean;
  error?: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onToggleCollapse: () => void;
  onRetryLoad?: () => void;
  isStreaming?: boolean;
  className?: string;
}

export default function ChatSidebar({
  sessions,
  activeSessionId,
  isOpen,
  isLoading = false,
  error = null,
  searchQuery,
  onSearchChange,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onToggleCollapse,
  onRetryLoad,
  isStreaming = false,
  className = '',
}: ChatSidebarProps) {
  const filteredSessions = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return sessions;
    return sessions.filter((s) => s.title.toLowerCase().includes(trimmed));
  }, [sessions, searchQuery]);

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      role="navigation"
      aria-label="대화 기록 목록"
      className={`w-64 lg:w-72 border-r border-slate-200 bg-white h-full shrink-0 flex flex-col transition-all duration-300 z-20 ${className}`}
    >
      <ChatSidebarHeader
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onNewChat={onNewChat}
        onToggleCollapse={onToggleCollapse}
        isCollapsed={!isOpen}
        totalSessionsCount={sessions.length}
        isStreaming={isStreaming}
      />

      <SessionList
        sessions={filteredSessions}
        activeSessionId={activeSessionId}
        isLoading={isLoading}
        error={error}
        searchQuery={searchQuery}
        onSelectSession={onSelectSession}
        onDeleteSession={onDeleteSession}
        onRetryLoad={onRetryLoad}
        onNewChat={onNewChat}
        onClearSearch={() => onSearchChange('')}
      />
    </aside>
  );
}
