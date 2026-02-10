#!/bin/bash
# ============================================
# CRM 生产环境部署脚本
# ============================================
# 符合 KeenChase V4.0 部署规范
# 本地构建，上传产物，不在服务器构建

set -e  # 遇到错误立即退出

# ============================================
# 配置
# ============================================
SYSTEM_NAME="crm-backend"
BINARY_NAME="crm-api"
DOMAIN="crm.crazyaigc.com"
SERVER="shanghai-tencent"
REMOTE_DIR="/var/www/crm-backend"
FRONTEND_REMOTE_DIR="/var/www/crm-frontend"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================"
echo "🚀 开始部署 ${SYSTEM_NAME}..."
echo "================================"
echo ""

# ============================================
# 前端部署
# ============================================
echo -e "${GREEN}📦 [1/4] 部署前端...${NC}"

cd frontend

# 检查是否需要安装依赖
if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    npm install
fi

# 构建前端
echo "构建前端（生产环境）..."
npm run build

echo "上传前端到服务器..."
rsync -avz --delete \
  --exclude '*.map' \
  dist/ \
  ${SERVER}:${FRONTEND_REMOTE_DIR}/

echo -e "${GREEN}✅ 前端部署完成${NC}"
echo ""

# ============================================
# 后端部署
# ============================================
echo -e "${GREEN}📦 [2/4] 部署后端...${NC}"

cd ../backend

# 检查 Go 依赖
if [ ! -d "vendor" ]; then
    echo "下载 Go 依赖..."
    go mod download
fi

# 交叉编译（本地 Mac → Linux 服务器）
echo "交叉编译 Linux 二进制..."
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
  -o ${BINARY_NAME} \
  cmd/server/main.go

# 验证二进制文件
echo "验证二进制文件..."
file ${BINARY_NAME}

# 上传二进制（先传为 -new，再在服务器上替换）
echo "上传后端二进制到服务器..."
scp ${BINARY_NAME} ${SERVER}:${REMOTE_DIR}/${BINARY_NAME}-new

# 重启服务
echo "重启后端服务..."
ssh ${SERVER} << ENDSSH
cd ${REMOTE_DIR}

# 备份旧二进制
if [ -f ${BINARY_NAME} ]; then
    mv ${BINARY_NAME} ${BINARY_NAME}.backup.\$(date +%Y%m%d_%H%M%S)
fi

# 移动新二进制为当前
mv ${BINARY_NAME}-new ${BINARY_NAME}

# 重启服务
sudo systemctl restart ${SYSTEM_NAME}

# 等待启动
sleep 3

# 检查状态
sudo systemctl status ${SYSTEM_NAME} --no-pager
ENDSSH

echo -e "${GREEN}✅ 后端部署完成${NC}"
echo ""

# ============================================
# 数据库迁移检查
# ============================================
echo -e "${YELLOW}📦 [3/4] 检查数据库迁移...${NC}"

ssh ${SERVER} << ENDSSH
# 检查数据库是否存在
DB_EXISTS=\$(psql -h localhost -U nexus_user -lqt | cut -d \| -f 1 | grep -w crm_business_db | wc -l)

if [ "\$DB_EXISTS" -eq "0" ]; then
    echo -e "${YELLOW}⚠️  数据库 crm_business_db 不存在，请手动创建${NC}"
    echo "运行命令: psql -h localhost -U nexus_user -c \"CREATE DATABASE crm_business_db;\""
else
    echo -e "${GREEN}✅ 数据库已存在${NC}"
fi
ENDSSH

echo ""

# ============================================
# 验证部署
# ============================================
echo -e "${GREEN}🔍 [4/4] 验证部署...${NC}"

sleep 2

# 健康检查
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://${DOMAIN}/health || echo "000")

if [ "$HEALTH_CHECK" = "200" ]; then
    echo -e "${GREEN}✅ 健康检查通过 (HTTP 200)${NC}"
else
    echo -e "${RED}❌ 健康检查失败 (HTTP $HEALTH_CHECK)${NC}"
    echo "请检查服务日志: ssh ${SERVER} 'sudo journalctl -u ${SYSTEM_NAME} -f'"
fi

echo ""
echo "================================"
echo -e "${GREEN}🎉 部署完成！${NC}"
echo "================================"
echo ""
echo "📍 访问地址："
echo "  前端: https://${DOMAIN}"
echo "  后端: https://${DOMAIN}/api"
echo ""
echo "🔧 管理命令："
echo "  查看日志: ssh ${SERVER} 'sudo journalctl -u ${SYSTEM_NAME} -f'"
echo "  重启服务: ssh ${SERVER} 'sudo systemctl restart ${SYSTEM_NAME}'"
echo "  查看状态: ssh ${SERVER} 'sudo systemctl status ${SYSTEM_NAME}'"
echo ""
echo -e "${YELLOW}⚠️  环境变量未改变（如需修改请登录服务器）${NC}"
echo -e "${YELLOW}⚠️  如数据库不存在，请先创建数据库并运行迁移${NC}"
echo ""
