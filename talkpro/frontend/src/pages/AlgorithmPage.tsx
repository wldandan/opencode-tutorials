import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlgorithmStore } from '../stores/algorithmStore';
import { useAuthStore } from '../stores/authStore';
import {
  startAlgorithmInterview,
  createAlgorithmWebSocket,
  endAlgorithmInterview,
  startAlgorithmInterviewV2,
  createAlgorithmWebSocketV2,
  endAlgorithmInterviewV2,
} from '../services/api';

export default function AlgorithmPage() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuthStore();
  const { session, setSession, addMessage, setStreaming, setScore, clearSession } = useAlgorithmStore();
  const [input, setInput] = useState('');
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [showReport, setShowReport] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

  const handleStart = async () => {
    try {
      // Use v2 API if authenticated, v1 otherwise
      const data = isAuthenticated && token
        ? await startAlgorithmInterviewV2(token, difficulty)
        : await startAlgorithmInterview(difficulty);

      setSession({
        sessionId: data.sessionId,
        question: data.question,
        difficulty: data.difficulty,
        messages: [{ role: 'assistant', content: data.question, timestamp: Date.now() }],
        isStreaming: false,
      });

      // Connect WebSocket (v2 or v1 based on auth)
      const ws = isAuthenticated && token
        ? createAlgorithmWebSocketV2(data.sessionId, token)
        : createAlgorithmWebSocket(data.sessionId);
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
          // Update last message
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
          addMessage({ role: 'assistant', content: data.content, timestamp: Date.now() });

          if (data.completed) {
            handleEnd();
          }
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

    const message = { content: input, code: showCode ? code : undefined };
    addMessage({ role: 'user', content: input, timestamp: Date.now() });

    wsRef.current.send(JSON.stringify(message));

    setInput('');
    setCode('');
  };

  const handleEnd = async () => {
    if (!session?.sessionId) return;

    try {
      // Use v2 API if authenticated, v1 otherwise
      const report = isAuthenticated && token
        ? await endAlgorithmInterviewV2(token, session.sessionId)
        : await endAlgorithmInterview(session.sessionId);

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600 cursor-pointer" onClick={handleBack}>
              TalkPro
            </h1>
            <button onClick={handleBack} className="text-gray-600 hover:text-gray-900">
              ← 返回
            </button>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">算法面试</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择难度
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setDifficulty('easy')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                    difficulty === 'easy'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  简单
                </button>
                <button
                  onClick={() => setDifficulty('medium')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                    difficulty === 'medium'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  中等
                </button>
                <button
                  onClick={() => setDifficulty('hard')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                    difficulty === 'hard'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  困难
                </button>
              </div>
            </div>

            <button
              onClick={handleStart}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              开始面试
            </button>
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
          <h1 className="text-2xl font-bold text-indigo-600 cursor-pointer" onClick={handleBack}>
            TalkPro
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              难度: {session.difficulty === 'easy' ? '简单' : session.difficulty === 'medium' ? '中等' : '困难'}
            </span>
            <button
              onClick={handleEnd}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              结束面试
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
                <div className="text-sm text-gray-600">算法思路</div>
                <div className="text-2xl font-bold text-indigo-600">{session.score.algorithm}/10</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">代码质量</div>
                <div className="text-2xl font-bold text-indigo-600">{session.score.code_quality}/10</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">复杂度分析</div>
                <div className="text-2xl font-bold text-indigo-600">{session.score.complexity}/10</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">边界考虑</div>
                <div className="text-2xl font-bold text-indigo-600">{session.score.edge_cases}/10</div>
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
              <h3 className="font-semibold text-gray-900 mb-2">改进建议</h3>
              <ul className="space-y-2">
                {session.score.improvements.map((item: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-indigo-600 mr-2">•</span>
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
                className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Panel */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg flex flex-col h-[600px]">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {session.messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white'
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
              <div className="mb-2">
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  {showCode ? '▼' : '▶'} {showCode ? '隐藏' : '显示'}代码编辑器
                </button>
              </div>

              {showCode && (
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="在此输入代码（可选）..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg mb-2 font-mono text-sm"
                />
              )}

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="输入你的回答...（Shift+Enter 换行）"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={session.isStreaming}
                />
                <button
                  onClick={handleSend}
                  disabled={session.isStreaming || !input.trim()}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  发送
                </button>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">面试信息</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-600">难度</div>
                <div className="font-medium text-gray-900">
                  {session.difficulty === 'easy' ? '简单' : session.difficulty === 'medium' ? '中等' : '困难'}
                </div>
              </div>
              <div>
                <div className="text-gray-600">消息数</div>
                <div className="font-medium text-gray-900">{session.messages.length}</div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold text-gray-900 mb-2">提示</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 详细说明你的思路</li>
                <li>• 分析时间和空间复杂度</li>
                <li>• 考虑边界情况</li>
                <li>• 可以提交代码或文字描述</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
