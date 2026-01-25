from fastapi import WebSocket, WebSocketDisconnect, WebSocketException
from app.agents.algorithm_interviewer import AlgorithmInterviewer
from app.agents.system_design_agent import SystemDesignAgent
import json

algorithm_agent = AlgorithmInterviewer()
system_design_agent = SystemDesignAgent()


async def handle_algorithm_websocket(websocket: WebSocket, session_id: str):
    """Handle WebSocket connection for algorithm interview"""
    await websocket.accept()

    # Get session from in-memory storage
    from app.api.algorithm import sessions
    if session_id not in sessions:
        await websocket.send_json({"error": "Session not found"})
        await websocket.close()
        return

    session = sessions[session_id]

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            content = data.get("content", "")
            code = data.get("code", None)

            # Stream response
            await websocket.send_json({"type": "message_start"})

            full_response = ""
            async for chunk in algorithm_agent.claude.send_message_stream(
                algorithm_agent._build_conversation(session, content, code)
            ):
                full_response += chunk
                await websocket.send_json({
                    "type": "message_chunk",
                    "content": chunk
                })

            # Check if complete
            is_complete = "INTERVIEW_COMPLETE" in full_response

            # Update session
            session.messages.append({"role": "user", "content": content})
            session.messages.append({"role": "assistant", "content": full_response})

            await websocket.send_json({
                "type": "message_complete",
                "content": full_response,
                "completed": is_complete
            })

    except WebSocketDisconnect:
        print(f"WebSocket disconnected: {session_id}")
    except Exception as e:
        await websocket.send_json({"type": "error", "message": str(e)})
        await websocket.close()


async def handle_system_design_websocket(websocket: WebSocket, session_id: str):
    """Handle WebSocket connection for system design interview"""
    await websocket.accept()

    # Get session from in-memory storage
    from app.api.system_design import sessions
    if session_id not in sessions:
        await websocket.send_json({"error": "Session not found"})
        await websocket.close()
        return

    session = sessions[session_id]

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            content = data.get("content", "")

            # Stream response
            await websocket.send_json({"type": "message_start"})

            # Build messages for Claude
            messages = [
                {"role": "system", "content": system_design_agent.SYSTEM_PROMPT}
            ]
            messages.extend(session.messages)
            messages.append({"role": "user", "content": content})

            full_response = ""
            async for chunk in system_design_agent.claude.send_message_stream(
                "\n".join([m["content"] for m in messages])
            ):
                full_response += chunk
                await websocket.send_json({
                    "type": "message_chunk",
                    "content": chunk
                })

            # Determine stage
            stage = system_design_agent._determine_stage(
                session.messages + [
                    {"role": "user", "content": content},
                    {"role": "assistant", "content": full_response}
                ]
            )

            # Update session
            session.messages.append({"role": "user", "content": content})
            session.messages.append({"role": "assistant", "content": full_response})

            await websocket.send_json({
                "type": "message_complete",
                "content": full_response,
                "stage": stage
            })

    except WebSocketDisconnect:
        print(f"WebSocket disconnected: {session_id}")
    except Exception as e:
        await websocket.send_json({"type": "error", "message": str(e)})
        await websocket.close()
