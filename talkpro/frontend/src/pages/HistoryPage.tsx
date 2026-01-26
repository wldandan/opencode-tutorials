import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getTrainingHistory, deleteSession } from '../services/api';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuthStore();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'algorithm' | 'system_design' | 'workplace'>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadHistory();
  }, [isAuthenticated, filter, page]);

  const loadHistory = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const type = filter === 'all' ? undefined : filter;
      const data = await getTrainingHistory(token, page * 10, 10, type);
      setSessions(data.sessions || data.items || []);
      setHasMore((data.sessions || data.items || []).length === 10);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('确定要删除这条训练记录吗？')) return;
    if (!token) return;

    try {
      await deleteSession(token, sessionId);
      loadHistory();
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('删除失败，请稍后重试');
    }
  };

  const handleViewDetail = (session: any) => {
    setSelectedSession(session);
    setShowDetail(true);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      algorithm: '算法面试',
      system_design: '系统设计',
      workplace: '职场场景',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labels = {
      easy: '简单',
      medium: '中等',
      hard: '困难',
    };
    return labels[difficulty as keyof typeof labels] || difficulty;
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600 cursor-pointer" onClick={() => navigate('/')}>
            TalkPro
          </h1>
          <button onClick={() => navigate('/profile')} className="text-gray-600 hover:text-gray-900">
            ← 返回个人资料
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">训练历史</h1>

          {/* Filter */}
          <div className="mb-6 flex gap-4">
            <button
              onClick={() => { setFilter('all'); setPage(0); }}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => { setFilter('algorithm'); setPage(0); }}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                filter === 'algorithm'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              算法面试
            </button>
            <button
              onClick={() => { setFilter('system_design'); setPage(0); }}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                filter === 'system_design'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              系统设计
            </button>
            <button
              onClick={() => { setFilter('workplace'); setPage(0); }}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                filter === 'workplace'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              职场场景
            </button>
          </div>

          {/* Sessions List */}
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">还没有训练记录</p>
              <button
                onClick={() => navigate('/')}
                className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
              >
                开始训练
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {getTypeLabel(session.type)}
                        </h3>
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                          {session.type === 'algorithm'
                            ? getDifficultyLabel(session.difficulty)
                            : session.scenario}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">
                        {new Date(session.created_at).toLocaleString('zh-CN')}
                      </p>
                      {session.score && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700">总体评分:</span>
                          <span className={`text-2xl font-bold ${getScoreColor(session.score.overall)}`}>
                            {session.score.overall}/10
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetail(session)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        查看详情
                      </button>
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {sessions.length > 0 && (
            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <span className="text-gray-600">
                第 {page + 1} 页
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!hasMore}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {showDetail && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {getTypeLabel(selectedSession.type)}
              </h2>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-600 hover:text-gray-900 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Session Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">类型:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {getTypeLabel(selectedSession.type)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">时间:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {new Date(selectedSession.created_at).toLocaleString('zh-CN')}
                  </span>
                </div>
                {selectedSession.difficulty && (
                  <div>
                    <span className="text-gray-600">难度:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {getDifficultyLabel(selectedSession.difficulty)}
                    </span>
                  </div>
                )}
                {selectedSession.scenario && (
                  <div>
                    <span className="text-gray-600">场景:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {selectedSession.scenario}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Score */}
            {selectedSession.score && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">评估报告</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(selectedSession.score).map(([key, value]) => {
                    if (key === 'improvements' || key === 'feedback') return null;
                    const labels: Record<string, string> = {
                      overall: '总体评分',
                      algorithm: '算法思路',
                      code_quality: '代码质量',
                      complexity: '复杂度分析',
                      edge_cases: '边界考虑',
                      requirements: '需求理解',
                      architecture: '架构设计',
                      tech_selection: '技术选型',
                      scalability: '可扩展性',
                      availability: '高可用性',
                      consistency: '数据一致性',
                    };
                    return (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-gray-600">{labels[key] || key}:</span>
                        <span className={`text-xl font-bold ${getScoreColor(value as number)}`}>
                          {value}/10
                        </span>
                      </div>
                    );
                  })}
                </div>
                {selectedSession.score.feedback && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">反馈</h4>
                    <p className="text-gray-700">{selectedSession.score.feedback}</p>
                  </div>
                )}
                {selectedSession.score.improvements && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">改进建议</h4>
                    <ul className="space-y-1">
                      {selectedSession.score.improvements.map((item: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-indigo-600 mr-2">•</span>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">对话记录</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {selectedSession.messages?.map((message: any, index: number) => (
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
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowDetail(false)}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
