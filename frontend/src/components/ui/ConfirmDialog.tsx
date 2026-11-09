'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from './Button';
import { InlineAlert } from './InlineAlert';
import { ModalFrame } from './Dialog';

export interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
  /** 진행 중이면 두 버튼 비활성, Escape·배경막 무시. */
  busy?: boolean;
  /** 실패 문구. 대화상자 안 `InlineAlert` 로 보인다. */
  error?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 확인 창. `role="alertdialog"`, 처음 포커스는 취소 버튼.
 * 브라우저 기본 `window.confirm` 대신 쓴다.
 *
 * 포커스: `busy` 로 두 버튼이 비활성되면 포커스가 `body` 로 빠지지 않게 대화상자 컨테이너에 둔다.
 * `busy` 가 풀리면 오류가 있으면 오류 문구로, 없으면 확인 버튼으로 돌린다.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = '취소',
  tone = 'default',
  busy = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const wasBusy = useRef(busy);

  // busy 가 바뀔 때만 포커스를 옮긴다 (DOM 포커스 동기화).
  useEffect(() => {
    const changed = wasBusy.current !== busy;
    wasBusy.current = busy;
    if (!open || !changed) return;
    if (busy) {
      const container = cancelRef.current?.closest<HTMLElement>('[role="alertdialog"]');
      container?.focus({ preventScroll: true });
    } else {
      (errorRef.current ?? confirmRef.current)?.focus({ preventScroll: true });
    }
  }, [busy, open]);

  return (
    <ModalFrame
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      role="alertdialog"
      busy={busy}
      initialFocusRef={cancelRef}
      layout={{ type: 'dialog', size: 'sm', mobile: 'sheet', placement: 'center' }}
      footer={
        <>
          <Button ref={cancelRef} variant="secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button ref={confirmRef} variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {error ? (
        <div ref={errorRef} tabIndex={-1} className="rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-accent">
          <InlineAlert tone="danger">{error}</InlineAlert>
        </div>
      ) : null}
    </ModalFrame>
  );
}

export default ConfirmDialog;
