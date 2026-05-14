# 项目部署指南

## 📋 可移植性说明

### ✅ 可以直接复制的文件/文件夹
- `backend/` （除了 `venv_new/` 和 `venv_trae/`）
- `frontend/` （除了 `node_modules/`）
- `.env.example`
- `requirements.txt`
- `package.json`

### ❌ 不要复制的文件/文件夹
- `backend/venv_new/` - 虚拟环境，包含硬编码路径
- `backend/venv_trae/` - 虚拟环境，包含硬编码路径
- `frontend/node_modules/` - 依赖包，体积大
- `.env` - 包含你的 API Key，需要在新机器上重新配置

---

## 🚀 在新机器上部署步骤

### 1. 复制项目
复制以下内容到新机器：
```
muti-agent-system/
├── backend/          (除了 venv_new 和 venv_trae)
├── frontend/         (除了 node_modules)
├── .env.example
├── requirements.txt
├── package.json
└── README.md
```

### 2. 配置后端

#### 2.1 安装 Python 依赖
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

#### 2.2 配置环境变量
复制 `.env.example` 为 `.env`：
```bash
copy .env.example .env
```

编辑 `.env` 文件，填入你的 API Key：
```env
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=deepseek-chat
OPENAI_BASE_URL=https://api.deepseek.com/v1
```

#### 2.3 启动后端
```bash
python app.py
```

### 3. 配置前端

#### 3.1 安装 Node.js
下载并安装 Node.js: https://nodejs.org/

#### 3.2 安装前端依赖
```bash
cd frontend
npm install
```

#### 3.3 启动前端
```bash
npm run dev
```

---

## 📁 推荐的打包方式

### 方法 1：使用 Git（推荐）
```bash
# 在原机器上
git init
git add .
# 编辑 .gitignore，排除不需要的文件
git commit -m "Initial commit"
# 推送到 GitHub/GitLab

# 在新机器上
git clone <repository-url>
```

### 方法 2：压缩打包
```bash
# 创建压缩包时排除以下文件夹：
# - backend/venv_new
# - backend/venv_trae
# - frontend/node_modules
```

---

## ⚙️ .gitignore 参考

```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual Environment
venv/
venv_new/
venv_trae/
ENV/
env/

# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
```
