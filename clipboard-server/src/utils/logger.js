export function logInfo(msg) {
    console.log(`ℹ️  ${new Date().toISOString()} - ${msg}`);
}

export function logError(msg, err) {
    console.error(`❌ ${new Date().toISOString()} - ${msg}`, err);
}
