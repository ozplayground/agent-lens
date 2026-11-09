#!/usr/bin/env python3
"""Stage-driven SDLC 게이트 hook. 표준 라이브러리만 사용한다.

settings.json 의 hooks 에서 호출된다 (stdin 으로 hook 입력 JSON 을 받는다).
  session-start   SessionStart: 작업 단위별 현재 스테이지와 tasks 진행률을 컨텍스트로 출력
  pre-tool        PreToolUse: 역할 게이트, 산출물 체인, 승인 위조, plan 범위, 배포 게이트 검사
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
import shlex
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


def current_user_prompt(data):
    """이번 턴에 사용자가 직접 보낸 메시지(마지막 프롬프트와 그 뒤 작업 중에 보낸 메시지)를 합쳐 돌려준다.

    hook 입력의 transcript_path(JSONL)를 읽는다. 도구 결과, 메타 항목, 슬래시 명령 출력, 시스템 알림은 뺀다.
    """
    path = data.get("transcript_path")
    if not path or not os.path.exists(path):
        return ""
    try:
        with open(path, encoding="utf-8") as f:
            rows = f.readlines()[-500:]
    except OSError:
        return ""
    texts = []
    for line in reversed(rows):
        try:
            d = json.loads(line)
        except ValueError:
            continue
        if d.get("type") == "attachment":
            a = d.get("attachment") or {}
            p = a.get("prompt") if a.get("type") == "queued_command" else None
            if isinstance(p, str) and not p.lstrip().startswith("<"):
                texts.append(p)
            continue
        if d.get("isSidechain") or d.get("isCompactSummary"):
            continue  # 서브에이전트 대화와 압축 요약은 사용자 지시가 아니다
        if d.get("type") != "user" or d.get("isMeta"):
            continue
        c = (d.get("message") or {}).get("content")
        if isinstance(c, list):
            if any(isinstance(x, dict) and x.get("type") == "tool_result" for x in c):
                continue
            c = " ".join(x.get("text", "") for x in c if isinstance(x, dict) and x.get("type") == "text")
        if not isinstance(c, str) or c.lstrip().startswith("<"):
            continue
        texts.append(c)
        break  # 마지막 프롬프트까지만 (그 앞 턴의 지시는 보지 않는다)
    return "\n".join(texts)


def is_make_dry_run(seg):
    """make 를 -n/--dry-run/--just-print 로 부르는 한 명령인지 토큰으로 본다. 치환·주석이 있으면 아니다."""
    if re.search(r"\$\(|`|#", seg):
        return False
    try:
        toks = shlex.split(seg)
    except ValueError:
        return False
    while toks and re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", toks[0]):
        toks = toks[1:]  # 앞의 환경 변수 대입
    if not toks or os.path.basename(toks[0]) not in ("make", "gmake"):
        return False
    takes_arg = {"-C", "-f", "-I", "-o", "-W", "-j", "-l", "-E", "--eval", "--directory", "--file", "--makefile",
                 "--include-dir", "--old-file", "--assume-old", "--what-if", "--new-file", "--assume-new"}
    args = toks[1:]
    if "--" in args:
        args = args[:args.index("--")]  # -- 뒤는 옵션이 아니라 대상이다
    # 단독 -n 류만 인정하고, 인자를 받는 옵션 바로 뒤의 -n 은 그 옵션의 값이라 인정하지 않는다
    return any(t in ("-n", "--dry-run", "--just-print", "--recon") and (i == 0 or args[i - 1] not in takes_arg)
               for i, t in enumerate(args))


def mentions(prompt, keywords):
    low = (prompt or "").lower()
    return any(k.lower() in low for k in keywords)


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


# --------------------------------------------------------------------------
# 역할 게이트: role_owners 의 경로는 지정된 서브에이전트(agent_type)만 쓴다.
# 메인 세션의 도구 호출에는 agent_type 이 없다. 사람이 세션을 띄울 때
# SDLC_ROLE_GATE=0 을 주면 끈다 (Claude 의 Bash 로는 바꿀 수 없다).
# --------------------------------------------------------------------------
WRITE_VERB_RE = re.compile(
    r"(?:^|[\s;&|(])(?:sed\s+(?:-[a-zA-Z]*i|--in-place)|tee|mv|cp|rm|rmdir|touch|truncate|patch|install|"
    r"perl\s+-[a-zA-Z]*i)\b|\bgit\s+(?:apply|am)\b|\.write\(|writeFile|write_text|write_bytes|"
    r"open\([^)]*,\s*['\"][wax]"
)
REDIRECT_RE = re.compile(r"(?<![0-9&])>{1,2}(?!&)\s*([^\s;&|]+)")


def role_gate_enabled():
    return os.environ.get("SDLC_ROLE_GATE", "").strip().lower() not in ("0", "false", "no", "off")


def role_owners_for(rel, cfg):
    for glob, owners in cfg.get("role_owners", {}).items():
        if fnmatch.fnmatch(rel, glob):
            return owners
    return None


def to_rel(path, cwd, root):
    return os.path.relpath(os.path.realpath(os.path.join(cwd or root, path)), os.path.realpath(root))


def bash_role_violation(cmd, cwd, root, cfg, agent_type):
    """Bash 명령이 역할 소유 경로를 고치면 (경로, 소유자) 를 돌려준다."""
    try:
        tokens = shlex.split(cmd, posix=True)
    except ValueError:
        tokens = re.split(r"[\s'\"]+", cmd)
    candidates = set()
    for tok in tokens:
        for part in re.split(r"[;&|()<>=,'\"\[\]{}]", tok):
            part = part.strip()
            if part and ("/" in part or "." in part) and not part.startswith("-"):
                candidates.add(part)
    # 패치 적용은 내용이 어느 파일을 고치는지 명령만으로 알 수 없어 implementer 만 허용한다
    # 명령 위치(줄·&&·;·| 로 나눈 각 구간의 맨 앞)에서 실행될 때만 본다. 문자열 안의 단어는 무시한다.
    segments = [seg.strip() for seg in re.split(r"\n|&&|\|\||;|\|", cmd)]
    if agent_type != "implementer" and any(
        re.match(r"^(?:sudo\s+)?(?:git\s+(?:-C\s+\S+\s+)?(?:apply|am)\b|patch\s)", seg) for seg in segments
    ):
        return "(패치 적용)", ["implementer"]
    redirect_targets = {m.group(1).strip("'\"") for m in REDIRECT_RE.finditer(cmd)}
    has_verb = bool(WRITE_VERB_RE.search(cmd))
    for cand in candidates | redirect_targets:
        rel = to_rel(cand, cwd, root)
        owners = role_owners_for(rel, cfg)
        if not owners or agent_type in owners:
            continue
        if cand in redirect_targets or has_verb:
            return rel, owners
    return None


def role_deny(rel, owners, agent_type):
    who = f"`{agent_type}` 서브에이전트" if agent_type else "메인 세션"
    deny(f"역할 게이트: `{rel}` 는 {', '.join(owners)} 서브에이전트가 쓴다. {who}은(는) 직접 고치지 않는다. "
         f"Agent 도구로 `{owners[0]}` 를 불러 맡긴다 (사람이 끄려면 세션을 SDLC_ROLE_GATE=0 으로 띄운다).")


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
    agent_type = data.get("agent_type")
    gate_roles = role_gate_enabled()

    if tool == "Bash":
        cmd = ti.get("command", "")
        if gate_roles:
            hit = bash_role_violation(cmd, data.get("cwd"), root, cfg, agent_type)
            if hit:
                role_deny(hit[0], hit[1], agent_type)
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
        if not os.environ.get("RELEASE_APPROVAL"):
            # 게이트는 Claude 가 스스로 판단해 하는 위험 동작을 막는다. 사용자가 이번 턴에 지시했으면 통과한다.
            override = cfg.get("user_override_keywords", {})
            prompt = None  # 필요할 때 한 번만 읽는다
            for pat in cfg.get("deploy_patterns", []):
                if fnmatch.fnmatch(cmd.strip(), pat):
                    prompt = current_user_prompt(data) if prompt is None else prompt
                    if not mentions(prompt, override.get("deploy_patterns", [])):
                        deny(f"프로덕션 게이트: `{pat}` 는 Claude 가 스스로 판단해 실행하지 않는다. 사용자가 지시하면(이번 메시지에 "
                             f"{override.get('deploy_patterns', [])} 중 하나) 통과한다. 또는 RELEASE_APPROVAL 세션.")
            for seg, pat in ((s.strip(), p) for s in re.split(r"\n|&&|\|\||;|\||&", cmd)
                             for p in cfg.get("destructive_patterns", [])):
                if is_make_dry_run(seg):
                    continue  # make -n 은 레시피를 출력만 하고 실행하지 않는다
                if fnmatch.fnmatch(seg, pat):
                    prompt = current_user_prompt(data) if prompt is None else prompt
                    if not mentions(prompt, override.get("destructive_patterns", [])):
                        deny(f"데이터 삭제 게이트: `{pat}` 는 수집 데이터를 지운다. Claude 가 스스로 판단해 실행하지 않는다. "
                             f"사용자가 지시하면(이번 메시지에 {override.get('destructive_patterns', [])} 중 하나) 통과한다. 또는 RELEASE_APPROVAL 세션.")
        return

    path = ti.get("file_path") or ti.get("notebook_path")
    if not path:
        return
    rel = os.path.relpath(os.path.realpath(os.path.join(data.get("cwd") or root, path)), os.path.realpath(root))
    if gate_roles:
        owners = role_owners_for(rel, cfg)
        if owners and agent_type not in owners:
            role_deny(rel, owners, agent_type)
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
    if role_gate_enabled() and cfg.get("role_owners"):
        pairs = "; ".join(f"{g} → {', '.join(o)}" for g, o in cfg["role_owners"].items())
        print(f"[SDLC] 역할 게이트 켜짐: 메인 세션은 아래 경로를 직접 쓰지 않고 서브에이전트에 맡긴다. {pairs}")
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
