"""T6: scripts/collect.py 의 모드 선택과 완료 판정 (make-targets).

스크립트는 경로로 불러온다. HTTP 는 같은 파일 안 스텁 서버(http.server 스레드)가 흉내 낸다.
main() 은 직접 모드에서 asyncio.run 을 부르므로 작업 스레드에서 돌린다
(pytest-asyncio 의 주 스레드 이벤트 루프 상태를 건드리지 않기 위해서).
"""
import concurrent.futures
import importlib.util
import json
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from unittest.mock import AsyncMock

import pytest

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "collect.py"
DEAD_URL = "http://127.0.0.1:9"

OLD_TIME = "2026-11-01T00:00:00+00:00"
NEW_TIME = "2026-11-08T00:00:00+00:00"


@pytest.fixture
def mod(monkeypatch):
    """scripts/collect.py 를 경로로 불러온다. 파일이 없으면 여기서 실패한다."""
    if not SCRIPT.exists():
        raise FileNotFoundError(str(SCRIPT))
    spec = importlib.util.spec_from_file_location("collect_script", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    monkeypatch.setattr(module, "POLL_INTERVAL", 0.05)
    return module


def run_main(module, env):
    """작업 스레드에서 main(env) 를 돌리고 (종료 코드, 걸린 초) 를 돌려준다."""
    t0 = time.monotonic()
    with concurrent.futures.ThreadPoolExecutor(1) as ex:
        code = ex.submit(module.main, env).result(timeout=30)
    return code, time.monotonic() - t0


def progress(is_running, last_crawl_time, step_message, collected=0, saved=0):
    return {
        "is_running": is_running,
        "current_source": "",
        "step_message": step_message,
        "items_collected": collected,
        "items_saved": saved,
        "items_filtered": 0,
        "completed_sources": 0,
        "total_sources": 6,
        "last_crawl_time": last_crawl_time,
    }


class Stub:
    """backend 흉내. /health, GET /api/schedule/progress, POST /api/schedule/trigger 만 응답한다.

    trigger 전 progress 는 `initial`, trigger 뒤에는 `sequence` 를 차례로 내주고 마지막 것을 되풀이한다.
    """

    def __init__(self, initial, sequence, trigger_status="started"):
        self.initial = initial
        self.sequence = list(sequence)
        self.trigger_status = trigger_status
        self.triggered = False
        self.index = 0
        self.paths = []
        self.lock = threading.Lock()
        self.url = None

    def next_progress(self):
        with self.lock:
            if not self.triggered:
                return self.initial
            item = self.sequence[min(self.index, len(self.sequence) - 1)]
            self.index += 1
            return item


@pytest.fixture
def stub_server():
    servers = []

    def start(stub):
        class Handler(BaseHTTPRequestHandler):
            def _send(self, code, body):
                data = json.dumps(body).encode("utf-8")
                self.send_response(code)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)

            def do_GET(self):
                stub.paths.append(f"GET {self.path}")
                if self.path == "/health":
                    self._send(200, {"status": "healthy", "version": "test", "running": False})
                elif self.path == "/api/schedule/progress":
                    self._send(200, stub.next_progress())
                else:
                    self._send(404, {"detail": "Not Found"})

            def do_POST(self):
                stub.paths.append(f"POST {self.path}")
                length = int(self.headers.get("Content-Length") or 0)
                if length:
                    self.rfile.read(length)
                if self.path == "/api/schedule/trigger":
                    with stub.lock:
                        stub.triggered = True
                    self._send(200, {"status": stub.trigger_status, "message": "test"})
                else:
                    self._send(404, {"detail": "Not Found"})

            def log_message(self, *args):
                pass

        server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        servers.append(server)
        stub.url = f"http://127.0.0.1:{server.server_address[1]}"
        return stub

    yield start
    for server in servers:
        server.shutdown()
        server.server_close()


def assert_no_reset(stub):
    assert stub.paths, "스텁이 요청을 하나도 받지 않았다"
    assert not any("reset-and-collect" in p for p in stub.paths), stub.paths


