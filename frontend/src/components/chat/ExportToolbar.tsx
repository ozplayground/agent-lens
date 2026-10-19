'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, Download, Share2, Loader2, FileText } from 'lucide-react';

export interface ExportToolbarProps {
  /** 어시스턴트 메시지 고유 식별자 */
  messageId: string;
  /** 4단 구조화 리포트 마크다운 전문 */
  markdownContent: string;
  /** 분석 대상 기사 제목 (파일명 생성용) */
  sourceTitle?: string;
  /** 스트리밍 진행 중 여부 (진행 중일 때는 툴바 비활성화) */
  isStreaming?: boolean;
  /** 원클릭 마크다운 복사 완료 콜백 */
  onCopySuccess?: () => void;
  /** Notion 연동 성공 콜백 (생성된 페이지 URL 반환) */
  onNotionSuccess?: (pageUrl: string) => void;
  /** 추가 클래스 */
  className?: string;
}

export default function ExportToolbar({
  messageId,
  markdownContent,
  sourceTitle = 'AgentLens_Engineering_Report',
  isStreaming = false,
  onCopySuccess,
  onNotionSuccess,
  className = '',
}: ExportToolbarProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [notionSyncing, setNotionSyncing] = useState(false);
  const [notionSynced, setNotionSynced] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopyMarkdown = async () => {
    if (isStreaming || !markdownContent) return;
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      onCopySuccess?.();
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API fails
      const textarea = document.createElement('textarea');
      textarea.value = markdownContent;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        onCopySuccess?.();
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
      } catch {}
      document.body.removeChild(textarea);
    }
  };

  const handleDownloadMarkdown = () => {
    if (isStreaming || !markdownContent) return;
    setDownloading(true);
    try {
      const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const cleanTitle = (sourceTitle || 'AgentLens_Report')
        .replace(/[^a-zA-Z0-9가-힣_-]/g, '_')
        .slice(0, 50);
      const filename = `${cleanTitle}_${new Date().toISOString().slice(0, 10)}.md`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setDownloading(false), 500);
    }
  };

  const handleSyncNotion = async () => {
    if (isStreaming || !markdownContent || notionSyncing) return;
    setNotionSyncing(true);
    try {
      // Mock Notion sync API response or direct callback
      const mockPageUrl = `https://notion.so/agentlens/report-${messageId}`;
      await new Promise((resolve) => setTimeout(resolve, 300));
      setNotionSynced(true);
      onNotionSuccess?.(mockPageUrl);
      setTimeout(() => setNotionSynced(false), 3000);
    } finally {
      setNotionSyncing(false);
    }
  };

  return (
    <div
      aria-label="리포트 익스포트 툴바"
      className={`export-toolbar flex items-center gap-1.5 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap ${
        isStreaming ? 'opacity-50 pointer-events-none' : ''
      } ${className}`}
    >
      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
        <FileText className="w-3 h-3" />
        4단 리포트 익스포트:
      </span>

      {/* Copy Markdown Button */}
      <button
        type="button"
        onClick={handleCopyMarkdown}
        disabled={isStreaming}
        aria-label="마크다운 복사"
        className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">복사됨</span>
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" />
            <span>마크다운 복사</span>
          </>
        )}
      </button>

      {/* Download .md Button */}
      <button
        type="button"
        onClick={handleDownloadMarkdown}
        disabled={isStreaming || downloading}
        aria-label=".md 다운로드"
        className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download className="w-3 h-3" />
        <span>.md 다운로드</span>
      </button>

      {/* Sync Notion Button */}
      <button
        type="button"
        onClick={handleSyncNotion}
        disabled={isStreaming || notionSyncing}
        aria-label="Notion 동기화"
        className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      >
        {notionSyncing ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
            <span>Notion 연동 중...</span>
          </>
        ) : notionSynced ? (
          <>
            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Notion 연동됨</span>
          </>
        ) : (
          <>
            <Share2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <span>Notion 동기화</span>
          </>
        )}
      </button>
    </div>
  );
}
