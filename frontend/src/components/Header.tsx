'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bot,
  CircleCheck,
  Clock,
  Command,
  Cpu,
  Ellipsis,
  Globe,
  RefreshCw,
  Rss,
  Send,
  Terminal,
  Trash2,
} from 'lucide-react';
import { useCollector } from '@/hooks/useCollector';
import { useHotkey } from '@/hooks/useHotkey';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { overlayStack } from '@/lib/overlay-stack';
import { cn } from '@/lib/cn';
import { useTheme, type ThemeMode } from '@/context/ThemeContext';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Kbd } from '@/components/ui/Kbd';
import { MenuButton, type MenuItem } from '@/components/ui/Menu';
import { Spinner } from '@/components/ui/Spinner';
import { ThemeMenu } from '@/components/ui/ThemeMenu';
import CommandPalette from '@/components/CommandPalette';
import ResetConfirmDialog from '@/components/ResetConfirmDialog';
import { getClientEnv } from '@/lib/env';

export const RSS_FEED_URL = '/api/news/feed/rss.xml';

interface HeaderProps {
  onRefresh: () => void;
  onOpenSchedule: () => void;
  onOpenMcp: () => void;
  onOpenWebhook?: () => void;
  onOpenSources?: () => void;
}

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: '라이트' },
  { mode: 'dark', label: '다크' },
  { mode: 'system', label: '시스템' },
];

const NAV_LINK_CLASSES =
  'inline-flex h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-fg-muted transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-fg md:h-9 aria-[current=page]:text-fg aria-[current=page]:bg-surface-muted';

/**
 * `/` 화면 헤더 (spec 설계 3). 56px 한 줄, sticky.
 * 폭에 따라 같은 요소의 모양만 바꾸고, 모바일 전용 항목은 더보기 메뉴에 넣는다.
 * 커맨드 팔레트(⌘K)와 초기화 확인 창은 헤더가 가진다.
 */
