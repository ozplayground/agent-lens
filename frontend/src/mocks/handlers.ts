import { http, HttpResponse, delay } from 'msw';
import { mockArticles } from './fixtures/chat';
import { apiError } from './api-error';
import type { NewsItem, NewsListResponse, DailyBriefing, SourcesResponse, StatsResponse, ManualCollectResponse } from '@/types/news';
import { chatHandlers, resetMockSessionStore, getMockSessionStore, resolveModelAndUsage } from './handlers/chat';
import { opsHandlers } from './handlers/ops';

export { resetMockSessionStore, getMockSessionStore, chatHandlers, resolveModelAndUsage };

// MSW 는 backend 동작을 흉내 낸다 (계약 4.7절). 오류는 모두 `{error_code, message, details}` 다.

/** 모의 기사 (backend `NewsItemResponse` 모양) */
export const mockNewsItems: NewsItem[] = Object.values(mockArticles).map((art) => ({
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
}));

/** backend 브리핑 날짜 형식 `"%Y년 %m월 %d일"` */
function koreanDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}년 ${pad(d.getMonth() + 1)}월 ${pad(d.getDate())}일`;
}

/** backend 브리핑 분야 (briefing_service 의 분야 목록과 같은 순서·이름). icon 은 이모지가 아니라 분야 id 다 */
const BRIEFING_SECTIONS = [
  { id: 'harness', name: '하네스 & 벤치마크', summary: '에이전트 평가 하네스와 벤치마크 결과가 갱신됐습니다.' },
  { id: 'mcp_plugins_skills', name: 'MCP & 생태계', summary: 'FastMCP 프레임워크 릴리즈 및 클라이언트 연동 규격 고도화' },
  { id: 'agent_tech', name: '에이전트 아키텍처', summary: 'LangGraph v0.2 분산 상태 머신 및 체크포인트 복원력 확보' },
  { id: 'ai_news', name: '최신 AI 동향', summary: '하이브리드 추론 모델 출시가 이어졌습니다.' },
] as const;

const briefingCategories = BRIEFING_SECTIONS.map((section) => ({
  id: section.id,
  name: section.name,
  icon: section.id,
  summary: section.summary,
  items: Object.values(mockArticles)
    .filter((art) => art.category === section.id)
    .slice(0, 3)
    .map((art) => ({
      id: art.id,
      title: art.title,
      url: art.url,
      source: art.source,
      why_it_matters: art.why_it_matters,
      summary: art.summary,
      tags: art.tags,
      category: art.category,
      category_name: section.name,
      hotness_score: art.hotness_score,
    })),
}));

const briefingDate = koreanDate(new Date());

/** 모의 일일 브리핑 (backend `DailyBriefingResponse`, 마크다운에 이모지 없음) */
export const mockDailyBriefing: DailyBriefing = {
  title: '오늘의 AI 브리핑',
  date: briefingDate,
  headline: 'Anthropic Claude 3.7 & Model Context Protocol (MCP) 생태계 급부상',
  overview: briefingCategories.map((c) => `• **${c.name}**: ${c.summary}`).join('\n'),
  categories: briefingCategories,
  action_items: [
    '사내 에이전트 워크플로우에 단위 평가 및 샌드박스 격리 테스트베드 도입 검토',
    '사내 API 및 외부 연동 도구 인터페이스를 FastMCP 규격으로 표준화',
  ],
  markdown_report: [
    '# 오늘의 AI 브리핑',
    `**발행 일자**: ${briefingDate} (UTC) | **핵심 토픽**: Anthropic Claude 3.7 & Model Context Protocol (MCP) 생태계 급부상\n`,
    '## 오늘의 핵심 테이크어웨이 (Overview)',
    ...briefingCategories.map((c) => `• **${c.name}**: ${c.summary}`),
    '',
    ...briefingCategories.flatMap((c) => [
      `## ${c.name}`,
      `> **동향 요약**: ${c.summary}\n`,
      ...c.items.map((it) => `- **[${it.title}](${it.url})** \`[${it.source}]\``),
      '',
    ]),
  ].join('\n'),
  featured_items_count: briefingCategories.reduce((n, c) => n + c.items.length, 0),
  generated_at: new Date().toISOString(),
};

