# TalkPro MVP 功能清单

## 开发时间：1-2 周

---

## 后端功能清单

### 1. 项目初始化
- [ ] 创建 FastAPI 项目
- [ ] 配置 SQLite 数据库
- [ ] 配置环境变量（.env）
- [ ] 创建目录结构

### 2. Claude API 接入
- [ ] 封装 Claude Service
  - [ ] send_message() 方法
  - [ ] send_message_stream() 方法
- [ ] 配置 API Key
- [ ] 测试连通性

### 3. 算法面试 Agent
- [ ] **题库管理**
  - [ ] 创建题库 JSON 文件（10-20 题）
  - [ ] 按难度分类（easy/medium/hard）
  - [ ] 包含标题、描述、示例、解答

- [ ] **面试流程**
  - [ ] start_interview() - 开始面试，选择题目
  - [ ] process_answer() - 处理用户答案，生成追问
  - [ ] generate_report() - 生成评估报告
  - [ ] 判断是否结束面试

- [ ] **AI Prompt**
  - [ ] System Prompt 设计
  - [ ] 追问 Prompt 模板
  - [ ] 评估 Prompt 模板

### 4. 系统设计 Agent
- [ ] **场景库管理**
  - [ ] 创建场景库 JSON 文件（5 个场景）
  - [ ] 场景包含：标题、描述、需求、约束

- [ ] **面试流程**
  - [ ] start_interview() - 开始面试，选择场景
  - [ ] guide_discussion() - 引导式讨论
  - [ ] challenge_design() - 深度挑战
  - [ ] generate_report() - 生成评估报告

- [ ] **AI Prompt**
  - [ ] 架构师 System Prompt
  - [ ] 引导提问 Prompt
  - [ ] 挑战 Prompt
  - [ ] 评估 Prompt

### 5. WebSocket 服务
- [ ] 建立 WebSocket 连接
- [ ] 算法面试 WebSocket 端点（`/ws/algorithm/{session_id}`）
- [ ] 系统设计 WebSocket 端点（`/ws/system-design/{session_id}`）
- [ ] 流式推送 AI 回复
- [ ] 错误处理和连接管理

### 6. REST API 端点

#### 算法面试 API
```
POST   /api/algorithm/start
       请求: { difficulty: "easy"|"medium"|"hard" }
       响应: { sessionId, question, examples }

POST   /api/algorithm/:session_id/answer
       请求: { content: string, code?: string }
       响应: { reply: string, completed: boolean }

POST   /api/algorithm/:session_id/end
       响应: { score: {...}, feedback: string }

GET    /api/algorithm/questions
       响应: [{ id, title, difficulty }]
```

#### 系统设计 API
```
POST   /api/system-design/start
       请求: { scenarioId: string }
       响应: { sessionId, scenario, requirements }

POST   /api/system-design/:session_id/discuss
       请求: { content: string }
       响应: { reply: string, stage: string }

POST   /api/system-design/:session_id/end
       响应: { score: {...}, feedback: string }

GET    /api/system-design/scenarios
       响应: [{ id, title, description }]
```

### 7. 数据持久化（SQLite）
- [ ] 数据库初始化
- [ ] Session 表（会话）
  - [ ] id (UUID, PK)
  - [ ] type (algorithm/system_design)
  - [ ] question_id/scenario_id (UUID)
  - [ ] messages (JSON)
  - [ ] score (JSON)
  - [ ] feedback (TEXT)
  - [ ] status (in_progress/completed)
  - [ ] created_at (DateTime)

- [ ] CRUD 操作
  - [ ] 创建会话
  - [ ] 更新会话
  - [ ] 查询会话
  - [ ] 删除会话（可选）

### 8. 错误处理
- [ ] 全局异常处理
- [ ] API 错误响应格式统一
- [ ] 日志记录

---

## 前端功能清单

### 1. 项目初始化
- [ ] 创建 React + TypeScript 项目（Vite）
- [ ] 配置 Tailwind CSS
- [ ] 配置路由（React Router）
- [ ] 创建目录结构

### 2. 首页
- [ ] 页面布局
- [ ] 训练类型选择卡片
  - [ ] 算法面试
  - [ ] 系统设计
- [ ] 开始按钮
- [ ] 简洁的产品介绍

### 3. 算法面试页面

#### 页面布局
- [ ] 左侧：对话面板（60%）
- [ ] 右侧：代码编辑区（40%）
- [ ] 顶部：进度显示
- [ ] 底部：输入框和发送按钮

#### 对话面板
- [ ] 显示题目描述
- [ ] 显示示例
- [ ] 显示对话历史
  - [ ] AI 消息气泡
  - [ ] 用户消息气泡
  - [ ] 流式显示 AI 回复
- [ ] 自动滚动到最新消息

#### 代码编辑区（可选）
- [ ] Monaco Editor 集成
- [ ] 语法高亮
- [ ] 多语言支持（Python, Java, JavaScript）
- [ ] 代码格式化

#### 输入区
- [ ] 文字输入框
- [ ] 发送按钮
- [ ] 结束面试按钮
- [ ] 快捷键支持（Enter 发送）

#### 评估报告弹窗
- [ ] 评分展示（5 个维度）
  - [ ] 算法思路
  - [ ] 代码质量
  - [ ] 复杂度分析
  - [ ] 边界考虑
  - [ ] 沟通表达
