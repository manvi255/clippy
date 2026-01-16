// Manages sockets per room (in-memory)
const rooms = new Map(); // roomId -> Set<WebSocket>

export function addToRoom(roomId, ws) {
    if (!rooms.has(roomId)) rooms.set(roomId, new Set());
    rooms.get(roomId).add(ws);
}

export function removeFromRoom(roomId, ws) {
    if (rooms.has(roomId)) {
        rooms.get(roomId).delete(ws);
        if (rooms.get(roomId).size === 0) rooms.delete(roomId);
    }
}

export function getSocketsInRoom(roomId) {
    return rooms.get(roomId) || new Set();
}
