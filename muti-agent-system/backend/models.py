from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class Character(BaseModel):
    id: str
    name: str
    description: str
    personality: str
    role: str
    status: str = "idle"
    location: str = "center"
    emotions: Dict[str, float] = {}

class Message(BaseModel):
    id: str
    character_id: str
    character_name: str
    content: str
    timestamp: datetime
    emotion: Optional[str] = None
    action: Optional[str] = None

class Scene(BaseModel):
    id: str
    title: str
    description: str
    characters: List[Character]
    script: str
    messages: List[Message] = []

class AgentState(BaseModel):
    scene: Optional[Scene] = None
    current_character: Optional[Character] = None
    conversation_history: List[Dict[str, Any]] = []
