'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import type { ScheduleStatus } from '@/types/news';
import { fetchCrawlProgress, fetchScheduleStatus, resetAndRecollect, triggerManualCollect } from '@/lib/api';

/**
 * 수집 상태 공유 저장소 (헤더·스케줄 대화상자·커맨드 팔레트가 같은 상태를 본다).
 *
 * - 모듈 단위 외부 저장소 + `useSyncExternalStore`.
 * - 구독자가 하나 이상일 때만 스케줄 상태를 30초마다 다시 읽는다. 마지막 구독자가 빠지면
 *   모든 interval·timeout 을 정리하고 상태를 처음으로 되돌린다.
 * - 수집이 시작되면 1.2초마다 진행도를 읽는다 (앞 요청이 끝나지 않았으면 그 회차는 건너뛴다).
 *   저장 건수가 늘 때마다, 그리고 끝날 때 등록된 새로고침 콜백을 부른다.
 * - 즉시 수집·초기화는 요청 중 플래그로 두 번 요청을 막는다.
 * - 스케줄 상태가 수집 중(`is_running`)이라고 하면 진행 폴링을 이어 붙인다 (다른 화면에 있다가 돌아온 경우).
 *   즉시 수집 응답이 `already_running` 이면 다시 요청하지 않고 그 문구로 폴링을 시작하고,
 *   초기화 응답이 `already_running` 이면 그 문구로 오류를 던진다.
 * - 오래된 상태 응답은 버린다: 더 나중 요청의 응답이 이미 반영됐거나, 진행 폴링이 끝나기 전에 보낸 요청의 응답
 *   (`statusSeq`·`appliedStatusSeq`·`progressEndSeq`). 수집 한 번에 `수집 완료` 는 한 번만 알린다.
 */

export const SCHEDULE_REFRESH_MS = 30_000;
export const PROGRESS_POLL_MS = 1_200;
const DONE_MESSAGE_MS = 4_000;
const COLLECTING_MESSAGE = '실시간 소식 수집 중...';
/** backend 가 이미 수집 중일 때 즉시 수집·초기화 응답의 `status` 값. */
const ALREADY_RUNNING = 'already_running';
const ERROR_MESSAGE_MS = 3_000;

export interface CollectorSnapshot {
  status: ScheduleStatus | null;
  isCollecting: boolean;
  /** 수집 진행 줄 문구. 없으면 null. */
  message: string | null;
  /** 마지막 스케줄 상태 요청이 실패했으면 true (성공하면 false). 이전 상태는 지우지 않는다 (FE-39). */
  statusError: boolean;
}

const INITIAL_SNAPSHOT: CollectorSnapshot = { status: null, isCollecting: false, message: null, statusError: false };

let snapshot: CollectorSnapshot = INITIAL_SNAPSHOT;
const listeners = new Set<() => void>();
const refreshHandlers = new Set<() => void>();

let scheduleTimer: ReturnType<typeof setInterval> | null = null;
let progressTimer: ReturnType<typeof setInterval> | null = null;
let messageTimer: ReturnType<typeof setTimeout> | null = null;
let progressRequestInFlight = false;
let collectInFlight = false;
let resetInFlight = false;
let lastSaved = 0;
/**
 * 진행 폴링 회차. 새 폴링(즉시 수집·초기화)을 시작할 때마다 올린다.
 * 진행 응답은 요청 당시 회차가 지금 회차와 같을 때만 반영한다 (이전 회차 응답이 새 상태를 덮지 않게).
 */
let pollRun = 0;
/** 구독이 끊기면 늘린다. 끊긴 뒤 도착한 응답은 버린다. */
let generation = 0;
/** 상태 요청 번호. 요청마다 1 늘리고 요청이 번호를 캡처한다. */
let statusSeq = 0;
/** 마지막으로 반영한 상태 응답의 요청 번호. 이보다 앞선 요청의 응답은 버린다. */
let appliedStatusSeq = 0;
/**
 * 진행 폴링이 완료·실패로 끝날 때의 `statusSeq`. 이 번호 이하의 상태 요청은 수집 중에 보낸 것이라
 * 늦게 도착한 `is_running: true` 가 끝난 폴링을 되살리지 않게 버린다.
 */
