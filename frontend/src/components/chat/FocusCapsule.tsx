'use client';

import React from 'react';
import { Target, ChevronDown, X } from 'lucide-react';
import { FocusFilters, ChatSourceDetailResponse } from '@/types/chat';
import { NewsItem } from '@/types/news';

export interface FocusCapsuleProps {
  filters: FocusFilters;
  scopedSource?: NewsItem | ChatSourceDetailResponse | null;
  onClick: () => void;
  onReset: () => void;
  isOpen: boolean;
  className?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  all: '전체 소식',
  harness: '하네스',
  mcp_plugins_skills: 'MCP',
  agent_tech: '에이전트 기술',
  ai_news: 'AI 뉴스',
};

const TIME_RANGE_LABELS: Record<string, string> = {
  all: '',
  '24h': '24시간',
  '7d': '최근 7일',
  '30d': '최근 30일',
};

export default function FocusCapsule({
  filters,
  scopedSource,
  onClick,
  onReset,
  isOpen,
  className = '',
}: FocusCapsuleProps) {
  const isDefault =
    filters.category === 'all' &&
    filters.timeRange === 'all' &&
    filters.sort === 'hot' &&
    !filters.highSignalOnly;

  // Generate compact summary label
  let summaryLabel = '전체 소식';
  if (scopedSource) {
    summaryLabel = scopedSource.title.length > 25
      ? `${scopedSource.title.slice(0, 25)}...`
      : scopedSource.title;
  } else if (!isDefault) {
    const parts: string[] = [];
    if (filters.category !== 'all') {
      parts.push(CATEGORY_LABELS[filters.category] || filters.category);
    }
    if (filters.timeRange !== 'all') {
      parts.push(TIME_RANGE_LABELS[filters.timeRange] || filters.timeRange);
    }
    if (filters.highSignalOnly) {
      parts.push('고신호');
    }
    summaryLabel = parts.join(' · ') || '맞춤 필터';
  }

  const ariaLabel = `지식 검색 포커스 필터 설정 열기. 현재 설정: ${summaryLabel}`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-label={ariaLabel}
      className={`h-[30px] inline-flex items-center gap-1.5 px-3 rounded-full text-xs font-medium select-none transition-all cursor-pointer ${
        isDefault && !scopedSource
          ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200'
          : 'bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border border-indigo-200'
      } ${className}`}
    >
      <Target
        className={`w-3.5 h-3.5 shrink-0 ${
          isDefault && !scopedSource ? 'text-slate-500' : 'text-indigo-600'
        }`}
      />
      <span className="truncate max-w-[200px] sm:max-w-[320px]">
        Focus: {summaryLabel}
      </span>

      {isDefault && !scopedSource ? (
        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onReset();
          }}
          aria-label="포커스 필터 초기화"
          className="p-0.5 -mr-1 rounded-full hover:bg-indigo-200/70 text-indigo-600 hover:text-indigo-900 transition-colors cursor-pointer shrink-0"
          title="포커스 필터 초기화"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
