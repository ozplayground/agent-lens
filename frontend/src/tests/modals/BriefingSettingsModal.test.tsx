import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { BriefingSettingsModal } from '@/components/BriefingSettingsModal';
import type { BriefingSettings } from '@/types/news';

const settings: BriefingSettings = {
  title: 'AgentLens 일일 브리핑',
  auto_dispatch_hour: 8,
  notion: {
    enabled: true,
    has_api_key: true,
    masked_api_key: 'secret_***',
    page_id: 'abcdef1234567890abcdef1234567890',
    auto_export: false,
  },
  email: {
    enabled: false,
    smtp_host: 'smtp.example.com',
    smtp_port: 587,
    smtp_user: 'bot@example.com',
    has_password: false,
    smtp_from: 'AgentLens <bot@example.com>',
    smtp_to: 'team@example.com',
    use_tls: true,
    auto_send: false,
  },
  webhooks: {
    slack_webhook_url: 'https://hooks.slack.com/services/T000/B000/XXX',
    discord_webhook_url: '',
    auto_dispatch_daily_briefing: false,
  },
};

beforeEach(() => {
  server.use(http.get('*/api/briefing/settings', () => HttpResponse.json(settings)));
});

function renderModal(onClose = vi.fn()) {
  render(<BriefingSettingsModal isOpen onClose={onClose} />);
  return { onClose };
}

describe('BriefingSettingsModal', () => {
  it('is a modal dialog with a linked title', async () => {
    renderModal();
    const dialog = screen.getByRole('dialog', { name: '공유 & 알림 설정' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(await within(dialog).findByLabelText('Notion 부모 페이지 ID 또는 전체 URL')).toHaveValue(
      settings.notion.page_id
    );
  });

  it('has three tabs and switches panels', async () => {
    renderModal();
    const tablist = screen.getByRole('tablist');
    const tabs = within(tablist).getAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual(['Notion 연동', '이메일 (SMTP)', '웹훅 (Slack/Discord)']);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

    await screen.findByLabelText('Notion API 시크릿 토큰');

    fireEvent.click(tabs[1]);
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', tabs[1].id);
    expect(screen.getByLabelText('SMTP 서버 호스트')).toHaveValue('smtp.example.com');
    expect(screen.getByLabelText('포트')).toHaveValue(587);
    expect(screen.getByLabelText('SMTP 계정 (아이디/이메일)')).toBeInTheDocument();
    expect(screen.getByLabelText('SMTP 비밀번호 (또는 앱 비밀번호)')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('발신자 주소 (From)')).toBeInTheDocument();
    expect(screen.getByLabelText('기본 수신자 목록 (To)')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'STARTTLS 암호화 사용' })).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(tabs[2]);
    expect(screen.getByLabelText('Slack / Discord 웹훅 URL')).toHaveValue(settings.webhooks.slack_webhook_url);
  });

  it('toggles secret visibility with an icon button', async () => {
    renderModal();
    const token = await screen.findByLabelText('Notion API 시크릿 토큰');
    expect(token).toHaveAttribute('type', 'password');

    const show = screen.getByRole('button', { name: '토큰 보기' });
    expect(show).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(show);
    expect(token).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: '토큰 숨기기' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('has footer actions 연결 테스트 / 저장 / 닫기', async () => {
    const { onClose } = renderModal();
    await screen.findByLabelText('Notion API 시크릿 토큰');
    expect(screen.getByRole('button', { name: '연결 테스트' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
    const closeButtons = screen.getAllByRole('button', { name: '닫기' });
    expect(closeButtons).toHaveLength(2); // 머리줄 X + 바닥 닫기
    fireEvent.click(closeButtons[1]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows the save result in an inline alert', async () => {
    server.use(
      http.post('*/api/briefing/settings', () => HttpResponse.json({ success: true, message: '저장 완료' }))
    );
    renderModal();
    await screen.findByLabelText('Notion API 시크릿 토큰');
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByRole('status')).toHaveTextContent('저장 완료');
  });

  it('does not close on a backdrop click but closes on Escape', async () => {
    const { onClose } = renderModal();
    await screen.findByLabelText('Notion API 시크릿 토큰');
    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.previousElementSibling as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when closed', () => {
    render(<BriefingSettingsModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
