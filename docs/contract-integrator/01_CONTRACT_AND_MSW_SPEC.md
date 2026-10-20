# AgentLens 플랫폼 데이터 계약 및 MSW 모의 명세서 (Contract & Mock Spec)

- **작성일자**: 2026-10-20
- **작성자**: 계약 통합 엔지니어 (`contract-integrator`)
- **문서 버전**: v1.0
- **상태**: Approved (Contract Lock 체결)
- **목적**: 백엔드(FastAPI)와 프론트엔드(Next.js 16)의 완벽한 병렬 TDD 개발을 위한 OpenAPI 3.1 동기화 타입 계약(TypeScript), Zod 런타임 검증 스키마, 4대 멀티 프로바이더(Anthropic Claude, Google Gemini, OpenAI, Ollama / vLLM) 모델 규약 및 독립적인 MSW v2 네트워크 모킹 핸들러 확정

---

## 1. 공통 응답 엔벨로프 및 에러 계약 (Response Envelope)

백엔드 REST API 및 프론트엔드 API 클라이언트(`fetchClient`) 간의 전역 일관성을 보장하기 위해 단일 엔벨로프 및 표준 에러 DTO를 적용합니다.

```typescript
import { z } from 'zod';

// 1. 공통 응답 엔벨로프 인터페이스
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

export interface GenericSuccessResponse {
  status: string;
  message?: string;
  deleted_count?: number;
}

// 2. 공통 응답 엔벨로프 Zod 스키마
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

export const GenericSuccessResponseSchema = z.object({
  status: z.string().min(1),
  message: z.string().optional(),
  deleted_count: z.number().int().nonnegative().optional(),
});

export const createApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: ApiErrorDetailSchema.optional(),
    timestamp: z.string(),
  });

// 3. 플랫폼 및 LLM 에러 코드 정의 (SSOT)
export const LlmErrorCodeSchema = z.enum([
  'ERR_CLAUDE_API_KEY_MISSING',    // HTTP 503: Anthropic Claude API 키 미설정
  'ERR_ANTHROPIC_KEY_MISSING',     // HTTP 503: Anthropic Claude API 키 미설정 별칭
  'ERR_CLAUDE_QUOTA_EXCEEDED',     // HTTP 429: Anthropic Claude 호출 한도 초과
  'ERR_ANTHROPIC_RATE_LIMIT',      // HTTP 429: Anthropic Claude 호출 한도 초과 별칭
  'ERR_CLAUDE_OVERLOADED',         // HTTP 503 / 529: Anthropic 서버 일시 과부하
  'ERR_ANTHROPIC_OVERLOADED',      // HTTP 503 / 529: Anthropic 서버 일시 과부하 별칭
  'ERR_INVALID_MODEL_TIER',        // HTTP 400: 허용되지 않은 모델 티어 코드 요청
  'ERR_SONNET_SCHEMA_VALIDATION',  // HTTP 500: Claude Sonnet Pydantic 스키마 검증 실패
  'ERR_STREAM_ABORTED_BY_USER',    // HTTP 499: 모델 전환 또는 브라우저 이탈 스트림 중단
  'ERR_ARTICLE_EXTRACTION_FAIL',   // HTTP 502: 원문 본문 스크래핑/추출 실패
  'ERR_LLM_PROVIDER_UNAVAILABLE',  // HTTP 503: 가용한 LLM 프로바이더 미설정 (API 키 부재)
  'ERR_LLM_UPSTREAM_FAILED',       // HTTP 502: 외부 LLM 업스트림 통신 실패 / API 장애
  'ERR_LLM_STREAM_FAILED',         // SSE error: LLM 스트리밍 진행 중 연결 단절
  'ERR_LLM_QUOTA_EXCEEDED',        // HTTP 429: 외부 LLM API 호출 한도 초과
  'ERR_CHAT_STREAM_TIMEOUT',       // HTTP 504 / SSE error: 스트리밍 15초 초과 타임아웃
  'ERR_HANDOVER_SOURCE_NOT_FOUND', // HTTP 404: Scoped 모드 대상 기사 미존재
  'ERR_SESSION_NOT_FOUND',         // HTTP 404: 대상 대화 세션을 찾을 수 없음
  'ERR_SESSION_INVALID_UUID',      // HTTP 400: 유효하지 않은 세션 UUID 규격
  'ERR_SESSION_DELETE_FAILED',     // HTTP 500: 세션 삭제 트랜잭션 실패
  'ERR_SESSION_CREATE_FAILED',     // HTTP 500: 세션 생성/업서트 실패
  'ERR_SESSION_LIMIT_EXCEEDED',    // HTTP 400: 최대 세션 한도(30개) 초과
  'ERR_INVALID_SCOPE_PARAM',       // HTTP 400: 유효하지 않은 scope 파라미터
  'ERR_INVALID_FILTER_PARAM',      // HTTP 400: 포커스 필터 규격 오류
  'ERR_CHAT_PAYLOAD_EMPTY',        // HTTP 400: 질문 본문 비어있음
  'ERR_CHAT_PAYLOAD_TOO_LARGE',    // HTTP 400: 질문 본문 2,000자 초과
  'ERR_SEARCH_QUERY_TOO_SHORT',    // HTTP 400: 검색어 2자 미만
  'ERR_SERVER_INTERNAL',           // HTTP 500: 백엔드 내부 예외
]);
export type LlmErrorCode = z.infer<typeof LlmErrorCodeSchema>;

// 4. LLM 에러 상세 및 응답 스키마
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
```

