# Feature 06: 个性化功能

**优先级**: P2
**状态**: 待开发
**依赖**: Feature 01, Feature 02, Feature 03

---

## 功能描述

提供基于用户画像的个性化面试定制功能，根据用户的简历、目标岗位和历史表现，自动调整面试题目和难度。

---

## 用户故事

作为一名有明确目标用户，我想要：
- 上传我的简历，让 AI 了解我的背景
- 添加我的目标岗位，了解差距
- 获得定制的面试题目
- 获得个性化的训练推荐

---

## 功能需求

### 6.1 简历管理

**功能：**
- 上传简历（PDF 格式）
- AI 自动解析简历
- 展示解析结果：
  - 技能栈
  - 项目经验
  - 工作经历
  - 薄弱点识别

**输入：**
- PDF 文件

**输出：**
- 简历 URL
- 解析结果（JSON）

### 6.2 目标岗位 JD 管理

**功能：**
- 添加目标公司和岗位
- 上传或粘贴 JD
- AI 分析 JD 要求
- 展示差距分析

**输入：**
- 公司名称
- 岗位名称
- JD 文本

**输出：**
- JD 解析结果
- 差距分析

### 6.3 定制面试

**功能：**
- 根据简历生成定制题目
- 根据 JD 生成定制题目
- 结合简历和 JD 生成题目

**输入：**
- 简历 ID
- JD ID（可选）
- 面试类型（算法/系统设计）

**输出：**
- 定制题目列表
- 每个题目包含：
  - 题目内容
  - 背景（基于简历项目或 JD 要求）
  - 评估要点

### 6.4 难度自适应

**功能：**
- 根据用户历史表现计算能力水平
- 推荐合适难度
- 面试中动态调整难度

**逻辑：**
```
简单题正确率 > 80% → 推荐中等
中等题正确率 > 60% → 推荐困难
否则 → 推荐简单或保持当前难度
```

### 6.5 智能推荐

**功能：**
- 根据薄弱点推荐训练
- 根据目标岗位差距推荐训练
- 生成学习路径

**输出：**
- 推荐训练计划（优先级排序）
- 每个推荐包含：
  - 训练类型
  - 题目/场景
  - 推荐理由
  - 预计耗时

---

## 技术实现

### AI Prompt 设计

#### 简历分析 Prompt

```
You are an experienced technical interviewer analyzing a candidate's resume.

Analyze the following resume and extract:
1. Technical skills (programming languages, frameworks, databases, tools)
2. Project experience (name, tech stack, role, key challenges)
3. Years of experience
4. Potential weaknesses based on what's NOT mentioned

Resume:
{resume_text}

Format your response as JSON:
{
  "skills": ["Python", "Django", "MySQL", ...],
  "projects": [
    {
      "name": "电商订单系统",
      "tech_stack": ["Python", "Django"],
      "role": "后端开发",
      "description": "负责订单模块开发",
      "challenges": ["高并发", "分布式事务"]
    }
  ],
  "years_of_experience": 2,
  "weaknesses": ["分布式系统", "微服务", "高并发"]
}
```

#### JD 分析 Prompt

```
You are an experienced technical recruiter analyzing a job description.

Analyze the following job description and extract:
1. Required technical skills (with priority: must-have/nice-to-have)
2. Key requirements and responsibilities
3. Years of experience required
4. Seniority level

Job Description:
{jd_text}

Format your response as JSON:
{
  "required_skills": [
    {"name": "分布式系统", "priority": "must-have"},
    {"name": "微服务", "priority": "must-have"},
    {"name": "Kubernetes", "priority": "nice-to-have"}
  ],
  "requirements": [
    "5 年以上分布式系统开发经验",
    "有高并发系统经验（QPS 10万+）"
  ],
  "years_of_experience": 5,
  "seniority_level": "senior"
}
```

#### 定制问题生成 Prompt

