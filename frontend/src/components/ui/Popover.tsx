'use client';

import { useEffect, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react';
import { cn } from '@/lib/cn';
import { useOverlayLayer } from '@/lib/overlay-stack';
import { getFocusableElements } from '@/hooks/useFocusTrap';

/**
 * `active` 인 동안 `refs` 밖에서 pointerdown 이 나면 `onOutside` 를 부른다.
 * 메뉴·팝오버의 "바깥 누르면 닫기" 공통 동작.
 */
export function useOutsidePointerDown(
  refs: ReadonlyArray<RefObject<HTMLElement | null>>,
  active: boolean,
  onOutside: () => void
) {
  const onOutsideRef = useRef(onOutside);
  const refsRef = useRef(refs);

  useLayoutEffect(() => {
    onOutsideRef.current = onOutside;
    refsRef.current = refs;
  });

  useEffect(() => {
    if (!active) return;
    const handle = (e: Event) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (refsRef.current.some((ref) => ref.current?.contains(target))) return;
      onOutsideRef.current();
    };
    document.addEventListener('pointerdown', handle, true);
    return () => document.removeEventListener('pointerdown', handle, true);
  }, [active]);
}

export type PopoverSide = 'bottom' | 'top';
export type PopoverAlign = 'start' | 'end';

export interface PopoverProps {
  open: boolean;
  onClose: () => void;
  /** 트리거(앵커) 요소. 바깥 판정에서 빼고, 닫을 때 포커스를 돌려준다. */
  anchorRef: RefObject<HTMLElement | null>;
  /** 접근 이름 (`aria-label`). */
  label: string;
  role?: 'dialog' | 'radiogroup';
  /** 열 때 안의 첫 포커스 가능 요소(없으면 팝오버)에 포커스 (기본 false). */
  focusOnOpen?: boolean;
  /** 앵커 아래(`top-full`) 또는 위(`bottom-full`). 기본 `bottom`. */
  side?: PopoverSide;
  /** 앵커 왼쪽 끝 또는 오른쪽 끝에 맞춘다. 기본 `start`. */
  align?: PopoverAlign;
  id?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * 비모달 팝오버. 포털 없이 앵커의 `relative` 부모 안에서 `absolute` 로 그린다.
 * 오버레이 스택에 `popover` 로 올린다 (Escape 는 맨 위만). 바깥 pointerdown 이면 닫는다.
 * Escape 로 닫거나, 닫힐 때 포커스가 안에 있었으면 앵커로 포커스를 돌려준다.
 */
export function Popover({
  open,
  onClose,
  anchorRef,
  label,
  role = 'dialog',
  focusOnOpen = false,
  side = 'bottom',
  align = 'start',
  id,
  className,
  children,
}: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useOverlayLayer({
    open,
    kind: 'popover',
    onEscape: () => {
      onClose();
      anchorRef.current?.focus();
    },
  });
  useOutsidePointerDown([panelRef, anchorRef], open, onClose);

  useEffect(() => {
    if (!open || !focusOnOpen) return;
    const panel = panelRef.current;
    if (!panel) return;
    (getFocusableElements(panel)[0] ?? panel).focus();
  }, [open, focusOnOpen]);

  // 닫힐 때 포커스가 팝오버 안에 있었다면(또는 요소가 지워져 body 로 갔다면) 앵커로 돌려준다.
  useLayoutEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const anchor = anchorRef.current;
    return () => {
      const activeEl = document.activeElement;
      if (anchor && anchor.isConnected && (activeEl === document.body || (panel && panel.contains(activeEl)))) {
        anchor.focus();
      }
    };
  }, [open, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      id={id}
      role={role}
      aria-label={label}
      tabIndex={-1}
      className={cn(
        'absolute z-40 min-w-48 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface p-1 text-fg shadow-overlay outline-none motion-safe:animate-fade-in',
        side === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2',
        align === 'end' ? 'right-0' : 'left-0',
        className
      )}
    >
      {children}
    </div>
  );
}

export default Popover;
