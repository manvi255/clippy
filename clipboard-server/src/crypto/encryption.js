import CryptoJS from "crypto-js";
import dotenv from "dotenv";
dotenv.config();

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

// Encrypt object to string
export function encrypt(payload) {
    const str = JSON.stringify(payload);
    return CryptoJS.AES.encrypt(str, SECRET_KEY).toString();
}

// Decrypt string to object
export function decrypt(cipherText) {
    try {
        const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (err) {
        console.error("❌ Decryption failed", err);
        return null;
    }
}
