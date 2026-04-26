import { describe, expect, it } from "vitest";
import { detectBrowserDeviceType } from "./device-type";

interface DetectInput {
  userAgent: string;
  maxTouchPoints?: number;
  userAgentData?: { mobile?: boolean };
}

describe("detectBrowserDeviceType", () => {
  const MOBILE_BROWSER =
    "Mozilla/5.0 (Mobile) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/604.1";
  const TOUCH_DESKTOP_BROWSER =
    "Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";
  const DESKTOP_BROWSER =
    "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

  function detect({ userAgent, maxTouchPoints = 0, userAgentData }: DetectInput) {
    return detectBrowserDeviceType({ userAgent, maxTouchPoints, userAgentData });
  }

  it("reports mobile for mobile browser user agents", () => {
    expect(detect({ userAgent: MOBILE_BROWSER, maxTouchPoints: 5 })).toBe("mobile");
  });

  it("reports mobile for touch browsers that use desktop-style user agents", () => {
    expect(detect({ userAgent: TOUCH_DESKTOP_BROWSER, maxTouchPoints: 5 })).toBe("mobile");
  });

  it("reports mobile when userAgentData.mobile is true", () => {
    expect(
      detect({
        userAgent: DESKTOP_BROWSER,
        maxTouchPoints: 0,
        userAgentData: { mobile: true },
      }),
    ).toBe("mobile");
  });

  it("reports web for desktop browser user agents", () => {
    expect(detect({ userAgent: DESKTOP_BROWSER, maxTouchPoints: 0 })).toBe("web");
  });

  it("reports web when neither UA nor touch points indicate mobile", () => {
    expect(detect({ userAgent: "", maxTouchPoints: 0 })).toBe("web");
  });
});
