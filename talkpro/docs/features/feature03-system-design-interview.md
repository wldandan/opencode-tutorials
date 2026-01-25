# Feature 03: 系统设计面试 Agent

**优先级**: P0（MVP 核心功能）
**状态**: 待开发
**依赖**: Feature 01 (用户认证)

---

## 功能描述

提供系统设计面试模拟功能，AI 扮演架构师，引导用户完成系统设计并进行深度挑战。

---

## 用户故事

作为一名准备系统设计面试的工程师，我想要：
- 选择一个系统设计场景
- 与 AI 架构师讨论设计方案
- 回答挑战性问题
- 获得架构设计反馈

---

## 功能需求

### 3.1 选择场景开始

**输入：**
- 场景 ID 或场景名称

**预置场景：**
- 设计微博 Feed 流
- 设计秒杀系统
- 设计即时通讯系统
- 设计短链接服务
- 设计分布式缓存
- 设计 KV 存储系统
- 设计消息队列
- 设计分布式 ID 生成器
- 设计在线文档协作系统
- 设计推荐系统

**处理：**
- 加载场景信息（需求、约束条件）
- 创建设计会话
- 初始化对话上下文

**输出：**
- sessionId
- 场景描述
- 核心需求
- 约束条件

### 3.2 讨论设计方案

**输入：**
- sessionId
- 设计方案描述（文字）
- 架构图描述（可选）

**处理：**
- 调用 Claude 分析设计方案
- 生成引导性提问或挑战
- 更新会话历史
- 记录设计阶段（需求分析 → 架构设计 → 深度挑战 → 总结）

**输出：**
- AI 回复（流式）
- 当前阶段

### 3.3 获取会话信息

**输入：**
- sessionId

**输出：**
- 场景信息
- 对话历史
- 设计概要
- 当前状态

### 3.4 结束并获取报告

**输入：**
- sessionId

**处理：**
- 调用 Claude 生成评估报告
- 分析设计质量
- 计算各维度评分

**输出：**
- 评分详情
  - 需求理解（0-10）
  - 架构设计（0-10）
  - 技术选型（0-10）
  - 可扩展性（0-10）
  - 高可用性（0-10）
  - 数据一致性（0-10）
- 架构评价
- 改进建议

---

## 技术实现

### 数据模型

```python
class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(UUID, primary_key=True, default=uuid4)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=False)  # 核心需求
    constraints = Column(Text, nullable=True)    # 约束条件
    evaluation_points = Column(JSONB, nullable=True)  # 评估要点
    difficulty = Column(Enum(Difficulty), default=Difficulty.MEDIUM)

class DesignSession(Base):
    __tablename__ = "design_sessions"

    id = Column(UUID, primary_key=True, default=uuid4)
    user_id = Column(UUID, ForeignKey("users.id"))
    scenario_id = Column(UUID, ForeignKey("scenarios.id"))
    messages = Column(JSONB, nullable=False)
    design_overview = Column(Text, nullable=True)  # 设计概要
    stage = Column(Enum(DesignStage), default=DesignStage.REQUIREMENTS)
    score = Column(JSONB, nullable=True)
    feedback = Column(Text, nullable=True)
    status = Column(Enum(Status), default=Status.IN_PROGRESS)
    created_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
```

### Agent 设计

