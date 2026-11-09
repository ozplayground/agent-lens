import { useEffect, useState, type RefObject } from 'react';

/** 가로 스크롤 줄의 넘침 상태. 넘친 쪽(아직 볼 것이 남은 쪽)을 가리킨다. */
export type ScrollOverflow = 'none' | 'start' | 'end' | 'both';

/** 이 값 이하의 차이는 넘침으로 보지 않는다 (소수점 배치 오차). */
const OVERFLOW_SLACK_PX = 1;

/** 요소의 `scrollLeft`·`scrollWidth`·`clientWidth` 로 넘침 상태를 정한다. */
export function measureScrollOverflow(el: HTMLElement): ScrollOverflow {
  const maxScroll = el.scrollWidth - el.clientWidth;
  if (maxScroll <= OVERFLOW_SLACK_PX) return 'none';
  const scrollLeft = Math.abs(el.scrollLeft);
  const hasStart = scrollLeft > OVERFLOW_SLACK_PX;
  const hasEnd = scrollLeft < maxScroll - OVERFLOW_SLACK_PX;
  if (hasStart && hasEnd) return 'both';
  if (hasStart) return 'start';
  if (hasEnd) return 'end';
  return 'none';
}

function scheduleFrame(callback: () => void): () => void {
  if (typeof window.requestAnimationFrame === 'function') {
    const id = window.requestAnimationFrame(callback);
    return () => window.cancelAnimationFrame(id);
  }
  const id = window.setTimeout(callback, 0);
  return () => window.clearTimeout(id);
}

/**
 * 가로 스크롤 줄이 어느 쪽으로 넘치는지 돌려준다.
 * - `ResizeObserver` 로 줄과 자식의 크기 변화를, `MutationObserver` 로 자식 추가·삭제를 본다.
 * - `scroll` 이벤트와 창 `resize` 에서도 다시 잰다.
 * - `ResizeObserver` 가 없으면(jsdom) 던지지 않고 처음 한 번과 `scroll`·`resize` 로만 잰다.
 * - 상태는 관찰자·이벤트·`requestAnimationFrame` 콜백 안에서만 바꾼다.
 */
export function useScrollOverflow(ref: RefObject<HTMLElement | null>): ScrollOverflow {
  const [overflow, setOverflow] = useState<ScrollOverflow>('none');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => setOverflow(measureScrollOverflow(el));
    let cancelFrame: (() => void) | null = null;
    const schedule = () => {
      cancelFrame?.();
      cancelFrame = scheduleFrame(() => {
        cancelFrame = null;
        update();
      });
    };

    schedule();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', schedule);

    let resizeObserver: ResizeObserver | null = null;
    const observeChildren = () => {
      if (!resizeObserver) return;
      resizeObserver.disconnect();
      resizeObserver.observe(el);
      for (const child of Array.from(el.children)) resizeObserver.observe(child);
    };
    if (typeof ResizeObserver === 'function') {
      resizeObserver = new ResizeObserver(schedule);
      observeChildren();
    }

    let mutationObserver: MutationObserver | null = null;
    if (typeof MutationObserver === 'function') {
      mutationObserver = new MutationObserver(() => {
        observeChildren();
        schedule();
      });
      mutationObserver.observe(el, { childList: true });
    }

    return () => {
      cancelFrame?.();
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', schedule);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [ref]);

  return overflow;
}

export default useScrollOverflow;
