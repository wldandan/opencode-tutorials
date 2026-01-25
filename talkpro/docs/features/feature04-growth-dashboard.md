# Feature 04: 个人成长看板

**优先级**: P1（提高用户留存）
**状态**: 待开发
**依赖**: Feature 02, Feature 03

---

## 功能描述

提供可视化的个人成长看板，展示用户的训练历史、能力分布、薄弱点分析和智能训练计划。

---

## 用户故事

作为一名用户，我想要：
- 查看我的所有训练记录
- 了解我的能力分布（算法、系统设计等）
- 知道我的薄弱点在哪里
- 获得针对性的训练建议

---

## 功能需求

### 4.1 训练历史

**展示内容：**
- 所有训练记录列表
- 每条记录显示：
  - 日期时间
  - 类型（算法/系统设计）
  - 难度
  - 总体评分
  - 状态（完成/放弃）

**交互功能：**
- 筛选（按类型、难度、日期范围）
- 排序（按日期、评分）
- 分页（每页 20 条）
- 点击查看详情（完整对话和反馈）

### 4.2 能力雷达图

**四个维度：**
- **算法能力**（0-100）
- **系统设计**（0-100）
- **沟通表达**（0-100）
- **项目经验**（0-100）

**可视化：**
- ECharts 雷达图
- 显示当前能力值
- 显示上次训练的能力值（对比）
- 总体评分

### 4.3 薄弱点分析

**AI 分析：**
- 分析用户训练数据
- 识别能力短板（低于平均值 10 分以上）
- 提供改进建议
- 推荐相关训练

**展示内容：**
- 薄弱能力项
- 具体问题描述
- 改进建议
- 推荐训练

### 4.4 成长轨迹

**可视化内容：**
- 折线图展示能力变化
- 时间范围选择（周/月/季度/年）
- 多维度对比
- 标注关键节点

### 4.5 智能训练计划

**推荐逻辑：**
- 根据薄弱环节推荐
- 难度适中（略高于当前水平）
- 多样化（避免连续同类）

**展示内容：**
- 下 3 个推荐训练
- 每个包含：
  - 类型
  - 题目/场景
  - 推荐理由
  - 预计耗时
- 一键开始训练

---

## 技术实现

### 数据分析逻辑

```python
class GrowthAnalyzer:
    """成长数据分析器"""

    def calculate_ability_scores(self, user_id: UUID) -> dict:
        """计算四个维度的能力分数"""
        # 获取最近 30 次训练记录
        records = await get_user_records(user_id, limit=30)

        # 按维度分组计算加权平均
        algorithm_scores = [r.score['algorithm'] for r in records if r.type == 'algorithm']
        design_scores = [r.score['architecture'] for r in records if r.type == 'system_design']

        return {
            "algorithm": int(mean(algorithm_scores) * 10) if algorithm_scores else 50,
            "system_design": int(mean(design_scores) * 10) if design_scores else 50,
            "communication": 70,  # 从所有记录中提取
            "project": 60  # 从简历分析
        }

    def identify_weaknesses(self, user_id: UUID) -> list:
        """识别薄弱点"""
        scores = await self.calculate_ability_scores(user_id)
        avg_score = sum(scores.values()) / len(scores)

        weaknesses = []
        for dimension, score in scores.items():
            if score < avg_score - 10:
                weaknesses.append({
                    "dimension": dimension,
                    "score": score,
                    "gap": avg_score - score
                })

        return sorted(weaknesses, key=lambda x: x["gap"], reverse=True)

    def get_growth_trajectory(self, user_id: UUID, days: int) -> dict:
        """获取成长轨迹"""
        # 按日期分组统计评分
        records = await get_user_records(user_id, days=days)

        # 构建时间序列数据
        dates = []
        scores = {"algorithm": [], "system_design": []}

        for record in records:
            dates.append(record.created_at.strftime("%Y-%m-%d"))
            if record.type == "algorithm":
                scores["algorithm"].append(record.score["overall"])

        return {"dates": dates, "scores": scores}

    def recommend_training(self, user_id: UUID) -> list:
        """推荐训练计划"""
        weaknesses = await self.identify_weaknesses(user_id)
        recommendations = []

        for weakness in weaknesses[:3]:
            # 从题库选择相关题目
            if weakness["dimension"] == "algorithm":
                questions = await get_questions_by_difficulty("medium")
                recommendations.append({
                    "type": "algorithm",
                    "title": questions[0]["title"],
                    "difficulty": "medium",
                    "reason": f"你的算法能力较弱（{weakness['score']}分），建议加强练习",
                    "estimated_duration": 900
                })

        return recommendations
```

