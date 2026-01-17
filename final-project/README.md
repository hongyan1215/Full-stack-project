# [114-1] Web Programming Final

## (Group 09) 自律軌跡

> 「記錄每一天，成就更好的自己」

---

### Demo 影片連結

[待補充]

### Deployed 連結

🔗 **線上版本**: [https://web-programming-final-psi.vercel.app/](https://web-programming-final-psi.vercel.app/)

---

## 專題概述

### 這個服務在做什麼？

「自律軌跡」是一個功能豐富的現代化行事曆應用程式，採用 Next.js 14、React 19 和 TypeScript 開發。本應用程式提供完整的行事曆管理功能，幫助用戶有效管理時間、追蹤日常活動，並透過 AI 助手簡化事件創建流程。

核心功能包括多視圖顯示（月/週/日）、事件管理、課表管理系統、AI 助手、Google Calendar 同步、日記與心情記錄等特色功能。其中，**課表管理系統**是本專題的核心差異化功能，讓學生用戶能夠輕鬆管理學期課表並自動生成重複事件。

### 主要特色

- **多視圖模式**：支援月視圖、週視圖、日視圖三種顯示模式
- **自定義時間格系統**：可創建和管理自定義時間格（如學校課表時間、工作時間等）
- **課表管理系統**：完整的課表模板編輯器，支援課程安排、日期範圍啟用等功能（本專題的核心差異化功能）
- **AI 助手**：整合 Gemini API，支援自然語言建立事件
- **Google Calendar 同步**：可從 Google Calendar 匯入事件
- **日記與心情記錄**：每日日記功能，記錄心情和想法
- **多主題支援**：多種視覺主題可選
- **事件分類與篩選**：支援多種事件分類和篩選功能
- **分享功能**：可生成分享連結分享行事曆
- **首次登入引導**：新用戶首次登入會顯示完整的功能引導
- **通知系統**：支援事件提醒通知

## 技術棧

### 前端框架
- **Next.js 14** (App Router)
- **React 19+** with TypeScript
- **CSS3** (Grid, Flexbox, Gradients, CSS Variables)

### 後端與資料庫
- **Next.js API Routes** (Server-side API)
- **MongoDB** (使用 MongoDB Atlas)
- **NextAuth.js v5** (身份驗證)

### 第三方服務與套件
- **Google OAuth** (Google 登入與 Calendar API)
- **GitHub OAuth** (GitHub 登入)
- **Gemini API** (AI 助手)
- **PostHog** (用戶行為追蹤，可選)
- **date-fns** (日期處理)
- **html2canvas & jsPDF** (PDF 匯出)

### 開發工具
- **TypeScript** (類型安全)
- **Yarn/NPM** (套件管理)

## 如何在 localhost 安裝與測試之詳細步驟

### 系統需求

- **Node.js**: v18 或更高版本
- **npm** 或 **yarn** 套件管理器
- **MongoDB Atlas 帳號**（免費帳號即可）
- **Google Cloud Console 帳號**（用於 Google OAuth，可選）
- **GitHub 帳號**（用於 GitHub OAuth，可選）

### 步驟 1: 複製專案

```bash
# 進入專案目錄
cd next-version
```

### 步驟 2: 安裝依賴

```bash
# 使用 yarn（推薦）
yarn install

# 或使用 npm
npm install
```

### 步驟 3: 設定 MongoDB 資料庫

#### 3.1 建立 MongoDB Atlas 集群

1. 前往 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 註冊/登入帳號
3. 建立新的免費集群（Free Tier）
4. 選擇地區（建議選擇離你最近的區域）

#### 3.2 設定資料庫使用者

1. 在 MongoDB Atlas 控制台中，點擊 **Database Access**
2. 點擊 **Add New Database User**
3. 設定使用者名稱和密碼（請記住這些資訊，稍後會用到）
4. 設定權限為 **Atlas Admin** 或 **Read and write to any database**
5. 點擊 **Add User**

#### 3.3 設定 IP 白名單

1. 在 MongoDB Atlas 控制台中，點擊 **Network Access**
2. 點擊 **Add IP Address**
3. 對於本地開發，有兩個選項：
   - **選項 A**：添加 `0.0.0.0/0`（允許所有 IP，方便但較不安全，僅建議用於開發）
   - **選項 B**：添加你的本地 IP 地址（更安全）
4. 點擊 **Confirm**

#### 3.4 取得連接字串

1. 在 MongoDB Atlas 控制台中，點擊 **Database**
2. 點擊你的集群旁的 **Connect** 按鈕
3. 選擇 **Connect your application**
4. 複製連接字串，格式如下：
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. 將 `<username>` 和 `<password>` 替換為你在步驟 3.2 建立的資料庫使用者名稱和密碼
6. 在連接字串末尾添加資料庫名稱，修改為：
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/calendar-app?retryWrites=true&w=majority
   ```
   注意：`calendar-app` 是本應用程式使用的資料庫名稱

### 步驟 4: 設定 Google OAuth（可選但建議設定）

#### 4.1 建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用 **Google Calendar API**：
   - 前往 **APIs & Services** > **Library**
   - 搜尋 "Google Calendar API"
   - 點擊並啟用

#### 4.2 設定 OAuth Consent Screen

1. 前往 **APIs & Services** > **OAuth consent screen**
2. 選擇 **External**（除非你有 Google Workspace，可選擇 Internal）
3. 填寫應用程式資訊：
   - **App name**: 自律軌跡（或你喜歡的名稱）
   - **User support email**: 你的電子郵件
   - **Application home page**: `http://localhost:3000`
   - **Authorized domains**: 留空（本地開發不需要）
4. 點擊 **Save and Continue**
5. 在 **Scopes** 頁面，確認有以下 scopes：
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/calendar.readonly`
6. 點擊 **Save and Continue**
7. 在 **Test users** 頁面（如果應用程式在測試模式），添加你的 Google 帳號
8. 點擊 **Save and Continue**

#### 4.3 建立 OAuth 2.0 憑證

1. 前往 **APIs & Services** > **Credentials**
2. 點擊 **Create Credentials** > **OAuth client ID**
3. 選擇 **Web application**
4. 設定名稱（例如：自律軌跡 Local）
5. **Authorized JavaScript origins**：
   - 添加 `http://localhost:3000`
6. **Authorized redirect URIs**：
   - 添加 `http://localhost:3000/api/auth/callback/google`
7. 點擊 **Create**
8. 複製 **Client ID** 和 **Client Secret**（稍後會用到）

### 步驟 5: 設定 GitHub OAuth（可選）

#### 5.1 建立 GitHub OAuth App

1. 前往 [GitHub Developer Settings](https://github.com/settings/developers)
2. 點擊 **OAuth Apps** > **New OAuth App**
3. 填寫資訊：
   - **Application name**: 自律軌跡（或你喜歡的名稱）
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. 點擊 **Register application**
5. 複製 **Client ID**
6. 點擊 **Generate a new client secret** 並複製 **Client Secret**

### 步驟 6: 設定環境變數

在 `next-version` 目錄下建立 `.env.local` 檔案：

```bash
# MongoDB 連接字串（必須）
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/calendar-app?retryWrites=true&w=majority

# NextAuth 設定（必須）
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth（必須，如果使用 Google 登入）
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth（可選）
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Gemini API（必須，如果使用 AI 助手功能）
GEMINI_API_KEY=your-gemini-api-key

# PostHog（可選，用於用戶行為追蹤）
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
```

#### 6.1 生成 NEXTAUTH_SECRET

在終端執行以下指令生成安全的密鑰：

```bash
openssl rand -base64 32
```

將輸出的字串複製到 `.env.local` 的 `NEXTAUTH_SECRET`。

#### 6.2 取得 Gemini API Key

1. 前往 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登入你的 Google 帳號
3. 點擊 **Create API Key**
4. 複製 API Key 到 `.env.local` 的 `GEMINI_API_KEY`

### 步驟 7: 啟動開發伺服器

```bash
# 確保在 next-version 目錄下
cd next-version

# 使用 yarn（推薦）
yarn dev

# 或使用 npm
npm run dev
```

開發伺服器會在 `http://localhost:3000` 啟動。

### 步驟 8: 測試登入機制

#### 8.1 測試 Google 登入

1. 在瀏覽器中訪問 `http://localhost:3000`
2. 點擊 **Sign in with Google** 按鈕
3. 應該會重定向到 Google 登入頁面
4. 選擇你的 Google 帳號並授權
5. 應該會重定向回 `http://localhost:3000` 並顯示你的用戶資訊

#### 8.2 測試 GitHub 登入（如果已設定）

1. 如果已登入，先點擊 **Sign Out**
2. 點擊 **Sign in with GitHub** 按鈕
3. 應該會重定向到 GitHub 授權頁面
4. 授權應用程式
5. 應該會重定向回應用程式並顯示用戶資訊

#### 8.3 測試開發模式登入（僅開發環境）

在開發模式下，可以使用 Credentials Provider 登入：
- 使用者名稱：`dev`
- 密碼：任意（在開發模式下會自動通過）

**注意**：此功能僅在 `NODE_ENV=development` 或 `NEXT_PUBLIC_ENABLE_TEST_AUTH=true` 時可用。

### 步驟 9: 功能測試步驟

#### 9.1 基本導航測試

1. **切換視圖**：
   - 點擊右上角的 **月**、**週**、**日** 按鈕
   - 確認視圖正確切換

2. **日期導航**：
   - 使用 **<** 和 **>** 按鈕向前/向後導航
   - 確認日期正確更新

#### 9.2 事件管理測試

1. **建立事件**：
   - 點擊 **+ 新增事件** 按鈕
   - 或在週/日視圖中點擊時間格
   - 填寫事件標題、時間、分類、描述等資訊
   - 點擊 **儲存**
   - 確認事件出現在行事曆上

2. **編輯事件**：
   - 點擊已建立的事件
   - 修改資訊
   - 點擊 **儲存**
   - 確認變更已保存

3. **刪除事件**：
   - 點擊事件開啟編輯視窗
   - 點擊 **刪除** 按鈕
   - 確認事件已從行事曆移除

#### 9.3 分類管理測試

1. **查看分類**：
   - 點擊左側邊欄的 **篩選** 按鈕（如果有）
   - 查看可用的分類列表

2. **篩選事件**：
   - 切換不同分類的顯示/隱藏
   - 確認只有選中的分類事件顯示

#### 9.4 時間格管理測試

1. **切換時間格**：
   - 在週/日視圖中，使用時間格下拉選單
   - 選擇不同的時間格（學校課表、工作時間等）
   - 確認時間格正確顯示

2. **管理時間格**：
   - 點擊 **管理時間格** 按鈕
   - 建立新的時間格
   - 編輯現有時間格
   - 刪除時間格

#### 9.5 課表管理測試（核心功能）

1. **進入課表管理**：
   - 點擊左側邊欄的 **課表管理** 連結
   - 或訪問 `http://localhost:3000/schedule`

2. **建立課表**：
   - 點擊 **+ 新增課表**
   - 輸入課表名稱
   - 選擇時間格
   - 點擊 **編輯課表** 進入編輯器

3. **編輯課表**：
   - 在課表編輯器中，點擊時間格添加課程
   - 設定課程名稱、顏色、地點、備註
   - 點擊 **儲存**

4. **啟用課表**：
   - 在課表列表中，點擊 **啟用課表**
   - 選擇日期範圍
   - 確認課表事件已生成到行事曆

5. **停用課表**：
   - 點擊 **停用課表**
   - 確認課表事件已從行事曆移除

#### 9.6 Google Calendar 同步測試

1. **檢查 Google 帳號**：
   - 確認已使用 Google 帳號登入
   - 點擊 **同步 Google** 按鈕（如果顯示）

2. **同步事件**：
   - 點擊 **同步 Google** 按鈕
   - 確認 Google Calendar 事件已匯入
   - 檢查行事曆是否顯示匯入的事件

#### 9.7 AI 助手測試

1. **開啟 AI 助手**：
   - 點擊右下角的 AI 助手按鈕（浮動按鈕）

2. **建立事件**：
   - 輸入自然語言，例如："明天下午3點開會"
   - 確認 AI 理解並建立事件
   - 檢查事件是否正確出現在行事曆上

3. **測試提醒功能**：
   - 輸入："週三晚上健身，提前15分鐘提醒我"
   - 確認事件建立時包含提醒設定

#### 9.8 日記功能測試

1. **新增日記**：
   - 在月視圖中，點擊日期格子上的日記按鈕（📔 圖標）
   - 或點擊特定日期
   - 輸入日記內容
   - 選擇心情
   - 點擊 **儲存**

2. **查看日記**：
   - 點擊已有日記的日期
   - 確認日記內容顯示正確

#### 9.9 主題切換測試

1. **切換主題**：
   - 點擊右上角的 **主題** 按鈕
   - 選擇不同的主題
   - 確認視覺風格正確套用

#### 9.10 分享功能測試

1. **生成分享連結**：
   - 點擊右上角的 **分享** 按鈕
   - 選擇要分享的日期範圍
   - 點擊 **生成分享連結**
   - 複製分享連結

2. **查看分享連結**：
   - 在無痕視窗中打開分享連結
   - 確認分享的行事曆正確顯示

#### 9.11 首次登入引導測試

1. **清除引導狀態**（如需要）：
   - 在 MongoDB 中，將你的用戶的 `hasCompletedOnboarding` 設為 `false`
   - 或在登入後首次訪問時應該自動顯示

2. **測試引導流程**：
   - 確認引導視窗出現
   - 按照引導步驟操作
   - 確認每個步驟的高亮和說明正確

### 步驟 10: 常見問題排查

#### 問題 1: 無法連接到 MongoDB

**錯誤訊息**: `MongoNetworkError` 或 `Authentication failed`

**解決方案**:
1. 檢查 `.env.local` 中的 `MONGODB_URI` 是否正確
2. 確認 MongoDB Atlas IP 白名單包含你的 IP（或使用 `0.0.0.0/0` 允許所有 IP，僅開發環境）
3. 確認資料庫使用者名稱和密碼正確
4. 確認連接字串中包含資料庫名稱 `calendar-app`

#### 問題 2: OAuth 登入失敗

**錯誤訊息**: `redirect_uri_mismatch`

**解決方案**:
1. **Google OAuth**:
   - 確認 Google Cloud Console 中的 **Authorized redirect URIs** 包含 `http://localhost:3000/api/auth/callback/google`
   - 確認 **Authorized JavaScript origins** 包含 `http://localhost:3000`

2. **GitHub OAuth**:
   - 確認 GitHub OAuth App 的 **Authorization callback URL** 為 `http://localhost:3000/api/auth/callback/github`

#### 問題 3: 登入按鈕一直顯示 Loading

**解決方案**:
1. 檢查 `.env.local` 文件是否存在且格式正確
2. 確認 `NEXTAUTH_SECRET` 和 `NEXTAUTH_URL` 已設定
3. 確認 `MONGODB_URI` 正確且可連接
4. 檢查終端是否有錯誤訊息
5. 重啟開發伺服器

#### 問題 4: 環境變數未生效

**解決方案**:
1. 確認 `.env.local` 文件在 `next-version` 目錄下（不是專案根目錄）
2. 確認文件格式正確（沒有多餘的空格或引號）
3. 重啟開發伺服器（環境變數變更需要重啟才能生效）

#### 問題 5: AI 助手無法使用

**錯誤訊息**: AI 助手沒有回應或報錯

**解決方案**:
1. 確認 `.env.local` 中設定了 `GEMINI_API_KEY`
2. 確認 API Key 有效
3. 檢查終端是否有相關錯誤訊息
4. 確認網路連接正常（需要能訪問 Google API）

#### 問題 6: Google Calendar 同步失敗

**解決方案**:
1. 確認已使用 Google 帳號登入（不是 GitHub 或開發模式登入）
2. 確認 Google Cloud Console 中已啟用 **Google Calendar API**
3. 確認 OAuth Consent Screen 中包含 `https://www.googleapis.com/auth/calendar.readonly` scope
4. 檢查 MongoDB 中 `accounts` 集合是否有對應的 Google 帳號記錄且包含 `access_token`

#### 問題 7: 構建錯誤

**錯誤訊息**: TypeScript 類型錯誤或編譯錯誤

**解決方案**:
1. 確認所有依賴已正確安裝：`yarn install` 或 `npm install`
2. 檢查 TypeScript 版本是否相容
3. 清除 `.next` 目錄並重新構建：`rm -rf .next && yarn dev`

### 步驟 11: 驗證安裝成功

完成以上步驟後，你應該能夠：

- ✅ 成功啟動開發伺服器
- ✅ 使用 Google 或 GitHub 登入
- ✅ 建立、編輯、刪除事件
- ✅ 使用所有主要功能（課表管理、AI 助手、日記等）
- ✅ 在 MongoDB Atlas 中看到用戶資料和事件資料

## 功能說明與測試指南

### 核心功能列表

1. **多視圖顯示**
   - 月視圖：顯示整月事件概覽
   - 週視圖：顯示一週事件，支援自定義時間格
   - 日視圖：顯示單日詳細事件

2. **事件管理**
   - 建立、編輯、刪除事件
   - 事件分類（Activity、Deadline、Work、Life 等）
   - 事件顏色標記
   - 全天事件支援
   - 事件提醒通知

3. **課表管理系統**（核心差異化功能）
   - 建立多個課表模板
   - 使用自定義時間格
   - 課程模板編輯器
   - 日期範圍啟用/停用
   - 自動生成重複課表事件

4. **時間格管理**
   - 建立自定義時間格
   - 預設模板（學校課表、工作時間）
   - 時間段編輯
   - 休息時間管理

5. **AI 助手**
   - 自然語言建立事件
   - 智能分類識別
   - 提醒時間解析
   - 繁體中文支援

6. **Google Calendar 同步**
   - 從 Google Calendar 匯入事件
   - 單向同步（匯入）
   - 自動分類映射

7. **日記與心情記錄**
   - 每日日記功能
   - 心情選擇（開心、普通、難過等）
   - 日期範圍查詢

8. **事件分類與篩選**
   - 多種預設分類
   - 分類名稱自定義
   - 分類顯示/隱藏切換

9. **主題系統**
   - 多種視覺主題
   - 響應式設計
   - 自適應顏色方案

10. **分享功能**
    - 生成分享連結
    - 日期範圍選擇
    - 只讀分享視圖

11. **首次登入引導**
    - 互動式功能介紹
    - 步驟式引導
    - 自動視圖切換

## 使用/操作方式

### 伺服器端操作

#### 本地開發環境

1. **環境設定**
   ```bash
   cd next-version
   cp .env.example .env.local  # 複製環境變數範例檔案
   # 編輯 .env.local，填入必要的環境變數
   ```

2. **啟動開發伺服器**
   ```bash
   yarn install  # 安裝依賴
   yarn dev      # 啟動開發伺服器
   ```
   伺服器會在 `http://localhost:3000` 啟動

3. **生產環境構建**
   ```bash
   yarn build    # 構建生產版本
   yarn start    # 啟動生產伺服器
   ```

#### 雲端部署（Vercel）

本專題已部署於 Vercel，自動從 GitHub main 分支進行 CI/CD 部署。
- 部署連結：[https://web-programming-final-psi.vercel.app/](https://web-programming-final-psi.vercel.app/)
- 環境變數需在 Vercel Dashboard 中設定

### 使用者端操作

#### 登入方式

1. **Google 登入**（推薦）
   - 點擊「Sign in with Google」按鈕
   - 使用 Google 帳號授權登入
   - 登入後可使用 Google Calendar 同步功能

2. **GitHub 登入**
   - 點擊「Sign in with GitHub」按鈕
   - 使用 GitHub 帳號授權登入

#### 主要功能操作流程

1. **建立事件**
   - 方法一：點擊「+ 新增事件」按鈕
   - 方法二：在週/日視圖中直接點擊時間格
   - 方法三：使用 AI 助手（右下角浮動按鈕），輸入自然語言如「明天下午3點開會」

2. **管理課表**（核心功能）
   - 點擊左側「課表管理」進入課表頁面
   - 建立新課表 → 選擇時間格 → 點擊編輯器中的格子添加課程
   - 啟用課表：選擇日期範圍，系統會自動生成重複事件

3. **切換視圖**
   - 使用右上角的「月」「週」「日」按鈕切換視圖
   - 使用「<」「>」按鈕導航日期

4. **同步 Google Calendar**（僅 Google 登入用戶）
   - 點擊「同步 Google」按鈕
   - 系統會從 Google Calendar 匯入事件

5. **記錄日記**
   - 在月視圖中點擊日期格子上的日記圖標
   - 輸入日記內容並選擇心情

6. **分享行事曆**
   - 點擊右上角「分享」按鈕
   - 選擇日期範圍，生成分享連結

7. **切換主題**
   - 點擊右上角「主題」按鈕
   - 選擇喜歡的視覺主題

### 測試案例

#### 測試案例 1: 完整的課表管理流程

**目標**: 測試課表管理的完整流程

**步驟**:
1. 登入系統
2. 進入「課表管理」頁面
3. 建立新課表，名稱為「112-1 學期課表」
4. 選擇「學校課表」時間格
5. 進入編輯器，在週一 08:00-09:00 添加「資料結構」課程
6. 在週一 10:00-12:00 添加「網頁程式設計」課程
7. 完成其他天數的課程安排
8. 儲存課表
9. 啟用課表，選擇日期範圍為「2024-09-01 至 2024-12-31」
10. 返回主頁面，切換到週視圖，確認課表事件已生成
11. 切換到月視圖，確認事件顯示正確
12. 停用課表，確認事件已移除

**預期結果**:
- 課表成功建立和編輯
- 啟用後事件正確出現在行事曆上
- 停用後事件正確移除

#### 測試案例 2: AI 助手建立事件

**目標**: 測試 AI 助手理解自然語言並建立事件

**步驟**:
1. 點擊 AI 助手按鈕
2. 輸入：「明天下午3點開會」
3. 確認 AI 回覆並建立事件
4. 檢查事件是否出現在明天下午3點
5. 輸入：「週三晚上7點健身，提前15分鐘提醒我」
6. 確認事件建立並包含提醒設定

**預期結果**:
- AI 正確理解時間和事件內容
- 事件正確分類
- 提醒設定正確應用

#### 測試案例 3: Google Calendar 同步

**目標**: 測試從 Google Calendar 匯入事件

**前提**: 使用 Google 帳號登入，且 Google Calendar 中有事件

**步驟**:
1. 確認已使用 Google 帳號登入
2. 在 Google Calendar 中建立幾個測試事件
3. 返回應用程式，點擊「同步 Google」按鈕
4. 確認同步完成
5. 檢查行事曆是否顯示匯入的事件
6. 確認事件分類正確

**預期結果**:
- 同步成功執行
- Google Calendar 事件正確匯入
- 事件顯示在正確的時間和日期

## 每位組員之負責項目

### 組長 R13921A38 周秉頡

**負責項目**：

1. **原始 React 前端草稿實作**
   - 專案初始架構設計與規劃
   - 使用 React 開發第一版前端草稿
   - 基本行事曆功能實作（月/週/日視圖）
   - 前端組件結構設計
   - 基礎 UI/UX 設計

2. **Next.js 框架遷移**
   - 從原始 React 版本遷移到 Next.js 14
   - App Router 架構設計與實作
   - 組件結構重構與優化

3. **課表管理系統開發**（核心差異化功能）
   - 課表編輯器完整實作（前端 UI 與交互邏輯）
   - 課表模板編輯功能
   - 課表管理頁面 (`/schedule` 路由)
   - 課程添加、編輯、刪除功能
   - 課表啟用/停用功能
   - 日期範圍選擇與事件生成邏輯

4. **分類系統開發**
   - 8 個固定分類系統設計與實作
   - 分類遷移功能
   - 分類名稱自定義功能
   - 分類顯示/隱藏切換功能

5. **前端 UI/UX 設計與優化**
   - 響應式設計實作（適配不同螢幕尺寸）
   - CSS 樣式優化與修復
   - 窄視窗適配
   - Sticky Header 實作
   - 新布局行為設計

6. **用戶體驗優化**
   - 快捷鍵功能實作（Keybind）
   - 錯誤通知機制
   - 用戶交互流程優化

7. **用戶行為追蹤系統**
   - PostHog 用戶行為追蹤完整實作
   - Reverse Proxy 配置
   - 事件追蹤與分析

8. **構建與部署優化**
   - TypeScript 錯誤修復
   - Next.js 版本升級與 CVE 修復
   - 構建流程優化
   - 文檔維護

8. **前端組件開發**
   - 各種前端組件的開發與維護
   - 組件交互邏輯實作
   - 狀態管理優化

**貢獻說明**：
- 負責專案從零開始的前端草稿開發，使用 React 實作第一版原型
- 完成專案從 React 遷移到 Next.js 的完整工作，確保所有功能順利遷移
- 開發課表管理系統的核心前端功能，這是本專題最重要的差異化功能
- 實作分類系統，提供事件分類與篩選功能
- 專注於前端 UI/UX 設計，確保應用程式具有良好的用戶體驗
- 實作用戶行為追蹤系統，幫助理解用戶使用模式
- 負責前端邏輯與交互設計，與後端 API 協同工作完成功能

### 組員 R14922156 黃泓諺

**負責項目**：

1. **所有後端 API 開發與維護**
   - 設計並實作所有 Next.js API Routes
   - 事件管理 API (`/api/events`)
   - 課表管理 API (`/api/schedules`)
   - 分類管理 API (`/api/categories`)
   - 日記功能 API (`/api/diary`)
   - Google Calendar 同步 API (`/api/google-calendar`)
   - AI 助手 API (`/api/ai`)
   - 分享功能 API (`/api/calendar/share`)
   - 匯出功能 API (`/api/calendar/export`)
   - 用戶引導狀態 API (`/api/user/onboarding`)
   - 帳號管理 API (`/api/auth/ensure-account`)

2. **資料庫設計與 MongoDB 整合**
   - MongoDB 資料庫架構設計
   - NextAuth.js MongoDBAdapter 設定與配置
   - 資料模型設計與優化
   - 資料庫查詢優化
   - MongoDB Provider 資訊存儲機制

3. **身份驗證系統**
   - NextAuth.js 完整設定與整合
   - Google OAuth 整合
   - GitHub OAuth 整合
   - 開發模式認證（Credentials Provider）
   - Session 管理與 JWT Token 處理

4. **第三方服務整合**
   - Google Calendar API 整合與同步功能
   - Gemini API 整合（AI 助手自然語言處理）
   - PostHog 整合基礎架構（用戶行為追蹤）

5. **核心功能開發**
   - AI 助手功能完整實作（Gemini 2.5 Flash Lite 整合）
   - Google Calendar 同步功能
   - 日記與心情記錄功能（API 與資料庫設計）
   - 日曆分享功能（分享連結生成與訪問）
   - 首次登入引導系統（Onboarding Tour）

6. **主題系統**
   - 五種主題風格設計與實作
   - 主題切換功能
   - LoginButton 組件設計

7. **API 錯誤處理與安全性**
   - API 端點權限驗證
   - 錯誤處理機制
   - 資料驗證與安全性檢查

8. **部署與環境設定**
   - Vercel 部署配置
   - 環境變數管理與文檔
   - 生產環境優化

**貢獻說明**：
- 負責所有後端邏輯開發，確保 API 的穩定性和安全性
- 整合多個第三方服務（Google OAuth、Google Calendar API、Gemini API），實現複雜的功能需求
- 開發 AI 助手、Google Calendar 同步、日記、分享等核心功能
- 實作完整的身份驗證系統，支援多種登入方式
- 確保應用程式的可擴展性和維護性

## 專題延伸說明

本專題為全新開發的專題，並非之前作品或專題的延伸。所有功能均為本學期從零開始開發。

## 使用與參考之框架/模組/原始碼

### 前端框架
| 套件名稱 | 版本 | 用途說明 |
|---------|------|---------|
| Next.js | ^16.0.10 | React 全端框架，提供 App Router、API Routes、SSR/SSG 支援 |
| React | ^19.2.1 | 前端 UI 函式庫 |
| React DOM | ^19.2.1 | React DOM 渲染 |
| TypeScript | ^5.4.5 | 類型安全的 JavaScript 超集 |

### 後端與資料庫
| 套件名稱 | 版本 | 用途說明 |
|---------|------|---------|
| next-auth | ^5.0.0-beta.30 | 身份驗證解決方案（NextAuth.js v5） |
| @auth/mongodb-adapter | ^3.11.1 | NextAuth.js 的 MongoDB 適配器 |
| mongodb | ^6.0.0 | MongoDB Node.js 驅動程式 |

### 工具函式庫
| 套件名稱 | 版本 | 用途說明 |
|---------|------|---------|
| date-fns | ^4.1.0 | 日期處理函式庫 |
| clsx | ^2.1.1 | 條件式 className 組合工具 |
| html2canvas | ^1.4.1 | 將 DOM 元素轉換為 Canvas 圖片 |
| jspdf | ^3.0.4 | PDF 文件生成工具 |

### 第三方 API 整合
| 套件名稱 | 版本 | 用途說明 |
|---------|------|---------|
| googleapis | ^168.0.0 | Google API 客戶端（Calendar API） |
| posthog-js | ^1.309.1 | 用戶行為追蹤分析工具 |

## 使用之第三方套件、框架、程式碼

### 第三方服務

1. **Google Cloud Platform**
   - Google OAuth 2.0：用戶身份驗證
   - Google Calendar API：行事曆事件同步
   - 參考文檔：[Google Identity](https://developers.google.com/identity)

2. **GitHub OAuth**
   - 用戶身份驗證的替代方案
   - 參考文檔：[GitHub OAuth Apps](https://docs.github.com/en/apps/oauth-apps)

3. **Google Gemini API**
   - AI 助手的自然語言處理
   - 使用 Gemini 2.5 Flash Lite 模型
   - 參考文檔：[Google AI Studio](https://ai.google.dev/)

4. **MongoDB Atlas**
   - 雲端 NoSQL 資料庫服務
   - 存儲用戶資料、事件、課表、日記等
   - 參考文檔：[MongoDB Atlas](https://www.mongodb.com/atlas)

5. **PostHog**
   - 用戶行為追蹤與分析
   - 配置 Reverse Proxy 避免廣告攔截
   - 參考文檔：[PostHog Docs](https://posthog.com/docs)

6. **Vercel**
   - 前端部署與 CI/CD 平台
   - 自動從 GitHub 部署
   - 參考文檔：[Vercel Documentation](https://vercel.com/docs)

### 參考資源

- [Next.js Documentation](https://nextjs.org/docs) - Next.js 官方文檔
- [NextAuth.js Documentation](https://authjs.dev/) - 身份驗證文檔
- [date-fns Documentation](https://date-fns.org/docs/) - 日期處理文檔
- [Tailwind CSS](https://tailwindcss.com/) - 樣式參考（本專題使用純 CSS）

## 專題製作心得

### 組長 R13921A38 周秉頡

在這次專題開發過程中，我從零開始規劃並實作了整個前端架構。最初使用 React 開發第一版原型時，體驗到了快速迭代的樂趣，但也遇到了狀態管理和路由處理的挑戰。後來決定遷移到 Next.js，這個決定雖然需要重構大量程式碼，但帶來的 App Router、API Routes 和自動優化功能讓開發效率大幅提升。

課表管理系統是我最引以為傲的功能，它解決了學生族群管理重複課表的痛點。實作過程中，我學會了如何設計複雜的前端交互邏輯，以及如何將用戶體驗放在設計的核心。此外，整合 PostHog 進行用戶行為追蹤，讓我了解到數據驅動開發的重要性。

這次與夥伴的合作非常順利，前後端的分工明確，透過 GitHub 的協作流程，我們能夠高效地整合各自的功能。這次專題讓我深刻體會到團隊合作的價值，以及現代化前端開發的最佳實踐。

### 組員 R14922156 黃泓諺

這次專題是我第一次完整負責後端 API 的設計與開發。從資料庫架構設計、API 端點實作到第三方服務整合，每一個環節都是全新的挑戰。特別是在整合 NextAuth.js v5 時，因為它還在 beta 階段，文檔相對不完整，需要大量閱讀原始碼和社群討論才能解決問題。

AI 助手功能的開發是這次專題最有成就感的部分。透過 Prompt Engineering，讓 Gemini API 能夠理解繁體中文的自然語言輸入，並正確解析事件資訊，這個過程讓我對大型語言模型的應用有了更深入的理解。

Google Calendar API 的整合也是一個有趣的挑戰，需要處理 OAuth 流程、Token 刷新、時區轉換等細節。這些經驗讓我了解到，整合第三方服務不只是呼叫 API 這麼簡單，還需要考慮錯誤處理、資料一致性和用戶體驗。

總體而言，這次專題讓我從理論走向實踐，真正體驗到了全端開發的樂趣與挑戰。感謝組長的協調和支持，讓我們能夠順利完成這個功能豐富的行事曆應用程式。

## 對課程的建議

### 課程優點

#### 課程設計方面

- **AI-first 的教學理念很前瞻**：在 AI coding 工具快速發展的時代，這門課直接擁抱這個趨勢，教導如何有效地與 AI 協作，而不是假裝它不存在，這點非常務實
- **Top-Down 學習法確實有效**：先動手做、再回頭理解原理的方式，讓沒有 web 背景的人也能快速上手
- **作業設計循序漸進**：從 homepage → 單人遊戲 → SPA → full-stack → chatbot，難度曲線安排得當
- **Peer review 制度**：互相 review 作業可以學到不同的實作方式，也減輕助教負擔

#### 課程內容方面

- 涵蓋了現代 web 開發的完整技術棧，從前端到後端到部署都有接觸
- 使用 TypeScript 而非純 JavaScript 是正確的選擇，業界也是這個趨勢
- Final project 要求有真實使用者這點很好，強迫大家做有意義的東西

### 具體改善建議

#### 課程節奏方面

**問題**：後半學期（Week 9-12）的內容密度明顯比前半學期高，authentication、database、Next.js 幾乎同時湧入，加上要開始顧 final project，壓力驟增。

**建議**：
- 考慮將部分 full-stack 概念提前到 Week 7-8 開始鋪陳
- 或是讓 HW#5（My X）的 deadline 延長一週，給學生更多時間消化

#### 作業與 Review 機制

**問題 1**：Peer review 的品質參差不齊，有些 reviewer 給分標準不一致，100 字的 comment 有時流於形式。

**建議**：
- 提供更具體的 review rubric 或 checklist，讓評分標準更一致
- 考慮讓 reviewer 的評分與最終助教評分做比較，偏差太大的扣 reviewer score
- 或許可以公開一些優良的 review comment 範例供參考

**問題 2**：課程進度快，有時候上課講的內容和作業需要的知識有落差，需要大量自學填補。

**建議**：
- 針對每個作業提供「推薦學習資源清單」，列出完成該作業建議先看的文件或影片
- 考慮錄製一些補充教學影片，針對常見卡關點做說明

#### Final Project 方面

**問題**：Midterm review（12/02）到 final submission（12/23）只有三週，其中還卡到期末考週。

**建議**：考慮將 final submission 延到 12/30 或更晚，讓學生能在期末考後專心完成專案

---

**專題完成日期**: 2025 年 12 月 23 日

**部署連結**: [https://web-programming-final-psi.vercel.app/](https://web-programming-final-psi.vercel.app/)

