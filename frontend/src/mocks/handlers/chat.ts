import { http, HttpResponse, delay } from 'msw';
import { mockArticles, mockSearchChunks, initialMockSessions, generateArticleScopedAnswerTokens } from '../fixtures/chat';
import { apiError } from '../api-error';
import {
  ChatStreamRequestSchema,
  ChatSessionCreateRequestSchema,
  ChatFocusFilter,
  ChatSearchChunk,
  ChatSourceItem,
  ChatSessionSummary,
  ChatSessionDetail,
  ChatMessageItem,
  GenericSuccessResponse,
  generateAutoTitle,
  ModelTier,
  ChatModel,
  ScopeMode,
  TokenUsageMeta,
  TIER_TO_MODEL,
  DEFAULT_CHAT_MODEL,
  DEFAULT_MODEL_TIER,
  sanitizeModelTier,
} from '@/types/chat';

// MSW 는 backend 동작을 흉내 낸다 (계약 3.1·4.7절). 응답 모양·이벤트 순서·오류 코드는 backend 와 같게 둔다.

const MODEL_TIERS: readonly ModelTier[] = ['haiku', 'sonnet', 'opus'];

/** 문자열이 지원하는 모델 티어인지 좁히는 타입 가드 */
function isModelTier(value: string): value is ModelTier {
  return (MODEL_TIERS as readonly string[]).includes(value);
}

/**
 * 요청된 모델·티어로 응답 모델, 티어, 지연, 토큰 사용량(목 고정값)을 정한다.
 * 우선순위는 backend 와 같다: 명시 `model` > `model_tier` > 기본 모델. 알 수 없는 모델은 sonnet 티어.
 */
export function resolveModelAndUsage(requestedModel?: ChatModel | null, requestedTier?: ModelTier | null) {
  let tier: ModelTier = DEFAULT_MODEL_TIER;
  let model: ChatModel = DEFAULT_CHAT_MODEL;

  if (requestedModel) {
    const sanitized = sanitizeModelTier(requestedModel);
    tier = isModelTier(sanitized) ? sanitized : 'sonnet';
    model = TIER_TO_MODEL[tier];
  } else if (requestedTier && isModelTier(requestedTier)) {
    tier = requestedTier;
    model = TIER_TO_MODEL[tier];
  }

  const latencyMs = tier === 'haiku' ? 180 : tier === 'opus' ? 1780 : 642;
  const usage: TokenUsageMeta = {
    input_tokens: tier === 'haiku' ? 650 : tier === 'opus' ? 2100 : 1250,
    output_tokens: tier === 'haiku' ? 420 : tier === 'opus' ? 1650 : 840,
    cache_read_input_tokens: 2500,
    cache_creation_input_tokens: 0,
  };

  return { tier, model, latencyMs, usage };
}

/** 인메모리 대화 세션 저장소 (backend SQLite 흉내) */
let mockSessionStore: ChatSessionDetail[] = JSON.parse(JSON.stringify(initialMockSessions));

export function resetMockSessionStore(): void {
  mockSessionStore = JSON.parse(JSON.stringify(initialMockSessions));
}

export function getMockSessionStore(): ChatSessionDetail[] {
  return mockSessionStore;
}

/** backend `ChatSourceItem.model_dump()` 처럼 모든 키를 채운 출처 (없는 값은 null) */
function toSourceItem(partial: Pick<ChatSourceItem, 'index' | 'title' | 'url' | 'source'> & Partial<ChatSourceItem>): ChatSourceItem {
  return {
    type: 'primary',
    id: null,
    category: null,
    quality_score: null,
    score: null,
    snippet: null,
    full_content: null,
    domain: null,
    relevance_score: null,
    published_at: null,
    publisher: null,
    ...partial,
  };
}

/** 검색 청크를 global 모드 후보 출처로 바꾼다 (backend `_resolve_sources`) */
function chunkToSource(chunk: ChatSearchChunk, index: number): ChatSourceItem {
  return toSourceItem({
    index,
    id: chunk.id,
    title: chunk.title,
    url: chunk.url,
    source: chunk.source,
    category: chunk.category,
    quality_score: chunk.quality_score,
    snippet: chunk.snippet,
    published_at: chunk.published_at,
  });
}

