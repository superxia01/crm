# CRM Business 服务器首次部署配置

**项目**: crm-business
**域名**: crm.crazyaigc.com
**服务器**: 上海腾讯云 (shanghai-tencent / 49.235.45.212)

---

## 📋 部署前检查清单

### ✅ 已完成
- [x] 项目已注册到 `keenchase-standards/skills/keenchase-deploy/references/projects.md`
- [x] Auth Center 白名单已添加
- [x] 本地环境变量配置已更新（.env.example）
- [x] 部署脚本已创建（deploy-production.sh）

### 🔄 待执行
- [ ] 服务器目录创建
- [ ] 环境变量配置
- [ ] 数据库创建和迁移
- [ ] Systemd 服务配置
- [ ] Nginx 配置
- [ ] SSL 证书申请
- [ ] 首次部署

---

## 🚀 服务器配置步骤

### Step 1: 创建目录

```bash
ssh shanghai-tencent << 'ENDSSH'
sudo mkdir -p /var/www/crm-backend
sudo mkdir -p /var/www/crm-frontend
sudo chown -R ubuntu:ubuntu /var/www/crm-*

echo "✅ 目录创建完成"
ls -la /var/www/ | grep crm
ENDSSH
```

---

### Step 2: 创建环境变量（首次手动配置）

```bash
ssh shanghai-tencent
```

```bash
# 创建后端环境变量
sudo tee /var/www/crm-backend/.env << 'EOF'
# ============================================
# 应用配置
# ============================================
APP_ENV=production
APP_PORT=8080
APP_NAME=CRM
APP_DEBUG=false

# ============================================
# 数据库配置（通过 SSH 隧道）
# ============================================
DB_HOST=localhost
DB_PORT=5432
DB_USER=nexus_user
DB_PASSWORD=hRJ9NSJApfeyFDraaDgkYowY
DB_NAME=crm_business_db
DB_SSLMODE=disable

# ============================================
# Auth Center 配置
# ============================================
AUTH_CENTER_URL=https://os.crazyaigc.com
AUTH_CENTER_CALLBACK_URL=https://crm.crazyaigc.com/api/v1/auth/callback

# ============================================
# 前端地址
# ============================================
FRONTEND_URL=https://crm.crazyaigc.com

# ============================================
# JWT 配置
# ============================================
# ⚠️ 生产环境密钥（请使用 openssl rand -base64 32 生成）
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRY_HOURS=24

# ============================================
# DeepSeek AI 配置（备用）
# ============================================
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_EMBEDDING_MODEL=deepseek-embedding

# ============================================
# VolcEngine Doubao 豆包多模态（主要 AI）
# ============================================
DOUBAO_API_KEY=your_doubao_api_key_here
DOUBAO_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
DOUBAO_MODEL=doubao-seed-1-8-251228
EOF

# 设置权限
sudo chmod 600 /var/www/crm-backend/.env
sudo chown ubuntu:ubuntu /var/www/crm-backend/.env

echo "✅ 环境变量创建完成"
```

---

### Step 3: 创建数据库

```bash
# 在上海服务器上执行
ssh shanghai-tencent

# 创建数据库
psql -h localhost -U nexus_user -c "CREATE DATABASE crm_business_db;"

echo "✅ 数据库创建完成"

# 验证数据库
psql -h localhost -U nexus_user -lqt | grep crm_business_db
```

---

### Step 4: 运行数据库迁移

```bash
# 从本地复制迁移文件到服务器
cd /Users/xia/Documents/GitHub/nextcrm-fullstack/backend

# 方法1: 通过 SCP 上传迁移文件
scp migrations/*.sql shanghai-tencent:/tmp/

# 方法2: 在服务器上直接执行（推荐）
ssh shanghai-tencent << 'ENDSSH'
# 假设迁移文件已在本地，通过管道执行
psql -h localhost -U nexus_user -d crm_business_db << 'SQLEOF'
-- 这里粘贴 000001_init_schema.up.sql 的内容
-- 或者从本地文件执行
SQLEOF
ENDSSH
```

**更简单的方法（从本地执行）**：

