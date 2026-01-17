# Google OAuth 2FA 驗證問題修復指南

## 問題描述
部署在 Vercel 上的 Google OAuth 出現問題，後台顯示需要 2FA（雙因素認證）驗證。

## 可能的原因

1. **Google OAuth Consent Screen 未驗證**：應用程式處於「測試」模式，需要驗證或發布
2. **缺少測試用戶**：未將 Vercel 部署域名添加到授權域名列表
3. **OAuth 應用程式需要重新配置**：Google Cloud Console 中的設定需要更新

## 解決步驟

### 步驟 1: 檢查 Google Cloud Console 設定

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇你的專案
3. 導航到 **APIs & Services** > **OAuth consent screen**

### 步驟 2: 配置 OAuth Consent Screen

#### 2.1 基本資訊
- **User Type**: 
  - 如果只是個人使用或內部測試，選擇 **Internal**（需要 Google Workspace）
  - 如果是公開應用，選擇 **External**（需要驗證）

#### 2.2 應用程式資訊
- **App name**: 你的應用名稱（例如：自律軌跡）
- **User support email**: 你的電子郵件
- **App logo**: （可選）上傳應用圖標
- **Application home page**: 你的 Vercel 部署 URL（例如：`https://your-app.vercel.app`）
- **Application privacy policy link**: （可選）隱私政策 URL
- **Application terms of service link**: （可選）服務條款 URL
- **Authorized domains**: 
  - 添加 `vercel.app`
  - 添加你的自定義域名（如果有）

#### 2.3 Scopes（權限範圍）
確保已添加以下 scope：
- `openid`
- `email`
- `profile`
- `https://www.googleapis.com/auth/calendar.readonly`

#### 2.4 測試用戶（如果應用程式處於測試模式）
- 添加所有需要使用此應用程式的 Google 帳號電子郵件
- 包括你自己的帳號和任何測試帳號

### 步驟 3: 檢查 OAuth 2.0 客戶端 ID

1. 導航到 **APIs & Services** > **Credentials**
2. 找到你的 **OAuth 2.0 Client ID**
3. 點擊編輯，檢查以下設定：

#### 3.1 已授權的 JavaScript 來源
添加以下 URL：
```
https://your-app.vercel.app
https://your-custom-domain.com（如果有）
```

#### 3.2 已授權的重新導向 URI
添加以下 URL：
```
https://your-app.vercel.app/api/auth/callback/google
https://your-custom-domain.com/api/auth/callback/google（如果有）
```

### 步驟 4: 發布應用程式（如果需要）

如果應用程式處於「測試」模式且需要公開使用：

1. 在 **OAuth consent screen** 頁面
2. 點擊 **PUBLISH APP** 按鈕
3. 填寫必要的資訊
4. 提交審核（可能需要幾天時間）

**注意**：如果只是個人使用或內部測試，可以保持在「測試」模式，但需要添加所有測試用戶。

### 步驟 5: 更新 Vercel 環境變數

確保 Vercel 專案中的環境變數已正確設置：

1. 前往 Vercel Dashboard
2. 選擇你的專案
3. 導航到 **Settings** > **Environment Variables**
4. 確認以下變數已設置：
   - `GOOGLE_CLIENT_ID`: 你的 OAuth 2.0 Client ID
   - `GOOGLE_CLIENT_SECRET`: 你的 OAuth 2.0 Client Secret
   - `NEXTAUTH_SECRET`: NextAuth 的密鑰（用於加密 session）
     - **重要**：必須設置，且長度至少 32 字符
     - 可以使用以下命令生成：`openssl rand -base64 32`
   - `NEXTAUTH_URL`: 你的 Vercel 部署 URL（例如：`https://your-app.vercel.app`）
     - **重要**：必須與實際部署 URL 完全匹配
     - 如果有多個環境（Production、Preview），需要為每個環境設置對應的 URL
   - `MONGODB_URI`: MongoDB 連接字符串

### 步驟 6: 重新部署

1. 在 Vercel Dashboard 中觸發重新部署
2. 或推送新的 commit 到 GitHub

### 步驟 7: 測試 OAuth 流程

1. 訪問你的 Vercel 部署 URL
2. 點擊「Sign in with Google」
3. 確認可以正常登入

## 常見錯誤和解決方案

### 錯誤 1: "redirect_uri_mismatch"
**原因**：重新導向 URI 不匹配

**解決方案**：
- 檢查 Vercel 部署 URL 是否正確添加到「已授權的重新導向 URI」
- 確保 URL 完全匹配（包括 `https://` 和路徑 `/api/auth/callback/google`）

### 錯誤 2: "access_denied"
**原因**：應用程式處於測試模式，且用戶未添加到測試用戶列表

**解決方案**：
- 在 OAuth consent screen 中添加該用戶的電子郵件到「測試用戶」列表
- 或發布應用程式（需要審核）

### 錯誤 3: "invalid_client"
**原因**：Client ID 或 Client Secret 錯誤

**解決方案**：
- 檢查 Vercel 環境變數中的 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET` 是否正確
- 確保沒有多餘的空格或換行符

### 錯誤 4: "unauthorized_client"
**原因**：應用程式未授權訪問請求的 scope

**解決方案**：
- 檢查 OAuth consent screen 中的 scopes 是否包含所需權限
- 確保已啟用 Google Calendar API

## 啟用 Google Calendar API

如果尚未啟用：

1. 前往 **APIs & Services** > **Library**
2. 搜索「Google Calendar API」
3. 點擊並啟用該 API

## 驗證清單

- [ ] OAuth consent screen 已正確配置
- [ ] 已添加所有必要的 scopes
- [ ] 已添加 Vercel 域名到授權域名
- [ ] 已添加重新導向 URI
- [ ] 測試用戶已添加（如果應用程式處於測試模式）
- [ ] Google Calendar API 已啟用
- [ ] Vercel 環境變數已正確設置
- [ ] 已重新部署應用程式

## 參考資源

- [Google OAuth 2.0 文檔](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth.js Google Provider 文檔](https://next-auth.js.org/providers/google)
- [Vercel 環境變數文檔](https://vercel.com/docs/concepts/projects/environment-variables)

## 需要幫助？

如果問題仍然存在，請檢查：
1. Vercel 部署日誌中的錯誤訊息
2. Google Cloud Console 中的 API 使用情況
3. 瀏覽器控制台中的錯誤訊息

