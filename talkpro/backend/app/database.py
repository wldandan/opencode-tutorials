from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import aiosqlite
import asyncio


class Base(DeclarativeBase):
    pass


# SQLite database URL
DATABASE_URL = "sqlite+aiosqlite:///./talkpro.db"

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
)

# Create async session maker
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_session() -> AsyncSession:
    """Get database session"""
    async with async_session() as session:
        yield session


async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
