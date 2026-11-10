import { z } from 'zod';

/** backend 응답 시각: UTC 오프셋이 붙은 ISO 8601 (`...+00:00` 또는 `Z`, v0.4.2 N-09) */
export const IsoDateTimeSchema = z.iso.datetime({ offset: true });

/** backend `uuid.UUID()` 가 받는 세션 id (하이픈 생략 허용) */
export const SESSION_UUID_PATTERN = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

// ============================================================================
// 1. 공통 오류 응답 (모든 backend API 공통, 계약 v1.3 / v0.4.2)
// backend 는 성공 응답을 감싸지 않는다 (엔벨로프 없음). 오류는 모든 API 가 이 모양이다.
// ============================================================================

/** 요청 검증 실패(400 ERR_INVALID_PAYLOAD)의 `details` 항목 */
export const ValidationErrorItemSchema = z.object({
  loc: z.array(z.union([z.string(), z.number()])),
  msg: z.string(),
});
export type ValidationErrorItem = z.infer<typeof ValidationErrorItemSchema>;

/** `{"error_code": "ERR_...", "message": "<한국어 문장>", "details": <객체|배열|null>}` */
export const ErrorResponseSchema = z.object({
  error_code: z.string().regex(/^ERR_[A-Z0-9_]+$/),
  message: z.string().min(1),
  details: z.union([z.record(z.string(), z.unknown()), z.array(z.unknown())]).nullable(),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * backend 가 내는 오류 코드 카탈로그 (계약 문서 1.3절).
 * 런타임 검증은 `ErrorResponseSchema` 의 문자열 규칙만 본다. 이 enum 은 MSW·계약 테스트용이다.
 */
export const ApiErrorCodeSchema = z.enum([
  // 상태별 기본 코드 (라우터가 구체 코드를 주지 않을 때). 422 는 쓰지 않는다 (요청 검증은 모두 400)
  'ERR_INVALID_PAYLOAD',          // 400: 요청 본문·쿼리·경로 검증 실패 (details: [{loc, msg}] 또는 null)
  'ERR_NOT_FOUND',                // 404: 없음 (기사 없음 포함)
  'ERR_METHOD_NOT_ALLOWED',       // 405
  'ERR_CONFLICT',                 // 409
  'ERR_SERVER_INTERNAL',          // 500: 처리하지 못한 예외
  'ERR_UPSTREAM_FAILED',          // 502
  'ERR_SERVICE_UNAVAILABLE',      // 503
  // 라우터 구체 코드
  'ERR_CHAT_PAYLOAD_EMPTY',       // 400: 질문이 비어 있음
  'ERR_CHAT_PAYLOAD_TOO_LARGE',   // 400: 질문 2,000자 초과
  'ERR_INVALID_SCOPE_PARAM',      // 400: scope 가 scoped·global 아님
  'ERR_INVALID_MODEL_TIER',       // 400: model_tier 가 haiku·sonnet·opus 아님
  'ERR_HANDOVER_SOURCE_NOT_FOUND',// 404: scoped 대상 기사가 없음
  'ERR_CLAUDE_API_KEY_MISSING',   // 401: Anthropic 키 없음·무효
  'ERR_CLAUDE_QUOTA_EXCEEDED',    // 429: Anthropic 호출 한도 초과
  'ERR_CLAUDE_OVERLOADED',        // 529: Anthropic 과부하
  'ERR_LLM_PROVIDER_UNAVAILABLE', // 503: 쓸 수 있는 LLM 프로바이더 없음
  'ERR_LLM_UPSTREAM_FAILED',      // 502: LLM 업스트림 실패. SSE event: error 에서는 thinking 단계(질문 분석) 실패
  'ERR_LLM_QUOTA_EXCEEDED',       // 429: LLM 호출 한도 초과
  'ERR_LLM_STREAM_FAILED',        // SSE event: error 의 코드 (토큰 생성 중 실패). 기사 Ask AI 스트림의 error 이벤트도 이 코드
  'ERR_SESSION_INVALID_UUID',     // 400: POST /api/chat/sessions 의 id 가 UUID 아님 (JSON·필드 오류는 ERR_INVALID_PAYLOAD)
  'ERR_SESSION_NOT_FOUND',        // 404: 세션 없음
  'ERR_SESSION_CREATE_FAILED',    // 500: 세션 생성·업서트 실패
  'ERR_SESSION_DELETE_FAILED',    // 500: 세션 삭제 실패
  'ERR_RETRIEVER_INDEX_ERROR',    // SSE event: error 의 코드 (global 검색 tool_calling 단계 실패, status_code 500)
]);
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;

// ============================================================================
// 2.5. Anthropic Claude 3-Tier Multi-Model & Token Usage (v4.0 Contracts)
// ============================================================================

export const ModelTierSchema = z.enum(['haiku', 'sonnet', 'opus']);
export type ModelTier = z.infer<typeof ModelTierSchema>;

export const ChatModelSchema = z.string().min(1);
export type ChatModel = string;

export const DEFAULT_CHAT_MODEL: string = 'claude-sonnet-5-5';
export const DEFAULT_MODEL_TIER: ModelTier = 'sonnet';

export const CLAUDE_MODELS = {
  haiku: 'claude-haiku-5-5',
  sonnet: 'claude-sonnet-5-5',
  opus: 'claude-opus-5-5',
} as const;

export const TIER_TO_MODEL: Record<ModelTier, string> = {
  haiku: 'claude-haiku-5-5',
  sonnet: 'claude-sonnet-5-5',
  opus: 'claude-opus-5-5',
};

export const MODEL_TO_TIER: Record<string, ModelTier> = {
  'claude-sonnet-5-5': 'sonnet',
  'claude-haiku-5-5': 'haiku',
  'claude-opus-5-5': 'opus',
};

/**
 * 모델 식별자/티어 살균 및 정규화
 * 과거 대화 이력의 모델명(Gemini, GPT 등)은 있는 그대로 보존하고,
 * Claude 계열 모델은 적절한 티어(haiku, sonnet, opus)로 정규화합니다.
 */
export function sanitizeModelTier(rawModel: string | undefined | null): ModelTier | string {
  if (!rawModel) return 'sonnet';
  const normalized = rawModel.toLowerCase().trim();
  if (normalized === 'haiku' || normalized.includes('haiku')) return 'haiku';
  if (normalized === 'opus' || normalized.includes('opus')) return 'opus';
  if (normalized === 'sonnet' || normalized.includes('sonnet')) return 'sonnet';
  // 과거 이력 모델 식별자(Gemini, GPT 등) 왜곡 없이 보존
  return rawModel.trim();
}

export interface ModelDisplayFormatOptions {
  /** 아이콘(🎯, ⚡, 🧠, ✨, 🤖) 포함 여부 (기본값: false) */
  withIcon?: boolean;
  /** 'Claude ' 접두사 생략 여부 (기본값: false) */
  short?: boolean;
}

/**
 * 모델 식별자/티어를 화면 표시 규격 레이블로 변환
 * 과거 대화 이력의 실제 사용 모델(Gemini, GPT 등)을 있는 그대로 정직하게 표시하고,
 * Claude 모델은 깔끔한 브랜드 명칭(Claude Sonnet 5.5 등)으로 포맷팅합니다.
 */
export function formatModelDisplayName(
  rawModel?: string | null,
  options?: ModelDisplayFormatOptions
): string {
  if (!rawModel) {
    const shortName = 'Sonnet 5.5';
    const baseLabel = options?.short ? shortName : `Claude ${shortName}`;
    return options?.withIcon ? `🎯 ${baseLabel}` : baseLabel;
  }

  const trimmed = rawModel.trim();
  const lower = trimmed.toLowerCase();

  // 과거 이력 Gemini 모델: 왜곡 없이 정확하게 표시
  if (lower.includes('gemini') || lower.includes('google')) {
    let name = 'Gemini';
    if (lower === 'gemini-1.5-flash') name = 'Gemini 1.5 Flash';
    else if (lower === 'gemini-1.5-pro') name = 'Gemini 1.5 Pro';
    else if (lower === 'gemini-2.5-flash') name = 'Gemini 2.5 Flash';
    else if (lower === 'gemini-ultra') name = 'Gemini Ultra';
    else if (lower.includes('flash-lite')) name = 'Gemini 3.5 Flash Lite';
    else if (lower === 'gemini') name = 'Gemini';
    else {
      name = trimmed
        .replace(/^(google\s+)/i, '')
        .split(/[-_ ]+/)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');
    }
    return options?.withIcon ? `✨ ${name}` : name;
  }

  // 과거 이력 GPT 모델: 왜곡 없이 정확하게 표시
  if (lower.includes('gpt')) {
    let name = 'GPT';
    if (lower === 'gpt-4o') name = 'GPT-4o';
    else if (lower === 'gpt-4o-mini') name = 'GPT-4o Mini';
    else if (lower === 'gpt-4') name = 'GPT-4';
    else if (lower === 'gpt-3.5-turbo') name = 'GPT-3.5 Turbo';
    else {
      name = trimmed.toUpperCase();
    }
    return options?.withIcon ? `🤖 ${name}` : name;
  }

  // Claude 계열 모델
  if (lower === 'haiku' || lower.includes('haiku')) {
    const shortName = 'Haiku 5.5';
    const baseLabel = options?.short ? shortName : `Claude ${shortName}`;
    return options?.withIcon ? `⚡ ${baseLabel}` : baseLabel;
  }

  if (lower === 'opus' || lower.includes('opus')) {
    const shortName = 'Opus 5.5';
    const baseLabel = options?.short ? shortName : `Claude ${shortName}`;
    return options?.withIcon ? `🧠 ${baseLabel}` : baseLabel;
  }

  if (lower === 'sonnet' || lower.includes('sonnet')) {
    const shortName = 'Sonnet 5.5';
    const baseLabel = options?.short ? shortName : `Claude ${shortName}`;
    return options?.withIcon ? `🎯 ${baseLabel}` : baseLabel;
  }

  return trimmed;
}

export const getModelLabel = formatModelDisplayName;

// zod 규칙 (계약 v1.3): Pydantic 필수 → 필수, `Optional[X] = None` → `.nullable().optional()`,
// 기본값 있는 필드 → `.default(...)`. Pydantic 에 없는 형식·범위 제약(URL, UUID, 길이, 범위)은 두지 않는다.
export const TokenUsageMetaSchema = z.object({
  input_tokens: z.number().int().default(0),
  output_tokens: z.number().int().default(0),
  cache_read_input_tokens: z.number().int().nullable().optional(),
  cache_creation_input_tokens: z.number().int().nullable().optional(),
});
export type TokenUsageMeta = z.infer<typeof TokenUsageMetaSchema>;

// ============================================================================
// 3. 수집 소식 타깃팅 포커스 필터 (ChatFocusFilter Contracts)
// ============================================================================

export const ChatFocusCategorySchema = z.enum([
  'all',
  'harness',
  'mcp_plugins_skills',
  'agent_tech',
  'ai_news',
]);
export type ChatFocusCategory = z.infer<typeof ChatFocusCategorySchema>;

export const ChatFocusTimeRangeSchema = z.enum(['all', '24h', '7d', '30d']);
export type ChatFocusTimeRange = z.infer<typeof ChatFocusTimeRangeSchema>;

export const ChatFocusSortSchema = z.enum(['hot', 'latest', 'quality']);
export type ChatFocusSort = z.infer<typeof ChatFocusSortSchema>;

export const ChatFocusFilterSchema = z.object({
  category: ChatFocusCategorySchema.default('all'),
  time_range: ChatFocusTimeRangeSchema.default('all'),
  sort: ChatFocusSortSchema.default('hot'),
  high_signal_only: z.boolean().default(false),
});
export type ChatFocusFilter = z.infer<typeof ChatFocusFilterSchema>;

// UI 컴포넌트 편의용 타입 및 카멜케이스 매핑 호환 레이어
export interface FocusFilters {
  category: ChatFocusCategory;
  timeRange: ChatFocusTimeRange;
  sort: ChatFocusSort;
  highSignalOnly: boolean;
}

export const DEFAULT_FOCUS_FILTERS: FocusFilters = {
  category: 'all',
  timeRange: 'all',
  sort: 'hot',
  highSignalOnly: false,
};

export const toChatFocusFilter = (ui: FocusFilters): ChatFocusFilter => ({
  category: ui.category,
  time_range: ui.timeRange,
  sort: ui.sort,
  high_signal_only: ui.highSignalOnly,
});

export const fromChatFocusFilter = (api?: ChatFocusFilter | null): FocusFilters => ({
  category: api?.category ?? 'all',
  timeRange: api?.time_range ?? 'all',
  sort: api?.sort ?? 'hot',
  highSignalOnly: api?.high_signal_only ?? false,
});

// ============================================================================
// 4. 에이전틱 리서치 워크플로우 진행 단계 스키마 (Workflow Steps & Status)
// ============================================================================

// backend 스트림이 실제로 보내는 4값 (v1.4). Pydantic Literal 의 observing·evaluating_sufficiency·agentic_searching 은 보내지 않는다
export const ChatStatusStepSchema = z.enum([
  'thinking',          // global: ReAct 계획
  'tool_calling',      // global: search_news_corpus 검색
  'extracting_source', // scoped: 기사 본문 로드
  'synthesizing',      // 답변 생성
]);
export type ChatStatusStep = z.infer<typeof ChatStatusStepSchema>;

export const ChatStatusPayloadSchema = z.object({
  step: ChatStatusStepSchema,
  label: z.string(),
  timestamp: z.string(),
  progress: z.number().int().nullable().optional(),
  query: z.string().nullable().optional(),
  queries: z.array(z.string()).nullable().optional(),
  sources_found: z.number().int().nullable().optional(),
});
export type ChatStatusPayload = z.infer<typeof ChatStatusPayloadSchema>;
export type StatusPayload = ChatStatusPayload;

// ============================================================================
// 5. 이원화 출처(Primary + Supplementary) 메타데이터 스키마 (Dual Sources)
// ============================================================================

export const ChatSourceTypeSchema = z.enum(['primary', 'supplementary']);
export type ChatSourceType = z.infer<typeof ChatSourceTypeSchema>;

export const ChatSourceItemSchema = z.object({
  index: z.union([z.number().int(), z.string()]), // backend 는 1, 2, ... 를 보낸다
  type: ChatSourceTypeSchema.default('primary'),
  id: z.number().int().nullable().optional(),
  title: z.string(),
  url: z.string(),
  source: z.string(),
  category: z.string().nullable().optional(),
  quality_score: z.number().nullable().optional(),
  score: z.number().nullable().optional(),
  snippet: z.string().nullable().optional(),
  full_content: z.string().nullable().optional(),
  domain: z.string().nullable().optional(),
  relevance_score: z.number().nullable().optional(),
  published_at: IsoDateTimeSchema.nullable().optional(),
  publisher: z.string().nullable().optional(),
});
export type ChatSourceItem = z.infer<typeof ChatSourceItemSchema>;

// 하위 호환 별칭 (Backward compatibility aliases)
export type ChatSourceMeta = ChatSourceItem;
export const ChatSourceMetaSchema = ChatSourceItemSchema;
export type SourceReference = ChatSourceItem;

export const ChatSourcesPayloadSchema = z.object({
  sources: z.array(ChatSourceItemSchema),
  applied_filters: ChatFocusFilterSchema.nullable().optional(),
  is_relaxed: z.boolean().default(false),
  primary_count: z.number().int().nullable().optional(),
  supplementary_count: z.number().int().nullable().optional(),
});
export type ChatSourcesPayload = z.infer<typeof ChatSourcesPayloadSchema>;
export const SourcesPayloadSchema = ChatSourcesPayloadSchema;
export type SourcesPayload = ChatSourcesPayload;
export const SseSourcesPayloadSchema = ChatSourcesPayloadSchema;
export type SseSourcesPayload = ChatSourcesPayload;

// ============================================================================
// 6. 공통 서브 엔티티 및 질의 요청 / 응답 스키마
// ============================================================================

export const ChatMessageHistorySchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
});
export type ChatMessageHistory = z.infer<typeof ChatMessageHistorySchema>;

