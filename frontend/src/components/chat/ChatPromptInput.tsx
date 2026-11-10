'use client';

import React, { useRef } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { ScopeMode, ModelTier } from '@/types/chat';
import { cn } from '@/lib/cn';
import { Textarea } from '@/components/ui/Textarea';
import { IconButton } from '@/components/ui/IconButton';
import ChatModelSelector from './ChatModelSelector';
import { useMediaQuery } from '@/hooks/useMediaQuery';

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

/** 입력창 자동 높이의 최대값(px). */
const MAX_TEXTAREA_HEIGHT = 180;

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
  // 줄어든 움직임을 원하면 부드러운 스크롤 대신 바로 이동한다 (spec 1.2).
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const defaultPlaceholder =
    placeholder ||
    (scopeMode === 'scoped'
      ? '선택한 기사 본문을 바탕으로 질문하세요'
      : '수집된 AI 에이전트 소식 전체에 대해 질문하세요');

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

  // 모바일 가상 키보드가 입력창을 가리지 않게 포커스 뒤 끝으로 스크롤한다 (UI-10).
  const handleFocus = () => {
    setTimeout(() => {
      textareaRef.current?.scrollIntoView({ block: 'end', behavior: reduceMotion ? 'auto' : 'smooth' });
    }, 100);
  };

  return (
    <div className="flex w-full max-w-full flex-col gap-2 overflow-x-hidden">
      <Textarea
        ref={textareaRef}
        label="질문 입력"
        hideLabel
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        disabled={disabled || isStreaming}
        rows={1}
        maxHeight={MAX_TEXTAREA_HEIGHT}
        placeholder={defaultPlaceholder}
        aria-invalid={isOverLimit ? true : undefined}
        className="max-h-[180px] overflow-y-auto sm:text-sm"
      />

      <div className="flex min-w-0 items-center justify-between gap-2">
        {/* Left: Model Selector, Scope Indicator & Shortcut Tip */}
        <div className="flex min-w-0 items-center gap-2 text-xs text-fg-subtle">
          {selectedTier && onSelectTier && (
            <ChatModelSelector
              selectedTier={selectedTier}
              onSelectTier={onSelectTier}
              isStreaming={isStreaming}
            />
          )}
          <span className="hidden truncate lg:inline">Enter: 전송, Shift+Enter: 줄바꿈</span>
        </div>

        {/* Right: Char Counter & Action Button */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <span className={cn('text-xs tabular-nums', isOverLimit ? 'font-semibold text-danger' : 'text-fg-subtle')}>
            {value.length} / {maxLength}
          </span>

          {isStreaming ? (
            <IconButton
              label="답변 생성 중단"
              icon={<Square className="fill-current" />}
              variant="danger"
              onClick={onStopGenerating}
            />
          ) : (
            <IconButton
              label="질문 전송"
              icon={<ArrowUp />}
              variant={canSubmit ? 'primary' : 'secondary'}
              onClick={handleSubmit}
              disabled={!canSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
}
