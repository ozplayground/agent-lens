import { z } from 'zod';

// zod 규칙 (계약 v1.3): Pydantic·backend dict 와 1:1. 필수 → 필수, `Optional[X] = None` → `.nullable().optional()`,
// 기본값 있는 필드 → `.default(...)`. backend 에 없는 형식·범위 제약(URL, 길이, 범위)은 두지 않는다.
// 응답은 `src/lib/contract.ts` 의 `parseResponse` 로 런타임에 검증한다.

// ============================================================================
// 1. 카테고리 규약 (Category Contracts)
// ============================================================================

export const CategoryTypeSchema = z.enum([
  'all',
  'harness',
  'mcp_plugins_skills',
  'agent_tech',
  'ai_news',
]);
export type CategoryType = z.infer<typeof CategoryTypeSchema>;

// ============================================================================
// 2. 뉴스 아이템·목록 (backend `NewsItemResponse`, `NewsListResponse`)
// ============================================================================

export const NewsItemSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  url: z.string(),
  source: z.string(),
  category: z.string(),
  // Pydantic 은 Optional 이지만 라우터가 `summary or ""` 로 채워 null 이 나가지 않는다 (backend/app/api/news.py)
  summary: z.string().default(''),
  author: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),

  tldr_bullets: z.array(z.string()).default([]),
  why_it_matters: z.string().default(''),
  tech_stack: z.array(z.string()).default([]),
  quality_score: z.number().default(6.0),
  is_high_signal: z.boolean().default(false),

  raw_score: z.number().int().default(0),
  comments_count: z.number().int().default(0),
  hotness_score: z.number().default(0.0),
  /** UTC 오프셋이 붙은 ISO 8601 (예: `2026-11-06T01:02:03.123456Z`) */
  published_at: z.iso.datetime({ offset: true }),
  created_at: z.iso.datetime({ offset: true }),
  dedup_hash: z.string(),
});
export type NewsItem = z.infer<typeof NewsItemSchema>;

export const NewsListResponseSchema = z.object({
  items: z.array(NewsItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  size: z.number().int(),
  total_pages: z.number().int(),
});
export type NewsListResponse = z.infer<typeof NewsListResponseSchema>;

// ============================================================================
// 3. 수집 소스 (GET /api/sources 등, backend dict 응답. `sources.json` 내용 그대로)
// ============================================================================

export const SourceItemSchema = z.object({
  /** 옛 항목은 id 가 없을 수 있다. 화면은 `id || url` 을 키로 쓴다 */
  id: z.string().optional(),
  name: z.string(),
  url: z.string(),
  site_url: z.string().optional(),
  category_hint: z.string().default('ai_news'),
  country: z.string().optional(),
  enabled: z.boolean().default(true),
  description: z.string().optional(),
  added_at: z.string().optional(),
});
export type SourceItem = z.infer<typeof SourceItemSchema>;

export const MonitoredRepoSchema = z.object({
  repo: z.string(),
  category: z.string().default('agent_tech'),
  enabled: z.boolean().default(true),
  description: z.string().optional(),
  stars_hint: z.number().int().optional(),
  added_at: z.string().optional(),
});
export type MonitoredRepo = z.infer<typeof MonitoredRepoSchema>;

export const SourceConfigSchema = z.object({
  version: z.string().optional(),
  updated_at: z.string().nullable().optional(),
  rss_feeds: z.array(SourceItemSchema).default([]),
  github_sources: z
    .object({
      enabled: z.boolean().default(true),
      search_queries: z.array(z.string()).default([]),
      monitored_repos: z.array(MonitoredRepoSchema).default([]),
    })
    .default({ enabled: true, search_queries: [], monitored_repos: [] }),
  reddit_sources: z
    .object({
      enabled: z.boolean().default(true),
      subreddits: z.array(z.string()).default([]),
      keywords: z.array(z.string()).default([]),
    })
    .optional(),
  hackernews_sources: z
    .object({ enabled: z.boolean().default(true), queries: z.array(z.string()).default([]) })
    .optional(),
  arxiv_sources: z
    .object({ enabled: z.boolean().default(true), queries: z.array(z.string()).default([]) })
    .optional(),
  huggingface_sources: z.object({ enabled: z.boolean().default(true) }).optional(),
});
export type SourceConfig = z.infer<typeof SourceConfigSchema>;

export const SourcesStatsSchema = z.object({
  total_rss: z.number().int(),
  active_rss: z.number().int(),
  total_github_repos: z.number().int(),
  active_github_repos: z.number().int(),
  github_search_enabled: z.boolean(),
  reddit_enabled: z.boolean(),
  hackernews_enabled: z.boolean(),
  arxiv_enabled: z.boolean(),
  huggingface_enabled: z.boolean(),
});
export type SourcesStats = z.infer<typeof SourcesStatsSchema>;

/** GET /api/sources */
export const SourcesResponseSchema = z.object({
  status: z.string(),
  /** 소스 파일 이름 (예: sources.json). 서버 경로는 내보내지 않는다 */
  sources_file: z.string(),
  updated_at: z.string().nullable(),
  stats: SourcesStatsSchema,
  data: SourceConfigSchema,
});
export type SourcesResponse = z.infer<typeof SourcesResponseSchema>;

/** PATCH·DELETE /api/sources/... 등 `{status, message}` */
export const StatusMessageResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
});
export type StatusMessageResponse = z.infer<typeof StatusMessageResponseSchema>;

