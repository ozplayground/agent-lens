// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * R1 (spec 설계 11.3): 화면 코드는 토큰 유틸리티만 쓴다.
 * `src/**\/*.tsx` 에 hex 색 클래스, Tailwind 기본 팔레트 색 유틸리티, 옛 애니메이션 클래스가 없고,
 * `globals.css` 에 `!important` 와 옛 테마 덮어쓰기 선택자가 없어야 한다.
 */

const SRC_DIR = fileURLToPath(new URL('../../', import.meta.url));
const GLOBALS_CSS = join(SRC_DIR, 'app', 'globals.css');

const HEX_CLASS = /-\[#[0-9a-fA-F]{3,8}\]/g;
const PALETTE_UTILITY =
  /\b(?:[a-z-]+:)*(?:bg|text|border|ring|ring-offset|outline|divide|from|via|to|fill|stroke|placeholder|decoration|caret|accent|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d{2,3})?(?:\/\d+)?\b/g;
const LEGACY_ANIMATION = /animate-in|zoom-in|slide-in-from/g;

function listTsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...listTsxFiles(full));
    } else if (name.endsWith('.tsx')) {
      out.push(full);
    }
  }
  return out.sort();
}

/** 정규식에 맞는 곳을 `파일:줄  일치` 로 모은다. */
function findViolations(files: string[], pattern: RegExp): string[] {
  const hits: string[] = [];
  for (const file of files) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const match of line.matchAll(new RegExp(pattern.source, pattern.flags))) {
        hits.push(`${relative(SRC_DIR, file)}:${i + 1}  ${match[0]}`);
      }
    });
  }
  return hits;
}

describe('TokenGuard (R1)', () => {
  const files = listTsxFiles(SRC_DIR);

  it('finds the source files to scan', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it('has no hex color classes in .tsx files', () => {
    expect(findViolations(files, HEX_CLASS)).toEqual([]);
  });

  it('has no Tailwind palette color utilities in .tsx files', () => {
    expect(findViolations(files, PALETTE_UTILITY)).toEqual([]);
  });

  it('has no legacy tailwindcss-animate classes in .tsx files', () => {
    expect(findViolations(files, LEGACY_ANIMATION)).toEqual([]);
  });

  it('globals.css has no !important and no legacy html:not(.dark) / html.dark overrides', () => {
    const hits = findViolations([GLOBALS_CSS], /!important|html:not\(\.dark\)|html\.dark/g);
    expect(hits).toEqual([]);
  });
});
