// @vitest-environment node
import { describe, it, expect, afterEach, vi } from 'vitest';

/**
 * 환경 변수 (리뷰 FE-21, FE-27).
 * - `src/lib/env.ts` 가 실제로 쓰이고 `NEXT_PUBLIC_APP_VERSION` 을 스키마에 둔다.
 * - `/api/health` 의 version 은 손으로 맞추는 고정 문자열이 아니라 빌드 때 넣는 앱 버전이다.
 * - `next.config.ts` 의 개발 허용 출처에 개인 호스트·사설 IP 를 박아 두지 않는다.
 */

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('env.ts (FE-21)', () => {
  it('getClientEnv 가 NEXT_PUBLIC_APP_VERSION 과 NEXT_PUBLIC_API_URL 을 검증해 돌려준다', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_VERSION', '9.9.9');
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:18000');
    const { getClientEnv } = await import('@/lib/env');
    expect(getClientEnv()).toEqual({ NEXT_PUBLIC_APP_VERSION: '9.9.9', NEXT_PUBLIC_API_URL: 'http://localhost:18000' });
  });

  it('NEXT_PUBLIC_API_URL 이 URL 이 아니면 읽는 순간 실패한다 (fail-fast)', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'not a url');
    const { getClientEnv } = await import('@/lib/env');
    expect(() => getClientEnv()).toThrow();
  });
});

describe('/api/health (FE-21)', () => {
  it('version 은 NEXT_PUBLIC_APP_VERSION 이다', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_VERSION', '9.9.9');
    vi.resetModules();
    const { GET } = await import('@/app/api/health/route');
    const body = await (await GET()).json();
    expect(body).toMatchObject({ status: 'healthy', service: 'agentlens-frontend', version: '9.9.9' });
  });
});

describe('next.config.ts allowedDevOrigins (FE-27)', () => {
  it('기본값은 localhost·127.0.0.1 뿐이고 개인 호스트·사설 IP 가 없다', async () => {
    vi.stubEnv('ALLOWED_DEV_ORIGINS', '');
    vi.resetModules();
    const { default: config } = await import('../../../next.config');
    expect(config.allowedDevOrigins).toEqual(['localhost', '127.0.0.1']);
  });

  it('ALLOWED_DEV_ORIGINS(쉼표 구분)로 더한다', async () => {
    vi.stubEnv('ALLOWED_DEV_ORIGINS', '*.ts.net, my-host.local');
    vi.resetModules();
    const { default: config } = await import('../../../next.config');
    expect(config.allowedDevOrigins).toEqual(['localhost', '127.0.0.1', '*.ts.net', 'my-host.local']);
  });
});
