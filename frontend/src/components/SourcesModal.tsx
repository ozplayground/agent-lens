'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Globe,
  Sparkles,
  Plus,
  Trash2,
  Check,
  Search,
  ExternalLink,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileCode,
  GitBranch,
  Radio,
  Clock,
  ShieldCheck,
  Cpu,
  HelpCircle
} from 'lucide-react';
import {
  fetchSources,
  toggleSource,
  addRssSource,
  deleteSource,
  inspectUrl,
  fetchDeepResearchStatus,
  fetchResearchAuditLogs,
  triggerDeepResearch,
  SourcesResponse,
  SourceItem,
  ResearchStatus,
  ResearchAuditLog,
  InspectUrlResponse
} from '@/lib/api';

interface SourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSourcesUpdated?: () => void;
}

export default function SourcesModal({ isOpen, onClose, onSourcesUpdated }: SourcesModalProps) {
  const [activeTab, setActiveTab] = useState<'sources' | 'deep_research'>('deep_research');
  const [sourcesData, setSourcesData] = useState<SourcesResponse | null>(null);
  const [researchStatus, setResearchStatus] = useState<ResearchStatus | null>(null);
  const [auditLogs, setAuditLogs] = useState<ResearchAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTriggeringDeep, setIsTriggeringDeep] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Manual Add Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCat, setNewCat] = useState('ai_news');
  const [newCountry, setNewCountry] = useState('GLOBAL');
  const [newDesc, setNewDesc] = useState('');
  const [addingSource, setAddingSource] = useState(false);

  // Optional manual probe state
  const [inspectUrlInput, setInspectUrlInput] = useState('');
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectResult, setInspectResult] = useState<InspectUrlResponse | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [srcRes, statRes, logsRes] = await Promise.all([
        fetchSources(),
        fetchDeepResearchStatus(),
        fetchResearchAuditLogs(30)
      ]);
      setSourcesData(srcRes);
      setResearchStatus(statRes);
      setAuditLogs(logsRes.logs);
    } catch {
      setMsg({ type: 'error', text: '데이터를 불러오지 못했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const handleToggle = async (sourceType: string, id: string) => {
    try {
      await toggleSource(sourceType, id);
      await loadData();
      if (onSourcesUpdated) onSourcesUpdated();
      showToast('success', '소스 상태가 변경되었습니다.');
    } catch (e: any) {
      showToast('error', e.message || '상태 변경 실패');
    }
  };

  const handleDelete = async (sourceType: string, id: string) => {
    if (!confirm('정말 이 소스를 수집 대상에서 삭제하시겠습니까?')) return;
    try {
      await deleteSource(sourceType, id);
      await loadData();
      if (onSourcesUpdated) onSourcesUpdated();
      showToast('success', '소스가 삭제되었습니다.');
    } catch (e: any) {
      showToast('error', e.message || '삭제 실패');
    }
  };

  const handleTriggerDeepResearch = async () => {
    setIsTriggeringDeep(true);
    try {
      await triggerDeepResearch(6);
      showToast('success', '자율 딥 리서치 사이클이 백그라운드에서 기동되었습니다.');
      // Poll audit logs and status after a few seconds
      setTimeout(async () => {
        await loadData();
        setIsTriggeringDeep(false);
        if (onSourcesUpdated) onSourcesUpdated();
      }, 3500);
    } catch (e: any) {
      showToast('error', e.message || '딥 리서치 요청 실패');
      setIsTriggeringDeep(false);
    }
  };

  const handleInspectUrl = async () => {
    if (!inspectUrlInput.trim()) return;
    setInspectLoading(true);
    setInspectResult(null);
    try {
      const res = await inspectUrl(inspectUrlInput.trim());
      setInspectResult(res);
      if (res.status === 'found') {
        showToast('success', '피드를 성공적으로 분석했습니다.');
      }
    } catch (e: any) {
      showToast('error', e.message || 'URL 피드 분석 실패');
    } finally {
      setInspectLoading(false);
    }
  };

  const handleAddManualRss = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;
    setAddingSource(true);
    try {
      await addRssSource({
        name: newName.trim(),
        url: newUrl.trim(),
        category_hint: newCat,
        country: newCountry,
        description: newDesc.trim()
      });
      setShowAddForm(false);
      setNewName('');
      setNewUrl('');
      setNewDesc('');
      await loadData();
      if (onSourcesUpdated) onSourcesUpdated();
      showToast('success', `'${newName}' 소스가 성공적으로 등록되었습니다.`);
    } catch (e: any) {
      showToast('error', e.message || '등록 실패');
    } finally {
      setAddingSource(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl relative text-[#c9d1d9] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#58a6ff]">
              <Sparkles className="w-4 h-4 text-[#d29922]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-2">
                백엔드 자율 딥 리서치 & 소스 오케스트레이터
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30">
                  Autonomous Engine
                </span>
              </h2>
              <p className="text-xs text-[#8b949e]">
                백엔드가 주기적으로 웹 생태계를 딥 리서치하여 유효성을 검증하고, 고신호 소스를 자동으로 수집 대상에 편입합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8b949e] hover:text-[#f0f6fc] p-1.5 rounded-md hover:bg-[#21262d] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#30363d] bg-[#161b22] px-5">
          <button
            onClick={() => setActiveTab('deep_research')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'deep_research'
                ? 'border-[#58a6ff] text-[#f0f6fc]'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#d29922]" />
            <span>자율 딥 리서치 감사 일지</span>
            <span className="text-[10px] font-mono bg-[#21262d] px-1.5 py-0.5 rounded-full border border-[#30363d] text-[#8b949e]">
              {auditLogs.length}건 판정
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sources')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'sources'
                ? 'border-[#58a6ff] text-[#f0f6fc]'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>수집 대상 목록 (sources.json)</span>
            {sourcesData && (
              <span className="text-[10px] font-mono bg-[#21262d] px-1.5 py-0.5 rounded-full border border-[#30363d] text-[#8b949e]">
                {sourcesData.stats.active_rss + sourcesData.stats.active_github_repos}개
              </span>
            )}
          </button>
        </div>

        {/* Toast Notification */}
        {msg && (
          <div
            className={`px-4 py-2 text-xs flex items-center gap-2 border-b ${
              msg.type === 'success'
                ? 'bg-[#238636]/10 text-[#3fb950] border-[#238636]/30'
                : 'bg-[#da3633]/10 text-[#f85149] border-[#da3633]/30'
            }`}
          >
            {msg.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeTab === 'deep_research' ? (
            /* TAB 1: Autonomous Deep Research Engine Dashboard */
            <div className="space-y-6">
              {/* Engine Status & Control Card */}
              <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse" />
                      <span className="text-xs font-bold text-[#f0f6fc]">백엔드 자율 딥 리서치 스케줄러 가동 중</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                        12시간 주기 자동 실행
                      </span>
                    </div>
                    <p className="text-xs text-[#8b949e] mt-1 leading-relaxed">
                      최근 수집된 기사들의 인용 링크를 마이닝하고, 네트워크 실증 및 최신 기사 3편의 LLM 4축 심층 평가를 거쳐 품질 점수 8.2점 이상인 핵심 소스를 자동으로 채택합니다.
                    </p>
                  </div>

                  <button
                    onClick={handleTriggerDeepResearch}
                    disabled={isTriggeringDeep}
                    className="shrink-0 px-3.5 py-2 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTriggeringDeep ? 'animate-spin' : ''}`} />
                    <span>{isTriggeringDeep ? '딥 리서치 분석 중...' : '자율 딥 리서치 지금 실행'}</span>
                  </button>
                </div>

                {/* Status Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#30363d]">
                  <div className="p-2.5 rounded-lg bg-[#161b22] border border-[#30363d]">
                    <span className="text-[11px] text-[#8b949e]">자율 채택 누적</span>
                    <div className="text-base font-bold text-[#3fb950] font-mono mt-0.5">
                      {researchStatus?.auto_adopted_count ?? 0}개 소스
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#161b22] border border-[#30363d]">
                    <span className="text-[11px] text-[#8b949e]">자동 채택 기준</span>
                    <div className="text-xs font-bold text-[#d29922] font-mono mt-1">
                      품질 점수 ≥ 8.2점
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#161b22] border border-[#30363d]">
                    <span className="text-[11px] text-[#8b949e]">최근 리서치 일시</span>
                    <div className="text-xs font-mono text-[#f0f6fc] mt-1 truncate">
                      {researchStatus?.last_run_time ? new Date(researchStatus.last_run_time).toLocaleTimeString() : '최근 가동됨'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#161b22] border border-[#30363d]">
                    <span className="text-[11px] text-[#8b949e]">정기 스케줄</span>
                    <div className="text-xs font-mono text-[#58a6ff] mt-1">
                      매일 03:00, 15:00 UTC
                    </div>
                  </div>
                </div>
              </div>

              {/* Research Audit Trail List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#f0f6fc] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#58a6ff]" /> 자율 리서치 판정 감사 일지 (Audit Trail)
                  </h3>
                  <button
                    onClick={loadData}
                    className="text-xs text-[#58a6ff] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    <span>새로고침</span>
                  </button>
                </div>

                {auditLogs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#8b949e] rounded-lg bg-[#0d1117] border border-[#30363d]">
                    아직 기록된 딥 리서치 이력이 없습니다. 위의 [자율 딥 리서치 지금 실행] 버튼을 눌러보세요.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {auditLogs.map(log => {
                      let verdictBadge = (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                          {log.verdict}
                        </span>
                      );
                      if (log.verdict === 'AUTO_ADOPTED') {
                        verdictBadge = (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40 flex items-center gap-1">
                            <Check className="w-3 h-3" /> 자동 채택됨
                          </span>
                        );
                      } else if (log.verdict === 'WATCHLIST') {
                        verdictBadge = (
                          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#d29922]/15 text-[#d29922] border border-[#d29922]/30">
                            워치리스트 관찰
                          </span>
                        );
                      } else if (log.verdict === 'REJECTED') {
                        verdictBadge = (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#da3633]/15 text-[#f85149] border border-[#da3633]/30">
                            기준 미달 기각
                          </span>
                        );
                      } else if (log.verdict === 'ALREADY_MONITORED') {
                        verdictBadge = (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d]">
                            기등록 모니터링
                          </span>
                        );
                      }

                      return (
                        <div
                          key={log.id}
                          className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff]/40 transition-colors space-y-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-[#f0f6fc]">{log.source_name}</span>
                                {verdictBadge}
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d]">
                                  {log.category}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#8b949e] font-mono mt-0.5 truncate">{log.feed_url}</p>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-xs font-mono font-bold text-[#f0f6fc]">
                                {log.relevance_score > 0 ? `${log.relevance_score}점` : '-'}
                              </span>
                              <div className="text-[10px] text-[#8b949e] font-mono">
                                {log.created_at ? new Date(log.created_at).toLocaleDateString() : ''}
                              </div>
                            </div>
                          </div>

                          <div className="text-xs text-[#c9d1d9] bg-[#161b22] p-2.5 rounded border border-[#30363d]/60 leading-relaxed">
                            <span className="text-[#8b949e] font-medium mr-1.5">⚖️ AI 판정 사유:</span>
                            {log.verdict_reason}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Optional Quick URL Prober Drawer */}
              <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-2 text-xs">
                <span className="font-bold text-[#f0f6fc] flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-[#8b949e]" /> 단일 URL 수동 프로빙 (테스트용)
                </span>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://lilianweng.github.io"
                    value={inspectUrlInput}
                    onChange={e => setInspectUrlInput(e.target.value)}
                    className="flex-1 px-2.5 py-1 text-xs rounded bg-[#161b22] border border-[#30363d] text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
                  />
                  <button
                    onClick={handleInspectUrl}
                    disabled={inspectLoading || !inspectUrlInput.trim()}
                    className="px-3 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] font-medium cursor-pointer disabled:opacity-50"
                  >
                    {inspectLoading ? '분석 중...' : '검증'}
                  </button>
                </div>
                {inspectResult && (
                  <div className="p-2 rounded bg-[#161b22] border border-[#30363d] text-[11px] text-[#8b949e]">
                    {inspectResult.status === 'found' ? (
                      <span className="text-[#3fb950]">
                        ✅ 발견: {inspectResult.name} ({inspectResult.feed_url}) · 점수: {inspectResult.relevance_score}점
                      </span>
                    ) : (
                      <span className="text-[#f85149]">❌ {inspectResult.message}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: Sources Management */
            <div className="space-y-6">
              {/* Summary Stats Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
                  <span className="text-[11px] text-[#8b949e]">활성 RSS 피드</span>
                  <div className="text-lg font-bold text-[#f0f6fc] font-mono mt-0.5">
                    {sourcesData?.stats.active_rss ?? 0} <span className="text-xs text-[#8b949e]">/ {sourcesData?.stats.total_rss ?? 0}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
                  <span className="text-[11px] text-[#8b949e]">모니터링 GitHub</span>
                  <div className="text-lg font-bold text-[#f0f6fc] font-mono mt-0.5">
                    {sourcesData?.stats.active_github_repos ?? 0} <span className="text-xs text-[#8b949e]">/ {sourcesData?.stats.total_github_repos ?? 0}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
                  <span className="text-[11px] text-[#8b949e]">커뮤니티 수집</span>
                  <div className="text-xs font-mono text-[#3fb950] mt-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" />
                    Reddit · HN · arXiv
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
                  <span className="text-[11px] text-[#8b949e]">관리 파일 위치</span>
                  <div className="text-xs font-mono text-[#58a6ff] truncate mt-1" title={sourcesData?.sources_file}>
                    sources.json
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#f0f6fc] uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-[#58a6ff]" /> 등록된 RSS 피드 목록
                </h3>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>새 피드 직접 등록</span>
                </button>
              </div>

              {/* Add Source Form */}
              {showAddForm && (
                <form onSubmit={handleAddManualRss} className="p-4 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-3">
                  <h4 className="text-xs font-bold text-[#f0f6fc]">신규 RSS/Atom 피드 등록</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#8b949e] mb-1">소스 이름 *</label>
                      <input
                        type="text"
                        placeholder="예: Anthropic Research Blog"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded bg-[#161b22] border border-[#30363d] text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#8b949e] mb-1">RSS/Atom URL *</label>
                      <input
                        type="url"
                        placeholder="예: https://www.anthropic.com/news/rss.xml"
                        value={newUrl}
                        onChange={e => setNewUrl(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded bg-[#161b22] border border-[#30363d] text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#8b949e] mb-1">카테고리 분류</label>
                      <select
                        value={newCat}
                        onChange={e => setNewCat(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded bg-[#161b22] border border-[#30363d] text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
                      >
                        <option value="harness">Harness (에이전트 벤치마크/테스트)</option>
                        <option value="mcp_plugins_skills">MCP / Plugins / Skills</option>
                        <option value="agent_tech">Agent Tech (에이전트 아키텍처)</option>
                        <option value="ai_news">AI News (최신 인공지능 소식)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#8b949e] mb-1">국가/지역</label>
                      <select
                        value={newCountry}
                        onChange={e => setNewCountry(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded bg-[#161b22] border border-[#30363d] text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
                      >
                        <option value="GLOBAL">GLOBAL (해외 소식)</option>
                        <option value="KR">KR (국내 소식)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#8b949e] mb-1">소스 설명 (선택)</label>
                    <input
                      type="text"
                      placeholder="예: Anthropic 공식 연구 및 안전성 보고서"
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded bg-[#161b22] border border-[#30363d] text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1.5 text-xs rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={addingSource}
                      className="px-3 py-1.5 text-xs rounded bg-[#238636] hover:bg-[#2ea043] text-white font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {addingSource && <RefreshCw className="w-3 h-3 animate-spin" />}
                      <span>저장하기</span>
                    </button>
                  </div>
                </form>
              )}

              {/* RSS Feed Cards List */}
              <div className="space-y-2">
                {sourcesData?.data.rss_feeds.map(feed => (
                  <div
                    key={feed.id || feed.url}
                    className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-between gap-3 hover:border-[#58a6ff]/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#f0f6fc] truncate">{feed.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                          {feed.country || 'GLOBAL'}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d]">
                          {feed.category_hint}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8b949e] truncate mt-0.5 font-mono">{feed.url}</p>
                      {feed.description && <p className="text-[11px] text-[#8b949e]/80 line-clamp-1 mt-0.5">{feed.description}</p>}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Toggle Button */}
                      <button
                        onClick={() => handleToggle('rss', feed.id || feed.url)}
                        className={`px-2.5 py-1 text-xs rounded font-mono font-medium transition-colors cursor-pointer border ${
                          feed.enabled
                            ? 'bg-[#238636]/15 text-[#3fb950] border-[#238636]/40 hover:bg-[#238636]/25'
                            : 'bg-[#21262d] text-[#8b949e] border-[#30363d] hover:text-[#c9d1d9]'
                        }`}
                      >
                        {feed.enabled ? 'ON' : 'OFF'}
                      </button>
                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete('rss', feed.id || feed.url)}
                        className="p-1.5 text-[#8b949e] hover:text-[#f85149] hover:bg-[#da3633]/15 rounded transition-colors cursor-pointer"
                        title="소스 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* GitHub Repos Section */}
              <div className="pt-4 border-t border-[#30363d] space-y-3">
                <h3 className="text-xs font-bold text-[#f0f6fc] uppercase tracking-wider flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-[#f0f6fc]" /> 지속 모니터링 GitHub 저장소
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sourcesData?.data.github_sources.monitored_repos.map(r => (
                    <div
                      key={r.repo}
                      className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-[#f0f6fc] truncate">{r.repo}</span>
                          <span className="text-[10px] font-mono text-[#58a6ff]">★ {r.stars_hint ?? 0}</span>
                        </div>
                        <p className="text-[11px] text-[#8b949e] line-clamp-1 mt-0.5">{r.description}</p>
                      </div>
                      <button
                        onClick={() => handleToggle('github_repo', r.repo)}
                        className={`px-2 py-0.5 text-[11px] rounded font-mono transition-colors cursor-pointer border ${
                          r.enabled
                            ? 'bg-[#238636]/15 text-[#3fb950] border-[#238636]/40'
                            : 'bg-[#21262d] text-[#8b949e] border-[#30363d]'
                        }`}
                      >
                        {r.enabled ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#30363d] bg-[#0d1117] flex items-center justify-between text-xs text-[#8b949e]">
          <span className="font-mono text-[11px]">
            Single Source of Truth: <strong className="text-[#f0f6fc]">sources.json</strong>
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] font-medium cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
