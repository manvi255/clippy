import { v4 as uuidv4 } from "uuid";

// Generates a new key per room (placeholder for more secure rotation)
export function generateRoomKey() {
    return uuidv4(); // For production, use a secure key derivation
}

// Map roomId -> key (in-memory, optional Redis storage for persistence)
const roomKeys = new Map();

export function getRoomKey(roomId) {
    if (!roomKeys.has(roomId)) {
        roomKeys.set(roomId, generateRoomKey());
    }
    return roomKeys.get(roomId);
}
