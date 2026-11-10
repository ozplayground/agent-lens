"""API 오류 응답 형식과 전역 처리기.

모든 오류 응답은 {"error_code": "ERR_...", "message": "<한국어 문장>", "details": <객체|배열|null>} 이다.
- 요청 검증 실패(FastAPI `RequestValidationError`) → 400 `ERR_INVALID_PAYLOAD`, details 는 [{"loc", "msg"}]
- `HTTPException` → 같은 상태 코드. `ApiError` 면 그 코드, 아니면 상태별 기본 코드
- 처리 못 한 예외 → 500 `ERR_SERVER_INTERNAL`, 고정 문장 (예외 내용은 로그에만 남긴다)
"""
import logging
from http import HTTPStatus
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("agentlens.api")

# 상태별 기본 코드와 문장 (라우터가 코드를 정하지 않았을 때)
DEFAULT_ERRORS = {
    400: ("ERR_INVALID_PAYLOAD", "요청 형식이 올바르지 않습니다."),
    404: ("ERR_NOT_FOUND", "요청한 대상을 찾을 수 없습니다."),
    405: ("ERR_METHOD_NOT_ALLOWED", "허용되지 않는 요청 방식입니다."),
    409: ("ERR_CONFLICT", "현재 상태에서 처리할 수 없는 요청입니다."),
    500: ("ERR_SERVER_INTERNAL", "서버 내부 처리 중 오류가 발생했습니다."),
    502: ("ERR_UPSTREAM_FAILED", "외부 서비스 호출에 실패했습니다."),
    503: ("ERR_SERVICE_UNAVAILABLE", "지금은 이 기능을 사용할 수 없습니다."),
}


def _default_for(status: int) -> tuple:
    if status in DEFAULT_ERRORS:
        return DEFAULT_ERRORS[status]
    return DEFAULT_ERRORS[500] if status >= 500 else DEFAULT_ERRORS[400]


def error_response(status: int, code: str, message: str, details: Any = None) -> JSONResponse:
    return JSONResponse(status_code=status, content={"error_code": code, "message": message, "details": details})


class ApiError(HTTPException):
    """라우터가 구체 오류 코드를 정해 던지는 HTTPException."""

    def __init__(self, status: int, code: Optional[str] = None, message: Optional[str] = None, details: Any = None):
        default_code, default_message = _default_for(status)
        super().__init__(status_code=status, detail=message or default_message)
        self.error_code = code or default_code
        self.details = details


async def _http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    default_code, default_message = _default_for(exc.status_code)
    detail = exc.detail
    # detail 을 주지 않은 HTTPException 은 영문 상태 문구가 detail 이다 → 한국어 기본 문장
    if not isinstance(detail, str) or not detail or detail == HTTPStatus(exc.status_code).phrase:
        detail = default_message
    response = error_response(
        exc.status_code,
        getattr(exc, "error_code", None) or default_code,
        detail,
        getattr(exc, "details", None),
    )
    if exc.headers:
        response.headers.update(exc.headers)
    return response


async def _validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    details = [{"loc": list(err.get("loc", ())), "msg": str(err.get("msg", ""))} for err in exc.errors()]
    code, message = DEFAULT_ERRORS[400]
    return error_response(400, code, message, details)


async def _unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    code, message = DEFAULT_ERRORS[500]
    return error_response(500, code, message)


# 런타임 OpenAPI(/docs)에 보이는 오류 응답 형식 (ADR Q13)
ERROR_RESPONSE_SCHEMA = {
    "title": "ErrorResponse",
    "type": "object",
    "required": ["error_code", "message"],
    "properties": {
        "error_code": {"type": "string", "examples": ["ERR_INVALID_PAYLOAD"]},
        "message": {"type": "string"},
        "details": {"description": "검증 실패면 [{loc, msg}] 배열, 그 밖에는 객체 또는 null"},
    },
}


def _install_openapi(app: FastAPI) -> None:
    """FastAPI 기본 422 검증 응답을 실제 응답(400 ErrorResponse)으로 바꿔 보인다."""

    def openapi() -> dict:
        if app.openapi_schema:
            return app.openapi_schema
        schema = get_openapi(
            title=app.title, version=app.version, openapi_version=app.openapi_version,
            description=app.description, routes=app.routes, tags=app.openapi_tags, servers=app.servers,
        )
        components = schema.setdefault("components", {}).setdefault("schemas", {})
        components.pop("HTTPValidationError", None)
        components.pop("ValidationError", None)
        components["ErrorResponse"] = ERROR_RESPONSE_SCHEMA
        for item in schema.get("paths", {}).values():
            for op in item.values():
                responses = op.get("responses", {})
                if responses.pop("422", None) is not None:
                    responses.setdefault("400", {
                        "description": "요청 검증 실패 (ERR_INVALID_PAYLOAD)",
                        "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}}},
                    })
        app.openapi_schema = schema
        return schema

    app.openapi = openapi


def install_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(StarletteHTTPException, _http_exception_handler)
    app.add_exception_handler(RequestValidationError, _validation_exception_handler)
    app.add_exception_handler(Exception, _unhandled_exception_handler)
    _install_openapi(app)