```
You are an experienced technical interviewer creating personalized interview questions.

Generate 3-5 personalized interview questions based on:
- Candidate's resume: {resume_analysis}
- Target job requirements: {jd_analysis}

Focus on:
1. Deep dive into their project experience
2. Assess their understanding of key technologies
3. Test their knowledge in areas where the JD emphasizes but the resume lacks
4. Evaluate their problem-solving abilities

Format your response as JSON:
[
  {
    "type": "project_deep_dive",
    "question": "请详细描述你在电商订单系统中遇到的最大技术挑战",
    "context": {
      "project": "电商订单系统",
      "role": "后端开发"
    },
    "evaluation_criteria": ["问题分析", "解决方案", "技术深度"]
  },
  {
    "type": "knowledge_gap",
    "question": "JD 提到需要分布式系统经验，你了解分布式事务的解决方案吗？",
    "context": {
      "gap": "分布式系统",
      "jd_requirement": "5 年以上分布式系统开发经验"
    },
    "evaluation_criteria": ["理论理解", "实践经验"]
  }
]
```

### 数据模型

```python
class Resume(Base):
    __tablename__ = "resumes"

    id = Column(UUID, primary_key=True, default=uuid4)
    user_id = Column(UUID, ForeignKey("users.id"))
    file_url = Column(String, nullable=False)
    parsed_data = Column(JSONB, nullable=True)
    # parsed_data 结构:
    # {
    #   "skills": [...],
    #   "projects": [...],
    #   "years_of_experience": number,
    #   "weaknesses": [...]
    # }
    created_at = Column(DateTime, default=datetime.utcnow)

class JobTarget(Base):
    __tablename__ = "job_targets"

    id = Column(UUID, primary_key=True, default=uuid4)
    user_id = Column(UUID, ForeignKey("users.id"))
    company = Column(String, nullable=False)
    position = Column(String, nullable=False)
    jd_text = Column(Text, nullable=True)
    jd_analysis = Column(JSONB, nullable=True)
    # jd_analysis 结构:
    # {
    #   "required_skills": [...],
    #   "requirements": [...],
    #   "years_of_experience": number,
    #   "seniority_level": string
    # }
    gap_analysis = Column(JSONB, nullable=True)
    status = Column(Enum(TargetStatus), default=TargetStatus.APPLYING)
    created_at = Column(DateTime, default=datetime.utcnow)

class PersonalizedQuestion(Base):
    __tablename__ = "personalized_questions"

    id = Column(UUID, primary_key=True, default=uuid4)
    user_id = Column(UUID, ForeignKey("users.id"))
    resume_id = Column(UUID, ForeignKey("resumes.id"))
    job_target_id = Column(UUID, ForeignKey("job_targets.id"), nullable=True)
    question = Column(Text, nullable=False)
    type = Column(Enum(QuestionType), nullable=False)
    context = Column(JSONB, nullable=True)
    evaluation_criteria = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserAbilityLevel(Base):
    __tablename__ = "user_ability_levels"

    id = Column(UUID, primary_key=True, default=uuid4)
    user_id = Column(UUID, ForeignKey("users.id"), unique=True)
    interview_type = Column(Enum(InterviewType), nullable=False)
    easy_accuracy = Column(Float, default=0.0)
    medium_accuracy = Column(Float, default=0.0)
    hard_accuracy = Column(Float, default=0.0)
    recommended_difficulty = Column(Enum(Difficulty), default=Difficulty.EASY)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### API 端点

```
# 简历管理
POST   /api/personalization/resume
       请求: { file: <Upload> }
       响应: { resumeId, fileUrl, parsedData }

GET    /api/personalization/resume
       响应: { resumes: [...] }

# JD 管理
POST   /api/personalization/job-targets
       请求: { company, position, jdText }
       响应: { jobTarget, jdAnalysis, gapAnalysis }

GET    /api/personalization/job-targets
       响应: { jobTargets: [...] }

# 定制面试
POST   /api/personalization/generate-questions
       请求: { resumeId, jobTargetId?, type }
       响应: { questions: [...] }

POST   /api/personalization/start-personalized-interview
       请求: { resumeId, jobTargetId?, type, difficulty? }
       响应: { sessionId, firstQuestion }

