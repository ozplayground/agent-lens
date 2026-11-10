import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';

/**
 * 수집 상태 저장소(`useCollector`)의 C-7 동작 (R27).
 * 모듈 저장소는 테스트 사이에 상태가 남으므로 매 테스트 `vi.resetModules()` 뒤 동적 import 로 새 저장소를 쓴다.
 * 진행 폴링·스케줄 갱신은 `setInterval` 이라 그것만 가짜 타이머로 돌린다 (요청 시간 제한 `setTimeout` 은 실제 타이머).
 */

type CollectorModule = typeof import('@/hooks/useCollector');

const RUNNING_MESSAGE = '이미 수집이 진행 중입니다.';
const RESET_REFUSED_MESSAGE = '현재 수집이 진행 중이므로 초기화할 수 없습니다. 잠시 후 다시 시도해주세요.';

function scheduleStatus(isRunning: boolean) {
  return {
    current_time: '2026-11-06T00:00:00Z',
    schedule_hours: [0, 6, 12, 18],
    timezone: 'UTC',
    next_run: '2026-11-06T03:12:00Z',
    minutes_until_next_run: 192,
    is_running: isRunning,
    last_crawl_time: null,
    last_crawl_status: isRunning ? 'running' : 'idle',
    recent_logs: [],
  };
}

const calls = { status: 0, progress: 0, trigger: 0, reset: 0 };

function mockCollectorApi({
  isRunning = false,
  trigger = { status: 'started', message: '실시간 점진적 수집이 시작되었습니다.', total_collected: 0, total_saved: 0, source_results: {} },
  reset = { status: 'started', message: '기존 데이터 3건이 삭제되었으며, 실시간 클린 재수집이 시작되었습니다.', deleted_count: 3 },
}: {
  isRunning?: boolean;
  trigger?: Record<string, unknown>;
  reset?: Record<string, unknown>;
} = {}) {
  server.use(
    http.get('*/api/schedule/status', () => {
      calls.status += 1;
      return HttpResponse.json(scheduleStatus(isRunning));
    }),
    http.get('*/api/schedule/progress', () => {
      calls.progress += 1;
      return HttpResponse.json({
        is_running: true,
        current_source: 'hackernews',
        step_message: '',
        items_collected: 0,
        items_saved: 0,
        items_filtered: 0,
        total_sources: 5,
        completed_sources: 1,
      });
    }),
    http.post('*/api/schedule/trigger', () => {
      calls.trigger += 1;
      return HttpResponse.json(trigger);
    }),
    http.post('*/api/schedule/reset-and-collect', () => {
      calls.reset += 1;
      return HttpResponse.json(reset);
    })
  );
}

async function loadCollector(): Promise<CollectorModule> {
  vi.resetModules();
  return import('@/hooks/useCollector');
}

describe('useCollector (수집 상태 복원과 already_running)', () => {
  beforeEach(() => {
    calls.status = 0;
    calls.progress = 0;
    calls.trigger = 0;
    calls.reset = 0;
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('(a) restores collecting and progress polling when the schedule status says is_running', async () => {
    mockCollectorApi({ isRunning: true });
    const collector = await loadCollector();
    const { result, unmount } = renderHook(() => collector.useCollector());

    await vi.waitFor(() => expect(result.current.status?.is_running).toBe(true));
    expect(result.current.isCollecting).toBe(true);
    expect(result.current.message).toBe('실시간 소식 수집 중...');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(collector.PROGRESS_POLL_MS);
    });
    await vi.waitFor(() => expect(calls.progress).toBeGreaterThan(0));
    expect(calls.trigger).toBe(0);
    unmount();
  });

  it('(a) does not start progress polling when the schedule status is idle', async () => {
    mockCollectorApi({ isRunning: false });
    const collector = await loadCollector();
    const { result, unmount } = renderHook(() => collector.useCollector());

    await vi.waitFor(() => expect(result.current.status).not.toBeNull());
    expect(result.current.isCollecting).toBe(false);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(collector.PROGRESS_POLL_MS * 2);
    });
    expect(calls.progress).toBe(0);
    unmount();
  });

  it('(b) joins the running collection with the response message when the trigger says already_running', async () => {
    mockCollectorApi({
      trigger: { status: 'already_running', message: RUNNING_MESSAGE, total_collected: 4, total_saved: 2, source_results: {} },
    });
    const collector = await loadCollector();
    const { result, unmount } = renderHook(() => collector.useCollector());
    await vi.waitFor(() => expect(result.current.status).not.toBeNull());

    await act(async () => {
      await result.current.collect();
    });
    expect(calls.trigger).toBe(1);
    expect(result.current.isCollecting).toBe(true);
    expect(result.current.message).toBe(RUNNING_MESSAGE);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(collector.PROGRESS_POLL_MS);
    });
    await vi.waitFor(() => expect(calls.progress).toBeGreaterThan(0));

    // 다시 눌러도 요청하지 않는다.
    await act(async () => {
      await result.current.collect();
    });
    expect(calls.trigger).toBe(1);
    unmount();
  });

  it('(c) rejects with the response message when the reset says already_running', async () => {
    mockCollectorApi({ reset: { status: 'already_running', message: RESET_REFUSED_MESSAGE, deleted_count: 0 } });
    const collector = await loadCollector();
    const { result, unmount } = renderHook(() => collector.useCollector());
    await vi.waitFor(() => expect(result.current.status).not.toBeNull());

    let error: unknown = null;
    await act(async () => {
      try {
        await result.current.reset();
      } catch (e) {
        error = e;
      }
    });
    expect(calls.reset).toBe(1);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe(RESET_REFUSED_MESSAGE);
    expect(result.current.message ?? '').not.toContain('삭제 완료');
    unmount();
  });

  it('(d) rejects a second reset while the first is still in flight instead of finishing as if it succeeded (FE-20)', async () => {
    mockCollectorApi();
    const gate = deferred();
    server.use(
      http.post('*/api/schedule/reset-and-collect', async () => {
        calls.reset += 1;
        await gate.promise;
        return HttpResponse.json({ status: 'started', message: '', deleted_count: 1 });
      })
    );
    const collector = await loadCollector();
    const { result, unmount } = renderHook(() => collector.useCollector());
    await vi.waitFor(() => expect(result.current.status).not.toBeNull());

    let first: Promise<void> = Promise.resolve();
    let secondError: unknown = null;
    await act(async () => {
      first = result.current.reset();
      try {
        await result.current.reset();
      } catch (e) {
        secondError = e;
      }
    });
    expect(secondError).toBeInstanceOf(Error);
    expect((secondError as Error).message).toBe('이미 초기화 요청을 처리하고 있습니다.');

    gate.release();
    await act(async () => {
      await first;
    });
    expect(calls.reset).toBe(1);
    unmount();
  });
});

