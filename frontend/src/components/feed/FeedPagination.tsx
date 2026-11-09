'use client';

import React, { type RefObject } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface FeedPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** 페이지를 바꾸면 이 요소(상태 줄)로 스크롤하고 포커스를 옮긴다. */
  statusRef?: RefObject<HTMLElement | null>;
}

/** 이전·다음 + `p / T`. 모바일은 두 버튼이 반씩 차지한다. 두 쪽 이상일 때만 그린다. */
export default function FeedPagination({ page, totalPages, onPageChange, statusRef }: FeedPaginationProps) {
  if (totalPages <= 1) return null;

  const go = (next: number) => {
    const clamped = Math.min(Math.max(next, 1), totalPages);
    if (clamped === page) return;
    onPageChange(clamped);
    const target = statusRef?.current;
    if (target) {
      target.scrollIntoView({ block: 'start' });
      target.focus({ preventScroll: true });
    }
  };

  return (
    <nav aria-label="페이지 이동" className="flex items-center gap-2 pt-2 md:justify-center">
      <Button
        variant="secondary"
        leadingIcon={<ChevronLeft />}
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        className="flex-1 md:flex-none"
      >
        이전
      </Button>
      <span className="shrink-0 px-2 text-sm text-fg-muted tabular-nums">
        {page} / {totalPages}
      </span>
      <Button
        variant="secondary"
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        className="flex-1 flex-row-reverse md:flex-none"
        leadingIcon={<ChevronRight />}
      >
        다음
      </Button>
    </nav>
  );
}
