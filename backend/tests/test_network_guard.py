"""테스트 실행 중 외부 네트워크(스크래퍼·Notion·웹훅·피드 탐침)와 SMTP 가 실제로 나가지 않는지 (TEST-03).

- 흉내가 없는 외부 호스트 요청은 보내지 않고 `ConnectError` 를 내며 기록한다. 기록이 남으면 그 테스트는 실패한다.
- 테스트는 `fake_llm.register_web(url, ...)` 으로 외부 응답을 흉내 낸다.
- `smtplib.SMTP`·`SMTP_SSL` 은 흉내 서버로 바뀌어 연결·발송을 기록만 한다.
- 테스트가 띄우고 기다리지 않은 asyncio 태스크는 테스트가 끝날 때 취소된다.
"""
import asyncio
import smtplib

import httpx
import pytest


async def test_external_http_request_is_blocked_and_recorded(fake_llm):
    async with httpx.AsyncClient() as client:
        with pytest.raises(httpx.ConnectError):
            await client.get("https://example.com/some-article")
    assert fake_llm.take_blocked_external() == ["GET https://example.com/some-article"]


def test_external_sync_http_request_is_blocked_and_recorded(fake_llm):
    with httpx.Client() as client:
        with pytest.raises(httpx.ConnectError):
            client.get("https://api.notion.com/v1/users/me")
    assert fake_llm.take_blocked_external() == ["GET https://api.notion.com/v1/users/me"]


async def test_registered_web_fake_answers_external_request(fake_llm):
    fake_llm.register_web("https://example.com/feed.xml", text="<rss></rss>", content_type="application/rss+xml")
    async with httpx.AsyncClient() as client:
        res = await client.get("https://example.com/feed.xml")
    assert res.status_code == 200
    assert res.text == "<rss></rss>"
    assert res.headers["content-type"] == "application/rss+xml"
    assert fake_llm.take_blocked_external() == []
    assert [r.url for r in fake_llm.requests(provider="web")] == ["https://example.com/feed.xml"]


async def test_loopback_requests_are_not_blocked(fake_llm):
    # 로컬 스텁 서버(scripts/collect.py 테스트)는 막지 않는다: 연결 거부는 실제 전송에서 난다
    async with httpx.AsyncClient() as client:
        with pytest.raises(httpx.ConnectError):
            await client.get("http://127.0.0.1:9/")
    assert fake_llm.take_blocked_external() == []


def test_smtp_is_faked_and_records_messages(fake_smtp):
    server = smtplib.SMTP("smtp.gmail.com", 587, timeout=1)
    server.starttls()
    server.login("u@example.com", "pw")
    server.sendmail("from@example.com", ["to@example.com"], "Subject: hi\n\nbody")
    server.quit()
    assert fake_smtp.connections == [("smtp.gmail.com", 587)]
    assert fake_smtp.sent[0]["to"] == ["to@example.com"]


def test_smtp_ssl_is_faked(fake_smtp):
    server = smtplib.SMTP_SSL("smtp.example.com", 465, timeout=1)
    server.quit()
    assert fake_smtp.connections == [("smtp.example.com", 465)]


_LEFTOVER: dict = {}


async def test_background_task_left_running_part1_starts_task():
    async def forever():
        await asyncio.sleep(3600)

    _LEFTOVER["task"] = asyncio.create_task(forever())
    await asyncio.sleep(0)
    assert not _LEFTOVER["task"].done()


def test_background_task_left_running_part2_was_cancelled_at_teardown():
    task = _LEFTOVER.get("task")
    assert task is not None, "part1 이 먼저 돌아야 한다 (같은 파일 안 선언 순서)"
    assert task.cancelled()
