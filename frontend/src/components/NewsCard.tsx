'use client';

import React, { useSyncExternalStore } from 'react';
import { ArrowBigUp, ArrowUpRight, Bookmark, Flame, GitFork, MessageSquare, Star } from 'lucide-react';
import { NewsItem } from '@/types/news';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
import {
  COUNT_METRIC_LABELS,
  SCORE_METRIC_LABELS,
  categoryLabel,
  categoryShortLabel,
  countMetric,
  scoreMetric,
  sourceLabel,
} from '@/lib/labels';
import { cn } from '@/lib/cn';
import HandoverCtaButton from './chat/HandoverCtaButton';

interface NewsCardProps {
  item: NewsItem;
  onSelect: (item: NewsItem) => void;
  isBookmarked: boolean;
  onToggleBookmark: (item: NewsItem, e: React.MouseEvent) => void;
  isFocused?: boolean;
  /** 목록에서 시사점이 반복되는 카드면 `true`: 요약이 있으면 시사점 대신 요약을 보인다 (R18). */
  preferSummary?: boolean;
}

// 상대 시각 계산에 쓰는 현재 시각. 렌더 중 Date.now() 를 부르지 않도록
// 분 단위로 갱신되는 외부 저장소로 두고 useSyncExternalStore 로 읽는다.
const CLOCK_TICK_MS = 60_000;
let clockNow = Date.now();
const clockListeners = new Set<() => void>();
let clockTimer: ReturnType<typeof setInterval> | null = null;

function tickClock() {
  clockNow = Date.now();
  clockListeners.forEach((listener) => listener());
}

function subscribeClock(listener: () => void) {
  clockListeners.add(listener);
  if (clockTimer === null) {
    clockNow = Date.now();
    clockTimer = setInterval(tickClock, CLOCK_TICK_MS);
  }
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0 && clockTimer !== null) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  };
}

function getClockSnapshot() {
  return clockNow;
}

function useNow() {
  return useSyncExternalStore(subscribeClock, getClockSnapshot, getClockSnapshot);
}

// Format relative time (e.g., "3시간 전")
function getRelativeTime(dateStr: string, now: number) {
  try {
    const d = new Date(dateStr);
    const diff = (now - d.getTime()) / 1000;
    if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
  } catch {
    return '';
  }
}

