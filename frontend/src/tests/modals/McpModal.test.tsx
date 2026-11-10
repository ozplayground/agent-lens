import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import McpModal from '@/components/McpModal';

/** MCP 연동 대화상자 (리뷰 FE-25): 설정 예시의 자리표시를 그대로 쓰지 않도록 바꿀 값을 알린다. */
describe('McpModal', () => {
  it('설정 예시의 cwd·command 를 자기 환경 값으로 바꾸라고 안내한다', () => {
    render(<McpModal isOpen onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: 'AgentLens MCP 연동' });
    expect(within(dialog).getByText(/\/path\/to\/agentlens\/backend/)).toBeInTheDocument();
    expect(within(dialog).getByText(/backend 폴더의 절대 경로로 바꿉니다/)).toBeInTheDocument();
  });
});
