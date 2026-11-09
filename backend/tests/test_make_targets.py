"""Makefile·docker-compose 회귀 검사 (make-targets, spec 2절 T1~T5).

`make` 는 반드시 `-n` (실행하지 않고 출력만) 으로 부른다. `-n` 없는 호출을 쓰지 않는다.
`make -n` 이 실제로 무언가를 실행하는 경로(`$(MAKE)`, `$(shell …)`, `+` 접두)가 Makefile 에 없음을
먼저 단언한 뒤에만 `make -n` 을 부른다.
"""
import os
import py_compile
import re
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
MAKEFILE = ROOT / "Makefile"
COMPOSE = ROOT / "docker-compose.yml"

TARGETS = [
    "setup",
    "dev",
    "test",
    "build",
    "clean",
    "collect",
    "reset",
    "docker-build",
    "docker-up",
    "docker-down",
    "docker-logs",
    "check",
]

# make check 안에서 pytest 가 돌면 넘어오는 make 변수와, Makefile 변수를 바꾸는 환경 변수를 뺀다.
_STRIPPED_ENV = (
    "MAKEFLAGS",
    "MFLAGS",
    "MAKELEVEL",
    "AGENTLENS_API_URL",
    "COLLECT_MODE",
    "COLLECT_TIMEOUT",
    "DOCKER_WAIT_TIMEOUT",
    "DOCKER_LOGS_ARGS",
)


def _makefile_text() -> str:
    return MAKEFILE.read_text(encoding="utf-8")


def _assert_dry_run_is_safe(text: str) -> None:
    """`make -n` 이 아무것도 실행하지 않는 Makefile 인지 확인한다 (spec R1, T2 의 첫 단언)."""
    for needle in ("$(MAKE)", "${MAKE}", "$(shell", "${shell"):
        assert needle not in text, f"Makefile 에 {needle!r} 가 있다: make -n 이 실제로 실행한다"
    for lineno, line in enumerate(text.splitlines(), start=1):
        if not line.startswith("\t"):
            continue
        body = line[1:].lstrip("@-")
        assert not body.startswith("+"), (
            f"Makefile {lineno}행 레시피가 '+' 로 시작한다: make -n 이 실제로 실행한다: {line!r}"
        )


def _make_dry_run(*args: str) -> subprocess.CompletedProcess:
    # 안전 단언이 실패하면 make 를 부르지 않는다.
    _assert_dry_run_is_safe(_makefile_text())
    env = {k: v for k, v in os.environ.items() if k not in _STRIPPED_ENV}
    return subprocess.run(
        ["make", "-n", *args],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
        timeout=30,
    )


# ---------------------------------------------------------------------------
# T1: 대상 집합 = .PHONY 집합 = 12개, SHELL := /bin/bash
# ---------------------------------------------------------------------------
def test_t1_defined_targets_match_list():
    text = _makefile_text()
    names = {
        m.group(1)
        for m in re.finditer(r"^([A-Za-z0-9_.-]+):(?!=)", text, re.MULTILINE)
        if m.group(1) != ".PHONY"
    }
    assert names == set(TARGETS)


def test_t1_phony_targets_match_list():
    text = _makefile_text()
    phony = set()
    for m in re.finditer(r"^\.PHONY:(.*)$", text, re.MULTILINE):
        phony.update(m.group(1).split())
    assert phony == set(TARGETS)


def test_t1_shell_is_bash():
    assert re.search(r"^SHELL := /bin/bash$", _makefile_text(), re.MULTILINE)


# ---------------------------------------------------------------------------
# T2: make -n 이 안전하고, 12개 대상 모두 종료 0·stderr 없음, test == check
# ---------------------------------------------------------------------------
def test_t2_dry_run_executes_nothing():
    _assert_dry_run_is_safe(_makefile_text())


@pytest.mark.parametrize("target", TARGETS)
def test_t2_make_dry_run_succeeds(target):
    result = _make_dry_run(target)
    assert result.returncode == 0, result.stderr
    assert result.stderr == ""


def test_t2_test_target_equals_check():
    test_run = _make_dry_run("test")
    check_run = _make_dry_run("check")
    assert test_run.returncode == 0, test_run.stderr
    assert check_run.returncode == 0, check_run.stderr
    assert test_run.stdout == check_run.stdout


