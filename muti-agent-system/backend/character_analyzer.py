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
    
    def extract_characters(self, text: str, existing_characters: List[Character] = None) -> List[Character]:
        """从文本中提取角色"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """你是一个角色提取助手。请从提供的文本中提取所有角色信息。

要求：
1. 仔细阅读文本，找出所有出现的角色
2. 角色可以是任何出现的人物，包括主角、配角等
3. 注意识别通过对话（如"小明说"）出现的角色
4. 注意识别通过指代词（如"他"、"她"、"他们"等）引用的角色
5. 每个角色需要有名称、描述、性格特点和角色类型

请以 JSON 格式返回，格式如下：
{
    "characters": [
        {
            "name": "角色名称",
            "description": "角色描述",
            "personality": "性格特点",
            "role": "角色类型"
        }
    ]
}"""
                    },
                    {
                        "role": "user",
                        "content": f"请从以下文本中提取所有角色信息：\n\n{text}"
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
            characters_data = json.loads(result)
            
            characters = []
            for i, char_data in enumerate(characters_data.get("characters", [])):
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
                return existing_characters
            
            return characters
            
        except Exception as e:
            print(f"AI 提取角色失败: {e}")
            return []
