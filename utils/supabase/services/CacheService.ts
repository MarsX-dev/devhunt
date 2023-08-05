import NodeCache from 'node-cache';

const stdTTL = 30;
class CacheService {
  private _cache = new NodeCache({ stdTTL });

  async get(key: string, asyncFetcher: () => Promise<any>, ttl: number = stdTTL) {
    const value = this._cache.get(key);

    if (value !== undefined && value !== null) {
      return value;
    }

    const newValue = await asyncFetcher();

    this._cache.set(key, newValue, ttl);
    return newValue;
  }

  async del(key: string) {
    this._cache.del(key);
  }
}

export const cache = new CacheService();
