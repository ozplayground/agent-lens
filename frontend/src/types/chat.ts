import { z } from 'zod';

// ============================================================================
// 1. 공통 응답 엔벨로프 및 에러 DTO (Response Envelope & Error Contracts)
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiErrorDetail;
  timestamp: string;
}

export interface ApiErrorDetail {
  error_code: string;
  message: string;
  details?: Record<string, unknown> | null;
}

export interface ErrorResponse {
  error_code: string;
  message: string;
  details?: Record<string, unknown> | null;
}

export const ApiErrorDetailSchema = z.object({
  error_code: z.string().min(1),
  message: z.string().min(1),
  details: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const ErrorResponseSchema = z.object({
  error_code: z.string().min(1),
  message: z.string().min(1),
  details: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const createApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: ApiErrorDetailSchema.optional(),
    timestamp: z.string(),
  });

// ============================================================================
// 2. 진짜 LLM 스트리밍 실패 에러 DTO 및 에러 코드 (Real LLM Error Contracts)
// ============================================================================

export const LlmErrorCodeSchema = z.enum([
  'ERR_CLAUDE_API_KEY_MISSING',   // HTTP 503: Anthropic Claude API 키 미설정
  'ERR_ANTHROPIC_KEY_MISSING',    // HTTP 503: Anthropic Claude API 키 미설정 별칭
  'ERR_CLAUDE_QUOTA_EXCEEDED',    // HTTP 429: Anthropic Claude 호출 한도 초과
  'ERR_ANTHROPIC_RATE_LIMIT',     // HTTP 429: Anthropic Claude 호출 한도 초과 별칭
  'ERR_CLAUDE_OVERLOADED',        // HTTP 503 / 529: Anthropic 서버 과부하
  'ERR_ANTHROPIC_OVERLOADED',     // HTTP 503 / 529: Anthropic 서버 과부하 별칭
  'ERR_INVALID_MODEL_TIER',       // HTTP 400: 허용되지 않은 모델 티어 코드 요청
  'ERR_SONNET_SCHEMA_VALIDATION', // HTTP 500: Claude Sonnet 5.5 Pydantic 스키마 검증 실패
  'ERR_STREAM_ABORTED_BY_USER',   // HTTP 499: 모델 전환 또는 브라우저 이탈 스트림 중단
  'ERR_ARTICLE_EXTRACTION_FAIL',  // HTTP 502: 원문 본문 추출 실패
  'ERR_LLM_PROVIDER_UNAVAILABLE', // HTTP 503: 가용한 LLM 프로바이더 엔진 미설정 (API 키 누락)
  'ERR_LLM_UPSTREAM_FAILED',      // HTTP 502: 외부 LLM 업스트림 통신 실패 / API 장애
  'ERR_LLM_STREAM_FAILED',        // SSE event: error: LLM 스트리밍 진행 중 외부 연결 단절
  'ERR_LLM_QUOTA_EXCEEDED',       // HTTP 429: 외부 LLM API 호출 한도 초과
  'ERR_CHAT_STREAM_TIMEOUT',      // HTTP 504 / SSE error: 스트리밍 15초 초과 타임아웃
  'ERR_HANDOVER_SOURCE_NOT_FOUND',// HTTP 404: Scoped 모드 대상 기사 미존재
  'ERR_SESSION_NOT_FOUND',        // HTTP 404: 대상 대화 세션을 찾을 수 없음
  'ERR_SESSION_INVALID_UUID',     // HTTP 400: 유효하지 않은 세션 UUID 규격
  'ERR_SESSION_DELETE_FAILED',    // HTTP 500: 세션 삭제 트랜잭션 실패
  'ERR_SESSION_CREATE_FAILED',    // HTTP 500: 세션 생성/업서트 실패
  'ERR_SESSION_LIMIT_EXCEEDED',   // HTTP 400: 최대 세션 한도 초과
  'ERR_INVALID_SCOPE_PARAM',      // HTTP 400: 유효하지 않은 scope 값
  'ERR_INVALID_FILTER_PARAM',     // HTTP 400: 포커스 필터 규격 오류
  'ERR_CHAT_PAYLOAD_EMPTY',       // HTTP 400: 질문 본문 비어있음
  'ERR_CHAT_PAYLOAD_TOO_LARGE',   // HTTP 400: 질문 본문 2,000자 초과
  'ERR_SEARCH_QUERY_TOO_SHORT',   // HTTP 400: 검색어 2자 미만
  'ERR_SERVER_INTERNAL',          // HTTP 500: 백엔드 내부 예외
]);

export type LlmErrorCode = z.infer<typeof LlmErrorCodeSchema>;

export const LlmErrorDetailSchema = z.object({
  error_code: LlmErrorCodeSchema,
  message: z.string().min(1),
  status_code: z.number().int().optional(),
  step: z.string().nullable().optional(),
  provider: z.string().optional(),
  retryable: z.boolean().default(true),
  details: z.record(z.string(), z.unknown()).nullable().optional(),
});

export type LlmErrorDetail = z.infer<typeof LlmErrorDetailSchema>;

export const LlmErrorResponseSchema = z.object({
  error_code: LlmErrorCodeSchema,
  message: z.string().min(1),
  status_code: z.number().int().optional(),
  step: z.string().nullable().optional(),
  provider: z.string().optional(),
  retryable: z.boolean().default(true),
  details: z.record(z.string(), z.unknown()).nullable().optional(),
});

export type LlmErrorResponse = z.infer<typeof LlmErrorResponseSchema>;

// ============================================================================
// 2.5. Anthropic Claude 3-Tier Multi-Model & Token Usage (v4.0 Contracts)
// ============================================================================

export const ModelTierSchema = z.enum(['haiku', 'sonnet', 'opus']);
export type ModelTier = z.infer<typeof ModelTierSchema>;

export const ChatModelSchema = z.enum([
  'claude-sonnet-5-5',
  'claude-haiku-5-5',
  'claude-opus-5-5',
  'claude-3-5-haiku',
  'claude-3-5-sonnet',
  'claude-3-5-opus',
  'claude-3-5-haiku-latest',
  'claude-3-5-sonnet-latest',
  'claude-3-5-opus-latest',
]);
export type ChatModel = z.infer<typeof ChatModelSchema>;

export const DEFAULT_CHAT_MODEL: ChatModel = 'claude-sonnet-5-5';
export const DEFAULT_MODEL_TIER: ModelTier = 'sonnet';

export const CLAUDE_MODELS = {
  haiku: 'claude-haiku-5-5',
  sonnet: 'claude-sonnet-5-5',
  opus: 'claude-opus-5-5',
} as const;

export const TIER_TO_MODEL: Record<ModelTier, ChatModel> = {
  haiku: 'claude-haiku-5-5',
  sonnet: 'claude-sonnet-5-5',
  opus: 'claude-opus-5-5',
};

export const MODEL_TO_TIER: Record<string, ModelTier> = {
  'claude-sonnet-5-5': 'sonnet',
  'claude-haiku-5-5': 'haiku',
  'claude-opus-5-5': 'opus',
  'claude-3-5-haiku': 'haiku',
  'claude-3-5-sonnet': 'sonnet',
  'claude-3-5-opus': 'opus',
  'claude-3-5-haiku-latest': 'haiku',
  'claude-3-5-sonnet-latest': 'sonnet',
  'claude-3-5-opus-latest': 'opus',
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

export const TokenUsageMetaSchema = z.object({
  input_tokens: z.number().int().nonnegative(),
  output_tokens: z.number().int().nonnegative(),
  cache_read_input_tokens: z.number().int().nonnegative().nullable().optional(),
  cache_creation_input_tokens: z.number().int().nonnegative().nullable().optional(),
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

export const ChatStatusStepSchema = z.enum([
  'extracting_source',      // 🌐 원본 URL 실시간 전문 비동기 스크래핑 (Trafilatura/Readability)
  'evaluating_sufficiency', // 🧠 본문 정보 충실도 자체 평가
  'agentic_searching',      // 🔍 보충 기술 문서 자율 검색 중 (DuckDuckGo / Tavily)
  'synthesizing',           // 📝 Senior Staff Architect 4단 엔지니어링 리포트 프롬프트 조립
]);
export type ChatStatusStep = z.infer<typeof ChatStatusStepSchema>;

export const ChatStatusPayloadSchema = z.object({
  step: ChatStatusStepSchema,
  label: z.string().min(1),
  timestamp: z.string(),
  progress: z.number().int().min(0).max(100).optional(),
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
  index: z.union([z.number(), z.string()]), // 1, 2 또는 'S1', 'S2'
  type: ChatSourceTypeSchema.default('primary'),
  id: z.number().int().positive().nullable().optional(),
  title: z.string().min(1).max(500),
  url: z.string().url('유효한 HTTP(S) URL이어야 합니다.'),
  source: z.string().min(1),
  category: z.string().nullable().optional(),
  quality_score: z.number().min(1.0).max(10.0).nullable().optional(),
  score: z.number().nullable().optional(),
  snippet: z.string().nullable().optional(),
  full_content: z.string().nullable().optional(),
  domain: z.string().nullable().optional(),
  relevance_score: z.number().nullable().optional(),
  published_at: z.string().nullable().optional(),
  publisher: z.string().optional(),
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
  content: z.string().min(1, '메시지 본문은 최소 1자 이상이어야 합니다.'),
});
export type ChatMessageHistory = z.infer<typeof ChatMessageHistorySchema>;

export const ScopeModeSchema = z.enum(['scoped', 'global']);
export type ScopeMode = z.infer<typeof ScopeModeSchema>;

export const ChatStreamRequestSchema = z.object({
  question: z
    .string()
    .min(1, '질문을 입력해주세요.')
    .max(2000, '질문은 최대 2,000자까지 입력 가능합니다.'),
  model: ChatModelSchema.optional().default('claude-sonnet-5-5'),
  model_tier: ModelTierSchema.optional(),
  scope: ScopeModeSchema.default('global'),
  source_id: z.number().int().positive().nullable().optional(),
  session_id: z.string().uuid().nullable().optional(),
  history: z.array(ChatMessageHistorySchema).optional(),
  top_k: z.number().int().min(1).max(10).default(5),
  filters: ChatFocusFilterSchema.nullable().optional(),
});
export type ChatStreamRequest = z.infer<typeof ChatStreamRequestSchema>;

export const ChatQueryRequestSchema = z.object({
  question: z
    .string()
    .min(1, '질문을 입력해주세요.')
    .max(2000, '질문은 최대 2,000자까지 입력 가능합니다.'),
  model: ChatModelSchema.optional().default('claude-sonnet-5-5'),
  model_tier: ModelTierSchema.optional(),
  scope: ScopeModeSchema.default('global'),
  source_id: z.number().int().positive().nullable().optional(),
  session_id: z.string().uuid().nullable().optional(),
  history: z.array(ChatMessageHistorySchema).optional(),
  top_k: z.number().int().min(1).max(10).default(5),
  filters: ChatFocusFilterSchema.nullable().optional(),
});
export type ChatQueryRequest = z.infer<typeof ChatQueryRequestSchema>;

export const ChatQueryResponseSchema = z.object({
  answer: z.string().min(1),
  sources: z.array(ChatSourceItemSchema),
  session_id: z.string().uuid(),
  model: z.string().min(1),
  model_tier: ModelTierSchema.optional().default('sonnet'),
  scope: ScopeModeSchema,
  applied_filters: ChatFocusFilterSchema.nullable().optional(),
  is_relaxed: z.boolean().default(false),
  primary_count: z.number().int().nullable().optional(),
  supplementary_count: z.number().int().nullable().optional(),
  latency_ms: z.number().int().nonnegative(),
  usage: TokenUsageMetaSchema.nullable().optional(),
});
export type ChatQueryResponse = z.infer<typeof ChatQueryResponseSchema>;

// ============================================================================
// 7. 컨텍스트 핸드오버 및 기사 상세 메타데이터 스키마
// ============================================================================

export const ChatSourceDetailResponseSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(500),
  url: z.string().url(),
  source: z.string().min(1),
  category: z.string().min(1),
  author: z.string().nullable().optional(),
  summary: z.string().default(''),
  tldr_bullets: z.array(z.string()).default([]),
  why_it_matters: z.string().default(''),
  tech_stack: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  quality_score: z.number().min(1.0).max(10.0),
  is_high_signal: z.boolean().default(false),
  hotness_score: z.number().default(0.0),
  published_at: z.string(),
  created_at: z.string().optional(),
});
export type ChatSourceDetailResponse = z.infer<typeof ChatSourceDetailResponseSchema>;

// ============================================================================
// 8. 코퍼스 지식 검색 프리뷰 스키마 (Corpus Search Preview)
// ============================================================================

export const ChatSearchQueryParamsSchema = z.object({
  q: z.string().min(2, '검색어는 최소 2글자 이상이어야 합니다.'),
  top_k: z.coerce.number().int().min(1).max(20).default(5),
  min_quality: z.coerce.number().min(1.0).max(10.0).default(5.0),
  category: ChatFocusCategorySchema.default('all'),
  time_range: ChatFocusTimeRangeSchema.default('all'),
  sort: ChatFocusSortSchema.default('hot'),
  high_signal_only: z.coerce.boolean().default(false),
  source: z.string().optional(),
});
export type ChatSearchQueryParams = z.infer<typeof ChatSearchQueryParamsSchema>;

export const ChatSearchChunkSchema = z.object({
  index: z.number().int().positive(),
  id: z.number().int().positive(),
  title: z.string().min(1).max(500),
  url: z.string().url(),
  source: z.string().min(1),
  category: z.string().min(1),
  snippet: z.string(),
  quality_score: z.number().min(1.0).max(10.0),
  published_at: z.string(),
  bm25_score: z.number(),
  rag_score: z.number().min(0.0).max(1.0),
});
export type ChatSearchChunk = z.infer<typeof ChatSearchChunkSchema>;

export const ChatSearchResponseSchema = z.object({
  query: z.string(),
  total_matches: z.number().int().nonnegative(),
  chunks: z.array(ChatSearchChunkSchema),
  latency_ms: z.number().int().nonnegative(),
});
export type ChatSearchResponse = z.infer<typeof ChatSearchResponseSchema>;

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
  done: z.literal(true),
  session_id: z.string().uuid(),
  model: z.string(),
  model_tier: ModelTierSchema.optional().default('sonnet'),
  sources_count: z.number().int().nonnegative(),
  primary_count: z.number().int().nullable().optional(),
  supplementary_count: z.number().int().nullable().optional(),
  latency_ms: z.number().int().nonnegative(),
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
  status_code: z.number().int().optional(),
  step: z.string().nullable().optional(),
  provider: z.string().optional(),
  retryable: z.boolean().optional(),
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
  id: z.string().uuid(),
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

export const ChatSessionSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  createdAt: z.string(),
  updatedAt: z.string(),
  scopeMode: ScopeModeSchema,
  activeSourceId: z.number().int().positive().nullable().optional(),
  activeFilters: ChatFocusFilterSchema.nullable().optional(),
  messages: z.array(ChatMessageSchema),
});
export type ChatSession = z.infer<typeof ChatSessionSchema>;

// ============================================================================
// 12. 대화 세션 영속화 및 멀티턴 복원 계약 (Session Persistence & Multi-turn Continuity)
// ============================================================================

export const GenericSuccessResponseSchema = z.object({
  status: z.string().default('success'),
  message: z.string().optional(),
  deleted_count: z.number().int().optional(),
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
  id: z.union([z.string(), z.number()]).transform((val) => String(val)),
  session_id: z.string().uuid(),
  role: MessageRoleSchema,
  content: z.string(),
  created_at: z.string(),
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
  id: z.string().uuid(),
  title: z.string().min(1).max(100),
  created_at: z.string(),
  updated_at: z.string(),
  scope_mode: ScopeModeSchema,
  active_source_id: z.number().int().nullable().optional(),
  message_count: z.number().int().nonnegative(),
  last_message_preview: z.string().nullable().optional(),
  active_filters: ChatFocusFilterSchema.nullable().optional(),
});
export type ChatSessionSummary = z.infer<typeof ChatSessionSummarySchema>;

/** 대화 세션 전체 상세 정보 스키마 (OpenAPI ChatSessionDetail) */
export const ChatSessionDetailSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100),
  created_at: z.string(),
  updated_at: z.string(),
  scope_mode: ScopeModeSchema,
  active_source_id: z.number().int().nullable().optional(),
  active_source: ChatSourceDetailResponseSchema.nullable().optional(),
  active_filters: ChatFocusFilterSchema.nullable().optional(),
  messages: z.array(ChatMessageItemSchema),
});
export type ChatSessionDetail = z.infer<typeof ChatSessionDetailSchema>;

