import sys
sys.path.insert(0, 'venv/Lib/site-packages')

from character_analyzer import CharacterAnalyzer

script = "张三：我们终于到达了这个神秘的小镇。\n李四：这里看起来很安静，大家都去哪了？\n张三：别担心，我们一定会找到答案的。"

analyzer = CharacterAnalyzer()
dialogues = analyzer.analyze_dialogue(script)

print("提取的对话:")
for d in dialogues:
    print(f"  {d['character']}: {d['content']}")
