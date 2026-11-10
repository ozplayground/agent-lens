// @vitest-environment node
import { describe, it, expect, expectTypeOf } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseNewsAskSsePayload } from '@/lib/contract';
import type { NewsAskSseEvent } from '@/types/news';

/**
 * FE-42: 기사 Ask AI 스트림 파서가 검증 결과의 타입을 버리지 않는다 (FE-38 과 같은 꼴).
 * 네 이벤트는 판별 유니온, 모르는 이벤트는 null (호출한 쪽은 원래도 무시했다).
 */

describe('parseNewsAskSsePayload 반환 타입 (FE-42)', () => {
  it('판별 유니온 또는 null 을 돌려준다', () => {
    expectTypeOf(parseNewsAskSsePayload({})).toEqualTypeOf<NewsAskSseEvent | null>();
  });

  it('네 이벤트는 검증한 값, 모르는 이벤트·event 없음은 null 이다 (동작은 그대로: 화면은 무시)', () => {
    expect(parseNewsAskSsePayload({ event: 'token', text: '가' })).toEqual({ event: 'token', text: '가' });
    expect(parseNewsAskSsePayload({ event: 'error', error_code: 'ERR_X', message: '끊김' })).toEqual({
      event: 'error',
      error_code: 'ERR_X',
      message: '끊김',
      retryable: true,
    });
    expect(parseNewsAskSsePayload({ event: 'ping' })).toBeNull();
    expect(parseNewsAskSsePayload({ text: '이벤트 없음' })).toBeNull();
  });

  it('lib/api.ts 는 SSE payload 를 any 로 바꾸지 않는다', () => {
    const src = readFileSync(fileURLToPath(new URL('../../lib/api.ts', import.meta.url)), 'utf8');
    expect(src).not.toMatch(/ReturnType<typeof JSON\.parse>/);
  });
});
