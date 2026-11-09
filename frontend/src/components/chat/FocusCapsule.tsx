'use client';

import React from 'react';
import { Target, ChevronDown, X } from 'lucide-react';
import { FocusFilters, ChatSourceDetailResponse } from '@/types/chat';
import { NewsItem } from '@/types/news';
import { cn } from '@/lib/cn';
import { ALL_CATEGORY_LABEL, categoryShortLabel } from '@/lib/labels';

export interface FocusCapsuleProps {
  filters: FocusFilters;
  scopedSource?: NewsItem | ChatSourceDetailResponse | null;
  onClick: () => void;
  onReset: () => void;
  isOpen: boolean;
  matchedCount?: number;
  className?: string;
}

const TIME_RANGE_LABELS: Record<string, string> = {
  all: '',
  '24h': '24시간',
  '7d': '최근 7일',
  '30d': '최근 30일',
};

/**
 * 포커스 필터 캡슐: 필터 시트를 여는 버튼 + (필터가 걸려 있으면) 초기화 버튼.
 * 두 버튼은 형제다 (버튼 안에 버튼을 두지 않는다). 모바일 44px, md 이상 32px.
 */
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
  const isActive = !isDefault || Boolean(scopedSource);

  // Generate compact summary label
  let summaryLabel = ALL_CATEGORY_LABEL;
  if (scopedSource) {
    summaryLabel = scopedSource.title.length > 25
      ? `${scopedSource.title.slice(0, 25)}...`
      : scopedSource.title;
  } else if (!isDefault) {
    const parts: string[] = [];
    if (filters.category !== 'all') {
      parts.push(categoryShortLabel(filters.category));
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
      className={cn(
        'inline-flex max-w-full min-w-0 items-center rounded-full border text-sm transition-colors duration-150 ease-standard',
        isActive ? 'border-transparent bg-accent-soft text-accent-soft-fg' : 'border-border bg-surface text-fg-muted',
        className
      )}
    >
      <button
        type="button"
        onClick={onClick}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={cn(
          'inline-flex h-11 min-w-0 items-center gap-1.5 rounded-full pl-3 font-medium select-none md:h-8',
          isActive ? 'pr-1' : 'pr-3 hover:text-fg'
        )}
      >
        <Target aria-hidden="true" className={cn('size-4 shrink-0', isActive ? 'text-accent' : 'text-fg-subtle')} />
        <span className="max-w-[200px] truncate sm:max-w-[320px]">포커스: {summaryLabel}</span>
        {!isActive && <ChevronDown aria-hidden="true" className="size-3.5 shrink-0 text-fg-subtle" />}
      </button>

      {isActive && (
        <button
          type="button"
          onClick={onReset}
          aria-label="포커스 필터 초기화"
          title="포커스 필터 초기화"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface md:size-8"
        >
          <X aria-hidden="true" className="size-3.5" />
        </button>
      )}
    </div>
  );
}
