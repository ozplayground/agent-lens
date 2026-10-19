import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkflowStepTracker from '@/components/chat/WorkflowStepTracker';
import { ChatStatusPayload } from '@/types/chat';

describe('WorkflowStepTracker Component', () => {
  const mockStatusExtracting: ChatStatusPayload = {
    step: 'extracting_source',
    label: '🌐 원본 소스 본문 추출 중 (Trafilatura)...',
    timestamp: '2026-09-16T18:00:00Z',
    progress: 20,
  };

  const mockStatusEvaluating: ChatStatusPayload = {
    step: 'evaluating_sufficiency',
    label: '⚖️ 정보 충실도 분석 중...',
    timestamp: '2026-09-16T18:00:01Z',
    progress: 45,
  };

  const mockStatusSearching: ChatStatusPayload = {
    step: 'agentic_searching',
    label: '🔍 보충 기술 문서 검색 중: "Model Context Protocol"',
    timestamp: '2026-09-16T18:00:02Z',
    progress: 65,
    query: 'Model Context Protocol',
    sources_found: 2,
  };

  const mockStatusSynthesizing: ChatStatusPayload = {
    step: 'synthesizing',
    label: '📝 심층 분석 리포트 작성 중...',
    timestamp: '2026-09-16T18:00:03Z',
    progress: 85,
  };

  const mockHistory: ChatStatusPayload[] = [
    mockStatusExtracting,
    mockStatusEvaluating,
    mockStatusSearching,
    mockStatusSynthesizing,
  ];

  it('renders real-time step animation, label, and progress during streaming', () => {
    render(
      <WorkflowStepTracker
        currentStatus={mockStatusExtracting}
        stepHistory={[mockStatusExtracting]}
        isStreaming={true}
        isDone={false}
      />
    );

    expect(screen.getByText(/원본 소스 본문 추출 중/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '20');
  });

  it('renders evaluating_sufficiency, agentic_searching and synthesizing step states accurately', () => {
    const { rerender } = render(
      <WorkflowStepTracker
        currentStatus={mockStatusEvaluating}
        stepHistory={[mockStatusExtracting, mockStatusEvaluating]}
        isStreaming={true}
        isDone={false}
      />
    );
    expect(screen.getByText(/정보 충실도 분석 중/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '45');

    rerender(
      <WorkflowStepTracker
        currentStatus={mockStatusSearching}
        stepHistory={[mockStatusExtracting, mockStatusEvaluating, mockStatusSearching]}
        isStreaming={true}
        isDone={false}
      />
    );
    expect(screen.getByText(/보충 기술 문서 검색 중/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '65');

    rerender(
      <WorkflowStepTracker
        currentStatus={mockStatusSynthesizing}
        stepHistory={mockHistory}
        isStreaming={true}
        isDone={false}
      />
    );
    expect(screen.getByText(/심층 분석 리포트 작성 중/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '85');
  });

  it('automatically collapses into a 28px slim accordion when isDone is true', () => {
    render(
      <WorkflowStepTracker
        currentStatus={null}
        stepHistory={mockHistory}
        isStreaming={false}
        isDone={true}
      />
    );

    // Slim accordion header button
    const accordionBtn = screen.getByRole('button', { name: /심층 분석 과정.*단계 완료/i });
    expect(accordionBtn).toBeInTheDocument();
    expect(accordionBtn).toHaveAttribute('aria-expanded', 'false');

    // Details are initially collapsed
    expect(screen.queryByTestId('workflow-history-details')).not.toBeInTheDocument();
  });

  it('toggles accordion details on click/tap', () => {
    render(
      <WorkflowStepTracker
        currentStatus={null}
        stepHistory={mockHistory}
        isStreaming={false}
        isDone={true}
      />
    );

    const accordionBtn = screen.getByRole('button', { name: /심층 분석 과정.*단계 완료/i });
    fireEvent.click(accordionBtn);

    expect(accordionBtn).toHaveAttribute('aria-expanded', 'true');
    const details = screen.getByTestId('workflow-history-details');
    expect(details).toBeInTheDocument();
    expect(screen.getAllByText(/Model Context Protocol/i).length).toBeGreaterThan(0);

    // Click again to close
    fireEvent.click(accordionBtn);
    expect(accordionBtn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('workflow-history-details')).not.toBeInTheDocument();
  });

  it('does not render when stepHistory is empty and currentStatus is null', () => {
    const { container } = render(
      <WorkflowStepTracker
        currentStatus={null}
        stepHistory={[]}
        isStreaming={false}
        isDone={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
