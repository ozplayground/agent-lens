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


from sqlalchemy import text

async def ensure_db_schema():
    """Ensure newly added columns exist in SQLite database if created prior to v2.4."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        def _check_sqlite_cols(connection):
            try:
                res = connection.execute(text("PRAGMA table_info(news_items);")).fetchall()
                columns = [row[1] for row in res]
                if columns:
                    if "full_content" not in columns:
                        connection.execute(text("ALTER TABLE news_items ADD COLUMN full_content TEXT;"))
                    if "scraped_at" not in columns:
                        connection.execute(text("ALTER TABLE news_items ADD COLUMN scraped_at DATETIME;"))
                    connection.execute(text("CREATE INDEX IF NOT EXISTS ix_news_items_scraped_at ON news_items (scraped_at);"))
            except Exception:
                pass

            try:
                res_m = connection.execute(text("PRAGMA table_info(chat_messages);")).fetchall()
                msg_columns = [row[1] for row in res_m]
                if msg_columns:
                    if "model_tier" not in msg_columns:
                        connection.execute(text("ALTER TABLE chat_messages ADD COLUMN model_tier VARCHAR(20);"))
                    if "usage_json" not in msg_columns:
                        connection.execute(text("ALTER TABLE chat_messages ADD COLUMN usage_json TEXT;"))
            except Exception:
                pass
        await conn.run_sync(_check_sqlite_cols)

