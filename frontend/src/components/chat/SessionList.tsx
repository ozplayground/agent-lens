'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { ChatSessionMeta } from '@/types/chat';
import SessionItemCard from './SessionItemCard';
import SessionEmptyState from './SessionEmptyState';
import SessionListSkeleton from './SessionListSkeleton';

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
      <div className="p-4 m-2 rounded-lg bg-rose-50 border border-rose-200 text-center">
        <AlertCircle className="w-5 h-5 text-rose-500 mx-auto mb-1.5" />
        <p className="text-xs font-semibold text-rose-800">{error}</p>
        {onRetryLoad && (
          <button
            type="button"
            onClick={onRetryLoad}
            className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-700 bg-white border border-rose-200 hover:bg-rose-100 rounded-md transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>다시 시도</span>
          </button>
        )}
      </div>
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
    <div className="flex-1 overflow-y-auto overscroll-contain divide-y divide-slate-100 p-2 space-y-1">
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
