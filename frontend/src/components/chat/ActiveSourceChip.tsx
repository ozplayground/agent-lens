'use client';

import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { NewsItem } from '@/types/news';
import { ChatSourceDetailResponse } from '@/types/chat';
import { cn } from '@/lib/cn';
import { categoryShortLabel } from '@/lib/labels';

export interface ActiveSourceChipProps {
  source: NewsItem | ChatSourceDetailResponse;
  onRemove: () => void;
  disabled?: boolean;
  onPreviewClick?: (source: NewsItem | ChatSourceDetailResponse) => void;
}

export default function ActiveSourceChip({
  source,
  onRemove,
  disabled = false,
  onPreviewClick,
}: ActiveSourceChipProps) {
  const truncatedTitle =
    source.title.length > 35 ? `${source.title.slice(0, 35)}...` : source.title;

  const handleTitleClick = () => {
    if (onPreviewClick) {
      onPreviewClick(source);
    }
  };

  return (
    <div className="inline-flex h-11 max-w-full items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft pl-1.5 text-xs text-accent-soft-fg md:h-8">
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-fg-muted">
        <Sparkles aria-hidden="true" className="size-3 text-accent" />
        <span>{categoryShortLabel(source.category)}</span>
      </span>

      <span
        onClick={handleTitleClick}
        className={cn(
          'min-w-0 truncate text-sm font-medium text-fg',
          onPreviewClick ? 'cursor-pointer hover:text-accent hover:underline' : null
        )}
        title={source.title}
      >
        {truncatedTitle}
      </span>

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label="기사 컨텍스트 해제"
        title="기사 컨텍스트 해제"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-accent-soft-fg transition-colors duration-150 ease-standard hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50 md:size-8"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
