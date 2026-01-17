# NTU Web Programming 114-1

國立台灣大學 資訊工程學研究所 Web Programming 114-1 課程作業與專題

## 專案概述

本儲存庫包含 2024 學年度第一學期 Web Programming 課程的所有作業與最終專題。每個作業都是循序漸進地學習現代 Web 開發技術，從基礎的前端開發到全端應用，最後完成一個整合所有技能的期末專題。

## 專案結構

### 📁 hw1 - 個人網站

使用 HTML、CSS 和 TypeScript 建立的個人作品集網站，展示個人簡介、教育背景、成就與技能。

**技術棧**：
- HTML5 / CSS3
- TypeScript
- 玻璃擬態設計
- 動態粒子背景效果

**主要功能**：
- 個人簡介與教育背景展示
- 成就與獎項視覺化
- 響應式設計

---

### 📁 hw2 - 貪食蛇遊戲

使用 React + TypeScript (Vite) 開發的經典貪食蛇遊戲，具備升級系統與速度調整機制。

**技術棧**：
- React 18
- TypeScript
- Vite
- LocalStorage (資料持久化)

**主要功能**：
- 經典貪食蛇玩法
- 多種食物類型（加速/減速/獎勵）
- 升級商店系統（金幣、食物升級）
- 稱號系統與顏色變化

---

### 📁 hw3 - 甜點規劃應用 (Dessert Planner)

純前端的甜點與咖啡商品瀏覽應用，具備完整的購物車與訂單管理功能。

**技術棧**：
- React 18 + TypeScript
- Vite
- TailwindCSS
- shadcn/ui + Radix UI
- PapaParse (CSV 解析)

**主要功能**：
- 商品瀏覽與篩選（類別、價格、評分）
- 購物車系統（"今日計畫"）
- 訂單提交與管理
- CSV 資料驅動

---

### 📁 hw4 - 跑步路線記錄系統

基於 Google Maps API 的全端應用，讓使用者可以記錄、管理和分享跑步/健走路線。

**技術棧**：
- **前端**: React 18 + TypeScript + Vite + Tailwind CSS
- **後端**: Node.js + Express + TypeScript
- **資料庫**: SQLite + better-sqlite3
- **認證**: JWT
- **第三方 API**: Google Maps JavaScript API, Google Geocoding API

**主要功能**：
- 使用者認證（註冊/登入/登出）
- 路線管理（建立、查看、編輯、刪除）
- 地圖互動（點擊建立路線節點）
- 自動距離計算與反向地理編碼
- 路線搜尋與篩選

---

### 📁 hw5 - 社交媒體平台 (Nexus)

基於 Next.js 15 的現代化社交媒體平台，類似 Twitter/X 的功能與設計。

**技術棧**：
- Next.js 15 (App Router)
- React 18 + TypeScript
- NextAuth.js v5
- Prisma ORM + MongoDB Atlas
- Pusher Channels (實時通信)
- Cloudinary (圖片儲存與 CDN)

**主要功能**：
- OAuth 登入（Google、GitHub、Facebook）
- 帖子管理（建立、刪除、280字符限制）
- 互動功能（點讚、轉發、評論）
- 實時通知系統
- 個人資料管理（頭像、橫幅、編輯）
- 關注/粉絲系統
- 草稿管理
- 多媒體支援（圖片上傳）

**部署連結**: https://hw5-bay.vercel.app

---

### 📁 hw6 - 末日生存文字冒險 Line Bot

基於 Next.js + Google Gemini LLM 開發的 Line Bot 文字冒險遊戲，Bot 扮演「地下城主 (DM)」的角色。

**技術棧**：
- Next.js (App Router)
- TypeScript
- MongoDB
- Google Gemini 2.5 Flash Lite
- Line Messaging API

**主要功能**：
- 互動式文字冒險遊戲
- AI 驅動的劇情生成
- Session 管理與對話歷史追蹤
- 管理後台（玩家列表與對話紀錄）

**Line Bot 連結**: https://lin.ee/y20tg9H

---

### 📁 final-project - 自律軌跡 (Self-Discipline Track)

功能豐富的現代化行事曆應用程式，採用 Next.js 14、React 19 和 TypeScript 開發。核心差異化功能為課表管理系統。

**技術棧**：
- Next.js 14 (App Router)
- React 19 + TypeScript
- NextAuth.js v5
- MongoDB Atlas
- Google Calendar API
- Gemini API (AI 助手)

**主要功能**：
- 多視圖模式（月/週/日）
- 事件管理（建立、編輯、刪除）
- **課表管理系統**（核心差異化功能）
  - 課表模板編輯器
  - 日期範圍啟用/停用
  - 自動生成重複課表事件
- 自定義時間格系統
- AI 助手（自然語言建立事件）
- Google Calendar 同步
- 日記與心情記錄
- 多主題支援
- 分享功能

**部署連結**: https://web-programming-final-psi.vercel.app/

## 技術演進路徑

```
hw1: 純前端 (HTML/CSS/TS)
  ↓
hw2: React SPA (Vite)
  ↓
hw3: React SPA + 狀態管理 (Context API)
  ↓
hw4: Full-stack (React + Express + SQLite)
  ↓
hw5: Full-stack + 認證 (Next.js + MongoDB + NextAuth)
  ↓
hw6: Full-stack + AI 整合 (Next.js + Gemini API)
  ↓
final-project: 完整產品級應用 (整合所有技術)
```

## 開發環境需求

- **Node.js**: 18.x 或更高版本
- **npm** 或 **yarn** 套件管理器
- 各作業可能有額外的第三方服務需求（請參考各作業的 README）

## 如何開始

每個作業都是獨立的專案，請參考各資料夾內的 README.md 取得詳細的安裝與執行說明：

```bash
# 進入特定作業資料夾
cd hw1  # 或 hw2, hw3, ...

# 安裝依賴
npm install  # 或 yarn install

# 啟動開發伺服器
npm run dev  # 或 yarn dev
```

## 授權

本專案為課程作業與專題，僅供學習用途。

## 聯絡資訊

如有任何問題或建議，歡迎透過 GitHub Issues 聯繫。

---

**課程**: 國立台灣大學 資訊工程學研究所 Web Programming 114-1  
**學期**: 2024 學年度第一學期
