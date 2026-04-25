export function logError(context, error) {
  console.error("\n================ BOT ERROR ================");
  console.error("Context:", context);
  console.error("Message:", error?.message || error);
  if (error?.stack) console.error("Stack:", error.stack);
  console.error("==========================================\n");
}

export function logInfo(message) {
  console.log("[INFO]", message);
}

export function logWarn(message) {
  console.warn("[WARN]", message);
}
