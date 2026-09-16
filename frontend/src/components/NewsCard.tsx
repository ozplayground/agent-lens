'use client';

import React from 'react';
import { ExternalLink, Star, Clock, Bookmark, MessageSquare, ArrowUpRight } from 'lucide-react';
import { NewsItem } from '@/types/news';

interface NewsCardProps {
  item: NewsItem;
  onSelect: (item: NewsItem) => void;
  isBookmarked: boolean;
  onToggleBookmark: (item: NewsItem, e: React.MouseEvent) => void;
}

const CATEGORY_NAMES: Record<string, string> = {
  harness: 'Harness',
  mcp_plugins_skills: 'MCP & Skills',
  agent_tech: 'Agent Tech',
  ai_news: 'AI Frontier'
};

const SOURCE_NAMES: Record<string, string> = {
  rss_kr: '국내 테크',
  github: 'GitHub',
  hackernews: 'HackerNews',
  arxiv: 'arXiv',
  huggingface: 'HuggingFace',
  reddit: 'Reddit',
  rss: 'Blog'
};

export default function NewsCard({ item, onSelect, isBookmarked, onToggleBookmark }: NewsCardProps) {
  const catLabel = CATEGORY_NAMES[item.category] || item.category;
  const sourceName = SOURCE_NAMES[item.source] || item.source;

  // Format relative time (e.g., "3시간 전")
  const getRelativeTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const diff = (Date.now() - d.getTime()) / 1000;
      if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}분 전`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
      return `${Math.floor(diff / 86400)}일 전`;
    } catch {
      return '';
    }
  };

  return (
    <article
      onClick={() => onSelect(item)}
      className="group rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md p-4 transition-all duration-150 flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* Top Metadata & Actions */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Category tag */}
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
              {catLabel}
            </span>

            {/* Source label */}
            <span className="px-1.5 py-0.5 rounded text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-200">
              {sourceName}
            </span>

            {/* ONLY Important: Must-Read High Signal badge */}
            {item.is_high_signal && (
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                Must-Read
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {item.hotness_score > 25 && (
              <span className="text-[11px] font-mono font-semibold text-orange-600">
                Hot {Math.round(item.hotness_score)}
              </span>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(item, e);
              }}
              className={`p-1 rounded transition-colors cursor-pointer ${
                isBookmarked ? 'text-amber-500' : 'text-slate-400 hover:text-slate-700'
              }`}
              title={isBookmarked ? '보관됨' : '보관하기'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-sm sm:text-base font-semibold text-slate-900 group-hover:text-blue-600 leading-snug mb-2 line-clamp-2 transition-colors">
          {item.title}
        </h2>

        {/* Developer Insight Callout */}
        {item.why_it_matters && (
          <div className="my-2.5 p-2 rounded-md bg-blue-50/70 border-l-2 border-blue-500 text-xs text-slate-700 leading-relaxed line-clamp-2">
            <span className="font-semibold text-blue-700 mr-1.5 font-mono">Insight:</span>
            {item.why_it_matters}
          </div>
        )}

        {/* Summary text if no insight or extra detail */}
        {item.summary && !item.why_it_matters && (
          <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
            {item.summary}
          </p>
        )}
      </div>

      <div>
        {/* Extracted Tech Stack */}
        {item.tech_stack && item.tech_stack.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap my-2">
            {item.tech_stack.slice(0, 4).map((tech, idx) => (
              <span
                key={idx}
                className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-100 text-slate-600 border border-slate-200"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            {item.raw_score > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-slate-400" />
                <span className="font-mono text-slate-600">{item.raw_score.toLocaleString()}</span>
              </span>
            )}

            {item.comments_count > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-slate-400" />
                <span className="font-mono text-slate-600">{item.comments_count}</span>
              </span>
            )}

            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <Clock className="w-3 h-3 text-slate-400" />
              <span suppressHydrationWarning>{getRelativeTime(item.published_at)}</span>
            </span>
          </div>

          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[11px] text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors font-medium"
          >
            <span>원문</span>
            <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </article>
  );
}
