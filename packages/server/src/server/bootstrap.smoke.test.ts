import os from "node:os";
import path from "node:path";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import pino from "pino";
import { afterEach, describe, expect, test, vi } from "vitest";

import { createPolyHiveDaemon, parseListenString, type PolyHiveDaemonConfig } from "./bootstrap.js";
import { generateLocalPairingOffer } from "./pairing-offer.js";
import { createTestPolyHiveDaemon } from "./test-utils/polyhive-daemon.js";
import { createTestAgentClients } from "./test-utils/fake-agent-client.js";

describe("polyhive daemon bootstrap", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("starts and serves health endpoint", async () => {
    const daemonHandle = await createTestPolyHiveDaemon({
      openai: { apiKey: "test-openai-api-key" },
      speech: {
        providers: {
          dictationStt: { provider: "openai", explicit: true },
          voiceStt: { provider: "openai", explicit: true },
          voiceTts: { provider: "openai", explicit: true },
        },
      },
    });
    try {
      const response = await fetch(`http://127.0.0.1:${daemonHandle.port}/api/health`, {
        headers: daemonHandle.agentMcpAuthHeader
          ? { Authorization: daemonHandle.agentMcpAuthHeader }
          : undefined,
      });
      expect(response.ok).toBe(true);
      const payload = await response.json();
      expect(payload.status).toBe("ok");
      expect(typeof payload.timestamp).toBe("string");
    } finally {
      await daemonHandle.close();
    }
  });

  test("fails fast when OpenAI speech provider is configured without credentials", async () => {
    const polyhiveHomeRoot = await mkdtemp(path.join(os.tmpdir(), "polyhive-openai-config-"));
    const polyhiveHome = path.join(polyhiveHomeRoot, ".polyhive");
    const staticDir = await mkdtemp(path.join(os.tmpdir(), "polyhive-static-"));
    await mkdir(polyhiveHome, { recursive: true });

    const config: PolyHiveDaemonConfig = {
      listen: "127.0.0.1:0",
      polyhiveHome,
      corsAllowedOrigins: [],
      hostnames: true,
      mcpEnabled: false,
      staticDir,
      mcpDebug: false,
      agentClients: createTestAgentClients(),
      agentStoragePath: path.join(polyhiveHome, "agents"),
      relayEnabled: false,
      appBaseUrl: "https://app.polyhive.sh",
      openai: undefined,
      speech: {
        providers: {
          dictationStt: { provider: "openai", explicit: true },
          voiceStt: { provider: "openai", explicit: true },
          voiceTts: { provider: "openai", explicit: true },
        },
      },
    };

    try {
      await expect(createPolyHiveDaemon(config, pino({ level: "silent" }))).rejects.toThrow(
        "Missing OpenAI credentials",
      );
    } finally {
      await rm(polyhiveHomeRoot, { recursive: true, force: true });
      await rm(staticDir, { recursive: true, force: true });
    }
  });

  test("does not block daemon start on local speech model downloads", async () => {
    const originalFetch = globalThis.fetch;
    let releaseFetch: ((value: Response) => void) | null = null;
    const fetchGate = new Promise<Response>((resolve) => {
      releaseFetch = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(() => fetchGate),
    );

    const daemonHandle = await createTestPolyHiveDaemon({
      speech: {
        providers: {
          dictationStt: { provider: "local", explicit: true, enabled: true },
          voiceTurnDetection: { provider: "local", explicit: true, enabled: false },
          voiceStt: { provider: "local", explicit: true, enabled: false },
          voiceTts: { provider: "local", explicit: true, enabled: false },
        },
        local: {
          modelsDir: path.join(os.tmpdir(), `polyhive-missing-models-${Date.now()}`),
          models: {
            dictationStt: "parakeet-tdt-0.6b-v3-int8",
            voiceStt: "parakeet-tdt-0.6b-v3-int8",
            voiceTts: "kokoro-en-v0_19",
          },
        },
      },
    });

    try {
      const response = await originalFetch(`http://127.0.0.1:${daemonHandle.port}/api/health`);
      expect(response.ok).toBe(true);
    } finally {
      releaseFetch?.(
        new Response(null, {
          status: 500,
          statusText: "test cleanup",
        }),
      );
      await daemonHandle.close();
    }
  });

  test("parses whitespace-padded numeric port strings", () => {
    expect(parseListenString(" 6768 ")).toEqual({
      type: "tcp",
      host: "127.0.0.1",
      port: 6768,
    });
  });

  test("generates a relay pairing offer for unix socket listeners", async () => {
    const polyhiveHomeRoot = await mkdtemp(path.join(os.tmpdir(), "polyhive-socket-relay-"));
    const polyhiveHome = path.join(polyhiveHomeRoot, ".polyhive");
    const staticDir = await mkdtemp(path.join(os.tmpdir(), "polyhive-static-"));
    const socketPath = path.join(polyhiveHomeRoot, "run", "polyhive.sock");
    await mkdir(path.dirname(socketPath), { recursive: true });
    await mkdir(polyhiveHome, { recursive: true });
    const logger = pino({ level: "silent" });

    const config: PolyHiveDaemonConfig = {
      listen: socketPath,
      polyhiveHome,
      corsAllowedOrigins: [],
      hostnames: true,
      mcpEnabled: false,
      staticDir,
      mcpDebug: false,
      agentClients: createTestAgentClients(),
      agentStoragePath: path.join(polyhiveHome, "agents"),
      relayEnabled: true,
      relayEndpoint: "127.0.0.1:9",
      relayPublicEndpoint: "127.0.0.1:9",
      appBaseUrl: "https://app.polyhive.sh",
      openai: undefined,
      speech: undefined,
    };

    const daemon = await createPolyHiveDaemon(config, logger);

    try {
      await daemon.start();
      const pairing = await generateLocalPairingOffer({
        polyhiveHome,
        relayEnabled: true,
        relayEndpoint: "127.0.0.1:9",
        relayPublicEndpoint: "127.0.0.1:9",
        appBaseUrl: "https://app.polyhive.sh",
        includeQr: false,
      });
      expect(pairing.relayEnabled).toBe(true);
      expect(pairing.url?.startsWith("https://app.polyhive.sh/#offer=")).toBe(true);
    } finally {
      await daemon.stop().catch(() => undefined);
      await daemon.agentManager.flush().catch(() => undefined);
      await rm(polyhiveHomeRoot, { recursive: true, force: true });
      await rm(staticDir, { recursive: true, force: true });
    }
  });
});
