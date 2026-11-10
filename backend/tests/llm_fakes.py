"""LLM 흉내 전송 계층 (테스트 전용).

`httpx` 의 기본 전송(`HTTPTransport.handle_request`, `AsyncHTTPTransport.handle_async_request`)을
감싸, LLM 호스트로 가는 요청은 등록된 흉내가 응답하고 그 밖의 호스트는 원래 전송으로 넘긴다.
openai SDK 는 `httpx2` 의 전송을 쓰므로 `httpx2` 가 있으면 같은 방식으로 감싼다.

- LLM 호스트: api.anthropic.com, api.openai.com, generativelanguage.googleapis.com,
  포트 11434 인 모든 호스트, `register_ollama` 로 등록한 주소.
- 흉내가 등록되지 않은 LLM 호스트 요청은 실제로 보내지 않고 `ConnectError` 를 내며
  `unmocked` 목록에 남긴다 (가드).
- LLM 이 아닌 외부 호스트(스크래퍼·Notion·웹훅·피드 탐침 대상)는 `register_web` 으로 등록한 URL 만
  흉내가 답한다. 등록되지 않은 외부 요청은 보내지 않고 `ConnectError` 를 내며 `blocked_external` 에 남긴다
  (네트워크 가드, TEST-03). 루프백(127.0.0.1, localhost, ::1)은 실제 전송으로 넘긴다.
- `ASGITransport` 와 `httpx.AsyncClient.post`·`.stream` 을 직접 patch 하는 테스트는
  이 계층을 거치지 않는다.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

import httpx

try:  # openai SDK 의 전송 계층
    import httpx2  # type: ignore
except Exception:  # pragma: no cover - httpx2 가 없는 환경
    httpx2 = None  # type: ignore


ANTHROPIC_HOST = "api.anthropic.com"
OPENAI_HOST = "api.openai.com"
GEMINI_HOST = "generativelanguage.googleapis.com"
OLLAMA_DEFAULT_PORT = 11434
LOOPBACK_HOSTS = ("127.0.0.1", "localhost", "::1", "[::1]")

# 흉내 고정 답 (한국어 마크다운, 중괄호 없음). 기존 단언에 맞춰 고르지 않는다.
FAKE_CLAUDE_ANSWER = (
    "### 흉내 Claude 답변\n\n"
    "이 답은 테스트 하네스의 흉내 Claude 가 돌려준 고정 문장입니다. 실제 Anthropic API 는 호출하지 않았습니다."
)
FAKE_OPENAI_ANSWER = "흉내 OpenAI 답변입니다. 실제 OpenAI API 는 호출하지 않았습니다."
FAKE_OLLAMA_ANSWER = "흉내 Ollama 답변입니다. 실제 Ollama 서버는 호출하지 않았습니다."

# 흉내 기사 페이지 (스크래퍼 본문 추출이 500자 이상을 얻는 HTML)
FAKE_ARTICLE_TEXT = " ".join(
    f"Paragraph {i}: this fake article explains the agent harness architecture, tool calling protocol, "
    "and evaluation workflow in enough detail for the scraper to extract real body text."
    for i in range(1, 9)
)
FAKE_ARTICLE_HTML = (
    "<html><head><title>Fake Article</title></head><body><article><h1>Fake Article</h1>"
    + "".join(f"<p>{part}.</p>" for part in FAKE_ARTICLE_TEXT.split(". "))
    + "</article></body></html>"
)

# 흉내 Atom 피드 (feedparser 가 항목 2개를 읽는다)
FAKE_ATOM_FEED = """<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Fake Releases</title>
  <link href="https://github.com/example/repo/releases"/>
  <updated>2026-11-01T00:00:00Z</updated>
  <id>tag:github.com,2008:fake</id>
  <entry>
    <id>tag:github.com,2008:fake/1</id>
    <title>v1.0.0 agent harness evaluation release</title>
    <link href="https://github.com/example/repo/releases/tag/v1.0.0"/>
    <updated>2026-11-01T00:00:00Z</updated>
    <content type="html">Adds agent benchmark harness, MCP tool server and LLM evaluation sandbox.</content>
  </entry>
  <entry>
    <id>tag:github.com,2008:fake/2</id>
    <title>v0.9.0 MCP tool calling improvements</title>
    <link href="https://github.com/example/repo/releases/tag/v0.9.0"/>
    <updated>2026-10-20T00:00:00Z</updated>
    <content type="html">Improves agent tool calling and model context protocol support.</content>
  </entry>
