'use client';

import { useState, useEffect } from 'react';
import { NewsItem } from '@/types/news';

const BOOKMARKS_STORAGE_KEY = 'agentlens_bookmarks';

export function useBookmarks() {
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([]);
  const [bookmarkedItems, setBookmarkedItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (saved) {
        const parsed: NewsItem[] = JSON.parse(saved);
        setBookmarkedItems(parsed);
        setBookmarkedIds(parsed.map((i) => i.id));
      }
    } catch (e) {
      console.error('Failed to parse bookmarks from localStorage', e);
    }
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
    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save bookmarks to localStorage', e);
    }
  };

  return {
    bookmarkedIds,
    bookmarkedItems,
    toggleBookmark,
  };
}
