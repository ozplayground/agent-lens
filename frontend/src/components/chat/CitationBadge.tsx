'use client';

import React, { useRef, useState } from 'react';
import { SourceReference, ChatSourceType } from '@/types/chat';
import { cn } from '@/lib/cn';
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
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Phantom citation fallback
  if (!source) {
    return (
      <span className="mx-0.5 inline-block cursor-default rounded-full bg-surface-muted px-1.5 text-xs text-fg-subtle tabular-nums select-none">
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
    <span className="relative mx-0.5 inline-block align-baseline">
      {/*
        모바일(<768)은 누르는 영역 44px. 음수 세로 여백으로 줄 높이는 늘리지 않는다.
        색 표시는 안쪽 알약(span)이 맡고, 글자색은 버튼에 둔다.
      */}
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        data-tone={isSupplementary ? 'supplementary' : 'primary'}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'group inline-flex cursor-pointer items-center justify-center rounded-full align-baseline text-xs font-semibold tabular-nums select-none max-md:-my-3.5 max-md:min-h-11 max-md:min-w-11',
          isSupplementary ? 'text-success' : 'text-accent-soft-fg',
          className
        )}
      >
        <span
          className={cn(
            'inline-flex items-center rounded-full px-1.5 leading-5 ring-current/40 group-hover:ring-1 group-aria-expanded:ring-1',
            isSupplementary
              ? 'bg-success-soft'
              : 'bg-accent-soft'
          )}
        >
          [{index}]
        </span>
      </button>

      {isOpen && (
        <CitationPopover
          source={source}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          anchorRef={buttonRef}
          onOpenSourceDetail={onOpenSourceDetail}
        />
      )}
    </span>
  );
}
