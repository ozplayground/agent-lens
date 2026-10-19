import { http, HttpResponse, delay } from 'msw';
import {
  mockArticles,
  mockSearchChunks,
  mockSupplementarySources,
  initialMockSessions,
  generateArticleScopedAnswerTokens,
} from '../fixtures/chat';
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
  TIER_TO_MODEL,
  MODEL_TO_TIER,
  DEFAULT_CHAT_MODEL,
  DEFAULT_MODEL_TIER,
  sanitizeModelTier,
} from '@/types/chat';

/**
 * 헬퍼: 요청된 모델 및 티어 파라미터를 기반으로 대상 모델, 티어, 지연시간, 토큰 사용량 메타데이터 산출
 */
export function resolveModelAndUsage(requestedModel?: ChatModel, requestedTier?: ModelTier) {
  let tier: ModelTier = DEFAULT_MODEL_TIER;
  let model: ChatModel = DEFAULT_CHAT_MODEL;

  if (requestedTier && (['haiku', 'sonnet', 'opus'] as ModelTier[]).includes(requestedTier)) {
    tier = requestedTier;
    model = TIER_TO_MODEL[tier];
  } else if (requestedModel) {
    const sanitized = sanitizeModelTier(requestedModel);
    tier = (['haiku', 'sonnet', 'opus'].includes(sanitized as any) ? sanitized : 'sonnet') as ModelTier;
    model = TIER_TO_MODEL[tier];
  }

  const latencyMs = tier === 'haiku' ? 180 : tier === 'opus' ? 1780 : 642;
  const usage: TokenUsageMeta = {
    input_tokens: tier === 'haiku' ? 650 : tier === 'opus' ? 2100 : 1250,
    output_tokens: tier === 'haiku' ? 420 : tier === 'opus' ? 1650 : 840,
    cache_read_input_tokens: 2500,
    cache_creation_input_tokens: 0,
  };

  return { tier, model, latencyMs, usage };
}

/**
 * 인메모리 대화 세션 상태 저장소 (Dual-Layer SQLite 백엔드 모의)
 */
let mockSessionStore: ChatSessionDetail[] = JSON.parse(JSON.stringify(initialMockSessions));

export function resetMockSessionStore(): void {
  mockSessionStore = JSON.parse(JSON.stringify(initialMockSessions));
}

export function getMockSessionStore(): ChatSessionDetail[] {
  return mockSessionStore;
}


/**
 * 헬퍼: 사용자 question 텍스트의 키워드 및 의미론적 매핑을 기반으로 모의 청크 검색 및 필터링
 */
export function filterChunksByQuestion(
  chunks: ChatSearchChunk[],
  question?: string | null
): ChatSearchChunk[] {
  if (!question || !question.trim()) {
    return [...chunks];
  }

  const q = question.toLowerCase();

  // 특정 핵심 프레임워크 및 한글 키워드 매핑 룰
  const topicMappings: { keywords: string[]; matches: (c: ChatSearchChunk) => boolean }[] = [
    {
      keywords: ['fastmcp', 'mcp', '엠씨피', 'model context protocol', 'stdio', '데코레이터'],
      matches: (c) =>
        c.id === 101 || c.category === 'mcp_plugins_skills' || c.title.toLowerCase().includes('mcp'),
    },
    {
      keywords: [
        'langgraph',
        '랭그래프',
        'langchain',
        '시간 여행',
        'time-travel',
        '체크포인트',
        'checkpoint',
        'state machine',
        '상태 머신',
      ],
      matches: (c) => c.id === 102 || c.title.toLowerCase().includes('langgraph'),
    },
    {
      keywords: [
        'swe-bench',
        'swebench',
        '하네스',
        'harness',
        '멀티모달',
        'multimodal',
        'gui',
        '벤치마크',
        'benchmark',
      ],
      matches: (c) => c.id === 103 || c.category === 'harness' || c.title.toLowerCase().includes('swe-bench'),
    },
    {
      keywords: ['autogen', '오토젠', 'actor', '액터', '이벤트', 'event-driven', 'microsoft'],
      matches: (c) => c.id === 104 || c.title.toLowerCase().includes('autogen'),
    },
    {
      keywords: ['claude', '클로드', 'sonnet', '소네트', 'anthropic', '추론', 'reasoning', 'hybrid reasoning', 'thinking'],
      matches: (c) => c.id === 105 || c.category === 'ai_news' || c.title.toLowerCase().includes('claude'),
    },
  ];

  // 1. 특정 토픽 키워드가 감지된 경우, 해당 토픽과 정확히 일치하는 청크만 우선 필터링
  const activeTopicMatches: ChatSearchChunk[] = [];
  for (const mapping of topicMappings) {
    if (mapping.keywords.some((kw) => q.includes(kw))) {
      for (const chunk of chunks) {
        if (mapping.matches(chunk) && !activeTopicMatches.some((m) => m.id === chunk.id)) {
          activeTopicMatches.push(chunk);
        }
      }
    }
  }

  if (activeTopicMatches.length > 0) {
    activeTopicMatches.sort((a, b) => b.rag_score - a.rag_score);
    return activeTopicMatches;
  }

  // 2. 일반 자연어 키워드 토큰 매칭
  const scored = chunks.map((chunk) => {
    let score = 0;
    const titleLower = chunk.title.toLowerCase();
    const snippetLower = chunk.snippet.toLowerCase();
    const categoryLower = chunk.category.toLowerCase();

    const tokens = q.match(/[a-z0-9_\-]+|[가-힣]{2,}/gi) || [];
    for (const rawToken of tokens) {
      const token = rawToken.toLowerCase();
      // 버전 프리픽스(v0, v1, v0.2 등) 및 일반 조사/동사 불용어 배제
      if (/^v\d+(\.\d+)?$/i.test(token) || token.length < 3) {
        continue;
      }
      if (['질문', '알려줘', '설명', '분석', '어떻게', '방법', '테스트', '기본', '최신', '동향'].includes(token)) {
        continue;
      }
      if (titleLower.includes(token)) score += 10;
      if (snippetLower.includes(token)) score += 5;
      if (categoryLower.includes(token)) score += 3;
    }

    return { chunk, score };
  });

  const matches = scored.filter((item) => item.score > 0);
  if (matches.length > 0) {
    matches.sort((a, b) => b.score - a.score || b.chunk.rag_score - a.chunk.rag_score);
    return matches.map((m) => m.chunk);
  }

  return [...chunks];
}

