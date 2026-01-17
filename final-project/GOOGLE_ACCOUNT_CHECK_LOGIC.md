# Google Account Check Logic

## `hasGoogleAccount` 何時會是 `true`？

根據 `/api/google-calendar/check` 的邏輯，`hasGoogleAccount` 會在以下**所有條件**都滿足時返回 `true`：

### 1. 用戶必須有有效的 Session
```typescript
const session = await auth();
if (!session?.user?.email) {
  return { hasGoogleAccount: false };
}
```

### 2. 用戶必須存在於 MongoDB `users` 集合中
```typescript
const user = await db.collection("users").findOne({
  email: session.user.email,
});
if (!user) {
  return { hasGoogleAccount: false };
}
```

### 3. 必須在 `accounts` 集合中找到 Google 賬戶記錄
```typescript
const account = await db.collection("accounts").findOne({
  userId: user._id,        // 必須匹配用戶的 _id
  provider: 'google',       // 必須是 'google'
});

const hasGoogleAccount = !!account && !!account.access_token;
```

## 關鍵條件

`hasGoogleAccount` 為 `true` 需要：

1. ✅ **用戶使用 Google OAuth 登入**
   - 不是 GitHub 登入
   - 不是 Dev User（credentials provider）

2. ✅ **NextAuth MongoDBAdapter 成功保存賬戶信息**
   - 當用戶通過 Google OAuth 登入時，NextAuth 會自動在 `accounts` 集合中創建一條記錄
   - 記錄包含 `access_token`、`refresh_token`、`expires_at` 等

3. ✅ **`accounts` 記錄必須包含 `access_token`**
   - `access_token` 不能為 `null`、`undefined` 或空字符串
   - 即使 `access_token` 過期，只要存在就會返回 `true`（同步時會自動刷新）

## MongoDB 數據結構

### `users` 集合示例
```json
{
  "_id": ObjectId("..."),
  "name": "Your Name",
  "email": "your.email@gmail.com",
  "image": "https://...",
  "emailVerified": null
}
```

### `accounts` 集合示例（Google 賬戶）
```json
{
  "_id": ObjectId("..."),
  "userId": ObjectId("..."),  // 對應 users._id
  "type": "oauth",
  "provider": "google",        // 必須是 "google"
  "providerAccountId": "123456789",
  "access_token": "ya29.a0AfH6...",  // 必須存在且不為空
  "refresh_token": "1//0g...",
  "expires_at": 1234567890,
  "token_type": "Bearer",
  "scope": "openid email profile https://www.googleapis.com/auth/calendar.readonly"
}
```

## 如何確保 `hasGoogleAccount` 為 `true`？

### 步驟 1: 使用 Google OAuth 登入
1. 點擊「Sign in with Google」按鈕
2. 完成 Google OAuth 授權流程
3. 授權應用訪問 Google Calendar（`calendar.readonly` scope）

### 步驟 2: 確認 MongoDB 中有記錄
登入後，檢查 MongoDB：

```javascript
// 在 MongoDB Atlas 或 MongoDB Compass 中查詢

// 1. 查找用戶
db.users.findOne({ email: "your.email@gmail.com" })

// 2. 查找對應的 Google 賬戶
db.accounts.findOne({ 
  userId: ObjectId("用戶的_id"), 
  provider: "google" 
})
```

### 步驟 3: 確認 `access_token` 存在
```javascript
// 檢查賬戶記錄
const account = db.accounts.findOne({ 
  userId: ObjectId("..."), 
  provider: "google" 
});

// 確認 access_token 存在
console.log(account.access_token); // 應該是一個長字符串，不是 null/undefined
```

## 常見問題

### Q: 為什麼使用 GitHub 登入後 `hasGoogleAccount` 是 `false`？
**A:** 因為 `accounts` 集合中的記錄 `provider` 是 `"github"`，不是 `"google"`。只有使用 Google OAuth 登入才會創建 `provider: "google"` 的記錄。

### Q: 為什麼 Dev User 登入後 `hasGoogleAccount` 是 `false`？
**A:** Dev User 使用 Credentials Provider，不會在 `accounts` 集合中創建記錄。不過，我們已經修改了代碼，讓 Dev User 也能看到同步按鈕（但會顯示提示訊息）。

### Q: `access_token` 過期了怎麼辦？
**A:** 即使 `access_token` 過期，只要記錄存在，`hasGoogleAccount` 仍會返回 `true`。在實際同步時，代碼會自動刷新過期的 token。

### Q: 如何重新獲取 `access_token`？
**A:** 重新使用 Google OAuth 登入即可。NextAuth 會自動更新 `accounts` 集合中的 token 信息。

## 調試方法

### 1. 檢查服務器日誌
查看 `/api/google-calendar/check` 的日誌輸出：
```
Found user: ObjectId("...") email: your.email@gmail.com
Google account found: true/false
Account details: { provider: 'google', hasAccessToken: true/false, ... }
Final result - hasGoogleAccount: true/false
```

### 2. 檢查瀏覽器控制台
查看前端組件的日誌：
```javascript
Google account check result: { hasGoogleAccount: true/false }
```

### 3. 直接查詢 MongoDB
```javascript
// 查找所有 Google 賬戶
db.accounts.find({ provider: "google" }).pretty()

// 查找特定用戶的 Google 賬戶
db.accounts.findOne({ 
  userId: ObjectId("用戶的_id"), 
  provider: "google" 
})
```

## 總結

`hasGoogleAccount` 為 `true` 的條件：
1. ✅ 用戶使用 **Google OAuth** 登入（不是 GitHub 或 Dev User）
2. ✅ NextAuth 成功在 `accounts` 集合中創建了記錄
3. ✅ 記錄的 `provider` 是 `"google"`
4. ✅ 記錄包含有效的 `access_token`（不為 null/undefined/空字符串）

如果以上條件都滿足，`hasGoogleAccount` 就會返回 `true`，同步按鈕就會顯示。


