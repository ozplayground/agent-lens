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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative text-slate-800">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">AgentLens MCP 연동</h3>
            <p className="text-xs text-slate-500">Claude Desktop, Cursor 등에서 하네스 및 MCP 소식을 직접 호출할 수 있습니다.</p>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-blue-600" /> 제공되는 MCP Tools
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 shadow-xs">
              <span className="font-mono text-purple-700 font-semibold">get_latest_harness_methods</span>
              <p className="text-[11px] text-slate-600 mt-0.5">SWE-bench 및 에이전트 테스트 하네스 소식</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 shadow-xs">
              <span className="font-mono text-purple-700 font-semibold">get_mcp_and_skills_ecosystem</span>
              <p className="text-[11px] text-slate-600 mt-0.5">최신 MCP 서버, 스킬 플러그인 생태계</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 shadow-xs">
              <span className="font-mono text-blue-700 font-semibold">search_agent_news</span>
              <p className="text-[11px] text-slate-600 mt-0.5">키워드 및 카테고리별 글로벌 AI 소식 검색</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 shadow-xs">
              <span className="font-mono text-emerald-700 font-semibold">trigger_agentlens_crawl</span>
              <p className="text-[11px] text-slate-600 mt-0.5">전세계 소스 실시간 크롤링 실행</p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-800">Claude Desktop 설정 (`claude_desktop_config.json`)</span>
            <button
              onClick={() => { navigator.clipboard.writeText(mcpConfig); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '복사됨!' : '설정 복사'}
            </button>
          </div>
          <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-200 overflow-x-auto shadow-xs">
            {mcpConfig}
          </pre>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 border border-slate-200 shadow-xs cursor-pointer">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
