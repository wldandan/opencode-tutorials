import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getGrowthStats } from '../services/api';

interface Milestone {
  date: string;
  title: string;
  description: string;
}

interface GrowthData {
  date: string;
  type: string;
  score: number;
}

export default function GrowthPage() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuthStore();
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadGrowthData();
  }, [isAuthenticated, days]);

  const loadGrowthData = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const data = await getGrowthStats(token, days);
      setGrowthData(data.growth_data || []);
      setMilestones(data.milestones || []);
    } catch (error) {
      console.error('Failed to load growth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (growthData.length === 0) return null;

    const width = 800;
    const height = 400;
    const padding = { top: 40, right: 40, bottom: 60, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Filter data by type
    const algoData = growthData.filter((d) => d.type === 'algorithm');
    const designData = growthData.filter((d) => d.type === 'system_design');

    // Calculate scales
    const allScores = growthData.map((d) => d.score);
    const minScore = Math.min(...allScores, 0);
    const maxScore = Math.max(...allScores, 100);

    const dates = [...new Set(growthData.map((d) => d.date))].sort();
    const minDate = new Date(dates[0]);
    const maxDate = new Date(dates[dates.length - 1]);

    const getX = (date: string) => {
      const d = new Date(date);
      const ratio = (d.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime() || 1);
      return padding.left + ratio * chartWidth;
    };

    const getY = (score: number) => {
      const ratio = (score - minScore) / (maxScore - minScore || 1);
      return padding.top + chartHeight - ratio * chartHeight;
    };

    // Generate line points
    const generateLinePoints = (data: GrowthData[]) => {
      return data
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((d) => `${getX(d.date)},${getY(d.score)}`)
        .join(' ');
    };

    const algoPoints = generateLinePoints(algoData);
    const designPoints = generateLinePoints(designData);

    // Generate Y-axis grid lines and labels
    const yGridLines = [];
    for (let i = 0; i <= 5; i++) {
      const score = minScore + (maxScore - minScore) * (i / 5);
      const y = getY(score);
      yGridLines.push(
        <g key={i}>
          <line
            x1={padding.left}
            y1={y}
            x2={width - padding.right}
            y2={y}
            stroke="#E5E7EB"
            strokeWidth="1"
          />
          <text
            x={padding.left - 10}
            y={y}
            textAnchor="end"
            dominantBaseline="middle"
            className="text-xs fill-gray-600"
          >
            {score.toFixed(0)}
          </text>
        </g>
      );
    }

    // Generate X-axis labels
    const xLabels = dates.filter((_, i) => i % Math.ceil(dates.length / 6) === 0);
    const xLabelsElements = xLabels.map((date) => {
      const x = getX(date);
      const dateObj = new Date(date);
      const label = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
      return (
        <text
          key={date}
          x={x}
          y={height - padding.bottom + 20}
          textAnchor="middle"
          className="text-xs fill-gray-600"
        >
          {label}
        </text>
      );
    });

    // Generate data points for tooltip
    const renderDataPoints = (data: GrowthData[], color: string) => {
      return data
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((d) => (
          <circle
            key={`${d.date}-${d.type}`}
            cx={getX(d.date)}
            cy={getY(d.score)}
            r="4"
            fill={color}
            className="hover:r-6 transition-all cursor-pointer"
          >
            <title>
              {d.date}: {d.score}分
            </title>
          </circle>
        ));
    };

    return (
      <div className="overflow-x-auto">
        <svg width={width} height={height} className="mx-auto">
          {/* Y-axis grid lines */}
          {yGridLines}

          {/* X-axis labels */}
          {xLabelsElements}

          {/* Axis labels */}
          <text
            x={width / 2}
            y={height - 10}
            textAnchor="middle"
            className="text-sm font-semibold fill-gray-700"
          >
            日期
          </text>
          <text
            x={20}
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90, 20, ${height / 2})`}
            className="text-sm font-semibold fill-gray-700"
          >
            评分
          </text>

          {/* Algorithm line */}
          {algoPoints && (
            <polyline
              points={algoPoints}
              fill="none"
              stroke="#4F46E5"
              strokeWidth="2"
            />
          )}

          {/* System design line */}
          {designPoints && (
            <polyline
              points={designPoints}
              fill="none"
              stroke="#7C3AED"
              strokeWidth="2"
            />
          )}

          {/* Data points */}
          {renderDataPoints(algoData, '#4F46E5')}
          {renderDataPoints(designData, '#7C3AED')}
        </svg>

        {/* Legend */}
        <div className="flex justify-center gap-8 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-indigo-600"></div>
            <span className="text-sm text-gray-700">算法能力</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-purple-600"></div>
            <span className="text-sm text-gray-700">系统设计</span>
          </div>
        </div>
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
          {/* Left Column: Growth Chart */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">成长轨迹</h1>
                  <p className="text-gray-600">查看你的能力随时间的变化</p>
                </div>
                <select
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="7">最近7天</option>
                  <option value="30">最近30天</option>
                  <option value="90">最近90天</option>
                </select>
              </div>

              {growthData.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">暂无数据</p>
                  <button
                    onClick={() => navigate('/')}
                    className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    开始训练
                  </button>
                </div>
              ) : (
                renderChart()
              )}
            </div>
          </div>

          {/* Right Column: Milestones */}
          <div className="space-y-6">
            {milestones.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">关键节点</h2>
                <div className="space-y-4">
                  {milestones.map((milestone, index) => (
                    <div key={index} className="p-4 bg-indigo-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div className="text-sm text-gray-600">{milestone.date}</div>
                      </div>
                      <div className="font-semibold text-gray-900 mb-1">{milestone.title}</div>
                      <div className="text-sm text-gray-700">{milestone.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats Summary */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">数据概览</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">时间范围</span>
                  <span className="font-semibold text-gray-900">最近{days}天</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">训练次数</span>
                  <span className="font-semibold text-gray-900">{growthData.length}次</span>
                </div>
                {growthData.length > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">最高分</span>
                      <span className="font-semibold text-green-600">
                        {Math.max(...growthData.map((d) => d.score)).toFixed(1)}分
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">平均分</span>
                      <span className="font-semibold text-indigo-600">
                        {(growthData.reduce((sum, d) => sum + d.score, 0) / growthData.length).toFixed(1)}分
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 成长建议</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">•</span>
                  <span>保持每周至少2次的训练频率</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">•</span>
                  <span>关注上升趋势，即使进步很小也是成长</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">•</span>
                  <span>根据薄弱点进行针对性训练</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