export default function NewsCard({
  item,
  onSelect,
  isBookmarked,
  onToggleBookmark,
  isFocused = false,
  preferSummary = false,
}: NewsCardProps) {
  const now = useNow();
  // 원천 점수는 원천이 실제 지표를 주는 소스(GitHub 스타, HackerNews 포인트, Reddit 추천)만 그린다 (R36).
  const scoreKind = scoreMetric(item.source);
  // 인기 점수는 raw_score 에서 계산되므로 원천 지표가 없는 소스에서는 합성 값이라 숨긴다 (R41).
  const showHot = scoreKind !== null && item.hotness_score > 25;
  const countKind = countMetric(item.source);
  const ScoreIcon = scoreKind === 'stars' ? Star : ArrowBigUp;
  const CountIcon = countKind === 'forks' ? GitFork : MessageSquare;
  const countLabel = COUNT_METRIC_LABELS[countKind];
  const showInsight = Boolean(item.why_it_matters) && !(preferSummary && item.summary);
  const techStack = item.tech_stack ? item.tech_stack.slice(0, 3) : [];
  const hasBadges = item.is_high_signal || techStack.length > 0;

  return (
    <Card
      as="article"
      interactive
      data-feed-card=""
      data-source={item.source}
      data-focused={isFocused ? 'true' : undefined}
      onClick={() => onSelect(item)}
      className={cn(
        'flex h-full cursor-pointer flex-col gap-3',
        isFocused ? 'ring-2 ring-accent ring-offset-2 ring-offset-canvas' : null
      )}
    >
      {/* ① 머리줄: 카테고리 · 소스 · 시간 (한 줄, 넘치면 말줄임), 북마크. 배지를 두지 않는다. */}
      <div data-card-meta="" className="flex h-11 items-center gap-2 md:h-8">
        <div className="min-w-0 flex-1 truncate text-xs text-fg-subtle">
          <span className="font-medium text-fg-muted" title={categoryLabel(item.category)}>
            {categoryShortLabel(item.category)}
          </span>
          <span aria-hidden="true"> · </span>
          <span>{sourceLabel(item.source)}</span>
          <span aria-hidden="true"> · </span>
          <time dateTime={item.published_at} suppressHydrationWarning>
            {getRelativeTime(item.published_at, now)}
          </time>
        </div>
        <IconButton
          label="보관하기"
          title={isBookmarked ? '보관됨' : '보관하기'}
          pressed={isBookmarked}
          size="sm"
          icon={<Bookmark className={isBookmarked ? 'fill-current text-warning' : undefined} />}
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark(item, e);
          }}
        />
      </div>

      {/* ② 제목: 2줄 높이 고정. 버튼도 같은 높이(48px)라 한 줄 제목에서도 터치 영역이 44px 이상이다 (ui-audit R6). */}
      <h3 className="line-clamp-2 min-h-12 text-base leading-6 font-semibold text-fg">
        <button
          type="button"
          className="line-clamp-2 min-h-12 w-full cursor-pointer rounded text-left break-keep [overflow-wrap:anywhere] transition-colors duration-150 ease-standard hover:text-accent"
        >
          {item.title}
        </button>
      </h3>

      {/* ③ 본문: 2줄 높이 고정. 시사점(반복이면 요약), 요약, 둘 다 없으면 빈 자리 */}
      {showInsight ? (
        <p className="line-clamp-2 min-h-12 border-l-2 border-accent pl-3 text-sm leading-6 text-fg-muted">
          <span className="mr-1 font-semibold text-fg">시사점</span>
          <span>{item.why_it_matters}</span>
        </p>
      ) : item.summary ? (
        <p className="line-clamp-2 min-h-12 text-sm leading-6 text-fg-muted">{item.summary}</p>
      ) : (
        <p aria-hidden="true" className="min-h-12" />
      )}

      {/* ④ 배지 줄 (있을 때만): Must-Read 1(줄지 않음) + 기술 스택 최대 3(48px~128px 사이로 줄고 말줄임), 한 줄.
          overflow-hidden 은 안전장치다. */}
      {hasBadges ? (
        <div data-card-badges="" className="flex flex-nowrap items-center gap-1.5 overflow-hidden">
          {item.is_high_signal ? (
            <Badge tone="warning" icon={<Star className="fill-current" />}>
              Must-Read
            </Badge>
          ) : null}
          {techStack.map((tech, idx) => (
            <Badge key={`${tech}-${idx}`} shrink className="min-w-12 max-w-32" title={tech}>
              <span className="min-w-0 truncate">{tech}</span>
            </Badge>
          ))}
        </div>
      ) : null}

      {/* ⑤ 바닥: 원천 지표(스타·포인트·추천)·개수(포크·댓글)·인기, 챗 분석, 원문.
          좁으면 버튼 묶음이 다음 줄 오른쪽으로 내려가고 글자는 모든 폭에서 보인다 (R48). */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t border-border pt-2 text-xs text-fg-subtle">
        <div className="flex items-center gap-3">
          {scoreKind && item.raw_score > 0 ? (
            <span
              data-card-stat="score"
              data-metric={scoreKind}
              title={`${sourceLabel(item.source)} ${SCORE_METRIC_LABELS[scoreKind]}`}
              className="flex items-center gap-1"
            >
              <ScoreIcon aria-hidden="true" className="size-3.5" />
              <span className="sr-only">{SCORE_METRIC_LABELS[scoreKind]}</span>
              <span className="tabular-nums">{item.raw_score.toLocaleString()}</span>
            </span>
          ) : null}
          {item.comments_count > 0 ? (
            <span
              data-card-stat="count"
              data-metric={countKind}
              title={countKind === 'forks' ? `${sourceLabel(item.source)} ${countLabel}` : countLabel}
              className="flex items-center gap-1"
            >
              <CountIcon aria-hidden="true" className="size-3.5" />
              <span className="sr-only">{countLabel}</span>
              <span className="tabular-nums">{item.comments_count}</span>
            </span>
          ) : null}
          {showHot ? (
            <span data-card-stat="hotness" className="flex items-center gap-1">
              <Flame aria-hidden="true" className="size-3.5 text-warning" />
              <span className="sr-only">인기 점수</span>
              <span className="tabular-nums">{Math.round(item.hotness_score)}</span>
            </span>
          ) : null}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <HandoverCtaButton item={item} variant="card-compact" />
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex h-11 items-center gap-1 rounded-lg px-2 text-xs font-medium text-fg-muted transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-accent md:h-8"
          >
            <span>원문</span>
            <span className="sr-only">(새 탭)</span>
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </a>
        </div>
      </div>
    </Card>
  );
}
