#!/usr/bin/env node
import WebSocket from "ws";
import clipboardy from "clipboardy";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { v4 as uuidv4 } from "uuid";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== CONFIG =====
const WS_SERVER = "wss://clippy-spt7.onrender.com";  // WebSocket server
const POLL_INTERVAL = 1000; // Clipboard poll interval (ms)
const ROOM_ID = process.argv[2] || uuidv4(); // Room UUID from CLI arg or generate new

console.log(`Using room: ${ROOM_ID}`);

// ===== STATE =====
let lastText = "";

// ===== WEBSOCKET CONNECTION =====
const ws = new WebSocket(WS_SERVER);

ws.on("open", () => {
    console.log("✅ Connected to server via WebSocket");

    // Join room
    ws.send(JSON.stringify({ type: "join", roomId: ROOM_ID }));
});

ws.on("message", async (data) => {
    try {
        const msg = JSON.parse(data.toString());
        if (!msg.payload) return;

        const payload = msg.payload;

        if (payload.type === "text") {
            // Update local clipboard
            clipboardy.writeSync(payload.data);
            console.log("📋 Received text:", payload.data);
        }

        if (payload.type === "file") {
            const { filename, data } = payload;
            const fileBuffer = Buffer.from(data, "base64");
            const savePath = path.join(process.cwd(), filename);
            fs.writeFileSync(savePath, fileBuffer);
            console.log("📁 Received file:", savePath);
        }
    } catch (err) {
        console.error("Error processing message:", err.message);
    }
});

// ===== AUTO SYNC TEXT CLIPBOARD =====
setInterval(() => {
    try {
        const text = clipboardy.readSync();
        if (text && text !== lastText) {
            lastText = text;
            ws.send(JSON.stringify({ type: "clipboard:update", payload: { type: "text", data: text } }));
            console.log("📤 Sent text:", text);
        }
    } catch (err) {
        // Clipboard may be temporarily locked
    }
}, POLL_INTERVAL);

// ===== FILE DETECTION USING CHILD PROCESS =====
function spawnFileWatcher() {
    const platform = process.platform;

    let child;
    if (platform === "win32") {
        child = spawn("powershell.exe", ["-File", path.join(__dirname, "child_windows.ps1")]);
    } else if (platform === "linux") {
        child = spawn("bash", [path.join(__dirname, "child_linux.sh")]);
    } else if (platform === "darwin") {
        child = spawn("bash", [path.join(__dirname, "child_mac.sh")]);
    }

    if (!child) return;

    child.stdout.on("data", async (data) => {
        const filePath = data.toString().trim();
        if (fs.existsSync(filePath)) {
            await sendFile(filePath);
        }
    });

    child.stderr.on("data", (err) => console.error("Child process error:", err.toString()));
}

spawnFileWatcher();

// ===== SEND FILE FUNCTION =====
async function sendFile(filePath) {
    const filename = path.basename(filePath);
    const fileBuffer = fs.readFileSync(filePath);

    const payload = { type: "file", filename, data: fileBuffer.toString("base64") };

    // Send via WebSocket
    ws.send(JSON.stringify({ type: "clipboard:update", payload }));
    console.log("📤 Sent file:", filename);

    // Optional: send via HTTP if needed
    /*
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath), filename);
    try {
      await axios.post(`${HTTP_SERVER}/file`, form, { headers: form.getHeaders() });
      console.log("📤 File sent via HTTP:", filename);
    } catch (err) {
      console.error("HTTP file send error:", err.message);
    }
    */
}

// ===== CLI ARG FOR MANUAL FILE SEND =====
const args = process.argv.slice(3);
if (args[0] === "send-file" && args[1]) {
    sendFile(args[1]);
}
