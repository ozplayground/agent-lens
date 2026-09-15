import { NewsListResponse, ScheduleStatus, StatsResponse, DailyBriefing, AskQuestionResponse } from '@/types/news';

function getApiBase(): string {
  if (typeof window !== 'undefined') {
    // In browser: relative URL works everywhere (localhost, 127.0.0.1, Tailscale, LAN IP)
    // Next.js rewrites /api/* to http://127.0.0.1:8000/api/* seamlessly
    return '';
  }
  return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
}

export function getDirectApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    // Connect directly to backend port 8000 for SSE streaming to bypass Next.js rewrites chunk buffering
    const protocol = window.location.protocol;
    const hostname = window.location.hostname || 'localhost';
    return `${protocol}//${hostname}:8000`;
  }
  return process.env.INTERNAL_API_URL || 'http://127.0.0.1:8000';
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
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
  return res.json();
}

export async function fetchDailyBriefing(): Promise<DailyBriefing> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/briefing/today`, { cache: 'no-store' });
  if (!res.ok) throw new Error('일일 브리핑을 불러오지 못했습니다.');
  return res.json();
}

export async function askQuestionAboutNews(newsId: number, question: string): Promise<AskQuestionResponse> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/news/${newsId}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  }, 30000);
  if (!res.ok) {
    let msg = `AI 응답 생성 실패 (${res.status})`;
    try {
      const data = await res.json();
      if (data.detail) msg = data.detail;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

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
  let res: Response;

  try {
    // 1. Direct connection to FastAPI backend (bypasses Next.js proxy chunk buffering)
    res = await fetch(`${directBase}/api/news/${newsId}/ask/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
      signal
    });
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    // 2. Fallback to relative URL if direct backend port is not reachable
    const fallbackBase = getApiBase();
    res = await fetch(`${fallbackBase}/api/news/${newsId}/ask/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
      signal
    });
  }

  if (!res.ok || !res.body) {
    let msg = `AI 스트리밍 연결 실패 (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson.detail) msg = errJson.detail;
    } catch {}
    throw new Error(msg);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullAnswer = '';
  let modelUsed = 'Gemini 3.5 Flash';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';

    for (const part of parts) {
      const lines = part.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const jsonStr = trimmed.substring(6).trim();
        if (!jsonStr) continue;
        try {
          const payload = JSON.parse(jsonStr);
          if (payload.event === 'meta' && payload.model) {
            modelUsed = payload.model;
            callbacks?.onMeta?.(payload.model);
          } else if (payload.event === 'token' && typeof payload.text === 'string') {
            fullAnswer += payload.text;
            callbacks?.onToken?.(payload.text);
          } else if (payload.event === 'done') {
            if (payload.total_text) {
              fullAnswer = payload.total_text;
            }
          }
        } catch {}
      }
    }
  }

  return { answer: fullAnswer, model_used: modelUsed };
}

export async function fetchScheduleStatus(): Promise<ScheduleStatus> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/schedule/status`, { cache: 'no-store' });
  if (!res.ok) throw new Error('스케줄 정보를 불러오지 못했습니다.');
  return res.json();
}

export interface CrawlProgress {
  is_running: boolean;
  current_source: string;
  step_message: string;
  items_collected: number;
  items_saved: number;
  items_filtered: number;
  total_sources: number;
  completed_sources: number;
  last_crawl_time?: string;
}

export async function fetchCrawlProgress(): Promise<CrawlProgress> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/schedule/progress`, { cache: 'no-store' });
  if (!res.ok) throw new Error('수집 진행도를 불러오지 못했습니다.');
  return res.json();
}

export async function triggerManualCollect(): Promise<{ status: string; message: string; total_collected: number; total_saved: number }> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/schedule/trigger`, { method: 'POST' });
  if (!res.ok) throw new Error('수집 요청에 실패했습니다.');
  return res.json();
}

export async function fetchStats(): Promise<StatsResponse> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/stats`, { cache: 'no-store' });
  if (!res.ok) throw new Error('통계 데이터를 불러오지 못했습니다.');
  return res.json();
}

