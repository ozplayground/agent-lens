"""트랜잭션 경계 (ARCH-03).

- 스크래퍼는 요청 세션을 중간에 커밋하지 않는다. 본문 캐시(L2)는 자기 세션으로 따로 저장한다.
- 기사·수집 로그 삭제는 서비스 메서드 하나가 한 번 커밋한다 (라우터 커밋 없음).
"""
import hashlib
from datetime import datetime, timezone

import pytest
from sqlalchemy import delete, select

import llm_fakes
from app.database import AsyncSessionLocal
from app.models.news import NewsItem


@pytest.fixture
async def scrape_item():
    url = "https://example.com/arch03/scrape-target"
    async with AsyncSessionLocal() as s:
        s.add(NewsItem(id=9301, title="ARCH03 scrape", url=url, summary="s", source="rss", category="harness",
                       dedup_hash=hashlib.sha256(url.encode()).hexdigest(), published_at=datetime.now(timezone.utc)))
        await s.commit()
    yield url
    async with AsyncSessionLocal() as s:
        await s.execute(delete(NewsItem).where(NewsItem.id == 9301))
        await s.commit()


async def test_scraper_does_not_commit_request_session(scrape_item, fake_llm, monkeypatch):
    from app.services.scraper import ArticleScraperService

    fake_llm.register_web(scrape_item, text=llm_fakes.FAKE_ARTICLE_HTML)
    async with AsyncSessionLocal() as request_session:
        commits = []
        original_commit = request_session.commit

        async def spy_commit():
            commits.append(1)
            await original_commit()

        monkeypatch.setattr(request_session, "commit", spy_commit)
        article = await request_session.get(NewsItem, 9301)
        scraper = ArticleScraperService(request_session)
        ArticleScraperService._l1_cache.pop(scrape_item, None)
        content = await scraper.get_article_content(article)
        assert "fake article" in content
        assert commits == []  # 요청 세션은 스크래퍼가 커밋하지 않는다

    async with AsyncSessionLocal() as s:
        saved = (await s.execute(select(NewsItem.full_content).where(NewsItem.id == 9301))).scalar_one()
    assert saved and "fake article" in saved


async def test_session_upsert_is_one_transaction(monkeypatch):
    """업서트 중 메시지 저장이 실패하면 세션 제목 변경도 남지 않는다 (BUG-02 재현에서 본 부분 커밋)."""
    import uuid
    from app.schemas.chat import ChatSessionCreateRequest
    from app.models.chat_session import ChatSessionModel
    from app.services.chat_session_service import ChatSessionService

    sid = str(uuid.uuid4())
    async with AsyncSessionLocal() as s:
        await ChatSessionService(s).create_or_upsert_session(ChatSessionCreateRequest(id=sid, title="원래 제목"))

    commits = []

    async def boom(self, *args, **kwargs):
        raise RuntimeError("message insert failed")

    monkeypatch.setattr(ChatSessionService, "append_messages_batch", boom)
    async with AsyncSessionLocal() as s:
        original_commit = s.commit

        async def spy_commit():
            commits.append(1)
            await original_commit()

        monkeypatch.setattr(s, "commit", spy_commit)
        req = ChatSessionCreateRequest(id=sid, title="바뀐 제목", messages=[
            {"id": str(uuid.uuid4()), "session_id": sid, "role": "user", "content": "q",
             "created_at": "2026-01-01T00:00:00+00:00"},
        ])
        with pytest.raises(RuntimeError):
            await ChatSessionService(s).create_or_upsert_session(req)
        await s.rollback()
    assert commits == []

    async with AsyncSessionLocal() as s:
        row = await s.get(ChatSessionModel, sid)
        assert row.title == "원래 제목"
        await s.delete(row)
        await s.commit()


async def test_session_upsert_commits_once(monkeypatch):
    import uuid
    from app.schemas.chat import ChatSessionCreateRequest
    from app.models.chat_session import ChatSessionModel
    from app.services.chat_session_service import ChatSessionService

    sid = str(uuid.uuid4())
    async with AsyncSessionLocal() as s:
        commits = []
        original_commit = s.commit

        async def spy_commit():
            commits.append(1)
            await original_commit()

        monkeypatch.setattr(s, "commit", spy_commit)
        req = ChatSessionCreateRequest(id=sid, title="한 번", messages=[
            {"id": str(uuid.uuid4()), "session_id": sid, "role": "user", "content": "q",
             "created_at": "2026-01-01T00:00:00+00:00"},
            {"id": str(uuid.uuid4()), "session_id": sid, "role": "assistant", "content": "a",
             "created_at": "2026-01-01T00:00:01+00:00"},
        ])
        detail = await ChatSessionService(s).create_or_upsert_session(req)
    assert commits == [1]
    assert [m.content for m in detail.messages] == ["q", "a"]
    async with AsyncSessionLocal() as s:
        await s.delete(await s.get(ChatSessionModel, sid))
        await s.commit()
