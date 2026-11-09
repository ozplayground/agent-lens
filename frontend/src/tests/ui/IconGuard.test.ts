// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * R44 (spec 14.17 설계 H2): 프론트가 정한 UI 글자에 그림 이모지를 쓰지 않는다. 아이콘은 `lucide-react` 로 그린다.
 * 대상: `src/components/**` 와 `src/app/**` 의 `.ts`·`.tsx` 파일 글자 전체.
 * 그림 이모지 = 기본이 이모지 표현인 글자(`Emoji_Presentation`) 또는 뒤에 U+FE0F 가 붙은 그림 문자.
 * 텍스트 표현 기호(`©`·`®`·`↔`·`➔`·`✓`)는 걸리지 않는다. 허용 목록은 두지 않는다.
 */

const SRC_DIR = fileURLToPath(new URL('../../', import.meta.url));
const TARGET_DIRS = [join(SRC_DIR, 'components'), join(SRC_DIR, 'app')];

const PICTOGRAPH = /\p{Emoji_Presentation}|\p{Extended_Pictographic}\u{FE0F}/gu;

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...listSourceFiles(full));
    } else if (/\.tsx?$/.test(name)) {
      out.push(full);
    }
  }
  return out.sort();
}

function codePoints(text: string): string {
  return Array.from(text)
    .map((ch) => `U+${(ch.codePointAt(0) as number).toString(16).toUpperCase().padStart(4, '0')}`)
    .join(' ');
}

/** 판정식에 걸리는 글자를 `파일:줄 글자(U+XXXX)` 로 모은다. */
function findPictographs(files: string[]): string[] {
  const hits: string[] = [];
  for (const file of files) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const match of line.matchAll(new RegExp(PICTOGRAPH.source, PICTOGRAPH.flags))) {
        hits.push(`${relative(SRC_DIR, file)}:${i + 1} ${match[0]}(${codePoints(match[0])})`);
      }
    });
  }
  return hits;
}

function countMatches(text: string): number {
  return Array.from(text.matchAll(new RegExp(PICTOGRAPH.source, PICTOGRAPH.flags))).length;
}

describe('IconGuard (R44)', () => {
  const files = TARGET_DIRS.flatMap((dir) => listSourceFiles(dir));

  it('finds the source files to scan in components/** and app/**', () => {
    expect(files.some((f) => relative(SRC_DIR, f).startsWith('components'))).toBe(true);
    expect(files.some((f) => relative(SRC_DIR, f).startsWith('app'))).toBe(true);
    expect(files.length).toBeGreaterThan(50);
  });

  it('the rule matches pictographic emoji but not text-presentation symbols', () => {
    expect(countMatches('💡🔄📊⚡🎯🧠🔒')).toBe(7);
    expect(countMatches('🛠️⚖️⚠️')).toBe(3);
    expect(countMatches('© ® ↔ ➔ ✓')).toBe(0);
  });

  it('has no pictographic emoji in UI source text', () => {
    expect(findPictographs(files)).toEqual([]);
  });
});