export const ScopeModeSchema = z.enum(['scoped', 'global']);
export type ScopeMode = z.infer<typeof ScopeModeSchema>;

/** 서버가 이 턴을 저장할 때 쓸 메시지 id 의 최대 길이 (DB `chat_messages.id` 가 `String(36)`). */
export const CHAT_MESSAGE_ID_MAX_LENGTH = 36;

/** 클라이언트가 만든 메시지 id (`msg-user-xxxxxxx`·`msg-asst-xxxxxxx` 16자, 또는 UUID 36자). */
export const ChatClientMessageIdSchema = z.string().min(1).max(CHAT_MESSAGE_ID_MAX_LENGTH);

export const ChatStreamRequestSchema = z
  .object({
    question: z
      .string()
      .min(1, '질문을 입력해주세요.')
      .max(2000, '질문은 최대 2,000자까지 입력 가능합니다.'),
    /** 기본값 없음(None). backend 는 명시 model > model_tier > 기본 챗 모델 순으로 고른다. frontend 는 늘 보낸다. */
    model: z.string().nullable().optional(),
    model_tier: ModelTierSchema.nullable().optional(),
    scope: ScopeModeSchema.default('global'),
    source_id: z.number().int().nullable().optional(),
    /** UUID 여야 한다(아니면 400 ERR_SESSION_INVALID_UUID). 없거나 null 이면 backend 가 새 UUID 를 만든다. */
    session_id: z.string().regex(SESSION_UUID_PATTERN).nullable().optional(),
    history: z.array(ChatMessageHistorySchema).nullable().optional(),
    top_k: z.number().int().min(1).max(10).default(5),
    filters: ChatFocusFilterSchema.nullable().optional(),
    /** 서버가 이 턴의 질문을 저장할 id. 없으면 서버가 UUID 를 만든다. */
    user_message_id: ChatClientMessageIdSchema.nullable().optional(),
    /** 서버가 이 턴의 답을 저장할 id. 없으면 서버가 UUID 를 만든다. */
    assistant_message_id: ChatClientMessageIdSchema.nullable().optional(),
  })
  .refine(
    (req) =>
      !req.user_message_id ||
      !req.assistant_message_id ||
      req.user_message_id !== req.assistant_message_id,
    {
      message: 'user_message_id 와 assistant_message_id 는 서로 달라야 합니다.',
      path: ['assistant_message_id'],
    }
  );
