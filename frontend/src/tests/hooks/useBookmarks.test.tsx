import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBookmarks } from '@/hooks/useBookmarks';
import { mockNewsItems } from '@/mocks/handlers';

/**
 * 북마크 저장값 검증 (리뷰 FE-17, QA D-45).
 * `agentlens_bookmarks` 가 배열이 아니거나 원소 모양이 다르면 화면이 죽지 않고 그 값을 버린다.
 */

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe('useBookmarks 저장값 검증 (FE-17)', () => {
  it.each([
    ['객체', '{"a":1}'],
    ['null', 'null'],
    ['숫자', '42'],
    ['문자열', '"bookmarks"'],
    ['깨진 JSON', '[{'],
  ])('배열이 아닌 값(%s)이면 북마크 0개로 본다', (_label, raw) => {
    localStorage.setItem('agentlens_bookmarks', raw);
    const { result } = renderHook(() => useBookmarks());
    expect(result.current.bookmarkedItems).toEqual([]);
    expect(result.current.bookmarkedIds).toEqual([]);
  });

  it('배열 안에서 id(숫자)·title(문자열)이 없는 원소는 버리고 나머지는 지킨다', () => {
    const good = mockNewsItems[0];
    localStorage.setItem('agentlens_bookmarks', JSON.stringify([good, null, 7, { id: 'x', title: 'bad' }, { title: 'no id' }]));
    const { result } = renderHook(() => useBookmarks());
    expect(result.current.bookmarkedIds).toEqual([good.id]);
  });
});
