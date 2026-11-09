'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';

/**
 * 오버레이 레이어 스택 (대화상자·드로어·시트·메뉴·팝오버 공통).
 *
 * - 열릴 때 `push`, 닫히거나 언마운트되면 `remove` 한다 (`useOverlayLayer` 가 둘 다 한다).
 * - 스택이 비어 있지 않을 때만 `window` 에 keydown 리스너 하나를 스스로 달고, 비면 뗀다.
 *   앱·프로바이더 단위 리스너가 없어도 컴포넌트 하나만 렌더한 테스트에서 Escape 가 동작한다.
 * - Escape(IME 조합 중 제외)는 맨 위 레이어의 `onEscape` 만 부르고 `preventDefault` 한다.
 * - 모달이 하나라도 있으면 `#app-shell` 에 `inert`, 맨 위 모달이 아닌 모달 요소에도 `inert` 를 단다.
 *   DOM 에 바로 반영하므로 닫는 즉시(포커스 복귀 전에) 풀린다.
 * - 스택은 레이어의 `order`(렌더 순서 번호) 오름차순이다. `useOverlayLayer` 는 `open` 이 false→true 로
 *   바뀌는 렌더에서 번호를 받는다. 부모가 자식보다 먼저 렌더되므로 같은 렌더에서 함께 열려도
 *   부모 < 자식이고, 자식 effect 가 먼저 `push` 돼도 자식이 맨 위다. 다시 열면 새 번호(맨 위)를 받는다.
 */

export type OverlayKind = 'modal' | 'popover';

export interface OverlayLayer {
  id: string;
  kind: OverlayKind;
  onEscape?: () => void;
  /** 모달이면 그 요소. 맨 위 모달이 아닐 때 `inert` 를 단다. */
  element?: HTMLElement | null;
  /** 쌓는 순서 번호 (작을수록 아래). 없으면 `push` 할 때 새 번호를 받아 맨 위에 놓인다. */
  order?: number;
}

const APP_SHELL_ID = 'app-shell';

let layers: readonly (OverlayLayer & { order: number })[] = [];
/** 레이어 순서 번호 카운터. 늘 증가만 한다. */
let orderCounter = 0;

/** 새 순서 번호를 받는다. 지금까지 받은 어떤 번호보다 크다. */
function takeOverlayOrder(): number {
  orderCounter += 1;
  return orderCounter;
}
const listeners = new Set<() => void>();
let keydownAttached = false;
/** 스택이 `inert` 를 단 요소. 스택이 단 것만 뗀다. */
const inertByStack = new Set<HTMLElement>();

function handleWindowKeyDown(e: KeyboardEvent) {
  if (e.key !== 'Escape' && e.key !== 'Esc') return;
  if (e.isComposing || e.keyCode === 229) return;
  if (e.defaultPrevented) return;
  const top = layers[layers.length - 1];
  if (!top) return;
  e.preventDefault();
  top.onEscape?.();
}

function syncKeydownListener() {
  if (typeof window === 'undefined') return;
  if (layers.length > 0 && !keydownAttached) {
    window.addEventListener('keydown', handleWindowKeyDown);
    keydownAttached = true;
  } else if (layers.length === 0 && keydownAttached) {
    window.removeEventListener('keydown', handleWindowKeyDown);
    keydownAttached = false;
  }
}

function setInert(el: HTMLElement, inert: boolean) {
  if (inert) {
    if (!el.hasAttribute('inert')) {
      el.setAttribute('inert', '');
      inertByStack.add(el);
    }
  } else if (inertByStack.has(el)) {
    el.removeAttribute('inert');
    inertByStack.delete(el);
  }
}

function syncInert() {
  if (typeof document === 'undefined') return;
  const modals = layers.filter((l) => l.kind === 'modal');
  const topModal = modals[modals.length - 1];
  const shouldBeInert = new Set<HTMLElement>();

  const shell = document.getElementById(APP_SHELL_ID);
  if (shell && modals.length > 0) shouldBeInert.add(shell);
  for (const layer of modals) {
    if (layer !== topModal && layer.element) shouldBeInert.add(layer.element);
  }

  for (const el of Array.from(inertByStack)) {
    if (!shouldBeInert.has(el)) setInert(el, false);
  }
  for (const el of shouldBeInert) setInert(el, true);
}

