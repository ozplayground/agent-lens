'use client';

import React, { useRef, useState } from 'react';
import { Trash2, Target, Globe } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
import { useToast } from '@/components/ui/Toast';
import { ChatSessionMeta } from '@/types/chat';
import { scopeLabel } from '@/lib/labels';
import DeleteConfirmPopover from './DeleteConfirmPopover';

export interface SessionItemCardProps {
  session: ChatSessionMeta;
  isActive: boolean;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => Promise<void>;
}

export function formatRelativeTime(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!date || isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return '방금 전';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

const DELETE_FAILED_MESSAGE = '대화를 삭제하지 못했습니다.';

export default function SessionItemCard({
  session,
  isActive,
  onSelect,
  onDelete,
}: SessionItemCardProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteBtnRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();

  const dateValue =
    session.updatedAt ||
    session.updated_at ||
    session.createdAt ||
    session.created_at;
  const timeAgo = formatRelativeTime(dateValue);
  const isScoped = session.scopeMode === 'scoped' || session.scope_mode === 'scoped';
  const scopeText = scopeLabel(isScoped ? 'scoped' : 'global');

  const handleCardClick = () => {
    onSelect(session.id);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete(session.id);
    } catch (e: unknown) {
      // 목록은 훅이 다시 읽어 되돌린다. 여기서는 실패를 알린다 (FE-15).
      toast.show({
        message: (e instanceof Error && e.message) || DELETE_FAILED_MESSAGE,
        tone: 'danger',
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  return (
    // 선택 버튼과 삭제 버튼은 형제다 (버튼 안 버튼 금지, FE-12). 삭제 버튼은 카드 오른쪽 위에 겹쳐 놓고,
    // 카드 오른쪽 여백(pr-14 / md:pr-12)이 그 자리를 비워 둔다 (이전 모양과 같은 폭).
    <div className="group relative w-full">
      <button
        type="button"
        aria-current={isActive ? 'true' : undefined}
        data-active={isActive ? 'true' : undefined}
        aria-label={`대화: ${session.title}, ${timeAgo}, ${scopeText} 모드`}
        onClick={handleCardClick}
        className={cn(
          'flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border-l-2 py-2 pr-14 pl-3 text-left transition-colors duration-150 ease-standard md:pr-12',
          isActive ? 'border-accent bg-accent-soft text-fg' : 'border-transparent text-fg hover:bg-surface-muted'
        )}
      >
        {/* 버튼 안은 구문(phrasing) 요소만 둔다 */}
        <span className="block min-w-0 flex-1">
          <span
            className={cn('block truncate text-sm leading-snug', isActive ? 'font-semibold' : 'font-medium')}
            title={session.title}
          >
            {session.title}
          </span>

          <span className="mt-1 flex items-center gap-2">
            {isScoped ? (
              <Badge tone="accent" icon={<Target />}>
                {scopeText}
              </Badge>
            ) : (
              <Badge tone="neutral" icon={<Globe />}>
                {scopeText}
              </Badge>
            )}
            <time className="text-xs text-fg-muted">{timeAgo}</time>
          </span>
        </span>
      </button>

      <IconButton
        ref={deleteBtnRef}
        label={`대화 '${session.title}' 삭제`}
        title="대화 삭제"
        icon={<Trash2 />}
        onClick={() => setIsDeleteOpen(true)}
        className="absolute top-1/2 right-1 -translate-y-1/2 hover:text-danger md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
      />

      <DeleteConfirmPopover
        isOpen={isDeleteOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteOpen(false)}
        isDeleting={isDeleting}
        anchorRef={deleteBtnRef}
      />
    </div>
  );
}