```bash
# 在本地执行迁移（通过 SSH 隧道）
cd backend

# 迁移 1: 初始化 Schema
psql -h localhost -U nexus_user -d crm_business_db -f migrations/000001_init_schema.up.sql

# 迁移 2: 添加 Auth Center 字段
psql -h localhost -U nexus_user -d crm_business_db -f migrations/000002_add_auth_center_fields.up.sql

echo "✅ 数据库迁移完成"
```

---

### Step 5: 创建 Systemd 服务

```bash
ssh shanghai-tencent << 'ENDSSH'
sudo tee /etc/systemd/system/crm-backend.service << 'EOF'
[Unit]
Description=CRM Backend API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/crm-backend
ExecStart=/var/www/crm-backend/crm-api
Restart=always
RestartSec=5
EnvironmentFile=/var/www/crm-backend/.env

# 日志配置
StandardOutput=journal
StandardError=journal
SyslogIdentifier=crm-backend

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Systemd 服务配置创建完成"

# 重载 systemd
sudo systemctl daemon-reload

# 启用服务（开机自启）
sudo systemctl enable crm-backend

echo "✅ 服务已设置为开机自启"
ENDSSH
```

---

### Step 6: 配置 Nginx

```bash
ssh shanghai-tencent << 'ENDSSH'
sudo tee /etc/nginx/sites-available/crm.crazyaigc.com << 'EOF'
# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name crm.crazyaigc.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    server_name crm.crazyaigc.com;

    # SSL 证书（稍后配置）
    ssl_certificate /etc/letsencrypt/live/crm.crazyaigc.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crm.crazyaigc.com/privkey.pem;

    # SSL 优化
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 前端静态文件
    location / {
        root /var/www/crm-frontend;
        try_files $uri $uri/ /index.html;
        index index.html;

        # 静态资源缓存（1年）
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # HTML 文件不缓存
        location ~* \.html$ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }

    # 后端 API
    location /api {
        rewrite ^/api/?(.*) /api/v1/$1 break;
        proxy_pass http://localhost:8080;

        # Proxy 头部
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 健康检查
    location /health {
        proxy_pass http://localhost:8080/health;
        access_log off;
    }

    # 安全头部
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

echo "✅ Nginx 配置文件创建完成"

# 创建符号链接
sudo ln -s /etc/nginx/sites-available/crm.crazyaigc.com /etc/nginx/sites-enabled/

# 测试 Nginx 配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx

echo "✅ Nginx 配置已重载"
ENDSSH
```

---

### Step 7: 申请 SSL 证书

```bash
ssh shanghai-tencent << 'ENDSSH'
# 申请 Let's Encrypt 证书
sudo certbot --nginx -d crm.crazyaigc.com --non-interactive --agree-tos --email admin@crazyaigc.com

echo "✅ SSL 证书申请完成"

# 验证证书
sudo certbot certificates

# 设置自动续期
sudo systemctl status certbot.timer
ENDSSH
```

**如果 Certbot 不可用**，手动配置：

```bash
# 停止 Nginx
sudo systemctl stop nginx

# 申请证书（仅验证）
sudo certbot certonly --standalone -d crm.crazyaigc.com

# 启动 Nginx
sudo systemctl start nginx
```

---

### Step 8: 首次部署

```bash
# 在本地项目根目录执行
cd /Users/xia/Documents/GitHub/nextcrm-fullstack

# 执行部署脚本
./deploy-production.sh
```

---

## 🔍 部署验证

### 1. 检查服务状态

```bash
ssh shanghai-tencent << 'ENDSSH'
# 检查后端服务
sudo systemctl status crm-backend

# 检查 Nginx
sudo systemctl status nginx

# 检查 SSH 隧道（数据库连接）
sudo systemctl status pg-tunnel
ENDSSH
```

### 2. 查看日志

```bash
# 后端日志
ssh shanghai-tencent "sudo journalctl -u crm-backend -f"

# Nginx 日志
ssh shanghai-tencent "sudo tail -f /var/log/nginx/access.log"
ssh shanghai-tencent "sudo tail -f /var/log/nginx/error.log"
```

### 3. 健康检查

