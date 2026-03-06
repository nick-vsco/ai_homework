import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'venv/Lib/site-packages'))

try:
    from flask import Flask, jsonify, request
    from flask_cors import CORS
    from dotenv import load_dotenv
    import os
    
    from config import Config
    from agent import Agent, AgentOrchestrator
    from models import Character, Scene, Message
    from character_analyzer import CharacterAnalyzer
    
    print("All imports successful!")
    
    load_dotenv()
    
    app = Flask(__name__)
    CORS(app)
    
    @app.route('/api/characters/extract', methods=['POST'])
    def extract_characters():
        """从文本中提取角色"""
        data = request.json
        text = data.get('text', '')
        
        print(f"Extracting characters from text: {text[:50]}...")
        
        analyzer = CharacterAnalyzer()
        characters = analyzer.extract_characters(text)
        
        print(f"Found {len(characters)} characters: {[c.name for c in characters]}")
        
        return jsonify({
            'characters': [c.dict() for c in characters],
            'count': len(characters)
        })
    
    if __name__ == '__main__':
        print("Starting Flask app...")
        app.run(
            host=Config.FLASK_HOST,
            port=Config.FLASK_PORT,
            debug=Config.DEBUG
        )

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
