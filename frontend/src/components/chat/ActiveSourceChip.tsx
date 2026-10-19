'use client';

import React from 'react';
import { X, ExternalLink, Sparkles } from 'lucide-react';
import { NewsItem } from '@/types/news';
import { ChatSourceDetailResponse } from '@/types/chat';

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
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs shadow-2xs transition-all max-w-full">
      <span className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-indigo-100/80 text-indigo-800 font-mono text-[10px] uppercase tracking-wider shrink-0">
        <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
        {source.category}
      </span>

      <span
        onClick={handleTitleClick}
        className={`truncate font-medium text-slate-800 ${
          onPreviewClick ? 'cursor-pointer hover:text-indigo-600 hover:underline' : ''
        }`}
        title={source.title}
      >
        {truncatedTitle}
      </span>

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label="기사 컨텍스트 해제"
        className="p-0.5 rounded-full hover:bg-indigo-200/70 text-indigo-600 hover:text-indigo-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 ml-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