```bash
# 本地执行
curl -I https://crm.crazyaigc.com/health

# 预期响应: HTTP 200
```

### 4. 测试访问

```bash
# 前端
open https://crm.crazyaigc.com

# 后端 API
curl https://crm.crazyaigc.com/api/v1/health
```

---

## 🧪 测试微信登录

1. 访问: https://crm.crazyaigc.com
2. 点击"微信登录"按钮
3. 扫码授权
4. 验证跳转回登录页面
5. 检查用户是否正确创建

```bash
# 检查数据库用户记录
ssh shanghai-tencent
psql -h localhost -U nexus_user -d crm_business_db -c "SELECT id, auth_center_user_id, nickname, created_at FROM users LIMIT 5;"
```

---

## 📊 部署后检查清单

- [ ] 前端可访问（https://crm.crazyaigc.com）
- [ ] 后端 API 正常（/health 返回 200）
- [ ] 微信登录流程正常
- [ ] 数据库连接正常（查看日志无错误）
- [ ] Systemd 服务开机自启已启用
- [ ] Nginx 配置正确且 SSL 有效
- [ ] 静态资源缓存生效
- [ ] 日志正常输出

---

## 🔧 常用管理命令

### 服务管理

```bash
# 重启后端
ssh shanghai-tencent "sudo systemctl restart crm-backend"

# 查看状态
ssh shanghai-tencent "sudo systemctl status crm-backend"

# 查看日志
ssh shanghai-tencent "sudo journalctl -u crm-backend -f"

# 重启 Nginx
ssh shanghai-tencent "sudo systemctl reload nginx"
```

### 数据库管理

```bash
# 连接数据库
ssh shanghai-tencent
psql -h localhost -U nexus_user -d crm_business_db

# 备份数据库
pg_dump -h localhost -U nexus_user crm_business_db > crm_backup_$(date +%Y%m%d).sql

# 恢复数据库
psql -h localhost -U nexus_user crm_business_db < crm_backup_20250207.sql
```

### 环境变量修改

```bash
ssh shanghai-tencent
sudo nano /var/www/crm-backend/.env
# 修改后重启服务
sudo systemctl restart crm-backend
```

---

## 🐛 故障排查

### 问题1: 服务无法启动

```bash
# 查看详细错误
ssh shanghai-tencent "sudo journalctl -u crm-backend -n 50"

# 常见原因：
# 1. 端口被占用 → lsof -i :8080
# 2. 环境变量错误 → cat /var/www/crm-backend/.env
# 3. 数据库连接失败 → 检查 pg-tunnel 状态
```

### 问题2: 数据库连接失败

```bash
# 检查 SSH 隧道
ssh shanghai-tencent "sudo systemctl status pg-tunnel"

# 如果隧道停止，启动它
ssh shanghai-tencent "sudo systemctl start pg-tunnel"

# 测试数据库连接
PGPASSWORD=hRJ9NSJApfeyFDraaDgkYowY psql -h localhost -U nexus_user -d crm_business_db -c 'SELECT 1;'
```

### 问题3: 前端 404

```bash
# 检查前端文件
ssh shanghai-tencent "ls -la /var/www/crm-frontend/"

# 检查 Nginx 配置
ssh shanghai-tencent "sudo nginx -t"

# 查看 Nginx 错误日志
ssh shanghai-tencent "sudo tail -f /var/log/nginx/error.log"
```

### 问题4: 微信登录失败

```bash
# 检查 Auth Center 白名单
# 访问: https://os.crazyaigc.com/admin

# 检查回调 URL 配置
ssh shanghai-tencent "grep AUTH_CENTER_CALLBACK_URL /var/www/crm-backend/.env"

# 查看后端日志
ssh shanghai-tencent "sudo journalctl -u crm-backend -f | grep -i auth"
```

---

## 📝 维护日志

### 2025-02-07 - 首次部署
- ✅ 服务器目录创建
- ✅ 环境变量配置
- ✅ 数据库创建和迁移
- ✅ Systemd 服务配置
- ✅ Nginx 配置
- ✅ SSL 证书申请
- ✅ 首次部署

---

**部署完成后，请更新此文档的维护日志！**
