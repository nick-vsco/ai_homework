from typing import List, Dict, Optional
from models import Character, Message
from config import Config
import openai
import re
from datetime import datetime
from character_analyzer import CharacterAnalyzer

class Agent:
    def __init__(self, character: Character, api_key: str = None):
        self.character = character
        self.api_key = api_key or Config.OPENAI_API_KEY
        self.analyzer = CharacterAnalyzer()
        self.conversation_history = []
        self.system_prompt = self._build_system_prompt()
        
        try:
            self.client = openai.AsyncOpenAI(
                api_key=self.api_key,
                base_url=Config.OPENAI_BASE_URL
            )
        except Exception as e:
            print(f"Warning: Failed to initialize OpenAI client: {e}")
            self.client = None
    
    def _build_system_prompt(self) -> str:
        """构建系统提示词"""
        return f"""你是一个角色扮演AI，你将扮演以下角色：
角色名：{self.character.name}
角色描述：{self.character.description}
性格特征：{self.character.personality}
角色定位：{self.character.role}

请根据角色的性格和背景，自然地回应对话。保持角色一致性，使用符合角色身份的语言风格。"""

    async def respond(self, context: str, conversation_history: List[Dict[str, str]] = None) -> str:
        """生成角色回复"""
        if self.client is None:
            return f"（{self.character.name} 沉默了）"
        
        try:
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": context}
            ]
            
            if conversation_history:
                messages.extend(conversation_history[-10:])
            
            response = await self.client.chat.completions.create(
                model=Config.OPENAI_MODEL,
                messages=messages,
                temperature=0.8,
                max_tokens=150
            )
            
            return response.choices[0].message.content
        
        except Exception as e:
            print(f"Error generating response for {self.character.name}: {e}")
            import traceback
            traceback.print_exc()
            return f"（{self.character.name} 沉默了）"

    def generate_action(self, context: str) -> str:
        """生成角色动作描述"""
        return f"{self.character.name} {self._infer_action(context)}"
    
    def _infer_action(self, context: str) -> str:
        """根据上下文推断角色动作"""
        if "笑" in context or "开心" in context:
            return f"笑着说："
        elif "生气" in context or "怒" in context:
            return f"生气地说："
        elif "思考" in context or "疑惑" in context:
            return f"思考了一下，说："
        else:
            return f"说："


class AgentOrchestrator:
    def __init__(self, characters: List[Character]):
        self.characters = {c.name: c for c in characters}
        self.agents = {c.name: Agent(c) for c in characters}
        self.scene_history = []
    
    async def process_scene(self, script: str, max_turns: int = 5) -> List[Message]:
        """处理剧本场景"""
        dialogues = self._parse_script(script)
        messages = []
        turn = 0
        
        for dialogue in dialogues[:max_turns]:
            character_name = dialogue['character']
            content = dialogue['content']
            
            if character_name not in self.agents:
                continue
            
            agent = self.agents[character_name]
            response = await agent.respond(content, self.scene_history)
            
            turn += 1
            message = Message(
                id=f"msg_{turn}",
                character_id=character_name,
                character_name=character_name,
                content=response,
                action=agent.generate_action(response),
                timestamp=datetime.now()
            )
            messages.append(message)
            
            self.scene_history.append({
                "role": "user",
                "content": f"{character_name}: {response}"
            })
        
        return messages
    
    def _parse_script(self, script: str) -> List[Dict[str, str]]:
        """解析剧本"""
        dialogues = []
        lines = script.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # 中文对话模式
            match = re.match(r'([\u4e00-\u9fa5]{2,4})[：:]\s*(.+)', line)
            if match:
                character = match.group(1)
                content = match.group(2)
                dialogues.append({
                    'character': character,
                    'content': content
                })
        
        return dialogues
    
    async def interactive_session(self, user_input: str, character_name: str) -> Message:
        """交互式对话"""
        if character_name not in self.agents:
            return Message(
                id="msg_0",
                character_id="system",
                character_name="系统",
                content=f"角色 '{character_name}' 不存在",
                action="",
                timestamp=datetime.now()
            )
        
        agent = self.agents[character_name]
        response = await agent.respond(user_input, self.scene_history)
        
        message = Message(
            id=f"msg_{len(self.scene_history)+1}",
            character_id=character_name,
            character_name=character_name,
            content=response,
            action=agent.generate_action(response),
            timestamp=datetime.now()
        )
        
        self.scene_history.append({
            "role": "user",
            "content": f"{character_name}: {response}"
        })
        
        return message
