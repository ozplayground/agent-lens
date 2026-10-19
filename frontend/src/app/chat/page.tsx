import { Suspense } from 'react';
import type { Metadata } from 'next';
import ChatWorkspace from '@/components/chat/ChatWorkspace';

export const metadata: Metadata = {
  title: 'AI 챗 워크스페이스 | AgentLens',
  description: 'AI 에이전트·하네스·MCP 기술 심층 질의 및 개인 지식 RAG 워크스페이스',
};

export default function ChatPage() {
  return (
    <main className="w-full max-w-full h-[100dvh] bg-slate-50 overflow-hidden overflow-x-hidden">
      <Suspense
        fallback={
          <div className="w-full h-[100dvh] flex items-center justify-center text-xs text-slate-400 font-mono">
            워크스페이스 환경을 초기화하는 중...
          </div>
        }
      >
        <ChatWorkspace />
      </Suspense>
    </main>
  );
}
