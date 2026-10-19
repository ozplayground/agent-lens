'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, Sparkles } from 'lucide-react';
import { ModelTier, ChatModelSelectorProps } from '@/types/chat';
import { TIER_META } from './ModelTierBadge';

const TIERS: ModelTier[] = ['haiku', 'sonnet', 'opus'];

export default function ChatModelSelector({
  selectedTier,
  onSelectTier,
  isStreaming,
  variant = 'inline-chip',
  forceOpen = false,
  className = '',
}: ChatModelSelectorProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = forceOpen || internalOpen;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const radioRefs = useRef<(HTMLDivElement | null)[]>([]);

  const selectedIndex = TIERS.indexOf(selectedTier);
  const [focusedIndex, setFocusedIndex] = useState(selectedIndex >= 0 ? selectedIndex : 1);

  // Sync focused index when selectedTier or popover open changes
  useEffect(() => {
    if (isOpen) {
      const idx = TIERS.indexOf(selectedTier);
      setFocusedIndex(idx >= 0 ? idx : 1);
    }
  }, [isOpen, selectedTier]);

  // Handle outside clicks to close popover
  useEffect(() => {
    if (!isOpen || forceOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setInternalOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen, forceOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setInternalOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

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

  const handleRadiogroupKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
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
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(TIERS[focusedIndex]);
    }
  };

  const currentMeta = TIER_META[selectedTier] || TIER_META.sonnet;

  const streamingTooltip = '답변 생성 중에는 모델을 변경할 수 없습니다';
  const triggerLabel = `Claude 모델 선택: ${currentMeta.name}`;
  const isHeaderVariant = variant === 'header-chip' || variant === 'header-compact';

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        disabled={isStreaming}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={triggerLabel}
        title={isStreaming ? streamingTooltip : `${currentMeta.name} (${currentMeta.cost})`}
        className={`inline-flex items-center gap-1.5 transition-all cursor-pointer font-sans select-none ${
          variant === 'header-compact'
            ? 'px-2 py-0.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-400'
            : variant === 'header-chip'
            ? 'px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs'
            : 'px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs'
        } ${
          isStreaming
            ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'
            : ''
        }`}
      >
        <span className="text-xs" aria-hidden="true">
          {currentMeta.icon}
        </span>
        <span className="font-semibold text-slate-800 dark:text-slate-100">
          {currentMeta.name}
        </span>
        {selectedTier === 'sonnet' && (
          <span className="text-[10px] px-1 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold hidden sm:inline">
            추천
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          ref={popoverRef}
          role="radiogroup"
          aria-label="Claude AI 모델 선택"
          tabIndex={0}
          onKeyDown={handleRadiogroupKeyDown}
          className={`absolute ${
            isHeaderVariant
              ? 'top-full right-0 mt-2 slide-in-from-top-2'
              : 'bottom-full left-0 mb-2 slide-in-from-bottom-2'
          } w-72 sm:w-80 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 focus:outline-hidden animate-in fade-in duration-150`}
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between px-2.5 py-1.5 pb-2 border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Claude 3-Tier Multi-Model
            </span>
            <span>맥락 100% 보존</span>
          </div>

          {/* Radio Items */}
          <div className="space-y-1 mt-1.5">
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
                  className={`flex items-start justify-between p-2.5 rounded-lg cursor-pointer transition-colors outline-hidden ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 text-blue-950 dark:text-blue-100'
                      : isFocused
                      ? 'bg-slate-100/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="text-base mt-0.5" aria-hidden="true">
                      {meta.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {meta.name}
                        </span>
                        {tier === 'sonnet' && (
                          <span className="text-[10px] px-1 py-0.2 rounded bg-blue-600 text-white font-medium">
                            추천
                          </span>
                        )}
                        <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                          {meta.cost}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                          {meta.latencyDesc}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {meta.description}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <Check
                      className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
