"""브리핑·Notion·메일·웹훅 문자열 (BUG-15, BUG-16, SEC-07, BUG-21).

- 분야 이름은 프론트 긴 라벨(`frontend/src/lib/labels.ts` CATEGORY_LABELS)과 같다.
- 사용자에게 보내는 문자열에 그림 이모지가 없다.
- 헤드라인·분야 요약은 단어(공백) 경계에서 자르고 `…` 를 붙인다. 한도 안이면 그대로 둔다.
- 메일 HTML 은 수집 문자열을 이스케이프하고 http(s) 가 아닌 링크는 걸지 않는다.
- 설정 저장이 실패하면 메모리 설정과 config.json 이 그대로다.
"""
import json
import re
from pathlib import Path
from types import SimpleNamespace

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
import app.services.briefing_service as bs
from app.services.briefing_service import CATEGORY_DEFS, briefing_service
from app.services.email_service import email_service
from app.services.notion_service import notion_service
from app.services.webhook_service import webhook_service

REPO_ROOT = Path(__file__).resolve().parents[2]

# 그림 이모지 (Misc Symbols·Dingbats·이모지 평면·변형 선택자). ↳ • · 같은 글자 기호는 해당하지 않는다
EMOJI_RE = re.compile("[☀-➿⬀-⯿️\U0001F000-\U0001FAFF]")


def _frontend_category_labels() -> dict:
    text = (REPO_ROOT / "frontend/src/lib/labels.ts").read_text(encoding="utf-8")
    block = re.search(r"export const CATEGORY_LABELS[^=]*=\s*\{(.*?)\}", text, re.S).group(1)
    return dict(re.findall(r"(\w+):\s*'([^']*)'", block))


def _briefing_sample() -> dict:
    return {
        "title": "오늘의 AI 브리핑",
        "date": "2026년 11월 10일",
        "headline": "헤드라인 <script>alert(1)</script>",
        "overview": "• **하네스 & 벤치마크**: 요약 <b>굵게</b>",
        "categories": [{
            "id": "harness", "name": "하네스 & 벤치마크", "icon": "harness", "summary": "분야 <i>요약</i>",
            "items": [
                {"title": 'Evil <img src=x onerror="alert(1)"> title', "url": "javascript:alert(1)",
                 "why_it_matters": "why <u>x</u>", "summary": "", "source": "git<hub>"},
                {"title": "Good title", "url": 'https://example.com/a?x=1&y="2"',
                 "why_it_matters": "", "summary": "sum <s>x</s>", "source": "rss"},
            ],
        }],
        "action_items": ["할 일 <b>1</b>"],
        "markdown_report": "# 오늘의 AI 브리핑",
    }


# ---------------------------------------------------------------- BUG-16

def test_category_names_match_frontend_long_labels():
    labels = _frontend_category_labels()
    assert labels, "labels.ts 의 CATEGORY_LABELS 를 읽지 못했다"
    assert {c["id"]: c["name"] for c in CATEGORY_DEFS} == labels


def test_category_icon_is_key_not_emoji():
    for c in CATEGORY_DEFS:
        assert c["icon"] == c["id"]
        assert not EMOJI_RE.search(c["icon"])


async def test_briefing_markdown_and_fields_have_no_emoji():
    data = await briefing_service.generate_daily_briefing()
    blob = json.dumps(data, ensure_ascii=False)
    assert not EMOJI_RE.findall(blob), EMOJI_RE.findall(blob)
    assert data["markdown_report"].startswith("# 오늘의 AI 브리핑\n")
    assert "## 하네스 & 벤치마크" in data["markdown_report"]


def test_notion_blocks_and_page_have_no_emoji():
    blocks = notion_service._build_blocks(_briefing_sample())
    blob = json.dumps(blocks, ensure_ascii=False)
    assert not EMOJI_RE.findall(blob), EMOJI_RE.findall(blob)
    assert all("icon" not in b.get("callout", {}) for b in blocks)


def test_email_html_has_no_emoji():
    html = email_service._build_html(_briefing_sample())
    assert not EMOJI_RE.findall(html), EMOJI_RE.findall(html)


def test_webhook_payloads_have_no_emoji():
    for provider in ("slack", "discord", "generic"):
        test_blob = json.dumps(webhook_service.build_test_payload(provider), ensure_ascii=False)
        assert not EMOJI_RE.findall(test_blob), (provider, EMOJI_RE.findall(test_blob))
        briefing = {"date": "2026년 11월 10일", "executive_summary": "요약",
                    "top_highlights": [{"title": "t", "url": "https://e.com", "why_it_matters": "w"}]}
        brief_blob = json.dumps(webhook_service.build_briefing_payload(briefing, provider), ensure_ascii=False)
        assert not EMOJI_RE.findall(brief_blob), (provider, EMOJI_RE.findall(brief_blob))


async def test_auto_dispatch_webhook_title_has_no_emoji(monkeypatch):
    from app.config import settings
    sent = []

    async def fake_dispatch(url, payload):
        sent.append(payload)
        return True, "ok"

    monkeypatch.setattr(settings, "NOTION_AUTO_EXPORT", False)
    monkeypatch.setattr(settings, "EMAIL_AUTO_SEND", False)
    monkeypatch.setattr(settings, "SLACK_WEBHOOK_URL", "https://hooks.slack.com/services/x")
    monkeypatch.setattr(settings, "DISCORD_WEBHOOK_URL", "")
    monkeypatch.setattr(webhook_service, "dispatch_briefing", fake_dispatch)
    await briefing_service.auto_dispatch_all()
    assert len(sent) == 1
    assert sent[0]["title"].startswith("오늘의 AI 브리핑")
    assert not EMOJI_RE.findall(json.dumps(sent[0], ensure_ascii=False))


