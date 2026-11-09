import '@testing-library/jest-dom/vitest';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { server } from '@/mocks/server';

if (typeof window !== 'undefined') {
  window.HTMLElement.prototype.scrollIntoView = function () {};
}

/**
 * 기본 `window.matchMedia` 목. jsdom 에는 matchMedia 가 없다.
 * 너비 1280px 데스크톱 화면으로 가정한다:
 * - `(min-width: Npx)` 는 N <= 1280 이면 true, `(max-width: Npx)` 는 N >= 1280 이면 true
 * - `prefers-color-scheme: dark`, `prefers-reduced-motion: reduce` 등 그 밖의 특성은 false
 * - 리스너 등록 함수는 아무것도 하지 않는다
 * 테스트가 `window.matchMedia = …` 로 바꾸면 그 값이 이긴다 (writable).
 */
const TEST_VIEWPORT_WIDTH = 1280;

function evaluateMediaFeature(feature: string): boolean {
  const width = /^\(\s*(min|max)-width\s*:\s*(\d+(?:\.\d+)?)px\s*\)$/i.exec(feature);
  if (width) {
    const px = Number(width[2]);
    return width[1].toLowerCase() === 'min' ? px <= TEST_VIEWPORT_WIDTH : px >= TEST_VIEWPORT_WIDTH;
  }
  if (/^(only\s+)?(screen|all)$/i.test(feature)) return true;
  return false;
}

function evaluateTestMediaQuery(query: string): boolean {
  return query
    .split(',')
    .some((alternative) =>
      alternative
        .trim()
        .split(/\s+and\s+/i)
        .every((feature) => evaluateMediaFeature(feature.trim()))
    );
}

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string): MediaQueryList => ({
      matches: evaluateTestMediaQuery(query),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(() => null),
  }),
  usePathname: () => '',
}));

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
