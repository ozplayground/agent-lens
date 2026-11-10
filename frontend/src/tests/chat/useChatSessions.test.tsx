import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { apiError } from '@/mocks/api-error';
import { useChatSessions } from '@/components/chat/useChatSessions';
import ChatWorkspace from '@/components/chat/ChatWorkspace';
import type { ChatMessage, ChatSessionSummary } from '@/types/chat';

/**
 * 챗 세션 훅의 저장값 검증(FE-18)·상세 캐시 정리(FE-26)·오류 문구(FE-07).
 */

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const INDEX_KEY = 'agentlens_chat_sessions_index';
const DETAIL_PREFIX = 'agentlens_chat_session_';

const summary = (n: number): ChatSessionSummary => ({
  id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  title: `세션 ${n}`,
  created_at: '2026-11-01T00:00:00Z',
  updated_at: new Date(Date.UTC(2026, 10, 1, 0, 0, 0) - n * 60_000).toISOString(),
  scope_mode: 'global',
  active_source_id: null,
  message_count: 2,
  last_message_preview: null,
  active_filters: null,
});

const turn: ChatMessage[] = [
  { id: 'msg-user-a', role: 'user', content: '새 질문', timestamp: '2026-11-10T00:00:00Z', scope: 'global', status: 'sent' },
  { id: 'msg-asst-a', role: 'assistant', content: '새 답', timestamp: '2026-11-10T00:00:01Z', scope: 'global', status: 'completed' },
];

beforeEach(() => {
  localStorage.clear();
});

describe('세션 목록 저장값 검증 (FE-18)', () => {
  it('저장된 목록이 배열이 아니고 서버도 실패하면 빈 목록과 오류로 그린다 (죽지 않는다)', async () => {
    localStorage.setItem(INDEX_KEY, '{"x":1}');
    server.use(http.get('*/api/chat/sessions', () => apiError(500, 'ERR_SERVER_INTERNAL', '세션 목록 서버 오류')));

    const { result } = renderHook(() => useChatSessions());

    expect(result.current.sessions).toEqual([]);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.sessions).toEqual([]);
    expect(result.current.error).toBe('세션 목록 서버 오류');
  });

  it('저장된 목록에서 id·제목이 없는 항목은 버린다', () => {
    localStorage.setItem(INDEX_KEY, JSON.stringify([1, null, { title: 'id 없음' }, { id: 'ok', title: '정상' }]));

    const { result } = renderHook(() => useChatSessions());

    expect(result.current.sessions.map((s) => s.id)).toEqual(['ok']);
  });

  it('챗 화면은 깨진 저장값에서도 그려진다', async () => {
    localStorage.setItem(INDEX_KEY, '{"x":1}');
    server.use(http.get('*/api/chat/sessions', () => apiError(500, 'ERR_SERVER_INTERNAL', '세션 목록 서버 오류')));

    render(<ChatWorkspace />);

    expect(screen.getByRole('textbox', { name: /질문 입력/i })).toBeInTheDocument();
    expect(await screen.findByText('세션 목록 서버 오류')).toBeInTheDocument();
  });

  it('상세 캐시가 깨져 있고 서버도 실패하면 null 을 돌려준다', async () => {
    const id = summary(1).id;
    localStorage.setItem(`${DETAIL_PREFIX}${id}`, '"문자열"');
    server.use(http.get('*/api/chat/sessions/:id', () => HttpResponse.error()));

    const { result } = renderHook(() => useChatSessions());

    await expect(result.current.loadSessionDetail(id)).resolves.toBeNull();
  });
});

describe('세션 상세 캐시 정리 (FE-26)', () => {
  it('30개를 넘겨 목록에서 밀려난 세션의 상세 캐시를 지운다', async () => {
    const summaries = Array.from({ length: 30 }, (_, i) => summary(i + 1));
    for (const s of summaries) localStorage.setItem(`${DETAIL_PREFIX}${s.id}`, '{}');
    server.use(
      http.get('*/api/chat/sessions', () => HttpResponse.json(summaries)),
      http.post('*/api/chat/sessions', () => HttpResponse.json({}, { status: 201 }))
    );
    const { result } = renderHook(() => useChatSessions());
    await waitFor(() => expect(result.current.sessions).toHaveLength(30));

    await act(async () => {
      await result.current.createOrUpdateSession({
        sessionId: '11111111-1111-4111-8111-111111111111',
        scopeMode: 'global',
        messages: turn,
      });
    });

    const evicted = summaries[29].id;
    expect(result.current.sessions).toHaveLength(30);
    expect(result.current.sessions.some((s) => s.id === evicted)).toBe(false);
    expect(localStorage.getItem(`${DETAIL_PREFIX}${evicted}`)).toBeNull();
    expect(localStorage.getItem(`${DETAIL_PREFIX}${summaries[0].id}`)).not.toBeNull();
  });

  it('목록을 비우면 상세 캐시도 모두 지운다', async () => {
    localStorage.setItem(`${DETAIL_PREFIX}a`, '{}');
    localStorage.setItem(`${DETAIL_PREFIX}b`, '{}');
    localStorage.setItem('agentlens_theme', 'dark');
    const { result } = renderHook(() => useChatSessions());

    act(() => result.current.resetSessions());

    expect(localStorage.getItem(`${DETAIL_PREFIX}a`)).toBeNull();
    expect(localStorage.getItem(`${DETAIL_PREFIX}b`)).toBeNull();
    expect(localStorage.getItem(INDEX_KEY)).toBeNull();
    expect(localStorage.getItem('agentlens_theme')).toBe('dark');
  });
});

describe('세션 삭제 실패 (FE-07·FE-15)', () => {
  it('삭제가 실패하면 backend message 로 던지고 목록을 다시 읽어 되돌린다', async () => {
    const summaries = [summary(1)];
    server.use(
      http.get('*/api/chat/sessions', () => HttpResponse.json(summaries)),
      http.delete('*/api/chat/sessions/:id', () => apiError(500, 'ERR_SESSION_DELETE_FAILED', '삭제 서버 오류'))
    );
    const { result } = renderHook(() => useChatSessions());
    await waitFor(() => expect(result.current.sessions).toHaveLength(1));

    let thrown: unknown;
    await act(async () => {
      await result.current.deleteSession(summaries[0].id).catch((e: unknown) => {
        thrown = e;
      });
    });

    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toBe('삭제 서버 오류');
    await waitFor(() => expect(result.current.sessions).toHaveLength(1));
  });
});
