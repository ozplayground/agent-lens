import { describe, it, expect, afterEach, vi } from 'vitest';
import { http, HttpResponse, delay } from 'msw';
import { server } from '@/mocks/server';
import { apiError } from '@/mocks/api-error';
import { CONNECT_FAILED_MESSAGE } from '@/lib/api';
import {
  CHAT_REQUEST_TIMEOUT_MS,
  CHAT_STREAM_FIRST_BYTE_TIMEOUT_MS,
  deleteChatSession,
  fetchChatSessionDetail,
  fetchChatSessions,
  fetchChatSourceDetail,
  openChatStream,
  saveChatSession,
} from '@/lib/chatApi';

/**
 * 챗 REST 호출 (FE-07): 공통 fetchWithTimeout 을 거치고, 오류는 backend `message` 로 던진다.
 * 세션 id 는 경로에 인코딩해 넣는다 (FE-24).
 */

afterEach(() => {
  vi.useRealTimers();
});

describe('chatApi 응답과 오류 문구', () => {
  it('세션 목록을 limit 와 함께 요청해 돌려준다', async () => {
    const urls: string[] = [];
    server.use(
      http.get('*/api/chat/sessions', ({ request }) => {
        urls.push(request.url);
        return HttpResponse.json([]);
      })
    );

    await expect(fetchChatSessions(30)).resolves.toEqual([]);
    expect(new URL(urls[0]).searchParams.get('limit')).toBe('30');
  });

  it('오류 응답이면 backend 의 message 를 오류 문구로 던진다', async () => {
    server.use(http.get('*/api/chat/sessions', () => apiError(500, 'ERR_SERVER_INTERNAL', '세션 목록 서버 오류')));

    await expect(fetchChatSessions(30)).rejects.toThrow('세션 목록 서버 오류');
  });

  it('message 가 없는 오류 응답이면 정해 둔 문구를 쓴다', async () => {
    server.use(http.get('*/api/chat/sessions', () => new HttpResponse('oops', { status: 502 })));

    await expect(fetchChatSessions(30)).rejects.toThrow('대화 목록을 불러오지 못했습니다.');
  });

  it('연결 자체가 실패하면(조회·저장·삭제·기사·스트림 모두) 시간 초과가 아니라 연결 실패 문구를 쓴다', async () => {
    server.use(
      http.get('*/api/chat/sessions', () => HttpResponse.error()),
      http.get('*/api/chat/sessions/:id', () => HttpResponse.error()),
      http.post('*/api/chat/sessions', () => HttpResponse.error()),
      http.delete('*/api/chat/sessions/:id', () => HttpResponse.error()),
      http.get('*/api/chat/sources/:id', () => HttpResponse.error()),
      http.post('*/api/chat/stream', () => HttpResponse.error())
    );
    const id = '2b1c7a52-0d1e-4e8f-9a3b-6c5d4e3f2a10';

    await expect(fetchChatSessions(30)).rejects.toThrow(CONNECT_FAILED_MESSAGE);
    await expect(fetchChatSessionDetail(id)).rejects.toThrow(CONNECT_FAILED_MESSAGE);
    await expect(saveChatSession({ id })).rejects.toThrow(CONNECT_FAILED_MESSAGE);
    await expect(deleteChatSession(id)).rejects.toThrow(CONNECT_FAILED_MESSAGE);
    await expect(fetchChatSourceDetail(1)).rejects.toThrow(CONNECT_FAILED_MESSAGE);
    await expect(openChatStream({ question: 'q' }, new AbortController().signal)).rejects.toThrow(CONNECT_FAILED_MESSAGE);
  });

  it('연결 실패 문구는 기사 질문과 같은 상수다', () => {
    expect(CONNECT_FAILED_MESSAGE).toBe('서버에 연결하지 못했습니다. 연결 상태를 확인하고 다시 시도해 주세요.');
  });

  it('세션 상세가 404 면 null 을 돌려준다', async () => {
    server.use(http.get('*/api/chat/sessions/:id', () => apiError(404, 'ERR_SESSION_NOT_FOUND', '없음')));

    await expect(fetchChatSessionDetail('2b1c7a52-0d1e-4e8f-9a3b-6c5d4e3f2a10')).resolves.toBeNull();
  });

  it('세션 저장은 POST 본문을 그대로 보낸다', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post('*/api/chat/sessions', async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({}, { status: 201 });
      })
    );

    await saveChatSession({ id: 's1', title: '제목', messages: [] });
    expect(bodies).toEqual([{ id: 's1', title: '제목', messages: [] }]);
  });

  it('기사가 없으면(404) null, 서버 오류면 message 로 던진다 (FE-41)', async () => {
    server.use(http.get('*/api/chat/sources/:id', () => apiError(404, 'ERR_HANDOVER_SOURCE_NOT_FOUND', '기사가 없습니다.')));
    await expect(fetchChatSourceDetail(999)).resolves.toBeNull();

    server.use(http.get('*/api/chat/sources/:id', () => apiError(500, 'ERR_SERVER_INTERNAL', '기사 서버 오류')));
    await expect(fetchChatSourceDetail(999)).rejects.toThrow('기사 서버 오류');
  });
});

