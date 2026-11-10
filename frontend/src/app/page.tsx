'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import Header, { CollectorStatusLine } from '@/components/Header';
import NewsCard from '@/components/NewsCard';
import InsightsBar from '@/components/feed/InsightsBar';
import FeedToolbar from '@/components/feed/FeedToolbar';
import FeedStatusBar from '@/components/feed/FeedStatusBar';
import FeedPagination from '@/components/feed/FeedPagination';
import NewsCardSkeleton from '@/components/feed/NewsCardSkeleton';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToast } from '@/components/ui/Toast';
import HotkeyListener from '@/components/HotkeyListener';
import { useTheme } from '@/context/ThemeContext';
import { NewsItem } from '@/types/news';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useNewsFeed } from '@/hooks/useNewsFeed';
import { useOverlayOpen } from '@/lib/overlay-stack';
import { findRepeatedInsights } from '@/lib/feed-insights';

// 처음에 닫혀 있는 대화상자는 첫 번들에서 떼어 낸다 (FE-11). 마크다운 렌더러(react-markdown·remark-gfm)도 함께 빠진다.
const NewsDetailModal = dynamic(() => import('@/components/NewsDetailModal'), { ssr: false });
const DailyBriefingModal = dynamic(() => import('@/components/DailyBriefingModal'), { ssr: false });
const ScheduleModal = dynamic(() => import('@/components/ScheduleModal'), { ssr: false });
const McpModal = dynamic(() => import('@/components/McpModal'), { ssr: false });
const SourcesModal = dynamic(() => import('@/components/SourcesModal'), { ssr: false });
const BriefingSettingsModal = dynamic(
  () => import('@/components/BriefingSettingsModal').then((m) => m.BriefingSettingsModal),
  { ssr: false }
);

