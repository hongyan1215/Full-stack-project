# 跑步/健走路線記錄系統

一個基於 Google Maps API 的全端應用，讓使用者可以記錄、管理和分享跑步/健走路線。

## 📋 專案簡介

### 主要功能

- ✅ **使用者認證**：註冊/登入/登出（JWT 認證）
- ✅ **路線管理**：建立、查看、編輯、刪除跑步路線
- ✅ **地圖互動**：在地圖上點擊建立路線節點
- ✅ **自動計算**：實時計算路線距離（Haversine 公式）
- ✅ **反向地理編碼**：自動將起點座標轉換為地址
- ✅ **路線搜尋**：支援標題和地點搜尋
- ✅ **視覺化**：在地圖上顯示路線、節點標記（起點/終點編號）

### 使用情境

- 🏃 記錄日常跑步路線
- 🚶 規劃健走路線
- 🚴 追蹤自行車路線
- 📍 儲存常用地點與路線

## 🎯 功能展示

### 核心功能
- **地圖建立路線**：點擊地圖新增節點，系統自動繪製路線
- **路線列表**：查看所有建立的路線，支援搜尋與篩選
- **路線詳情**：查看路線詳細資訊與地圖視覺化
- **路線編輯**：修改現有路線，可新增或刪除節點

## 🏗️ 技術架構

### 技術棧

**前端**
- React 18 + TypeScript
- Vite（構建工具）
- Tailwind CSS（樣式框架）
- React Router（路由管理）
- Axios（HTTP 客戶端）
- Google Maps JavaScript API（地圖功能）

**後端**
- Node.js + Express
- TypeScript
- SQLite + better-sqlite3（資料庫）
- JWT（身份認證）
- bcryptjs（密碼雜湊）
- Zod（數據驗證）
- Google Geocoding API（反向地理編碼）

### 架構圖

```
┌─────────────────────────────────────────────────┐
│                  Frontend                        │
│  (React + TypeScript + Vite + Tailwind CSS)     │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  Google Maps JavaScript API              │  │
│  │  (地圖顯示、互動、節點繪製)                │  │
│  └──────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────┘
                   │ HTTP/REST API
                   │ (Axios with JWT)
┌──────────────────┴──────────────────────────────┐
│                  Backend                         │
│  (Node.js + Express + TypeScript)               │
│                                                  │
│  ┌─────────────────┐  ┌─────────────────────┐  │
│  │  Auth Router    │  │  Routes Router      │  │
│  │  (JWT)          │  │  (CRUD + Validate)  │  │
│  └─────────────────┘  └─────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  Geocoding Service                       │  │
│  │  (反向地理編碼 + 快取)                    │  │
│  └──────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────┘
                   │
       ┌───────────┴───────────┐
       │                       │
┌──────▼──────┐    ┌──────────▼───────────┐
│   SQLite    │    │  Google Geocoding    │
│  Database   │    │       API            │
└─────────────┘    └──────────────────────┘
```

## 📦 前置需求

- **Node.js**: 18.x 或以上版本
- **npm** 或 **yarn** 套件管理工具
- **Google Maps API Keys**:
  - Browser Key（前端使用）
  - Server Key（後端使用）

## 🚀 環境設定

### 步驟 1：複製專案

假設您已將專案下載到本地：

```bash
cd hw4
```

### 步驟 2：設定 Google Maps API

#### 2.1 前往 Google Cloud Console

