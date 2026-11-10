"""전 API 오류 응답 형식 통일 (SEC-03, CC-01, D-05, D-27).

형식: {"error_code": "ERR_...", "message": "<한국어 문장>", "details": <객체|배열|null>}
- 요청 검증 실패 → 400 ERR_INVALID_PAYLOAD, details 는 [{"loc": [...], "msg": "..."}] (입력값 echo 없음)
- HTTPException → 같은 상태, 라우터가 정한 코드 또는 상태별 기본 코드
- 처리 못 한 예외 → 500 ERR_SERVER_INTERNAL, 고정 문장, 예외 문자열·경로 노출 없음
"""
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


def _client(raise_app_exceptions: bool = True) -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app, raise_app_exceptions=raise_app_exceptions),
                       base_url="http://test")


def _assert_error_shape(data: dict, code: str) -> None:
    assert set(data) == {"error_code", "message", "details"}, data
    assert data["error_code"] == code
    assert isinstance(data["message"], str) and data["message"]
    # 사용자에게 보일 한국어 문장
    assert any("가" <= ch <= "힣" for ch in data["message"]), data["message"]


async def test_body_validation_error_is_400_invalid_payload_without_input_echo():
    secret = "SECRET-INPUT-VALUE"
    async with _client() as ac:
        r = await ac.post("/api/webhook/test", json={"provider": secret})  # webhook_url 누락
    assert r.status_code == 400
    data = r.json()
    _assert_error_shape(data, "ERR_INVALID_PAYLOAD")
    assert isinstance(data["details"], list) and data["details"]
    for d in data["details"]:
        assert set(d) == {"loc", "msg"}
        assert isinstance(d["loc"], list)
    assert ["body", "webhook_url"] in [d["loc"] for d in data["details"]]
    assert secret not in r.text


async def test_query_validation_error_is_400_invalid_payload():
    async with _client() as ac:
        r = await ac.get("/api/news?page=0")
    assert r.status_code == 400
    data = r.json()
    _assert_error_shape(data, "ERR_INVALID_PAYLOAD")
    assert data["details"][0]["loc"] == ["query", "page"]


async def test_malformed_json_body_is_400_invalid_payload():
    async with _client() as ac:
        r = await ac.post("/api/webhook/test", content='{"webhook_url": ', headers={"content-type": "application/json"})
    assert r.status_code == 400
    _assert_error_shape(r.json(), "ERR_INVALID_PAYLOAD")


async def test_unknown_route_is_404_not_found_in_korean():
    async with _client() as ac:
        r = await ac.get("/api/does-not-exist")
    assert r.status_code == 404
    data = r.json()
    _assert_error_shape(data, "ERR_NOT_FOUND")
    assert data["details"] is None


async def test_wrong_method_is_405_method_not_allowed():
    async with _client() as ac:
        r = await ac.put("/api/stats")
    assert r.status_code == 405
    _assert_error_shape(r.json(), "ERR_METHOD_NOT_ALLOWED")


async def test_http_exception_keeps_status_and_message():
    async with _client() as ac:
        r = await ac.post("/api/webhook/test", json={"webhook_url": "ftp://example.com/hook"})
    assert r.status_code == 400
    data = r.json()
    _assert_error_shape(data, "ERR_INVALID_PAYLOAD")
    assert data["message"] == "유효한 HTTP/HTTPS 웹훅 URL을 입력해주세요."
    assert data["details"] is None


async def test_unhandled_exception_is_500_without_exception_text(monkeypatch):
    from app.services.briefing_service import briefing_service

    async def boom(*args, **kwargs):
        raise RuntimeError("boom [SQL: SELECT secret FROM t] /Users/someone/agentlens/backend")

    monkeypatch.setattr(briefing_service, "generate_daily_briefing", boom)
    async with _client(raise_app_exceptions=False) as ac:
        r = await ac.get("/api/briefing/today")
    assert r.status_code == 500
    data = r.json()
    _assert_error_shape(data, "ERR_SERVER_INTERNAL")
    assert data["details"] is None
    for leak in ("boom", "SQL", "/Users", "RuntimeError", "Traceback"):
        assert leak not in r.text


async def test_router_error_code_is_kept(monkeypatch):
    """라우터가 정한 구체 코드(ERR_SESSION_NOT_FOUND)는 통일 형식에서도 그대로다."""
    async with _client() as ac:
        r = await ac.get("/api/chat/sessions/6b1f0c1e-0000-4000-8000-000000000000")
    assert r.status_code == 404
    _assert_error_shape(r.json(), "ERR_SESSION_NOT_FOUND")


async def test_sources_file_is_file_name_only():
    async with _client() as ac:
        r = await ac.get("/api/sources")
    assert r.status_code == 200
    name = r.json()["sources_file"]
    assert name == "sources.json"
    assert "/" not in name and "\\" not in name


@pytest.mark.parametrize("method,path", [("get", "/api/mcp/info"), ("post", "/api/briefing/generate"),
                                         ("post", "/api/webhook/send-briefing")])
