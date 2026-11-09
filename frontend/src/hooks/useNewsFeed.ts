'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CategoryType, NewsItem, StatsResponse, DailyBriefing } from '@/types/news';
import { TechRadarData } from '@/types/trends';
import { fetchNewsFeed, fetchStats, fetchDailyBriefing, fetchTechRadar } from '@/lib/api';

interface UseNewsFeedProps {
  bookmarkedItems: NewsItem[];
}

export function useNewsFeed({ bookmarkedItems }: UseNewsFeedProps) {
  const [category, setCategory] = useState<CategoryType>('all');
  const [source, setSource] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [sort, setSort] = useState<string>('hot');
  const [highSignalOnly, setHighSignalOnly] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 목록 키(필터·정렬·검색어·페이지)와 다시 읽기 번호를 나눈다 (spec 14.5, R22).
  // - `loading` 은 지금 목록 키의 응답이 아직 없을 때만 true. 같은 키를 다시 읽는 동안에는 이전 목록을 그린다.
  // - 같은 키 다시 읽기 실패는 목록을 지우지 않고 `reloadError` 신호로, 키가 바뀐 요청의 실패는 `error` 로.
  // effect 안에서는 비동기 콜백에서만 setState 한다 (react-hooks/set-state-in-effect).
  const [newsReload, setNewsReload] = useState<number>(0);
  const listKey = JSON.stringify([category, source, search, sort, highSignalOnly, page]);
  const [feed, setFeed] = useState<{
    key: string;
    items: NewsItem[];
    total: number;
    totalPages: number;
  } | null>(null);
  // `seq` 는 실패마다 하나씩 늘어나는 번호다. 같은 다시 읽기 번호로 다시 실패해도 새 신호가 된다.
  const [feedError, setFeedError] = useState<{ key: string; seq: number; message: string } | null>(null);
  const failureSeq = useRef(0);

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [techRadar, setTechRadar] = useState<TechRadarData | null>(null);
  const [statsReload, setStatsReload] = useState<number>(0);
  const [statsLoaded, setStatsLoaded] = useState<boolean>(false);
  // 요약 바 스켈레톤은 한 번도 읽지 못했을 때만. 다시 읽는 동안에는 이전 브리핑·레이더를 그린다.
  const loadingRadar = !statsLoaded;

  useEffect(() => {
    let cancelled = false;
    // 하나가 실패해도 나머지는 반영한다.
    Promise.allSettled([fetchStats(), fetchDailyBriefing(), fetchTechRadar()]).then(([s, b, r]) => {
      if (cancelled) return;
      if (s.status === 'fulfilled') setStats(s.value);
      else console.error('Failed to load stats', s.reason);
      if (b.status === 'fulfilled' && b.value) setBriefing(b.value);
      if (r.status === 'fulfilled' && r.value) setTechRadar(r.value);
      setStatsLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [statsReload]);

  const loadStatsAndBriefing = useCallback(() => {
    setStatsReload((n) => n + 1);
  }, []);

  const handleSelectTag = (tag: string) => {
    setSelectedTag(tag || null);
    setSearch(tag);
    setPage(1);
  };

  useEffect(() => {
    if (source === 'bookmarks') return;
    let cancelled = false;
    fetchNewsFeed({
      category,
      source,
      search,
      sort,
      high_signal_only: highSignalOnly,
      page,
      size: 18,
    })
      .then((res) => {
        if (cancelled) return;
        setFeed({ key: listKey, items: res.items, total: res.total, totalPages: res.total_pages });
        setFeedError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = (err instanceof Error && err.message) || '데이터를 불러오지 못했습니다.';
        failureSeq.current += 1;
        setFeedError({ key: listKey, seq: failureSeq.current, message });
      });
    return () => {
      cancelled = true;
    };
    // listKey 는 아래 필터 값을 담는다. newsReload 가 바뀌면 같은 키를 다시 읽는다.
  }, [listKey, newsReload, category, source, search, sort, highSignalOnly, page]);

  // 북마크 보기는 저장된 목록에서 바로 파생한다 (요청 없음).
  const bookmarkView = useMemo(() => {
    if (source !== 'bookmarks') return null;
    let filtered = [...bookmarkedItems];
    if (category !== 'all') {
      filtered = filtered.filter((i) => i.category === category);
    }
    if (search.trim()) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (i) => i.title.toLowerCase().includes(term) || i.summary.toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [source, bookmarkedItems, category, search]);

  const isBookmarkView = bookmarkView !== null;
  const hasCurrentFeed = feed?.key === listKey;
  const currentFeedError = !isBookmarkView && feedError?.key === listKey ? feedError : null;
  // 지금 키의 목록이 있으면 실패는 다시 읽기 실패다 (목록 유지 + 신호). 없으면 ErrorState.
  const error = currentFeedError && !hasCurrentFeed ? currentFeedError.message : null;
  const reloadError = useMemo(
    () =>
      currentFeedError && hasCurrentFeed
        ? { id: currentFeedError.seq, message: currentFeedError.message }
        : null,
    [currentFeedError, hasCurrentFeed]
  );
  const loading = !isBookmarkView && !hasCurrentFeed && error === null;
  // 키가 바뀐 뒤에는 옛 목록을 보이지 않는다 (loading 이나 error 가 대신 그려진다).
  const currentFeed = hasCurrentFeed ? feed : null;
  const news = bookmarkView ?? currentFeed?.items ?? [];
  const total = bookmarkView ? bookmarkView.length : currentFeed?.total ?? 0;
  const totalPages = bookmarkView ? 1 : currentFeed?.totalPages ?? 1;

  const setError = useCallback(
    (message: string | null) => {
      if (message === null) {
        setFeedError(null);
        return;
      }
      failureSeq.current += 1;
      setFeedError({ key: listKey, seq: failureSeq.current, message });
    },
    [listKey]
  );

  const loadNews = useCallback(() => {
    setNewsReload((n) => n + 1);
  }, []);

  const resetFilters = () => {
    setCategory('all');
    setSource('all');
    setSearch('');
    setHighSignalOnly(false);
    setPage(1);
  };

  return {
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
    /** 같은 목록 키 다시 읽기 실패 신호. 실패마다 `id` 가 바뀐다. 목록은 유지된다. */
    reloadError,
    stats,
    briefing,
    techRadar,
    loadingRadar,
    loadNews,
    loadStatsAndBriefing,
    resetFilters,
  };
}
