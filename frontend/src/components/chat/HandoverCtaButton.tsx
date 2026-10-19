'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Sparkles, ArrowRight } from 'lucide-react';
import { NewsItem } from '@/types/news';

export interface HandoverCtaButtonProps {
  item: NewsItem;
  variant?: 'card-compact' | 'modal-banner' | 'modal-icon';
  draftQuestion?: string;
  className?: string;
  onHandoverComplete?: () => void;
}

export default function HandoverCtaButton({
  item,
  variant = 'card-compact',
  draftQuestion,
  className = '',
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
        className={`w-full flex items-center justify-between p-3 rounded-lg bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 text-indigo-900 transition-all cursor-pointer shadow-2xs group ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold">전용 AI 챗으로 이동</div>
            <div className="text-[11px] text-indigo-700">이 기사를 집중 컨텍스트로 심층 질의응답</div>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform shrink-0" />
      </button>
    );
  }

  // default: 'card-compact'
  return (
    <button
      type="button"
      onClick={handleClick}
      title="전용 AI 챗에서 이 기사 집중 분석"
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer ${className}`}
    >
      <Sparkles className="w-3 h-3 text-indigo-600" />
      <span>전용 챗에서 분석</span>
    </button>
  );
}
