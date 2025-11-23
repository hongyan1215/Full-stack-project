# 末日生存文字冒險 Line Bot (Survival RPG Bot)

這是一個基於 **Next.js (App Router)** + **TypeScript** + **MongoDB** + **Google Gemini LLM** 開發的 Line Bot 文字冒險遊戲。
Bot 扮演「地下城主 (DM)」的角色（設定為末日倖存的廣播員），根據使用者的輸入進行互動式敘事。

## 因為很有趣所以我還做了另一個記帳bot
- **Line Bot 加入好友連結**: [https://lin.ee/2azi5Sx](https://lin.ee/2azi5Sx)
- **管理後台 (Admin Dashboard)**: 由bot內部開啟專屬後台

## 1. 部署連結 (Deployment)

- **Line Bot 加入好友連結**: [https://lin.ee/y20tg9H](https://lin.ee/y20tg9H)
- **管理後台 (Admin Dashboard)**: [https://wp1141-five-indol.vercel.app/admin](https://wp1141-five-indol.vercel.app/admin) (請使用此連結查看玩家列表與對話紀錄)

## 2. Chatbot 設計 (Chatbot Design)

### 核心概念
Bot 擔任「地下城主 (DM)」的角色。使用者傳送文字指令（如「往左走」、「攻擊」、「搜尋物資」），Bot 會根據目前劇情與 LLM 運算結果，回覆接下來發生的劇情與結果。

### AI 人設 (Persona)
- **身份**: 末日世界的倖存廣播員，透過無線電與玩家通訊。
- **語氣**: 冷靜、略帶懸疑、寫實、偶爾會有無線電雜訊的干擾感（如 "滋...滋..."）。
- **風格**: 不一次給出太長劇情，保持互動性，並在結尾提供行動建議。

### 功能規格
1.  **開始遊戲**: 使用者輸入「Start」或「開始」，系統建立新的 Game Session。
2.  **互動敘事**: 使用 Google Gemini 2.5 Flash Lite 模型，根據對話歷史生成回應。
3.  **狀態追蹤**: 透過 MongoDB 儲存完整的對話 Session (User & Assistant 訊息)，作為 LLM 的 Context。
4.  **優雅降級**: 若 LLM API 失敗或超時，Bot 會回覆：「*無線電訊號受到嚴重干擾...（請稍後重試）*」，確保使用者體驗不中斷。

### System Prompt (核心指令)
```text
你現在是【末日生存文字冒險遊戲】的「地下城主 (DM)」。
你的身份：一名倖存的廣播員，透過無線電與玩家（倖存者）通訊。
語氣：冷靜、略帶懸疑、寫實、偶爾會有無線電雜訊的干擾感（如 "滋...滋..."）。

遊戲規則：
1. 這是末日世界，資源匱乏，危險遍布（喪屍、輻射、強盜）。
2. 根據玩家的行動，判斷成功率與後果。
3. 不要一次給出太長的劇情，保持對話互動性，每次回覆控制在 100-200 字以內，適合 Line 閱讀。
4. 結尾可以給出 2-3 個建議選項，但也允許玩家自由輸入。
5. 如果玩家死亡，遊戲結束，請宣告結局並說明如何重新開始。

請嚴格遵守此人設進行回應。
```

## 3. 本地開發設定 (Local Development)

### 環境需求
- Node.js 18+
- MongoDB (Local or Atlas)
- LINE Channel (Messaging API)
- Google Cloud Project (Gemini API Key)

### 安裝步驟
1. Clone 專案
   ```bash
   git clone https://github.com/hongyan1215/wp1141.git
   cd wp1141/hw6
   ```

2. 安裝依賴
   ```bash
   npm install
   ```

3. 設定環境變數
   建立 `.env.local` 檔案，並填入以下內容：
   ```bash
   # MongoDB 連線字串
   MONGODB_URI=mongodb+srv://your_db_user:password@cluster.mongodb.net/dbname

   # Line Bot 設定 (Line Developers Console)
   LINE_CHANNEL_ID=your_channel_id
   LINE_CHANNEL_SECRET=your_channel_secret
   LINE_CHANNEL_ACCESS_TOKEN=your_access_token

   # Google Gemini API 設定 (Google AI Studio)
   GOOGLE_API_KEY=your_gemini_api_key
   ```

4. 啟動開發伺服器
   ```bash
   npm run dev
   ```
   伺服器將運行於 `http://localhost:3000`。

5. 本地 Webhook 測試 (使用 Ngrok)
   ```bash
   ngrok http 3000
   ```
   將 Ngrok 提供的 URL (例如 `https://xxxx.ngrok-free.app/api/webhook`) 填入 Line Developers Console 的 Webhook URL 並驗證。

## 4. 採用的進階功能 (Feature Checklist)

- [x] **Session 管理**：透過 MongoDB 追蹤並儲存完整對話流程與狀態。
- [x] **使用者分析**：管理後台可顯示總對話數、活躍使用者列表與狀態。
- [x] **Webhook 健康檢查**：透過 Line Developers Console 的 Verify 功能確認 `/api/webhook` 狀態。
- [x] **優雅降級**：實作錯誤捕捉機制，避免 Bot 無回應。
