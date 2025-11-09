type Key = string;

const windowMs = 60_000; // 1 minute
const limit = 60;
const store = new Map<Key, { count: number; resetAt: number }>();

export function rateLimit(key: Key) {
  const now = Date.now();
  const item = store.get(key);
  if (!item || item.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true } as const;
  }
  if (item.count >= limit) return { ok: false } as const;
  item.count += 1;
  return { ok: true } as const;
}


