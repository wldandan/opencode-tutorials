import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSystemDesignStore } from '../stores/systemDesignStore';
import { useAuthStore } from '../stores/authStore';
import {
  getScenarios,
  startSystemDesignInterview,
  createSystemDesignWebSocket,
  endSystemDesignInterview,
  startSystemDesignInterviewV2,
  createSystemDesignWebSocketV2,
  endSystemDesignInterviewV2,
} from '../services/api';

export default function SystemDesignPage() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuthStore();
  const { session, setSession, addMessage, setStreaming, setStage, setScore, clearSession } = useSystemDesignStore();
  const [input, setInput] = useState('');
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadScenarios();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      clearSession();
    };
  }, [clearSession]);

  useEffect(() => {
    if (session?.messages.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session?.messages]);

  const loadScenarios = async () => {
    try {
      const data = await getScenarios();
      setScenarios(data);
    } catch (error) {
      console.error('Failed to load scenarios:', error);
    }
  };

  const handleSelectScenario = async (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    try {
      // Use v2 API if authenticated, v1 otherwise
      const data = isAuthenticated && token
        ? await startSystemDesignInterviewV2(token, scenarioId)
        : await startSystemDesignInterview(scenarioId);

      setSession({
        sessionId: data.sessionId,
        scenario: data.scenario,
        requirements: data.requirements,
        messages: [{ role: 'assistant', content: data.requirements, timestamp: Date.now() }],
        stage: 'requirements',
        isStreaming: false,
      });

      // Connect WebSocket (v2 or v1 based on auth)
      const ws = isAuthenticated && token
        ? createSystemDesignWebSocketV2(data.sessionId, token)
        : createSystemDesignWebSocket(data.sessionId);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'message_start') {
          setStreaming(true);
          addMessage({ role: 'assistant', content: '', timestamp: Date.now() });
        } else if (data.type === 'message_chunk') {
          if (session) {
            const updatedMessages = [...session.messages];
            const lastMessage = updatedMessages[updatedMessages.length - 1];
            if (lastMessage?.role === 'assistant') {
              lastMessage.content += data.content;
              setSession({ ...session, messages: updatedMessages });
            }
          }
        } else if (data.type === 'message_complete') {
          setStreaming(false);
          setStage(data.stage);
          addMessage({ role: 'assistant', content: data.content, timestamp: Date.now() });
        } else if (data.type === 'error') {
          console.error('WebSocket error:', data.message);
          setStreaming(false);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setStreaming(false);
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        setStreaming(false);
      };
    } catch (error) {
      console.error('Failed to start interview:', error);
      alert('启动面试失败，请稍后重试');
    }
  };

  const handleSend = () => {
    if (!input.trim() || !wsRef.current || session?.isStreaming) return;

    const message = { content: input };
    addMessage({ role: 'user', content: input, timestamp: Date.now() });

    wsRef.current.send(JSON.stringify(message));
    setInput('');
  };

  const handleEnd = async () => {
    if (!session?.sessionId) return;

    try {
      // Use v2 API if authenticated, v1 otherwise
      const report = isAuthenticated && token
        ? await endSystemDesignInterviewV2(token, session.sessionId)
        : await endSystemDesignInterview(session.sessionId);

      setScore(report);
      setShowReport(true);
    } catch (error) {
      console.error('Failed to end interview:', error);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-purple-600 cursor-pointer" onClick={handleBack}>
              TalkPro
            </h1>
            <button onClick={handleBack} className="text-gray-600 hover:text-gray-900">
              ← 返回
            </button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">系统设计面试</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => handleSelectScenario(scenario.id)}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">{scenario.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{scenario.description}</p>
                <div className="text-purple-600 font-semibold">开始设计 →</div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-600 cursor-pointer" onClick={handleBack}>
            TalkPro
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">阶段: {session.stage}</span>
            <button
              onClick={handleEnd}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              结束讨论
            </button>
          </div>
        </div>
      </header>

      {/* Report Modal */}
      {showReport && session.score && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">评估报告</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">需求理解</div>
                <div className="text-2xl font-bold text-purple-600">{session.score.requirements}/10</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">架构设计</div>
                <div className="text-2xl font-bold text-purple-600">{session.score.architecture}/10</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">技术选型</div>
                <div className="text-2xl font-bold text-purple-600">{session.score.tech_stack}/10</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">可扩展性</div>
                <div className="text-2xl font-bold text-purple-600">{session.score.scalability}/10</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">高可用性</div>
                <div className="text-2xl font-bold text-purple-600">{session.score.availability}/10</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">数据一致性</div>
                <div className="text-2xl font-bold text-purple-600">{session.score.consistency}/10</div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="text-sm text-gray-600">总体评分</div>
              <div className="text-3xl font-bold text-green-600">{session.score.overall}/10</div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">反馈</h3>
              <p className="text-gray-700">{session.score.feedback}</p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">优点</h3>
              <ul className="space-y-2">
                {session.score.strengths.map((item: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">改进建议</h3>
              <ul className="space-y-2">
                {session.score.improvements.map((item: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-purple-600 mr-2">•</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowReport(false);
                  clearSession();
                }}
                className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700"
              >
                重新开始
              </button>
              <button
                onClick={handleBack}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg flex flex-col h-[700px]">
          {/* Scenario Info */}
          <div className="border-b p-4 bg-purple-50">
            <h3 className="font-bold text-lg text-gray-900">{session.scenario.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{session.scenario.description}</p>
            <div className="mt-2 text-sm">
              <span className="inline-block bg-purple-200 text-purple-800 px-3 py-1 rounded-full">
                {session.stage}
              </span>
            </div>
          </div>

          {/* Chat Panel */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {session.messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}
            {session.isStreaming && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="描述你的设计方案...（Shift+Enter 换行）"
              className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              disabled={session.isStreaming}
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={handleSend}
                disabled={session.isStreaming || !input.trim()}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                发送
              </button>
            </div>
          </div>
        </div>

        {/* Tips Panel */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">设计建议</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• 明确需求（QPS、数据量、约束条件）</li>
            <li>• 画出示意性架构（用文字描述）</li>
            <li>• 说明技术选型理由</li>
            <li>• 考虑高可用、扩展性、一致性</li>
            <li>• 准备应对挑战和质疑</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
