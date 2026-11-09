'use client';

import { useEffect, useId, useMemo, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useModalOpen } from '@/lib/overlay-stack';
import { IconButton } from './IconButton';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export interface ToastOptions {
  message: string;
  tone?: ToastTone;
  /** 자동으로 닫히기까지 ms (기본 3500). 0 이하면 자동으로 닫지 않는다. */
  duration?: number;
}

export interface ToastEntry {
  id: number;
  message: string;
  tone: ToastTone;
}

export const DEFAULT_TOAST_DURATION = 3500;

// ── 모듈 저장소: 알림 목록 ─────────────────────────────────────────────
let toasts: readonly ToastEntry[] = [];
let nextToastId = 1;
const toastTimers = new Map<number, ReturnType<typeof setTimeout>>();
const toastListeners = new Set<() => void>();
/**
 * 알림 id → 그 알림을 처음 그려 알린 영역 id, 또는 `null`(다른 영역에 한 번 넘겨줌).
 * 알림은 처음 그려진 한 번만 live 다. 그리는 영역이 바뀌면(composer ↔ global) 기록이 `null` 이 되고,
 * 그 뒤에는 처음 영역으로 돌아와도 live 속성 없이 그려 스크린리더가 다시 읽지 않게 한다.
 */
const announcedBy = new Map<number, string | null>();

function emitToasts() {
  toastListeners.forEach((l) => l());
}

function subscribeToasts(listener: () => void) {
  toastListeners.add(listener);
  return () => {
    toastListeners.delete(listener);
  };
}

function getToasts() {
  return toasts;
}

const EMPTY_TOASTS: readonly ToastEntry[] = [];
function getServerToasts() {
  return EMPTY_TOASTS;
}

export function dismissToast(id: number) {
  const timer = toastTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    toastTimers.delete(id);
  }
  announcedBy.delete(id);
  if (!toasts.some((t) => t.id === id)) return;
  toasts = toasts.filter((t) => t.id !== id);
  emitToasts();
}

/** 알림을 띄우고 id 를 돌려준다. 컴포넌트 밖에서도 부를 수 있다. */
export function showToast({ message, tone = 'info', duration = DEFAULT_TOAST_DURATION }: ToastOptions): number {
  const id = nextToastId++;
  toasts = [...toasts, { id, message, tone }];
  if (duration > 0) {
    toastTimers.set(
      id,
      setTimeout(() => dismissToast(id), duration)
    );
  }
  emitToasts();
  return id;
}

/** 모든 알림을 지운다 (테스트 정리용). */
export function clearToasts() {
  toastTimers.forEach((timer) => clearTimeout(timer));
  toastTimers.clear();
  announcedBy.clear();
  if (toasts.length === 0) return;
  toasts = [];
  emitToasts();
}

export function useToast() {
  return useMemo(() => ({ show: showToast, dismiss: dismissToast }), []);
}

// ── 모듈 저장소: 그리는 ToastRegion 하나 고르기 ───────────────────────────
// 여러 곳에 마운트돼도 한 영역만 그린다 (layout.tsx 의 global 과 ChatWorkspace 의 composer 등).
// - 모달 레이어가 없고 composer 영역이 있으면 가장 나중에 등록된 composer.
// - 아니면 처음 등록된 global (global 끼리는 처음 마운트된 것). global 이 없으면 가장 나중의 composer.
// 모달이 열린 동안 composer 에 그리면 `inert` 인 `#app-shell` 안이라 읽히지 않으므로 global 로 보낸다.
export type ToastRegionPlacement = 'global' | 'composer';

interface RegionEntry {
  id: string;
  placement: ToastRegionPlacement;
}

let regions: readonly RegionEntry[] = [];
const regionListeners = new Set<() => void>();

function emitRegion() {
  regionListeners.forEach((l) => l());
}

function subscribeRegion(listener: () => void) {
  regionListeners.add(listener);
  return () => {
    regionListeners.delete(listener);
  };
}

function getRegions() {
  return regions;
}

const EMPTY_REGIONS: readonly RegionEntry[] = [];
function getServerRegions() {
  return EMPTY_REGIONS;
}

function pickRegionOwner(entries: readonly RegionEntry[], modalOpen: boolean): string | null {
  let lastComposer: string | null = null;
  let firstGlobal: string | null = null;
  for (const entry of entries) {
    if (entry.placement === 'composer') lastComposer = entry.id;
    else if (firstGlobal === null) firstGlobal = entry.id;
  }
  if (!modalOpen && lastComposer !== null) return lastComposer;
  return firstGlobal ?? lastComposer;
}

function registerRegion(entry: RegionEntry) {
  if (regions.some((r) => r.id === entry.id)) return;
  regions = [...regions, entry];
  emitRegion();
}

