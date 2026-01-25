# TalkPro MVP 设计文档

**日期**: 2026-01-25
**版本**: v1.0
**状态**: 设计完成

---

## 1. 项目概述

TalkPro 是一个面向工程师的 AI 职业教练平台，通过 AI Agent 模拟真实面试场景帮助用户提升能力。

### MVP 范围

**包含功能:**
- 算法面试 Agent（完整对话流程）
- 代码编辑器集成
- SQLite 持久化对话历史
- WebSocket 实时流式响应
- 简单的评估报告

**暂不包含:**
- 用户认证系统
- 系统设计 Agent
- 成长看板
- 代码执行沙箱

---

## 2. 技术栈

### 后端
- **语言**: Python 3.10+
- **框架**: FastAPI
- **数据库**: SQLite + SQLAlchemy
- **LLM**: Claude Sonnet 4.5 (Anthropic API)
- **通信**: WebSocket (实时流式响应)

### 前端
- **框架**: React 18 + TypeScript
- **构建**: Vite
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **编辑器**: Monaco Editor
- **通信**: WebSocket Client

---

## 3. 架构设计

### 整体架构

```
┌─────────────────┐         ┌─────────────────┐
│   Frontend      │         │    Backend      │
│   (React)       │◄───────►│   (FastAPI)     │
│                 │  WS/HTTP │                 │
├─────────────────┤         ├─────────────────┤
│ InterviewPage   │         │ Agent Engine    │
│ - ChatPanel     │         │ - Claude API    │
│ - CodeEditor    │         │ - Algorithm     │
│ - Zustand Store │         │   Interviewer   │
└─────────────────┘         ├─────────────────┤
                            │ SQLite          │
                            │ - Questions     │
                            │ - Sessions      │
                            └─────────────────┘
```

### 目录结构

```
talkpro/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI 入口
│   │   ├── agents/
│   │   │   ├── base.py              # Agent 基类
│   │   │   └── algorithm_interviewer.py
│   │   ├── models/
│   │   │   └── database.py          # SQLAlchemy 模型
│   │   ├── api/
│   │   │   ├── interviews.py        # REST 端点
│   │   │   └── websocket.py         # WebSocket 处理
│   │   └── services/
│   │       ├── claude.py            # Claude API 封装
│   │       └── questions.py         # 题库服务
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   └── InterviewPage.tsx
│   │   ├── components/
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── CodeEditor.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── stores/
│   │   │   └── interviewStore.ts
│   │   └── types/
│   │       └── index.ts
│   ├── package.json
│   └── vite.config.ts
└── docs/
```

---

## 4. 数据模型

### Questions 表

```python
class Question(Base):
    id: UUID (PK)
    title: String              # 题目标题
    content: Text              # 题目描述
    difficulty: Enum           # easy, medium, hard
    tags: Array<String>        # ['array', 'dp', 'tree']
    solution: Text             # 参考解答
    evaluation_criteria: JSON  # 评分要点
```

### Sessions 表

```python
class Session(Base):
    id: UUID (PK)
    question_id: UUID (FK)
    difficulty: Enum
    messages: JSONB            # 对话历史
    score: JSONB               # 评分详情
    feedback: Text             # 反馈报告
    status: Enum               # in_progress, completed
    created_at: DateTime
```

---

## 5. API 设计

### REST 端点

```
POST   /api/interviews/start
       请求: { difficulty: 'easy'|'medium'|'hard' }
       响应: { sessionId, question }

GET    /api/interviews/:id
       响应: { sessionId, messages, question, status }

POST   /api/interviews/:id/answer
       请求: { content: string, code?: string }
       响应: { reply: string, completed: boolean }

POST   /api/interviews/:id/end
       响应: { score: {...}, feedback: string }

GET    /api/questions
       响应: [{ id, title, difficulty, tags }]
```

### WebSocket

```
WS /ws/interview/:id

客户端 → 服务器:
{ type: 'answer', content: string, code?: string }

服务器 → 客户端 (流式):
{ type: 'message_chunk', content: string }
{ type: 'message_complete', content: string, completed: boolean }
```

---

## 6. Agent 设计

### AlgorithmInterviewer

**职责:**
- 根据难度选择合适题目
- 分析用户回答并生成追问
- 评估回答质量并生成反馈

