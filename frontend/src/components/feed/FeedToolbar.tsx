'use client';

import React, { type ReactNode, type Ref } from 'react';
import { Bookmark, Bot, Compass, Cpu, ShieldCheck, Sparkles, Star } from 'lucide-react';
import type { CategoryType } from '@/types/news';
import { Chip, ChipGroup } from '@/components/ui/Chip';
import { SearchField } from '@/components/ui/SearchField';
import { cn } from '@/lib/cn';
import { ALL_CATEGORY_LABEL, categoryLabel, sourceLabel } from '@/lib/labels';

/** 카테고리 칩 순서와 아이콘. 라벨은 `lib/labels.ts` 의 긴 라벨 (`all` 만 여기서). */
export const FEED_CATEGORIES: { id: CategoryType; icon: React.ReactNode }[] = [
  { id: 'all', icon: <Compass /> },
  { id: 'harness', icon: <ShieldCheck /> },
  { id: 'mcp_plugins_skills', icon: <Cpu /> },
  { id: 'agent_tech', icon: <Bot /> },
  { id: 'ai_news', icon: <Sparkles /> },
];


export function feedCategoryLabel(id: CategoryType): string {
  return id === 'all' ? ALL_CATEGORY_LABEL : categoryLabel(id);
}

/** 소스 칩 순서. 건수가 있는 소스만 보인다. */
export const FEED_SOURCES = ['rss_kr', 'github', 'hackernews', 'arxiv', 'huggingface', 'reddit', 'rss'] as const;

/** 360px 검색 입력 안에 들어가는 짧은 자리표시 (spec 14.2). 예시는 넣지 않는다. */
export const SEARCH_PLACEHOLDER = '키워드 검색';

export interface FeedToolbarProps {
  category: CategoryType;
  source: string;
  search: string;
  highSignalOnly: boolean;
  categoryCounts?: Record<string, number>;
  sourceCounts?: Record<string, number>;
  bookmarkCount: number;
  onCategoryChange: (category: CategoryType) => void;
  onSourceChange: (source: string) => void;
  onHighSignalChange: (value: boolean) => void;
  onSearchChange: (value: string) => void;
  /** 검색 제출 (Enter). 1페이지로 돌린 뒤 부른다. */
  onSearchSubmit: () => void;
  onPageChange: (page: number) => void;
  /** `/` 단축키로 포커스할 검색 입력 ref. */
  searchInputRef?: Ref<HTMLInputElement>;
}

function sum(record: Record<string, number> | undefined): number {
  return Object.values(record ?? {}).reduce((a, b) => a + b, 0);
}

/** 툴바의 한 줄. 줄마다 독립된 flex 컨테이너라 두 컨트롤이 열을 나눠 쓰지 않는다. */
function ToolbarRow({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div data-toolbar-row="" className={cn('flex min-w-0 items-center gap-2 md:gap-4', className)}>
      {children}
    </div>
  );
}

/**
 * 피드 검색 영역 + 필터 영역 (spec 설계 4.1, 14.2, 14.17 G1). 정렬은 목록 머리줄(`FeedStatusBar`)에 있다 (R42).
 * 필터를 바꾸면 1페이지로 돌린다. 카테고리를 바꾸면 소스는 `all` (NEWS-02).
 *
 * 두 형제를 그린다: ① 검색 영역 `[data-feed-search]` (콘텐츠 전체 폭 입력, sticky 아님)
 * ② 필터 영역 `[data-feed-toolbar]` (줄 1 카테고리 칩, 줄 2 소스 칩 + 오른쪽 끝 Must-Read 토글, md 이상 헤더 아래에 붙음).
 * 세 영역(검색·필터·목록 머리줄) 사이 간격은 main `gap` 하나다 (R20).
 *
 * 모든 폭에서 같은 DOM 트리를 그리고 폭별 배치는 CSS 클래스로만 바꾼다 (R33). 그래서 폭이 바뀌어도
 * 검색 입력과 스크롤 줄이 다시 마운트되지 않고(포커스·값·`scrollLeft` 유지), 서버 HTML 과 첫 렌더가 같다.
 * DOM 순서(= Tab 순서) `검색 → 카테고리 → 소스 → Must-Read` 가 모든 폭에서 화면 순서와 같다.
 *
 * | 폭 | 검색 영역 | 필터 줄 1 | 필터 줄 2 |
 * |---|---|---|---|
 * | ≥1280 | 전체 폭 입력 | 카테고리(아이콘 있음) | 소스 + Must-Read(별 + 글자) |
 * | 768~1279 | 전체 폭 입력 | 카테고리(아이콘 숨김) | 소스 + Must-Read(별 + 글자) |
 * | <768 | 전체 폭 입력 | 카테고리(화면 좌우 끝까지) | 소스(왼쪽 화면 끝까지) + Must-Read(별만, 44×44) |
 *
 * Must-Read 는 소스 줄 밖 고정 토글이라 소스 줄을 밀어도 늘 보인다 (R34). 줄 2 의 마지막 자식이라 오른쪽 끝이 콘텐츠 끝이다.
 *
 * 두 칩 줄은 `ScrollRow` 다. 넘침 표시는 `ScrollRow` 공통이다: 768 이상은 넘친 쪽에 스크롤 버튼,
 * 768 미만은 넘친 쪽마다 줄 밖 장식 표시(왼쪽 ‹, 오른쪽 ›). 화면 끝까지 늘인 쪽에 표시가 생기면
 * 그 끝 여백은 줄 대신 표시가 쓴다.
 */