```python
class SystemDesignAgent:
    """系统设计面试官 Agent"""

    def __init__(self):
        self.claude = ClaudeService()

    async def start_interview(self, scenario_id: str) -> dict:
        """开始系统设计面试"""
        scenario = await get_scenario(scenario_id)

        session = DesignSession(
            scenario_id=scenario_id,
            messages=[{
                "role": "assistant",
                "content": f"我们要设计{scenario.title}。\n\n{scenario.requirements}\n\n约束条件：{scenario.constraints}"
            }],
            stage=DesignStage.REQUIREMENTS
        )
        await save_session(session)

        return {
            "sessionId": str(session.id),
            "scenario": {
                "title": scenario.title,
                "description": scenario.description,
                "requirements": scenario.requirements,
                "constraints": scenario.constraints
            }
        }

    async def discuss_design(self, session_id: str, user_input: str) -> AsyncIterator[str]:
        """讨论设计方案"""
        session = await get_session(session_id)

        # 更新阶段
        session = self._update_stage(session, user_input)

        # 构建提示词
        prompt = self._build_design_prompt(session, user_input)

        # 调用 Claude（流式）
        async for chunk in self.claude.send_message_stream(prompt):
            yield chunk

        # 保存对话
        session.messages.append({"role": "user", "content": user_input})
        session.messages.append({"role": "assistant", "content": full_response})
        await save_session(session)

    async def generate_report(self, session: DesignSession) -> dict:
        """生成评估报告"""
        scenario = await get_scenario(session.scenario_id)

        prompt = f"""
        评估以下系统设计方案：

        场景：{scenario.title}
        要求：{scenario.requirements}
        设计讨论：{session.messages}

        评估维度：
        1. 需求理解：是否准确理解系统需求
        2. 架构设计：架构是否合理、层次清晰
        3. 技术选型：技术选型是否合适
        4. 可扩展性：系统是否易于扩展
        5. 高可用性：是否考虑容错、容灾
        6. 数据一致性：是否考虑数据一致性

        返回 JSON 格式：
        {{
          "requirements": 8,
          "architecture": 7,
          "tech_stack": 9,
          "scalability": 6,
          "availability": 7,
          "consistency": 6,
          "feedback": "...",
          "strengths": ["...", "..."],
          "improvements": ["...", "..."]
        }}
        """

        response = await self.claude.send_message(prompt)
        report = json.loads(response)

        session.score = {
            "requirements": report["requirements"],
            "architecture": report["architecture"],
            "tech_stack": report["tech_stack"],
            "scalability": report["scalability"],
            "availability": report["availability"],
            "consistency": report["consistency"],
            "overall": sum(report.values()) // 6
        }
        session.feedback = report["feedback"]
        await save_session(session)

        return session.score

    def _update_stage(self, session: DesignSession, user_input: str) -> DesignSession:
        """根据对话内容更新阶段"""
        # 简单的状态机
        if session.stage == DesignStage.REQUIREMENTS:
            if "QPS" in user_input or "数据量" in user_input:
                session.stage = DesignStage.ARCHITECTURE
        elif session.stage == DesignStage.ARCHITECTURE:
            if "架构" in user_input or "分层" in user_input:
                session.stage = DesignStage.DEEP_DIVE

        return session

    def _build_design_prompt(self, session: DesignSession, user_input: str) -> str:
        """构建设计讨论提示词"""
        system_prompt = """
        You are an experienced architect conducting a system design interview.

        Your role:
        - Guide the candidate to clarify requirements (QPS, data volume, constraints)
        - Ask about their architectural design approach
        - Challenge their design decisions:
          * Single points of failure
          * Disaster recovery plans
          * Data consistency guarantees
          * Scalability concerns
        - Encourage them to think through trade-offs

        Be collaborative but critical. Dig deep into their reasoning.

        Response format: Engage in natural conversation, ask relevant follow-up questions.
        """

        messages = session.messages + [{"role": "user", "content": user_input}]
        full_prompt = system_prompt + "\n\n" + "\n".join([
            f"{m['role']}: {m['content']}" for m in messages
        ])

        return full_prompt
```

### API 端点

```
POST   /api/system-design/start
       请求头: Authorization: Bearer <token>
       请求: { scenarioId: string }
       响应: { sessionId, scenario }

GET    /api/system-design/scenarios
       响应: [{ id, title, description, difficulty }]

GET    /api/system-design/:id
       响应: { sessionId, scenario, messages, stage, status }

POST   /api/system-design/:id/discuss
       请求: { content: string, diagram?: string }
       响应: { reply: string, stage: string }

POST   /api/system-design/:id/end
       响应: { score: {...}, feedback, strengths, improvements }
```

---

## 验收标准

- [ ] 能选择场景开始面试
- [ ] AI 引导式提问有针对性
- [ ] AI 挑战有深度，能发现设计盲点
- [ ] 对话阶段能正确更新
- [ ] 生成有价值的评估报告
- [ ] 用户反馈有帮助

---

## 示例场景

```
用户：选择 "设计微博 Feed 流"

AI：我们要设计微博的 Feed 流功能。核心需求：
1. 用户能看到关注的人的微博
2. 按时间倒序排列
3. 支持海量数据

约束条件：
- 日活用户：1 亿
- 日发微博量：1 亿
- QPS：10 万

首先，我们面临的核心需求是什么？QPS 大概多少？

用户：核心需求是用户能看到关注的人的微博。QPS 大概 10k，日活 100 万。

AI：很好。Feed 流是推模式还是拉模式？各自的优缺点是什么？

用户：我选择推模式。用户发微博时，推送到所有粉丝的收件箱。

AI：推模式在什么场景下会有问题？如果一个大 V 有 1000 万粉丝，发一条微博会怎样？

用户：会有写放大问题，延迟很高。可以改用拉模式，或者混合模式。

AI：混合模式怎么设计？大 V 用拉，普通用户用推？

用户：是的。大 V（粉丝 > 10 万）用拉模式，普通用户用推模式。

AI：Feed 流需要排序吗？按什么排序？怎么实现？

用户：按时间排序。可以用 Redis 的 zset，score 是时间戳。

AI：如果要支持多种排序（热门、最新）呢？

用户：可以维护多个 zset，或者用权重计算综合得分。

AI：如果 Redis 挂了怎么办？

用户：可以主从复制 + 哨兵，或者用 Redis Cluster。

AI：数据一致性怎么保证？如果推送到一半失败了怎么办？

用户：需要用消息队列重试，或者定期全量拉取修复。

[结束并生成报告]

评分：
- 需求理解：8/10 ✅
- 架构设计：7/10 ✅
- 技术选型：8/10 ✅
- 可扩展性：7/10 ✅
- 高可用性：6/10 ⚠️
- 数据一致性：6/10 ⚠️

反馈：
对推拉模式有深入理解，能提出混合模式。但对高可用和数据一致性的考虑不够深入：
1. Redis Cluster 的数据分片策略？
2. 主从切换时的一致性问题？
3. 消息队列的顺序性保证？

建议：
- 学习分布式系统的 CAP 理论
- 了解最终一致性的解决方案
- 深入研究 Redis Cluster 的工作原理
```
