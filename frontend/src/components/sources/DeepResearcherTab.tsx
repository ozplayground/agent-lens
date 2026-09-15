'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Check,
  Search,
  Radio,
} from 'lucide-react';
import {
  ResearchStatus,
  ResearchAuditLog,
  InspectUrlResponse,
  triggerDeepResearch,
  inspectUrl,
} from '@/lib/api';

interface DeepResearcherTabProps {
  researchStatus: ResearchStatus | null;
  auditLogs: ResearchAuditLog[];
  loading: boolean;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error', text: string) => void;
  onSourcesUpdated?: () => void;
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

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Overview Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-200/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700 border border-blue-200">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Autonomous Source Discovery & Curation Engine
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              글로벌 및 국내 AI 에이전트 소스(GitHub, ArXiv, 기술 블로그)를 자율 탐색하고,
              LLM 기술 적합도 분석을 거쳐 고품질 피드를 자동으로 수집 대상에 편입합니다.
            </p>
          </div>

          <button
            onClick={handleTriggerDeepResearch}
            disabled={isTriggeringDeep || researchStatus?.is_running}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-semibold text-white flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
          >
            {isTriggeringDeep || researchStatus?.is_running ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>자율 탐색 가동 중...</span>
              </>
            ) : (
              <>
                <Sliders className="w-3.5 h-3.5" />
                <span>자율 딥 리서치 지금 실행</span>
              </>
            )}
          </button>
        </div>

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-blue-200/60">
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500">자동 채택된 소스</span>
            <div className="text-xs font-bold text-emerald-700 font-mono mt-1">
              {researchStatus?.auto_adopted_count ?? 0}개 소스
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500">자동 채택 기준</span>
            <div className="text-xs font-bold text-amber-700 font-mono mt-1">
              품질 점수 ≥ 8.2점
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500">최근 리서치 일시</span>
            <div className="text-xs font-mono text-slate-800 mt-1 truncate">
              {researchStatus?.last_run_time
                ? new Date(researchStatus.last_run_time).toLocaleTimeString()
                : '최근 가동됨'}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500">정기 스케줄</span>
            <div className="text-xs font-mono text-blue-600 mt-1 font-medium">
              매일 03:00, 15:00 UTC
            </div>
          </div>
        </div>
      </div>

      {/* Research Audit Trail List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> 자율 리서치 판정 감사 일지 (Audit Trail)
          </h3>
          <button
            onClick={onRefresh}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>새로고침</span>
          </button>
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 rounded-lg bg-slate-50 border border-slate-200">
            아직 기록된 딥 리서치 이력이 없습니다. 위의 [자율 딥 리서치 지금 실행] 버튼을 눌러보세요.
          </div>
        ) : (
          <div className="space-y-2.5">
            {auditLogs.map((log) => {
              let verdictBadge = (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {log.verdict}
                </span>
              );
              if (log.verdict === 'AUTO_ADOPTED') {
                verdictBadge = (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3 h-3" /> 자동 채택됨
                  </span>
                );
              } else if (log.verdict === 'WATCHLIST') {
                verdictBadge = (
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    워치리스트 관찰
                  </span>
                );
              } else if (log.verdict === 'REJECTED') {
                verdictBadge = (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                    기준 미달 기각
                  </span>
                );
              } else if (log.verdict === 'ALREADY_MONITORED') {
                verdictBadge = (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    기등록 모니터링
                  </span>
                );
              }

              return (
                <div
                  key={log.id}
                  className="p-3.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 shadow-xs transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{log.source_name}</span>
                        {verdictBadge}
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-blue-700 border border-slate-200 font-medium">
                          {log.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">{log.feed_url}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-slate-900">
                        {log.relevance_score > 0 ? `${log.relevance_score}점` : '-'}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {log.created_at ? new Date(log.created_at).toLocaleDateString() : ''}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed">
                    <span className="text-slate-500 font-medium mr-1.5">⚖️ AI 판정 사유:</span>
                    {log.verdict_reason}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Optional Quick URL Prober */}
      <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
        <span className="font-bold text-slate-900 flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-slate-500" /> 단일 URL 수동 프로빙 (테스트용)
        </span>
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://lilianweng.github.io"
            value={inspectUrlInput}
            onChange={(e) => setInspectUrlInput(e.target.value)}
            className="flex-1 px-2.5 py-1 text-xs rounded bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleInspectUrl}
            disabled={inspectLoading || !inspectUrlInput.trim()}
            className="px-3 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {inspectLoading ? '분석 중...' : '검증'}
          </button>
        </div>
        {inspectResult && (
          <div className="p-2 rounded bg-white border border-slate-200 text-[11px] text-slate-600">
            {inspectResult.status === 'found' ? (
              <span className="text-emerald-700 font-medium">
                ✅ 발견: {inspectResult.name} ({inspectResult.feed_url}) · 점수: {inspectResult.relevance_score}점
              </span>
            ) : (
              <span className="text-red-600">❌ {inspectResult.message}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
