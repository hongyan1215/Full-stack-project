# Vercel 部署配置指南

## 重要：Root Directory 配置

由于这是一个 monorepo 项目，GitHub 仓库 `wp1141` 包含多个子目录，`hw5` 是 Next.js 应用的目录。

### 必须配置的步骤：

1. **在 Vercel 项目设置中设置 Root Directory**
   - 前往 Vercel 项目设置：https://vercel.com/hongyans-projects-1dd0ea36/hw5/settings/general
   - 找到 "Root Directory" 设置
   - 点击 "Edit"
   - 设置为：`hw5`
   - 点击 "Save"

2. **Framework Preset**
   - 确保 Framework Preset 设置为：`Next.js`
   - 如果未自动检测，手动选择

3. **Build Command**
   - Build Command: `yarn prisma:generate && yarn build`
   - Install Command: `yarn install`
   - Output Directory: 留空（Next.js 会自动处理）

4. **环境变量配置**
   - 前往：https://vercel.com/hongyans-projects-1dd0ea36/hw5/settings/environment-variables
   - 添加所有必要的环境变量（参考 `env.example`）

5. **重新部署**
   - 配置完成后，Vercel 会自动触发重新部署
   - 或者手动前往 Deployments 页面触发重新部署

## 环境变量清单

确保以下环境变量都已配置：

### 数据库
- `DATABASE_URL`

### NextAuth
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (设置为部署 URL，例如：`https://hw5-bay.vercel.app`)

### OAuth 提供商
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_ID`
- `GITHUB_SECRET`
- `FACEBOOK_CLIENT_ID`
- `FACEBOOK_CLIENT_SECRET`

### Pusher
- `PUSHER_APP_ID`
- `PUSHER_KEY`
- `PUSHER_SECRET`
- `PUSHER_CLUSTER`
- `NEXT_PUBLIC_PUSHER_KEY`
- `NEXT_PUBLIC_PUSHER_CLUSTER`

### Cloudinary
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`

## 常见问题

### 404 错误
如果遇到 404 错误，检查：
1. Root Directory 是否设置为 `hw5`
2. Framework Preset 是否正确设置为 Next.js
3. 构建日志中是否有错误

### 构建失败
如果构建失败，检查：
1. 环境变量是否全部配置
2. Prisma 生成是否成功
3. 构建日志中的具体错误信息

### OAuth 回调错误
确保在 OAuth 提供商中配置了正确的回调 URL：
- Google: `https://your-domain.vercel.app/api/auth/callback/google`
- GitHub: `https://your-domain.vercel.app/api/auth/callback/github`
- Facebook: `https://your-domain.vercel.app/api/auth/callback/facebook`

## 部署后检查清单

- [ ] Root Directory 设置为 `hw5`
- [ ] 所有环境变量已配置
- [ ] OAuth 回调 URL 已更新
- [ ] 构建成功
- [ ] 应用可以正常访问
- [ ] 数据库连接正常
- [ ] OAuth 登录正常
- [ ] 实时功能（Pusher）正常