- [ ] 文字反馈
- [ ] 改进建议
- [ ] 关闭/重新开始按钮

### 4. 系统设计页面

#### 页面布局
- [ ] 对话面板（全宽）
- [ ] 顶部：场景信息和阶段显示
- [ ] 底部：输入框和操作按钮

#### 场景选择
- [ ] 场景列表展示
  - [ ] 微博 Feed 流
  - [ ] 秒杀系统
  - [ ] 即时通讯
  - [ ] 短链接服务
  - [ ] 分布式缓存
- [ ] 场景卡片（标题 + 描述）
- [ ] 选择按钮

#### 对话面板
- [ ] 显示场景需求
- [ ] 显示约束条件
- [ ] 显示对话历史
- [ ] 显示当前阶段（需求分析 → 架构设计 → 深度挑战）
- [ ] 流式显示 AI 回复
- [ ] 自动滚动

#### 输入区
- [ ] 文字输入框（多行）
- [ ] 发送按钮
- [ ] 结束讨论按钮

#### 评估报告弹窗
- [ ] 评分展示（6 个维度）
  - [ ] 需求理解
  - [ ] 架构设计
  - [ ] 技术选型
  - [ ] 可扩展性
  - [ ] 高可用性
  - [ ] 数据一致性
- [ ] 文字反馈
- [ ] 优点列表
- [ ] 改进建议列表

### 5. WebSocket 客户端
- [ ] WebSocket 连接管理
- [ ] 消息发送
- [ ] 流式消息接收
- [ ] 错误处理
- [ ] 断线重连（可选）

### 6. 状态管理（Zustand）
- [ ] 算法面试 Store
  - [ ] sessionId
  - [ ] question
  - [ ] messages
  - [ ] isStreaming
  - [ ] score
  - [ ] feedback

- [ ] 系统设计 Store
  - [ ] sessionId
  - [ ] scenario
  - [ ] messages
  - [ ] stage
  - [ ] isStreaming
  - [ ] score
  - [ ] feedback

### 7. UI 组件
- [ ] MessageBubble（消息气泡）
- [ ] LoadingSpinner（加载动画）
- [ ] ScoreChart（评分图表）
- [ ] Button（按钮）
- [ ] Input（输入框）
- [ ] Modal（弹窗）

### 8. 样式和响应式
- [ ] Tailwind CSS 样式
- [ ] 响应式布局
- [ ] 移动端适配（可选）

---

## 数据文件清单

### 算法题库（questions.json）
```json
[
  {
    "id": "uuid-1",
    "title": "两数之和",
    "difficulty": "easy",
    "content": "给定一个整数数组 nums 和一个整数 target...",
    "examples": [
      {"input": "[2,7,11,15], 9", "output": "[0,1]"}
    ],
    "solution": "使用哈希表...",
    "tags": ["数组", "哈希表"]
  }
  // ... 10-20 题
]
```

### 系统设计场景库（scenarios.json）
```json
[
  {
    "id": "uuid-1",
    "title": "设计微博 Feed 流",
    "description": "设计一个支持海量用户的微博信息流系统",
    "requirements": "用户能看到关注的人的微博，按时间倒序排列",
    "constraints": "日活 1 亿，日发微博 1 亿，QPS 10 万"
  }
  // ... 5 个场景
]
```

---

## 第三方服务清单

### 必需服务
- [ ] **Claude API** (Anthropic)
  - [ ] 获取 API Key
  - [ ] 配置环境变量
  - [ ] 测试 API 调用

### 可选服务（后续版本）
- [ ] 代码执行沙箱（暂不实现）
- [ ] 数据分析工具（暂不实现）
- [ ] 监控和日志（暂不实现）

---

## 开发任务分解

### Week 1: Backend (5 天)

**Day 1: 项目初始化**
- FastAPI 项目搭建
- SQLite 配置
- Claude API 接入

**Day 2-3: 算法面试 Agent**
- 题库准备（10-20 题）
- Agent 逻辑实现
- API 端点开发
- WebSocket 实现

**Day 4-5: 系统设计 Agent**
- 场景库准备（5 个场景）
- Agent 逻辑实现
- API 端点开发
- 测试调试

### Week 2: Frontend (5 天)

**Day 1: 项目初始化**
- React + Vite 项目搭建
- Tailwind CSS 配置
- 首页开发

**Day 2-3: 算法面试页面**
- 对话面板
- 输入区
- WebSocket 集成
- 评估报告弹窗

**Day 4: 系统设计页面**
- 场景选择
- 对话面板
- WebSocket 集成
- 评估报告弹窗

**Day 5: 联调和优化**
- 前后端联调
- UI/UX 优化
- Bug 修复
- 性能优化

---

## 验收清单

### 功能验收
- [ ] 能完成完整的算法面试流程
- [ ] 能完成完整的系统设计流程
- [ ] WebSocket 流式响应流畅
- [ ] AI 追问有深度
- [ ] 评估报告有价值

### 性能验收
- [ ] 首页加载 < 2 秒
- [ ] AI 响应首字延迟 < 2 秒
- [ ] 流式响应无卡顿

### 代码质量
- [ ] 代码可读性
- [ ] 错误处理完善
- [ ] 日志记录完整
- [ ] 无明显 Bug

---

*MVP 功能清单 v1.0 - 2026-01-25*