/** 답변에 인용된 `[n]` 출처만 남긴다. 인용이 없으면 첫 후보 하나 (backend `_filter_cited_sources` 를 줄인 것) */
function filterCitedSources(answer: string, candidates: ChatSourceItem[]): ChatSourceItem[] {
  if (candidates.length === 0) return [];
  const cited = new Set(Array.from(answer.matchAll(/\[(\d+)\]/g), (m) => Number(m[1])));
  const hits = candidates.filter((s) => typeof s.index === 'number' && cited.has(s.index));
  return hits.length > 0 ? hits : candidates.slice(0, 1);
}

/** 질문 키워드로 목 청크를 고른다 */
export function filterChunksByQuestion(chunks: ChatSearchChunk[], question?: string | null): ChatSearchChunk[] {
  if (!question || !question.trim()) {
    return [...chunks];
  }

  const q = question.toLowerCase();

  const topicMappings: { keywords: string[]; matches: (c: ChatSearchChunk) => boolean }[] = [
    {
      keywords: ['fastmcp', 'mcp', '엠씨피', 'model context protocol', 'stdio', '데코레이터'],
      matches: (c) => c.id === 101 || c.category === 'mcp_plugins_skills' || c.title.toLowerCase().includes('mcp'),
    },
    {
      keywords: ['langgraph', '랭그래프', 'langchain', '시간 여행', 'time-travel', '체크포인트', 'checkpoint', 'state machine', '상태 머신'],
      matches: (c) => c.id === 102 || c.title.toLowerCase().includes('langgraph'),
    },
    {
      keywords: ['swe-bench', 'swebench', '하네스', 'harness', '멀티모달', 'multimodal', 'gui', '벤치마크', 'benchmark'],
      matches: (c) => c.id === 103 || c.category === 'harness' || c.title.toLowerCase().includes('swe-bench'),
    },
    {
      keywords: ['autogen', '오토젠', 'actor', '액터', '이벤트', 'event-driven', 'microsoft'],
      matches: (c) => c.id === 104 || c.title.toLowerCase().includes('autogen'),
    },
    {
      keywords: ['claude', '클로드', 'sonnet', '소네트', 'anthropic', '추론', 'reasoning', 'hybrid reasoning', 'thinking'],
      matches: (c) => c.id === 105 || c.category === 'ai_news' || c.title.toLowerCase().includes('claude'),
    },
  ];

  // 1. 토픽 키워드가 있으면 그 토픽 청크만
  const activeTopicMatches: ChatSearchChunk[] = [];
  for (const mapping of topicMappings) {
    if (mapping.keywords.some((kw) => q.includes(kw))) {
      for (const chunk of chunks) {
        if (mapping.matches(chunk) && !activeTopicMatches.some((m) => m.id === chunk.id)) {
          activeTopicMatches.push(chunk);
        }
      }
    }
  }

  if (activeTopicMatches.length > 0) {
    activeTopicMatches.sort((a, b) => b.rag_score - a.rag_score);
    return activeTopicMatches;
  }

  // 2. 일반 키워드 토큰 일치
  const scored = chunks.map((chunk) => {
    let score = 0;
    const titleLower = chunk.title.toLowerCase();
    const snippetLower = chunk.snippet.toLowerCase();
    const categoryLower = chunk.category.toLowerCase();

    const tokens = q.match(/[a-z0-9_-]+|[가-힣]{2,}/gi) || [];
    for (const rawToken of tokens) {
      const token = rawToken.toLowerCase();
      if (/^v\d+(\.\d+)?$/i.test(token) || token.length < 3) continue;
      if (['질문', '알려줘', '설명', '분석', '어떻게', '방법', '테스트', '기본', '최신', '동향'].includes(token)) continue;
      if (titleLower.includes(token)) score += 10;
      if (snippetLower.includes(token)) score += 5;
      if (categoryLower.includes(token)) score += 3;
    }

    return { chunk, score };
  });

  const matches = scored.filter((item) => item.score > 0);
  if (matches.length > 0) {
    matches.sort((a, b) => b.score - a.score || b.chunk.rag_score - a.chunk.rag_score);
    return matches.map((m) => m.chunk);
  }

  return [...chunks];
}

