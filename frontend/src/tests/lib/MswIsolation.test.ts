import { describe, it, expect } from 'vitest';
import { unhandledRequests } from '@/mocks/server';

describe('MSW isolation: no request leaves the test process', () => {
  it('a request without a mock handler is answered by MSW as an error and recorded, never by a real server', async () => {
    const res = await fetch('/__not_mocked__/probe');
    // MSW 가 onUnhandledRequest 의 예외를 500 'Unhandled Exception' 으로 돌려준다. 실제 서버(Next 등)의 응답이 아니다
    expect(res.status).toBe(500);
    expect(res.statusText).toBe('Unhandled Exception');
    expect(res.headers.get('x-powered-by')).toBeNull();
    // setup.ts 의 afterEach 는 기록이 남아 있으면 테스트를 실패시킨다. 여기서는 기록을 확인하고 비운다
    expect(unhandledRequests.splice(0)).toEqual(['GET /__not_mocked__/probe']);
  });
});
