'use client';

import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  '[contenteditable="true"]',
  '[tabindex]',
].join(',');

/** 컨테이너 안의 Tab 으로 갈 수 있는 요소 (문서 순서). `tabindex="-1"`·`inert`·`hidden` 아래는 뺀다. */
export function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => {
    if (el.tabIndex < 0) return false;
    if (el.closest('[inert]') || el.closest('[hidden]')) return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    return true;
  });
}

export interface UseFocusTrapOptions {
  /** 열 때 먼저 포커스할 요소. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** `initialFocusRef` 가 없을 때 첫 포커스 가능 요소를 찾을 영역 (기본: 컨테이너). */
  initialFocusScopeRef?: RefObject<HTMLElement | null>;
  /** 끌 때 열기 전 포커스로 되돌린다 (기본 true). */
  restoreFocus?: boolean;
}

/**
 * `active` 인 동안 포커스를 `containerRef` 안에 가둔다.
 * - 켤 때 `document.activeElement` 를 저장하고 `initialFocusRef` → 영역의 첫 포커스 가능 요소 → 컨테이너 순으로 포커스.
 * - Tab / Shift+Tab 은 컨테이너 안에서 순환한다.
 * - 포커스된 요소가 비활성되거나 사라져 포커스가 `body` 로 빠지면 컨테이너로 되돌린다
 *   (예: 진행 중 버튼이 `disabled` 가 될 때).
 * - 끌 때(닫힘·언마운트) 저장한 요소가 문서에 있으면 그곳으로 되돌린다.
 * 컨테이너는 `tabIndex={-1}` 이어야 마지막 대체 포커스를 받을 수 있다.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  { initialFocusRef, initialFocusScopeRef, restoreFocus = true }: UseFocusTrapOptions = {}
) {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused =
      typeof document !== 'undefined' && document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const initial =
      initialFocusRef?.current ??
      getFocusableElements(initialFocusScopeRef?.current ?? container)[0] ??
      getFocusableElements(container)[0] ??
      container;
    if (!container.contains(document.activeElement) || initialFocusRef?.current) {
      initial.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusables = getFocusableElements(container);
      if (focusables.length === 0) {
        e.preventDefault();
        container.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;
      if (e.shiftKey) {
        if (current === first || current === container || !container.contains(current)) {
          e.preventDefault();
          last.focus();
        }
      } else if (current === last || !container.contains(current)) {
        e.preventDefault();
        first.focus();
      }
    };

    // 다른 요소로 옮겨 가는 것이 아니라(relatedTarget 없음) 포커스가 사라진 경우만 본다.
    let disposed = false;
    let pendingCheck: ReturnType<typeof setTimeout> | null = null;
    const handleFocusOut = (e: FocusEvent) => {
      if (e.relatedTarget) return;
      if (pendingCheck !== null) clearTimeout(pendingCheck);
      pendingCheck = setTimeout(() => {
        pendingCheck = null;
        if (disposed || !container.isConnected) return;
        const current = document.activeElement;
        if (current === null || current === document.body) {
          container.focus({ preventScroll: true });
        }
      }, 0);
    };

    container.addEventListener('keydown', handleKeyDown);
    container.addEventListener('focusout', handleFocusOut);
    return () => {
      disposed = true;
      if (pendingCheck !== null) clearTimeout(pendingCheck);
      container.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('focusout', handleFocusOut);
      if (restoreFocus && previouslyFocused && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [active, containerRef, initialFocusRef, initialFocusScopeRef, restoreFocus]);
}

export default useFocusTrap;
