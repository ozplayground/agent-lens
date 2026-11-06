#!/usr/bin/env python3
"""Stage-driven SDLC 게이트 hook. 표준 라이브러리만 사용한다.

settings.json 의 hooks 에서 호출된다 (stdin 으로 hook 입력 JSON 을 받는다).
  session-start   SessionStart: 작업 단위별 현재 스테이지와 tasks 진행률을 컨텍스트로 출력
  pre-tool        PreToolUse: 산출물 체인, 승인 위조, plan 범위, 배포 게이트 검사
  task-completed  TaskCompleted(에이전트 팀): check_command 가 실패하면 완료를 막는다
사람이 직접 실행한다 (Claude 의 도구 호출이 아니라 프롬프트의 `!` 접두어로):
  status          작업 단위별 스테이지 표
  approve <file>  산출물의 Status 를 승인 상태로 바꾸고 승인자/날짜를 남긴다
자동 승인 (켜져 있을 때만 Claude 가 도구로 실행할 수 있다):
  approve --auto <file>  승인자를 '자동 승인 (Claude)' 로 남긴다
  켜는 법: 환경 변수 SDLC_AUTO_APPROVE=1, 또는 sdlc-config.local.json (git 에 올리지 않음) 에 {"auto_approve": true}
"""
import datetime
import fnmatch
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
APPROVED = {"accepted", "approved", "done"}
# 기능별 산출물. 체인: 앞 산출물이 승인되어야 다음 산출물을 쓸 수 있다.
ARTIFACTS = ("research.md", "intent.md", "spec.md", "plan.md", "verify.md", "release.md")
CHAIN = {"spec.md": "intent.md", "plan.md": "spec.md", "verify.md": "plan.md", "release.md": "verify.md"}
APPROVE_WORD = {"intent.md": "accepted"}  # 그 외는 approved
STATUS_RE = re.compile(r"^Status:\s*(\w+)", re.M | re.I)
APPROVAL_WRITE_RE = re.compile(r"^\s*Status:\s*(accepted|approved|done)\b", re.M | re.I)
APPROVAL_ANY_RE = re.compile(r"Status:\s*(accepted|approved|done)\b", re.I)


def load_config():
    with open(os.path.join(HERE, "sdlc-config.json"), encoding="utf-8") as f:
        cfg = json.load(f)
    # 로컬 파일은 auto_approve 하나만 읽는다. 게이트 경로·배포 패턴 같은 다른 정책은 덮어쓰지 못한다.
    local = os.path.join(HERE, "sdlc-config.local.json")
    if os.path.exists(local):
        try:
            with open(local, encoding="utf-8") as f:
                cfg["auto_approve"] = json.load(f).get("auto_approve") is True
        except (OSError, ValueError, AttributeError):
            cfg["auto_approve"] = False
    else:
        cfg["auto_approve"] = False
    return cfg


def auto_approve_enabled(cfg):
    env = os.environ.get("SDLC_AUTO_APPROVE", "").strip().lower()
    if env in ("1", "true", "yes", "on"):
        return True
    if env in ("0", "false", "no", "off"):
        return False
    return bool(cfg.get("auto_approve"))


def repo_root(cwd):
    try:
        out = subprocess.run(["git", "-C", cwd, "rev-parse", "--show-toplevel"],
                             capture_output=True, text=True, check=True)
        return out.stdout.strip()
    except Exception:
        return cwd


def status_of(path):
    try:
        with open(path, encoding="utf-8") as f:
            m = STATUS_RE.search(f.read())
        return m.group(1).lower() if m else "draft"
    except FileNotFoundError:
        return None


def workstreams(root, cfg):
    base = os.path.join(root, cfg["artifact_root"])
    if not os.path.isdir(base):
        return []
    rows = []
    for name in sorted(os.listdir(base)):
        d = os.path.join(base, name)
        if os.path.isdir(d):
            rows.append((name, {a: status_of(os.path.join(d, a)) for a in ARTIFACTS}))
    return rows


def task_statuses(root, cfg, name):
    """tasks/<id>/*.md 의 Status (todo, doing, done, blocked)."""
    d = os.path.join(root, cfg.get("tasks_root", "tasks"), name)
    if not os.path.isdir(d):
        return {}
    return {f[:-3]: status_of(os.path.join(d, f)) for f in sorted(os.listdir(d)) if f.endswith(".md")}


