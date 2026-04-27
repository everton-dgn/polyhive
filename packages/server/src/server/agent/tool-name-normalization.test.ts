import { describe, expect, it } from "vitest";

import { getPolyHiveToolLeafName, isPolyHiveToolName } from "./tool-name-normalization.js";

describe("isPolyHiveToolName", () => {
  it("detects Claude Code format", () => {
    expect(isPolyHiveToolName("mcp__polyhive__create_agent")).toBe(true);
    expect(isPolyHiveToolName("mcp__polyhive__list_agents")).toBe(true);
  });

  it("detects polyhive_voice variant", () => {
    expect(isPolyHiveToolName("mcp__polyhive_voice__create_agent")).toBe(true);
    expect(isPolyHiveToolName("polyhive_voice.create_agent")).toBe(true);
  });

  it("excludes speak tools", () => {
    expect(isPolyHiveToolName("mcp__polyhive_voice__speak")).toBe(false);
    expect(isPolyHiveToolName("mcp__polyhive__speak")).toBe(false);
    expect(isPolyHiveToolName("polyhive.speak")).toBe(false);
  });

  it("detects Codex dot format", () => {
    expect(isPolyHiveToolName("polyhive.create_agent")).toBe(true);
  });

  it("rejects non-polyhive tools", () => {
    expect(isPolyHiveToolName("Bash")).toBe(false);
    expect(isPolyHiveToolName("Read")).toBe(false);
    expect(isPolyHiveToolName("mcp__other_server__some_tool")).toBe(false);
  });
});

describe("getPolyHiveToolLeafName", () => {
  it("extracts leaf from Claude Code format", () => {
    expect(getPolyHiveToolLeafName("mcp__polyhive__create_agent")).toBe("create_agent");
  });

  it("extracts leaf from Codex format", () => {
    expect(getPolyHiveToolLeafName("polyhive.create_agent")).toBe("create_agent");
    expect(getPolyHiveToolLeafName("polyhive.list_agents")).toBe("list_agents");
  });

  it("returns null for non-polyhive tools", () => {
    expect(getPolyHiveToolLeafName("Bash")).toBeNull();
  });
});
