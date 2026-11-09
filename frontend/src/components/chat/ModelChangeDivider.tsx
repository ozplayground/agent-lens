'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { ModelChangeDividerProps } from '@/types/chat';
import { cn } from '@/lib/cn';
import { TIER_META } from './ModelTierBadge';

export default function ModelChangeDivider({
  previousTier,
  newTier,
  timestamp,
  contextNotice,
  className = '',
}: ModelChangeDividerProps) {
  const newMeta = TIER_META[newTier] || TIER_META.sonnet;
  const prevMeta = previousTier ? TIER_META[previousTier] : null;

  const accessibleLabel = prevMeta
    ? `Claude ${prevMeta.name}에서 ${newMeta.name}로 모델 변경됨${contextNotice ? ` (${contextNotice})` : ''}`
    : `Claude ${newMeta.name}로 모델 변경됨${contextNotice ? ` (${contextNotice})` : ''}`;

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div
      role="separator"
      aria-label={accessibleLabel}
      className={cn('relative my-6 flex items-center justify-center select-none', className)}
    >
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-dashed border-border" />
      </div>

      <div className="relative flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-0.5 rounded-full border border-border bg-surface px-3.5 py-1 text-xs text-fg-muted">
        <RefreshCw className="size-3.5 shrink-0 text-accent" aria-hidden="true" />

        {prevMeta && <span className="font-medium text-fg-subtle">{prevMeta.name} ➔ </span>}

        <span className="font-semibold text-fg">Claude {newMeta.name}로 모델 변경됨</span>

        {contextNotice && (
          <>
            <span aria-hidden="true" className="text-fg-subtle">
              ·
            </span>
            <span className="font-medium text-success">{contextNotice}</span>
          </>
        )}

        {formattedTime && (
          <>
            <span aria-hidden="true" className="text-fg-subtle">
              ·
            </span>
            <span className="tabular-nums text-fg-subtle">{formattedTime}</span>
          </>
        )}
      </div>
    </div>
  );
}