/** 청크가 고신호 기사인지 (backend 는 `is_high_signal` 로 거른다) */
function isHighSignalChunk(chunk: ChatSearchChunk): boolean {
  return mockArticles[chunk.id]?.is_high_signal ?? false;
}

/** 포커스 필터 적용·정렬. 24h + harness 는 0건이라 기간을 풀었다고 표시한다 (자동 완화 흉내) */
function applyFocusFilters(
  chunks: ChatSearchChunk[],
  filters?: ChatFocusFilter | null
): { filtered: ChatSearchChunk[]; isRelaxed: boolean; appliedFilters: ChatFocusFilter } {
  const appliedFilters: ChatFocusFilter = {
    category: filters?.category || 'all',
    time_range: filters?.time_range || 'all',
    sort: filters?.sort || 'hot',
    high_signal_only: filters?.high_signal_only ?? false,
  };

  let candidate = [...chunks];

  if (appliedFilters.category !== 'all') {
    candidate = candidate.filter((c) => c.category === appliedFilters.category);
  }
  if (appliedFilters.high_signal_only) {
    candidate = candidate.filter(isHighSignalChunk);
  }

  let isRelaxed = false;
  if (appliedFilters.time_range === '24h' && appliedFilters.category === 'harness') {
    isRelaxed = true;
    appliedFilters.time_range = 'all';
    candidate = chunks.filter((c) => c.category === 'harness');
    if (appliedFilters.high_signal_only) {
      candidate = candidate.filter(isHighSignalChunk);
    }
  }

  candidate.sort((a, b) => {
    if (appliedFilters.sort === 'latest') {
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    }
    if (appliedFilters.sort === 'quality') {
      return b.quality_score - a.quality_score;
    }
    return b.rag_score - a.rag_score;
  });

  return { filtered: candidate, isRelaxed, appliedFilters };
}

/** global 질문의 후보 출처 (검색 + 필터, 0건이면 필터만) */
function resolveGlobalCandidates(question: string, filters: ChatFocusFilter | null | undefined, topK: number) {
  const filterResult = applyFocusFilters(filterChunksByQuestion(mockSearchChunks, question), filters);
  const list =
    filterResult.filtered.length > 0
      ? filterResult.filtered.slice(0, topK)
      : applyFocusFilters(mockSearchChunks, filters).filtered.slice(0, topK);
  return {
    candidates: list.map((c, idx) => chunkToSource(c, idx + 1)),
    isRelaxed: filterResult.isRelaxed,
    appliedFilters: filterResult.appliedFilters,
  };
}

/** 답변 토큰. 기사가 있으면 그 기사로 4단 리포트 ([1] 인용), 없으면 인용 없는 짧은 답 */
function buildAnswerTokens(articleId: number | null | undefined, isRelaxed: boolean): string[] {
  if (typeof articleId === 'number' && mockArticles[articleId]) {
    return generateArticleScopedAnswerTokens(mockArticles[articleId], isRelaxed);
  }
  return [
    '## 1. 핵심 아키텍처 및 동작 원리\n\n',
    '수집된 소식을 검색하지 않고 일반 지식으로 답합니다. ',
    '구체적인 기사 근거가 필요하면 질문에 기술 이름을 넣어 주세요.',
  ];
}

/** 질문에 든 트리거로 스트림 전 LLM 가용성 오류를 흉내 낸다 (backend `check_provider_available` 분기) */
function providerErrorFor(question: string) {
  if (question.includes('[TRIGGER_401]') || question.includes('[TRIGGER_CLAUDE_KEY_MISSING]')) {
    return apiError(401, 'ERR_CLAUDE_API_KEY_MISSING', 'Anthropic Claude API 키가 설정되지 않았습니다.');
  }
  if (question.includes('[TRIGGER_429]') || question.includes('[TRIGGER_CLAUDE_QUOTA]')) {
    return apiError(429, 'ERR_CLAUDE_QUOTA_EXCEEDED', 'Anthropic Claude 호출 한도 초과');
  }
  if (question.includes('[TRIGGER_529]') || question.includes('[TRIGGER_CLAUDE_OVERLOADED]')) {
    return apiError(529, 'ERR_CLAUDE_OVERLOADED', 'Anthropic 서버 과부하');
  }
  if (question.includes('[TRIGGER_502]')) {
    return apiError(502, 'ERR_LLM_UPSTREAM_FAILED', '외부 LLM 업스트림 통신에 실패했습니다.');
  }
  if (question.includes('[TRIGGER_503]')) {
    return apiError(503, 'ERR_LLM_PROVIDER_UNAVAILABLE', '가용한 LLM 프로바이더 엔진이 설정되지 않았습니다 (API 키 미설정).');
  }
  if (question.includes('[TRIGGER_500]')) {
    return apiError(500, 'ERR_SERVER_INTERNAL', '서버 내부 오류가 발생했습니다.');
  }
  return null;
}

