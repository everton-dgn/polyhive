export type BrowserDeviceType = "web" | "mobile";

interface DetectInput {
  userAgent: string;
  maxTouchPoints: number;
  userAgentData?: { mobile?: boolean };
}

const MOBILE_UA_PATTERN =
  /\b(mobile|android|iphone|ipad|ipod|opera mini|windows phone|blackberry|webos)\b/i;

// iPadOS 13+ spoofs the UA as "Macintosh" in desktop-request mode; the
// touch-point check keeps iPads on the mobile path.
function isTouchDesktopMode(userAgent: string, maxTouchPoints: number): boolean {
  return /Macintosh/.test(userAgent) && maxTouchPoints > 1;
}

export function detectBrowserDeviceType(input: DetectInput): BrowserDeviceType {
  if (input.userAgentData?.mobile === true) return "mobile";
  if (MOBILE_UA_PATTERN.test(input.userAgent)) return "mobile";
  if (isTouchDesktopMode(input.userAgent, input.maxTouchPoints)) return "mobile";
  return "web";
}

interface NavigatorLike {
  userAgent?: string;
  maxTouchPoints?: number;
  userAgentData?: { mobile?: boolean };
}

export function detectBrowserDeviceTypeFromNavigator(): BrowserDeviceType {
  if (typeof navigator === "undefined") return "web";
  const nav = navigator as NavigatorLike;
  return detectBrowserDeviceType({
    userAgent: nav.userAgent ?? "",
    maxTouchPoints: nav.maxTouchPoints ?? 0,
    userAgentData: nav.userAgentData,
  });
}
