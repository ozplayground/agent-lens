import { http, HttpResponse, delay } from 'msw';
import {
  mockArticles,
  mockSearchChunks,
  mockSupplementarySources,
  initialMockSessions,
} from './fixtures/chat';
import {
  ChatStreamRequest,
  ChatQueryRequest,
  ChatQueryResponse,
  ChatSearchResponse,
  ChatFocusFilter,
  ChatSearchChunk,
  ChatSourceItem,
  ErrorResponse,
  LlmErrorResponse,
  ChatSessionSummary,
  ChatSessionDetail,
  ChatSessionCreateRequest,
  ChatMessageItem,
  GenericSuccessResponse,
  generateAutoTitle,
  ModelTier,
  ChatModel,
  TokenUsageMeta,
} from '@/types/chat';
import {
  NewsItem,
  NewsListResponse,
  DailyBriefing,
  SourcesResponse,
  StatsResponse,
  AskQuestionResponse,
  ScheduleStatus,
} from '@/types/news';
import { chatHandlers, resetMockSessionStore, getMockSessionStore, resolveModelAndUsage } from './handlers/chat';

export { resetMockSessionStore, getMockSessionStore, chatHandlers, resolveModelAndUsage };

/**
 * 모의 기사 아이템 컬렉션 (NewsItem 변환)
 */
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
  full_content: (art as any).full_content ?? null,
  scraped_at: (art as any).scraped_at ?? null,
}));

/**
 * 모의 일일 브리핑 픽스처
 */
export const mockDailyBriefing: DailyBriefing = {
  title: '오늘의 AI 엔지니어링 브리핑',
  date: new Date().toISOString().split('T')[0],
  headline: 'Anthropic Claude 3.7 & Model Context Protocol (MCP) 생태계 급부상',
  overview: 'SWE-bench 70% 돌파 및 FastMCP를 중심으로 한 에이전틱 인터페이스 표준화 가속',
  categories: [
    {
      id: 'mcp_plugins_skills',
      name: 'MCP & 플러그인 생태계',
      icon: '🔌',
      summary: 'FastMCP 프레임워크 릴리즈 및 클라이언트 연동 규격 고도화',
      items: [
        {
          id: 101,
          title: mockArticles[101].title,
          url: mockArticles[101].url,
          source: mockArticles[101].source,
          why_it_matters: mockArticles[101].why_it_matters,
          summary: mockArticles[101].summary,
          tags: mockArticles[101].tags,
          category: mockArticles[101].category,
          category_name: 'MCP 플러그인',
          hotness_score: mockArticles[101].hotness_score,
        },
      ],
    },
    {
      id: 'agent_tech',
      name: '에이전트 아키텍처',
      icon: '🤖',
      summary: 'LangGraph v0.2 분산 상태 머신 및 체크포인트 복원력 확보',
      items: [
        {
          id: 102,
          title: mockArticles[102].title,
          url: mockArticles[102].url,
          source: mockArticles[102].source,
          why_it_matters: mockArticles[102].why_it_matters,
          summary: mockArticles[102].summary,
          tags: mockArticles[102].tags,
          category: mockArticles[102].category,
          category_name: '에이전트 기술',
          hotness_score: mockArticles[102].hotness_score,
        },
      ],
    },
  ],
  action_items: [
    'FastMCP 데코레이터 기반 사내 도구 표준화 검토',
    'LangGraph 멀티턴 세션 체크포인터 튜닝 적용',
  ],
  markdown_report: `# 오늘의 AI 엔지니어링 브리핑\n\n## 1. 핵심 헤드라인\n- Anthropic Claude 3.7 및 하이브리드 추론 모델 출시\n- FastMCP 파이썬 프레임워크 오픈소스 릴리즈`,
  featured_items_count: 2,
  generated_at: new Date().toISOString(),
};

/**
 * 모의 수집 소스 설정 픽스처
 */
export const mockSourcesResponse: SourcesResponse = {
  status: 'success',
  sources_file: 'sources.json',
  updated_at: new Date().toISOString(),
  stats: {
    total_rss: 6,
    active_rss: 6,
    total_github_repos: 4,
    active_github_repos: 4,
    github_search_enabled: true,
    reddit_enabled: true,
    hackernews_enabled: true,
    arxiv_enabled: true,
    huggingface_enabled: true,
  },
  data: {
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
  },
};

/**
 * 모의 통계 픽스처
 */
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
 * 뉴스 피드 및 브리핑/소스 모의 핸들러 정의
 */
