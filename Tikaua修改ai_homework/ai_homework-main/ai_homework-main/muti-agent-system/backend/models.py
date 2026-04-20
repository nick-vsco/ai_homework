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
    x: float = 0.0
    y: float = 0.0
    emotions: Dict[str, float] = {}
    
    def move(self, dx: float, dy: float):
        """移动角色"""
        self.x += dx
        self.y += dy
    
    def set_position(self, x: float, y: float):
        """设置角色位置"""
        self.x = x
        self.y = y
    
    def get_position(self) -> tuple:
        """获取角色位置"""
        return (self.x, self.y)

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
