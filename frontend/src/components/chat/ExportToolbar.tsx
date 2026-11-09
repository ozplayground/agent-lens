'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Copy, Check, Download, TriangleAlert, FileText } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

export interface ExportToolbarProps {
  /** 4단 구조화 리포트 마크다운 전문 */
  markdownContent: string;
  /** 분석 대상 기사 제목 (파일명 생성용) */
  sourceTitle?: string;
  /** 스트리밍 진행 중 여부 (진행 중일 때는 툴바 비활성화) */
  isStreaming?: boolean;
  /** 원클릭 마크다운 복사 완료 콜백 */
  onCopySuccess?: () => void;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 챗 답 내보내기: 마크다운 복사, .md 다운로드.
 * Notion 동기화는 서버 API 가 없어 그리지 않는다 (FE-22). 챗 답 내보내기 API 가 생기면 그때 연결한다.
 *
 * 버튼 하나에 아이콘 + 글자. 768px 미만은 글자를 숨긴 44px 아이콘 버튼이다 (접근 이름은 `aria-label` 그대로).
 */
const TOOL_BUTTON_CLASSES = 'max-md:w-11 max-md:px-0';
const TOOL_LABEL_CLASSES = 'max-md:sr-only';

export default function ExportToolbar({
  markdownContent,
  sourceTitle = 'AgentLens_Engineering_Report',
  isStreaming = false,
  onCopySuccess,
  className = '',
}: ExportToolbarProps) {
  const { status: copyStatus, copy } = useCopyToClipboard();
  const [downloading, setDownloading] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  const later = (fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  };

  const handleCopyMarkdown = async () => {
    if (isStreaming || !markdownContent) return;
    const ok = await copy(markdownContent);
    if (ok) onCopySuccess?.();
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
      later(() => setDownloading(false), 500);
    }
  };

  const copyIcon =
    copyStatus === 'copied' ? <Check /> : copyStatus === 'failed' ? <TriangleAlert /> : <Copy />;
  const copyText = copyStatus === 'copied' ? '복사됨' : copyStatus === 'failed' ? '복사 실패' : '마크다운 복사';

  return (
    <div
      role="group"
      aria-label="리포트 익스포트 툴바"
      className={cn(
        'export-toolbar flex flex-wrap items-center gap-1 text-xs text-fg-muted',
        isStreaming && 'pointer-events-none opacity-50',
        className
      )}
    >
      <span className="mr-1 hidden items-center gap-1 text-xs text-fg-subtle md:inline-flex">
        <FileText aria-hidden="true" className="size-3.5" />
        리포트 내보내기
      </span>

      {/* Copy Markdown Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopyMarkdown}
        disabled={isStreaming}
        aria-label="마크다운 복사"
        title="마크다운 복사"
        leadingIcon={copyIcon}
        className={cn(
          TOOL_BUTTON_CLASSES,
          copyStatus === 'copied' && 'text-success',
          copyStatus === 'failed' && 'text-danger'
        )}
      >
        <span aria-live="polite" className={TOOL_LABEL_CLASSES}>
          {copyText}
        </span>
      </Button>

      {/* Download .md Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDownloadMarkdown}
        disabled={isStreaming || downloading}
        aria-label=".md 다운로드"
        title=".md 다운로드"
        leadingIcon={<Download />}
        className={TOOL_BUTTON_CLASSES}
      >
        <span className={TOOL_LABEL_CLASSES}>.md 다운로드</span>
      </Button>
    </div>
  );
}