### 数据模型

```python
class TrainingRecord(Base):
    """训练记录表（已有的 Session/DesignSession 的视图）"""
    # 实际上可以创建一个视图或直接查询 Session 表
    pass
```

### API 端点

```
GET    /api/dashboard/history
       查询: ?type=algorithm&days=30&page=1
       响应: {
         total: 50,
         records: [
           {
             id, type, difficulty, score, status,
             created_at: "2026-01-25T10:00:00Z"
           }
         ]
       }

GET    /api/dashboard/abilities
       响应: {
         algorithm: 75,
         system_design: 60,
         communication: 70,
         project: 65,
         overall: 67
       }

GET    /api/dashboard/trajectory
       查询: ?days=90
       响应: {
         dates: ["2026-01-01", ...],
         scores: {
           algorithm: [70, 72, 75, ...],
           system_design: [55, 58, 60, ...]
         }
       }

GET    /api/dashboard/weaknesses
       响应: [
         {
           dimension: "system_design",
           score: 60,
           gap: 12,
           suggestions: ["学习分布式系统理论", "多做系统设计练习"]
         }
       ]

GET    /api/dashboard/recommendations
       响应: [
         {
           type: "algorithm",
           title: "两数之和",
           difficulty: "medium",
           reason: "你的算法能力较弱，建议加强练习",
           estimated_duration: 900
         }
       ]
```

---

## 前端实现

### 页面结构

```typescript
// DashboardPage.tsx
interface DashboardData {
  history: TrainingRecord[];
  abilities: AbilityScores;
  trajectory: TrajectoryData;
  weaknesses: Weakness[];
  recommendations: Recommendation[];
}

interface AbilityScores {
  algorithm: number;
  system_design: number;
  communication: number;
  project: number;
  overall: number;
}
```

### 组件树

```
DashboardPage
├── HistoryPanel
│   ├── FilterBar (类型、难度、日期)
│   ├── RecordList
│   └── Pagination
├── AbilityRadar
│   └── RadarChart (ECharts)
├── WeaknessPanel
│   └── WeaknessCard[]
├── TrajectoryChart
│   ├── TimeRangeSelector
│   └── LineChart (ECharts)
└── RecommendationPanel
    └── RecommendationCard[]
```

---

## 验收标准

- [ ] 训练历史完整展示
- [ ] 筛选和排序功能正常
- [ ] 能力雷达图准确反映各维度
- [ ] 薄弱点分析准确
- [ ] 成长轨迹可视化清晰
- [ ] 推荐训练合理可执行
- [ ] 训练后数据实时更新

---

## UI 原型

```
┌─────────────────────────────────────────────────────────┐
│  个人成长看板                               [刷新]      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────┐  ┌───────────────────────┐   │
│  │  训练历史 (30天)    │  │    能力雷达图         │   │
│  │ ┌─────────────────┐ │  │                       │   │
│  │ │1/25 算法 中 80分│ │  │      系统设计 60     │   │
│  │ │1/24 设计 简 70分│ │  │        ╱  ╲         │   │
│  │ │1/23 算法 简 85分│ │  │  沟通 ╱      ╲ 项目  │   │
│  │ │     ...         │ │  │      ╱          ╲    │   │
│  │ └─────────────────┘ │  │   算法 ╱──────────╲   │   │
│  │ [查看全部]          │  │      75              │   │
│  └─────────────────────┘  └───────────────────────┘   │
│                                                         │
│  ┌─────────────────────┐  ┌───────────────────────┐   │
│  │  成长轨迹 (90天)    │  │   智能训练计划        │   │
│  │ ┌─────────────────┐ │  │  1. 两数之和(算法)    │   │
│  │ │    ╱╲           │ │  │     推荐理由: ...     │   │
│  │ │   ╱  ╲  ╱       │ │  │     [开始训练]       │   │
│  │ │  ╱    ╲╱        │ │  │                       │   │
│  │ └─────────────────┘ │  │  2. 微服务(系统)      │   │
│  │ [周 ▼]              │  │     [开始训练]       │   │
│  └─────────────────────┘  └───────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              薄弱点分析                          │   │
│  │  系统设计 (60/100)  ← 低于平均 7 分              │   │
│  │  ├─ 问题: 高可用设计考虑不足                     │   │
│  │  ├─ 建议: 学习 CAP 理论、分布式一致性           │   │
│  │  └─ 推荐: 设计秒杀系统、设计分布式缓存           │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```
