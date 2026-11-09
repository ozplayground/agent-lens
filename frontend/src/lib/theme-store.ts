/**
 * 테마 외부 저장소 (`useSyncExternalStore` 용).
 *
 * - 저장값의 원천은 `localStorage[storageKey]` 와 `matchMedia('(prefers-color-scheme: dark)')` 다.
 *   스냅샷을 만들 때마다 둘을 새로 읽는다 (캐시한 `MediaQueryList.matches` 를 쓰지 않는다).
 * - 모듈 단위 상태를 두지 않는다. 저장소는 `createThemeStore()` 로 만든 인스턴스마다 따로 갖는다.
 * - 같은 탭의 변경은 window 이벤트(`THEME_CHANGE_EVENT`)로, 다른 탭의 변경은 `storage` 이벤트로 알린다.
 */

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';
export const THEME_CHANGE_EVENT = 'agentlens:theme-change';

const THEME_MODES: readonly ThemeMode[] = ['light', 'dark', 'system'];

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && (THEME_MODES as readonly string[]).includes(value);
}

/** 순환 순서: light → dark → system → light */
export function nextThemeMode(current: ThemeMode): ThemeMode {
  if (current === 'light') return 'dark';
  if (current === 'dark') return 'system';
  return 'light';
}

export function resolveTheme(mode: ThemeMode, systemDark: boolean): ResolvedTheme {
  if (mode === 'system') return systemDark ? 'dark' : 'light';
  return mode;
}

/** 호출 시점에 `window.matchMedia` 를 찾는다. 없으면 null. */
function getDarkSchemeQueryList(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  try {
    return window.matchMedia(DARK_SCHEME_QUERY);
  } catch {
    return null;
  }
}

export function readSystemDark(): boolean {
  const mql = getDarkSchemeQueryList();
  return mql ? Boolean(mql.matches) : false;
}

/** 스냅샷은 비교가 안정적인 문자열이다: `<mode>|<light|dark>` (두 번째는 시스템 선호). */
export type ThemeSnapshot = `${ThemeMode}|${ResolvedTheme}`;

export function parseSnapshot(snapshot: ThemeSnapshot): { theme: ThemeMode; systemTheme: ResolvedTheme } {
  const [theme, systemTheme] = snapshot.split('|') as [ThemeMode, ResolvedTheme];
  return { theme, systemTheme };
}

export interface ThemeStore {
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => ThemeSnapshot;
  getServerSnapshot: () => ThemeSnapshot;
  getMode: () => ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export function createThemeStore(storageKey: string, defaultTheme: ThemeMode): ThemeStore {
  // localStorage 를 쓸 수 없을 때만 쓰는 인스턴스 안의 대체값.
  let fallbackMode: ThemeMode | null = null;

  const getMode = (): ThemeMode => {
    if (typeof window === 'undefined') return defaultTheme;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (isThemeMode(saved)) return saved;
      return defaultTheme;
    } catch {
      return fallbackMode ?? defaultTheme;
    }
  };

  const getSnapshot = (): ThemeSnapshot =>
    `${getMode()}|${readSystemDark() ? 'dark' : 'light'}`;

  const getServerSnapshot = (): ThemeSnapshot => `${defaultTheme}|light`;

  const setMode = (mode: ThemeMode) => {
    try {
      window.localStorage.setItem(storageKey, mode);
      fallbackMode = null;
    } catch {
      fallbackMode = mode;
    }
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { storageKey } }));
  };

  const subscribe = (onChange: () => void) => {
    if (typeof window === 'undefined') return () => {};

    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === storageKey) onChange();
    };
    const onLocalChange = (e: Event) => {
      const detail = (e as CustomEvent<{ storageKey?: string }>).detail;
      if (!detail || detail.storageKey === storageKey) onChange();
    };
    const onSystemChange = () => onChange();

    window.addEventListener('storage', onStorage);
    window.addEventListener(THEME_CHANGE_EVENT, onLocalChange);

    const mql = getDarkSchemeQueryList();
    let detachSystem = () => {};
    if (mql) {
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', onSystemChange);
        detachSystem = () => mql.removeEventListener('change', onSystemChange);
      } else if (typeof mql.addListener === 'function') {
        mql.addListener(onSystemChange);
        detachSystem = () => mql.removeListener(onSystemChange);
      }
    }

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(THEME_CHANGE_EVENT, onLocalChange);
      detachSystem();
    };
  };

  return { subscribe, getSnapshot, getServerSnapshot, getMode, setMode };
}

/** `<html>` 에 테마를 적용한다: 클래스 하나(`dark`/`light`), `data-theme`, `style.colorScheme`. */
export function applyThemeToDocument(resolved: ResolvedTheme, attribute: string = 'class'): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (attribute === 'class') {
    root.classList.remove(resolved === 'dark' ? 'light' : 'dark');
    root.classList.add(resolved);
  } else if (attribute !== 'data-theme') {
    root.setAttribute(attribute, resolved);
  }
  root.setAttribute('data-theme', resolved);
  root.style.colorScheme = resolved;
}
