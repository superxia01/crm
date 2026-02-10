# 本地开发（方法 A：复用线上 Token + 服务器数据库）

本地跑前端 + 后端，用线上微信登录拿到的 Token，数据库通过 SSH 隧道连服务器。

## 1. SSH 隧道（连服务器数据库）

在**单独一个终端**里保持运行：

```bash
ssh -L 5432:localhost:5432 shanghai-tencent
```

不要关这个终端。这样本机 `localhost:5432` 会转发到服务器上的 PostgreSQL。

## 2. 后端配置与启动

```bash
cd backend
cp .env.example .env
# 如需可改：SERVER_PORT=8080  SERVER_ENV=development
# DB_* 保持用示例里的（隧道下 DB_HOST=localhost 即可）
go run cmd/server/main.go
```

后端默认监听 `http://localhost:8080`。

## 3. 前端启动

```bash
cd frontend
npm install   # 首次
npm run dev
```

前端会读 `frontend/.env.development`，请求发往 `http://localhost:8080/api/v1`。

## 4. 使用线上 Token 登录本地

1. 浏览器打开 **https://crm.crazyaigc.com**，用微信登录一次。
2. 打开开发者工具 → **Application** → **Local Storage** → 选 `https://crm.crazyaigc.com`。
3. 复制 `nextcrm_token` 的值。
4. 打开本地前端（如 http://localhost:5173），F12 → **Console** 执行：

   ```js
   localStorage.setItem('nextcrm_token', '这里粘贴复制的 token')
   location.reload()
   ```

之后本地请求会带该 Token 访问本地后端，后端会向 auth-center 校验，通过即可正常用；数据库走隧道，即服务器上的数据。

## 5. 可选：同步用户信息到本地 Storage

若需要本地也显示用户信息，可在 Console 再执行（把下面替换成你从线上拿到的 `nextcrm_user` 内容）：

```js
localStorage.setItem('nextcrm_user', JSON.stringify({ id: '1', userId: 'xxx', nickname: '你的昵称', email: '', phoneNumber: '', avatarUrl: '', createdAt: '', lastLoginAt: '' }))
```

---

**注意**：Token 有过期时间，过期后需重新在线上登录并再复制一次 `nextcrm_token` 到本地。