### 표준 HTTP 상태 코드 및 비즈니스 에러 매핑표

| HTTP 상태 코드 | 주요 비즈니스 에러 코드 | 원인 및 시스템 동작 규약 |
| :--- | :--- | :--- |
| **400 Bad Request** | `ERR_CHAT_PAYLOAD_EMPTY`<br/>`ERR_CHAT_PAYLOAD_TOO_LARGE`<br/>`ERR_INVALID_MODEL_TIER`<br/>`ERR_SESSION_INVALID_UUID` | 클라이언트 입력값 유효성 검증 실패. 즉시 요청 거부 및 인라인 폼 에러 노출. |
| **404 Not Found** | `ERR_HANDOVER_SOURCE_NOT_FOUND`<br/>`ERR_SESSION_NOT_FOUND` | 포커스 기사 또는 대화 세션 식별자 부재. Global 모드로 자동 전환 또는 신규 세션 생성 유도. |
| **429 Too Many Requests**| `ERR_CLAUDE_QUOTA_EXCEEDED`<br/>`ERR_LLM_QUOTA_EXCEEDED` | 외부 LLM API Rate Limit 도달. 지수 백오프 기반 재시도 배너 노출. |
| **499 Client Closed** | `ERR_STREAM_ABORTED_BY_USER` | 사용자 모델 전환(`ModelChangeDivider`) 또는 스트림 중단 버튼 클릭 시 세션 맥락 보존 후 정상 종료. |
| **500 Internal Error** | `ERR_SERVER_INTERNAL`<br/>`ERR_SESSION_DELETE_FAILED` | 데이터베이스 트랜잭션 오류 또는 예기치 않은 런타임 결함. |
| **502 Bad Gateway** | `ERR_LLM_UPSTREAM_FAILED`<br/>`ERR_ARTICLE_EXTRACTION_FAIL` | 외부 LLM API 단절 또는 웹 본문 스크래핑 실패. 재시도 가능한 에러 카드로 UI 표시. |
| **503 Service Unavailable**| `ERR_LLM_PROVIDER_UNAVAILABLE`<br/>`ERR_CLAUDE_API_KEY_MISSING` | 백엔드에 가용한 LLM 프로바이더 엔진 미설정 (API 키 부재). 설정 안내 모달/배너 트리거. |
| **504 Gateway Timeout**| `ERR_CHAT_STREAM_TIMEOUT` | 스트리밍 응답 15초 초과 타임아웃 발생. `[재시도]` 버튼 제공. |

---

## 2. 도메인 TypeScript 인터페이스 & Zod 검증 스키마 (Contracts)

AgentLens는 **4대 멀티 프로바이더 — Anthropic Claude, Google Gemini, OpenAI, OpenAI-Compatible (Ollama / vLLM)**를 지원하며, AI 챗 워크스페이스의 3-Tier 모델 선택기(`haiku`, `sonnet`, `opus`)와 과거 대화 이력의 멀티 프로바이더 모델 식별자(`model`, `model_used`)를 변조 없이 정직하게 보존하고 표시합니다.

### 2.1 AI 챗 워크스페이스 & 개인 지식 RAG 계약 (`frontend/src/types/chat.ts`)

