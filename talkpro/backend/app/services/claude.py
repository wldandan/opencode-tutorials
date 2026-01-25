from anthropic import AsyncAnthropic
from app.config import settings


class ClaudeService:
    """Claude API service wrapper"""

    def __init__(self):
        self.client = AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def send_message(
        self,
        message: str,
        model: str = "claude-3-5-sonnet-20241022",
        max_tokens: int = 4096,
    ) -> str:
        """
        Send a message to Claude and get a response.

        Args:
            message: The message to send
            model: Claude model to use
            max_tokens: Maximum tokens in response

        Returns:
            Claude's response text
        """
        try:
            response = await self.client.messages.create(
                model=model,
                max_tokens=max_tokens,
                messages=[{"role": "user", "content": message}],
            )
            return response.content[0].text
        except Exception as e:
            print(f"Error calling Claude API: {e}")
            raise

    async def send_message_stream(
        self,
        message: str,
        model: str = "claude-3-5-sonnet-20241022",
        max_tokens: int = 4096,
    ):
        """
        Send a message to Claude and stream the response.

        Args:
            message: The message to send
            model: Claude model to use
            max_tokens: Maximum tokens in response

        Yields:
            Chunks of Claude's response text
        """
        try:
            async with self.client.messages.stream(
                model=model,
                max_tokens=max_tokens,
                messages=[{"role": "user", "content": message}],
            ) as stream:
                async for text in stream.text_stream:
                    yield text
        except Exception as e:
            print(f"Error calling Claude API stream: {e}")
            raise
