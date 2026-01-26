import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { startWorkplaceInterview, createWorkplaceWebSocket, endWorkplaceInterview } from '../services/api';

interface Scenario {
  id: string;
  name: string;
  description: string;
  role: string;
}

export default function WorkplacePage() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuthStore();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [input, setInput] = useState('');
  const [showReport, setShowReport] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadScenarios();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (session?.messages.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session?.messages]);

  const loadScenarios = async () => {
    try {
      // 暂时使用硬编码的场景列表
      const scenarios: Scenario[] = [
        {
          id: 'promotion_p5_p6',
          name: '晋升答辩 - P5升P6',
          description: '模拟P5升P6的晋升答辩，重点考察技术深度和问题解决能力',
          role: '技术总监',
        },
        {
          id: 'promotion_p6_p7',
          name: '晋升答辩 - P6升P7',
          description: '模拟P6升P7的晋升答辩，重点考察影响力和领导力',
          role: 'CTO/技术VP',
        },
        {
          id: 'tech_proposal',
          name: '技术方案宣讲',
          description: '模拟向多角色宣讲技术方案，应对各方质疑',
          role: '多角色（产品经理、测试负责人、其他团队开发）',
        },
        {
          id: 'incident_review',
          name: '故障复盘会',
          description: '模拟线上故障复盘会，分析根因和改进措施',
          role: '故障调查组组长',
        },
      ];
      setScenarios(scenarios);
    } catch (error) {
      console.error('Failed to load scenarios:', error);
    }
  };

  const handleSelectScenario = async (scenarioId: string) => {
    if (!token) return;

    try {
      const data = await startWorkplaceInterview(token, scenarioId);
      setSession({
        sessionId: data.sessionId,
        scenario: data.scenario,
        scenarioName: data.scenarioName,
        role: data.role,
        description: data.description,
        messages: [{ role: 'assistant', content: data.question, timestamp: Date.now() }],
        isStreaming: false,
        dimensions: data.dimensions,
      });

      // Connect WebSocket
      const ws = createWorkplaceWebSocket(data.sessionId, token);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'message_start') {
          setSession((prev: any) => ({
            ...prev,
            isStreaming: true,
            messages: [...prev.messages, { role: 'assistant', content: '', timestamp: Date.now() }],
          }));
        } else if (data.type === 'message_chunk') {
          setSession((prev: any) => {
            const updatedMessages = [...prev.messages];
            const lastMessage = updatedMessages[updatedMessages.length - 1];
            if (lastMessage?.role === 'assistant') {
              lastMessage.content += data.content;
            }
            return { ...prev, messages: updatedMessages };
          });
        } else if (data.type === 'message_complete') {
          setSession((prev: any) => ({
            ...prev,
            isStreaming: false,
          }));
        } else if (data.type === 'session_complete') {
          handleEnd(data.evaluation);
        } else if (data.type === 'error') {
          console.error('WebSocket error:', data.message);
          setSession((prev: any) => ({ ...prev, isStreaming: false }));
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setSession((prev: any) => ({ ...prev, isStreaming: false }));
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        setSession((prev: any) => ({ ...prev, isStreaming: false }));
      };
    } catch (error) {
      console.error('Failed to start interview:', error);
      alert('启动面试失败，请稍后重试');
    }
  };

  const handleSend = () => {
    if (!input.trim() || !wsRef.current || session?.isStreaming) return;

    setSession((prev: any) => ({
      ...prev,
      messages: [...prev.messages, { role: 'user', content: input, timestamp: Date.now() }],
    }));

    wsRef.current.send(JSON.stringify({
      type: 'message',
      content: input,
    }));

    setInput('');
  };

  const handleEnd = async (evaluation?: any) => {
    if (!session?.sessionId) return;

    try {
      let report = evaluation;
      if (!report && token) {
        report = await endWorkplaceInterview(token, session.sessionId);
      }

      setSession((prev: any) => ({ ...prev, score: report }));
      setShowReport(true);
    } catch (error) {
      console.error('Failed to end interview:', error);
    }
  };

  const handleEndInterview = () => {
    if (!wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: 'end' }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-green-600 cursor-pointer" onClick={() => navigate('/')}>
              TalkPro
            </h1>
            <button onClick={() => navigate('/')} className="text-gray-600 hover:text-gray-900">
              ← 返回
            </button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">职场场景训练</h2>
            <p className="text-gray-600 mb-8">
              模拟真实的职场场景，提升你的沟通表达和职场应对能力
            </p>

            <div className="space-y-4">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleSelectScenario(scenario.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{scenario.name}</h3>
                      <p className="text-gray-600 mb-3">{scenario.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          {scenario.role}
                        </span>
                      </div>
                    </div>
                    <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                      开始
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
          <h1 className="text-2xl font-bold text-green-600 cursor-pointer" onClick={() => navigate('/')}>
            TalkPro
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{session.scenarioName}</span>
            <button
              onClick={handleEndInterview}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              结束训练
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
                <div className="text-sm text-gray-600">技术深度</div>
                <div className={`text-2xl font-bold ${getScoreColor(session.score.technical_depth)}`}>
                  {session.score.technical_depth}/10
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">业务理解</div>
                <div className={`text-2xl font-bold ${getScoreColor(session.score.business_understanding)}`}>
                  {session.score.business_understanding}/10
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">沟通表达</div>
                <div className={`text-2xl font-bold ${getScoreColor(session.score.communication)}`}>
                  {session.score.communication}/10
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">逻辑思维</div>
                <div className={`text-2xl font-bold ${getScoreColor(session.score.logical_thinking)}`}>
                  {session.score.logical_thinking}/10
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="text-sm text-gray-600">总体评分</div>
              <div className={`text-3xl font-bold ${getScoreColor(session.score.overall)}`}>
                {session.score.overall}/10
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">反馈</h3>
              <p className="text-gray-700">{session.score.feedback}</p>
            </div>

            {session.score.strengths && session.score.strengths.length > 0 && (
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
            )}

            {session.score.improvements && session.score.improvements.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">改进建议</h3>
                <ul className="space-y-2">
                  {session.score.improvements.map((item: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowReport(false);
                  setSession(null);
                }}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700"
              >
                重新开始
              </button>
              <button
                onClick={() => navigate('/')}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Panel */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg flex flex-col h-[600px]">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {session.messages.map((message: any, index: number) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="text-xs text-gray-600 mb-2">{session.role}</div>
                    )}
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
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="输入你的回答...（Shift+Enter 换行）"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={session.isStreaming}
                />
                <button
                  onClick={handleSend}
                  disabled={session.isStreaming || !input.trim()}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  发送
                </button>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">场景信息</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-600">场景</div>
                <div className="font-medium text-gray-900">{session.scenarioName}</div>
              </div>
              <div>
                <div className="text-gray-600">角色</div>
                <div className="font-medium text-gray-900">{session.role}</div>
              </div>
              <div>
                <div className="text-gray-600">消息数</div>
                <div className="font-medium text-gray-900">{session.messages.length}</div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold text-gray-900 mb-2">提示</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 这是真实场景模拟</li>
                <li>• 角色会质疑你的回答</li>
                <li>• 保持冷静和专业</li>
                <li>• 具体说明你的做法</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
