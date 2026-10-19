'use client';

import React, { useEffect, useRef } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

export interface DeleteConfirmPopoverProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
  anchorRect?: DOMRect | null;
}

export default function DeleteConfirmPopover({
  isOpen,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteConfirmPopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus cancel button by default to prevent accidental deletion
    cancelBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-popover-title"
      aria-describedby="delete-popover-desc"
      onClick={(e) => e.stopPropagation()}
      className="absolute right-2 top-8 z-50 w-64 p-3 bg-white rounded-xl shadow-xl border border-slate-200 text-left animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-start gap-2.5">
        <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h4
            id="delete-popover-title"
            className="text-xs font-bold text-slate-900 leading-tight"
          >
            이 대화를 삭제하시겠습니까?
          </h4>
          <p
            id="delete-popover-desc"
            className="text-[11px] text-slate-500 mt-1 leading-normal"
          >
            삭제된 대화 기록과 모든 메시지는 영구 복구할 수 없습니다.
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5">
        <button
          ref={cancelBtnRef}
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
          className="px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isDeleting}
          className="px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          {isDeleting ? (
            '삭제 중...'
          ) : (
            <>
              <Trash2 className="w-3 h-3" />
              <span>삭제</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
