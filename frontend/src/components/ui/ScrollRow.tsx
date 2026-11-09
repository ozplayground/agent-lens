'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type FocusEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useScrollOverflow, type ScrollOverflow } from '@/hooks/useScrollOverflow';
import { IconButton } from './IconButton';

/** 넘친 쪽에만 24px 흐림. `none` 이면 마스크가 없다. */
const MASK_CLASSES: Record<ScrollOverflow, string> = {
  none: '',
  start: '[mask-image:linear-gradient(to_right,transparent,black_24px)]',
  end: '[mask-image:linear-gradient(to_left,transparent,black_24px)]',
  both: '[mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-24px),transparent)]',
};

/** 768 미만 넘침 표시: 장식, 16px, 줄 위에 겹치지 않는다 (`absolute` 아님). */
const HINT_CLASSES =
  'pointer-events-none flex w-4 shrink-0 items-center justify-center text-fg-subtle [&>svg]:size-4';

/** 표시가 없는 쪽의 같은 크기 빈 자리. */
const SLOT_CLASSES = 'invisible pointer-events-none w-4 shrink-0';

/** 버튼 한 번에 움직이는 비율 (줄 폭 기준). */
const SCROLL_PAGE_RATIO = 0.8;

/** 선택 칩을 보이게 할 때 양 끝 흐림 폭(24px)을 뺀 범위에 넣는다. */
const REVEAL_PADDING_PX = 24;

/** 이 부품이 `revealInRow` 로 둔 값과 이 이내로 같은 `scroll` 은 이 부품이 낸 것이다. */
const SCROLL_SLACK_PX = 1;

/**
 * '사용자 조작 중' 이 끝나는 시간 (근거 없는 가정, spec E34·우려 26).
 * `scrollend` 가 없을 때 마지막 `scroll` 뒤 이만큼 `scroll` 이 없으면 끝난다.
 */
const USER_SCROLL_IDLE_MS = 150;
/** 입력 신호 뒤 이만큼 `scroll` 이 없으면 '사용자 조작 중' 이 끝난다. */
const USER_INPUT_TIMEOUT_MS = 1000;

/** 바깥 감싸개에서 받는 입력 신호 (스크롤 줄·스크롤 버튼·넘침 표시를 담은 요소). */
const USER_INPUT_EVENTS = ['pointerdown', 'touchstart', 'keydown'] as const;

/** 가로 의도의 휠만 입력 신호다 (세로 휠은 줄 위에서 페이지를 내리는 동작이다). */
function isHorizontalWheel(event: WheelEvent): boolean {
  return Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey;
}

/** 버튼이 사라질 때 포커스를 받을 수 있는 줄 안 요소. */
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type ScrollButton = 'prev' | 'next';

/** `scroll-snap-align` 의 가로(inline) 값. 값이 둘이면 두 번째가 가로다. */
function inlineSnapAlign(el: Element): string {
  const tokens = (window.getComputedStyle(el).scrollSnapAlign || '').trim().split(/\s+/).filter(Boolean);
  return tokens[1] ?? tokens[0] ?? 'none';
}

/**
 * 줄이 가로 스크롤 스냅을 쓰면, 자식들의 스냅 위치(`scrollLeft` 값)를 `[0, maxScroll]` 로 잘라 돌려준다.
 * `start` 는 `자식 왼쪽 - scroll-padding-left`, `end` 는 `자식 오른쪽 - (보이는 폭 - scroll-padding-right)`, `center` 는 가운데 맞춤.
 * `origin` 은 내용 좌표 0 의 화면 x, `width` 는 보이는 폭이다. 스냅이 없으면 빈 Map.
 */
function snapPositions(row: HTMLElement, origin: number, width: number, maxScroll: number): Map<Element, number> {
  const positions = new Map<Element, number>();
  const style = window.getComputedStyle(row);
  const type = (style.scrollSnapType || '').trim();
  if (!type || type === 'none' || !/\b(x|inline|both)\b/.test(type)) return positions;
  const padLeft = parseFloat(style.scrollPaddingLeft) || 0;
  const padRight = parseFloat(style.scrollPaddingRight) || 0;
  for (const child of Array.from(row.children)) {
    const align = inlineSnapAlign(child);
    if (align === 'none') continue;
    const rect = child.getBoundingClientRect();
    const left = rect.left - origin;
    const right = rect.right - origin;
    let position: number;
    if (align === 'end') position = right - (width - padRight);
    else if (align === 'center') position = (left + right) / 2 - (padLeft + (width - padLeft - padRight) / 2);
    else position = left - padLeft;
    positions.set(child, Math.min(Math.max(0, position), maxScroll));
  }
  return positions;
}

