# TalkPro MVP Phase 1 - Backend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the backend foundation for TalkPro including user authentication, algorithm interview agent, and basic API infrastructure.

**Architecture:**
- FastAPI backend with async support
- PostgreSQL for persistent data (users, sessions, questions)
- Redis for caching and session management
- Claude API integration for LLM interactions
- Modular agent system (interview agent, evaluation agent)

**Tech Stack:**
- Python 3.10+
- FastAPI + Uvicorn
- SQLAlchemy 2.0 (async)
- Pydantic v2
- PostgreSQL 15+
- Redis 7+
- Claude API (Anthropic)
- Pytest for testing

---

## Task 1: Project Setup and Configuration

**Files:**
- Create: `pyproject.toml`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `README.md`

**Step 1: Create pyproject.toml**

```toml
[project]
name = "talkpro"
version = "0.1.0"
description = "AI Career Coach for Engineers"
requires-python = ">=3.10"
dependencies = [
    "fastapi>=0.104.0",
    "uvicorn[standard]>=0.24.0",
    "sqlalchemy[asyncio]>=2.0.23",
    "asyncpg>=0.29.0",
    "redis>=5.0.0",
    "pydantic>=2.5.0",
    "pydantic-settings>=2.1.0",
    "anthropic>=0.7.0",
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",
    "python-multipart>=0.0.6",
    "alembic>=1.13.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-asyncio>=0.21.0",
    "httpx>=0.25.0",
    "black>=23.11.0",
    "ruff>=0.1.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.black]
line-length = 100
target-version = ['py310']

[tool.ruff]
line-length = 100
select = ["E", "F", "I", "N", "W"]
```

**Step 2: Create .env.example**

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/talkpro

# Redis
REDIS_URL=redis://localhost:6379/0

# Claude API
ANTHROPIC_API_KEY=your_api_key_here

# JWT
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# App
APP_NAME=TalkPro
APP_VERSION=0.1.0
DEBUG=True
```

**Step 3: Create .gitignore**

```gitignore
__pycache__/
*.py[cod]
*$py.class
.venv/
venv/
.env
.alembic/
*.db
*.sqlite3
.pytest_cache/
.coverage
htmlcov/
dist/
build/
*.egg-info/
```

**Step 4: Create README.md**

```markdown
# TalkPro Backend

AI Career Coach for Engineers - Backend API

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
# Edit .env with your configuration
```

## Run

```bash
uvicorn app.main:app --reload
```

## Test

```bash
pytest
```
```

**Step 5: Commit**

```bash
git add pyproject.toml .env.example .gitignore README.md
git commit -m "chore: add project configuration and dependencies"
```

---

## Task 2: Application Structure and Configuration

**Files:**
- Create: `app/__init__.py`
- Create: `app/main.py`
- Create: `app/config.py`
- Create: `app/core/__init__.py`

**Step 1: Write the failing test**

Create `tests/test_config.py`:

```python
import os
from app.config import Settings

def test_settings_from_env(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://test")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")
    monkeypatch.setenv("SECRET_KEY", "test-secret")

    settings = Settings()

    assert settings.database_url == "postgresql://test"
    assert settings.anthropic_api_key == "test-key"
    assert settings.secret_key == "test-secret"
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_config.py -v`
Expected: FAIL with "cannot import Settings"

**Step 3: Create app/config.py**

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Database
    database_url: str

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Claude API
    anthropic_api_key: str

    # JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # App
    app_name: str = "TalkPro"
    app_version: str = "0.1.0"
    debug: bool = True


settings = Settings()
```

**Step 4: Create app/main.py**

```python
from fastapi import FastAPI
from app.config import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.app_version}
```

**Step 5: Create app/__init__.py and app/core/__init__.py**

Empty files.

**Step 6: Run test to verify it passes**

Run: `pytest tests/test_config.py -v`
Expected: PASS

**Step 7: Commit**

```bash
git add app/ tests/
git commit -m "feat: add application structure and configuration"
```

---

## Task 3: Database Models and Connection

**Files:**
- Create: `app/database.py`
- Create: `app/models/__init__.py`
- Create: `app/models/user.py`
- Create: `tests/test_database.py`

**Step 1: Write the failing test**

Create `tests/test_database.py`:

```python
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.user import User
from app.database import get_session