def stage_label(st):
    if st["release.md"] in APPROVED:
        return "완료 (릴리스 승인됨)"
    if st["release.md"]:
        return "Deploy 검토 대기"
    if st["verify.md"] in APPROVED:
        return "Deploy 단계"
    if st["verify.md"]:
        return "Test 검토 대기"
    if st["plan.md"] in APPROVED:
        return "Build (plan 승인됨)"
    if st["plan.md"]:
        return "Build 계획 검토 대기"
    if st["spec.md"] in APPROVED:
        return "Build 계획 작성 단계"
    if st["spec.md"]:
        return "Design 검토 대기"
    if st["intent.md"] in APPROVED:
        return "Design 단계"
    if st["intent.md"]:
        return "Plan 검토 대기"
    return "Research (선택 스테이지)" if st["research.md"] else "비어 있음"


def plan_globs(plan_path, cfg):
    """plan.md 의 '변경 파일' 절에서 경로/글롭을 읽는다."""
    header = cfg.get("plan_files_heading", "## 변경 파일")
    globs, inside = [], False
    with open(plan_path, encoding="utf-8") as f:
        for line in f:
            if line.startswith("## "):
                inside = line.strip() == header
                continue
            if inside and line.lstrip().startswith(("-", "*")):
                m = re.search(r"`([^`]+)`", line)
                token = m.group(1) if m else (line.lstrip("-* \t").split() or [""])[0]
                if token:
                    globs.append(token.strip())
    return globs


def covered_by_approved_plan(rel, root, cfg):
    for name, st in workstreams(root, cfg):
        if st["plan.md"] in APPROVED:
            p = os.path.join(root, cfg["artifact_root"], name, "plan.md")
            if any(fnmatch.fnmatch(rel, g) for g in plan_globs(p, cfg)):
                return name
    return None


def deny(reason):
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": reason}}, ensure_ascii=False))
    sys.exit(0)


def pre_tool(data, cfg):
    tool = data.get("tool_name", "")
    ti = data.get("tool_input", {}) or {}
    root = repo_root(data.get("cwd") or os.getcwd())
    art = cfg["artifact_root"].rstrip("/") + "/"

    if tool == "Bash":
        cmd = ti.get("command", "")
        if art.rstrip("/") in cmd and APPROVAL_ANY_RE.search(cmd):
            deny("산출물 승인은 사람이 한다. 승인자가 프롬프트에서 `! python3 \"$(git rev-parse --show-toplevel)/.claude/hooks/sdlc_hook.py\" approve <파일>` 을 실행해야 한다.")
        # $(...) 치환과 따옴표를 걷어낸 뒤, 명령 위치에서 approve 를 실행하는지 본다
        norm = [re.sub(r"\$\([^)]*\)", "X", seg).replace('"', "").replace("'", "").strip()
                for seg in re.split(r"\n|&&|\|\||;|\|", cmd)]
        approve_segs = [seg for seg in norm if re.match(r"^(\S*python3?\s+)?\S*sdlc_hook\.py\s+approve\b", seg)]
        if approve_segs:
            if not auto_approve_enabled(cfg):
                deny("Claude 는 승인 명령을 실행하지 않는다. 승인자가 프롬프트에서 `!` 로 직접 실행해야 한다. "
                     "자동 승인을 쓰려면 SDLC_AUTO_APPROVE=1 이나 .claude/hooks/sdlc-config.local.json 의 auto_approve 를 켠다.")
            if not all(re.search(r"\sapprove\s+--auto\b", seg) for seg in approve_segs):
                deny("자동 승인은 `sdlc_hook.py approve --auto <파일>` 로만 실행한다 (승인자가 '자동 승인 (Claude)' 로 남는다).")
        for pat in cfg.get("deploy_patterns", []):
            if fnmatch.fnmatch(cmd.strip(), pat) and not os.environ.get("RELEASE_APPROVAL"):
                deny(f"프로덕션 게이트: `{pat}` 는 릴리스 승인 후에만 실행한다. 릴리스 관리자가 RELEASE_APPROVAL 을 설정한 세션에서 실행해야 한다.")
        return

    path = ti.get("file_path") or ti.get("notebook_path")
    if not path:
        return
    rel = os.path.relpath(os.path.realpath(os.path.join(data.get("cwd") or root, path)), os.path.realpath(root))
    new_text = ti.get("content") or ti.get("new_string") or ti.get("new_source") or ""
    if not new_text and isinstance(ti.get("edits"), list):
        new_text = "\n".join(e.get("new_string", "") for e in ti["edits"])

    if rel.startswith(art):
        if APPROVAL_WRITE_RE.search(new_text):
            deny("산출물의 Status 를 승인 상태로 바꾸는 것은 승인자만 한다. 승인자가 `! python3 \"$(git rev-parse --show-toplevel)/.claude/hooks/sdlc_hook.py\" approve " + rel + "` 를 실행해야 한다.")
        base = os.path.basename(rel)
        prev = CHAIN.get(base)
        if prev and status_of(os.path.join(root, os.path.dirname(rel), prev)) not in APPROVED:
            deny(f"스테이지 게이트: {base} 를 쓰기 전에 같은 폴더의 {prev} 가 승인되어야 한다 (현재: {status_of(os.path.join(root, os.path.dirname(rel), prev)) or '없음'}).")
        return

    if any(fnmatch.fnmatch(rel, g) for g in cfg.get("gated_paths", [])):
        if not covered_by_approved_plan(rel, root, cfg):
            deny(f"스테이지 게이트: `{rel}` 는 승인된 plan.md 의 '변경 파일' 목록에 없다. plan.md 를 작성하거나 고쳐 승인받은 뒤 편집한다.")


