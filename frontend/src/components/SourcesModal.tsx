'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Globe,
  Sparkles,
  Radio,
} from 'lucide-react';
import {
  fetchSources,
  toggleSource,
  deleteSource,
  fetchDeepResearchStatus,
  fetchResearchAuditLogs,
  SourcesResponse,
  ResearchStatus,
  ResearchAuditLog,
} from '@/lib/api';
import DeepResearcherTab from './sources/DeepResearcherTab';
import SourcesListTab from './sources/SourcesListTab';

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
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [srcRes, statRes, logsRes] = await Promise.all([
        fetchSources(),
        fetchDeepResearchStatus(),
        fetchResearchAuditLogs(30),
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
      showToast('success', '수집 상태가 변경되었습니다.');
      loadData();
      onSourcesUpdated?.();
    } catch {
      showToast('error', '상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async (sourceType: string, id: string) => {
    if (!window.confirm('이 소스를 목록에서 삭제하시겠습니까?')) return;
    try {
      await deleteSource(sourceType, id);
      showToast('success', '소스가 삭제되었습니다.');
      loadData();
      onSourcesUpdated?.();
    } catch {
      showToast('error', '소스 삭제에 실패했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-800 z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                수집 소스 관리 및 자율 리서처
              </h3>
              <p className="text-[11px] text-slate-500">
                RSS 피드, GitHub 저장소, arXiv, Reddit 수집 대상을 관리합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 border-b border-slate-200 bg-slate-50 flex gap-4 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('deep_research')}
            className={`py-2.5 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'deep_research'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Deep Researcher (자율 발굴/채택)</span>
            {researchStatus?.auto_adopted_count ? (
              <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                +{researchStatus.auto_adopted_count}
              </span>
            ) : null}
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`py-2.5 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sources'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-600" />
            <span>등록된 수집원 목록</span>
            <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
              {sourcesData?.stats.active_rss ?? 0}
            </span>
          </button>
        </div>

        {/* Toast Alert */}
        {msg && (
          <div
            className={`px-4 py-2 text-xs text-center shrink-0 ${
              msg.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-b border-emerald-200'
                : 'bg-red-50 text-red-700 border-b border-red-200'
            }`}
          >
            {msg.text}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-white">
          {activeTab === 'deep_research' ? (
            <DeepResearcherTab
              researchStatus={researchStatus}
              auditLogs={auditLogs}
              loading={loading}
              onRefresh={loadData}
              showToast={showToast}
              onSourcesUpdated={onSourcesUpdated}
            />
          ) : (
            <SourcesListTab
              sourcesData={sourcesData}
              onRefresh={loadData}
              onToggle={handleToggle}
              onDelete={handleDelete}
              showToast={showToast}
              onSourcesUpdated={onSourcesUpdated}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono text-[11px]">
            Single Source of Truth: <strong className="text-slate-900">sources.json</strong>
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium shadow-xs cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
