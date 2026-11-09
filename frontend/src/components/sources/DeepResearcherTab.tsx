'use client';

import React, { useState } from 'react';
import { Check, RefreshCw, Search, ShieldCheck, Sliders, Sparkles } from 'lucide-react';
import {
  ResearchStatus,
  ResearchAuditLog,
  InspectUrlResponse,
  triggerDeepResearch,
  inspectUrl,
} from '@/lib/api';
import { categoryLabel } from '@/lib/labels';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { TextField } from '@/components/ui/TextField';

interface DeepResearcherTabProps {
  researchStatus: ResearchStatus | null;
  auditLogs: ResearchAuditLog[];
  loading: boolean;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error', text: string) => void;
  onSourcesUpdated?: () => void;
}

const VERDICTS: Record<ResearchAuditLog['verdict'], { label: string; tone: BadgeTone }> = {
  AUTO_ADOPTED: { label: '자동 채택됨', tone: 'success' },
  WATCHLIST: { label: '워치리스트 관찰', tone: 'warning' },
  REJECTED: { label: '기준 미달 기각', tone: 'danger' },
  ALREADY_MONITORED: { label: '기등록 모니터링', tone: 'accent' },
};

function Metric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-surface p-3 shadow-card">
      <p className="text-xs text-fg-muted">{label}</p>
      <div className="mt-1 break-words text-sm font-semibold text-fg">{children}</div>
    </div>
  );
}

