import Redis from 'ioredis';

const redis = new Redis(); // configure host/port if needed

export const acquireLock = async (key, ttl = 10000) => {
  // Set key with PX TTL and NX to only set if not exists
  const result = await redis.set(key, 'locked', 'PX', ttl, 'NX');
  return result === 'OK';
};

export const releaseLock = async (key) => {
  await redis.del(key);
};