# Multi-Agent System

一个基于 Python Flask 和 React 的多智能体角色扮演系统，类似于"斯坦福小镇"。

## 项目结构

```
muti-agent-system/
├── backend/              # Python Flask 后端
│   ├── app.py           # Flask 应用主文件
│   ├── config.py        # 配置文件
│   ├── models.py        # 数据模型
│   ├── agent.py         # 智能体核心逻辑
│   ├── character_analyzer.py  # 角色分析器
│   ├── requirements.txt   # Python 依赖
│   └── .env.example     # 环境变量模板
├── frontend/            # React 前端
│   ├── src/
│   │   ├── App.jsx     # 主应用组件
│   │   ├── main.jsx    # 入口文件
│   │   └── index.css   # 样式文件
│   ├── package.json    # Node.js 依赖
│   ├── vite.config.js  # Vite 配置
│   └── tailwind.config.js  # Tailwind CSS 配置
└── README.md           # 项目说明
```

## 功能特性

- **角色识别**：从文本中自动提取角色信息
- **多智能体系统**：多个 AI 角色同时演绎
- **剧本演绎**：根据输入的剧本进行角色扮演
- **实时互动**：用户可以与智能体角色交互
- **可视化界面**：现代化的 Web UI
- **情绪系统**：智能体具有情绪状态变化

## 技术栈

### 后端
- Python 3.8+
- Flask 3.0
- OpenAI API (GPT-4)
- NLTK (自然语言处理)
- Pydantic (数据验证)

### 前端
- React 18
- Vite 5
- Tailwind CSS
- Axios (HTTP 客户端)
- Lucide React (图标库)

## 快速开始

### 1. 安装后端依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，添加你的 OpenAI API Key：

```env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4
```

### 3. 安装前端依赖

```bash
cd frontend
npm install
```

### 4. 运行项目

**启动后端服务：**

```bash
cd backend
python app.py
```

后端服务将在 `http://localhost:5000` 运行

**启动前端服务：**

```bash
cd frontend
npm run dev
```

前端服务将在 `http://localhost:3000` 运行

## 使用说明

1. **创建场景**
   - 在文本框中输入小说文本或剧本
   - 点击"提取角色"按钮
   - 系统会自动识别文本中的角色

2. **开始演绎**
   - 确认角色列表
   - 点击"开始演绎"按钮
   - 系统会根据剧本自动生成角色对话

3. **互动模式**
   - 在左侧选择角色
   - 在输入框中输入消息
   - 点击"发送"与角色互动

## 示例剧本

```
张三：你好，今天天气真好！
李四：是啊，适合出去散步。
张三：要不要去公园？
李四：好主意，我正好想呼吸新鲜空气。
```

## 配置说明

### 调整模型

在 `backend/.env` 中修改：

```env
OPENAI_MODEL=gpt-4  # 或 gpt-3.5-turbo
```

### 调整端口

在 `backend/.env` 中修改：

```env
FLASK_PORT=5000
```

前端端口在 `frontend/vite.config.js` 中修改。

## 开发说明

### 后端 API 端点

- `GET /api/health` - 健康检查
- `POST /api/characters/extract` - 提取角色
- `POST /api/scenes` - 创建场景
- `POST /api/scenes/<scene_id>/interact` - 互动对话
- `GET /api/scenes/<scene_id>/characters` - 获取角色
- `GET /api/scenes/<scene_id>/history` - 获取对话历史

### 前端开发

前端使用 Vite 开发服务器，支持热重载。

## 注意事项

1. 确保 OpenAI API Key 有效
2. 建议使用 GPT-4 获得最佳效果
3. 首次运行需要下载 NLTK 数据
4. 生产环境请修改 `.env` 中的 `FLASK_ENV=production`

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