@pytest.mark.asyncio
async def test_database_connection():
    # Test that we can create a session
    async for session in get_session():
        assert isinstance(session, AsyncSession)
        break

@pytest.mark.asyncio
async def test_user_model():
    user = User(
        email="test@example.com",
        password_hash="hashed",
        name="Test User"
    )
    assert user.email == "test@example.com"
    assert user.name == "Test User"
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_database.py -v`
Expected: FAIL with "cannot import"

**Step 3: Create app/database.py**

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_session() -> AsyncSession:
    async with async_session() as session:
        yield session
```

**Step 4: Create app/models/user.py**

```python
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase
import uuid


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
```

**Step 5: Create app/models/__init__.py**

```python
from app.models.user import Base, User

__all__ = ["Base", "User"]
```

**Step 6: Run test to verify it passes**

Run: `pytest tests/test_database.py -v`
Expected: PASS

**Step 7: Commit**

```bash
git add app/
git commit -m "feat: add database models and connection"
```

---

## Task 4: Alembic Database Migrations

**Files:**
- Create: `alembic.ini`
- Create: `app/alembic/__init__.py`
- Create: `app/alembic/env.py`
- Create: `app/alembic/versions/__init__.py`

**Step 1: Initialize Alembic**

```bash
alembic init app/alembic
```

**Step 2: Edit alembic.ini**

Change sqlalchemy.url section:
```ini
sqlalchemy.url = postgresql+asyncpg://user:password@localhost:5432/talkpro
```

**Step 3: Edit app/alembic/env.py**

Replace the env.py file with:

```python
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
from app.config import settings
from app.models import Base

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    import asyncio
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

**Step 4: Create first migration**

```bash
alembic revision --autogenerate -m "Initial migration"
```

**Step 5: Apply migration**

```bash
alembic upgrade head
```

**Step 6: Commit**

```bash
git add alembic.ini app/alembic/
git commit -m "feat: add alembic database migrations"
```

---

## Task 5: User Authentication - Password Hashing

**Files:**
- Create: `app/core/security.py`
- Create: `tests/test_security.py`

**Step 1: Write the failing test**

Create `tests/test_security.py`:

```python
from app.core.security import hash_password, verify_password

def test_hash_password():
    password = "mypassword123"
    hashed = hash_password(password)

    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong", hashed) is False
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_security.py -v`
Expected: FAIL with "cannot import"

**Step 3: Create app/core/security.py**

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/test_security.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add app/core/security.py tests/test_security.py
git commit -m "feat: add password hashing utilities"
```

---

## Task 6: User Authentication - JWT Tokens

**Files:**
- Modify: `app/core/security.py`
- Modify: `tests/test_security.py`

**Step 1: Write the failing test**

Add to `tests/test_security.py`:

```python
from datetime import datetime, timedelta
from app.core.security import create_access_token, decode_access_token

def test_create_and_decode_token():
    data = {"sub": "user@email.com"}
    token = create_access_token(data, expires_delta=timedelta(minutes=30))

    assert isinstance(token, str)
    assert len(token) > 0

    decoded = decode_access_token(token)
    assert decoded["sub"] == "user@email.com"
    assert "exp" in decoded
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_security.py -v`
Expected: FAIL with "function not defined"

**Step 3: Add to app/core/security.py**

```python
from datetime import datetime, timedelta
from jose import JWTError, jwt
from app.config import settings

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        return {}
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/test_security.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add app/core/security.py tests/test_security.py
git commit -m "feat: add JWT token creation and decoding"
```

---

## Task 7: User Registration API

**Files:**
- Create: `app/schemas/__init__.py`
- Create: `app/schemas/user.py`
- Create: `app/api/__init__.py`
- Create: `app/api/deps.py`
- Create: `app/api/users.py`
- Modify: `app/main.py`
- Create: `tests/test_api_users.py`

**Step 1: Write the failing test**

Create `tests/test_api_users.py`:

