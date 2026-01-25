const API_BASE = '/api';

// Auth API
export async function register(name: string, email: string, password: string) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration failed');
  }
  return response.json();
}

export async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }
  return response.json();
}

export async function getCurrentUser(token: string) {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  return response.json();
}

export async function updateUserProfile(token: string, updates: object) {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error('Failed to update profile');
  }
  return response.json();
}

// History API
export async function getTrainingHistory(token: string, skip: number = 0, limit: number = 20, type?: string) {
  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
  });
  if (type) params.append('type', type);

  const response = await fetch(`${API_BASE}/history?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch history');
  }
  return response.json();
}

export async function getSessionDetail(token: string, sessionId: string) {
  const response = await fetch(`${API_BASE}/history/${sessionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch session detail');
  }
  return response.json();
}

export async function deleteSession(token: string, sessionId: string) {
  const response = await fetch(`${API_BASE}/history/${sessionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to delete session');
  }
  return response.json();
}

// Algorithm Interview APIs (v1 - no auth)
export async function startAlgorithmInterview(difficulty: 'easy' | 'medium' | 'hard') {
  const response = await fetch(`${API_BASE}/algorithm/interview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ difficulty }),
  });
  if (!response.ok) {
    throw new Error('Failed to start interview');
  }
  return response.json();
}

export function createAlgorithmWebSocket(sessionId: string): WebSocket {
  return new WebSocket(`ws://localhost:8000${API_BASE}/algorithm/${sessionId}/ws`);
}

export async function endAlgorithmInterview(sessionId: string) {
  const response = await fetch(`${API_BASE}/algorithm/${sessionId}/end`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to end interview');
  }
  return response.json();
}

// Algorithm Interview APIs (v2 - with auth)
export async function startAlgorithmInterviewV2(token: string, difficulty: 'easy' | 'medium' | 'hard') {
  const response = await fetch(`${API_BASE}/algorithm/v2/interview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ difficulty }),
  });
  if (!response.ok) {
    throw new Error('Failed to start interview');
  }
  return response.json();
}

export function createAlgorithmWebSocketV2(sessionId: string, token: string): WebSocket {
  return new WebSocket(`ws://localhost:8000${API_BASE}/algorithm/v2/${sessionId}/ws?token=${token}`);
}

export async function endAlgorithmInterviewV2(token: string, sessionId: string) {
  const response = await fetch(`${API_BASE}/algorithm/v2/${sessionId}/end`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to end interview');
  }
  return response.json();
}

// System Design APIs (v1 - no auth)
export async function getScenarios() {
  const response = await fetch(`${API_BASE}/system-design/scenarios`);
  if (!response.ok) {
    throw new Error('Failed to fetch scenarios');
  }
  return response.json();
}

export async function startSystemDesignInterview(scenario: string) {
  const response = await fetch(`${API_BASE}/system-design/interview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario }),
  });
  if (!response.ok) {
    throw new Error('Failed to start interview');
  }
  return response.json();
}

export function createSystemDesignWebSocket(sessionId: string): WebSocket {
  return new WebSocket(`ws://localhost:8000${API_BASE}/system-design/${sessionId}/ws`);
}

export async function endSystemDesignInterview(sessionId: string) {
  const response = await fetch(`${API_BASE}/system-design/${sessionId}/end`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to end interview');
  }
  return response.json();
}

// System Design APIs (v2 - with auth)
export async function startSystemDesignInterviewV2(token: string, scenario: string) {
  const response = await fetch(`${API_BASE}/system-design/v2/interview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ scenario }),
  });
  if (!response.ok) {
    throw new Error('Failed to start interview');
  }
  return response.json();
}

export function createSystemDesignWebSocketV2(sessionId: string, token: string): WebSocket {
  return new WebSocket(`ws://localhost:8000${API_BASE}/system-design/v2/${sessionId}/ws?token=${token}`);
}

export async function endSystemDesignInterviewV2(token: string, sessionId: string) {
  const response = await fetch(`${API_BASE}/system-design/v2/${sessionId}/end`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to end interview');
  }
  return response.json();
}
