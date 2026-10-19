'use client';

import React from 'react';
import { ModelTier, ModelTierBadgeProps } from '@/types/chat';

export const TIER_META: Record<
  ModelTier,
  {
    name: string;
    icon: string;
    cost: string;
    latencyDesc: string;
    description: string;
    badgeBg: string;
    textColor: string;
    borderColor: string;
  }
> = {
  haiku: {
    name: 'Haiku 5.5',
    icon: '⚡',
    cost: '$',
    latencyDesc: '~0.3s',
    description: '초고속 탐색 & 간결 질의',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  sonnet: {
    name: 'Sonnet 5.5',
    icon: '🎯',
    cost: '$$',
    latencyDesc: '~0.6s',
    description: '심층 분석 & RAG 최적화',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  opus: {
    name: 'Opus 5.5',
    icon: '🧠',
    cost: '$$$',
    latencyDesc: '~1.8s',
    description: '최대 추론 & 복합 아키텍처',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    textColor: 'text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
};

export default function ModelTierBadge({
  tier,
  variant = 'chip',
  latencyMs,
  showCost = false,
  showIcon = true,
  showRecommended = false,
  className = '',
}: ModelTierBadgeProps) {
  const isClaudeTier = (t: string): t is ModelTier => ['haiku', 'sonnet', 'opus'].includes(t);
  const meta = isClaudeTier(tier)
    ? TIER_META[tier]
    : {
        name: tier,
        icon: tier.toLowerCase().includes('gemini') ? '✨' : tier.toLowerCase().includes('gpt') ? '🤖' : '🎯',
        cost: '$$',
        latencyDesc: latencyMs ? `~${(latencyMs / 1000).toFixed(1)}s` : '',
        description: tier,
        badgeBg: tier.toLowerCase().includes('gemini') ? 'bg-amber-50 dark:bg-amber-950/40' : 'bg-slate-50 dark:bg-slate-900',
        textColor: tier.toLowerCase().includes('gemini') ? 'text-amber-700 dark:text-amber-300' : 'text-slate-700 dark:text-slate-300',
        borderColor: tier.toLowerCase().includes('gemini') ? 'border-amber-200 dark:border-amber-800' : 'border-slate-200 dark:border-slate-800',
      };

  const baseClasses =
    'inline-flex items-center gap-1 font-mono transition-colors border select-none';

  let variantClasses = '';
  switch (variant) {
    case 'footer':
      variantClasses = 'text-[11px] px-2 py-0.5 rounded-md';
      break;
    case 'pill':
      variantClasses = 'text-xs px-2.5 py-1 rounded-full';
      break;
    case 'pipeline':
      variantClasses = 'text-[11px] px-2 py-0.5 rounded font-medium';
      break;
    case 'chip':
    default:
      variantClasses = 'text-xs px-2 py-0.5 rounded-md';
      break;
  }

  return (
    <span
      className={`${baseClasses} ${meta.badgeBg} ${meta.textColor} ${meta.borderColor} ${variantClasses} ${className}`}
    >
      {showIcon && <span className="text-xs" aria-hidden="true">{meta.icon}</span>}
      <span className="font-semibold">{meta.name}</span>

      {showCost && (
        <span className="text-[10px] px-1 py-0.2 rounded bg-black/5 dark:bg-white/10 font-bold ml-0.5">
          {meta.cost}
        </span>
      )}

      {showRecommended && tier === 'sonnet' && (
        <span className="text-[10px] px-1 py-0.2 rounded bg-blue-600 text-white font-sans font-medium ml-0.5">
          추천
        </span>
      )}

      {latencyMs !== undefined && latencyMs !== null && (
        <span className="text-[10px] opacity-75 ml-0.5">
          · {latencyMs}ms
        </span>
      )}
    </span>
  );
}
