import sys
sys.path.insert(0, 'venv/Lib/site-packages')

import requests
import json

# 测试角色提取 API
url = "http://localhost:5000/api/characters/extract"
data = {
    "text": "这是一个故事，主角是张三和李四。他们来到了一个小镇。"
}

response = requests.post(url, json=data)
print("Status Code:", response.status_code)
print("Response:", response.json())
