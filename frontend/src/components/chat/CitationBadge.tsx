'use client';

import React, { useState } from 'react';
import { SourceReference, ChatSourceType } from '@/types/chat';
import CitationPopover from './CitationPopover';

export interface CitationBadgeProps {
  index: number | string;
  type?: ChatSourceType;
  source?: SourceReference;
  onOpenSourceDetail?: (sourceId: number) => void;
  className?: string;
}

export default function CitationBadge({
  index,
  type,
  source,
  onOpenSourceDetail,
  className = '',
}: CitationBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Phantom citation fallback
  if (!source) {
    return (
      <span className="px-1 py-0.2 mx-0.5 rounded font-mono text-[11px] text-slate-400 bg-slate-100 border border-slate-200 cursor-default select-none inline-block">
        [{index}]
      </span>
    );
  }

  const isSupplementary =
    type === 'supplementary' ||
    source.type === 'supplementary' ||
    String(index).startsWith('S');

  const ariaLabel = isSupplementary
    ? `보충 웹 검색 출처 [${index}]: ${source.title}`
    : `출처 ${index}번: ${source.title}`;

  return (
    <span className="relative inline-block align-baseline mx-0.5">
      <button
        type="button"
        role="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`px-1.5 py-0.2 rounded-full font-mono text-[11px] font-semibold transition-colors inline-flex items-center cursor-pointer select-none ${
          isSupplementary
            ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 shadow-2xs'
            : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 shadow-2xs'
        } ${className}`}
      >
        [{index}]
      </button>

      {isOpen && (
        <CitationPopover
          source={source}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onOpenSourceDetail={onOpenSourceDetail}
        />
      )}
    </span>
  );
}
