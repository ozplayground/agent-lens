'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { X, History } from 'lucide-react';
import { ChatSessionMeta } from '@/types/chat';
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
  const drawerRef = useRef<HTMLDivElement>(null);

  const filteredSessions = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return sessions;
    return sessions.filter((s) => s.title.toLowerCase().includes(trimmed));
  }, [sessions, searchQuery]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Prevent body scrolling while mobile drawer is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSelectSessionAndClose = (sessionId: string) => {
    onSelectSession(sessionId);
    onClose();
  };

  const handleNewChatAndClose = () => {
    onNewChat();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dim Backdrop */}
      <div
        data-testid="drawer-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 left-0 max-w-full flex">
        <aside
          ref={drawerRef}
          role="navigation"
          aria-label="대화 기록 목록"
          className="w-72 sm:w-80 bg-white h-full shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out animate-in slide-in-from-left"
        >
          {/* Drawer Top Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">대화 기록</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="대화 기록 드로어 닫기"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Header (+ 새 대화, Search) */}
          <ChatSidebarHeader
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onNewChat={handleNewChatAndClose}
            totalSessionsCount={sessions.length}
            isStreaming={isStreaming}
          />

          {/* Session List */}
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
        </aside>
      </div>
    </div>
  );
}
