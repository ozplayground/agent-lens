'use client';

import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/cn';
import { CodeBlock } from '@/components/ui/CodeBlock';

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

/** 마크다운 영역의 줄바꿈 규칙 (긴 토큰·URL 이 가로 스크롤을 만들지 않게). */
export const MARKDOWN_WRAP_CLASSES = 'break-words [overflow-wrap:anywhere] [word-break:break-word]';

interface MarkdownCodeProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
  children?: React.ReactNode;
  /** 인라인 코드 클래스 (기본: `text-xs` 고정폭 + `surface-muted` 배경). */
  inlineClassName?: string;
}

const DEFAULT_INLINE_CODE_CLASSES =
  'break-all rounded border border-border bg-surface-muted px-1 py-0.5 font-mono text-xs text-fg';

/**
 * 마크다운 `code` 렌더러. 언어 표시가 있거나 여러 줄이면 `ui/CodeBlock` (복사 버튼, 가로 스크롤),
 * 아니면 인라인 `<code>`. 블록 바깥 틀에 `code-block-wrapper` 클래스를 붙인다.
 */
export function MarkdownCode({ className, children, inlineClassName, ...props }: MarkdownCodeProps) {
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';
  const rawString = React.Children.toArray(children).join('');
  const isBlock = Boolean(lang) || rawString.includes('\n');

  if (!isBlock) {
    return (
      <code className={inlineClassName ?? DEFAULT_INLINE_CODE_CLASSES} {...props}>
        {children}
      </code>
    );
  }

  return (
    <CodeBlock
      code={rawString}
      language={lang || undefined}
      className="code-block-wrapper my-3"
      codeClassName={className}
    />
  );
}

const MARKDOWN_COMPONENTS: Components = {
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }) => <MarkdownCode className={className}>{children}</MarkdownCode>,
  h1: ({ children }) => (
    <h2 className={cn('mt-4 mb-2 border-b border-border pb-1 text-base font-semibold text-fg', MARKDOWN_WRAP_CLASSES)}>
      {children}
    </h2>
  ),
  h2: ({ children }) => (
    <h3 className={cn('mt-3.5 mb-2 border-b border-border pb-1 text-base font-semibold text-fg', MARKDOWN_WRAP_CLASSES)}>
      {children}
    </h3>
  ),
  h3: ({ children }) => (
    <h4 className={cn('mt-3 mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-fg', MARKDOWN_WRAP_CLASSES)}>
      {children}
    </h4>
  ),
  h4: ({ children }) => (
    <h5 className={cn('mt-2.5 mb-1 text-sm font-semibold text-fg', MARKDOWN_WRAP_CLASSES)}>{children}</h5>
  ),
  p: ({ children }) => <p className={cn('my-2 leading-relaxed', MARKDOWN_WRAP_CLASSES)}>{children}</p>,
  ul: ({ children }) => <ul className="my-2 ml-4 list-disc space-y-1 marker:text-fg-subtle">{children}</ul>,
  ol: ({ children }) => (
    <ol className="my-2 ml-4 list-decimal space-y-1 marker:font-semibold marker:text-fg-subtle">{children}</ol>
  ),
  li: ({ children }) => <li className={cn('pl-1 leading-relaxed', MARKDOWN_WRAP_CLASSES)}>{children}</li>,
  blockquote: ({ children }) => (
    <blockquote
      className={cn(
        'my-3 rounded-r-md border-l-4 border-accent bg-surface-muted py-2 pr-3 pl-3.5 text-fg-muted',
        MARKDOWN_WRAP_CLASSES
      )}
    >
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="table-wrapper my-3 w-full max-w-full min-w-0 overflow-x-auto overscroll-x-contain rounded-lg border border-border">
      <table className="w-full min-w-[320px] border-collapse text-left text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-border bg-surface-muted font-semibold text-fg">{children}</thead>
  ),
  tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
  tr: ({ children }) => <tr className="transition-colors hover:bg-surface-muted">{children}</tr>,
  th: ({ children }) => <th className="px-3 py-2 font-semibold text-fg">{children}</th>,
  td: ({ children }) => <td className="px-3 py-2 text-fg-muted">{children}</td>,
  hr: () => <hr className="my-4 border-border" />,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium break-all text-accent underline-offset-2 hover:underline"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-fg">{children}</strong>,
};

export default function MarkdownViewer({ content, className = '' }: MarkdownViewerProps) {
  if (!content) return null;

  return (
    <div
      className={cn(
        'markdown-viewer w-full max-w-full min-w-0 text-sm leading-relaxed text-fg',
        MARKDOWN_WRAP_CLASSES,
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
