# 本地測試指南

## ✅ 服務器狀態

開發服務器已成功啟動！應用程序現在運行在：
- **URL**: http://localhost:3000
- **狀態**: ✅ 運行中

## 🧪 測試步驟

### 1. 打開瀏覽器
訪問 http://localhost:3000

### 2. 檢查登入按鈕
你應該在日曆頂部（左上角）看到：
- **未登入時**: 
  - "Sign in with Google" 按鈕（藍色）
  - "Sign in with GitHub" 按鈕（深灰色）

- **登入中**: 
  - 顯示 "Loading..." 和旋轉圖標

- **已登入後**:
  - 用戶頭像（如果有的話）
  - 用戶名稱和電子郵件
  - "Sign Out" 按鈕（紅色）

### 3. 測試 Google 登入
1. 點擊 "Sign in with Google" 按鈕
2. 應該會重定向到 Google 登入頁面
3. 選擇或輸入 Google 帳號
4. 授權應用程式
5. 應該會重定向回 `http://localhost:3000`
6. 檢查是否顯示用戶資訊

### 4. 測試 GitHub 登入
1. 如果已登入，先點擊 "Sign Out"
2. 點擊 "Sign in with GitHub" 按鈕
3. 應該會重定向到 GitHub 登入頁面
4. 授權應用程式
5. 應該會重定向回 `http://localhost:3000`
6. 檢查是否顯示用戶資訊

### 5. 測試登出
1. 點擊 "Sign Out" 按鈕
2. 應該會登出並返回到未登入狀態
3. 登入按鈕應該重新顯示

## 🔍 檢查 API 端點

### NextAuth 配置檢查
```bash
curl http://localhost:3000/api/auth/providers
```
應該返回 JSON，顯示已配置的提供者（Google 和 GitHub）

### 檢查會話
訪問：http://localhost:3000/api/auth/session
- 未登入時應該返回：`{}`
- 已登入時應該返回用戶資訊

## ⚠️ 常見問題排查

### 1. 登入按鈕顯示 "Loading..." 一直轉
**原因**: NextAuth 無法連接到 MongoDB 或環境變數未正確設置

**解決方案**:
- 檢查 `.env.local` 文件是否存在
- 確認 `MONGODB_URI` 正確
- 確認 MongoDB Atlas IP 白名單包含你的本地 IP
- 檢查終端是否有錯誤訊息

### 2. OAuth 回調錯誤
**錯誤訊息**: "redirect_uri_mismatch"

**原因**: OAuth 提供者中設置的回調 URL 不匹配

**解決方案**:
- **Google**: 在 Google Cloud Console 中添加：
  - `http://localhost:3000/api/auth/callback/google`
- **GitHub**: 在 GitHub Developer Settings 中添加：
  - `http://localhost:3000/api/auth/callback/github`

### 3. MongoDB 連接錯誤
**錯誤訊息**: "MongoNetworkError" 或 "Authentication failed"

**解決方案**:
- 確認 MongoDB Atlas 用戶名和密碼正確
- 確認 IP 地址已加入白名單（添加 `0.0.0.0/0` 允許所有 IP，或添加你的本地 IP）
- 確認連接字符串格式正確

### 4. 環境變數未加載
**錯誤訊息**: "Please add your Mongo URI to .env.local"

**解決方案**:
- 確認 `.env.local` 文件在 `next-version` 目錄下
- 確認文件格式正確（沒有多餘的空格或引號）
- 重啟開發服務器

## 📝 檢查 MongoDB

### 查看用戶數據
登入成功後，可以在 MongoDB Atlas 中檢查：
1. 登入 MongoDB Atlas
2. 打開你的集群
3. 點擊 "Browse Collections"
4. 應該會看到以下集合：
   - `users` - 用戶資料
   - `accounts` - OAuth 帳號連結
   - `sessions` - 會話數據

### 預期數據結構

**users 集合**:
```json
{
  "_id": "...",
  "name": "Your Name",
  "email": "your.email@example.com",
  "image": "https://...",
  "emailVerified": null
}
```

**accounts 集合**:
```json
{
  "_id": "...",
  "userId": "...",
  "type": "oauth",
  "provider": "google" | "github",
  "providerAccountId": "...",
  "access_token": "...",
  "token_type": "Bearer",
  "scope": "..."
}
```

**sessions 集合**:
```json
{
  "_id": "...",
  "sessionToken": "...",
  "userId": "...",
  "expires": ISODate("...")
}
```

## 🛠️ 開發服務器命令

### 停止服務器
按 `Ctrl + C` 在終端中停止開發服務器

### 重啟服務器
```bash
cd next-version
npm run dev
```

### 查看日誌
服務器的所有日誌會顯示在終端中，包括：
- 編譯狀態
- 錯誤訊息
- API 請求日誌

## ✅ 測試檢查清單

- [ ] 服務器成功啟動（http://localhost:3000 可訪問）
- [ ] 登入按鈕顯示在頁面上
- [ ] 點擊 Google 登入可以重定向
- [ ] Google 登入成功並返回
- [ ] 用戶資訊顯示正確
- [ ] GitHub 登入可以正常工作
- [ ] 登出功能正常
- [ ] MongoDB 中有用戶數據
- [ ] 會話持久化（刷新頁面後仍保持登入狀態）

## 🎉 測試完成

如果所有檢查項目都通過，說明 NextAuth.js 認證系統已經成功配置並正常運行！

## 📚 相關文檔

- `QUICK_START.md` - 快速開始指南
- `ENV_SETUP.md` - 環境變數詳細設置
- `IMPLEMENTATION_GUIDE.md` - 完整實作指南


