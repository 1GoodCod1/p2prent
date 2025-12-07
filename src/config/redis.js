import redis from 'redis';
import logger from '../config/logger.js';

class RedisClient {
    constructor() {
        this.client = redis.createClient({
            url: process.env.REDIS_URL,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        logger.error('Too many Redis reconnection attempts');
                        return new Error('Redis connection failed');
                    }
                    return Math.min(retries * 100, 3000);
                },
            },
        });

        this.setupEventHandlers();
        this.connect();
    }

    setupEventHandlers() {
        this.client.on('connect', () => {
            logger.info('Redis connected');
        });

        this.client.on('error', (error) => {
            logger.error('Redis error:', error);
        });

        this.client.on('reconnecting', () => {
            logger.warn('Redis reconnecting...');
        });

        this.client.on('end', () => {
            logger.warn('Redis connection closed');
        });
    }

    async connect() {
        try {
            await this.client.connect();
        } catch (error) {
            logger.error('Failed to connect to Redis:', error);
            // Redis не критичен, можно продолжать работу
        }
    }

    async disconnect() {
        try {
            await this.client.quit();
            logger.info('Redis disconnected');
        } catch (error) {
            logger.error('Error disconnecting Redis:', error);
        }
    }

    // Базовые методы
    async get(key) {
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error(`Redis GET error for key ${key}:`, error);
            return null;
        }
    }

    async set(key, value, ttl = null) {
        try {
            const stringValue = JSON.stringify(value);
            if (ttl) {
                await this.client.setEx(key, ttl, stringValue);
            } else {
                await this.client.set(key, stringValue);
            }
            return true;
        } catch (error) {
            logger.error(`Redis SET error for key ${key}:`, error);
            return false;
        }
    }

    async del(key) {
        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            logger.error(`Redis DEL error for key ${key}:`, error);
            return false;
        }
    }

    async exists(key) {
        try {
            return await this.client.exists(key);
        } catch (error) {
            logger.error(`Redis EXISTS error for key ${key}:`, error);
            return false;
        }
    }

    async incr(key) {
        try {
            return await this.client.incr(key);
        } catch (error) {
            logger.error(`Redis INCR error for key ${key}:`, error);
            return null;
        }
    }

    async decr(key) {
        try {
            return await this.client.decr(key);
        } catch (error) {
            logger.error(`Redis DECR error for key ${key}:`, error);
            return null;
        }
    }

    // Set операции
    async sAdd(key, ...members) {
        try {
            return await this.client.sAdd(key, members);
        } catch (error) {
            logger.error(`Redis SADD error for key ${key}:`, error);
            return 0;
        }
    }

    async sMembers(key) {
        try {
            return await this.client.sMembers(key);
        } catch (error) {
            logger.error(`Redis SMEMBERS error for key ${key}:`, error);
            return [];
        }
    }

    async sRem(key, ...members) {
        try {
            return await this.client.sRem(key, members);
        } catch (error) {
            logger.error(`Redis SREM error for key ${key}:`, error);
            return 0;
        }
    }

    // Hash операции
    async hSet(key, field, value) {
        try {
            return await this.client.hSet(key, field, JSON.stringify(value));
        } catch (error) {
            logger.error(`Redis HSET error for key ${key}, field ${field}:`, error);
            return false;
        }
    }

    async hGet(key, field) {
        try {
            const value = await this.client.hGet(key, field);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error(`Redis HGET error for key ${key}, field ${field}:`, error);
            return null;
        }
    }

    // List операции
    async lPush(key, ...values) {
        try {
            const stringValues = values.map(v => JSON.stringify(v));
            return await this.client.lPush(key, stringValues);
        } catch (error) {
            logger.error(`Redis LPUSH error for key ${key}:`, error);
            return 0;
        }
    }

    async lRange(key, start, stop) {
        try {
            const values = await this.client.lRange(key, start, stop);
            return values.map(v => JSON.parse(v));
        } catch (error) {
            logger.error(`Redis LRANGE error for key ${key}:`, error);
            return [];
        }
    }

    async lTrim(key, start, stop) {
        try {
            return await this.client.lTrim(key, start, stop);
        } catch (error) {
            logger.error(`Redis LTRIM error for key ${key}:`, error);
            return false;
        }
    }

    // Health check
    async healthCheck() {
        try {
            await this.client.ping();
            return { status: 'healthy', timestamp: new Date() };
        } catch (error) {
            return { status: 'unhealthy', error: error.message, timestamp: new Date() };
        }
    }

    // Паттерны
    async keys(pattern) {
        try {
            return await this.client.keys(pattern);
        } catch (error) {
            logger.error(`Redis KEYS error for pattern ${pattern}:`, error);
            return [];
        }
    }
}

const redisClient = new RedisClient();
export default redisClient;