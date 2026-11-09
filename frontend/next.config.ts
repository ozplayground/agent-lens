import type { NextConfig } from "next";
import packageJson from "./package.json";

// 앱 버전은 설정 파일에서만 package.json 을 읽어 넘긴다.
// src 에서 package.json 을 import 하면 의존성 목록까지 클라이언트 번들에 들어간다.
const APP_VERSION: string = packageJson.version;

const nextConfig: NextConfig = {
  output: "standalone",
  productionBrowserSourceMaps: false,
  // next dev 가 frontend/AGENTS.md·CLAUDE.md 를 만들지 않게 한다.
  agentRules: false,
  env: {
    NEXT_PUBLIC_APP_VERSION: APP_VERSION,
  },
  allowedDevOrigins: [
    "macbookpro.tail304081.ts.net",
    "*.ts.net",
    "localhost",
    "127.0.0.1",
    "192.168.1.109"
  ],
  async rewrites() {
    const backendUrl = process.env.INTERNAL_API_URL || "http://127.0.0.1:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
