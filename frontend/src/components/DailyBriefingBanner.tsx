'use client';

import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { DailyBriefing } from '@/types/news';

interface DailyBriefingBannerProps {
  briefing: DailyBriefing | null;
  onOpen: () => void;
}

export default function DailyBriefingBanner({ briefing, onOpen }: DailyBriefingBannerProps) {
  if (!briefing) return null;

  return (
    <div
      onClick={onOpen}
      className="group rounded-md bg-[#161b22] border border-[#30363d] hover:border-[#8b949e]/60 p-3.5 transition-colors cursor-pointer"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#58a6ff] shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-medium text-[#8b949e]">
                Daily Briefing
              </span>
              <span className="text-[11px] font-mono text-[#8b949e] border-l border-[#30363d] pl-2">
                {briefing.date}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-[#f0f6fc] group-hover:text-[#58a6ff] transition-colors mt-0.5 line-clamp-1">
              {briefing.headline}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-[#58a6ff] font-medium shrink-0 self-end sm:self-auto group-hover:underline">
          <span>AI 1분 요약 브리핑</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
