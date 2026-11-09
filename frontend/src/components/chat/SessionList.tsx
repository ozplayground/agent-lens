'use client';

import React from 'react';
import { ChatSessionMeta } from '@/types/chat';
import SessionItemCard from './SessionItemCard';
import SessionEmptyState from './SessionEmptyState';
import SessionListSkeleton from './SessionListSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';

export interface SessionListProps {
  sessions: ChatSessionMeta[];
  activeSessionId: string | null;
  isLoading?: boolean;
  error?: string | null;
  searchQuery?: string;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onRetryLoad?: () => void;
  onNewChat?: () => void;
  onClearSearch?: () => void;
}

export default function SessionList({
  sessions,
  activeSessionId,
  isLoading = false,
  error = null,
  searchQuery = '',
  onSelectSession,
  onDeleteSession,
  onRetryLoad,
  onNewChat,
  onClearSearch,
}: SessionListProps) {
  if (isLoading) {
    return <SessionListSkeleton count={5} />;
  }

  if (error) {
    return (
      <ErrorState
        title="대화 기록을 불러오지 못했습니다"
        message={error}
        onRetry={onRetryLoad}
        className="py-6"
      />
    );
  }

  if (sessions.length === 0) {
    return (
      <SessionEmptyState
        isSearchResultEmpty={Boolean(searchQuery.trim())}
        searchQuery={searchQuery}
        onNewChat={onNewChat}
        onClearSearch={onClearSearch}
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain p-2">
      <div className="sr-only" aria-live="polite">
        {sessions.length}개의 대화가 검색되었습니다.
      </div>
      {sessions.map((session) => (
        <SessionItemCard
          key={session.id}
          session={session}
          isActive={session.id === activeSessionId}
          onSelect={onSelectSession}
          onDelete={onDeleteSession}
        />
      ))}
    </div>
  );
}
