# 🚀 nextCRM 部署指南

## 📋 部署架构

```
┌─────────────────┐
│   Vercel        │  ← 前端 (React 静态文件)
│   Frontend      │
└────────┬────────┘
         │ HTTPS API 请求
         ↓
┌─────────────────┐
│   腾讯云 CVM     │  ← 后端 (Go API 服务)
│   Backend       │     + PostgreSQL
└─────────────────┘
```

---

## 🎨 前端部署到 Vercel

### 步骤 1: 准备项目

```bash
cd frontend

# 1. 安装依赖
npm install

# 2. 本地构建测试
npm run build

# 3. 预览构建结果
npm run preview
```

### 步骤 2: 配置环境变量

在 Vercel 项目设置中添加环境变量：

```bash
VITE_API_URL=https://your-backend-domain.com/api/v1
```

**重要**: 将 `your-backend-domain.com` 替换为您的腾讯云服务器域名或 IP。

### 步骤 3: 部署到 Vercel

#### 方法 A: 通过 Vercel CLI

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录 Vercel
vercel login

# 3. 部署
vercel --prod
```

#### 方法 B: 通过 Vercel Dashboard

1. 访问 [vercel.com](https://vercel.com)
2. 导入 GitHub 仓库
3. 选择 `frontend` 目录作为根目录
4. 配置构建设置：
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 添加环境变量
6. 点击 "Deploy"

### 步骤 4: 配置自定义域名（可选）

在 Vercel 项目设置中：
1. 进入 "Settings" → "Domains"
2. 添加您的域名（例如：`crm.yourdomain.com`）
3. 按照提示配置 DNS 记录

---

## 🖥️ 后端部署到腾讯云

### 前置要求

- 腾讯云 CVM 服务器（推荐配置：2核4G以上）
- 服务器操作系统：Ubuntu 20.04 或 CentOS 7+
- 域名（可选，但推荐）

### 步骤 1: 安装 Go

```bash
# 下载 Go 1.21
wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz

# 解压
sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz

# 配置环境变量
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# 验证
go version
```

### 步骤 2: 安装 PostgreSQL + pgvector

```bash
# 安装 PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# 安装 pgvector
cd /tmp
git clone --branch v0.5.0 https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install

# 启动 PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 步骤 3: 配置数据库

```bash
# 切换到 postgres 用户
sudo -u postgres psql

-- 创建数据库和用户
CREATE DATABASE nextcrm;
CREATE USER nextcrm WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE nextcrm TO nextcrm;

-- 启用 pgvector 扩展
\c nextcrm;
CREATE EXTENSION vector;

-- 退出
\q
```

### 步骤 4: 部署后端代码

```bash
# 创建项目目录
sudo mkdir -p /opt/nextcrm
sudo chown $USER:$USER /opt/nextcrm
cd /opt/nextcrm

# 上传代码（选择一种方式）：

# 方式 1: Git 克隆
git clone https://github.com/xia/nextcrm.git .
cd backend

# 方式 2: 手动上传（使用 scp 或 SFTP）
# scp -r backend/* user@your-server:/opt/nextcrm/

# 安装依赖
go mod download

# 配置环境变量
cp .env.example .env
nano .env
```

编辑 `.env` 文件：

```bash
# 服务器配置
SERVER_PORT=8080
SERVER_ENV=production

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USER=nextcrm
DB_PASSWORD=your_strong_password
DB_NAME=nextcrm
DB_SSLMODE=disable

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRY_HOURS=24

# DeepSeek AI 配置
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

### 步骤 5: 运行数据库迁移

```bash
cd /opt/nextcrm/backend
psql -U nextcrm -d nextcrm -f migrations/000001_init_schema.up.sql
```

### 步骤 6: 测试运行

```bash
# 开发模式测试
go run cmd/server/main.go

# 如果一切正常，应该看到：
# [GIN-debug] Listening and serving HTTP on :8080
```

### 步骤 7: 创建 Systemd 服务

创建服务文件：`sudo nano /etc/systemd/system/nextcrm.service`

```ini
[Unit]
Description=nextCRM Backend Service
After=network.target postgresql.service

[Service]
Type=simple
User=your_username
WorkingDirectory=/opt/nextcrm/backend
ExecStart=/usr/local/go/bin/go run cmd/server/main.go
Restart=always
RestartSec=5
Environment="GIN_MODE=release"

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
# 重载 systemd
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start nextcrm

# 设置开机自启
sudo systemctl enable nextcrm

# 查看状态
sudo systemctl status nextcrm

