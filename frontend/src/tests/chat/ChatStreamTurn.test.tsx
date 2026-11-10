import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { apiError } from '@/mocks/api-error';
import ChatWorkspace from '@/components/chat/ChatWorkspace';

/**
 * 챗 한 턴(질문 → 스트림 → 저장)의 회귀 테스트.
 * docs/frontend-code-reviewer/01_CODE_REVIEW_REPORT.md FE-01·FE-02·FE-03.
 */

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

interface StreamRequestBody {
  question?: string;
  history?: { role: string; content: string }[];
  model_tier: string;
  model: string;
  user_message_id?: string;
  assistant_message_id?: string;
}

interface SessionPostBody {
  messages: { id: string; role: string; content: string; status: string }[];
}

/** 주어진 SSE 본문을 한 번에 보내고 닫는 응답 */
function sse(body: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(body));
      controller.close();
    },
  });
  return new HttpResponse(stream, { headers: { 'Content-Type': 'text/event-stream' } });
}

function ask(question: string) {
  const textarea = screen.getByRole('textbox', { name: /질문 입력/i });
  fireEvent.change(textarea, { target: { value: question } });
  fireEvent.click(screen.getByRole('button', { name: /질문 전송/i }));
}

/** 세션 저장 POST 본문을 모은다 */
function captureSessionPosts() {
  const posts: SessionPostBody[] = [];
  server.use(
    http.post('*/api/chat/sessions', async ({ request }) => {
      posts.push((await request.json()) as SessionPostBody);
      return HttpResponse.json({ ok: true });
    })
  );
  return posts;
}

/** 늦게 도착하는 저장 요청까지 기다린다 (그 사이 상태 갱신은 act 안에서) */
const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 300)));

