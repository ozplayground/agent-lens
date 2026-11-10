"""API 응답 시각 형식."""
from datetime import datetime, timezone
from typing import Any, Optional


def iso_utc(value: Any) -> Optional[str]:
    """시각을 UTC 오프셋이 붙은 ISO 문자열로 바꾼다 (N-09).

    SQLite `DateTime` 열은 오프셋 없이 UTC 를 저장하므로 오프셋 없는 값은 UTC 로 본다.
    문자열(원시 SQL 결과)도 받는다. 없으면 None, 해석할 수 없는 문자열은 그대로 돌려준다.
    """
    if value is None or value == "":
        return None
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
        except ValueError:
            return value
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat()
