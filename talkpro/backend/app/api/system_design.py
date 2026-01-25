from fastapi import APIRouter, HTTPException
from app.api.schemas import (
    SystemDesignStartRequest,
    SystemDesignStartResponse,
    SystemDesignDiscussRequest,
    SystemDesignDiscussResponse,
    SystemDesignReport,
    ScenarioInfo,
)
from app.agents.system_design_agent import SystemDesignAgent
from app.models.session import InterviewSession, SessionStatus

router = APIRouter(prefix="/api/system-design", tags=["system-design"])
agent = SystemDesignAgent()

# In-memory session storage
sessions: dict[str, InterviewSession] = {}


@router.post("/start", response_model=SystemDesignStartResponse)
async def start_interview(request: SystemDesignStartRequest):
    """Start a system design interview"""
    try:
        session, scenario = await agent.start_interview(request.scenarioId)
        sessions[session.id] = session
        return SystemDesignStartResponse(
            sessionId=session.id,
            scenario=scenario,
            requirements=scenario.get("requirements", ""),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{session_id}/discuss", response_model=SystemDesignDiscussResponse)
async def discuss_design(session_id: str, request: SystemDesignDiscussRequest):
    """Submit design discussion"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[session_id]

    try:
        reply, stage = await agent.discuss_design(session, request.content)
        return SystemDesignDiscussResponse(reply=reply, stage=stage)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{session_id}/end", response_model=SystemDesignReport)
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
        return SystemDesignReport(**report)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scenarios", response_model=list[ScenarioInfo])
async def get_scenarios():
    """Get all available scenarios"""
    scenarios = []
    for s in agent.scenarios:
        scenarios.append(
            ScenarioInfo(id=s["id"], title=s["title"], description=s["description"])
        )
    return scenarios
