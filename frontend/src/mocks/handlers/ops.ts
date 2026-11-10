import { http, HttpResponse, delay } from 'msw';
import { mockArticles } from '../fixtures/chat';
import { apiError } from '../api-error';
import type {
  ScheduleStatus,
  CrawlProgress,
  ResetAndCollectResponse,
  InspectUrlResponse,
  ResearchStatus,
  ResearchAuditLogsResponse,
  BriefingSettings,
  SourceItem,
} from '@/types/news';
import type { TechRadarData } from '@/types/trends';

// 화면이 부르는 운영 엔드포인트(스케줄·트렌드·소스 쓰기·리서치·브리핑 내보내기·설정·웹훅)의 기본 MSW 핸들러.
// 모양·문구는 backend 와 같다 (계약 4.2절). 실패 경우는 테스트가 server.use 로 고른다.
// 목이 없는 요청은 setup.ts 가 테스트 실패로 만든다 (실제 서버로 나가지 않게, 계약 4.1절).

const iso = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60_000).toISOString();

/** GET /api/schedule/status (backend 기본: 0·6·12·18시 UTC) */
export const mockScheduleStatus: ScheduleStatus = {
  current_time: iso(0),
  schedule_hours: [0, 6, 12, 18],
  timezone: 'UTC',
  next_run: iso(-90),
  minutes_until_next_run: 90,
  is_running: false,
  last_crawl_time: iso(30),
  last_crawl_status: 'idle',
  recent_logs: [
    { id: 2, source: 'all', items_crawled: 42, items_saved: 7, status: 'success', started_at: iso(32), completed_at: iso(30) },
    { id: 1, source: 'all', items_crawled: 38, items_saved: 5, status: 'partial_failure', started_at: iso(392), completed_at: iso(390) },
  ],
};

/** GET /api/schedule/progress (수집 중이 아님) */
export const mockCrawlProgress: CrawlProgress = {
  is_running: false,
  current_source: '',
  step_message: '',
  items_collected: 0,
  items_saved: 0,
  items_filtered: 0,
  total_sources: 0,
  completed_sources: 0,
  last_crawl_time: iso(30),
};

/** GET /api/trends/radar (fixture 기사 태그 집계) */
export const mockTechRadar: TechRadarData = (() => {
  const counts = new Map<string, { count: number; category: string; sample: number }>();
  for (const art of Object.values(mockArticles)) {
    for (const tag of art.tags ?? []) {
      const prev = counts.get(tag);
      counts.set(tag, { count: (prev?.count ?? 0) + 1, category: art.category, sample: prev?.sample ?? art.id });
    }
  }
  const tags = [...counts.entries()].map(([name, v]) => ({
    name,
    count: v.count,
    category: v.category,
    recent_count: 0,
    velocity: 'STEADY',
    sample_news_id: v.sample,
  }));
  const byCategory = new Map<string, number>();
  for (const art of Object.values(mockArticles)) byCategory.set(art.category, (byCategory.get(art.category) ?? 0) + 1);
  const total = Object.values(mockArticles).length;
  return {
    updated_at: iso(0),
    total_analyzed: total,
    surging_tags: tags.slice(0, 6),
    categories: [...byCategory.entries()].map(([name, count]) => ({ name, count, percentage: Math.round((count / total) * 1000) / 10 })),
    tags: tags.slice(0, 25),
  };
})();

const SAVE_FAILED_REASON = '채택 기준을 넘었으나(점수 0.88점) sources.json 저장에 실패해 등록하지 못했습니다.'; // backend deep_researcher 문구