1. 訪問 [Google Cloud Console](https://console.cloud.google.com/)
2. 登入您的 Google 帳號

#### 2.2 建立專案

1. 點擊頂部的專案選擇器
2. 點擊「新增專案」
3. 輸入專案名稱（例如：running-route-tracker）
4. 點擊「建立」

#### 2.3 啟用 API

在專案中啟用以下 API：

1. 前往「API 和服務」>「程式庫」
2. 搜尋並啟用：
   - **Maps JavaScript API**（前端地圖功能）
   - **Geocoding API**（後端反向地理編碼）

#### 2.4 建立 API Keys

##### Browser Key（前端使用）

1. 前往「憑證」>「建立憑證」>「API 金鑰」
2. 複製產生的 API Key
3. 點擊金鑰名稱進行編輯
4. **應用程式限制**：
   - 選擇「HTTP 參照網址（網頁）」 
   - 新增以下網址：
     - `http://localhost:5173/*`
     - `http://127.0.0.1:5173/*`
5. **API 限制**：
   - 選擇「限制金鑰」
   - 僅勾選「Maps JavaScript API」

##### Server Key（後端使用）

1. 再次建立「API 金鑰」
2. **應用程式限制**：
   - **開發環境**：可選擇「無」或設定為「IP 位址（網頁伺服器）」並允許本地 IP
   - **生產環境**：**必須**限制為伺服器 IP
3. **API 限制**：
   - 僅勾選「Geocoding API」

> ⚠️ **安全提示**：生產環境務必設定 IP 限制，避免 API Key 洩露導致配額被盜用。

### 步驟 3：安裝依賴

#### 3.1 安裝前端依賴

```bash
cd client
npm install
```

#### 3.2 安裝後端依賴

```bash
cd ../server
npm install
```

### 步驟 4：設定環境變數

#### 4.1 前端環境變數

```bash
cd client
cp .env.example .env
```

編輯 `client/.env`，填入您的 Browser Key：

```env
VITE_GOOGLE_MAPS_JS_KEY=AIzaSy...您的Browser Key
VITE_API_BASE_URL=http://localhost:3000
```

#### 4.2 後端環境變數

```bash
cd ../server
cp .env.example .env
```

編輯 `server/.env`，填入您的設定：

```env
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
GOOGLE_MAPS_SERVER_KEY=AIzaSy...您的Server Key
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

> ⚠️ **重要**：生產環境中 `JWT_SECRET` 必須改為強密碼（32+ 字元的隨機字串）。

## ▶️ 啟動應用

### 步驟 1：啟動後端

```bash
cd server
npm run dev
```

**預期輸出**：
```
[server] Database initialized
[server] Server running on port 3000
```

### 步驟 2：啟動前端

開啟新的終端視窗：

```bash
cd client
npm run dev
```

**預期輸出**：
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

> ⚠️ **注意**：如果 port 5173 被佔用，Vite 會自動切換到其他 port（如 5174、5175 等）。請注意終端機顯示的實際網址。

### 步驟 3：驗證啟動成功

1. 開啟瀏覽器訪問 `http://localhost:5173`
2. 應該看到登入頁面

## 🗄️ 資料庫

### 自動初始化

資料庫會在後端啟動時自動初始化：
- 建立資料表（`users`、`routes`）
- 插入種子資料（測試帳號與範例路線）

### 資料庫 Schema

#### users 表
- `id`: 主鍵
- `email`: 電子郵件（唯一）
- `username`: 使用者名稱（唯一）
- `passwordHash`: 密碼雜湊值
- `createdAt`: 建立時間
- `updatedAt`: 更新時間

#### routes 表
- `id`: 主鍵
- `title`: 路線標題
- `description`: 路線描述
- `distanceMeters`: 距離（米）
- `startedAt`: 開始時間（可選）
- `finishedAt`: 結束時間（可選）
- `geojson`: GeoJSON 格式的路線數據（JSON）
- `startAddress`: 起點地址（自動生成）
- `createdBy`: 建立者 ID（外鍵）
- `createdAt`: 建立時間
- `updatedAt`: 更新時間

### 測試帳號

- **Email**: `test@example.com`
- **Password**: `test123`

## 📡 API 文件

### API 端點總覽

| 方法 | 端點 | 需要認證 | 說明 |
|------|------|---------|------|
| POST | `/auth/register` | ✗ | 註冊新使用者 |
| POST | `/auth/login` | ✗ | 登入取得 Token |
| POST | `/auth/logout` | ✗ | 登出（前端清除 Token） |
| GET | `/api/routes` | ✓ | 取得使用者所有路線 |
| GET | `/api/routes/:id` | ✓ | 取得特定路線詳情 |
| POST | `/api/routes` | ✓ | 建立新路線 |
| PUT | `/api/routes/:id` | ✓ | 更新路線 |
| DELETE | `/api/routes/:id` | ✓ | 刪除路線 |

### 完整 curl 測試範例

#### 範例 1：註冊新使用者

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "username": "newuser",
    "password": "password123"
  }'
```

**預期回應**：
```json
{
  "message": "User registered successfully"
}
```

#### 範例 2：登入取得 Token

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

**預期回應**：
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "username": "testuser"
  }
}
```

