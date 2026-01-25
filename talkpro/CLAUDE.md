# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TalkPro** is an AI-powered career coach for engineers, using AI Agents to simulate real interview and workplace scenarios (algorithm interviews, system design interviews, promotion defense simulations, etc.).

**Current Status**: Project is in early planning/design phase. Implementation has not yet begun.

## Planned Architecture

### Tech Stack

**Frontend**
- React 18+ with TypeScript
- Vite for building
- Tailwind CSS + shadcn/ui or Ant Design for components
- Monaco Editor for code editing (algorithm interviews)
- ECharts/Recharts for data visualization (radar charts, line charts)
- Socket.io Client for real-time WebSocket communication

**Backend**
- Python 3.10+ with FastAPI
- asyncio + uvicorn for async support
- PostgreSQL for relational data (users, training sessions, questions)
- Vector database (Qdrant or Weaviate) for semantic search and intelligent question recommendations
- Redis for caching and session management
- Celery + Redis for async task queues (optional)
- WebSocket (Socket.io) for real-time streaming responses

**LLM Integration**
- Primary: Claude (Anthropic)
- Designed with abstraction layer to support GPT-4 and Chinese models (Tongyi Qianwen, Wenxin Yiyan)

### Project Structure (Planned)

```
talkpro/
├── backend/
│   ├── app/
│   │   ├── agents/          # Agent implementations
│   │   │   ├── base.py      # Base agent class
│   │   │   ├── interviewer.py  # Interview agent (algo + system design)
│   │   │   ├── workplace.py    # Workplace simulation agent
│   │   │   └── evaluator.py    # Evaluation agent for feedback
│   │   ├── api/             # API routes
│   │   │   ├── auth.py      # Authentication endpoints
│   │   │   ├── interviews.py # Interview session endpoints
│   │   │   └── dashboard.py # User data and history
│   │   ├── models/          # Database models
│   │   ├── services/        # Business logic
│   │   │   ├── llm/         # LLM abstraction layer
│   │   │   └── storage/     # Database/vector DB services
│   │   └── main.py          # FastAPI app entry point
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── interview/   # Interview-specific components
│   │   │   ├── editor/      # Code editor wrapper
│   │   │   └── charts/      # Visualization components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API client and WebSocket client
│   │   └── stores/          # State management (Zustand/Redux)
│   └── package.json
└── docs/
    ├── requirements.md      # Detailed requirements
    └── architecture.md      # Architecture documentation
```

## Core Agent Design

### Agent Types

1. **Interview Agent** (`interviewer.py`)
   - Generates questions based on difficulty and user history
   - Asks follow-up questions dynamically (not from a static question bank)
   - Adapts depth based on user responses

2. **Workplace Agent** (`workplace.py`)
   - Role-playing scenarios (promotion defense, technical presentation, incident review)
   - Plays different personas (demanding CTO, questioning PM, cautious QA lead)
   - Adjusts difficulty dynamically

3. **Evaluator Agent** (`evaluator.py`)
   - Analyzes user responses
   - Generates detailed feedback reports
   - Scores across multiple dimensions

### LLM Abstraction Layer

The `services/llm/` module will provide a unified interface for multiple LLM providers:
- Primary: Claude (Anthropic API)
- Extensible to: GPT-4, Tongyi Qianwen, Wenxin Yiyan
- Switch models via configuration without code changes

## Development Phases

**Month 1 - MVP Core**
- User authentication
- Algorithm Interview Agent (complete flow)
- Basic Web UI (text-based chat)
- Initial question bank (10-20 questions)

**Month 2 - System Design**
- System Design Interview Agent
- Scenario library (10+ scenarios)
- Training history recording

**Month 3 - Analytics & Polish**
- Personal growth dashboard (radar charts, progress tracking)
- Intelligent training plan recommendations
- Performance optimization and testing
- Production deployment

## Key Design Decisions

### Why This Stack?
- **FastAPI**: Async support, automatic OpenAPI docs, type hints
- **React + TypeScript**: Rapid iteration, strong ecosystem, technical credibility
- **Vector DB**: Enables semantic question matching based on user skill level
- **WebSocket + Streaming**: Critical for real-time conversational feel

### Agent System Philosophy
Agents should:
- Ask dynamic follow-up questions (not pre-scripted)
- Adapt difficulty based on user performance
- Maintain conversation context across multi-turn interactions
- Provide actionable, specific feedback

## Data Model Key Points

**Users**: email, password_hash, name, profile info
**Training Sessions**: user_id, type (algorithm/system_design/workplace), difficulty, conversation_history (JSONB), score (JSONB), feedback
**Questions**: type, title, content, difficulty, tags, solution, evaluation_criteria
**Scenarios**: title, description, role (AI persona), requirements, constraints, evaluation_points

## MVP Scope (v1)

**Includes:**
- User auth (register/login)
- Algorithm Interview Agent (full flow)
- System Design Interview Agent (full flow)
- Basic chat UI
- Training history
- Claude API integration

**Excludes:**
- Code execution sandbox
- Workplace scenarios (promotion defense, etc.)
- Growth dashboard with radar charts
- Third-party login
- Multi-LLM support (Claude only)
- Real-time voice conversation
