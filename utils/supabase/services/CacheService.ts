import NodeCache from 'node-cache';

const stdTTL = 30;
class CacheService {
  private _cache = new NodeCache({ stdTTL });

  // shouldCache: return false for values that must not be shared between users (e.g. owner-only rows).
  async get(key: string, asyncFetcher: () => Promise<any>, ttl: number = stdTTL, shouldCache: (value: any) => boolean = () => true) {
    const value = this._cache.get(key);

    if (value !== undefined && value !== null) {
      return value;
    }

    const newValue = await asyncFetcher();

    if (shouldCache(newValue)) this._cache.set(key, newValue, ttl);
    return newValue;
  }

  async del(key: string) {
    this._cache.del(key);
  }
}

export const cache = new CacheService();
