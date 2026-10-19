'use client';

import React from 'react';
import { MessageSquareDashed, SearchX, Plus, RefreshCw } from 'lucide-react';

export interface SessionEmptyStateProps {
  isSearchResultEmpty?: boolean;
  searchQuery?: string;
  onNewChat?: () => void;
  onClearSearch?: () => void;
}

export default function SessionEmptyState({
  isSearchResultEmpty = false,
  searchQuery = '',
  onNewChat,
  onClearSearch,
}: SessionEmptyStateProps) {
  if (isSearchResultEmpty) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500">
        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
          <SearchX className="w-4 h-4" />
        </div>
        <p className="text-xs font-medium text-slate-700">검색 결과가 없습니다</p>
        <p className="text-[11px] text-slate-400 mt-1 max-w-[180px] truncate">
          &apos;{searchQuery}&apos;에 해당하는 대화가 없습니다.
        </p>
        {onClearSearch && (
          <button
            type="button"
            onClick={onClearSearch}
            className="mt-3 px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
          >
            검색어 초기화
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500">
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
        <MessageSquareDashed className="w-5 h-5" />
      </div>
      <p className="text-xs font-semibold text-slate-700">저장된 대화 기록이 없습니다</p>
      <p className="text-[11px] text-slate-400 mt-1 leading-normal max-w-[200px]">
        새로운 대화를 시작하여 에이전트 기술과 뉴스를 탐색해보세요.
      </p>
      {onNewChat && (
        <button
          type="button"
          onClick={onNewChat}
          className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>새 대화 시작</span>
        </button>
      )}
    </div>
  );
}