**儲存 Token 以供後續使用**：
```bash
# 複製回應中的 token 並儲存為變數
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 範例 3：建立路線（含 GeoJSON）

```bash
curl -X POST http://localhost:3000/api/routes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "台北101周邊路線",
    "description": "環繞台北101的健走路線",
    "distanceMeters": 2500,
    "geojson": {
      "type": "LineString",
      "coordinates": [
        [121.5645, 25.0330],
        [121.5665, 25.0350],
        [121.5685, 25.0370]
      ]
    }
  }'
```

**說明**：
- `coordinates` 格式為 `[經度, 緯度]`（注意順序）
- 系統會自動呼叫 Google Geocoding API 將第一個點的座標轉換為 `startAddress`
- GeoJSON 必須符合 LineString 格式

**預期回應**：
```json
{
  "id": 2,
  "title": "台北101周邊路線",
  "description": "環繞台北101的健走路線",
  "distanceMeters": 2500,
  "startAddress": "台灣台北市信義區...",
  "geojson": {
    "type": "LineString",
    "coordinates": [[121.5645, 25.0330], ...]
  },
  ...
}
```

#### 範例 4：查詢所有路線

```bash
curl -X GET http://localhost:3000/api/routes \
  -H "Authorization: Bearer $TOKEN"
```

**支援查詢參數**：
- `?q=搜尋關鍵字`：搜尋標題或描述
- `?from=2025-01-01&to=2025-12-31`：日期範圍篩選

**預期回應**：
```json
[
  {
    "id": 1,
    "title": "範例路線",
    "distanceMeters": 1500,
    "startAddress": "台北市信義區...",
    ...
  },
  ...
]
```

#### 範例 5：刪除路線

```bash
curl -X DELETE http://localhost:3000/api/routes/1 \
  -H "Authorization: Bearer $TOKEN"
```

**預期回應**：
```json
{
  "message": "Route deleted successfully"
}
```

## 🔧 疑難排解

### Port 被佔用

**問題**：啟動時出現 `Port 3000 already in use`

**解決方法**：
1. 查找佔用 port 的程序：`lsof -i :3000`（macOS/Linux）
2. 終止程序：`kill -9 <PID>`
3. 或修改 `server/.env` 中的 `PORT` 設定

### API Key 無效

**問題**：地圖無法顯示或 API 呼叫失敗

**解決方法**：
1. 檢查 `.env` 檔案中 API Key 是否正確
2. 確認 API Key 沒有過期
3. 檢查 Browser Key 的 HTTP 參照網址限制
4. 檢查 API 是否已正確啟用

### CORS 錯誤

**問題**：瀏覽器控制台出現 CORS 錯誤

**解決方法**：
1. 確認 `server/.env` 中的 `CORS_ORIGINS` 包含前端網址
2. 確認前端使用的網址（`http://localhost:5173` 或 `http://127.0.0.1:5173`）

### 資料庫鎖定

**問題**：`SQLITE_BUSY: database is locked`

**解決方法**：
1. 確保沒有多個後端程序同時執行
2. 關閉所有後端程序並重新啟動

### 地圖無法顯示

**問題**：地圖區域為空白

**解決方法**：
1. 檢查瀏覽器控制台的錯誤訊息
2. 確認 API Key 已正確設定
3. 檢查網絡連接
4. 清除瀏覽器快取

## 📁 專案結構

```
hw4/
├── client/              # 前端應用
│   ├── src/
│   │   ├── pages/      # 頁面組件
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── MapPage.tsx
│   │   │   ├── RoutesPage.tsx
│   │   │   ├── RouteDetailPage.tsx
│   │   │   └── EditRoutePage.tsx
│   │   ├── components/ # 可重用組件
│   │   │   ├── Header.tsx
│   │   │   └── Toast.tsx
│   │   ├── contexts/   # React Context
│   │   │   └── AuthContext.tsx
│   │   └── utils/      # 工具函數
│   │       └── haversine.ts
│   ├── .env.example
│   └── package.json
├── server/              # 後端應用
│   ├── src/
│   │   ├── routes/     # API 路由
│   │   │   ├── auth.ts
│   │   │   └── routes.ts
│   │   ├── middleware/ # 中間件
│   │   │   └── auth.ts
│   │   ├── services/   # 服務層
│   │   │   └── geocoding.ts
│   │   ├── db/         # 資料庫
│   │   │   ├── index.ts
│   │   │   └── schema.ts
│   │   └── app.ts      # Express 應用
│   ├── db/             # SQLite 資料庫檔案
│   ├── .env.example
│   └── package.json
└── README.md
```

