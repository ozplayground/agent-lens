'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Globe,
  Search,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { ChatStatusPayload, ChatStatusStep } from '@/types/chat';
import { cn } from '@/lib/cn';

export interface WorkflowStepTrackerProps {
  currentStatus: ChatStatusPayload | null;
  stepHistory?: ChatStatusPayload[];
  isStreaming: boolean;
  isDone: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  fallbackNotice?: string | null;
  className?: string;
}

const STEP_ICONS: Record<ChatStatusStep, React.ReactNode> = {
  thinking: <Sparkles aria-hidden="true" className="size-3.5 shrink-0 text-accent motion-safe:animate-pulse" />,
  tool_calling: <Search aria-hidden="true" className="size-3.5 shrink-0 text-success motion-safe:animate-pulse" />,
  extracting_source: <Globe aria-hidden="true" className="size-3.5 shrink-0 text-accent motion-safe:animate-pulse" />,
  synthesizing: <FileText aria-hidden="true" className="size-3.5 shrink-0 text-accent motion-safe:animate-pulse" />,
};

export default function WorkflowStepTracker({
  currentStatus,
  stepHistory = [],
  isStreaming,
  isDone,
  isExpanded: controlledExpanded,
  onToggleExpand,
  fallbackNotice,
  className = '',
}: WorkflowStepTrackerProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  };

  const hasContent = (stepHistory && stepHistory.length > 0) || currentStatus !== null;
  if (!hasContent) return null;

  const stepCount = stepHistory.length || (currentStatus ? 1 : 0);
  const activeLabel = currentStatus?.label || '심층 분석 진행 중...';
  const progress = currentStatus?.progress ?? 50;

  // 1. When streaming is in progress and not done: show live progress animation
  if (isStreaming && !isDone) {
    const icon = currentStatus ? STEP_ICONS[currentStatus.step] : <Loader2 aria-hidden="true" className="size-3.5 shrink-0 animate-spin text-accent" />;

    return (
      <div
        role="region"
        aria-label="에이전틱 워크플로우 진행 상태"
        className={cn('mb-3 rounded-xl border border-border bg-surface-muted p-2.5 text-xs', className)}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 font-medium text-fg min-w-0">
            {icon}
            <span className="truncate">{activeLabel}</span>
          </div>
          <span className="shrink-0 font-semibold tabular-nums text-fg-muted">
            {progress}%
          </span>
        </div>

        {/* Live Progress Bar */}
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="심층 분석 진행률"
          className="h-1.5 w-full overflow-hidden rounded-full bg-border"
        >
          <div
            style={{ width: `${progress}%` }}
            className="h-full rounded-full bg-accent transition-[width] duration-300 ease-standard"
          />
        </div>

        {currentStatus?.query && (
          <div className="mt-1.5 flex min-w-0 items-center gap-1 text-fg-muted">
            <Search aria-hidden="true" className="size-3 shrink-0 text-success" />
            <span className="truncate">검색어: &quot;{currentStatus.query}&quot;</span>
          </div>
        )}
      </div>
    );
  }

  // 2. When completed (isDone): 28px slim folding accordion
  return (
    <div className={cn('mb-3 overflow-hidden rounded-lg border border-border bg-surface-muted text-xs', className)}>
      {/* 28px Slim Accordion Header */}
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={handleToggle}
        className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 px-2.5 text-xs font-medium text-fg-muted transition-colors duration-150 ease-standard select-none hover:bg-surface hover:text-fg md:min-h-7"
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <CheckCircle2 aria-hidden="true" className="size-3.5 shrink-0 text-success" />
          <span>[✓] 심층 분석 과정 {stepCount}단계 완료</span>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-fg-subtle">
          <span>{isExpanded ? '접기' : '펼치기'}</span>
          {isExpanded ? <ChevronUp aria-hidden="true" className="size-3" /> : <ChevronDown aria-hidden="true" className="size-3" />}
        </div>
      </button>

      {/* Accordion History Details */}
      {isExpanded && (
        <div
          data-testid="workflow-history-details"
          className="space-y-1.5 border-t border-border bg-surface p-2.5 pt-1.5 motion-safe:animate-fade-in"
        >
          {fallbackNotice && (
            <div className="flex items-center gap-1.5 rounded-md bg-warning-soft p-1.5 text-warning">
              <AlertCircle aria-hidden="true" className="size-3 shrink-0" />
              <span>{fallbackNotice}</span>
            </div>
          )}

          {stepHistory.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-2 py-0.5 text-fg-muted"
            >
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-success" />
                <span className="truncate">{item.label}</span>
                {item.query && (
                  <span className="max-w-full truncate rounded bg-success-soft px-1.5 font-mono text-success">
                    &quot;{item.query}&quot;
                  </span>
                )}
              </div>
              <span className="shrink-0 tabular-nums text-fg-subtle">
                {item.progress ? `${item.progress}%` : '완료'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