```typescript
import { z } from 'zod';

// 1. 3-Tier 및 멀티 프로바이더 모델 계약
export const ModelTierSchema = z.enum(['haiku', 'sonnet', 'opus']);
export type ModelTier = z.infer<typeof ModelTierSchema>;

export const ChatModelSchema = z.enum([
  'claude-sonnet-5-5',
  'claude-haiku-5-5',
  'claude-opus-5-5',
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
};

/**
 * 모델 식별자/티어 살균 및 과거 멀티 프로바이더 이력 보존 함수
 * - Claude 계열은 'haiku' | 'sonnet' | 'opus' 티어로 매핑
 * - Google Gemini, OpenAI GPT, Ollama 등 멀티 프로바이더 모델명은 왜곡 없이 그대로 보존
 */
export function sanitizeModelTier(rawModel: string | undefined | null): ModelTier | string {
  if (!rawModel) return 'sonnet';
  const normalized = rawModel.toLowerCase().trim();
  if (normalized === 'haiku' || normalized.includes('haiku')) return 'haiku';
  if (normalized === 'opus' || normalized.includes('opus')) return 'opus';
  if (normalized === 'sonnet' || normalized.includes('sonnet')) return 'sonnet';
  return rawModel.trim();
}

// 2. 토큰 사용량 및 프롬프트 캐싱 메타데이터
export const TokenUsageMetaSchema = z.object({
  input_tokens: z.number().int().nonnegative(),
  output_tokens: z.number().int().nonnegative(),
  cache_read_input_tokens: z.number().int().nonnegative().nullable().optional(),
  cache_creation_input_tokens: z.number().int().nonnegative().nullable().optional(),
});
export type TokenUsageMeta = z.infer<typeof TokenUsageMetaSchema>;

// 3. 포커스 필터 & 출처 아이템 계약
export const ScopeModeSchema = z.enum(['scoped', 'global']);
export type ScopeMode = z.infer<typeof ScopeModeSchema>;

export const ChatFocusFilterSchema = z.object({
  category: z.enum(['all', 'harness', 'mcp_plugins_skills', 'agent_tech', 'ai_news']).default('all'),
  time_range: z.enum(['all', '24h', '7d', '30d']).default('all'),
  sort: z.enum(['hot', 'latest', 'quality']).default('hot'),
  high_signal_only: z.boolean().default(false),
});
export type ChatFocusFilter = z.infer<typeof ChatFocusFilterSchema>;

export const ChatSourceItemSchema = z.object({
  index: z.union([z.number(), z.string()]),
  type: z.enum(['primary', 'supplementary']).default('primary'),
  id: z.number().int().positive().nullable().optional(),
  title: z.string().min(1).max(500),
  url: z.string().url(),
  source: z.string().min(1),
  category: z.string().nullable().optional(),
  quality_score: z.number().min(0.0).max(10.0).nullable().optional(),
  snippet: z.string().nullable().optional(),
  domain: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
});
export type ChatSourceItem = z.infer<typeof ChatSourceItemSchema>;

export const ChatSourcesPayloadSchema = z.object({
  sources: z.array(ChatSourceItemSchema),
  applied_filters: ChatFocusFilterSchema.nullable().optional(),
  is_relaxed: z.boolean().default(false),
  primary_count: z.number().int().nullable().optional(),
  supplementary_count: z.number().int().nullable().optional(),
});
export type ChatSourcesPayload = z.infer<typeof ChatSourcesPayloadSchema>;

// 4. 에이전틱 리서치 워크플로우 상태 스키마
export const ChatStatusStepSchema = z.enum([
  'thinking',
  'tool_calling',
  'observing',
  'extracting_source',
  'evaluating_sufficiency',
  'agentic_searching',
  'synthesizing',
]);
export type ChatStatusStep = z.infer<typeof ChatStatusStepSchema>;

export const ChatStatusPayloadSchema = z.object({
  step: ChatStatusStepSchema,
  label: z.string().min(1),
  timestamp: z.string(),
  progress: z.number().int().min(0).max(100).optional(),
  query: z.string().optional(),
  sources_found: z.number().int().nonnegative().optional(),
});
export type ChatStatusPayload = z.infer<typeof ChatStatusPayloadSchema>;

// 5. 챗 스트림 및 질의응답 요청/응답 스키마
export const ChatMessageHistorySchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
});
export type ChatMessageHistory = z.infer<typeof ChatMessageHistorySchema>;

export const ChatStreamRequestSchema = z.object({
  question: z.string().min(1, '질문을 입력해주세요.').max(2000, '질문은 최대 2,000자까지 입력 가능합니다.'),
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

export const ChatQueryRequestSchema = z.object({
  question: z.string().min(1).max(2000),
  model: ChatModelSchema.optional().default('claude-sonnet-5-5'),
  model_tier: ModelTierSchema.optional(),
  scope: ScopeModeSchema.default('global'),
  source_id: z.number().int().positive().nullable().optional(),
  session_id: z.string().uuid().nullable().optional(),
  top_k: z.number().int().min(1).max(10).default(5),
  filters: ChatFocusFilterSchema.nullable().optional(),
});
export type ChatQueryRequest = z.infer<typeof ChatQueryRequestSchema>;

export const ChatQueryResponseSchema = z.object({
  question: z.string(),
  answer: z.string(),
  scope: ScopeModeSchema,
  model: z.string(),
  model_tier: ModelTierSchema.optional().default('sonnet'),
  latency_ms: z.number().int().nonnegative(),
  sources: z.array(ChatSourceItemSchema),
  primary_count: z.number().int().default(0),
  supplementary_count: z.number().int().default(0),
  applied_filters: ChatFocusFilterSchema.nullable().optional(),
  is_relaxed: z.boolean().default(false),
  session_id: z.string().uuid().nullable().optional(),
  usage: TokenUsageMetaSchema.nullable().optional(),
});
export type ChatQueryResponse = z.infer<typeof ChatQueryResponseSchema>;

// 6. RAG 시맨틱 청크 및 검색 응답 스키마
export const ChatSearchChunkSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  url: z.string(),
  category: z.string(),
  snippet: z.string(),
  quality_score: z.number(),
  rag_score: z.number(),
  published_at: z.string().nullable().optional(),
});
export type ChatSearchChunk = z.infer<typeof ChatSearchChunkSchema>;

export const ChatSearchResponseSchema = z.object({
  query: z.string(),
  total_chunks: z.number().int().nonnegative(),
  chunks: z.array(ChatSearchChunkSchema),
  filters: ChatFocusFilterSchema.nullable().optional(),
});
export type ChatSearchResponse = z.infer<typeof ChatSearchResponseSchema>;

// 7. 대화 세션 및 메시지 영속화 스키마
export const ChatMessageItemSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((val) => String(val)),
  session_id: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  created_at: z.string(),
  sources: z.array(ChatSourceItemSchema).nullable().optional(),
  status: z.enum(['pending', 'streaming', 'completed', 'error', 'aborted']).default('completed'),
  model: z.string().nullable().optional(),
  model_tier: ModelTierSchema.nullable().optional(),
  latency_ms: z.number().int().nullable().optional(),
  usage: TokenUsageMetaSchema.nullable().optional(),
});
export type ChatMessageItem = z.infer<typeof ChatMessageItemSchema>;

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

export const ChatSessionDetailSchema = ChatSessionSummarySchema.extend({
  messages: z.array(ChatMessageItemSchema),
});
export type ChatSessionDetail = z.infer<typeof ChatSessionDetailSchema>;

export const ChatSessionCreateRequestSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(100).optional(),
  scope_mode: ScopeModeSchema.default('global'),
  active_source_id: z.number().int().positive().nullable().optional(),
  active_filters: ChatFocusFilterSchema.nullable().optional(),
});
export type ChatSessionCreateRequest = z.infer<typeof ChatSessionCreateRequestSchema>;

export const ChatSessionUpdateRequestSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  active_filters: ChatFocusFilterSchema.nullable().optional(),
});
export type ChatSessionUpdateRequest = z.infer<typeof ChatSessionUpdateRequestSchema>;
```

