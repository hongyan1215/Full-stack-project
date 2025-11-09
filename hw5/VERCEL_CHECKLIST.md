# Vercel 部署检查清单

## ✅ 必须完成的配置步骤

### 1. Root Directory 设置 ⚠️ 最重要
- [ ] 前往：https://vercel.com/hongyans-projects-1dd0ea36/hw5/settings/general
- [ ] 找到 "Root Directory" 设置
- [ ] 点击 "Edit"
- [ ] **设置为：`hw5`**（不是 `hw5/`，也不是其他路径）
- [ ] 点击 "Save"

### 2. Framework Preset
- [ ] 在 General Settings 中
- [ ] Framework Preset 应该显示：**Next.js**
- [ ] 如果没有，手动选择 "Next.js"

### 3. Build & Development Settings
- [ ] Build Command: `yarn prisma:generate && yarn build`
- [ ] Output Directory: **留空**（Next.js 会自动处理）
- [ ] Install Command: `yarn install --frozen-lockfile`
- [ ] Development Command: 留空或 `yarn dev`

### 4. 环境变量配置
- [ ] 前往：https://vercel.com/hongyans-projects-1dd0ea36/hw5/settings/environment-variables
- [ ] 确保所有环境变量都已添加（参考 `env.example`）
- [ ] 特别检查：
  - [ ] `DATABASE_URL`
  - [ ] `NEXTAUTH_SECRET`
  - [ ] `NEXTAUTH_URL` (应该是：`https://hw5-bay.vercel.app`)
  - [ ] 所有 OAuth 配置
  - [ ] Pusher 配置
  - [ ] Cloudinary 配置

### 5. 重新部署
- [ ] 配置完成后，前往 Deployments 页面
- [ ] 点击最新的部署
- [ ] 点击 "Redeploy" 按钮
- [ ] 或者等待 Vercel 自动触发重新部署

## 🔍 验证部署

### 检查构建日志
1. 前往 Deployments 页面
2. 点击最新的部署
3. 查看 "Build Logs"
4. 应该看到：
   - ✅ "Installing dependencies..."
   - ✅ "Running prisma:generate..."
   - ✅ "Running build..."
   - ✅ "Build completed successfully"

### 检查部署状态
- [ ] 部署状态显示：● Ready（绿色）
- [ ] 构建时间应该 > 1 分钟（不是 170ms）
- [ ] 没有错误信息

### 测试访问
- [ ] 访问：https://hw5-bay.vercel.app
- [ ] 应该看到应用首页（不是 404）
- [ ] 检查浏览器控制台是否有错误

## 🚨 常见问题

### 问题 1: 构建时间太短（< 1 秒）
**原因**: Root Directory 未正确设置，Vercel 没有找到 Next.js 项目
**解决**: 检查 Root Directory 是否为 `hw5`

### 问题 2: 404 错误
**原因**: 
- Root Directory 未设置
- 构建失败
- 路由配置问题
**解决**: 
1. 确认 Root Directory 设置为 `hw5`
2. 检查构建日志
3. 重新部署

### 问题 3: 环境变量错误
**原因**: 环境变量未正确配置
**解决**: 
1. 检查所有环境变量是否已添加
2. 检查环境变量名称是否正确
3. 重新部署

### 问题 4: 构建失败
**原因**: 
- Prisma 生成失败
- 依赖安装失败
- TypeScript 错误
**解决**: 
1. 查看构建日志中的错误信息
2. 检查环境变量
3. 检查代码是否有错误

## 📞 需要帮助？

如果完成以上所有步骤后仍然遇到问题：
1. 检查构建日志中的详细错误信息
2. 确认 Root Directory 设置正确
3. 确认环境变量全部配置
4. 尝试手动触发重新部署

