export type CategoryType = 'all' | 'harness' | 'mcp_plugins_skills' | 'agent_tech' | 'ai_news';

export interface NewsItem {
  id: number;
  title: string;
  url: string;
  source: string;
  category: string;
  summary: string;
  author: string | null;
  tags: string[];

  // LLM Synthesis & Curation
  tldr_bullets: string[];
  why_it_matters: string;
  tech_stack: string[];
  quality_score: number;
  is_high_signal: boolean;

  raw_score: number;
  comments_count: number;
  hotness_score: number;
  published_at: string;
  created_at: string;
  dedup_hash: string;
}

export interface NewsListResponse {
  items: NewsItem[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface BriefingCategoryItem {
  id?: number;
  title: string;
  url: string;
  source?: string;
  why_it_matters?: string;
  summary?: string;
  tags?: string[];
  category?: string;
  category_name?: string;
  hotness_score?: number;
}

export interface BriefingCategorySection {
  id: string;
  name: string;
  icon: string;
  summary: string;
  items: BriefingCategoryItem[];
}

export interface DailyBriefing {
  title?: string;
  date: string;
  headline: string;
  overview?: string;
  categories?: BriefingCategorySection[];
  action_items?: string[];
  markdown_report: string;
  featured_items_count: number;
  generated_at: string;
}

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

export interface AskQuestionResponse {
  news_id: number;
  question: string;
  answer: string;
}

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

export interface StatsResponse {
  total_news: number;
  category_counts: Record<string, number>;
  source_counts: Record<string, number>;
  last_updated: string | null;
}