export async function fetchTechRadar(): Promise<import('@/types/trends').TechRadarData> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/trends/radar`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Tech Radar 데이터를 불러오지 못했습니다.');
  return res.json();
}

export async function testWebhook(webhookUrl: string): Promise<{ success: boolean; message: string }> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/webhook/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ webhook_url: webhookUrl })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '웹훅 전송에 실패했습니다.' }));
    throw new Error(err.detail || '웹훅 전송에 실패했습니다.');
  }
  return res.json();
}

export async function sendBriefingToWebhook(webhookUrl: string): Promise<{ success: boolean; message: string }> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/webhook/send-briefing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ webhook_url: webhookUrl })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '브리핑 전송에 실패했습니다.' }));
    throw new Error(err.detail || '브리핑 전송에 실패했습니다.');
  }
  return res.json();
}

export async function resetAndRecollect(): Promise<{ status: string; message: string; deleted_count: number }> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/schedule/reset-and-collect`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '초기화 및 재수집 요청 실패' }));
    throw new Error(err.detail || '초기화 및 재수집 요청 실패');
  }
  return res.json();
}

export async function deleteAllNews(): Promise<{ status: string; deleted_count: number }> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/news/all`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '데이터 삭제 실패' }));
    throw new Error(err.detail || '데이터 삭제 실패');
  }
  return res.json();
}

export interface SourceItem {
  id: string;
  name: string;
  url: string;
  site_url?: string;
  category_hint: string;
  country?: string;
  enabled: boolean;
  description?: string;
  added_at?: string;
}

export interface MonitoredRepo {
  repo: string;
  category: string;
  enabled: boolean;
  description?: string;
  stars_hint?: number;
}

export interface SourcesResponse {
  status: string;
  sources_file: string;
  updated_at: string;
  stats: {
    total_rss: number;
    active_rss: number;
    total_github_repos: number;
    active_github_repos: number;
    github_search_enabled: boolean;
    reddit_enabled: boolean;
    hackernews_enabled: boolean;
    arxiv_enabled: boolean;
    huggingface_enabled: boolean;
  };
  data: {
    rss_feeds: SourceItem[];
    github_sources: {
      enabled: boolean;
      search_queries: string[];
      monitored_repos: MonitoredRepo[];
    };
    reddit_sources: {
      enabled: boolean;
      subreddits: string[];
      keywords: string[];
    };
    hackernews_sources: {
      enabled: boolean;
      queries: string[];
    };
    arxiv_sources: {
      enabled: boolean;
      queries: string[];
    };
    huggingface_sources: {
      enabled: boolean;
    };
  };
}

export interface DiscoveredCandidate {
  id: string;
  name: string;
  site_url: string;
  feed_url: string;
  category_hint: string;
  country: string;
  description: string;
  relevance_score: number;
  tags: string[];
  already_registered: boolean;
  why_recommended: string;
}

export interface InspectUrlResponse {
  status: 'found' | 'error' | 'not_found' | 'empty';
  name?: string;
  feed_url?: string;
  site_url?: string;
  description?: string;
  category_hint?: string;
  relevance_score?: number;
  is_high_signal?: boolean;
  recent_posts?: Array<{ title: string; link: string; published: string; snippet: string }>;
  already_registered?: boolean;
  why_recommended?: string;
  message?: string;
}

export async function fetchSources(): Promise<SourcesResponse> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/sources`, { cache: 'no-store' });
  if (!res.ok) throw new Error('수집 소스 목록을 불러오지 못했습니다.');
  return res.json();
}

export async function toggleSource(sourceType: string, itemId: string): Promise<{ status: string; message: string }> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/sources/${sourceType}/${encodeURIComponent(itemId)}/toggle`, {
    method: 'PATCH'
  });
  if (!res.ok) throw new Error('소스 상태 변경에 실패했습니다.');
  return res.json();
}

export async function addRssSource(payload: {
  name: string;
  url: string;
  site_url?: string;
  category_hint?: string;
  country?: string;
  description?: string;
}): Promise<{ status: string; message?: string; source: SourceItem }> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/sources/rss`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'RSS 소스 추가 실패' }));
    throw new Error(err.detail || 'RSS 소스 추가 실패');
  }
  return res.json();
}

export async function deleteSource(sourceType: string, itemId: string): Promise<{ status: string; message: string }> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/sources/${sourceType}/${encodeURIComponent(itemId)}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('소스 삭제 실패');
  return res.json();
}

