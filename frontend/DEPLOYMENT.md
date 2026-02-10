# NextCRM 部署指南

## 本地开发

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
复制 `.env.example` 为 `.env.local`，并填入您的 API Key：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件：
```env
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_MODEL_ID=deepseek-v3-2-251201
```

### 3. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000

## 部署到 Vercel

### 方法一：通过 Vercel CLI（推荐）

1. 安装 Vercel CLI
```bash
npm install -g vercel
```

2. 登录 Vercel
```bash
vercel login
```

3. 部署
```bash
vercel
```

4. 设置环境变量
在 Vercel 控制台中添加环境变量：
- `DEEPSEEK_API_KEY`: 您的火山引擎 DeepSeek API Key（UUID 格式）
- `DEEPSEEK_MODEL_ID`: 模型 ID（例如：deepseek-v3-2-251201）

### 方法二：通过 Vercel Dashboard

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New Project"
3. 导入您的 Git 仓库
4. Vercel 会自动检测 Vite 配置
5. 在环境变量部分添加：
   - `DEEPSEEK_API_KEY`: 您的火山引擎 DeepSeek API Key（UUID 格式）
   - `DEEPSEEK_MODEL_ID`: 模型 ID（例如：deepseek-v3-2-251201）
6. 点击 "Deploy"

### 方法三：通过 Vercel GitHub 集成

1. 将代码推送到 GitHub
2. 在 Vercel Dashboard 中连接 GitHub
3. 选择 `nextCRM` 仓库
4. 配置环境变量
5. 部署

## 获取火山引擎 DeepSeek API 配置

### 获取 API Key

1. 访问 [火山引擎控制台](https://console.volcengine.com/ark)
2. 左侧菜单 → 「API Key 管理」
3. 点击「创建 API Key」
4. 复制生成的 API Key（UUID 格式，例如：06afb539-59bc-4899-bf1c-2b0818956319）

### 获取模型 ID

1. 在火山引擎控制台中，进入「模型推理」
2. 点击「创建推理接口」
3. 选择 DeepSeek 模型（例如：deepseek-v3-2-251201）
4. 创建后复制模型 ID

### 配置到环境变量

将获取的 API Key 和模型 ID 配置到环境变量中：
- `DEEPSEEK_API_KEY`: 您的 API Key
- `DEEPSEEK_MODEL_ID`: 模型 ID

## 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录中。

## 本地预览生产版本

```bash
npm run preview
```

## 重要提示

### 安全性说明

⚠️ **重要**：当前实现是在客户端直接调用 DeepSeek API。这种方式仅适用于演示和 MVP 阶段。

**生产环境建议**：
- 添加后端 API 代理（如 Vercel Serverless Functions）
- 在服务端调用 DeepSeek API
- 实现用户认证和授权
- 添加速率限制和请求验证

### 后端 API 代理示例（Vercel Serverless Functions）

创建 `api/chat.ts`：

```typescript
// api/chat.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'ep-20250129144532-m8q2n',
      messages,
      temperature: 0.7
    })
  });

  const data = await response.json();
  res.json(data);
}
```

然后在前端调用：
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages })
});
```

## 技术栈

- React 19.2.4
- TypeScript
- Vite 6.2.0
- React Router DOM 7.13.0
- Tailwind CSS
- Lucide React Icons
- 火山引擎 DeepSeek API

## 功能特性

- ✅ 客户管理（列表、新增、编辑）
- ✅ AI 话术助手
- ✅ 知识库管理
- ✅ 数据仪表盘
- ✅ 多语言支持（中英文）
- ✅ 主题切换（亮色/暗色）
- ✅ 响应式设计

## 常见问题

### Q: 为什么 API 调用失败？
A: 请检查：
1. API Key 是否正确配置
2. API Key 是否有足够的配额
3. 网络连接是否正常
4. 模型端点 ID 是否正确

### Q: 如何更改 DeepSeek 模型？
A: 在 `lib/api.ts` 中修改 `model` 参数，使用您的模型端点 ID。

### Q: 部署后无法访问？
A: 检查：
1. 构建是否成功
2. 环境变量是否正确配置
3. 路由配置是否正确

## License

MIT
