# Vercel 環境變數檢查清單

## 必須設置的環境變數

### 1. Google OAuth
- [ ] `GOOGLE_CLIENT_ID` - Google Cloud Console 中的 OAuth 2.0 Client ID
- [ ] `GOOGLE_CLIENT_SECRET` - Google Cloud Console 中的 OAuth 2.0 Client Secret

### 2. NextAuth
- [ ] `NEXTAUTH_SECRET` - 用於加密 session 的密鑰（至少 32 字符）
  - 生成方式：`openssl rand -base64 32`
- [ ] `NEXTAUTH_URL` - 應用程式的完整 URL
  - Production: `https://your-app.vercel.app`
  - Preview: `https://your-app-git-branch.vercel.app`（自動設置）
  - Development: `http://localhost:3000`

### 3. MongoDB
- [ ] `MONGODB_URI` - MongoDB Atlas 連接字符串
  - 格式：`mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority`

### 4. GitHub OAuth（可選）
- [ ] `GITHUB_CLIENT_ID` - GitHub OAuth App Client ID
- [ ] `GITHUB_CLIENT_SECRET` - GitHub OAuth App Client Secret

### 5. PostHog（可選）
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` - PostHog Project API Key

## 在 Vercel 中設置環境變數

1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇你的專案
3. 點擊 **Settings** > **Environment Variables**
4. 添加每個變數，選擇適用的環境：
   - **Production**: 生產環境
   - **Preview**: 預覽環境（PR 部署）
   - **Development**: 本地開發（通常不需要）

## 重要提示

1. **NEXTAUTH_URL 必須正確**：
   - 必須與實際部署 URL 完全匹配
   - 不要包含尾隨斜線 `/`
   - 必須使用 `https://`（生產環境）

2. **NEXTAUTH_SECRET 必須設置**：
   - 如果未設置，NextAuth 會報錯
   - 每個環境應該使用不同的密鑰

3. **重新部署**：
   - 修改環境變數後，必須重新部署才能生效
   - 可以在 Vercel Dashboard 中手動觸發重新部署

## 驗證環境變數

部署後，可以通過以下方式驗證：

1. 檢查 Vercel 部署日誌，確認沒有環境變數相關錯誤
2. 訪問 `/api/auth/providers` 端點，確認 OAuth providers 已正確配置
3. 嘗試登入，確認 OAuth 流程正常工作

