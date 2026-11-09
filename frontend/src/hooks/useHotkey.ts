'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';

/**
 * 조합키 표기: `+` 로 잇는다. 예: `mod+k`(⌘K 또는 Ctrl+K), `ctrl+shift+p`, `alt+/`.
 * - `mod` 는 ⌘(meta) 또는 Ctrl 중 하나.
 * - `meta`·`ctrl`·`alt` 는 적은 것만 눌려 있어야 한다 (`mod` 는 meta/ctrl 중 하나면 된다).
 * - `shift` 는 적었을 때만 확인한다.
 * - 글자 키는 `e.key` 소문자 또는 `e.code`(`KeyK`, `Digit1`, `Slash`)로 맞춘다 (한글 입력 상태에서도 동작).
 */
export interface ParsedHotkey {
  key: string;
  mod: boolean;
  meta: boolean;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
}

const CODE_ALIASES: Record<string, string> = {
  '/': 'Slash',
  '.': 'Period',
  ',': 'Comma',
  ';': 'Semicolon',
  '[': 'BracketLeft',
  ']': 'BracketRight',
  '-': 'Minus',
  '=': 'Equal',
};

export function parseHotkey(combo: string): ParsedHotkey {
  const parts = combo
    .toLowerCase()
    .split('+')
    .map((p) => p.trim())
    .filter(Boolean);
  const parsed: ParsedHotkey = { key: '', mod: false, meta: false, ctrl: false, alt: false, shift: false };
  for (const part of parts) {
    if (part === 'mod') parsed.mod = true;
    else if (part === 'meta' || part === 'cmd') parsed.meta = true;
    else if (part === 'ctrl' || part === 'control') parsed.ctrl = true;
    else if (part === 'alt' || part === 'option') parsed.alt = true;
    else if (part === 'shift') parsed.shift = true;
    else parsed.key = part;
  }
  // `a+b+` 처럼 마지막이 비면 `+` 키다.
  if (!parsed.key && combo.endsWith('+')) parsed.key = '+';
  return parsed;
}

function codeForKey(key: string): string | null {
  if (/^[a-z]$/.test(key)) return `Key${key.toUpperCase()}`;
  if (/^[0-9]$/.test(key)) return `Digit${key}`;
  return CODE_ALIASES[key] ?? null;
}

export function matchesHotkey(e: KeyboardEvent, hotkey: ParsedHotkey): boolean {
  if (!hotkey.key) return false;
  if (hotkey.mod) {
    if (!(e.metaKey || e.ctrlKey)) return false;
  } else {
    if (e.metaKey !== hotkey.meta) return false;
    if (e.ctrlKey !== hotkey.ctrl) return false;
  }
  if (e.altKey !== hotkey.alt) return false;
  if (hotkey.shift && !e.shiftKey) return false;

  const key = (e.key ?? '').toLowerCase();
  if (key === hotkey.key) return true;
  if (hotkey.key === 'escape' && key === 'esc') return true;
  const code = codeForKey(hotkey.key);
  return code !== null && e.code === code;
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable || target.getAttribute('contenteditable') === 'true') return true;
  return target.getAttribute('role') === 'combobox';
}

export interface UseHotkeyOptions {
  /** false 면 리스너를 달지 않는다 (기본 true). */
  enabled?: boolean;
  /** 입력창·`contentEditable`·`combobox` 안에서도 동작 (기본 false). ⌘K 같은 조합키에 쓴다. */
  allowInInputs?: boolean;
  /** 맞으면 `preventDefault` (기본 true). */
  preventDefault?: boolean;
}

/**
 * `window` keydown 에서 조합키가 맞으면 `handler` 를 부른다. IME 조합 중에는 무시한다.
 * `handler` 는 매 렌더 바뀌어도 된다.
 */
export function useHotkey(
  combo: string,
  handler: (e: KeyboardEvent) => void,
  { enabled = true, allowInInputs = false, preventDefault = true }: UseHotkeyOptions = {}
) {
  const handlerRef = useRef(handler);

  useLayoutEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const hotkey = parseHotkey(combo);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing || e.keyCode === 229) return;
      if (!matchesHotkey(e, hotkey)) return;
      if (!allowInInputs && isEditableTarget(e.target)) return;
      if (preventDefault) e.preventDefault();
      handlerRef.current(e);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [combo, enabled, allowInInputs, preventDefault]);
}

export default useHotkey;
