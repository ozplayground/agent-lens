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
      className="group rounded-lg bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white border border-blue-200/80 hover:border-blue-400 p-4 transition-all shadow-xs cursor-pointer"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-semibold text-blue-700">
                오늘의 AI 브리핑
              </span>
              <span className="text-[11px] font-mono text-slate-500 border-l border-slate-200 pl-2">
                {briefing.date}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors mt-0.5 line-clamp-1">
              {briefing.headline}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold shrink-0 self-end sm:self-auto group-hover:translate-x-0.5 transition-transform">
          <span>브리핑 보기</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