## ⚠️ 已知問題與限制

### 當前限制

- **SQLite 併發限制**：不適合高併發的生產環境
- **缺少路線匯出**：無法匯出為 GPX 或其他格式
- **路線統計功能**：缺少詳細的統計分析
- **社群功能**：無法分享路線給其他使用者
- **行動端體驗**：未針對行動裝置特別優化

### 技術限制

- 使用 SQLite 作為資料庫，單機運行
- 無內建檔案上傳功能
- 無即時通知功能

## 🚀 未來改進方向

### 功能擴展
- 📤 **路線匯出**：支援 GPX 格式匯入/匯出
- 🎯 **路線搜尋**：更進階的搜尋與篩選功能
- 📊 **統計儀表板**：個人跑步數據分析
- 👥 **社群功能**：路線分享、追蹤好友
- 📱 **行動端 App**：原生行動應用
- 🌍 **地圖圖層**：支援地形、衛星圖

### 技術改進
- 🗄️ **資料庫升級**：遷移至 PostgreSQL 或 MySQL
- 🔐 **安全性增強**：實施 Rate Limiting、HTTPS
- 🧪 **單元測試**：增加測試覆蓋率
- 📈 **監控告警**：整合日誌與監控系統
- 🚀 **效能優化**：CDN、快取策略

## 🔒 安全性風險說明

### ⚠️ 重要安全提示

#### Google Maps Server Key 風險

**當前設定**：
- 開發環境可能未設定 IP 限制
- Server Key 用於後端呼叫 Geocoding API

**風險**：
- API Key 洩露可能導致配額被盜用
- 可能產生意外的 API 使用費用

**建議防範措施**：
1. ✅ 生產環境**必須**設定 IP 限制（僅允許伺服器 IP）
2. ✅ 僅啟用必要的 API（僅 Geocoding API）
3. ✅ 設定每日配額上限，避免超額
4. ✅ 定期監控 API 使用量與異常請求
5. ✅ 使用 Google Cloud 的 Alerting 功能

#### JWT Secret 管理

**當前設定**：
- `.env.example` 中的 Secret 僅供範例（`change_me`）

**風險**：
- JWT Secret 洩露可導致偽造任意使用者身份
- 可進行未授權的資料存取

**建議防範措施**：
1. ✅ 生產環境必須使用強密碼（32+ 字元的隨機字串）
2. ✅ 不要在程式碼庫中提交真實的 Secret
3. ✅ 使用環境變數或密鑰管理服務
4. ✅ 定期輪換 JWT Secret

#### CORS 設定

**當前設定**：
- 僅允許 `localhost:5173` 和 `127.0.0.1:5173`

**建議**：
- ✅ 生產環境僅允許實際域名
- ❌ 不建議使用 `*` 允許所有來源

#### 其他安全建議

- ✅ **啟用 HTTPS**：生產環境必須使用 HTTPS
- ✅ **Rate Limiting**：防止暴力破解與 API 濛用
- ✅ **輸入驗證**：使用 Zod 進行嚴格的資料驗證
- ✅ **密碼強度**：建議增加密碼複雜度要求
- ✅ **定期更新**：保持依賴套件為最新版本
- ✅ **錯誤處理**：生產環境隱藏詳細錯誤訊息
- ✅ **日誌記錄**：記錄重要操作與異常

### 生產環境部署前檢查清單

- [ ] Google Maps API Key 已設定 IP 限制
- [ ] JWT_SECRET 已改為強密碼
- [ ] CORS 僅允許實際域名
- [ ] 已啟用 HTTPS
- [ ] 已實施 Rate Limiting
- [ ] 已設定 API 請求配額
- [ ] 已配置錯誤監控與告警
- [ ] 已定期更新依賴套件
- [ ] 已備份資料庫與重要資料

## 📄 授權

ISC

## 👥 貢獻

歡迎提交 Issue 和 Pull Request！

## 📧 聯絡

如有問題或建議，請透過 Issue 聯絡。

---

**祝您使用愉快！** 🎉
