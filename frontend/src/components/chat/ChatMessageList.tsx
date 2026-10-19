'use client';

import React, { useRef, useEffect } from 'react';
import { Bot, ArrowRight } from 'lucide-react';
import { ChatMessage, ChatTimelineItem } from '@/types/chat';
import ChatMessageItem from './ChatMessageItem';
import ModelChangeDivider from './ModelChangeDivider';

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

const DEFAULT_SUGGESTIONS = [
  '💡 FastMCP로 파이썬 기반 경량 MCP 서버 구축하는 방법',
  '🔄 LangGraph v0.2의 분기 제어 및 시간 여행 디버깅 원리',
  '📊 SWE-bench Multimodal 하네스의 주요 평가 지표',
  '⚡ 최근 24시간 내 가장 주목받은 에이전트 오픈소스 동향',
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, timelineItems, isStreaming]);

  const hasItems = (timelineItems && timelineItems.length > 0) || messages.length > 0;

  if (!hasItems) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center max-w-2xl mx-auto my-auto animate-in fade-in duration-300">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg mb-4">
          <Bot className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mb-2">
          AgentLens AI 챗 워크스페이스
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 max-w-md">
          AI 에이전트·하네스·MCP 기술 심층 질의 및 수집된 코퍼스 기반의 고신호 RAG 분석을 경험해보세요.
        </p>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
          {DEFAULT_SUGGESTIONS.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPromptSuggestion(suggestion)}
              className="p-3 rounded-xl bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 text-xs text-slate-700 hover:text-blue-700 transition-all shadow-2xs cursor-pointer flex items-center justify-between group"
            >
              <span className="line-clamp-2 pr-2 font-medium">{suggestion}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full px-3 sm:px-6 py-4 space-y-4"
    >
      <div className="max-w-4xl mx-auto w-full min-w-0">
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
