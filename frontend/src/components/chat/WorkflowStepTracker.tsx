'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Globe,
  Scale,
  Search,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { ChatStatusPayload, ChatStatusStep } from '@/types/chat';

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
  thinking: <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />,
  tool_calling: <Search className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />,
  observing: <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 animate-pulse" />,
  extracting_source: <Globe className="w-3.5 h-3.5 text-blue-600 animate-pulse" />,
  evaluating_sufficiency: <Scale className="w-3.5 h-3.5 text-amber-600 animate-pulse" />,
  agentic_searching: <Search className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />,
  synthesizing: <FileText className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />,
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
    const icon = currentStatus ? STEP_ICONS[currentStatus.step] : <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />;

    return (
      <div
        role="region"
        aria-label="에이전틱 워크플로우 진행 상태"
        className={`mb-3 p-2.5 rounded-xl bg-slate-50/90 border border-slate-200 text-xs shadow-2xs ${className}`}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 font-medium text-slate-700 truncate">
            {icon}
            <span className="truncate">{activeLabel}</span>
          </div>
          <span className="text-[11px] font-mono font-semibold text-slate-500 shrink-0">
            {progress}%
          </span>
        </div>

        {/* Live Progress Bar */}
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden"
        >
          <div
            style={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-300 ease-out"
          />
        </div>

        {currentStatus?.query && (
          <div className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1 truncate">
            <Search className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate">검색어: &quot;{currentStatus.query}&quot;</span>
          </div>
        )}
      </div>
    );
  }

  // 2. When completed (isDone): 28px slim folding accordion
  return (
    <div className={`mb-3 rounded-lg border border-slate-200 bg-slate-50/70 overflow-hidden text-xs ${className}`}>
      {/* 28px Slim Accordion Header */}
      <button
        type="button"
        role="button"
        aria-expanded={isExpanded}
        onClick={handleToggle}
        className="w-full h-7 px-2.5 flex items-center justify-between text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>[✓] 심층 분석 과정 {stepCount}단계 완료</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <span>{isExpanded ? '접기' : '펼치기'}</span>
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </div>
      </button>

      {/* Accordion History Details */}
      {isExpanded && (
        <div
          data-testid="workflow-history-details"
          className="p-2.5 pt-1 border-t border-slate-200/70 bg-white/50 space-y-1.5 animate-in fade-in duration-150"
        >
          {fallbackNotice && (
            <div className="flex items-center gap-1.5 p-1.5 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
              <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
              <span>{fallbackNotice}</span>
            </div>
          )}

          {stepHistory.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-2 text-[11px] text-slate-600 py-0.5"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.query && (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px]">
                    &quot;{item.query}&quot;
                  </span>
                )}
              </div>
              <span className="text-slate-400 font-mono text-[10px] shrink-0">
                {item.progress ? `${item.progress}%` : '완료'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
