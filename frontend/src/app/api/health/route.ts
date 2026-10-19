import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'agentlens-frontend',
    version: '0.2.2',
    timestamp: new Date().toISOString(),
  });
}
