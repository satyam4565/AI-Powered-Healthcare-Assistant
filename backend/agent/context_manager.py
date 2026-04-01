from typing import List, Dict, Any
from sqlalchemy import select
from db.db import AsyncSessionLocal
from db.models import ChatSession, ChatMessage

class ContextManager:
    """PostgreSQL-backed session context manager for multi-turn conversations."""
    
    async def get_session_history(self, session_id: str) -> List[Dict[str, Any]]:
        """Retrieve all past messages for a given session."""
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(ChatMessage)
                .where(ChatMessage.session_id == session_id)
                .order_by(ChatMessage.id.asc())
            )
            messages = result.scalars().all()
            # Return just the raw message dictionaries so the LLM can read them
            return [msg.message_data for msg in messages]
        
    async def add_message(self, session_id: str, user_id: int, role: str, message: Any):
        """Save a new message to the database, creating the session if needed."""
        async with AsyncSessionLocal() as session:
            # 1. Ensure the ChatSession exists
            result = await session.execute(select(ChatSession).where(ChatSession.session_id == session_id))
            chat_session = result.scalars().first()
            
            if not chat_session:
                chat_session = ChatSession(session_id=session_id, user_id=user_id, role=role)
                session.add(chat_session)
                await session.flush() # Flush to lock in the session before adding messages

            # 2. Clean the message (handle Pydantic objects from Groq)
            cleaned_msg = {}
            if hasattr(message, "model_dump"):
                cleaned_msg = message.model_dump(exclude_none=True)
            elif isinstance(message, dict):
                cleaned_msg = message
                
            # 3. Save the message
            new_msg = ChatMessage(session_id=session_id, message_data=cleaned_msg)
            session.add(new_msg)
            await session.commit()
        
    async def clear_session(self, session_id: str):
        """Delete a session and cascade-delete all its messages."""
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(ChatSession).where(ChatSession.session_id == session_id))
            chat_session = result.scalars().first()
            if chat_session:
                await session.delete(chat_session)
                await session.commit()

# Global instance
context_manager = ContextManager()