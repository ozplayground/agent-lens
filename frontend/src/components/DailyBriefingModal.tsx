'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  Download,
  Settings,
  FileText,
  Mail,
  ExternalLink,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  Code
} from 'lucide-react';
import { DailyBriefing } from '@/types/news';
import { exportBriefingToNotion, sendBriefingByEmail } from '@/lib/api';

interface DailyBriefingModalProps {
  briefing: DailyBriefing | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export default function DailyBriefingModal({
  briefing,
  isOpen,
  onClose,
  onOpenSettings
}: DailyBriefingModalProps) {
  const [activeView, setActiveView] = useState<'categorized' | 'markdown'>('categorized');
  const [copied, setCopied] = useState(false);

  // Notion export state
  const [isExportingNotion, setIsExportingNotion] = useState(false);
  const [notionResult, setNotionResult] = useState<{ success: boolean; url?: string; message?: string } | null>(null);

  // Email send state
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<{ success: boolean; message?: string } | null>(null);

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

  const handleExportNotion = async () => {
    setIsExportingNotion(true);
    setNotionResult(null);
    try {
      const res = await exportBriefingToNotion();
      setNotionResult({ success: true, url: res.url, message: 'Notion 페이지 생성 완료!' });
    } catch (e: any) {
      setNotionResult({ success: false, message: e.message || 'Notion 페이지 생성 실패' });
    } finally {
      setIsExportingNotion(false);
    }
  };

  const handleSendEmail = async (targetEmail?: string) => {
    setIsSendingEmail(true);
    setEmailResult(null);
    try {
      const res = await sendBriefingByEmail(targetEmail || emailInput);
      setEmailResult({ success: true, message: '이메일이 성공적으로 발송되었습니다.' });
      setShowEmailPrompt(false);
      setTimeout(() => setEmailResult(null), 4000);
    } catch (e: any) {
      setEmailResult({ success: false, message: e.message || '이메일 발송 실패' });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl relative text-[#c9d1d9] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#30363d] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#161b22] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#58a6ff] shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#f0f6fc] flex items-center gap-2">
                오늘의 AI 브리핑
                <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                  {briefing.date}
                </span>
              </h3>
              <p className="text-xs text-[#8b949e] line-clamp-1 mt-0.5">
                {briefing.headline}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center flex-wrap gap-1.5 self-end sm:self-auto">
            {/* Notion Export */}
            {notionResult?.url ? (
              <a
                href={notionResult.url}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Notion에서 열기</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            ) : (
              <button
                onClick={handleExportNotion}
                disabled={isExportingNotion}
                className="px-2.5 py-1 rounded-md bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-medium text-[#c9d1d9] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Notion 페이지로 즉시 발행"
              >
                {isExportingNotion ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#58a6ff]" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-[#58a6ff]" />
                )}
                <span>Notion 발행</span>
              </button>
            )}

            {/* Email Send */}
            <div className="relative">
              <button
                onClick={() => setShowEmailPrompt(!showEmailPrompt)}
                disabled={isSendingEmail}
                className="px-2.5 py-1 rounded-md bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-medium text-[#c9d1d9] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="이메일로 브리핑 받기"
              >
                {isSendingEmail ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#58a6ff]" />
                ) : (
                  <Mail className="w-3.5 h-3.5 text-[#58a6ff]" />
                )}
                <span>이메일 전송</span>
              </button>

              {/* Email Prompt Popover */}
              {showEmailPrompt && (
                <div className="absolute right-0 top-8 z-50 w-72 p-3 bg-[#161b22] border border-[#30363d] rounded-lg shadow-xl text-xs space-y-2">
                  <div className="font-semibold text-[#f0f6fc]">이메일로 브리핑 받기</div>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="수신자 이메일 주소"
                    className="w-full px-2.5 py-1.5 rounded bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] text-xs text-[#f0f6fc] focus:outline-none"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleSendEmail()}
                      disabled={isSendingEmail}
                      className="px-3 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium cursor-pointer disabled:opacity-50"
                    >
                      {emailInput ? '발송' : '기본 수신자로 발송'}
                    </button>
                    <button
                      onClick={() => setShowEmailPrompt(false)}
                      className="text-[#8b949e] hover:text-[#c9d1d9] text-xs cursor-pointer"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Copy Markdown */}
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-md bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-medium text-[#c9d1d9] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Markdown 클립보드 복사"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#3fb950]" /> : <Copy className="w-3.5 h-3.5 text-[#8b949e]" />}
              <span>{copied ? '복사됨' : '복사'}</span>
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-md bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] cursor-pointer"
              title="Markdown 파일 다운로드"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Settings */}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-1.5 rounded-md bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] cursor-pointer"
                title="Notion / 이메일 / 웹훅 설정"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {notionResult && (
          <div
            className={`px-4 py-2 border-b text-xs flex items-center justify-between ${
              notionResult.success
                ? 'bg-[#238636]/15 border-[#238636]/40 text-[#3fb950]'
                : 'bg-[#da3633]/15 border-[#da3633]/40 text-[#f85149]'
            }`}
          >
            <div className="flex items-center gap-2">
              {notionResult.success ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span>{notionResult.message}</span>
            </div>
            {!notionResult.success && onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="underline hover:text-white font-medium cursor-pointer ml-2"
              >
                Notion 설정 열기
              </button>
            )}
          </div>
        )}

