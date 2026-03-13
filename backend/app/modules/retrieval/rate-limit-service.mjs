export function createRateLimiter({
  limit = 30,
  windowMs = 60_000,
} = {}) {
  const buckets = new Map();

  function prune(now, entries) {
    const minTime = now - windowMs;
    while (entries.length > 0 && entries[0] < minTime) {
      entries.shift();
    }
  }

  return {
    tryConsume(key, now = Date.now()) {
      const bucketKey = String(key ?? "").toLowerCase();
      const entries = buckets.get(bucketKey) ?? [];
      prune(now, entries);

      if (entries.length >= limit) {
        buckets.set(bucketKey, entries);
        return {
          allowed: false,
          limit,
          remaining: 0,
          retryAfterMs: Math.max(0, windowMs - (now - entries[0])),
        };
      }

      entries.push(now);
      buckets.set(bucketKey, entries);
      return {
        allowed: true,
        limit,
        remaining: Math.max(0, limit - entries.length),
        retryAfterMs: 0,
      };
    },
  };
}