/**
 * 줄 안에서 `child` 전체가 보이도록 줄의 `scrollLeft` 만 바꾼다 (페이지는 스크롤하지 않는다).
 * - 바라는 범위는 줄의 보이는 상자에서 넘친 쪽 흐림(24px)을 뺀 범위다. 줄 끝(0, 최댓값)에서는 그쪽 흐림이 없다.
 * - 스냅 없는 줄: 그 범위에 들도록 옮긴다 (칩이 더 넓으면 왼쪽 맞춤). `[0, scrollWidth - clientWidth]` 로 자른다.
 * - 스냅(`snap-x`) 줄: 스냅 위치가 아닌 값을 두면 브라우저가 가장 가까운 스냅 위치로 다시 맞춰 이동이 되돌아간다
 *   (Chrome 실측: 61 → 0). 그래서 목표를 자식들의 스냅 위치에서 고른다 — 흐림 밖에 다 드는 위치,
 *   없으면 보이는 상자 안에 다 드는 위치(지금 위치가 그렇다면 그대로), 그것도 없으면 그 칩 자신의 스냅 위치.
 *   후보가 여럿이면 지금 위치에 가장 가까운 것.
 */
function revealInRow(row: HTMLElement, child: HTMLElement) {
  const rowRect = row.getBoundingClientRect();
  const childRect = child.getBoundingClientRect();
  const boxLeft = rowRect.left + row.clientLeft;
  const width = rowRect.right - row.clientLeft - boxLeft;
  const current = row.scrollLeft;
  const maxScroll = Math.max(0, row.scrollWidth - row.clientWidth);
  const origin = boxLeft - current;
  const left = childRect.left - origin;
  const right = childRect.right - origin;

  const fits = (position: number, clearOfFades: boolean) => {
    const startFade = clearOfFades && position > 0.5 ? REVEAL_PADDING_PX : 0;
    const endFade = clearOfFades && position < maxScroll - 0.5 ? REVEAL_PADDING_PX : 0;
    return left >= position + startFade - 0.5 && right <= position + width - endFade + 0.5;
  };
  const nearest = (list: number[]) =>
    list.reduce((best, position) => (Math.abs(position - current) < Math.abs(best - current) ? position : best));

  let target: number;
  const snaps = snapPositions(row, origin, width, maxScroll);
  if (snaps.size > 0) {
    if (fits(current, true)) return;
    const candidates = Array.from(new Set(snaps.values()));
    const clear = candidates.filter((position) => fits(position, true));
    const inside = candidates.filter((position) => fits(position, false));
    if (clear.length > 0) target = nearest(clear);
    else if (fits(current, false)) return;
    else if (inside.length > 0) target = nearest(inside);
    else target = snaps.get(child) ?? nearest(candidates);
  } else {
    let delta = 0;
    if (left < current + REVEAL_PADDING_PX) {
      delta = left - (current + REVEAL_PADDING_PX);
    } else if (right > current + width - REVEAL_PADDING_PX) {
      delta = Math.min(right - (current + width - REVEAL_PADDING_PX), left - (current + REVEAL_PADDING_PX));
    }
    if (delta === 0) return;
    target = Math.min(Math.max(0, current + delta), maxScroll);
  }
  if (Math.abs(target - current) < 0.5) return;
  // 값을 두는 동안 스냅을 끄고 바로 되돌린다. 되돌리는 순간 브라우저는 가장 가까운 스냅 위치로 다시 맞추므로
  // 이것만으로는 이동이 지켜지지 않는다 — 스냅 줄에서는 위에서 목표를 스냅 위치로 골라 되돌려도 그대로 남게 한다.
  const previousSnapType = row.style.scrollSnapType;
  row.style.scrollSnapType = 'none';
  row.scrollLeft = target;
  row.style.scrollSnapType = previousSnapType;
}

