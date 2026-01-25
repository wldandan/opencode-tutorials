# TalkPro Frontend

TalkPro 前端应用 - 工程师的 AI 职业教练

## 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **Zustand** - 状态管理
- **React Router** - 路由
- **WebSocket** - 实时通信

## 安装依赖

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install
```

## 运行开发服务器

```bash
# 启动开发服务器
npm run dev

# 应用将在 http://localhost:3000 运行
```

## 构建生产版本

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 项目结构

```
frontend/
├── src/
│   ├── components/     # 可复用组件
│   ├── pages/          # 页面组件
│   │   ├── HomePage.tsx           # 首页
│   │   ├── AlgorithmPage.tsx      # 算法面试页面
│   │   └── SystemDesignPage.tsx   # 系统设计页面
│   ├── services/       # API 服务
│   │   └── api.ts
│   ├── stores/         # Zustand 状态管理
│   │   ├── algorithmStore.ts
│   │   └── systemDesignStore.ts
│   ├── types/          # TypeScript 类型定义
│   │   └── index.ts
│   ├── styles/         # 样式文件
│   │   └── index.css
│   ├── App.tsx         # 应用根组件
│   └── main.tsx        # 应用入口
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 功能页面

### 首页 (/)
- 选择训练类型
- 算法面试或系统设计

### 算法面试页面 (/algorithm)
- 选择难度（简单/中等/困难）
- AI 出题
- 实时对话
- 提交代码或文字描述
- 获取评估报告

### 系统设计页面 (/system-design)
- 选择场景（10+ 经典场景）
- AI 引导讨论
- 描述设计方案
- 获取评估报告

## 状态管理

### AlgorithmStore
- session: 当前面试会话
- messages: 对话历史
- isStreaming: 是否正在流式响应
- score: 评估分数

### SystemDesignStore
- session: 当前面试会话
- messages: 对话历史
- stage: 当前阶段
- isStreaming: 是否正在流式响应
- score: 评估分数

## API 集成

前端通过代理与后端 API 通信：

```typescript
// Vite 配置中的代理设置
server: {
  proxy: {
    '/api': 'http://localhost:8000',
    '/ws': 'ws://localhost:8000',
  },
}
```

## WebSocket 连接

### 算法面试 WebSocket
```typescript
const ws = new WebSocket('ws://localhost:3000/ws/algorithm/{session_id}');

// 发送消息
ws.send(JSON.stringify({ content: '...', code: '...' }));

// 接收消息（流式）
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // data.type: 'message_start' | 'message_chunk' | 'message_complete'
};
```

### 系统设计 WebSocket
```typescript
const ws = new WebSocket('ws://localhost:3000/ws/system-design/{session_id}');

// 发送消息
ws.send(JSON.stringify({ content: '...' }));

// 接收消息（流式）
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // data.type: 'message_start' | 'message_chunk' | 'message_complete' | 'stage'
};
```

## 开发说明

- 无需配置环境变量
- 确保后端服务在 http://localhost:8000 运行
- WebSocket 连接会自动处理重连
- 所有会话数据存储在 Zustand store 中（刷新页面会丢失）

## 常见问题

**Q: 前端无法连接后端？**
A: 检查后端服务是否在 http://localhost:8000 运行

**Q: WebSocket 连接失败？**
A: 确保 session_id 有效，且后端 WebSocket 服务正常

**Q: 样式不生效？**
A: 运行 `npm install` 确保所有依赖已安装
