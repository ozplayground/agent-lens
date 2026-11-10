import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

/**
 * 목 없는 요청 기록 (테스트 격리). `setup.ts` 가 `onUnhandledRequest` 로 넘긴다.
 * 요청은 MSW 'error' 처리로 실패시켜 실제 네트워크(개발 서버 등)로 나가지 않게 하고,
 * 기록은 afterEach 가 꺼내 그 테스트를 실패시킨다.
 */
export const unhandledRequests: string[] = [];

export function recordUnhandledRequest(request: Request, print: { error: () => void }): void {
  const entry = `${request.method} ${new URL(request.url).pathname}`;
  unhandledRequests.push(entry);
  print.error();
  // 사용자 함수는 print.error() 만으로는 막지 않는다. 던져야 요청이 네트워크로 나가지 않고 fetch 가 실패한다
  throw new Error(`[MSW] 목이 없는 요청을 막았습니다: ${entry}`);
}