# ---------------------------------------------------------------------------
# T3: 레시피가 부르는 파일이 있다
# ---------------------------------------------------------------------------
@pytest.mark.parametrize(
    "relpath",
    [
        "scripts/dev.sh",
        "scripts/collect.py",
        "docker-compose.yml",
        "backend/Dockerfile",
        "frontend/Dockerfile",
        "backend/requirements.txt",
        "frontend/pnpm-lock.yaml",
    ],
)
def test_t3_referenced_file_exists(relpath):
    assert (ROOT / relpath).is_file(), f"{relpath} 가 없다"


def test_t3_dev_script_is_executable_and_parses():
    dev = ROOT / "scripts" / "dev.sh"
    assert dev.is_file(), "scripts/dev.sh 가 없다"
    assert os.access(dev, os.X_OK), "scripts/dev.sh 에 실행 권한이 없다"
    result = subprocess.run(
        ["bash", "-n", str(dev)], capture_output=True, text=True, timeout=30
    )
    assert result.returncode == 0, result.stderr


def test_t3_collect_script_compiles(tmp_path):
    collect = ROOT / "scripts" / "collect.py"
    assert collect.is_file(), "scripts/collect.py 가 없다"
    # 저장소 안에 __pycache__ 를 만들지 않도록 바이트코드는 tmp_path 에 쓴다.
    py_compile.compile(str(collect), cfile=str(tmp_path / "collect.pyc"), doraise=True)


# ---------------------------------------------------------------------------
# T4: 실패를 숨기는 줄과 읽기 전용 config 마운트가 없다, compose 파일이 유효하다
# ---------------------------------------------------------------------------
def test_t4_makefile_has_no_or_true():
    assert "|| true" not in _makefile_text()


def test_t4_compose_config_json_is_writable():
    text = COMPOSE.read_text(encoding="utf-8")
    assert "config.json:ro" not in text
    assert "./config.json:/app/config.json:rw" in text


def test_t4_compose_config_is_valid():
    if shutil.which("docker") is None:
        pytest.skip("docker CLI 없음: compose 파일 검사를 건너뛴다")
    result = subprocess.run(
        ["docker", "compose", "config", "-q"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        timeout=30,
    )
    assert result.returncode == 0, result.stderr


# ---------------------------------------------------------------------------
# T5: reset 대상 URL 을 AGENTLENS_API_URL 로 바꿀 수 있고, 게이트가 기대는 형태를 유지한다
# ---------------------------------------------------------------------------
def test_t5_reset_uses_api_url_variable():
    result = _make_dry_run("reset", "AGENTLENS_API_URL=http://127.0.0.1:9")
    assert result.returncode == 0, result.stderr
    out = result.stdout
    assert "127.0.0.1:9" in out
    assert "localhost:8000" not in out
    assert "curl" in out
    assert "reset-and-collect" in out


# ---------------------------------------------------------------------------
# T5b: docker-logs 는 사용자 중지(종료 130)만 정상 종료로 보고, 그 밖의 실패는 그대로 전달한다
# make -n 출력(레시피)을 가짜 docker 가 있는 PATH 에서 bash 로 돌린다. make 자체는 -n 으로만 부른다.
# ---------------------------------------------------------------------------
@pytest.mark.parametrize(
    ("docker_rc", "expected_rc"),
    [(0, 0), (130, 0), (1, 1), (2, 2)],
)
def test_t5b_docker_logs_user_stop_is_success(tmp_path, docker_rc, expected_rc):
    result = _make_dry_run("docker-logs")
    assert result.returncode == 0, result.stderr
    recipe = result.stdout
    assert "docker compose logs" in recipe

    bindir = tmp_path / "bin"
    bindir.mkdir()
    fake = bindir / "docker"
    fake.write_text(f'#!/bin/sh\necho "fake docker $*"\nexit {docker_rc}\n', encoding="utf-8")
    fake.chmod(0o755)
    env = {k: v for k, v in os.environ.items() if k not in _STRIPPED_ENV}
    env["PATH"] = f"{bindir}{os.pathsep}{env.get('PATH', '')}"

    run = subprocess.run(
        ["/bin/bash", "-c", recipe],
        cwd=tmp_path,
        env=env,
        capture_output=True,
        text=True,
        timeout=30,
    )
    assert "fake docker compose logs" in run.stdout
    assert run.returncode == expected_rc, (run.stdout, run.stderr)
