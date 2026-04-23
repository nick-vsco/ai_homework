import sys
sys.path.insert(0, 'venv/Lib/site-packages')

import requests
import json

# 测试剧本演绎 API
url = "http://localhost:5000/api/scene/direct"
data = {
    "script": "张三：我们终于到达了这个神秘的小镇。\n李四：这里看起来很安静，大家都去哪了？\n张三：别担心，我们一定会找到答案的。",
    "characters": [
        {
            "id": "char_1",
            "name": "张三",
            "description": "故事的主角，一个勇敢的冒险者",
            "personality": "勇敢、机智",
            "role": "主要角色"
        },
        {
            "id": "char_2",
            "name": "李四",
            "description": "张三的朋友，一个善良的商人",
            "personality": "善良、谨慎",
            "role": "次要角色"
        }
    ]
}

response = requests.post(url, json=data)
print("Status Code:", response.status_code)
print("Response:", json.dumps(response.json(), ensure_ascii=False, indent=2))
