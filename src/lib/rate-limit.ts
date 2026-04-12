// In-memory rate limiter — no dependencies
// Tracks attempts by key (IP, email, etc.) within a sliding window

interface Entry {
  timestamps: number[];
}

const stores = new Map<string, Map<string, Entry>>();

// Periodic cleanup every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [, store] of stores) {
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < 3600_000);
      if (entry.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }
}, 600_000).unref();

function getStore(name: string): Map<string, Entry> {
  let store = stores.get(name);
  if (!store) {
    store = new Map();
    stores.set(name, store);
  }
  return store;
}

/**
 * Check if a key has exceeded the rate limit.
 * Returns true if the request should be BLOCKED.
 */
export function isRateLimited(
  storeName: string,
  key: string,
  maxAttempts: number,
  windowMs: number
): boolean {
  const store = getStore(storeName);
  const now = Date.now();

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= maxAttempts) {
    return true;
  }

  entry.timestamps.push(now);
  return false;
}