/**
 * 요청 본문 공통 검사 (backend `/stream`·`/query` 순서): JSON → 객체 → 빈 질문 → 2000자 → scope → 필드 검증.
 * 통과하면 `{ body }`, 아니면 `{ error }` (HttpResponse).
 */
async function readChatRequest<T>(
  request: Request,
  schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: { issues: { path: PropertyKey[]; code: string }[] } } }
): Promise<{ body: T; error?: undefined } | { error: Response; body?: undefined }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { error: apiError(400, 'ERR_INVALID_PAYLOAD', '요청 본문 형식이 올바르지 않습니다.') };
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { error: apiError(400, 'ERR_INVALID_PAYLOAD', '요청 본문은 JSON 객체여야 합니다.') };
  }
  const obj = raw as Record<string, unknown>;
  const question = obj.question ?? '';
  if (typeof question !== 'string' || !question.trim()) {
    return { error: apiError(400, 'ERR_CHAT_PAYLOAD_EMPTY', '질문 본문이 비어있습니다.') };
  }
  if (question.length > 2000) {
    return { error: apiError(400, 'ERR_CHAT_PAYLOAD_TOO_LARGE', '질문은 최대 2,000자까지 입력 가능합니다.') };
  }
  const scope = obj.scope ?? 'global';
  if (scope !== 'scoped' && scope !== 'global') {
    return { error: apiError(400, 'ERR_INVALID_SCOPE_PARAM', '유효하지 않은 검색 스코프 모드입니다.') };
  }
  const parsed = schema.safeParse(obj);
  if (!parsed.success) {
    // backend: Pydantic 은 session_id 를 문자열로만 보고, 라우터가 UUID 인지 따로 본다 (400 ERR_SESSION_INVALID_UUID)
    if (parsed.error.issues.every((i) => i.path[0] === 'session_id' && i.code === 'invalid_format')) {
      return { error: apiError(400, 'ERR_SESSION_INVALID_UUID', '유효하지 않은 세션 UUID 형식입니다.') };
    }
    if (parsed.error.issues.some((i) => i.path[0] === 'model_tier')) {
      return { error: apiError(400, 'ERR_INVALID_MODEL_TIER', `유효하지 않은 모델 티어입니다: ${String(obj.model_tier)}`) };
    }
    return { error: apiError(400, 'ERR_INVALID_PAYLOAD', '요청 필드 형식이 올바르지 않습니다.') };
  }
  return { body: parsed.data };
}

/** backend `_sse_error` 와 같은 SSE error payload */
const streamError = (error_code: string, message: string, status_code: number, step: string) => ({
  error_code,
  message,
  status_code,
  step,
  retryable: true,
});

const sse = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
const nowIso = () => new Date().toISOString();