export type ChatStreamRequest = z.infer<typeof ChatStreamRequestSchema>;

// ============================================================================
// 7. 컨텍스트 핸드오버 및 기사 상세 메타데이터 스키마
// ============================================================================

export const ChatSourceDetailResponseSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  url: z.string(),
  source: z.string(),
  category: z.string(),
  author: z.string().nullable().optional(),
  summary: z.string().default(''),
  tldr_bullets: z.array(z.string()).default([]),
  why_it_matters: z.string().default(''),
  tech_stack: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  quality_score: z.number(),
  is_high_signal: z.boolean().default(false),
  hotness_score: z.number().default(0.0),
  published_at: IsoDateTimeSchema,
  created_at: IsoDateTimeSchema.nullable().optional(),
  /** 스크래핑한 원문. 아직 없으면 null */
  full_content: z.string().nullable().optional(),
  scraped_at: IsoDateTimeSchema.nullable().optional(),
});
export type ChatSourceDetailResponse = z.infer<typeof ChatSourceDetailResponseSchema>;

// ============================================================================
// 8. 코퍼스 검색 청크 (backend retriever 의 `ChatSearchChunk`).
//    v0.4.2 에서 GET /api/chat/search 를 지워 이 모양을 돌려주는 엔드포인트는 없다.
//    MSW 가 global 질문의 후보 출처를 고르는 코퍼스 fixture(`mockSearchChunks`)의 타입으로만 쓴다.
// ============================================================================

