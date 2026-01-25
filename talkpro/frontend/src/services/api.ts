const API_BASE_URL = '/api';

// Algorithm Interview API
export async function startAlgorithmInterview(difficulty: string) {
  const response = await fetch(`${API_BASE_URL}/algorithm/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ difficulty }),
  });
  if (!response.ok) throw new Error('Failed to start interview');
  return response.json();
}

export async function submitAlgorithmAnswer(sessionId: string, content: string, code?: string) {
  const response = await fetch(`${API_BASE_URL}/algorithm/${sessionId}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, code }),
  });
  if (!response.ok) throw new Error('Failed to submit answer');
  return response.json();
}

export async function endAlgorithmInterview(sessionId: string) {
  const response = await fetch(`${API_BASE_URL}/algorithm/${sessionId}/end`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to end interview');
  return response.json();
}

export async function getAlgorithmQuestions() {
  const response = await fetch(`${API_BASE_URL}/algorithm/questions`);
  if (!response.ok) throw new Error('Failed to fetch questions');
  return response.json();
}

// System Design API
export async function startSystemDesignInterview(scenarioId: string) {
  const response = await fetch(`${API_BASE_URL}/system-design/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenarioId }),
  });
  if (!response.ok) throw new Error('Failed to start interview');
  return response.json();
}

export async function discussDesign(sessionId: string, content: string) {
  const response = await fetch(`${API_BASE_URL}/system-design/${sessionId}/discuss`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) throw new Error('Failed to discuss design');
  return response.json();
}

export async function endSystemDesignInterview(sessionId: string) {
  const response = await fetch(`${API_BASE_URL}/system-design/${sessionId}/end`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to end interview');
  return response.json();
}

export async function getScenarios() {
  const response = await fetch(`${API_BASE_URL}/system-design/scenarios`);
  if (!response.ok) throw new Error('Failed to fetch scenarios');
  return response.json();
}

// WebSocket connection
export function createAlgorithmWebSocket(sessionId: string): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return new WebSocket(`${protocol}//${host}/ws/algorithm/${sessionId}`);
}

export function createSystemDesignWebSocket(sessionId: string): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return new WebSocket(`${protocol}//${host}/ws/system-design/${sessionId}`);
}
