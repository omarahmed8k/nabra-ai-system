/**
 * Utility functions for device detection
 */

export function isMobileDevice(): boolean {
  if (globalThis.window === undefined) return false;

  const userAgent = navigator.userAgent || "";

  // Check for mobile devices
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  if (mobileRegex.test(userAgent.toLowerCase())) {
    return true;
  }

  // Check for touch capability (not foolproof but helps)
  const hasTouchScreen = "maxTouchPoints" in navigator && navigator.maxTouchPoints > 0;

  // Check screen size as backup
  const isSmallScreen = globalThis.window.innerWidth <= 768;

  return hasTouchScreen && isSmallScreen;
}

export function isDesktopDevice(): boolean {
  return !isMobileDevice();
}

export function supportsDesktopNotifications(): boolean {
  if (globalThis.window === undefined) return false;

  // Check if Notification API is available
  if (!("Notification" in globalThis.window)) {
    return false;
  }

  // Desktop notifications don't work well on mobile Safari
  const isIOSMobile = /iphone|ipod|ipad/i.test(navigator.userAgent.toLowerCase());
  if (isIOSMobile) {
    return false;
  }

  // Android Chrome supports it but often disabled by default
  const isAndroidMobile = /android/i.test(navigator.userAgent.toLowerCase());
  if (isAndroidMobile && isMobileDevice()) {
    return false;
  }

  return true;
}

export function getBrowserName(): string {
  if (globalThis.window === undefined) return "unknown";

  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes("firefox")) return "Firefox";
  if (userAgent.includes("chrome") && !userAgent.includes("edg")) return "Chrome";
  if (userAgent.includes("safari") && !userAgent.includes("chrome")) return "Safari";
  if (userAgent.includes("edg")) return "Edge";
  if (userAgent.includes("opera") || userAgent.includes("opr")) return "Opera";

  return "Unknown";
}