export const ChatSearchChunkSchema = z.object({
  index: z.number().int(),
  id: z.number().int(),
  title: z.string(),
  url: z.string(),
  source: z.string(),
  category: z.string(),
  snippet: z.string(),
  quality_score: z.number(),
  published_at: z.string(),
  bm25_score: z.number(),
  rag_score: z.number(), // backend 가 0~1 로 자른다
});
export type ChatSearchChunk = z.infer<typeof ChatSearchChunkSchema>;

// ============================================================================
// 9. Server-Sent Events (SSE) 멀티 이벤트 페이로드 스키마
// ============================================================================

export const SseTokenPayloadSchema = z.object({
  token: z.string(),
});
export type SseTokenPayload = z.infer<typeof SseTokenPayloadSchema>;
export const TokenPayloadSchema = SseTokenPayloadSchema;
export type TokenPayload = SseTokenPayload;

export const ChatDonePayloadSchema = z.object({
  done: z.boolean().default(true),
  session_id: z.string(),
  model: z.string().nullable().optional(),
  model_tier: ModelTierSchema.nullable().default('sonnet'),
  sources_count: z.number().int(),
  primary_count: z.number().int().nullable().optional(),
  supplementary_count: z.number().int().nullable().optional(),
  latency_ms: z.number().int(),
  usage: TokenUsageMetaSchema.nullable().optional(),
});
export type ChatDonePayload = z.infer<typeof ChatDonePayloadSchema>;
export const DonePayloadSchema = ChatDonePayloadSchema;
export type DonePayload = ChatDonePayload;
export const SseDonePayloadSchema = ChatDonePayloadSchema;
export type SseDonePayload = ChatDonePayload;

