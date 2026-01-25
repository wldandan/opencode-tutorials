# Feature 02: 算法面试 Agent

**优先级**: P0（MVP 核心功能）
**状态**: 待开发
**依赖**: Feature 01 (用户认证)

---

## 功能描述

提供算法面试模拟功能，AI 扮演技术面试官，根据用户回答进行实时追问和评估反馈。

---

## 用户故事

作为一名准备面试的工程师，我想要：
- 选择难度开始算法面试
- 与 AI 面试官实时对话
- 提交我的代码解答
- 获得详细的反馈报告

---

## 功能需求

### 2.1 开始面试

**输入：**
- 难度等级：easy | medium | hard

**处理：**
- 从题库中选择对应难度的算法题
- 创建面试会话（Session）
- 初始化对话上下文

**输出：**
- sessionId
- 问题描述
- 示例（可选）

### 2.2 提交答案

**输入：**
- sessionId
- 答案内容（文字描述或代码）
- 代码语言（可选）

**处理：**
- 调用 Claude 分析用户答案
- 生成追问或反馈
- 更新会话历史
- 判断面试是否应该结束

**输出：**
- AI 回复（流式）
- 是否完成（completed: true/false）

### 2.3 获取会话信息

**输入：**
- sessionId

**输出：**
- 会话完整信息
  - 题目信息
  - 对话历史
  - 当前状态（in_progress/completed）

### 2.4 结束面试并获取报告

**输入：**
- sessionId

**处理：**
- 调用 Claude 生成评估报告
- 分析对话历史
- 计算各维度评分
- 保存到数据库

**输出：**
- 评分详情
  - 算法思路（0-10）
  - 代码质量（0-10）
  - 复杂度分析（0-10）
  - 边界考虑（0-10）
  - 沟通表达（0-10）
- 文字反馈
- 改进建议

### 2.5 WebSocket 实时对话

**连接：**
`WS /ws/interview/{sessionId}`

**客户端发送：**
```json
{
  "type": "answer",
  "content": "我的思路是...",
  "code": "def solution():...",
  "language": "python"
}
```

**服务器流式返回：**
```json
{
  "type": "message_chunk",
  "content": "你的"
}
{
  "type": "message_chunk",
  "content": "思路很好"
}
{
  "type": "message_complete",
  "content": "你的思路很好。但时间复杂度是多少？",
  "completed": false
}
```

---

## 技术实现

### 数据模型

```python
class Question(Base):
    __tablename__ = "questions"

    id = Column(UUID, primary_key=True, default=uuid4)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    difficulty = Column(Enum(Difficulty), nullable=False)
    tags = Column(String, nullable=True)  # JSON array as string
    solution = Column(Text, nullable=True)
    examples = Column(Text, nullable=True)  # JSON array

class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID, primary_key=True, default=uuid4)
    user_id = Column(UUID, ForeignKey("users.id"))
    question_id = Column(UUID, ForeignKey("questions.id"))
    difficulty = Column(Enum(Difficulty), nullable=False)
    messages = Column(JSONB, nullable=False)  # 对话历史
    score = Column(JSONB, nullable=True)  # 评分详情
    feedback = Column(Text, nullable=True)
    status = Column(Enum(Status), default=Status.IN_PROGRESS)
    created_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
```

### Agent 设计

```python
class AlgorithmInterviewer:
    """算法面试官 Agent"""

    def __init__(self):
        self.claude = ClaudeService()

    async def start_interview(self, difficulty: Difficulty) -> dict:
        """开始面试，选择题目"""
        question = await self._select_question(difficulty)

        session = Session(
            question_id=question.id,
            difficulty=difficulty,
            messages=[{
                "role": "assistant",
                "content": question.content
            }],
            status=Status.IN_PROGRESS
        )
        await save_session(session)

        return {
            "sessionId": str(session.id),
            "question": question.content,
            "examples": question.examples
        }

    async def process_answer(self, session_id: str, user_input: str, code: str = None) -> AsyncIterator[str]:
        """处理用户答案，流式返回追问"""
        session = await get_session(session_id)

        # 构建提示词
        messages = session.messages + [
            {"role": "user", "content": f"Answer: {user_input}\nCode: {code or 'None'}"}
        ]

        # 调用 Claude API（流式）
        prompt = self._build_interview_prompt(messages)
        async for chunk in self.claude.send_message_stream(prompt):
            yield chunk

        # 保存到会话历史
        session.messages.append({"role": "user", "content": user_input})
        session.messages.append({"role": "assistant", "content": full_response})

        # 检查是否应该结束面试
        if "INTERVIEW_COMPLETE" in full_response:
            session.status = Status.COMPLETED
            await self.generate_report(session)

        await save_session(session)

    async def generate_report(self, session: Session) -> dict:
        """生成评估报告"""
        prompt = f"""
        评估以下面试表现并生成报告：
        题目：{session.question.content}
        对话历史：{session.messages}

        返回 JSON 格式：
        {{
          "algorithm": 8,
          "code_quality": 7,
          "complexity": 9,
          "edge_cases": 6,
          "communication": 8,
          "feedback": "...",
          "improvements": ["...", "..."]
        }}
        """

        response = await self.claude.send_message(prompt)
        report = json.loads(response)

        session.score = {
            "algorithm": report["algorithm"],
            "code_quality": report["code_quality"],
            "complexity": report["complexity"],
            "edge_cases": report["edge_cases"],
            "communication": report["communication"],
            "overall": sum(report.values()) // 5
        }
        session.feedback = report["feedback"]
        await save_session(session)

        return session.score

    def _build_interview_prompt(self, messages: list) -> str:
        """构建面试提示词"""
        system_prompt = """
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
        """

        # 构建完整对话历史
        full_prompt = system_prompt + "\n\n" + "\n".join([
            f"{m['role']}: {m['content']}" for m in messages
        ])

        return full_prompt
```

