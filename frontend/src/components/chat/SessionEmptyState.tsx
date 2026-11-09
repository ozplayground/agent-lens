'use client';

import React from 'react';
import { MessageSquareDashed, SearchX, Plus } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export interface SessionEmptyStateProps {
  isSearchResultEmpty?: boolean;
  searchQuery?: string;
  onNewChat?: () => void;
  onClearSearch?: () => void;
}

export default function SessionEmptyState({
  isSearchResultEmpty = false,
  searchQuery = '',
  onNewChat,
  onClearSearch,
}: SessionEmptyStateProps) {
  if (isSearchResultEmpty) {
    return (
      <EmptyState
        className="py-6"
        icon={<SearchX />}
        title="검색 결과가 없습니다"
        description={
          <span className="block break-keep [overflow-wrap:anywhere]">
            &apos;{searchQuery}&apos;에 해당하는 대화가 없습니다.
          </span>
        }
        action={
          onClearSearch ? (
            <Button variant="ghost" onClick={onClearSearch}>
              검색어 초기화
            </Button>
          ) : null
        }
      />
    );
  }

  return (
    <EmptyState
      className="py-6"
      icon={<MessageSquareDashed />}
      title="저장된 대화 기록이 없습니다"
      description="새로운 대화를 시작하여 에이전트 기술과 뉴스를 탐색해보세요."
      action={
        onNewChat ? (
          <Button variant="primary" leadingIcon={<Plus />} onClick={onNewChat}>
            새 대화 시작
          </Button>
        ) : null
      }
    />
  );
}
