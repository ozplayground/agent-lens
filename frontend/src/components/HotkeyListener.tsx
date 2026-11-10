'use client';

import { useEffect } from 'react';

export interface HotkeyListenerProps {
  /** 메인 피드 포커스 카드 이동 콜백 (j: +1, k: -1) */
  onNavigateFeed?: (delta: 1 | -1) => void;
  /** 포커스된 카드 상세 모달 열기 (Enter/Space, 대상이 document.body 일 때만) */
  onOpenDetailModal?: () => void;
  /** 포커스된 카드 Scoped 챗 핸드오버 (c) */
  onHandoverChat?: () => void;
  /** 포커스된 카드 북마크 토글 (b) */
  onToggleBookmark?: () => void;
  /** 상단 검색바 포커스 (/) */
  onFocusSearch?: () => void;
  /** 테마 순환 토글 (t) */
  onToggleTheme?: () => void;
  /** 단축키 활성화 여부 (기본값: true) */
  enabled?: boolean;
  /** true 면 단일 키 단축키(j/k, /, b, c, t, Enter/Space)를 무시한다. 오버레이가 열려 있을 때 넘긴다. */
  blockSingleKeys?: boolean;
}

/** `e.code` → 단일 키 (한글 입력 상태에서도 물리 키로 판정한다). */
const CODE_TO_KEY: Record<string, string> = {
  KeyJ: 'j',
  KeyK: 'k',
  KeyB: 'b',
  KeyC: 'c',
  KeyT: 't',
  Slash: '/',
};

const SINGLE_KEYS = new Set(['j', 'k', 'b', 'c', 't', '/']);

/** 단일 키를 `e.key` 소문자 → `e.code` 순서로 판정한다. */
function resolveSingleKey(e: KeyboardEvent): string {
  const key = (e.key ?? '').toLowerCase();
  if (SINGLE_KEYS.has(key)) return key;
  return (e.code && CODE_TO_KEY[e.code]) || key;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable || target.getAttribute('contenteditable') === 'true') return true;
  return target.getAttribute('role') === 'combobox';
}

export default function HotkeyListener({
  onNavigateFeed,
  onOpenDetailModal,
  onHandoverChat,
  onToggleBookmark,
  onFocusSearch,
  onToggleTheme,
  enabled = true,
  blockSingleKeys = false,
}: HotkeyListenerProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. IME 조합 중인 경우 무시 (한글 등 중복 입력 방지)
      if (e.isComposing || e.keyCode === 229) {
        return;
      }

      // ⌘K 는 `Header`, Escape 는 오버레이 스택이 처리한다. 여기서는 단일 키만 다룬다.

      // 2. 오버레이가 열려 있으면 단일 키 단축키를 막는다
      if (blockSingleKeys) {
        return;
      }

      // 3. Input Isolation Rule: 사용자가 텍스트 입력 중일 때는 단일 키 핫키 무시
      if (isEditableTarget(e.target)) {
        return;
      }

      // 조합키가 눌린 경우 다른 단일 키는 무시
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const key = resolveSingleKey(e);

      // 4. 단일 키 핫키 매핑
      switch (key) {
        case 'j':
          e.preventDefault();
          onNavigateFeed?.(1);
          break;
        case 'k':
          e.preventDefault();
          onNavigateFeed?.(-1);
          break;
        case '/':
          e.preventDefault();
          onFocusSearch?.();
          break;
        case 'b':
          e.preventDefault();
          onToggleBookmark?.();
          break;
        case 'c':
          e.preventDefault();
          onHandoverChat?.();
          break;
        case 't':
          e.preventDefault();
          onToggleTheme?.();
          break;
        case 'enter':
        case ' ':
          // 포커스가 어디에도 없을 때(document.body)만 카드를 연다.
          // 버튼·링크·입력 등에서는 브라우저 기본 동작을 가로채지 않는다.
          if (onOpenDetailModal && typeof document !== 'undefined' && e.target === document.body) {
            e.preventDefault();
            onOpenDetailModal();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    blockSingleKeys,
    onNavigateFeed,
    onOpenDetailModal,
    onHandoverChat,
    onToggleBookmark,
    onFocusSearch,
    onToggleTheme,
  ]);

  return null;
}
