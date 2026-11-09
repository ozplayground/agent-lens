'use client';

import {
  useId,
  useRef,
  useSyncExternalStore,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
  type TouchEvent as ReactTouchEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useOverlayLayer } from '@/lib/overlay-stack';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useScrollLock } from '@/hooks/useScrollLock';
import { IconButton } from './IconButton';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl';
export type DialogMobile = 'fullscreen' | 'sheet';
export type DialogPlacement = 'center' | 'top';

/** 바텀시트에서 이만큼 아래로 끌면 닫는다. */
export const SHEET_SWIPE_CLOSE_PX = 100;

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** 머리줄 제목 (`h2`). `aria-labelledby` 로 연결한다. */
  title?: ReactNode;
  /** 있으면 `aria-describedby` 로 연결한다. */
  description?: ReactNode;
  size?: DialogSize;
  /** 768px 미만 배치. 기본 `fullscreen`, `size="sm"` 은 `sheet`. */
  mobile?: DialogMobile;
  placement?: DialogPlacement;
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** 배경막 클릭으로 닫기 (기본 true). 입력 폼은 false. */
  dismissOnScrim?: boolean;
  /** 진행 중이면 Escape·배경막·닫기 버튼을 무시한다. */
  busy?: boolean;
  footer?: ReactNode;
  headerActions?: ReactNode;
  children?: ReactNode;
  /** 머리줄 닫기 버튼 접근 이름 (기본 `닫기`). */
  closeLabel?: string;
  /** 배경막 `data-testid`. */
  backdropTestId?: string;
  /** 보이는 제목 대신 쓰는 접근 이름. 제목도 `header` 도 없으면 머리줄을 그리지 않는다. */
  ariaLabel?: string;
  /** 기본 머리줄(제목 h2 + 닫기) 대신 그릴 내용. */
  header?: ReactNode;
  /** `header` 안의 제목 id. 주면 `aria-labelledby` 를 이 id 로. */
  labelledBy?: string;
  /** `role="dialog"` 요소에 덧붙일 속성 (터치 핸들러 등). */
  panelProps?: HTMLAttributes<HTMLDivElement> & { 'data-testid'?: string };
  /** `role` 을 바꾼다 (`ConfirmDialog` 는 `alertdialog`). */
  role?: 'dialog' | 'alertdialog';
  className?: string;
  bodyClassName?: string;
}

/** 내부용: 대화상자·드로어 공통 프레임이 받는 배치. */
export type ModalLayout =
  | { type: 'dialog'; size: DialogSize; mobile: DialogMobile; placement: DialogPlacement }
  | { type: 'drawer'; side: 'left' };

const DESKTOP_WIDTH: Record<DialogSize, string> = {
  sm: 'md:w-[420px]',
  md: 'md:w-[560px]',
  lg: 'md:w-[720px]',
  xl: 'md:w-[896px]',
};

function subscribeNothing() {
  return () => {};
}

/** 서버 렌더·하이드레이션 중에는 false (포털을 그리지 않는다). */
function useIsClient() {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false
  );
}

function containerClasses(layout: ModalLayout): string {
  if (layout.type === 'drawer') return 'flex items-stretch justify-start';
  if (layout.placement === 'top') return 'flex items-stretch justify-center md:items-start md:pt-[12dvh]';
  if (layout.mobile === 'sheet') return 'flex items-end justify-center md:items-center md:p-6';
  return 'flex items-stretch justify-center md:items-center md:p-6';
}

function panelClasses(layout: ModalLayout): string {
  const base = 'relative flex flex-col overflow-hidden bg-surface text-fg shadow-overlay outline-none';
  if (layout.type === 'drawer') {
    return cn(base, 'h-dvh w-[min(320px,85vw)] border-r border-border motion-safe:animate-drawer-in');
  }
  const width = layout.placement === 'top' ? 'md:w-[560px]' : DESKTOP_WIDTH[layout.mobile === 'sheet' && layout.size === 'sm' ? 'sm' : layout.size];
  const desktop = cn(
    width,
    'md:max-w-[calc(100vw-3rem)] md:max-h-[85dvh] md:rounded-2xl md:border md:border-border'
  );
  if (layout.mobile === 'sheet' && layout.placement !== 'top') {
    return cn(
      base,
      'w-full max-h-[90dvh] rounded-t-2xl border-t border-border',
      'max-md:motion-safe:animate-sheet-in md:motion-safe:animate-dialog-in',
      desktop
    );
  }
  return cn(base, 'h-dvh w-full md:h-auto motion-safe:animate-dialog-in', desktop);
}

