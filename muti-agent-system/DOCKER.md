# Docker 部署指南

本项目已配置好 Docker 支持，可通过以下步骤快速部署。

## 前置要求

- 已安装 Docker 和 Docker Compose
- 拥有有效的 OpenAI/DeepSeek API Key

## 快速开始

### 1. 配置环境变量

复制环境变量模板并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 API Key：

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_MODEL=deepseek-chat
OPENAI_BASE_URL=https://api.deepseek.com/v1
```

### 2. 构建并启动容器

在项目根目录下运行：

```bash
docker-compose up -d --build
```

### 3. 访问应用

- 前端界面：http://localhost
- 后端 API：http://localhost:5001

## 常用命令

### 查看容器状态

```bash
docker-compose ps
```

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看后端日志
docker-compose logs -f backend

# 查看前端日志
docker-compose logs -f frontend
```

### 停止服务

```bash
docker-compose stop
```

### 启动服务

```bash
docker-compose start
```

### 重启服务

```bash
docker-compose restart
```

### 停止并删除容器

```bash
docker-compose down
```

### 停止并删除容器及镜像

```bash
docker-compose down --rmi all
```

## 端口说明

| 服务 | 主机端口 | 容器端口 | 说明 |
|------|----------|----------|------|
| 前端 | 80 | 80 | Nginx 托管的静态文件 |
| 后端 | 5001 | 5001 | Flask API 服务 |

## 项目结构

```
muti-agent-system/
├── backend/
│   ├── Dockerfile          # 后端 Docker 镜像配置
│   ├── requirements.txt    # Python 依赖
│   └── ...                 # 其他后端文件
├── frontend/
│   ├── Dockerfile          # 前端 Docker 镜像配置
│   ├── nginx.conf          # Nginx 配置
│   └── ...                 # 其他前端文件
├── docker-compose.yml      # Docker Compose 编排配置
├── .env.example            # 环境变量模板
├── .dockerignore           # Docker 忽略文件
└── DOCKER.md               # 本文档
```

## 故障排除

### 容器无法启动

1. 检查端口是否被占用
2. 查看日志：`docker-compose logs`

### API 调用失败

1. 确认 `.env` 文件中的 API Key 正确
2. 检查网络连接
3. 查看后端容器日志

### 前端无法访问后端

1. 确认两个容器都在运行
2. 检查 Nginx 配置是否正确