</feed>
"""


def _chunks(text: str, n: int = 3) -> List[str]:
    """텍스트를 이어 붙이면 원문이 되는 조각 n 개로 나눈다."""
    size = max(1, -(-len(text) // n))
    return [text[i:i + size] for i in range(0, len(text), size)]


def _normalize_model(name: str) -> str:
    name = (name or "").strip()
    return name if ":" in name else f"{name}:latest"


@dataclass
class RecordedRequest:
    provider: str
    method: str
    url: str
    path: str
    body: Any
    timeout: Any


@dataclass
class _OllamaServer:
    state: str  # "up" | "down"
    models: List[str] = field(default_factory=list)


class FakeLLM:
    """흉내 LLM 서버 묶음과 요청 기록."""

    def __init__(self) -> None:
        self.claude_enabled = True
        # 흉내 Claude 스트림 끝 모양: stop_reason 값, 또는 첫 조각 뒤에 보낼 SSE error 이벤트의 error 객체
        self.claude_stream_stop_reason = "end_turn"
        self.claude_stream_error: Optional[Dict[str, Any]] = None
        # 흉내 Claude 비스트림 응답의 stop_reason (N-05)
        self.claude_message_stop_reason = "end_turn"
        self.openai_enabled = False
        self._ollama: Dict[Tuple[str, int], _OllamaServer] = {}
        self._requests: List[RecordedRequest] = []
        self.unmocked: List[str] = []
        # 외부(LLM 아닌) 흉내: URL(쿼리 제외) → (status, text, content_type)
        self._web: Dict[str, Tuple[int, str, str]] = {}
        self.blocked_external: List[str] = []

    # ---- 등록 ----
    def register_claude(self) -> None:
        self.claude_enabled = True

    def unregister_claude(self) -> None:
        self.claude_enabled = False

    def register_openai(self) -> None:
        self.openai_enabled = True

    def register_web(self, url: str, status: int = 200, text: str = "", content_type: str = "text/html") -> None:
        """LLM 이 아닌 외부 URL 의 흉내 응답을 등록한다 (메서드 무관, 쿼리 문자열은 보지 않는다)."""
        self._web[_web_key(httpx.URL(url))] = (status, text, content_type)

    def register_ollama(self, base_url: str, state: str = "up", models: Optional[List[str]] = None) -> None:
        if state not in ("up", "down"):
            raise ValueError(f"unknown ollama state: {state}")
        url = httpx.URL(base_url)
        port = url.port or (443 if url.scheme == "https" else 80)
        self._ollama[(url.host, port)] = _OllamaServer(state=state, models=list(models or []))

    # ---- 조회 ----
    def requests(self, provider: Optional[str] = None, path: Optional[str] = None) -> List[RecordedRequest]:
        return [
            r for r in self._requests
            if (provider is None or r.provider == provider) and (path is None or r.path == path)
        ]

    def assert_no_unmocked(self) -> None:
        if self.unmocked:
            raise AssertionError(
                "흉내가 등록되지 않은 LLM 요청이 있었다 (LLM test guard): " + ", ".join(self.unmocked)
            )

    def take_unmocked(self) -> List[str]:
        taken, self.unmocked = self.unmocked, []
        return taken

    def assert_no_blocked_external(self) -> None:
        if self.blocked_external:
            raise AssertionError(
                "흉내가 등록되지 않은 외부 네트워크 요청이 있었다 (network test guard, register_web 으로 흉내 낸다): "
                + ", ".join(self.blocked_external)
            )

    def take_blocked_external(self) -> List[str]:
        taken, self.blocked_external = self.blocked_external, []
        return taken

    # ---- 외부(LLM 아닌) 요청 ----
    @staticmethod
    def is_loopback(request: Any) -> bool:
        return request.url.host in LOOPBACK_HOSTS

    def handle_web(self, request: Any, mod: Any) -> Any:
        desc = f"{request.method.upper()} {request.url}"
        found = self._web.get(_web_key(request.url))
        if found is None:
            self.blocked_external.append(desc)
            raise mod.ConnectError(f"blocked by network test guard: {desc}", request=request)
        status, text, content_type = found
        self._requests.append(RecordedRequest("web", request.method.upper(), str(request.url),
                                              request.url.path, None, None))
        return self._text(mod, request, status, text, content_type)

    # ---- 분류 ----
    def _classify(self, url: Any) -> Optional[str]:
        """LLM 호스트면 provider 이름, 아니면 None."""
        host = url.host
        port = url.port or (443 if url.scheme == "https" else 80)
        if host == ANTHROPIC_HOST:
            return "claude"
        if host == OPENAI_HOST:
            return "openai"
        if host == GEMINI_HOST:
            return "gemini"
        if (host, port) in self._ollama or port == OLLAMA_DEFAULT_PORT:
            return "ollama"
        return None

    def is_llm_request(self, request: Any) -> bool:
        return self._classify(request.url) is not None

    # ---- 응답 ----
    def handle(self, request: Any, mod: Any) -> Any:
        """`mod` 는 httpx 또는 httpx2 모듈. 그 모듈의 Response 를 돌려주거나 ConnectError 를 낸다."""
        provider = self._classify(request.url)
        method = request.method.upper()
        path = request.url.path
        try:
            raw = request.content
        except Exception:
            raw = b""
        body: Any = None
        if raw:
            try:
                body = json.loads(raw)
            except Exception:
                body = raw
        timeout = request.extensions.get("timeout") if hasattr(request, "extensions") else None
        desc = f"{method} {request.url}"

        registered = (
            (provider == "claude" and self.claude_enabled)
            or (provider == "openai" and self.openai_enabled)
            or (provider == "ollama" and self._ollama_server(request.url) is not None)
        )
        if not registered:
            self.unmocked.append(desc)
            raise mod.ConnectError(f"blocked by LLM test guard: {desc}", request=request)

        self._requests.append(RecordedRequest(provider, method, str(request.url), path, body, timeout))

        if provider == "claude":
            return self._claude(request, mod, method, path, body)
        if provider == "openai":
            return self._openai(request, mod, method, path, body)
        return self._ollama_respond(request, mod, method, path, body)

    def _ollama_server(self, url: Any) -> Optional[_OllamaServer]:
        port = url.port or (443 if url.scheme == "https" else 80)
        return self._ollama.get((url.host, port))

    @staticmethod
    def _json(mod: Any, request: Any, status: int, data: Any) -> Any:
        return mod.Response(
            status,
            headers={"content-type": "application/json"},
            content=json.dumps(data, ensure_ascii=False).encode("utf-8"),
            request=request,
        )

    @staticmethod
    def _text(mod: Any, request: Any, status: int, text: str, content_type: str) -> Any:
        return mod.Response(
            status,
            headers={"content-type": content_type},
            content=text.encode("utf-8"),
            request=request,
        )

    def _claude(self, request: Any, mod: Any, method: str, path: str, body: Any) -> Any:
        if method != "POST" or path != "/v1/messages" or not isinstance(body, dict):
            return self._json(mod, request, 404, {"type": "error", "error": {"type": "not_found_error"}})
        model = body.get("model", "")
        if body.get("stream"):
            events = [
                ("message_start", {
                    "type": "message_start",
                    "message": {"id": "msg_fake", "type": "message", "role": "assistant", "model": model,
                                "content": [], "usage": {"input_tokens": 10, "output_tokens": 1}},
                }),
                ("content_block_start", {"type": "content_block_start", "index": 0,
                                         "content_block": {"type": "text", "text": ""}}),
            ]
            for piece in _chunks(FAKE_CLAUDE_ANSWER):
                events.append(("content_block_delta", {
                    "type": "content_block_delta", "index": 0,
                    "delta": {"type": "text_delta", "text": piece},
                }))
                if self.claude_stream_error is not None:
                    events.append(("error", {"type": "error", "error": self.claude_stream_error}))
                    break
            else:
                events.append(("content_block_stop", {"type": "content_block_stop", "index": 0}))
                events.append(("message_delta", {"type": "message_delta",
                                                 "delta": {"stop_reason": self.claude_stream_stop_reason},
                                                 "usage": {"output_tokens": 20}}))
                events.append(("message_stop", {"type": "message_stop"}))
            sse = "".join(
                f"event: {name}\r\ndata: {json.dumps(data, ensure_ascii=False)}\r\n\r\n" for name, data in events
            )
            return self._text(mod, request, 200, sse, "text/event-stream")
        return self._json(mod, request, 200, {
            "id": "msg_fake",
            "type": "message",
            "role": "assistant",
            "content": [{"type": "text", "text": FAKE_CLAUDE_ANSWER}],
            "model": model,
            "stop_reason": self.claude_message_stop_reason,
            "usage": {"input_tokens": 10, "output_tokens": 20},
        })

    def _openai(self, request: Any, mod: Any, method: str, path: str, body: Any) -> Any:
        if method != "POST" or path != "/v1/chat/completions" or not isinstance(body, dict):
            return self._json(mod, request, 404, {"error": {"message": "not found", "type": "invalid_request_error"}})
        model = body.get("model", "")
        if body.get("stream"):
            lines = []
            for piece in _chunks(FAKE_OPENAI_ANSWER):
                chunk = {
                    "id": "chatcmpl-fake", "object": "chat.completion.chunk", "created": 0, "model": model,
                    "choices": [{"index": 0, "delta": {"content": piece}, "finish_reason": None}],
                }
                lines.append(f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n")
            final = {
                "id": "chatcmpl-fake", "object": "chat.completion.chunk", "created": 0, "model": model,
                "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}],
            }
            lines.append(f"data: {json.dumps(final)}\n\n")
            lines.append("data: [DONE]\n\n")
            return self._text(mod, request, 200, "".join(lines), "text/event-stream")
        return self._json(mod, request, 200, {
            "id": "chatcmpl-fake",
            "object": "chat.completion",
            "created": 0,
            "model": model,
            "choices": [{"index": 0, "message": {"role": "assistant", "content": FAKE_OPENAI_ANSWER},
                         "finish_reason": "stop"}],
            "usage": {"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30},
        })

    def _ollama_respond(self, request: Any, mod: Any, method: str, path: str, body: Any) -> Any:
        server = self._ollama_server(request.url)
        assert server is not None
        if server.state == "down":
            raise mod.ConnectError(f"fake ollama down: {method} {request.url}", request=request)
        installed = [_normalize_model(m) for m in server.models]
        if method == "GET" and path == "/api/tags":
            return self._json(mod, request, 200, {
                "models": [{"name": m, "model": m} for m in server.models],
            })
        if method == "POST" and path == "/api/generate" and isinstance(body, dict):
            model = body.get("model", "")
            if _normalize_model(model) not in installed:
                return self._json(mod, request, 404, {"error": f"model '{model}' not found"})
            if body.get("stream", True):
                lines = [
                    json.dumps({"model": model, "response": piece, "done": False}, ensure_ascii=False)
                    for piece in _chunks(FAKE_OLLAMA_ANSWER)
                ]
                lines.append(json.dumps({"model": model, "response": "", "done": True}))
                return self._text(mod, request, 200, "\n".join(lines) + "\n", "application/x-ndjson")
            return self._json(mod, request, 200, {"model": model, "response": FAKE_OLLAMA_ANSWER, "done": True})
        return self._json(mod, request, 404, {"error": "not found"})


def _web_key(url: Any) -> str:
    return f"{url.scheme}://{url.host}{url.path}"


def _transport_targets() -> List[Any]:
    """감쌀 전송 계층을 가진 모듈 목록 (httpx, 있으면 httpx2)."""
    mods = [httpx]
    if httpx2 is not None:
        mods.append(httpx2)
    return mods


def install(fake: FakeLLM, monkeypatch: Any) -> None:
    """httpx (와 httpx2) 의 기본 전송을 `fake` 로 감싼다. 해제는 monkeypatch 가 한다."""
    for mod in _transport_targets():
        orig_sync = mod.HTTPTransport.handle_request
        orig_async = mod.AsyncHTTPTransport.handle_async_request

        def handle_request(self, request, _orig=orig_sync, _mod=mod):
            if fake.is_llm_request(request):
                request.read()
                return fake.handle(request, _mod)
            if fake.is_loopback(request):
                return _orig(self, request)
            return fake.handle_web(request, _mod)

        async def handle_async_request(self, request, _orig=orig_async, _mod=mod):
            if fake.is_llm_request(request):
                await request.aread()
                return fake.handle(request, _mod)
            if fake.is_loopback(request):
                return await _orig(self, request)
            return fake.handle_web(request, _mod)

        monkeypatch.setattr(mod.HTTPTransport, "handle_request", handle_request)
        monkeypatch.setattr(mod.AsyncHTTPTransport, "handle_async_request", handle_async_request)
