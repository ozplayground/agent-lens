'use client';

import { useEffect, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
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
  /**
   * true 면 `document.body` 에 `fixed` 로 그리고 위치를 앵커 좌표로 계산한다.
   * 문단(`<p>`) 안 인용 배지처럼 블록 요소를 둘 수 없거나 스크롤 상자에 잘리는 곳에서 쓴다 (FE-13).
   */
  portal?: boolean;
}

/** 포털 팝오버와 화면 가장자리·앵커 사이 간격 (px). */
const PORTAL_GAP = 8;
const PORTAL_VIEWPORT_MARGIN = 16;

/** 앵커 좌표로 포털 팝오버 위치를 정한다. 위쪽에 자리가 없으면 아래로 뒤집고, 가로는 화면 안으로 당긴다. */
function placePortalPanel(panel: HTMLElement, anchor: HTMLElement, side: PopoverSide, align: PopoverAlign) {
  const rect = anchor.getBoundingClientRect();
  const width = panel.offsetWidth;
  const preferredLeft = align === 'end' ? rect.right - width : rect.left;
  const maxLeft = window.innerWidth - width - PORTAL_VIEWPORT_MARGIN;
  panel.style.left = `${Math.max(PORTAL_VIEWPORT_MARGIN, Math.min(preferredLeft, maxLeft))}px`;

  const fitsAbove = rect.top - PORTAL_GAP - panel.offsetHeight >= PORTAL_VIEWPORT_MARGIN;
  if (side === 'top' && fitsAbove) {
    panel.style.top = '';
    panel.style.bottom = `${window.innerHeight - rect.top + PORTAL_GAP}px`;
  } else {
    panel.style.bottom = '';
    panel.style.top = `${rect.bottom + PORTAL_GAP}px`;
  }
}

/**
 * 비모달 팝오버. 기본은 포털 없이 앵커의 `relative` 부모 안에서 `absolute` 로 그린다 (`portal` 이면 body 에 `fixed`).
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
  portal = false,
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

  // 포털이면 열려 있는 동안 앵커를 따라간다 (스크롤·창 크기 변화). 상태 대신 요소 style 을 바로 고친다.
  useLayoutEffect(() => {
    if (!open || !portal) return;
    const place = () => {
      const panel = panelRef.current;
      const anchor = anchorRef.current;
      if (panel && anchor) placePortalPanel(panel, anchor, side, align);
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, portal, side, align, anchorRef]);

  if (!open) return null;

  const panel = (
    <div
      ref={panelRef}
      id={id}
      role={role}
      aria-label={label}
      tabIndex={-1}
      className={cn(
        'z-40 min-w-48 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface p-1 text-fg shadow-overlay outline-none motion-safe:animate-fade-in',
        portal
          ? 'fixed'
          : cn('absolute', side === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2', align === 'end' ? 'right-0' : 'left-0'),
        className
      )}
    >
      {children}
    </div>
  );

  return portal ? createPortal(panel, document.body) : panel;
}

export default Popover;
