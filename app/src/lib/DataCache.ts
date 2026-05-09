/**
 * DataCache.ts
 * In-memory cache for instant tab switching.
 * Data loads once, serves from cache on repeat visits, refreshes silently in background.
 */

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class DataCache {
  private store = new Map<string, CacheEntry<any>>();
  private inflight = new Map<string, Promise<any>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.fetchedAt > CACHE_TTL) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.store.set(key, { data, fetchedAt: Date.now() });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidateAll(): void {
    this.store.clear();
  }

  /**
   * Fetch with deduplication — if same key is in-flight, returns same promise.
   * Prevents double-fetching on rapid tab switches.
   */
  async fetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    if (this.inflight.has(key)) {
      return this.inflight.get(key) as Promise<T>;
    }

    const promise = fetcher().then((data) => {
      this.set(key, data);
      this.inflight.delete(key);
      return data;
    }).catch((err) => {
      this.inflight.delete(key);
      throw err;
    });

    this.inflight.set(key, promise);
    return promise;
  }
}

export const dataCache = new DataCache();