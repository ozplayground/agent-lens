// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * R2·접근성 (spec 설계 1.3, 11.3): `globals.css` 의 `:root`(라이트)·`.dark`(다크) 토큰 값으로
 * 1.3 표의 조합을 WCAG 2.x 상대 휘도 공식으로 계산한다.
 * 글자는 4.5:1, UI 경계(`border-strong`)·포커스 링(`accent`)은 3:1 이상.
 */

const css = readFileSync(fileURLToPath(new URL('../../app/globals.css', import.meta.url)), 'utf8');

function readBlock(selector: string): Record<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const block = new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  if (!block) throw new Error(`globals.css 에 ${selector} 블록이 없다`);
  const tokens: Record<string, string> = {};
  for (const m of block[1].matchAll(/--al-([a-z-]+)\s*:\s*([^;]+);/g)) {
    tokens[m[1]] = m[2].trim();
  }
  return tokens;
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`6자리 hex 가 아니다: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** [전경 토큰, 배경 토큰, 최소 대비] — spec 1.3 표의 '대비 확인' 열 */
const PAIRS: [string, string, number][] = [
  ['fg', 'surface', 4.5],
  ['fg', 'surface-muted', 4.5],
  ['fg-muted', 'surface', 4.5],
  ['fg-muted', 'surface-muted', 4.5],
  ['fg-subtle', 'surface', 4.5],
  ['fg-subtle', 'canvas', 4.5],
  ['fg-subtle', 'surface-muted', 4.5],
  ['border-strong', 'surface', 3],
  ['border-strong', 'canvas', 3],
  ['accent', 'surface', 4.5],
  ['accent', 'canvas', 4.5],
  ['accent', 'surface-muted', 4.5],
  ['on-accent', 'accent-solid', 4.5],
  ['on-accent', 'accent-solid-hover', 4.5],
  ['accent-soft-fg', 'accent-soft', 4.5],
  ['success', 'surface', 4.5],
  ['success', 'success-soft', 4.5],
  ['warning', 'surface', 4.5],
  ['warning', 'canvas', 4.5],
  ['warning', 'warning-soft', 4.5],
  ['danger', 'surface', 4.5],
  ['danger', 'surface-muted', 4.5],
  ['danger', 'danger-soft', 4.5],
  ['on-accent', 'danger-solid', 4.5],
  ['on-accent', 'danger-solid-hover', 4.5],
];

/** 포커스 링(`accent`, 3:1)은 링이 놓이는 모든 배경에서 확인한다. */
const FOCUS_BACKGROUNDS = ['canvas', 'surface', 'surface-muted'];

describe('TokenContrast', () => {
  it('computes known WCAG reference ratios', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
  });

  for (const [theme, selector] of [
    ['light', ':root'],
    ['dark', '.dark'],
  ] as const) {
    describe(`${theme} (${selector})`, () => {
      const tokens = readBlock(selector);

      it.each(PAIRS)('%s on %s ≥ %d:1', (fg, bg, min) => {
        expect(tokens[fg], `--al-${fg}`).toBeDefined();
        expect(tokens[bg], `--al-${bg}`).toBeDefined();
        const ratio = contrastRatio(tokens[fg], tokens[bg]);
        expect(ratio, `${theme} ${fg} ${tokens[fg]} / ${bg} ${tokens[bg]} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(min);
      });

      it.each(FOCUS_BACKGROUNDS)('focus ring (accent) on %s ≥ 3:1', (bg) => {
        expect(contrastRatio(tokens.accent, tokens[bg])).toBeGreaterThanOrEqual(3);
      });
    });
  }
});
