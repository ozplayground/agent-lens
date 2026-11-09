'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { NewsItem } from '@/types/news';

const BOOKMARKS_STORAGE_KEY = 'agentlens_bookmarks';

// localStorage 의 `agentlens_bookmarks` 를 외부 저장소로 두고 useSyncExternalStore 로 읽는다.
// 서버 렌더와 하이드레이션 중에는 null(북마크 없음)을 쓰고, 이후 클라이언트 값으로 바뀐다.
const listeners = new Set<() => void>();
// localStorage 쓰기가 실패했을 때 이 탭에서만 쓰는 값 (이전 동작: 저장 실패해도 화면 상태는 바뀐다).
let unsavedRaw: string | null = null;

function emitChange() {
  listeners.forEach((listener) => listener());
}

function handleStorage(e: StorageEvent) {
  if (e.key === null || e.key === BOOKMARKS_STORAGE_KEY) emitChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener('storage', handleStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('storage', handleStorage);
  };
}

function getSnapshot(): string | null {
  if (unsavedRaw !== null) return unsavedRaw;
  try {
    return localStorage.getItem(BOOKMARKS_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerSnapshot(): string | null {
  return null;
}

function parseBookmarks(raw: string | null): NewsItem[] {
  if (!raw) return [];
  try {
    const parsed: NewsItem[] = JSON.parse(raw);
    return parsed;
  } catch (e) {
    console.error('Failed to parse bookmarks from localStorage', e);
    return [];
  }
}

function saveBookmarks(items: NewsItem[]) {
  const raw = JSON.stringify(items);
  try {
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, raw);
    unsavedRaw = null;
  } catch (e) {
    console.error('Failed to save bookmarks to localStorage', e);
    unsavedRaw = raw;
  }
  emitChange();
}

export function useBookmarks() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const bookmarkedItems = useMemo(() => parseBookmarks(raw), [raw]);
  const bookmarkedIds = useMemo(() => bookmarkedItems.map((i) => i.id), [bookmarkedItems]);

  const toggleBookmark = (item: NewsItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated: NewsItem[];
    if (bookmarkedIds.includes(item.id)) {
      updated = bookmarkedItems.filter((i) => i.id !== item.id);
    } else {
      updated = [item, ...bookmarkedItems];
    }
    saveBookmarks(updated);
  };

  return {
    bookmarkedIds,
    bookmarkedItems,
    toggleBookmark,
  };
}
