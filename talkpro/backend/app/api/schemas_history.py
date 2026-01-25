from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from enum import Enum


class SessionType(str, Enum):
    ALGORITHM = "algorithm"
    SYSTEM_DESIGN = "system_design"


class SessionStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class TrainingSessionResponse(BaseModel):
    """训练会话响应"""
    id: str
    type: SessionType
    difficulty: Optional[str] = None
    scenario_id: Optional[str] = None
    score: Optional[dict] = None
    status: SessionStatus
    created_at: datetime
    ended_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TrainingHistoryList(BaseModel):
    """训练历史列表"""
    total: int
    sessions: list[TrainingSessionResponse]


class SessionDetailResponse(BaseModel):
    """会话详情"""
    id: str
    type: SessionType
    difficulty: Optional[str] = None
    scenario_id: Optional[str] = None
    messages: list[dict]
    score: Optional[dict]
    feedback: Optional[str]
    status: SessionStatus
    created_at: datetime
    ended_at: Optional[datetime] = None

    class Config:
        from_attributes = True