export async function inspectUrl(url: string): Promise<InspectUrlResponse> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/research/inspect-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  }, 12000);
  if (!res.ok) throw new Error('URL 피드 분석 실패');
  return res.json();
}

export async function discoverSources(query = '', category = '', limit = 8): Promise<{
  query: string;
  category: string;
  total_found: number;
  candidates: DiscoveredCandidate[];
}> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/research/discover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, category, limit })
  }, 12000);
  if (!res.ok) throw new Error('소스 리서치 탐색 실패');
  return res.json();
}

export async function registerCandidate(candidate: {
  name: string;
  feed_url: string;
  site_url?: string;
  category_hint?: string;
  country?: string;
  description?: string;
}): Promise<{ status: string; message: string; source: SourceItem }> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/research/register-candidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(candidate)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '소스 등록 실패' }));
    throw new Error(err.detail || '소스 등록 실패');
  }
  return res.json();
}

export interface ResearchStatus {
  is_running: boolean;
  last_run_time?: string;
  auto_adopted_count: number;
  last_run_summary: any;
  cadence: string;
}

export interface ResearchAuditLog {
  id: number;
  source_name: string;
  site_url: string;
  feed_url: string;
  category: string;
  relevance_score: number;
  verdict: 'AUTO_ADOPTED' | 'WATCHLIST' | 'REJECTED' | 'ALREADY_MONITORED';
  verdict_reason: string;
  analyzed_articles_count: number;
  created_at: string;
}

export async function fetchDeepResearchStatus(): Promise<ResearchStatus> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/research/status`, { cache: 'no-store' });
  if (!res.ok) throw new Error('딥 리서치 상태를 불러오지 못했습니다.');
  return res.json();
}

export async function fetchResearchAuditLogs(limit = 30): Promise<{ status: string; total: number; logs: ResearchAuditLog[] }> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/research/audit-logs?limit=${limit}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('감사 일지를 불러오지 못했습니다.');
  return res.json();
}

export async function triggerDeepResearch(maxCandidates = 6): Promise<{ status: string; message: string }> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/research/run-deep?max_candidates=${maxCandidates}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('딥 리서치 기동 실패');
  return res.json();
}

// ==========================================
// Daily Briefing Export & Settings APIs
// ==========================================

export async function exportBriefingToNotion(apiKey?: string, pageId?: string): Promise<{ success: boolean; message: string; url?: string }> {
  const base = getApiBase();
  const body: any = {};
  if (apiKey) body.api_key = apiKey;
  if (pageId) body.page_id = pageId;

  const res = await fetchWithTimeout(`${base}/api/briefing/export/notion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }, 20000);

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Notion 페이지 생성에 실패했습니다.');
  return data;
}

export async function sendBriefingByEmail(toEmail?: string, subject?: string): Promise<{ success: boolean; message: string }> {
  const base = getApiBase();
  const body: any = {};
  if (toEmail) body.to_email = toEmail;
  if (subject) body.subject = subject;

  const res = await fetchWithTimeout(`${base}/api/briefing/send/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }, 20000);

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || '이메일 발송에 실패했습니다.');
  return data;
}

export async function testNotionConnection(apiKey?: string, pageId?: string): Promise<{ success: boolean; message: string }> {
  const base = getApiBase();
  const body: any = {};
  if (apiKey) body.api_key = apiKey;
  if (pageId) body.page_id = pageId;

  const res = await fetchWithTimeout(`${base}/api/briefing/test/notion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }, 12000);

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Notion 연결 테스트 실패');
  return data;
}

export async function testEmailConnection(params: {
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
  use_tls?: boolean;
  to_email?: string;
}): Promise<{ success: boolean; message: string }> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/briefing/test/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  }, 15000);

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'SMTP 연결 테스트 실패');
  return data;
}

export async function fetchBriefingSettings(): Promise<any> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/briefing/settings`, { cache: 'no-store' });
  if (!res.ok) throw new Error('브리핑 설정을 불러오지 못했습니다.');
  return res.json();
}

export async function updateBriefingSettings(update: any): Promise<{ success: boolean; message: string }> {
  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}/api/briefing/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update)
  }, 10000);

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || '설정 저장에 실패했습니다.');
  return data;
}


