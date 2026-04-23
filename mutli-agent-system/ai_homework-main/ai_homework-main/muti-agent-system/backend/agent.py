from typing import List, Dict, Optional, Tuple
from models import Character, Message
from config import Config
import openai
import re
import json
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
    
    async def generate_movement(self, context: str) -> Optional[Tuple[float, float]]:
        """根据剧本内容生成角色移动"""
        if self.client is None:
            return None
        
        try:
            # 构建系统提示词
            system_prompt = f"你是角色移动规划助手。根据剧本内容，为角色 {self.character.name} 生成移动指令。请以 JSON 格式返回：{{\"dx\": 移动距离X, \"dy\": 移动距离Y}}"
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"根据以下剧本内容，为角色 {self.character.name} 生成移动指令：\n{context}"}
            ]
            
            response = await self.client.chat.completions.create(
                model=Config.OPENAI_MODEL,
                messages=messages,
                temperature=0.3,
                max_tokens=100
            )
            
            result = response.choices[0].message.content
            result = result.strip()
            if result.startswith('```'):
                result = result.split('```')[1]
                if result.startswith('json'):
                    result = result[4:]
            
            movement = json.loads(result)
            return (movement.get('dx', 0.0), movement.get('dy', 0.0))
        
        except Exception as e:
            print(f"Error generating movement for {self.character.name}: {e}")
            return None


class AgentOrchestrator:
    def __init__(self, characters: List[Character]):
        self.characters = {c.name: c for c in characters}
        self.agents = {c.name: Agent(c) for c in characters}
        self.scene_history = []
    
    async def process_scene(self, script: str, max_turns: int = 10) -> List[Message]:
        """处理剧本场景，确保对话高度还原剧情"""
        scene_elements = self._parse_script(script)
        messages = []
        turn = 0
        
        # 将整个剧本作为上下文，帮助模型理解剧情脉络
        full_script_context = f"当前正在演绎的剧本内容：\n{script}\n\n"
        
        for element in scene_elements[:max_turns]:
            element_type = element.get('type')
            
            if element_type == 'movement':
                # 处理移动指令逻辑保持不变
                # ... (代码省略，实际替换时包含)
                character_name = element.get('character')
                dx = element.get('dx', 0.0)
                dy = element.get('dy', 0.0)
                
                if character_name in self.characters:
                    character = self.characters[character_name]
                    character.move(dx, dy)
                    
                    # 检查是否与其他角色相遇
                    for other_name, other_char in self.characters.items():
                        if other_name != character_name:
                            distance = self._calculate_distance(character, other_char)
                            if distance < 1.0:  # 相遇阈值
                                # 生成相遇交互
                                interaction_msg = await self._generate_interaction(character_name, other_name)
                                if interaction_msg:
                                    messages.append(interaction_msg)
            
            elif element_type == 'dialogue':
                # 处理对话：使用更强的提示词确保模型补充和丰富剧情对话
                character_name = element.get('character')
                dialogue_content = element.get('content')
                
                if character_name not in self.agents:
                    continue
                
                agent = self.agents[character_name]
                
                # 构建更丰富的上下文，要求 AI 补充细节
                prompt = f"{full_script_context}现在请你扮演角色 {character_name}。根据剧本中的这一行：“{dialogue_content}”，请扩展并演绎出这段对话。你可以增加细节、情感表达或动作描写，但必须严格符合剧本原意。"
                
                response = await agent.respond(prompt, self.scene_history)
                
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
                    "role": "assistant", # 修改为 assistant 更符合对话历史逻辑
                    "content": f"{character_name}: {response}"
                })
        
        return messages
    
    def _parse_script(self, script: str) -> List[Dict[str, any]]:
        """解析剧本，支持移动指令和对话"""
        elements = []
        lines = script.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # 解析移动指令：角色名 移动 (dx, dy)
            move_match = re.match(r'([\u4e00-\u9fa5]{2,4})\s*移动\s*\(([^)]+)\)', line)
            if move_match:
                character = move_match.group(1)
                coords = move_match.group(2).split(',')
                if len(coords) == 2:
                    try:
                        dx = float(coords[0].strip())
                        dy = float(coords[1].strip())
                        elements.append({
                            'type': 'movement',
                            'character': character,
                            'dx': dx,
                            'dy': dy
                        })
                    except ValueError:
                        pass
                continue
            
            # 解析对话：角色名: 内容
            dialogue_match = re.match(r'([\u4e00-\u9fa5]{2,4})[：:]\s*(.+)', line)
            if dialogue_match:
                character = dialogue_match.group(1)
                content = dialogue_match.group(2)
                elements.append({
                    'type': 'dialogue',
                    'character': character,
                    'content': content
                })
        
        return elements
    
    def _calculate_distance(self, char1: Character, char2: Character) -> float:
        """计算两个角色之间的距离"""
        dx = char1.x - char2.x
        dy = char1.y - char2.y
        return (dx**2 + dy**2)**0.5
    
    async def _generate_interaction(self, char1_name: str, char2_name: str) -> Optional[Message]:
        """生成两个角色相遇时的交互"""
        if char1_name not in self.agents or char2_name not in self.agents:
            return None
        
        char1 = self.characters[char1_name]
        char2 = self.characters[char2_name]
        
        # 生成相遇场景描述
        context = f"{char1_name} 和 {char2_name} 相遇了。请根据他们的性格和背景，生成一段自然的交互对话。"
        
        # 让第一个角色先说话
        agent1 = self.agents[char1_name]
        response1 = await agent1.respond(f"你遇到了 {char2_name}，请打招呼。", self.scene_history)
        
        turn = len(self.scene_history) + 1
        message1 = Message(
            id=f"msg_{turn}",
            character_id=char1_name,
            character_name=char1_name,
            content=response1,
            action=agent1.generate_action(response1),
            timestamp=datetime.now()
        )
        
        self.scene_history.append({
            "role": "user",
            "content": f"{char1_name}: {response1}"
        })
        
        # 让第二个角色回应
        agent2 = self.agents[char2_name]
        response2 = await agent2.respond(f"{char1_name} 对你说：{response1}", self.scene_history)
        
        turn += 1
        message2 = Message(
            id=f"msg_{turn}",
            character_id=char2_name,
            character_name=char2_name,
            content=response2,
            action=agent2.generate_action(response2),
            timestamp=datetime.now()
        )
        
        self.scene_history.append({
            "role": "user",
            "content": f"{char2_name}: {response2}"
        })
        
        # 返回第二个消息，因为第一个消息已经添加到场景历史中
        return message2
    
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