export const newsHandlers = [
  // ==========================================================================
  // 1. 뉴스 피드 다차원 필터링 및 페이징 조회 모의 핸들러 (GET /api/news)
  // ==========================================================================
  http.get('*/api/news', async ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || 'all';
    const source = url.searchParams.get('source') || 'all';
    const search = url.searchParams.get('search') || '';
    const sort = url.searchParams.get('sort') || 'hot';
    const highSignalOnly = url.searchParams.get('high_signal_only') === 'true';
    const page = Number(url.searchParams.get('page') || '1');
    const size = Number(url.searchParams.get('size') || '20');
    const triggerError = url.searchParams.get('trigger_error');

    // 1) 400 Bad Request Fallback
    if (page < 1 || size < 1) {
      return HttpResponse.json<ErrorResponse>(
        { error_code: 'ERR_INVALID_PAGE_PARAM', message: '페이지 번호 및 사이즈는 1 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 2) 500 Server Internal Error Fallback
    if (triggerError === '500' || search.includes('[TRIGGER_500]')) {
      return HttpResponse.json<ErrorResponse>(
        { error_code: 'ERR_FEED_FETCH_FAILED', message: '뉴스 피드 데이터베이스 조회 중 서버 내부 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 3) 503 LLM/Upstream Service Unavailable Fallback
    if (search.includes('[TRIGGER_503]')) {
      return HttpResponse.json<ErrorResponse>(
        { error_code: 'ERR_LLM_PROVIDER_UNAVAILABLE', message: '뉴스 큐레이션 및 AI 서비스가 일시 점검 중입니다.' },
        { status: 503 }
      );
    }

    await delay(30);

    let filtered = [...mockNewsItems];

    if (category !== 'all') {
      filtered = filtered.filter((item) => item.category === category);
    }

    if (source !== 'all' && source !== 'bookmarks') {
      filtered = filtered.filter((item) => item.source === source);
    }

    if (highSignalOnly) {
      filtered = filtered.filter((item) => item.quality_score >= 7.8 || item.is_high_signal);
    }

    if (search.trim()) {
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
      if (sort === 'latest') {
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      }
      if (sort === 'quality') {
        return b.quality_score - a.quality_score;
      }
      if (sort === 'top') {
        return b.raw_score - a.raw_score;
      }
      return b.hotness_score - a.hotness_score;
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / size) || 1;
    const offset = (page - 1) * size;
    const items = filtered.slice(offset, offset + size);

    const response: NewsListResponse = {
      items,
      total,
      page,
      size,
      total_pages: totalPages,
    };

    return HttpResponse.json(response, { status: 200 });
  }),

  // ==========================================================================
  // 2. 특정 뉴스 아이템 단건 상세 조회 모의 핸들러 (GET /api/news/:news_id)
  // ==========================================================================
  http.get('*/api/news/:news_id', async ({ params }) => {
    const newsId = Number(params.news_id);
    const item = mockNewsItems.find((n) => n.id === newsId);

    if (!item) {
      return HttpResponse.json<ErrorResponse>(
        { error_code: 'ERR_FEED_CARD_NOT_FOUND', message: `ID ${newsId}에 해당하는 뉴스를 찾을 수 없습니다.` },
        { status: 404 }
      );
    }

    return HttpResponse.json(item, { status: 200 });
  }),

  // ==========================================================================
  // 3. 인라인 Ask AI 질의응답 모의 핸들러 (POST /api/news/:news_id/ask)
  // ==========================================================================
  http.post('*/api/news/:news_id/ask', async ({ request, params }) => {
    const newsId = Number(params.news_id);
    let body: { question: string };
    try {
      body = (await request.json()) as { question: string };
    } catch {
      return HttpResponse.json<ErrorResponse>(
        { error_code: 'ERR_CHAT_PAYLOAD_EMPTY', message: '유효한 JSON 페이로드를 전달해주세요.' },
        { status: 400 }
      );
    }

    if (!body.question || body.question.trim().length === 0) {
      return HttpResponse.json<ErrorResponse>(
        { error_code: 'ERR_CHAT_PAYLOAD_EMPTY', message: '질문 본문을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (body.question.includes('[TRIGGER_503]')) {
      return HttpResponse.json<ErrorResponse>(
        { error_code: 'ERR_LLM_PROVIDER_UNAVAILABLE', message: '가용한 LLM 엔진이 설정되지 않았습니다.' },
        { status: 503 }
      );
    }

    const item = mockNewsItems.find((n) => n.id === newsId);
    if (!item) {
      return HttpResponse.json<ErrorResponse>(
        { error_code: 'ERR_FEED_CARD_NOT_FOUND', message: '해당 뉴스를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    await delay(100);

    const response: AskQuestionResponse = {
      news_id: newsId,
      question: body.question,
      answer: `[AI 분석 결과]: "${item.title}" 관련 질의("${body.question}")에 대해 FastMCP 및 고신호 아키텍처 관점에서 분석한 답변입니다.`,
      model_used: 'claude-3-5-sonnet-latest',
    };

    return HttpResponse.json(response, { status: 200 });
  }),

  // ==========================================================================
  // 4. 인라인 Ask AI SSE 스트리밍 모의 핸들러 (POST /api/news/:news_id/ask/stream)
  // ==========================================================================
  http.post('*/api/news/:news_id/ask/stream', async ({ request, params }) => {
    const newsId = Number(params.news_id);
    const item = mockNewsItems.find((n) => n.id === newsId);

    if (!item) {
      return HttpResponse.json<ErrorResponse>(
        { error_code: 'ERR_FEED_CARD_NOT_FOUND', message: '해당 뉴스를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ event: 'meta', model: 'claude-3-5-sonnet-latest' })}\n\n`)
        );
        await delay(30);

        const chunks = [
          '## 핵심 원리 및 시사점\n\n',
          `본 기사("${item.title}")는 차세대 AI 하네스 및 에이전트 시스템 도입에 중대한 지표를 제공합니다.\n\n`,
          '특히 비동기 처리와 분산 상태 관리 측면에서 실무 도입 시 높은 생산성 향상이 기대됩니다.',
        ];

        for (const chunk of chunks) {
          await delay(25);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ event: 'token', text: chunk })}\n\n`)
          );
        }

        await delay(30);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ event: 'done', total_text: chunks.join('') })}\n\n`
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
  }),

  // ==========================================================================
  // 5. 일일 브리핑 조회 모의 핸들러 (GET /api/briefing/today)
  // ==========================================================================
  http.get('*/api/briefing/today', async () => {
    await delay(20);
    return HttpResponse.json(mockDailyBriefing, { status: 200 });
  }),

  // ==========================================================================
  // 6. 일일 브리핑 강제 재생성 모의 핸들러 (POST /api/briefing/generate)
  // ==========================================================================
  http.post('*/api/briefing/generate', async () => {
    await delay(60);
    return HttpResponse.json(
      { ...mockDailyBriefing, generated_at: new Date().toISOString() },
      { status: 200 }
    );
  }),

  // ==========================================================================
  // 7. 수집 소스 설정 목록 조회 모의 핸들러 (GET /api/sources)
  // ==========================================================================
  http.get('*/api/sources', async () => {
    await delay(20);
    return HttpResponse.json(mockSourcesResponse, { status: 200 });
  }),

  // ==========================================================================
  // 8. 누적 통계 조회 모의 핸들러 (GET /api/stats)
  // ==========================================================================
  http.get('*/api/stats', async () => {
    await delay(15);
    return HttpResponse.json(mockStatsResponse, { status: 200 });
  }),

  // ==========================================================================
  // 9. 뉴스 전체 삭제 모의 핸들러 (DELETE /api/news/all)
  // ==========================================================================
  http.delete('*/api/news/all', async () => {
    await delay(30);
    return HttpResponse.json<GenericSuccessResponse>(
      { status: 'success', message: '모든 뉴스 데이터가 성공적으로 삭제되었습니다.', deleted_count: mockNewsItems.length },
      { status: 200 }
    );
  }),
];

/**
 * EventSource 표준 호환 전용 AI 챗 SSE GET 스트리밍 모의 핸들러 (GET /api/chat/stream)
 */
export const sseGetChatStreamHandler = http.get('*/api/chat/stream', async ({ request }) => {
  const url = new URL(request.url);
  const question = url.searchParams.get('question') || url.searchParams.get('q') || '';
  const scope = (url.searchParams.get('scope') as 'scoped' | 'global') || 'global';
  const sourceId = url.searchParams.get('source_id') ? Number(url.searchParams.get('source_id')) : undefined;

  const rawModel = (url.searchParams.get('model') as ChatModel) || undefined;
  const rawTier = (url.searchParams.get('model_tier') as ModelTier) || undefined;
  const { tier: selectedTier, model: selectedModel, latencyMs, usage: tokenUsage } =
    resolveModelAndUsage(rawModel, rawTier);

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
            model: selectedModel,
            model_tier: selectedTier,
            sources_count: 1,
            latency_ms: latencyMs,
            usage: tokenUsage,
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

/**
 * 프론트엔드 전체 통합 MSW 핸들러 배열 (All Mock Handlers SSOT)
 */
export const handlers = [
  sseGetChatStreamHandler,
  ...chatHandlers,
  ...newsHandlers,
];

export default handlers;
