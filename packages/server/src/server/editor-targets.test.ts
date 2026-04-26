import { describe, expect, it, vi } from "vitest";
import { listAvailableEditorTargets, openInEditorTarget } from "./editor-targets.js";

describe("editor-targets", () => {
  it("lists available editors in deterministic order", async () => {
    const available = new Set(["code", "cursor", "open", "webstorm"]);

    const editors = await listAvailableEditorTargets({
      platform: "darwin",
      findExecutable: (command) => (available.has(command) ? command : null),
    });

    expect(editors).toEqual([
      { id: "cursor", label: "Cursor" },
      { id: "vscode", label: "VS Code" },
      { id: "webstorm", label: "WebStorm" },
      { id: "finder", label: "Finder" },
    ]);
  });

  it("returns Finder on macOS", async () => {
    const editors = await listAvailableEditorTargets({
      platform: "darwin",
      findExecutable: (command) => (command === "open" ? "/usr/bin/open" : null),
    });

    expect(editors).toEqual([{ id: "finder", label: "Finder" }]);
  });

  it("launches editors as detached processes", async () => {
    const unref = vi.fn();
    const once = vi.fn((event: string, handler: () => void) => {
      if (event === "spawn") {
        queueMicrotask(handler);
      }
      return child;
    });
    const child = { once, unref };
    const spawn = vi.fn(() => child as any);

    await openInEditorTarget(
      {
        editorId: "vscode",
        path: "/tmp/repo",
      },
      {
        platform: "darwin",
        existsSync: () => true,
        findExecutable: (command) => (command === "code" ? "/usr/local/bin/code" : null),
        spawn,
      },
    );

    expect(spawn).toHaveBeenCalledWith("/usr/local/bin/code", ["/tmp/repo"], {
      detached: true,
      stdio: "ignore",
    });
    expect(unref).toHaveBeenCalled();
  });

  it("rejects relative paths", async () => {
    await expect(
      openInEditorTarget(
        {
          editorId: "cursor",
          path: "repo",
        },
        {
          existsSync: () => true,
          findExecutable: () => "/usr/local/bin/cursor",
        },
      ),
    ).rejects.toThrow("Editor target path must be an absolute local path");
  });

  it("rejects unknown editor ids", async () => {
    await expect(
      openInEditorTarget(
        {
          editorId: "unknown-editor",
          path: "/tmp/repo",
        },
        {
          existsSync: () => true,
          findExecutable: () => null,
        },
      ),
    ).rejects.toThrow("Unknown editor target: unknown-editor");
  });
});
