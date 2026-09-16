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
      <div className="bg-white border border-slate-200 rounded-lg p-3 animate-pulse shadow-xs">
        <div className="h-4 bg-slate-100 rounded w-1/4" />
      </div>
    );
  }

  if (!data || data.tags.length === 0) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Harness & Benchmark':
        return <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />;
      case 'Protocols & Tooling':
        return <Box className="w-3.5 h-3.5 text-slate-500" />;
      case 'Models & Reasoning':
        return <Cpu className="w-3.5 h-3.5 text-slate-500" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs transition-colors">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-xs sm:text-sm text-slate-900">
              에이전트 Tech Radar
            </h3>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              {data.total_analyzed}개 아티클 분석
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Inline quick preview of top 3 surging tags when collapsed */}
          {!isOpen && data.surging_tags.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5 text-xs">
              <span className="text-[11px] text-slate-500">급상승:</span>
              {data.surging_tags.slice(0, 3).map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => onSelectTag(activeTag === tag.name ? '' : tag.name)}
                  className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    activeTag === tag.name
                      ? 'bg-blue-100 text-blue-700 border-blue-300 font-semibold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 text-xs cursor-pointer"
          >
            <span>{isOpen ? '접기' : '자세히'}</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 text-xs">
          {/* Surging Highlights */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-600 mb-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-orange-600" />
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
                        ? 'bg-blue-100 text-blue-700 border-blue-300 font-semibold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{tag.name}</span>
                    <span className="text-[10px] text-orange-600 font-bold">{tag.velocity}</span>
                    <span className="text-[10px] text-slate-400">({tag.count})</span>
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
                className="bg-slate-50 border border-slate-200 rounded-md p-2 flex items-center justify-between"
              >
                <div className="flex items-center gap-1.5 truncate">
                  {getCategoryIcon(cat.name)}
                  <span className="text-slate-600 text-[11px] truncate">{cat.name}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-900 font-semibold pl-1">
                  {cat.percentage}%
                </span>
              </div>
            ))}
          </div>

          {/* All Tags Cloud */}
          <div>
            <div className="text-[11px] text-slate-600 mb-1.5 font-mono">
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
                        ? 'bg-blue-100 text-blue-700 border-blue-300 font-semibold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200'
                    }`}
                  >
                    <span>{tag.name}</span>
                    <span className="text-[10px] text-slate-400 ml-1">({tag.count})</span>
                  </button>
                );
              })}
              {activeTag && (
                <button
                  onClick={() => onSelectTag('')}
                  className="px-2 py-0.5 rounded text-[11px] border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 font-mono cursor-pointer"
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
