'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Command, History, MoreHorizontal, Plus } from 'lucide-react';
import { ScopeMode, ChatSourceDetailResponse } from '@/types/chat';
import { NewsItem } from '@/types/news';
import { useTheme, type ThemeMode } from '@/context/ThemeContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useHotkey } from '@/hooks/useHotkey';
import { overlayStack } from '@/lib/overlay-stack';
import { IconButton } from '@/components/ui/IconButton';
import { MenuButton, type MenuItem } from '@/components/ui/Menu';
import ChatContextBar from './ChatContextBar';

export interface ChatHeaderProps {
  scopeMode: ScopeMode;
  onScopeChange: (nextScope: ScopeMode) => void;
  activeSource: NewsItem | ChatSourceDetailResponse | null;
  onRemoveSource: () => void;
  onNewChat: () => void;
  onToggleHistoryDrawer?: () => void;
  isHistoryOpen?: boolean;
  isStreaming: boolean;
  /** false 면 새 대화 버튼을 그리지 않는다 (기본 true). */
  showNewChatButton?: boolean;
  /** 데스크톱 사이드바가 열려 있는지. 1024px 이상에서 열려 있으면 새 대화 버튼을 숨긴다 (사이드바에 있다). */
  isSidebarOpen?: boolean;
  /** 커맨드 팔레트가 열려 있는지 (⌘K 로 닫기 판정). */
  isCommandPaletteOpen?: boolean;
  /** 커맨드 팔레트 열기/닫기. 주면 팔레트 버튼·메뉴 항목과 ⌘K 를 단다. */
  onToggleCommandPalette?: () => void;
}

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: '라이트' },
  { mode: 'dark', label: '다크' },
  { mode: 'system', label: '시스템' },
];

export default function ChatHeader({
  scopeMode,
  onScopeChange,
  activeSource,
  onRemoveSource,
  onNewChat,
  onToggleHistoryDrawer,
  isHistoryOpen = false,
  isStreaming,
  showNewChatButton = true,
  isSidebarOpen = false,
  isCommandPaletteOpen = false,
  onToggleCommandPalette,
}: ChatHeaderProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTabletUp = useMediaQuery('(min-width: 768px)');

  // ⌘K / Ctrl+K: 팔레트가 맨 위면 닫고, 다른 레이어가 열려 있으면 무시, 아니면 연다 (spec 설계 7).
  useHotkey(
    'mod+k',
    () => {
      if (!onToggleCommandPalette) return;
      const depth = overlayStack.getLayers().length;
      if (isCommandPaletteOpen) {
        if (depth <= 1) onToggleCommandPalette();
        return;
      }
      if (depth > 0) return;
      onToggleCommandPalette();
    },
    { enabled: Boolean(onToggleCommandPalette), allowInInputs: true }
  );

  const showNewChat = showNewChatButton && (!isDesktop || !isSidebarOpen);

  const menuItems: MenuItem[] = [
    { type: 'group', label: '테마' },
    ...THEME_OPTIONS.map(
      ({ mode, label }): MenuItem => ({
        type: 'radio',
        label,
        checked: theme === mode,
        onSelect: () => setTheme(mode),
      })
    ),
    { type: 'separator' },
    { type: 'item', label: '뉴스 피드로 이동', icon: <ArrowLeft />, onSelect: () => router.push('/') },
  ];
  if (onToggleCommandPalette && !isTabletUp) {
    menuItems.push({ type: 'item', label: '커맨드 팔레트', icon: <Command />, onSelect: onToggleCommandPalette });
  }

  return (
    <>
      <header className="sticky top-0 z-30 h-14 shrink-0 border-b border-border bg-surface/95 backdrop-blur">
        <div className="flex h-full items-center gap-1 px-2 md:gap-2 md:px-4">
          {/* 뒤로 가기가 맨 왼쪽 (R43) */}
          <Link
            href="/"
            aria-label="피드로 돌아가기"
            title="뉴스 피드로 돌아가기"
            className="inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium text-fg-muted transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-fg md:h-9 md:min-w-9"
          >
            <ArrowLeft aria-hidden="true" className="size-5 md:size-4" />
            <span className="hidden md:inline">피드</span>
          </Link>

          {onToggleHistoryDrawer ? (
            <IconButton
              label="대화 기록 보기"
              icon={<History />}
              onClick={onToggleHistoryDrawer}
              aria-expanded={isHistoryOpen}
              // 가리키는 요소는 열렸을 때만 DOM 에 있다 (접힌 사이드바는 null, 드로어는 열릴 때 포털) — spec 14.7 C-1.
              aria-controls={isHistoryOpen ? (isDesktop ? 'chat-history-sidebar' : 'chat-history-drawer') : undefined}
            />
          ) : null}

          <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-fg">AI 챗</h1>

          <div className="flex shrink-0 items-center gap-1">
            {showNewChat ? (
              <IconButton label="새 대화 시작" icon={<Plus />} onClick={onNewChat} disabled={isStreaming} />
            ) : null}

            {onToggleCommandPalette ? (
              <IconButton
                label="커맨드 팔레트 열기"
                icon={<Command />}
                onClick={onToggleCommandPalette}
                className="max-md:hidden"
              />
            ) : null}

            <MenuButton label="더보기" icon={<MoreHorizontal />} items={menuItems} align="end" />
          </div>
        </div>
      </header>

      <ChatContextBar
        scopeMode={scopeMode}
        onScopeChange={onScopeChange}
        activeSource={activeSource}
        onRemoveSource={onRemoveSource}
        isStreaming={isStreaming}
      />
    </>
  );
}
