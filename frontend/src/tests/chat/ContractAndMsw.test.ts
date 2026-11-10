import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import { server } from '@/mocks/server';
import {
  CHAT_MESSAGE_ID_MAX_LENGTH,
  ChatFocusFilterSchema,
  ChatStreamRequestSchema,
  ChatStatusStepSchema,
  ChatStatusPayloadSchema,
  ChatSourceItemSchema,
  ChatSourcesPayloadSchema,
  ApiErrorCodeSchema,
  ErrorResponseSchema,
  ValidationErrorItemSchema,
  ChatSessionSummarySchema,
  ChatMessageItemSchema,
  ChatSessionDetailSchema,
  ChatSessionCreateRequestSchema,
  GenericSuccessResponseSchema,
  parseChatSseEvent,
  toChatFocusFilter,
  fromChatFocusFilter,
  DEFAULT_FOCUS_FILTERS,
  generateAutoTitle,
  applySlidingWindow,
  chatMessageItemToUiMessage,
  uiMessageToChatMessageItem,
  ChatMessageItem,
  SendMessageRequestSchema,
  ModelTierSchema,
  ChatModelSchema,
  TokenUsageMetaSchema,
  ChatDonePayloadSchema,
  DEFAULT_CHAT_MODEL,
  DEFAULT_MODEL_TIER,
  CLAUDE_MODELS,
  TIER_TO_MODEL,
  MODEL_TO_TIER,
  TokenUsageMeta,
  ChatModelSelectorProps,
  ModelTierBadgeProps,
  ModelChangeDividerProps,
  ModelSwitchEvent,
  ChatTimelineItem,
  ChatSessionSummary,
  sanitizeModelTier,
  formatModelDisplayName,
  getModelLabel,
} from '@/types/chat';
import {
  NewsItem,
  NewsItemSchema,
  NewsListResponseSchema,
  SourceConfigSchema,
  SourcesResponseSchema,
} from '@/types/news';
import { resetMockSessionStore } from '@/mocks/handlers';
import { mockArticles, mockSearchChunks, initialMockSessions } from '@/mocks/fixtures/chat';
import { handlers, mockNewsItems, mockDailyBriefing, mockSourcesResponse, mockStatsResponse } from '@/mocks/handlers';
import {
  ChatSourceDetailResponseSchema,
  ChatSearchChunkSchema,
  ChatStreamErrorPayloadSchema,
  SseTokenPayloadSchema,
} from '@/types/chat';
import {
  DailyBriefingSchema,
  StatsResponseSchema,
  BriefingCategoryItemSchema,
  CrawlProgressSchema,
  ResearchStatusSchema,
  InspectUrlResponseSchema,
  ManualCollectResponseSchema,
  RunDeepResearchResponseSchema,
  NotionExportResponseSchema,
} from '@/types/news';
import { TrendingTagSchema } from '@/types/trends';
import { parseResponse, readErrorMessage, parseChatSsePayload, parseNewsAskSsePayload } from '@/lib/contract';
import { ScheduleStatusSchema, ResearchAuditLogSchema } from '@/types/news';
import { ChatMessageSchema } from '@/types/chat';
import { askQuestionAboutNewsStream, triggerManualCollect } from '@/lib/api';
import { mockTriggerResponses } from '@/mocks/handlers';
import { fetchNewsFeed, addRssSource, fetchSources, fetchBriefingSettings } from '@/lib/api';