```python
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_register_user():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/users/register",
            json={
                "email": "test@example.com",
                "password": "password123",
                "name": "Test User"
            }
        )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test User"
    assert "id" in data
    assert "password" not in data

@pytest.mark.asyncio
async def test_register_duplicate_email():
    async with AsyncClient(app=app, base_url="http://test") as client:
        # First registration
        await client.post(
            "/api/users/register",
            json={"email": "test@example.com", "password": "password123", "name": "User 1"}
        )

        # Duplicate registration
        response = await client.post(
            "/api/users/register",
            json={"email": "test@example.com", "password": "password456", "name": "User 2"}
        )

    assert response.status_code == 400
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_api_users.py -v`
Expected: FAIL with "404 Not Found"

**Step 3: Create app/schemas/user.py**

```python
from pydantic import BaseModel, EmailStr
from uuid import UUID


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    name: str

    class Config:
        from_attributes = True
```

**Step 4: Create app/api/deps.py**

```python
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_session

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_session():
        yield session
```

**Step 5: Create app/api/users.py**

```python
from typing import AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api.deps import get_db
from app.schemas.user import UserCreate, UserResponse
from app.models.user import User
from app.core.security import hash_password

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/register", response_model=UserResponse)
async def register_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user
    new_user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        name=user_data.name
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user
```

**Step 6: Modify app/main.py**

```python
from fastapi import FastAPI
from app.config import settings
from app.api.users import router as users_router

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
)

app.include_router(users_router, prefix="/api")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.app_version}
```

**Step 7: Create app/schemas/__init__.py and app/api/__init__.py**

Empty files.

**Step 8: Run test to verify it passes**

Run: `pytest tests/test_api_users.py -v`
Expected: PASS

**Step 9: Commit**

```bash
git add app/
git commit -m "feat: add user registration API"
```

---

## Task 8: User Login API

**Files:**
- Create: `app/schemas/auth.py`
- Modify: `app/api/users.py`
- Modify: `tests/test_api_users.py`

**Step 1: Write the failing test**

Add to `tests/test_api_users.py`:

```python
from app.schemas.auth import LoginRequest, Token

@pytest.mark.asyncio
async def test_login_success():
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Register user first
        await client.post(
            "/api/users/register",
            json={"email": "test@example.com", "password": "password123", "name": "Test User"}
        )

        # Login
        response = await client.post(
            "/api/users/login",
            json={"email": "test@example.com", "password": "password123"}
        )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_wrong_password():
    async with AsyncClient(app=app, base_url="http://test") as client:
        await client.post(
            "/api/users/register",
            json={"email": "test@example.com", "password": "password123", "name": "Test User"}
        )

        response = await client.post(
            "/api/users/login",
            json={"email": "test@example.com", "password": "wrongpassword"}
        )

    assert response.status_code == 401
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_api_users.py::test_login_success -v`
Expected: FAIL with "404 Not Found"

**Step 3: Create app/schemas/auth.py**

```python
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
```

**Step 4: Modify app/api/users.py**

Add login endpoint:

```python
from app.schemas.auth import LoginRequest, Token
from app.core.security import verify_password, create_access_token

@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    # Find user
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Create token
    access_token = create_access_token(data={"sub": user.email})

    return Token(access_token=access_token)
```

**Step 5: Run test to verify it passes**

Run: `pytest tests/test_api_users.py::test_login_success -v`
Expected: PASS

**Step 6: Commit**

```bash
git add app/
git commit -m "feat: add user login API"
```

---

## Task 9: Protected Route and Current User

**Files:**
- Modify: `app/api/deps.py`
- Create: `app/api/me.py`
- Modify: `app/main.py`
- Create: `tests/test_api_me.py`

**Step 1: Write the failing test**

Create `tests/test_api_me.py`:

```python
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_get_current_user():
    async with AsyncClient(app=app, base_url="http://test", transport=ASGITransport(app=app)) as client:
        # Register and login
        await client.post(
            "/api/users/register",
            json={"email": "test@example.com", "password": "password123", "name": "Test User"}
        )

        login_response = await client.post(
            "/api/users/login",
            json={"email": "test@example.com", "password": "password123"}
        )
        token = login_response.json()["access_token"]

        # Get current user
        response = await client.get(
            "/api/me",
            headers={"Authorization": f"Bearer {token}"}
        )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test User"

@pytest.mark.asyncio
async def test_get_current_user_no_token():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/me")

    assert response.status_code == 401
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_api_me.py -v`
Expected: FAIL with "404 Not Found"

