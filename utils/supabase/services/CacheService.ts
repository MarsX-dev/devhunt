import NodeCache from "node-cache";

const stdTTL = 30;
class CacheService {
    private _cache = new NodeCache({stdTTL});

    async get(key: string, asyncFetcher: () => Promise<any>, ttl: number = stdTTL) {
        const value = this._cache.get(key)

        // console.log('getting by key', key, value);

        if (value !== undefined && value !== null) {
            return value
        }

        // console.log('fetching data for key', key);
        const newValue = await asyncFetcher();

        // console.log('value is', newValue);

        this._cache.set(key, newValue, ttl);
        return newValue;
    }

    async del(key: string) {
        this._cache.del(key);
    }
}

export const cache = new CacheService();