export interface ScrollRowProps extends Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'children'> {
  /** 스크롤 버튼 이름에 쓰는 줄 이름 (`{label} 이전 항목 보기` / `{label} 다음 항목 보기`). */
  label: string;
  /**
   * 768 미만에서 줄을 페이지 여백 너머 화면 끝까지 늘인다.
   * `true` 는 좌우 둘 다(`-mx-4 px-4`), `'start'` 는 왼쪽만(`-ml-4 pl-4`, 오른쪽에 다른 컨트롤이 있을 때).
   * 그쪽에 넘침 표시가 보이는 동안에는 줄이 그쪽을 늘이지 않고, 표시가 그쪽 페이지 여백을 쓴다.
   * 스냅 여백은 bleed 와 상관없이 늘 `scroll-px-6`(24px, 흐림 폭과 같음)이다.
   */
  bleed?: boolean | 'start';
  /** 바깥 감싸개(레이아웃 항목)의 클래스. */
  className?: string;
  /** 스크롤 줄 자체의 클래스. */
  rowClassName?: string;
  /** 스크롤 줄 요소 ref. */
  ref?: Ref<HTMLDivElement>;
  /**
   * 처음 그릴 때와 바뀔 때 보이게 할 선택 자식의 선택자. 기본 `[aria-pressed="true"]` (칩).
   * 탭 줄은 `[role="tab"][aria-selected="true"]` 처럼 넘긴다.
   */
  selectedSelector?: string;
  children: ReactNode;
}

/**
 * 가로 스크롤 줄. 바깥 감싸개 안에 [이전 버튼] [스크롤 줄] [다음 버튼 또는 넘침 표시] 를 둔다.
 * - 스크롤 줄에 `data-scroll-row`, `data-overflow` 와 호출자가 준 속성(`role`, `aria-label` 등)을 단다.
 * - 버튼은 줄 밖 형제이고, 768 이상에서 넘친 쪽에만 보인다.
 * - 768 미만에서는 넘친 쪽마다 장식 표시를 둔다: 왼쪽은 줄 앞 형제 `data-overflow-hint="start"`(‹),
 *   오른쪽은 줄 뒤 형제 `data-overflow-hint="end"`(›). `aria-hidden`, `pointer-events-none`, 16px, 줄 위에 겹치지 않고
 *   (`absolute` 아님) 감싸개 `gap-1` 을 상쇄해 줄에 붙는다.
 *   - 표시 쪽에 `bleed` 가 있으면 줄은 그쪽을 늘이지 않고 표시가 그쪽 페이지 여백(16px)을 쓴다 → 줄 내용 폭이 그대로다.
 *   - `bleed` 가 없는 쪽은 줄이 넘치는 동안 표시 자리를 늘 둔다 (넘치지 않으면 `invisible` 한
 *     `data-overflow-slot`). 그래서 줄 폭은 넘침이 생기고 없어질 때만 바뀌고, 스크롤해도 칩이 옆으로 튀지 않는다.
 * - 스냅 여백은 늘 `scroll-px-6`(24px) = 흐림 폭 = 선택 칩 보이기 여백. 줄에 `data-selected-selector` 를 단다.
 * - 줄 안 요소가 포커스를 받으면 그 요소를, 처음 그릴 때와 `selectedSelector` 자식이 바뀔 때 그 자식을 보이게 스크롤한다.
 *   선택 자식은 양 끝 흐림 24px 를 뺀 범위에 넣는다. 그 뒤 줄 폭(넘침 표시·버튼·화면 폭)이나 줄·자식 크기가 바뀌면
 *   사용자가 줄을 스크롤하지 않았을 때만 다시 보이게 한다.
 * - 사용자 스크롤: 입력 신호(감싸개의 `pointerdown`·`touchstart`·`keydown`, 가로 의도의 `wheel`
 *   (`Math.abs(deltaX) > Math.abs(deltaY) || shiftKey`, 세로 휠은 신호가 아님), 스크롤 버튼 클릭, 줄 안으로의
 *   사용자 포커스 이동) 뒤 '사용자 조작 중' 에 온 `scroll` 만이다. '사용자 조작 중' 은 `scrollend` 에서, `scrollend` 가
 *   없으면 마지막 `scroll` 뒤 150ms, 입력 뒤 1,000ms 안에 `scroll` 이 없으면 끝난다. 입력 없이 온 `scroll`
 *   (브라우저의 범위 자르기·스냅 재맞춤, 다른 코드의 `scrollLeft` 변경)과 이 부품이 둔 값의 `scroll`, 포커스 유지가
 *   옮긴 포커스는 사용자 스크롤이 아니다. 새 선택 칩이 생기면 이 구분을 처음부터 다시 한다. 판정은 ref 로만 한다.
 * - 포커스 유지: 키보드 포커스를 가진 스크롤 버튼이 사라지면(넘침 상태가 바뀌거나 폭이 768 미만이 됨)
 *   ① 반대쪽 버튼 ② 줄의 선택 자식(`selectedSelector`) ③ 줄의 첫 포커스 가능 요소 순서로 포커스를 옮긴다.
 *   포커스를 가진 버튼은 ref 로 기억하고(다시 그리지 않는다), 사용자가 먼저 다른 곳으로 옮겼으면 옮기지 않는다.
 */
