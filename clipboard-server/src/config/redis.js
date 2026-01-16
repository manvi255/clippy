import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

const REDIS_URL = process.env.REDIS_URL;

// Redis clients
export const pub = createClient({ url: REDIS_URL });
export const sub = createClient({ url: REDIS_URL });
export const kv = createClient({ url: REDIS_URL }); // For storing last clipboard per room

// Connect and handle errors
async function connectRedis() {
    try {
        await pub.connect();
        await sub.connect();
        await kv.connect();
        console.log("✅ Redis clients connected");
    } catch (err) {
        console.error("❌ Redis connection failed:", err);
        process.exit(1);
    }
}

connectRedis();

// Utility to get Redis channel for a room
export function getChannel(roomId) {
    return `clipboard:room:${roomId}`;
}