export default function FeedToolbar({
  category,
  source,
  search,
  highSignalOnly,
  categoryCounts,
  sourceCounts,
  bookmarkCount,
  onCategoryChange,
  onSourceChange,
  onHighSignalChange,
  onSearchChange,
  onSearchSubmit,
  onPageChange,
  searchInputRef,
}: FeedToolbarProps) {
  const totalCategoryCount = sum(categoryCounts);
  const totalSourceCount = sum(sourceCounts);
  const visibleSources = FEED_SOURCES.filter((id) => (sourceCounts?.[id] ?? 0) > 0);

  const selectCategory = (next: CategoryType) => {
    onCategoryChange(next);
    onSourceChange('all');
    onPageChange(1);
  };

  const selectSource = (next: string) => {
    onSourceChange(next);
    onPageChange(1);
  };

  const categoryGroup = (
    <ChipGroup label="카테고리" scrollable bleed className="min-w-0 flex-1">
      {FEED_CATEGORIES.map((cat) => (
        <Chip
          key={cat.id}
          selected={category === cat.id}
          icon={cat.icon}
          iconClassName="max-xl:hidden"
          count={cat.id === 'all' ? totalCategoryCount : categoryCounts?.[cat.id] ?? 0}
          onClick={() => selectCategory(cat.id)}
        >
          {feedCategoryLabel(cat.id)}
        </Chip>
      ))}
    </ChipGroup>
  );

  const searchField = (
    <SearchField
      ref={searchInputRef}
      label="키워드 검색"
      hideLabel
      placeholder={SEARCH_PLACEHOLDER}
      value={search}
      onChange={(e) => onSearchChange(e.target.value)}
      onSubmit={() => {
        onPageChange(1);
        onSearchSubmit();
      }}
      onClear={() => {
        onSearchChange('');
        onPageChange(1);
      }}
      formClassName="w-full"
    />
  );

  const sourceGroup = (
    // 768 미만: 왼쪽만 화면 끝까지 (오른쪽은 Must-Read 토글이 있어 늘이지 않는다).
    // 왼쪽으로 넘치면(start·both) 왼쪽 끝 여백은 ‹ 표시가 쓰고, 오른쪽으로 넘치면(end·both) › 표시가 Must-Read 앞에 온다.
    // 넘침 표시(768 미만 양쪽 ‹·›, 768 이상 스크롤 버튼)는 ScrollRow 공통이다.
    // 선택 칩 보이기는 소스 칩(`data-source-chip`)만 본다.
    <ChipGroup
      label="소스"
      scrollable
      bleed="start"
      className="min-w-0 flex-1"
      selectedSelector='[data-source-chip][aria-pressed="true"]'
    >
      <Chip data-source-chip="" selected={source === 'all'} count={totalSourceCount} onClick={() => selectSource('all')}>
        전체
      </Chip>
      {visibleSources.map((id) => (
        <Chip
          key={id}
          data-source-chip=""
          selected={source === id}
          count={sourceCounts?.[id] ?? 0}
          onClick={() => selectSource(id)}
        >
          {sourceLabel(id)}
        </Chip>
      ))}
      <Chip
        data-source-chip=""
        selected={source === 'bookmarks'}
        icon={<Bookmark />}
        count={bookmarkCount}
        onClick={() => selectSource('bookmarks')}
      >
        북마크
      </Chip>
    </ChipGroup>
  );

  // 소스 줄 오른쪽 끝 고정 토글 (R34). 768 미만은 별만 보이는 44×44, 접근 이름은 늘 `Must-Read`.
  const mustReadToggle = (
    <Chip
      tone="warning"
      data-must-read-toggle=""
      selected={highSignalOnly}
      icon={<Star className={highSignalOnly ? 'fill-current' : 'text-warning'} />}
      onClick={() => {
        onHighSignalChange(!highSignalOnly);
        onPageChange(1);
      }}
      title="기술 깊이와 실무 가치가 입증된 고품질 소식만 보기"
      className="shrink-0 max-md:w-11 max-md:justify-center max-md:px-0"
    >
      <span className="max-md:sr-only">Must-Read</span>
    </Chip>
  );

  return (
    <>
      {/* 검색 영역: 필터 영역 위의 독립 영역. `/` 단축키로 옮길 때 sticky 헤더 아래에 보이게 scroll-mt-20. */}
      <div data-feed-search="" className="scroll-mt-20">
        {searchField}
      </div>
      {/* 필터 영역. sticky 배경용 py-2 는 -my-2 로 상쇄해 앞뒤 간격은 main gap 하나로 정한다 (R20). */}
      <div
        data-feed-toolbar=""
        className="-mx-4 -my-2 flex flex-col gap-2 bg-canvas/95 px-4 py-2 md:sticky md:top-14 md:z-10 md:-mx-6 md:px-6 md:backdrop-blur lg:-mx-8 lg:px-8"
      >
        <ToolbarRow>{categoryGroup}</ToolbarRow>
        <ToolbarRow>
          {sourceGroup}
          {mustReadToggle}
        </ToolbarRow>
      </div>
    </>
  );
}