async def test_unused_endpoints_are_removed(method, path):
    """화면·스크립트·MCP 서버 어디서도 부르지 않는 엔드포인트는 지웠다 (CC-02 C 조 몫, CC-05)."""
    async with _client() as ac:
        r = await getattr(ac, method)(path)
    assert r.status_code in (404, 405)
    assert r.json()["error_code"] in ("ERR_NOT_FOUND", "ERR_METHOD_NOT_ALLOWED")


async def test_notion_failure_message_has_no_exception_text(monkeypatch, fake_llm):
    """Notion 네트워크 오류는 고정 문장으로 알리고 예외 문자열을 싣지 않는다."""
    from app.services.notion_service import notion_service
    ok, msg = await notion_service.test_connection(api_key="secret_fake", page_id="")
    fake_llm.take_blocked_external()
    assert ok is False
    assert "blocked" not in msg and "api.notion.com" not in msg
    assert msg == "Notion API 에 연결하지 못했습니다. 네트워크 상태를 확인해주세요."


async def test_smtp_failure_message_has_no_exception_text(fake_smtp):
    from app.services.email_service import email_service
    fake_smtp.fail_with = OSError("[Errno 61] Connection refused /Users/someone/secret")
    ok, msg = await email_service.test_connection(host="smtp.example.com", port=587, user="u@example.com",
                                                  password="pw", use_tls=True, to_email="to@example.com")
    assert ok is False
    assert "Errno" not in msg and "/Users" not in msg
    assert msg == "이메일 전송 중 오류가 발생했습니다. SMTP 설정을 확인해주세요."


async def test_webhook_failure_message_has_no_exception_text(fake_llm):
    from app.services.webhook_service import webhook_service
    ok, msg = await webhook_service.send_payload("https://hooks.slack.com/services/T000/B000/XXX", {"text": "x"})
    fake_llm.take_blocked_external()
    assert ok is False
    assert "blocked" not in msg and "hooks.slack.com" not in msg
    assert msg == "웹훅 서버에 연결하지 못했습니다. URL 과 네트워크 상태를 확인해주세요."


@pytest.mark.parametrize("method,path,service_method,code", [
    ("get", "/api/chat/sessions", "list_sessions", "ERR_SERVER_INTERNAL"),
    ("get", "/api/chat/sessions/6b1f0c1e-0000-4000-8000-000000000001", "get_session_detail", "ERR_SERVER_INTERNAL"),
    ("delete", "/api/chat/sessions/6b1f0c1e-0000-4000-8000-000000000001", "delete_session", "ERR_SESSION_DELETE_FAILED"),
])
async def test_chat_session_errors_hide_exception_text(monkeypatch, method, path, service_method, code):
    from app.services.chat_session_service import ChatSessionService

    async def boom(*args, **kwargs):
        raise RuntimeError("(sqlite3.OperationalError) database is locked [SQL: DELETE FROM chat_sessions]")

    monkeypatch.setattr(ChatSessionService, service_method, boom)
    async with _client() as ac:
        r = await getattr(ac, method)(path)
    assert r.status_code == 500
    _assert_error_shape(r.json(), code)
    assert "sqlite3" not in r.text and "SQL" not in r.text


async def test_chat_session_delete_failed_exception_hides_db_text(monkeypatch):
    from app.services.chat_session_service import ChatSessionService, SessionDeleteFailedException

    async def fail(*args, **kwargs):
        raise SessionDeleteFailedException("(sqlite3.IntegrityError) FOREIGN KEY constraint failed [SQL: DELETE]")

    monkeypatch.setattr(ChatSessionService, "delete_session", fail)
    async with _client() as ac:
        r = await ac.delete("/api/chat/sessions/6b1f0c1e-0000-4000-8000-000000000002")
    assert r.status_code == 500
    _assert_error_shape(r.json(), "ERR_SESSION_DELETE_FAILED")
    assert "sqlite3" not in r.text


def test_chat_router_has_no_model_query_and_no_repeated_error_blocks():
    """chat 라우터는 기사 존재 확인을 서비스에 맡기고(ARCH-01), 오류 응답은 헬퍼로 만든다(CC-01)."""
    import inspect
    import app.api.chat as chat_api
    src = inspect.getsource(chat_api)
    assert "db.get(" not in src and "NewsItem" not in src
    assert '"error_code":' not in src  # JSONResponse 오류 블록 반복 없음


async def test_error_response_model_matches_real_bodies():
    """계약 모델 ErrorResponse 가 실제 오류 본문(검증 오류의 배열 details 포함)을 그대로 받는다."""
    from app.schemas.chat import ErrorResponse
    async with _client() as ac:
        bodies = [
            (await ac.get("/api/news?page=0")).json(),          # details: [{loc, msg}]
            (await ac.get("/api/does-not-exist")).json(),       # details: null
        ]
    for body in bodies:
        assert ErrorResponse.model_validate(body).model_dump() == body
    assert ErrorResponse.model_validate({"error_code": "ERR_INVALID_PAYLOAD", "message": "m",
                                         "details": {"message_ids": ["a"]}}).details == {"message_ids": ["a"]}
