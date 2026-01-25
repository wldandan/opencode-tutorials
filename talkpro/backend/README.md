# TalkPro Backend

TalkPro 后端服务 - 工程师的 AI 职业教练

## 技术栈

- **Python 3.10+**
- **FastAPI** - Web 框架
- **SQLite** - 数据库
- **Claude API** - AI 模型
- **WebSocket** - 实时通信

## 安装依赖

```bash
# 创建虚拟环境
python3 -m venv .venv

# 激活虚拟环境
source .venv/bin/activate  # Linux/Mac
# 或
.venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt
```

## 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入你的 Claude API Key
ANTHROPIC_API_KEY=your_api_key_here
```

## 运行服务

```bash
# 开发模式（自动重载）
python run.py

# 或使用 uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

服务启动后访问：
- API 文档：http://localhost:8000/docs
- 健康检查：http://localhost:8000/health

## API 端点

### 算法面试

```
POST   /api/algorithm/start        - 开始算法面试
POST   /api/algorithm/{id}/answer  - 提交答案
POST   /api/algorithm/{id}/end     - 结束面试并获取报告
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

## 数据文件

- `data/questions.json` - 算法题库（10 题）
- `data/scenarios.json` - 系统设计场景库（5 个场景）

## 测试

```bash
# 健康检查
curl http://localhost:8000/health

# 获取题目列表
curl http://localhost:8000/api/algorithm/questions

# 获取场景列表
curl http://localhost:8000/api/system-design/scenarios
```

## 项目结构

```
backend/
├── app/
│   ├── agents/          # AI Agent
│   │   ├── algorithm_interviewer.py
│   │   └── system_design_agent.py
│   ├── api/             # API 路由
│   │   ├── algorithm.py
│   │   ├── system_design.py
│   │   ├── websocket.py
│   │   └── schemas.py
│   ├── core/            # 核心模块
│   ├── models/          # 数据模型
│   │   └── session.py
│   ├── services/        # 外部服务
│   │   └── claude.py
│   ├── config.py        # 配置
│   ├── database.py      # 数据库
│   └── main.py          # 应用入口
├── data/                # 数据文件
│   ├── questions.json
│   └── scenarios.json
├── requirements.txt
├── run.py
└── talkpro.db          # SQLite 数据库（自动生成）
```

## 开发说明

- 所有会话数据存储在内存中（重启后丢失）
- 数据持久化到 SQLite（`talkpro.db`）
- Claude API 调用需要有效的 API Key
- WebSocket 连接需要先通过 REST API 创建会话

## 常见问题

**Q: 如何获取 Claude API Key？**
A: 访问 https://console.anthropic.com/ 注册并创建 API Key

**Q: 服务启动失败？**
A: 检查：
1. Python 版本 >= 3.10
2. 依赖是否正确安装
3. .env 文件是否存在且包含有效 API Key

**Q: Claude API 调用失败？**
A: 检查：
1. API Key 是否正确
2. 网络连接是否正常
3. API 额度是否充足
