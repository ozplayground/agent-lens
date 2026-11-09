import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { mockDailyBriefing, mockNewsItems } from '@/mocks/handlers';
import { useNewsFeed } from '@/hooks/useNewsFeed';
import type { NewsItem } from '@/types/news';
import type { TechRadarData } from '@/types/trends';

/**
 * spec 14.5 · R22: 같은 목록 키를 다시 읽는 동안 이전 목록·요약 바를 유지한다.
 * 목록 키 = category, source, search, sort, highSignalOnly, page. 다시 읽기 번호는 키가 아니다.
 */

const NO_BOOKMARKS: NewsItem[] = [];

const radar: TechRadarData = {
  updated_at: '2026-11-06T00:00:00Z',
  total_analyzed: 42,
  surging_tags: [{ name: 'MCP', count: 9, category: 'Protocols & Tooling', recent_count: 5, velocity: '+80%' }],
  categories: [{ name: 'Protocols & Tooling', count: 20, percentage: 48 }],
  tags: [{ name: 'MCP', count: 9, category: 'Protocols & Tooling', recent_count: 5, velocity: '+80%' }],
};

/** 손으로 풀어 주는 약속. 응답을 붙잡아 '다시 읽는 중' 상태를 관찰한다. */
function deferred() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

function listResponse(items: NewsItem[]) {
  return { items, total: items.length, page: 1, size: 18, total_pages: 1 };
}

function ids(items: NewsItem[]) {
  return items.map((i) => i.id);
}

async function renderLoaded() {
  const hook = renderHook(() => useNewsFeed({ bookmarkedItems: NO_BOOKMARKS }));
  await waitFor(() => {
    expect(hook.result.current.loading).toBe(false);
    expect(hook.result.current.loadingRadar).toBe(false);
  });
  expect(hook.result.current.news.length).toBeGreaterThan(0);
  return hook;
}

describe('useNewsFeed — 다시 읽기 (R22)', () => {
  beforeEach(() => {
    // 기본 목 핸들러에 레이더가 없다. mocks/** 는 고치지 않고 여기서만 더한다.
    server.use(http.get('*/api/trends/radar', () => HttpResponse.json(radar)));
  });

  it('(a) keeps the previous items without loading while the same list key is re-read', async () => {
    const { result } = await renderLoaded();
    const before = ids(result.current.news);
    const beforeTotal = result.current.total;

    const gate = deferred();
    const reloaded = [...mockNewsItems].slice(0, 2);
    server.use(
      http.get('*/api/news', async () => {
        await gate.promise;
        return HttpResponse.json(listResponse(reloaded));
      })
    );

    act(() => {
      result.current.loadNews();
    });

    expect(result.current.loading).toBe(false);
    expect(ids(result.current.news)).toEqual(before);
    expect(result.current.total).toBe(beforeTotal);
    expect(result.current.error).toBeNull();

    gate.release();
    await waitFor(() => expect(ids(result.current.news)).toEqual(ids(reloaded)));
    expect(result.current.loading).toBe(false);
  });

  it('(b) applies briefing and radar even when the stats request fails', async () => {
    server.use(http.get('*/api/stats', () => HttpResponse.json({ message: 'boom' }, { status: 500 })));
    const { result } = renderHook(() => useNewsFeed({ bookmarkedItems: NO_BOOKMARKS }));

    await waitFor(() => {
      expect(result.current.briefing).not.toBeNull();
      expect(result.current.techRadar).not.toBeNull();
    });
    expect(result.current.briefing?.headline).toBe(mockDailyBriefing.headline);
    expect(result.current.techRadar?.total_analyzed).toBe(42);
    expect(result.current.stats).toBeNull();
    await waitFor(() => expect(result.current.loadingRadar).toBe(false));
  });

  it('(c) keeps loadingRadar false and the previous briefing while stats are re-read', async () => {
    const { result } = await renderLoaded();
    const briefingBefore = result.current.briefing;
    expect(briefingBefore).not.toBeNull();

    const gate = deferred();
    server.use(
      http.get('*/api/briefing/today', async () => {
        await gate.promise;
        return HttpResponse.json(mockDailyBriefing);
      })
    );

    act(() => {
      result.current.loadStatsAndBriefing();
    });

    expect(result.current.loadingRadar).toBe(false);
    expect(result.current.briefing).toBe(briefingBefore);
    expect(result.current.techRadar).not.toBeNull();

    gate.release();
    await waitFor(() => expect(result.current.briefing).not.toBe(briefingBefore));
    expect(result.current.loadingRadar).toBe(false);
  });

  // (d) 회귀 방지: 지금 코드에서도 통과할 수 있다 (실패 예상 아님).
  it('(d) shows loading again when the list key changes', async () => {
    const { result } = await renderLoaded();

    act(() => {
      result.current.setCategory('harness');
    });
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.news.every((i) => i.category === 'harness')).toBe(true);
  });

  it('(e) a failed re-read keeps the list and returns a reload failure signal instead of an error', async () => {
    const { result } = await renderLoaded();
    const before = ids(result.current.news);
    expect(result.current.reloadError).toBeNull();

    server.use(http.get('*/api/news', () => HttpResponse.json({ message: 'boom' }, { status: 500 })));
    act(() => {
      result.current.loadNews();
    });

    await waitFor(() => expect(result.current.reloadError).not.toBeNull());
    expect(result.current.reloadError?.message).toMatch(/500/);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(ids(result.current.news)).toEqual(before);

    // 두 번째 실패는 새 신호(다른 id)다.
    const firstId = result.current.reloadError!.id;
    act(() => {
      result.current.loadNews();
    });
    await waitFor(() => expect(result.current.reloadError?.id).not.toBe(firstId));
    expect(ids(result.current.news)).toEqual(before);
  });

  it('(e) a failed request for a changed list key is still an error (ErrorState)', async () => {
    const { result } = await renderLoaded();

    server.use(http.get('*/api/news', () => HttpResponse.json({ message: 'boom' }, { status: 500 })));
    act(() => {
      result.current.setCategory('harness');
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.loading).toBe(false);
    expect(result.current.reloadError).toBeNull();
  });
});