/** 붙잡아 두었다가 나중에 풀 수 있는 약속 (상태 응답 도착 순서를 정한다). */
function deferred() {
  let release: () => void = () => {};
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

/** 실제 타이머로 잠깐 기다려 MSW 응답·then 체인이 끝나게 한다 (`setTimeout` 은 가짜가 아니다). */
async function settle(ms = 30) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

describe('useCollector (오래된 상태 응답 버리기, C-7 ④)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('① ignores a late is_running status response sent before the progress polling finished', async () => {
    let statusRunning = true;
    let progressDone = false;
    let statusCount = 0;
    let progressCount = 0;
    const held = deferred();
    server.use(
      http.get('*/api/schedule/status', async () => {
        statusCount += 1;
        const running = statusRunning;
        // 두 번째 요청 (수집 중 30초 갱신) 은 붙잡아 둔다.
        if (statusCount === 2) await held.promise;
        return HttpResponse.json({ ...scheduleStatus(running), minutes_until_next_run: 100 + statusCount });
      }),
      http.get('*/api/schedule/progress', () => {
        progressCount += 1;
        return HttpResponse.json({
          is_running: !progressDone,
          current_source: 'hackernews',
          step_message: '',
          items_collected: 3,
          items_saved: 2,
          items_filtered: 0,
          total_sources: 5,
          completed_sources: progressDone ? 5 : 1,
        });
      })
    );
    const collector = await loadCollector();
    const messages: (string | null)[] = [];
    const { result, unmount } = renderHook(() => {
      const value = collector.useCollector();
      messages.push(value.message);
      return value;
    });

    // 마운트 때 상태 #1 이 수집 중 → 진행 폴링 복원
    await vi.waitFor(() => expect(result.current.isCollecting).toBe(true));

    // 30초 갱신: 상태 #2 (is_running: true) 를 붙잡아 둔다
    await act(async () => {
      await vi.advanceTimersByTimeAsync(collector.SCHEDULE_REFRESH_MS);
    });
    await vi.waitFor(() => expect(statusCount).toBe(2));

    // 수집이 끝난다: 진행 응답 is_running false → 완료 문구, 완료 뒤 상태 #3 (is_running: false)
    progressDone = true;
    statusRunning = false;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(collector.PROGRESS_POLL_MS);
    });
    await vi.waitFor(() => expect(result.current.message).toBe('수집 완료 (+2건 신규 반영)'));
    expect(result.current.isCollecting).toBe(false);
    await vi.waitFor(() => expect(statusCount).toBe(3));
    await settle();

    // 이제야 붙잡은 상태 #2 (is_running: true) 가 도착한다
    const progressBefore = progressCount;
    await act(async () => {
      held.release();
    });
    await settle();
    expect(result.current.isCollecting).toBe(false);
    expect(result.current.status?.is_running).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(collector.PROGRESS_POLL_MS * 4);
    });
    await settle();
    expect(progressCount).toBe(progressBefore);
    expect(result.current.isCollecting).toBe(false);

    // 완료 문구가 설정된 횟수 (다른 문구에서 완료 문구로 바뀐 횟수) 는 1
    const doneTransitions = messages.filter(
      (message, i) => message?.startsWith('수집 완료') && !messages[i - 1]?.startsWith('수집 완료')
    ).length;
    expect(doneTransitions).toBe(1);
    unmount();
  });

  it('② keeps the newer status when an older status response arrives after it', async () => {
    let statusCount = 0;
    const held = deferred();
    server.use(
      http.get('*/api/schedule/status', async () => {
        statusCount += 1;
        const seq = statusCount;
        // 첫 요청 A 는 붙잡아 두고, 나중 요청 B 가 먼저 반영되게 한다.
        if (seq === 1) await held.promise;
        return HttpResponse.json({ ...scheduleStatus(false), minutes_until_next_run: seq === 1 ? 192 : 10 });
      })
    );
    const collector = await loadCollector();
    const { result, unmount } = renderHook(() => collector.useCollector());
    await vi.waitFor(() => expect(statusCount).toBe(1));

    // 30초 갱신: 요청 B 가 먼저 돌아와 반영된다
    await act(async () => {
      await vi.advanceTimersByTimeAsync(collector.SCHEDULE_REFRESH_MS);
    });
    await vi.waitFor(() => expect(result.current.status?.minutes_until_next_run).toBe(10));

    // 앞선 요청 A 의 응답이 늦게 온다
    await act(async () => {
      held.release();
    });
    await settle();
    expect(result.current.status?.minutes_until_next_run).toBe(10);
    expect(result.current.timeLeft).toBe('10m');
    unmount();
  });
});