### 2.2 뉴스 피드, 인라인 Ask AI & 일일 브리핑 계약 (`frontend/src/types/news.ts`)

```typescript
import { z } from 'zod';

// 1. 카테고리 규약
export const CategoryTypeSchema = z.enum([
  'all',
  'harness',
  'mcp_plugins_skills',
  'agent_tech',
  'ai_news',
]);
export type CategoryType = z.infer<typeof CategoryTypeSchema>;

// 2. 뉴스 아이템 엔티티 및 목록 응답
export const NewsItemSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  url: z.string().url(),
  source: z.string().min(1),
  category: z.string().min(1),
  summary: z.string().default(''),
  author: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
  tldr_bullets: z.array(z.string()).default([]),
  why_it_matters: z.string().default(''),
  tech_stack: z.array(z.string()).default([]),
  quality_score: z.number().min(0.0).max(10.0).default(6.0),
  is_high_signal: z.boolean().default(false),
  raw_score: z.number().int().default(0),
  comments_count: z.number().int().default(0),
  hotness_score: z.number().default(0.0),
  full_content: z.string().nullable().optional(),
  scraped_at: z.string().nullable().optional(),
  published_at: z.string(),
  created_at: z.string(),
  dedup_hash: z.string(),
});
export type NewsItem = z.infer<typeof NewsItemSchema>;

export const NewsListResponseSchema = z.object({
  items: z.array(NewsItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  size: z.number().int().positive(),
  total_pages: z.number().int().nonnegative(),
});
export type NewsListResponse = z.infer<typeof NewsListResponseSchema>;

// 3. 인라인 Ask AI 계약
export const AskQuestionRequestSchema = z.object({
  question: z.string().min(1, '질문 본문을 입력해주세요.'),
});
export type AskQuestionRequest = z.infer<typeof AskQuestionRequestSchema>;

export const AskQuestionResponseSchema = z.object({
  news_id: z.number().int().positive(),
  question: z.string(),
  answer: z.string(),
  model_used: z.string(),
});
export type AskQuestionResponse = z.infer<typeof AskQuestionResponseSchema>;

// 4. 일일 종합 브리핑 계약
export const BriefingItemSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  url: z.string().url(),
  source: z.string(),
  why_it_matters: z.string(),
  summary: z.string(),
  tags: z.array(z.string()),
  category: z.string(),
  category_name: z.string(),
  hotness_score: z.number().optional(),
});
export type BriefingItem = z.infer<typeof BriefingItemSchema>;

export const BriefingCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  summary: z.string(),
  items: z.array(BriefingItemSchema),
});
export type BriefingCategory = z.infer<typeof BriefingCategorySchema>;

export const DailyBriefingSchema = z.object({
  title: z.string(),
  date: z.string(),
  headline: z.string(),
  overview: z.string(),
  categories: z.array(BriefingCategorySchema),
  action_items: z.array(z.string()),
  markdown_report: z.string(),
  featured_items_count: z.number().int().nonnegative(),
  generated_at: z.string(),
});
export type DailyBriefing = z.infer<typeof DailyBriefingSchema>;
```

### 2.3 수집 소스 설정, 테크 레이더 & 시스템 계약 (`frontend/src/types/news.ts`, `trends.ts`)