describe('ChatWorkspace — 한 턴 전송과 저장', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('FE-01: 모델을 바꾼 직후 보낸 질문은 바꾼 모델(티어)로 요청한다', async () => {
    const bodies: StreamRequestBody[] = [];
    server.use(
      http.post('*/api/chat/stream', async ({ request }) => {
        bodies.push((await request.json()) as StreamRequestBody);
        return sse('event: token\ndata: {"token":"하이쿠 답"}\n\nevent: done\ndata: {"model_tier":"haiku"}\n\n');
      })
    );
    render(<ChatWorkspace />);

    fireEvent.click(screen.getByRole('button', { name: /Claude 모델 선택/i }));
    fireEvent.click(screen.getByRole('radio', { name: /Haiku 5\.5/i }));
    expect(screen.getByRole('button', { name: /Claude 모델 선택/i })).toHaveTextContent(/Haiku/);

    ask('티어 확인');

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0].model_tier).toBe('haiku');
    expect(bodies[0].model).toBe('claude-haiku-5-5');
  });

  it('FE-02: 완료된 한 턴은 세션 저장 POST 를 한 번만 보낸다', async () => {
    const posts = captureSessionPosts();
    server.use(
      http.post('*/api/chat/stream', () =>
        sse('event: token\ndata: {"token":"한 번 저장 답"}\n\nevent: done\ndata: {"model":"claude-sonnet-5-5"}\n\n')
      )
    );
    render(<ChatWorkspace />);

    ask('저장 횟수');

    await waitFor(() => expect(screen.getByText('한 번 저장 답')).toBeInTheDocument());
    await settle();
    expect(posts).toHaveLength(1);
    expect(posts[0].messages.map((m) => [m.role, m.content, m.status])).toEqual([
      ['user', '저장 횟수', 'completed'],
      ['assistant', '한 번 저장 답', 'completed'],
    ]);
  });

  it('FE-02: StrictMode 에서도 완료된 한 턴은 세션 저장 POST 를 한 번만 보낸다', async () => {
    const posts = captureSessionPosts();
    server.use(
      http.post('*/api/chat/stream', () =>
        sse('event: token\ndata: {"token":"엄격 모드 답"}\n\nevent: done\ndata: {"model":"claude-sonnet-5-5"}\n\n')
      )
    );
    render(
      <React.StrictMode>
        <ChatWorkspace />
      </React.StrictMode>
    );

    ask('엄격 모드 저장');

    await waitFor(() => expect(screen.getByText('엄격 모드 답')).toBeInTheDocument());
    await settle();
    expect(posts).toHaveLength(1);
  });

  it('FE-03: done 없이 끊긴 스트림은 오류로 보이고 완료로 저장하지 않는다', async () => {
    const posts = captureSessionPosts();
    server.use(http.post('*/api/chat/stream', () => sse('event: token\ndata: {"token":"잘린 답"}\n\n')));
    render(<ChatWorkspace />);

    ask('잘림 확인');

    await waitFor(() => expect(screen.getByText('응답이 중간에 끊겼습니다. 다시 시도해 주세요.')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: '답변 다시 시도' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: '리포트 익스포트 툴바' })).not.toBeInTheDocument();

    await settle();
    const savedAssistantStatuses = [
      ...posts.flatMap((p) => p.messages),
      ...Object.keys(localStorage)
        .filter((k) => k.startsWith('agentlens_chat_session_'))
        .flatMap((k) => (JSON.parse(localStorage.getItem(k) || '{}') as SessionPostBody).messages ?? []),
    ]
      .filter((m) => m.role === 'assistant')
      .map((m) => m.status);
    expect(savedAssistantStatuses).not.toContain('completed');
  });

  it('BUG-02R: 스트림 요청에 클라이언트 메시지 id 두 개를 싣고, 세션 저장도 같은 id 를 쓴다', async () => {
    const bodies: StreamRequestBody[] = [];
    const posts = captureSessionPosts();
    server.use(
      http.post('*/api/chat/stream', async ({ request }) => {
        bodies.push((await request.json()) as StreamRequestBody);
        return sse('event: token\ndata: {"token":"id 확인 답"}\n\nevent: done\ndata: {"model":"claude-sonnet-5-5"}\n\n');
      })
    );
    render(<ChatWorkspace />);

    ask('id 확인');

    await waitFor(() => expect(screen.getByText('id 확인 답')).toBeInTheDocument());
    await settle();
    const { user_message_id, assistant_message_id } = bodies[0];
    expect(user_message_id).toMatch(/^.{1,36}$/);
    expect(assistant_message_id).toMatch(/^.{1,36}$/);
    expect(user_message_id).not.toBe(assistant_message_id);
    expect(posts).toHaveLength(1);
    expect(posts[0].messages.map((m) => [m.role, m.id])).toEqual([
      ['user', user_message_id],
      ['assistant', assistant_message_id],
    ]);
  });

  it('BUG-02R: 재시도는 새 메시지 id 로 보내고, 저장도 새 id 로 한다', async () => {
    const bodies: StreamRequestBody[] = [];
    const posts = captureSessionPosts();
    server.use(
      http.post('*/api/chat/stream', async ({ request }) => {
        bodies.push((await request.json()) as StreamRequestBody);
        if (bodies.length === 1) {
          return apiError(502, 'ERR_LLM_UPSTREAM_FAILED', '첫 요청 실패');
        }
        return sse('event: token\ndata: {"token":"재시도 답"}\n\nevent: done\ndata: {"model":"claude-sonnet-5-5"}\n\n');
      })
    );
    render(<ChatWorkspace />);

    ask('재시도 id');
    await waitFor(() => expect(screen.getByText('첫 요청 실패')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: '답변 다시 시도' }));

    await waitFor(() => expect(screen.getByText('재시도 답')).toBeInTheDocument());
    await settle();
    expect(bodies).toHaveLength(2);
    const [first, second] = bodies;
    expect(second.user_message_id).toBeTruthy();
    expect(second.assistant_message_id).toBeTruthy();
    expect(second.user_message_id).not.toBe(first.user_message_id);
    expect(second.assistant_message_id).not.toBe(first.assistant_message_id);
    expect(posts).toHaveLength(1);
    expect(posts[0].messages.map((m) => m.id)).toEqual([second.user_message_id, second.assistant_message_id]);
  });

  it('FE-33: done 없이 끊긴 스트림의 부분 답을 그대로 보이고 그 아래에 끊김 오류와 다시 시도를 함께 보인다', async () => {
    const posts = captureSessionPosts();
    server.use(http.post('*/api/chat/stream', () => sse('event: token\ndata: {"token":"받은 부분 답"}\n\n')));
    render(<ChatWorkspace />);

    ask('부분 답 확인');

    const error = await screen.findByText('응답이 중간에 끊겼습니다. 다시 시도해 주세요.');
    const partial = screen.getByText('받은 부분 답');
    // 부분 답이 오류 문구보다 앞(위)에 있다
    expect(partial.compareDocumentPosition(error) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('button', { name: '답변 다시 시도' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: '리포트 익스포트 툴바' })).not.toBeInTheDocument();
    await settle();
    expect(posts).toHaveLength(0);
  });

  it('FE-34: 사용자가 중단한 뒤 스트림이 오류 없이 끝나면 끊김 오류가 아니라 중단으로 처리한다', async () => {
    const encoder = new TextEncoder();
    let closeStream!: () => void;
    const sessionPosts: SessionPostBody[] = [];
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes('/api/chat/stream')) {
        // 중단 신호(signal)를 무시하는 응답: 중단 뒤에도 본문이 오류 없이 정상 종료된다.
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(encoder.encode('event: token\ndata: {"token":"중단 전 부분 답"}\n\n'));
            closeStream = () => controller.close();
          },
        });
        return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
      }
      if (url.includes('/api/chat/sessions') && init?.method === 'POST') {
        sessionPosts.push(JSON.parse(String(init.body)) as SessionPostBody);
      }
      return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });

    try {
      render(<ChatWorkspace />);
      ask('중단 확인');
      await waitFor(() => expect(screen.getByText('중단 전 부분 답')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: '답변 생성 중단' }));
      await act(async () => {
        closeStream();
      });
      await settle();

      expect(screen.queryByText(/응답이 중간에 끊겼습니다/)).not.toBeInTheDocument();
      expect(screen.getByText('중단 전 부분 답')).toBeInTheDocument();
      expect(sessionPosts).toHaveLength(1);
      expect(sessionPosts[0].messages.map((m) => [m.role, m.status])).toEqual([
        ['user', 'completed'],
        ['assistant', 'aborted'],
      ]);
    } finally {
      fetchSpy.mockRestore();
    }
  });
  it('FE-04: 재시도는 실패한 질문을 history 에 넣지 않고, 앞의 완료된 턴만 보낸다', async () => {
    const bodies: StreamRequestBody[] = [];
    server.use(
      http.post('*/api/chat/stream', async ({ request }) => {
        bodies.push((await request.json()) as StreamRequestBody);
        if (bodies.length === 2) {
          return apiError(502, 'ERR_LLM_UPSTREAM_FAILED', '두 번째 실패');
        }
        return sse(`event: token\ndata: {"token":"답${bodies.length}"}\n\nevent: done\ndata: {}\n\n`);
      })
    );
    render(<ChatWorkspace />);

    ask('첫 질문');
    await waitFor(() => expect(screen.getByText('답1')).toBeInTheDocument());
    ask('재시도 질문');
    await waitFor(() => expect(screen.getByText('두 번째 실패')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: '답변 다시 시도' }));
    await waitFor(() => expect(screen.getByText('답3')).toBeInTheDocument());

    expect(bodies).toHaveLength(3);
    expect(bodies[2].question).toBe('재시도 질문');
    expect(bodies[2].history).toEqual([
      { role: 'user', content: '첫 질문' },
      { role: 'assistant', content: '답1' },
    ]);
  });

  it('FE-04: 오류가 화면에 그려진 바로 그 순간(같은 커밋 직후) 다시 시도를 눌러도 재시도 요청이 나간다', async () => {
    const bodies: StreamRequestBody[] = [];
    server.use(
      http.post('*/api/chat/stream', async ({ request }) => {
        bodies.push((await request.json()) as StreamRequestBody);
        if (bodies.length === 1) {
          return apiError(502, 'ERR_LLM_UPSTREAM_FAILED', '즉시 재시도 실패');
        }
        return sse('event: token\ndata: {"token":"즉시 재시도 답"}\n\nevent: done\ndata: {}\n\n');
      })
    );
    render(<ChatWorkspace />);

    // 오류 문구가 DOM 에 들어온 직후(마이크로태스크, 지연 effect 보다 먼저) 다시 시도를 누른다.
    // 빠른 사용자·느린 기기에서 생길 수 있는 순서를 결정적으로 만든다.
    let clicked = false;
    const observer = new MutationObserver(() => {
      if (clicked) return;
      const retry = screen.queryByRole('button', { name: '답변 다시 시도' });
      if (retry) {
        clicked = true;
        retry.click();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    ask('즉시 재시도 질문');

    await waitFor(() => expect(screen.getByText('즉시 재시도 답')).toBeInTheDocument());
    observer.disconnect();
    expect(clicked).toBe(true);
    expect(bodies).toHaveLength(2);
    expect(bodies[1].question).toBe('즉시 재시도 질문');
  });

  it('FE-04: 실패한 턴을 재시도하지 않고 새로 물어도 실패한 질문은 history 에 없다', async () => {
    const bodies: StreamRequestBody[] = [];
    server.use(
      http.post('*/api/chat/stream', async ({ request }) => {
        bodies.push((await request.json()) as StreamRequestBody);
        if (bodies.length === 1) {
          return apiError(502, 'ERR_LLM_UPSTREAM_FAILED', '첫 실패');
        }
        return sse('event: token\ndata: {"token":"새 답"}\n\nevent: done\ndata: {}\n\n');
      })
    );
    render(<ChatWorkspace />);

    ask('실패할 질문');
    await waitFor(() => expect(screen.getByText('첫 실패')).toBeInTheDocument());
    ask('새 질문');
    await waitFor(() => expect(screen.getByText('새 답')).toBeInTheDocument());

    expect(bodies[1].history).toEqual([]);
  });
});
