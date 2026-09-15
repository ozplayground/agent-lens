'use client';

import React from 'react';
import { Globe, GitBranch, Terminal, BookOpen, MessageSquare, Newspaper, Cpu, Flag, Bookmark, Star } from 'lucide-react';

interface SourceFilterProps {
  currentSource: string;
  onSelectSource: (source: string) => void;
  sourceCounts?: Record<string, number>;
  bookmarkCount?: number;
  highSignalOnly?: boolean;
  onToggleHighSignal?: () => void;
}

const SOURCES = [
  { id: 'all', label: '전체', icon: Globe },
  { id: 'rss_kr', label: '국내 테크', icon: Flag },
  { id: 'github', label: 'GitHub', icon: GitBranch },
  { id: 'hackernews', label: 'HackerNews', icon: Terminal },
  { id: 'arxiv', label: 'arXiv', icon: BookOpen },
  { id: 'huggingface', label: 'HuggingFace', icon: Cpu },
  { id: 'reddit', label: 'Reddit', icon: MessageSquare },
  { id: 'rss', label: 'Global Blogs', icon: Newspaper },
  { id: 'bookmarks', label: '북마크', icon: Bookmark },
];

export default function SourceFilter({
  currentSource,
  onSelectSource,
  sourceCounts = {},
  bookmarkCount = 0,
  highSignalOnly = false,
  onToggleHighSignal
}: SourceFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
      {/* Source pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {SOURCES.filter((s) => {
          if (s.id === 'all' || s.id === 'bookmarks') return true;
          return (sourceCounts[s.id] ?? 0) > 0;
        }).map((s) => {
          const isSel = currentSource === s.id;
          const Icon = s.icon;
          let count = 0;
          if (s.id === 'all') {
            count = Object.values(sourceCounts).reduce((a, b) => a + b, 0);
          } else if (s.id === 'bookmarks') {
            count = bookmarkCount;
          } else {
            count = sourceCounts[s.id] ?? 0;
          }

          return (
            <button
              key={s.id}
              onClick={() => onSelectSource(s.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer whitespace-nowrap ${
                isSel
                  ? 'bg-slate-900 text-white font-medium shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSel ? 'text-white' : 'text-slate-400'}`} />
              <span>{s.label}</span>
              {count > 0 && <span className={`text-[10px] font-mono ${isSel ? 'text-slate-300' : 'text-slate-400'}`}>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* High Signal Toggle */}
      {onToggleHighSignal && (
        <button
          onClick={onToggleHighSignal}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs whitespace-nowrap transition-colors cursor-pointer shrink-0 border ${
            highSignalOnly
              ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200 shadow-xs'
          }`}
          title="기술 깊이와 실무 가치가 입증된 고품질 소식만 필터링"
        >
          <Star className={`w-3.5 h-3.5 ${highSignalOnly ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
          <span>Must-Read (High Signal)</span>
        </button>
      )}
    </div>
  );
}
