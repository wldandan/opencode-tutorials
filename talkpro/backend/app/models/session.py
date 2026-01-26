from sqlalchemy import Column, String, Text, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.sqlite import JSON
from app.database import Base
from datetime import datetime
import uuid
import enum


class SessionType(str, enum.Enum):
    ALGORITHM = "algorithm"
    SYSTEM_DESIGN = "system_design"
    WORKPLACE = "workplace"


class SessionStatus(str, enum.Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    type = Column(SQLEnum(SessionType), nullable=False)
    question_id = Column(String, nullable=True)  # For algorithm interviews
    scenario_id = Column(String, nullable=True)  # For system design
    messages = Column(JSON, nullable=False, default=list)
    score = Column(JSON, nullable=True)
    feedback = Column(Text, nullable=True)
    status = Column(SQLEnum(SessionStatus), default=SessionStatus.IN_PROGRESS)
    created_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