/** POST /api/sources/rss */
export const AddRssSourceResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  source: SourceItemSchema,
});
export type AddRssSourceResponse = z.infer<typeof AddRssSourceResponseSchema>;

/** POST /api/research/inspect-url. 실패도 200 + `status: "error"` */
export const InspectUrlResponseSchema = z.object({
  status: z.enum(['found', 'error', 'not_found', 'empty']),
  name: z.string().optional(),
  feed_url: z.string().optional(),
  site_url: z.string().optional(),
  description: z.string().optional(),
  category_hint: z.string().optional(),
  relevance_score: z.number().optional(),
  is_high_signal: z.boolean().optional(),
  recent_posts: z
    .array(z.object({ title: z.string(), link: z.string(), published: z.string(), snippet: z.string() }))
    .optional(),
  already_registered: z.boolean().optional(),
  why_recommended: z.string().optional(),
  /** GitHub 저장소 URL 이면 `atom` */
  type: z.string().optional(),
  /** GitHub 저장소 URL 이면 `github_releases` */
  source_kind: z.string().optional(),
  /** `error`·`not_found` 일 때 입력 URL */
  input_url: z.string().optional(),
  message: z.string().optional(),
});
export type InspectUrlResponse = z.infer<typeof InspectUrlResponseSchema>;

// ============================================================================
// 4. 딥 리서치 (GET /api/research/status·audit-logs, POST run-deep)
// ============================================================================

/** 딥 리서치 한 사이클에서 평가한 후보 */
export const ResearchRunResultSchema = z.object({
  source_name: z.string(),
  site_url: z.string(),
  feed_url: z.string(),
  category: z.string(),
  score: z.number(),
  verdict: z.enum(['AUTO_ADOPTED', 'WATCHLIST', 'REJECTED', 'ALREADY_MONITORED']),
  reason: z.string(),
});

/**
 * 마지막 사이클 요약. 실행 전 `{}`, 성공 `{evaluated_total, auto_adopted, adopt_failed, completed_at, results}`,
 * 사이클 예외 `{status: 'error', error, completed_at}` (backend deep_researcher). 그래서 필드는 모두 optional.
 */
export const ResearchRunSummarySchema = z.object({
  evaluated_total: z.number().int().optional(),
  auto_adopted: z.number().int().optional(),
  /** 자동 채택 기준을 넘었지만 sources.json 저장에 실패한 후보 수. 그 후보는 WATCHLIST 로 남고 감사 기록에 사유가 있다 (v0.4.2) */
  adopt_failed: z.number().int().optional(),
  completed_at: z.iso.datetime({ offset: true }).optional(),
  results: z.array(ResearchRunResultSchema).optional(),
  status: z.literal('error').optional(),
  error: z.string().optional(),
});
export type ResearchRunSummary = z.infer<typeof ResearchRunSummarySchema>;

export const ResearchStatusSchema = z.object({
  is_running: z.boolean(),
  last_run_time: z.iso.datetime({ offset: true }).nullable(),
  auto_adopted_count: z.number().int(),
  last_run_summary: ResearchRunSummarySchema,
  cadence: z.string(),
});
export type ResearchStatus = z.infer<typeof ResearchStatusSchema>;

