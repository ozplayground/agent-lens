'use client';

import React, { useState } from 'react';
import { X, ExternalLink, Sparkles, Send, Loader2, Bot, Star, ArrowUpRight } from 'lucide-react';
import { NewsItem } from '@/types/news';
import { askQuestionAboutNews } from '@/lib/api';

interface NewsDetailModalProps {
  item: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (item: NewsItem) => void;
}

export default function NewsDetailModal({
  item,
  isOpen,
  onClose,
  isBookmarked,
  onToggleBookmark
}: NewsDetailModalProps) {
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ q: string; a: string }[]>([]);

  if (!isOpen || !item) return null;

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || asking) return;

    const userQ = question.trim();
    setQuestion('');
    setAsking(true);

    try {
      const res = await askQuestionAboutNews(item.id, userQ);
      setChatHistory((prev) => [...prev, { q: userQ, a: res.answer }]);
    } catch (err: any) {
      setChatHistory((prev) => [...prev, { q: userQ, a: 'AI 응답을 생성하지 못했습니다. 잠시 후 다시 시도해주세요.' }]);
    } finally {
      setAsking(false);
    }
  };

  const bullets = item.tldr_bullets && item.tldr_bullets.length > 0 ? item.tldr_bullets : [item.summary];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl relative text-[#c9d1d9] overflow-hidden">
        {/* Top bar */}
        <div className="p-4 border-b border-[#30363d] flex items-start justify-between gap-3 bg-[#161b22] shrink-0">
          <div className="space-y-1.5 flex-1 pr-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#21262d] text-[#c9d1d9] border border-[#30363d] uppercase">
                {item.category.replace('_', ' ')}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono text-[#8b949e] bg-[#0d1117] border border-[#30363d]">
                {item.source}
              </span>
              {item.is_high_signal && (
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  Must-Read ({item.quality_score}점)
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#f0f6fc] leading-snug">
              {item.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onToggleBookmark(item)}
              className={`p-1.5 rounded-md border border-[#30363d] transition-colors cursor-pointer ${
                isBookmarked
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]'
              }`}
              title={isBookmarked ? '보관함에서 제거' : '보관함에 저장'}
            >
              <Star className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm leading-relaxed">
          {/* 1. 3-Bullet Executive TL;DR */}
          <div className="p-3.5 rounded-md bg-[#0d1117] border border-[#30363d] space-y-2">
            <div className="flex items-center gap-1.5 text-[#58a6ff] font-semibold text-xs uppercase tracking-wide font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Executive TL;DR (3줄 핵심 요약)</span>
            </div>
            <div className="space-y-1.5">
              {bullets.map((b, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[#c9d1d9]">
                  <span className="text-[11px] font-mono text-[#8b949e] shrink-0 mt-0.5">
                    {idx + 1}.
                  </span>
                  <p className="m-0 leading-relaxed text-xs sm:text-sm">{b}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Why It Matters for Developers */}
          {item.why_it_matters && (
            <div className="p-3 rounded-md bg-[#0d1117] border-l-2 border-[#58a6ff] text-xs leading-relaxed">
              <div className="text-xs font-semibold text-[#58a6ff] font-mono mb-1">
                Insight (개발자 시사점):
              </div>
              <p className="text-[#c9d1d9] m-0">
                {item.why_it_matters}
              </p>
            </div>
          )}

          {/* 3. Tech Stack Entities Extracted */}
          {item.tech_stack && item.tech_stack.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-[#8b949e]">언급된 주요 기술 스택:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {item.tech_stack.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#21262d] text-[#c9d1d9] border border-[#30363d]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 4. Full Summary */}
          {item.summary && (
            <div className="space-y-1 pt-2 border-t border-[#30363d]">
              <span className="text-xs font-medium text-[#8b949e]">원문 요약:</span>
              <p className="text-[#8b949e] text-xs leading-relaxed whitespace-pre-line bg-[#0d1117] p-3 rounded border border-[#30363d]">
                {item.summary}
              </p>
            </div>
          )}

          {/* 5. Interactive Ask AI Section */}
          <div className="pt-3 border-t border-[#30363d] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#58a6ff] font-semibold text-xs">
                <Bot className="w-3.5 h-3.5" />
                <span>AI에게 질문하기 (Ask AI)</span>
              </div>
              <span className="text-[11px] font-mono text-[#8b949e]">실시간 분석</span>
            </div>

            {/* Previous Q&A */}
            {chatHistory.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {chatHistory.map((c, i) => (
                  <div key={i} className="space-y-1 text-xs">
                    <div className="p-2 rounded bg-[#21262d] text-[#f0f6fc] font-medium">
                      Q: {c.q}
                    </div>
                    <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] whitespace-pre-line">
                      {c.a}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Question Form */}
            <form onSubmit={handleAsk} className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="예: 이 기술을 우리 프로젝트에 어떻게 적용할 수 있어?"
                className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-xs text-[#f0f6fc] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
              />
              <button
                type="submit"
                disabled={asking || !question.trim()}
                className="px-3 py-1.5 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white rounded-md flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {asking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3 h-3" />}
                <span>질문</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#30363d] bg-[#161b22] flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-3 text-[#8b949e]">
            <span>출처: {item.source}</span>
            {item.author && <span>by {item.author}</span>}
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-medium text-[#f0f6fc] hover:text-[#58a6ff] rounded-md flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <span>원문 링크</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