# 难度推荐
GET    /api/personalization/recommended-difficulty
       响应: { algorithm: "medium", system_design: "easy" }

# 智能推荐
GET    /api/personalization/training-plan
       响应: {
         weaknesses: [...],
         gaps: [...],
         recommendations: [
           {
             type: "algorithm",
             title: "两数之和",
             difficulty: "medium",
             reason: "你的算法能力较弱，建议加强练习",
             estimated_duration: 900,
             priority: 1
           }
         ]
       }
```

---

## 验收标准

- [ ] 简历上传和解析功能正常
- [ ] AI 能准确识别技能和项目经验
- [ ] JD 分析准确
- [ ] 差距分析合理
- [ ] 定制问题有针对性
- [ ] 难度自适应准确
- [ ] 智能推荐合理可执行
- [ ] 定制面试比通用面试更有价值

---

## 示例场景

### 场景：用户准备阿里 P7 面试

**步骤 1：上传简历**
```
用户上传简历（包含 Python、Django、MySQL 经验，无分布式系统经验）

AI 解析结果：
{
  "skills": ["Python", "Django", "MySQL", "Redis"],
  "projects": [
    {
      "name": "电商订单系统",
      "tech_stack": ["Python", "Django", "MySQL"],
      "role": "后端开发",
      "description": "负责订单模块开发"
    }
  ],
  "years_of_experience": 2,
  "weaknesses": ["分布式系统", "微服务", "高并发"]
}
```

**步骤 2：添加目标岗位 JD**
```
用户添加：阿里 - 资深后端工程师（P7）

JD 要求：
- 5 年以上经验，精通分布式系统
- 熟悉微服务架构
- 有高并发系统经验（QPS 10万+）

AI 解析结果：
{
  "required_skills": [
    {"name": "分布式系统", "priority": "must-have"},
    {"name": "微服务", "priority": "must-have"},
    {"name": "高并发", "priority": "must-have"}
  ],
  "years_of_experience": 5,
  "seniority_level": "senior"
}

差距分析：
{
  "gaps": [
    {
      "skill": "分布式系统",
      "required": "精通",
      "current": "无经验",
      "gap_level": "large"
    },
    {
      "skill": "经验年限",
      "required": 5,
      "current": 2,
      "gap_level": "medium"
    }
  ]
}
```

**步骤 3：生成定制面试题**
```
AI 生成的问题：
1. 请详细描述你在电商订单系统中遇到的最大技术挑战？
   类型：项目深挖
   背景：基于用户简历中的项目

2. 如果订单系统需要支持 10 万 QPS，你会怎么优化？
   类型：差距测试
   背景：JD 要求高并发经验

3. 你了解微服务吗？如果让你把订单系统拆分为微服务，会怎么设计？
   类型：差距测试
   背景：JD 要求微服务经验，简历无相关经验

4. 分布式事务怎么保证一致性？你用过哪些方案？
   类型：深度测试
   背景：JD 要求分布式系统经验
```

**步骤 4：智能推荐训练计划**
```
推荐计划：

优先级 1：设计秒杀系统（系统设计 - 困难）
理由：目标岗位要求高并发经验，需要重点训练
预计耗时：30 分钟

优先级 2：设计微服务架构（系统设计 - 困难）
理由：目标岗位要求微服务经验，需要重点训练
预计耗时：30 分钟

优先级 3：分布式事务（算法 - 中等）
理由：JD 要求分布式系统经验，需要补充理论知识
预计耗时：20 分钟

优先级 4：电商订单系统重构（项目深挖）
理由：结合你的实际项目，深入思考架构演进
预计耗时：25 分钟
```

**步骤 5：难度自适应**
```
用户历史表现：
- 简单算法题：正确率 95%
- 中等算法题：正确率 65%
- 困难算法题：正确率 30%

系统推荐：中等难度（略高于当前水平）

如果用户在定制面试中连续答对 2 道中等题：
→ 系统自动切换到困难题（接近阿里 P7 水平）
```
