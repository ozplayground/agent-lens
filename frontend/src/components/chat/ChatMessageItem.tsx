'use client';

import React, { memo, useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, Copy, Check, RotateCcw, Sparkles, TriangleAlert } from 'lucide-react';
import { ChatMessage, sanitizeModelTier, formatModelDisplayName } from '@/types/chat';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { MarkdownCode, MARKDOWN_WRAP_CLASSES } from '@/components/MarkdownViewer';
import CitationBadge from './CitationBadge';
import WorkflowStepTracker from './WorkflowStepTracker';
import ExportToolbar from './ExportToolbar';
import ModelTierBadge from './ModelTierBadge';

export interface ChatMessageItemProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onRetry?: (messageId: string) => void;
  onCopy?: (content: string) => void;
}

/** 답변 안 인라인 코드. `text-[12px]` 은 기존 테스트 단언이라 그대로 둔다 (`text-xs` 와 같은 값). */
const INLINE_CODE_CLASSES =
  'break-all rounded border border-border bg-surface-muted px-1 py-0.5 font-mono text-[12px] text-fg';

/** 답변 마크다운 부품. 본문의 `[1]`·`[S1]` 을 인용 배지로 바꾼다. */
function buildMarkdownComponents(sources: ChatMessage['sources']): Components {
  const sourcesMap = new Map((sources || []).map((s) => [String(s.index), s]));

  const renderTextWithBadges = (text: string): React.ReactNode => {
    const parts = text.split(/(\[(?:S\d+|\d+)\])/g);
    return parts.map((part, i) => {
      const match = /^\[(S?\d+)\]$/.exec(part);
      if (match) {
        const rawIndex = match[1];
        const index = rawIndex.startsWith('S') ? rawIndex : parseInt(rawIndex, 10);
        const source = sourcesMap.get(String(index));
        return (
          <CitationBadge
            key={i}
            index={index}
            source={source}
          />
        );
      }
      return part;
    });
  };

  const processChildren = (children: React.ReactNode): React.ReactNode =>
    React.Children.map(children, (child) => (typeof child === 'string' ? renderTextWithBadges(child) : child));

  return {
    pre: ({ children }) => <>{children}</>,
    code: ({ className, children }) => (
      <MarkdownCode className={className} inlineClassName={INLINE_CODE_CLASSES}>
        {children}
      </MarkdownCode>
    ),
    p: ({ children }) => (
      <p className={cn('my-2 leading-relaxed', MARKDOWN_WRAP_CLASSES)}>{processChildren(children)}</p>
    ),
    ul: ({ children }) => <ul className="my-2 ml-4 list-disc space-y-1 marker:text-fg-subtle">{children}</ul>,
    ol: ({ children }) => (
      <ol className="my-2 ml-4 list-decimal space-y-1 marker:font-semibold marker:text-fg-subtle">{children}</ol>
    ),
    li: ({ children }) => (
      <li className={cn('pl-1 leading-relaxed', MARKDOWN_WRAP_CLASSES)}>{processChildren(children)}</li>
    ),
    blockquote: ({ children }) => (
      <blockquote
        className={cn('my-2 border-l-4 border-border-strong pl-3 text-fg-muted', MARKDOWN_WRAP_CLASSES)}
      >
        {processChildren(children)}
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
    h1: ({ children }) => (
      <h2 className={cn('mt-4 mb-2 text-base font-semibold text-fg', MARKDOWN_WRAP_CLASSES)}>
        {processChildren(children)}
      </h2>
    ),
    h2: ({ children }) => (
      <h3 className={cn('mt-3.5 mb-2 text-base font-semibold text-fg', MARKDOWN_WRAP_CLASSES)}>
        {processChildren(children)}
      </h3>
    ),
    h3: ({ children }) => (
      <h4 className={cn('mt-3 mb-1.5 text-sm font-semibold text-fg', MARKDOWN_WRAP_CLASSES)}>
        {processChildren(children)}
      </h4>
    ),
    h4: ({ children }) => (
      <h5 className={cn('mt-2.5 mb-1 text-sm font-semibold text-fg', MARKDOWN_WRAP_CLASSES)}>
        {processChildren(children)}
      </h5>
    ),
    hr: () => <hr className="my-4 border-border" />,
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium break-all text-accent underline-offset-2 [overflow-wrap:anywhere] hover:underline"
      >
        {children}
      </a>
    ),
    strong: ({ children }) => <strong className="font-semibold text-fg">{processChildren(children)}</strong>,
  };
}