/** 이 턴의 질문·답을 목 저장소에 넣는다 (backend `persist_turn`: 요청 id 또는 UUID, 이미 있는 id 는 건너뜀) */
function persistTurn(params: {
  sessionId: string;
  scope: ScopeMode;
  sourceId: number | null | undefined;
  filters: ChatFocusFilter | null | undefined;
  question: string;
  answer: string;
  sources: ChatSourceItem[];
  model: string;
  tier: ModelTier;
  latencyMs: number;
  usage: TokenUsageMeta;
  userMessageId?: string | null;
  assistantMessageId?: string | null;
}) {
  const created = nowIso();
  const userMsg: ChatMessageItem = {
    id: params.userMessageId || crypto.randomUUID(),
    session_id: params.sessionId,
    role: 'user',
    content: params.question,
    created_at: created,
    sources: null,
    status: 'completed',
    model: null,
    model_tier: null,
    latency_ms: null,
    usage: null,
  };
  const assistantMsg: ChatMessageItem = {
    id: params.assistantMessageId || crypto.randomUUID(),
    session_id: params.sessionId,
    role: 'assistant',
    content: params.answer,
    created_at: created,
    sources: params.sources,
    status: 'completed',
    model: params.model,
    model_tier: params.tier,
    latency_ms: params.latencyMs,
    usage: params.usage,
  };

  // backend persist_turn: 이 세션에 있는 id 는 건너뛰고, 다른 세션의 id 가 섞이면 이 턴을 저장하지 않는다(로그만, done 은 보낸다)
  if (foreignMessageIds(params.sessionId, [userMsg.id, assistantMsg.id]).length > 0) return;
  const target = mockSessionStore.find((s) => s.id === params.sessionId);
  const ownIds = new Set(target?.messages.map((m) => m.id) ?? []);
  const newItems = [userMsg, assistantMsg].filter((m) => !ownIds.has(m.id));
  if (target) {
    target.messages.push(...newItems);
    target.updated_at = nowIso();
    if (target.title === '새 대화' || !target.title) {
      target.title = generateAutoTitle(params.question);
    }
    return;
  }
  enforceFifo();
  mockSessionStore.unshift({
    id: params.sessionId,
    title: generateAutoTitle(params.question),
    scope_mode: params.scope,
    active_source_id: params.sourceId ?? null,
    active_source: params.sourceId ? mockArticles[params.sourceId] ?? null : null,
    active_filters: params.filters ?? null,
    created_at: nowIso(),
    updated_at: nowIso(),
    messages: newItems,
  });
}

/** 다른 세션에 이미 있는 메시지 id (backend `_existing_message_ids` 의 충돌 검사) */
function foreignMessageIds(sessionId: string, ids: string[]): string[] {
  const wanted = new Set(ids);
  return mockSessionStore
    .filter((s) => s.id !== sessionId)
    .flatMap((s) => s.messages.map((m) => m.id))
    .filter((id) => wanted.has(id))
    .sort();
}

/** 세션 30개 FIFO (가장 오래 갱신되지 않은 세션부터 지운다) */
function enforceFifo() {
  if (mockSessionStore.length >= 30) {
    mockSessionStore.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
    mockSessionStore.shift();
  }
}

const UUID_LIKE = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

