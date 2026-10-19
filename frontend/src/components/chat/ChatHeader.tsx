'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Globe, Target, Bot, History } from 'lucide-react';
import { ScopeMode, ModelTier } from '@/types/chat';
import { NewsItem } from '@/types/news';
import { ChatSourceDetailResponse } from '@/types/chat';
import ActiveSourceChip from './ActiveSourceChip';
import ChatModelSelector from './ChatModelSelector';

export interface ChatHeaderProps {
  scopeMode: ScopeMode;
  onScopeChange: (nextScope: ScopeMode) => void;
  activeSource: NewsItem | ChatSourceDetailResponse | null;
  onRemoveSource: () => void;
  onNewChat: () => void;
  onToggleHistoryDrawer?: () => void;
  isHistoryOpen?: boolean;
  isStreaming: boolean;
  showNewChatButton?: boolean;
  selectedTier?: ModelTier;
  onSelectTier?: (tier: ModelTier) => void;
}

export default function ChatHeader({
  scopeMode,
  onScopeChange,
  activeSource,
  onRemoveSource,
  onNewChat,
  onToggleHistoryDrawer,
  isHistoryOpen = false,
  isStreaming,
  showNewChatButton = true,
  selectedTier,
  onSelectTier,
}: ChatHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-xs sticky top-0 z-30 px-3 sm:px-6 py-2.5 shadow-2xs">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        {/* Left: Back to Feed & Title */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            aria-label="피드로 돌아가기"
            title="뉴스 피드로 돌아가기"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline">피드</span>
          </Link>

          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-2xs">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-bold text-slate-900 tracking-tight">
              AgentLens <span className="text-blue-600">AI 챗</span>
            </span>
          </div>
        </div>

        {/* Center / Scope Control & Active Source */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            role="group"
            aria-label="검색 스코프 모드"
            className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600"
          >
            <button
              type="button"
              onClick={() => onScopeChange('scoped')}
              aria-pressed={scopeMode === 'scoped'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                scopeMode === 'scoped'
                  ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                  : 'hover:text-slate-900 text-slate-600'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-indigo-600" />
              <span>단일 기사 (Scoped)</span>
            </button>

            <button
              type="button"
              onClick={() => onScopeChange('global')}
              aria-pressed={scopeMode === 'global'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                scopeMode === 'global'
                  ? 'bg-white text-blue-700 font-semibold shadow-2xs'
                  : 'hover:text-slate-900 text-slate-600'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>전체 코퍼스 (Global)</span>
            </button>
          </div>

          {activeSource && (
            <div className="shrink-0">
              <ActiveSourceChip
                source={activeSource}
                onRemove={onRemoveSource}
                disabled={isStreaming}
              />
            </div>
          )}
        </div>

        {/* Right: Actions (Model Selector #1, History Drawer, New Chat) */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {selectedTier && onSelectTier && (
            <ChatModelSelector
              selectedTier={selectedTier}
              onSelectTier={onSelectTier}
              isStreaming={isStreaming}
              variant="header-chip"
            />
          )}

          {onToggleHistoryDrawer && (
            <button
              type="button"
              onClick={onToggleHistoryDrawer}
              aria-label="대화 기록 보기"
              aria-expanded={isHistoryOpen}
              aria-controls="chat-history-drawer"
              title="대화 기록"
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors text-xs cursor-pointer border border-slate-200"
            >
              <History className="w-4 h-4" />
            </button>
          )}

          {showNewChatButton && (
            <button
              type="button"
              onClick={onNewChat}
              disabled={isStreaming}
              aria-label="새 대화 시작"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>새 대화</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
