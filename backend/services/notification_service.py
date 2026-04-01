async def mock_send_slack_message(channel_or_user: str, message: str) -> bool:
    """
    Mock Slack API - sends a notification.
    """
    print(f"\n*** [Slack API] ***")
    print(f"Target: {channel_or_user}")
    print(f"Message: {message}")
    print(f"*******************\n")
    return True
