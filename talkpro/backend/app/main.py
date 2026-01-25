from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.api import algorithm, system_design, websocket

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    debug=settings.debug,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(algorithm.router)
app.include_router(system_design.router)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    await init_db()


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "app": settings.app_name}


@app.websocket("/ws/algorithm/{session_id}")
async def algorithm_websocket(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for algorithm interview"""
    from app.api.websocket import handle_algorithm_websocket
    await handle_algorithm_websocket(websocket, session_id)


@app.websocket("/ws/system-design/{session_id}")
async def system_design_websocket(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for system design interview"""
    from app.api.websocket import handle_system_design_websocket
    await handle_system_design_websocket(websocket, session_id)
