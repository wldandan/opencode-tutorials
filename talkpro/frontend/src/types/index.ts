// Algorithm Interview Types
export interface AlgorithmQuestion {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export interface AlgorithmSession {
  sessionId: string;
  question: string;
  difficulty: string;
  messages: Message[];
  isStreaming: boolean;
  score?: AlgorithmScore;
  feedback?: string;
}

export interface AlgorithmScore {
  algorithm: number;
  code_quality: number;
  complexity: number;
  edge_cases: number;
  communication: number;
  overall: number;
  feedback: string;
  improvements: string[];
}

// System Design Types
export interface Scenario {
  id: string;
  title: string;
  description: string;
}

export interface SystemDesignSession {
  sessionId: string;
  scenario: Scenario;
  requirements: string;
  messages: Message[];
  stage: string;
  isStreaming: boolean;
  score?: SystemDesignScore;
  feedback?: string;
}

export interface SystemDesignScore {
  requirements: number;
  architecture: number;
  tech_stack: number;
  scalability: number;
  availability: number;
  consistency: number;
  overall: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}