# 查看日志
sudo journalctl -u nextcrm -f
```

---

## 🔧 配置 Nginx 反向代理（可选但推荐）

### 安装 Nginx

```bash
sudo apt install nginx
```

### 配置 Nginx

创建配置文件：`sudo nano /etc/nginx/sites-available/nextcrm`

```nginx
# 后端 API 代理
server {
    listen 80;
    server_name api.yourdomain.com;  # 替换为您的域名或 IP

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/nextcrm /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

---

## 🔐 配置 SSL 证书（使用 Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书（自动配置 Nginx）
sudo certbot --nginx -d api.yourdomain.com

# 证书会自动续期
sudo certbot renew --dry-run
```

---

## 🌐 配置 CORS（重要！）

由于前端在 Vercel，后端在腾讯云，必须配置 CORS。

### 后端 CORS 配置

检查 `backend/internal/api/middleware/cors.go` 确保包含 Vercel 域名：

```go
func CORS() gin.HandlerFunc {
    return func(c *gin.Context) {
        // 允许的源
        allowedOrigins := []string{
            "http://localhost:3000",           // 本地开发
            "https://your.vercel.app",        // Vercel 默认域名
            "https://crm.yourdomain.com",     // 自定义域名
        }

        origin := c.Request.Header.Get("Origin")
        if slices.Contains(allowedOrigins, origin) {
            c.Header("Access-Control-Allow-Origin", origin)
        }

        c.Header("Access-Control-Allow-Credentials", "true")
        c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
        c.Header("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }

        c.Next()
    }
}
```

---

## 📝 完整部署清单

### 前端（Vercel）

- [ ] GitHub 仓库包含前端代码
- [ ] Vercel 项目已创建
- [ ] 环境变量 `VITE_API_URL` 已配置
- [ ] 构建成功
- [ ] 自定义域名已配置（可选）
- [ ] 可以访问前端页面

### 后端（腾讯云）

- [ ] Go 1.21 已安装
- [ ] PostgreSQL + pgvector 已安装
- [ ] 数据库已创建并迁移
- [ ] `.env` 文件已正确配置
- [ ] 后端服务已启动
- [ ] Systemd 服务已配置
- [ ] Nginx 反向代理已配置（可选）
- [ ] SSL 证书已配置（推荐）
- [ ] 防火墙已开放 80、443 端口
- [ ] API 可以正常访问

### 联调测试

- [ ] 前端可以访问后端 API
- [ ] 用户注册/登录功能正常
- [ ] 客户管理功能正常
- [ ] AI 功能正常（DeepSeek API Key 已配置）
- [ ] 向量搜索功能正常

---

## 🔍 故障排查

### 问题 1: 前端无法连接后端

**检查**:
1. Vercel 环境变量 `VITE_API_URL` 是否正确
2. 后端 CORS 配置是否包含 Vercel 域名
3. 后端服务是否正在运行
4. 腾讯云安全组是否开放端口

**解决**:
```bash
# 查看后端日志
sudo journalctl -u nextcrm -f

# 检查端口是否开放
sudo ufw status
sudo netstat -tlnp | grep 8080
```

### 问题 2: CORS 错误

**症状**: 浏览器控制台显示 `CORS policy: No 'Access-Control-Allow-Origin' header`

**解决**:
1. 确认后端 `middleware/cors.go` 包含前端域名
2. 重启后端服务
```bash
sudo systemctl restart nextcrm
```

### 问题 3: 数据库连接失败

**检查**:
```bash
# 测试数据库连接
psql -U nextcrm -d nextcrm -h localhost

# 检查 PostgreSQL 状态
sudo systemctl status postgresql
```

### 问题 4: AI 功能不工作

**检查**:
1. `.env` 中的 `DEEPSEEK_API_KEY` 是否正确
2. API Key 是否有额度
3. 网络是否可以访问 DeepSeek API

---

## 📊 成本估算

### Vercel（前端）
- **Hobby 计划**: 免费
  - 100GB 带宽/月
  - 无限部署
  - 自动 HTTPS
- **Pro 计划**: $20/月
  - 1TB 带宽/月
  - 无限构建
  - 团队协作

### 腾讯云（后端）
- **CVM 服务器**:
  - 2核4G: 约 ¥100-200/月
  - 4核8G: 约 ¥300-500/月
- **带宽**:
  - 按使用量计费或包年包月
  - 建议 5Mbps 起步
- **域名**: 约 ¥50-100/年

### 总成本
- **最低配置**: 约 ¥150-300/月
- **推荐配置**: 约 ¥400-700/月

---

## ✅ 部署后验证

### 1. 健康检查

```bash
# 后端健康检查
curl https://api.yourdomain.com/health

# 预期响应
{"status":"ok"}
```

### 2. API 测试

```bash
# 测试注册 API
curl -X POST https://api.yourdomain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"test123"}'

# 预期响应
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGc...",
    "user": {...}
  }
}
```

### 3. 前端测试

1. 访问 Vercel 部署的前端 URL
2. 尝试注册新用户
3. 登录并创建客户
4. 测试 AI 功能
5. 测试知识库向量搜索

---

## 🎉 完成！

您的 nextCRM 现在已经完全部署：

- ✅ **前端**: Vercel CDN（全球加速）
- ✅ **后端**: 腾讯云 CVM（高可用）
- ✅ **数据库**: PostgreSQL + pgvector（向量搜索）
- ✅ **AI**: DeepSeek API（智能功能）

享受您的 CRM 系统吧！🚀