### API 端点

```
POST   /api/interviews/start
       请求头: Authorization: Bearer <token>
       请求: { difficulty: "easy"|"medium"|"hard" }
       响应: { sessionId, question, examples }

GET    /api/interviews/:id
       请求头: Authorization: Bearer <token>
       响应: { sessionId, question, messages, status, score? }

POST   /api/interviews/:id/answer
       请求头: Authorization: Bearer <token>
       请求: { content: string, code?: string, language?: string }
       响应: { reply: string, completed: boolean }

POST   /api/interviews/:id/end
       请求头: Authorization: Bearer <token>
       响应: { score: {...}, feedback: string, improvements: [...] }

GET    /api/interviews/history
       请求头: Authorization: Bearer <token>
       查询: ?limit=10&offset=0
       响应: [{ id, difficulty, score, status, created_at }]
```

### WebSocket 端点

```
WS     /ws/interview/:sessionId
       请求头: Authorization: Bearer <token> (作为查询参数)

客户端 → 服务器:
{ type: "answer", content: "...", code?: "..." }

服务器 → 客户端 (流式):
{ type: "message_chunk", content: "..." }
{ type: "message_complete", content: "...", completed: false }
```

---

## 验收标准

### 功能验收
- [ ] 能选择难度开始面试
- [ ] 题目内容清晰，包含示例
- [ ] 能提交文字或代码答案
- [ ] AI 追问有深度（非预设问题库）
- [ ] WebSocket 流式响应流畅
- [ ] 对话历史正确持久化
- [ ] 能手动结束面试
- [ ] AI 判断完成后自动结束
- [ ] 生成详细的反馈报告

### 性能验收
- [ ] 首次响应 < 2 秒
- [ ] 流式响应首字延迟 < 1 秒
- [ ] 并发支持 > 50 用户

### 质量验收
- [ ] 追问相关性强
- [ ] 评分客观合理
- [ ] 反馈有价值，用户愿意改进

---

## 示例场景

```
用户：选择 "中等" 难度

AI：两数之和
给定一个整数数组 nums 和一个整数 target，返回两数之和等于 target 的索引。
示例：
输入：nums = [2,7,11,15], target = 9
输出：[0,1]
解释：nums[0] + nums[1] = 9

用户：我的思路是用暴力法，两层循环遍历所有组合。

AI：时间复杂度是多少？有更优的解法吗？

用户：时间复杂度是 O(n²)。可以用哈希表优化到 O(n)。

AI：哈希表解法的空间复杂度是多少？如果有多个答案怎么办？

用户：空间复杂度是 O(n)。如果有多个答案，返回第一个匹配的即可。

AI：很好，你的思路清晰。请写出代码。

用户：[提交代码]

AI：代码看起来不错。INTERVIEW_COMPLETE

[生成报告]
评分：
- 算法思路：8/10 ✅
- 代码质量：7/10 ✅
- 复杂度分析：9/10 ✅
- 边界考虑：6/10 ⚠️
- 沟通表达：8/10 ✅

反馈：
你对哈希表优化有深入理解，对复杂度分析准确。但边界考虑不够充分：
1. 如果没有答案怎么办？
2. 如果有重复元素怎么办？
3. target 可以是负数吗？

建议：
- 多考虑边界情况
- 先判断输入合法性
- 补充单元测试
```

---

## 测试用例

```python
# 开始面试
POST /api/interviews/start
{
  "difficulty": "medium"
}
→ 200 OK
{
  "sessionId": "uuid",
  "question": "两数之和...",
  "examples": [...]
}

# 提交答案
POST /api/interviews/uuid/answer
{
  "content": "我打算用哈希表...",
  "code": "def twoSum(nums, target):...",
  "language": "python"
}
→ 200 OK
{
  "reply": "你的思路很好。时间复杂度是多少？",
  "completed": false
}

# 结束面试
POST /api/interviews/uuid/end
→ 200 OK
{
  "score": {
    "algorithm": 8,
    "code_quality": 7,
    ...
  },
  "feedback": "...",
  "improvements": ["..."]
}
```
