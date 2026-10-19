import { z } from 'zod';

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
// 2. 뉴스 아이템 엔티티 및 목록 응답 (News Item & List Contracts)
// ============================================================================

export const NewsItemSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  url: z.string().url(),
  source: z.string().min(1),
  category: z.string().min(1),
  summary: z.string().default(''),
  author: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),

  // LLM Synthesis & Curation
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

// ============================================================================
// 3. 수집 소스 및 구성 설정 스키마 (Source & SourceConfig Contracts)
// ============================================================================

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
  reddit_sources: z.object({
    enabled: z.boolean().default(true),
    subreddits: z.array(z.string()).default([]),
    keywords: z.array(z.string()).default([]),
  }).optional(),
  hackernews_sources: z.object({
    enabled: z.boolean().default(true),
    queries: z.array(z.string()).default([]),
  }).optional(),
  arxiv_sources: z.object({
    enabled: z.boolean().default(true),
    queries: z.array(z.string()).default([]),
  }).optional(),
  huggingface_sources: z.object({
    enabled: z.boolean().default(true),
  }).optional(),
});
export type SourceConfig = z.infer<typeof SourceConfigSchema>;

export const SourcesStatsSchema = z.object({
  total_rss: z.number().int().default(0),
  active_rss: z.number().int().default(0),
  total_github_repos: z.number().int().default(0),
  active_github_repos: z.number().int().default(0),
  github_search_enabled: z.boolean().default(true),
  reddit_enabled: z.boolean().default(true),
  hackernews_enabled: z.boolean().default(true),
  arxiv_enabled: z.boolean().default(true),
  huggingface_enabled: z.boolean().default(true),
});
export type SourcesStats = z.infer<typeof SourcesStatsSchema>;

export const SourcesResponseSchema = z.object({
  status: z.string().default('success'),
  sources_file: z.string().optional(),
  updated_at: z.string().optional(),
  stats: SourcesStatsSchema.optional(),
  data: SourceConfigSchema,
});
export type SourcesResponse = z.infer<typeof SourcesResponseSchema>;

// ============================================================================
// 4. 일일 브리핑 스키마 (Daily Briefing Contracts)
// ============================================================================

export const BriefingCategoryItemSchema = z.object({
  id: z.number().int().optional(),
  title: z.string().min(1),
  url: z.string().url(),
  source: z.string().optional(),
  why_it_matters: z.string().optional(),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  category_name: z.string().optional(),
  hotness_score: z.number().optional(),
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
  title: z.string().optional(),
  date: z.string(),
  headline: z.string(),
  overview: z.string().optional(),
  categories: z.array(BriefingCategorySectionSchema).optional(),
  action_items: z.array(z.string()).optional(),
  markdown_report: z.string(),
  featured_items_count: z.number().int().nonnegative(),
  generated_at: z.string(),
});
export type DailyBriefing = z.infer<typeof DailyBriefingSchema>;

export interface NotionExportResponse {
  success: boolean;
  message: string;
  url?: string;
}

export interface EmailSendResponse {
  success: boolean;
  message: string;
}

export interface BriefingSettings {
  title: string;
  auto_dispatch_hour: number;
  notion: {
    enabled: boolean;
    has_api_key: boolean;
    masked_api_key: string;
    page_id: string;
    auto_export: boolean;
  };
  email: {
    enabled: boolean;
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    has_password: boolean;
    smtp_from: string;
    smtp_to: string;
    use_tls: boolean;
    auto_send: boolean;
  };
  webhooks: {
    slack_webhook_url: string;
    discord_webhook_url: string;
    auto_dispatch_daily_briefing: boolean;
    auto_alert_high_signal: boolean;
  };
}

// ============================================================================
// 5. Ask AI 질의응답 스키마 (Ask AI Contracts)
// ============================================================================

export const AskQuestionRequestSchema = z.object({
  question: z.string().min(1, '질문을 입력해주세요.'),
});
export type AskQuestionRequest = z.infer<typeof AskQuestionRequestSchema>;

export const AskQuestionResponseSchema = z.object({
  news_id: z.number().int(),
  question: z.string(),
  answer: z.string(),
  model_used: z.string().optional(),
});
export type AskQuestionResponse = z.infer<typeof AskQuestionResponseSchema>;

// ============================================================================
// 6. 스케줄, 크롤 로그 및 통계 스키마 (Schedule & Stats Contracts)
// ============================================================================

export interface CrawlLog {
  id: number;
  source: string;
  items_crawled: number;
  items_saved: number;
  status: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface ScheduleStatus {
  current_time: string;
  schedule_hours: number[];
  timezone: string;
  next_run: string;
  minutes_until_next_run: number;
  is_running: boolean;
  last_crawl_time: string | null;
  last_crawl_status: string;
  recent_logs: CrawlLog[];
}

export const StatsResponseSchema = z.object({
  total_news: z.number().int().nonnegative(),
  category_counts: z.record(z.string(), z.number()),
  source_counts: z.record(z.string(), z.number()),
  last_updated: z.string().nullable().optional(),
});
export type StatsResponse = z.infer<typeof StatsResponseSchema>;