function ChatMessageItem({
  message,
  isStreaming = false,
  onRetry,
  onCopy,
}: ChatMessageItemProps) {
  const { status: copyStatus, label: copyLabel, copy } = useCopyToClipboard();
  const isUser = message.role === 'user';
  const isError = message.status === 'error';
  const resolvedTier = sanitizeModelTier(message.model_tier || message.model_used);
  const displayModelName = formatModelDisplayName(message.model_used || message.model_tier);

  const handleCopy = async () => {
    const ok = await copy(message.content);
    if (ok) onCopy?.(message.content);
  };

  // 마크다운 부품은 출처가 바뀔 때만 새로 만든다. 렌더마다 새 객체면 이전 답까지 다시 파싱한다 (FE-10).
  const markdownComponents = useMemo(() => buildMarkdownComponents(message.sources), [message.sources]);

  if (isUser) {
    return (
      <div className="mb-4 flex w-full justify-end">
        <div className="flex max-w-[85%] min-w-0 items-start sm:max-w-2xl">
          <div
            className={cn(
              'max-w-full min-w-0 flex-1 rounded-2xl rounded-tr-sm bg-accent-soft px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-fg',
              MARKDOWN_WRAP_CLASSES
            )}
          >
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  const hasContent = Boolean(message.content && message.content.trim().length > 0);
  const sourceCounts = (() => {
    if (message.status !== 'completed' || !hasContent || !message.sources || message.sources.length === 0) {
      return null;
    }
    const primaryCount =
      message.primary_count !== undefined && message.primary_count !== null
        ? message.primary_count
        : message.sources.filter((s) => s.type === 'primary' || !s.type).length;
    const supplementaryCount =
      message.supplementary_count !== undefined && message.supplementary_count !== null
        ? message.supplementary_count
        : message.sources.filter((s) => s.type === 'supplementary').length;
    if (primaryCount === 0 && supplementaryCount === 0) return null;
    return { primaryCount, supplementaryCount };
  })();

  // Assistant Message — 말풍선 없이 바탕(surface) 위에 마크다운
  return (
    <div className="mb-4 flex w-full justify-start">
      <div className="flex w-full max-w-full min-w-0 items-start gap-3">
        {/* Bot Avatar (640px 이상) */}
        <div
          aria-hidden="true"
          className="mt-4 hidden size-7 shrink-0 items-center justify-center rounded-full bg-accent-solid text-on-accent sm:flex"
        >
          <Bot className="size-4" />
        </div>

        {/* Message Container */}
        <div
          className={cn(
            'max-w-full min-w-0 flex-1 rounded-2xl p-4 text-sm leading-relaxed text-fg',
            isError ? 'border border-border bg-danger-soft' : 'max-sm:px-0'
          )}
        >
          {/* Header row: Model name & sources summary badge */}
          <div className="mb-2 flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-border pb-2 text-xs text-fg-subtle">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 font-semibold text-fg-muted">
                <Sparkles aria-hidden="true" className="size-3.5 text-accent" />
                {displayModelName}
              </span>
              {sourceCounts && (
                <div className="flex flex-wrap items-center gap-1">
                  {sourceCounts.primaryCount > 0 && (
                    <Badge tone="accent">원문 {sourceCounts.primaryCount}건</Badge>
                  )}
                  {sourceCounts.supplementaryCount > 0 && (
                    <Badge tone="success">보충 {sourceCounts.supplementaryCount}건</Badge>
                  )}
                </div>
              )}
            </div>

            {/* Actions: Copy */}
            {!isError && message.content && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                aria-label="답변 복사"
                title="답변 복사"
                leadingIcon={copyStatus === 'copied' ? <Check /> : copyStatus === 'failed' ? <TriangleAlert /> : <Copy />}
                className={cn(
                  'text-xs max-md:w-11 max-md:px-0',
                  copyStatus === 'copied' && 'text-success',
                  copyStatus === 'failed' && 'text-danger'
                )}
              >
                <span aria-live="polite" className="max-md:sr-only">
                  {copyLabel}
                </span>
              </Button>
            )}
          </div>

          {/* Workflow Step Tracker */}
          <WorkflowStepTracker
            currentStatus={message.current_status || null}
            stepHistory={message.step_history || []}
            isStreaming={isStreaming && message.status === 'streaming'}
            isDone={message.status === 'completed'}
          />

          {/* Auto-relaxation Guidance Badge */}
          {message.is_relaxed && (
            <InlineAlert tone="warning" className="mb-2.5">
              [안내: 선택 조건에 부합하는 소식이 없어 전체 기간으로 확장 검색했습니다]
            </InlineAlert>
          )}

          {/* Content Body: 오류여도 받은 부분 답은 그대로 보이고, 오류 문구는 그 아래에 둔다 (FE-33) */}
          {(!isError || hasContent) && (
            <div
              className={cn('markdown-content w-full max-w-full min-w-0 space-y-2 text-fg', MARKDOWN_WRAP_CLASSES)}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {message.content}
              </ReactMarkdown>

              {message.status === 'streaming' && isStreaming && (
                <span
                  aria-hidden="true"
                  className="ml-1 inline-block h-4 w-2 align-middle bg-accent motion-safe:animate-pulse"
                />
              )}

              {!isError && Boolean(message.content) && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
                  {resolvedTier ? (
                    <ModelTierBadge
                      tier={resolvedTier}
                      latencyMs={message.latency_ms ?? undefined}
                    />
                  ) : (
                    <span />
                  )}
                  <ExportToolbar
                    markdownContent={message.content}
                    sourceTitle={message.sources && message.sources[0]?.title}
                    isStreaming={isStreaming && message.status === 'streaming'}
                    onCopySuccess={() => onCopy?.(message.content)}
                  />
                </div>
              )}
            </div>
          )}

          {isError && (
            <div className="space-y-3 py-1">
              <div className="flex items-start gap-2 text-danger">
                <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <p className="font-medium">
                  {message.errorMessage || '네트워크 지연으로 응답이 중단되었습니다.'}
                </p>
              </div>
              {onRetry && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onRetry(message.id)}
                  aria-label="답변 다시 시도"
                  leadingIcon={<RotateCcw />}
                >
                  다시 시도
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 스트리밍 중 다른 메시지는 props 가 그대로라 다시 그리지 않는다 (FE-10).
export default memo(ChatMessageItem);
