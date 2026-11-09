'use client';

import React, { useRef, type RefObject } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Popover } from '@/components/ui/Popover';
import { Button } from '@/components/ui/Button';

export interface DeleteConfirmPopoverProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
  anchorRect?: DOMRect | null;
  /** 트리거(삭제 버튼). 바깥 판정에서 빼고, 닫을 때 포커스를 돌려준다. */
  anchorRef?: RefObject<HTMLElement | null>;
}

/**
 * 세션 삭제 확인 팝오버 (spec 설계 5: `Popover role="dialog"`).
 * Escape 는 오버레이 스택이 맨 위 하나만 닫는다 (드로어 안에서 열어도 드로어는 남는다). 처음 포커스는 `취소`.
 */
export default function DeleteConfirmPopover({
  isOpen,
  onConfirm,
  onCancel,
  isDeleting = false,
  anchorRef,
}: DeleteConfirmPopoverProps) {
  const fallbackAnchorRef = useRef<HTMLElement | null>(null);

  return (
    <Popover
      open={isOpen}
      onClose={() => {
        if (!isDeleting) onCancel();
      }}
      anchorRef={anchorRef ?? fallbackAnchorRef}
      label="이 대화를 삭제하시겠습니까?"
      role="dialog"
      focusOnOpen
      align="end"
      className="w-[min(18rem,calc(100vw-2rem))] p-3 text-left"
    >
      <div className="flex items-start gap-2.5">
        <span aria-hidden="true" className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-danger-soft text-danger">
          <AlertTriangle className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">이 대화를 삭제하시겠습니까?</p>
          <p className="mt-1 text-xs leading-normal text-fg-muted">
            삭제된 대화 기록과 모든 메시지는 영구 복구할 수 없습니다.
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isDeleting}>
          취소
        </Button>
        <Button variant="danger" size="sm" onClick={onConfirm} disabled={isDeleting} leadingIcon={isDeleting ? undefined : <Trash2 />}>
          {isDeleting ? '삭제 중...' : '삭제'}
        </Button>
      </div>
    </Popover>
  );
}
