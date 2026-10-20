import { describe, it, expect, beforeEach } from 'vitest';
import {
  ChatFocusFilterSchema,
  ChatStreamRequestSchema,
  ChatQueryRequestSchema,
  ChatQueryResponseSchema,
  ChatStatusStepSchema,
  ChatStatusPayloadSchema,
  ChatSourceItemSchema,
  ChatSourcesPayloadSchema,
  LlmErrorCodeSchema,
  LlmErrorResponseSchema,
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
  ChatMessage,
  Message,
  MessageSchema,
  SendMessageRequest,
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
  ModelTier,
  ChatModel,
  TokenUsageMeta,
  ChatModelSelectorProps,
  ModelTierBadgeProps,
  ModelChangeDividerProps,
  ModelSwitchEvent,
  ChatTimelineItem,
  ChatHeaderProps,
  sanitizeModelTier,
  formatModelDisplayName,
  getModelLabel,
} from '@/types/chat';
import {
  NewsItemSchema,
  NewsListResponseSchema,
  SourceConfigSchema,
  SourcesResponseSchema,
} from '@/types/news';
import { resetMockSessionStore } from '@/mocks/handlers';

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
    it('validates all 7 agentic & ReAct workflow step enum values', () => {
      const steps = [
        'thinking',
        'tool_calling',
        'observing',
        'extracting_source',
        'evaluating_sufficiency',
        'agentic_searching',
        'synthesizing',
      ] as const;

      steps.forEach((step) => {
        expect(ChatStatusStepSchema.parse(step)).toBe(step);
      });
    });

    it('validates ChatStatusPayload schema with optional query and progress', () => {
      const payload = {
        step: 'agentic_searching' as const,
        label: '🔍 보충 기술 문서 자율 검색 중...',
        timestamp: '2026-09-16T09:40:03Z',
        progress: 65,
        query: 'FastMCP python documentation',
        sources_found: 2,
      };

      const parsed = ChatStatusPayloadSchema.parse(payload);
      expect(parsed.step).toBe('agentic_searching');
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

  describe('Real LLM Failure Error Contracts', () => {
    it('validates standard LLM error codes', () => {
      const codes = [
        'ERR_LLM_PROVIDER_UNAVAILABLE',
        'ERR_LLM_UPSTREAM_FAILED',
        'ERR_LLM_STREAM_FAILED',
        'ERR_LLM_QUOTA_EXCEEDED',
        'ERR_CHAT_STREAM_TIMEOUT',
      ] as const;

      codes.forEach((code) => {
        expect(LlmErrorCodeSchema.parse(code)).toBe(code);
      });
    });

    it('validates LlmErrorResponse schema for upstream errors (502 / 503)', () => {
      const errorPayload = {
        error_code: 'ERR_LLM_UPSTREAM_FAILED' as const,
        message: '외부 LLM 업스트림 통신에 실패했습니다.',
        status_code: 502,
        provider: 'gemini',
        retryable: true,
      };

      const parsed = LlmErrorResponseSchema.parse(errorPayload);
      expect(parsed.error_code).toBe('ERR_LLM_UPSTREAM_FAILED');
      expect(parsed.status_code).toBe(502);
      expect(parsed.retryable).toBe(true);
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

    it('handles POST /api/chat/query with filters and returns dual sources', async () => {
      const res = await fetch('/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'MCP 프레임워크 추천',
          scope: 'global',
          filters: {
            category: 'mcp_plugins_skills',
            time_range: '7d',
            sort: 'quality',
            high_signal_only: true,
          },
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.applied_filters?.category).toBe('mcp_plugins_skills');
      expect(data.sources.length).toBeGreaterThan(0);
      expect(data.primary_count).toBeGreaterThanOrEqual(1);
      expect(data.supplementary_count).toBeGreaterThanOrEqual(1);
    });

    it('handles GET /api/chat/search with category and high_signal_only filters', async () => {
      const res = await fetch('/api/chat/search?q=FastMCP&category=mcp_plugins_skills&high_signal_only=true');
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.query).toBe('FastMCP');
      expect(data.chunks.length).toBeGreaterThan(0);
      expect(data.chunks[0].category).toBe('mcp_plugins_skills');
      expect(data.chunks[0].quality_score).toBeGreaterThanOrEqual(7.8);
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

    it('rejects invalid UUID in ChatSessionSummarySchema', () => {
      expect(() => {
        ChatSessionSummarySchema.parse({
          id: 'invalid-not-uuid',
          title: 'Test',
          created_at: '2026-09-28T08:00:00Z',
          updated_at: '2026-09-28T08:15:30Z',
          scope_mode: 'global',
          message_count: 0,
        });
      }).toThrow();
    });

    it('validates ChatMessageItemSchema and coerces numeric id to string', () => {
      const rawItem = {
        id: 12345,
        session_id: '7b6a48f2-2973-45f6-8c46-9562725b821a',
        role: 'user',
        content: '질문입니다',
        created_at: '2026-09-28T08:00:00Z',
        status: 'completed',
      };

      const parsed = ChatMessageItemSchema.parse(rawItem);
      expect(parsed.id).toBe('12345');
      expect(parsed.role).toBe('user');
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
      expect(listData.some((s: any) => s.id === created.id)).toBe(true);
    });

    it('handles POST /api/chat/sessions 400 error trigger', async () => {
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '[TRIGGER_400]' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error_code).toBe('ERR_SESSION_INVALID_UUID');
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
      const targetId = '9d8c60f4-4195-67b8-0e68-1784947da43c';
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

      const mockResponse = {
        status: 'success',
        sources_file: 'sources.json',
        data: parsedConfig,
      };
      const parsedRes = SourcesResponseSchema.parse(mockResponse);
      expect(parsedRes.status).toBe('success');
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
      expect(data.items.every((i: any) => i.category === 'mcp_plugins_skills')).toBe(true);
      expect(data.items.every((i: any) => i.quality_score >= 7.8 || i.is_high_signal)).toBe(true);
    });

    it('handles GET /api/news 400 Bad Request fallback (invalid page)', async () => {
      const res = await fetch('/api/news?page=0');
      expect(res.status).toBe(400);
      const err = await res.json();
      expect(err.error_code).toBe('ERR_INVALID_PAGE_PARAM');
    });

    it('handles GET /api/news 500 Internal Error trigger', async () => {
      const res = await fetch('/api/news?trigger_error=500');
      expect(res.status).toBe(500);
      const err = await res.json();
      expect(err.error_code).toBe('ERR_FEED_FETCH_FAILED');
    });

    it('handles GET /api/news 503 Fallback trigger', async () => {
      const res = await fetch('/api/news?search=[TRIGGER_503]');
      expect(res.status).toBe(503);
      const err = await res.json();
      expect(err.error_code).toBe('ERR_LLM_PROVIDER_UNAVAILABLE');
    });

    it('handles GET /api/news/:id 404 Not Found fallback', async () => {
      const res = await fetch('/api/news/999999');
      expect(res.status).toBe(404);
      const err = await res.json();
      expect(err.error_code).toBe('ERR_FEED_CARD_NOT_FOUND');
    });

    it('handles POST /api/news/:id/ask 503 Fallback trigger', async () => {
      const res = await fetch('/api/news/101/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: '[TRIGGER_503]' }),
      });
      expect(res.status).toBe(503);
      const err = await res.json();
      expect(err.error_code).toBe('ERR_LLM_PROVIDER_UNAVAILABLE');
    });

    it('handles GET /api/chat/stream SSE streaming mock', async () => {
      const res = await fetch('/api/chat/stream?question=FastMCP_SSE_GET_Test');
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/event-stream');
      const text = await res.text();
      expect(text).toContain('event: status');
      expect(text).toContain('event: done');
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

      // Rejects negative token counts
      expect(() => TokenUsageMetaSchema.parse({ input_tokens: -1, output_tokens: 100 })).toThrow();
    });

    it('validates ChatStreamRequestSchema with optional model and model_tier defaults', () => {
      const minimal = ChatStreamRequestSchema.parse({ question: 'Hello Claude' });
      expect(minimal.model).toBe('claude-sonnet-5-5');
      expect(minimal.model_tier).toBeUndefined();

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

    it('validates Claude v4.0 error codes in LlmErrorCodeSchema', () => {
      const v4Codes = [
        'ERR_CLAUDE_API_KEY_MISSING',
        'ERR_ANTHROPIC_KEY_MISSING',
        'ERR_CLAUDE_QUOTA_EXCEEDED',
        'ERR_ANTHROPIC_RATE_LIMIT',
        'ERR_CLAUDE_OVERLOADED',
        'ERR_ANTHROPIC_OVERLOADED',
        'ERR_INVALID_MODEL_TIER',
        'ERR_SONNET_SCHEMA_VALIDATION',
        'ERR_STREAM_ABORTED_BY_USER',
        'ERR_ARTICLE_EXTRACTION_FAIL',
      ] as const;

      v4Codes.forEach((code) => {
        expect(LlmErrorCodeSchema.parse(code)).toBe(code);
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
      const headerProps: ChatHeaderProps = {
        scopeMode: 'global',
        onNewChat: () => {},
        selectedTier: 'sonnet',
        onSelectTier: () => {},
        isStreaming: false,
      };
      expect(headerProps.selectedTier).toBe('sonnet');
      expect(headerProps.scopeMode).toBe('global');
      expect(headerProps.isStreaming).toBe(false);

      const selectorProps: ChatModelSelectorProps = {
        selectedTier: 'sonnet',
        onSelectTier: () => {},
        isStreaming: false,
        variant: 'inline-chip',
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
      expect(err.provider).toBe('anthropic');
      expect(err.retryable).toBe(false);
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
      expect(err.provider).toBe('anthropic');
      expect(err.retryable).toBe(true);
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
      expect(err.provider).toBe('anthropic');
      expect(err.retryable).toBe(true);
    });

    it('handles POST /api/chat/query with model_tier=haiku and returns full DTO contract', async () => {
      const res = await fetch('/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'Sync Haiku Query', model_tier: 'haiku' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      const parsed = ChatQueryResponseSchema.parse(data);
      expect(parsed.model).toBe('claude-haiku-5-5');
      expect(parsed.model_tier).toBe('haiku');
      expect(parsed.latency_ms).toBe(180);
      expect(parsed.usage?.input_tokens).toBe(650);
      expect(parsed.usage?.cache_read_input_tokens).toBe(2500);
    });

    it('handles GET /api/chat/stream with searchParam model_tier=opus', async () => {
      const res = await fetch('/api/chat/stream?question=FastMCP_Opus_Test&model_tier=opus');
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain('"model":"claude-opus-5-5"');
      expect(text).toContain('"model_tier":"opus"');
      expect(text).toContain('"latency_ms":1780');
      expect(text).toContain('"cache_read_input_tokens":2500');
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




