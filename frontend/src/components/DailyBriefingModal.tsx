'use client';

import React, { useState } from 'react';
import { X, Sparkles, Copy, Check, Download } from 'lucide-react';
import { DailyBriefing } from '@/types/news';

interface DailyBriefingModalProps {
  briefing: DailyBriefing | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DailyBriefingModal({ briefing, isOpen, onClose }: DailyBriefingModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !briefing) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(briefing.markdown_report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([briefing.markdown_report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AgentLens_Daily_Briefing_${briefing.date.replace(/[^0-9]/g, '')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl relative text-[#c9d1d9] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#30363d] flex items-center justify-between bg-[#161b22] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#58a6ff]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#f0f6fc] flex items-center gap-2">
                일일 인텔리전스 브리핑 (Daily Intelligence)
                <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                  {briefing.date}
                </span>
              </h3>
              <p className="text-xs text-[#8b949e]">{briefing.headline}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-md bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-medium text-[#c9d1d9] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#3fb950]" /> : <Copy className="w-3.5 h-3.5 text-[#8b949e]" />}
              <span>{copied ? '복사됨' : '복사'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-md bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] cursor-pointer"
              title="Markdown 파일 다운로드"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-3 text-xs sm:text-sm leading-relaxed text-[#c9d1d9] font-sans">
          <div className="prose prose-invert max-w-none space-y-2.5">
            {briefing.markdown_report.split('\n').map((line, idx) => {
              if (line.startsWith('# ')) {
                return <h1 key={idx} className="text-lg font-bold text-[#f0f6fc] pb-1 border-b border-[#30363d]">{line.replace('# ', '')}</h1>;
              }
              if (line.startsWith('## ')) {
                return <h2 key={idx} className="text-sm font-bold text-[#58a6ff] pt-2 font-mono">{line.replace('## ', '')}</h2>;
              }
              if (line.startsWith('- ')) {
                return (
                  <div key={idx} className="flex items-start gap-2 pl-2">
                    <span className="text-[#58a6ff] mt-0.5">•</span>
                    <p className="text-[#c9d1d9] m-0 text-xs sm:text-sm">{line.replace('- ', '')}</p>
                  </div>
                );
              }
              if (line.trim().startsWith('1.') || line.trim().startsWith('2.') || line.trim().startsWith('3.')) {
                return (
                  <div key={idx} className="p-2.5 rounded-md bg-[#0d1117] border border-[#30363d] text-[#f0f6fc] text-xs">
                    {line}
                  </div>
                );
              }
              return <p key={idx} className="text-[#8b949e] m-0 text-xs">{line}</p>;
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#30363d] bg-[#161b22] flex items-center justify-between text-xs text-[#8b949e] shrink-0">
          <span className="text-[11px] font-mono">글로벌 260+ 피드 종합 분석 완료 · 정기 크론 자동 갱신</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-medium text-[#c9d1d9] cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
