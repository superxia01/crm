# NextCRM - AI 驱动的客户关系管理系统

<div align="center">
  <h3>🚀 智能 CRM 系统 | AI-Powered CRM Platform</h3>
  <p>基于火山引擎 DeepSeek 的智能销售辅助平台</p>
</div>

## ✨ 核心特性

- 🤖 **AI 智能分析** - 客户意向分析、风险评估、智能洞察
- 💬 **AI 话术助手** - 根据客户背景生成个性化销售话术
- 📚 **智能知识库** - AI 语义搜索、自动标签生成
- 📊 **数据仪表盘** - 销售漏斗、趋势分析、团队活动追踪
- 🌍 **多语言支持** - 完整的中英文双语界面
- 🎨 **主题切换** - 亮色/暗色主题自由切换
- 📱 **响应式设计** - 完美适配桌面和移动设备

## 🛠️ 技术栈

- **前端**: React 19.2.4 + TypeScript
- **构建工具**: Vite 6.2.0
- **路由**: React Router DOM 7.13.0
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **AI 引擎**: 火山引擎 DeepSeek API

## 🚀 快速开始

### 前置要求

- Node.js 18+
- npm 或 yarn 或 pnpm

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

在 `.env.local` 中配置您的火山引擎 DeepSeek API Key：

```env
DEEPSEEK_API_KEY=your_actual_api_key_here
```

### 获取 API Key

1. 访问 [火山引擎控制台](https://console.volcengine.com/ark)
2. 注册/登录账号
3. 创建 API Key
4. 将 API Key 填入 `.env.local`

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 📦 部署

### 部署到 Vercel（推荐）

#### 方法一：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
vercel
```

#### 方法二：通过 Vercel Dashboard

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New Project"
3. 导入您的 Git 仓库
4. 配置环境变量：
   - `DEEPSEEK_API_KEY`: 您的火山引擎 DeepSeek API Key
5. 点击 "Deploy"

#### 方法三：GitHub 集成

1. 将代码推送到 GitHub
2. 在 Vercel 中连接 GitHub 仓库
3. 配置环境变量
4. 自动部署

详细部署指南请查看 [DEPLOYMENT.md](DEPLOYMENT.md)

## 📁 项目结构

```
nextCRM/
├── components/          # 通用组件
│   ├── Layout.tsx      # 主布局
│   ├── UI.tsx          # UI 组件
│   └── FollowUpModal.tsx
├── pages/              # 页面组件
│   ├── dashboard/      # 仪表盘
│   ├── customers/      # 客户管理
│   ├── scripts/        # 话术助手
│   └── knowledge/      # 知识库
├── lib/                # 工具库
│   ├── api.ts          # DeepSeek API 封装
│   ├── mockData.ts     # Mock 数据
│   └── translations.ts # 国际化
├── App.tsx             # 主应用
├── types.ts            # 类型定义
└── contexts.tsx        # React Context
```

## 🎯 主要功能

### 1. 客户管理
- **多视图展示** - 表格视图和看板视图，灵活切换
- **销售漏斗管理** - 5个阶段可视化（线索→验证中→方案→谈判→赢单）
- **合同管理** - 合同金额、成交概率、预计成交日期、合同状态
- **智能录入** - 表单/AI对话/语音/名片识别四种方式
- **客户分析** - AI 意向分析和风险评估
- **跟进记录** - 完整的交互历史和待办事项

### 2. AI 话术助手
- 个性化话术生成
- 客户关注点分析
- 话术模板推荐
- 自定义话术生成

### 3. 智能知识库
- 文档上传和管理
- AI 语义搜索
- 自动标签生成
- 文档分类

### 4. 数据仪表盘
- **销售概览** - 潜在客户数、管道价值、赢单率、平均客单价
- **收入 vs 目标** - 双线图表对比实际收入与目标
- **销售漏斗** - 可视化各阶段转化情况（带颜色编码）
- **AI 风险监测** - 智能识别管道风险并提供建议
- **顶级交易** - 展示高价值商机列表
- **实时动态** - 团队活动时间线

## 🔧 构建生产版本

```bash
npm run build
```

预览生产版本：

```bash
npm run preview
```

## 📝 环境变量

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `DEEPSEEK_API_KEY` | 火山引擎 DeepSeek API Key | ✅ 是 |
| `VOLCENGINE_API_KEY` | 火山引擎 API Key（备选） | ❌ 否 |

## ⚠️ 安全提示

当前版本在客户端直接调用 DeepSeek API，**仅适用于演示和 MVP 阶段**。

生产环境建议：
- ✅ 添加后端 API 代理
- ✅ 实现用户认证
- ✅ 添加速率限制
- ✅ 服务端调用 AI API

详细说明请查看 [DEPLOYMENT.md](DEPLOYMENT.md)

## 📄 License

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题，请通过以下方式联系：
- 提交 GitHub Issue
- 发送邮件至项目维护者

---

<div align="center">
  <p>Made with ❤️ using React + Vite + DeepSeek</p>
</div>
