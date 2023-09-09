const redis = require('redis');

var redisClient;

(async () => {
    redisClient = redis.createClient({
        url: process.env.REDIS_URI
    });

    redisClient.on("error", (error) => {
        console.error('Redis connection error:', error);
    });

    await redisClient.connect()
})()

module.exports = redisClient;