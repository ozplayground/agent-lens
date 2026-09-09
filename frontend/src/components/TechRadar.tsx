'use client';

import React, { useState } from 'react';
import { TechRadarData } from '@/types/trends';
import { Activity, ChevronDown, ChevronUp, Box, Cpu, ShieldCheck, Layers, TrendingUp } from 'lucide-react';

interface TechRadarProps {
  data: TechRadarData | null;
  activeTag: string | null;
  onSelectTag: (tag: string) => void;
  isLoading?: boolean;
}

export const TechRadar: React.FC<TechRadarProps> = ({
  data,
  activeTag,
  onSelectTag,
  isLoading
}) => {
  const [isOpen, setIsOpen] = useState(false); // Collapsed by default to keep page clean & high-density

  if (isLoading) {
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-md p-3 animate-pulse">
        <div className="h-4 bg-[#21262d] rounded w-1/4" />
      </div>
    );
  }

  if (!data || data.tags.length === 0) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Harness & Benchmark':
        return <ShieldCheck className="w-3.5 h-3.5 text-[#8b949e]" />;
      case 'Protocols & Tooling':
        return <Box className="w-3.5 h-3.5 text-[#8b949e]" />;
      case 'Models & Reasoning':
        return <Cpu className="w-3.5 h-3.5 text-[#8b949e]" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-[#8b949e]" />;
    }
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-md p-3.5 transition-colors">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#8b949e]">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-xs sm:text-sm text-[#f0f6fc]">
              에이전트 Tech Radar
            </h3>
            <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">
              {data.total_analyzed}개 아티클 분석
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Inline quick preview of top 3 surging tags when collapsed */}
          {!isOpen && data.surging_tags.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5 text-xs">
              <span className="text-[11px] text-[#8b949e]">급상승:</span>
              {data.surging_tags.slice(0, 3).map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => onSelectTag(activeTag === tag.name ? '' : tag.name)}
                  className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                    activeTag === tag.name
                      ? 'bg-[#388bfd]/20 text-[#58a6ff] border-[#388bfd]/40'
                      : 'bg-[#21262d] text-[#c9d1d9] border-[#30363d] hover:border-[#8b949e]'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-2 py-1 rounded bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] transition-colors flex items-center gap-1 text-xs cursor-pointer"
          >
            <span>{isOpen ? '접기' : '자세히'}</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-[#30363d] space-y-3 text-xs">
          {/* Surging Highlights */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8b949e] mb-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#f0883e]" />
              <span>최근 24시간 급상승 (Surging) 기술 스택:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.surging_tags.map((tag) => {
                const isSelected = activeTag === tag.name;
                return (
                  <button
                    key={tag.name}
                    onClick={() => onSelectTag(isSelected ? '' : tag.name)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#388bfd]/20 text-[#58a6ff] border-[#388bfd]/50 font-semibold'
                        : 'bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border-[#30363d]'
                    }`}
                  >
                    <span>{tag.name}</span>
                    <span className="text-[10px] text-[#f0883e] font-bold">{tag.velocity}</span>
                    <span className="text-[10px] text-[#8b949e]">({tag.count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {data.categories.map((cat) => (
              <div
                key={cat.name}
                className="bg-[#0d1117] border border-[#30363d] rounded p-2 flex items-center justify-between"
              >
                <div className="flex items-center gap-1.5 truncate">
                  {getCategoryIcon(cat.name)}
                  <span className="text-[#8b949e] text-[11px] truncate">{cat.name}</span>
                </div>
                <span className="text-[11px] font-mono text-[#f0f6fc] font-semibold pl-1">
                  {cat.percentage}%
                </span>
              </div>
            ))}
          </div>

          {/* All Tags Cloud */}
          <div>
            <div className="text-[11px] text-[#8b949e] mb-1.5 font-mono">
              전체 기술 태그 (클릭 시 검색):
            </div>
            <div className="flex flex-wrap gap-1">
              {data.tags.map((tag) => {
                const isSelected = activeTag === tag.name;
                return (
                  <button
                    key={tag.name}
                    onClick={() => onSelectTag(isSelected ? '' : tag.name)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#388bfd]/20 text-[#58a6ff] border-[#388bfd]/50'
                        : 'bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] border-[#30363d]'
                    }`}
                  >
                    <span>{tag.name}</span>
                    <span className="text-[10px] text-[#8b949e] ml-1">({tag.count})</span>
                  </button>
                );
              })}
              {activeTag && (
                <button
                  onClick={() => onSelectTag('')}
                  className="px-2 py-0.5 rounded text-[11px] border border-[#da3633]/40 bg-[#da3633]/10 text-[#f85149] hover:bg-[#da3633]/20 font-mono cursor-pointer"
                >
                  ✕ 필터 초기화
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
