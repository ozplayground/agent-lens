'use client';

import React from 'react';
import { Bot, Brain, Sparkles, Target, Zap, type LucideIcon } from 'lucide-react';
import { ModelTier, ModelTierBadgeProps } from '@/types/chat';
import { cn } from '@/lib/cn';

export const TIER_META: Record<
  ModelTier,
  {
    name: string;
    icon: LucideIcon;
    /** 상대 비용 기호. 측정값이 아니라 같은 세대 Haiku < Sonnet < Opus 의 상대 순서만 뜻한다 (FE-25). */
    cost: string;
    description: string;
    badgeBg: string;
    textColor: string;
    borderColor: string;
  }
> = {
  haiku: {
    name: 'Haiku 5.5',
    icon: Zap,
    cost: '$',
    description: '초고속 탐색 & 간결 질의',
    badgeBg: 'bg-success-soft',
    textColor: 'text-success',
    borderColor: 'border-transparent',
  },
  sonnet: {
    name: 'Sonnet 5.5',
    icon: Target,
    cost: '$$',
    description: '심층 분석 & RAG 최적화',
    badgeBg: 'bg-accent-soft',
    textColor: 'text-accent-soft-fg',
    borderColor: 'border-transparent',
  },
  opus: {
    name: 'Opus 5.5',
    icon: Brain,
    cost: '$$$',
    description: '최대 추론 & 복합 아키텍처',
    badgeBg: 'bg-surface-muted',
    textColor: 'text-fg',
    borderColor: 'border-border',
  },
};

/** Claude 가 아닌 티어 이름의 아이콘 종류: gemini `Sparkles`, gpt `Bot`, 그 밖 `Target`. */
type OtherTierKind = 'gemini' | 'gpt' | 'other';

const OTHER_TIER_ICONS: Record<OtherTierKind, LucideIcon> = {
  gemini: Sparkles,
  gpt: Bot,
  other: Target,
};

function otherTierKind(tier: string): OtherTierKind {
  const lowered = tier.toLowerCase();
  if (lowered.includes('gemini')) return 'gemini';
  if (lowered.includes('gpt')) return 'gpt';
  return 'other';
}

function isClaudeTier(tier: string): tier is ModelTier {
  return Object.prototype.hasOwnProperty.call(TIER_META, tier);
}

/** 티어 아이콘 (lucide). 배지·모델 선택 트리거·목록이 함께 쓴다. 장식이라 `aria-hidden`. */
export function TierIcon({ tier, className }: { tier: string; className?: string }) {
  const Icon = isClaudeTier(tier) ? TIER_META[tier].icon : OTHER_TIER_ICONS[otherTierKind(tier)];
  return <Icon aria-hidden="true" data-tier-icon={tier} className={cn('size-3.5 shrink-0', className)} />;
}

/** 상대 비용 칩의 읽기 문구 접두 (화면에서는 sr-only). */
export const RELATIVE_COST_LABEL = '상대 비용';

export default function ModelTierBadge({
  tier,
  latencyMs,
  showCost = false,
  showIcon = true,
  showRecommended = false,
  className = '',
}: ModelTierBadgeProps) {
  const lowered = tier.toLowerCase();
  const meta = isClaudeTier(tier)
    ? TIER_META[tier]
    : {
        name: tier,
        // Claude 가 아닌 모델은 비교할 근거가 없어 비용을 보이지 않는다 (FE-25)
        cost: '',
        description: tier,
        badgeBg: lowered.includes('gemini') ? 'bg-warning-soft' : 'bg-surface-muted',
        textColor: lowered.includes('gemini') ? 'text-warning' : 'text-fg-muted',
        borderColor: lowered.includes('gemini') ? 'border-transparent' : 'border-border',
      };

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 border text-xs font-medium whitespace-nowrap select-none',
        meta.badgeBg,
        meta.textColor,
        meta.borderColor,
        'h-6 rounded-md px-2',
        className
      )}
    >
      {showIcon && <TierIcon tier={tier} />}
      <span className="font-semibold">{meta.name}</span>

      {showCost && meta.cost && (
        <span className="ml-0.5 rounded bg-surface px-1 text-xs font-semibold">
          <span className="sr-only">{RELATIVE_COST_LABEL} </span>
          {meta.cost}
        </span>
      )}

      {showRecommended && tier === 'sonnet' && (
        <span className="ml-0.5 rounded bg-accent-solid px-1 text-xs font-medium text-on-accent">추천</span>
      )}

      {latencyMs !== undefined && latencyMs !== null && (
        <span className="ml-0.5 tabular-nums opacity-80">· {latencyMs}ms</span>
      )}
    </span>
  );
}