def first_line(text):
    lines = [l for l in text.splitlines() if l.strip()]
    return lines[0] if lines else ""


# (a) auto + healthy → API 모드, last_crawl_time 이 바뀌면 0
def test_auto_api_mode_success(mod, stub_server, capsys):
    stub = stub_server(Stub(
        initial=progress(False, OLD_TIME, "대기 중"),
        sequence=[
            progress(True, OLD_TIME, "수집 시작"),
            progress(True, OLD_TIME, "RSS 수집 중"),
            progress(False, NEW_TIME, "수집 완료", collected=12, saved=5),
        ],
    ))
    code, _ = run_main(mod, {"AGENTLENS_API_URL": stub.url, "COLLECT_MODE": "auto"})
    out = capsys.readouterr()

    assert code == 0, out
    assert first_line(out.out) == f"API 모드: {stub.url}"
    assert "12" in out.out and "5" in out.out
    assert "POST /api/schedule/trigger" in stub.paths
    assert_no_reset(stub)


# (b) running 을 본 뒤 running false, last_crawl_time 그대로 → 1, 마지막 step_message 출력
def test_api_mode_error_finish(mod, stub_server, capsys):
    stub = stub_server(Stub(
        initial=progress(False, OLD_TIME, "대기 중"),
        sequence=[
            progress(True, OLD_TIME, "수집 시작"),
            progress(False, OLD_TIME, "수집 오류: stub-boom-42"),
        ],
    ))
    code, _ = run_main(mod, {"AGENTLENS_API_URL": stub.url, "COLLECT_MODE": "auto"})
    out = capsys.readouterr()

    assert code == 1, out
    assert "stub-boom-42" in out.out + out.err
    assert_no_reset(stub)


# (c) COLLECT_TIMEOUT=1, 계속 running → 1, 5초 안에 끝난다
def test_api_mode_timeout(mod, stub_server, capsys):
    stub = stub_server(Stub(
        initial=progress(False, OLD_TIME, "대기 중"),
        sequence=[progress(True, OLD_TIME, "끝나지 않는 수집")],
    ))
    code, elapsed = run_main(mod, {
        "AGENTLENS_API_URL": stub.url,
        "COLLECT_MODE": "auto",
        "COLLECT_TIMEOUT": "1",
    })
    out = capsys.readouterr()

    assert code == 1, out
    assert elapsed < 5, elapsed
    assert_no_reset(stub)


# (d) 응답 없는 URL + auto → 직접 모드
def test_auto_direct_mode(mod, monkeypatch, capsys):
    from app.collectors.manager import collector_manager

    ensure = AsyncMock(return_value=None)
    collect = AsyncMock(return_value={
        "status": "success",
        "source_results": {"A": {"count": 3}, "B": {"error": "x", "count": 0}},
    })
    monkeypatch.setattr("app.database.ensure_db_schema", ensure)
    monkeypatch.setattr(collector_manager, "collect_all", collect)

    code, _ = run_main(mod, {"AGENTLENS_API_URL": DEAD_URL, "COLLECT_MODE": "auto"})
    out = capsys.readouterr()

    assert code == 0, out
    assert first_line(out.out).startswith("직접 모드:"), out.out
    assert ensure.await_count == 1
    assert collect.await_count == 1
    assert "실패한 소스: B" in (out.out + out.err).splitlines()


# (e) api + 응답 없는 URL → 1, 수집하지 않는다
def test_api_mode_without_backend(mod, monkeypatch, capsys):
    from app.collectors.manager import collector_manager

    collect = AsyncMock(return_value={"status": "success", "source_results": {}})
    monkeypatch.setattr(collector_manager, "collect_all", collect)

    code, _ = run_main(mod, {"AGENTLENS_API_URL": DEAD_URL, "COLLECT_MODE": "api"})
    out = capsys.readouterr()

    assert code == 1, out
    assert "backend 가 없다" in out.err
    assert collect.await_count == 0