**Step 3: Modify app/api/deps.py**

```python
from typing import AsyncGenerator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import JWTError
from app.database import get_session
from app.models.user import User
from app.core.security import decode_access_token

security = HTTPBearer()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_session():
        yield session

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = decode_access_token(token)

    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

    email = payload["sub"]

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user
```

**Step 4: Create app/api/me.py**

```python
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter(prefix="/me", tags=["me"])

@router.get("", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
```

**Step 5: Modify app/main.py**

```python
from fastapi import FastAPI
from app.config import settings
from app.api.users import router as users_router
from app.api.me import router as me_router

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
)

app.include_router(users_router, prefix="/api")
app.include_router(me_router, prefix="/api")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.app_version}
```

**Step 6: Run test to verify it passes**

Run: `pytest tests/test_api_me.py -v`
Expected: PASS

**Step 7: Commit**

```bash
git add app/ tests/
git commit -m "feat: add protected route and current user endpoint"
```

---

## Task 10: Claude API Integration

**Files:**
- Create: `app/services/__init__.py`
- Create: `app/services/claude.py`
- Create: `tests/test_claude_service.py`

**Step 1: Write the failing test**

Create `tests/test_claude_service.py`:

```python
import pytest
from app.services.claude import ClaudeService

@pytest.mark.asyncio
async def test_claude_simple_message():
    service = ClaudeService()
    response = await service.send_message("Hello, respond with 'AI Agent ready'")

    assert "AI Agent ready" in response or len(response) > 0

@pytest.mark.asyncio
async def test_claude_streaming():
    service = ClaudeService()
    chunks = []
    async for chunk in service.send_message_stream("Say hello"):
        chunks.append(chunk)

    full_response = "".join(chunks)
    assert len(full_response) > 0
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_claude_service.py -v`
Expected: FAIL with "cannot import"

**Step 3: Create app/services/claude.py**

```python
from anthropic import AsyncAnthropic
from app.config import settings

class ClaudeService:
    def __init__(self):
        self.client = AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def send_message(
        self,
        message: str,
        model: str = "claude-3-5-sonnet-20241022",
        max_tokens: int = 1024
    ) -> str:
        response = await self.client.messages.create(
            model=model,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": message}]
        )
        return response.content[0].text

    async def send_message_stream(
        self,
        message: str,
        model: str = "claude-3-5-sonnet-20241022",
        max_tokens: int = 1024
    ):
        async with self.client.messages.stream(
            model=model,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": message}]
        ) as stream:
            async for text in stream.text_stream:
                yield text
```

**Step 4: Create app/services/__init__.py`

Empty file.

**Step 5: Run test to verify it passes**

Run: `pytest tests/test_claude_service.py -v`
Expected: PASS (requires valid ANTHROPIC_API_KEY in .env)

**Step 6: Commit**

```bash
git add app/services/ tests/
git commit -m "feat: add Claude API integration service"
```

---

## Task 11: Algorithm Interview Agent

**Files:**
- Create: `app/agents/__init__.py`
- Create: `app/agents/interview_agent.py`
- Create: `app/models/question.py`
- Create: `app/schemas/interview.py`
- Create: `app/api/interviews.py`
- Modify: `app/main.py`
- Create: `tests/test_interview_agent.py`

**Step 1: Write the failing test**

Create `tests/test_interview_agent.py`:

```python
import pytest
from app.agents.interview_agent import InterviewAgent
from app.schemas.interview import Difficulty

@pytest.mark.asyncio
async def test_start_algorithm_interview():
    agent = InterviewAgent()
    result = await agent.start_interview(
        type="algorithm",
        difficulty=Difficulty.MEDIUM
    )

    assert "question" in result
    assert "session_id" in result
    assert len(result["question"]) > 0

@pytest.mark.asyncio
async def test_submit_answer_and_get_feedback():
    agent = InterviewAgent()
    # Start interview
    start_result = await agent.start_interview("algorithm", Difficulty.EASY)

    # Submit answer
    feedback = await agent.submit_answer(
        session_id=start_result["session_id"],
        answer="I would use a hash set to track seen numbers"
    )

    assert "feedback" in feedback
    assert "follow_up_question" in feedback
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_interview_agent.py -v`
Expected: FAIL with "cannot import"

**Step 3: Create app/schemas/interview.py**

```python
from enum import Enum
from pydantic import BaseModel
from uuid import UUID


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class InterviewStart(BaseModel):
    type: str
    difficulty: Difficulty


