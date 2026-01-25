import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-indigo-600">TalkPro</h1>
          <p className="text-gray-600 mt-1">工程师的 AI 职业教练</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            提升你的面试能力
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            通过 AI 模拟真实面试场景，帮助你准备算法和系统设计面试
          </p>
        </div>

        {/* Training Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Algorithm Interview Card */}
          <Link to="/algorithm" className="group">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 cursor-pointer h-full">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-100 p-3 rounded-full">
                  <svg
                    className="h-8 w-8 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 ml-4">
                  算法面试
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                与 AI 面试官进行算法题练习，获得实时反馈和改进建议
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  LeetCode 风格算法题
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  实时追问和指导
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  详细评估报告
                </li>
              </ul>
              <div className="mt-6 text-indigo-600 font-semibold group-hover:text-indigo-700">
                开始练习 →
              </div>
            </div>
          </Link>

          {/* System Design Card */}
          <Link to="/system-design" className="group">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 cursor-pointer h-full">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <svg
                    className="h-8 w-8 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 ml-4">
                  系统设计
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                与架构师讨论系统设计方案，提升架构设计能力
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  经典系统设计场景
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  引导式讨论
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  深度架构评估
                </li>
              </ul>
              <div className="mt-6 text-purple-600 font-semibold group-hover:text-purple-700">
                开始设计 →
              </div>
            </div>
          </Link>
        </div>

        {/* Features Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            为什么选择 TalkPro？
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="h-8 w-8 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">实时反馈</h4>
              <p className="text-gray-600 text-sm">AI 面试官实时追问，模拟真实面试场景</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="h-8 w-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">详细评估</h4>
              <p className="text-gray-600 text-sm">多维度评分和改进建议，明确提升方向</p>
            </div>
            <div className="text-center">
              <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="h-8 w-8 text-pink-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">随时随地</h4>
              <p className="text-gray-600 text-sm">无需注册，立即开始练习，节省时间</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