let progressEndSeq = 0;

function emit() {
  for (const listener of listeners) listener();
}

function setSnapshot(patch: Partial<CollectorSnapshot>) {
  snapshot = { ...snapshot, ...patch };
  emit();
}

function notifyRefresh() {
  for (const handler of refreshHandlers) handler();
}

function clearMessageTimer() {
  if (messageTimer !== null) {
    clearTimeout(messageTimer);
    messageTimer = null;
  }
}

function clearMessageLater(ms: number) {
  clearMessageTimer();
  messageTimer = setTimeout(() => {
    messageTimer = null;
    setSnapshot({ message: null });
  }, ms);
}

function stopProgressPolling() {
  if (progressTimer !== null) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
  progressRequestInFlight = false;
}

function loadStatus() {
  const gen = generation;
  statusSeq += 1;
  const seq = statusSeq;
  fetchScheduleStatus()
    .then((status) => {
      if (gen !== generation || listeners.size === 0) return;
      // 오래된 응답: 더 나중 요청의 응답이 이미 반영됐거나, 진행 폴링이 끝나기 전에 보낸 요청이면 버린다.
      if (seq < appliedStatusSeq || seq <= progressEndSeq) return;
      appliedStatusSeq = seq;
      setSnapshot({ status, statusError: false });
      // 수집 중인데 진행 폴링이 없으면 (화면을 떠났다 돌아온 경우) 이어 붙인다.
      if (status.is_running && progressTimer === null) startProgressPolling(COLLECTING_MESSAGE);
    })
    .catch(() => {
      if (gen !== generation || listeners.size === 0) return;
      // 더 나중 요청이 이미 성공했으면 실패를 표시하지 않는다.
      if (seq < appliedStatusSeq) return;
      setSnapshot({ statusError: true });
    });
}

async function pollProgressOnce(run: number) {
  if (progressRequestInFlight || run !== pollRun) return;
  progressRequestInFlight = true;
  const gen = generation;
  const isCurrent = () => gen === generation && run === pollRun;
  try {
    const prog = await fetchCrawlProgress();
    if (!isCurrent() || progressTimer === null) return;
    if (prog.step_message) setSnapshot({ message: prog.step_message });
    if (prog.items_saved > lastSaved) {
      lastSaved = prog.items_saved;
      notifyRefresh();
    }
    if (!prog.is_running) {
      stopProgressPolling();
      progressEndSeq = statusSeq;
      setSnapshot({ isCollecting: false, message: `수집 완료 (+${prog.items_saved}건 신규 반영)` });
      notifyRefresh();
      // progressEndSeq 를 정한 뒤 보내므로 이 응답은 반영된다.
      loadStatus();
      clearMessageLater(DONE_MESSAGE_MS);
    }
  } catch {
    if (!isCurrent()) return;
    stopProgressPolling();
    // 실패 때는 바로 상태를 다시 읽지 않는다 (진행 조회만 계속 실패하면 폴링이 1.2초마다 켜졌다 꺼진다).
    // 다음 30초 갱신이 수집 중이라고 하면 그때 이어 붙인다.
    progressEndSeq = statusSeq;
    setSnapshot({ isCollecting: false, message: null });
  } finally {
    if (isCurrent()) progressRequestInFlight = false;
  }
}

function startProgressPolling(initialMessage: string) {
  stopProgressPolling();
  clearMessageTimer();
  lastSaved = 0;
  pollRun += 1;
  const run = pollRun;
  setSnapshot({ isCollecting: true, message: initialMessage });
  progressTimer = setInterval(() => {
    void pollProgressOnce(run);
  }, PROGRESS_POLL_MS);
}

function start() {
  loadStatus();
  scheduleTimer = setInterval(loadStatus, SCHEDULE_REFRESH_MS);
}

function stopAll() {
  generation += 1;
  if (scheduleTimer !== null) {
    clearInterval(scheduleTimer);
    scheduleTimer = null;
  }
  stopProgressPolling();
  clearMessageTimer();
  collectInFlight = false;
  resetInFlight = false;
  lastSaved = 0;
  statusSeq = 0;
  appliedStatusSeq = 0;
  progressEndSeq = 0;
  snapshot = INITIAL_SNAPSHOT;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) start();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stopAll();
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return INITIAL_SNAPSHOT;
}