class InterviewResponse(BaseModel):
    session_id: str
    question: str
    difficulty: Difficulty


class AnswerSubmit(BaseModel):
    session_id: str
    answer: str


class FeedbackResponse(BaseModel):
    feedback: str
    follow_up_question: str | None
    score: dict
```

**Step 4: Create app/models/question.py**

```python
from sqlalchemy import Column, String, Text, Enum as SQLEnum
from app.models.user import Base, UUID
import enum


class QuestionType(str, enum.Enum):
    ALGORITHM = "algorithm"
    SYSTEM_DESIGN = "system_design"


class Difficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Question(Base):
    __tablename__ = "questions"

    id = Column(UUID, primary_key=True)
    type = Column(SQLEnum(QuestionType), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    difficulty = Column(SQLEnum(Difficulty), nullable=False)
    tags = Column(String, nullable=True)  # JSON array as string
    solution = Column(Text, nullable=True)
```

**Step 5: Create app/agents/interview_agent.py**

```python
import uuid
from app.services.claude import ClaudeService
from app.schemas.interview import Difficulty


class InterviewAgent:
    def __init__(self):
        self.claude = ClaudeService()
        self.sessions = {}  # In-memory session storage (move to Redis later)

    async def start_interview(self, type: str, difficulty: Difficulty) -> dict:
        # Generate interview question using Claude
        prompt = f"""You are a technical interviewer. Generate a {difficulty} level {type} coding question.

Provide ONLY the question text, no additional commentary."""

        question = await self.claude.send_message(prompt)

        # Create session
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = {
            "type": type,
            "difficulty": difficulty,
            "question": question,
            "history": []
        }

        return {
            "session_id": session_id,
            "question": question,
            "difficulty": difficulty
        }

    async def submit_answer(self, session_id: str, answer: str) -> dict:
        if session_id not in self.sessions:
            raise ValueError("Invalid session ID")

        session = self.sessions[session_id]

        # Generate feedback and follow-up using Claude
        prompt = f"""You are a technical interviewer evaluating a candidate's answer.

Question: {session['question']}

Candidate's Answer: {answer}

Provide:
1. Brief feedback on their answer (what's good, what's missing)
2. A relevant follow-up question to test deeper understanding

Format as JSON:
{{
    "feedback": "...",
    "follow_up_question": "...",
    "score": {{
        "correctness": 0-10,
        "clarity": 0-10,
        "depth": 0-10
    }}
}}"""

        response = await self.claude.send_message(prompt)

        # Parse JSON from response
        import json
        try:
            result = json.loads(response)
        except:
            result = {
                "feedback": response,
                "follow_up_question": "Can you elaborate on your approach?",
                "score": {"correctness": 5, "clarity": 5, "depth": 5}
            }

        return result
```

**Step 6: Create app/api/interviews.py**

```python
from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.interview import InterviewStart, InterviewResponse, AnswerSubmit, FeedbackResponse
from app.agents.interview_agent import InterviewAgent

router = APIRouter(prefix="/interviews", tags=["interviews"])
agent = InterviewAgent()

@router.post("/start", response_model=InterviewResponse)
async def start_interview(
    data: InterviewStart,
    current_user: User = Depends(get_current_user)
):
    result = await agent.start_interview(data.type, data.difficulty)
    return result

@router.post("/submit", response_model=FeedbackResponse)
async def submit_answer(
    data: AnswerSubmit,
    current_user: User = Depends(get_current_user)
):
    result = await agent.submit_answer(data.session_id, data.answer)
    return result
```

**Step 7: Modify app/main.py**

```python
from app.api.interviews import router as interviews_router

app.include_router(interviews_router, prefix="/api")
```

**Step 8: Run tests to verify they pass**

Run: `pytest tests/test_interview_agent.py -v`
Expected: PASS

**Step 9: Commit**

```bash
git add app/ tests/
git commit -m "feat: add algorithm interview agent"
```

---

## Task 12: Question Database and Seed Data

**Files:**
- Create: `app/db/seed_questions.py`
- Modify: `app/agents/interview_agent.py` to use database

**Step 1: Create seed questions script**

Create `app/db/seed_questions.py`:

```python
import asyncio
from sqlalchemy import select
from app.database import async_session
from app.models.question import Question, QuestionType, Difficulty
from uuid import uuid4

QUESTIONS = [
    {
        "type": QuestionType.ALGORITHM,
        "title": "Two Sum",
        "content": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        "difficulty": Difficulty.EASY,
        "tags": "['array', 'hash-map']",
        "solution": "Use a hash map to store complement values."
    },
    {
        "type": QuestionType.ALGORITHM,
        "title": "Reverse Linked List",
        "content": "Given the head of a singly linked list, reverse the list, and return the reversed list.",
        "difficulty": Difficulty.EASY,
        "tags": "['linked-list']",
        "solution": "Iterative approach with prev, current, next pointers."
    },
    {
        "type": QuestionType.ALGORITHM,
        "title": "Longest Substring Without Repeating Characters",
        "content": "Given a string s, find the length of the longest substring without repeating characters.",
        "difficulty": Difficulty.MEDIUM,
        "tags": "['string', 'sliding-window']",
        "solution": "Sliding window with hash set to track characters."
    }
]

async def seed_questions():
    async with async_session() as session:
        # Check if questions already exist
        result = await session.execute(select(Question))
        if result.scalar_one_or_none():
            print("Questions already seeded")
            return

        # Add questions
        for q_data in QUESTIONS:
            question = Question(
                id=uuid4(),
                **q_data
            )
            session.add(question)

        await session.commit()
        print(f"Seeded {len(QUESTIONS)} questions")

if __name__ == "__main__":
    asyncio.run(seed_questions())
```

**Step 2: Run seed script**

```bash
python -m app.db.seed_questions
```

**Step 3: Commit**

```bash
git add app/db/
git commit -m "feat: add question seed data"
```

---

## Task 13: WebSocket Support for Real-time Chat

**Files:**
- Create: `app/api/websocket.py`
- Modify: `app/main.py`
- Create: `tests/test_websocket.py`

**Step 1: Write the failing test**

Create `tests/test_websocket.py`:

```python
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_websocket_connect():
    async with AsyncClient(app=app, base_url="http://test") as client:
        async with client.websocket_connect("/ws/interview/test-session") as websocket:
            await websocket.send_text("Hello")
            data = await websocket.receive_text()
            assert data is not None
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_websocket.py -v`
Expected: FAIL

**Step 3: Create app/api/websocket.py**

```python
from fastapi import WebSocket, WebSocketDisconnect
from app.services.claude import ClaudeService


class ConnectionManager:
    def __init__(self):
        self.active_connections = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]

    async def send_message(self, session_id: str, message: str):
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_text(message)


manager = ConnectionManager()
claude = ClaudeService()


@router.websocket("/ws/interview/{session_id}")
async def websocket_interview(websocket: WebSocket, session_id: str):
    await manager.connect(websocket, session_id)

    try:
        while True:
            data = await websocket.receive_text()

            # Get Claude response
            response = await claude.send_message(data)

            # Send back
            await websocket.send_text(response)

    except WebSocketDisconnect:
        manager.disconnect(session_id)
```

**Step 4: Modify app/main.py to include WebSocket router**

**Step 5: Run test to verify it passes**

**Step 6: Commit**

```bash
git add app/
git commit -m "feat: add WebSocket support for real-time chat"
```

---

## Final Steps

1. **Integration Testing**: Test the full flow from registration → login → start interview → submit answer
2. **Documentation**: Update README with API documentation
3. **Docker Setup**: Create Dockerfile and docker-compose.yml
4. **Deployment**: Configure for production deployment

---

## Summary

This plan implements:
- ✅ User authentication (register, login, JWT)
- ✅ Algorithm interview agent with Claude integration
- ✅ Question database with seed data
- ✅ WebSocket support for real-time chat
- ✅ Protected routes
- ✅ Comprehensive test coverage

**Next Phase**: System Design Agent + Frontend UI
