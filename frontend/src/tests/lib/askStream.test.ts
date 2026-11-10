import { describe, it, expect, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';

/**
 * 기사 질문 스트림 (`askQuestionAboutNewsStream`).
 * - QA D-41: `NEXT_PUBLIC_API_URL` 이 없으면 브라우저 호스트의 `:8000` 을 짐작하지 않고 같은 출처(`/api/...`, Next rewrite)로 보낸다.
 * - 리뷰 FE-23: 끝 버퍼(마지막 이벤트 뒤 빈 줄 없음)를 버리지 않고, meta 가 없으면 엔진 이름을 지어내지 않는다.
 */

type ApiModule = typeof import('@/lib/api');

async function loadApi(): Promise<ApiModule> {
  vi.resetModules();
  return import('@/lib/api');
}

function sse(events: unknown[], { trailingBlankLine = true } = {}) {
  const body = events.map((e) => `data: ${JSON.stringify(e)}`).join('\n\n') + (trailingBlankLine ? '\n\n' : '');
  return new HttpResponse(body, { headers: { 'Content-Type': 'text/event-stream' } });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('askQuestionAboutNewsStream 연결 주소 (D-41)', () => {
  it('NEXT_PUBLIC_API_URL 이 없으면 같은 출처로 보낸다 (호스트:8000 으로 직접 보내지 않는다)', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');
    const urls: string[] = [];
    server.use(
      http.post('*/api/news/:id/ask/stream', ({ request }) => {
        urls.push(request.url);
        return sse([{ event: 'meta', model: 'm' }, { event: 'done', total_text: 'ok' }]);
      })
    );
    const api = await loadApi();
    await api.askQuestionAboutNewsStream(1, '질문');

    expect(urls).toHaveLength(1);
    expect(new URL(urls[0]).origin).toBe(window.location.origin);
  });

  it('NEXT_PUBLIC_API_URL 이 있으면 그 주소로 직접 보낸다', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api.example.test:18000');
    const urls: string[] = [];
    server.use(
      http.post('*/api/news/:id/ask/stream', ({ request }) => {
        urls.push(request.url);
        return sse([{ event: 'done', total_text: 'ok' }]);
      })
    );
    const api = await loadApi();
    await api.askQuestionAboutNewsStream(1, '질문');

    expect(urls.map((u) => new URL(u).origin)).toEqual(['http://api.example.test:18000']);
  });
});

describe('askQuestionAboutNewsStream 파서 (FE-23)', () => {
  it('마지막 이벤트 뒤에 빈 줄이 없어도 done 의 total_text 를 반영한다', async () => {
    server.use(
      http.post('*/api/news/:id/ask/stream', () =>
        sse(
          [
            { event: 'meta', model: 'claude-sonnet-5-5' },
            { event: 'token', text: '부분' },
            { event: 'done', total_text: '부분 답과 나머지' },
          ],
          { trailingBlankLine: false }
        )
      )
    );
    const api = await loadApi();
    const res = await api.askQuestionAboutNewsStream(1, '질문');
    expect(res).toEqual({ answer: '부분 답과 나머지', model_used: 'claude-sonnet-5-5' });
  });

  it('meta 가 오지 않으면 엔진 이름을 지어내지 않는다 (Gemini 기본값 없음)', async () => {
    server.use(
      http.post('*/api/news/:id/ask/stream', () => sse([{ event: 'token', text: '답' }, { event: 'done', total_text: '답' }]))
    );
    const api = await loadApi();
    const res = await api.askQuestionAboutNewsStream(1, '질문');
    expect(res.model_used).toBe('');
  });
});

describe('askQuestionAboutNewsStream 끊김 (backend error 이벤트, done 없음)', () => {
  const CUT = '답변 생성이 중간에 끊겼습니다. 다시 시도해 주세요.';

  it('error 이벤트를 받으면 받은 토큰은 그대로 넘기고, 그 메시지로 실패한다', async () => {
    server.use(
      http.post('*/api/news/:id/ask/stream', () =>
        sse([
          { event: 'meta', model: 'claude-sonnet-5-5' },
          { event: 'token', text: '부분 답' },
          { event: 'error', error_code: 'ERR_LLM_STREAM_FAILED', message: CUT, retryable: true },
        ])
      )
    );
    const api = await loadApi();
    const tokens: string[] = [];
    await expect(api.askQuestionAboutNewsStream(1, '질문', { onToken: (t) => tokens.push(t) })).rejects.toThrow(CUT);
    expect(tokens).toEqual(['부분 답']);
  });

  it('done 없이 스트림이 끝나면 끊김으로 실패한다', async () => {
    server.use(
      http.post('*/api/news/:id/ask/stream', () =>
        sse([{ event: 'meta', model: 'm' }, { event: 'token', text: '부분' }])
      )
    );
    const api = await loadApi();
    await expect(api.askQuestionAboutNewsStream(1, '질문')).rejects.toThrow(CUT);
  });
});

describe('askQuestionAboutNewsStream 첫 응답 시간 제한 (챗 스트림과 같은 30초)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function hangingServer() {
    server.use(http.post('*/api/news/:id/ask/stream', () => new Promise<never>(() => {})));
  }

  it('첫 응답이 30초 안에 오지 않으면 시간 초과 문구로 실패한다 (화면은 오류와 다시 시도를 보인다)', async () => {
    hangingServer();
    const api = await loadApi();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const result = api.askQuestionAboutNewsStream(1, '질문');
    const settled = expect(result).rejects.toThrow('응답이 늦어 요청을 멈췄습니다. 다시 시도해 주세요.');
    await vi.advanceTimersByTimeAsync(api.ASK_STREAM_FIRST_BYTE_TIMEOUT_MS);
    await settled;
  });

  it('사용자가 중단하면 시간 초과가 아니라 AbortError 다', async () => {
    hangingServer();
    const api = await loadApi();
    const controller = new AbortController();
    const result = api.askQuestionAboutNewsStream(1, '질문', undefined, controller.signal);
    controller.abort();
    await expect(result).rejects.toMatchObject({ name: 'AbortError' });
  });
});
