import { createClient, type RedisClientType } from "redis";

let redisClient: RedisClientType | null = null;

const CACHE_KEYS = {
  // User cache
  USER: (id: string) => `user:${id}`,
  USER_BY_EMAIL: (email: string) => `user:email:${email}`,
  USER_PROFILE: (id: string) => `user:profile:${id}`,

  // Session cache
  SESSION: (token: string) => `session:${token}`,

  // Service cache
  SERVICE_TYPES: "service:types:all",
  SERVICE_TYPE: (id: string) => `service:type:${id}`,

  // Package cache
  PACKAGES: "package:all",
  PACKAGE: (id: string) => `package:${id}`,

  // Provider cache
  PROVIDER_PROFILE: (userId: string) => `provider:profile:${userId}`,
  PROVIDER_STATS: (userId: string) => `provider:stats:${userId}`,

  // Subscription cache
  SUBSCRIPTION: (userId: string) => `subscription:${userId}`,
  USER_CREDITS: (userId: string) => `user:credits:${userId}`,

  // Notification cache
  NOTIFICATIONS: (userId: string) => `notifications:${userId}`,
  UNREAD_COUNT: (userId: string) => `unread:count:${userId}`,

  // Request cache
  REQUEST: (id: string) => `request:${id}`,
  REQUEST_LIST: (userId: string, type: "client" | "provider") => `request:list:${userId}:${type}`,
} as const;

const CACHE_TTL = {
  SESSION: 86400, // 24 hours
  USER: 3600, // 1 hour
  PROFILE: 1800, // 30 minutes
  SERVICE_TYPES: 86400, // 24 hours
  PACKAGES: 21600, // 6 hours
  SUBSCRIPTION: 300, // 5 minutes
  NOTIFICATIONS: 300, // 5 minutes
  REQUEST: 600, // 10 minutes
  REQUEST_LIST: 300, // 5 minutes
} as const;

export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient?.isOpen) {
    return redisClient;
  }

  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    console.warn("Redis not configured. Caching disabled.");
    return null as any;
  }

  try {
    redisClient = createClient({
      url:
        process.env.REDIS_URL ||
        `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`,
      socket: {
        reconnectStrategy: (retries: number) => {
          if (retries > 10) {
            console.error("Redis reconnection failed after 10 attempts");
            return new Error("Redis reconnection failed");
          }
          return retries * 100;
        },
      },
    });

    redisClient.on("error", (err: Error) => {
      console.error("Redis error:", err);
      redisClient = null;
    });

    redisClient.on("connect", () => {
      console.log("Redis connected");
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
    return null as any;
  }
}

/**
 * Get value from cache
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedisClient();
    if (!client) return null;

    const data = await client.get(key);
    if (!data) return null;

    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error);
    return null;
  }
}

/**
 * Set value in cache with TTL
 */
export async function setCached<T>(key: string, value: T, ttl?: number): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client) return;

    const serialized = JSON.stringify(value);
    if (ttl) {
      await client.setEx(key, ttl, serialized);
    } else {
      await client.set(key, serialized);
    }
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error);
  }
}

/**
 * Delete value from cache
 */
export async function deleteCached(key: string | string[]): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client) return;

    await client.del(Array.isArray(key) ? key : [key]);
  } catch (error) {
    console.error(`Cache delete error:`, error);
  }
}

/**
 * Delete all keys matching pattern
 */
export async function deleteCachedPattern(pattern: string): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client) return;

    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    console.error(`Cache pattern delete error:`, error);
  }
}

/**
 * Increment counter (useful for unread counts)
 */
export async function incrementCached(key: string, increment = 1): Promise<number> {
  try {
    const client = await getRedisClient();
    if (!client) return 0;

    return await client.incrBy(key, increment);
  } catch (error) {
    console.error(`Cache increment error for key ${key}:`, error);
    return 0;
  }
}

/**
 * Get or set value (cache-aside pattern)
 */
export async function getOrSetCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T | null> {
  try {
    // Try to get from cache
    const cached = await getCached<T>(key);
    if (cached) return cached;

    // Fetch fresh data
    const data = await fetcher();
    if (data) {
      await setCached(key, data, ttl);
    }
    return data;
  } catch (error) {
    console.error(`Cache get-or-set error for key ${key}:`, error);
    return null;
  }
}

export const cacheKeys = CACHE_KEYS;
export const cacheTTL = CACHE_TTL;
