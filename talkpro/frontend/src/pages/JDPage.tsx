import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { analyzeJD, getJD, compareResumeJD, deleteJD } from '../services/api';

interface JDData {
  company?: string;
  position?: string;
  basic_requirements?: {
    education?: string;
    experience?: string;
    location?: string;
    salary?: string;
  };
  skills?: {
    required?: string[];
    preferred?: string[];
  };
  responsibilities?: string[];
  requirements?: {
    technical?: string[];
    soft_skills?: string[];
    certifications?: string[];
  };
  team_info?: {
    team_size?: string;
    team_structure?: string;
    tech_stack?: string;
  };
  highlights?: string[];
  keywords?: string[];
}

interface GapAnalysis {
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  gap_analysis: {
    technical_gap?: string;
    experience_gap?: string;
    education_gap?: string;
  };
  improvement_suggestions: string[];
  recommended_training: Array<{
    type: string;
    reason: string;
    priority: number;
  }>;
}

export default function JDPage() {
  const navigate = useNavigate();
  const { token, isAuthenticated, user } = useAuthStore();
  const [jdText, setJdText] = useState('');
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [jdData, setJdData] = useState<JDData | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'input' | 'result' | 'compare'>('input');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadJD();
  }, [isAuthenticated]);

  const loadJD = async () => {
    if (!token) return;

    try {
      const data = await getJD(token);
      if (data.jd_data) {
        setJdData(data.jd_data);
        setActiveTab('result');
      }
    } catch (err: any) {
      console.error('Failed to load JD:', err);
    }
  };

  const handleAnalyze = async () => {
    if (!jdText.trim()) {
      setError('请输入JD内容');
      return;
    }
    if (!token) return;

    setAnalyzing(true);
    setError('');

    try {
      const data = await analyzeJD(token, {
        jd_text: jdText,
        company: company || undefined,
        position: position || undefined,
      });
      setJdData(data.data);
      setSuccess('JD分析成功！');
      setActiveTab('result');
    } catch (err: any) {
      setError(err.message || '分析失败，请稍后重试');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCompare = async () => {
    if (!token) return;

    setComparing(true);
    setError('');

    try {
      const data = await compareResumeJD(token);
      setGapAnalysis(data.data);
      setActiveTab('compare');
    } catch (err: any) {
      if (err.message && err.message.includes('请先上传简历')) {
        setError('请先上传简历');
      } else {
        setError(err.message || '差距分析失败');
      }
    } finally {
      setComparing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除JD数据吗？')) return;
    if (!token) return;

    try {
      await deleteJD(token);
      setJdData(null);
      setGapAnalysis(null);
      setSuccess('JD已删除');
    } catch (err: any) {
      setError(err.message || '删除失败');
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const renderJDInput = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          JD内容
        </label>
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="粘贴职位描述内容..."
          className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <p className="text-sm text-gray-500 mt-2">
          可以从招聘网站、猎头或公司官网复制JD内容
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            公司名称（可选）
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="例如：字节跳动"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            职位名称（可选）
          </label>
          <input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="例如：后端工程师"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={analyzing || !jdText.trim()}
        className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {analyzing ? '分析中...' : '开始分析'}
      </button>
    </div>
  );

  const renderJDResult = () => {
    if (!jdData) return null;

    return (
      <div className="space-y-6">
        {/* 基本信息 */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-gray-600">公司</span>
              <div className="font-medium text-gray-900">{jdData.company || '-'}</div>
            </div>
            <div>
              <span className="text-sm text-gray-600">职位</span>
              <div className="font-medium text-gray-900">{jdData.position || '-'}</div>
            </div>
            {jdData.basic_requirements?.education && (
              <div>
                <span className="text-sm text-gray-600">学历</span>
                <div className="font-medium text-gray-900">{jdData.basic_requirements.education}</div>
              </div>
            )}
            {jdData.basic_requirements?.experience && (
              <div>
                <span className="text-sm text-gray-600">经验</span>
                <div className="font-medium text-gray-900">{jdData.basic_requirements.experience}</div>
              </div>
            )}
          </div>
        </div>

        {/* 技能要求 */}
        {jdData.skills && (jdData.skills.required || jdData.skills.preferred) && (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">技能要求</h3>
            {jdData.skills.required && jdData.skills.required.length > 0 && (
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">必需技能</div>
                <div className="flex flex-wrap gap-2">
                  {jdData.skills.required.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {jdData.skills.preferred && jdData.skills.preferred.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">加分技能</div>
                <div className="flex flex-wrap gap-2">
                  {jdData.skills.preferred.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 岗位职责 */}
        {jdData.responsibilities && jdData.responsibilities.length > 0 && (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">岗位职责</h3>
            <ul className="space-y-2">
              {jdData.responsibilities.map((resp, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-indigo-600 mr-2">•</span>
                  <span className="text-gray-700">{resp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 具体要求 */}
        {jdData.requirements && (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">具体要求</h3>
            {jdData.requirements.technical && jdData.requirements.technical.length > 0 && (
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">技术要求</div>
                <div className="flex flex-wrap gap-2">
                  {jdData.requirements.technical.map((req, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                      {req}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {jdData.requirements.soft_skills && jdData.requirements.soft_skills.length > 0 && (
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">软技能</div>
                <div className="flex flex-wrap gap-2">
                  {jdData.requirements.soft_skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 团队信息 */}
        {jdData.team_info && (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">团队信息</h3>
            <div className="space-y-2 text-sm">
              {jdData.team_info.team_size && (
                <div>
                  <span className="text-gray-600">团队规模:</span>
                  <span className="ml-2 text-gray-900">{jdData.team_info.team_size}</span>
                </div>
              )}
              {jdData.team_info.tech_stack && (
                <div>
                  <span className="text-gray-600">技术栈:</span>
                  <span className="ml-2 text-gray-900">{jdData.team_info.tech_stack}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('input')}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            重新分析
          </button>
          <button
            onClick={handleCompare}
            disabled={comparing || !user?.resume_data}
            className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {comparing ? '分析中...' : '对比简历'}
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-50 text-red-600 py-3 px-6 rounded-lg font-semibold hover:bg-red-100 transition-colors"
          >
            删除
          </button>
        </div>
      </div>
    );
  };

  const renderGapAnalysis = () => {
    if (!gapAnalysis) return null;

    return (
      <div className="space-y-6">
        {/* 匹配度评分 */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-8 rounded-lg text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">简历匹配度</h3>
          <div className={`text-6xl font-bold ${getMatchScoreColor(gapAnalysis.match_score)} rounded-lg py-4`}>
            {gapAnalysis.match_score}%
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {gapAnalysis.match_score >= 80 ? '你的简历与岗位要求高度匹配！' :
             gapAnalysis.match_score >= 60 ? '你的简历基本符合岗位要求。' :
             '你的简历与岗位要求有较大差距。'}
          </p>
        </div>

        {/* 匹配和缺失技能 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gapAnalysis.matched_skills && gapAnalysis.matched_skills.length > 0 && (
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">✓ 匹配技能</h3>
              <div className="flex flex-wrap gap-2">
                {gapAnalysis.matched_skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {gapAnalysis.missing_skills && gapAnalysis.missing_skills.length > 0 && (
            <div className="bg-red-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">✗ 缺失技能</h3>
              <div className="flex flex-wrap gap-2">
                {gapAnalysis.missing_skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 差距分析 */}
        {gapAnalysis.gap_analysis && (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">差距分析</h3>
            <div className="space-y-3 text-sm">
              {gapAnalysis.gap_analysis.technical_gap && (
                <div>
                  <span className="font-medium text-gray-700">技术差距:</span>
                  <p className="text-gray-600 mt-1">{gapAnalysis.gap_analysis.technical_gap}</p>
                </div>
              )}
              {gapAnalysis.gap_analysis.experience_gap && (
                <div>
                  <span className="font-medium text-gray-700">经验差距:</span>
                  <p className="text-gray-600 mt-1">{gapAnalysis.gap_analysis.experience_gap}</p>
                </div>
              )}
              {gapAnalysis.gap_analysis.education_gap && (
                <div>
                  <span className="font-medium text-gray-700">学历差距:</span>
                  <p className="text-gray-600 mt-1">{gapAnalysis.gap_analysis.education_gap}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 改进建议 */}
        {gapAnalysis.improvement_suggestions && gapAnalysis.improvement_suggestions.length > 0 && (
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 改进建议</h3>
            <ul className="space-y-2">
              {gapAnalysis.improvement_suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span className="text-gray-700">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 推荐训练 */}
        {gapAnalysis.recommended_training && gapAnalysis.recommended_training.length > 0 && (
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 推荐训练</h3>
            <div className="space-y-3">
              {gapAnalysis.recommended_training.map((rec, index) => (
                <div key={index} className="border border-green-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-green-600 text-white rounded text-xs font-bold">
                      {rec.priority}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {rec.type === 'algorithm' ? '算法训练' :
                       rec.type === 'system_design' ? '系统设计训练' :
                       rec.type === 'workplace' ? '职场场景训练' : '综合训练'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{rec.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 返回按钮 */}
        <button
          onClick={() => setActiveTab('result')}
          className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
        >
          返回JD详情
        </button>
      </div>
    );
  };

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">目标岗位分析</h1>
          <p className="text-gray-600 mb-6">
            分析目标岗位的要求，对比你的简历，获得个性化提升建议
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6">
              {success}
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('input')}
                className={`py-4 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === 'input'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                输入JD
              </button>
              {jdData && (
                <button
                  onClick={() => setActiveTab('result')}
                  className={`py-4 px-1 border-b-2 font-medium transition-colors ${
                    activeTab === 'result'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  分析结果
                </button>
              )}
              {gapAnalysis && (
                <button
                  onClick={() => setActiveTab('compare')}
                  className={`py-4 px-1 border-b-2 font-medium transition-colors ${
                    activeTab === 'compare'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  简历对比
                </button>
              )}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'input' && renderJDInput()}
          {activeTab === 'result' && renderJDResult()}
          {activeTab === 'compare' && renderGapAnalysis()}
        </div>
      </main>
    </div>
  );
}
