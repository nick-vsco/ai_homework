from flask import Flask, jsonify, request
from flask_cors import CORS
from models import Character, Message
from character_analyzer import CharacterAnalyzer
from agent import AgentOrchestrator

app = Flask(__name__)
CORS(app)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

@app.route('/api/characters/extract', methods=['POST'])
def extract_characters():
    # 从请求中获取文本
    data = request.json
    text = data.get('text', '')
    
    # 使用 CharacterAnalyzer 从文本中提取角色
    analyzer = CharacterAnalyzer()
    characters = analyzer.extract_characters(text)
    
    # 将角色转换为字典列表
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
    
    # 返回角色列表
    return jsonify({
        'characters': characters_dict,
        'count': len(characters_dict)
    })

@app.route('/api/scene/direct', methods=['POST'])
def direct_scene():
    data = request.json
    script = data.get('script', '')
    characters_data = data.get('characters', [])
    
    # 创建角色对象列表
    characters = []
    for char_data in characters_data:
        characters.append(Character(**char_data))
    
    # 使用 AgentOrchestrator 处理剧本演绎请求
    orchestrator = AgentOrchestrator(characters)
    
    import asyncio
    messages = asyncio.run(orchestrator.process_scene(script))
    
    # 使用 DeepSeek 生成剧本标题
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
            # 去除可能的引号和修饰
            scene_title = scene_title.replace('"', '').replace('《', '').replace('》', '').replace('剧本标题：', '').replace('标题：', '')
            # 加上一个精致的装饰前缀
            scene_title = f"🎬 {scene_title}"
        except Exception as e:
            print(f"Error generating scene title: {e}")
            scene_title = "🎬 星空冒险" # 降级默认值
    
    # 将消息转换为字典列表
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
    
    # 返回演绎结果
    return jsonify({
        'messages': messages_dict,
        'count': len(messages_dict),
        'title': scene_title
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_input = data.get('message', '')
    character_name = data.get('character', '')
    characters_data = data.get('characters', [])
    
    # 创建角色对象列表
    characters = []
    for char_data in characters_data:
        characters.append(Character(**char_data))
    
    # 使用 AgentOrchestrator 处理聊天请求
    orchestrator = AgentOrchestrator(characters)
    
    import asyncio
    message = asyncio.run(orchestrator.interactive_session(user_input, character_name))
    
    # 将消息转换为字典
    message_dict = {
        'id': message.id,
        'character_id': message.character_id,
        'character_name': message.character_name,
        'content': message.content,
        'timestamp': message.timestamp.isoformat(),
        'emotion': message.emotion,
        'action': message.action
    }
    
    # 返回聊天回复
    return jsonify(message_dict)

import os

if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
