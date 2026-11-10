from sqlalchemy import event
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    connect_args = {"timeout": 30.0, "check_same_thread": False}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    connect_args=connect_args,
)

if "sqlite" in settings.DATABASE_URL:
    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA synchronous=NORMAL;")
        cursor.execute("PRAGMA cache_size=-64000;")
        cursor.execute("PRAGMA busy_timeout=30000;")
        cursor.execute("PRAGMA foreign_keys = ON;")
        cursor.close()

AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy import text
from app.services.categorizer import calculate_hotness

logger = logging.getLogger("agentlens.database")


def _columns(connection, table: str) -> list:
    return [row[1] for row in connection.execute(text(f"PRAGMA table_info({table});")).fetchall()]


def _m001_add_v24_columns(connection) -> None:
    """news_items.full_content·scraped_at, chat_messages.model_tier·usage_json (v2.4 이전 DB)."""
    cols = _columns(connection, "news_items")
    if "full_content" not in cols:
        connection.execute(text("ALTER TABLE news_items ADD COLUMN full_content TEXT;"))
    if "scraped_at" not in cols:
        connection.execute(text("ALTER TABLE news_items ADD COLUMN scraped_at DATETIME;"))
    connection.execute(text("CREATE INDEX IF NOT EXISTS ix_news_items_scraped_at ON news_items (scraped_at);"))
    msg_cols = _columns(connection, "chat_messages")
    if "model_tier" not in msg_cols:
        connection.execute(text("ALTER TABLE chat_messages ADD COLUMN model_tier VARCHAR(20);"))
    if "usage_json" not in msg_cols:
        connection.execute(text("ALTER TABLE chat_messages ADD COLUMN usage_json TEXT;"))


def _m002_drop_duplicate_indexes(connection) -> None:
    """PK·복합 인덱스와 겹치는 단일 인덱스를 지운다 (CC-04)."""
    for name in ("ix_news_items_id", "ix_crawl_logs_id", "ix_source_research_logs_id",
                 "ix_chat_sessions_updated_at", "ix_chat_messages_session_id"):
        connection.execute(text(f"DROP INDEX IF EXISTS {name};"))


# 순서대로 한 번씩 적용하고 PRAGMA user_version 에 적용한 개수를 남긴다 (CC-06).
# 단계는 멱등이어야 한다 (user_version 이 없던 옛 DB 는 0 에서 다시 돈다). 새 스키마 변경은 끝에 더한다.
_DT_FMT = "%Y-%m-%d %H:%M:%S.%f"  # SQLAlchemy SQLite DateTime 저장 형식
KST_OFFSET = timedelta(hours=9)
_LEGACY_SEED_URLS = (
    "https://github.com/princeton-nlp/SWE-bench/releases/tag/v2.0",
    "https://www.anthropic.com/news/model-context-protocol",
)


def _db_dt(value) -> Optional[datetime]:
    if value is None or isinstance(value, datetime):
        return value
    return datetime.fromisoformat(str(value))


def _m003_fix_legacy_news_rows(connection) -> None:
    """v0.4.1 이하 수집기가 남긴 행을 v0.4.2 규칙에 맞춘다 (N-11, BUG-18). 업그레이드 때 한 번만 돈다 (user_version). 업그레이드 전 데이터에는 다시 돌려도 결과가 같다.

    1. 국내 RSS(`rss_kr`) 피드(제목 머리 `[피드명]`) 가운데 발행 시각이 수집 시각(created_at)보다 늦은 행이
       하나라도 있는 피드는 +09:00 시각을 벽시계로 저장한 피드다. 그 피드의 행을 모두 9시간 당겨 UTC 로 만든다.
       날짜가 없어 수집 시각(UTC)을 받은 피드나 9시간보다 오래된 글만 있는 피드는 가려낼 수 없어 그대로 둔다.
    2. 옛 합성 지표를 0 으로: RSS 180·150, arXiv 120, HF `댓글 + 40`, GitHub 감시 저장소 폴백
       (URL 이 감시 저장소, 별 = stars_hint, 포크 = int(별 × 0.12)), 시드 2건. 새 수집기는 이 값들을 만들지 않는다.
    3. hotness_score 를 새 식으로 다시 계산한다. 기준 시각은 수집 시각(created_at).
    """
    kst_feeds = [r[0] for r in connection.execute(text(
        "SELECT DISTINCT substr(title, 1, instr(title, ']')) FROM news_items "
        "WHERE source = 'rss_kr' AND instr(title, ']') > 1 AND published_at > created_at"
    )).fetchall()]
    for feed in kst_feeds:
        rows = connection.execute(text(
            "SELECT id, published_at FROM news_items "
            "WHERE source = 'rss_kr' AND substr(title, 1, length(:f)) = :f AND published_at IS NOT NULL"
        ), {"f": feed}).fetchall()
        connection.execute(
            text("UPDATE news_items SET published_at = :p WHERE id = :i"),
            [{"i": rid, "p": (_db_dt(pub) - KST_OFFSET).strftime(_DT_FMT)} for rid, pub in rows],
        )

    connection.execute(text(
        "UPDATE news_items SET raw_score = 0 WHERE "
        "(source IN ('rss', 'rss_kr') AND raw_score IN (150, 180)) "
        "OR (source = 'arxiv' AND raw_score = 120) "
        "OR (source = 'huggingface' AND raw_score = comments_count + 40)"
    ))
    # 감시 저장소 폴백 행만: URL 이 sources.json 감시 저장소이고 별 = stars_hint(없으면 5000), 포크 = int(별 × 0.12).
    # 별·포크 비율만 보면 실제 검색 결과(별 1~8·포크 0 등)도 걸린다 (M003-01)
    from app.services.sources_service import sources_service
    monitored = sources_service.get_all_sources().get("github_sources", {}).get("monitored_repos", [])
    fallbacks = []
    for entry in monitored:
        if entry.get("repo"):
            stars = entry.get("stars_hint", 5000)
            fallbacks.append({"u": f"https://github.com/{entry['repo']}", "r": stars, "c": int(stars * 0.12)})
    if fallbacks:
        connection.execute(text(
            "UPDATE news_items SET raw_score = 0, comments_count = 0 "
            "WHERE source = 'github' AND url = :u AND raw_score = :r AND comments_count = :c"
        ), fallbacks)
    connection.execute(text(
        "UPDATE news_items SET raw_score = 0, comments_count = 0 WHERE url IN (:u1, :u2) AND raw_score IN (2400, 3950)"
    ), {"u1": _LEGACY_SEED_URLS[0], "u2": _LEGACY_SEED_URLS[1]})

    rows = connection.execute(text(
        "SELECT id, raw_score, comments_count, published_at, created_at FROM news_items WHERE published_at IS NOT NULL"
    )).fetchall()
    updates = []
    for rid, raw, comments, pub, created in rows:
        ref = _db_dt(created) or _db_dt(pub)
        updates.append({"i": rid, "h": calculate_hotness(raw, comments, _db_dt(pub), now=ref.replace(tzinfo=timezone.utc))})
    if updates:
        connection.execute(text("UPDATE news_items SET hotness_score = :h WHERE id = :i"), updates)


