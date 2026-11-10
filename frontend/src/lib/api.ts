import {
  NewsListResponseSchema,
  ScheduleStatusSchema,
  StatsResponseSchema,
  DailyBriefingSchema,
  BriefingSettingsSchema,
  CrawlProgressSchema,
  ManualCollectResponseSchema,
  ResetAndCollectResponseSchema,
  SourcesResponseSchema,
  StatusMessageResponseSchema,
  AddRssSourceResponseSchema,
  InspectUrlResponseSchema,
  ResearchStatusSchema,
  ResearchAuditLogsResponseSchema,
  RunDeepResearchResponseSchema,
  NotionExportResponseSchema,
  SuccessMessageResponseSchema,
  type NewsListResponse,
  type ScheduleStatus,
  type StatsResponse,
  type DailyBriefing,
  type BriefingSettings,
  type CrawlProgress,
  type ManualCollectResponse,
  type ResetAndCollectResponse,
  type SourcesResponse,
  type StatusMessageResponse,
  type AddRssSourceResponse,
  type InspectUrlResponse,
  type ResearchStatus,
  type ResearchAuditLogsResponse,
  type RunDeepResearchResponse,
  type NotionExportResponse,
  type SuccessMessageResponse,
} from '@/types/news';
import { TechRadarDataSchema, type TechRadarData } from '@/types/trends';
import { readJson, readErrorMessage, parseNewsAskSsePayload } from '@/lib/contract';

// 응답 타입은 `@/types/news` 의 zod 스키마에서 나온다 (계약 CT-006). 옛 import 경로를 위해 다시 내보낸다.
export type {
  CrawlProgress,
  SourceItem,
  MonitoredRepo,
  SourcesResponse,
  InspectUrlResponse,
  ResearchStatus,
  ResearchAuditLog,
} from '@/types/news';
import { getClientEnv } from '@/lib/env';

function getApiBase(): string {
  if (typeof window !== 'undefined') {
    // In browser: relative URL works everywhere (localhost, 127.0.0.1, Tailscale, LAN IP)
    // Next.js rewrites /api/* to http://127.0.0.1:8000/api/* seamlessly
    return '';
  }
  return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
}

/**
 * 기사 질문 스트림의 연결 주소 (QA D-41). `NEXT_PUBLIC_API_URL` 이 있으면 backend 에 직접 붙고,
 * 없으면 `getApiBase()` 와 같다 (브라우저는 같은 출처 `/api/...` → Next rewrite → `INTERNAL_API_URL`).
 * backend 포트를 짐작하지 않는다: Docker 처럼 포트를 바꾼 배포에서 다른 backend 로 가지 않게 한다.
 */
function getDirectApiBase(): string {
  return getClientEnv().NEXT_PUBLIC_API_URL || getApiBase();
}

/**
 * 응답 머리가 올 때까지 `timeoutMs` 를 기다린다 (본문 읽기는 제한하지 않는다).
 * `options.signal` 을 주면 그 중단도 함께 따른다 (챗 스트림의 사용자 중단, FE-07).
 */
export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const outer = options.signal;
  if (outer?.aborted) controller.abort();
  else outer?.addEventListener('abort', () => controller.abort(), { once: true });
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export async function fetchNewsFeed(params: {
  category?: string;
  source?: string;
  search?: string;
  sort?: string;
  high_signal_only?: boolean;
  page?: number;
  size?: number;
}): Promise<NewsListResponse> {
  const query = new URLSearchParams();
  if (params.category && params.category !== 'all') query.append('category', params.category);
  if (params.source && params.source !== 'all') query.append('source', params.source);
  if (params.search) query.append('search', params.search);
  if (params.sort) query.append('sort', params.sort);
  if (params.high_signal_only) query.append('high_signal_only', 'true');
  if (params.page) query.append('page', params.page.toString());
  if (params.size) query.append('size', params.size.toString());

  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/news?${query.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API 오류 (${res.status}): ${res.statusText}`);
  return readJson(res, NewsListResponseSchema, 'GET /api/news');
}

export async function fetchDailyBriefing(): Promise<DailyBriefing> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/briefing/today`, { cache: 'no-store' });
  if (!res.ok) throw new Error('일일 브리핑을 불러오지 못했습니다.');
  return readJson(res, DailyBriefingSchema, 'GET /api/briefing/today');
}


