'use client';

import React, { useId, useState } from 'react';
import { Activity, ChevronDown, Sparkles } from 'lucide-react';
import type { DailyBriefing } from '@/types/news';
import type { TechRadarData } from '@/types/trends';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { ScrollRow } from '@/components/ui/ScrollRow';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import TrendRadarPanel from './TrendRadarPanel';

export interface InsightsBarProps {
  briefing: DailyBriefing | null;
  onOpenBriefing: () => void;
  radar: TechRadarData | null;
  loadingRadar?: boolean;
  activeTag: string | null;
  onSelectTag: (tag: string) => void;
}

/**
 * 요약 바 (spec 설계 4.1, 14.5): 오늘의 브리핑 버튼 + 트렌드 레이더 펼침 버튼을 48px 한 줄에 둔다.
 * - 브리핑: `오늘의 브리핑 · 날짜 · 헤드라인`. 768 미만은 날짜를 숨기고 한 줄 말줄임.
 * - 급상승 칩은 1024 이상에서만 (가로 스크롤 줄). 768~1023 은 `트렌드` 버튼만.
 * - 스켈레톤은 불러오는 중이고 보여 줄 데이터가 없을 때만. 다시 읽는 동안에는 이전 내용을 그린다.
 * 펼치면 바로 아래에 레이더 패널을 그린다. 브리핑·레이더 둘 다 없으면 그리지 않는다.
 */
export default function InsightsBar({
  briefing,
  onOpenBriefing,
  radar,
  loadingRadar = false,
  activeTag,
  onSelectTag,
}: InsightsBarProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  const hasRadar = Boolean(radar && radar.tags.length > 0);
  const hasData = Boolean(briefing) || hasRadar;

  if (loadingRadar && !hasData) {
    return (
      <div data-insights-bar="">
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    );
  }

  if (!hasData) return null;

  return (
    // flex 열 + gap: 숨긴 패널(`hidden`)은 flex 항목이 아니어서 여백을 만들지 않는다.
    <div data-insights-bar="" className="flex flex-col gap-3">
      <Card padding="none" className="flex h-12 items-center gap-1 px-1">
        {briefing ? (
          <button
            type="button"
            onClick={onOpenBriefing}
            className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-left text-sm transition-colors duration-150 ease-standard hover:bg-surface-muted md:h-10"
          >
            <Sparkles aria-hidden="true" className="size-4 shrink-0 text-accent" />
            <span className="min-w-0 truncate text-fg-subtle">
              <span className="font-semibold text-fg">오늘의 브리핑</span>{' '}
              {/* 접근 이름 계산이 span 앞뒤 공백을 버리므로 공백은 span 밖에 둔다. */}
              <span className="max-md:hidden">· {briefing.date}</span>
              {' · '}
              <span className="text-fg">{briefing.headline}</span>
            </span>
          </button>
        ) : (
          <span className="flex-1" />
        )}

        {hasRadar && radar ? (
          <div className="flex min-w-0 items-center gap-2">
            {radar.surging_tags.length > 0 ? (
              <div className="hidden min-w-0 max-w-md items-center gap-1.5 lg:flex">
                <span className="shrink-0 text-xs text-fg-subtle">급상승</span>
                <ScrollRow role="group" aria-label="급상승 태그" label="급상승 태그" className="flex-1">
                  {radar.surging_tags.slice(0, 3).map((tag) => (
                    <Chip
                      key={tag.name}
                      selected={activeTag === tag.name}
                      onClick={() => onSelectTag(activeTag === tag.name ? '' : tag.name)}
                    >
                      {tag.name}
                    </Chip>
                  ))}
                </ScrollRow>
              </div>
            ) : null}
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-fg-muted transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-fg md:h-10"
            >
              <Activity aria-hidden="true" className="size-4 text-accent" />
              <span>트렌드</span>
              <ChevronDown
                aria-hidden="true"
                className={cn('size-4 transition-transform duration-150 ease-standard', expanded ? 'rotate-180' : null)}
              />
            </button>
          </div>
        ) : null}
      </Card>

      {hasRadar && radar ? (
        <div id={panelId} hidden={!expanded}>
          {expanded ? <TrendRadarPanel data={radar} activeTag={activeTag} onSelectTag={onSelectTag} /> : null}
        </div>
      ) : null}
    </div>
  );
}