```typescript
import { z } from 'zod';

// 1. 수집 소스 설정
export const SourceItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  url: z.string().url(),
  site_url: z.string().optional(),
  category_hint: z.string().default('ai_news'),
  country: z.string().optional(),
  enabled: z.boolean().default(true),
  description: z.string().optional(),
  added_at: z.string().optional(),
});
export type SourceItem = z.infer<typeof SourceItemSchema>;

export const MonitoredRepoSchema = z.object({
  repo: z.string().min(1),
  category: z.string().default('mcp_plugins_skills'),
  enabled: z.boolean().default(true),
  description: z.string().optional(),
  stars_hint: z.number().int().optional(),
});
export type MonitoredRepo = z.infer<typeof MonitoredRepoSchema>;

export const SourceConfigSchema = z.object({
  version: z.string().optional(),
  updated_at: z.string().optional(),
  rss_feeds: z.array(SourceItemSchema).default([]),
  github_sources: z.object({
    enabled: z.boolean().default(true),
    search_queries: z.array(z.string()).default([]),
    monitored_repos: z.array(MonitoredRepoSchema).default([]),
  }).default({ enabled: true, search_queries: [], monitored_repos: [] }),
});
export type SourceConfig = z.infer<typeof SourceConfigSchema>;

export const SourcesResponseSchema = z.object({
  status: z.string(),
  sources_file: z.string(),
  updated_at: z.string(),
  stats: z.record(z.string(), z.unknown()),
  data: SourceConfigSchema,
});
export type SourcesResponse = z.infer<typeof SourcesResponseSchema>;

// 2. 테크 레이더 & 트렌딩 스택
export const TrendingTagSchema = z.object({
  name: z.string(),
  count: z.number().int().nonnegative(),
  category: z.string(),
  recent_count: z.number().int().nonnegative(),
  velocity: z.string(),
  sample_news_id: z.number().int().positive().optional(),
});
export type TrendingTag = z.infer<typeof TrendingTagSchema>;

export const CategoryShareSchema = z.object({
  name: z.string(),
  count: z.number().int().nonnegative(),
  percentage: z.number().min(0).max(100),
});
export type CategoryShare = z.infer<typeof CategoryShareSchema>;

export const TechRadarDataSchema = z.object({
  updated_at: z.string(),
  total_analyzed: z.number().int().nonnegative(),
  surging_tags: z.array(TrendingTagSchema),
  categories: z.array(CategoryShareSchema),
  tags: z.array(TrendingTagSchema),
});
export type TechRadarData = z.infer<typeof TechRadarDataSchema>;

// 3. 시스템 누적 통계
export const StatsResponseSchema = z.object({
  total_news: z.number().int().nonnegative(),
  category_counts: z.record(z.string(), z.number().int().nonnegative()),
  source_counts: z.record(z.string(), z.number().int().nonnegative()),
  last_updated: z.string(),
});
export type StatsResponse = z.infer<typeof StatsResponseSchema>;
```

---

## 3. MSW (Mock Service Worker) 핸들러 구현 명세

### 3.1 프론트엔드 MSW 아키텍처 원칙 (Frontend MSW Architecture)

프론트엔드는 백엔드 서버 가동 및 외부 LLM 종속성 없이도 컴포넌트 단위 TDD(Vitest / React Testing Library) 및 브라우저 개발을 독립적으로 진행할 수 있도록 **네트워크 레벨(Network-level)에서 HTTP 및 SSE 프로토콜을 가로채는 MSW v2 핸들러 세트**(`frontend/src/mocks/handlers.ts`, `frontend/src/mocks/handlers/chat.ts`, `frontend/src/mocks/fixtures/chat.ts`)를 운용합니다.

### 3.2 핵심 모의 핸들러 구현 명세 (`frontend/src/mocks/handlers.ts`)

