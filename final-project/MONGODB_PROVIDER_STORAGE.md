# MongoDB Provider 存儲指南

## 概述

本文檔說明如何確保 MongoDB 正確存儲用戶的 provider（身份驗證提供商）信息。

## 自動存儲（OAuth Providers）

當用戶使用 **Google** 或 **GitHub** OAuth 登入時，NextAuth 的 `MongoDBAdapter` 會**自動**在 `accounts` 集合中創建記錄：

### Google OAuth 登入
```javascript
// MongoDB accounts 集合會自動創建：
{
  "_id": ObjectId("..."),
  "userId": ObjectId("..."),  // 對應 users._id
  "type": "oauth",
  "provider": "google",         // ✅ 自動設置
  "providerAccountId": "123456789",
  "access_token": "ya29.a0AfH6...",
  "refresh_token": "1//0g...",
  "expires_at": 1234567890,
  "token_type": "Bearer",
  "scope": "openid email profile https://www.googleapis.com/auth/calendar.readonly"
}
```

### GitHub OAuth 登入
```javascript
// MongoDB accounts 集合會自動創建：
{
  "_id": ObjectId("..."),
  "userId": ObjectId("..."),
  "type": "oauth",
  "provider": "github",        // ✅ 自動設置
  "providerAccountId": "12345678",
  "access_token": "gho_...",
  "token_type": "Bearer",
  "scope": "read:user user:email"
}
```

## 手動存儲（Credentials Provider / Dev User）

**Dev User** 使用 Credentials Provider，NextAuth **不會自動**創建 `accounts` 記錄。我們需要手動處理：

### 方法 1: 自動創建（推薦）

當 Dev User 登入時，`LoginButton` 組件會自動調用 `/api/auth/ensure-account` API 來創建記錄：

```typescript
// components/LoginButton.tsx
if (provider === 'credentials') {
  const result = await signIn('credentials', { ... });
  if (result?.ok) {
    // 自動創建 accounts 記錄
    await fetch('/api/auth/ensure-account', {
      method: 'POST',
      body: JSON.stringify({ provider: 'credentials' }),
    });
  }
}
```

### 方法 2: 手動調用 API

你也可以手動調用 API 來創建 accounts 記錄：

```bash
curl -X POST http://localhost:3000/api/auth/ensure-account \
  -H "Content-Type: application/json" \
  -d '{"provider": "credentials"}'
```

### 方法 3: 直接操作 MongoDB

在 MongoDB Atlas 或 MongoDB Compass 中手動插入記錄：

```javascript
// 1. 找到用戶
const user = db.users.findOne({ email: "dev@example.com" });

// 2. 創建 accounts 記錄
db.accounts.insertOne({
  userId: user._id,
  type: "credentials",
  provider: "credentials",
  providerAccountId: `dev-user-${user._id}`,
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

## NextAuth Callbacks

我們已經在 `auth.ts` 中添加了 callbacks 來確保 provider 信息被正確處理：

```typescript
callbacks: {
  async signIn({ user, account, profile }) {
    // OAuth providers 會自動創建 accounts 記錄
    if (account?.provider && account.provider !== 'credentials') {
      console.log(`User signed in with ${account.provider}:`, user.email);
    }
    return true;
  },
  async session({ session, user, token }) {
    // 將 provider 信息添加到 session
    if (token?.provider) {
      session.user.provider = token.provider;
    }
    return session;
  },
  async jwt({ token, user, account }) {
    // 將 provider 信息存儲到 JWT token
    if (account?.provider) {
      token.provider = account.provider;
    }
    return token;
  },
}
```

## 檢查 Provider 信息

### 1. 檢查 MongoDB

```javascript
// 查找所有 accounts 記錄
db.accounts.find().pretty()

// 查找特定 provider 的記錄
db.accounts.find({ provider: "google" }).pretty()
db.accounts.find({ provider: "github" }).pretty()
db.accounts.find({ provider: "credentials" }).pretty()

// 查找特定用戶的所有 accounts
const user = db.users.findOne({ email: "your.email@gmail.com" });
db.accounts.find({ userId: user._id }).pretty()
```

### 2. 檢查 API 響應

訪問 `/api/google-calendar/check` 會返回：
```json
{
  "hasGoogleAccount": true/false
}
```

### 3. 檢查 Session

在客戶端組件中：
```typescript
import { useSession } from 'next-auth/react';

const { data: session } = useSession();
console.log('Provider:', session?.user?.provider);
```

## 常見問題

### Q: 為什麼 Google 登入後 `hasGoogleAccount` 還是 `false`？

**A:** 檢查以下幾點：
1. 確認 MongoDB 中有 `accounts` 記錄
2. 確認 `provider` 是 `"google"`（不是 `"Google"` 或其他）
3. 確認 `access_token` 存在且不為空
4. 確認 `userId` 正確匹配 `users._id`

### Q: Dev User 登入後如何讓 `hasGoogleAccount` 為 `true`？

**A:** Dev User 使用 `credentials` provider，不會有 Google 的 `access_token`，所以 `hasGoogleAccount` 會是 `false`。這是預期行為。如果你需要測試，應該使用真正的 Google OAuth 登入。

### Q: 如何為現有用戶添加 provider 信息？

**A:** 使用 `/api/auth/ensure-account` API：
```bash
curl -X POST http://localhost:3000/api/auth/ensure-account \
  -H "Content-Type: application/json" \
  -d '{"provider": "google"}'
```

或者直接在 MongoDB 中操作（見方法 3）。

## 數據結構參考

### accounts 集合完整結構

```typescript
interface Account {
  _id: ObjectId;
  userId: ObjectId;              // 對應 users._id
  type: "oauth" | "credentials";
  provider: "google" | "github" | "credentials";
  providerAccountId: string;     // OAuth: 外部 ID, Credentials: 自定義 ID
  access_token?: string;          // OAuth 才有
  refresh_token?: string;         // OAuth 才有
  expires_at?: number;           // OAuth token 過期時間（秒）
  token_type?: string;            // OAuth: "Bearer"
  scope?: string;                 // OAuth scopes
  createdAt: Date;
  updatedAt: Date;
}
```

## 總結

- ✅ **OAuth Providers (Google/GitHub)**: 自動創建 `accounts` 記錄
- ✅ **Credentials Provider (Dev User)**: 通過 API 自動創建記錄
- ✅ **NextAuth Callbacks**: 確保 provider 信息被正確處理和存儲
- ✅ **檢查工具**: 使用 MongoDB 查詢或 API 來驗證記錄


