// handleMessage.js
import { pub, sub, getChannel } from "../config/redis.js";
import { getSocketsInRoom } from "./rooms.js";
import { encrypt, decrypt } from "../crypto/encryption.js";

// Track subscribed rooms for Redis
const subscribedRooms = new Set();

/**
 * Handle messages from a WebSocket client
 * @param {WebSocket} ws - The client WebSocket
 * @param {Object} msg - Parsed JSON message
 */
export async function handleMessage(ws, msg) {
    if (!msg.type) return;

    switch (msg.type) {

        // ----- JOIN ROOM -----
        case "join":
            ws.roomId = msg.roomId;
            console.log(`Client joined room ${msg.roomId}`);
            subscribeToRoom(ws.roomId);
            break;

        // ----- CLIPBOARD UPDATE (text or file) -----
        case "clipboard:update":
            if (!ws.roomId) return;

            // Ensure payload is a JSON string before encryption
            const payloadStr = JSON.stringify(msg.payload);
            const encryptedPayload = encrypt(payloadStr);

            // 1️⃣ Publish to Redis for other server nodes
            await pub.publish(getChannel(ws.roomId), encryptedPayload);

            // 2️⃣ Send immediately to other clients in the same room on this server
            const sockets = getSocketsInRoom(ws.roomId);
            for (const client of sockets) {
                if (client !== ws && client.readyState === client.OPEN) {
                    client.send(JSON.stringify({
                        type: "clipboard:update",
                        payload: encryptedPayload
                    }));
                }
            }
            break;

        default:
            console.warn("Unknown message type:", msg.type);
    }
}

/**
 * Subscribe to Redis channel for a room
 * Broadcasts updates from other nodes to local clients
 * @param {string} roomId
 */
function subscribeToRoom(roomId) {
    if (subscribedRooms.has(roomId)) return; // already subscribed
    subscribedRooms.add(roomId);

    const channel = getChannel(roomId);

    sub.subscribe(channel, (message) => {
        try {
            const decryptedPayloadStr = decrypt(message);
            const payload = JSON.parse(decryptedPayloadStr);

            // Broadcast to all local clients in the room
            const sockets = getSocketsInRoom(roomId);
            for (const client of sockets) {
                if (client.readyState === client.OPEN) {
                    client.send(JSON.stringify({
                        type: "clipboard:update",
                        payload
                    }));
                }
            }

        } catch (err) {
            console.error("Error handling Redis message:", err.message);
        }
    });

    console.log(`Subscribed to Redis channel for room: ${roomId}`);
}