export const ChatStreamErrorPayloadSchema = z.object({
  error_code: z.string(),
  message: z.string(),
  status_code: z.number().int().default(502),
  step: z.string().nullable().optional(),
  retryable: z.boolean().default(true),
});
export type ChatStreamErrorPayload = z.infer<typeof ChatStreamErrorPayloadSchema>;
export const StreamErrorPayloadSchema = ChatStreamErrorPayloadSchema;
export type StreamErrorPayload = ChatStreamErrorPayload;
export const SseErrorPayloadSchema = ChatStreamErrorPayloadSchema;
export type SseErrorPayload = ChatStreamErrorPayload;

// ============================================================================
// 10. SSE 다중 이벤트 파서 및 유틸리티 타입 (SSE Parser Utility)
// ============================================================================

export type ChatSseEvent =
  | { event: 'status'; data: ChatStatusPayload }
  | { event: 'sources'; data: ChatSourcesPayload }
  | { event: 'token'; data: SseTokenPayload }
  | { event: 'done'; data: ChatDonePayload }
  | { event: 'error'; data: ChatStreamErrorPayload };

export interface ChatSseRawEvent {
  event: string;
  data: string;
}

/**
 * SSE 원시 텍스트 청크 파서 유틸리티
 */
export const parseChatSseEvent = (rawEvent: string, rawData: string): ChatSseEvent | null => {
  try {
    const parsed = JSON.parse(rawData);
    switch (rawEvent) {
      case 'status':
        return { event: 'status', data: ChatStatusPayloadSchema.parse(parsed) };
      case 'sources':
        return { event: 'sources', data: ChatSourcesPayloadSchema.parse(parsed) };
      case 'token':
        return { event: 'token', data: SseTokenPayloadSchema.parse(parsed) };
      case 'done':
        return { event: 'done', data: ChatDonePayloadSchema.parse(parsed) };
      case 'error':
        return { event: 'error', data: ChatStreamErrorPayloadSchema.parse(parsed) };
      default:
        return null;
    }
  } catch {
    return null;
  }
};

