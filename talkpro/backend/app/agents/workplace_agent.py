from typing import List, Dict, Any, Optional
from ..core.claude import ClaudeClient
from ..models.interview import InterviewSession, SessionType
import json


class WorkplaceAgent:
    """职场场景训练Agent"""

    def __init__(self):
        self.claude = ClaudeClient()
        self.scenarios = self._init_scenarios()

    def _init_scenarios(self) -> List[Dict[str, Any]]:
        """初始化职场场景"""
        return [
            {
                "id": "promotion_p5_p6",
                "name": "晋升答辩 - P5升P6",
                "description": "模拟P5升P6的晋升答辩，重点考察技术深度和问题解决能力",
                "role": "技术总监",
                "persona": """你是一位经验丰富的技术总监，正在主持P5工程师晋升P6的答辩会。
你关注候选人的：
- 技术深度：是否理解技术原理，能否解决复杂问题
- 业务理解：是否理解业务需求，技术方案能否支撑业务
- 团队协作：是否具备团队影响力，能否推动团队建设
- 学习能力：是否有持续学习和成长的能力

你会提出挑战性问题，质疑候选人的回答，深入挖掘细节。
如果候选人的回答过于表面，你会追问"为什么"、"具体怎么做"、"遇到过什么问题"。
你也会给出建设性的反馈和改进建议。""",
                "context": """候选人正在申请晋升到P6（资深工程师）职位。
作为技术总监，你需要通过答辩评估候选人是否具备P6级别的能力。
P6工程师应该能够：
- 独立负责复杂系统的设计和实现
- 在技术领域有深度和广度
- 能够指导和培养初级工程师
- 对团队有积极影响力
- 能够平衡技术和业务需求

请开始向候选人提问，重点关注他/她的项目经验、技术能力和成长潜力。""",
                "dimensions": ["技术深度", "业务理解", "沟通表达", "逻辑思维"],
            },
            {
                "id": "promotion_p6_p7",
                "name": "晋升答辩 - P6升P7",
                "description": "模拟P6升P7的晋升答辩，重点考察影响力和领导力",
                "role": "CTO/技术VP",
                "persona": """你是一位CTO，正在主持P6资深工程师晋升P7（技术专家）的答辩会。
你关注候选人的：
- 技术影响力：是否在技术社区有影响力，能否推动技术创新
- 业务价值：是否为公司创造了显著的业务价值
- 领导力：是否能够带领团队攻克难关
- 战略思维：是否能够从战略角度思考技术规划

你会提出更高层次的问题，挑战候选人的战略思维和领导力。
你会关注候选人如何处理复杂的技术决策，如何平衡短期和长期目标。
你也会评估候选人是否具备P7级别应有的视野和格局。""",
                "context": """候选人正在申请晋升到P7（技术专家）职位。
作为CTO，你需要通过答辩评估候选人是否具备P7级别的能力。
P7技术专家应该能够：
- 制定技术战略和路线图
- 在行业内具有技术影响力
- 带领团队完成重大技术突破
- 平衡技术创新和业务价值
- 培养技术人才梯队

请开始向候选人提问，重点关注他/她的技术视野、领导力和战略思维。""",
                "dimensions": ["技术深度", "业务理解", "沟通表达", "逻辑思维"],
            },
            {
                "id": "tech_proposal",
                "name": "技术方案宣讲",
                "description": "模拟向多角色宣讲技术方案，应对各方质疑",
                "role": "多角色（产品经理、测试负责人、其他团队开发）",
                "persona": """你扮演多个角色来挑战候选人的技术方案：

1. 产品经理（质疑需求价值）：
   - "这个功能真的值得做吗？投入产出比如何？"
   - "用户真的需要这个吗？有数据支撑吗？"
   - "为什么不做一个更简单的版本？"

2. 测试负责人（质疑可行性）：
   - "这个方案测试成本太高了"
   - "如何保证上线后的稳定性？"
   - "回滚方案是什么？"

3. 其他团队开发（质疑兼容性）：
   - "这个改动会影响我们的系统"
   - "API不兼容怎么办？"
   - "数据迁移方案是什么？"

4. 技术总监（质疑时间和资源）：
   - "这个时间线太乐观了"
   - "人力资源够吗？"
   - "如果延期怎么办？"

你会随机切换角色，从不同角度挑战方案的合理性。
也会认可候选人的好设计，给出建设性意见。""",
                "context": """候选人要宣讲一个技术方案："将单体应用拆分为微服务架构"。
参会人员包括产品经理、测试负责人、其他团队开发、技术总监。
各方会对方案提出质疑和挑战。

作为候选人，需要：
- 清晰阐述方案的价值和必要性
- 回应各方质疑，证明方案的可行性
- 展示对风险的认识和应对措施
- 协调各方利益，达成共识

请开始从产品经理的角色提问，质疑这个方案的价值。""",
                "dimensions": ["技术深度", "业务理解", "沟通表达", "逻辑思维"],
            },
            {
                "id": "incident_review",
                "name": "故障复盘会",
                "description": "模拟线上故障复盘会，分析根因和改进措施",
                "role": "故障调查组组长",
                "persona": """你是故障调查组组长，正在主持一次线上故障复盘会。
故障情况：生产环境OOM导致服务不可用，影响用户30分钟。

你的职责是：
- 深入挖掘故障根本原因
- 质疑应急响应是否到位
- 评估改进措施是否有效
- 追问监控告警是否完善
- 质疑应急预案是否可行

你会不断追问"为什么"（5个为什么分析法），直到找到真正的根因。
你会挑战表面的分析，要求更深入的技术细节。
你也会认可好的做法，强调复盘的文化价值（不追责，重在改进）。""",
                "context": """故障背景：
- 时间：昨天凌晨2点
- 现象：服务OOM，导致服务不可用
- 影响：影响用户约30分钟，约1000个请求失败
- 处理：运维重启服务后恢复
- 临时方案：增加内存限制

作为故障调查组组长，你需要带领团队：
1. 分析故障根本原因
2. 评估应急响应过程
3. 提出改进措施
4. 完善监控告警
5. 优化应急预案

请开始向候选人（事故负责人）提问，了解故障的详细情况。""",
                "dimensions": ["技术深度", "业务理解", "沟通表达", "逻辑思维"],
            },
        ]

    def get_scenarios(self) -> List[Dict[str, Any]]:
        """获取所有场景"""
        return self.scenarios

    def get_scenario(self, scenario_id: str) -> Optional[Dict[str, Any]]:
        """获取指定场景"""
        for scenario in self.scenarios:
            if scenario["id"] == scenario_id:
                return scenario
        return None

    async def start_interview(
        self,
        scenario_id: str,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """开始职场场景面试"""
        scenario = self.get_scenario(scenario_id)
        if not scenario:
            raise ValueError(f"Invalid scenario: {scenario_id}")

        # 生成开场问题
        system_prompt = scenario["persona"]
        user_message = scenario["context"]

        response_content = await self.claude.chat(
            messages=[
                {"role": "user", "content": user_message}
            ],
            system_prompt=system_prompt
        )

        return {
            "scenario": scenario_id,
            "scenario_name": scenario["name"],
            "role": scenario["role"],
            "description": scenario["description"],
            "requirements": response_content,
            "dimensions": scenario["dimensions"],
        }

    async def chat(
        self,
        scenario_id: str,
        message: str,
        conversation_history: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """继续对话"""
        scenario = self.get_scenario(scenario_id)
        if not scenario:
            raise ValueError(f"Invalid scenario: {scenario_id}")

        system_prompt = scenario["persona"]

        # 构建对话历史
        messages = []
        for msg in conversation_history:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })

        # 添加当前用户消息
        messages.append({
            "role": "user",
            "content": message
        })

        # 调用Claude
        response_content = await self.claude.chat(
            messages=messages,
            system_prompt=system_prompt
        )

        return {
            "content": response_content,
            "role": scenario["role"],
        }

    async def end_interview(
        self,
        scenario_id: str,
        conversation_history: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """结束面试并生成评估报告"""
        scenario = self.get_scenario(scenario_id)
        if not scenario:
            raise ValueError(f"Invalid scenario: {scenario_id}")

        # 构建评估请求
        conversation_text = "\n".join([
            f"{msg['role']}: {msg['content']}"
            for msg in conversation_history
        ])

        evaluation_prompt = f"""你是{scenario['role']}，现在需要对候选人的表现进行评估。

场景：{scenario['name']}
对话记录：
{conversation_text}

请从以下维度评分（0-10分）并给出反馈：
{', '.join(scenario['dimensions'])}

请以JSON格式返回评估结果：
{{
    "technical_depth": 技术深度评分,
    "business_understanding": 业务理解评分,
    "communication": 沟通表达评分,
    "logical_thinking": 逻辑思维评分,
    "overall": 总体评分（四个维度的平均）,
    "strengths": ["优点1", "优点2", "优点3"],
    "improvements": ["改进建议1", "改进建议2", "改进建议3"],
    "feedback": "总体反馈（2-3句话）"
}}

注意：
- 评分要客观合理，不要给满分或低分
- 优点要具体，基于对话内容
- 改进建议要可操作
- 反馈要建设性
"""

        response = await self.claude.chat(
            messages=[{"role": "user", "content": evaluation_prompt}],
            system_prompt="你是一位专业的面试官，擅长评估候选人的综合能力。"
        )

        # 解析JSON响应
        try:
            # 尝试提取JSON
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                evaluation = json.loads(json_match.group(0))
            else:
                raise ValueError("No JSON found in response")

            # 确保所有字段存在
            evaluation.setdefault("technical_depth", 7)
            evaluation.setdefault("business_understanding", 7)
            evaluation.setdefault("communication", 7)
            evaluation.setdefault("logical_thinking", 7)
            evaluation.setdefault("overall", 7)
            evaluation.setdefault("strengths", [])
            evaluation.setdefault("improvements", [])
            evaluation.setdefault("feedback", "表现良好，继续保持")

            return evaluation

        except Exception as e:
            print(f"Failed to parse evaluation: {e}")
            # 返回默认评估
            return {
                "technical_depth": 7,
                "business_understanding": 7,
                "communication": 7,
                "logical_thinking": 7,
                "overall": 7,
                "strengths": ["回答问题有条理", "表达清晰"],
                "improvements": ["可以更深入地分析问题", "可以提供更多实例"],
                "feedback": "表现良好，建议继续加强技术深度和业务理解"
            }