/** GET /api/research/status (마지막 사이클: 3건 평가, 1건 채택, 1건 저장 실패 → WATCHLIST) */
export const mockResearchStatus: ResearchStatus = {
  is_running: false,
  last_run_time: iso(120),
  auto_adopted_count: 1,
  last_run_summary: {
    evaluated_total: 3,
    auto_adopted: 1,
    adopt_failed: 1,
    completed_at: iso(120),
    results: [
      { source_name: 'LangChain Blog', site_url: 'https://blog.langchain.dev', feed_url: 'https://blog.langchain.dev/rss/', category: 'agent_tech', score: 0.91, verdict: 'AUTO_ADOPTED', reason: '에이전트 기술 키워드 비중이 높습니다.' },
      { source_name: 'Simon Willison', site_url: 'https://simonwillison.net', feed_url: 'https://simonwillison.net/atom/everything/', category: 'ai_news', score: 0.88, verdict: 'WATCHLIST', reason: SAVE_FAILED_REASON },
      { source_name: 'Generic Tech', site_url: 'https://example.com', feed_url: 'https://example.com/feed', category: 'ai_news', score: 0.31, verdict: 'REJECTED', reason: '관련 키워드가 적습니다.' },
    ],
  },
  cadence: 'Every 12 hours (03:00, 15:00 UTC) + On-demand',
};

/** GET /api/research/audit-logs */
export const mockResearchAuditLogs: ResearchAuditLogsResponse = {
  status: 'success',
  total: 1,
  logs: [
    {
      id: 1,
      source_name: 'Simon Willison',
      site_url: 'https://simonwillison.net',
      feed_url: 'https://simonwillison.net/atom/everything/',
      category: 'ai_news',
      relevance_score: 0.82,
      verdict: 'WATCHLIST',
      verdict_reason: SAVE_FAILED_REASON,
      analyzed_articles_count: 4,
      created_at: iso(120),
    },
  ],
};

/** GET /api/briefing/settings (연동 미설정) */
export const mockBriefingSettings: BriefingSettings = {
  title: '오늘의 AI 브리핑',
  auto_dispatch_hour: 9,
  notion: { enabled: false, has_api_key: false, masked_api_key: '', page_id: '', auto_export: false },
  email: {
    enabled: false,
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    has_password: false,
    smtp_from: '',
    smtp_to: '',
    use_tls: true,
    auto_send: false,
  },
  webhooks: { slack_webhook_url: '', discord_webhook_url: '', auto_dispatch_daily_briefing: true },
};

/** FastAPI 쿼리 정수 범위 검사 → backend 공통 400 */
function intQueryOutOfRange(url: URL, name: string, min: number, max: number, fallback: number) {
  const raw = url.searchParams.get(name);
  const value = raw === null ? fallback : Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    return apiError(400, 'ERR_INVALID_PAYLOAD', '요청 형식이 올바르지 않습니다.', [
      { loc: ['query', name], msg: `Input should be between ${min} and ${max}` },
    ]);
  }
  return null;
}

const ok = (message: string) => HttpResponse.json({ success: true, message }, { status: 200 });

