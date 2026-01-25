import json
import uuid
from app.services.claude import ClaudeService
from app.models.session import InterviewSession, SessionType, SessionStatus


class SystemDesignAgent:
    """System design interview agent"""

    SYSTEM_PROMPT = """You are an experienced architect conducting a system design interview.

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

Interview stages:
1. Requirements clarification (QPS, data volume, constraints)
2. Architecture design (high-level structure, components)
3. Deep dive (scalability, availability, consistency)
4. Summary

Keep your responses focused and ask one question at a time."""

    def __init__(self):
        self.claude = ClaudeService()
        self.scenarios = self._load_scenarios()

    def _load_scenarios(self):
        """Load scenarios from JSON file"""
        try:
            with open("data/scenarios.json", "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading scenarios: {e}")
            return []

    async def start_interview(
        self, scenario_id: str
    ) -> tuple[InterviewSession, dict]:
        """
        Start a system design interview.

        Args:
            scenario_id: ID of the scenario to discuss

        Returns:
            (session, scenario_data)
        """
        # Find scenario
        scenario = None
        for s in self.scenarios:
            if s["id"] == scenario_id:
                scenario = s
                break

        if not scenario:
            raise ValueError(f"Scenario not found: {scenario_id}")

        # Create session
        initial_message = f"""## {scenario['title']}

### 描述
{scenario['description']}

### 核心需求
{scenario['requirements']}

### 约束条件
{scenario['constraints']}

让我们开始讨论。首先，请确认你对需求的理解，并说明你打算从哪些方面来设计这个系统。"""

        session = InterviewSession(
            id=str(uuid.uuid4()),
            type=SessionType.SYSTEM_DESIGN,
            scenario_id=scenario_id,
            messages=[{"role": "assistant", "content": initial_message}],
            status=SessionStatus.IN_PROGRESS,
        )

        return session, scenario

    async def discuss_design(
        self, session: InterviewSession, user_input: str
    ) -> tuple[str, str]:
        """
        Discuss the design with the candidate.

        Args:
            session: Current interview session
            user_input: User's response

        Returns:
            (ai_response, stage)
        """
        # Build conversation history
        messages = [{"role": "system", "content": self.SYSTEM_PROMPT}]
        messages.extend(session.messages)
        messages.append({"role": "user", "content": user_input})

        # Get Claude's response
        full_response = ""
        async for chunk in self.claude.send_message_stream(
            "\n".join([m["content"] for m in messages])
        ):
            full_response += chunk

        # Determine current stage (simplified)
        stage = self._determine_stage(session.messages + [
            {"role": "user", "content": user_input},
            {"role": "assistant", "content": full_response}
        ])

        # Update session messages
        session.messages.append({"role": "user", "content": user_input})
        session.messages.append({"role": "assistant", "content": full_response})

        return full_response, stage

    def _determine_stage(self, messages) -> str:
        """Determine current interview stage based on conversation"""
        # Simplified logic - can be improved
        text = " ".join([m["content"] for m in messages[-5:]])

        if any(word in text for word in ["需求", "QPS", "数据量", "约束"]):
            return "requirements"
        elif any(word in text for word in ["架构", "设计", "组件", "模块"]):
            return "architecture"
        elif any(word in text for word in ["扩展", "容错", "一致性", "可用"]):
            return "deep_dive"
        else:
            return "discussion"

    async def generate_report(
        self, session: InterviewSession
    ) -> dict:
        """
        Generate evaluation report for system design.

        Args:
            session: Completed interview session

        Returns:
            Dictionary with scores and feedback
        """
        # Get scenario info
        scenario_id = session.scenario_id
        scenario = next((s for s in self.scenarios if s["id"] == scenario_id), None)

        scenario_info = ""
        if scenario:
            scenario_info = f"""
Scenario: {scenario['title']}
Description: {scenario['description']}
Requirements: {scenario['requirements']}
"""

        # Build evaluation prompt
        evaluation_prompt = f"""Evaluate the following system design discussion and provide a JSON response:

{scenario_info}

Conversation:
{json.dumps(session.messages[1:], ensure_ascii=False, indent=2)}

Provide evaluation in this exact JSON format:
{{
  "requirements": <0-10 score for requirement understanding>,
  "architecture": <0-10 score for architecture design>,
  "tech_stack": <0-10 score for technology choices>,
  "scalability": <0-10 score for scalability considerations>,
  "availability": <0-10 score for high availability design>,
  "consistency": <0-10 score for data consistency handling>,
  "feedback": "<Overall feedback in Chinese>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement suggestion 1>", "<improvement suggestion 2>"]
}}

Only return the JSON, no other text."""

        try:
            response = await self.claude.send_message(evaluation_prompt)

            # Try to parse JSON
            try:
                report = json.loads(response)
            except json.JSONDecodeError:
                # If parsing fails, create a default report
                report = {
                    "requirements": 7,
                    "architecture": 7,
                    "tech_stack": 7,
                    "scalability": 7,
                    "availability": 7,
                    "consistency": 7,
                    "feedback": response,
                    "strengths": ["思路清晰", "考虑较全面"],
                    "improvements": ["加强高可用设计", "考虑数据一致性"]
                }

            # Calculate overall score
            report["overall"] = sum([
                report["requirements"],
                report["architecture"],
                report["tech_stack"],
                report["scalability"],
                report["availability"],
                report["consistency"]
            ]) // 6

            return report

        except Exception as e:
            print(f"Error generating report: {e}")
            return {
                "requirements": 5,
                "architecture": 5,
                "tech_stack": 5,
                "scalability": 5,
                "availability": 5,
                "consistency": 5,
                "overall": 5,
                "feedback": "评估过程中出现错误，请重新尝试。",
                "strengths": [],
                "improvements": ["请重新参加面试"]
            }
