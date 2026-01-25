# Feature 05: AI 职场导师

**优先级**: P1
**状态**: 待开发
**依赖**: Feature 01 (用户认证)

---

## 功能描述

提供职场场景模拟功能，AI 扮演不同角色（技术总监、产品经理、测试负责人等），帮助用户提升职场沟通能力。

---

## 用户故事

作为一名工程师，我想要：
- 模拟晋升答辩场景
- 练习技术方案宣讲
- 参与故障复盘讨论
- 提升职场沟通能力

---

## 功能需求

### 5.1 选择场景

**预置场景：**

#### 晋升答辩场景
- **P5 升 P6**（技术深度）
- **P6 升 P7**（影响力）

**AI 角色**：挑剔的技术总监

**挑战内容**：
- 质疑项目贡献度
- 质疑技术深度
- 考验业务理解
- 询问团队协作

#### 技术方案宣讲场景
- **微服务拆分方案**
- **数据库迁移方案**

**AI 角色**：多角色扮演（产品经理、测试负责人、其他团队开发）

**挑战内容**：
- 产品经理质疑需求价值
- 测试负责人质疑可行性
- 其他团队质疑兼容性
- 质疑时间线和资源

#### 故障复盘场景
- **线上服务 OOM**
- **数据不一致问题**

**AI 角色**：故障调查组组长

**挑战内容**：
- 追问根因分析
- 质疑改进措施
- 询问监控告警
- 质疑应急预案

### 5.2 角色扮演对话

**输入：**
- sessionId
- 用户回答

**处理：**
- AI 根据场景和角色生成回复
- 语气和风格符合角色设定
- 针对性挑战
- 评估回答质量

**输出：**
- AI 回复（流式）
- 当前挑战等级

### 5.3 获取反馈报告

**输入：**
- sessionId

**输出：**
- 评估维度
  - 技术深度（0-10）
  - 业务理解（0-10）
  - 沟通表达（0-10）
  - 逻辑思维（0-10）
- 优点列表
- 改进建议列表

---

## 技术实现

### 数据模型

```python
class WorkplaceScenario(Base):
    __tablename__ = "workplace_scenarios"

    id = Column(UUID, primary_key=True, default=uuid4)
    type = Column(Enum(ScenarioType), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    ai_role = Column(String, nullable=False)  # AI 扮演的角色
    difficulty = Column(Enum(Difficulty), default=Difficulty.MEDIUM)
    challenge_points = Column(JSONB, nullable=True)  # 挑战要点
    evaluation_criteria = Column(JSONB, nullable=True)

class WorkplaceSession(Base):
    __tablename__ = "workplace_sessions"

    id = Column(UUID, primary_key=True, default=uuid4)
    user_id = Column(UUID, ForeignKey("users.id"))
    scenario_id = Column(UUID, ForeignKey("workplace_scenarios.id"))
    user_role = Column(String, nullable=True)  # 用户的角色（如 P5 工程师）
    messages = Column(JSONB, nullable=False)
    score = Column(JSONB, nullable=True)
    feedback = Column(Text, nullable=True)
    strengths = Column(JSONB, nullable=True)  # 优点列表
    improvements = Column(JSONB, nullable=True)  # 改进建议
    status = Column(Enum(Status), default=Status.IN_PROGRESS)
    created_at = Column(DateTime, default=datetime.utcnow)
```

### Agent Prompt 设计

#### 晋升答辩场景

```
You are a skeptical Technical Director conducting a promotion review for P5 to P6.

Your role:
- Challenge the candidate's contributions
  * "Did you write the core logic, or just assisted?"
  * "What's the technical difficulty here?"
- Test their business understanding
  * "How did your work impact business metrics?"
  * "What's the business value of this project?"
- Ask about teamwork and leadership
  * "How would your team members describe you?"
  * "Did you mentor junior developers?"
- Be tough but fair

Tone: Challenging, data-driven, results-oriented, skeptical

Evaluation criteria:
- Technical depth (Can they explain technical decisions?)
- Business understanding (Do they know the "why"?)
- Communication (Are they clear and structured?)
- Leadership (Do they show initiative and impact?)
```

#### 技术方案宣讲场景

