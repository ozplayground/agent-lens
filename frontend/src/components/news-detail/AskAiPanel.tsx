'use client';

import React, { useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  Copy,
  Check,
  RotateCcw,
  User,
  ShieldCheck,
  Cpu,
  Layers,
  TriangleAlert,
} from 'lucide-react';
import { NewsItem } from '@/types/news';
import MarkdownViewer from '../MarkdownViewer';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { ChipGroup } from '@/components/ui/Chip';
import { Spinner } from '@/components/ui/Spinner';
import { TextField } from '@/components/ui/TextField';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { COPY_STATUS_LABELS } from '@/hooks/useCopyToClipboard';

export interface ChatMessage {
  q: string;
  a: string;
  model?: string;
  time: string;
  isStreaming?: boolean;
  /** 끊기거나 실패한 답의 오류 문구. 있으면 부분 답 아래에 오류와 다시 시도를 보인다. */
  error?: string;
}

interface AskAiPanelProps {
  item: NewsItem;
  question: string;
  setQuestion: (q: string) => void;
  asking: boolean;
  chatHistory: ChatMessage[];
  copiedIndex: number | null;
  /** 복사에 실패한 답변 번호. 그 답변의 복사 버튼이 `복사 실패` 를 보인다. */
  copyFailedIndex?: number | null;
  onAsk: (queryToAsk?: string) => void;
  onCopy: (text: string, index: number) => void;
  onClearChat: () => void;
  /** 실패한 답을 같은 질문으로 다시 요청한다. */
  onRetry?: (index: number) => void;
}

export const QUICK_PROMPTS = [
  {
    label: '핵심 원리 및 구조',
    icon: Cpu,
    query: '이 기술의 핵심 동작 원리와 아키텍처 구조를 구체적으로 설명해줘',
  },
  {
    label: '실무 프로젝트 도입',
    icon: Layers,
    query: '우리 개발 프로젝트와 워크플로우에 이 기술을 어떻게 도입/적용할 수 있어?',
  },
  {
    label: '차별점 및 한계',
    icon: Sparkles,
    query: '기존의 유사 기술이나 방식과 비교했을 때 차별점, 장점, 한계점은 뭐야?',
  },
  {
    label: '보안 및 샌드박스',
    icon: ShieldCheck,
    query: '자율 에이전트 도입 시 보안 격리나 샌드박스 관점에서 검토해야 할 점은?',
  },
];

