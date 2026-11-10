import React, { useRef } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { mockNewsItems } from '@/mocks/handlers';
import { useNewsFeed, SEARCH_DEBOUNCE_MS } from '@/hooks/useNewsFeed';
import FeedToolbar from '@/components/feed/FeedToolbar';

/**
 * 피드 검색어 입력 (docs/frontend-code-reviewer/01_CODE_REVIEW_REPORT.md FE-09).
 * 검색어가 바뀌면 1페이지부터 보이고, 입력이 멈춘 뒤 한 번만 요청한다.
 */

/** 홈 화면과 같은 연결: useNewsFeed 의 값·setter 를 FeedToolbar 에 넘기고 목록 제목을 그린다 */
function SearchHarness() {
  const feed = useNewsFeed({ bookmarkedItems: [] });
  const searchInputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <FeedToolbar
        category={feed.category}
        source={feed.source}
        search={feed.search}
        highSignalOnly={feed.highSignalOnly}
        bookmarkCount={0}
        onCategoryChange={feed.setCategory}
        onSourceChange={feed.setSource}
        onHighSignalChange={feed.setHighSignalOnly}
        onSearchChange={feed.setSearch}
        onSearchSubmit={feed.loadNews}
        onPageChange={feed.setPage}
        searchInputRef={searchInputRef}
      />
      <button type="button" onClick={() => feed.setPage(3)}>
        3페이지
      </button>
      <p>현재 {feed.page}페이지</p>
      <ul aria-label="소식 목록">
        {feed.news.map((item) => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </div>
  );
}

/** 요청 쿼리를 모으고, mcp 검색 1페이지에만 결과 한 건을 준다 */
function captureNewsRequests() {
  const requests: URLSearchParams[] = [];
  server.use(
    http.get('*/api/news', ({ request }) => {
      const params = new URL(request.url).searchParams;
      requests.push(params);
      const hit = params.get('search') === 'mcp' && params.get('page') === '1';
      const items = hit ? [{ ...mockNewsItems[0], id: 9001, title: 'MCP 검색 결과 기사' }] : [];
      return HttpResponse.json({ items, total: items.length, page: Number(params.get('page')), size: 18, total_pages: 1 });
    })
  );
  return requests;
}

describe('피드 검색어 입력 (FE-09)', () => {
  it('3페이지에서 검색어를 입력하면 1페이지 결과를 보이고, 입력이 멈춘 뒤 한 번만 요청한다', async () => {
    const requests = captureNewsRequests();
    render(<SearchHarness />);
    await waitFor(() => expect(requests).toHaveLength(1));

    fireEvent.click(screen.getByRole('button', { name: '3페이지' }));
    await waitFor(() => expect(requests).toHaveLength(2));
    expect(requests[1].get('page')).toBe('3');

    const input = screen.getByRole('searchbox', { name: '키워드 검색' });
    fireEvent.change(input, { target: { value: 'm' } });
    fireEvent.change(input, { target: { value: 'mc' } });
    fireEvent.change(input, { target: { value: 'mcp' } });
    expect(input).toHaveValue('mcp');

    expect(await screen.findByText('MCP 검색 결과 기사')).toBeInTheDocument();
    expect(screen.getByText('현재 1페이지')).toBeInTheDocument();

    const afterTyping = requests.slice(2).map((p) => [p.get('search'), p.get('page')]);
    expect(afterTyping).toEqual([['mcp', '1']]);
  });

  it('검색어 대기 중(300ms 안)에 페이지를 바꾸면 검색어를 먼저 반영하고 고른 페이지로 한 번만 요청한다 (FE-35)', async () => {
    const requests = captureNewsRequests();
    render(<SearchHarness />);
    await waitFor(() => expect(requests).toHaveLength(1));

    fireEvent.change(screen.getByRole('searchbox', { name: '키워드 검색' }), { target: { value: 'mcp' } });
    fireEvent.click(screen.getByRole('button', { name: '3페이지' }));

    await waitFor(() => expect(requests).toHaveLength(2));
    // 디바운스 시간이 지나도 1페이지로 되돌리는 요청이 더 나가지 않는다.
    await new Promise((resolve) => setTimeout(resolve, SEARCH_DEBOUNCE_MS + 100));
    expect(requests.slice(1).map((p) => [p.get('search'), p.get('page')])).toEqual([['mcp', '3']]);
    expect(screen.getByText('현재 3페이지')).toBeInTheDocument();
  });

  it('검색어 대기 중에 필터를 바꾸면 새 검색어와 새 필터로 한 번만 요청한다 (FE-35)', async () => {
    const requests = captureNewsRequests();
    render(<SearchHarness />);
    await waitFor(() => expect(requests).toHaveLength(1));

    fireEvent.change(screen.getByRole('searchbox', { name: '키워드 검색' }), { target: { value: 'mcp' } });
    fireEvent.click(screen.getByRole('button', { name: /Must-Read/ }));

    await waitFor(() => expect(requests).toHaveLength(2));
    await new Promise((resolve) => setTimeout(resolve, SEARCH_DEBOUNCE_MS + 100));
    expect(requests.slice(1).map((p) => [p.get('search'), p.get('high_signal_only'), p.get('page')])).toEqual([
      ['mcp', 'true', '1'],
    ]);
  });

  it('입력 직후 Enter 를 누르면 기다리지 않고 그 검색어로 요청한다', async () => {
    const requests = captureNewsRequests();
    render(<SearchHarness />);
    await waitFor(() => expect(requests).toHaveLength(1));

    const input = screen.getByRole('searchbox', { name: '키워드 검색' });
    fireEvent.change(input, { target: { value: 'mcp' } });
    fireEvent.submit(screen.getByRole('search'));

    expect(await screen.findByText('MCP 검색 결과 기사')).toBeInTheDocument();
    const afterTyping = requests.slice(1).map((p) => [p.get('search'), p.get('page')]);
    expect(afterTyping).toEqual([['mcp', '1']]);
  });
});