export const chatHandlers = [
  // ==========================================================================
  // 1. POST /api/chat/stream — SSE (backend chat_service.stream_chat 순서)
  //   scoped: status(extracting_source 30) → status(synthesizing 85) → sources → token* → done
  //   global(검색): status(thinking 25) → status(tool_calling 50) → status(synthesizing 80) → token* → sources(인용된 것) → done
  //   global(검색 안 함, 질문에 [TRIGGER_NO_TOOL]): status(thinking 25) → status(synthesizing 75) → token* → done
  //   질문 분석 실패([TRIGGER_THINKING_ERROR]): status(thinking) → error(ERR_LLM_UPSTREAM_FAILED 502, step thinking)
  //   기사 검색 실패([TRIGGER_SEARCH_ERROR]): thinking → tool_calling → error(ERR_RETRIEVER_INDEX_ERROR 500, step tool_calling)
  //   토큰 생성 중 실패([TRIGGER_STREAM_ERROR]): ... → token → error(ERR_LLM_STREAM_FAILED 502) (done·저장 없음)
  // ==========================================================================
  http.post('*/api/chat/stream', async ({ request }) => {
    const read = await readChatRequest(request, ChatStreamRequestSchema);
    if (read.error) return read.error;
    const payload = read.body;
    const { question, scope, source_id, filters, top_k, model, model_tier } = payload;

    if (scope === 'scoped' && (!source_id || !mockArticles[source_id])) {
      return apiError(404, 'ERR_HANDOVER_SOURCE_NOT_FOUND', `기사 ID ${source_id}를 데이터베이스에서 찾을 수 없습니다.`);
    }

    const providerError = providerErrorFor(question);
    if (providerError) return providerError;

    const sessionId = payload.session_id || crypto.randomUUID();
    const isMidStreamError = question.includes('[TRIGGER_STREAM_ERROR]');
    const usesTool = scope === 'global' && !question.includes('[TRIGGER_NO_TOOL]');
    const { tier, model: selectedModel, latencyMs, usage } = resolveModelAndUsage(model, model_tier);

    let candidates: ChatSourceItem[] = [];
    let isRelaxed = false;
    let appliedFilters: ChatFocusFilter | null = null;
    if (scope === 'scoped') {
      const art = mockArticles[source_id!];
      candidates = [
        toSourceItem({
          index: 1,
          id: art.id,
          title: art.title,
          url: art.url,
          source: art.source,
          category: art.category,
          quality_score: art.quality_score,
          snippet: art.summary,
          full_content: art.full_content ?? art.summary,
          published_at: art.published_at,
        }),
      ];
    } else if (usesTool) {
      const resolved = resolveGlobalCandidates(question, filters, top_k);
      candidates = resolved.candidates;
      isRelaxed = resolved.isRelaxed;
      appliedFilters = resolved.appliedFilters;
    }

    const articleId = scope === 'scoped' ? source_id : usesTool ? candidates[0]?.id : null;
    const answerTokens = buildAnswerTokens(articleId, isRelaxed);
    const answer = answerTokens.join('');
    const sources = scope === 'scoped' ? candidates : usesTool ? filterCitedSources(answer, candidates) : [];
    const sourcesPayload = {
      sources,
      applied_filters: scope === 'scoped' ? null : appliedFilters,
      is_relaxed: isRelaxed,
      primary_count: sources.length,
      supplementary_count: 0,
    };

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const emit = (event: string, data: unknown) => controller.enqueue(encoder.encode(sse(event, data)));

        await delay(30);
        if (scope === 'scoped') {
          emit('status', { step: 'extracting_source', label: '지정된 단일 뉴스 기사 컨텍스트 로드 중...', progress: 30, timestamp: nowIso() });
          await delay(30);
          emit('status', { step: 'synthesizing', label: 'Senior Staff Architect 단일 기사 심층 리포트 프롬프트 조립...', progress: 85, timestamp: nowIso() });
          await delay(30);
          emit('sources', sourcesPayload);
        } else {
          emit('status', { step: 'thinking', label: 'ReAct 추론: 질문 의도 및 도구 필요성 분석 중...', progress: 25, timestamp: nowIso() });
          await delay(30);
          if (question.includes('[TRIGGER_THINKING_ERROR]')) {
            emit('error', streamError('ERR_LLM_UPSTREAM_FAILED', '질문 분석 중 오류가 발생했습니다. 다시 시도해 주세요.', 502, 'thinking'));
            controller.close();
            return;
          }
          if (usesTool) {
            emit('status', { step: 'tool_calling', label: `Action: search_news_corpus('${question}') 실행 중...`, progress: 50, timestamp: nowIso(), query: question });
            await delay(30);
            if (question.includes('[TRIGGER_SEARCH_ERROR]')) {
              emit('error', streamError('ERR_RETRIEVER_INDEX_ERROR', '기사 검색 중 오류가 발생했습니다. 다시 시도해 주세요.', 500, 'tool_calling'));
              controller.close();
              return;
            }
            emit('status', { step: 'synthesizing', label: '검증된 컨텍스트를 바탕으로 답변 생성 중...', progress: 80, timestamp: nowIso() });
          } else {
            emit('status', { step: 'synthesizing', label: '도구 호출 없이 직접 답변 생성 중...', progress: 75, timestamp: nowIso() });
          }
        }

        if (isMidStreamError) {
          await delay(25);
          emit('token', { token: answerTokens[0] || '## 1. ' });
          await delay(25);
          emit('error', streamError('ERR_LLM_STREAM_FAILED', 'LLM 스트리밍 도중 외부 프로바이더 오류가 발생했습니다.', 502, 'synthesizing'));
          controller.close();
          return;
        }

        for (const token of answerTokens) {
          await delay(25);
          emit('token', { token });
        }

        if (usesTool) {
          await delay(20);
          emit('sources', sourcesPayload);
        }

        // backend 처럼 done 을 보내기 전에 저장한다 (계약 8.1절)
        persistTurn({
          sessionId,
          scope,
          sourceId: source_id,
          filters,
          question,
          answer,
          sources,
          model: selectedModel,
          tier,
          latencyMs,
          usage,
          userMessageId: payload.user_message_id,
          assistantMessageId: payload.assistant_message_id,
        });

        await delay(30);
        emit('done', {
          done: true,
          session_id: sessionId,
          model: selectedModel,
          model_tier: tier,
          sources_count: sources.length,
          primary_count: sources.length,
          supplementary_count: 0,
          latency_ms: latencyMs,
          usage,
        });
        controller.close();
      },
    });

    return new HttpResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }),

  // ==========================================================================
  // 2. GET /api/chat/sources/:source_id — 기사 상세 (핸드오버)
  // ==========================================================================
  http.get('*/api/chat/sources/:source_id', async ({ params }) => {
    const sourceId = Number(params.source_id);
    if (!Number.isInteger(sourceId)) {
      return apiError(400, 'ERR_INVALID_PAYLOAD', '요청 값 형식이 올바르지 않습니다.', [
        { loc: ['path', 'source_id'], msg: 'Input should be a valid integer' },
      ]);
    }
    const article = mockArticles[sourceId];
    if (!article) {
      return apiError(404, 'ERR_HANDOVER_SOURCE_NOT_FOUND', `기사 ID ${sourceId}를 데이터베이스에서 찾을 수 없습니다.`);
    }
    return HttpResponse.json({ full_content: null, scraped_at: null, ...article }, { status: 200 });
  }),

  // ==========================================================================
  // 3. GET /api/chat/sessions — 세션 목록 (updated_at 내림차순)
  // ==========================================================================
  http.get('*/api/chat/sessions', async ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') || '30');
    const offset = Number(url.searchParams.get('offset') || '0');

    if (url.searchParams.get('trigger_error') === '500' || url.searchParams.get('q') === '[TRIGGER_500]') {
      return apiError(500, 'ERR_SERVER_INTERNAL', '세션 목록 인출 중 내부 오류가 발생했습니다.');
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 50 || !Number.isInteger(offset) || offset < 0) {
      return apiError(400, 'ERR_INVALID_PAYLOAD', '요청 값 형식이 올바르지 않습니다.', [
        { loc: ['query', limit < 1 || limit > 50 ? 'limit' : 'offset'], msg: 'Input is out of range' },
      ]);
    }

    await delay(20);

    const sorted = [...mockSessionStore].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    const summaries: ChatSessionSummary[] = sorted.slice(offset, offset + limit).map((s) => ({
      id: s.id,
      title: s.title,
      created_at: s.created_at,
      updated_at: s.updated_at,
      scope_mode: s.scope_mode,
      active_source_id: s.active_source_id ?? null,
      message_count: s.messages.length,
      last_message_preview: s.messages.length > 0 ? s.messages[s.messages.length - 1].content.slice(0, 100) : null,
      active_filters: s.active_filters ?? null,
    }));
    return HttpResponse.json(summaries, { status: 200 });
  }),

  // ==========================================================================
  // 4. POST /api/chat/sessions — 생성 또는 업서트 (201)
  //   JSON·필드 오류 400 ERR_INVALID_PAYLOAD, id 가 UUID 아님 400 ERR_SESSION_INVALID_UUID.
  //   메시지는 기존 뒤에 이어 붙이고 이 세션에 이미 있는 id(같은 요청 안 포함)는 건너뛴다.
  //   다른 세션에 있는 id 가 섞이면 아무것도 바꾸지 않고 400 ERR_INVALID_PAYLOAD, details.message_ids.
  //   메시지의 model_tier·usage·created_at 은 받은 그대로 저장한다 (CT-004).
  // ==========================================================================
  http.post('*/api/chat/sessions', async ({ request }) => {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return apiError(400, 'ERR_INVALID_PAYLOAD', '요청 본문이 올바른 JSON 이 아닙니다.');
    }
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      return apiError(400, 'ERR_INVALID_PAYLOAD', '요청 본문은 JSON 객체여야 합니다.');
    }
    const parsed = ChatSessionCreateRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return apiError(
        400,
        'ERR_INVALID_PAYLOAD',
        '요청 필드 형식이 올바르지 않습니다.',
        parsed.error.issues.map((i) => ({ loc: ['body', ...i.path.map(String)], msg: i.message }))
      );
    }
    const body = parsed.data;
    if (body.id && !UUID_LIKE.test(body.id)) {
      return apiError(400, 'ERR_SESSION_INVALID_UUID', '유효하지 않은 세션 UUID 형식이거나 파라미터 규격 오류입니다.');
    }
    if (body.title?.includes('[TRIGGER_500]')) {
      return apiError(500, 'ERR_SESSION_CREATE_FAILED', '데이터베이스 세션 트랜잭션 커밋에 실패했습니다.');
    }

    const sessionId = body.id || crypto.randomUUID();
    const foreign = foreignMessageIds(sessionId, (body.messages ?? []).map((m) => m.id));
    if (foreign.length > 0) {
      return apiError(400, 'ERR_INVALID_PAYLOAD', `다른 대화에서 이미 쓰는 메시지 id 입니다: ${foreign.join(', ')}`, {
        message_ids: foreign,
      });
    }

    await delay(30);

    let session = mockSessionStore.find((s) => s.id === sessionId);
    if (session) {
      // backend 처럼 null 이 아닌 값만 덮어쓴다 (title·scope_mode 는 Pydantic 기본값이 있어 생략해도 기본값으로 덮인다)
      if (body.title !== null) session.title = body.title;
      if (body.scope_mode !== null) session.scope_mode = body.scope_mode;
      if (body.active_source_id != null) {
        session.active_source_id = body.active_source_id;
        session.active_source = mockArticles[body.active_source_id] ?? null;
      }
      if (body.active_filters != null) session.active_filters = body.active_filters;
      session.updated_at = nowIso();
    } else {
      enforceFifo();
      session = {
        id: sessionId,
        title: body.title || '새 대화',
        scope_mode: body.scope_mode || 'global',
        active_source_id: body.active_source_id ?? null,
        active_source: body.active_source_id ? mockArticles[body.active_source_id] ?? null : null,
        active_filters: body.active_filters ?? null,
        created_at: nowIso(),
        updated_at: nowIso(),
        messages: [],
      };
      mockSessionStore.unshift(session);
    }

    const storedIds = new Set(session.messages.map((m) => m.id));
    for (const m of body.messages ?? []) {
      if (storedIds.has(m.id)) continue;
      storedIds.add(m.id);
      session.messages.push({ ...m, session_id: sessionId, created_at: m.created_at || nowIso() });
    }

    return HttpResponse.json(session, { status: 201 });
  }),

  // ==========================================================================
  // 5. GET /api/chat/sessions/:session_id — 상세 (메시지 created_at 오름차순)
  // ==========================================================================
  http.get('*/api/chat/sessions/:session_id', async ({ params }) => {
    const sessionId = String(params.session_id);
    if (sessionId.includes('[TRIGGER_500]')) {
      return apiError(500, 'ERR_SERVER_INTERNAL', '세션 상세 인출 중 오류가 발생했습니다.');
    }

    await delay(20);

    const session = mockSessionStore.find((s) => s.id === sessionId);
    if (!session) {
      return apiError(404, 'ERR_SESSION_NOT_FOUND', `세션 ID ${sessionId}를 찾을 수 없습니다.`);
    }
    const messages = [...session.messages].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    return HttpResponse.json({ ...session, messages }, { status: 200 });
  }),

  // ==========================================================================
  // 6. DELETE /api/chat/sessions/:session_id — 세션과 메시지 삭제
  // ==========================================================================
  http.delete('*/api/chat/sessions/:session_id', async ({ params }) => {
    const sessionId = String(params.session_id);
    if (sessionId.includes('[TRIGGER_500]')) {
      return apiError(500, 'ERR_SESSION_DELETE_FAILED', '데이터베이스 CASCADE 삭제 트랜잭션 처리에 실패했습니다.');
    }

    await delay(30);

    const index = mockSessionStore.findIndex((s) => s.id === sessionId);
    if (index === -1) {
      return apiError(404, 'ERR_SESSION_NOT_FOUND', `세션 ID ${sessionId}를 찾을 수 없습니다.`);
    }
    mockSessionStore.splice(index, 1);

    const response: GenericSuccessResponse = {
      status: 'success',
      message: '대화 세션 및 하위 메시지가 원자적으로 영구 삭제되었습니다.',
      deleted_count: 1,
    };
    return HttpResponse.json(response, { status: 200 });
  }),
];
