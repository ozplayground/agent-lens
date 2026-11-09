'use client';

import React, { useRef, type RefObject } from 'react';
import { ExternalLink, BookOpen, X, Globe, FileText } from 'lucide-react';
import { SourceReference } from '@/types/chat';
import { Popover } from '@/components/ui/Popover';
import { Badge } from '@/components/ui/Badge';
import { categoryShortLabel } from '@/lib/labels';

export interface CitationPopoverProps {
  source: SourceReference;
  isOpen: boolean;
  onClose: () => void;
  /** 팝오버를 연 인용 배지. 바깥 클릭 판정에서 빼고, Escape 로 닫으면 포커스를 돌려준다. */
  anchorRef?: RefObject<HTMLElement | null>;
  anchorRect?: DOMRect | null;
  onOpenSourceDetail?: (sourceId: number) => void;
}

export default function CitationPopover({
  source,
  isOpen,
  onClose,
  anchorRef,
  onOpenSourceDetail,
}: CitationPopoverProps) {
  const fallbackAnchorRef = useRef<HTMLElement | null>(null);
  const isSupplementary = source.type === 'supplementary' || String(source.index).startsWith('S');

  let domainName = source.domain;
  if (!domainName && source.url) {
    try {
      domainName = new URL(source.url).hostname;
    } catch {}
  }

  return (
    <Popover
      open={isOpen}
      onClose={onClose}
      anchorRef={anchorRef ?? fallbackAnchorRef}
      label={isSupplementary ? '보충 검색 출처 상세 프리뷰' : '출처 기사 상세 프리뷰'}
      role="dialog"
      side="top"
      className="w-80 p-3 text-left font-sans not-italic whitespace-normal"
    >
      {/* Top row: badge & close button */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {isSupplementary ? (
            <Badge tone="success" icon={<Globe />}>
              보충 검색 [{source.index}]
            </Badge>
          ) : (
            <Badge tone="accent" icon={<FileText />}>
              출처 [{source.index}]
            </Badge>
          )}

          {isSupplementary && domainName && <Badge className="min-w-0 truncate">{domainName}</Badge>}

          {!isSupplementary && source.category && <Badge>{categoryShortLabel(source.category)}</Badge>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="팝오버 닫기"
          title="팝오버 닫기"
          className="-mt-1 -mr-1 inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg md:size-8"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>

      {/* Title */}
      <p className="mb-1.5 line-clamp-2 text-sm leading-snug font-semibold text-fg">{source.title}</p>

      {/* Snippet */}
      {source.snippet && (
        <p className="mb-2 line-clamp-3 rounded-lg bg-surface-muted p-2 text-xs leading-relaxed text-fg-muted">
          {source.snippet}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 border-t border-border pt-1 text-sm">
        {!isSupplementary && onOpenSourceDetail && source.id ? (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSourceDetail(source.id!);
            }}
            className="inline-flex h-11 items-center gap-1.5 rounded-lg px-2 font-medium text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg md:h-8"
          >
            <BookOpen aria-hidden="true" className="size-4" />
            <span>기사 상세</span>
          </button>
        ) : (
          <span />
        )}

        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex h-11 items-center gap-1.5 rounded-lg px-2 font-medium text-accent transition-colors hover:bg-surface-muted md:h-8"
        >
          <span>{isSupplementary ? '웹 문서 보기' : '원문 보기'}</span>
          <ExternalLink aria-hidden="true" className="size-4" />
        </a>
      </div>
    </Popover>
  );
}
