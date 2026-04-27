import { describe, expect, it } from "vitest";
import { resolveCliInstallSourcePath } from "./cli-install-path";

describe("cli-install-path", () => {
  it("uses the packaged executable when isPackaged is true", () => {
    expect(
      resolveCliInstallSourcePath({
        isPackaged: true,
        executablePath: "/Applications/PolyHive.app/Contents/MacOS/PolyHive",
        shimPath: "/Applications/PolyHive.app/Contents/Resources/bin/polyhive",
      }),
    ).toBe("/Applications/PolyHive.app/Contents/MacOS/PolyHive");
  });

  it("falls back to the shim in development", () => {
    expect(
      resolveCliInstallSourcePath({
        isPackaged: false,
        executablePath: "/opt/PolyHive/polyhive",
        shimPath: "/opt/PolyHive/resources/bin/polyhive",
      }),
    ).toBe("/opt/PolyHive/resources/bin/polyhive");
  });
});
