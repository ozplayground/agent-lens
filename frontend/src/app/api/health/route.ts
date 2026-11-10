import { NextResponse } from 'next/server';
import { getClientEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'agentlens-frontend',
    // 빌드 때 next.config.ts 가 package.json 의 version 을 넣는다 (손으로 맞추지 않는다).
    version: getClientEnv().NEXT_PUBLIC_APP_VERSION ?? 'unknown',
    timestamp: new Date().toISOString(),
  });
}
