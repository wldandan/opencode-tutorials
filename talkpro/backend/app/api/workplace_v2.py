from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from pydantic import BaseModel
import uuid
import json

from ..core.database import async_session, User
from ..models.interview import InterviewSession, SessionType
from ..agents.workplace_agent import WorkplaceAgent
from ..dependencies import get_current_user

router = APIRouter(prefix="/workplace/v2", tags=["workplace"])
agent = WorkplaceAgent()


class InterviewRequest(BaseModel):
    scenario: str


@router.get("/scenarios")
async def get_scenarios(current_user: User = Depends(get_current_user)):
    """获取所有职场场景"""
    scenarios = agent.get_scenarios()
    return {
        "scenarios": [
            {
                "id": s["id"],
                "name": s["name"],
                "description": s["description"],
                "role": s["role"],
            }
            for s in scenarios
        ]
    }


@router.post("/interview")
async def start_interview(
    request: InterviewRequest,
    current_user: User = Depends(get_current_user)
):
    """开始职场场景面试"""
    try:
        # 调用Agent开始面试
        result = await agent.start_interview(
            scenario_id=request.scenario,
            user_id=current_user.id
        )

        # 创建会话记录
        session = InterviewSession(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            type=SessionType.WORKPLACE,
            scenario=request.scenario,
            requirements=result["requirements"],
            messages=[
                {
                    "role": "assistant",
                    "content": result["requirements"],
                    "timestamp": int(datetime.now().timestamp() * 1000)
                }
            ],
            is_completed=False
        )

        async with async_session() as db:
            db.add(session)
            await db.commit()
            await db.refresh(session)

        return {
            "sessionId": session.id,
            "scenario": result["scenario"],
            "scenarioName": result["scenario_name"],
            "role": result["role"],
            "description": result["description"],
            "question": result["requirements"],
            "dimensions": result["dimensions"],
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start interview: {str(e)}")


@router.websocket("/{session_id}/ws")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket连接用于实时对话"""
    await websocket.accept()

    session = None
    try:
        # 验证token
        token = websocket.query_params.get("token")
        if not token:
            await websocket.send_json({"type": "error", "message": "Missing token"})
            await websocket.close()
            return

        # 获取用户
        from ..core.security import decode_access_token
        payload = decode_access_token(token)
        if not payload or "sub" not in payload:
            await websocket.send_json({"type": "error", "message": "Invalid token"})
            await websocket.close()
            return

        email = payload["sub"]

        # 获取会话
        async with async_session() as db:
            result = await db.execute(
                select(InterviewSession, User)
                .join(User, InterviewSession.user_id == User.id)
                .where(InterviewSession.id == session_id)
                .where(User.email == email)
            )
            row = result.first()
            if not row:
                await websocket.send_json({"type": "error", "message": "Session not found"})
                await websocket.close()
                return

            session, user = row

        # 接收消息并发送回复
        async with async_session() as db:
            while True:
                data = await websocket.receive_json()
                message_type = data.get("type")

                if message_type == "message":
                    user_message = data.get("content", "")
                    if not user_message:
                        continue

                    # 添加用户消息到历史
                    session.messages.append({
                        "role": "user",
                        "content": user_message,
                        "timestamp": int(datetime.now().timestamp() * 1000)
                    })

                    # 发送开始标记
                    await websocket.send_json({
                        "type": "message_start",
                        "role": "assistant"
                    })

                    # 调用Agent获取回复
                    response = await agent.chat(
                        scenario_id=session.scenario,
                        message=user_message,
                        conversation_history=session.messages
                    )

                    # 流式发送回复
                    content = response.get("content", "")
                    for i in range(0, len(content), 50):
                        chunk = content[i:i+50]
                        await websocket.send_json({
                            "type": "message_chunk",
                            "content": chunk
                        })

                    # 添加助手消息到历史
                    session.messages.append({
                        "role": "assistant",
                        "content": content,
                        "timestamp": int(datetime.now().timestamp() * 1000)
                    })

                    # 发送完成标记
                    await websocket.send_json({
                        "type": "message_complete",
                        "content": content,
                        "role": response.get("role", "assistant"),
                        "completed": False
                    })

                    # 更新数据库
                    db.add(session)
                    await db.commit()

                elif message_type == "end":
                    # 用户结束对话，生成评估
                    await websocket.send_json({"type": "evaluating"})

                    evaluation = await agent.end_interview(
                        scenario_id=session.scenario,
                        conversation_history=session.messages
                    )

                    # 更新会话
                    session.score = evaluation
                    session.is_completed = True
                    session.completed_at = datetime.now()

                    db.add(session)
                    await db.commit()

                    await websocket.send_json({
                        "type": "session_complete",
                        "evaluation": evaluation
                    })

                    break

    except WebSocketDisconnect:
        print(f"WebSocket disconnected: {session_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.send_json({"type": "error", "message": str(e)})


@router.post("/{session_id}/end")
async def end_interview(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """结束面试并获取评估报告"""
    async with async_session() as db:
        result = await db.execute(
            select(InterviewSession)
            .where(InterviewSession.id == session_id)
            .where(InterviewSession.user_id == current_user.id)
        )
        session = result.scalar_one_or_none()

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        # 如果还没有评分，生成评估
        if not session.score:
            evaluation = await agent.end_interview(
                scenario_id=session.scenario,
                conversation_history=session.messages
            )
            session.score = evaluation
            session.is_completed = True
            session.completed_at = datetime.now()

            db.add(session)
            await db.commit()

        return session.score


# Import datetime at module level
from datetime import datetime
