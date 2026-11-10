// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * RSC/RCC 경계 (리뷰 FE-06). 훅을 부르거나 이벤트 처리 함수를 직접 만드는 컴포넌트 파일은
 * 서버 컴포넌트에서 import 해도 빌드가 깨지지 않게 맨 위에 `'use client'` 를 둔다.
 * 판정: `useXxx(` 호출 또는 `onXxx={(...) =>` 처럼 JSX 안에서 함수를 만드는 파일.
 */
const SRC_DIR = join(process.cwd(), 'src');
const TARGET_DIRS = [join(SRC_DIR, 'components')];

function listTsx(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listTsx(full));
    else if (name.endsWith('.tsx')) out.push(full);
  }
  return out.sort();
}

const HOOK_CALL = /\buse[A-Z]\w*(?:<[^>]*>)?\(/;
const INLINE_HANDLER = /\bon[A-Z]\w*=\{\s*(?:\([^)]*\)|\w+)\s*=>/;
const USE_CLIENT = /^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*['"]use client['"]/;

describe("'use client' 경계 (FE-06)", () => {
  it('훅이나 인라인 이벤트 처리 함수를 쓰는 컴포넌트는 모두 use client 로 시작한다', () => {
    const missing = TARGET_DIRS.flatMap(listTsx)
      .filter((file) => {
        const text = readFileSync(file, 'utf8');
        return (HOOK_CALL.test(text) || INLINE_HANDLER.test(text)) && !USE_CLIENT.test(text);
      })
      .map((file) => relative(SRC_DIR, file));
    expect(missing).toEqual([]);
  });

  it("onRetry 를 버튼에 이어 주는 ErrorState 도 use client 다 (리뷰 FE-06 목록)", () => {
    const text = readFileSync(join(SRC_DIR, 'components/ui/ErrorState.tsx'), 'utf8');
    expect(USE_CLIENT.test(text)).toBe(true);
  });
});