export function ScrollRow({
  label,
  bleed = false,
  className,
  rowClassName,
  ref,
  selectedSelector = '[aria-pressed="true"]',
  onFocus,
  children,
  ...rest
}: ScrollRowProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const overflow = useScrollOverflow(rowRef);
  const showButtons = useMediaQuery('(min-width: 768px)');
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const selectedRef = useRef<Element | null>(null);
  const prevButtonRef = useRef<HTMLButtonElement | null>(null);
  const nextButtonRef = useRef<HTMLButtonElement | null>(null);
  const focusedButtonRef = useRef<ScrollButton | null>(null);
  /** 이 부품이 마지막으로 둔 `scrollLeft`. 이 값의 `scroll` 은 사용자 스크롤이 아니다. */
  const programmaticLeftRef = useRef<number | null>(null);
  /** 선택이 바뀐 뒤 사용자가 줄을 스크롤했으면 줄·칩 크기가 바뀌어도 다시 끌어오지 않는다. */
  const userScrolledRef = useRef(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  /** 입력 신호를 받은 뒤 '사용자 조작 중'. 이 동안 온 `scroll` 만 사용자 스크롤이다. */
  const interactingRef = useRef(false);
  const interactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 포커스 유지가 옮기는 포커스(입력 신호가 아님)를 가린다. */
  const programmaticFocusRef = useRef(false);
  const layoutKeyRef = useRef('');

  const setRowRef = useCallback(
    (node: HTMLDivElement | null) => {
      rowRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref]
  );

  // DOM 만 읽는다 (상태를 바꾸지 않는다). 선택 자식이 바뀌면(처음 그릴 때 포함) 늘 보이게 하고,
  // 넘침 상태·버튼·표시가 바뀌어 줄 폭이 달라지면 사용자가 줄을 움직이지 않았을 때만 다시 보이게 한다.
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const selected = row.querySelector<HTMLElement>(selectedSelector);
    const layoutKey = `${overflow}|${showButtons}`;
    const selectionChanged = selected !== selectedRef.current;
    const layoutChanged = layoutKey !== layoutKeyRef.current;
    selectedRef.current = selected;
    layoutKeyRef.current = layoutKey;
    if (selectionChanged) userScrolledRef.current = false;
    if (!selected || !(selectionChanged || (layoutChanged && !userScrolledRef.current))) return;
    revealInRow(row, selected);
    programmaticLeftRef.current = row.scrollLeft;
  });

  // 사용자 스크롤 감지와, 줄·자식 크기가 바뀔 때(건수가 늦게 들어와 칩이 커지는 경우 등) 선택 자식 다시 보이기.
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    programmaticLeftRef.current = row.scrollLeft;

    const wrapper = wrapperRef.current;
    const clearInteractionTimer = () => {
      if (interactionTimerRef.current !== null) clearTimeout(interactionTimerRef.current);
      interactionTimerRef.current = null;
    };
    const endInteraction = () => {
      clearInteractionTimer();
      interactingRef.current = false;
    };
    const startInteraction = () => {
      interactingRef.current = true;
      clearInteractionTimer();
      interactionTimerRef.current = setTimeout(endInteraction, USER_INPUT_TIMEOUT_MS);
    };
    const supportsScrollEnd = typeof window !== 'undefined' && 'onscrollend' in window;
    const handleScroll = () => {
      const expected = programmaticLeftRef.current;
      if (expected !== null && Math.abs(row.scrollLeft - expected) <= SCROLL_SLACK_PX) return;
      if (!interactingRef.current) return;
      userScrolledRef.current = true;
      clearInteractionTimer();
      if (!supportsScrollEnd) interactionTimerRef.current = setTimeout(endInteraction, USER_SCROLL_IDLE_MS);
    };
    const handleScrollEnd = () => {
      if (interactingRef.current) endInteraction();
    };
    const handleUserFocus = (event: Event) => {
      if (programmaticFocusRef.current || event.target === row) return;
      startInteraction();
    };
    const revealAgain = () => {
      if (userScrolledRef.current) return;
      const selected = selectedRef.current;
      if (!(selected instanceof HTMLElement) || !row.contains(selected)) return;
      revealInRow(row, selected);
      programmaticLeftRef.current = row.scrollLeft;
    };
    row.addEventListener('scroll', handleScroll, { passive: true });
    row.addEventListener('scrollend', handleScrollEnd);
    row.addEventListener('focusin', handleUserFocus);
    const handleWheel = (event: WheelEvent) => {
      if (isHorizontalWheel(event)) startInteraction();
    };
    for (const type of USER_INPUT_EVENTS) wrapper?.addEventListener(type, startInteraction, { passive: true });
    wrapper?.addEventListener('wheel', handleWheel, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    const observeAll = () => {
      if (!resizeObserver) return;
      resizeObserver.disconnect();
      resizeObserver.observe(row);
      for (const child of Array.from(row.children)) resizeObserver.observe(child);
    };
    if (typeof ResizeObserver === 'function') {
      resizeObserver = new ResizeObserver(revealAgain);
      observeAll();
    }
    let mutationObserver: MutationObserver | null = null;
    if (typeof MutationObserver === 'function') {
      mutationObserver = new MutationObserver(observeAll);
      mutationObserver.observe(row, { childList: true });
    }

    return () => {
      endInteraction();
      row.removeEventListener('scroll', handleScroll);
      row.removeEventListener('scrollend', handleScrollEnd);
      row.removeEventListener('focusin', handleUserFocus);
      for (const type of USER_INPUT_EVENTS) wrapper?.removeEventListener(type, startInteraction);
      wrapper?.removeEventListener('wheel', handleWheel);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, []);

  const scrollPage = (direction: -1 | 1) => {
    const row = rowRef.current;
    if (!row) return;
    // 스크롤 버튼 클릭은 입력 신호다 (키보드 Enter·Space 클릭은 감싸개 keydown 으로도 잡힌다).
    interactingRef.current = true;
    if (interactionTimerRef.current !== null) clearTimeout(interactionTimerRef.current);
    interactionTimerRef.current = setTimeout(() => {
      interactionTimerRef.current = null;
      interactingRef.current = false;
    }, USER_INPUT_TIMEOUT_MS);
    const left = direction * row.clientWidth * SCROLL_PAGE_RATIO;
    if (typeof row.scrollBy === 'function') {
      row.scrollBy({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
    } else {
      row.scrollLeft += left;
    }
  };

  const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
    onFocus?.(event);
    const target = event.target;
    if (target !== event.currentTarget && target instanceof HTMLElement) {
      target.scrollIntoView({ inline: 'nearest', block: 'nearest' });
    }
  };

  const showPrev = showButtons && (overflow === 'start' || overflow === 'both');
  const showNext = showButtons && (overflow === 'end' || overflow === 'both');

  // 포커스를 가진 버튼이 사라졌으면 그리기 전에 포커스를 옮긴다 (DOM 만 다루고 상태를 바꾸지 않는다).
  useLayoutEffect(() => {
    const focused = focusedButtonRef.current;
    if (!focused) return;
    if (focused === 'prev' ? showPrev : showNext) return;
    focusedButtonRef.current = null;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    const row = rowRef.current;
    const opposite = focused === 'prev' ? nextButtonRef.current : prevButtonRef.current;
    const target =
      (opposite?.isConnected ? opposite : null) ??
      row?.querySelector<HTMLElement>(selectedSelector) ??
      row?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ??
      null;
    programmaticFocusRef.current = true;
    try {
      target?.focus({ preventScroll: true });
    } finally {
      programmaticFocusRef.current = false;
    }
  }, [showPrev, showNext, selectedSelector]);

  const whichButton = (button: HTMLButtonElement): ScrollButton =>
    button === prevButtonRef.current ? 'prev' : 'next';

  const handleButtonFocus = (event: FocusEvent<HTMLButtonElement>) => {
    focusedButtonRef.current = whichButton(event.currentTarget);
  };

  const handleButtonBlur = (event: FocusEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const which = whichButton(button);
    // 버튼이 문서에 남아 있으면 사용자가 포커스를 옮긴 것이다. 빠지면서 생긴 blur 는 기억을 남긴다.
    queueMicrotask(() => {
      if (button.isConnected && focusedButtonRef.current === which) focusedButtonRef.current = null;
    });
  };

  // 768 미만 넘침 표시와 bleed. 넘침이 생기고 없어질 때만 줄 폭이 바뀐다 (판정이 오가지 않는다).
  const narrow = !showButtons;
  const overflowing = overflow !== 'none';
  const hintStart = narrow && (overflow === 'start' || overflow === 'both');
  const hintEnd = narrow && (overflow === 'end' || overflow === 'both');
  const bleedStartSide = bleed === true || bleed === 'start';
  const bleedEndSide = bleed === true;
  const bleedLeft = bleedStartSide && !hintStart;
  const bleedRight = bleedEndSide && !hintEnd;
  const bleedClasses =
    bleedLeft && bleedRight
      ? 'max-md:-mx-4 max-md:px-4'
      : bleedLeft
        ? 'max-md:-ml-4 max-md:pl-4'
        : bleedRight
          ? 'max-md:-mr-4 max-md:pr-4'
          : null;
  const slotStart = narrow && overflowing && !bleedStartSide && !hintStart;
  const slotEnd = narrow && overflowing && !bleedEndSide && !hintEnd;

  return (
    <div ref={wrapperRef} className={cn('relative flex min-w-0 items-center gap-1', className)}>
      {showPrev ? (
        <IconButton
          ref={prevButtonRef}
          label={`${label} 이전 항목 보기`}
          icon={<ChevronLeft />}
          size="sm"
          variant="ghost"
          onClick={() => scrollPage(-1)}
          onFocus={handleButtonFocus}
          onBlur={handleButtonBlur}
        />
      ) : null}
      {hintStart ? (
        <span
          aria-hidden="true"
          data-overflow-hint="start"
          className={cn(HINT_CLASSES, '-mr-1', bleedStartSide && 'max-md:-ml-4')}
        >
          <ChevronLeft />
        </span>
      ) : slotStart ? (
        <span aria-hidden="true" data-overflow-slot="start" className={cn(SLOT_CLASSES, '-mr-1')} />
      ) : null}
      <div
        {...rest}
        ref={setRowRef}
        data-scroll-row=""
        data-overflow={overflow}
        data-selected-selector={selectedSelector}
        onFocus={handleFocus}
        className={cn(
          'flex min-w-0 flex-1 flex-nowrap items-center gap-2 snap-x scroll-px-6 overflow-x-auto overscroll-x-contain -my-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          bleedClasses,
          MASK_CLASSES[overflow],
          rowClassName
        )}
      >
        {children}
      </div>
      {showNext ? (
        <IconButton
          ref={nextButtonRef}
          label={`${label} 다음 항목 보기`}
          icon={<ChevronRight />}
          size="sm"
          variant="ghost"
          onClick={() => scrollPage(1)}
          onFocus={handleButtonFocus}
          onBlur={handleButtonBlur}
        />
      ) : null}
      {hintEnd ? (
        <span
          aria-hidden="true"
          data-overflow-hint="end"
          className={cn(HINT_CLASSES, '-ml-1', bleedEndSide && 'max-md:-mr-4')}
        >
          <ChevronRight />
        </span>
      ) : slotEnd ? (
        <span aria-hidden="true" data-overflow-slot="end" className={cn(SLOT_CLASSES, '-ml-1')} />
      ) : null}
    </div>
  );
}

export default ScrollRow;
