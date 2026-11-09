'use client';

import React, { useRef, useState } from 'react';
import { Trash2, Target, Globe } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
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

export default function SessionItemCard({
  session,
  isActive,
  onSelect,
  onDelete,
}: SessionItemCardProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteBtnRef = useRef<HTMLButtonElement>(null);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(session.id);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete(session.id);
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  return (
    <div className="group relative w-full">
      <div
        role="button"
        tabIndex={0}
        aria-current={isActive ? 'true' : undefined}
        data-active={isActive ? 'true' : undefined}
        aria-label={`대화: ${session.title}, ${timeAgo}, ${scopeText} 모드`}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border-l-2 py-2 pr-1 pl-3 text-left transition-colors duration-150 ease-standard',
          isActive ? 'border-accent bg-accent-soft text-fg' : 'border-transparent text-fg hover:bg-surface-muted'
        )}
      >
        <div className="min-w-0 flex-1">
          <span
            className={cn('block truncate text-sm leading-snug', isActive ? 'font-semibold' : 'font-medium')}
            title={session.title}
          >
            {session.title}
          </span>

          <div className="mt-1 flex items-center gap-2">
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
          </div>
        </div>

        <IconButton
          ref={deleteBtnRef}
          label={`대화 '${session.title}' 삭제`}
          title="대화 삭제"
          icon={<Trash2 />}
          onClick={(e) => {
            e.stopPropagation();
            setIsDeleteOpen(true);
          }}
          onKeyDown={(e) => e.stopPropagation()}
          className="hover:text-danger md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
        />
      </div>

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
