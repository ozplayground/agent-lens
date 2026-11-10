'use client';

import React, { useState, useRef, useCallback, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { ModelTier, ChatModelSelectorProps } from '@/types/chat';
import { cn } from '@/lib/cn';
import { Popover } from '@/components/ui/Popover';
import { RELATIVE_COST_LABEL, TIER_META, TierIcon } from './ModelTierBadge';

const TIERS: ModelTier[] = ['haiku', 'sonnet', 'opus'];

// 입력창 좌하단 칩 하나만 쓴다 (헤더 변형은 D-37 로 지웠다). 팝오버는 입력창 위로 연다.
const TRIGGER_CLASSES = 'h-11 px-2.5 text-xs font-medium md:h-8';

export default function ChatModelSelector({
  selectedTier,
  onSelectTier,
  isStreaming,
  forceOpen = false,
  className = '',
}: ChatModelSelectorProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = forceOpen || internalOpen;
  const popoverId = useId();

  const triggerRef = useRef<HTMLButtonElement>(null);
  const radioRefs = useRef<(HTMLDivElement | null)[]>([]);

  const selectedIndex = TIERS.indexOf(selectedTier);
  const [focusedIndex, setFocusedIndex] = useState(selectedIndex >= 0 ? selectedIndex : 1);

  // Sync focused index when selectedTier or popover open changes
  // (렌더 중 이전 값과 비교해 상태를 맞춘다 — effect 안 setState 대신)
  const [syncedOpen, setSyncedOpen] = useState(isOpen);
  const [syncedTier, setSyncedTier] = useState(selectedTier);
  if (syncedOpen !== isOpen || syncedTier !== selectedTier) {
    setSyncedOpen(isOpen);
    setSyncedTier(selectedTier);
    if (isOpen) {
      setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 1);
    }
  }

  const handleToggle = () => {
    if (isStreaming) return;
    setInternalOpen((prev) => !prev);
  };

  const handleSelect = useCallback(
    (tier: ModelTier) => {
      onSelectTier(tier);
      if (!forceOpen) {
        setInternalOpen(false);
        triggerRef.current?.focus();
      }
    },
    [onSelectTier, forceOpen]
  );

  // 팝오버(radiogroup) 안에서 난 키 입력만 다룬다. Popover 는 onKeyDown 을 받지 않으므로 감싼 요소에서 받는다.
  const handleRadiogroupKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (!target.closest('[role="radiogroup"]')) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (focusedIndex + 1) % TIERS.length;
      setFocusedIndex(next);
      radioRefs.current[next]?.focus();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = (focusedIndex - 1 + TIERS.length) % TIERS.length;
      setFocusedIndex(next);
      radioRefs.current[next]?.focus();
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      const next = e.key === 'Home' ? 0 : TIERS.length - 1;
      setFocusedIndex(next);
      radioRefs.current[next]?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(TIERS[focusedIndex]);
    }
  };

  const currentMeta = TIER_META[selectedTier] || TIER_META.sonnet;

  const streamingTooltip = '답변 생성 중에는 모델을 변경할 수 없습니다';
  const triggerLabel = `Claude 모델 선택: ${currentMeta.name}`;

  return (
    <div className={cn('relative inline-block', className)} onKeyDown={handleRadiogroupKeyDown}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        disabled={isStreaming}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={isOpen ? popoverId : undefined}
        aria-label={triggerLabel}
        title={isStreaming ? streamingTooltip : `${currentMeta.name} · ${RELATIVE_COST_LABEL} ${currentMeta.cost}`}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface text-fg transition-colors duration-150 ease-standard select-none hover:border-border-strong hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50',
          TRIGGER_CLASSES
        )}
      >
        <TierIcon tier={TIER_META[selectedTier] ? selectedTier : 'sonnet'} />
        <span className="font-semibold text-fg">{currentMeta.name}</span>
        {selectedTier === 'sonnet' && (
          <span className="hidden rounded bg-accent-soft px-1 text-xs font-semibold text-accent-soft-fg sm:inline">
            추천
          </span>
        )}
        <ChevronDown
          className={cn('size-3.5 text-fg-subtle transition-transform', isOpen && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      <Popover
        open={isOpen}
        onClose={() => setInternalOpen(false)}
        anchorRef={triggerRef}
        label="Claude AI 모델 선택"
        role="radiogroup"
        focusOnOpen={!forceOpen}
        side="top"
        align="start"
        id={popoverId}
        className="w-80 p-2"
      >
        <div className="space-y-1">
          {TIERS.map((tier, idx) => {
            const meta = TIER_META[tier];
            const isSelected = selectedTier === tier;
            const isFocused = focusedIndex === idx;

            return (
              <div
                key={tier}
                ref={(el) => {
                  radioRefs.current[idx] = el;
                }}
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => handleSelect(tier)}
                onFocus={() => setFocusedIndex(idx)}
                className={cn(
                  'flex min-h-11 cursor-pointer items-start justify-between gap-2 rounded-lg border p-2.5 transition-colors duration-150 ease-standard',
                  isSelected
                    ? 'border-transparent bg-accent-soft text-fg'
                    : isFocused
                      ? 'border-border-strong bg-surface-muted text-fg'
                      : 'border-transparent text-fg hover:bg-surface-muted'
                )}
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <TierIcon tier={tier} className="mt-0.5 size-4" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-semibold text-fg">{meta.name}</span>
                      {tier === 'sonnet' && (
                        <span className="rounded bg-accent-solid px-1 text-xs font-medium text-on-accent">추천</span>
                      )}
                      {/* 비용은 측정값이 아닌 상대 순서라 '상대 비용' 으로 읽히게 하고, 근거 없던 지연 수치는 지웠다 (FE-25) */}
                      <span className="rounded bg-surface-muted px-1 text-xs font-semibold text-fg-muted">
                        <span className="sr-only">{RELATIVE_COST_LABEL} </span>
                        {meta.cost}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-fg-muted">{meta.description}</p>
                  </div>
                </div>

                {isSelected && <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />}
              </div>
            );
          })}
        </div>
      </Popover>
    </div>
  );
}
