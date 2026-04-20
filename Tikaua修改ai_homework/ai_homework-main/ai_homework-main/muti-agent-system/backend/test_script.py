import sys
sys.path.insert(0, 'venv/Lib/site-packages')

import asyncio
from models import Character
from character_analyzer import CharacterAnalyzer
from agent import AgentOrchestrator

async def test_script():
    # 创建角色
    characters = [
        Character(
            id="char_1",
            name="张三",
            description="故事的主角，一个勇敢的冒险者",
            personality="勇敢、机智",
            role="主要角色"
        ),
        Character(
            id="char_2",
            name="李四",
            description="张三的朋友，一个善良的商人",
            personality="善良、谨慎",
            role="次要角色"
        )
    ]
    
    # 创建剧本
    script = """张三：我们终于到达了这个神秘的小镇。
李四：这里看起来很安静，大家都去哪了？
张三：别担心，我们一定会找到答案的。"""
    
    # 分析剧本
    dialogues = CharacterAnalyzer().analyze_dialogue(script)
    print("提取的对话:")
    for d in dialogues:
        print(f"  {d['character']}: {d['content']}")
    
    # 编排器处理剧本
    orchestrator = AgentOrchestrator(characters)
    messages = await orchestrator.process_scene(script, max_turns=3)
    
    print("\n演绎结果:")
    for msg in messages:
        print(f"  {msg.character_name}: {msg.content}")

if __name__ == "__main__":
    asyncio.run(test_script())
