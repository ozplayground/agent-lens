import { z } from 'zod';

/**
 * 브라우저에서도 읽는 환경 변수 (`NEXT_PUBLIC_` 접두사, 빌드 때 번들에 들어간다).
 * - `NEXT_PUBLIC_API_URL`: 기사 질문 스트림을 backend 에 직접 붙일 주소. 비우면 같은 출처(`/api/...`, Next rewrite)로 보낸다.
 * - `NEXT_PUBLIC_APP_VERSION`: 앱 버전. `next.config.ts` 가 `package.json` 의 version 을 넣는다.
 */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().optional().or(z.literal('')),
  NEXT_PUBLIC_APP_VERSION: z.string().optional(),
});

/**
 * 서버 쪽 환경 변수 목록 (규칙상 여기 함께 둔다). 값은 쓰는 곳이 직접 읽는다:
 * `INTERNAL_API_URL`·`ALLOWED_DEV_ORIGINS` 는 `next.config.ts`(빌드·개발 서버 설정), `PORT`·`NODE_ENV` 는 Next 런타임.
 */
export const serverEnvSchema = clientEnvSchema.extend({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().optional(),
  /** Next 서버가 backend 에 붙는 주소 (rewrite 대상). 기본 `http://127.0.0.1:8000`. */
  INTERNAL_API_URL: z.string().url().optional().or(z.literal('')),
  /** `next dev` 에 더 허용할 출처 (쉼표 구분). `next.config.ts` 의 allowedDevOrigins 가 읽는다. */
  ALLOWED_DEV_ORIGINS: z.string().optional(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * 검증한 클라이언트 변수. 값이 스키마에 맞지 않으면 던진다 (fail-fast).
 * 브라우저 번들은 `process.env.NEXT_PUBLIC_…` 를 하나씩 적은 정적 참조만 값으로 바꾸므로 객체째 넘기지 않는다.
 */
export function getClientEnv(): ClientEnv {
  return clientEnvSchema.parse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  });
}
