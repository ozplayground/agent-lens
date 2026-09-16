'use client';

import React, { useState } from 'react';
import { Search, Flame, Clock, Star, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import CategoryFilter from '@/components/CategoryFilter';
import SourceFilter from '@/components/SourceFilter';
import NewsCard from '@/components/NewsCard';
import NewsDetailModal from '@/components/NewsDetailModal';
import DailyBriefingModal from '@/components/DailyBriefingModal';
import DailyBriefingBanner from '@/components/DailyBriefingBanner';
import ScheduleModal from '@/components/ScheduleModal';
import McpModal from '@/components/McpModal';
import SourcesModal from '@/components/SourcesModal';
import { TechRadar } from '@/components/TechRadar';
import { BriefingSettingsModal } from '@/components/BriefingSettingsModal';
import { NewsItem } from '@/types/news';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useNewsFeed } from '@/hooks/useNewsFeed';

export default function HomePage() {
  const { bookmarkedIds, bookmarkedItems, toggleBookmark } = useBookmarks();

  const {
    category,
    setCategory,
    source,
    setSource,
    search,
    setSearch,
    sort,
    setSort,
    highSignalOnly,
    setHighSignalOnly,
    page,
    setPage,
    selectedTag,
    handleSelectTag,
    news,
    total,
    totalPages,
    loading,
    error,
    setError,
    stats,
    briefing,
    techRadar,
    loadingRadar,
    loadNews,
    loadStatsAndBriefing,
    resetFilters,
  } = useNewsFeed({ bookmarkedItems });

  // Modal Dialog States
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [briefingModalOpen, setBriefingModalOpen] = useState(false);
  const [schedOpen, setSchedOpen] = useState(false);
  const [mcpOpen, setMcpOpen] = useState(false);
  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [sourcesModalOpen, setSourcesModalOpen] = useState(false);

  const handleOpenDetail = (item: NewsItem) => {
    setSelectedItem(item);
    setDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header
        onRefresh={() => {
          loadNews();
          loadStatsAndBriefing();
        }}
        onOpenSchedule={() => setSchedOpen(true)}
        onOpenMcp={() => setMcpOpen(true)}
        onOpenWebhook={() => setWebhookModalOpen(true)}
        onOpenSources={() => setSourcesModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {/* Daily Intelligence Briefing Banner */}
        <DailyBriefingBanner briefing={briefing} onOpen={() => setBriefingModalOpen(true)} />

        {/* Overview Header */}
        <div className="rounded-xl bg-white border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span className="font-bold text-blue-600">agentlens</span>
              <span>/</span>
              <span className="text-slate-700 font-semibold">feed</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 font-semibold">
                Live Stream
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
              글로벌 AI 소식 · Agent 아키텍처 · SWE-bench/하네스 평가 · MCP 생태계를 LLM으로 선별하고 3줄 핵심 요약과 개발자 시사점을 추출합니다.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-medium">
              전체 <strong className="text-slate-900 font-bold">{stats?.total_news || total}</strong>건
            </span>
            <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1.5 font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              Must-Read
            </span>
          </div>
        </div>

        {/* Tech Radar */}
        <section>
          <TechRadar
            data={techRadar}
            activeTag={selectedTag}
            onSelectTag={handleSelectTag}
            isLoading={loadingRadar}
          />
        </section>

        {/* Category Filter */}
        <section>
          <CategoryFilter
            currentCategory={category}
            onSelectCategory={(c) => {
              setCategory(c);
              setSource('all');
              setPage(1);
            }}
            counts={stats?.category_counts}
          />
        </section>

        {/* Toolbar: Source Filter & Search */}
        <section className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-sm">
          <SourceFilter
            currentSource={source}
            onSelectSource={(s) => {
              setSource(s);
              setPage(1);
            }}
            sourceCounts={stats?.source_counts}
            bookmarkCount={bookmarkedItems.length}
            highSignalOnly={highSignalOnly}
            onToggleHighSignal={() => {
              setHighSignalOnly(!highSignalOnly);
              setPage(1);
            }}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
            {/* Search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPage(1);
                loadNews();
              }}
              className="relative flex-1 max-w-md"
              suppressHydrationWarning
            >
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="키워드 검색 (SWE-bench, MCP, LangGraph, Claude 3.7 등)..."
                autoComplete="off"
                suppressHydrationWarning
                className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none rounded-lg pl-10 pr-16 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 transition-colors"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-200 hover:bg-slate-300 text-xs font-semibold text-slate-800 rounded-md cursor-pointer transition-colors"
              >
                검색
              </button>
            </form>

            {/* Sort options */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0 self-start sm:self-auto">
              <button
                onClick={() => {
                  setSort('hot');
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                  sort === 'hot'
                    ? 'bg-white text-orange-600 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span>인기순</span>
              </button>
              <button
                onClick={() => {
                  setSort('quality');
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                  sort === 'quality'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>품질순</span>
              </button>
              <button
                onClick={() => {
                  setSort('latest');
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                  sort === 'latest'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>최신순</span>
              </button>
              <button
                onClick={() => {
                  setSort('top');
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                  sort === 'top'
                    ? 'bg-white text-amber-600 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>추천순</span>
              </button>
            </div>
          </div>
        </section>

        {/* Status bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
          <div>
            총 <strong className="text-slate-900 font-mono font-bold">{total}</strong>건의 소식
            {source === 'bookmarks' && <span className="text-blue-600 font-bold"> (북마크)</span>}
            {highSignalOnly && <span className="text-amber-700 font-bold"> (Must-Read 필터링)</span>}
          </div>
          <div>
            페이지 <strong className="text-slate-900 font-mono font-bold">{page}</strong> / {totalPages || 1}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-2">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            <p className="text-xs font-mono font-medium">소식을 불러오는 중...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="text-center py-16 border border-dashed border-red-300 rounded-xl bg-red-50/50 space-y-3">
            <div className="w-10 h-10 rounded-full bg-red-100 border border-red-200 flex items-center justify-center mx-auto text-red-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-red-700">{error}</h3>
            <p className="text-xs text-slate-600">백엔드 서버(포트 8000) 연결 상태를 확인해주세요.</p>
            <button
              onClick={() => {
                setError(null);
                loadNews();
              }}
              className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-300 shadow-xs transition-colors cursor-pointer"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* News Grid */}
        {!loading && !error && news.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {news.map((item) => (
              <NewsCard
                key={item.id}
                item={item}
                onSelect={handleOpenDetail}
                isBookmarked={bookmarkedIds.includes(item.id)}
                onToggleBookmark={toggleBookmark}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && news.length === 0 && (
          <div className="text-center py-16 border border-dashed border-slate-300 rounded-xl bg-white space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-500">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">조건에 일치하는 소식이 없습니다</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              다른 카테고리를 선택하거나 검색어 및 필터를 초기화해 보세요.
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
            >
              필터 전체 초기화
            </button>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4 pb-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              &larr; 이전
            </button>
            <span className="text-xs font-mono font-bold text-slate-700 px-3">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              다음 &rarr;
            </button>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
        <p>AgentLens &copy; 2026. AI Agent · 하네스(Harness) · MCP 생태계 인텔리전스 대시보드.</p>
      </footer>

      {/* Modals */}
      <NewsDetailModal
        key={selectedItem ? `news-modal-${selectedItem.id}` : 'news-modal-empty'}
        item={selectedItem}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        isBookmarked={selectedItem ? bookmarkedIds.includes(selectedItem.id) : false}
        onToggleBookmark={toggleBookmark}
      />
      <DailyBriefingModal
        briefing={briefing}
        isOpen={briefingModalOpen}
        onClose={() => setBriefingModalOpen(false)}
        onOpenSettings={() => setWebhookModalOpen(true)}
      />
      <ScheduleModal isOpen={schedOpen} onClose={() => setSchedOpen(false)} />
      <McpModal isOpen={mcpOpen} onClose={() => setMcpOpen(false)} />
      <BriefingSettingsModal isOpen={webhookModalOpen} onClose={() => setWebhookModalOpen(false)} />
      <SourcesModal
        isOpen={sourcesModalOpen}
        onClose={() => setSourcesModalOpen(false)}
        onSourcesUpdated={() => {
          loadNews();
          loadStatsAndBriefing();
        }}
      />
    </div>
  );
}
