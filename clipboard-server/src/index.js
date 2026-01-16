import dotenv from "dotenv";
dotenv.config();

import { startWebSocketServer } from "./ws/server.js";

const PORT = process.env.PORT || 3000;

console.log(`✅ WebSocket gateway starting`);
startWebSocketServer(PORT);
