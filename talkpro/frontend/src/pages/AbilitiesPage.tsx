import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getAbilitiesStats, getRecommendations } from '../services/api';

interface Abilities {
  algorithm: number;
  system_design: number;
  communication: number;
  project: number;
  overall: number;
  total_sessions: number;
}

export default function AbilitiesPage() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuthStore();
  const [abilities, setAbilities] = useState<Abilities | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const [abilitiesData, recommendationsData] = await Promise.all([
        getAbilitiesStats(token),
        getRecommendations(token, 3),
      ]);
      setAbilities(abilitiesData);
      setRecommendations(recommendationsData.recommendations || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeaknesses = () => {
    if (!abilities) return [];
    const avg = (abilities.algorithm + abilities.system_design + abilities.communication + abilities.project) / 4;
    const weaknesses = [];
    if (abilities.algorithm < avg - 10) {
      weaknesses.push({
        dimension: '算法能力',
        score: abilities.algorithm,
        advice: '建议多练习LeetCode算法题，重点关注动态规划、贪心算法等高级算法',
      });
    }
    if (abilities.system_design < avg - 10) {
      weaknesses.push({
        dimension: '系统设计',
        score: abilities.system_design,
        advice: '建议学习高可用、高并发架构设计，多实践分布式系统场景',
      });
    }
    if (abilities.communication < avg - 10) {
      weaknesses.push({
        dimension: '沟通表达',
        score: abilities.communication,
        advice: '建议在面试中多表达思路，练习清晰地解释技术方案',
      });
    }
    if (abilities.project < avg - 10) {
      weaknesses.push({
        dimension: '项目经验',
        score: abilities.project,
        advice: '建议多完成完整的项目训练，积累实战经验',
      });
    }
    return weaknesses;
  };

  const renderRadarChart = () => {
    if (!abilities) return null;

    const dimensions = [
      { label: '算法能力', value: abilities.algorithm, color: '#4F46E5' },
      { label: '系统设计', value: abilities.system_design, color: '#7C3AED' },
      { label: '沟通表达', value: abilities.communication, color: '#DB2777' },
      { label: '项目经验', value: abilities.project, color: '#059669' },
    ];

    const size = 300;
    const center = size / 2;
    const radius = size / 2 - 40;
    const maxScore = 100;

    // Calculate points for the polygon
    const points = dimensions.map((dim, i) => {
      const angle = (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;
      const value = dim.value / maxScore;
      const x = center + radius * value * Math.cos(angle);
      const y = center + radius * value * Math.sin(angle);
      return { x, y };
    });

    // Calculate background polygon points (grid)
    const gridPoints = [
      { x: center, y: center - radius }, // top
      { x: center + radius * Math.cos(Math.PI / 6), y: center - radius * Math.sin(Math.PI / 6) },
      { x: center + radius * Math.cos(Math.PI / 6), y: center + radius * Math.sin(Math.PI / 6) },
      { x: center, y: center + radius }, // bottom
    ].map((p, i) => {
      const angle = (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');

    const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(' ');

    return (
      <div className="flex justify-center">
        <svg width={size} height={size} className="mx-auto">
          {/* Background grid */}
          {[0.25, 0.5, 0.75, 1].map((scale) => {
            const gridPoints = dimensions.map((_, i) => {
              const angle = (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;
              const x = center + radius * scale * Math.cos(angle);
              const y = center + radius * scale * Math.sin(angle);
              return `${x},${y}`;
            }).join(' ');
            return (
              <polygon
                key={scale}
                points={gridPoints}
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="1"
              />
            );
          })}

          {/* Axis lines */}
          {dimensions.map((_, i) => {
            const angle = (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth="1"
              />
            );
          })}

          {/* Data polygon */}
          <polygon
            points={polygonPoints}
            fill="rgba(79, 70, 229, 0.2)"
            stroke="#4F46E5"
            strokeWidth="2"
          />

          {/* Data points */}
          {points.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="6"
              fill={dimensions[i].color}
            />
          ))}

          {/* Labels */}
          {dimensions.map((dim, i) => {
            const angle = (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;
            const labelRadius = radius + 25;
            const x = center + labelRadius * Math.cos(angle);
            const y = center + labelRadius * Math.sin(angle);

            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-semibold fill-gray-700"
              >
                {dim.label}
              </text>
            );
          })}

          {/* Score labels */}
          {dimensions.map((dim, i) => {
            const angle = (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;
            const scoreRadius = radius * (dim.value / maxScore) - 15;
            const x = center + scoreRadius * Math.cos(angle);
            const y = center + scoreRadius * Math.sin(angle);

            return (
              <text
                key={`score-${i}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-bold fill-white"
              >
                {dim.value}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  if (!abilities) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-600">无法加载数据</div>
      </div>
    );
  }

  const weaknesses = getWeaknesses();

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Radar Chart */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">能力分析</h1>
              <p className="text-gray-600 mb-8">基于你的训练历史评估各维度能力</p>

              {/* Radar Chart */}
              <div className="mb-8">
                {renderRadarChart()}
              </div>

              {/* Overall Score */}
              <div className="text-center mb-8">
                <div className="text-6xl font-bold text-indigo-600 mb-2">
                  {abilities.overall}
                </div>
                <div className="text-gray-600">总体评分</div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">算法能力</div>
                  <div className="text-2xl font-bold text-indigo-600">{abilities.algorithm}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">系统设计</div>
                  <div className="text-2xl font-bold text-purple-600">{abilities.system_design}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">沟通表达</div>
                  <div className="text-2xl font-bold text-pink-600">{abilities.communication}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">项目经验</div>
                  <div className="text-2xl font-bold text-green-600">{abilities.project}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Recommendations */}
          <div className="space-y-6">
            {/* Weaknesses */}
            {weaknesses.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">薄弱点分析</h2>
                <div className="space-y-4">
                  {weaknesses.map((weakness, index) => (
                    <div key={index} className="p-4 bg-red-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-900">{weakness.dimension}</span>
                        <span className="text-red-600 font-bold">{weakness.score}分</span>
                      </div>
                      <p className="text-sm text-gray-700">{weakness.advice}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">推荐训练</h2>
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="p-4 bg-indigo-50 rounded-lg">
                      <div className="font-semibold text-gray-900 mb-2">{rec.title}</div>
                      <p className="text-sm text-gray-700 mb-3">{rec.reason}</p>
                      <button
                        onClick={() => {
                          if (rec.type === 'algorithm') {
                            navigate(`/algorithm?difficulty=${rec.difficulty || 'medium'}`);
                          } else if (rec.type === 'system_design') {
                            navigate(`/system-design?scenario=${rec.scenario || 'design_weibo_feed'}`);
                          }
                        }}
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        开始训练
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">训练统计</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">完成训练</span>
                  <span className="font-semibold text-gray-900">{abilities.total_sessions} 次</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">算法训练</span>
                  <span className="font-semibold text-gray-900">
                    {Math.round(abilities.total_sessions / 2)} 次
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">系统设计</span>
                  <span className="font-semibold text-gray-900">
                    {Math.round(abilities.total_sessions / 2)} 次
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