/** 기사 질문 스트림이 `done` 없이 끝났을 때의 문구 (backend `error` 이벤트의 기본 문구와 같다). */
export const ASK_STREAM_CUT_MESSAGE = '답변 생성이 중간에 끊겼습니다. 다시 시도해 주세요.';
/** 기사 질문 스트림의 첫 응답 대기 한도 (챗 스트림 `CHAT_STREAM_FIRST_BYTE_TIMEOUT_MS` 와 같다). 본문(토큰)은 제한하지 않는다. */
export const ASK_STREAM_FIRST_BYTE_TIMEOUT_MS = 30000;
const ASK_STREAM_TIMEOUT_MESSAGE = '응답이 늦어 요청을 멈췄습니다. 다시 시도해 주세요.';
/** 연결 자체가 실패했을 때(fetch TypeError)의 문구. 기사 질문과 챗(`lib/chatApi.ts`)이 함께 쓴다. */
export const CONNECT_FAILED_MESSAGE = '서버에 연결하지 못했습니다. 연결 상태를 확인하고 다시 시도해 주세요.';
const ASK_STREAM_CONNECT_FAILED_MESSAGE = CONNECT_FAILED_MESSAGE;

/**
 * 기사 질문 스트림. `done` 을 받아야 완료다. `error` 이벤트를 받거나 `done` 없이 끝나면 그 문구로 실패한다
 * (받은 토큰은 이미 `onToken` 으로 넘겼다. 화면은 부분 답과 오류·다시 시도를 함께 보인다).
 */
export async function askQuestionAboutNewsStream(
  newsId: number,
  question: string,
  callbacks?: {
    onMeta?: (model: string) => void;
    onToken?: (token: string) => void;
  },
  signal?: AbortSignal
): Promise<{ answer: string; model_used: string }> {
  const directBase = getDirectApiBase();
  const fallbackBase = getApiBase();
  // 첫 응답(머리)까지만 ASK_STREAM_FIRST_BYTE_TIMEOUT_MS 를 기다린다. 사용자 중단은 AbortError 그대로, 시간 초과는 문구로.
  const send = async (base: string): Promise<Response> => {
    try {
      return await fetchWithTimeout(
        `${base}/api/news/${newsId}/ask/stream`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }), signal },
        ASK_STREAM_FIRST_BYTE_TIMEOUT_MS
      );
    } catch (err: unknown) {
      if (signal?.aborted) throw err; // 사용자 중단은 AbortError 그대로
      if (err instanceof Error && err.name === 'AbortError') throw new Error(ASK_STREAM_TIMEOUT_MESSAGE);
      // 연결 자체가 실패(브라우저 원문 `Failed to fetch` 등)하면 정한 문구로 바꾼다.
      throw new Error(ASK_STREAM_CONNECT_FAILED_MESSAGE);
    }
  };
  let res: Response;

  try {
    // 1. NEXT_PUBLIC_API_URL 이 있으면 backend 에 직접, 없으면 같은 출처(rewrite)로 보낸다 (getDirectApiBase).
    res = await send(directBase);
  } catch (err: unknown) {
    if (signal?.aborted || (err instanceof Error && err.message === ASK_STREAM_TIMEOUT_MESSAGE)) throw err;
    // 2. 직접 주소에 닿지 못하면 같은 출처(rewrite)로 한 번 더 시도한다. 이미 같은 출처였으면 다시 보내지 않는다.
    if (directBase === fallbackBase) throw err;
    res = await send(fallbackBase);
  }

  if (!res.ok || !res.body) {
    throw new Error(await readErrorMessage(res, `AI 스트리밍 연결 실패 (${res.status})`));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullAnswer = '';
  // meta 이벤트가 알려 준 실제 응답 엔진. 오지 않으면 비워 둔다 (엔진 이름을 지어내지 않는다, FE-23).
  let modelUsed = '';
  let buffer = '';
  let receivedDone = false;
  let streamError: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    // 끝나면 디코더에 남은 바이트와 빈 줄 없이 끝난 마지막 이벤트까지 처리한다 (FE-23).
    buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = done ? '' : parts.pop() || '';

    for (const part of parts) {
      const lines = part.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const jsonStr = trimmed.substring(6).trim();
        if (!jsonStr) continue;
        try {
          // 줄마다 계약 스키마로 확인한다 (던지지 않는다, 계약 3.2절·2.0절)
          const payload = parseNewsAskSsePayload(JSON.parse(jsonStr));
          if (!payload) continue; // 모르는 이벤트는 무시한다 (전과 같음)
          if (payload.event === 'meta' && payload.model) {
            modelUsed = payload.model;
            callbacks?.onMeta?.(payload.model);
          } else if (payload.event === 'token' && typeof payload.text === 'string') {
            fullAnswer += payload.text;
            callbacks?.onToken?.(payload.text);
          } else if (payload.event === 'done') {
            receivedDone = true;
            if (payload.total_text) {
              fullAnswer = payload.total_text;
            }
          } else if (payload.event === 'error') {
            streamError = typeof payload.message === 'string' && payload.message ? payload.message : ASK_STREAM_CUT_MESSAGE;
          }
        } catch {}
      }
    }
    if (streamError !== null) {
      void reader.cancel().catch(() => {});
      throw new Error(streamError);
    }
    if (done) break;
  }

  if (!receivedDone) {
    // 사용자가 끊었으면 끊김 오류가 아니라 중단이다.
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    throw new Error(ASK_STREAM_CUT_MESSAGE);
  }
  return { answer: fullAnswer, model_used: modelUsed };
}