```
You are playing multiple roles in a technical review meeting:

Product Manager:
- Questions user value and priorities
- "Is this feature really needed?"
- "What's the ROI?"

QA Lead:
- Questions testability and edge cases
- "How do we test this?"
- "What about race conditions?"

Developer from another team:
- Questions compatibility and dependencies
- "Will this break our system?"
- "Can we coordinate the migration?"

Your role:
- Challenge the proposal from different perspectives
- Ask about timelines and resources
- Identify potential risks
- Question trade-offs

Tone: Collaborative but critical, detail-oriented, skeptical

Rotate between roles naturally in the conversation.
```

#### 故障复盘场景

```
You are the Incident Response Team Lead conducting a post-mortem review.

Your role:
- Dig deep into root cause analysis
  * "Are you sure that's the root cause? What's your evidence?"
  * "Have you ruled out other possibilities?"
- Challenge improvement measures
  * "Will this really prevent it from happening again?"
  * "What if the same issue happens in a different service?"
- Ask about monitoring and alerting
  * "Why didn't the alarms catch this?"
  * "What was the MTTR?"
- Question the incident response process
  * "Why did the rollback take so long?"
  * "Who was on call? Why didn't they respond?"

Tone: Investigative, demanding, focused on learning and prevention

Remember: This is not about blaming, but about learning.
```

### API 端点

```
GET    /api/workplace/scenarios
       响应: [
         {
           id, type, title, description,
           ai_role, difficulty
         }
       ]

POST   /api/workplace/start
       请求: { scenarioId: string, userRole?: string }
       响应: { sessionId, scenario, ai_role }

GET    /api/workplace/:id
       响应: { sessionId, scenario, messages, status }

POST   /api/workplace/:id/respond
       请求: { content: string }
       响应: { reply: string, challenge_level: number }

POST   /api/workplace/:id/end
       响应: {
         score: {...},
         strengths: [...],
         improvements: [...]
       }
```

---

## 验收标准

- [ ] 能选择场景开始模拟
- [ ] AI 角色扮演真实（语气、风格符合角色）
- [ ] 追问有针对性
- [ ] 多角色场景能自然切换
- [ ] 生成有价值的反馈
- [ ] 用户反馈有帮助

---

## 示例场景

### 晋升答辩（P5 升 P6）

```
AI：技术总监
请先简要介绍一下你的工作。

用户：我负责用户中心系统的开发，包括登录、注册、权限管理等功能。

AI：用户中心的核心逻辑是你写的吗？还是你只是做了一些增删改查的接口？

用户：核心逻辑是我设计的，包括 JWT 认证方案、RBAC 权限模型。我实现了单点登录、多端登录互踢等功能。

AI：JWT 的缺点是什么？你有没有考虑过 Token 失效的问题？

用户：JWT 的缺点是无法主动失效。我通过 Redis 做了一个黑名单机制，用户登出时把 Token 加入黑名单。

AI：这个方案有性能问题吗？如果用户量很大，Redis 的压力会不会很大？

用户：确实会有压力。我做了优化：黑名单只存储未过期的 Token，过期后自动清理。另外，我用 Redis Cluster 做了分片。

AI：你的工作对业务指标有什么影响？

用户：我优化了登录流程，登录成功率从 95% 提升到 99%，登录耗时从 500ms 降到 200ms。

AI：很好，有数据支撑。你说的 RBAC 权限模型，是你自己设计的还是参考了业界方案？

用户：我参考了 AWS IAM 的设计，结合我们的业务做了简化。

AI：你在这个过程中遇到过什么技术难题？怎么解决的？

用户：最大难题是多端登录互踢。我用了 Redis 的发布订阅机制...

[结束并生成报告]

评分：
- 技术深度：7/10 ✅
- 业务理解：8/10 ✅
- 沟通表达：7/10 ✅
- 逻辑思维：8/10 ✅

优点：
✓ 对技术方案的优缺点有清晰认识
✓ 有数据支撑业务价值
✓ 能结合业界最佳实践
✓ 表达清晰，逻辑性好

改进建议：
⚠️ 对高并发场景的考虑还可以更深入
  - Redis Cluster 的一致性问题？
  - 分片策略是什么？
⚠️ 可以多提一些技术难点是如何解决的
  - "别人这么说" vs "我的理解是..."
⚠️ 建议补充团队协作方面的贡献（P6 需要看影响力）
  - 是否有 Code Review？
  - 是否有技术分享？
  - 是否指导新人？
```