**核心方法:**
```python
class AlgorithmInterviewer(BaseAgent):
    def start_interview(self, difficulty: str) -> Question:
        # 从题库选择题目

    def process_answer(self, user_input: str, code: str) -> str:
        # 调用 Claude 生成追问

    def generate_report(self, session: Session) -> dict:
        # 生成评估报告
```

### 系统提示词

```
You are an experienced technical interviewer conducting a coding interview.

Your role:
- Present a coding problem based on the selected difficulty
- Ask follow-up questions about:
  * Time and space complexity analysis
  * Potential optimizations
  * Edge cases and error handling
- Be encouraging but rigorous
- When the candidate has demonstrated sufficient understanding, respond with exactly "INTERVIEW_COMPLETE"

Evaluation criteria:
- Algorithm correctness
- Code quality and readability
- Complexity analysis
- Edge case consideration
```

---

## 7. 前端设计

### 页面布局

```
┌────────────────────────────────────────────────────┐
│                    Header                          │
├──────────────────────────┬─────────────────────────┤
│                          │                         │
│      Chat Panel (60%)    │   Code Editor (40%)     │
│                          │                         │
│  ┌────────────────────┐  │  ┌───────────────────┐ │
│  │ AI: Question 1     │  │  │                   │ │
│  │                    │  │  │  def solution():  │ │
│  │ User: My answer... │  │  │      # code       │ │
│  │                    │  │  │                   │ │
│  │ AI: Follow-up...   │  │  │                   │ │
│  └────────────────────┘  │  └───────────────────┘ │
│                          │                         │
│  [Input Box]     [Send]  │   [Language Select]    │
└──────────────────────────┴─────────────────────────┘
```

### Zustand Store

```typescript
interface InterviewStore {
  // State
  sessionId: string | null;
  messages: Message[];
  currentQuestion: Question | null;
  isStreaming: boolean;

  // Actions
  startInterview: (difficulty: string) => Promise<void>;
  submitAnswer: (content: string, code?: string) => Promise<void>;
  endInterview: () => Promise<void>;
  clearSession: () => void;
}
```

---

## 8. 数据流

### 面试流程

```
1. 开始面试
   用户选择难度
   → POST /api/interviews/start
   → 创建 Session, 选择题目
   → 返回 sessionId + question

2. 对话循环
   用户提交答案
   → POST /api/interviews/:id/answer
   → Agent 调用 Claude 分析
   → 生成追问或结束信号
   → WebSocket 流式推送回复

3. 结束评估
   用户点击结束 / Agent 发送完成信号
   → POST /api/interviews/:id/end
   → Agent 生成报告
   → 展示评分和反馈
```

### 对话上下文管理

```python
messages = [
    {"role": "system", "content": "You are..."},
    {"role": "assistant", "content": "Question: ..."},
    {"role": "user", "content": "My answer: ..."},
    {"role": "assistant", "content": "Follow-up: ..."},
    # ... 继续累积
]
```

---

## 9. 错误处理

### 前端
- API 失败 → Toast 提示 + 重试按钮
- WebSocket 断开 → 自动重连 + 状态显示
- 空输入 → 表单验证

### 后端
- Claude API 失败 → 降级到预设追问
- 数据库错误 → 500 + 日志
- 超时 → 30s 限制

---

## 10. 开发计划

### 阶段一: 项目初始化 (1-2 天)
- [ ] 后端虚拟环境 + 依赖安装
- [ ] 前端 Vite 项目创建
- [ ] 数据库表结构创建
- [ ] 基础端点验证

### 阶段二: 核心功能 (3-5 天)
- [ ] ClaudeService 实现
- [ ] 题库数据准备 (10 题)
- [ ] AlgorithmInterviewer Agent
- [ ] REST API 端点
- [ ] WebSocket 实现
- [ ] 前端页面和组件
- [ ] Zustand store
- [ ] Monaco Editor 集成

### 阶段三: 联调完善 (6-7 天)
- [ ] 前后端联调
- [ ] Agent Prompt 优化
- [ ] UI/UX 改进
- [ ] 错误处理完善

---

## 11. 验收标准

- [ ] 能完成完整的算法面试流程
- [ ] AI 追问有深度（非预设问题库）
- [ ] WebSocket 流式响应流畅
- [ ] 对话历史正确持久化
- [ ] 代码编辑器可用
- [ ] 生成有价值的反馈报告