MIGRATIONS = [_m001_add_v24_columns, _m002_drop_duplicate_indexes, _m003_fix_legacy_news_rows]

FTS_DDL = (
    """CREATE VIRTUAL TABLE IF NOT EXISTS news_fts USING fts5(
        title, summary, why_it_matters, tech_stack, tags,
        content='news_items', content_rowid='id'
    );""",
    """CREATE TRIGGER IF NOT EXISTS news_items_ai AFTER INSERT ON news_items BEGIN
        INSERT INTO news_fts(rowid, title, summary, why_it_matters, tech_stack, tags)
        VALUES (new.id, new.title, new.summary, new.why_it_matters, new.tech_stack, new.tags);
    END;""",
    """CREATE TRIGGER IF NOT EXISTS news_items_ad AFTER DELETE ON news_items BEGIN
        INSERT INTO news_fts(news_fts, rowid, title, summary, why_it_matters, tech_stack, tags)
        VALUES ('delete', old.id, old.title, old.summary, old.why_it_matters, old.tech_stack, old.tags);
    END;""",
    """CREATE TRIGGER IF NOT EXISTS news_items_au AFTER UPDATE ON news_items BEGIN
        INSERT INTO news_fts(news_fts, rowid, title, summary, why_it_matters, tech_stack, tags)
        VALUES ('delete', old.id, old.title, old.summary, old.why_it_matters, old.tech_stack, old.tags);
        INSERT INTO news_fts(rowid, title, summary, why_it_matters, tech_stack, tags)
        VALUES (new.id, new.title, new.summary, new.why_it_matters, new.tech_stack, new.tags);
    END;""",
)


def _ensure_fts(connection) -> None:
    """FTS5 색인과 동기화 트리거. 스키마 생성은 여기 한 곳이다 (CC-03, 검색 경로는 만들지 않는다)."""
    for ddl in FTS_DDL:
        connection.execute(text(ddl))
    # 외부 콘텐츠 FTS 의 count(*) 는 news_items 를 세므로 색인된 행은 _docsize 로 센다
    indexed = connection.execute(text("SELECT count(*) FROM news_fts_docsize;")).scalar() or 0
    items = connection.execute(text("SELECT count(*) FROM news_items;")).scalar() or 0
    if indexed != items:
        connection.execute(text("INSERT INTO news_fts(news_fts) VALUES('rebuild');"))


def _apply_schema(connection) -> None:
    version = connection.execute(text("PRAGMA user_version;")).scalar() or 0
    for number, step in enumerate(MIGRATIONS, start=1):
        if number <= version:
            continue
        try:
            step(connection)
        except Exception:
            logger.exception(f"DB 마이그레이션 {number} ({step.__name__}) 실패")
            raise
        connection.execute(text(f"PRAGMA user_version = {number};"))
    _ensure_fts(connection)


async def ensure_db_schema():
    """테이블 생성, 버전 붙은 마이그레이션, FTS 색인. backend·MCP 서버·make collect 가 시작 때 부른다.

    실패하면 로그를 남기고 예외를 올린다 (예전에는 삼켰다, CC-06).
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with engine.begin() as conn:
        await conn.run_sync(_apply_schema)
