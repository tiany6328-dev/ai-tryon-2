# AI 虚拟试衣网站 MVP

这是一个使用 Next.js App Router + TypeScript + Tailwind CSS 开发的 AI 虚拟试衣 MVP。

功能包括：

- 上传用户人像照片
- 上传衣服图片
- 校验文件类型为 JPG / PNG / WebP
- 校验单张图片不超过 10MB
- 通过 `/api/upload` 上传到 Supabase Storage，获得 FASHN API 可以访问的图片 URL
- 通过 `/api/tryon` 在后端调用 FASHN API `tryon-v1.6`
- 前端展示 loading、错误信息和生成结果图片
- 支持部署到 Netlify

## 项目结构

```text
.
├─ app/
│  ├─ api/
│  │  ├─ tryon/route.ts
│  │  └─ upload/route.ts
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  └─ ImageUploader.tsx
├─ lib/
│  └─ validation.ts
├─ .env.example
├─ netlify.toml
├─ next.config.mjs
├─ package.json
├─ postcss.config.mjs
├─ tailwind.config.ts
└─ tsconfig.json
```

## 本地运行

### 1. 安装 Node.js

请安装 Node.js 18 或更高版本。部署到 Netlify 时，本项目使用 Node.js 20。

### 2. 安装依赖

```bash
npm install
```

### 3. 创建 `.env.local`

复制环境变量模板：

```bash
cp .env.example .env.local
```

Windows PowerShell 可以用：

```powershell
Copy-Item .env.example .env.local
```

然后填写真实值：

```env
FASHN_API_KEY=你的_FASHN_API_KEY
SUPABASE_URL=https://你的项目 ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=你的 Supabase service_role key
SUPABASE_STORAGE_BUCKET=tryon-images
```

注意：

- `FASHN_API_KEY` 只在服务端 `/api/tryon` 中使用，不能放到前端。
- `SUPABASE_SERVICE_ROLE_KEY` 权限很高，只能放在服务端环境变量，不能以 `NEXT_PUBLIC_` 开头。
- `SUPABASE_URL` 和 `SUPABASE_STORAGE_BUCKET` 也通过服务端接口读取，前端不会直接访问 Supabase。

### 4. 配置 Supabase Storage

1. 打开 Supabase 项目后台。
2. 进入 `Storage`。
3. 新建 bucket，例如 `tryon-images`。
4. 为了让 FASHN API 能直接读取图片，建议把 bucket 设置为 `Public`。
5. 如果你使用其他 bucket 名称，请同步修改 `.env.local` 里的 `SUPABASE_STORAGE_BUCKET`。

当前代码上传成功后会调用 Supabase 的 `getPublicUrl()` 返回图片 URL，因此 bucket 需要是公开可读的。

### 5. 启动开发服务器

```bash
npm run dev
```

打开：

```text
http://localhost:3000
```

### 6. 使用

上传一张人像照片和一张衣服图片，点击“开始试穿”。系统会先把图片上传到 Supabase Storage，再把两个公网图片 URL 发给 FASHN API 生成试衣图。

## Netlify 部署

项目已经包含 `netlify.toml`：

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"
```

Next.js App Router 和 `/api/*` 路由会由 Netlify 的 Next.js Runtime 自动适配为 Netlify Functions，不需要手写 Netlify Function。

### 在 Netlify 配置环境变量

不要把密钥写进 `netlify.toml` 或前端代码。请在 Netlify 后台配置：

1. 打开你的 Netlify Site。
2. 进入 `Site configuration`。
3. 进入 `Environment variables`。
4. 添加以下变量：

```env
FASHN_API_KEY=你的_FASHN_API_KEY
SUPABASE_URL=https://你的项目 ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=你的 Supabase service_role key
SUPABASE_STORAGE_BUCKET=tryon-images
```

保存后重新部署。

## 接口说明

### `/api/upload`

接收 `multipart/form-data`，字段名为 `file`。接口会在服务端校验文件并上传到 Supabase Storage。

返回：

```json
{
  "url": "https://..."
}
```

### `/api/tryon`

接收：

```json
{
  "modelImageUrl": "https://...",
  "garmentImageUrl": "https://..."
}
```

返回：

```json
{
  "resultUrl": "https://..."
}
```

## 参考

- FASHN TypeScript SDK: https://github.com/fashn-ai/fashn-typescript-sdk
- FASHN Next.js 示例项目: https://github.com/fashn-AI/tryon-nextjs-app
- Supabase Storage: https://supabase.com/docs/guides/storage
- Next.js on Netlify: https://docs.netlify.com/frameworks/next-js/overview/
