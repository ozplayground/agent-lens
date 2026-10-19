'use client';

import React from 'react';
import { Plus, Search, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export interface ChatSidebarHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNewChat: () => void;
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
  totalSessionsCount?: number;
  isStreaming?: boolean;
}

export default function ChatSidebarHeader({
  searchQuery,
  onSearchChange,
  onNewChat,
  onToggleCollapse,
  isCollapsed = false,
  isStreaming = false,
}: ChatSidebarHeaderProps) {
  return (
    <div className="p-3 border-b border-slate-200 flex flex-col gap-2.5 bg-white">
      {/* Top action row */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onNewChat}
          disabled={isStreaming}
          aria-label="+ 새 대화"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>새 대화</span>
        </button>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
            title={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Real-time search input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="대화 검색..."
          aria-label="대화 검색"
          className="w-full pl-8 pr-7 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="검색어 지우기"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