describe('Stage 2d & Stage 2a Contract & Mock Integration Verification (v2.6)', () => {
  beforeEach(() => {
    resetMockSessionStore();
  });
  describe('ChatFocusFilterSchema & Helpers', () => {
    it('applies standard defaults when empty object is passed', () => {
      const parsed = ChatFocusFilterSchema.parse({});
      expect(parsed).toEqual({
        category: 'all',
        time_range: 'all',
        sort: 'hot',
        high_signal_only: false,
      });
    });

    it('validates proper category, time_range, sort, and high_signal_only', () => {
      const input = {
        category: 'mcp_plugins_skills',
        time_range: '7d',
        sort: 'quality',
        high_signal_only: true,
      };
      const parsed = ChatFocusFilterSchema.parse(input);
      expect(parsed).toEqual(input);
    });

    it('converts between UI camelCase FocusFilters and API snake_case ChatFocusFilter', () => {
      const ui = {
        category: 'agent_tech' as const,
        timeRange: '24h' as const,
        sort: 'latest' as const,
        highSignalOnly: true,
      };

      const api = toChatFocusFilter(ui);
      expect(api).toEqual({
        category: 'agent_tech',
        time_range: '24h',
        sort: 'latest',
        high_signal_only: true,
      });

      const convertedBack = fromChatFocusFilter(api);
      expect(convertedBack).toEqual(ui);

      expect(fromChatFocusFilter(null)).toEqual(DEFAULT_FOCUS_FILTERS);
    });
  });

  describe('Agentic Research Steps & Status Contracts (v2.4)', () => {
    it('validates the 4 step values backend streams and rejects the 3 it never sends (v1.4)', () => {
      const steps = ['thinking', 'tool_calling', 'extracting_source', 'synthesizing'] as const;
      steps.forEach((step) => {
        expect(ChatStatusStepSchema.parse(step)).toBe(step);
      });
      for (const never of ['observing', 'evaluating_sufficiency', 'agentic_searching']) {
        expect(ChatStatusStepSchema.safeParse(never).success, never).toBe(false);
      }
    });

    it('validates ChatStatusPayload schema with optional query and progress', () => {
      const payload = {
        step: 'tool_calling' as const,
        label: "Action: search_news_corpus('FastMCP python documentation') 실행 중...",
        timestamp: '2026-09-16T09:40:03+00:00',
        progress: 65,
        query: 'FastMCP python documentation',
        sources_found: 2,
      };

      const parsed = ChatStatusPayloadSchema.parse(payload);
      expect(parsed.step).toBe('tool_calling');
      expect(parsed.progress).toBe(65);
      expect(parsed.query).toBe('FastMCP python documentation');
    });
  });

  describe('Dual Source Items & Sources Payload Contracts (v2.4)', () => {
    it('validates primary source with numeric index', () => {
      const primary = {
        index: 1,
        type: 'primary' as const,
        id: 101,
        title: 'FastMCP Framework',
        url: 'https://github.com/jlowin/fastmcp',
        source: 'github',
        quality_score: 9.3,
      };

      const parsed = ChatSourceItemSchema.parse(primary);
      expect(parsed.type).toBe('primary');
      expect(parsed.index).toBe(1);
    });

    it('validates supplementary source with string index like S1', () => {
      const supplementary = {
        index: 'S1',
        type: 'supplementary' as const,
        title: 'MCP Specification',
        url: 'https://modelcontextprotocol.io',
        source: 'web_search',
        domain: 'modelcontextprotocol.io',
        score: 0.95,
      };

      const parsed = ChatSourceItemSchema.parse(supplementary);
      expect(parsed.type).toBe('supplementary');
      expect(parsed.index).toBe('S1');
    });

    it('validates ChatSourcesPayload with dual sources and counts', () => {
      const payload = {
        sources: [
          {
            index: 1,
            type: 'primary' as const,
            id: 101,
            title: 'FastMCP',
            url: 'https://github.com/jlowin/fastmcp',
            source: 'github',
          },
          {
            index: 'S1',
            type: 'supplementary' as const,
            title: 'MCP Spec',
            url: 'https://modelcontextprotocol.io',
            source: 'web_search',
          },
        ],
        primary_count: 1,
        supplementary_count: 1,
        is_relaxed: false,
      };

      const parsed = ChatSourcesPayloadSchema.parse(payload);
      expect(parsed.primary_count).toBe(1);
      expect(parsed.supplementary_count).toBe(1);
      expect(parsed.sources.length).toBe(2);
    });
  });

  describe('SSE Multi-Event Parser Utility (v2.4)', () => {
    it('correctly parses event: status', () => {
      const rawData = JSON.stringify({
        step: 'extracting_source',
        label: '🌐 원본 소스 본문 추출 중...',
        timestamp: '2026-09-16T09:40:01Z',
        progress: 20,
      });

      const parsed = parseChatSseEvent('status', rawData);
      expect(parsed).not.toBeNull();
      expect(parsed?.event).toBe('status');
      if (parsed?.event === 'status') {
        expect(parsed.data.step).toBe('extracting_source');
        expect(parsed.data.progress).toBe(20);
      }
    });

    it('correctly parses event: sources', () => {
      const rawData = JSON.stringify({
        sources: [
          {
            index: 1,
            type: 'primary',
            title: 'FastMCP',
            url: 'https://github.com/jlowin/fastmcp',
            source: 'github',
          },
        ],
        primary_count: 1,
        supplementary_count: 0,
        is_relaxed: false,
      });

      const parsed = parseChatSseEvent('sources', rawData);
      expect(parsed).not.toBeNull();
      expect(parsed?.event).toBe('sources');
      if (parsed?.event === 'sources') {
        expect(parsed.data.sources.length).toBe(1);
      }
    });

    it('returns null for unparseable or unknown events', () => {
      expect(parseChatSseEvent('unknown_event', '{}')).toBeNull();
      expect(parseChatSseEvent('status', 'invalid-json')).toBeNull();
    });
  });

  describe('Common Error Response Contract (v1.3, D-27·D-31)', () => {
    it('ApiErrorCodeSchema lists the codes backend emits, including ERR_INVALID_PAYLOAD', () => {
      const codes = [
        'ERR_INVALID_PAYLOAD',
        'ERR_NOT_FOUND',
        'ERR_METHOD_NOT_ALLOWED',
        'ERR_CONFLICT',
        'ERR_SERVER_INTERNAL',
        'ERR_UPSTREAM_FAILED',
        'ERR_SERVICE_UNAVAILABLE',
        'ERR_LLM_PROVIDER_UNAVAILABLE',
        'ERR_LLM_UPSTREAM_FAILED',
        'ERR_LLM_STREAM_FAILED',
        'ERR_LLM_QUOTA_EXCEEDED',
        'ERR_CLAUDE_API_KEY_MISSING',
      ] as const;
      codes.forEach((code) => expect(ApiErrorCodeSchema.parse(code)).toBe(code));
    });

    it('ApiErrorCodeSchema drops codes backend never emits', () => {
      for (const code of [
        'ERR_CHAT_STREAM_TIMEOUT',
        'ERR_SESSION_LIMIT_EXCEEDED',
        'ERR_INVALID_FILTER_PARAM',
        'ERR_ARTICLE_EXTRACTION_FAIL',
        'ERR_STREAM_ABORTED_BY_USER',
        'ERR_SONNET_SCHEMA_VALIDATION',
        'ERR_ANTHROPIC_KEY_MISSING',
        'ERR_ANTHROPIC_RATE_LIMIT',
        'ERR_ANTHROPIC_OVERLOADED',
        'ERR_INVALID_PAGE_PARAM',
        'ERR_FEED_FETCH_FAILED',
        'ERR_FEED_CARD_NOT_FOUND',
      ]) {
        expect(ApiErrorCodeSchema.safeParse(code).success).toBe(false);
      }
    });

    it('ErrorResponseSchema accepts {error_code, message, details} with details object, array or null', () => {
      expect(
        ErrorResponseSchema.parse({ error_code: 'ERR_NOT_FOUND', message: '기사를 찾을 수 없습니다.', details: null }).details
      ).toBeNull();
      const validation = ErrorResponseSchema.parse({
        error_code: 'ERR_INVALID_PAYLOAD',
        message: '요청 값 형식이 올바르지 않습니다.',
        details: [{ loc: ['query', 'page'], msg: 'Input should be greater than or equal to 1' }],
      });
      expect(Array.isArray(validation.details)).toBe(true);
      expect(
        ErrorResponseSchema.parse({ error_code: 'ERR_SERVER_INTERNAL', message: '서버 오류', details: { hint: 'x' } }).details
      ).toEqual({ hint: 'x' });
    });

    it('ErrorResponseSchema rejects the old shapes (detail string, 422 detail array, missing details)', () => {
      expect(ErrorResponseSchema.safeParse({ detail: 'News item not found' }).success).toBe(false);
      expect(ErrorResponseSchema.safeParse({ detail: [{ type: 'missing', loc: ['query'], msg: 'x' }] }).success).toBe(false);
      expect(
        ErrorResponseSchema.safeParse({ detail: 'Internal server error occurred.', error: 'boom' }).success
      ).toBe(false);
      expect(ErrorResponseSchema.safeParse({ error_code: 'ERR_NOT_FOUND', message: '없음' }).success).toBe(false);
      expect(
        ErrorResponseSchema.safeParse({ error_code: 'not_an_error_code', message: '없음', details: null }).success
      ).toBe(false);
    });

    it('MSW error responses all match ErrorResponseSchema and use catalog codes', async () => {
      const requests: [string, RequestInit?][] = [
        ['/api/news?page=0'],
        ['/api/news?size=101'],
        ['/api/news?trigger_error=500'],
        ['/api/news/999999/ask/stream', { method: 'POST', body: JSON.stringify({ question: 'q' }) }],
        ['/api/news/abc/ask/stream', { method: 'POST', body: JSON.stringify({ question: 'q' }) }],
        ['/api/chat/sources/999999'],
        ['/api/chat/sessions?limit=0'],
        ['/api/chat/sessions/00000000-0000-0000-0000-000000000000'],
        ['/api/chat/stream', { method: 'POST', body: 'not-json' }],
        ['/api/chat/stream', { method: 'POST', body: JSON.stringify({ question: 'q', scope: 'nope' }) }],
        ['/api/chat/stream', { method: 'POST', body: JSON.stringify({ question: 'q', top_k: 99 }) }],
        ['/api/chat/stream', { method: 'POST', body: JSON.stringify({ question: '[TRIGGER_503]' }) }],
        ['/api/chat/sessions', { method: 'POST', body: '{' }],
        ['/api/chat/sessions', { method: 'POST', body: JSON.stringify({ id: 'not-a-uuid' }) }],
      ];
      for (const [url, init] of requests) {
        const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
        expect(res.ok, url).toBe(false);
        const body = await res.json();
        expect(ErrorResponseSchema.safeParse(body).success, `${url} ${JSON.stringify(body)}`).toBe(true);
        expect(ApiErrorCodeSchema.safeParse(body.error_code).success, body.error_code).toBe(true);
      }
    });

    it('MSW maps request validation failures to 400 ERR_INVALID_PAYLOAD with [{loc, msg}] details (no 422)', async () => {
      const res = await fetch('/api/news?page=0');
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error_code).toBe('ERR_INVALID_PAYLOAD');
      expect(ValidationErrorItemSchema.array().parse(body.details)[0].loc).toEqual(['query', 'page']);
    });

    it('ERR_CLAUDE_API_KEY_MISSING is 401 (not 503) and carries no provider/retryable fields', async () => {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: '[TRIGGER_401]' }),
      });
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(Object.keys(body).sort()).toEqual(['details', 'error_code', 'message']);
      expect(body.error_code).toBe('ERR_CLAUDE_API_KEY_MISSING');
    });
  });

  describe('MSW Network Interception Endpoints (v2.4)', () => {
    it('handles POST /api/chat/stream 502 error trigger', async () => {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: '[TRIGGER_502]' }),
      });

      expect(res.status).toBe(502);
      const data = await res.json();
      expect(data.error_code).toBe('ERR_LLM_UPSTREAM_FAILED');
    });

    it('handles POST /api/chat/stream 503 error trigger', async () => {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: '[TRIGGER_503]' }),
      });

      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.error_code).toBe('ERR_LLM_PROVIDER_UNAVAILABLE');
    });

  });

  describe('Chat Session Persistence Schemas & Governance Helpers (v2.6)', () => {
    it('validates ChatSessionSummarySchema correctly', () => {
      const summary = {
        id: '7b6a48f2-2973-45f6-8c46-9562725b821a',
        title: 'LangGraph v0.2 아키텍처 분석',
        created_at: '2026-09-28T08:00:00Z',
        updated_at: '2026-09-28T08:15:30Z',
        scope_mode: 'scoped',
        active_source_id: 102,
        message_count: 2,
        last_message_preview: 'LangGraph v0.2는 분산 상태 머신을...',
        active_filters: null,
      };

      const parsed = ChatSessionSummarySchema.parse(summary);
      expect(parsed.id).toBe(summary.id);
      expect(parsed.scope_mode).toBe('scoped');
      expect(parsed.message_count).toBe(2);
    });

    it('accepts a non-UUID session id and a long title like backend (CT-018: stream session_id is not validated)', () => {
      const parsed = ChatSessionSummarySchema.parse({
        id: 'session-made-by-stream',
        title: 'T'.repeat(150),
        created_at: '2026-09-28T08:00:00Z',
        updated_at: '2026-09-28T08:15:30Z',
        scope_mode: 'global',
      });
      expect(parsed.id).toBe('session-made-by-stream');
      // Pydantic message_count 기본값 0
      expect(parsed.message_count).toBe(0);
      // scope_mode 는 여전히 Literal 이다
      expect(
        ChatSessionSummarySchema.safeParse({ ...parsed, scope_mode: 'everything' }).success
      ).toBe(false);
    });

    it('validates ChatMessageItemSchema id as a string like Pydantic (numbers are rejected)', () => {
      const rawItem = {
        id: 'msg-user-abc1234',
        session_id: '7b6a48f2-2973-45f6-8c46-9562725b821a',
        role: 'user',
        content: '질문입니다',
        created_at: '2026-09-28T08:00:00Z',
      };

      const parsed = ChatMessageItemSchema.parse(rawItem);
      expect(parsed.id).toBe('msg-user-abc1234');
      expect(parsed.status).toBe('completed');
      expect(ChatMessageItemSchema.safeParse({ ...rawItem, id: 12345 }).success).toBe(false);
    });

    it('validates ChatSessionDetailSchema with full message history', () => {
      const detail = {
        id: '7b6a48f2-2973-45f6-8c46-9562725b821a',
        title: '대화 세션 상세',
        created_at: '2026-09-28T08:00:00Z',
        updated_at: '2026-09-28T08:15:30Z',
        scope_mode: 'scoped',
        active_source_id: 102,
        messages: [
          {
            id: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
            session_id: '7b6a48f2-2973-45f6-8c46-9562725b821a',
            role: 'user',
            content: '질문',
            created_at: '2026-09-28T08:00:00Z',
            status: 'completed',
          },
        ],
      };

      const parsed = ChatSessionDetailSchema.parse(detail);
      expect(parsed.messages.length).toBe(1);
      expect(parsed.messages[0].id).toBe('1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d');
    });

    it('validates ChatSessionCreateRequestSchema with defaults', () => {
      const parsed = ChatSessionCreateRequestSchema.parse({});
      expect(parsed.title).toBe('새 대화');
      expect(parsed.scope_mode).toBe('global');
    });

    it('validates GenericSuccessResponseSchema', () => {
      const res = GenericSuccessResponseSchema.parse({
        status: 'success',
        message: '삭제 완료',
        deleted_count: 1,
      });
      expect(res.status).toBe('success');
      expect(res.deleted_count).toBe(1);
    });

    it('generateAutoTitle correctly trims markdown and limits to 30 characters', () => {
      expect(generateAutoTitle('')).toBe('새 대화');
      expect(generateAutoTitle('   ')).toBe('새 대화');
      expect(generateAutoTitle('## LangGraph v0.3 *동작 원리*')).toBe('LangGraph v0.3 동작 원리');
      const longQuestion = 'FastMCP 프레임워크와 Model Context Protocol의 전체 사양 및 프로덕션 배포 가이드를 상세히 설명해주세요';
      const autoTitle = generateAutoTitle(longQuestion);
      expect(autoTitle.endsWith('...')).toBe(true);
      expect(autoTitle.length).toBe(33); // 30 chars + '...'
    });

    it('applySlidingWindow correctly limits turns to 10 and respects token heuristic', () => {
      const history = Array.from({ length: 30 }, (_, i) => ({
        role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
        content: `대화 턴 메시지 ${i}`,
      }));

      const windowed = applySlidingWindow(history, 10, 3000);
      expect(windowed.length).toBeLessThanOrEqual(20);
      expect(windowed[windowed.length - 1].content).toBe('대화 턴 메시지 29');
    });

    it('converts bidirectionally between ChatMessageItem and UI ChatMessage', () => {
      const item: ChatMessageItem = {
        id: 'item-uuid-1',
        session_id: '7b6a48f2-2973-45f6-8c46-9562725b821a',
        role: 'user',
        content: '변환 테스트 질문입니다.',
        created_at: '2026-09-28T08:00:00Z',
        sources: null,
        status: 'completed',
        model: null,
        latency_ms: null,
      };

      const uiMsg = chatMessageItemToUiMessage(item, 'scoped', 101);
      expect(uiMsg.id).toBe('item-uuid-1');
      expect(uiMsg.role).toBe('user');
      expect(uiMsg.content).toBe('변환 테스트 질문입니다.');
      expect(uiMsg.status).toBe('completed');
      expect(uiMsg.scope).toBe('scoped');
      expect(uiMsg.source_id).toBe(101);

      const roundtripItem = uiMessageToChatMessageItem(uiMsg, '7b6a48f2-2973-45f6-8c46-9562725b821a');
      expect(roundtripItem.id).toBe('item-uuid-1');
      expect(roundtripItem.session_id).toBe('7b6a48f2-2973-45f6-8c46-9562725b821a');
      expect(roundtripItem.content).toBe('변환 테스트 질문입니다.');
      expect(roundtripItem.status).toBe('completed');
    });
  });

  describe('MSW Session Persistence Interception Endpoints (ADR-006 & OpenAPI v2.6)', () => {
    it('handles GET /api/chat/sessions (200 OK) sorted by updated_at DESC', async () => {
      const res = await fetch('/api/chat/sessions?limit=10&offset=0');
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(3);
      expect(data[0].id).toBeDefined();
      expect(data[0].title).toBeDefined();
      expect(data[0].message_count).toBeGreaterThanOrEqual(1);

      // Descending updated_at sort verification
      const time1 = new Date(data[0].updated_at).getTime();
      const time2 = new Date(data[1].updated_at).getTime();
      expect(time1).toBeGreaterThanOrEqual(time2);
    });

    it('handles GET /api/chat/sessions 500 error trigger', async () => {
      const res = await fetch('/api/chat/sessions?trigger_error=500');
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error_code).toBe('ERR_SERVER_INTERNAL');
    });

    it('handles POST /api/chat/sessions (201 Created)', async () => {
      const newSessionPayload = {
        title: '신규 리서치 세션',
        scope_mode: 'global',
        active_filters: { category: 'agent_tech', time_range: '24h', sort: 'hot', high_signal_only: false },
      };

      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSessionPayload),
      });

      expect(res.status).toBe(201);
      const created = await res.json();
      expect(created.id).toBeDefined();
      expect(created.title).toBe('신규 리서치 세션');
      expect(created.scope_mode).toBe('global');
      expect(Array.isArray(created.messages)).toBe(true);

      // Verify it appears in subsequent list fetch
      const listRes = await fetch('/api/chat/sessions');
      const listData = await listRes.json();
      expect(listData.some((s: ChatSessionSummary) => s.id === created.id)).toBe(true);
    });

    it('handles POST /api/chat/sessions 400: bad UUID → ERR_SESSION_INVALID_UUID, JSON·field errors → ERR_INVALID_PAYLOAD (CT-016)', async () => {
      const post = (body: string) =>
        fetch('/api/chat/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });

      const badUuid = await post(JSON.stringify({ id: 'not-a-uuid' }));
      expect(badUuid.status).toBe(400);
      expect((await badUuid.json()).error_code).toBe('ERR_SESSION_INVALID_UUID');

      const badJson = await post('{');
      expect(badJson.status).toBe(400);
      expect((await badJson.json()).error_code).toBe('ERR_INVALID_PAYLOAD');

      const badField = await post(JSON.stringify({ scope_mode: 'everything' }));
      expect(badField.status).toBe(400);
      const fieldError = await badField.json();
      expect(fieldError.error_code).toBe('ERR_INVALID_PAYLOAD');
      expect(fieldError.details[0].loc).toEqual(['body', 'scope_mode']);
    });

    it('handles POST /api/chat/sessions 500 error trigger', async () => {
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '[TRIGGER_500]' }),
      });

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error_code).toBe('ERR_SESSION_CREATE_FAILED');
    });

    it('handles GET /api/chat/sessions/:session_id (200 OK)', async () => {
      const targetId = '7b6a48f2-2973-45f6-8c46-9562725b821a';
      const res = await fetch(`/api/chat/sessions/${targetId}`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe(targetId);
      expect(data.title).toBe('LangGraph v0.2 아키텍처 분석');
      expect(data.messages.length).toBeGreaterThan(0);
      expect(data.active_source).toBeDefined();
    });

    it('handles GET /api/chat/sessions/:session_id (404 Not Found)', async () => {
      const nonExistent = '00000000-0000-0000-0000-000000000000';
      const res = await fetch(`/api/chat/sessions/${nonExistent}`);
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error_code).toBe('ERR_SESSION_NOT_FOUND');
    });

    it('handles GET /api/chat/sessions/:session_id 500 error trigger', async () => {
      const res = await fetch('/api/chat/sessions/test-[TRIGGER_500]-id');
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error_code).toBe('ERR_SERVER_INTERNAL');
    });

    it('handles DELETE /api/chat/sessions/:session_id (200 OK CASCADE)', async () => {
      const targetId = '9d8c60f4-4195-47b8-8e68-1784947da43c';
      const res = await fetch(`/api/chat/sessions/${targetId}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('success');
      expect(data.deleted_count).toBe(1);

      // Verify it's no longer retrievable
      const getRes = await fetch(`/api/chat/sessions/${targetId}`);
      expect(getRes.status).toBe(404);
    });

    it('handles DELETE /api/chat/sessions/:session_id (404 Not Found)', async () => {
      const nonExistent = '00000000-0000-0000-0000-000000000000';
      const res = await fetch(`/api/chat/sessions/${nonExistent}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error_code).toBe('ERR_SESSION_NOT_FOUND');
    });

    it('handles DELETE /api/chat/sessions/:session_id 500 error trigger', async () => {
      const res = await fetch('/api/chat/sessions/test-[TRIGGER_500]-id', {
        method: 'DELETE',
      });

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error_code).toBe('ERR_SESSION_DELETE_FAILED');
    });

    it('auto-persists conversation turn to session store upon POST /api/chat/stream completion', async () => {
      const targetSessionId = '7b6a48f2-2973-45f6-8c46-9562725b821a';

      // 1. Initial count
      const initialDetailRes = await fetch(`/api/chat/sessions/${targetSessionId}`);
      const initialDetail = await initialDetailRes.json();
      const initialMsgCount = initialDetail.messages.length;

      // 2. Stream a question with session_id
      const streamRes = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'LangGraph의 체크포인터 설정 예제를 보여줘',
          scope: 'scoped',
          source_id: 102,
          session_id: targetSessionId,
        }),
      });

      expect(streamRes.status).toBe(200);
      const reader = streamRes.body?.getReader();
      if (reader) {
        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }
      }

      // 3. Verify session was updated with user question and assistant answer
      const updatedDetailRes = await fetch(`/api/chat/sessions/${targetSessionId}`);
      const updatedDetail = await updatedDetailRes.json();
      expect(updatedDetail.messages.length).toBe(initialMsgCount + 2);
      expect(updatedDetail.messages[updatedDetail.messages.length - 2].content).toBe(
        'LangGraph의 체크포인터 설정 예제를 보여줘'
      );
      expect(updatedDetail.messages[updatedDetail.messages.length - 1].role).toBe('assistant');
    });
  });

  describe('Chat Stream Client Message Ids Contract (BUG-02R)', () => {
    const sessionId = '7b6a48f2-2973-45f6-8c46-9562725b821a';
    const streamAndDrain = async (body: Record<string, unknown>) => {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const reader = res.body?.getReader();
      if (reader) {
        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }
      }
      return res;
    };

    it('accepts ChatStreamRequest without user_message_id / assistant_message_id', () => {
      const parsed = ChatStreamRequestSchema.parse({ question: 'MCP 서버 동향 알려줘' });
      expect(parsed.user_message_id).toBeUndefined();
      expect(parsed.assistant_message_id).toBeUndefined();

      const withNulls = ChatStreamRequestSchema.parse({
        question: 'MCP 서버 동향 알려줘',
        user_message_id: null,
        assistant_message_id: null,
      });
      expect(withNulls.user_message_id).toBeNull();
      expect(withNulls.assistant_message_id).toBeNull();
    });

    it('accepts ChatStreamRequest with client ids (16 chars) and UUID ids (36 chars)', () => {
      const clientIds = ChatStreamRequestSchema.parse({
        question: 'MCP 서버 동향 알려줘',
        session_id: sessionId,
        user_message_id: 'msg-user-abc1234',
        assistant_message_id: 'msg-asst-abc1234',
      });
      expect(clientIds.user_message_id).toBe('msg-user-abc1234');
      expect(clientIds.assistant_message_id).toBe('msg-asst-abc1234');

      const uuidIds = ChatStreamRequestSchema.parse({
        question: 'MCP 서버 동향 알려줘',
        user_message_id: '0b8f4c1e-9a7d-4e2b-8c3f-1d2e3f4a5b6c',
        assistant_message_id: '1c9a5d2f-0b8e-4f3c-9d4a-2e3f4a5b6c7d',
      });
      expect(uuidIds.user_message_id).toHaveLength(36);
      expect(uuidIds.assistant_message_id).toHaveLength(36);

      // 한쪽만 보내도 된다
      expect(
        ChatStreamRequestSchema.safeParse({ question: 'q', user_message_id: 'msg-user-abc1234' }).success
      ).toBe(true);
    });

    it('rejects message ids that are empty, longer than 36 chars, non-string, or equal to each other', () => {
      expect(CHAT_MESSAGE_ID_MAX_LENGTH).toBe(36);
      const base = { question: 'MCP 서버 동향 알려줘' };
      expect(ChatStreamRequestSchema.safeParse({ ...base, user_message_id: '' }).success).toBe(false);
      expect(
        ChatStreamRequestSchema.safeParse({ ...base, assistant_message_id: 'x'.repeat(37) }).success
      ).toBe(false);
      expect(ChatStreamRequestSchema.safeParse({ ...base, user_message_id: 123 }).success).toBe(false);
      expect(
        ChatStreamRequestSchema.safeParse({
          ...base,
          user_message_id: 'msg-same-0000000',
          assistant_message_id: 'msg-same-0000000',
        }).success
      ).toBe(false);
    });

    it('MSW stores the turn under the request message ids and skips them on repeat (no duplicate)', async () => {
      const before = await (await fetch(`/api/chat/sessions/${sessionId}`)).json();
      const body = {
        question: 'LangGraph의 체크포인터 설정 예제를 보여줘',
        scope: 'scoped',
        source_id: 102,
        session_id: sessionId,
        user_message_id: 'msg-user-bug02r1',
        assistant_message_id: 'msg-asst-bug02r1',
      };
      expect((await streamAndDrain(body)).status).toBe(200);

      const after = await (await fetch(`/api/chat/sessions/${sessionId}`)).json();
      expect(after.messages.length).toBe(before.messages.length + 2);
      const ids = after.messages.map((m: { id: string }) => m.id);
      expect(ids.slice(-2)).toEqual(['msg-user-bug02r1', 'msg-asst-bug02r1']);
      expect(ChatSessionDetailSchema.shape.messages.parse(after.messages.slice(-2))).toHaveLength(2);

      // 같은 id 로 다시 저장하면 건너뛴다 (backend append_messages_batch 와 같음)
      expect((await streamAndDrain(body)).status).toBe(200);
      const again = await (await fetch(`/api/chat/sessions/${sessionId}`)).json();
      expect(again.messages.length).toBe(after.messages.length);
    });

    it('MSW has the turn stored by the time the done event is read (backend saves before done)', async () => {
      const before = await (await fetch(`/api/chat/sessions/${sessionId}`)).json();
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'LangGraph의 체크포인터 설정 예제를 보여줘',
          scope: 'scoped',
          source_id: 102,
          session_id: sessionId,
          user_message_id: 'msg-user-order01',
          assistant_message_id: 'msg-asst-order01',
        }),
      });
      expect(res.status).toBe(200);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let text = '';
      while (!text.includes('event: done')) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
      }
      expect(text).toContain('event: done');

      // done 을 받은 시점에 이미 저장돼 있어야 한다
      const atDone = await (await fetch(`/api/chat/sessions/${sessionId}`)).json();
      expect(atDone.messages.length).toBe(before.messages.length + 2);
      expect(atDone.messages.map((m: { id: string }) => m.id).slice(-2)).toEqual([
        'msg-user-order01',
        'msg-asst-order01',
      ]);
      await reader.cancel();
    });

    it('MSW does not store the turn when the stream ends with an error event', async () => {
      const before = await (await fetch(`/api/chat/sessions/${sessionId}`)).json();
      const res = await streamAndDrain({
        question: '[TRIGGER_STREAM_ERROR] 중간 실패',
        session_id: sessionId,
        user_message_id: 'msg-user-error01',
        assistant_message_id: 'msg-asst-error01',
      });
      expect(res.status).toBe(200);
      const after = await (await fetch(`/api/chat/sessions/${sessionId}`)).json();
      expect(after.messages.length).toBe(before.messages.length);
    });

    it('MSW stores the turn under generated UUIDs when message ids are omitted', async () => {
      const before = await (await fetch(`/api/chat/sessions/${sessionId}`)).json();
      const res = await streamAndDrain({
        question: 'LangGraph의 체크포인터 설정 예제를 보여줘',
        scope: 'scoped',
        source_id: 102,
        session_id: sessionId,
      });
      expect(res.status).toBe(200);
      const after = await (await fetch(`/api/chat/sessions/${sessionId}`)).json();
      expect(after.messages.length).toBe(before.messages.length + 2);
      for (const m of after.messages.slice(-2)) {
        expect(m.id).toMatch(/^[0-9a-f-]{36}$/);
      }
    });

    it('MSW returns 400 ERR_INVALID_PAYLOAD for invalid message ids', async () => {
      const tooLong = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'q', user_message_id: 'x'.repeat(37) }),
      });
      expect(tooLong.status).toBe(400);
      expect((await tooLong.json()).error_code).toBe('ERR_INVALID_PAYLOAD');

      const same = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'q',
          user_message_id: 'msg-same-0000000',
          assistant_message_id: 'msg-same-0000000',
        }),
      });
      expect(same.status).toBe(400);
      expect((await same.json()).error_code).toBe('ERR_INVALID_PAYLOAD');
    });
  });

  describe('News Domain Contracts & SourceConfig Schemas (v3.0 SSOT)', () => {
    it('validates NewsItemSchema with complete attributes', () => {
      const mockRawNews = {
        id: 1,
        title: 'Anthropic Claude 5.5 Sonnet & Hybrid Reasoning Model Released',
        url: 'https://www.anthropic.com/news/claude-5-5-sonnet',
        source: 'rss',
        category: 'ai_news',
        summary: 'Hybrid reasoning and extended thinking capabilities announced.',
        quality_score: 9.8,
        is_high_signal: true,
        published_at: '2026-09-15T09:00:00Z',
        created_at: '2026-09-15T09:05:00Z',
        dedup_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      };

      const parsed = NewsItemSchema.parse(mockRawNews);
      expect(parsed.id).toBe(1);
      expect(parsed.title).toContain('Claude 5.5');
      expect(parsed.quality_score).toBe(9.8);
      expect(parsed.is_high_signal).toBe(true);
      expect(parsed.tags).toEqual([]);
    });

    it('validates NewsListResponseSchema with pagination envelope', () => {
      const mockList = {
        items: [
          {
            id: 1,
            title: 'Test News',
            url: 'https://example.com/test',
            source: 'github',
            category: 'harness',
            quality_score: 8.5,
            is_high_signal: true,
            published_at: '2026-09-15T09:00:00Z',
            created_at: '2026-09-15T09:05:00Z',
            dedup_hash: 'testhash',
          },
        ],
        total: 1,
        page: 1,
        size: 20,
        total_pages: 1,
      };

      const parsed = NewsListResponseSchema.parse(mockList);
      expect(parsed.total).toBe(1);
      expect(parsed.items.length).toBe(1);
    });

    it('validates SourceConfigSchema and SourcesResponseSchema', () => {
      const mockConfig = {
        rss_feeds: [
          {
            id: 'geeknews',
            name: 'GeekNews',
            url: 'https://news.hada.io/rss/news',
            category_hint: 'ai_news',
            enabled: true,
          },
        ],
        github_sources: {
          enabled: true,
          search_queries: ['agentic workflow'],
          monitored_repos: [
            {
              repo: 'jlowin/fastmcp',
              category: 'mcp_plugins_skills',
              enabled: true,
            },
          ],
        },
      };

      const parsedConfig = SourceConfigSchema.parse(mockConfig);
      expect(parsedConfig.rss_feeds.length).toBe(1);
      expect(parsedConfig.github_sources.monitored_repos[0].repo).toBe('jlowin/fastmcp');

      // backend GET /api/sources 는 sources_file·updated_at·stats 를 늘 보낸다 (CT-006)
      const mockResponse = {
        status: 'success',
        sources_file: 'sources.json',
        updated_at: null,
        stats: {
          total_rss: 1,
          active_rss: 1,
          total_github_repos: 1,
          active_github_repos: 1,
          github_search_enabled: true,
          reddit_enabled: true,
          hackernews_enabled: true,
          arxiv_enabled: true,
          huggingface_enabled: true,
        },
        data: parsedConfig,
      };
      const parsedRes = SourcesResponseSchema.parse(mockResponse);
      expect(parsedRes.status).toBe('success');
      expect(SourcesResponseSchema.safeParse({ status: 'success', data: parsedConfig }).success).toBe(false);
      // backend 기본 저장소 카테고리는 agent_tech
      expect(SourceConfigSchema.parse({ github_sources: { monitored_repos: [{ repo: 'a/b' }] } }).github_sources.monitored_repos[0].category).toBe('agent_tech');
    });

    it('validates MessageSchema and SendMessageRequestSchema contract conformity', () => {
      const sendReq = SendMessageRequestSchema.parse({
        content: '새로운 에이전트 질문입니다',
      });
      expect(sendReq.content).toBe('새로운 에이전트 질문입니다');
      expect(sendReq.role).toBe('user');
    });
  });

  describe('MSW News & Fallback Interceptions (v3.0 SSOT)', () => {
    it('handles GET /api/news with pagination and sorting', async () => {
      const res = await fetch('/api/news?page=1&size=2&sort=hot');
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.page).toBe(1);
      expect(data.size).toBe(2);
      expect(data.items.length).toBeLessThanOrEqual(2);
      expect(data.total).toBeGreaterThan(0);
    });

    it('handles GET /api/news with category and high_signal_only filters', async () => {
      const res = await fetch('/api/news?category=mcp_plugins_skills&high_signal_only=true');
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.items.every((i: NewsItem) => i.category === 'mcp_plugins_skills')).toBe(true);
      // backend 는 is_high_signal 만 본다 (CT-024)
      expect(data.items.every((i: NewsItem) => i.is_high_signal)).toBe(true);
    });

    it('handles GET /api/news 400 Bad Request fallback (invalid page)', async () => {
      const res = await fetch('/api/news?page=0');
      expect(res.status).toBe(400);
      const err = await res.json();
      expect(err.error_code).toBe('ERR_INVALID_PAYLOAD');
    });

    it('handles GET /api/news 500 Internal Error trigger', async () => {
      const res = await fetch('/api/news?trigger_error=500');
      expect(res.status).toBe(500);
      const err = await res.json();
      expect(err.error_code).toBe('ERR_SERVER_INTERNAL');
    });

    it('handles POST /api/news/:id/ask/stream 404 with ERR_NOT_FOUND', async () => {
      const res = await fetch('/api/news/999999/ask/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'q' }),
      });
      expect(res.status).toBe(404);
      const err = await res.json();
      expect(err).toEqual({ error_code: 'ERR_NOT_FOUND', message: '기사를 찾을 수 없습니다.', details: null });
    });
  });

  describe('Stage 2d Claude 3-Tier Multi-Model Routing & Token Usage Contracts (v4.0)', () => {
    it('validates ModelTierSchema for all 3 tiers and rejects unknown values', () => {
      expect(ModelTierSchema.parse('haiku')).toBe('haiku');
      expect(ModelTierSchema.parse('sonnet')).toBe('sonnet');
      expect(ModelTierSchema.parse('opus')).toBe('opus');
      expect(() => ModelTierSchema.parse('gpt-4o')).toThrow();
      expect(() => ModelTierSchema.parse('gemini-flash')).toThrow();
    });

    it('validates ChatModelSchema allows dynamic model identifiers and rejects empty strings', () => {
      expect(ChatModelSchema.parse('claude-sonnet-5-5')).toBe('claude-sonnet-5-5');
      expect(ChatModelSchema.parse('claude-haiku-5-5')).toBe('claude-haiku-5-5');
      expect(ChatModelSchema.parse('claude-opus-5-5')).toBe('claude-opus-5-5');
      expect(ChatModelSchema.parse('custom-llm-model')).toBe('custom-llm-model');
      expect(() => ChatModelSchema.parse('')).toThrow();
    });

    it('verifies Claude model constants and bidirectional mappings', () => {
      expect(DEFAULT_CHAT_MODEL).toBe('claude-sonnet-5-5');
      expect(DEFAULT_MODEL_TIER).toBe('sonnet');
      expect(Object.keys(CLAUDE_MODELS).length).toBe(3);
      expect(CLAUDE_MODELS.haiku).toBe('claude-haiku-5-5');
      expect(CLAUDE_MODELS.sonnet).toBe('claude-sonnet-5-5');
      expect(CLAUDE_MODELS.opus).toBe('claude-opus-5-5');
      expect(TIER_TO_MODEL.haiku).toBe('claude-haiku-5-5');
      expect(TIER_TO_MODEL.sonnet).toBe('claude-sonnet-5-5');
      expect(TIER_TO_MODEL.opus).toBe('claude-opus-5-5');
      expect(MODEL_TO_TIER['claude-sonnet-5-5']).toBe('sonnet');
      expect(MODEL_TO_TIER['claude-haiku-5-5']).toBe('haiku');
      expect(MODEL_TO_TIER['claude-opus-5-5']).toBe('opus');
    });

    it('verifies sanitizeModelTier preserves historical models and defaults to sonnet for claude', () => {
      expect(sanitizeModelTier('gemini-2.5-flash')).toBe('gemini-2.5-flash');
      expect(sanitizeModelTier('Google gemini-3.5-flash-lite')).toBe('Google gemini-3.5-flash-lite');
      expect(sanitizeModelTier('gemini-ultra')).toBe('gemini-ultra');
      expect(sanitizeModelTier('gpt-4o')).toBe('gpt-4o');
      expect(sanitizeModelTier('claude-sonnet-5-5')).toBe('sonnet');
      expect(sanitizeModelTier('claude-haiku-5-5')).toBe('haiku');
      expect(sanitizeModelTier('claude-opus-5-5')).toBe('opus');
      expect(sanitizeModelTier('haiku')).toBe('haiku');
      expect(sanitizeModelTier('opus')).toBe('opus');
      expect(sanitizeModelTier('sonnet')).toBe('sonnet');
      expect(sanitizeModelTier(undefined)).toBe('sonnet');
      expect(sanitizeModelTier(null)).toBe('sonnet');
      expect(sanitizeModelTier('unknown')).toBe('unknown');
    });

    it('verifies formatModelDisplayName and getModelLabel masks raw IDs with clean 5.5 brand names', () => {
      // Default nameOnly
      expect(formatModelDisplayName()).toBe('Claude Sonnet 5.5');
      expect(formatModelDisplayName('claude-sonnet-5-5')).toBe('Claude Sonnet 5.5');
      expect(formatModelDisplayName('claude-haiku-5-5')).toBe('Claude Haiku 5.5');
      expect(formatModelDisplayName('claude-opus-5-5')).toBe('Claude Opus 5.5');
      expect(formatModelDisplayName('gemini-2.5-flash')).toBe('Gemini 2.5 Flash');

      // Full with icon
      expect(formatModelDisplayName('claude-sonnet-5-5', { withIcon: true })).toBe('🎯 Claude Sonnet 5.5');
      expect(formatModelDisplayName('claude-haiku-5-5', { withIcon: true })).toBe('⚡ Claude Haiku 5.5');
      expect(formatModelDisplayName('claude-opus-5-5', { withIcon: true })).toBe('🧠 Claude Opus 5.5');

      // Short with icon
      expect(formatModelDisplayName('sonnet', { withIcon: true, short: true })).toBe('🎯 Sonnet 5.5');
      expect(formatModelDisplayName('haiku', { withIcon: true, short: true })).toBe('⚡ Haiku 5.5');
      expect(formatModelDisplayName('opus', { withIcon: true, short: true })).toBe('🧠 Opus 5.5');

      // Short nameOnly
      expect(formatModelDisplayName('sonnet', { short: true })).toBe('Sonnet 5.5');

      // Alias getModelLabel
      expect(getModelLabel('claude-sonnet-5-5')).toBe('Claude Sonnet 5.5');
      expect(getModelLabel('claude-haiku-5-5', { withIcon: true })).toBe('⚡ Claude Haiku 5.5');
    });

    it('validates TokenUsageMetaSchema with prompt caching fields', () => {
      const validUsage: TokenUsageMeta = {
        input_tokens: 1250,
        output_tokens: 840,
        cache_read_input_tokens: 2500,
        cache_creation_input_tokens: 0,
      };
      const parsed = TokenUsageMetaSchema.parse(validUsage);
      expect(parsed.input_tokens).toBe(1250);
      expect(parsed.cache_read_input_tokens).toBe(2500);

      // Nullable cache fields are allowed
      const nullCacheUsage = {
        input_tokens: 500,
        output_tokens: 200,
        cache_read_input_tokens: null,
        cache_creation_input_tokens: null,
      };
      expect(TokenUsageMetaSchema.parse(nullCacheUsage)).toEqual(nullCacheUsage);

      // Pydantic 기본값처럼 빠진 토큰 수는 0 이다
      expect(TokenUsageMetaSchema.parse({})).toEqual({ input_tokens: 0, output_tokens: 0 });
    });

    it('validates ChatStreamRequestSchema with optional model and model_tier (default model is backend config)', () => {
      const minimal = ChatStreamRequestSchema.parse({ question: 'Hello Claude' });
      // 기본 모델은 backend 설정(ANTHROPIC_DEFAULT_CHAT_MODEL)이 정한다. zod 는 기본값을 지어내지 않는다 (CT-017)
      expect(minimal.model).toBeUndefined();
      expect(minimal.model_tier).toBeUndefined();
      expect(minimal.top_k).toBe(5);
      expect(minimal.scope).toBe('global');
      // Pydantic 처럼 null 을 받는다
      expect(
        ChatStreamRequestSchema.parse({ question: 'q', model: null, model_tier: null, history: null, session_id: null })
          .session_id
      ).toBeNull();
      // session_id 는 UUID 여야 한다 (backend 는 400 ERR_SESSION_INVALID_UUID, v1.4)
      expect(ChatStreamRequestSchema.safeParse({ question: 'q', session_id: 'any' }).success).toBe(false);
      expect(ChatStreamRequestSchema.safeParse({ question: 'q', top_k: 11 }).success).toBe(false);
      expect(ChatStreamRequestSchema.safeParse({ question: '' }).success).toBe(false);
      expect(ChatStreamRequestSchema.safeParse({ question: 'x'.repeat(2001) }).success).toBe(false);

      const explicit = ChatStreamRequestSchema.parse({
        question: 'Benchmark prompt',
        model_tier: 'haiku',
        model: 'claude-haiku-5-5',
      });
      expect(explicit.model_tier).toBe('haiku');
      expect(explicit.model).toBe('claude-haiku-5-5');
    });

    it('validates ChatDonePayloadSchema with model_tier and token usage meta', () => {
      const payload = {
        done: true as const,
        session_id: '7b6a48f2-2973-45f6-8c46-9562725b821a',
        model: 'claude-sonnet-5-5' as const,
        model_tier: 'sonnet' as const,
        sources_count: 2,
        primary_count: 1,
        supplementary_count: 1,
        latency_ms: 642,
        usage: {
          input_tokens: 1250,
          output_tokens: 840,
          cache_read_input_tokens: 2500,
          cache_creation_input_tokens: 0,
        },
      };

      const parsed = ChatDonePayloadSchema.parse(payload);
      expect(parsed.model_tier).toBe('sonnet');
      expect(parsed.latency_ms).toBe(642);
      expect(parsed.usage?.cache_read_input_tokens).toBe(2500);
    });

    it('validates Claude error codes in ApiErrorCodeSchema', () => {
      const codes = [
        'ERR_CLAUDE_API_KEY_MISSING',
        'ERR_CLAUDE_QUOTA_EXCEEDED',
        'ERR_CLAUDE_OVERLOADED',
        'ERR_INVALID_MODEL_TIER',
      ] as const;

      codes.forEach((code) => {
        expect(ApiErrorCodeSchema.parse(code)).toBe(code);
      });
    });

    it('preserves model_tier and usage in chatMessageItemToUiMessage and uiMessageToChatMessageItem roundtrip', () => {
      const originalItem: ChatMessageItem = {
        id: '99999999-9999-9999-9999-999999999999',
        session_id: '7b6a48f2-2973-45f6-8c46-9562725b821a',
        role: 'assistant',
        content: 'Claude response content',
        created_at: '2026-10-19T09:00:00Z',
        sources: null,
        status: 'completed',
        model: 'claude-sonnet-5-5',
        model_tier: 'sonnet',
        latency_ms: 642,
        usage: {
          input_tokens: 1250,
          output_tokens: 840,
          cache_read_input_tokens: 2500,
          cache_creation_input_tokens: 0,
        },
      };

      const uiMsg = chatMessageItemToUiMessage(originalItem);
      expect(uiMsg.model_tier).toBe('sonnet');
      expect(uiMsg.latency_ms).toBe(642);
      expect(uiMsg.usage?.input_tokens).toBe(1250);

      const convertedBack = uiMessageToChatMessageItem(uiMsg, originalItem.session_id);
      expect(convertedBack.model_tier).toBe('sonnet');
      expect(convertedBack.latency_ms).toBe(642);
      expect(convertedBack.usage?.cache_read_input_tokens).toBe(2500);
    });

    it('verifies UI component prop contracts compatibility', () => {
      // 헤더 prop 단언은 지웠다: 컴포넌트가 받지 않는 필드를 방금 만든 객체로 단언해 아무것도 보장하지 않았다 (FE-29).
      // 헤더에 모델 선택이 없다는 사실은 ChatHeader.test.tsx 가 화면으로 확인한다.
      const selectorProps: ChatModelSelectorProps = {
        selectedTier: 'sonnet',
        onSelectTier: () => {},
        isStreaming: false,
      };
      expect(selectorProps.selectedTier).toBe('sonnet');
      expect(selectorProps.isStreaming).toBe(false);

      const badgeProps: ModelTierBadgeProps = {
        tier: 'haiku',
        latencyMs: 180,
        showIcon: true,
      };
      expect(badgeProps.tier).toBe('haiku');
      expect(badgeProps.latencyMs).toBe(180);

      const dividerProps: ModelChangeDividerProps = {
        previousTier: 'haiku',
        newTier: 'sonnet',
        timestamp: '2026-10-19T09:00:00Z',
      };
      expect(dividerProps.previousTier).toBe('haiku');
      expect(dividerProps.newTier).toBe('sonnet');

      const switchEvent: ModelSwitchEvent = {
        id: 'switch-1',
        type: 'model_switch',
        previousTier: 'haiku',
        newTier: 'opus',
        timestamp: '2026-10-19T09:00:00Z',
      };
      expect(switchEvent.type).toBe('model_switch');
      expect(switchEvent.previousTier).toBe('haiku');
      expect(switchEvent.newTier).toBe('opus');

      const timelineItem: ChatTimelineItem = {
        type: 'model_switch',
        data: switchEvent,
      };
      expect(timelineItem.type).toBe('model_switch');
      expect(timelineItem.data.newTier).toBe('opus');
    });
  });

  describe('MSW Claude 3-Tier Model Routing & Fallback Interceptions (v4.0)', () => {
    it('handles POST /api/chat/stream with model_tier=haiku and verifies ~180ms latency & Haiku usage', async () => {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'Test Haiku Stream', model_tier: 'haiku' }),
      });

      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain('event: done');
      expect(text).toContain('"model":"claude-haiku-5-5"');
      expect(text).toContain('"model_tier":"haiku"');
      expect(text).toContain('"latency_ms":180');
      expect(text).toContain('"cache_read_input_tokens":2500');
    });

    it('handles POST /api/chat/stream with model_tier=opus and verifies ~1780ms latency & Opus usage', async () => {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'Test Opus Stream', model_tier: 'opus' }),
      });

      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain('event: done');
      expect(text).toContain('"model":"claude-opus-5-5"');
      expect(text).toContain('"model_tier":"opus"');
      expect(text).toContain('"latency_ms":1780');
      expect(text).toContain('"input_tokens":2100');
    });

    it('handles POST /api/chat/stream default model routing to Sonnet with ~642ms latency', async () => {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'Test Default Sonnet Stream' }),
      });

      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain('"model":"claude-sonnet-5-5"');
      expect(text).toContain('"model_tier":"sonnet"');
      expect(text).toContain('"latency_ms":642');
    });

    it('handles POST /api/chat/stream 400 Bad Request on invalid model_tier', async () => {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'Test Invalid Tier', model_tier: 'unsupported_tier' }),
      });

      expect(res.status).toBe(400);
      const err = await res.json();
      expect(err.error_code).toBe('ERR_INVALID_MODEL_TIER');
    });

    it('handles POST /api/chat/stream 401 Anthropic API Key Missing trigger', async () => {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'Check [TRIGGER_401] auth' }),
      });

      expect(res.status).toBe(401);
      const err = await res.json();
      expect(err.error_code).toBe('ERR_CLAUDE_API_KEY_MISSING');
      expect(err.details).toBeNull();
    });

    it('handles POST /api/chat/stream 429 Anthropic Rate Limit trigger', async () => {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'Check [TRIGGER_429] quota' }),
      });

      expect(res.status).toBe(429);
      const err = await res.json();
      expect(err.error_code).toBe('ERR_CLAUDE_QUOTA_EXCEEDED');
      expect(ErrorResponseSchema.safeParse(err).success).toBe(true);
    });

    it('handles POST /api/chat/stream 529 Anthropic Overloaded trigger', async () => {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'Check [TRIGGER_529] overloaded' }),
      });

      expect(res.status).toBe(529);
      const err = await res.json();
      expect(err.error_code).toBe('ERR_CLAUDE_OVERLOADED');
      expect(ErrorResponseSchema.safeParse(err).success).toBe(true);
    });

    it('has no mock for routes backend does not serve (GET /api/chat/stream D-28·CT-010, and v0.4.2 removed routes)', () => {
      const routes = handlers.map((h) => `${(h.info as { method: string }).method} ${(h.info as { path: string }).path}`);
      for (const removed of [
        'GET */api/chat/stream',
        'GET */api/news/:news_id',
        'POST */api/news/:news_id/ask',
        'DELETE */api/news/all',
        'POST */api/chat/query',
        'GET */api/chat/search',
        'POST */api/briefing/generate',
        'POST */api/webhook/send-briefing',
        'GET */api/mcp/info',
      ]) {
        expect(routes).not.toContain(removed);
      }
      expect(routes).toContain('POST */api/chat/stream');
      expect(routes).toContain('POST */api/news/:news_id/ask/stream');
    });

    it('handles POST /api/chat/stream with scope=scoped and source_id=102 returning customized LangGraph report', async () => {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'LangGraph v0.2 아키텍처는?',
          scope: 'scoped',
          source_id: 102,
        }),
      });

      expect(res.status).toBe(200);
      const text = await res.text();
      // Verifies custom tokens for LangGraph
      expect(text).toContain('LangGraph v0.2');
      expect(text).toContain('time-travel debugging');
      expect(text).toContain('agent_tech');
      // Verifies source 102 is primary
      expect(text).toContain('"id":102');
      expect(text).toContain('LangGraph v0.2: Production Multi-Agent Workflows & Time-Travel');
    });

    it('returns dynamically filtered, keyword-matched sources for global chat stream (v0.2.2)', async () => {
      // 1. Query with LangGraph keyword in global scope
      const resLangGraph = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'LangGraph v0.2의 분기 제어 및 상태 머신 원리',
          scope: 'global',
        }),
      });
      expect(resLangGraph.status).toBe(200);
      const textLangGraph = await resLangGraph.text();
      const sourcesLine = textLangGraph.split('\n').find((l) => l.startsWith('data: ') && l.includes('"sources"'));
      expect(sourcesLine).toBeDefined();
      const sourcesData = JSON.parse(sourcesLine!.replace('data: ', ''));
      expect(sourcesData.primary_count).toBe(1);
      expect(sourcesData.sources[0].id).toBe(102);
      expect(sourcesData.sources[0].title).toContain('LangGraph');

      // 2. Query with AutoGen keyword in global scope
      const resAutoGen = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'AutoGen 0.4 액터 모델 이벤트 프레임워크',
          scope: 'global',
        }),
      });
      const textAutoGen = await resAutoGen.text();
      const sourcesLineAutoGen = textAutoGen.split('\n').find((l) => l.startsWith('data: ') && l.includes('"sources"'));
      expect(sourcesLineAutoGen).toBeDefined();
      const sourcesDataAutoGen = JSON.parse(sourcesLineAutoGen!.replace('data: ', ''));
      expect(sourcesDataAutoGen.primary_count).toBe(1);
      expect(sourcesDataAutoGen.sources[0].id).toBe(104);
      expect(sourcesDataAutoGen.sources[0].title).toContain('AutoGen');
    });
  });
});