export const ResearchAuditLogSchema = z.object({
  id: z.number().int(),
  source_name: z.string(),
  site_url: z.string(),
  feed_url: z.string(),
  category: z.string(),
  relevance_score: z.number(),
  verdict: z.enum(['AUTO_ADOPTED', 'WATCHLIST', 'REJECTED', 'ALREADY_MONITORED']),
  verdict_reason: z.string(),
  analyzed_articles_count: z.number().int(),
  created_at: z.iso.datetime({ offset: true }),
});
export type ResearchAuditLog = z.infer<typeof ResearchAuditLogSchema>;

export const ResearchAuditLogsResponseSchema = z.object({
  status: z.string(),
  total: z.number().int(),
  logs: z.array(ResearchAuditLogSchema),
});
export type ResearchAuditLogsResponse = z.infer<typeof ResearchAuditLogsResponseSchema>;

/** 시작 `{status:"started", message, max_candidates}`, 실행 중 `{status:"already_running", message}` */
export const RunDeepResearchResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  max_candidates: z.number().int().optional(),
});
export type RunDeepResearchResponse = z.infer<typeof RunDeepResearchResponseSchema>;

// ============================================================================
// 5. 일일 브리핑 (backend `DailyBriefingResponse` 등)
// ============================================================================

export const BriefingCategoryItemSchema = z.object({
  id: z.number().int().nullable().optional(),
  title: z.string(),
  url: z.string(),
  source: z.string().nullable().optional(),
  why_it_matters: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  category: z.string().nullable().optional(),
  category_name: z.string().nullable().optional(),
  hotness_score: z.number().nullable().optional(),
});
export type BriefingCategoryItem = z.infer<typeof BriefingCategoryItemSchema>;

export const BriefingCategorySectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  summary: z.string(),
  items: z.array(BriefingCategoryItemSchema).default([]),
});
export type BriefingCategorySection = z.infer<typeof BriefingCategorySectionSchema>;

export const DailyBriefingSchema = z.object({
  title: z.string().nullable().optional(),
  /** `"%Y년 %m월 %d일"` 한국어 문자열 (예: `2026년 11월 10일`) */
  date: z.string(),
  headline: z.string(),
  overview: z.string().nullable().optional(),
  categories: z.array(BriefingCategorySectionSchema).nullable().optional(),
  action_items: z.array(z.string()).nullable().optional(),
  markdown_report: z.string(),
  featured_items_count: z.number().int(),
  generated_at: z.string(),
});
export type DailyBriefing = z.infer<typeof DailyBriefingSchema>;

export const NotionExportResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  url: z.string().nullable().optional(),
});
export type NotionExportResponse = z.infer<typeof NotionExportResponseSchema>;

/** `{success, message}` — 이메일 발송, Notion·SMTP 연결 테스트, 설정 저장, 웹훅 테스트 */
export const SuccessMessageResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SuccessMessageResponse = z.infer<typeof SuccessMessageResponseSchema>;
export const EmailSendResponseSchema = SuccessMessageResponseSchema;
export type EmailSendResponse = SuccessMessageResponse;

/** GET /api/briefing/settings. Notion 키는 마스킹, SMTP 비밀번호는 `has_password` 만 */
export const BriefingSettingsSchema = z.object({
  title: z.string(),
  auto_dispatch_hour: z.number().int(),
  notion: z.object({
    enabled: z.boolean(),
    has_api_key: z.boolean(),
    masked_api_key: z.string(),
    page_id: z.string(),
    auto_export: z.boolean(),
  }),
  email: z.object({
    enabled: z.boolean(),
    smtp_host: z.string(),
    smtp_port: z.number().int(),
    smtp_user: z.string(),
    has_password: z.boolean(),
    smtp_from: z.string(),
    smtp_to: z.string(),
    use_tls: z.boolean(),
    auto_send: z.boolean(),
  }),
  webhooks: z.object({
    slack_webhook_url: z.string(),
    discord_webhook_url: z.string(),
    /** 일일 브리핑을 웹훅으로 자동 발송할지 */
    auto_dispatch_daily_briefing: z.boolean(),
  }),
});
export type BriefingSettings = z.infer<typeof BriefingSettingsSchema>;

