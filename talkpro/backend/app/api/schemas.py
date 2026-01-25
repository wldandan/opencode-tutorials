from pydantic import BaseModel
from typing import Optional, List


# Algorithm Interview Schemas
class AlgorithmStartRequest(BaseModel):
    difficulty: str  # easy, medium, hard


class AlgorithmAnswerRequest(BaseModel):
    content: str
    code: Optional[str] = None


class AlgorithmStartResponse(BaseModel):
    sessionId: str
    question: str
    difficulty: str


class AlgorithmAnswerResponse(BaseModel):
    reply: str
    completed: bool


# System Design Schemas
class SystemDesignStartRequest(BaseModel):
    scenarioId: str


class SystemDesignDiscussRequest(BaseModel):
    content: str


class SystemDesignStartResponse(BaseModel):
    sessionId: str
    scenario: dict
    requirements: str


class SystemDesignDiscussResponse(BaseModel):
    reply: str
    stage: str


# Question and Scenario Schemas
class QuestionInfo(BaseModel):
    id: str
    title: str
    difficulty: str


class ScenarioInfo(BaseModel):
    id: str
    title: str
    description: str


# Report Schemas
class AlgorithmReport(BaseModel):
    algorithm: int
    code_quality: int
    complexity: int
    edge_cases: int
    communication: int
    overall: int
    feedback: str
    improvements: List[str]


class SystemDesignReport(BaseModel):
    requirements: int
    architecture: int
    tech_stack: int
    scalability: int
    availability: int
    consistency: int
    overall: int
    feedback: str
    strengths: List[str]
    improvements: List[str]