/** 모의 수집 소스 (GET /api/sources) */
export const mockSourcesResponse: SourcesResponse = {
  status: 'success',
  sources_file: 'sources.json',
  updated_at: new Date().toISOString(),
  stats: {
    total_rss: 2,
    active_rss: 2,
    total_github_repos: 2,
    active_github_repos: 2,
    github_search_enabled: true,
    reddit_enabled: true,
    hackernews_enabled: true,
    arxiv_enabled: true,
    huggingface_enabled: true,
  },
  data: {
    version: '1.0',
    rss_feeds: [
      {
        id: 'geeknews',
        name: 'GeekNews (긱뉴스)',
        url: 'https://news.hada.io/rss/news',
        site_url: 'https://news.hada.io',
        category_hint: 'ai_news',
        country: 'KR',
        enabled: true,
        description: '국내 1위 개발자 및 AI 트렌드 큐레이션 커뮤니티',
      },
      {
        id: 'aitimes',
        name: 'AI타임스',
        url: 'https://www.aitimes.com/rss/allArticle.xml',
        site_url: 'https://www.aitimes.com',
        category_hint: 'ai_news',
        country: 'KR',
        enabled: true,
        description: '국내 최대 인공지능 전문 뉴스 미디어',
      },
    ],
    github_sources: {
      enabled: true,
      search_queries: ['agentic workflow', 'mcp server python'],
      monitored_repos: [
        {
          repo: 'jlowin/fastmcp',
          category: 'mcp_plugins_skills',
          enabled: true,
          description: 'FastMCP python framework',
          stars_hint: 4200,
        },
        {
          repo: 'langchain-ai/langgraph',
          category: 'agent_tech',
          enabled: true,
          description: 'LangGraph multi-agent orchestration',
          stars_hint: 9800,
        },
      ],
    },
    reddit_sources: { enabled: true, subreddits: ['LocalLLaMA'], keywords: ['agent'] },
    hackernews_sources: { enabled: true, queries: ['MCP'] },
    arxiv_sources: { enabled: true, queries: ['LLM agent'] },
    huggingface_sources: { enabled: true },
  },
};

/** 모의 통계 */
export const mockStatsResponse: StatsResponse = {
  total_news: 216,
  category_counts: {
    harness: 48,
    mcp_plugins_skills: 54,
    agent_tech: 62,
    ai_news: 52,
  },
  source_counts: {
    github: 95,
    rss: 65,
    arxiv: 30,
    hackernews: 26,
  },
  last_updated: new Date().toISOString(),
};

/**
 * POST /api/schedule/trigger 응답 (backend schedule.trigger_manual_crawl). 기본 핸들러는 started 를 준다.
 * 수집 중 응답은 테스트가 `server.use` 로 고른다. other_process 는 already_running 일 때만 있다.
 */
export const mockTriggerResponses: Record<'started' | 'alreadyRunning' | 'otherProcess', ManualCollectResponse> = {
  started: {
    status: 'started',
    message: '실시간 점진적 수집이 시작되었습니다. 소식이 화면에 순차적으로 반영됩니다.',
    total_collected: 0,
    total_saved: 0,
    source_results: {},
  },
  alreadyRunning: {
    status: 'already_running',
    message: '이미 수집이 진행 중입니다.',
    other_process: false,
    total_collected: 12,
    total_saved: 5,
    source_results: {},
  },
  otherProcess: {
    status: 'already_running',
    message: '다른 프로세스(MCP 서버·make collect)가 같은 DB 에 수집 중입니다.',
    other_process: true,
    total_collected: 0,
    total_saved: 0,
    source_results: {},
  },
};

/** 정수 쿼리·경로 값 검사 (FastAPI 바인딩 실패는 backend 공통 처리로 400 ERR_INVALID_PAYLOAD) */
function invalidParam(where: 'query' | 'path', name: string, msg: string) {
  return apiError(400, 'ERR_INVALID_PAYLOAD', '요청 값 형식이 올바르지 않습니다.', [{ loc: [where, name], msg }]);
}