/** 즉시 수집. 수집 중이거나 요청 중이면 아무것도 하지 않는다. */
export async function collectNow(): Promise<void> {
  if (collectInFlight || snapshot.isCollecting) return;
  collectInFlight = true;
  const gen = generation;
  try {
    const res = await triggerManualCollect();
    if (gen !== generation) return;
    // 이미 수집 중이면 새로 요청하지 않고 진행 중인 수집의 폴링을 이어 붙인다.
    startProgressPolling(res.status === ALREADY_RUNNING && res.message ? res.message : COLLECTING_MESSAGE);
  } catch {
    if (gen !== generation) return;
    setSnapshot({ isCollecting: false, message: '수집 요청 실패' });
    clearMessageLater(ERROR_MESSAGE_MS);
  } finally {
    if (gen === generation) collectInFlight = false;
  }
}

/** 앞선 초기화 요청이 아직 끝나지 않았을 때 확인 창에 보일 문구. */
const RESET_IN_FLIGHT_MESSAGE = '이미 초기화 요청을 처리하고 있습니다.';

/**
 * 전체 삭제 후 재수집. 실패하거나, 이미 수집 중(`already_running`)이거나, 앞선 초기화 요청이 아직 끝나지 않았으면
 * 오류를 던진다 (확인 창이 문구를 보여준다). 조용히 끝나면 확인 창이 성공으로 닫히므로 그렇게 하지 않는다 (FE-20).
 */
export async function resetAndCollect(): Promise<void> {
  if (resetInFlight) throw new Error(RESET_IN_FLIGHT_MESSAGE);
  resetInFlight = true;
  const gen = generation;
  try {
    const res = await resetAndRecollect();
    // 구독자가 모두 떠나 저장소가 멈췄으면(확인 창도 닫혀 있다) 반영할 화면이 없다. 서버는 요청을 이미 받았다.
    if (gen !== generation) return;
    if (res.status === ALREADY_RUNNING) {
      throw new Error(res.message || '현재 수집이 진행 중이므로 초기화할 수 없습니다.');
    }
    notifyRefresh();
    startProgressPolling(`기존 ${res.deleted_count}건 삭제 완료. 신규 수집 중...`);
  } finally {
    if (gen === generation) resetInFlight = false;
  }
}

/** `3h 12m` 형식 (시간이 0 이면 `12m`). */
export function formatTimeLeft(minutes: number): string {
  const safe = Number.isFinite(minutes) && minutes > 0 ? minutes : 0;
  const hours = Math.floor(safe / 60);
  const mins = Math.round(safe % 60);
  return `${hours > 0 ? `${hours}h ` : ''}${mins}m`;
}

export interface UseCollectorOptions {
  /** 새 소식이 저장됐거나 수집·초기화가 끝났을 때 부른다 (피드 다시 읽기). */
  onRefresh?: () => void;
}

export interface UseCollectorResult extends CollectorSnapshot {
  /** 다음 수집까지 남은 시간 (`3h 12m`). 상태를 아직 모르면 null. */
  timeLeft: string | null;
  collect: () => Promise<void>;
  reset: () => Promise<void>;
  /** 스케줄 상태를 지금 다시 읽는다 (실패 뒤 다시 시도). */
  reloadStatus: () => void;
}

export function useCollector({ onRefresh }: UseCollectorOptions = {}): UseCollectorResult {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const onRefreshRef = useRef(onRefresh);
  useLayoutEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const handler = () => onRefreshRef.current?.();
    refreshHandlers.add(handler);
    return () => {
      refreshHandlers.delete(handler);
    };
  }, []);

  const collect = useCallback(() => collectNow(), []);
  const reset = useCallback(() => resetAndCollect(), []);

  return {
    ...state,
    timeLeft: state.status ? formatTimeLeft(state.status.minutes_until_next_run) : null,
    collect,
    reset,
    reloadStatus: loadStatus,
  };
}

export default useCollector;
