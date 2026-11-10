'use client';

import React from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { CodeBlock } from '@/components/ui/CodeBlock';

const MCP_TOOLS = [
  { name: 'get_latest_harness_methods', description: 'SWE-bench 및 에이전트 테스트 하네스 소식' },
  { name: 'get_mcp_and_skills_ecosystem', description: '최신 MCP 서버, 스킬 플러그인 생태계' },
  { name: 'search_agent_news', description: '키워드 및 카테고리별 글로벌 AI 소식 검색' },
  { name: 'trigger_agentlens_crawl', description: '전세계 소스 실시간 크롤링 실행' },
];

const MCP_CONFIG = `{
  "mcpServers": {
    "agentlens": {
      "command": "python",
      "args": ["-m", "app.mcp.server"],
      "cwd": "/path/to/agentlens/backend"
    }
  }
}`;

export default function McpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      size="lg"
      title="AgentLens MCP 연동"
      description="Claude Desktop, Cursor 등에서 하네스 및 MCP 소식을 직접 호출할 수 있습니다."
      footer={
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-fg">제공되는 MCP 도구</h3>
          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {MCP_TOOLS.map((tool) => (
              <div key={tool.name} className="min-w-0 rounded-lg border border-border bg-surface-muted p-3">
                <dt className="font-mono text-sm font-medium break-all text-fg">{tool.name}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-fg-muted">{tool.description}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-fg">
            Claude Desktop 설정 (<code className="rounded border border-border bg-surface-muted px-1 py-0.5 font-mono text-sm font-normal break-all">claude_desktop_config.json</code>)
          </h3>
          <CodeBlock code={MCP_CONFIG} language="json" />
          <p className="text-sm leading-relaxed text-fg-muted">
            <code className="font-mono">cwd</code> 는 이 저장소 backend 폴더의 절대 경로로 바꿉니다.{' '}
            <code className="font-mono">command</code> 는 backend 의존성이 설치된 Python(예: 저장소의{' '}
            <code className="font-mono">.venv/bin/python</code>)을 씁니다.
          </p>
        </section>
      </div>
    </Dialog>
  );
}