export default function HomePage() {
  const router = useRouter();
  const { toggleTheme } = useTheme();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const { bookmarkedIds, bookmarkedItems, toggleBookmark } = useBookmarks();
  const overlayOpen = useOverlayOpen();

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
    reloadError,
    stats,
    briefing,
    techRadar,
    loadingRadar,
    loadNews,
    loadStatsAndBriefing,
    resetFilters,
  } = useNewsFeed({ bookmarkedItems });

  // 같은 시사점 문장이 반복되는 카드는 요약을 대신 보인다 (R18).
  const repeatedInsights = useMemo(() => findRepeatedInsights(news), [news]);

  // 같은 조건 다시 읽기가 실패하면 목록은 그대로 두고 알림만 띄운다 (R22). 실패마다 id 가 바뀐다.
  const toast = useToast();
  const shownReloadErrorId = useRef(0);
  useEffect(() => {
    if (!reloadError || reloadError.id === shownReloadErrorId.current) return;
    shownReloadErrorId.current = reloadError.id;
    toast.show({ message: reloadError.message, tone: 'danger' });
  }, [reloadError, toast]);

  // 목록(페이지·필터·정렬·검색어)이 바뀌면 j/k 포커스를 처음으로 되돌린다 (렌더 중 이전 값 비교).
  const listKey = JSON.stringify([page, category, source, search, sort, highSignalOnly]);
  const [focusListKey, setFocusListKey] = useState(listKey);
  if (focusListKey !== listKey) {
    setFocusListKey(listKey);
    setFocusedIndex(-1);
  }

  const isFiltered = category !== 'all' || source !== 'all' || search.trim() !== '' || highSignalOnly;

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

  // j/k: 다음/이전 카드로 포커스 상태와 실제 DOM 포커스(카드 제목 버튼)를 함께 옮긴다.
  const handleNavigateFeed = (delta: 1 | -1) => {
    if (!news || news.length === 0) return;
    const next = Math.min(Math.max(focusedIndex + delta, 0), news.length - 1);
    setFocusedIndex(next);
    const card = document.querySelectorAll<HTMLElement>('[data-feed-card]')[next];
    if (card) {
      const target = card.querySelector<HTMLElement>('h3 button') ?? card;
      target.focus({ preventScroll: true });
      card.scrollIntoView({ block: 'nearest' });
    }
  };

  const handleOpenDetailModal = () => {
    if (focusedIndex >= 0 && news[focusedIndex]) {
      handleOpenDetail(news[focusedIndex]);
    }
  };

  const handleHandoverChat = () => {
    if (focusedIndex >= 0 && news[focusedIndex]) {
      router.push(`/chat?sourceId=${news[focusedIndex].id}`);
    }
  };

  const handleToggleBookmarkCurrent = () => {
    if (focusedIndex >= 0 && news[focusedIndex]) {
      toggleBookmark(news[focusedIndex]);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-fg">
      <HotkeyListener
        onNavigateFeed={handleNavigateFeed}
        onOpenDetailModal={handleOpenDetailModal}
        onHandoverChat={handleHandoverChat}
        onToggleBookmark={handleToggleBookmarkCurrent}
        onFocusSearch={() => {
          // 검색 영역은 sticky 가 아니다: 포커스는 스크롤 없이 주고, 영역을 sticky 헤더 아래로 보이게 한다 (scroll-mt-20).
          const input = searchInputRef.current;
          if (!input) return;
          input.focus({ preventScroll: true });
          input.closest('[data-feed-search]')?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
        }}
        onToggleTheme={toggleTheme}
        blockSingleKeys={overlayOpen}
      />
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
      <CollectorStatusLine />

      <main
        id="main"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-3 px-4 pt-3 pb-8 outline-none md:gap-4 md:px-6 md:pt-6 lg:px-8"
      >
        <h1 className="sr-only">AI 에이전트 소식</h1>

        <InsightsBar
          briefing={briefing}
          onOpenBriefing={() => setBriefingModalOpen(true)}
          radar={techRadar}
          loadingRadar={loadingRadar}
          activeTag={selectedTag}
          onSelectTag={handleSelectTag}
        />

        <FeedToolbar
          category={category}
          source={source}
          search={search}
          highSignalOnly={highSignalOnly}
          categoryCounts={stats?.category_counts}
          sourceCounts={stats?.source_counts}
          bookmarkCount={bookmarkedItems.length}
          onCategoryChange={setCategory}
          onSourceChange={setSource}
          onHighSignalChange={setHighSignalOnly}
          onSearchChange={setSearch}
          onSearchSubmit={loadNews}
          onPageChange={setPage}
          searchInputRef={searchInputRef}
        />

        <FeedStatusBar
          ref={statusRef}
          total={total}
          totalNews={stats?.total_news}
          filtered={isFiltered}
          isBookmarks={source === 'bookmarks'}
          highSignalOnly={highSignalOnly}
          page={page}
          totalPages={totalPages}
          sort={sort}
          onSortChange={setSort}
          onPageChange={setPage}
        />

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            <p className="sr-only">소식을 불러오는 중...</p>
            {Array.from({ length: 6 }, (_, i) => (
              <NewsCardSkeleton key={i} />
            ))}
          </div>
        ) : null}

        {!loading && error ? (
          <ErrorState
            title={error}
            message="백엔드 서버 연결 상태를 확인해주세요."
            onRetry={() => {
              setError(null);
              loadNews();
            }}
            className="rounded-xl border border-dashed border-border bg-surface"
          />
        ) : null}

        {!loading && !error && news.length > 0 ? (
          // 카드(`h-full`)가 같은 줄의 가장 높은 카드에 맞춰 늘어난다.
          <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {news.map((item, idx) => (
              <NewsCard
                key={item.id}
                item={item}
                onSelect={handleOpenDetail}
                isBookmarked={bookmarkedIds.includes(item.id)}
                onToggleBookmark={toggleBookmark}
                isFocused={idx === focusedIndex}
                preferSummary={repeatedInsights.has(item.id)}
              />
            ))}
          </div>
        ) : null}

        {!loading && !error && news.length === 0 ? (
          <EmptyState
            icon={<Search />}
            title="조건에 일치하는 소식이 없습니다"
            description="다른 카테고리를 선택하거나 검색어 및 필터를 초기화해 보세요."
            action={
              <Button variant="primary" onClick={resetFilters}>
                필터 전체 초기화
              </Button>
            }
            className="rounded-xl border border-dashed border-border bg-surface"
          />
        ) : null}

        {!loading ? (
          <FeedPagination page={page} totalPages={totalPages} onPageChange={setPage} statusRef={statusRef} />
        ) : null}
      </main>

      <footer className="border-t border-border px-4 py-4 text-center text-xs text-fg-subtle">
        AgentLens © 2026 · AI 에이전트 · 하네스 · MCP 생태계 소식
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