interface ModalFrameProps extends Omit<DialogProps, 'size' | 'mobile' | 'placement'> {
  layout: ModalLayout;
}

/**
 * 대화상자·드로어·확인 창 공통 프레임 (spec 설계 2.1).
 * 포털, 오버레이 스택, 포커스 가두기, 스크롤 잠금, 배경막, 머리줄·본문·바닥, 바텀시트 끌어 닫기.
 */
export function ModalFrame({
  open,
  onClose,
  title,
  description,
  initialFocusRef,
  dismissOnScrim = true,
  busy = false,
  footer,
  headerActions,
  children,
  closeLabel = '닫기',
  backdropTestId,
  ariaLabel,
  header,
  labelledBy,
  panelProps,
  role = 'dialog',
  className,
  bodyClassName,
  layout,
}: ModalFrameProps) {
  const isClient = useIsClient();
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const requestClose = () => {
    if (busy) return;
    onClose();
  };

  // 순서 중요: 닫힐 때 스택(→ `inert` 해제) 정리가 포커스 복귀보다 먼저 돈다.
  // 포털이 실제로 그려질 때만 켠다 (하이드레이션 첫 렌더에는 요소가 없다).
  const active = open && isClient;
  useOverlayLayer({ open: active, kind: 'modal', onEscape: requestClose, elementRef: panelRef });
  useScrollLock(active);
  useFocusTrap(panelRef, active, { initialFocusRef, initialFocusScopeRef: bodyRef });

  if (!active) return null;

  const isSheet = layout.type === 'dialog' && layout.mobile === 'sheet' && layout.placement !== 'top';
  const hasDefaultHeader = !header && title !== undefined && title !== null;
  const ariaLabelledBy = labelledBy ?? (hasDefaultHeader ? titleId : undefined);

  const {
    onTouchStart: panelTouchStart,
    onTouchEnd: panelTouchEnd,
    className: panelClassName,
    ...restPanelProps
  } = panelProps ?? {};

  const handleTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    panelTouchStart?.(e);
    if (isSheet && e.touches.length > 0) touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: ReactTouchEvent<HTMLDivElement>) => {
    panelTouchEnd?.(e);
    if (!isSheet || touchStartY.current === null || e.changedTouches.length === 0) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    touchStartY.current = null;
    if (deltaY > SHEET_SWIPE_CLOSE_PX) requestClose();
  };

  return createPortal(
    <div className={cn('fixed inset-0 z-50', containerClasses(layout))}>
      <div
        aria-hidden="true"
        data-testid={backdropTestId}
        className="absolute inset-0 bg-scrim motion-safe:animate-fade-in"
        onClick={dismissOnScrim ? requestClose : undefined}
      />
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-label={ariaLabelledBy ? undefined : ariaLabel}
        aria-describedby={description ? descriptionId : undefined}
        aria-busy={busy ? true : undefined}
        tabIndex={-1}
        {...restPanelProps}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={cn(panelClasses(layout), className, panelClassName)}
      >
        {isSheet ? (
          <div aria-hidden="true" className="flex justify-center pt-2 md:hidden">
            <span className="h-1 w-10 rounded-full bg-border-strong" />
          </div>
        ) : null}
        {header ?? null}
        {hasDefaultHeader ? (
          <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 md:h-auto md:px-5 md:py-3">
            <h2 id={titleId} className="min-w-0 flex-1 truncate text-base font-semibold text-fg">
              {title}
            </h2>
            {headerActions ? <div className="flex shrink-0 items-center gap-1">{headerActions}</div> : null}
            <IconButton label={closeLabel} icon={<X />} onClick={requestClose} disabled={busy} className="-mr-2" />
          </div>
        ) : null}
        <div
          ref={bodyRef}
          className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain', bodyClassName ?? 'px-4 py-4 md:px-5')}
        >
          {description ? (
            <div id={descriptionId} className="mb-3 text-sm leading-relaxed text-fg-muted">
              {description}
            </div>
          ) : null}
          {children}
        </div>
        {footer ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-5 md:pb-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}

/**
 * 모달 대화상자. 네이티브 `<dialog>` 가 아니라 `div role="dialog"` + 포털이다 (jsdom 에 `showModal` 없음).
 * 겹치면 나중에 연 것이 위다. Escape 는 맨 위 하나만 닫는다.
 */
export function Dialog({ size = 'md', mobile, placement = 'center', ...rest }: DialogProps) {
  const resolvedMobile: DialogMobile = mobile ?? (size === 'sm' ? 'sheet' : 'fullscreen');
  return <ModalFrame {...rest} layout={{ type: 'dialog', size, mobile: resolvedMobile, placement }} />;
}

export default Dialog;
