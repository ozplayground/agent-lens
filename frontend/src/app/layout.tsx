import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastRegion } from "@/components/ui/Toast";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1013" },
  ],
};

export const metadata: Metadata = {
  title: "AgentLens | AI Agent, Harness & MCP Global News",
  description: "전세계 AI 뉴스, 최신 Agent 기술, 하네스(Harness) 방법론 및 벤치마크, MCP(Model Context Protocol) 및 스킬 플러그인 큐레이션 플랫폼",
};

// 첫 그리기 전에 테마를 적용한다 (lib/theme-store.ts 와 같은 규칙, 저장 키 agentlens_theme).
const THEME_INIT_SCRIPT = `(function(){try{var m=localStorage.getItem('agentlens_theme');if(m!=='light'&&m!=='dark'&&m!=='system')m='system';
var d=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
var r=document.documentElement;r.classList.remove(d?'light':'dark');r.classList.add(d?'dark':'light');
r.setAttribute('data-theme',d?'dark':'light');r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh bg-canvas text-fg overflow-x-hidden">
        <ThemeProvider>
          <div id="app-shell" className="flex min-h-dvh flex-col">
            {children}
          </div>
          <ToastRegion />
        </ThemeProvider>
      </body>
    </html>
  );
}