export async function fetchScheduleStatus(): Promise<ScheduleStatus> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/schedule/status`, { cache: 'no-store' });
  if (!res.ok) throw new Error('스케줄 정보를 불러오지 못했습니다.');
  return readJson(res, ScheduleStatusSchema, 'GET /api/schedule/status');
}

export async function fetchCrawlProgress(): Promise<CrawlProgress> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/schedule/progress`, { cache: 'no-store' });
  if (!res.ok) throw new Error('수집 진행도를 불러오지 못했습니다.');
  return readJson(res, CrawlProgressSchema, 'GET /api/schedule/progress');
}

export async function triggerManualCollect(): Promise<ManualCollectResponse> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/schedule/trigger`, { method: 'POST' });
  if (!res.ok) throw new Error(await readErrorMessage(res, '수집 요청에 실패했습니다.'));
  return readJson(res, ManualCollectResponseSchema, 'POST /api/schedule/trigger');
}

export async function fetchStats(): Promise<StatsResponse> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/stats`, { cache: 'no-store' });
  if (!res.ok) throw new Error('통계 데이터를 불러오지 못했습니다.');
  return readJson(res, StatsResponseSchema, 'GET /api/stats');
}

export async function fetchTechRadar(): Promise<TechRadarData> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/trends/radar`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Tech Radar 데이터를 불러오지 못했습니다.');
  return readJson(res, TechRadarDataSchema, 'GET /api/trends/radar');
}

export async function testWebhook(webhookUrl: string): Promise<SuccessMessageResponse> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/webhook/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ webhook_url: webhookUrl })
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, '웹훅 전송에 실패했습니다.'));
  return readJson(res, SuccessMessageResponseSchema, 'POST /api/webhook/test');
}

export async function resetAndRecollect(): Promise<ResetAndCollectResponse> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/schedule/reset-and-collect`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, '초기화 및 재수집 요청 실패'));
  return readJson(res, ResetAndCollectResponseSchema, 'POST /api/schedule/reset-and-collect');
}


export async function fetchSources(): Promise<SourcesResponse> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/sources`, { cache: 'no-store' });
  if (!res.ok) throw new Error('수집 소스 목록을 불러오지 못했습니다.');
  return readJson(res, SourcesResponseSchema, 'GET /api/sources');
}

export async function toggleSource(sourceType: string, itemId: string): Promise<StatusMessageResponse> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/sources/${sourceType}/${encodeURIComponent(itemId)}/toggle`, {
    method: 'PATCH'
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, '소스 상태 변경에 실패했습니다.'));
  return readJson(res, StatusMessageResponseSchema, 'PATCH /api/sources/{type}/{id}/toggle');
}

export async function addRssSource(payload: {
  name: string;
  url: string;
  site_url?: string;
  category_hint?: string;
  country?: string;
  description?: string;
}): Promise<AddRssSourceResponse> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/sources/rss`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, 'RSS 소스 추가 실패'));
  return readJson(res, AddRssSourceResponseSchema, 'POST /api/sources/rss');
}

export async function deleteSource(sourceType: string, itemId: string): Promise<StatusMessageResponse> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/sources/${sourceType}/${encodeURIComponent(itemId)}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, '소스 삭제 실패'));
  return readJson(res, StatusMessageResponseSchema, 'DELETE /api/sources/{type}/{id}');
}

export async function inspectUrl(url: string): Promise<InspectUrlResponse> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/research/inspect-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  }, 12000);
  if (!res.ok) throw new Error(await readErrorMessage(res, 'URL 피드 분석 실패'));
  return readJson(res, InspectUrlResponseSchema, 'POST /api/research/inspect-url');
}



export async function fetchDeepResearchStatus(): Promise<ResearchStatus> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/research/status`, { cache: 'no-store' });
  if (!res.ok) throw new Error('딥 리서치 상태를 불러오지 못했습니다.');
  return readJson(res, ResearchStatusSchema, 'GET /api/research/status');
}