// ============================================================================
// 6. 기사 Ask AI 스트림 요청 (POST /api/news/{id}/ask/stream). 응답은 SSE (계약 3.2절)
// ============================================================================

export const AskQuestionRequestSchema = z.object({
  question: z.string().min(1).max(2000),
});
export type AskQuestionRequest = z.infer<typeof AskQuestionRequestSchema>;

/** 스트림 `data:` 줄의 JSON. 종류는 `event` 필드 (계약 3.2절) */
export const NewsAskMetaEventSchema = z.object({ event: z.literal('meta'), model: z.string() });
export const NewsAskTokenEventSchema = z.object({ event: z.literal('token'), text: z.string() });
export const NewsAskDoneEventSchema = z.object({ event: z.literal('done'), total_text: z.string() });
/** 토큰 뒤 실패·max_tokens 잘림. 뒤에 done 이 없다 */
export const NewsAskErrorEventSchema = z.object({
  event: z.literal('error'),
  error_code: z.string(),
  message: z.string(),
  retryable: z.boolean().default(true),
});
export const NewsAskSseEventSchema = z.discriminatedUnion('event', [
  NewsAskMetaEventSchema,
  NewsAskTokenEventSchema,
  NewsAskDoneEventSchema,
  NewsAskErrorEventSchema,
]);
export type NewsAskSseEvent = z.infer<typeof NewsAskSseEventSchema>;

// ============================================================================
// 7. 스케줄·수집·통계
// ============================================================================

export const CrawlLogSchema = z.object({
  id: z.number().int(),
  source: z.string(),
  items_crawled: z.number().int(),
  items_saved: z.number().int(),
  /** 수집 한 번의 결과 (v0.4.2): 모두 성공·일부 소스 실패·전부 실패 */
  status: z.enum(['success', 'partial_failure', 'failed']),
  started_at: z.iso.datetime({ offset: true }).nullable(),
  completed_at: z.iso.datetime({ offset: true }).nullable(),
});
export type CrawlLog = z.infer<typeof CrawlLogSchema>;

/** GET /api/schedule/status (backend `ScheduleStatusResponse`) */
export const ScheduleStatusSchema = z.object({
  current_time: z.string(),
  schedule_hours: z.array(z.number().int()),
  timezone: z.string(),
  next_run: z.string(),
  minutes_until_next_run: z.number(),
  is_running: z.boolean(),
  last_crawl_time: z.iso.datetime({ offset: true }).nullable().optional(),
  last_crawl_status: z.string().nullable().default('idle'),
  recent_logs: z.array(CrawlLogSchema).default([]),
});
export type ScheduleStatus = z.infer<typeof ScheduleStatusSchema>;

/** GET /api/schedule/progress */
export const CrawlProgressSchema = z.object({
  is_running: z.boolean(),
  current_source: z.string(),
  step_message: z.string(),
  items_collected: z.number().int(),
  items_saved: z.number().int(),
  items_filtered: z.number().int(),
  total_sources: z.number().int(),
  completed_sources: z.number().int(),
  last_crawl_time: z.iso.datetime({ offset: true }).nullable(),
});
export type CrawlProgress = z.infer<typeof CrawlProgressSchema>;

/** POST /api/schedule/trigger. 시작 `started`, 이미 실행 중 `already_running` */
export const ManualCollectResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  /** `already_running` 일 때만. 다른 프로세스(MCP 서버·make collect)가 수집 잠금을 쥐고 있으면 true (N-12) */
  other_process: z.boolean().optional(),
  total_collected: z.number().int(),
  total_saved: z.number().int(),
  source_results: z.record(z.string(), z.unknown()),
});
export type ManualCollectResponse = z.infer<typeof ManualCollectResponseSchema>;

/** POST /api/schedule/reset-and-collect */
export const ResetAndCollectResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  deleted_count: z.number().int(),
});
export type ResetAndCollectResponse = z.infer<typeof ResetAndCollectResponseSchema>;

/** GET /api/stats. `last_updated` 는 응답 시각이다 */
export const StatsResponseSchema = z.object({
  total_news: z.number().int(),
  category_counts: z.record(z.string(), z.number().int()),
  source_counts: z.record(z.string(), z.number().int()),
  last_updated: z.string().nullable().optional(),
});
export type StatsResponse = z.infer<typeof StatsResponseSchema>;
