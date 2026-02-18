# 部署说明

本系统统一使用 **KeenChase 统一部署框架**进行部署。

📖 **完整部署文档**: [deployment-and-operations.md](../keenchase-standards/deployment-and-operations.md)

---

## 🚀 快速开始

### 使用 keenchase-deploy skill 部署

在项目根目录执行：
```bash
/keenchase-deploy
```

**自动化流程**：
1. ✅ 检测当前项目
2. ✅ 本地构建前端
3. ✅ 本地构建后端
4. ✅ 上传到服务器
5. ✅ 重启服务
6. ✅ 验证部署结果

---

## 📋 前置要求

### 1. SSH 配置

确保本地 SSH 配置正确：
```bash
# 文件: ~/.ssh/config
Host shanghai-tencent
    HostName 49.235.45.212
    User ubuntu
    IdentityFile ~/.ssh/xia_mac_shanghai_secure
```

参考：[ssh-setup.md](../keenchase-standards/ssh-setup.md)

### 2. 环境变量

**不要在项目根目录创建 `.env` 文件**（避免误提交到 Git）

环境变量在服务器上配置，首次部署由 skill 自动创建。

### 3. 目录结构

确保项目目录名正确：
```
/Users/xia/Documents/GitHub/edit   # ✅ 正确
/Users/xia/Documents/GitHub/pr      # ✅ 正确
/Users/xia/Documents/GitHub/quote  # ✅ 正确
/Users/xia/Documents/GitHub/pixel  # ✅ 正确
/Users/xia/Documents/GitHub/crm    # ✅ 正确
```

---

## 🔧 部署流程

### 方式 1: 使用 keenchase-deploy skill（推荐）

```bash
# 在项目根目录执行
/keenchase-deploy
```

**自动化完成**：
- ✅ 前端构建并上传
- ✅ 后端交叉编译并上传
- ✅ 重启服务
- ✅ 验证健康检查

### 方式 2: 手动部署（不推荐）

详见：[deployment-and-operations.md](../keenchase-standards/deployment-and-operations.md)

---

## 📊 部署配置

### 服务器信息

- **服务器**: shanghai-tencent (49.235.45.212)
- **用户**: ubuntu
- **后端目录**: `/var/www/{slug}`
- **前端目录**: `/var/www/{slug}-frontend`
- **服务名**: `{slug}`
- **端口**: 按规范分配（见下表）

### 数据库配置

- **主机**: localhost（通过 SSH 隧道）
- **端口**: 5432
- **用户**: nexus_user
- **数据库**: {slug}_db

---

## 🔍 故障排查

### 常见问题

**Q: 部署失败？**
A: 检查 SSH 连接：`ssh shanghai-tencent echo ok`
A: 检查项目目录名是否正确
A: 查看 skill 执行日志

**Q: 服务无法启动？**
A: 检查数据库连接：`ssh shanghai-tencent "sudo systemctl status {slug}"`
A: 查看服务日志：`ssh shanghai-tencent "sudo journalctl -u {slug} -n 50"`

**Q: 数据库连接失败？**
A: 检查 SSH 隧道：`ssh shanghai-tencent "sudo systemctl status pg-tunnel"`
A: 检查环境变量：`ssh shanghai-tencent "cat /var/www/{slug}/.env"`

---

## 📚 相关文档

- **[部署规范](../keenchase-standards/deployment-and-operations.md)** - 完整部署标准
- **[SSH 配置](../keenchase-standards/ssh-setup.md)** - 服务器连接配置
- **[数据库配置](../keenchase-standards/database-guide.md)** - 数据库使用说明
- **[安全规范](../keenchase-standards/security.md)** - 安全最佳实践

---

**⚠️ 重要提示**：
- 不要手动上传 `.env` 文件到服务器
- 不要在服务器上执行构建命令
- 所有部署统一使用 keenchase-deploy skill