// ============================================================================
// 11. 프론트엔드 UI 내부 상태 및 LocalStorage 영속화 계약 (UI Contracts)
// ============================================================================

export const ChatStatusSchema = z.enum([
  'idle',
  'retrieving',
  'streaming',
  'completed',
  'error',
  'aborted',
]);
export type ChatStatus = z.infer<typeof ChatStatusSchema>;

export const ChatMessageSchema = z.object({
  /** 클라이언트 메시지 id (`msg-user-`·`msg-asst-` + 7자) 또는 서버 UUID. backend 세션 POST 와 같은 1~36자 */
  id: ChatClientMessageIdSchema,
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.string(),
  sources: z.array(ChatSourceItemSchema).optional(),
  model_used: z.string().optional(),
  model_tier: ModelTierSchema.optional(),
  scope: ScopeModeSchema,
  source_id: z.number().int().positive().nullable().optional(),
  applied_filters: ChatFocusFilterSchema.nullable().optional(),
  is_relaxed: z.boolean().optional(),
  primary_count: z.number().int().optional(),
  supplementary_count: z.number().int().optional(),
  current_status: ChatStatusPayloadSchema.nullable().optional(),
  step_history: z.array(ChatStatusPayloadSchema).optional(),
  status: z.enum(['sending', 'sent', 'streaming', 'completed', 'error', 'aborted']).optional(),
  errorMessage: z.string().optional(),
  latency_ms: z.number().int().nullable().optional(),
  usage: TokenUsageMetaSchema.nullable().optional(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type Message = ChatMessage;
export const MessageSchema = ChatMessageSchema;

export const SendMessageRequestSchema = z.object({
  content: z.string().min(1, '메시지 내용을 입력해주세요.'),
  role: z.enum(['user']).default('user'),
});
export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;

// ============================================================================
// 12. 대화 세션 영속화 및 멀티턴 복원 계약 (Session Persistence & Multi-turn Continuity)
// ============================================================================

export const GenericSuccessResponseSchema = z.object({
  status: z.string().default('success'),
  message: z.string().nullable().optional(),
  deleted_count: z.number().int().nullable().optional(),
});
export type GenericSuccessResponse = z.infer<typeof GenericSuccessResponseSchema>;

export const MessageRoleSchema = z.enum(['user', 'assistant', 'system']);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

export const MessageItemStatusSchema = z.enum([
  'pending',
  'streaming',
  'completed',
  'error',
  'aborted',
]);
export type MessageItemStatus = z.infer<typeof MessageItemStatusSchema>;

/** 개별 대화 턴 메시지 엔티티 스키마 (OpenAPI ChatMessageItem) */
export const ChatMessageItemSchema = z.object({
  id: z.string(),
  session_id: z.string(),
  role: MessageRoleSchema,
  content: z.string(),
  created_at: IsoDateTimeSchema,
  sources: z.array(ChatSourceItemSchema).nullable().optional(),
  status: MessageItemStatusSchema.default('completed'),
  model: z.string().nullable().optional(),
  model_tier: ModelTierSchema.nullable().optional(),
  latency_ms: z.number().int().nullable().optional(),
  usage: TokenUsageMetaSchema.nullable().optional(),
});
export type ChatMessageItem = z.infer<typeof ChatMessageItemSchema>;

/** 대화 세션 요약 메타데이터 스키마 (OpenAPI ChatSessionSummary) */
export const ChatSessionSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  created_at: IsoDateTimeSchema,
  updated_at: IsoDateTimeSchema,
  scope_mode: ScopeModeSchema,
  active_source_id: z.number().int().nullable().optional(),
  message_count: z.number().int().default(0),
  last_message_preview: z.string().nullable().optional(),
  active_filters: ChatFocusFilterSchema.nullable().optional(),
});
export type ChatSessionSummary = z.infer<typeof ChatSessionSummarySchema>;

/** 대화 세션 전체 상세 정보 스키마 (OpenAPI ChatSessionDetail) */
export const ChatSessionDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  created_at: IsoDateTimeSchema,
  updated_at: IsoDateTimeSchema,
  scope_mode: ScopeModeSchema,
  active_source_id: z.number().int().nullable().optional(),
  active_source: ChatSourceDetailResponseSchema.nullable().optional(),
  active_filters: ChatFocusFilterSchema.nullable().optional(),
  messages: z.array(ChatMessageItemSchema).default([]),
});
export type ChatSessionDetail = z.infer<typeof ChatSessionDetailSchema>;