export default function AskAiPanel({
  question,
  setQuestion,
  asking,
  chatHistory,
  copiedIndex,
  copyFailedIndex = null,
  onAsk,
  onCopy,
  onClearChat,
  onRetry,
}: AskAiPanelProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  // 머리줄에는 마지막으로 받은 실제 응답 엔진(meta)을 보인다. 아직 없으면 엔진 이름을 짓지 않는다 (D-25).
  const engine = [...chatHistory].reverse().find((c) => c.model)?.model;
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView?.({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  }, [chatHistory, asking, reduceMotion]);

  // 질문 입력의 Escape 는 대화상자를 닫지 않는다 (R26). 기본 동작을 막으면 오버레이 스택이 무시하고,
  // 포커스를 Ask AI 탭 패널로 옮긴다. 패널에서 누른 다음 Escape 는 지금처럼 맨 위 레이어를 닫는다.
  const handleQuestionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Escape' && e.key !== 'Esc') return;
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    const panel = e.currentTarget.closest<HTMLElement>('[role="tabpanel"]');
    panel?.focus();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col md:min-h-[28rem]">
      {/* 머리줄: 제목 + 대화 초기화 */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2 md:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Bot aria-hidden="true" className="size-4 shrink-0 text-accent" />
          <span className="text-sm font-semibold text-fg">Deep-Dive AI 대화형 질의응답</span>
          <Badge tone="success">{engine ? `응답 엔진: ${engine}` : '실시간 스트리밍'}</Badge>
        </div>
        {chatHistory.length > 0 && (
          <Button variant="ghost" size="sm" leadingIcon={<RotateCcw />} onClick={onClearChat}>
            대화 초기화
          </Button>
        )}
      </div>

      {/* 빠른 질문: 한 줄 가로 스크롤 */}
      <div className="shrink-0 border-b border-border px-4 py-2 md:px-5">
        <ChipGroup label="빠른 질문" scrollable bleed>
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p.query}
              type="button"
              onClick={() => onAsk(p.query)}
              disabled={asking}
              className="inline-flex h-11 shrink-0 snap-start items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-sm font-medium whitespace-nowrap text-fg-muted transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-fg disabled:cursor-not-allowed disabled:opacity-50 md:h-8"
            >
              <p.icon aria-hidden="true" className="size-4" />
              {p.label}
            </button>
          ))}
        </ChipGroup>
      </div>

      {/* 대화 */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-5">
        {chatHistory.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-2 py-8 text-center">
            <span
              aria-hidden="true"
              className="inline-flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent-soft-fg"
            >
              <Bot className="size-6" />
            </span>
            <div className="flex max-w-md flex-col gap-1">
              <h4 className="text-base font-semibold text-fg break-keep">이 소식에 대해 무엇이든 질문해보세요</h4>
              <p className="text-sm leading-relaxed text-fg-muted">
                단순 요약이 아닌, 실무 아키텍처 연동 방법, 다른 프레임워크와의 차이점, 하네스 격리 및 보안 주의사항까지 기사 맥락을 바탕으로 전문 분석을 제공합니다.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {chatHistory.map((c, i) => (
              <div key={i} className="flex flex-col gap-3">
                {/* 사용자 질문 */}
                <div className="flex items-start justify-end gap-2">
                  <div className="max-w-[85%] rounded-xl rounded-tr-sm bg-accent-soft px-3 py-2.5 text-sm text-fg">
                    <p className="m-0 font-medium break-words [overflow-wrap:anywhere]">{c.q}</p>
                    <div className="mt-1 text-right text-xs text-fg-muted">{c.time}</div>
                  </div>
                  <span
                    aria-hidden="true"
                    className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-fg-muted"
                  >
                    <User className="size-3.5" />
                  </span>
                </div>

                {/* AI 답변 */}
                <div className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-success-soft text-success"
                  >
                    <Bot className="size-4" />
                  </span>
                  <div className="min-w-0 max-w-full flex-1 rounded-xl rounded-tl-sm border border-border bg-surface p-3">
                    <div className="mb-2 flex items-center justify-between gap-2 border-b border-border pb-1.5 text-xs text-fg-subtle">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <Sparkles aria-hidden="true" className="size-3.5 shrink-0 text-accent" />
                        <span className="truncate font-semibold text-accent">{c.model || 'AgentLens AI'}</span>
                        <span className="shrink-0">· {c.time}</span>
                      </div>
                      <div className="flex shrink-0 items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCopy(c.a, i)}
                          disabled={c.isStreaming || !c.a || Boolean(c.error)}
                          title="답변 복사"
                          leadingIcon={
                            copyFailedIndex === i ? <TriangleAlert /> : copiedIndex === i ? <Check /> : <Copy />
                          }
                          className={
                            copyFailedIndex === i
                              ? 'text-xs text-danger'
                              : copiedIndex === i
                                ? 'text-xs text-success'
                                : 'text-xs'
                          }
                        >
                          {copyFailedIndex === i
                            ? COPY_STATUS_LABELS.failed
                            : copiedIndex === i
                              ? COPY_STATUS_LABELS.copied
                              : COPY_STATUS_LABELS.idle}
                        </Button>
                        <span className="sr-only" aria-live="polite">
                          {copyFailedIndex === i ? COPY_STATUS_LABELS.failed : ''}
                        </span>
                      </div>
                    </div>
                    {c.error && !c.a ? null : c.isStreaming && !c.a ? (
                      <div className="flex items-center gap-2 py-2 text-sm text-fg-muted">
                        <Spinner className="text-accent" />
                        <span>AI가 실시간 스트리밍 답변을 생성하는 중입니다...</span>
                      </div>
                    ) : (
                      <div className="relative">
                        <MarkdownViewer content={c.a} />
                        {c.isStreaming && (
                          <span
                            aria-hidden="true"
                            className="ml-1 inline-block h-4 w-2 bg-accent align-middle motion-safe:animate-pulse"
                          />
                        )}
                      </div>
                    )}
                    {c.error ? (
                      <InlineAlert
                        tone="danger"
                        className="mt-2"
                        action={
                          onRetry ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              leadingIcon={<RotateCcw />}
                              onClick={() => onRetry(i)}
                              disabled={asking}
                              aria-label="답변 다시 시도"
                            >
                              다시 시도
                            </Button>
                          ) : undefined
                        }
                      >
                        {c.error}
                      </InlineAlert>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 입력: 바닥 고정 */}
      <div className="shrink-0 border-t border-border bg-surface px-4 py-3 md:px-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAsk();
          }}
          className="flex items-end gap-2"
        >
          <TextField
            label="질문 입력"
            hideLabel
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleQuestionKeyDown}
            placeholder="이 기사에 대해 질문하세요"
            disabled={asking}
            enterKeyHint="send"
            containerClassName="flex-1"
          />
          <Button
            type="submit"
            variant="primary"
            loading={asking}
            disabled={!question.trim()}
            leadingIcon={<Send />}
          >
            전송
          </Button>
        </form>
      </div>
    </div>
  );
}
