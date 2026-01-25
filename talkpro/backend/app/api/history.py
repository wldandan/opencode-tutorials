from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.api.schemas_history import TrainingSessionResponse, TrainingHistoryList, SessionDetailResponse
from app.models.session import InterviewSession, SessionType, SessionStatus
from app.models.user import User
from app.api.auth import get_current_user
from app.database import async_session

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=TrainingHistoryList)
async def get_training_history(
    skip: int = 0,
    limit: int = 20,
    type: Optional[SessionType] = None,
    current_user: User = Depends(get_current_user),
):
    """获取用户的训练历史"""
    async with async_session() as db:
        # Build query
        query = select(InterviewSession).where(InterviewSession.user_id == current_user.id)

        # Filter by type if specified
        if type:
            query = query.where(InterviewSession.type == type)

        # Order by created_at desc
        query = query.order_by(InterviewSession.created_at.desc())

        # Get total count
        count_query = select(InterviewSession.id).where(InterviewSession.user_id == current_user.id)
        if type:
            count_query = count_query.where(InterviewSession.type == type)

        result = await db.execute(count_query)
        total = len(result.all())

        # Apply pagination
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        sessions = result.scalars().all()

        # Convert to response
        session_responses = [
            TrainingSessionResponse.model_validate(session)
            for session in sessions
        ]

        return TrainingHistoryList(total=total, sessions=session_responses)


@router.get("/{session_id}", response_model=SessionDetailResponse)
async def get_session_detail(
    session_id: str,
    current_user: User = Depends(get_current_user),
):
    """获取会话详情"""
    async with async_session() as db:
        result = await db.execute(
            select(InterviewSession)
            .where(InterviewSession.id == session_id)
            .where(InterviewSession.user_id == current_user.id)
        )
        session = result.scalar_one_or_none()

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        return SessionDetailResponse.model_validate(session)


@router.delete("/{session_id}")
async def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
):
    """删除会话记录"""
    async with async_session() as db:
        result = await db.execute(
            select(InterviewSession)
            .where(InterviewSession.id == session_id)
            .where(InterviewSession.user_id == current_user.id)
        )
        session = result.scalar_one_or_none()

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        await db.delete(session)
        await db.commit()

        return {"success": True, "message": "Session deleted"}
