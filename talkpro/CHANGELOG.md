# 变更日志

所有值得注意的项目变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [0.1.0] - 2026-01-25

### 新增

#### 后端
- ✅ FastAPI 项目结构
- ✅ Claude API 集成（流式响应）
- ✅ 算法面试 Agent（10 道算法题）
- ✅ 系统设计 Agent（5 个场景）
- ✅ REST API（8 个端点）
- ✅ WebSocket 支持（流式对话）
- ✅ SQLite 数据持久化
- ✅ 评估和反馈系统

#### 前端
- ✅ React 18 + TypeScript 项目
- ✅ Tailwind CSS 样式
- ✅ Zustand 状态管理
- ✅ 三个主要页面（首页、算法面试、系统设计）
- ✅ WebSocket 客户端
- ✅ 评估报告展示

#### 文档
- ✅ README.md - 项目概述和快速开始
- ✅ TESTING.md - 测试指南
- ✅ DEPLOYMENT.md - 部署指南
- ✅ CONTRIBUTING.md - 贡献指南
- ✅ 功能需求文档
- ✅ MVP 范围定义
- ✅ 功能清单

### 技术栈

**后端**:
- Python 3.10+
- FastAPI
- SQLAlchemy (async)
- SQLite
- Claude Sonnet 4.5
- WebSocket

**前端**:
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- React Router

### MVP 功能

#### 算法面试
- 难度选择（简单/中等/困难）
- AI 出题（10 道 LeetCode 风格）
- 实时追问
- 代码提交支持
- 5 维度评估（算法思路、代码质量、复杂度、边界、沟通）

#### 系统设计
- 场景选择（5 个经典场景）
- 引导式讨论
- 深度挑战
- 6 维度评估（需求、架构、技术选型、扩展性、可用性、一致性）

### 已知限制

- 无用户认证
- 无训练历史记录
- 无个人成长看板
- 会话数据仅在内存中
- 无代码执行沙箱
- 无实时语音对话

---

## [0.2.0] - 计划中

### 计划新增
- [ ] 用户认证系统
- [ ] 训练历史记录
- [ ] 个人成长看板
- [ ] 代码执行沙箱
- [ ] 职场场景训练
- [ ] 简历解析
- [ ] 定制面试题

---

## [0.3.0] - 未来计划

### 计划新增
- [ ] 多 LLM 支持
- [ ] 实时语音对话
- [ ] 移动端适配
- [ ] 团队协作功能
- [ ] 付费订阅

---

*变更日志 v1.0 - 2026-01-25*