/** 대화 세션 생성/업서트 요청 페이로드 스키마 (OpenAPI ChatSessionCreateRequest) */
export const ChatSessionCreateRequestSchema = z.object({
  /** 주어지면 backend 가 UUID 로 파싱한다 (실패면 400 ERR_SESSION_INVALID_UUID) */
  id: z.string().nullable().optional(),
  title: z.string().nullable().default('새 대화'),
  scope_mode: ScopeModeSchema.nullable().default('global'),
  active_source_id: z.number().int().nullable().optional(),
  active_filters: ChatFocusFilterSchema.nullable().optional(),
  messages: z.array(ChatMessageItemSchema).nullable().optional(),
});
export type ChatSessionCreateRequest = z.infer<typeof ChatSessionCreateRequestSchema>;

/** 세션 목록 렌더링에 사용되는 경량 세션 메타데이터 (UI Model) */
export interface ChatSessionMeta {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  scopeMode: ScopeMode;
  created_at?: string;
  updated_at?: string;
  message_count?: number;
  scope_mode?: ScopeMode;
  article_id?: number | null;
  article_title?: string;
  activeSourceId?: number | null;
  activeSourceTitle?: string;
  focusFilters?: FocusFilters | null;
  lastMessagePreview?: string;
}

/** 세션 선택 시 복원되는 4대 핵심 컨텍스트를 포함하는 완전한 세션 엔터티 */
export interface ChatSessionFullData {
  session: ChatSessionMeta;
  messages: ChatMessage[];
  scopeMode: ScopeMode;
  activeSource?: ChatSourceDetailResponse | null;
  focusFilters: FocusFilters;
}

export function summaryToSessionMeta(summary: ChatSessionSummary): ChatSessionMeta {
  return {
    id: summary.id,
    title: summary.title,
    createdAt: summary.created_at,
    updatedAt: summary.updated_at,
    messageCount: summary.message_count,
    scopeMode: summary.scope_mode,
    activeSourceId: summary.active_source_id,
    focusFilters: summary.active_filters ? fromChatFocusFilter(summary.active_filters) : null,
    lastMessagePreview: summary.last_message_preview || undefined,
  };
}

// ============================================================================
// 13. 세션 거버넌스 알고리즘 및 컨버터 유틸리티 (ADR-006 Helpers)
// ============================================================================

/**
 * 최초 사용자 질문 본문 기준 30자 자동 타이틀링 알고리즘 (ADR-006 §3.6)
 * - 마크다운/HTML 제거 후 정규화
 * - 30자 초과 시 말줄임표(...) 추가
 */
