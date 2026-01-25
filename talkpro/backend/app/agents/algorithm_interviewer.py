import json
import uuid
from app.services.claude import ClaudeService
from app.models.session import InterviewSession, SessionType, SessionStatus


class AlgorithmInterviewer:
    """Algorithm interview agent"""

    SYSTEM_PROMPT = """You are an experienced technical interviewer conducting a coding interview.

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

Keep your responses concise and focused. Ask one follow-up question at a time."""

    def __init__(self):
        self.claude = ClaudeService()
        self.questions = self._load_questions()

    def _load_questions(self):
        """Load questions from JSON file"""
        try:
            with open("data/questions.json", "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading questions: {e}")
            return []

    async def start_interview(
        self, difficulty: str
    ) -> tuple[InterviewSession, str]:
        """
        Start an algorithm interview.

        Args:
            difficulty: easy, medium, or hard

        Returns:
            (session, question_text)
        """
        # Filter questions by difficulty
        filtered_questions = [
            q for q in self.questions if q["difficulty"] == difficulty.lower()
        ]

        if not filtered_questions:
            raise ValueError(f"No questions found for difficulty: {difficulty}")

        # Select a question (randomly for now, can be smarter later)
        import random
        question = random.choice(filtered_questions)

        # Create session
        session = InterviewSession(
            id=str(uuid.uuid4()),
            type=SessionType.ALGORITHM,
            question_id=question["id"],
            messages=[
                {
                    "role": "assistant",
                    "content": f"## {question['title']}\n\n{question['content']}\n\n### 示例:\n" +
                               "\n".join([
                                   f"- 输入: {ex['input']}\n  输出: {ex['output']}" +
                                   (f"\n  说明: {ex.get('explanation', '')}" if ex.get('explanation') else "")
                                   for ex in question.get("examples", [])
                               ])
                }
            ],
            status=SessionStatus.IN_PROGRESS,
        )

        return session, session.messages[0]["content"]

    async def process_answer(
        self, session: InterviewSession, user_input: str, code: str = None
    ) -> tuple[str, bool]:
        """
        Process user's answer and generate follow-up question.

        Args:
            session: Current interview session
            user_input: User's text response
            code: Optional code submission

        Returns:
            (ai_response, is_complete)
        """
        # Build conversation history
        messages = [{"role": "system", "content": self.SYSTEM_PROMPT}]
        messages.extend(session.messages)

        # Add user's answer
        user_message = f"Answer: {user_input}"
        if code:
            user_message += f"\n\nCode:\n```\n{code}\n```"
        messages.append({"role": "user", "content": user_message})

        # Get Claude's response
        full_response = ""
        async for chunk in self.claude.send_message_stream(
            "\n".join([m["content"] for m in messages])
        ):
            full_response += chunk

        # Check if interview is complete
        is_complete = "INTERVIEW_COMPLETE" in full_response

        # Update session messages
        session.messages.append({"role": "user", "content": user_input})
        session.messages.append({"role": "assistant", "content": full_response})

        return full_response, is_complete

    def _build_conversation(
        self, session: InterviewSession, user_input: str, code: str = None
    ) -> str:
        """
        Build conversation for streaming.

        Args:
            session: Current interview session
            user_input: User's text response
            code: Optional code submission

        Returns:
            Conversation as string
        """
        messages = [{"role": "system", "content": self.SYSTEM_PROMPT}]
        messages.extend(session.messages)

        # Add user's answer
        user_message = f"Answer: {user_input}"
        if code:
            user_message += f"\n\nCode:\n```\n{code}\n```"
        messages.append({"role": "user", "content": user_message})

        return "\n".join([m["content"] for m in messages])

    async def generate_report(
        self, session: InterviewSession
    ) -> dict:
        """
        Generate evaluation report.

        Args:
            session: Completed interview session

        Returns:
            Dictionary with scores and feedback
        """
        # Build evaluation prompt
        evaluation_prompt = f"""Evaluate the following interview performance and provide a JSON response:

Question: {session.messages[0]['content']}

Conversation:
{json.dumps(session.messages[1:], ensure_ascii=False, indent=2)}

Provide evaluation in this exact JSON format:
{{
  "algorithm": <0-10 score for algorithm correctness>,
  "code_quality": <0-10 score for code quality>,
  "complexity": <0-10 score for complexity analysis>,
  "edge_cases": <0-10 score for edge case consideration>,
  "communication": <0-10 score for communication clarity>,
  "feedback": "<Overall feedback in Chinese>",
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
                    "algorithm": 7,
                    "code_quality": 7,
                    "complexity": 7,
                    "edge_cases": 7,
                    "communication": 7,
                    "feedback": response,
                    "improvements": ["继续练习算法题", "注意边界条件", "优化代码质量"]
                }

            # Calculate overall score
            report["overall"] = sum([
                report["algorithm"],
                report["code_quality"],
                report["complexity"],
                report["edge_cases"],
                report["communication"]
            ]) // 5

            return report

        except Exception as e:
            print(f"Error generating report: {e}")
            return {
                "algorithm": 5,
                "code_quality": 5,
                "complexity": 5,
                "edge_cases": 5,
                "communication": 5,
                "overall": 5,
                "feedback": "评估过程中出现错误，请重新尝试。",
                "improvements": ["请重新参加面试"]
            }
