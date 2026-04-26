import { describe, expect, it } from "vitest";

import { buildStringCommandShellInvocation } from "./string-command-shell.js";

describe("buildStringCommandShellInvocation", () => {
  it("uses bash login-command semantics on unix platforms", () => {
    expect(
      buildStringCommandShellInvocation({
        command: 'echo "hello"',
      }),
    ).toEqual({
      shell: "/bin/bash",
      args: ["-lc", 'echo "hello"'],
    });
  });
});
