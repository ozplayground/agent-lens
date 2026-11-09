import React, { type Ref } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Select, type SelectOption } from '@/components/ui/Select';

export const SORT_OPTIONS: readonly SelectOption[] = [
  { value: 'hot', label: '인기순' },
  { value: 'quality', label: '품질순' },
  { value: 'latest', label: '최신순' },
  { value: 'top', label: '추천순' },
];

export interface FeedStatusBarProps {
  total: number;
  /** 필터 없이 센 전체 건수 (`stats.total_news`). 필터가 걸려 있을 때만 덧붙인다. */
  totalNews?: number;
  filtered: boolean;
  isBookmarks: boolean;
  highSignalOnly: boolean;
  page: number;
  totalPages: number;
  /** 페이지 이동 뒤 포커스를 받는다 (상태 영역). */
  ref?: Ref<HTMLDivElement>;
  sort: string;
  onSortChange: (sort: string) => void;
  /** 정렬을 바꾸면 1페이지로 돌린다. */
  onPageChange: (page: number) => void;
}

/**
 * 목록 머리줄 (spec 14.17 G1, R42): 왼쪽 상태(건수, 필터 표시, 페이지) + 오른쪽 정렬.
 * 상태는 `role="status"` live 영역이고, 정렬은 그 밖 뒤 형제다 — live 영역 안의 조작 요소는 값이 바뀔 때마다
 * 상태 문장으로 다시 읽히고, 페이지 이동 뒤 상태로 옮기는 포커스가 정렬 글자까지 읽기 때문이다.
 *
 * 세로 맞춤: 머리줄은 위쪽 맞춤(`items-start`)이라 상태가 여러 줄로 늘어도 정렬은 첫 줄 오른쪽에 남는다.
 * 상태는 select 높이(`h-11` 44px, md 이상 `h-9` 36px)와 같은 최소 높이(`min-h-11 md:min-h-9`) 안에서
 * 세로 가운데라, 한 줄일 때 상태 글자(14px, 줄 높이 20px)와 정렬의 세로 중심이 같다 (위 여백 12px, md 이상 8px).
 */
export default function FeedStatusBar({
  total,
  totalNews,
  filtered,
  isBookmarks,
  highSignalOnly,
  page,
  totalPages,
  ref,
  sort,
  onSortChange,
  onPageChange,
}: FeedStatusBarProps) {
  return (
    <div data-feed-list-header="" className="flex items-start gap-3">
      <div
        ref={ref}
        data-feed-status=""
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="flex min-h-11 min-w-0 flex-1 scroll-mt-44 flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm text-fg-muted outline-none md:min-h-9 md:scroll-mt-48"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span>
            총 <strong className="font-semibold text-fg tabular-nums">{total}</strong>건
            {filtered && typeof totalNews === 'number' ? (
              <span className="text-fg-subtle"> (전체 {totalNews}건)</span>
            ) : null}
          </span>
          {isBookmarks ? <Badge tone="accent">북마크 보기</Badge> : null}
          {highSignalOnly ? <Badge tone="warning">Must-Read</Badge> : null}
        </div>
        <span className="text-xs text-fg-subtle tabular-nums">
          페이지 {page} / {totalPages || 1}
        </span>
      </div>
      <Select
        label="정렬"
        hideLabel
        options={SORT_OPTIONS}
        value={sort}
        onChange={(e) => {
          onSortChange(e.target.value);
          onPageChange(1);
        }}
        containerClassName="w-28 shrink-0 xl:w-32"
      />
    </div>
  );
}