```typescript
import { http, HttpResponse, delay } from 'msw';
import {
  mockArticles,
  mockSearchChunks,
  mockSupplementarySources,
  initialMockSessions,
} from './fixtures/chat';
import {
  chatHandlers,
  resetMockSessionStore,
  getMockSessionStore,
  resolveModelAndUsage,
} from './handlers/chat';
import {
  NewsItem,
  NewsListResponse,
  DailyBriefing,
  SourcesResponse,
  StatsResponse,
  AskQuestionResponse,
} from '@/types/news';
import {
  ErrorResponse,
  GenericSuccessResponse,
  ChatModel,
  ModelTier,
} from '@/types/chat';

// ============================================================================
// 1. EventSource 표준 호환 전용 AI 챗 SSE GET 스트리밍 모의 핸들러 (GET /api/chat/stream)
// ============================================================================
export const sseGetChatStreamHandler = http.get('*/api/chat/stream', async ({ request }) => {
  const url = new URL(request.url);
  const question = url.searchParams.get('question') || url.searchParams.get('q') || '';
  const scope = (url.searchParams.get('scope') as 'scoped' | 'global') || 'global';
  const rawModel = (url.searchParams.get('model') as ChatModel) || undefined;
  const rawTier = (url.searchParams.get('model_tier') as ModelTier) || undefined;
  const { tier, model, latencyMs, usage } = resolveModelAndUsage(rawModel, rawTier);

  if (!question || question.trim().length === 0) {
    return HttpResponse.json<ErrorResponse>(
      { error_code: 'ERR_CHAT_PAYLOAD_EMPTY', message: '질문 본문이 비어있습니다.' },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      await delay(20);
      controller.enqueue(
        encoder.encode(
          `event: status\ndata: ${JSON.stringify({
            step: 'extracting_source',
            label: '🌐 원본 소스 본문 추출 중 (SSE GET)...',
            timestamp: new Date().toISOString(),
            progress: 25,
          })}\n\n`
        )
      );

      await delay(30);
      controller.enqueue(
        encoder.encode(
          `event: sources\ndata: ${JSON.stringify({
            sources: [mockSupplementarySources[0]],
            is_relaxed: false,
            primary_count: 0,
            supplementary_count: 1,
          })}\n\n`
        )
      );

      await delay(25);
      controller.enqueue(
        encoder.encode(
          `event: token\ndata: ${JSON.stringify({
            token: `## 1. 핵심 아키텍처 및 동작 원리\n\n질문: "${question}"에 대한 SSE 스트리밍 응답입니다.`,
          })}\n\n`
        )
      );

      await delay(30);
      controller.enqueue(
        encoder.encode(
          `event: done\ndata: ${JSON.stringify({
            done: true,
            session_id: '7b6a48f2-2973-45f6-8c46-9562725b821a',
            model,
            model_tier: tier,
            sources_count: 1,
            latency_ms: latencyMs,
            usage,
          })}\n\n`
        )
      );
      controller.close();
    },
  });

  return new HttpResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
});

// ============================================================================
// 2. 뉴스 피드 다차원 필터링 및 페이징 조회 모의 핸들러 (GET /api/news)
// ============================================================================
export const newsListHandler = http.get('*/api/news', async ({ request }) => {
  const url = new URL(request.url);
  const category = url.searchParams.get('category') || 'all';
  const source = url.searchParams.get('source') || 'all';
  const search = url.searchParams.get('search') || '';
  const sort = url.searchParams.get('sort') || 'hot';
  const highSignalOnly = url.searchParams.get('high_signal_only') === 'true';
  const page = Number(url.searchParams.get('page') || '1');
  const size = Number(url.searchParams.get('size') || '20');

  if (page < 1 || size < 1) {
    return HttpResponse.json<ErrorResponse>(
      { error_code: 'ERR_INVALID_PAGE_PARAM', message: '페이지 번호 및 사이즈는 1 이상이어야 합니다.' },
      { status: 400 }
    );
  }

  await delay(30);

  let filtered = Object.values(mockArticles).map((art) => ({
    id: art.id,
    title: art.title,
    url: art.url,
    source: art.source,
    category: art.category,
    summary: art.summary,
    author: art.author ?? null,
    tags: art.tags ?? [],
    tldr_bullets: art.tldr_bullets ?? [],
    why_it_matters: art.why_it_matters ?? '',
    tech_stack: art.tech_stack ?? [],
    quality_score: art.quality_score,
    is_high_signal: art.is_high_signal ?? false,
    raw_score: 120,
    comments_count: 15,
    hotness_score: art.hotness_score ?? 80.0,
    published_at: art.published_at,
    created_at: art.created_at ?? art.published_at,
    dedup_hash: `hash_${art.id}`,
    full_content: null,
    scraped_at: null,
  }));

  if (category !== 'all') filtered = filtered.filter((item) => item.category === category);
  if (source !== 'all') filtered = filtered.filter((item) => item.source === source);
  if (highSignalOnly) filtered = filtered.filter((item) => item.quality_score >= 7.8 || item.is_high_signal);
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter((item) => item.title.toLowerCase().includes(q) || item.summary.toLowerCase().includes(q));
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / size) || 1;
  const offset = (page - 1) * size;
  const items = filtered.slice(offset, offset + size);

  return HttpResponse.json<NewsListResponse>({
    items,
    total,
    page,
    size,
    total_pages: totalPages,
  }, { status: 200 });
});

// ============================================================================
// 3. 인라인 Ask AI 질의응답 모의 핸들러 (POST /api/news/:news_id/ask)
// ============================================================================
export const newsAskHandler = http.post('*/api/news/:news_id/ask', async ({ request, params }) => {
  const newsId = Number(params.news_id);
  const body = (await request.json()) as { question: string };

  if (!body.question || body.question.trim().length === 0) {
    return HttpResponse.json<ErrorResponse>(
      { error_code: 'ERR_CHAT_PAYLOAD_EMPTY', message: '질문 본문을 입력해주세요.' },
      { status: 400 }
    );
  }

  await delay(100);
  return HttpResponse.json<AskQuestionResponse>({
    news_id: newsId,
    question: body.question,
    answer: `[AI 분석 결과]: 기사 ID ${newsId} 질의("${body.question}")에 대한 핵심 엔지니어링 분석입니다.`,
    model_used: 'claude-sonnet-5-5',
  }, { status: 200 });
});

// ============================================================================
// 4. 일일 브리핑 및 시스템 통계 모의 핸들러
// ============================================================================
export const briefingTodayHandler = http.get('*/api/briefing/today', async () => {
  await delay(20);
  return HttpResponse.json({
    title: '오늘의 AI 엔지니어링 브리핑',
    date: new Date().toISOString().split('T')[0],
    headline: 'Anthropic Claude 3.7 & Model Context Protocol (MCP) 생태계 급부상',
    overview: 'SWE-bench 70% 돌파 및 FastMCP를 중심으로 한 에이전틱 인터페이스 표준화 가속',
    categories: [],
    action_items: ['FastMCP 데코레이터 기반 사내 도구 표준화 검토'],
    markdown_report: '# 오늘의 AI 엔지니어링 브리핑\n\n- Anthropic Claude 3.7 출시',
    featured_items_count: 2,
    generated_at: new Date().toISOString(),
  }, { status: 200 });
});

export const statsHandler = http.get('*/api/stats', async () => {
  await delay(15);
  return HttpResponse.json<StatsResponse>({
    total_news: 216,
    category_counts: { harness: 48, mcp_plugins_skills: 54, agent_tech: 62, ai_news: 52 },
    source_counts: { github: 95, rss: 65, arxiv: 30, hackernews: 26 },
    last_updated: new Date().toISOString(),
  }, { status: 200 });
});

// 전체 통합 모의 핸들러 배열 SSOT
export const handlers = [
  sseGetChatStreamHandler,
  newsListHandler,
  newsAskHandler,
  briefingTodayHandler,
  statsHandler,
  ...chatHandlers,
];
```

