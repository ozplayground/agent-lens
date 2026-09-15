'use client';

import { useState, useEffect, useCallback } from 'react';
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

  const [news, setNews] = useState<NewsItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [techRadar, setTechRadar] = useState<TechRadarData | null>(null);
  const [loadingRadar, setLoadingRadar] = useState<boolean>(true);

  const loadStatsAndBriefing = useCallback(async () => {
    try {
      setLoadingRadar(true);
      const [s, b, r] = await Promise.all([
        fetchStats(),
        fetchDailyBriefing().catch(() => null),
        fetchTechRadar().catch(() => null),
      ]);
      setStats(s);
      if (b) setBriefing(b);
      if (r) setTechRadar(r);
    } catch (e) {
      console.error('Failed to load stats and briefing', e);
    } finally {
      setLoadingRadar(false);
    }
  }, []);

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
        filtered = filtered.filter(
          (i) => i.title.toLowerCase().includes(term) || i.summary.toLowerCase().includes(term)
        );
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
        size: 18,
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
  }, [loadStatsAndBriefing]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

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
    stats,
    briefing,
    techRadar,
    loadingRadar,
    loadNews,
    loadStatsAndBriefing,
    resetFilters,
  };
}
