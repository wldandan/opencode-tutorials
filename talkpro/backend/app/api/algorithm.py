from fastapi import APIRouter, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.schemas import (
    AlgorithmStartRequest,
    AlgorithmStartResponse,
    AlgorithmAnswerRequest,
    AlgorithmAnswerResponse,
    AlgorithmReport,
    QuestionInfo,
)
from app.agents.algorithm_interviewer import AlgorithmInterviewer
from app.models.session import InterviewSession, SessionStatus
from app.database import async_session
import json

router = APIRouter(prefix="/api/algorithm", tags=["algorithm"])
agent = AlgorithmInterviewer()


# In-memory session storage (can be replaced with database later)
sessions: dict[str, InterviewSession] = {}


@router.post("/start", response_model=AlgorithmStartResponse)
async def start_interview(request: AlgorithmStartRequest):
    """Start an algorithm interview"""
    try:
        session, question = await agent.start_interview(request.difficulty)
        sessions[session.id] = session
        return AlgorithmStartResponse(
            sessionId=session.id,
            question=question,
            difficulty=request.difficulty,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{session_id}/answer", response_model=AlgorithmAnswerResponse)
async def submit_answer(session_id: str, request: AlgorithmAnswerRequest):
    """Submit an answer and get follow-up question"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[session_id]

    try:
        reply, completed = await agent.process_answer(
            session, request.content, request.code
        )
        return AlgorithmAnswerResponse(reply=reply, completed=completed)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{session_id}/end", response_model=AlgorithmReport)
async def end_interview(session_id: str):
    """End interview and get evaluation report"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[session_id]
    session.status = SessionStatus.COMPLETED

    try:
        report = await agent.generate_report(session)
        session.score = report
        session.feedback = report.get("feedback", "")
        return AlgorithmReport(**report)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/questions", response_model=list[QuestionInfo])
async def get_questions():
    """Get all available questions"""
    questions = []
    for q in agent.questions:
        questions.append(
            QuestionInfo(id=q["id"], title=q["title"], difficulty=q["difficulty"])
        )
    return questions