### 3.3 MSW 모의 핸들러 엔드포인트 커버리지 매트릭스

| HTTP 메서드 | 엔드포인트 URI | 모의 기능 및 반환 스키마 | 에러 시뮬레이션 지원 |
| :--- | :--- | :--- | :--- |
| `POST` | `*/api/chat/stream` | 실시간 SSE 다중 이벤트 스트림 (`status`, `sources`, `token`, `done`) | 400 (빈 질문), 502 (`[TRIGGER_502]`), 503 (`[TRIGGER_503]`) |
| `GET` | `*/api/chat/stream` | EventSource 표준 호환 SSE GET 스트림 | 400 (빈 질문), 404 (소스 미존재) |
| `POST` | `*/api/chat/query` | 동기식 JSON 4단 엔지니어링 분석 리포트 및 이원화 출처 반환 | 400 (입력값 오류), 503 (프로바이더 미설정) |
| `GET` | `*/api/chat/search` | 포커스 필터 기반 의미론적 RAG 검색 및 청크 필터링 | 400 (검색어 2자 미만) |
| `GET` | `*/api/chat/sessions` | 인메모리 세션 스토어 목록 반환 (FIFO 30개 세션) | 정상 빈 배열 반환 지원 |
| `POST` | `*/api/chat/sessions` | 대화 세션 신규 생성 및 수동 업서트 | 400 (UUID 규격 오류) |
| `GET` | `*/api/chat/sessions/:id` | 특정 대화 세션 상세 및 전체 메시지 이력 조회 | 404 (`ERR_SESSION_NOT_FOUND`) |
| `PATCH` | `*/api/chat/sessions/:id` | 대화 세션 타이틀 및 포커스 필터 부분 업데이트 | 404 (`ERR_SESSION_NOT_FOUND`) |
| `DELETE`| `*/api/chat/sessions/:id` | 대화 세션 단건 삭제 및 카운트 반환 | 404 (`ERR_SESSION_NOT_FOUND`) |
| `GET` | `*/api/news` | 다차원 필터링 및 페이지네이션 뉴스 피드 목록 | 400 (잘못된 페이지), 500 (`[TRIGGER_500]`), 503 (`[TRIGGER_503]`) |
| `GET` | `*/api/news/:news_id` | 단건 뉴스 상세 카드 데이터 반환 | 404 (`ERR_FEED_CARD_NOT_FOUND`) |
| `POST` | `*/api/news/:news_id/ask` | 인라인 Ask AI 동기식 질의응답 | 400 (빈 질문), 503 (`[TRIGGER_503]`) |
| `POST` | `*/api/news/:news_id/ask/stream` | 인라인 Ask AI 실시간 SSE 토큰 스트리밍 | 404 (기사 미존재) |
| `GET` | `*/api/briefing/today` | 당일 자동 합성된 종합 브리핑 JSON 반환 | 200 OK |
| `POST` | `*/api/briefing/generate` | 일일 브리핑 강제 재생성 | 200 OK |
| `GET` | `*/api/sources` | RSS 및 GitHub 수집 소스 설정 및 통계 반환 | 200 OK |
| `GET` | `*/api/stats` | 데이터베이스 누적 아티클 및 소스별 통계 | 200 OK |
| `DELETE`| `*/api/news/all` | 전체 뉴스 데이터베이스 초기화 및 삭제 건수 반환 | 200 OK |

---

## 4. 캐싱, Revalidation 및 낙관적 업데이트 계약

