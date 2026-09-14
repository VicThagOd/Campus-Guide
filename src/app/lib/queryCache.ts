// lib/queryCache.ts
// In-memory + SessionStorage caching to prevent redundant database queries during traffic spikes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const MEMORY_CACHE = new Map<string, CacheEntry<any>>();

export async function fetchWithCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds = 60
): Promise<T> {
  const now = Date.now();
  const ttlMs = ttlSeconds * 1000;

  // 1. Check in-memory cache
  const cachedMem = MEMORY_CACHE.get(key);
  if (cachedMem && now - cachedMem.timestamp < ttlMs) {
    return cachedMem.data as T;
  }

  // 2. Check SessionStorage
  try {
    const sessionItem = sessionStorage.getItem(`cg_cache_${key}`);
    if (sessionItem) {
      const parsed = JSON.parse(sessionItem) as CacheEntry<T>;
      if (now - parsed.timestamp < ttlMs) {
        MEMORY_CACHE.set(key, parsed);
        return parsed.data;
      }
    }
  } catch {
    // Ignore sessionStorage error (e.g. incognito quota)
  }

  // 3. Fetch Fresh Data
  const freshData = await fetchFn();

  const entry: CacheEntry<T> = {
    data: freshData,
    timestamp: now,
  };

  MEMORY_CACHE.set(key, entry);

  try {
    sessionStorage.setItem(`cg_cache_${key}`, JSON.stringify(entry));
  } catch {
    // Ignore error
  }

  return freshData;
}

export function invalidateCache(keyPrefix?: string) {
  if (!keyPrefix) {
    MEMORY_CACHE.clear();
    try {
      Object.keys(sessionStorage).forEach((k) => {
        if (k.startsWith("cg_cache_")) sessionStorage.removeItem(k);
      });
    } catch {
      // Ignore
    }
    return;
  }

  for (const k of MEMORY_CACHE.keys()) {
    if (k.startsWith(keyPrefix)) {
      MEMORY_CACHE.delete(k);
    }
  }

  try {
    Object.keys(sessionStorage).forEach((k) => {
      if (k.startsWith(`cg_cache_${keyPrefix}`)) sessionStorage.removeItem(k);
    });
  } catch {
    // Ignore
  }
}
