'use client';

import { Check, Copy, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { Button } from './Button';

export interface CodeBlockProps {
  code: string;
  /** 머리줄에 보이는 언어 이름. 없으면 `snippet`. */
  language?: string;
  /** 바깥 틀 클래스 (예: `MarkdownViewer` 가 넘기는 `code-block-wrapper`). */
  className?: string;
  /** `<code>` 클래스 (예: `language-ts`). */
  codeClassName?: string;
  /** 복사할 글자. 없으면 `code` 에서 끝 줄바꿈 하나를 뺀 값. */
  copyValue?: string;
}

/** 코드 블록: 언어 표시 + 복사 버튼 + 가로 스크롤 `<pre>`. */
export function CodeBlock({ code, language, className, codeClassName, copyValue }: CodeBlockProps) {
  const { status, label, copy } = useCopyToClipboard();
  const icon = status === 'copied' ? <Check /> : status === 'failed' ? <TriangleAlert /> : <Copy />;

  return (
    <div
      className={cn(
        'w-full max-w-full min-w-0 overflow-hidden rounded-lg border border-border bg-surface-muted',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border pl-3 text-xs text-fg-muted">
        <span className="min-w-0 truncate font-mono font-medium">{language || 'snippet'}</span>
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={icon}
          onClick={() => void copy(copyValue ?? code.replace(/\n$/, ''))}
          className={cn(
            'text-xs',
            status === 'copied' ? 'text-success' : null,
            status === 'failed' ? 'text-danger' : null
          )}
        >
          <span aria-live="polite">{label}</span>
        </Button>
      </div>
      <pre
        tabIndex={0}
        aria-label="가로 스크롤 가능한 코드 블록"
        className="overflow-x-auto overscroll-x-contain p-3 font-mono text-xs leading-relaxed text-fg"
      >
        <code className={codeClassName}>{code}</code>
      </pre>
    </div>
  );
}

export default CodeBlock;
