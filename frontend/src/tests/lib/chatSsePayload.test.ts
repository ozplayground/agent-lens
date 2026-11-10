// @vitest-environment node
import { describe, it, expect, expectTypeOf } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseChatSsePayload } from '@/lib/contract';
import type {
  ChatDonePayload,
  ChatSourcesPayload,
  ChatStatusPayload,
  ChatStreamErrorPayload,
  SseTokenPayload,
} from '@/types/chat';

/**
 * FE-38: 챗 SSE payload 를 검증한 결과의 타입을 버리지 않는다.
 * 이벤트 이름이 정해진 경우 반환 타입이 그 이벤트의 계약 타입이다 (`tsc --noEmit` 이 확인).
 */

describe('parseChatSsePayload 반환 타입 (FE-38)', () => {
  it('이벤트별 계약 타입을 돌려준다', () => {
    expectTypeOf(parseChatSsePayload('status', {})).toEqualTypeOf<ChatStatusPayload>();
    expectTypeOf(parseChatSsePayload('sources', {})).toEqualTypeOf<ChatSourcesPayload>();
    expectTypeOf(parseChatSsePayload('token', {})).toEqualTypeOf<SseTokenPayload>();
    expectTypeOf(parseChatSsePayload('done', {})).toEqualTypeOf<ChatDonePayload>();
    expectTypeOf(parseChatSsePayload('error', {})).toEqualTypeOf<ChatStreamErrorPayload>();
  });

  it('검증을 통과하면 기본값이 채워진 값을 돌려준다 (동작은 그대로)', () => {
    const done = parseChatSsePayload('done', { session_id: 's', sources_count: 0, latency_ms: 10 });
    expect(done.model_tier).toBe('sonnet');
    expect(done.done).toBe(true);
  });

  it('챗 화면은 SSE payload 를 any 로 바꾸지 않는다', () => {
    const src = readFileSync(
      fileURLToPath(new URL('../../components/chat/ChatWorkspace.tsx', import.meta.url)),
      'utf8'
    );
    expect(src).not.toMatch(/ReturnType<typeof JSON\.parse>/);
  });
});
