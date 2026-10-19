'use client';

import React, { useRef, useEffect } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { ScopeMode, ModelTier } from '@/types/chat';
import ChatModelSelector from './ChatModelSelector';

export interface ChatPromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (prompt: string) => void;
  onStopGenerating: () => void;
  isStreaming: boolean;
  scopeMode: ScopeMode;
  disabled?: boolean;
  maxLength?: number;
  placeholder?: string;
  selectedTier?: ModelTier;
  onSelectTier?: (tier: ModelTier) => void;
}

export default function ChatPromptInput({
  value,
  onChange,
  onSubmit,
  onStopGenerating,
  isStreaming,
  scopeMode,
  disabled = false,
  maxLength = 2000,
  placeholder,
  selectedTier,
  onSelectTier,
}: ChatPromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const defaultPlaceholder =
    placeholder ||
    (scopeMode === 'scoped'
      ? '선택된 기사 본문을 기반으로 심층 질문을 입력하세요... (Enter: 전송, Shift+Enter: 줄바꿈)'
      : '전체 AI 에이전트 뉴스 코퍼스에 대해 자유롭게 질문하세요... (Enter: 전송, Shift+Enter: 줄바꿈)');

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Prevent double send in Korean/CJK IME composition
      if (e.nativeEvent.isComposing) {
        return;
      }
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming || disabled || value.length > maxLength) {
      return;
    }
    onSubmit(trimmed);
  };

  const isOverLimit = value.length > maxLength;
  const canSubmit = value.trim().length > 0 && !isStreaming && !disabled && !isOverLimit;

  const handleFocus = () => {
    setTimeout(() => {
      textareaRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-white border border-slate-200 rounded-2xl shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all p-2.5 sm:p-3 text-slate-800">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          disabled={disabled || isStreaming}
          rows={1}
          placeholder={defaultPlaceholder}
          aria-label="질문 입력"
          className="w-full resize-none bg-transparent text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden leading-relaxed max-h-[180px] overflow-y-auto px-1 pt-1"
        />
      </div>

      <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-100 text-xs">
        {/* Left: Model Selector, Scope Indicator & Shortcut Tip */}
        <div className="flex items-center gap-2 text-slate-400 min-w-0">
          {selectedTier && onSelectTier && (
            <ChatModelSelector
              selectedTier={selectedTier}
              onSelectTier={onSelectTier}
              isStreaming={isStreaming}
              variant="inline-chip"
            />
          )}
          <span className="hidden sm:inline text-[11px] font-mono">
            {scopeMode === 'scoped' ? '🎯 Scoped Focus' : '🌐 Global RAG'}
          </span>
          <span className="hidden lg:inline text-[11px] text-slate-400">
            • Enter: 전송, Shift+Enter: 줄바꿈
          </span>
        </div>

        {/* Right: Char Counter & Action Button */}
        <div className="flex items-center gap-2.5 ml-auto">
          <span
            className={`font-mono text-[11px] ${
              isOverLimit ? 'text-red-600 font-bold' : 'text-slate-400'
            }`}
          >
            {value.length} / {maxLength}
          </span>

          {isStreaming ? (
            <button
              type="button"
              onClick={onStopGenerating}
              aria-label="답변 생성 중단"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">중단</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              aria-label="질문 전송"
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-2xs ${
                canSubmit
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              <ArrowUp className="w-4 h-4" />
              <span className="hidden sm:inline">전송</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
