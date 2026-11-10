// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * FE-16: `layout.tsx` 의 `viewport.themeColor` 는 CSS 변수를 받지 못해 hex 를 복사해 둔다.
 * 모바일 브라우저 상단 색이 바탕과 어긋나지 않도록 `globals.css` 의 `--al-canvas` 와 같은지 확인한다.
 */

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');
const css = read('../../app/globals.css');
const layout = read('../../app/layout.tsx');

function canvasToken(selector: ':root' | '.dark'): string {
  const escaped = selector.replace('.', '\\.');
  const block = new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  const value = block && /--al-canvas\s*:\s*([^;]+);/.exec(block[1]);
  if (!value) throw new Error(`globals.css ${selector} 에 --al-canvas 가 없다`);
  return value[1].trim().toLowerCase();
}

function themeColor(scheme: 'light' | 'dark'): string {
  const m = new RegExp(`prefers-color-scheme:\\s*${scheme}\\)"\\s*,\\s*color:\\s*"(#[0-9a-fA-F]{6})"`).exec(layout);
  if (!m) throw new Error(`layout.tsx themeColor 에 ${scheme} 값이 없다`);
  return m[1].toLowerCase();
}

describe('viewport.themeColor 와 바탕 토큰 (FE-16)', () => {
  it('라이트 themeColor 는 :root 의 --al-canvas 와 같다', () => {
    expect(themeColor('light')).toBe(canvasToken(':root'));
  });

  it('다크 themeColor 는 .dark 의 --al-canvas 와 같다', () => {
    expect(themeColor('dark')).toBe(canvasToken('.dark'));
  });
});
