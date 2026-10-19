import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import ChatModelSelector from '@/components/chat/ChatModelSelector';
import ModelTierBadge from '@/components/chat/ModelTierBadge';
import ModelChangeDivider from '@/components/chat/ModelChangeDivider';
import { ModelTier } from '@/types/chat';

describe('ChatModelSelector Component (v4.0 TDD)', () => {
  const defaultProps = {
    selectedTier: 'sonnet' as ModelTier,
    onSelectTier: vi.fn(),
    isStreaming: false,
  };

  it('renders inline chip trigger with default Sonnet 5.5 tier and icon', () => {
    render(<ChatModelSelector {...defaultProps} />);

    const trigger = screen.getByRole('button', { name: /Claude 모델 선택|Sonnet/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent(/Sonnet 5.5/i);
    expect(trigger).toHaveTextContent('🎯');
  });

  it('opens popover on click and renders all 3 Claude tiers with WAI-ARIA radiogroup', () => {
    render(<ChatModelSelector {...defaultProps} />);

    const trigger = screen.getByRole('button', { name: /Claude 모델 선택|Sonnet/i });
    fireEvent.click(trigger);

    // WAI-ARIA radiogroup container
    const radiogroup = screen.getByRole('radiogroup', { name: /Claude AI 모델 선택/i });
    expect(radiogroup).toBeInTheDocument();

    // 3 Radio Options
    const radioItems = screen.getAllByRole('radio');
    expect(radioItems).toHaveLength(3);

    // Verify Haiku, Sonnet, Opus presence
    expect(within(radiogroup).getByText(/Haiku 5.5/i)).toBeInTheDocument();
    expect(within(radiogroup).getByText(/Sonnet 5.5/i)).toBeInTheDocument();
    expect(within(radiogroup).getByText(/Opus 5.5/i)).toBeInTheDocument();

    // Verify Relative Cost and Latency indicators
    expect(screen.getByText('~0.3s')).toBeInTheDocument();
    expect(screen.getByText('~0.6s')).toBeInTheDocument();
    expect(screen.getByText('~1.8s')).toBeInTheDocument();

    // Verify Sonnet 5.5 [추천] badge
    expect(within(radiogroup).getByText(/추천/i)).toBeInTheDocument();

    // Verify aria-checked
    const sonnetRadio = screen.getByRole('radio', { name: /Sonnet 5.5/i });
    expect(sonnetRadio).toHaveAttribute('aria-checked', 'true');

    const haikuRadio = screen.getByRole('radio', { name: /Haiku 5.5/i });
    expect(haikuRadio).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onSelectTier when user selects a different tier and closes popover', () => {
    const handleSelect = vi.fn();
    render(<ChatModelSelector {...defaultProps} onSelectTier={handleSelect} />);

    const trigger = screen.getByRole('button', { name: /Claude 모델 선택|Sonnet/i });
    fireEvent.click(trigger);

    const opusRadio = screen.getByRole('radio', { name: /Opus 5.5/i });
    fireEvent.click(opusRadio);

    expect(handleSelect).toHaveBeenCalledWith('opus');
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('supports keyboard navigation: ArrowDown / ArrowUp cyclic focus and Enter selection', () => {
    const handleSelect = vi.fn();
    render(<ChatModelSelector {...defaultProps} onSelectTier={handleSelect} />);

    const trigger = screen.getByRole('button', { name: /Claude 모델 선택|Sonnet/i });
    fireEvent.click(trigger);

    const radiogroup = screen.getByRole('radiogroup');

    // Currently on Sonnet (index 1)
    // Press ArrowDown -> moves to Opus (index 2)
    fireEvent.keyDown(radiogroup, { key: 'ArrowDown' });
    const opusRadio = screen.getByRole('radio', { name: /Opus 5.5/i });
    expect(document.activeElement).toBe(opusRadio);

    // Press ArrowDown again -> wraps around to Haiku (index 0)
    fireEvent.keyDown(radiogroup, { key: 'ArrowDown' });
    const haikuRadio = screen.getByRole('radio', { name: /Haiku 5.5/i });
    expect(document.activeElement).toBe(haikuRadio);

    // Press Enter to confirm selection
    fireEvent.keyDown(haikuRadio, { key: 'Enter' });
    expect(handleSelect).toHaveBeenCalledWith('haiku');
  });

  it('closes popover on Escape key press and returns focus to trigger', () => {
    render(<ChatModelSelector {...defaultProps} />);

    const trigger = screen.getByRole('button', { name: /Claude 모델 선택|Sonnet/i });
    fireEvent.click(trigger);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('disables trigger and prevents popover open when isStreaming is true', () => {
    render(<ChatModelSelector {...defaultProps} isStreaming={true} />);

    const trigger = screen.getByRole('button', { name: /Claude 모델 선택|Sonnet/i });
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute('title', expect.stringMatching(/답변 생성 중/i));

    fireEvent.click(trigger);
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('renders header-compact variant appropriately', () => {
    render(<ChatModelSelector {...defaultProps} variant="header-compact" />);

    const trigger = screen.getByRole('button', { name: /Claude 모델 선택|Sonnet/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger.className).toContain('text-xs');
  });

  it('renders header-chip variant appropriately and positions popover downwards', () => {
    render(<ChatModelSelector {...defaultProps} variant="header-chip" forceOpen={true} />);

    const trigger = screen.getByRole('button', { name: /Claude 모델 선택|Sonnet/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger.className).toContain('font-semibold');

    const radiogroup = screen.getByRole('radiogroup');
    expect(radiogroup.className).toContain('top-full');
  });

  it('honors forceOpen prop', () => {
    render(<ChatModelSelector {...defaultProps} forceOpen={true} />);

    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });
});

describe('ModelChangeDivider Component (v4.0 TDD)', () => {
  it('renders separator with accessible role and concise model change label', () => {
    render(
      <ModelChangeDivider
        previousTier="haiku"
        newTier="sonnet"
        timestamp="2026-10-19T09:00:00Z"
      />
    );

    const separator = screen.getByRole('separator');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveTextContent(/Claude Sonnet 5.5로 모델 변경됨/i);
    expect(separator).toHaveTextContent(/Haiku 5.5/i);
  });

  it('renders custom contextNotice when provided', () => {
    render(
      <ModelChangeDivider
        newTier="opus"
        contextNotice="이전 대화 세션 및 검색 맥락이 완벽히 유지됩니다"
      />
    );

    expect(screen.getByText(/이전 대화 세션 및 검색 맥락이 완벽히 유지됩니다/i)).toBeInTheDocument();
    expect(screen.getByText(/Claude Opus 5.5로 모델 변경됨/i)).toBeInTheDocument();
  });
});

describe('ModelTierBadge Component (v4.0 TDD)', () => {
  it('renders chip variant with tier icon, name, and relative cost', () => {
    render(<ModelTierBadge tier="haiku" variant="chip" showCost={true} />);

    expect(screen.getByText(/Haiku 5.5/i)).toBeInTheDocument();
    expect(screen.getByText('⚡')).toBeInTheDocument();
    expect(screen.getByText('$')).toBeInTheDocument();
  });

  it('renders footer variant with latency in milliseconds', () => {
    render(<ModelTierBadge tier="sonnet" variant="footer" latencyMs={642} />);

    expect(screen.getByText(/Sonnet 5.5/i)).toBeInTheDocument();
    expect(screen.getByText('🎯')).toBeInTheDocument();
    expect(screen.getByText(/642ms/i)).toBeInTheDocument();
  });

  it('renders recommendation tag when showRecommended is true for Sonnet', () => {
    render(<ModelTierBadge tier="sonnet" showRecommended={true} />);

    expect(screen.getByText(/추천/i)).toBeInTheDocument();
  });

  it('can hide icon when showIcon is false', () => {
    render(<ModelTierBadge tier="opus" showIcon={false} />);

    expect(screen.queryByText('🧠')).not.toBeInTheDocument();
    expect(screen.getByText(/Opus 5.5/i)).toBeInTheDocument();
  });
});
