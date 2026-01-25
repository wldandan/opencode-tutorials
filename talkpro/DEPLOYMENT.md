# 部署指南

本文档介绍如何将 TalkPro 部署到生产环境。

---

## 部署选项

### 选项 1: 本地部署（开发/测试）

适用场景：本地开发、内部测试

**步骤**:

1. 按照 README.md 启动服务
2. 仅在局域网内访问

**优点**: 简单、免费
**缺点**: 无法公开访问

---

### 选项 2: VPS 部署

适用场景：生产环境、公开访问

**推荐平台**:
- DigitalOcean
- Linode
- AWS Lightsail
- 阿里云 ECS

**服务器要求**:
- CPU: 2 核心以上
- 内存: 2GB 以上
- 存储: 20GB 以上
- 操作系统: Ubuntu 20.04+ / Debian 11+

#### 部署步骤

##### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Python 3.10+
sudo apt install python3.10 python3.10-venv python3-pip -y

# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# 安装 Nginx
sudo apt install nginx -y

# 安装 PM2 (进程管理器)
sudo npm install -g pm2
```

##### 2. 部署后端

```bash
# 克隆代码
git clone <repository-url>
cd talkpro/backend

# 创建虚拟环境
python3.10 -m venv .venv
source .venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
nano .env  # 填入生产环境配置

# 使用 Gunicorn 运行
pip install gunicorn
```

创建 `gunicorn_config.py`:

```python
import multiprocessing

bind = "127.0.0.1:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
```

使用 PM2 启动后端:

```bash
pm2 start gunicorn --name "talkpro-backend" -- \
  --config gunicorn_config.py \
  "app.main:app"
```

##### 3. 构建前端

```bash
cd frontend

# 安装依赖
npm install

# 构建生产版本
npm run build

# 使用 Serve 服务静态文件
sudo npm install -g serve
pm2 start "serve -s build -l 3000" --name "talkpro-frontend"
```

##### 4. 配置 Nginx

创建 `/etc/nginx/sites-available/talkpro`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 后端 WebSocket
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

启用配置:

```bash
sudo ln -s /etc/nginx/sites-available/talkpro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

##### 5. 配置 SSL (Let's Encrypt)

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

### 选项 3: Docker 部署

适用场景：容器化部署、Kubernetes

#### Dockerfile

**后端 Dockerfile** (`backend/Dockerfile`):

```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn", "app.main:app", "-b", "0.0.0.0:8000"]
```

**前端 Dockerfile** (`frontend/Dockerfile`):

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Docker Compose** (`docker-compose.yml`):

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

**运行**:

```bash
docker-compose up -d
```

---

### 选项 4: 云平台部署

#### Railway

**后端**:
1. 连接 GitHub 仓库
2. 选择 `backend` 目录
3. 配置环境变量（ANTHROPIC_API_KEY）
4. 部署

**前端**:
1. 构建 `npm run build`
2. 将 `build` 目录部署到 Vercel/Netlify

#### Render

**后端**: Web Service
**前端**: Static Site

---

## 环境变量配置

### 生产环境变量

```bash
# 后端 (.env)
ANTHROPIC_API_KEY=sk-ant-xxxxx
APP_NAME=TalkPro
DEBUG=False
```

### 安全注意事项

1. **永远不要提交 .env 文件到 Git**
2. **使用强密码和随机 API Keys**
3. **定期轮换 API Keys**
4. **启用 HTTPS**
5. **配置 CORS 白名单**
6. **设置速率限制**

---

## 监控和日志

### 后端监控

使用 PM2 监控:

```bash
pm2 monit
```

查看日志:

```bash
pm2 logs talkpro-backend
```

### 前端监控

使用浏览器开发者工具查看错误

---

## 性能优化

### 后端优化

1. **使用生产级 ASGI 服务器** (Gunicorn + Uvicorn)
2. **启用 Nginx 缓存**
3. **配置 CORS 白名单**
4. **启用 Gzip 压缩**

### 前端优化

1. **代码分割** (React.lazy)
2. **图片优化**
3. **CDN 加速**
4. **启用浏览器缓存**

---

## 备份策略

### 数据备份

```bash
# 备份 SQLite 数据库
cp talkpro.db talkpro.db.backup.$(date +%Y%m%d)
```

### 代码备份

使用 Git 版本控制

---

## 故障排查

### 常见问题

1. **WebSocket 连接失败**
   - 检查 Nginx 配置
   - 确认 proxy_set_header Upgrade 正确

2. **CORS 错误**
   - 检查后端 CORS 配置
   - 确认前端域名在白名单中

3. **502 Bad Gateway**
   - 检查后端服务是否运行
   - 查看 PM2 日志

4. **内存不足**
   - 减少 Worker 数量
   - 增加服务器内存

---

## 扩展性

### 水平扩展

- 使用 Nginx 负载均衡
- 部署多个后端实例
- 使用 Redis 共享会话

### 垂直扩展

- 增加服务器 CPU
- 增加服务器内存

---

*部署指南 v1.0 - 2026-01-25*
