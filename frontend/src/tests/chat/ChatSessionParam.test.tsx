import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { apiError } from '@/mocks/api-error';
import { ToastRegion, clearToasts } from '@/components/ui/Toast';
import ChatWorkspace from '@/components/chat/ChatWorkspace';

/**
 * URL 의 `session_id` 검증 (FE-24): UUID 가 아니면 세션을 열지 않고 빈 대화로 시작한다.
 */

const params = vi.hoisted(() => ({ sessionId: null as string | null, sourceId: null as string | null }));

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'session_id' ? params.sessionId : key === 'sourceId' ? params.sourceId : null),
  }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

function recordPaths() {
  const paths: string[] = [];
  server.events.on('request:start', ({ request }) => {
    paths.push(new URL(request.url).pathname);
  });
  return paths;
}

const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 100)));

describe('ChatWorkspace — URL session_id 검증 (FE-24)', () => {
  beforeEach(() => {
    localStorage.clear();
    server.events.removeAllListeners();
    params.sessionId = null;
    params.sourceId = null;
  });

  it('UUID 가 아닌 session_id 는 요청하지 않고 빈 대화로 시작한다', async () => {
    params.sessionId = '../../news';
    const paths = recordPaths();
    render(<ChatWorkspace />);
    await settle();

    expect(paths.filter((p) => p.startsWith('/api/chat/sessions/'))).toEqual([]);
    expect(paths.some((p) => p.startsWith('/api/news'))).toBe(false);
    expect(screen.getByText(/AgentLens AI 챗 워크스페이스/)).toBeInTheDocument();
  });

  it('UUID 인 session_id 는 그 세션 상세를 요청한다', async () => {
    const id = '2b1c7a52-0d1e-4e8f-9a3b-6c5d4e3f2a10';
    params.sessionId = id;
    server.use(
      http.get('*/api/chat/sessions/:id', () =>
        HttpResponse.json({
          id,
          title: '열린 세션',
          created_at: '2026-11-10T00:00:00Z',
          updated_at: '2026-11-10T00:00:00Z',
          scope_mode: 'global',
          messages: [
            { id: 'm1', session_id: id, role: 'user', content: '열린 세션 질문', created_at: '2026-11-10T00:00:00Z' },
          ],
        })
      )
    );
    const paths = recordPaths();
    render(<ChatWorkspace />);

    expect(await screen.findByText('열린 세션 질문')).toBeInTheDocument();
    expect(paths).toContain(`/api/chat/sessions/${id}`);
  });
});

describe('ChatWorkspace — URL sourceId 실패 문구 (FE-41)', () => {
  beforeEach(() => {
    localStorage.clear();
    clearToasts();
    params.sessionId = null;
    params.sourceId = '777';
  });

  it('기사가 없으면(404) 기사를 찾을 수 없다고 알린다', async () => {
    server.use(http.get('*/api/chat/sources/:id', () => apiError(404, 'ERR_HANDOVER_SOURCE_NOT_FOUND', '없음')));
    render(<><ChatWorkspace /><ToastRegion /></>);

    expect(await screen.findByText('요청하신 기사를 찾을 수 없어 전체 소식 모드로 시작합니다.')).toBeInTheDocument();
  });

  it('서버 오류·연결 실패면 기사가 없다고 하지 않고 불러오지 못했다고 알린다', async () => {
    server.use(http.get('*/api/chat/sources/:id', () => apiError(500, 'ERR_SERVER_INTERNAL', '서버 오류')));
    render(<><ChatWorkspace /><ToastRegion /></>);

    expect(
      await screen.findByText('기사 정보를 불러오지 못해 전체 소식 모드로 시작합니다. 연결 상태를 확인해 주세요.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/기사를 찾을 수 없어/)).toBeNull();
  });
});

describe('ChatWorkspace — 세션 열기 실패 (FE-40)', () => {
  const current = '2b1c7a52-0d1e-4e8f-9a3b-6c5d4e3f2a10';
  const broken = '3c2d8b63-1e2f-4f90-8b4c-7d6e5f4a3b21';

  beforeEach(() => {
    localStorage.clear();
    clearToasts();
    params.sessionId = null;
    params.sourceId = null;
  });

  it('상세를 불러오지 못하면 지금 대화를 그대로 두고, 다음 저장도 지금 세션 id 로 하며, 실패를 알린다', async () => {
    const posted: string[] = [];
    server.use(
      http.get('*/api/chat/sessions', () =>
        HttpResponse.json([
          {
            id: broken,
            title: '깨진 세션',
            created_at: '2026-11-10T00:00:00Z',
            updated_at: '2026-11-10T00:00:00Z',
            scope_mode: 'global',
            message_count: 2,
          },
        ])
      ),
      http.get('*/api/chat/sessions/:id', () => apiError(500, 'ERR_SERVER_INTERNAL', '상세 서버 오류')),
      http.post('*/api/chat/sessions', async ({ request }) => {
        posted.push(((await request.json()) as { id: string }).id);
        return HttpResponse.json({}, { status: 201 });
      }),
      http.post('*/api/chat/stream', () =>
        new HttpResponse('event: token\ndata: {"token":"답"}\n\nevent: done\ndata: {}\n\n', {
          headers: { 'Content-Type': 'text/event-stream' },
        })
      )
    );
    params.sessionId = current;
    server.use(
      http.get(`*/api/chat/sessions/${current}`, () =>
        HttpResponse.json({
          id: current,
          title: '지금 세션',
          created_at: '2026-11-10T00:00:00Z',
          updated_at: '2026-11-10T00:00:00Z',
          scope_mode: 'global',
          messages: [
            { id: 'm1', session_id: current, role: 'user', content: '지금 대화 질문', created_at: '2026-11-10T00:00:00Z' },
          ],
        })
      )
    );
    render(<><ChatWorkspace /><ToastRegion /></>);
    expect(await screen.findByText('지금 대화 질문')).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: /대화: 깨진 세션/ }));

    expect(await screen.findByText('대화를 불러오지 못했습니다.')).toBeInTheDocument();
    expect(screen.getByText('지금 대화 질문')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: /질문 입력/i }), { target: { value: '이어서 질문' } });
    fireEvent.click(screen.getByRole('button', { name: /질문 전송/i }));
    await waitFor(() => expect(posted.length).toBeGreaterThan(0));
    expect(posted.every((id) => id === current)).toBe(true);
  });
});