export async function fetchResearchAuditLogs(limit = 30): Promise<ResearchAuditLogsResponse> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/research/audit-logs?limit=${limit}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('감사 일지를 불러오지 못했습니다.');
  return readJson(res, ResearchAuditLogsResponseSchema, 'GET /api/research/audit-logs');
}

export async function triggerDeepResearch(maxCandidates = 6): Promise<RunDeepResearchResponse> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/research/run-deep?max_candidates=${maxCandidates}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, '딥 리서치 기동 실패'));
  return readJson(res, RunDeepResearchResponseSchema, 'POST /api/research/run-deep');
}

// ==========================================
// Daily Briefing Export & Settings APIs
// ==========================================

export async function exportBriefingToNotion(apiKey?: string, pageId?: string): Promise<NotionExportResponse> {
  const base = getApiBase();
  const body: { api_key?: string; page_id?: string } = {};
  if (apiKey) body.api_key = apiKey;
  if (pageId) body.page_id = pageId;

  const res = await fetchWithTimeout(`${base}/api/briefing/export/notion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }, 20000);

  if (!res.ok) throw new Error(await readErrorMessage(res, 'Notion 페이지 생성에 실패했습니다.'));
  return readJson(res, NotionExportResponseSchema, 'POST /api/briefing/export/notion');
}

export async function sendBriefingByEmail(toEmail?: string, subject?: string): Promise<SuccessMessageResponse> {
  const base = getApiBase();
  const body: { to_email?: string; subject?: string } = {};
  if (toEmail) body.to_email = toEmail;
  if (subject) body.subject = subject;

  const res = await fetchWithTimeout(`${base}/api/briefing/send/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }, 20000);

  if (!res.ok) throw new Error(await readErrorMessage(res, '이메일 발송에 실패했습니다.'));
  return readJson(res, SuccessMessageResponseSchema, 'POST /api/briefing/send/email');
}

export async function testNotionConnection(apiKey?: string, pageId?: string): Promise<SuccessMessageResponse> {
  const base = getApiBase();
  const body: { api_key?: string; page_id?: string } = {};
  if (apiKey) body.api_key = apiKey;
  if (pageId) body.page_id = pageId;

  const res = await fetchWithTimeout(`${base}/api/briefing/test/notion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }, 12000);

  if (!res.ok) throw new Error(await readErrorMessage(res, 'Notion 연결 테스트 실패'));
  return readJson(res, SuccessMessageResponseSchema, 'POST /api/briefing/test/notion');
}

export async function testEmailConnection(params: {
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
  use_tls?: boolean;
  to_email?: string;
}): Promise<SuccessMessageResponse> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/briefing/test/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  }, 15000);

  if (!res.ok) throw new Error(await readErrorMessage(res, 'SMTP 연결 테스트 실패'));
  return readJson(res, SuccessMessageResponseSchema, 'POST /api/briefing/test/email');
}

export async function fetchBriefingSettings(): Promise<BriefingSettings> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/briefing/settings`, { cache: 'no-store' });
  if (!res.ok) throw new Error('브리핑 설정을 불러오지 못했습니다.');
  return readJson(res, BriefingSettingsSchema, 'GET /api/briefing/settings');
}

/** POST /api/briefing/settings 요청 본문 (backend `BriefingSettingsUpdate`). 보낸 필드만 바뀐다. */
export interface BriefingSettingsUpdate {
  notion_api_key?: string;
  notion_page_id?: string;
  notion_auto_export?: boolean;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
  smtp_from?: string;
  smtp_to?: string;
  smtp_use_tls?: boolean;
  email_auto_send?: boolean;
  slack_webhook_url?: string;
  discord_webhook_url?: string;
}

export async function updateBriefingSettings(update: BriefingSettingsUpdate): Promise<SuccessMessageResponse> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/briefing/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update)
  }, 10000);

  if (!res.ok) throw new Error(await readErrorMessage(res, '설정 저장에 실패했습니다.'));
  return readJson(res, SuccessMessageResponseSchema, 'POST /api/briefing/settings');
}