/**
 * 헬퍼: ChatFocusFilter 적용 및 정렬
 */
function applyFocusFilters(

  chunks: ChatSearchChunk[],
  filters?: ChatFocusFilter | null
): { filtered: ChatSearchChunk[]; isRelaxed: boolean; appliedFilters: ChatFocusFilter } {
  const appliedFilters: ChatFocusFilter = {
    category: filters?.category || 'all',
    time_range: filters?.time_range || 'all',
    sort: filters?.sort || 'hot',
    high_signal_only: filters?.high_signal_only ?? false,
  };

  let candidate = [...chunks];

  // 1. 카테고리 필터
  if (appliedFilters.category !== 'all') {
    candidate = candidate.filter((c) => c.category === appliedFilters.category);
  }

  // 2. 고신호 한정 필터 (quality_score >= 7.8)
  if (appliedFilters.high_signal_only) {
    candidate = candidate.filter((c) => c.quality_score >= 7.8);
  }

  // 3. 기간 필터 및 0건 매칭 시 지능적 자동 완화 (Auto-Relaxation)
  let isRelaxed = false;
  if (appliedFilters.time_range !== 'all') {
    if (appliedFilters.time_range === '24h' && appliedFilters.category === 'harness') {
      isRelaxed = true;
      appliedFilters.time_range = 'all';
      candidate = chunks.filter((c) => c.category === 'harness');
      if (appliedFilters.high_signal_only) {
        candidate = candidate.filter((c) => c.quality_score >= 7.8);
      }
    }
  }

  // 4. 정렬 기준 적용
  candidate.sort((a, b) => {
    if (appliedFilters.sort === 'latest') {
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    }
    if (appliedFilters.sort === 'quality') {
      return b.quality_score - a.quality_score;
    }
    return b.rag_score - a.rag_score;
  });

  return { filtered: candidate, isRelaxed, appliedFilters };
}

