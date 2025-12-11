// This file ensures SSE route is initialized
// Import this early in the app to register the SSE sender

if (globalThis.window === undefined) {
  // Server-side only
  try {
    console.log("🚀 Initializing notification system...");
    // Import the SSE route to trigger its module-level code
    await import("@/app/api/notifications/sse/route");
    console.log("✅ Notification system initialized");
  } catch (error) {
    console.error("❌ Failed to initialize notification system:", error);
  }
}

// Export to make this a module
export const initialized = true;