export const newsHandlers = [
  // ==========================================================================
  // 1. GET /api/news — 필터·검색·정렬·페이지 (backend news.get_news_feed)
  // ==========================================================================
  http.get('*/api/news', async ({ request }) => {
    const url = new URL(request.url);
    const category = (url.searchParams.get('category') || 'all').toLowerCase();
    const source = (url.searchParams.get('source') || 'all').toLowerCase();
    const search = (url.searchParams.get('search') || '').trim();
    const sort = url.searchParams.get('sort') || 'hot';
    const highSignalOnly = url.searchParams.get('high_signal_only') === 'true';
    const page = Number(url.searchParams.get('page') || '1');
    const size = Number(url.searchParams.get('size') || '20');

    if (!Number.isInteger(page) || page < 1) return invalidParam('query', 'page', 'Input should be greater than or equal to 1');
    if (!Number.isInteger(size) || size < 1 || size > 100) return invalidParam('query', 'size', 'Input should be between 1 and 100');

    // 처리하지 못한 예외 흉내 (DB 장애 등)
    if (url.searchParams.get('trigger_error') === '500' || search.includes('[TRIGGER_500]')) {
      return apiError(500, 'ERR_SERVER_INTERNAL', '서버 내부 오류가 발생했습니다.');
    }

    await delay(30);

    let filtered = [...mockNewsItems];
    if (category !== 'all') filtered = filtered.filter((item) => item.category === category);
    if (source !== 'all') filtered = filtered.filter((item) => item.source === source);
    if (highSignalOnly) filtered = filtered.filter((item) => item.is_high_signal);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q)) ||
          item.tech_stack.some((ts) => ts.toLowerCase().includes(q)) ||
          item.why_it_matters.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => {
      if (sort === 'latest') return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      if (sort === 'quality') return b.quality_score - a.quality_score || b.hotness_score - a.hotness_score;
      if (sort === 'top') return b.raw_score - a.raw_score;
      return b.hotness_score - a.hotness_score || new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });

    const total = filtered.length;
    const response: NewsListResponse = {
      items: filtered.slice((page - 1) * size, page * size),
      total,
      page,
      size,
      total_pages: total > 0 ? Math.ceil(total / size) : 1,
    };
    return HttpResponse.json(response, { status: 200 });
  }),

  // ==========================================================================
  // 2. POST /api/news/:news_id/ask/stream — `data:` 줄만 있는 SSE
  //    meta → token* → done. 토큰 뒤 실패·잘림([TRIGGER_STREAM_ERROR])은 meta → token → error (done 없음)
  //    질문은 1~2000자 (backend `AskQuestionRequest`). 위반은 400 ERR_INVALID_PAYLOAD
  // ==========================================================================
  http.post('*/api/news/:news_id/ask/stream', async ({ request, params }) => {
    const newsId = Number(params.news_id);
    if (!Number.isInteger(newsId)) return invalidParam('path', 'news_id', 'Input should be a valid integer');
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError(400, 'ERR_INVALID_PAYLOAD', '요청 형식이 올바르지 않습니다.', [
        { loc: ['body'], msg: 'JSON decode error' },
      ]);
    }
    const question = (body as { question?: unknown } | null)?.question;
    if (typeof question !== 'string' || question.length < 1 || question.length > 2000) {
      return apiError(400, 'ERR_INVALID_PAYLOAD', '요청 형식이 올바르지 않습니다.', [
        { loc: ['body', 'question'], msg: 'String should have 1 to 2000 characters' },
      ]);
    }
    const item = mockNewsItems.find((n) => n.id === newsId);
    if (!item) return apiError(404, 'ERR_NOT_FOUND', '기사를 찾을 수 없습니다.');

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const emit = (data: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        emit({ event: 'meta', model: 'claude-sonnet-5-5' });
        await delay(30);

        const chunks = [
          '## 핵심 원리 및 시사점\n\n',
          `본 기사("${item.title}")는 차세대 AI 하네스 및 에이전트 시스템 도입에 중대한 지표를 제공합니다.\n\n`,
          '특히 비동기 처리와 분산 상태 관리 측면에서 실무 도입 시 높은 생산성 향상이 기대됩니다.',
        ];
        if (question.includes('[TRIGGER_STREAM_ERROR]')) {
          await delay(25);
          emit({ event: 'token', text: chunks[0] });
          emit({
            event: 'error',
            error_code: 'ERR_LLM_STREAM_FAILED',
            message: '답변 생성이 중간에 끊겼습니다. 다시 시도해 주세요.',
            retryable: true,
          });
          controller.close();
          return;
        }
        for (const text of chunks) {
          await delay(25);
          emit({ event: 'token', text });
        }

        await delay(30);
        emit({ event: 'done', total_text: chunks.join('') });
        controller.close();
      },
    });

    return new HttpResponse(stream, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  }),

  // ==========================================================================
  // 3. GET /api/briefing/today
  // ==========================================================================
  http.get('*/api/briefing/today', async () => {
    await delay(20);
    return HttpResponse.json(mockDailyBriefing, { status: 200 });
  }),

  // ==========================================================================
  // 4. GET /api/sources, GET /api/stats
  // ==========================================================================
  http.get('*/api/sources', async () => {
    await delay(20);
    return HttpResponse.json(mockSourcesResponse, { status: 200 });
  }),

  // ==========================================================================
  // 5. POST /api/schedule/trigger — 기본은 started (수집 중 응답은 mockTriggerResponses 로 server.use)
  // ==========================================================================
  http.post('*/api/schedule/trigger', async () => {
    await delay(15);
    return HttpResponse.json(mockTriggerResponses.started, { status: 200 });
  }),

  http.get('*/api/stats', async () => {
    await delay(15);
    return HttpResponse.json(mockStatsResponse, { status: 200 });
  }),
];

/** 전체 MSW 핸들러 */
export const handlers = [...chatHandlers, ...newsHandlers, ...opsHandlers];

export default handlers;
