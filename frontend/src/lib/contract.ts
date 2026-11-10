import type { z } from 'zod';
import {
  ErrorResponseSchema,
  ChatStatusPayloadSchema,
  ChatSourcesPayloadSchema,
  SseTokenPayloadSchema,
  ChatDonePayloadSchema,
  ChatStreamErrorPayloadSchema,
} from '@/types/chat';
import {
  NewsAskMetaEventSchema,
  NewsAskTokenEventSchema,
  NewsAskDoneEventSchema,
  NewsAskErrorEventSchema,
  type NewsAskSseEvent,
} from '@/types/news';

/**
 * 런타임 응답 검증 정책 (계약 문서 2절 머리, v1.3):
 * - backend 응답을 받는 경계에서 zod `safeParse` 한다.
 * - 통과하면 zod 결과(기본값 적용)를 쓴다.
 * - 실패하면 화면을 죽이지 않는다. 개발·테스트에서는 `console.warn` 으로 계약 위반을 알리고, 받은 데이터를 그대로 쓴다.
 */
export function parseResponse<S extends z.ZodType>(schema: S, data: unknown, label: string): z.output<S> {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[계약 위반] ${label}`, result.error.issues);
  }
  return data as z.output<S>;
}

/** 응답 본문 JSON 을 읽어 `parseResponse` 한다 */
export async function readJson<S extends z.ZodType>(res: Response, schema: S, label: string): Promise<z.output<S>> {
  return parseResponse(schema, await res.json(), label);
}

/**
 * 실패 응답의 화면 문구. backend 공통 오류 `{error_code, message, details}` 의 `message` 를 쓰고,
 * 본문이 그 모양이 아니면(JSON 아님, 프록시 오류 등) `fallback` 을 쓴다.
 */
export async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const parsed = ErrorResponseSchema.safeParse(await res.json());
    if (parsed.success) return parsed.data.message;
  } catch {
    // JSON 이 아닌 본문
  }
  return fallback;
}

const SSE_PAYLOAD_SCHEMAS: Record<string, z.ZodType> = {
  status: ChatStatusPayloadSchema,
  sources: ChatSourcesPayloadSchema,
  token: SseTokenPayloadSchema,
  done: ChatDonePayloadSchema,
  error: ChatStreamErrorPayloadSchema,
};

/** 이벤트 이름 → 검증된 payload 타입 (FE-38: 호출한 쪽이 zod 타입을 그대로 쓴다) */
export interface ChatSsePayloads {
  status: z.output<typeof ChatStatusPayloadSchema>;
  sources: z.output<typeof ChatSourcesPayloadSchema>;
  token: z.output<typeof SseTokenPayloadSchema>;
  done: z.output<typeof ChatDonePayloadSchema>;
  error: z.output<typeof ChatStreamErrorPayloadSchema>;
}

/** 챗 SSE 이벤트 payload 를 검증한다. 모르는 이벤트는 그대로 돌려준다. 실패 시 정책은 `parseResponse` 와 같다 */
export function parseChatSsePayload<E extends keyof ChatSsePayloads>(event: E, data: unknown): ChatSsePayloads[E];
export function parseChatSsePayload(event: string, data: unknown): unknown;
export function parseChatSsePayload(event: string, data: unknown): unknown {
  const schema = SSE_PAYLOAD_SCHEMAS[event];
  return schema ? parseResponse(schema, data, `POST /api/chat/stream event: ${event}`) : data;
}

const NEWS_ASK_EVENT_SCHEMAS: Record<string, z.ZodType> = {
  meta: NewsAskMetaEventSchema,
  token: NewsAskTokenEventSchema,
  done: NewsAskDoneEventSchema,
  error: NewsAskErrorEventSchema,
};

/**
 * 기사 Ask AI 스트림의 `data:` JSON 을 `event` 필드로 골라 검증한다 (v1.4).
 * 네 이벤트는 판별 유니온으로 돌려주고, 모르는 이벤트·`event` 없음은 null 이다 (호출한 쪽은 원래도 무시했다).
 * 검증 실패 시 정책은 `parseResponse` 와 같다 (던지지 않고 경고 + 원본). 반환 타입으로 `any` 를 없앤다 (FE-42).
 */
export function parseNewsAskSsePayload(data: unknown): NewsAskSseEvent | null {
  const event = (data as { event?: unknown } | null)?.event;
  const schema = typeof event === 'string' ? NEWS_ASK_EVENT_SCHEMAS[event] : undefined;
  return schema ? (parseResponse(schema, data, `POST /api/news/{id}/ask/stream event: ${event}`) as NewsAskSseEvent) : null;
}
