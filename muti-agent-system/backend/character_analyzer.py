import os
from typing import List, Dict
from models import Character
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class CharacterAnalyzer:
    """角色分析器 - 使用 AI 从文本中识别和提取角色信息"""
    
    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY"),
            base_url=os.getenv("OPENAI_BASE_URL", "https://api.deepseek.com/v1")
        )
        self.model = os.getenv("OPENAI_MODEL", "deepseek-chat")
    
    def extract_characters(self, text: str, existing_characters: List[Character] = None) -> Dict:
        """从文本中提取角色和操作"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """你是一个剧本分析助手。请从提供的文本中提取所有角色信息和操作信息。

要求：
1. 仔细阅读文本，找出所有出现的角色
2. 角色可以是任何出现的人物，包括主角、配角等
3. 注意识别通过对话（如"小明说"）出现的角色
4. 注意识别通过指代词（如"他"、"她"、"他们"等）引用的角色
5. 每个角色需要有名称、描述、性格特点和角色类型
6. 分析文本中的操作信息，包括：
   - 移动操作：如"张三走到李四身边"、"李四离开"、"李四在散步"等
   - 对话操作：如"张三对李四说"、"李四说"等
   - 其他操作：如"张三坐下"、"李四挥手"等
7. 对于移动操作，记录操作类型、执行角色、目标角色（如果有）、移动类型（如"走到身边"、"散步"、"离开"等）等信息
8. 分析对话关系，确保对话之前两个角色是靠近的，如果需要，生成相应的移动操作

请以 JSON 格式返回，格式如下：
{
    "characters": [
        {
            "name": "角色名称",
            "description": "角色描述",
            "personality": "性格特点",
            "role": "角色类型"
        }
    ],
    "actions": [
        {
            "type": "movement",
            "character": "执行角色",
            "target": "目标角色（如果有）",
            "movement_type": "移动类型（如走到身边、散步、离开等）",
            "description": "操作描述"
        },
        {
            "type": "dialogue",
            "character": "执行角色",
            "target": "目标角色（如果有）",
            "content": "对话内容"
        }
    ]
}"""
                    },
                    {
                        "role": "user",
                        "content": f"请从以下文本中提取所有角色信息和操作信息：\n\n{text}"
                    }
                ],
                temperature=0.3
            )
            
            result = response.choices[0].message.content
            import json
            result = result.strip()
            if result.startswith('```'):
                result = result.split('```')[1]
                if result.startswith('json'):
                    result = result[4:]
            data = json.loads(result)
            
            characters = []
            for i, char_data in enumerate(data.get("characters", [])):
                characters.append(Character(
                    id=f"char_{i}",
                    name=char_data.get("name", f"角色{i}"),
                    description=char_data.get("description", ""),
                    personality=char_data.get("personality", ""),
                    role=char_data.get("role", "角色")
                ))
            
            if existing_characters:
                existing_names = {c.name for c in existing_characters}
                for char in characters:
                    if char.name not in existing_names:
                        existing_characters.append(char)
                return {
                    "characters": existing_characters,
                    "actions": data.get("actions", [])
                }
            
            return {
                "characters": characters,
                "actions": data.get("actions", [])
            }
            
        except Exception as e:
            print(f"AI 提取角色和操作失败: {e}")
            return {
                "characters": existing_characters or [],
                "actions": []
            }
