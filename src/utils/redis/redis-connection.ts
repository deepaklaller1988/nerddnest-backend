import { Queue, Worker  } from "bullmq";
import Redis from 'ioredis';

const redisConfig = {
    port: 6379,
    host: '127.0.0.1',
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    showFriendlyErrorStack: true,
  };
  

  const redisConnection = new Redis(redisConfig);

  export default redisConnection;