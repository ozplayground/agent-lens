import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import DailyBriefingModal from '@/components/DailyBriefingModal';
import { fetchDailyBriefing } from '@/lib/api';

/** 일일 브리핑 대화상자 — `이메일 발송` 의 `aria-controls` 는 주소 입력 줄이 열렸을 때만 단다 (R24, C-1). */
describe('DailyBriefingModal email form aria-controls', () => {
  it('points 이메일 발송 at the email form only while the form is open', async () => {
    // MSW 의 기존 브리핑 응답 (GET /api/briefing/today)
    const briefing = await fetchDailyBriefing();
    render(<DailyBriefingModal briefing={briefing} isOpen onClose={vi.fn()} />);

    const dialog = screen.getByRole('dialog');
    const emailButton = within(dialog).getByRole('button', { name: '이메일 발송' });
    expect(emailButton).toHaveAttribute('aria-expanded', 'false');
    expect(emailButton).not.toHaveAttribute('aria-controls');

    fireEvent.click(emailButton);
    expect(emailButton).toHaveAttribute('aria-expanded', 'true');
    const controls = emailButton.getAttribute('aria-controls');
    expect(controls).toBeTruthy();
    expect(document.getElementById(controls!)).toBeInTheDocument();

    fireEvent.click(emailButton);
    expect(emailButton).toHaveAttribute('aria-expanded', 'false');
    expect(emailButton).not.toHaveAttribute('aria-controls');
  });
});

/**
 * 일일 브리핑 대화상자 — 설정 진입 한 곳, 헤드라인 한 번 (R46), 분야 머리글은 긴 라벨·lucide 아이콘 (R47),
 * 시사점 줄은 그림 문자 대신 아이콘 (R44). MSW 의 기존 브리핑 응답을 쓴다.
 */
describe('DailyBriefingModal settings, headline and category headers (R44, R46, R47)', () => {
  async function renderBriefing(overrides: Partial<Awaited<ReturnType<typeof fetchDailyBriefing>>> = {}) {
    const briefing = { ...(await fetchDailyBriefing()), ...overrides };
    const onOpenSettings = vi.fn();
    render(<DailyBriefingModal briefing={briefing} isOpen onClose={vi.fn()} onOpenSettings={onOpenSettings} />);
    const dialog = screen.getByRole('dialog');
    return { briefing, dialog, onOpenSettings };
  }

  it('has exactly one 연동 설정 button and no 연동 설정 item in the 브리핑 작업 menu', async () => {
    const { dialog, onOpenSettings } = await renderBriefing();
    const settingsButtons = within(dialog).getAllByRole('button', { name: /연동 설정/ });
    expect(settingsButtons).toHaveLength(1);
    fireEvent.click(settingsButtons[0]);
    expect(onOpenSettings).toHaveBeenCalledTimes(1);

    fireEvent.click(within(dialog).getByRole('button', { name: '브리핑 작업' }));
    const menu = screen.getByRole('menu');
    expect(within(menu).getAllByRole('menuitem').length).toBeGreaterThan(0);
    expect(within(menu).queryByRole('menuitem', { name: /연동 설정/ })).not.toBeInTheDocument();
  });

  it('shows the headline exactly once', async () => {
    const { briefing } = await renderBriefing();
    expect(screen.getAllByText(briefing.headline)).toHaveLength(1);
  });

  it('labels category headers with the long category labels and lucide icons instead of backend names and emoji', async () => {
    const { dialog } = await renderBriefing();
    const panel = within(dialog).getByRole('tabpanel');

    const mcp = within(panel).getByRole('heading', { level: 3, name: 'MCP & 생태계' });
    const agent = within(panel).getByRole('heading', { level: 3, name: '에이전트 아키텍처' });
    expect(within(panel).queryByText('MCP & 플러그인 생태계')).not.toBeInTheDocument();
    for (const heading of [mcp, agent]) {
      expect(heading.querySelector('svg')).not.toBeNull();
      expect(heading.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });

  it('replaces backend category names in overview lines with the long labels', async () => {
    // MSW 브리핑은 v0.4.2 backend 처럼 분야 이름이 이미 긴 라벨이다. 다른 이름을 보내는 backend 를 흉내 내려고 분야를 직접 준다
    const { dialog } = await renderBriefing({
      overview: '• **MCP & 플러그인 생태계**: FastMCP 릴리즈\n• **모르는 분야**: 그대로 둔다',
      categories: [
        { id: 'mcp_plugins_skills', name: 'MCP & 플러그인 생태계', icon: 'mcp_plugins_skills', summary: 'FastMCP 릴리즈', items: [] },
      ],
    });
    const panel = within(dialog).getByRole('tabpanel');
    expect(within(panel).getByText('MCP & 생태계:')).toBeInTheDocument();
    expect(within(panel).getByText('모르는 분야:')).toBeInTheDocument();
    expect(within(panel).queryByText('MCP & 플러그인 생태계:')).not.toBeInTheDocument();
  });

  it('marks the 시사점 line with an aria-hidden svg icon and the plain 시사점: text', async () => {
    const { dialog } = await renderBriefing();
    const panel = within(dialog).getByRole('tabpanel');
    const labels = within(panel).getAllByText(/시사점:/);
    expect(labels.length).toBeGreaterThan(0);
    for (const label of labels) {
      expect(label).toHaveTextContent(/^시사점:$/);
      expect(label.closest('p')!.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    }
  });
});

/** UI 5대 상태 (리뷰 FE-30 남은 부분): 브리핑이 없거나 요청이 실패했을 때. */
describe('DailyBriefingModal — 브리핑 없음', () => {
  it('Empty·Error: 브리핑이 없으면(null) 대화상자를 그리지 않는다', () => {
    render(<DailyBriefingModal briefing={null} isOpen onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
