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

export interface DailyBriefing {
  date: string;
  headline: string;
  markdown_report: string;
  featured_items_count: number;
  generated_at: string;
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
