'use client';

import React, { useRef, useEffect } from 'react';
import { Bot, ArrowRight, Server, GitBranch, ChartColumn, TrendingUp, type LucideIcon } from 'lucide-react';
import { ChatMessage, ChatTimelineItem } from '@/types/chat';
import ChatMessageItem from './ChatMessageItem';
import ModelChangeDivider from './ModelChangeDivider';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export interface ChatMessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingMessageId?: string;
  onSelectPromptSuggestion: (promptText: string) => void;
  onRetryMessage: (messageId: string) => void;
  onCopyMessage: (content: string) => void;
  onOpenSourceDetail?: (sourceId: number) => void;
  timelineItems?: ChatTimelineItem[];
}

// 추천 질문: 글자에는 그림 이모지를 두지 않고 카드 앞에 lucide 아이콘을 그린다 (R44).
const DEFAULT_SUGGESTIONS: { icon: LucideIcon; text: string }[] = [
  { icon: Server, text: 'FastMCP로 파이썬 기반 경량 MCP 서버 구축하는 방법' },
  { icon: GitBranch, text: 'LangGraph v0.2의 분기 제어 및 시간 여행 디버깅 원리' },
  { icon: ChartColumn, text: 'SWE-bench Multimodal 하네스의 주요 평가 지표' },
  { icon: TrendingUp, text: '최근 24시간 내 가장 주목받은 에이전트 오픈소스 동향' },
];

export default function ChatMessageList({
  messages,
  isStreaming,
  streamingMessageId,
  onSelectPromptSuggestion,
  onRetryMessage,
  onCopyMessage,
  onOpenSourceDetail,
  timelineItems,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  // 줄어든 움직임을 원하면 부드러운 스크롤 대신 바로 이동한다 (spec 1.2).
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [messages, timelineItems, isStreaming, reduceMotion]);

  const hasItems = (timelineItems && timelineItems.length > 0) || messages.length > 0;

  if (!hasItems) {
    return (
      <div className="w-full max-w-full min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 md:px-6">
        {/* 메시지 열: 맥락 줄·입력 영역과 같은 열 규칙 (바깥 px-4 md:px-6, 안쪽 mx-auto w-full max-w-3xl) */}
        <div data-chat-column="" className="mx-auto flex min-h-full w-full max-w-3xl min-w-0 flex-col">
          <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center py-8 text-center motion-safe:animate-fade-in">
            <div
              aria-hidden="true"
              className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-accent-solid text-on-accent"
            >
              <Bot className="size-7" />
            </div>

            <h2 className="mb-2 text-xl font-semibold text-fg">AgentLens AI 챗 워크스페이스</h2>

            <p className="mb-6 max-w-md text-sm leading-relaxed text-fg-muted">
              AI 에이전트·하네스·MCP 기술 심층 질의 및 수집된 소식 기반의 고신호 RAG 분석을 경험해보세요.
            </p>

            <div className="grid w-full grid-cols-1 gap-2.5 text-left sm:grid-cols-2">
              {DEFAULT_SUGGESTIONS.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => onSelectPromptSuggestion(text)}
                  className="group flex min-h-11 items-center justify-between gap-2 text-left rounded-xl border border-border bg-surface p-3 text-sm text-fg shadow-card transition-colors duration-150 ease-standard hover:border-border-strong hover:bg-surface-muted"
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0 text-accent" />
                  <span className="min-w-0 flex-1 line-clamp-2 font-medium">{text}</span>
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full px-4 py-4 md:px-6"
    >
      <div data-chat-column="" className="mx-auto w-full max-w-3xl min-w-0">
        {timelineItems && timelineItems.length > 0
          ? timelineItems.map((item) =>
              item.type === 'message' ? (
                <ChatMessageItem
                  key={item.data.id}
                  message={item.data}
                  isStreaming={isStreaming && item.data.id === streamingMessageId}
                  onRetry={onRetryMessage}
                  onCopy={onCopyMessage}
                  onOpenSourceDetail={onOpenSourceDetail}
                />
              ) : (
                <ModelChangeDivider
                  key={item.data.id}
                  previousTier={item.data.previousTier}
                  newTier={item.data.newTier}
                  timestamp={item.data.timestamp}
                />
              )
            )
          : messages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                isStreaming={isStreaming && msg.id === streamingMessageId}
                onRetry={onRetryMessage}
                onCopy={onCopyMessage}
                onOpenSourceDetail={onOpenSourceDetail}
              />
            ))}
        <div ref={bottomRef} className="h-2" />
      </div>
    </div>
  );
}
