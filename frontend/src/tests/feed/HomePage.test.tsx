import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { http, HttpResponse, delay } from 'msw';
import { server } from '@/mocks/server';
import { mockNewsItems } from '@/mocks/handlers';
import HomePage from '@/app/page';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastRegion } from '@/components/ui/Toast';

/**
 * 피드 첫 화면의 UI 5대 상태 (리뷰 FE-30), 북마크 저장값 손상 (FE-17, QA D-45),
 * 대화상자 지연 로딩 (FE-11), 오류 문구에 고정 포트를 쓰지 않음 (FE-25).
 * 레이아웃과 같은 공급자(ThemeProvider, ToastRegion)로 감싸 홈 페이지를 그대로 그린다.
 */

function renderHome() {
  return render(
    <ThemeProvider>
      <HomePage />
      <ToastRegion />
    </ThemeProvider>
  );
}

function listResponse(items: typeof mockNewsItems) {
  return { items, total: items.length, page: 1, size: 18, total_pages: 1 };
}

beforeEach(() => {
  localStorage.clear();
  // 기본 MSW 핸들러에 없는 홈 요청(트렌드 레이더, 헤더의 수집 스케줄)을 여기서 흉내 낸다.
  // 없으면 요청이 실제 localhost:3000(띄워 둔 개발 서버)으로 나가 응답 시간이 실행마다 달라졌다 (간헐 실패의 원인).
  server.use(
    http.get('*/api/trends/radar', () =>
      HttpResponse.json({ updated_at: '2026-11-10T00:00:00Z', total_analyzed: 0, surging_tags: [], categories: [], tags: [] })
    ),
    http.get('*/api/schedule/status', () =>
      HttpResponse.json({
        current_time: '2026-11-10T00:00:00+00:00',
        schedule_hours: [0, 6, 12, 18],
        timezone: 'UTC',
        next_run: '2026-11-10T06:00:00+00:00',
        minutes_until_next_run: 360,
        is_running: false,
        last_crawl_time: null,
        last_crawl_status: 'idle',
        recent_logs: [],
      })
    )
  );
});

afterEach(() => {
  localStorage.clear();
});

describe('홈 피드 첫 화면 — UI 5대 상태 (FE-30)', () => {
  it('Loading: 목록 응답 전에는 불러오는 중 안내와 스켈레톤을 보이고, 응답 뒤 카드를 그린다 (Success)', async () => {
    server.use(
      http.get('*/api/news', async () => {
        await delay(80);
        return HttpResponse.json(listResponse(mockNewsItems.slice(0, 2)));
      })
    );
    renderHome();

    expect(screen.getByText('소식을 불러오는 중...')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: mockNewsItems[0].title })).toBeInTheDocument();
    expect(screen.queryByText('소식을 불러오는 중...')).not.toBeInTheDocument();
  });

  it('Error: 목록 요청이 실패하면 오류 안내와 다시 시도를 보이고, 문구에 고정 포트를 쓰지 않는다', async () => {
    let fail = true;
    server.use(
      http.get('*/api/news', () =>
        fail
          ? HttpResponse.json({ error_code: 'INTERNAL_ERROR', message: '서버 오류', details: null }, { status: 500 })
          : HttpResponse.json(listResponse(mockNewsItems.slice(0, 1)))
      )
    );
    renderHome();

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('백엔드 서버 연결 상태를 확인해주세요.')).toBeInTheDocument();
    expect(alert).not.toHaveTextContent('8000');

    fail = false;
    fireEvent.click(within(alert).getByRole('button', { name: '다시 시도' }));
    expect(await screen.findByRole('button', { name: mockNewsItems[0].title })).toBeInTheDocument();
  });

  it('Empty: 결과가 없으면 빈 상태 안내와 필터 전체 초기화 버튼을 보인다', async () => {
    server.use(http.get('*/api/news', () => HttpResponse.json(listResponse([]))));
    renderHome();

    expect(await screen.findByText('조건에 일치하는 소식이 없습니다')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '필터 전체 초기화' })).toBeInTheDocument();
  });
});

describe('북마크 저장값이 손상돼도 홈이 그려진다 (FE-17, D-45)', () => {
  it.each([
    ['객체', '{"a":1}'],
    ['null', 'null'],
    ['깨진 JSON', '{not json'],
  ])('agentlens_bookmarks 가 %s 이면 북마크 0개로 보고 피드를 그린다', async (_label, raw) => {
    localStorage.setItem('agentlens_bookmarks', raw);
    server.use(http.get('*/api/news', () => HttpResponse.json(listResponse(mockNewsItems.slice(0, 1)))));
    renderHome();

    expect(await screen.findByRole('button', { name: mockNewsItems[0].title })).toBeInTheDocument();
  });
});

describe('홈 대화상자 지연 로딩 (FE-11)', () => {
  it('처음에 닫혀 있는 대화상자 6개를 정적으로 import 하지 않는다', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/page.tsx'), 'utf8');
    for (const name of [
      'NewsDetailModal',
      'DailyBriefingModal',
      'ScheduleModal',
      'McpModal',
      'SourcesModal',
      'BriefingSettingsModal',
    ]) {
      expect(source).not.toMatch(new RegExp(`^import[^\\n]*\\b${name}\\b[^\\n]*from`, 'm'));
    }
  });

  it('카드 제목을 누르면 기사 상세 대화상자가 열린다', async () => {
    server.use(http.get('*/api/news', () => HttpResponse.json(listResponse(mockNewsItems.slice(0, 1)))));
    renderHome();

    fireEvent.click(await screen.findByRole('button', { name: mockNewsItems[0].title }));
    expect(await screen.findByRole('dialog', { name: mockNewsItems[0].title })).toBeInTheDocument();
  });
});

describe('홈 — 일일 브리핑 요청 실패 (FE-30)', () => {
  it('브리핑 요청이 실패해도 피드는 그리고, 열 수 없는 브리핑 버튼을 보이지 않는다', async () => {
    server.use(
      http.get('*/api/news', () => HttpResponse.json(listResponse(mockNewsItems.slice(0, 1)))),
      http.get('*/api/briefing/today', () =>
        HttpResponse.json({ error_code: 'INTERNAL_ERROR', message: '서버 오류', details: null }, { status: 500 })
      )
    );
    renderHome();
    expect(await screen.findByRole('button', { name: mockNewsItems[0].title })).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByRole('button', { name: /오늘의 브리핑/ })).not.toBeInTheDocument();
  });

  it('브리핑을 받으면 오늘의 브리핑 버튼으로 대화상자를 연다 (Success)', async () => {
    server.use(http.get('*/api/news', () => HttpResponse.json(listResponse(mockNewsItems.slice(0, 1)))));
    renderHome();
    fireEvent.click(await screen.findByRole('button', { name: /오늘의 브리핑/ }));
    expect(await screen.findByRole('dialog', { name: /오늘의 AI 브리핑/ })).toBeInTheDocument();
  });
});