        {emailResult && (
          <div
            className={`px-4 py-2 border-b text-xs flex items-center justify-between ${
              emailResult.success
                ? 'bg-[#238636]/15 border-[#238636]/40 text-[#3fb950]'
                : 'bg-[#da3633]/15 border-[#da3633]/40 text-[#f85149]'
            }`}
          >
            <div className="flex items-center gap-2">
              {emailResult.success ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span>{emailResult.message}</span>
            </div>
            {!emailResult.success && onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="underline hover:text-white font-medium cursor-pointer ml-2"
              >
                이메일 설정 열기
              </button>
            )}
          </div>
        )}

        {/* View Switcher Tabs */}
        <div className="flex items-center border-b border-[#30363d] bg-[#0d1117] px-4 pt-2 gap-2 text-xs font-medium shrink-0">
          <button
            onClick={() => setActiveView('categorized')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors cursor-pointer ${
              activeView === 'categorized'
                ? 'border-[#58a6ff] text-[#58a6ff] font-semibold'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>카테고리별 요약</span>
          </button>
          <button
            onClick={() => setActiveView('markdown')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors cursor-pointer ${
              activeView === 'markdown'
                ? 'border-[#58a6ff] text-[#58a6ff] font-semibold'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>마크다운 전문</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm leading-relaxed text-[#c9d1d9]">
          {activeView === 'categorized' ? (
            <div className="space-y-4">
              {/* Overview Callout */}
              <div className="p-4 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-2">
                <div className="flex items-center gap-2 text-[#58a6ff] font-semibold text-xs sm:text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>오늘의 핵심 요약 (Overview)</span>
                </div>
                <div className="text-xs sm:text-sm text-[#f0f6fc] font-medium leading-relaxed">
                  {briefing.headline}
                </div>
                {briefing.overview && (
                  <div className="pt-2 border-t border-[#30363d]/60 text-xs text-[#8b949e] space-y-1.5 leading-relaxed">
                    {briefing.overview.split('\n').map((line, idx) => {
                      const match = line.match(/^•\s*\*\*(.*?)\*\*:\s*(.*)$/);
                      if (match) {
                        return (
                          <div key={idx} className="flex items-start gap-1.5">
                            <span className="text-[#58a6ff] shrink-0">•</span>
                            <span>
                              <strong className="text-[#f0f6fc] font-semibold">{match[1]}:</strong>{' '}
                              <span className="text-[#c9d1d9]">{match[2]}</span>
                            </span>
                          </div>
                        );
                      }
                      return <div key={idx}>{line}</div>;
                    })}
                  </div>
                )}
              </div>

              {/* 4 Category Sections */}
              {briefing.categories && briefing.categories.length > 0 ? (
                <div className="space-y-4">
                  {briefing.categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="p-4 rounded-lg bg-[#161b22] border border-[#30363d] space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-[#30363d]/70 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{cat.icon}</span>
                          <h4 className="font-bold text-[#f0f6fc] text-xs sm:text-sm">
                            {cat.name}
                          </h4>
                        </div>
                        <span className="text-[11px] font-mono text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded border border-[#30363d]">
                          {cat.items.length}건
                        </span>
                      </div>

                      {cat.summary && (
                        <div className="text-xs text-[#8b949e] italic bg-[#0d1117]/60 p-2.5 rounded border border-[#30363d]/50">
                          <span className="font-semibold text-[#58a6ff] not-italic mr-1">동향:</span>
                          {cat.summary}
                        </div>
                      )}

                      {/* Items */}
                      <div className="space-y-2.5 pt-1">
                        {cat.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-md bg-[#0d1117] border border-[#30363d] hover:border-[#8b949e]/60 transition-colors space-y-1.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-[#f0f6fc] hover:text-[#58a6ff] transition-colors flex items-center gap-1 group text-xs sm:text-sm leading-snug"
                              >
                                <span>{item.title}</span>
                                <ExternalLink className="w-3 h-3 text-[#8b949e] group-hover:text-[#58a6ff] shrink-0" />
                              </a>
                              {item.source && (
                                <span className="text-[10px] font-mono text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded border border-[#30363d] shrink-0">
                                  {item.source}
                                </span>
                              )}
                            </div>

                            {item.why_it_matters && (
                              <div className="text-xs text-[#3fb950] bg-[#238636]/10 border border-[#238636]/30 p-2 rounded leading-relaxed">
                                <span className="font-semibold mr-1">💡 시사점:</span>
                                {item.why_it_matters}
                              </div>
                            )}

                            {item.summary && !item.why_it_matters && (
                              <p className="text-xs text-[#8b949e] line-clamp-2 leading-relaxed m-0">
                                {item.summary}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Fallback to split markdown rendering if categories array not present */
                <div className="prose prose-invert max-w-none space-y-2 text-xs">
                  {briefing.markdown_report.split('\n').map((line, idx) => (
                    <p key={idx} className="m-0">{line}</p>
                  ))}
                </div>
              )}

              {/* Action Items */}
              {briefing.action_items && briefing.action_items.length > 0 && (
                <div className="p-4 rounded-lg bg-[#238636]/10 border border-[#238636]/30 space-y-2">
                  <div className="font-bold text-[#3fb950] text-xs sm:text-sm flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    <span>오늘의 추천 Action Items</span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {briefing.action_items.map((act, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-[#c9d1d9]">
                        <span className="font-mono text-[#3fb950] font-bold shrink-0">{i + 1}.</span>
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Tab 2: Raw Markdown View */
            <div className="prose prose-invert max-w-none space-y-2.5 font-sans">
              {briefing.markdown_report.split('\n').map((line, idx) => {
                if (line.startsWith('# ')) {
                  return (
                    <h1 key={idx} className="text-base sm:text-lg font-bold text-[#f0f6fc] pb-1 border-b border-[#30363d]">
                      {line.replace('# ', '')}
                    </h1>
                  );
                }
                if (line.startsWith('## ')) {
                  return (
                    <h2 key={idx} className="text-xs sm:text-sm font-bold text-[#58a6ff] pt-2 font-mono">
                      {line.replace('## ', '')}
                    </h2>
                  );
                }
                if (line.startsWith('- ')) {
                  return (
                    <div key={idx} className="flex items-start gap-2 pl-2">
                      <span className="text-[#58a6ff] mt-0.5">•</span>
                      <p className="text-[#c9d1d9] m-0 text-xs">{line.replace('- ', '')}</p>
                    </div>
                  );
                }
                if (line.startsWith('> ')) {
                  return (
                    <div key={idx} className="p-2.5 rounded-md bg-[#0d1117] border-l-2 border-[#58a6ff] text-[#c9d1d9] text-xs">
                      {line.replace('> ', '')}
                    </div>
                  );
                }
                if (line.trim().startsWith('1.') || line.trim().startsWith('2.') || line.trim().startsWith('3.')) {
                  return (
                    <div key={idx} className="p-2 rounded-md bg-[#0d1117] border border-[#30363d] text-[#f0f6fc] text-xs">
                      {line}
                    </div>
                  );
                }
                return <p key={idx} className="text-[#8b949e] m-0 text-xs">{line}</p>;
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#30363d] bg-[#161b22] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#8b949e] shrink-0">
          <span className="text-[11px] font-mono">
            AgentLens • AI & Agent 기술 큐레이션 및 정기 브리핑
          </span>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="text-xs text-[#58a6ff] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3 h-3" />
                <span>연동 설정 관리</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-md bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-medium text-[#c9d1d9] cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
