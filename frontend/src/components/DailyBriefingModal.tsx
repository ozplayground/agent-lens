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
import MarkdownViewer from './MarkdownViewer';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl relative text-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                오늘의 AI 브리핑
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {briefing.date}
                </span>
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
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
                className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Notion에서 열기</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            ) : (
              <button
                onClick={handleExportNotion}
                disabled={isExportingNotion}
                className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                title="Notion 페이지로 즉시 발행"
              >
                {isExportingNotion ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>Notion 발행</span>
              </button>
            )}

            {/* Email Send */}
            <div className="relative">
              <button
                onClick={() => setShowEmailPrompt(!showEmailPrompt)}
                disabled={isSendingEmail}
                className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                title="이메일로 브리핑 받기"
              >
                {isSendingEmail ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                ) : (
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>이메일 전송</span>
              </button>

              {/* Email Prompt Popover */}
              {showEmailPrompt && (
                <div className="absolute right-0 top-8 z-50 w-72 p-3 bg-white border border-slate-200 rounded-lg shadow-xl text-xs space-y-2 text-slate-800">
                  <div className="font-semibold text-slate-900">이메일로 브리핑 받기</div>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="수신자 이메일 주소"
                    className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-200 focus:border-blue-500 text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleSendEmail()}
                      disabled={isSendingEmail}
                      className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium cursor-pointer disabled:opacity-50 shadow-xs"
                    >
                      {emailInput ? '발송' : '기본 수신자로 발송'}
                    </button>
                    <button
                      onClick={() => setShowEmailPrompt(false)}
                      className="text-slate-500 hover:text-slate-800 text-xs cursor-pointer"
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
              className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Markdown 클립보드 복사"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? '복사됨' : '복사'}</span>
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer shadow-xs"
              title="Markdown 파일 다운로드"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Settings */}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-1.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer shadow-xs"
                title="Notion / 이메일 / 웹훅 설정"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
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
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {notionResult.success ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-red-600" />}
              <span>{notionResult.message}</span>
            </div>
            {!notionResult.success && onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="underline hover:text-red-900 font-medium cursor-pointer ml-2"
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
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {emailResult.success ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-red-600" />}
              <span>{emailResult.message}</span>
            </div>
            {!emailResult.success && onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="underline hover:text-red-900 font-medium cursor-pointer ml-2"
              >
                이메일 설정 열기
              </button>
            )}
          </div>
        )}

        {/* View Switcher Tabs */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-medium shrink-0">
          <button
            onClick={() => setActiveView('categorized')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors cursor-pointer ${
              activeView === 'categorized'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>카테고리별 요약</span>
          </button>
          <button
            onClick={() => setActiveView('markdown')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors cursor-pointer ${
              activeView === 'markdown'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>마크다운 전문</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm leading-relaxed text-slate-700 bg-white">
          {activeView === 'categorized' ? (
            <div className="space-y-4">
              {/* Overview Callout */}
              <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-200 space-y-2">
                <div className="flex items-center gap-2 text-blue-700 font-semibold text-xs sm:text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>오늘의 핵심 요약 (Overview)</span>
                </div>
                <div className="text-xs sm:text-sm text-slate-900 font-medium leading-relaxed">
                  {briefing.headline}
                </div>
                {briefing.overview && (
                  <div className="pt-2 border-t border-blue-200/60 text-xs text-slate-600 space-y-1.5 leading-relaxed">
                    {briefing.overview.split('\n').map((line, idx) => {
                      const match = line.match(/^•\s*\*\*(.*?)\*\*:\s*(.*)$/);
                      if (match) {
                        return (
                          <div key={idx} className="flex items-start gap-1.5">
                            <span className="text-blue-600 shrink-0">•</span>
                            <span>
                              <strong className="text-slate-900 font-semibold">{match[1]}:</strong>{' '}
                              <span className="text-slate-700">{match[2]}</span>
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
                      className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{cat.icon}</span>
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                            {cat.name}
                          </h4>
                        </div>
                        <span className="text-[11px] font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-xs">
                          {cat.items.length}건
                        </span>
                      </div>

                      {cat.summary && (
                        <div className="text-xs text-slate-600 italic bg-white p-2.5 rounded border border-slate-200">
                          <span className="font-semibold text-blue-600 not-italic mr-1">동향:</span>
                          {cat.summary}
                        </div>
                      )}

                      {/* Items */}
                      <div className="space-y-2.5 pt-1">
                        {cat.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-md bg-white border border-slate-200 hover:border-blue-400 shadow-xs transition-colors space-y-1.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-slate-900 hover:text-blue-600 transition-colors flex items-center gap-1 group text-xs sm:text-sm leading-snug"
                              >
                                <span>{item.title}</span>
                                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0" />
                              </a>
                              {item.source && (
                                <span className="text-[10px] font-mono text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                                  {item.source}
                                </span>
                              )}
                            </div>

                            {item.why_it_matters && (
                              <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2 rounded leading-relaxed">
                                <span className="font-semibold mr-1">💡 시사점:</span>
                                {item.why_it_matters}
                              </div>
                            )}

                            {item.summary && !item.why_it_matters && (
                              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed m-0">
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
                <div className="space-y-2 text-xs text-slate-700">
                  {briefing.markdown_report.split('\n').map((line, idx) => (
                    <p key={idx} className="m-0">{line}</p>
                  ))}
                </div>
              )}

              {/* Action Items */}
              {briefing.action_items && briefing.action_items.length > 0 && (
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="font-bold text-emerald-800 text-xs sm:text-sm flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    <span>오늘의 추천 Action Items</span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {briefing.action_items.map((act, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-800">
                        <span className="font-mono text-emerald-700 font-bold shrink-0">{i + 1}.</span>
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Tab 2: Raw Markdown View */
            <div className="p-1">
              <MarkdownViewer content={briefing.markdown_report} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 shrink-0">
          <span className="text-[11px] font-mono">
            AgentLens • AI & Agent 기술 큐레이션 및 정기 브리핑
          </span>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Settings className="w-3 h-3" />
                <span>연동 설정 관리</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 shadow-xs cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
