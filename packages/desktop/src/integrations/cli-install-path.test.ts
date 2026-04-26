import { describe, expect, it } from "vitest";
import { resolveCliInstallSourcePath } from "./cli-install-path";

describe("cli-install-path", () => {
  it("uses the packaged executable when isPackaged is true", () => {
    expect(
      resolveCliInstallSourcePath({
        isPackaged: true,
        executablePath: "/Applications/Paseo.app/Contents/MacOS/Paseo",
        shimPath: "/Applications/Paseo.app/Contents/Resources/bin/paseo",
      }),
    ).toBe("/Applications/Paseo.app/Contents/MacOS/Paseo");
  });

  it("falls back to the shim in development", () => {
    expect(
      resolveCliInstallSourcePath({
        isPackaged: false,
        executablePath: "/opt/Paseo/paseo",
        shimPath: "/opt/Paseo/resources/bin/paseo",
      }),
    ).toBe("/opt/Paseo/resources/bin/paseo");
  });
});