export default function Header({ onRefresh, onOpenSchedule, onOpenMcp, onOpenWebhook, onOpenSources }: HeaderProps) {
  const { isCollecting, timeLeft, collect } = useCollector({ onRefresh });
  const { theme, setTheme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [showPalette, setShowPalette] = useState(false);
  const [showReset, setShowReset] = useState(false);
  // 빌드 때 next.config.ts 의 env 로 들어온다 (패키지 버전). 값이 없으면 배지를 그리지 않는다.
  const appVersion = getClientEnv().NEXT_PUBLIC_APP_VERSION;

  // ⌘K / Ctrl+K: 팔레트가 맨 위면 닫고, 다른 레이어가 열려 있으면 무시, 아니면 연다. 입력창 안에서도 동작.
  useHotkey(
    'mod+k',
    () => {
      const depth = overlayStack.getLayers().length;
      if (showPalette) {
        if (depth <= 1) setShowPalette(false);
        return;
      }
      if (depth > 0) return;
      setShowPalette(true);
    },
    { allowInInputs: true }
  );

  const scheduleText = timeLeft ? `다음 수집 ${timeLeft} 후` : '다음 수집 확인 중';

  const items: MenuItem[] = [];
  if (onOpenSources) items.push({ type: 'item', label: '소스 & 리서처', icon: <Globe />, onSelect: onOpenSources });
  if (onOpenWebhook) items.push({ type: 'item', label: '공유 & 알림', icon: <Send />, onSelect: onOpenWebhook });
  items.push({ type: 'item', label: 'MCP 연동', icon: <Cpu />, onSelect: onOpenMcp });
  items.push({ type: 'item', label: 'RSS 피드', icon: <Rss />, href: RSS_FEED_URL, external: true });
  if (isMobile) {
    items.push({ type: 'separator' });
    items.push({
      type: 'item',
      label: timeLeft ? `수집 스케줄 (다음 ${timeLeft} 후)` : '수집 스케줄',
      icon: <Clock />,
      onSelect: onOpenSchedule,
    });
    items.push({
      type: 'item',
      label: isCollecting ? '수집 중' : '즉시 수집',
      icon: <RefreshCw />,
      onSelect: () => void collect(),
      disabled: isCollecting,
    });
    items.push({ type: 'separator' });
    items.push({ type: 'group', label: '테마' });
    for (const { mode, label } of THEME_OPTIONS) {
      items.push({ type: 'radio', label, checked: theme === mode, onSelect: () => setTheme(mode) });
    }
  }
  items.push({ type: 'separator' });
  items.push({
    type: 'item',
    label: '초기화 & 재수집…',
    icon: <Trash2 />,
    tone: 'danger',
    onSelect: () => setShowReset(true),
    disabled: isCollecting,
  });

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-surface/95 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-40 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:text-fg focus:shadow-overlay"
      >
        본문으로 건너뛰기
      </a>
      <div className="mx-auto flex h-full max-w-7xl items-center gap-1 px-4 md:gap-2 md:px-6 lg:px-8">
        {/* 브랜드 */}
        <Link href="/" className="mr-1 flex h-11 shrink-0 items-center gap-2 rounded-lg text-fg">
          <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-lg border border-border bg-surface-muted text-fg-muted"
          >
            <Terminal className="size-4" />
          </span>
          <span className="text-base font-semibold">AgentLens</span>
          {appVersion ? (
            <span className="hidden lg:inline-flex">
              <Badge>v{appVersion}</Badge>
            </span>
          ) : null}
        </Link>

        {/* 주 내비 */}
        <nav aria-label="주 메뉴" className="flex items-center gap-1 max-md:ml-auto">
          <Link href="/" aria-current="page" className={cn(NAV_LINK_CLASSES, 'max-md:hidden')}>
            피드
          </Link>
          <Link href="/chat" className={cn(NAV_LINK_CLASSES, 'max-md:w-11 max-md:justify-center max-md:px-0')}>
            <Bot aria-hidden="true" className="size-4 shrink-0" />
            <span className="max-md:sr-only">AI 챗</span>
          </Link>
        </nav>

        <div className="flex items-center gap-1 md:ml-auto md:gap-2">
          {/* 수집 상태 (md 이상) */}
          <button
            type="button"
            onClick={onOpenSchedule}
            aria-label={`수집 스케줄 · ${scheduleText}`}
            className="hidden h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-fg-muted transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-fg md:inline-flex"
          >
            {isCollecting ? <Spinner /> : <Clock aria-hidden="true" className="size-4 shrink-0" />}
            <span className="hidden lg:inline">{isCollecting ? '수집 중' : scheduleText}</span>
            <span className="lg:hidden">{isCollecting ? '수집 중' : timeLeft ?? '…'}</span>
          </button>

          {/* 즉시 수집 (md 이상, 태블릿은 아이콘만) */}
          {/* `Button` 의 기본 `inline-flex` 와 `hidden` 이 겹치지 않게 바깥 span 이 숨긴다. */}
          <span className="hidden md:inline-flex">
            <Button
              variant="secondary"
              leadingIcon={<RefreshCw />}
              loading={isCollecting}
              onClick={() => void collect()}
              className="max-lg:w-9 max-lg:px-0"
            >
              <span className="max-lg:sr-only">{isCollecting ? '수집 중' : '즉시 수집'}</span>
            </Button>
          </span>

          {/* 커맨드 팔레트 */}
          <button
            type="button"
            onClick={() => setShowPalette(true)}
            className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-fg-muted transition-colors duration-150 ease-standard hover:border-border-strong hover:text-fg lg:inline-flex"
          >
            <Command aria-hidden="true" className="size-4" />
            <span>검색·명령</span>
            <Kbd>⌘K</Kbd>
          </button>
          <IconButton
            label="커맨드 팔레트 열기"
            icon={<Command />}
            onClick={() => setShowPalette(true)}
            className="lg:hidden"
          />

          {/* 테마 (md 이상) */}
          {!isMobile ? <ThemeMenu /> : null}

          {/* 더보기 */}
          <MenuButton label="더보기" icon={<Ellipsis />} items={items} align="end" />
        </div>
      </div>

      <CommandPalette
        isOpen={showPalette}
        onClose={() => setShowPalette(false)}
        onOpenSources={onOpenSources}
        onOpenMcp={onOpenMcp}
        onTriggerCollect={() => void collect()}
        onOpenSchedule={onOpenSchedule}
        onOpenSettings={onOpenWebhook}
        rssUrl={RSS_FEED_URL}
        onRequestReset={() => setShowReset(true)}
        resetDisabled={isCollecting}
      />
      <ResetConfirmDialog open={showReset} onClose={() => setShowReset(false)} />
    </header>
  );
}

/**
 * 수집 진행 줄. `<header>` 밖, 헤더 바로 아래에 둔다 (스크롤하면 함께 올라간다).
 * 메시지가 있을 때만 보인다. 알림 영역(`role="status"`)은 항상 DOM 에 있다.
 */
export function CollectorStatusLine() {
  const { isCollecting, message } = useCollector();
  return (
    <div role="status" aria-live="polite" className={cn(message ? 'border-b border-border bg-surface-muted' : null)}>
      {message ? (
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-3 px-4 text-xs md:px-6 lg:px-8">
          <span className="flex min-w-0 items-center gap-2 text-fg">
            {isCollecting ? (
              <Spinner className="text-accent" />
            ) : (
              <CircleCheck aria-hidden="true" className="size-4 shrink-0 text-success" />
            )}
            <span className="truncate font-medium">{message}</span>
          </span>
          {isCollecting ? (
            <span className="hidden shrink-0 text-fg-subtle sm:inline">피드 실시간 반영 중</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