describe('chatApi 경로 인코딩 (FE-24)', () => {
  it('세션 id 의 / 와 .. 를 인코딩해 다른 경로로 정규화되지 않게 한다', async () => {
    const paths: string[] = [];
    server.use(
      http.all('*', ({ request }) => {
        paths.push(new URL(request.url).pathname);
        return HttpResponse.json({ status: 'success' });
      })
    );

    await deleteChatSession('../../news');
    expect(paths).toEqual(['/api/chat/sessions/..%2F..%2Fnews']);
  });
});

describe('chatApi 시간 제한 (FE-07)', () => {
  it('세션 목록이 응답하지 않으면 시간 제한 뒤 실패한다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    server.use(
      http.get('*/api/chat/sessions', async () => {
        await delay('infinite');
        return HttpResponse.json([]);
      })
    );

    const pending = fetchChatSessions(30);
    const assertion = expect(pending).rejects.toThrow('대화 목록을 불러오지 못했습니다.');
    await vi.advanceTimersByTimeAsync(CHAT_REQUEST_TIMEOUT_MS + 10);
    await assertion;
  });

  it('스트림이 첫 응답을 주지 않으면 시간 제한 뒤 안내 문구로 실패한다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    server.use(
      http.post('*/api/chat/stream', async () => {
        await delay('infinite');
        return new HttpResponse('');
      })
    );

    const pending = openChatStream({ question: 'q' }, new AbortController().signal);
    const assertion = expect(pending).rejects.toThrow('응답이 늦어 요청을 멈췄습니다. 다시 시도해 주세요.');
    await vi.advanceTimersByTimeAsync(CHAT_STREAM_FIRST_BYTE_TIMEOUT_MS + 10);
    await assertion;
  });

  it('스트림이 응답을 시작한 뒤에는 시간 제한으로 끊지 않는다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    server.use(http.post('*/api/chat/stream', () => new HttpResponse('event: done\ndata: {}\n\n')));

    const res = await openChatStream({ question: 'q' }, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(CHAT_STREAM_FIRST_BYTE_TIMEOUT_MS + 10);
    await expect(res.text()).resolves.toContain('event: done');
  });

  it('사용자가 중단하면 AbortError 로 끝난다 (시간 제한 문구가 아니다)', async () => {
    server.use(
      http.post('*/api/chat/stream', async () => {
        await delay('infinite');
        return new HttpResponse('');
      })
    );
    const controller = new AbortController();

    const pending = openChatStream({ question: 'q' }, controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('스트림 오류 응답이면 backend 의 message 를 던진다', async () => {
    server.use(http.post('*/api/chat/stream', () => apiError(502, 'ERR_LLM_UPSTREAM_FAILED', 'LLM 호출 실패')));

    await expect(openChatStream({ question: 'q' }, new AbortController().signal)).rejects.toThrow('LLM 호출 실패');
  });
});