# ---------------------------------------------------------------- BUG-15

def test_clip_words_keeps_short_text_without_ellipsis():
    assert bs.clip_words("짧은 제목", 45) == "짧은 제목"
    assert bs.clip_words("x" * 45, 45) == "x" * 45


def test_clip_words_cuts_at_word_boundary_with_ellipsis():
    text = "Terminal-style Mathematical Modeling Agents for persistent planning"
    out = bs.clip_words(text, 40)
    assert out.endswith("…")
    body = out[:-1]
    assert len(body) <= 40
    assert text.startswith(body)
    assert text[len(body)] == " "  # 단어 중간에서 끊지 않았다
    assert body == "Terminal-style Mathematical Modeling"


def test_clip_words_hard_cuts_single_long_word():
    out = bs.clip_words("a" * 100, 40)
    assert out == "a" * 40 + "…"


def test_category_summary_uses_word_clip():
    title = "Terminal-style Mathematical Modeling Agents for persistent planning and memory"
    item = SimpleNamespace(title=title, why_it_matters="시사점 문장", summary="")
    out = briefing_service._synthesize_category_summary(CATEGORY_DEFS[0], [item])
    assert out == f"'{bs.clip_words(title, 45)}' 등이 주목받으며, 시사점 문장"
    assert "..." not in out

    short = SimpleNamespace(title="Short title", why_it_matters="", summary="요약 " * 40)
    out2 = briefing_service._synthesize_category_summary(CATEGORY_DEFS[0], [short])
    assert out2 == f"'Short title' 관련 소식으로, {bs.clip_words(short.summary, 90)}"
    assert "..." not in out2


def test_headline_uses_word_clip():
    title = "[HF Daily] Terminal-style Mathematical Modeling Agents for persistent planning"
    out = briefing_service._generate_headline([{"items": [{"title": title}]}])
    assert out == f"{bs.clip_words(title, 40)} 및 분야별 핵심 에이전트 기술 동향"
    assert "M..." not in out

    short = briefing_service._generate_headline([{"items": [{"title": "짧은 제목"}]}])
    assert short == "짧은 제목 및 분야별 핵심 에이전트 기술 동향"


# ---------------------------------------------------------------- SEC-07

def test_email_html_escapes_collected_strings_and_blocks_non_http_links():
    html = email_service._build_html(_briefing_sample())
    for raw in ("<script>", "<img src=x", "<b>굵게</b>", "<i>요약</i>", "<u>x</u>", "<s>x</s>", "<b>1</b>", "git<hub>"):
        assert raw not in html, raw
    assert "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;" in html
    assert "&lt;script&gt;alert(1)&lt;/script&gt;" in html
    assert "javascript:" not in html
    assert 'href="https://example.com/a?x=1&amp;y=&quot;2&quot;"' in html


# ---------------------------------------------------------------- BUG-21

async def test_settings_save_failure_keeps_memory_and_file(monkeypatch, tmp_path):
    import app.config as app_config
    from app.config import settings

    config_path = tmp_path / "config.json"
    original = {"briefing": {"notion": {"api_key": "old-key", "page_id": "old"}, "email": {}}, "webhooks": {}}
    config_path.write_text(json.dumps(original), encoding="utf-8")
    monkeypatch.setattr(app_config, "find_config_json", lambda: config_path)
    monkeypatch.setattr(app_config, "_json_data", app_config.load_json_config())

    import app.api.briefing as briefing_api
    monkeypatch.setattr(briefing_api, "save_json_config", lambda data: False)  # 디스크 쓰기 실패
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        r = await ac.post("/api/briefing/settings", json={"notion_page_id": "new-page", "notion_api_key": "new-key"})
    assert r.status_code == 500
    assert r.json()["error_code"] == "ERR_SERVER_INTERNAL"
    assert settings.raw_json_config["briefing"]["notion"] == {"api_key": "old-key", "page_id": "old"}
    assert json.loads(config_path.read_text(encoding="utf-8")) == original


def test_save_json_config_writes_via_temp_file_and_keeps_original_on_failure(monkeypatch, tmp_path):
    import app.config as app_config

    config_path = tmp_path / "config.json"
    config_path.write_text('{"app": {"version": "x"}}', encoding="utf-8")
    monkeypatch.setattr(app_config, "find_config_json", lambda: config_path)
    monkeypatch.setattr(app_config, "_json_data", app_config.load_json_config())

    # 직렬화할 수 없는 값 → 실패해도 원래 파일이 깨지지 않는다
    assert app_config.save_json_config({"bad": {1, 2}}) is False
    assert config_path.read_text(encoding="utf-8") == '{"app": {"version": "x"}}'
    assert not list(tmp_path.glob("*.tmp"))

    assert app_config.save_json_config({"app": {"version": "y"}}) is True
    assert json.loads(config_path.read_text(encoding="utf-8")) == {"app": {"version": "y"}}
    assert not list(tmp_path.glob("*.tmp"))
