'use client';

import React, { useState } from 'react';
import { Trash2, MessageSquare, Target, Globe } from 'lucide-react';
import { ChatSessionMeta } from '@/types/chat';
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

  const dateValue =
    session.updatedAt ||
    session.updated_at ||
    session.createdAt ||
    session.created_at;
  const timeAgo = formatRelativeTime(dateValue);
  const isScoped = session.scopeMode === 'scoped' || session.scope_mode === 'scoped';

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
    <div className="relative group w-full">
      <div
        role="button"
        tabIndex={0}
        aria-current={isActive ? 'true' : undefined}
        aria-label={`대화: ${session.title}, ${timeAgo}, ${isScoped ? '기사 집중 모드' : '전체 소식 모드'}`}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between p-2.5 rounded-lg border-l-4 transition-all cursor-pointer text-left ${
          isActive
            ? 'border-l-indigo-600 bg-indigo-50/70 text-indigo-950 font-medium shadow-2xs'
            : 'border-l-transparent hover:bg-slate-100 text-slate-700'
        }`}
      >
        <div className="flex-1 min-w-0 mr-2">
          {/* Top row: Title */}
          <div className="flex items-center gap-1.5">
            <span
              className={`truncate text-xs font-medium leading-snug ${
                isActive ? 'text-indigo-900 font-semibold' : 'text-slate-800'
              }`}
              title={session.title}
            >
              {session.title}
            </span>
          </div>

          {/* Bottom row: Scope Badge & Relative Time */}
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
            {isScoped ? (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700">
                <Target className="w-2.5 h-2.5 text-indigo-600" />
                <span>Scoped</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
                <Globe className="w-2.5 h-2.5 text-blue-600" />
                <span>Global</span>
              </span>
            )}
            <time className="text-[10px] text-slate-400">{timeAgo}</time>
          </div>
        </div>

        {/* Delete Button (visible on group-hover or mobile touch) */}
        <div className="shrink-0 flex items-center">
          <button
            type="button"
            role="button"
            aria-label={`대화 '${session.title}' 삭제`}
            title="대화 삭제"
            onClick={(e) => {
              e.stopPropagation();
              setIsDeleteOpen(true);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Popover */}
      <DeleteConfirmPopover
        isOpen={isDeleteOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteOpen(false)}
        isDeleting={isDeleting}
      />
    </div>
  );
}
