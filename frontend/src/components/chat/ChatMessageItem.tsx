'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Copy, Check, RotateCcw, AlertTriangle, Sparkles, Info } from 'lucide-react';
import {
  ChatMessage,
  ModelTier,
  ChatModel,
  MODEL_TO_TIER,
  TIER_TO_MODEL,
  sanitizeModelTier,
  formatModelDisplayName,
} from '@/types/chat';
import CitationBadge from './CitationBadge';
import WorkflowStepTracker from './WorkflowStepTracker';
import ExportToolbar from './ExportToolbar';
import ModelTierBadge from './ModelTierBadge';
import { CodeBlock } from '@/components/MarkdownViewer';

export interface ChatMessageItemProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onRetry?: (messageId: string) => void;
  onCopy?: (content: string) => void;
  onOpenSourceDetail?: (sourceId: number) => void;
}

export default function ChatMessageItem({
  message,
  isStreaming = false,
  onRetry,
  onCopy,
  onOpenSourceDetail,
}: ChatMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUser = message.role === 'user';
  const isError = message.status === 'error';
  const sourcesMap = new Map((message.sources || []).map((s) => [String(s.index), s]));

  // Anti-Gemini Policy & Format Safe Display Model Name (POL-LLM-005, REQ-LLM-002)
  const resolvedTier: ModelTier = sanitizeModelTier(message.model_tier || message.model_used);
  const displayModelName = formatModelDisplayName(message.model_tier || message.model_used);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      if (onCopy) onCopy(message.content);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

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
            onOpenSourceDetail={onOpenSourceDetail}
          />
        );
      }
      return part;
    });
  };

  const processChildren = (children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, (child) => {
      if (typeof child === 'string') {
        return renderTextWithBadges(child);
      }
      return child;
    });
  };

  if (isUser) {
    return (
      <div className="flex justify-end w-full mb-4">
        <div className="flex items-start gap-2.5 max-w-[85%] sm:max-w-2xl min-w-0">
          <div className="flex-1 min-w-0 max-w-full rounded-2xl rounded-tr-xs bg-slate-100 border border-slate-200 text-slate-900 px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-2xs break-words [overflow-wrap:anywhere] [word-break:break-word]">
            {message.content}
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    );
  }

  // Assistant Message
  return (
    <div className="flex justify-start w-full mb-4">
      <div className="flex items-start gap-3 max-w-[95%] sm:max-w-3xl w-full min-w-0">
        {/* Bot Avatar */}
        <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
          <Bot className="w-4 h-4" />
        </div>

        {/* Message Bubble Container */}
        <div
          className={`flex-1 min-w-0 max-w-full rounded-2xl rounded-tl-xs p-4 text-xs sm:text-sm leading-relaxed border transition-all shadow-2xs ${
            isError
              ? 'bg-red-50/50 border-red-200 text-red-900'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          {/* Header row: Model name & sources summary badge */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1 font-mono">
                <Sparkles className="w-3 h-3 text-blue-600" />
                {displayModelName}
              </span>
              {message.sources && message.sources.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {message.primary_count !== undefined && message.primary_count !== null && message.primary_count > 0 && (
                    <span className="px-1.5 py-0.2 rounded font-mono bg-blue-50 text-blue-700 border border-blue-200">
                      원문 {message.primary_count}건
                    </span>
                  )}
                  {message.supplementary_count !== undefined && message.supplementary_count !== null && message.supplementary_count > 0 && (
                    <span className="px-1.5 py-0.2 rounded font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                      보충 {message.supplementary_count}건
                    </span>
                  )}
                  {message.primary_count === undefined && (
                    <span className="px-1.5 py-0.2 rounded font-mono bg-blue-50 text-blue-700 border border-blue-200">
                      출처 {message.sources.length}건 인용
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions: Copy */}
            {!isError && message.content && (
              <button
                type="button"
                onClick={handleCopy}
                aria-label="답변 복사"
                className="flex items-center gap-1 text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                title="답변 복사"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600 font-medium">복사됨</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>복사</span>
                  </>
                )}
              </button>
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
            <div className="mb-2.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-1.5 font-medium animate-in fade-in duration-150">
              <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>[안내: 선택 조건에 부합하는 소식이 없어 전체 기간으로 확장 검색했습니다]</span>
            </div>
          )}

          {/* Content Body */}
          {isError ? (
            <div className="space-y-3 py-1">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p className="font-medium">
                  {message.errorMessage || '네트워크 지연으로 응답이 중단되었습니다.'}
                </p>
              </div>
              {onRetry && (
                <button
                  type="button"
                  onClick={() => onRetry(message.id)}
                  aria-label="답변 다시 시도"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>다시 시도</span>
                </button>
              )}
            </div>
          ) : (
            <div className="markdown-content w-full max-w-full min-w-0 break-words [overflow-wrap:anywhere] [word-break:break-word] text-slate-800 space-y-2">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  pre: ({ children }) => <>{children}</>,
                  code: ({ className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const rawString = React.Children.toArray(children).join('');
                    const isBlock = Boolean(match) || rawString.includes('\n');
                    if (!isBlock) {
                      return (
                        <code
                          className="break-all font-mono text-[12px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }
                    return (
                      <CodeBlock className={className} {...props}>
                        {children}
                      </CodeBlock>
                    );
                  },
                  p: ({ children }) => (
                    <p className="my-2 leading-relaxed break-words [overflow-wrap:anywhere] [word-break:break-word]">
                      {processChildren(children)}
                    </p>
                  ),
                  li: ({ children }) => (
                    <li className="pl-1 leading-relaxed break-words [overflow-wrap:anywhere] [word-break:break-word]">
                      {processChildren(children)}
                    </li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-slate-300 dark:border-slate-700 pl-3 my-2 italic break-words [overflow-wrap:anywhere] [word-break:break-word] text-slate-600 dark:text-slate-400">
                      {processChildren(children)}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="table-wrapper w-full max-w-full min-w-0 overflow-x-auto my-3 border border-slate-200 dark:border-slate-800 rounded-lg overscroll-x-contain">
                      <table className="w-full text-xs text-left border-collapse min-w-[320px]">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 font-semibold">
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {children}
                    </tbody>
                  ),
                  tr: ({ children }) => (
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      {children}
                    </tr>
                  ),
                  th: ({ children }) => (
                    <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                      {children}
                    </td>
                  ),
                  h1: ({ children }) => (
                    <h2 className="text-base font-bold text-slate-900 mt-4 mb-2 break-words [overflow-wrap:anywhere] [word-break:break-word]">
                      {processChildren(children)}
                    </h2>
                  ),
                  h2: ({ children }) => (
                    <h3 className="text-sm font-bold text-slate-900 mt-3.5 mb-2 break-words [overflow-wrap:anywhere] [word-break:break-word]">
                      {processChildren(children)}
                    </h3>
                  ),
                  h3: ({ children }) => (
                    <h4 className="text-xs font-semibold text-slate-900 mt-3 mb-1.5 break-words [overflow-wrap:anywhere] [word-break:break-word]">
                      {processChildren(children)}
                    </h4>
                  ),
                  h4: ({ children }) => (
                    <h5 className="text-xs font-semibold text-slate-900 mt-2.5 mb-1 break-words [overflow-wrap:anywhere] [word-break:break-word]">
                      {processChildren(children)}
                    </h5>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium break-all [overflow-wrap:anywhere]"
                    >
                      {children}
                    </a>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-slate-900">
                      {processChildren(children)}
                    </strong>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>

              {message.status === 'streaming' && isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-blue-600 animate-pulse align-middle" />
              )}

              {!isError && Boolean(message.content) && (
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {resolvedTier ? (
                    <ModelTierBadge
                      tier={resolvedTier}
                      variant="footer"
                      latencyMs={message.latency_ms ?? undefined}
                    />
                  ) : (
                    <span />
                  )}
                  <ExportToolbar
                    messageId={message.id}
                    markdownContent={message.content}
                    sourceTitle={message.sources && message.sources[0]?.title}
                    isStreaming={isStreaming && message.status === 'streaming'}
                    onCopySuccess={() => onCopy?.(message.content)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