// ============================================================================
// v1.3 (v0.4.2): backend 와 같은 모양인지 — fixture·backend 표본·SSE 순서·런타임 검증 (D-28~D-31, D-33, FE-19, FE-31)
// ============================================================================

type SseEvent = { event: string; data: Record<string, unknown> };

/** SSE 본문을 이벤트 목록으로 */
function parseSse(text: string): SseEvent[] {
  return text
    .split('\n\n')
    .filter((block) => block.trim())
    .map((block) => {
      const lines = block.split('\n');
      const event = lines.find((l) => l.startsWith('event: '))!.slice(7);
      const data = JSON.parse(lines.find((l) => l.startsWith('data: '))!.slice(6));
      return { event, data };
    });
}

async function streamEvents(body: Record<string, unknown>): Promise<SseEvent[]> {
  const res = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  expect(res.status).toBe(200);
  return parseSse(await res.text());
}

/** 연속된 token 이벤트를 하나로 줄인 이벤트 이름 순서 */
const eventOrder = (events: SseEvent[]) =>
  events.map((e) => e.event).filter((e, i, all) => !(e === 'token' && all[i - 1] === 'token'));

const SSE_SCHEMAS = {
  status: ChatStatusPayloadSchema,
  sources: ChatSourcesPayloadSchema,
  token: SseTokenPayloadSchema,
  done: ChatDonePayloadSchema,
  error: ChatStreamErrorPayloadSchema,
} as const;

