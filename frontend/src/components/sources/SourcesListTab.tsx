'use client';

import React, { useState } from 'react';
import { Radio, Plus, RefreshCw, Trash2, GitBranch } from 'lucide-react';
import { SourcesResponse, addRssSource } from '@/lib/api';

interface SourcesListTabProps {
  sourcesData: SourcesResponse | null;
  onRefresh: () => void;
  onToggle: (sourceType: string, id: string) => Promise<void>;
  onDelete: (sourceType: string, id: string) => Promise<void>;
  showToast: (type: 'success' | 'error', text: string) => void;
  onSourcesUpdated?: () => void;
}

export default function SourcesListTab({
  sourcesData,
  onRefresh,
  onToggle,
  onDelete,
  showToast,
  onSourcesUpdated,
}: SourcesListTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCat, setNewCat] = useState('ai_news');
  const [newCountry, setNewCountry] = useState('GLOBAL');
  const [newDesc, setNewDesc] = useState('');
  const [addingSource, setAddingSource] = useState(false);

  const handleAddManualRss = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;

    try {
      setAddingSource(true);
      const res = await addRssSource({
        name: newName.trim(),
        url: newUrl.trim(),
        category_hint: newCat,
        country: newCountry,
        description: newDesc.trim(),
      });

      showToast('success', res.message || `'${newName}' 피드가 성공적으로 추가되었습니다.`);
      setNewName('');
      setNewUrl('');
      setNewDesc('');
      setShowAddForm(false);
      onRefresh();
      onSourcesUpdated?.();
    } catch (err: any) {
      showToast('error', err.message || '피드 추가에 실패했습니다.');
    } finally {
      setAddingSource(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Summary Stats Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500">활성 RSS 피드</span>
          <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
            {sourcesData?.stats.active_rss ?? 0}{' '}
            <span className="text-xs text-slate-400">/ {sourcesData?.stats.total_rss ?? 0}</span>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500">모니터링 GitHub</span>
          <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
            {sourcesData?.stats.active_github_repos ?? 0}{' '}
            <span className="text-xs text-slate-400">
              / {sourcesData?.stats.total_github_repos ?? 0}
            </span>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500">커뮤니티 수집</span>
          <div className="text-xs font-mono text-emerald-700 mt-1.5 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Reddit · HN · arXiv
          </div>
        </div>
        <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500">관리 파일 위치</span>
          <div className="text-xs font-mono text-blue-600 truncate mt-1 font-medium" title={sourcesData?.sources_file}>
            sources.json
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-blue-600" /> 등록된 RSS 피드 목록
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>새 피드 직접 등록</span>
        </button>
      </div>

      {/* Add Source Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddManualRss}
          className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3"
        >
          <h4 className="text-xs font-bold text-slate-900">신규 RSS/Atom 피드 등록</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">소스 이름 *</label>
              <input
                type="text"
                placeholder="예: Anthropic Research Blog"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">RSS/Atom URL *</label>
              <input
                type="url"
                placeholder="예: https://www.anthropic.com/news/rss.xml"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">카테고리 분류</label>
              <select
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
              >
                <option value="harness">Harness (에이전트 벤치마크/테스트)</option>
                <option value="mcp_plugins_skills">MCP / Plugins / Skills</option>
                <option value="agent_tech">Agent Tech (에이전트 아키텍처)</option>
                <option value="ai_news">AI News (최신 인공지능 소식)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">국가/지역</label>
              <select
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
              >
                <option value="GLOBAL">GLOBAL (해외 소식)</option>
                <option value="KR">KR (국내 소식)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-slate-600 mb-1">소스 설명 (선택)</label>
            <input
              type="text"
              placeholder="예: Anthropic 공식 연구 및 안전성 보고서"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer shadow-xs"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={addingSource}
              className="px-3 py-1.5 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {addingSource && <RefreshCw className="w-3 h-3 animate-spin" />}
              <span>저장하기</span>
            </button>
          </div>
        </form>
      )}

      {/* RSS Feed Cards List */}
      <div className="space-y-2">
        {sourcesData?.data.rss_feeds.map((feed) => (
          <div
            key={feed.id || feed.url}
            className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-3 hover:border-blue-400 shadow-xs transition-colors"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-slate-900 truncate">{feed.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {feed.country || 'GLOBAL'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-blue-700 border border-slate-200 font-medium">
                  {feed.category_hint}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">{feed.url}</p>
              {feed.description && (
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                  {feed.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onToggle('rss', feed.id || feed.url)}
                className={`px-2.5 py-1 text-xs rounded font-mono font-medium transition-colors cursor-pointer border ${
                  feed.enabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-800'
                }`}
              >
                {feed.enabled ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => onDelete('rss', feed.id || feed.url)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                title="소스 삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* GitHub Repos Section */}
      <div className="pt-4 border-t border-slate-200 space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5 text-slate-700" /> 지속 모니터링 GitHub 저장소
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sourcesData?.data.github_sources.monitored_repos.map((r) => (
            <div
              key={r.repo}
              className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-xs"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs text-slate-900 truncate">{r.repo}</span>
                  <span className="text-[10px] font-mono text-amber-600 font-semibold">★ {r.stars_hint ?? 0}</span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{r.description}</p>
              </div>
              <button
                onClick={() => onToggle('github_repo', r.repo)}
                className={`px-2 py-0.5 text-[11px] rounded font-mono transition-colors cursor-pointer border ${
                  r.enabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                {r.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
