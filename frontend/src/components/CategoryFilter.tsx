'use client';

import React from 'react';
import { CategoryType } from '@/types/news';
import { Compass, ShieldCheck, Cpu, Bot, Sparkles } from 'lucide-react';

interface CategoryFilterProps {
  currentCategory: CategoryType;
  onSelectCategory: (cat: CategoryType) => void;
  counts?: Record<string, number>;
}

const CATEGORIES = [
  { id: 'all' as CategoryType, label: '전체 소식', icon: Compass },
  { id: 'harness' as CategoryType, label: '하네스 & 벤치마크', icon: ShieldCheck },
  { id: 'mcp_plugins_skills' as CategoryType, label: 'MCP & 생태계', icon: Cpu },
  { id: 'agent_tech' as CategoryType, label: '에이전트 아키텍처', icon: Bot },
  { id: 'ai_news' as CategoryType, label: '최신 AI 동향', icon: Sparkles }
];

export default function CategoryFilter({ currentCategory, onSelectCategory, counts = {} }: CategoryFilterProps) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <nav className="flex items-center gap-1 overflow-x-auto border-b border-[#30363d] pb-0 scrollbar-none">
      {CATEGORIES.map((cat) => {
        const isSel = currentCategory === cat.id;
        const Icon = cat.icon;
        const count = cat.id === 'all' ? total : (counts[cat.id] ?? 0);

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-[1px] whitespace-nowrap cursor-pointer ${
              isSel
                ? 'border-[#f78166] text-[#f0f6fc] font-semibold'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9] hover:border-[#8b949e]/30'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isSel ? 'text-[#f0f6fc]' : 'text-[#8b949e]'}`} />
            <span>{cat.label}</span>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                isSel ? 'bg-[#30363d] text-[#f0f6fc] font-semibold' : 'bg-[#21262d] text-[#8b949e]'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
