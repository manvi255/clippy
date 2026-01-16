import { WebSocketServer } from "ws";
import { sub, getChannel } from "../config/redis.js";
import { addToRoom, removeFromRoom, getSocketsInRoom } from "./rooms.js";
import { handleMessage } from "./handlers.js";
import { decrypt } from "../crypto/encryption.js";

const subscribedRooms = new Set();

export function startWebSocketServer(port = 3000) {
    const wss = new WebSocketServer({ port });
    console.log(`✅ WebSocket Gateway listening on port ${port}`);

    async function subscribeRoom(roomId) {
        if (subscribedRooms.has(roomId)) return;

        await sub.subscribe(getChannel(roomId), message => {
            const payload = decrypt(message);
            if (!payload) return;

            for (const ws of getSocketsInRoom(roomId)) {
                if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(payload));
            }
        });

        subscribedRooms.add(roomId);
    }

    wss.on("connection", ws => {
        ws.on("message", async raw => {
            let msg;
            try {
                msg = JSON.parse(raw);
            } catch (err) {
                console.warn("Invalid JSON:", raw);
                return;
            }

            if (msg.type === "join") {
                ws.roomId = msg.roomId;
                addToRoom(msg.roomId, ws);
                await subscribeRoom(msg.roomId);
            }

            await handleMessage(ws, msg);
        });

        ws.on("close", () => {
            if (ws.roomId) removeFromRoom(ws.roomId, ws);
        });
    });
}
