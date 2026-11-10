import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkflowStepTracker from '@/components/chat/WorkflowStepTracker';
import { ChatStatusPayload } from '@/types/chat';

describe('WorkflowStepTracker Component', () => {
  // backend 스트림이 보내는 4단계·라벨 (v0.4.2: 이모지 없음, 계약 3.1절)
  const mockStatusExtracting: ChatStatusPayload = {
    step: 'extracting_source',
    label: '지정된 단일 뉴스 기사 컨텍스트 로드 중...',
    timestamp: '2026-09-16T18:00:00+00:00',
    progress: 30,
  };

  const mockStatusThinking: ChatStatusPayload = {
    step: 'thinking',
    label: 'ReAct 추론: 질문 의도 및 도구 필요성 분석 중...',
    timestamp: '2026-09-16T18:00:01+00:00',
    progress: 25,
  };

  const mockStatusSearching: ChatStatusPayload = {
    step: 'tool_calling',
    label: "Action: search_news_corpus('Model Context Protocol') 실행 중...",
    timestamp: '2026-09-16T18:00:02+00:00',
    progress: 50,
    query: 'Model Context Protocol',
  };

  const mockStatusSynthesizing: ChatStatusPayload = {
    step: 'synthesizing',
    label: '검증된 컨텍스트를 바탕으로 답변 생성 중...',
    timestamp: '2026-09-16T18:00:03+00:00',
    progress: 80,
  };

  const mockHistory: ChatStatusPayload[] = [mockStatusThinking, mockStatusSearching, mockStatusSynthesizing];

  it('renders real-time step animation, label, and progress during streaming', () => {
    render(
      <WorkflowStepTracker
        currentStatus={mockStatusExtracting}
        stepHistory={[mockStatusExtracting]}
        isStreaming={true}
        isDone={false}
      />
    );

    expect(screen.getByText(/지정된 단일 뉴스 기사 컨텍스트 로드 중/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '30');
  });

  it('renders thinking, tool_calling and synthesizing step states accurately (backend global order)', () => {
    const { rerender } = render(
      <WorkflowStepTracker
        currentStatus={mockStatusThinking}
        stepHistory={[mockStatusThinking]}
        isStreaming={true}
        isDone={false}
      />
    );
    expect(screen.getByText(/질문 의도 및 도구 필요성 분석 중/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');

    rerender(
      <WorkflowStepTracker
        currentStatus={mockStatusSearching}
        stepHistory={[mockStatusThinking, mockStatusSearching]}
        isStreaming={true}
        isDone={false}
      />
    );
    expect(screen.getByText(/search_news_corpus/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');

    rerender(
      <WorkflowStepTracker
        currentStatus={mockStatusSynthesizing}
        stepHistory={mockHistory}
        isStreaming={true}
        isDone={false}
      />
    );
    expect(screen.getByText(/검증된 컨텍스트를 바탕으로 답변 생성 중/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '80');
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

  it('renders dedicated lucide-react icons and labels for ReAct steps (thinking, tool_calling, synthesizing)', () => {
    const { container, rerender } = render(
      <WorkflowStepTracker
        currentStatus={mockStatusThinking}
        stepHistory={[mockStatusThinking]}
        isStreaming={true}
        isDone={false}
      />
    );
    expect(screen.getByText(/질문 의도 및 도구 필요성 분석 중/i)).toBeInTheDocument();
    const thinkingHeaderRow = container.querySelector('.flex.items-center.gap-2.font-medium');
    expect(thinkingHeaderRow?.querySelector('svg')).not.toBeNull();

    rerender(
      <WorkflowStepTracker
        currentStatus={mockStatusSearching}
        stepHistory={[mockStatusThinking, mockStatusSearching]}
        isStreaming={true}
        isDone={false}
      />
    );
    expect(screen.getByText(/search_news_corpus/i)).toBeInTheDocument();
    const toolCallingHeaderRow = container.querySelector('.flex.items-center.gap-2.font-medium');
    expect(toolCallingHeaderRow?.querySelector('svg')).not.toBeNull();

    rerender(
      <WorkflowStepTracker
        currentStatus={mockStatusSynthesizing}
        stepHistory={mockHistory}
        isStreaming={true}
        isDone={false}
      />
    );
    expect(screen.getByText(/검증된 컨텍스트를 바탕으로 답변 생성 중/i)).toBeInTheDocument();
    const synthesizingHeaderRow = container.querySelector('.flex.items-center.gap-2.font-medium');
    expect(synthesizingHeaderRow?.querySelector('svg')).not.toBeNull();
  });
});
