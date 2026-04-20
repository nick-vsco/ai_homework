import sys
sys.path.insert(0, 'venv/Lib/site-packages')

import asyncio
from models import Character
from agent import AgentOrchestrator

async def test():
    chars = [Character(id='c1', name='张三', description='test', personality='test', role='test')]
    orch = AgentOrchestrator(chars)
    print('AgentOrchestrator created')
    print('Agents:', list(orch.agents.keys()))
    
    script = "张三：测试"
    messages = await orch.process_scene(script, max_turns=1)
    print('Messages count:', len(messages))
    for msg in messages:
        print(f'  {msg.character_name}: {msg.content}')

asyncio.run(test())
