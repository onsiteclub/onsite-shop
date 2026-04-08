const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const HOUR_MS = 3_600_000;
const MAX_PER_HOUR = 50;

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 300_000) return;
  lastCleanup = now;
  const entries = Array.from(store.entries());
  for (const [key, entry] of entries) {
    entry.timestamps = entry.timestamps.filter((t: number) => now - t < HOUR_MS);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

export function rateLimit(ip: string): { allowed: boolean; remaining: number } {
  cleanup();
  const now = Date.now();
  const entry = store.get(ip) || { timestamps: [] as number[] };

  entry.timestamps = entry.timestamps.filter((t: number) => now - t < HOUR_MS);

  if (entry.timestamps.length >= MAX_PER_HOUR) {
    store.set(ip, entry);
    return { allowed: false, remaining: 0 };
  }

  const recentCount = entry.timestamps.filter((t: number) => now - t < WINDOW_MS).length;
  if (recentCount >= MAX_PER_WINDOW) {
    store.set(ip, entry);
    return { allowed: false, remaining: 0 };
  }

  entry.timestamps.push(now);
  store.set(ip, entry);

  return { allowed: true, remaining: MAX_PER_WINDOW - recentCount - 1 };
}
