"""make collect 진입점.

실행 중인 backend 가 있으면 그 backend 에 수집을 시키고 끝날 때까지 기다린다 (API 모드).
없으면 이 프로세스에서 로컬 DB 에 직접 수집한다 (직접 모드).

환경 변수:
  AGENTLENS_API_URL  backend 주소 (기본 http://localhost:8000)
  COLLECT_MODE       auto | api | direct (기본 auto)
  COLLECT_TIMEOUT    API 모드에서 수집을 기다릴 최대 초 (기본 1800)

직접 모드는 backend/ 에서 PYTHONPATH=. 로 실행해야 app 패키지를 불러올 수 있다.
HTTP 는 표준 라이브러리 urllib 만 쓴다.
"""
import asyncio
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

DEFAULT_API_URL = "http://localhost:8000"
DEFAULT_TIMEOUT = 1800
MODES = ("auto", "api", "direct")

POLL_INTERVAL = 2.0
HEALTH_TIMEOUT = 2.0
REQUEST_TIMEOUT = 10.0


def _out(msg):
    print(msg, flush=True)


def _err(msg):
    print(msg, file=sys.stderr, flush=True)


def _request(url, method="GET", timeout=REQUEST_TIMEOUT):
    data = b"" if method == "POST" else None
    req = urllib.request.Request(url, data=data, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = resp.read().decode("utf-8")
    return json.loads(body) if body else {}


def backend_alive(api_url):
    """GET /health 가 200 이고 status == healthy 면 True."""
    try:
        req = urllib.request.Request(f"{api_url}/health", method="GET")
        with urllib.request.urlopen(req, timeout=HEALTH_TIMEOUT) as resp:
            if resp.status != 200:
                return False
            data = json.loads(resp.read().decode("utf-8") or "{}")
        return isinstance(data, dict) and data.get("status") == "healthy"
    except Exception:
        return False


def run_api(api_url, timeout_sec):
    _out(f"API 모드: {api_url}")
    deadline = time.monotonic() + timeout_sec
    try:
        before = _request(f"{api_url}/api/schedule/progress")
        before_time = before.get("last_crawl_time")
        trig = _request(f"{api_url}/api/schedule/trigger", method="POST")
    except (urllib.error.URLError, OSError, ValueError) as e:
        _err(f"backend 요청 실패: {e}")
        return 1

    status = trig.get("status")
    if status == "already_running" and trig.get("other_process"):
        # 다른 프로세스(MCP 서버, 직접 모드 make collect)의 수집은 이 backend 의 진행 상태로 끝을 알 수 없다 (N-12)
        _err(f"{trig.get('message') or '다른 프로세스가 수집 중이다'} 그 수집이 끝난 뒤 다시 실행한다")
        return 1
    if status == "already_running":
        _out("이미 진행 중인 수집이 있다. 그 수집이 끝날 때까지 기다린다")
    elif status != "started":
        _err(f"수집을 시작하지 못했다: status={status} {trig.get('message', '')}".rstrip())
        return 1

    seen_running = False
    last_message = None
    while True:
        try:
            prog = _request(f"{api_url}/api/schedule/progress")
        except (urllib.error.URLError, OSError, ValueError) as e:
            _err(f"backend 요청 실패: {e}")
            return 1

        message = prog.get("step_message")
        if message and message != last_message:
            _out(message)
            last_message = message

        running = bool(prog.get("is_running"))
        if running:
            seen_running = True
        else:
            if prog.get("last_crawl_time") != before_time:
                _out(
                    f"수집 완료: 수집 {prog.get('items_collected', 0)}건, "
                    f"저장 {prog.get('items_saved', 0)}건"
                )
                return 0
            if seen_running:
                _err(f"수집이 오류로 끝났다: {last_message or ''}")
                return 1

        remaining = deadline - time.monotonic()
        if remaining <= 0:
            _err(f"수집이 {timeout_sec}초 안에 끝나지 않았다")
            return 1
        time.sleep(min(POLL_INTERVAL, remaining))


def _db_path_text():
    from sqlalchemy.engine import make_url
    from app.config import settings

    database = make_url(settings.DATABASE_URL).database
    if not database:
        return settings.DATABASE_URL
    return str(Path(database).resolve())


def run_direct(api_url, backend_up):
    try:
        db_text = _db_path_text()
        from app import database
        from app.collectors import manager
    except ImportError as e:
        _err(f"app 패키지를 불러오지 못했다 (backend/ 에서 PYTHONPATH=. 로 실행): {e}")
        return 1

    _out(f"직접 모드: {db_text}")
    if backend_up:
        _out(f"경고: {api_url} 에 backend 가 떠 있다. 같은 DB 라면 수집 잠금으로 한 번에 하나만 수집한다. "
             "그쪽이 수집 중이면 이 수집은 시작하지 않고 already_running 으로 끝난다")

    async def _collect():
        await database.ensure_db_schema()
        return await manager.collector_manager.collect_all()

    try:
        result = asyncio.run(_collect())
    except Exception as e:
        _err(f"수집 실패: {e}")
        return 1

    if not isinstance(result, dict) or result.get("status") != "success":
        status = result.get("status") if isinstance(result, dict) else result
        detail = result.get("error") or result.get("message") if isinstance(result, dict) else ""
        _err(f"수집 실패: status={status} {detail or ''}".rstrip())
        return 1

    source_results = result.get("source_results") or {}
    failed = []
    for name, info in source_results.items():
        info = info or {}
        if info.get("error"):
            failed.append(name)
            _out(f"{name}: 실패 - {info['error']}")
        else:
            _out(f"{name}: {info.get('count', 0)}건")

    if failed:
        _out(f"실패한 소스: {', '.join(failed)}")
    if not source_results or len(failed) == len(source_results):
        _err("모든 소스가 실패했다 (네트워크 확인)")
        return 1

    if "total_collected" in result or "total_saved" in result:
        _out(
            f"수집 완료: 수집 {result.get('total_collected', 0)}건, "
            f"저장 {result.get('total_saved', 0)}건"
        )
    return 0


def main(env=None):
    if env is None:
        env = os.environ

    api_url = (env.get("AGENTLENS_API_URL") or DEFAULT_API_URL).rstrip("/")
    mode = env.get("COLLECT_MODE") or "auto"
    if mode not in MODES:
        _err(f"COLLECT_MODE 는 auto, api, direct 중 하나여야 한다: {mode}")
        return 1

    raw_timeout = env.get("COLLECT_TIMEOUT") or str(DEFAULT_TIMEOUT)
    try:
        timeout_sec = int(raw_timeout)
    except ValueError:
        _err(f"COLLECT_TIMEOUT 은 정수 초여야 한다: {raw_timeout}")
        return 1
    if timeout_sec <= 0:
        _err(f"COLLECT_TIMEOUT 은 0 보다 커야 한다: {raw_timeout}")
        return 1

    up = backend_alive(api_url)
    if mode == "api":
        if not up:
            _err(f"make collect: {api_url} 에 backend 가 없다")
            return 1
        return run_api(api_url, timeout_sec)
    if mode == "auto" and up:
        return run_api(api_url, timeout_sec)
    return run_direct(api_url, up)


if __name__ == "__main__":
    sys.exit(main())
