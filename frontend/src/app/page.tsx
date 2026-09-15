'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Flame, Clock, Star, Loader2, GitBranch, BookOpen, ShieldCheck, AlertCircle } from 'lucide-react';
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
import { CategoryType, NewsItem, StatsResponse, DailyBriefing } from '@/types/news';
import { TechRadarData } from '@/types/trends';
import { fetchNewsFeed, fetchStats, fetchDailyBriefing, fetchTechRadar } from '@/lib/api';

export default function HomePage() {
  const [category, setCategory] = useState<CategoryType>('all');
  const [source, setSource] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [sort, setSort] = useState<string>('hot');
  const [highSignalOnly, setHighSignalOnly] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [news, setNews] = useState<NewsItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [techRadar, setTechRadar] = useState<TechRadarData | null>(null);
  const [loadingRadar, setLoadingRadar] = useState<boolean>(true);

  // Modals
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [briefingModalOpen, setBriefingModalOpen] = useState(false);
  const [schedOpen, setSchedOpen] = useState(false);
  const [mcpOpen, setMcpOpen] = useState(false);
  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [sourcesModalOpen, setSourcesModalOpen] = useState(false);

  // Bookmarks (stored in localStorage)
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([]);
  const [bookmarkedItems, setBookmarkedItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('agentlens_bookmarks');
      if (saved) {
        const parsed: NewsItem[] = JSON.parse(saved);
        setBookmarkedItems(parsed);
        setBookmarkedIds(parsed.map((i) => i.id));
      }
    } catch {}
  }, []);

  const toggleBookmark = (item: NewsItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated: NewsItem[];
    if (bookmarkedIds.includes(item.id)) {
      updated = bookmarkedItems.filter((i) => i.id !== item.id);
    } else {
      updated = [item, ...bookmarkedItems];
    }
    setBookmarkedItems(updated);
    setBookmarkedIds(updated.map((i) => i.id));
    localStorage.setItem('agentlens_bookmarks', JSON.stringify(updated));
  };

  const loadStatsAndBriefing = async () => {
    try {
      setLoadingRadar(true);
      const [s, b, r] = await Promise.all([
        fetchStats(),
        fetchDailyBriefing().catch(() => null),
        fetchTechRadar().catch(() => null)
      ]);
      setStats(s);
      if (b) setBriefing(b);
      if (r) setTechRadar(r);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRadar(false);
    }
  };

  const handleSelectTag = (tag: string) => {
    setSelectedTag(tag || null);
    setSearch(tag);
    setPage(1);
  };

  const loadNews = useCallback(async () => {
    // If viewing bookmarks
    if (source === 'bookmarks') {
      let filtered = [...bookmarkedItems];
      if (category !== 'all') {
        filtered = filtered.filter((i) => i.category === category);
      }
      if (search.trim()) {
        const term = search.toLowerCase();
        filtered = filtered.filter((i) => i.title.toLowerCase().includes(term) || i.summary.toLowerCase().includes(term));
      }
      setNews(filtered);
      setTotal(filtered.length);
      setTotalPages(1);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetchNewsFeed({
        category,
        source,
        search,
        sort,
        high_signal_only: highSignalOnly,
        page,
        size: 18
      });
      setNews(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      setError(err.message || '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [category, source, search, sort, highSignalOnly, page, bookmarkedItems]);

  useEffect(() => {
    loadStatsAndBriefing();
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const handleOpenDetail = (item: NewsItem) => {
    setSelectedItem(item);
    setDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex flex-col font-sans">
      <Header
        onRefresh={() => { loadNews(); loadStatsAndBriefing(); }}
        onOpenSchedule={() => setSchedOpen(true)}
        onOpenMcp={() => setMcpOpen(true)}
        onOpenWebhook={() => setWebhookModalOpen(true)}
        onOpenSources={() => setSourcesModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {/* Daily Intelligence Briefing Banner (GitHub Announcement style) */}
        <DailyBriefingBanner
          briefing={briefing}
          onOpen={() => setBriefingModalOpen(true)}
        />

        {/* GitHub Repository Overview Header (Replaces gaudy gradient billboard) */}
        <div className="rounded-md bg-[#161b22] border border-[#30363d] p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#8b949e] font-mono">
              <span className="font-semibold text-[#f0f6fc]">agentlens</span>
              <span>/</span>
              <span className="text-[#c9d1d9]">feed</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full border border-[#30363d] bg-[#21262d] text-[#8b949e]">
                Live Stream
              </span>
            </div>
            <p className="text-xs text-[#8b949e] leading-relaxed max-w-3xl">
              글로벌 AI 소식 · Agent 아키텍처 · SWE-bench/하네스 평가 · MCP 생태계를 LLM으로 선별하고 3줄 핵심 요약과 개발자 시사점을 추출합니다.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <span className="text-[11px] font-mono px-2 py-1 rounded bg-[#21262d] text-[#c9d1d9] border border-[#30363d]">
              전체 <strong className="text-[#f0f6fc]">{stats?.total_news || total}</strong>건
            </span>
            <span className="text-[11px] font-mono px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400" />
              Must-Read
            </span>
          </div>
        </div>

        {/* Real-time Tech Radar Section */}
        <section>
          <TechRadar
            data={techRadar}
            activeTag={selectedTag}
            onSelectTag={handleSelectTag}
            isLoading={loadingRadar}
          />
        </section>

        {/* Category Navigation (GitHub Sub-nav Tabs) */}
        <section>
          <CategoryFilter
            currentCategory={category}
            onSelectCategory={(c) => { setCategory(c); setSource('all'); setPage(1); }}
            counts={stats?.category_counts}
          />
        </section>

        {/* Toolbar: Source Filter & Search */}
        <section className="bg-[#161b22] border border-[#30363d] rounded-md p-3 space-y-2.5">
          <SourceFilter
            currentSource={source}
            onSelectSource={(s) => { setSource(s); setPage(1); }}
            sourceCounts={stats?.source_counts}
            bookmarkCount={bookmarkedItems.length}
            highSignalOnly={highSignalOnly}
            onToggleHighSignal={() => { setHighSignalOnly(!highSignalOnly); setPage(1); }}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-[#30363d]">
            {/* Search */}
            <form onSubmit={(e) => { e.preventDefault(); setPage(1); loadNews(); }} className="relative flex-1 max-w-md" suppressHydrationWarning>
              <Search className="w-3.5 h-3.5 text-[#8b949e] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="키워드 검색 (SWE-bench, MCP, LangGraph, Claude 3.7 등)..."
                autoComplete="off"
                suppressHydrationWarning
                className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] focus:outline-none rounded-md pl-9 pr-16 py-1.5 text-xs text-[#f0f6fc] placeholder-[#8b949e]"
              />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[11px] font-medium text-[#c9d1d9] rounded cursor-pointer"
              >
                검색
              </button>
            </form>

            {/* Sort options (GitHub List Sort style) */}
            <div className="flex items-center gap-1 bg-[#0d1117] p-0.5 rounded-md border border-[#30363d] shrink-0 self-start sm:self-auto">
              <button
                onClick={() => { setSort('hot'); setPage(1); }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  sort === 'hot' ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d]' : 'text-[#8b949e] hover:text-[#c9d1d9]'
                }`}
              >
                <Flame className="w-3 h-3 text-[#f0883e]" />
                <span>인기순</span>
              </button>
              <button
                onClick={() => { setSort('quality'); setPage(1); }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  sort === 'quality' ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d]' : 'text-[#8b949e] hover:text-[#c9d1d9]'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>품질순</span>
              </button>
              <button
                onClick={() => { setSort('latest'); setPage(1); }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  sort === 'latest' ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d]' : 'text-[#8b949e] hover:text-[#c9d1d9]'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>최신순</span>
              </button>
              <button
                onClick={() => { setSort('top'); setPage(1); }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  sort === 'top' ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d]' : 'text-[#8b949e] hover:text-[#c9d1d9]'
                }`}
              >
                <Star className="w-3 h-3 text-amber-400" />
                <span>추천순</span>
              </button>
            </div>
          </div>
        </section>

        {/* Status bar */}
        <div className="flex items-center justify-between text-xs text-[#8b949e] px-1">
          <div>
            총 <strong className="text-[#f0f6fc] font-mono">{total}</strong>건의 소식
            {source === 'bookmarks' && <span> (보관함)</span>}
            {highSignalOnly && <span className="text-amber-300 font-medium"> (Must-Read 필터링)</span>}
          </div>
          <div>페이지 <strong className="text-[#f0f6fc] font-mono">{page}</strong> / {totalPages || 1}</div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-[#8b949e] space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#58a6ff]" />
            <p className="text-xs font-mono">소식을 불러오는 중...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="text-center py-16 border border-dashed border-[#da3633]/40 rounded-md bg-[#161b22] space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#da3633]/10 border border-[#da3633]/30 flex items-center justify-center mx-auto text-[#f85149]">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#f85149]">{error}</h3>
            <p className="text-xs text-[#8b949e]">백엔드 서버(포트 8000) 연결 상태를 확인해주세요.</p>
            <button
              onClick={() => { setError(null); loadNews(); }}
              className="px-3.5 py-1.5 rounded-md bg-[#21262d] hover:bg-[#30363d] text-xs font-medium text-[#f0f6fc] border border-[#30363d] transition-colors cursor-pointer"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* News Grid */}
        {!loading && !error && news.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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

        {/* Empty State (GitHub Empty Box) */}
        {!loading && !error && news.length === 0 && (
          <div className="text-center py-16 border border-dashed border-[#30363d] rounded-md bg-[#161b22] space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center mx-auto text-[#8b949e]">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#f0f6fc]">조건에 일치하는 소식이 없습니다</h3>
            <p className="text-xs text-[#8b949e] max-w-sm mx-auto">
              다른 카테고리를 선택하거나 필터를 초기화해 보세요.
            </p>
            <button
              onClick={() => { setCategory('all'); setSource('all'); setSearch(''); setHighSignalOnly(false); setPage(1); }}
              className="px-3.5 py-1.5 rounded-md bg-[#21262d] hover:bg-[#30363d] text-xs font-medium text-[#f0f6fc] border border-[#30363d] transition-colors cursor-pointer"
            >
              필터 전체 초기화
            </button>
          </div>
        )}

        {/* Pagination (GitHub pagination buttons) */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4 pb-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-md border border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-xs text-[#c9d1d9] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              &larr; 이전
            </button>
            <span className="text-xs font-mono text-[#8b949e] px-2">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-md border border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-xs text-[#c9d1d9] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              다음 &rarr;
            </button>
          </div>
        )}
      </main>

      <footer className="border-t border-[#30363d] bg-[#161b22] py-4 text-center text-xs text-[#8b949e]">
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
        onSourcesUpdated={() => { loadNews(); loadStatsAndBriefing(); }}
      />
    </div>
  );
}