export function generateAutoTitle(question: string): string {
  const sanitized = question
    .replace(/[#*_~`]|<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (sanitized.length === 0) return '새 대화';
  if (sanitized.length <= 30) return sanitized;
  return sanitized.slice(0, 30) + '...';
}

/**
 * 멀티턴 대화 이력 슬라이딩 윈도우 압축 알고리즘 (ADR-006 §3.5)
 * - 최근 최대 10턴(20개 메시지) 유지
 * - 최대 허용 토큰(기본 3,000 토큰) 초과 시 오래된 턴 순차 가지치기
 */
export function applySlidingWindow(
  history: ChatMessageHistory[],
  maxTurns = 10,
  maxTokens = 3000
): ChatMessageHistory[] {
  const sliced = history.slice(-2 * maxTurns);
  while (sliced.length > 2) {
    const totalChars = sliced.reduce((acc, m) => acc + m.content.length, 0);
    // 보수적 토큰 추정치 (한글/영문 혼합 평균 1토큰 = ~2.5글자)
    if (totalChars / 2.5 <= maxTokens) break;
    sliced.splice(0, 2); // 가장 오래된 (user, assistant) 턴 쌍 제거
  }
  return sliced;
}

/**
 * API ChatMessageItem 엔티티를 프론트엔드 UI ChatMessage 상태로 변환
 */
export function chatMessageItemToUiMessage(
  item: ChatMessageItem,
  scope: ScopeMode = 'global',
  sourceId?: number | null
): ChatMessage {
  const statusMap: Record<MessageItemStatus, ChatMessage['status']> = {
    pending: 'sending',
    streaming: 'streaming',
    completed: 'completed',
    error: 'error',
    aborted: 'aborted',
  };

  return {
    id: item.id,
    role: item.role,
    content: item.content,
    timestamp: item.created_at,
    sources: item.sources || undefined,
    model_used: item.model || undefined,
    model_tier: (item.model_tier as ModelTier) || undefined,
    scope,
    source_id: sourceId || undefined,
    status: statusMap[item.status] || 'completed',
    latency_ms: item.latency_ms ?? undefined,
    usage: item.usage || undefined,
  };
}

/**
 * 프론트엔드 UI ChatMessage 상태를 API ChatMessageItem 엔티티로 변환
 */
export function uiMessageToChatMessageItem(
  msg: ChatMessage,
  sessionId: string
): ChatMessageItem {
  const statusMap: Record<NonNullable<ChatMessage['status']>, MessageItemStatus> = {
    sending: 'pending',
    sent: 'completed',
    streaming: 'streaming',
    completed: 'completed',
    error: 'error',
    aborted: 'aborted',
  };

  return {
    id: msg.id,
    session_id: sessionId,
    role: msg.role,
    content: msg.content,
    created_at: msg.timestamp || new Date().toISOString(),
    sources: msg.sources || null,
    status: (msg.status ? statusMap[msg.status] : 'completed') || 'completed',
    model: msg.model_used || null,
    model_tier: msg.model_tier || null,
    latency_ms: msg.latency_ms ?? null,
    usage: msg.usage || null,
  };
}

// ============================================================================
// 14. Claude 3-Tier Multi-Model UI 컴포넌트 인터페이스 (v4.0 UI Contracts)
// ============================================================================

export interface ChatModelSelectorProps {
  /** 현재 활성화된 모델 티어 */
  selectedTier: ModelTier;
  /** 사용자 모델 선택 콜백 */
  onSelectTier: (tier: ModelTier) => void;
  /** 답변 스트리밍 진행 여부 (true 시 상호작용 비활성화 및 안내 툴팁) */
  isStreaming: boolean;
  /** 키보드 포커스 트랩 및 드롭다운 강제 제어 옵션 */
  forceOpen?: boolean;
  /** 추가 Tailwind 클래스 */
  className?: string;
}

export interface ModelTierBadgeProps {
  /** 렌더링 대상 모델 티어 또는 과거 모델명 */
  tier: ModelTier | string;
  /** 실제 SSE 스트리밍 측정 소요 시간 (ms 단위) */
  latencyMs?: number | null;
  /** 상대 비용($, $$, $$$) 표시 여부. Claude 티어만, 측정값이 아닌 상대 순서 (FE-25) */
  showCost?: boolean;
  /** 티어 아이콘 노출 여부 (기본값: true) */
  showIcon?: boolean;
  /** 권장 라벨('[추천]') 노출 여부 */
  showRecommended?: boolean;
  /** 추가 Tailwind 클래스 */
  className?: string;
}

export interface ModelSwitchEvent {
  id: string;
  type: 'model_switch';
  previousTier?: ModelTier;
  newTier: ModelTier;
  timestamp: string; // ISO 8601
}

export interface ModelChangeDividerProps {
  /** 변경 전 모델 티어 (옵셔널) */
  previousTier?: ModelTier;
  /** 새롭게 활성화된 모델 티어 */
  newTier: ModelTier;
  /** 모델 전환 발생 시각 */
  timestamp?: string;
  /** 무손실 컨텍스트 보존 안내 문구 커스텀 */
  contextNotice?: string;
  /** 추가 클래스 */
  className?: string;
}

/** 타임라인 복합 렌더링 아이템 타입 (메시지 + 시스템 모델 전환 디바이더) */
export type ChatTimelineItem =
  | { type: 'message'; data: ChatMessage }
  | { type: 'model_switch'; data: ModelSwitchEvent };
// 챗 헤더 Props 는 `components/chat/ChatHeader.tsx` 의 `ChatHeaderProps` 하나만 둔다 (옛 중복 정의 삭제, FE-08).