describe('Contract v1.3: backend parity of fixtures, payloads, SSE order and runtime validation', () => {
  beforeEach(() => {
    resetMockSessionStore();
  });

  describe('Fixtures match the zod contract (CT-013, 4.5절)', () => {
    it('every fixture parses with its schema', () => {
      for (const art of Object.values(mockArticles)) {
        expect(ChatSourceDetailResponseSchema.strict().safeParse(art).success, String(art.id)).toBe(true);
      }
      for (const chunk of mockSearchChunks) expect(ChatSearchChunkSchema.safeParse(chunk).success).toBe(true);
      for (const session of initialMockSessions) {
        expect(ChatSessionDetailSchema.safeParse(session).success, session.id).toBe(true);
        // 세션 fixture id 는 backend 가 만드는 UUID 형식이다 (variant 가 0 이던 CT-013)
        expect(session.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      }
      for (const item of mockNewsItems) expect(NewsItemSchema.strict().safeParse(item).success, String(item.id)).toBe(true);
      expect(DailyBriefingSchema.safeParse(mockDailyBriefing).success).toBe(true);
      expect(SourcesResponseSchema.safeParse(mockSourcesResponse).success).toBe(true);
      expect(StatsResponseSchema.safeParse(mockStatsResponse).success).toBe(true);
    });

    it('fixtures carry no supplementary sources or [S1] citations (backend never makes them, D-28)', () => {
      const text = JSON.stringify(initialMockSessions);
      expect(text).not.toContain('"supplementary"');
      expect(text).not.toContain('[S1]');
    });

    it('briefing date uses backend format "YYYY년 MM월 DD일" (CT-023)', () => {
      expect(mockDailyBriefing.date).toMatch(/^\d{4}년 \d{2}월 \d{2}일$/);
    });

    it('briefing sections match backend: 4 fields in order, icon is the field id, no emoji in markdown (v0.4.2)', () => {
      expect(mockDailyBriefing.categories!.map((c) => [c.id, c.name, c.icon])).toEqual([
        ['harness', '하네스 & 벤치마크', 'harness'],
        ['mcp_plugins_skills', 'MCP & 생태계', 'mcp_plugins_skills'],
        ['agent_tech', '에이전트 아키텍처', 'agent_tech'],
        ['ai_news', '최신 AI 동향', 'ai_news'],
      ]);
      expect(mockDailyBriefing.markdown_report).not.toMatch(/\p{Extended_Pictographic}/u);
    });
  });

  describe('Backend-shaped samples pass zod (CT-002, CT-003, CT-005, CT-019~CT-022)', () => {
    const backendSource = {
      index: 1,
      type: 'primary',
      id: 101,
      title: 'FastMCP',
      url: 'https://github.com/jlowin/fastmcp',
      source: 'github',
      category: 'mcp_plugins_skills',
      quality_score: 9.3,
      score: null,
      snippet: 'summary',
      full_content: null,
      domain: null,
      relevance_score: null,
      published_at: '2026-11-06T01:02:03.123456+00:00',
      publisher: null,
    };

    it('ChatSourceItem with publisher: null (model_dump) passes and is kept as null', () => {
      const parsed = ChatSourcesPayloadSchema.parse({
        sources: [backendSource],
        applied_filters: null,
        is_relaxed: false,
        primary_count: 1,
        supplementary_count: 0,
      });
      expect(parsed.sources[0].publisher).toBeNull();
      expect(parseChatSseEvent('sources', JSON.stringify({ sources: [backendSource] }))).not.toBeNull();
    });

    it('ChatSourceDetailResponse keeps full_content and scraped_at, accepts created_at: null', () => {
      const parsed = ChatSourceDetailResponseSchema.parse({
        ...mockArticles[101],
        created_at: null,
        full_content: '원문 본문',
        scraped_at: '2026-11-06T01:02:03+00:00',
      });
      expect(parsed.full_content).toBe('원문 본문');
      expect(parsed.scraped_at).toBe('2026-11-06T01:02:03+00:00');
      expect(parsed.created_at).toBeNull();
    });

    it('NewsItem dates carry a UTC offset (v0.4.2): "Z"/"+00:00" pass, offset-less strings are a contract violation', () => {
      const base = { ...mockNewsItems[0] };
      for (const ts of ['2026-11-06T01:02:03.123456Z', '2026-11-06T01:02:03+00:00']) {
        expect(NewsItemSchema.safeParse({ ...base, published_at: ts, created_at: ts }).success, ts).toBe(true);
      }
      expect(NewsItemSchema.safeParse({ ...base, published_at: '2026-11-06T01:02:03.123456' }).success).toBe(false);
    });

    it('NewsItemSchema has no full_content / scraped_at (backend NewsItemResponse does not send them)', () => {
      expect('full_content' in NewsItemSchema.shape).toBe(false);
      expect('scraped_at' in NewsItemSchema.shape).toBe(false);
    });

    it('done payload accepts non-UUID session ids and model "LLM Stream" or null', () => {
      const done = {
        done: true,
        session_id: 'abc',
        model: 'LLM Stream',
        model_tier: 'sonnet',
        sources_count: 0,
        primary_count: 0,
        supplementary_count: 0,
        latency_ms: 12,
        usage: null,
      };
      expect(ChatDonePayloadSchema.safeParse(done).success).toBe(true);
      expect(ChatDonePayloadSchema.safeParse({ ...done, model: null, model_tier: null }).success).toBe(true);
    });

    it('nullable fields backend sends as null pass (CT-021)', () => {
      expect(BriefingCategoryItemSchema.safeParse({ id: null, title: 't', url: 'u', source: null, tags: null }).success).toBe(true);
      expect(GenericSuccessResponseSchema.safeParse({ status: 'success', message: null, deleted_count: null }).success).toBe(true);
      expect(NotionExportResponseSchema.safeParse({ success: true, message: 'ok', url: null }).success).toBe(true);
      expect(
        CrawlProgressSchema.safeParse({
          is_running: false,
          current_source: '',
          step_message: '',
          items_collected: 0,
          items_saved: 0,
          items_filtered: 0,
          total_sources: 0,
          completed_sources: 0,
          last_crawl_time: null,
        }).success
      ).toBe(true);
      expect(
        ResearchStatusSchema.safeParse({
          is_running: false,
          last_run_time: null,
          auto_adopted_count: 0,
          last_run_summary: {},
          cadence: 'Every 12 hours',
        }).success
      ).toBe(true);
      expect(
        TrendingTagSchema.safeParse({ name: 'mcp', count: 3, category: 'ai_news', recent_count: 1, velocity: '+25%', sample_news_id: null }).success
      ).toBe(true);
    });

    it('fields backend sends that TS used to miss are typed and kept (CT-022)', () => {
      expect(
        InspectUrlResponseSchema.parse({ status: 'found', type: 'atom', source_kind: 'github_releases', feed_url: 'f' }).source_kind
      ).toBe('github_releases');
      expect(InspectUrlResponseSchema.parse({ status: 'error', message: 'x', input_url: 'https://a' }).input_url).toBe('https://a');
      expect(
        ManualCollectResponseSchema.parse({ status: 'started', message: 'm', total_collected: 0, total_saved: 0, source_results: {} })
          .source_results
      ).toEqual({});
      expect(RunDeepResearchResponseSchema.parse({ status: 'started', message: 'm', max_candidates: 6 }).max_candidates).toBe(6);
    });
  });

  describe('MSW chat SSE follows backend event order (D-28, D-29, CT-011)', () => {
    it('global with search: thinking → tool_calling → synthesizing → token* → sources → done', async () => {
      const events = await streamEvents({ question: 'LangGraph 체크포인트 원리', scope: 'global', session_id: initialMockSessions[1].id });
      expect(eventOrder(events)).toEqual(['status', 'status', 'status', 'token', 'sources', 'done']);
      expect(events.filter((e) => e.event === 'status').map((e) => [e.data.step, e.data.progress])).toEqual([
        ['thinking', 25],
        ['tool_calling', 50],
        ['synthesizing', 80],
      ]);
      const sources = events.find((e) => e.event === 'sources')!.data as { sources: { publisher: unknown }[]; applied_filters: unknown };
      expect(sources.sources.length).toBeGreaterThan(0);
      expect(sources.sources.every((s) => s.publisher === null)).toBe(true);
      expect(sources.applied_filters).not.toBeNull();
    });

    it('global without tool call: thinking → synthesizing(75) → token* → done, no sources event', async () => {
      const events = await streamEvents({ question: '안녕 [TRIGGER_NO_TOOL]', scope: 'global' });
      expect(eventOrder(events)).toEqual(['status', 'status', 'token', 'done']);
      expect(events[1].data.progress).toBe(75);
      expect(events.at(-1)!.data.sources_count).toBe(0);
    });

    it('scoped: extracting_source(30) → synthesizing(85) → sources(full_content, applied_filters null) → token* → done', async () => {
      const events = await streamEvents({ question: 'LangGraph 설명', scope: 'scoped', source_id: 102 });
      expect(eventOrder(events)).toEqual(['status', 'status', 'sources', 'token', 'done']);
      expect(events.filter((e) => e.event === 'status').map((e) => [e.data.step, e.data.progress])).toEqual([
        ['extracting_source', 30],
        ['synthesizing', 85],
      ]);
      const sources = events.find((e) => e.event === 'sources')!.data as {
        sources: { id: number; full_content: string | null }[];
        applied_filters: unknown;
      };
      expect(sources.sources).toHaveLength(1);
      expect(sources.sources[0].id).toBe(102);
      expect(sources.sources[0].full_content).toEqual(expect.any(String));
      expect(sources.applied_filters).toBeNull();
    });

    it('never emits MSW-only steps, supplementary sources or [S1] citations', async () => {
      for (const body of [
        { question: 'FastMCP 데코레이터 예시', scope: 'global' },
        { question: 'LangGraph 설명', scope: 'scoped', source_id: 102 },
      ]) {
        const events = await streamEvents(body);
        const steps = events.filter((e) => e.event === 'status').map((e) => e.data.step);
        expect(steps).not.toContain('evaluating_sufficiency');
        expect(steps).not.toContain('agentic_searching');
        const text = JSON.stringify(events);
        expect(text).not.toContain('"supplementary"');
        expect(text).not.toContain('[S1]');
        const done = events.at(-1)!.data;
        expect(done.supplementary_count).toBe(0);
      }
    });

    it('every event payload passes its zod schema (what ChatWorkspace validates at runtime)', async () => {
      for (const body of [
        { question: 'FastMCP 데코레이터 예시', scope: 'global', model_tier: 'opus' },
        { question: 'LangGraph 설명', scope: 'scoped', source_id: 102 },
        { question: '[TRIGGER_STREAM_ERROR]', scope: 'global' },
      ]) {
        for (const e of await streamEvents(body)) {
          const schema = SSE_SCHEMAS[e.event as keyof typeof SSE_SCHEMAS];
          expect(schema, e.event).toBeDefined();
          expect(schema.safeParse(e.data).success, `${e.event} ${JSON.stringify(e.data)}`).toBe(true);
        }
      }
    });

    it('mid-stream failure ends with error event like backend (no provider, no done)', async () => {
      const events = await streamEvents({ question: '[TRIGGER_STREAM_ERROR]', scope: 'global' });
      expect(events.map((e) => e.event)).not.toContain('done');
      const error = events.at(-1)!;
      expect(error.event).toBe('error');
      expect(error.data).toEqual({
        error_code: 'ERR_LLM_STREAM_FAILED',
        message: 'LLM 스트리밍 도중 외부 프로바이더 오류가 발생했습니다.',
        status_code: 502,
        step: 'synthesizing',
        retryable: true,
      });
    });

    it('stream does not validate model names (backend accepts any model string)', async () => {
      const events = await streamEvents({ question: 'FastMCP', model: 'gpt-4o' });
      expect(events.at(-1)!.event).toBe('done');
    });
  });

  describe('MSW SSE errors and labels follow backend v0.4.2', () => {
    it('planner failure: status(thinking) → error ERR_LLM_UPSTREAM_FAILED 502 step thinking', async () => {
      const events = await streamEvents({ question: '[TRIGGER_THINKING_ERROR]', scope: 'global' });
      expect(events.map((e) => e.event)).toEqual(['status', 'error']);
      expect(events[1].data).toEqual({
        error_code: 'ERR_LLM_UPSTREAM_FAILED',
        message: '질문 분석 중 오류가 발생했습니다. 다시 시도해 주세요.',
        status_code: 502,
        step: 'thinking',
        retryable: true,
      });
    });

    it('search failure: thinking → tool_calling → error ERR_RETRIEVER_INDEX_ERROR 500 step tool_calling', async () => {
      const events = await streamEvents({ question: 'FastMCP [TRIGGER_SEARCH_ERROR]', scope: 'global' });
      expect(events.map((e) => [e.event, e.data.step])).toEqual([
        ['status', 'thinking'],
        ['status', 'tool_calling'],
        ['error', 'tool_calling'],
      ]);
      expect(events[2].data).toMatchObject({ error_code: 'ERR_RETRIEVER_INDEX_ERROR', status_code: 500 });
    });

    it('status labels carry no emoji', async () => {
      for (const body of [
        { question: 'FastMCP', scope: 'global' },
        { question: '안녕 [TRIGGER_NO_TOOL]', scope: 'global' },
        { question: 'LangGraph', scope: 'scoped', source_id: 102 },
      ]) {
        for (const e of (await streamEvents(body)).filter((x) => x.event === 'status')) {
          expect(String(e.data.label)).not.toMatch(/\p{Extended_Pictographic}/u);
        }
      }
    });

    it('model selection priority is model > model_tier > default (BUG-14)', async () => {
      const done = (events: SseEvent[]) => events.at(-1)!.data;
      expect(done(await streamEvents({ question: 'FastMCP', model: 'claude-opus-5-5', model_tier: 'haiku' })).model_tier).toBe('opus');
      expect(done(await streamEvents({ question: 'FastMCP', model_tier: 'haiku' })).model_tier).toBe('haiku');
      expect(done(await streamEvents({ question: 'FastMCP' })).model_tier).toBe('sonnet');
    });

    it('a stream turn whose message ids live in another session is not stored, but done is still sent', async () => {
      const other = initialMockSessions[1];
      const takenId = other.messages[0].id;
      const target = initialMockSessions[0].id;
      const before = await (await fetch(`/api/chat/sessions/${target}`)).json();
      const events = await streamEvents({
        question: 'LangGraph 설명',
        scope: 'scoped',
        source_id: 102,
        session_id: target,
        user_message_id: takenId,
        assistant_message_id: 'msg-asst-foreign1',
      });
      expect(events.at(-1)!.event).toBe('done');
      const after = await (await fetch(`/api/chat/sessions/${target}`)).json();
      expect(after.messages).toHaveLength(before.messages.length);
    });
  });

  describe('MSW article Ask AI stream follows backend v0.4.2', () => {
    const ask = (id: number | string, body: unknown) =>
      fetch(`/api/news/${id}/ask/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    const dataEvents = async (res: Response) =>
      (await res.text())
        .split('\n\n')
        .filter((b) => b.startsWith('data: '))
        .map((b) => JSON.parse(b.slice(6)) as Record<string, unknown>);

    it('meta → token* → done on success', async () => {
      const events = await dataEvents(await ask(101, { question: '핵심은?' }));
      expect(events[0]).toEqual({ event: 'meta', model: 'claude-sonnet-5-5' });
      expect(events.at(-1)!.event).toBe('done');
    });

    it('ends with an error event (no done) when generation breaks after tokens', async () => {
      const events = await dataEvents(await ask(101, { question: '[TRIGGER_STREAM_ERROR]' }));
      expect(events.map((e) => e.event)).toEqual(['meta', 'token', 'error']);
      expect(events.at(-1)).toEqual({
        event: 'error',
        error_code: 'ERR_LLM_STREAM_FAILED',
        message: '답변 생성이 중간에 끊겼습니다. 다시 시도해 주세요.',
        retryable: true,
      });
    });

    it('rejects an empty or over-2000-char question with 400 ERR_INVALID_PAYLOAD (AskQuestionRequest 1~2000)', async () => {
      for (const question of ['', 'x'.repeat(2001)]) {
        const res = await ask(101, { question });
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error_code).toBe('ERR_INVALID_PAYLOAD');
        expect(body.details[0].loc).toEqual(['body', 'question']);
      }
    });
  });

  describe('MSW session upsert follows backend (CT-004, CT-024)', () => {
    it('appends messages, skips existing ids, keeps model_tier·usage·created_at', async () => {
      const id = initialMockSessions[0].id;
      const before = await (await fetch(`/api/chat/sessions/${id}`)).json();
      const newMessage = {
        id: 'msg-asst-ct00401',
        session_id: id,
        role: 'assistant',
        content: '답',
        created_at: '2026-09-28T09:00:00Z',
        status: 'completed',
        model: 'claude-opus-5-5',
        model_tier: 'opus',
        latency_ms: 1780,
        usage: { input_tokens: 1, output_tokens: 2 },
      };
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 기존 메시지 하나(이미 있는 id)와 새 메시지 하나
        body: JSON.stringify({ id, title: before.title, messages: [before.messages[0], newMessage] }),
      });
      expect(res.status).toBe(201);
      const after = await res.json();
      expect(after.messages).toHaveLength(before.messages.length + 1);
      const saved = after.messages.at(-1);
      expect(saved).toMatchObject({ id: 'msg-asst-ct00401', model_tier: 'opus', created_at: '2026-09-28T09:00:00Z' });
      expect(saved.usage).toEqual({ input_tokens: 1, output_tokens: 2 });
      expect(ChatSessionDetailSchema.safeParse(after).success).toBe(true);
    });

    it('rejects message ids owned by another session with 400 ERR_INVALID_PAYLOAD details.message_ids, changing nothing', async () => {
      const [first, second] = initialMockSessions;
      const before = await (await fetch(`/api/chat/sessions/${first.id}`)).json();
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: first.id, title: '바뀌면 안 됨', messages: [second.messages[0]] }),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error_code).toBe('ERR_INVALID_PAYLOAD');
      expect(body.details).toEqual({ message_ids: [second.messages[0].id] });
      const after = await (await fetch(`/api/chat/sessions/${first.id}`)).json();
      expect(after.title).toBe(before.title);
      expect(after.messages).toHaveLength(before.messages.length);
    });
  });

  describe('Runtime response validation policy (D-33, FE-19)', () => {
    let warn: ReturnType<typeof vi.spyOn>;
    beforeEach(() => {
      warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => {
      warn.mockRestore();
    });

    it('parseResponse returns zod output (defaults applied) when the payload matches', () => {
      const parsed = parseResponse(TokenUsageMetaSchema, {}, 'usage');
      expect(parsed).toEqual({ input_tokens: 0, output_tokens: 0 });
      expect(warn).not.toHaveBeenCalled();
    });

    it('parseResponse warns "[계약 위반]" and returns the raw payload when it does not match', () => {
      const raw = { input_tokens: 'many' };
      expect(parseResponse(TokenUsageMetaSchema, raw, 'usage')).toBe(raw);
      expect(warn).toHaveBeenCalledWith('[계약 위반] usage', expect.any(Array));
    });

    it('api.ts validates real calls: matching MSW response gives no warning', async () => {
      const page = await fetchNewsFeed({ page: 1, size: 2 });
      expect(page.items.length).toBeGreaterThan(0);
      const sources = await fetchSources();
      expect(sources.stats.total_rss).toBe(2);
      expect(warn).not.toHaveBeenCalled();
    });

    it('api.ts keeps the screen alive on a contract violation: warns and passes data through', async () => {
      server.use(http.get('*/api/news', () => HttpResponse.json({ items: [], total: 'zero', page: 1, size: 20, total_pages: 1 })));
      const page = await fetchNewsFeed({});
      expect(page.items).toEqual([]);
      expect(warn).toHaveBeenCalledWith('[계약 위반] GET /api/news', expect.any(Array));
    });

    it('api.ts shows the backend error message, and a fallback when the body is not the error shape', async () => {
      server.use(
        http.post('*/api/sources/rss', () =>
          HttpResponse.json(
            { error_code: 'ERR_INVALID_PAYLOAD', message: '이름과 URL 은 필수입니다.', details: null },
            { status: 400 }
          )
        )
      );
      await expect(addRssSource({ name: '', url: '' })).rejects.toThrow('이름과 URL 은 필수입니다.');

      server.use(http.post('*/api/sources/rss', () => new HttpResponse('Bad Gateway', { status: 502 })));
      await expect(addRssSource({ name: 'a', url: 'b' })).rejects.toThrow('RSS 소스 추가 실패');
    });

    it('an extra or a missing field never blocks the screen (briefing settings without auto_alert_high_signal)', async () => {
      const settings = {
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
      // v0.4.2 backend 모양: 통과, 경고 없음
      server.use(http.get('*/api/briefing/settings', () => HttpResponse.json(settings)));
      expect((await fetchBriefingSettings()).webhooks.auto_dispatch_daily_briefing).toBe(true);
      expect(warn).not.toHaveBeenCalled();

      // 옛 backend 가 필드를 더 보내도 통과 (모르는 키는 버린다)
      server.use(
        http.get('*/api/briefing/settings', () =>
          HttpResponse.json({ ...settings, webhooks: { ...settings.webhooks, auto_alert_high_signal: true } })
        )
      );
      expect((await fetchBriefingSettings()).title).toBe('오늘의 AI 브리핑');
      expect(warn).not.toHaveBeenCalled();

      // 필수 필드가 빠져도 던지지 않고 경고 + 받은 데이터 그대로
      const { title: _omit, ...withoutTitle } = settings;
      void _omit;
      server.use(http.get('*/api/briefing/settings', () => HttpResponse.json(withoutTitle)));
      expect((await fetchBriefingSettings()).auto_dispatch_hour).toBe(9);
      expect(warn).toHaveBeenCalledWith('[계약 위반] GET /api/briefing/settings', expect.any(Array));
    });

    it('readErrorMessage ignores the old {"detail"} shape', async () => {
      const res = new Response(JSON.stringify({ detail: 'old' }), { status: 404 });
      expect(await readErrorMessage(res, '기본 문구')).toBe('기본 문구');
    });

    it('parseChatSsePayload validates known events and passes unknown events through', () => {
      const bad = { step: 'not-a-step', label: 'x', timestamp: 't' };
      expect(parseChatSsePayload('status', bad)).toBe(bad);
      expect(warn).toHaveBeenCalledWith('[계약 위반] POST /api/chat/stream event: status', expect.any(Array));
      const unknown = { anything: 1 };
      expect(parseChatSsePayload('heartbeat', unknown)).toBe(unknown);
    });
  });
});

// ============================================================================
// v1.4 (v0.4.2 2차): 모든 응답 시각에 UTC 오프셋, 스트림 session_id UUID, UI 메시지 id, 단계 4값, Ask AI SSE 검증
// ============================================================================

describe('Contract v1.4: UTC offsets, stream session UUID, UI message id, Ask AI SSE validation', () => {
  beforeEach(() => {
    resetMockSessionStore();
  });

  const OFFSET = '2026-11-06T01:02:03.123456+00:00';
  const NAIVE = '2026-11-06T01:02:03.123456';
  const SPACED = '2026-11-06 01:02:03';

  describe('Every backend timestamp carries a UTC offset (N-09)', () => {
    const summary = {
      id: '7b6a48f2-2973-45f6-8c46-9562725b821a',
      title: 't',
      created_at: OFFSET,
      updated_at: OFFSET,
      scope_mode: 'global',
    };
    const message = {
      id: 'msg-user-abc1234',
      session_id: summary.id,
      role: 'user',
      content: 'q',
      created_at: OFFSET,
    };
    const article = { ...mockArticles[101], published_at: OFFSET, created_at: OFFSET, scraped_at: OFFSET };
    const log = { id: 1, source: 'rss', items_crawled: 3, items_saved: 2, status: 'success', started_at: OFFSET, completed_at: OFFSET };
    const schedule = {
      current_time: OFFSET,
      schedule_hours: [6, 18],
      timezone: 'UTC',
      next_run: OFFSET,
      minutes_until_next_run: 12.5,
      is_running: false,
      last_crawl_time: OFFSET,
      last_crawl_status: 'idle',
      recent_logs: [log],
    };
    const audit = {
      id: 1,
      source_name: 'a',
      site_url: 's',
      feed_url: 'f',
      category: 'ai_news',
      relevance_score: 0.8,
      verdict: 'WATCHLIST',
      verdict_reason: 'r',
      analyzed_articles_count: 3,
      created_at: OFFSET,
    };

    const cases: [string, () => { success: boolean }, () => { success: boolean }][] = [
      ['session summary created_at·updated_at', () => ChatSessionSummarySchema.safeParse(summary), () => ChatSessionSummarySchema.safeParse({ ...summary, updated_at: NAIVE })],
      ['message created_at', () => ChatMessageItemSchema.safeParse(message), () => ChatMessageItemSchema.safeParse({ ...message, created_at: NAIVE })],
      ['session detail + active_source', () => ChatSessionDetailSchema.safeParse({ ...summary, active_source: article, messages: [message] }), () => ChatSessionDetailSchema.safeParse({ ...summary, active_source: { ...article, scraped_at: NAIVE }, messages: [message] })],
      ['source detail published_at·created_at·scraped_at', () => ChatSourceDetailResponseSchema.safeParse(article), () => ChatSourceDetailResponseSchema.safeParse({ ...article, published_at: NAIVE })],
      ['SSE sources[].published_at (global used a space)', () => ChatSourceItemSchema.safeParse({ index: 1, title: 't', url: 'u', source: 's', published_at: OFFSET }), () => ChatSourceItemSchema.safeParse({ index: 1, title: 't', url: 'u', source: 's', published_at: SPACED })],
      ['schedule last_crawl_time·recent_logs', () => ScheduleStatusSchema.safeParse(schedule), () => ScheduleStatusSchema.safeParse({ ...schedule, recent_logs: [{ ...log, started_at: NAIVE }] })],
      ['research audit created_at', () => ResearchAuditLogSchema.safeParse(audit), () => ResearchAuditLogSchema.safeParse({ ...audit, created_at: NAIVE })],
    ];
    for (const [name, ok, naive] of cases) {
      it(`${name}: offset passes, offset-less is a contract violation`, () => {
        expect(ok().success).toBe(true);
        expect(naive().success).toBe(false);
      });
    }

    it('nullable timestamps stay nullable (scraped_at, last_crawl_time, started_at·completed_at)', () => {
      expect(ChatSourceDetailResponseSchema.safeParse({ ...article, scraped_at: null, created_at: null }).success).toBe(true);
      expect(
        ScheduleStatusSchema.safeParse({ ...schedule, last_crawl_time: null, recent_logs: [{ ...log, started_at: null, completed_at: null }] }).success
      ).toBe(true);
    });

    it('schedule_hours and timezone are required; recent_logs status is success·partial_failure·failed', () => {
      const { schedule_hours: _h, ...noHours } = schedule;
      void _h;
      expect(ScheduleStatusSchema.safeParse(noHours).success).toBe(false);
      const { timezone: _t, ...noTz } = schedule;
      void _t;
      expect(ScheduleStatusSchema.safeParse(noTz).success).toBe(false);
      for (const status of ['success', 'partial_failure', 'failed']) {
        expect(ScheduleStatusSchema.safeParse({ ...schedule, recent_logs: [{ ...log, status }] }).success, status).toBe(true);
      }
      expect(ScheduleStatusSchema.safeParse({ ...schedule, recent_logs: [{ ...log, status: 'running' }] }).success).toBe(false);
    });

    it('MSW chat responses carry offset timestamps (sessions, detail, source, SSE sources)', async () => {
      const list = await (await fetch('/api/chat/sessions')).json();
      expect(z.array(ChatSessionSummarySchema).safeParse(list).success).toBe(true);
      const detail = await (await fetch(`/api/chat/sessions/${initialMockSessions[0].id}`)).json();
      expect(ChatSessionDetailSchema.safeParse(detail).success).toBe(true);
      const source = await (await fetch('/api/chat/sources/101')).json();
      expect(ChatSourceDetailResponseSchema.safeParse(source).success).toBe(true);
      const events = await streamEvents({ question: 'FastMCP 데코레이터', scope: 'global' });
      const sources = events.find((e) => e.event === 'sources')!.data;
      expect(ChatSourcesPayloadSchema.safeParse(sources).success).toBe(true);
      const after = await (await fetch(`/api/chat/sessions/${initialMockSessions[0].id}`)).json();
      expect(ChatSessionDetailSchema.safeParse(after).success).toBe(true);
    });
  });

  describe('POST /api/schedule/trigger already_running carries other_process (N-12)', () => {
    it('fixtures for started, already_running (this process) and already_running (other process) match the schema', () => {
      expect(mockTriggerResponses.started).not.toHaveProperty('other_process');
      expect(mockTriggerResponses.alreadyRunning.other_process).toBe(false);
      expect(mockTriggerResponses.otherProcess.other_process).toBe(true);
      expect(mockTriggerResponses.otherProcess.message).toBe('다른 프로세스(MCP 서버·make collect)가 같은 DB 에 수집 중입니다.');
      for (const r of Object.values(mockTriggerResponses)) {
        expect(ManualCollectResponseSchema.strict().safeParse(r).success).toBe(true);
      }
      expect(
        ManualCollectResponseSchema.safeParse({ ...mockTriggerResponses.otherProcess, other_process: 'yes' }).success
      ).toBe(false);
    });

    it('MSW answers started by default; triggerManualCollect keeps other_process without a warning', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(await triggerManualCollect()).toEqual(mockTriggerResponses.started);
      server.use(http.post('*/api/schedule/trigger', () => HttpResponse.json(mockTriggerResponses.otherProcess)));
      const busy = await triggerManualCollect();
      expect(busy.status).toBe('already_running');
      expect(busy.other_process).toBe(true);
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });
  });

  describe('POST /api/chat/stream session_id must be a UUID', () => {
    it('MSW returns 400 ERR_SESSION_INVALID_UUID for a non-UUID session_id', async () => {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'FastMCP', session_id: 'not-a-uuid' }),
      });
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        error_code: 'ERR_SESSION_INVALID_UUID',
        message: '유효하지 않은 세션 UUID 형식입니다.',
        details: null,
      });
    });

    it('omitted or null session_id gets a server-made UUID', async () => {
      for (const body of [{ question: 'FastMCP' }, { question: 'FastMCP', session_id: null }]) {
        const events = await streamEvents(body);
        expect(String(events.at(-1)!.data.session_id)).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      }
    });
  });

  describe('UI ChatMessage id follows the real contract (msg-user-xxxxxxx, 1~36 chars)', () => {
    const base = { role: 'user', content: 'q', timestamp: OFFSET, scope: 'global' };
    it('accepts client ids and UUIDs, rejects empty and over-36', () => {
      expect(ChatMessageSchema.safeParse({ ...base, id: 'msg-user-abc1234' }).success).toBe(true);
      expect(ChatMessageSchema.safeParse({ ...base, id: '0b8f4c1e-9a7d-4e2b-8c3f-1d2e3f4a5b6c' }).success).toBe(true);
      expect(ChatMessageSchema.safeParse({ ...base, id: '' }).success).toBe(false);
      expect(ChatMessageSchema.safeParse({ ...base, id: 'x'.repeat(37) }).success).toBe(false);
    });
  });

  describe('Article Ask AI SSE lines are validated without throwing', () => {
    let warn: ReturnType<typeof vi.spyOn>;
    beforeEach(() => {
      warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => {
      warn.mockRestore();
    });

    it('parseNewsAskSsePayload passes meta·token·done·error and warns on a malformed known event', () => {
      for (const payload of [
        { event: 'meta', model: 'claude-sonnet-5-5' },
        { event: 'token', text: '조각' },
        { event: 'done', total_text: '전체' },
        { event: 'error', error_code: 'ERR_LLM_STREAM_FAILED', message: '답변 생성이 중간에 끊겼습니다. 다시 시도해 주세요.', retryable: true },
      ]) {
        expect(parseNewsAskSsePayload(payload)).toEqual(payload);
      }
      expect(warn).not.toHaveBeenCalled();
      const bad = { event: 'token', text: 42 };
      expect(parseNewsAskSsePayload(bad)).toBe(bad);
      expect(warn).toHaveBeenCalledWith('[계약 위반] POST /api/news/{id}/ask/stream event: token', expect.any(Array));
    });

    it('askQuestionAboutNewsStream validates each line: the MSW stream gives no warning, a malformed meta warns', async () => {
      const ok = await askQuestionAboutNewsStream(101, '핵심은?');
      expect(ok.model_used).toBe('claude-sonnet-5-5');
      expect(warn).not.toHaveBeenCalled();

      server.use(
        http.post('*/api/news/:id/ask/stream', () =>
          new HttpResponse(
            'data: {"event":"meta","model":7}\n\ndata: {"event":"token","text":"a"}\n\ndata: {"event":"done","total_text":"a"}\n\n',
            { headers: { 'Content-Type': 'text/event-stream' } }
          )
        )
      );
      const res = await askQuestionAboutNewsStream(101, '핵심은?');
      expect(res.answer).toBe('a');
      expect(warn).toHaveBeenCalledWith('[계약 위반] POST /api/news/{id}/ask/stream event: meta', expect.any(Array));
    });
  });
});

// ============================================================================
// 테스트 격리: 화면이 부르는 엔드포인트는 모두 기본 MSW 핸들러가 있고, 응답이 계약을 지킨다
// ============================================================================

describe('Default MSW covers every endpoint the UI calls (test isolation)', () => {
  it('each lib/api.ts call is answered by a default mock that passes its zod schema (no warning, no unhandled request)', async () => {
    const api = await import('@/lib/api');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await api.fetchNewsFeed({});
    await api.fetchDailyBriefing();
    await api.fetchScheduleStatus();
    await api.fetchCrawlProgress();
    await api.triggerManualCollect();
    await api.fetchStats();
    await api.fetchTechRadar();
    await api.testWebhook('https://hooks.slack.com/services/x');
    await api.resetAndRecollect();
    await api.fetchSources();
    await api.toggleSource('github_repo', 'jlowin/fastmcp');
    await api.addRssSource({ name: 'Example', url: 'https://example.com/feed.xml' });
    await api.deleteSource('rss', 'https://example.com/feed.xml');
    await api.inspectUrl('https://example.com');
    await api.fetchDeepResearchStatus();
    await api.fetchResearchAuditLogs(30);
    await api.triggerDeepResearch(6);
    await api.exportBriefingToNotion();
    await api.sendBriefingByEmail();
    await api.testNotionConnection();
    await api.testEmailConnection({});
    await api.fetchBriefingSettings();
    await api.updateBriefingSettings({});
    await api.askQuestionAboutNewsStream(101, '핵심은?');
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('range-checked queries answer 400 ERR_INVALID_PAYLOAD like backend (audit-logs limit 1~200, run-deep 1~20)', async () => {
    for (const url of ['/api/research/audit-logs?limit=0', '/api/research/audit-logs?limit=201']) {
      const res = await fetch(url);
      expect(res.status).toBe(400);
      expect((await res.json()).error_code).toBe('ERR_INVALID_PAYLOAD');
    }
    const res = await fetch('/api/research/run-deep?max_candidates=21', { method: 'POST' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/research/status last_run_summary carries adopt_failed (v1.4)', () => {
  it('summary fields are typed: adopt_failed is an integer, the three backend shapes pass', () => {
    const base = { is_running: false, last_run_time: null, auto_adopted_count: 0, cadence: 'Every 12 hours' };
    const done = {
      evaluated_total: 3,
      auto_adopted: 1,
      adopt_failed: 1,
      completed_at: '2026-11-10T03:00:00+00:00',
      results: [{ source_name: 'a', site_url: 's', feed_url: 'f', category: 'ai_news', score: 0.9, verdict: 'WATCHLIST', reason: 'sources.json 저장 실패' }],
    };
    expect(ResearchStatusSchema.safeParse({ ...base, last_run_summary: {} }).success).toBe(true);
    expect(ResearchStatusSchema.safeParse({ ...base, last_run_summary: done }).success).toBe(true);
    expect(
      ResearchStatusSchema.safeParse({ ...base, last_run_summary: { status: 'error', error: 'TimeoutError', completed_at: '2026-11-10T03:00:00+00:00' } }).success
    ).toBe(true);
    expect(ResearchStatusSchema.safeParse({ ...base, last_run_summary: { ...done, adopt_failed: '1' } }).success).toBe(false);
    expect(ResearchStatusSchema.safeParse({ ...base, last_run_summary: { ...done, adopt_failed: 1.5 } }).success).toBe(false);
  });

  it('MSW research status reports adopt_failed and the failed candidate stays WATCHLIST with a reason', async () => {
    const status = await (await fetch('/api/research/status')).json();
    expect(ResearchStatusSchema.safeParse(status).success).toBe(true);
    expect(status.last_run_summary.adopt_failed).toBe(1);
    const failed = status.last_run_summary.results.filter((r: { verdict: string }) => r.verdict === 'WATCHLIST');
    expect(failed.length).toBeGreaterThan(0);
    const logs = await (await fetch('/api/research/audit-logs')).json();
    expect(logs.logs.some((l: { verdict: string; verdict_reason: string }) => l.verdict === 'WATCHLIST' && /저장/.test(l.verdict_reason))).toBe(true);
  });
});
