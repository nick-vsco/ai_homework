from flask import Flask, jsonify, request
from flask_cors import CORS
from models import Character, Message
from character_analyzer import CharacterAnalyzer
from agent import AgentOrchestrator, Agent

app = Flask(__name__)
CORS(app)

@app.route('/api/health', methods=['GET', 'POST'])
def health():
    if request.method == 'POST':
        return jsonify({
            'continuation': '测试响应：角色们继续对话，剧情发展中...'
        })
    return jsonify({'status': 'ok'})

@app.route('/api/generate_continuation', methods=['POST'])
def generate_continuation_simple():
    return jsonify({
        'continuation': '测试响应成功！'
    })

@app.route('/api/test', methods=['POST'])
def test():
    return jsonify({
        'continuation': '测试响应：角色们继续对话，剧情发展中...'
    })

@app.route('/api/characters/extract', methods=['POST'])
def extract_characters():
    data = request.json
    
    if data and data.get('type') == 'generate_continuation':
        return jsonify({
            'continuation': '测试响应：角色们继续对话，剧情发展中...'
        })
    
    text = data.get('text', '')
    analyzer = CharacterAnalyzer()
    result = analyzer.extract_characters(text)
    characters = result.get('characters', [])
    actions = result.get('actions', [])
    characters_dict = []
    for char in characters:
        characters_dict.append({
            'id': char.id,
            'name': char.name,
            'description': char.description,
            'personality': char.personality,
            'role': char.role,
            'status': char.status,
            'location': char.location,
            'emotions': char.emotions
        })
    return jsonify({
        'characters': characters_dict,
        'actions': actions,
        'count': len(characters_dict)
    })

@app.route('/api/scene/direct', methods=['POST'])
def direct_scene():
    data = request.json
    script = data.get('script', '')
    characters_data = data.get('characters', [])
    actions = data.get('actions', [])
    
    characters = []
    for char_data in characters_data:
        characters.append(Character(**char_data))
    
    orchestrator = AgentOrchestrator(characters)
    
    import asyncio
    messages = asyncio.run(orchestrator.process_scene(script, actions))
    
    scene_title = "未命名剧本"
    if script:
        try:
            from config import Config
            import openai
            client = openai.OpenAI(
                api_key=Config.OPENAI_API_KEY,
                base_url=Config.OPENAI_BASE_URL
            )
            response = client.chat.completions.create(
                model=Config.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "你是一个剧本分析专家。请根据提供的剧本内容，生成一个简短有力、具有吸引力的标题（不超过10个字）。只返回标题，不要有任何其他文字。"},
                    {"role": "user", "content": f"剧本内容：\n{script[:500]}"}
                ],
                max_tokens=20,
                temperature=0.7
            )
            scene_title = response.choices[0].message.content.strip()
            scene_title = scene_title.replace('"', '').replace('《', '').replace('》', '').replace('剧本标题：', '').replace('标题：', '')
            scene_title = f"🎬 {scene_title}"
        except Exception as e:
            print(f"Error generating scene title: {e}")
            scene_title = "🎬 星空冒险"
    
    messages_dict = []
    for msg in messages:
        messages_dict.append({
            'id': msg.id,
            'character_id': msg.character_id,
            'character_name': msg.character_name,
            'content': msg.content,
            'timestamp': msg.timestamp.isoformat(),
            'emotion': msg.emotion,
            'action': msg.action
        })
    
    return jsonify({
        'messages': messages_dict,
        'count': len(messages_dict),
        'title': scene_title
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    print(f"DEBUG: Received data: {data}")
    print(f"DEBUG: Type: {type(data)}")
    
    if data and isinstance(data, dict) and data.get('type') == 'generate_continuation':
        print(f"DEBUG: Found generate_continuation request")
        return generate_continuation(data)
    
    user_input = data.get('message', '')
    character_name = data.get('character', '')
    characters_data = data.get('characters', [])
    
    characters = []
    for char_data in characters_data:
        characters.append(Character(**char_data))
    
    orchestrator = AgentOrchestrator(characters)
    
    import asyncio
    message = asyncio.run(orchestrator.interactive_session(user_input, character_name))
    
    message_dict = {
        'id': message.id,
        'character_id': message.character_id,
        'character_name': message.character_name,
        'content': message.content,
        'timestamp': message.timestamp.isoformat(),
        'emotion': message.emotion,
        'action': message.action
    }
    
    return jsonify(message_dict)

def generate_continuation(data):
    """生成剧情延续的核心逻辑"""
    try:
        from config import Config
        import openai
        
        script = data.get('script', '')
        current_messages = data.get('current_messages', [])
        characters = data.get('characters', [])
        
        print(f"DEBUG: Config.OPENAI_API_KEY = {Config.OPENAI_API_KEY[:10]}...")
        print(f"DEBUG: Config.OPENAI_BASE_URL = {Config.OPENAI_BASE_URL}")
        print(f"DEBUG: Config.OPENAI_MODEL = {Config.OPENAI_MODEL}")
        
        client = openai.OpenAI(
            api_key=Config.OPENAI_API_KEY,
            base_url=Config.OPENAI_BASE_URL
        )
        
        characters_info = ""
        for char in characters:
            characters_info += f"- {char.get('name', '')}: {char.get('description', '')}, 性格：{char.get('personality', '')}\n"
        
        current_dialogue = ""
        for msg in current_messages:
            current_dialogue += f"{msg.get('character_name', '')}: {msg.get('content', '')}\n"
        
        prompt = f"""你是一个专业的编剧和剧情续写专家。请根据以下信息生成合理的剧情延续。

剧本原文：
{script}

当前对话内容：
{current_dialogue}

角色信息：
{characters_info}

请生成接下来的剧情发展，要求：
1. 剧情要合理，符合角色性格
2. 包含角色间的对话和互动
3. 格式为：角色名: 对话内容
4. 内容长度适中，约 300-500 字
5. 只返回剧情内容，不要有其他说明文字"""

        print("DEBUG: Calling DeepSeek API...")
        response = client.chat.completions.create(
            model=Config.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "你是一个专业的编剧和剧情续写专家。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=800
        )
        print("DEBUG: API call successful!")
        
        continuation = response.choices[0].message.content.strip()
        
        return jsonify({
            'continuation': continuation
        })
        
    except Exception as e:
        print(f"Error generating continuation: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'continuation': f'API调用失败：{str(e)}\n\n请检查：\n1. API Key是否有效\n2. 网络连接是否正常\n3. 账户是否有余额'
        })

@app.route('/api/agent/movement', methods=['POST'])
def agent_movement():
    data = request.json
    
    if data.get('type') == 'generate_continuation':
        return jsonify({
            'continuation': '测试响应：角色们继续对话，剧情发展中...'
        })
    
    character_data = data.get('character', {})
    context = data.get('context', {})
    
    character = Character(**character_data)
    agent = Agent(character)
    
    import asyncio
    movement = asyncio.run(agent.generate_movement(str(context)))
    
    return jsonify({
        'movement': {
            'dx': movement[0] if movement else 0.0,
            'dy': movement[1] if movement else 0.0
        }
    })

import os

if __name__ == '__main__':
    print("=== Starting server ===")
    print("Registered routes:")
    for rule in app.url_map.iter_rules():
        print(f"  {rule.rule} [{', '.join(rule.methods)}]")
    print("=====================")
    port = int(os.environ.get('FLASK_PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