export default function DeepResearcherTab({
  researchStatus,
  auditLogs,
  loading,
  onRefresh,
  showToast,
  onSourcesUpdated,
}: DeepResearcherTabProps) {
  const [isTriggeringDeep, setIsTriggeringDeep] = useState(false);
  const [inspectUrlInput, setInspectUrlInput] = useState('');
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectResult, setInspectResult] = useState<InspectUrlResponse | null>(null);

  const handleTriggerDeepResearch = async () => {
    try {
      setIsTriggeringDeep(true);
      const res = await triggerDeepResearch();
      if (res.status === 'already_running') {
        showToast('error', res.message);
      } else {
        showToast('success', res.message);
        setTimeout(() => {
          onRefresh();
          onSourcesUpdated?.();
        }, 3000);
      }
    } catch {
      showToast('error', '자율 딥 리서치 트리거에 실패했습니다.');
    } finally {
      setIsTriggeringDeep(false);
    }
  };

  const handleInspectUrl = async () => {
    if (!inspectUrlInput.trim()) return;
    try {
      setInspectLoading(true);
      setInspectResult(null);
      const res = await inspectUrl(inspectUrlInput.trim());
      setInspectResult(res);
      if (res.status === 'found') {
        showToast('success', `RSS 피드를 성공적으로 감지했습니다: ${res.feed_url}`);
        onRefresh();
        onSourcesUpdated?.();
      } else {
        showToast('error', res.message || 'RSS 피드를 찾을 수 없습니다.');
      }
    } catch {
      showToast('error', 'URL 분석에 실패했습니다.');
    } finally {
      setInspectLoading(false);
    }
  };

  const running = isTriggeringDeep || Boolean(researchStatus?.is_running);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-5">
      {/* 개요 */}
      <section aria-labelledby="deep-research-heading" className="flex flex-col gap-4 rounded-xl border border-border bg-surface-muted p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h3 id="deep-research-heading" className="flex items-center gap-2 text-sm font-semibold text-fg">
              <Sparkles aria-hidden="true" className="size-4 text-accent" />
              자율 소스 발굴·선별
            </h3>
            <p className="max-w-2xl text-sm leading-relaxed text-fg-muted">
              글로벌 및 국내 AI 에이전트 소스(GitHub, ArXiv, 기술 블로그)를 자율 탐색하고, LLM 기술 적합도 분석을
              거쳐 고품질 피드를 자동으로 수집 대상에 편입합니다.
            </p>
          </div>
          <Button
            variant="primary"
            leadingIcon={<Sliders />}
            loading={running}
            onClick={() => void handleTriggerDeepResearch()}
            className="shrink-0"
          >
            {running ? '자율 탐색 가동 중...' : '자율 딥 리서치 지금 실행'}
          </Button>
        </div>

        {/* 지표: 모바일 2열, md 이상 4열 */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric label="자동 채택된 소스">
            <span className="text-success tabular-nums">{researchStatus?.auto_adopted_count ?? 0}개 소스</span>
          </Metric>
          <Metric label="자동 채택 기준">품질 점수 ≥ 8.2점</Metric>
          <Metric label="최근 리서치 일시">
            <span className="font-normal" suppressHydrationWarning>
              {researchStatus?.last_run_time
                ? new Date(researchStatus.last_run_time).toLocaleTimeString()
                : '최근 가동됨'}
            </span>
          </Metric>
          <Metric label="정기 스케줄">
            <span className="font-normal">매일 03:00, 15:00 UTC</span>
          </Metric>
        </div>
      </section>

      {/* 판정 감사 일지 */}
      <section aria-labelledby="deep-research-audit-heading" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 id="deep-research-audit-heading" className="flex items-center gap-1.5 text-sm font-semibold text-fg">
            <ShieldCheck aria-hidden="true" className="size-4 text-accent" /> 자율 리서치 판정 감사 일지
          </h3>
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={<RefreshCw className={loading ? 'animate-spin' : undefined} />}
            aria-busy={loading ? true : undefined}
            onClick={onRefresh}
          >
            새로고침
          </Button>
        </div>

        {auditLogs.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface-muted p-6 text-center text-sm text-fg-muted">
            아직 기록된 딥 리서치 이력이 없습니다. 위의 [자율 딥 리서치 지금 실행] 버튼을 눌러보세요.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {auditLogs.map((log) => {
              const verdict = VERDICTS[log.verdict] ?? { label: log.verdict, tone: 'neutral' as const };
              return (
                <li key={log.id} className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3.5 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-medium text-fg">{log.source_name}</span>
                        <Badge tone={verdict.tone} icon={log.verdict === 'AUTO_ADOPTED' ? <Check /> : undefined}>
                          {verdict.label}
                        </Badge>
                        <Badge>{categoryLabel(log.category)}</Badge>
                      </div>
                      <p className="mt-0.5 truncate font-mono text-xs text-fg-muted">{log.feed_url}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-sm font-semibold text-fg tabular-nums">
                        {log.relevance_score > 0 ? `${log.relevance_score}점` : '-'}
                      </span>
                      <div className="text-xs text-fg-subtle" suppressHydrationWarning>
                        {log.created_at ? new Date(log.created_at).toLocaleDateString() : ''}
                      </div>
                    </div>
                  </div>
                  <p className="rounded-lg bg-surface-muted p-2.5 text-sm leading-relaxed text-fg">
                    <span className="mr-1.5 font-medium text-fg-muted">AI 판정 사유:</span>
                    {log.verdict_reason}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 단일 URL 수동 검증 */}
      <section aria-labelledby="deep-research-probe-heading" className="flex flex-col gap-3 rounded-xl border border-border bg-surface-muted p-4">
        <h3 id="deep-research-probe-heading" className="flex items-center gap-1.5 text-sm font-semibold text-fg">
          <Search aria-hidden="true" className="size-4 text-fg-muted" /> 단일 URL 수동 프로빙 (테스트용)
        </h3>
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            void handleInspectUrl();
          }}
        >
          <TextField
            label="검증할 사이트 URL"
            type="url"
            placeholder="https://lilianweng.github.io"
            value={inspectUrlInput}
            onChange={(e) => setInspectUrlInput(e.target.value)}
            containerClassName="flex-1"
          />
          <Button type="submit" variant="secondary" loading={inspectLoading} disabled={!inspectUrlInput.trim()}>
            {inspectLoading ? '분석 중...' : '검증'}
          </Button>
        </form>
        {inspectResult ? (
          inspectResult.status === 'found' ? (
            <InlineAlert tone="success">
              발견: {inspectResult.name} ({inspectResult.feed_url}) · 점수: {inspectResult.relevance_score}점
            </InlineAlert>
          ) : (
            <InlineAlert tone="danger">{inspectResult.message || 'RSS 피드를 찾을 수 없습니다.'}</InlineAlert>
          )
        ) : null}
      </section>
    </div>
  );
}
