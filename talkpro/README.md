# TalkPro - 工程师的 AI 职业教练

<div align="center">

**通过 AI Agent 模拟真实面试场景，帮助工程师提升职业能力**

[算法面试](#算法面试) • [系统设计](#系统设计) • [实时反馈](#核心功能)

</div>

---

## 项目简介

TalkPro 是一个面向后端/全栈工程师的 AI 面试训练平台，通过 AI Agent 模拟真实面试场景，帮助工程师提升算法和系统设计能力。

### 核心特性

- 🤖 **AI 面试官** - 基于 Claude Sonnet 4.5，智能追问和评估
- 💬 **实时对话** - WebSocket 流式响应，流畅的对话体验
- 📊 **详细评估** - 多维度评分和改进建议
- 🎯 **无需注册** - 打开即用，快速开始练习

---

## 快速开始

### 环境要求

- Python 3.10+
- Node.js 18+
- Claude API Key

### 1. 克隆项目

```bash
git clone <repository-url>
cd talkpro
```

### 2. 启动后端

```bash
cd backend

# 创建虚拟环境
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入你的 Claude API Key

# 启动服务
python run.py
```

后端将在 http://localhost:8000 运行

### 3. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端将在 http://localhost:3000 运行

### 4. 开始使用

打开浏览器访问 http://localhost:3000，选择训练类型开始！

---

## 核心功能

### 算法面试

- **难度选择** - 简单、中等、困难
- **10 道算法题** - LeetCode 风格
- **实时追问** - 时间复杂度、空间复杂度、边界条件
- **代码支持** - 可提交代码或文字描述
- **评估维度** - 算法思路、代码质量、复杂度分析、边界考虑、沟通表达

### 系统设计

- **5 个经典场景** - 微博 Feed、秒杀系统、即时通讯、短链接、分布式缓存
- **引导式讨论** - 从需求分析到架构设计
- **深度挑战** - 高可用、扩展性、数据一致性
- **评估维度** - 需求理解、架构设计、技术选型、可扩展性、高可用性、数据一致性

---

## 技术架构

### 后端

- **框架**: FastAPI (Python 3.10+)
- **数据库**: SQLite
- **AI**: Claude Sonnet 4.5 (Anthropic API)
- **通信**: WebSocket (流式响应)

### 前端

- **框架**: React 18 + TypeScript
- **构建**: Vite
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **路由**: React Router

---

## 项目结构

```
talkpro/
├── backend/                    # 后端服务
│   ├── app/
│   │   ├── agents/            # AI Agents
│   │   ├── api/               # API 路由
│   │   ├── services/          # 外部服务
│   │   ├── models/            # 数据模型
│   │   └── main.py            # 应用入口
│   ├── data/                  # 数据文件
│   │   ├── questions.json     # 算法题库
│   │   └── scenarios.json     # 系统设计场景
│   └── requirements.txt
│
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── pages/             # 页面组件
│   │   ├── services/          # API 服务
│   │   ├── stores/            # 状态管理
│   │   └── types/             # 类型定义
│   └── package.json
│
└── docs/                      # 文档
    ├── features/              # 功能需求
    ├── plans/                 # 实现计划
    ├── business-requirements.md
    ├── mvp-scope.md
    └── mvp-features.md
```

---

## API 端点

### 算法面试

```
POST   /api/algorithm/start         - 开始算法面试
POST   /api/algorithm/{id}/answer   - 提交答案
POST   /api/algorithm/{id}/end      - 结束面试并获取报告
GET    /api/algorithm/questions    - 获取题目列表
```

### 系统设计

```
POST   /api/system-design/start       - 开始系统设计面试
POST   /api/system-design/{id}/discuss - 讨论设计方案
POST   /api/system-design/{id}/end    - 结束面试并获取报告
GET    /api/system-design/scenarios   - 获取场景列表
```

### WebSocket

```
WS /ws/algorithm/{session_id}        - 算法面试实时对话
WS /ws/system-design/{session_id}    - 系统设计实时对话
```

---

## 开发计划

- [x] MVP 后端实现
- [x] MVP 前端实现
- [ ] 集成测试
- [ ] 部署上线

详细计划请查看 [docs/mvp-features.md](docs/mvp-features.md)

---

## 常见问题

### Q: 如何获取 Claude API Key？

A: 访问 https://console.anthropic.com/ 注册并创建 API Key

### Q: 后端启动失败？

A: 检查：
1. Python 版本 >= 3.10
2. 依赖是否正确安装
3. .env 文件是否存在且包含有效 API Key

### Q: 前端无法连接后端？

A: 确保后端服务在 http://localhost:8000 运行

### Q: WebSocket 连接失败？

A: 检查后端日志，确认 WebSocket 服务正常启动

---

## 贡献

欢迎提交 Issue 和 Pull Request！

---

## 许可证

MIT License

---

<div align="center">

Made with ❤️ by engineers, for engineers

</div>