export const opsHandlers = [
  // 스케줄
  http.get('*/api/schedule/status', async () => {
    await delay(10);
    return HttpResponse.json(mockScheduleStatus);
  }),
  http.get('*/api/schedule/progress', async () => HttpResponse.json(mockCrawlProgress)),
  http.post('*/api/schedule/reset-and-collect', async () => {
    await delay(15);
    const body: ResetAndCollectResponse = {
      status: 'started',
      message: '기존 데이터 5건이 삭제되었으며, 실시간 클린 재수집이 시작되었습니다.',
      deleted_count: 5,
    };
    return HttpResponse.json(body);
  }),

  // 트렌드
  http.get('*/api/trends/radar', async () => {
    await delay(10);
    return HttpResponse.json(mockTechRadar);
  }),

  // 웹훅 테스트
  http.post('*/api/webhook/test', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { webhook_url?: unknown };
    if (typeof body.webhook_url !== 'string' || !body.webhook_url.startsWith('http')) {
      return apiError(400, 'ERR_INVALID_PAYLOAD', '유효한 HTTP/HTTPS 웹훅 URL을 입력해주세요.');
    }
    return ok('테스트 웹훅 메시지가 성공적으로 전송되었습니다.');
  }),

  // 소스 쓰기
  http.post('*/api/sources/rss', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Partial<SourceItem> & { category_hint?: string };
    if (!body.name || !body.url) {
      return apiError(400, 'ERR_INVALID_PAYLOAD', '소스 이름과 URL 을 입력해주세요.');
    }
    const source: SourceItem = {
      id: body.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      name: body.name,
      url: body.url,
      site_url: body.site_url || body.url,
      category_hint: body.category_hint || 'ai_news',
      country: body.country || 'GLOBAL',
      enabled: true,
      description: body.description || '',
      added_at: iso(0),
    };
    return HttpResponse.json({ status: 'success', message: `'${body.name}' 등록 완료`, source });
  }),
  http.patch('*/api/sources/:sourceType/:itemId/toggle', ({ params }) =>
    HttpResponse.json({
      status: 'success',
      message: `소스 상태가 변경되었습니다 (${params.sourceType} / ${decodeURIComponent(String(params.itemId))})`,
    })
  ),
  http.delete('*/api/sources/:sourceType/:itemId', ({ params }) =>
    HttpResponse.json({
      status: 'success',
      message: `소스가 삭제되었습니다 (${params.sourceType} / ${decodeURIComponent(String(params.itemId))})`,
    })
  ),

  // 리서치
  http.post('*/api/research/inspect-url', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { url?: unknown };
    if (typeof body.url !== 'string' || !body.url) {
      return apiError(400, 'ERR_INVALID_PAYLOAD', '조사할 URL 을 입력해주세요.');
    }
    await delay(20);
    const result: InspectUrlResponse = {
      status: 'found',
      name: 'Example Blog',
      feed_url: `${body.url.replace(/\/$/, '')}/feed.xml`,
      site_url: body.url,
      description: 'AI 에이전트 엔지니어링 블로그',
      category_hint: 'agent_tech',
      relevance_score: 0.74,
      is_high_signal: false,
      recent_posts: [{ title: 'Agent harness notes', link: `${body.url}/posts/1`, published: iso(600), snippet: '하네스 설계 메모' }],
      already_registered: false,
      why_recommended: '최근 글이 에이전트 하네스를 다룹니다.',
    };
    return HttpResponse.json(result);
  }),
  http.get('*/api/research/status', () => HttpResponse.json(mockResearchStatus)),
  http.get('*/api/research/audit-logs', ({ request }) => {
    const bad = intQueryOutOfRange(new URL(request.url), 'limit', 1, 200, 30);
    return bad ?? HttpResponse.json(mockResearchAuditLogs);
  }),
  http.post('*/api/research/run-deep', ({ request }) => {
    const url = new URL(request.url);
    const bad = intQueryOutOfRange(url, 'max_candidates', 1, 20, 6);
    if (bad) return bad;
    return HttpResponse.json({
      status: 'started',
      message: '자율 딥 리서치 사이클이 백그라운드에서 기동되었습니다.',
      max_candidates: Number(url.searchParams.get('max_candidates') ?? 6),
    });
  }),

  // 브리핑 내보내기·연결 테스트·설정
  http.post('*/api/briefing/export/notion', async () => {
    await delay(20);
    return HttpResponse.json({ success: true, message: 'Notion 페이지가 생성되었습니다.', url: 'https://www.notion.so/mock-briefing-page' });
  }),
  http.post('*/api/briefing/send/email', async () => {
    await delay(20);
    return ok('브리핑 이메일을 발송했습니다.');
  }),
  http.post('*/api/briefing/test/notion', () => ok('Notion 연동 성공! (연결된 통합: AgentLens)')),
  http.post('*/api/briefing/test/email', () => ok('SMTP 연결 테스트 메일을 발송했습니다.')),
  http.get('*/api/briefing/settings', () => HttpResponse.json(mockBriefingSettings)),
  http.post('*/api/briefing/settings', () => ok('브리핑 설정이 저장되었습니다.')),
];