### 4.1 Next.js Cache Tag & Revalidation 규약

| Cache Tag | 적용 리소스 | Revalidation 주기 (s-maxage) | Stale-While-Revalidate | 무효화 트리거 |
| :--- | :--- | :--- | :--- | :--- |
| `news-feed` | `GET /api/news` | 60초 | 30초 | 수동 즉시 수집 완료, 기사 전체 삭제 |
| `news-detail-[id]` | `GET /api/news/:id` | 3600초 (불변 캐시) | 300초 | 기사 재스크래핑 |
| `daily-briefing` | `GET /api/briefing/today` | 매일 06:00 KST (정적 재생성) | 600초 | `POST /api/briefing/generate` 호출 시 |
| `sources-config` | `GET /api/sources` | 300초 | 60초 | 소스 활성화/비활성화 토글, 신규 피드 추가 |
| `stats-summary` | `GET /api/stats` | 120초 | 60초 | 수집 배치 완료 시 |
| `chat-sessions` | `GET /api/chat/sessions` | 0초 (`no-store`, 실시간 DB 동기화) | - | 세션 생성, 삭제, 타이틀 수정 시 |
| `chat-session-[id]`| `GET /api/chat/sessions/:id` | 0초 (`no-store`, 실시간 DB 동기화) | - | 스트림 완료(`event: done`) 후 메시지 추가 시 |

### 4.2 듀얼 모델 셀렉터 0ms 양방향 상태 동기화 (Dual-Placement Sync)

- **단일 진실 공급원 (SSOT)**: `ChatWorkspace` 컨테이너가 `selectedTier: ModelTier` 단일 상태를 보유합니다.
- **양방향 동기화**: `ChatHeader` 우측 모델 셀렉터 칩과 `ChatPromptInput` 좌하단 칩에 동일한 `selectedTier` 및 `onSelectTier` 핸들러를 주입하여, 사용자가 상단 또는 하단 중 어느 쪽에서 모델을 변경하더라도 0ms 지연으로 양쪽 UI가 즉시 동기화됩니다.
- **세션 맥락 무손실 보존**: 대화 진행 중 모델을 교체하더라도 기존 대화 이력(최대 10턴, 3,000토큰)을 삭제하지 않고 타임라인에 `ModelChangeDivider` 칩을 렌더링한 후 다음 질문부터 변경된 모델로 투명하게 인계합니다.

### 4.3 낙관적 업데이트 (Optimistic Updates) & Dual-Layer 영속화

1. **사용자 발송 즉시 (0ms)**:
   - UI 타임라인 및 브라우저 `localStorage`에 `status: 'sending'` 상태의 가상 메시지(UUID 임시 생성)를 즉시 추가하고 입력창을 비웁니다.
2. **SSE 스트리밍 수신 중**:
   - `event: status` 수신 시 스텝 트래커 진행률 및 라벨을 실시간 갱신합니다.
   - `event: sources` 수신 시 이원화 출처(원본 소스 [1] 및 보충 출처 [S1]) 칩을 선행 렌더링합니다.
   - `event: token` 수신 시 `status: 'streaming'`으로 전환하고 어시스턴트 메시지 본문에 마크다운 토큰을 점진 누적합니다.
3. **SSE 완료 수신 (`event: done`)**:
   - 확정된 서버 세션 ID, 모델명(`model`), 응답 지연 시간(`latency_ms`), 토큰 사용량(`usage`)을 결합하여 `status: 'completed'` 상태로 확정합니다.
   - 백엔드 SQLite DB 세션 저장소(최대 30개 세션 FIFO, 슬라이딩 윈도우 10턴)와 동기화합니다.
4. **네트워크 장애 또는 예외 발생 시**:
   - `event: error` 또는 HTTP 4xx/5xx 에러 수신 시 해당 메시지를 `status: 'error'`로 표기하고 에러 카드와 `[재시도]` 액션을 노출합니다.
   - 사용자가 재시도 클릭 시 이전 프롬프트를 자동으로 복원하여 재전송합니다.

### 4.4 슬라이딩 윈도우 & 세션 거버넌스 계약

- **슬라이딩 윈도우 규칙 (`applySlidingWindow`)**:
  - LLM 컨텍스트 윈도우 폭주 방지 및 비용 최적화를 위해 세션당 **최근 10개 턴(사용자-어시스턴트 쌍, 총 20개 메시지)** 및 **최대 3,000토큰** 상한을 초과하는 과거 메시지는 LLM 프롬프트 주입 대상에서 투명하게 제외(Trimming)합니다.
- **자동 타이틀링 규칙 (`generateAutoTitle`)**:
  - 세션 최초 사용자 질의 발생 시 앞 30자를 추출하고 공백/줄바꿈을 정규화하여 1초 이내에 세션 타이틀로 자동 확정합니다.
- **세션 수 한도 관리**:
  - 클라이언트 로컬스토리지 및 백엔드 SQLite DB 공통으로 최대 30개 대화 세션을 FIFO(First-In, First-Out) 방식으로 관리하여 저장공간 고갈을 원천 차단합니다.
