'use client';

import React from 'react';
import { Globe, Target } from 'lucide-react';
import { ScopeMode, ChatSourceDetailResponse } from '@/types/chat';
import { NewsItem } from '@/types/news';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ScrollRow } from '@/components/ui/ScrollRow';
import { scopeLabel } from '@/lib/labels';
import ActiveSourceChip from './ActiveSourceChip';

export interface ChatContextBarProps {
  scopeMode: ScopeMode;
  onScopeChange: (nextScope: ScopeMode) => void;
  activeSource: NewsItem | ChatSourceDetailResponse | null;
  onRemoveSource: () => void;
  isStreaming: boolean;
}

const SCOPE_OPTIONS = [
  { value: 'scoped', label: scopeLabel('scoped'), icon: <Target /> },
  { value: 'global', label: scopeLabel('global'), icon: <Globe /> },
] as const;

/**
 * 챗 헤더 아래 맥락 줄 (spec 설계 6): 검색 스코프 토글 + 기사 컨텍스트 칩.
 * 한 줄(테두리 포함 `md:h-11` 아래 경계 = 사이드바 머리 영역 아래 경계)이고 넘치면 가로로 스크롤한다 (`ScrollRow`).
 * 열 맞춤 (spec 14.6): 바깥 `px-4 md:px-6`, 안쪽 `mx-auto w-full max-w-3xl` — 메시지 열·입력 영역과 같은 규칙.
 * 기사 제목은 칩 안에만 쓴다.
 */
export default function ChatContextBar({
  scopeMode,
  onScopeChange,
  activeSource,
  onRemoveSource,
  isStreaming,
}: ChatContextBarProps) {
  return (
    <div
      data-chat-context-bar=""
      className="flex min-h-11 shrink-0 items-center border-b border-border bg-surface px-4 py-1 md:h-11 md:px-6 md:py-0"
    >
      <ScrollRow label="검색 스코프" className="mx-auto w-full max-w-3xl">
        <SegmentedControl<ScopeMode>
          label="검색 스코프 모드"
          options={SCOPE_OPTIONS}
          value={scopeMode}
          onChange={onScopeChange}
          className="shrink-0"
        />
        {activeSource ? (
          <div className="min-w-0 shrink-0">
            <ActiveSourceChip source={activeSource} onRemove={onRemoveSource} disabled={isStreaming} />
          </div>
        ) : null}
      </ScrollRow>
    </div>
  );
}
