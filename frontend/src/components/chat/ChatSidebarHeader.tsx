'use client';

import React from 'react';
import { Plus, Search, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { buttonClasses } from '@/components/ui/Button';

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
    // 머리 영역 두 줄 (spec 14.6): 1줄 56px = 챗 헤더 높이, 2줄 44px = 맥락 줄 높이.
    // 두 줄 모두 테두리를 높이 안에 두어 아래 경계가 100px 로 챗 헤더(56) + 맥락 줄(44)의 아래 경계와 같다.
    <div data-chat-sidebar-head="" className="flex shrink-0 flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2 px-3">
        <button
          type="button"
          onClick={onNewChat}
          disabled={isStreaming}
          aria-label="+ 새 대화"
          className={buttonClasses('primary', 'md', 'flex-1 gap-1.5')}
        >
          <Plus aria-hidden="true" className="size-4" />
          <span>새 대화</span>
        </button>

        {onToggleCollapse ? (
          <IconButton
            label={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
            icon={isCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            onClick={onToggleCollapse}
          />
        ) : null}
      </div>

      <div className="flex min-h-11 shrink-0 items-center border-b border-border px-3 pb-2 md:h-11 md:pb-0">
        <div className="relative w-full">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="대화 검색..."
            aria-label="대화 검색"
            className="h-11 w-full rounded-lg border border-border-strong bg-surface pr-11 pl-9 text-base text-fg outline-none focus-visible:border-accent md:h-9 md:pr-9 md:text-sm"
          />
          {searchQuery ? (
            <IconButton
              label="검색어 지우기"
              icon={<X />}
              size="sm"
              onClick={() => onSearchChange('')}
              className="absolute top-1/2 right-0 -translate-y-1/2 md:right-0.5"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