function unregisterRegion(id: string) {
  if (!regions.some((r) => r.id === id)) return;
  regions = regions.filter((r) => r.id !== id);
  emitRegion();
}

const TONE_ICONS = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
} as const;

const TONE_ICON_CLASSES: Record<ToastTone, string> = {
  info: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

export interface ToastRegionProps {
  /**
   * `global`(기본): 포털로 `body` 에 그리는 전역 영역. 모바일은 아래, md 이상은 오른쪽 위.
   * `composer`: 포털 없이 그 자리에 그리는 챗 입력 영역 위 영역. 부모가 `relative` 여야 한다
   * (`absolute inset-x-0 bottom-full`). 모달이 열려 있으면 global 영역이 대신 그린다.
   */
  placement?: ToastRegionPlacement;
  className?: string;
}

/**
 * 알림 영역. `z-60`. `global` 은 포털로 `body` 에 그린다 (`#app-shell` 이 `inert` 여도 보인다).
 * `composer` 는 그 자리에서 부모 위쪽에 붙는다 (안쪽 폭은 메시지 열과 같은 `max-w-3xl`).
 * 알림마다 `role="status" aria-live="polite"`, 오류(`danger`)는 `role="alert"`.
 * 알림 하나는 처음 그려진 한 번만 live 속성을 갖는다. 영역이 바뀌어(composer ↔ global) 다른 영역이
 * 그리면, 그리고 처음 영역으로 돌아와도, 글자·아이콘·닫기 버튼은 같고 `role`·`aria-live` 없이 그린다.
 */
export function ToastRegion({ placement = 'global', className }: ToastRegionProps) {
  const regionId = useId();
  const entries = useSyncExternalStore(subscribeRegion, getRegions, getServerRegions);
  const modalOpen = useModalOpen();
  const items = useSyncExternalStore(subscribeToasts, getToasts, getServerToasts);

  useEffect(() => {
    registerRegion({ id: regionId, placement });
    return () => unregisterRegion(regionId);
  }, [regionId, placement]);

  const isOwner = pickRegionOwner(entries, modalOpen) === regionId;

  // 그린 뒤에 기록을 고친다: 기록이 없으면 이 영역이 알렸다고 적고, 다른 영역 id 면 `null`(넘겨줌)로
  // 바꾼다. 자기 id 나 `null` 이면 그대로라 StrictMode 이중 실행에도 결과가 같다.
  useEffect(() => {
    if (!isOwner) return;
    for (const toast of items) {
      if (!announcedBy.has(toast.id)) {
        announcedBy.set(toast.id, regionId);
      } else {
        const announcer = announcedBy.get(toast.id);
        if (announcer !== null && announcer !== regionId) announcedBy.set(toast.id, null);
      }
    }
  }, [isOwner, items, regionId]);

  if (!isOwner) return null;

  const list = items.map((toast) => {
    const Icon = TONE_ICONS[toast.tone];
    // 기록이 없거나(처음 그림) 이 영역이 알린 알림만 live 속성을 갖는다. 다른 영역 id·`null` 이면 조용히 그린다.
    const live = !announcedBy.has(toast.id) || announcedBy.get(toast.id) === regionId;
    return (
      <div
        key={toast.id}
        role={live ? (toast.tone === 'danger' ? 'alert' : 'status') : undefined}
        aria-live={live ? (toast.tone === 'danger' ? 'assertive' : 'polite') : undefined}
        className="pointer-events-auto flex items-start gap-2 rounded-xl border border-border bg-surface p-3 pr-1 text-sm text-fg shadow-overlay motion-safe:animate-fade-in"
      >
        <Icon aria-hidden="true" className={cn('mt-0.5 size-4 shrink-0', TONE_ICON_CLASSES[toast.tone])} />
        <p className="min-w-0 flex-1 break-words leading-relaxed [overflow-wrap:anywhere]">{toast.message}</p>
        <IconButton label="알림 닫기" icon={<X />} size="sm" onClick={() => dismissToast(toast.id)} className="-my-1" />
      </div>
    );
  });

  if (placement === 'composer') {
    return (
      <div
        data-toast-region="composer"
        className={cn('pointer-events-none absolute inset-x-0 bottom-full z-60 mb-2', className)}
      >
        <div className="mx-auto flex max-w-3xl flex-col items-stretch gap-2 px-4 md:px-6">{list}</div>
      </div>
    );
  }

  return createPortal(
    <div
      data-toast-region="global"
      className={cn(
        'pointer-events-none fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-60 flex flex-col items-stretch gap-2',
        'md:inset-x-auto md:top-4 md:right-4 md:bottom-auto md:w-96',
        className
      )}
    >
      {list}
    </div>,
    document.body
  );
}

export default ToastRegion;
