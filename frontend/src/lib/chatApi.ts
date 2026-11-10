import { z } from 'zod';
import { CONNECT_FAILED_MESSAGE, fetchWithTimeout } from '@/lib/api';
import { readErrorMessage, readJson } from '@/lib/contract';
import {
  ChatSessionDetailSchema,
  ChatSessionSummarySchema,
  ChatSourceDetailResponseSchema,
  type ChatSessionDetail,
  type ChatSessionSummary,
  type ChatSourceDetailResponse,
} from '@/types/chat';

/**
 * 챗 REST 호출 (FE-07). 모두 공통 `fetchWithTimeout` 을 거쳐 멈춘 요청이 로딩을 붙잡지 않게 한다.
 * 오류는 backend 공통 응답의 `message` 를 문구로 던지고, 없거나 네트워크 오류면 정해 둔 문구를 쓴다.
 * 응답은 `readJson` 으로 계약 스키마를 확인한다 (실패 정책은 `lib/contract.ts`).
 * 세션 id 는 경로에 인코딩해 넣는다 (FE-24).
 */

/** 세션·기사 조회와 저장·삭제의 응답 대기 한도 (공통 기본값과 같다). */
export const CHAT_REQUEST_TIMEOUT_MS = 8000;
/** 스트림은 첫 응답(머리)까지만 기다린다. 본문(토큰)은 제한하지 않는다. */
export const CHAT_STREAM_FIRST_BYTE_TIMEOUT_MS = 30000;

const STREAM_TIMEOUT_MESSAGE = '응답이 늦어 요청을 멈췄습니다. 다시 시도해 주세요.';

const sessionPath = (sessionId: string) => `/api/chat/sessions/${encodeURIComponent(sessionId)}`;

/**
 * 요청을 보내고 실패를 문구 있는 Error 로 바꾼다. `allow404` 면 404 응답을 그대로 돌려준다.
 * `fallback` 은 시간 초과 문구, `httpFallback` 은 오류 응답에 message 가 없을 때의 문구다 (없으면 `fallback`).
 * 연결 자체가 실패하면 기사 질문과 같은 `CONNECT_FAILED_MESSAGE` 를 쓴다.
 */
async function request(
  url: string,
  init: RequestInit,
  fallback: string,
  { timeoutMs = CHAT_REQUEST_TIMEOUT_MS, allow404 = false, httpFallback = fallback } = {}
): Promise<Response> {
  let res: Response;
  try {
    res = await fetchWithTimeout(url, init, timeoutMs);
  } catch (err: unknown) {
    // 사용자 중단은 그대로 올린다. 시간 초과(제한 타이머의 중단)는 정해 둔 문구, 연결 실패는 연결 문구로 바꾼다.
    if (init.signal?.aborted) throw err;
    if (err instanceof Error && err.name === 'AbortError') throw new Error(fallback);
    throw new Error(CONNECT_FAILED_MESSAGE);
  }
  if (!res.ok && !(allow404 && res.status === 404)) {
    throw new Error(await readErrorMessage(res, httpFallback));
  }
  return res;
}

export async function fetchChatSessions(limit: number): Promise<ChatSessionSummary[]> {
  const res = await request(`/api/chat/sessions?limit=${limit}`, {}, '대화 목록을 불러오지 못했습니다.');
  return readJson(res, z.array(ChatSessionSummarySchema), 'GET /api/chat/sessions');
}

/** 세션 상세. 서버에 없으면(404) null. */
export async function fetchChatSessionDetail(sessionId: string): Promise<ChatSessionDetail | null> {
  const res = await request(sessionPath(sessionId), {}, '대화를 불러오지 못했습니다.', { allow404: true });
  return res.status === 404 ? null : readJson(res, ChatSessionDetailSchema, 'GET /api/chat/sessions/{id}');
}

export async function saveChatSession(payload: unknown): Promise<void> {
  await request(
    '/api/chat/sessions',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
    '대화를 저장하지 못했습니다.'
  );
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  await request(sessionPath(sessionId), { method: 'DELETE' }, '대화를 삭제하지 못했습니다.');
}

/** 기사 상세. 기사가 없으면(404) null, 연결·서버 오류는 던진다 (FE-41). */
export async function fetchChatSourceDetail(sourceId: number): Promise<ChatSourceDetailResponse | null> {
  const res = await request(`/api/chat/sources/${sourceId}`, {}, '기사를 불러오지 못했습니다.', { allow404: true });
  return res.status === 404 ? null : readJson(res, ChatSourceDetailResponseSchema, 'GET /api/chat/sources/{id}');
}

/**
 * 챗 SSE 스트림을 연다. 첫 응답까지 `CHAT_STREAM_FIRST_BYTE_TIMEOUT_MS` 를 기다리고,
 * `signal` 중단은 AbortError 로 끝난다. 본문은 호출한 쪽이 읽는다.
 */
export async function openChatStream(body: unknown, signal: AbortSignal): Promise<Response> {
  return request(
    '/api/chat/stream',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal },
    STREAM_TIMEOUT_MESSAGE,
    { timeoutMs: CHAT_STREAM_FIRST_BYTE_TIMEOUT_MS, httpFallback: '답변을 받지 못했습니다. 다시 시도해 주세요.' }
  );
}