/** 대화 세션 생성/업서트 요청 페이로드 스키마 (OpenAPI ChatSessionCreateRequest) */
export const ChatSessionCreateRequestSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  title: z.string().max(100).default('새 대화').optional(),
  scope_mode: ScopeModeSchema.default('global').optional(),
  active_source_id: z.number().int().nullable().optional(),
  active_filters: ChatFocusFilterSchema.nullable().optional(),
  messages: z.array(ChatMessageItemSchema).optional(),
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
  /** 컴포넌트 렌더링 형태 ('inline-chip': 입력창 좌하단 밀착 | 'header-compact': 헤더 상단 | 'header-chip': 헤더 우측 상단 칩) */
  variant?: 'inline-chip' | 'header-compact' | 'header-chip';
  /** 키보드 포커스 트랩 및 드롭다운 강제 제어 옵션 */
  forceOpen?: boolean;
  /** 추가 Tailwind 클래스 */
  className?: string;
}

export interface ModelTierBadgeProps {
  /** 렌더링 대상 모델 티어 또는 과거 모델명 */
  tier: ModelTier | string;
  /** 뱃지 렌더링 스타일 변형 */
  variant?: 'chip' | 'footer' | 'pill' | 'pipeline';
  /** 실제 SSE 스트리밍 측정 소요 시간 (ms 단위) */
  latencyMs?: number | null;
  /** 상대 토큰 비용($, $$, $$$) 표시 여부 */
  showCost?: boolean;
  /** 티어 아이콘(⚡, 🎯, 🧠) 노출 여부 (기본값: true) */
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

/**
 * 듀얼 모델 셀렉터를 포함하는 상단 글로벌 챗 헤더 Props (REQ-UI-008, POL-UI-006)
 */
export interface ChatHeaderProps {
  /** 현재 활성 세션 ID */
  activeSessionId?: string | null;
  /** 스코프 모드 ('global' 전체 코퍼스 | 'scoped' 기사 집중) */
  scopeMode: ScopeMode;
  /** 스코프 모드 전환 핸들러 */
  onScopeChange?: (nextScope: ScopeMode) => void;
  onToggleScope?: (mode: ScopeMode) => void;
  /** 핸드오버된 활성 기사 출처 메타 (Scoped 모드 한정) */
  activeSource?: any | null;
  /** 기사 컨텍스트 해제 핸들러 */
  onRemoveSource?: () => void;
  onClearSource?: () => void;
  /** 히스토리 사이드바/드로어 열림 토글 핸들러 */
  onToggleHistory?: () => void;
  onToggleHistoryDrawer?: () => void;
  /** 히스토리 사이드바/드로어 현재 열림 상태 */
  isHistoryOpen?: boolean;
  /** + 새 대화 시작 핸들러 */
  onNewChat: () => void;
  /** 듀얼 모델 셀렉터 #1 바인딩: 현재 선택된 모델 티어 (REQ-UI-008, POL-UI-006) */
  selectedTier?: ModelTier;
  /** 듀얼 모델 셀렉터 #1 바인딩: 모델 선택 핸들러 */
  onSelectTier?: (tier: ModelTier) => void;
  /** 답변 스트리밍 진행 여부 (스트리밍 중 모델 변경 차단 Lock) */
  isStreaming?: boolean;
  showNewChatButton?: boolean;
  className?: string;
}


