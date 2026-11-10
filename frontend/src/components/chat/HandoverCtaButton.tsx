'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Sparkles, ArrowRight } from 'lucide-react';
import { NewsItem } from '@/types/news';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export interface HandoverCtaButtonProps {
  item: NewsItem;
  variant?: 'card-compact' | 'modal-banner';
  draftQuestion?: string;
  className?: string;
  onHandoverComplete?: () => void;
}

export default function HandoverCtaButton({
  item,
  variant = 'card-compact',
  draftQuestion,
  className,
  onHandoverComplete,
}: HandoverCtaButtonProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const queryParam = draftQuestion?.trim()
      ? `&q=${encodeURIComponent(draftQuestion.trim())}`
      : '';
    const targetUrl = `/chat?sourceId=${item.id}${queryParam}`;
    if (onHandoverComplete) onHandoverComplete();
    router.push(targetUrl);
  };

  if (variant === 'modal-banner') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'group flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-accent-soft p-3 text-left text-accent-soft-fg transition-colors duration-150 ease-standard hover:border-border-strong',
          className
        )}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-solid text-on-accent"
          >
            <Bot className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">AI 챗에서 분석</span>
            <span className="block text-xs">이 기사를 단일 기사 모드로 열어 질의응답</span>
          </span>
        </span>
        <ArrowRight
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform duration-150 ease-standard group-hover:translate-x-0.5"
        />
      </button>
    );
  }

  // default: 'card-compact' — 보이는 글자 `AI 챗에서 분석` 이 접근 이름이다. 모든 폭에서 글자를 보인다 (R48).
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      title="AI 챗에서 이 기사를 단일 기사 모드로 분석"
      leadingIcon={<Sparkles className="text-accent" />}
      className={className}
    >
      <span>AI 챗에서 분석</span>
    </Button>
  );
}