def task_completed(data, cfg):
    cmd = cfg.get("check_command")
    if not cmd:
        return
    root = repo_root(data.get("cwd") or os.getcwd())
    r = subprocess.run(cmd, shell=True, cwd=root, capture_output=True, text=True)
    if r.returncode != 0:
        tail = (r.stdout + r.stderr)[-3000:]
        print(f"`{cmd}` 가 실패했다. 고친 뒤 다시 완료 처리한다.\n{tail}", file=sys.stderr)
        sys.exit(2)


def print_status(root, cfg):
    if auto_approve_enabled(cfg):
        print("[SDLC] 자동 승인 켜짐: 산출물을 자체 검토한 뒤 `python3 .claude/hooks/sdlc_hook.py approve --auto <파일>` 로 승인하고 다음 스테이지로 넘어간다.")
    rows = workstreams(root, cfg)
    if not rows:
        print(f"[SDLC] {cfg['artifact_root']}/ 에 작업 단위가 없다. 새 작업은 intent.md 부터 시작한다.")
        return
    print("[SDLC] 작업 단위별 스테이지")
    for name, st in rows:
        s = ", ".join(f"{k.split('.')[0]}={v or '-'}" for k, v in st.items())
        print(f"- {name}: {stage_label(st)} ({s})")
        tasks = task_statuses(root, cfg, name)
        if tasks:
            done = sum(v == "done" for v in tasks.values())
            open_ = [f"{t}={v}" for t, v in tasks.items() if v != "done"]
            print(f"  tasks {done}/{len(tasks)} done" + (f" · {', '.join(open_)}" if open_ else ""))


def approve(path, auto=False):
    if not os.path.exists(path):
        path = os.path.join(repo_root(os.getcwd()), path)
    word = APPROVE_WORD.get(os.path.basename(path), "approved")
    with open(path, encoding="utf-8") as f:
        text = f.read()
    if auto:
        who = "자동 승인 (Claude)"
    else:
        who = subprocess.run(["git", "config", "user.name"], capture_output=True, text=True).stdout.strip() or os.environ.get("USER", "unknown")
    stamp = f"Status: {word}\nApproved-by: {who} ({datetime.date.today().isoformat()})"
    text = re.sub(r"^Approved-by:.*\n?", "", text, flags=re.M)
    text, n = STATUS_RE.subn(stamp, text, count=1)
    if not n:
        sys.exit(f"{path}: Status 줄이 없다")
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"{path}: {word} ({who})")


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    cfg = load_config()
    if cmd == "approve":
        args = sys.argv[2:]
        auto = "--auto" in args
        files = [a for a in args if a != "--auto"]
        if not files:
            sys.exit("사용법: sdlc_hook.py approve [--auto] <파일>")
        if auto and not auto_approve_enabled(cfg):
            sys.exit("자동 승인이 꺼져 있다 (SDLC_AUTO_APPROVE 또는 sdlc-config.local.json 의 auto_approve).")
        return approve(files[0], auto=auto)
    if cmd == "status":
        return print_status(repo_root(os.getcwd()), cfg)
    data = json.load(sys.stdin)
    if cmd == "session-start":
        print_status(repo_root(data.get("cwd") or os.getcwd()), cfg)
    elif cmd == "pre-tool":
        pre_tool(data, cfg)
    elif cmd == "task-completed":
        task_completed(data, cfg)


if __name__ == "__main__":
    main()
