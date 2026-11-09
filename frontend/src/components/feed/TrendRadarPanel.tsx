'use client';

import React from 'react';
import { Box, Cpu, Layers, ShieldCheck, TrendingUp, X } from 'lucide-react';
import type { TechRadarData } from '@/types/trends';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { radarCategoryLabel } from '@/lib/labels';

export interface TrendRadarPanelProps {
  id?: string;
  data: TechRadarData;
  activeTag: string | null;
  /** 태그를 고르면 그 태그로 검색한다. 같은 태그를 다시 고르거나 초기화하면 빈 문자열. */
  onSelectTag: (tag: string) => void;
}

function CategoryIcon({ name }: { name: string }) {
  switch (name) {
    case 'Harness & Benchmark':
      return <ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-fg-subtle" />;
    case 'Protocols & Tooling':
      return <Box aria-hidden="true" className="size-4 shrink-0 text-fg-subtle" />;
    case 'Models & Reasoning':
      return <Cpu aria-hidden="true" className="size-4 shrink-0 text-fg-subtle" />;
    default:
      return <Layers aria-hidden="true" className="size-4 shrink-0 text-fg-subtle" />;
  }
}

/**
 * 트렌드 레이더 펼침 패널 (옛 `TechRadar` 의 펼친 내용, NEWS-14 동작 그대로).
 * 급상승 태그, 카테고리 분포, 전체 태그 구름, 선택 태그 초기화.
 */
export default function TrendRadarPanel({ id, data, activeTag, onSelectTag }: TrendRadarPanelProps) {
  const toggle = (name: string) => onSelectTag(activeTag === name ? '' : name);

  return (
    <section
      id={id}
      aria-label="트렌드 레이더"
      className="space-y-4 rounded-xl border border-border bg-surface p-4 text-sm shadow-card md:p-5"
    >
      <p className="text-xs text-fg-subtle">{data.total_analyzed}개 아티클 분석</p>

      {data.surging_tags.length > 0 ? (
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-fg">
            <TrendingUp aria-hidden="true" className="size-4 text-warning" />
            최근 24시간 급상승 기술 스택
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.surging_tags.slice(0, 6).map((tag) => (
              <Chip key={tag.name} selected={activeTag === tag.name} onClick={() => toggle(tag.name)} count={tag.count}>
                <span>{tag.name}</span>
                <span className="text-xs font-semibold text-warning">{tag.velocity}</span>
              </Chip>
            ))}
          </div>
        </div>
      ) : null}

      {data.categories.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-fg">카테고리 분포</h3>
          {/* 360~767 은 한 열 (두 열이면 칸이 약 144px 이라 이름이 잘린다). 잘려도 title 로 전체 이름을 둔다. */}
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {data.categories.map((cat) => (
              <li
                key={cat.name}
                className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-surface-muted px-3 py-2"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <CategoryIcon name={cat.name} />
                  <span title={radarCategoryLabel(cat.name)} className="truncate text-xs text-fg-muted">
                    {radarCategoryLabel(cat.name)}
                  </span>
                </span>
                <span className="text-xs font-semibold text-fg tabular-nums">{cat.percentage}%</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <h3 className="mb-2 text-sm font-semibold text-fg">전체 기술 태그 (누르면 검색)</h3>
        <div className="flex flex-wrap gap-2">
          {data.tags.map((tag) => (
            <Chip key={tag.name} selected={activeTag === tag.name} onClick={() => toggle(tag.name)} count={tag.count}>
              {tag.name}
            </Chip>
          ))}
          {activeTag ? (
            <Button variant="ghost" size="sm" leadingIcon={<X />} onClick={() => onSelectTag('')}>
              필터 초기화
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