export const chatHandlers = [
  // ==========================================================================
  // 1. 전용 AI 챗 SSE 실시간 다중 이벤트 스트리밍 모의 핸들러 (POST /api/chat/stream)
  // ==========================================================================
  http.post('*/api/chat/stream', async ({ request }) => {
    let payload: ChatStreamRequest;
    try {
      payload = (await request.json()) as ChatStreamRequest;
    } catch {
      return HttpResponse.json<ErrorResponse>(
        { error_code: 'ERR_INVALID_PAYLOAD', message: '요청 본문 JSON 파싱에 실패했습니다.' },
        { status: 400 }
      );
    }

    const { question, scope = 'global', source_id, filters, top_k = 5, model, model_tier } = payload;

    // 1) 입력 유효성 검증
    if (!question || question.trim().length === 0) {
      return HttpResponse.json<ErrorResponse>(
        { error_code: 'ERR_CHAT_PAYLOAD_EMPTY', message: '질문 본문이 비어있습니다.' },
        { status: 400 }
      );
    }

    if (question.length > 2000) {
      return HttpResponse.json<ErrorResponse>(
        { error_code: 'ERR_CHAT_PAYLOAD_TOO_LARGE', message: '질문은 최대 2,000자까지 입력 가능합니다.' },
        { status: 400 }
      );
    }

    if (model_tier && !['haiku', 'sonnet', 'opus'].includes(model_tier)) {
      return HttpResponse.json<ErrorResponse>(
        { error_code: 'ERR_INVALID_MODEL_TIER', message: `유효하지 않은 모델 티어입니다: ${model_tier}` },
        { status: 400 }
      );
    }

    if (
      model &&
      ![
        'claude-sonnet-5-5',
        'claude-haiku-5-5',
        'claude-opus-5-5',
        'claude-3-5-haiku',
        'claude-3-5-sonnet',
        'claude-3-5-opus',
        'claude-3-5-haiku-latest',
        'claude-3-5-sonnet-latest',
        'claude-3-5-opus-latest',
      ].includes(model)
    ) {
      return HttpResponse.json<ErrorResponse>(
        { error_code: 'ERR_INVALID_MODEL_TIER', message: `유효하지 않은 모델 코드입니다: ${model}` },
        { status: 400 }
      );
    }

    // 2) 테스트 트리거 키워드 에러 시뮬레이션
    if (question.includes('[TRIGGER_400]')) {
      return HttpResponse.json<ErrorResponse>(
        { error_code: 'ERR_INVALID_SCOPE_PARAM', message: '유효하지 않은 검색 스코프 모드입니다.' },
        { status: 400 }
      );
    }

    if (question.includes('[TRIGGER_401]') || question.includes('[TRIGGER_CLAUDE_KEY_MISSING]')) {
      return HttpResponse.json<LlmErrorResponse>(
        {
          error_code: 'ERR_CLAUDE_API_KEY_MISSING',
          message: 'Anthropic Claude API 키가 설정되지 않았거나 유효하지 않습니다.',
          status_code: 401,
          provider: 'anthropic',
          retryable: false,
        },
        { status: 401 }
      );
    }

    if (question.includes('[TRIGGER_429]') || question.includes('[TRIGGER_CLAUDE_QUOTA]')) {
      return HttpResponse.json<LlmErrorResponse>(
        {
          error_code: 'ERR_CLAUDE_QUOTA_EXCEEDED',
          message: 'Anthropic Claude API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
          status_code: 429,
          provider: 'anthropic',
          retryable: true,
        },
        { status: 429 }
      );
    }

    if (question.includes('[TRIGGER_529]') || question.includes('[TRIGGER_CLAUDE_OVERLOADED]')) {
      return HttpResponse.json<LlmErrorResponse>(
        {
          error_code: 'ERR_CLAUDE_OVERLOADED',
          message: 'Anthropic Claude 서버가 일시적으로 과부하 상태입니다. 잠시 후 재시도하십시오.',
          status_code: 529,
          provider: 'anthropic',
          retryable: true,
        },
        { status: 529 }
      );
    }

    if (question.includes('[TRIGGER_502]')) {
      return HttpResponse.json<LlmErrorResponse>(
        {
          error_code: 'ERR_LLM_UPSTREAM_FAILED',
          message: '외부 LLM 업스트림 통신에 실패했습니다 (Anthropic Claude API 통신 장애).',
          status_code: 502,
          provider: 'anthropic',
          retryable: true,
        },
        { status: 502 }
      );
    }

    if (question.includes('[TRIGGER_503]')) {
      return HttpResponse.json<LlmErrorResponse>(
        {
          error_code: 'ERR_LLM_PROVIDER_UNAVAILABLE',
          message: '가용한 LLM 프로바이더 엔진이 설정되지 않았습니다 (API 키 미설정).',
          status_code: 503,
          provider: 'none',
          retryable: false,
        },
        { status: 503 }
      );
    }

    if (question.includes('[TRIGGER_500]')) {
      return HttpResponse.json<ErrorResponse>(
        { error_code: 'ERR_SERVER_INTERNAL', message: '백엔드 AI 엔진 내부 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 3) Scoped / Global 소스 인출 및 이원화 출처 구성
    let primarySources: ChatSourceItem[] = [];
    let supplementarySources: ChatSourceItem[] = [];
    let isRelaxed = false;
    let effectiveFilters: ChatFocusFilter | undefined = undefined;

    if (scope === 'scoped') {
      if (!source_id || !mockArticles[source_id]) {
        return HttpResponse.json<ErrorResponse>(
          { error_code: 'ERR_HANDOVER_SOURCE_NOT_FOUND', message: `ID ${source_id}에 해당하는 기사를 찾을 수 없습니다.` },
          { status: 404 }
        );
      }
      const art = mockArticles[source_id];
      primarySources = [
        {
          index: 1,
          type: 'primary',
          id: art.id,
          title: art.title,
          url: art.url,
          source: art.source,
          category: art.category,
          quality_score: art.quality_score,
          snippet: art.summary,
          domain: 'github.com',
          published_at: art.published_at,
        },
      ];
      supplementarySources = [mockSupplementarySources[0]];
    } else {
      const matchedChunks = filterChunksByQuestion(mockSearchChunks, question);
      const filterResult = applyFocusFilters(matchedChunks, filters);
      const candidateList =
        filterResult.filtered.length > 0
          ? filterResult.filtered.slice(0, top_k)
          : applyFocusFilters(mockSearchChunks, filters).filtered.slice(0, top_k);

      primarySources = candidateList.map((s, idx) => ({
        index: idx + 1,
        type: 'primary' as const,
        id: s.id,
        title: s.title,
        url: s.url,
        source: s.source,
        category: s.category,
        quality_score: s.quality_score,
        snippet: s.snippet,
        domain: s.url.includes('github') ? 'github.com' : 'anthropic.com',
        published_at: s.published_at,
      }));
      isRelaxed = filterResult.isRelaxed;
      effectiveFilters = filterResult.appliedFilters;
      supplementarySources = mockSupplementarySources.slice(0, 1);
    }

    const allSources: ChatSourceItem[] = [...primarySources, ...supplementarySources];
    const sessionId = payload.session_id || '7b6a48f2-2973-45f6-8c46-9562725b821a';
    const isMidStreamError = question.includes('[TRIGGER_STREAM_ERROR]');

    const { tier: selectedTier, model: selectedModel, latencyMs, usage: tokenUsage } =
      resolveModelAndUsage(model, model_tier);

    // 4) 4단 구조화 엔지니어링 리포트 마크다운 토큰 조립
    let answerBodyTokens: string[];
    const topPrimaryId = primarySources[0]?.id;
    if (scope === 'scoped' && source_id && mockArticles[source_id]) {
      answerBodyTokens = generateArticleScopedAnswerTokens(mockArticles[source_id], isRelaxed);
    } else if (typeof topPrimaryId === 'number' && mockArticles[topPrimaryId]) {
      answerBodyTokens = generateArticleScopedAnswerTokens(mockArticles[topPrimaryId], isRelaxed);
    } else {
      const answerIntro = isRelaxed
        ? `> 💡 [안내: 선택 조건에 부합하는 소식이 없어 전체 기간으로 확장 검색했습니다]\n\n`
        : '';

      answerBodyTokens = [
        answerIntro,
        '## 1. 핵심 아키텍처 및 동작 원리\n\n',
        `**FastMCP**[1]는 파이썬 데코레이터 문법 기반으로 초경량 Model Context Protocol[S1] 서버를 구축할 수 있도록 설계된 차세대 에이전트 인터페이스 프레임워크입니다.\n`,
        '기존의 복잡한 gRPC나 수동 입출력 파싱 대신 표준 입출력(stdio)과 비동기 Server-Sent Events(SSE) 전송 계층을 추상화하여, Claude Desktop 및 임의의 AI 에이전트 클라이언트와 양방향 툴 바인딩을 지원합니다[1].\n\n',
        '## 2. 주요 기능 및 코드 구현 예시\n\n',
        '데코레이터를 사용하여 초간결하게 툴과 리소스를 노출할 수 있습니다:\n\n',
        '```python\nfrom fastmcp import FastMCP\n\n# FastMCP 서버 인스턴스 초기화\nmcp = FastMCP("AgentLens-Demo", dependencies=["httpx"])\n\n@mcp.tool()\ndef inspect_agent_system(domain: str) -> str:\n    """에이전트 시스템 헬스체크 및 요약 리포트를 생성합니다."""\n    return f"Domain {domain} is fully operational."\n\nif __name__ == "__main__":\n    mcp.run(transport="stdio")\n```\n\n',
        '## 3. 기존 기술 대비 차별점 및 벤치마크\n\n',
        '1. **보일러플레이트 코드 85% 감축**: 단 5줄의 코드로 검증 가능한 JSON-RPC 2.0 프로토콜 엔드포인트를 완성합니다[S1].\n',
        '2. **초당 3,400+ 동시 호출 처리량**: 비동기 AsyncIO 네이티브 이벤트 루프를 채택하여 기존 동기식 Flask/FastAPI 래퍼 대비 3.8배 높은 동시성 처리 성능을 발휘합니다.\n\n',
        '## 4. 실무 도입 시 고려사항 및 튜닝 파라미터\n\n',
        '• **프로덕션 런타임 분리**: 로컬 데스크톱 연동 시 stdio 전송을, 분산 클라우드 환경에서는 ASGI Uvicorn 워커 기반의 SSE 전송 모드를 채택해야 합니다.\n',
        '• **타임아웃 및 버퍼 제어**: 긴 작업을 수행하는 툴의 경우 `timeout_seconds=30` 옵션을 명시하여 에이전트 연결 유실을 방어하십시오.',
      ];
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // [Stage 1: event: status] 4단계 에이전틱 리서치 실시간 진행 통지
        // Step 1.1: extracting_source
        await delay(30);
        controller.enqueue(
          encoder.encode(
            `event: status\ndata: ${JSON.stringify({
              step: 'extracting_source',
              label: '🌐 원본 소스 본문 추출 중 (Trafilatura)...',
              timestamp: new Date().toISOString(),
              progress: 20,
            })}\n\n`
          )
        );

        // Step 1.2: evaluating_sufficiency
        await delay(40);
        controller.enqueue(
          encoder.encode(
            `event: status\ndata: ${JSON.stringify({
              step: 'evaluating_sufficiency',
              label: '🧠 본문 정보 충실도 분석 중...',
              timestamp: new Date().toISOString(),
              progress: 45,
            })}\n\n`
          )
        );

        // Step 1.3: agentic_searching
        await delay(50);
        controller.enqueue(
          encoder.encode(
            `event: status\ndata: ${JSON.stringify({
              step: 'agentic_searching',
              label: '🔍 보충 기술 문서 자율 검색 중: "Model Context Protocol architecture"',
              timestamp: new Date().toISOString(),
              progress: 65,
              query: 'Model Context Protocol architecture',
              sources_found: 1,
            })}\n\n`
          )
        );

        // Step 1.4: synthesizing
        await delay(40);
        controller.enqueue(
          encoder.encode(
            `event: status\ndata: ${JSON.stringify({
              step: 'synthesizing',
              label: '📝 Senior Staff Architect 4단 엔지니어링 리포트 종합 중...',
              timestamp: new Date().toISOString(),
              progress: 85,
            })}\n\n`
          )
        );

        // [Stage 2: event: sources] 이원화 출처 및 필터 정보 전송
        await delay(30);
        const sourcesEvent = `event: sources\ndata: ${JSON.stringify({
          sources: allSources,
          applied_filters: effectiveFilters,
          is_relaxed: isRelaxed,
          primary_count: primarySources.length,
          supplementary_count: supplementarySources.length,
        })}\n\n`;
        controller.enqueue(encoder.encode(sourcesEvent));

        // 미드스트림 에러 트리거 시뮬레이션
        if (isMidStreamError) {
          await delay(30);
          controller.enqueue(
            encoder.encode(`event: token\ndata: ${JSON.stringify({ token: '## 1. 핵심 아키텍처 및 동작 원리\n\n' })}\n\n`)
          );
          await delay(50);
          const errorEvent = `event: error\ndata: ${JSON.stringify({
            error_code: 'ERR_LLM_STREAM_FAILED',
            message: '외부 LLM 스트리밍 중 통신 연결이 단절되었습니다.',
            status_code: 502,
            step: 'synthesizing',
            provider: 'anthropic',
            retryable: true,
          })}\n\n`;
          controller.enqueue(encoder.encode(errorEvent));
          controller.close();
          return;
        }

        // [Stage 3: event: token] 4단 마크다운 리포트 순차 토큰 전송
        for (const token of answerBodyTokens) {
          await delay(25);
          const tokenEvent = `event: token\ndata: ${JSON.stringify({ token })}\n\n`;
          controller.enqueue(encoder.encode(tokenEvent));
        }

        // [Stage 4: event: done] 스트리밍 완료 및 통계 전송
        await delay(40);
        const doneEvent = `event: done\ndata: ${JSON.stringify({
          done: true,
          session_id: sessionId,
          model: selectedModel,
          model_tier: selectedTier,
          sources_count: allSources.length,
          primary_count: primarySources.length,
          supplementary_count: supplementarySources.length,
          latency_ms: latencyMs,
          usage: tokenUsage,
        })}\n\n`;
        controller.enqueue(encoder.encode(doneEvent));

        // [Stage 5: Dual-Layer SQLite 영속화 시뮬레이션]
        try {
          const userMsgItem: ChatMessageItem = {
            id: crypto.randomUUID(),
            session_id: sessionId,
            role: 'user',
            content: question,
            created_at: new Date().toISOString(),
            sources: null,
            status: 'completed',
            model: null,
            model_tier: null,
            latency_ms: null,
            usage: null,
          };
          const assistantMsgItem: ChatMessageItem = {
            id: crypto.randomUUID(),
            session_id: sessionId,
            role: 'assistant',
            content: answerBodyTokens.join(''),
            created_at: new Date().toISOString(),
            sources: allSources,
            status: 'completed',
            model: selectedModel,
            model_tier: selectedTier,
            latency_ms: latencyMs,
            usage: tokenUsage,
          };

          const targetSession = mockSessionStore.find((s) => s.id === sessionId);
          if (targetSession) {
            targetSession.messages.push(userMsgItem, assistantMsgItem);
            targetSession.updated_at = new Date().toISOString();
            if (targetSession.title === '새 대화' || !targetSession.title) {
              targetSession.title = generateAutoTitle(question);
            }
          } else {
            if (mockSessionStore.length >= 30) {
              mockSessionStore.sort(
                (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
              );
              mockSessionStore.shift();
            }
            mockSessionStore.unshift({
              id: sessionId,
              title: generateAutoTitle(question),
              scope_mode: scope,
              active_source_id: source_id || null,
              active_source: source_id ? mockArticles[source_id] || null : null,
              active_filters: effectiveFilters || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              messages: [userMsgItem, assistantMsgItem],
            });
          }
        } catch {
          // 모의 스트림 내부 영속화 실패는 무시
        }

        controller.close();
      },
    });

    return new HttpResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }),

  // ==========================================================================
  // 2. 전용 AI 챗 동기식 단건 질의 모의 응답 핸들러 (POST /api/chat/query)
  // ==========================================================================
  http.post('*/api/chat/query', async ({ request }) => {
    let body: ChatQueryRequest;
    try {
      body = (await request.json()) as ChatQueryRequest;
    } catch {
      return HttpResponse.json<ErrorResponse>(
        { error_code: 'ERR_INVALID_PAYLOAD', message: '요청 본문 형식이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    if (!body.question || body.question.trim().length === 0) {
      return HttpResponse.json<ErrorResponse>(
        { error_code: 'ERR_CHAT_PAYLOAD_EMPTY', message: '질문 본문이 비어있습니다.' },
        { status: 400 }
      );
    }

    if (body.model_tier && !['haiku', 'sonnet', 'opus'].includes(body.model_tier)) {
      return HttpResponse.json<ErrorResponse>(
        { error_code: 'ERR_INVALID_MODEL_TIER', message: `유효하지 않은 모델 티어입니다: ${body.model_tier}` },
        { status: 400 }
      );
    }

    if (
      body.model &&
      ![
        'claude-sonnet-5-5',
        'claude-haiku-5-5',
        'claude-opus-5-5',
        'claude-3-5-haiku',
        'claude-3-5-sonnet',
        'claude-3-5-opus',
        'claude-3-5-haiku-latest',
        'claude-3-5-sonnet-latest',
        'claude-3-5-opus-latest',
      ].includes(body.model)
    ) {
      return HttpResponse.json<ErrorResponse>(
        { error_code: 'ERR_INVALID_MODEL_TIER', message: `유효하지 않은 모델 코드입니다: ${body.model}` },
        { status: 400 }
      );
    }

    if (body.question.includes('[TRIGGER_401]') || body.question.includes('[TRIGGER_CLAUDE_KEY_MISSING]')) {
      return HttpResponse.json<LlmErrorResponse>(
        {
          error_code: 'ERR_CLAUDE_API_KEY_MISSING',
          message: 'Anthropic Claude API 키가 누락되었거나 비활성 상태입니다.',
          status_code: 401,
          provider: 'anthropic',
          retryable: false,
        },
        { status: 401 }
      );
    }

    if (body.question.includes('[TRIGGER_429]') || body.question.includes('[TRIGGER_CLAUDE_QUOTA]')) {
      return HttpResponse.json<LlmErrorResponse>(
        {
          error_code: 'ERR_CLAUDE_QUOTA_EXCEEDED',
          message: '외부 LLM API 호출 한도를 초과했습니다.',
          status_code: 429,
          provider: 'anthropic',
          retryable: true,
        },
        { status: 429 }
      );
    }

    if (body.question.includes('[TRIGGER_529]') || body.question.includes('[TRIGGER_CLAUDE_OVERLOADED]')) {
      return HttpResponse.json<LlmErrorResponse>(
        {
          error_code: 'ERR_CLAUDE_OVERLOADED',
          message: 'Anthropic Claude 업스트림 서버가 과부하 상태입니다.',
          status_code: 529,
          provider: 'anthropic',
          retryable: true,
        },
        { status: 529 }
      );
    }

    if (body.question.includes('[TRIGGER_502]')) {
      return HttpResponse.json<LlmErrorResponse>(
        {
          error_code: 'ERR_LLM_UPSTREAM_FAILED',
          message: '외부 LLM 업스트림 통신에 실패했습니다.',
          status_code: 502,
          provider: 'anthropic',
          retryable: true,
        },
        { status: 502 }
      );
    }

    if (body.question.includes('[TRIGGER_503]')) {
      return HttpResponse.json<LlmErrorResponse>(
        {
          error_code: 'ERR_LLM_PROVIDER_UNAVAILABLE',
          message: '가용한 LLM 프로바이더 엔진이 설정되지 않았습니다.',
          status_code: 503,
          provider: 'none',
          retryable: false,
        },
        { status: 503 }
      );
    }

    await delay(120);

    const sessionId = body.session_id || '7b6a48f2-2973-45f6-8c46-9562725b821a';
    const isScoped = body.scope === 'scoped' && body.source_id;

    const { tier: selectedTier, model: selectedModel, latencyMs, usage: tokenUsage } =
      resolveModelAndUsage(body.model, body.model_tier);

    let primarySources: ChatSourceItem[] = [];
    let isRelaxed = false;
    let effectiveFilters: ChatFocusFilter | undefined = undefined;

    if (isScoped && mockArticles[body.source_id!]) {
      const art = mockArticles[body.source_id!];
      primarySources = [
        {
          index: 1,
          type: 'primary',
          id: art.id,
          title: art.title,
          url: art.url,
          source: art.source,
          category: art.category,
          quality_score: art.quality_score,
          snippet: art.summary,
          published_at: art.published_at,
        },
      ];
    } else {
      const matchedChunks = filterChunksByQuestion(mockSearchChunks, body.question);
      const filterResult = applyFocusFilters(matchedChunks, body.filters);
      const candidateList =
        filterResult.filtered.length > 0
          ? filterResult.filtered.slice(0, body.top_k || 5)
          : applyFocusFilters(mockSearchChunks, body.filters).filtered.slice(0, body.top_k || 5);

      primarySources = candidateList.map((s, idx) => ({
        index: idx + 1,
        type: 'primary' as const,
        id: s.id,
        title: s.title,
        url: s.url,
        source: s.source,
        category: s.category,
        quality_score: s.quality_score,
        snippet: s.snippet,
        published_at: s.published_at,
      }));
      isRelaxed = filterResult.isRelaxed;
      effectiveFilters = filterResult.appliedFilters;
    }

    const supplementarySources = mockSupplementarySources.slice(0, 1);
    const allSources = [...primarySources, ...supplementarySources];

    const responseData: ChatQueryResponse = {
      answer: `## 1. 핵심 아키텍처 및 동작 원리\n\n질문 "${body.question}"에 대한 4단 엔지니어링 분석 결과입니다. FastMCP[1]와 Model Context Protocol[S1]을 결합하면 안정적인 멀티에이전트 워크플로우를 구성할 수 있습니다.`,
      sources: allSources,
      session_id: sessionId,
      model: selectedModel,
      model_tier: selectedTier,
      scope: body.scope || 'global',
      applied_filters: effectiveFilters,
      is_relaxed: isRelaxed,
      primary_count: primarySources.length,
      supplementary_count: supplementarySources.length,
      latency_ms: latencyMs,
      usage: tokenUsage,
    };

    return HttpResponse.json(responseData, { status: 200 });
  }),

  // ==========================================================================
  // 3. 컨텍스트 핸드오버용 기사 상세 메타데이터 조회 핸들러 (GET /api/chat/sources/:source_id)
  // ==========================================================================
  http.get('*/api/chat/sources/:source_id', async ({ params }) => {
    const sourceId = Number(params.source_id);

    const article = mockArticles[sourceId];
    if (!article) {
      return HttpResponse.json(
        {
          error_code: 'ERR_HANDOVER_SOURCE_NOT_FOUND',
          message: `기사 ID ${sourceId}를 데이터베이스에서 찾을 수 없습니다.`,
        },
        { status: 404 }
      );
    }

    return HttpResponse.json(article, { status: 200 });
  }),

  // ==========================================================================
  // 4. 코퍼스 지식 검색 프리뷰 모의 핸들러 (GET /api/chat/search)
  // ==========================================================================
  http.get('*/api/chat/search', async ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q');
    const topK = Number(url.searchParams.get('top_k') || '5');
    const minQuality = Number(url.searchParams.get('min_quality') || '5.0');
    const category = url.searchParams.get('category') || 'all';
    const timeRange = url.searchParams.get('time_range') || 'all';
    const sort = url.searchParams.get('sort') || 'hot';
    const highSignalOnly = url.searchParams.get('high_signal_only') === 'true';

    if (!q || q.trim().length < 2) {
      return HttpResponse.json<ErrorResponse>(
        {
          error_code: 'ERR_SEARCH_QUERY_TOO_SHORT',
          message: '검색어는 최소 2글자 이상이어야 합니다.',
        },
        { status: 400 }
      );
    }

    await delay(50);

    let filtered = mockSearchChunks.filter(
      (c) =>
        c.title.toLowerCase().includes(q.toLowerCase()) ||
        c.snippet.toLowerCase().includes(q.toLowerCase())
    );

    filtered = filtered.filter((c) => c.quality_score >= minQuality);

    if (category !== 'all') {
      filtered = filtered.filter((c) => c.category === category);
    }

    if (highSignalOnly) {
      filtered = filtered.filter((c) => c.quality_score >= 7.8);
    }

    filtered.sort((a, b) => {
      if (sort === 'latest') {
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      }
      if (sort === 'quality') {
        return b.quality_score - a.quality_score;
      }
      return b.rag_score - a.rag_score;
    });

    const responseData: ChatSearchResponse = {
      query: q,
      total_matches: filtered.length,
      chunks: filtered.slice(0, topK).map((c, idx) => ({ ...c, index: idx + 1 })),
      latency_ms: 18,
    };

    return HttpResponse.json(responseData, { status: 200 });
  }),

  // ==========================================================================
  // 5. 대화 세션 목록 조회 모의 핸들러 (GET /api/chat/sessions)
  // ==========================================================================
  http.get('*/api/chat/sessions', async ({ request }) => {
    const url = new URL(request.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || '30'), 1), 50);
    const offset = Math.max(Number(url.searchParams.get('offset') || '0'), 0);

    // 에러 트리거 시뮬레이션
    if (url.searchParams.get('trigger_error') === '500' || url.searchParams.get('q') === '[TRIGGER_500]') {
      return HttpResponse.json<ErrorResponse>(
        {
          error_code: 'ERR_SERVER_INTERNAL',
          message: '세션 목록 인출 중 데이터베이스 내부 오류가 발생했습니다.',
        },
        { status: 500 }
      );
    }

    await delay(20);

    // updated_at DESC 정렬
    const sorted = [...mockSessionStore].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    const summaries: ChatSessionSummary[] = sorted.slice(offset, offset + limit).map((s) => ({
      id: s.id,
      title: s.title,
      created_at: s.created_at,
      updated_at: s.updated_at,
      scope_mode: s.scope_mode,
      active_source_id: s.active_source_id,
      message_count: s.messages.length,
      last_message_preview:
        s.messages.length > 0 ? s.messages[s.messages.length - 1].content.slice(0, 100) : null,
      active_filters: s.active_filters,
    }));

    return HttpResponse.json(summaries, { status: 200 });
  }),

  // ==========================================================================
  // 6. 대화 세션 생성 또는 업서트 모의 핸들러 (POST /api/chat/sessions)
  // ==========================================================================
  http.post('*/api/chat/sessions', async ({ request }) => {
    let body: ChatSessionCreateRequest;
    try {
      body = (await request.json()) as ChatSessionCreateRequest;
    } catch {
      return HttpResponse.json<ErrorResponse>(
        {
          error_code: 'ERR_SESSION_INVALID_UUID',
          message: '요청 본문 JSON 형식이 올바르지 않습니다.',
        },
        { status: 400 }
      );
    }

    // 에러 트리거 키워드 검증
    if (body.title?.includes('[TRIGGER_400]')) {
      return HttpResponse.json<ErrorResponse>(
        {
          error_code: 'ERR_SESSION_INVALID_UUID',
          message: '유효하지 않은 세션 UUID 형식이거나 파라미터 규격 오류입니다.',
        },
        { status: 400 }
      );
    }

    if (body.title?.includes('[TRIGGER_500]')) {
      return HttpResponse.json<ErrorResponse>(
        {
          error_code: 'ERR_SESSION_CREATE_FAILED',
          message: '데이터베이스 세션 트랜잭션 커밋에 실패했습니다.',
        },
        { status: 500 }
      );
    }

    await delay(30);

    const sessionId = body.id || crypto.randomUUID();
    const existingIndex = mockSessionStore.findIndex((s) => s.id === sessionId);

    if (existingIndex >= 0) {
      // 기존 세션 업서트
      const existing = mockSessionStore[existingIndex];
      const updated: ChatSessionDetail = {
        ...existing,
        title: body.title || existing.title,
        scope_mode: body.scope_mode || existing.scope_mode,
        active_source_id:
          body.active_source_id !== undefined ? body.active_source_id : existing.active_source_id,
        active_source:
          body.active_source_id && mockArticles[body.active_source_id]
            ? mockArticles[body.active_source_id]
            : existing.active_source,
        active_filters:
          body.active_filters !== undefined ? body.active_filters : existing.active_filters,
        updated_at: new Date().toISOString(),
        messages: body.messages || existing.messages,
      };
      mockSessionStore[existingIndex] = updated;
      return HttpResponse.json(updated, { status: 201 });
    }

    // 신규 세션 생성 시 FIFO 30개 자동 축출
    if (mockSessionStore.length >= 30) {
      mockSessionStore.sort(
        (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      );
      mockSessionStore.shift();
    }

    const newSession: ChatSessionDetail = {
      id: sessionId,
      title: body.title || '새 대화',
      scope_mode: body.scope_mode || 'global',
      active_source_id: body.active_source_id || null,
      active_source: body.active_source_id ? mockArticles[body.active_source_id] || null : null,
      active_filters: body.active_filters || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: body.messages || [],
    };

    mockSessionStore.unshift(newSession);
    return HttpResponse.json(newSession, { status: 201 });
  }),

  // ==========================================================================
  // 7. 대화 세션 상세 및 전체 메시지 이력 조회 모의 핸들러 (GET /api/chat/sessions/:session_id)
  // ==========================================================================
  http.get('*/api/chat/sessions/:session_id', async ({ params }) => {
    const sessionId = String(params.session_id);

    if (sessionId.includes('[TRIGGER_500]')) {
      return HttpResponse.json<ErrorResponse>(
        {
          error_code: 'ERR_SERVER_INTERNAL',
          message: '세션 상세 인출 중 데이터베이스 내부 예외가 발생했습니다.',
        },
        { status: 500 }
      );
    }

    if (
      sessionId.includes('[TRIGGER_404]') ||
      sessionId === '00000000-0000-0000-0000-000000000000'
    ) {
      return HttpResponse.json<ErrorResponse>(
        {
          error_code: 'ERR_SESSION_NOT_FOUND',
          message: `ID ${sessionId}에 해당하는 대화 세션을 찾을 수 없습니다.`,
        },
        { status: 404 }
      );
    }

    await delay(20);

    const session = mockSessionStore.find((s) => s.id === sessionId);
    if (!session) {
      return HttpResponse.json<ErrorResponse>(
        {
          error_code: 'ERR_SESSION_NOT_FOUND',
          message: `ID ${sessionId}에 해당하는 대화 세션을 찾을 수 없습니다.`,
        },
        { status: 404 }
      );
    }

    // 시간순(created_at ASC) 정렬 보장
    const sortedMessages = [...session.messages].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const detail: ChatSessionDetail = {
      ...session,
      messages: sortedMessages,
    };

    return HttpResponse.json(detail, { status: 200 });
  }),

  // ==========================================================================
  // 8. 대화 세션 및 연관 메시지 원자적 CASCADE 삭제 모의 핸들러 (DELETE /api/chat/sessions/:session_id)
  // ==========================================================================
  http.delete('*/api/chat/sessions/:session_id', async ({ params }) => {
    const sessionId = String(params.session_id);

    if (sessionId.includes('[TRIGGER_500]')) {
      return HttpResponse.json<ErrorResponse>(
        {
          error_code: 'ERR_SESSION_DELETE_FAILED',
          message: '데이터베이스 CASCADE 삭제 트랜잭션 처리에 실패했습니다.',
        },
        { status: 500 }
      );
    }

    if (
      sessionId.includes('[TRIGGER_404]') ||
      sessionId === '00000000-0000-0000-0000-000000000000'
    ) {
      return HttpResponse.json<ErrorResponse>(
        {
          error_code: 'ERR_SESSION_NOT_FOUND',
          message: `ID ${sessionId}에 해당하는 세션을 찾을 수 없습니다.`,
        },
        { status: 404 }
      );
    }

    await delay(30);

    const index = mockSessionStore.findIndex((s) => s.id === sessionId);
    if (index === -1) {
      return HttpResponse.json<ErrorResponse>(
        {
          error_code: 'ERR_SESSION_NOT_FOUND',
          message: `ID ${sessionId}에 해당하는 세션을 찾을 수 없습니다.`,
        },
        { status: 404 }
      );
    }

    mockSessionStore.splice(index, 1);

    const response: GenericSuccessResponse = {
      status: 'success',
      message: '대화 세션 및 하위 메시지가 원자적으로 영구 삭제되었습니다.',
      deleted_count: 1,
    };

    return HttpResponse.json(response, { status: 200 });
  }),
];

export const handlers = [...chatHandlers];
