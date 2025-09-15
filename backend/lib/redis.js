import Redis from "ioredis"
import dotenv from "dotenv"

dotenv.config()

export const client = new Redis(process.env.UPSTASH_REDIS);
await client.set('foo', 'bar');