function emitChange() {
  syncKeydownListener();
  syncInert();
  listeners.forEach((listener) => listener());
}

/**
 * 레이어를 `order` 오름차순 자리에 넣는다 (`order` 가 없으면 새 번호 → 맨 위).
 * 같은 id 가 이미 있으면 빼고 새 값의 자리에 다시 넣는다.
 */
function push(layer: OverlayLayer) {
  const existing = layers.find((l) => l.id === layer.id);
  const order = layer.order ?? existing?.order ?? takeOverlayOrder();
  const entry = { ...layer, order };
  const rest = layers.filter((l) => l.id !== layer.id);
  const insertAt = rest.findIndex((l) => l.order > order);
  layers = insertAt < 0 ? [...rest, entry] : [...rest.slice(0, insertAt), entry, ...rest.slice(insertAt)];
  emitChange();
}

function remove(id: string) {
  if (!layers.some((l) => l.id === id)) return;
  layers = layers.filter((l) => l.id !== id);
  emitChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getLayers(): readonly OverlayLayer[] {
  return layers;
}

function getTop(): OverlayLayer | undefined {
  return layers[layers.length - 1];
}

function isTop(id: string): boolean {
  return getTop()?.id === id;
}

export const overlayStack = {
  push,
  remove,
  subscribe,
  getLayers,
  getTop,
  isTop,
};

function getIsOpenSnapshot() {
  return layers.length > 0;
}

function getIsOpenServerSnapshot() {
  return false;
}

/** 스택에 레이어가 하나라도 있으면 true. 단일 키 단축키 차단에 쓴다. */
export function useOverlayOpen(): boolean {
  return useSyncExternalStore(subscribe, getIsOpenSnapshot, getIsOpenServerSnapshot);
}

function getTopIdSnapshot() {
  return getTop()?.id ?? null;
}

function getTopIdServerSnapshot() {
  return null;
}

function getHasModalSnapshot() {
  return layers.some((l) => l.kind === 'modal');
}

/** 스택에 모달 레이어가 하나라도 있으면 true. 알림 영역 고르기(`ToastRegion`)에 쓴다. */
export function useModalOpen(): boolean {
  return useSyncExternalStore(subscribe, getHasModalSnapshot, getIsOpenServerSnapshot);
}

/** 맨 위 레이어의 id (없으면 null). */
export function useTopOverlayId(): string | null {
  return useSyncExternalStore(subscribe, getTopIdSnapshot, getTopIdServerSnapshot);
}

export interface UseOverlayLayerOptions {
  open: boolean;
  kind: OverlayKind;
  onEscape?: () => void;
  /** 모달 요소 ref. 맨 위 모달이 아닐 때 스택이 `inert` 를 단다. */
  elementRef?: RefObject<HTMLElement | null>;
}

/**
 * `open` 인 동안 스택에 레이어를 올리고, 닫히거나 언마운트되면 뺀다. 레이어 id 를 돌려준다.
 * `onEscape` 는 매 렌더 바뀌어도 된다 (ref 로 최신 값을 부른다).
 */
export function useOverlayLayer({ open, kind, onEscape, elementRef }: UseOverlayLayerOptions): string {
  const id = useId();
  const onEscapeRef = useRef(onEscape);

  // 렌더 순서 번호: open 이 false→true 로 바뀌는 렌더에서 받는다 (렌더 중 이전 값 비교 패턴).
  // effect 는 자식이 먼저 돌지만 렌더는 부모가 먼저라 부모 번호 < 자식 번호다.
  const [openOrder, setOpenOrder] = useState(() => ({ open, order: open ? takeOverlayOrder() : 0 }));
  let order = openOrder.order;
  if (openOrder.open !== open) {
    if (open) order = takeOverlayOrder();
    setOpenOrder({ open, order });
  }

  useLayoutEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!open) return;
    overlayStack.push({
      id,
      kind,
      onEscape: () => onEscapeRef.current?.(),
      element: elementRef?.current ?? null,
      order,
    });
    return () => overlayStack.remove(id);
  }, [open, kind, id, elementRef, order]);

  return id;
}
