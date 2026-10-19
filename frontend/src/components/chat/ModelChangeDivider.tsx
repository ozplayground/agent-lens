'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { ModelChangeDividerProps } from '@/types/chat';
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
      className={`relative my-6 flex items-center justify-center select-none ${className}`}
    >
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-dashed border-slate-300 dark:border-slate-700" />
      </div>

      <div className="relative flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 shadow-2xs font-sans">
        <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />

        {prevMeta && (
          <span className="font-medium text-slate-500 dark:text-slate-400">
            {prevMeta.name} ➔{' '}
          </span>
        )}

        <span className="font-semibold text-slate-800 dark:text-slate-200">
          Claude {newMeta.name}로 모델 변경됨
        </span>

        {contextNotice && (
          <>
            <span className="text-slate-400 dark:text-slate-500">·</span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              {contextNotice}
            </span>
          </>
        )}

        {formattedTime && (
          <>
            <span className="text-slate-400 dark:text-slate-500">·</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              {formattedTime}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
