'use client';

import React, { useState } from 'react';
import { X, Cpu, Copy, Check, Terminal } from 'lucide-react';

export default function McpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const mcpConfig = `{
  "mcpServers": {
    "agentlens": {
      "command": "python",
      "args": ["-m", "app.mcp.server"],
      "cwd": "/path/to/agentlens/backend"
    }
  }
}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative text-zinc-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">AgentLens MCP 연동</h3>
            <p className="text-xs text-zinc-400">Claude Desktop, Cursor 등에서 하네스 및 MCP 소식을 직접 호출할 수 있습니다.</p>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" /> 제공되는 MCP Tools
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="font-mono text-purple-400 font-medium">get_latest_harness_methods</span>
              <p className="text-[11px] text-zinc-400 mt-0.5">SWE-bench 및 에이전트 테스트 하네스 소식</p>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="font-mono text-purple-400 font-medium">get_mcp_and_skills_ecosystem</span>
              <p className="text-[11px] text-zinc-400 mt-0.5">최신 MCP 서버, 스킬 플러그인 생태계</p>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="font-mono text-indigo-400 font-medium">search_agent_news</span>
              <p className="text-[11px] text-zinc-400 mt-0.5">키워드 및 카테고리별 글로벌 AI 소식 검색</p>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="font-mono text-emerald-400 font-medium">trigger_agentlens_crawl</span>
              <p className="text-[11px] text-zinc-400 mt-0.5">전세계 소스 실시간 크롤링 실행</p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-zinc-300">Claude Desktop 설정 (`claude_desktop_config.json`)</span>
            <button
              onClick={() => { navigator.clipboard.writeText(mcpConfig); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '복사됨!' : '설정 복사'}
            </button>
          </div>
          <pre className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[11px] font-mono text-zinc-300 overflow-x-auto">
            {mcpConfig}
          </pre>
        </div>

        <div className="flex justify-end pt-3 border-t border-zinc-800">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
