import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
