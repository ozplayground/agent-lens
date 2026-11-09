'use client';

import React, { useState } from 'react';
import { Check, RotateCcw, Sparkles } from 'lucide-react';
import {
  FocusFilters,
  ChatFocusCategory,
  ChatFocusTimeRange,
  ChatFocusSort,
  DEFAULT_FOCUS_FILTERS,
} from '@/types/chat';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Chip, ChipGroup } from '@/components/ui/Chip';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { ALL_CATEGORY_LABEL, categoryLabel } from '@/lib/labels';

export interface FocusBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FocusFilters;
  onApplyFilters: (nextFilters: FocusFilters) => void;
  onResetFilters: () => void;
  targetCount?: number;
  totalCount?: number;
}

// 카테고리 칩 라벨은 피드 필터 칩과 같은 긴 라벨 (labels.ts, R40).
const CATEGORIES: { id: ChatFocusCategory; label: string }[] = [
  { id: 'all', label: ALL_CATEGORY_LABEL },
  ...(['harness', 'mcp_plugins_skills', 'agent_tech', 'ai_news'] as const).map((id) => ({
    id,
    label: categoryLabel(id),
  })),
];

const TIME_RANGES: { id: ChatFocusTimeRange; label: string }[] = [
  { id: 'all', label: '전체 기간' },
  { id: '24h', label: '24시간' },
  { id: '7d', label: '최근 7일' },
  { id: '30d', label: '최근 30일' },
];

const SORTS: { id: ChatFocusSort; label: string }[] = [
  { id: 'hot', label: '화제순' },
  { id: 'latest', label: '최신순' },
  { id: 'quality', label: '품질순' },
];

const SECTION_TITLE_CLASSES = 'mb-2 text-sm font-medium text-fg';

/**
 * 포커스 필터. 768px 미만은 바텀시트(아래로 100px 끌면 닫힘), 이상은 가운데 작은 대화상자.
 * Escape·배경막·`필터 닫기` 로 닫는다 (오버레이 스택).
 */
export default function FocusBottomSheet({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
  targetCount,
}: FocusBottomSheetProps) {
  const [draftFilters, setDraftFilters] = useState<FocusFilters>(filters);
  const [prevFilters, setPrevFilters] = useState<FocusFilters>(filters);

  // Sync draft filters when props change during render
  if (prevFilters !== filters) {
    setPrevFilters(filters);
    setDraftFilters(filters);
  }

  const handleReset = () => {
    setDraftFilters(DEFAULT_FOCUS_FILTERS);
    onResetFilters();
  };

  const handleApply = () => {
    onApplyFilters(draftFilters);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title="수집 소식 타깃팅 포커스 필터"
      description="RAG 지식 검색 대상 소식을 고릅니다."
      size="sm"
      mobile="sheet"
      closeLabel="필터 닫기"
      backdropTestId="bottom-sheet-backdrop"
      footer={
        <>
          <Button variant="ghost" onClick={handleReset} leadingIcon={<RotateCcw />}>
            초기화
          </Button>
          <Button variant="primary" onClick={handleApply} leadingIcon={<Check />}>
            적용하기
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <section>
          <h3 className={SECTION_TITLE_CLASSES}>도메인 카테고리</h3>
          <ChipGroup label="도메인 카테고리">
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat.id}
                selected={draftFilters.category === cat.id}
                onClick={() => setDraftFilters((prev) => ({ ...prev, category: cat.id }))}
              >
                {cat.label}
              </Chip>
            ))}
          </ChipGroup>
        </section>

        <section>
          <h3 className={SECTION_TITLE_CLASSES}>수집 기간</h3>
          <ChipGroup label="수집 기간">
            {TIME_RANGES.map((tr) => (
              <Chip
                key={tr.id}
                selected={draftFilters.timeRange === tr.id}
                onClick={() => setDraftFilters((prev) => ({ ...prev, timeRange: tr.id }))}
              >
                {tr.label}
              </Chip>
            ))}
          </ChipGroup>
        </section>

        <section>
          <h3 className={SECTION_TITLE_CLASSES}>정렬 기준</h3>
          <ChipGroup label="정렬 기준">
            {SORTS.map((s) => (
              <Chip
                key={s.id}
                selected={draftFilters.sort === s.id}
                onClick={() => setDraftFilters((prev) => ({ ...prev, sort: s.id }))}
              >
                {s.label}
              </Chip>
            ))}
          </ChipGroup>
        </section>

        <section>
          <h3 className={SECTION_TITLE_CLASSES}>신호 품질 필터</h3>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-muted py-1 pr-1 pl-3">
            <span className="text-sm text-fg">Must-Read 고신호만 (품질 7.8+)</span>
            <Switch
              label="Must-Read 고신호 전용 토글"
              hideLabel
              checked={draftFilters.highSignalOnly}
              onChange={(checked) => setDraftFilters((prev) => ({ ...prev, highSignalOnly: checked }))}
            />
          </div>
        </section>

        {/* Real-time Matching Count Badge or 0-count Alert (Only rendered when targetCount is provided) */}
        {targetCount !== undefined &&
          (targetCount === 0 ? (
            <InlineAlert tone="warning">
              선택 조건의 소식이 없습니다. 기간을 [최근 30일] 또는 [전체 기간]으로 넓혀보세요.
            </InlineAlert>
          ) : (
            <Badge tone="accent" icon={<Sparkles />}>
              약 {targetCount}건 매칭 소식
            </Badge>
          ))}
      </div>
    </Dialog>
  );
}
