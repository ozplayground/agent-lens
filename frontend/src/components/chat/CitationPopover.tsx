'use client';

import React, { useRef, type RefObject } from 'react';
import { ExternalLink, X, Globe, FileText } from 'lucide-react';
import { SourceReference } from '@/types/chat';
import { Popover } from '@/components/ui/Popover';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
import { categoryShortLabel } from '@/lib/labels';

export interface CitationPopoverProps {
  source: SourceReference;
  isOpen: boolean;
  onClose: () => void;
  /** 팝오버를 연 인용 배지. 바깥 클릭 판정에서 빼고, Escape 로 닫으면 포커스를 돌려준다. */
  anchorRef?: RefObject<HTMLElement | null>;
}

export default function CitationPopover({
  source,
  isOpen,
  onClose,
  anchorRef,
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
      // 답변 문단(<p>) 안에서 열리므로 body 로 옮겨 그린다. 스크롤 상자에 잘리지도 않는다 (FE-13).
      portal
      // 포털은 문서 끝에 붙어 Tab 순서가 배지 다음이 아니다. 열 때 안으로 포커스를 옮기고,
      // Escape·닫기는 Popover 가 배지로 돌려준다 (FE-37).
      focusOnOpen
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
        <IconButton label="팝오버 닫기" icon={<X />} size="sm" onClick={onClose} className="-mt-1 -mr-1" />
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
      {/* 워크스페이스가 연결하지 않던 '기사 상세' 버튼은 지웠다 (FE-08). 원문 링크는 오른쪽 끝 그대로 */}
      <div className="flex items-center justify-between gap-2 border-t border-border pt-1 text-sm">
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
