import { useCallback, useSyncExternalStore } from 'react';

/** 호출 시점에 `window.matchMedia` 를 찾는다. 서버이거나 함수가 아니면 null (jsdom 기본값). */
function getMediaQueryList(query: string): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  try {
    return window.matchMedia(query) ?? null;
  } catch {
    return null;
  }
}

/** 서버 렌더와 하이드레이션 첫 렌더는 항상 false 다. */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * CSS 미디어 쿼리가 맞는지 돌려준다. 화면 너비 판정은 이 훅만 쓴다.
 * - `useSyncExternalStore` 로 `matchMedia` 의 `change` 를 구독한다.
 * - 스냅샷은 매번 `matchMedia(query).matches` 를 새로 읽는다 (목이 호출마다 새 객체를 돌려줘도 맞다).
 * - `matchMedia` 가 없으면 false.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = getMediaQueryList(query);
      if (!mql) return () => {};
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
      }
      if (typeof mql.addListener === 'function') {
        mql.addListener(onChange);
        return () => mql.removeListener(onChange);
      }
      return () => {};
    },
    [query]
  );

  const getSnapshot = useCallback(() => Boolean(getMediaQueryList(query)?.matches), [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
