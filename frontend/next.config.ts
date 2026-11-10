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
  // 개발 서버(next dev)에 붙을 수 있는 출처. 기본은 이 기기뿐이고, 다른 호스트(사설 IP, Tailscale 등)는
  // ALLOWED_DEV_ORIGINS="*.ts.net,192.168.0.10" 처럼 쉼표로 더한다 (frontend/.env.local 에 둔다).
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    ...(process.env.ALLOWED_DEV_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
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
