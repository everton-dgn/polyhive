import os from "node:os";
import path from "node:path";
import { mkdir, mkdtemp, rm } from "node:fs/promises";

import pino from "pino";
import {
  createPolyHiveDaemon,
  type PolyHiveDaemonConfig,
  type PolyHiveOpenAIConfig,
  type PolyHiveSpeechConfig,
} from "../bootstrap.js";
import type { AgentClient, AgentProvider } from "../agent/agent-sdk-types.js";
import { createTestAgentClients } from "./fake-agent-client.js";

type TestPolyHiveDaemonOptions = {
  downloadTokenTtlMs?: number;
  corsAllowedOrigins?: string[];
  listen?: string;
  logger?: Parameters<typeof createPolyHiveDaemon>[1];
  relayEnabled?: boolean;
  relayEndpoint?: string;
  agentClients?: Partial<Record<AgentProvider, AgentClient>>;
  polyhiveHomeRoot?: string;
  staticDir?: string;
  cleanup?: boolean;
  openai?: PolyHiveOpenAIConfig;
  speech?: PolyHiveSpeechConfig;
  voiceLlmProvider?: PolyHiveDaemonConfig["voiceLlmProvider"];
  voiceLlmProviderExplicit?: boolean;
  voiceLlmModel?: string | null;
  dictationFinalTimeoutMs?: number;
};

export type TestPolyHiveDaemon = {
  config: PolyHiveDaemonConfig;
  daemon: Awaited<ReturnType<typeof createPolyHiveDaemon>>;
  port: number;
  polyhiveHome: string;
  staticDir: string;
  close: () => Promise<void>;
};

const TEST_DAEMON_START_TIMEOUT_MS = 20_000;

async function startDaemonWithTimeout(
  daemon: Awaited<ReturnType<typeof createPolyHiveDaemon>>,
  timeoutMs: number,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      const timeoutError = new Error(
        `Timed out starting test daemon after ${timeoutMs}ms`,
      ) as Error & { code?: string };
      timeoutError.code = "TEST_DAEMON_START_TIMEOUT";
      reject(timeoutError);
    }, timeoutMs);

    daemon.start().then(
      () => {
        clearTimeout(timeoutHandle);
        resolve();
      },
      (error) => {
        clearTimeout(timeoutHandle);
        reject(error);
      },
    );
  });
}

export async function createTestPolyHiveDaemon(
  options: TestPolyHiveDaemonOptions = {},
): Promise<TestPolyHiveDaemon> {
  const maxAttempts = 8;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const polyhiveHomeRoot =
      options.polyhiveHomeRoot ?? (await mkdtemp(path.join(os.tmpdir(), "polyhive-home-")));
    const polyhiveHome = path.join(polyhiveHomeRoot, ".polyhive");
    await mkdir(polyhiveHome, { recursive: true });
    const staticDir =
      options.staticDir ?? (await mkdtemp(path.join(os.tmpdir(), "polyhive-static-")));
    const listenHost = options.listen ?? "127.0.0.1";
    const config: PolyHiveDaemonConfig = {
      listen: `${listenHost}:0`,
      polyhiveHome,
      corsAllowedOrigins: options.corsAllowedOrigins ?? [],
      hostnames: true,
      mcpEnabled: true,
      staticDir,
      mcpDebug: false,
      agentClients: options.agentClients ?? createTestAgentClients(),
      agentStoragePath: path.join(polyhiveHome, "agents"),
      relayEnabled: options.relayEnabled ?? false,
      relayEndpoint: options.relayEndpoint ?? "relay.polyhive.sh:443",
      appBaseUrl: "https://app.polyhive.sh",
      openai: options.openai,
      speech: options.speech,
      voiceLlmProvider: options.voiceLlmProvider ?? null,
      voiceLlmProviderExplicit: options.voiceLlmProviderExplicit ?? false,
      voiceLlmModel: options.voiceLlmModel ?? null,
      dictationFinalTimeoutMs: options.dictationFinalTimeoutMs,
      downloadTokenTtlMs: options.downloadTokenTtlMs,
    };

    const logger = options.logger ?? pino({ level: "silent" });
    const daemon = await createPolyHiveDaemon(config, logger);
    try {
      await startDaemonWithTimeout(daemon, TEST_DAEMON_START_TIMEOUT_MS);
      const listenTarget = daemon.getListenTarget();
      if (!listenTarget || listenTarget.type !== "tcp") {
        throw new Error("Test daemon did not expose a bound TCP listen target");
      }

      const close = async (): Promise<void> => {
        await daemon.stop().catch(() => undefined);
        await daemon.agentManager.flush().catch(() => undefined);
        if (options.cleanup ?? true) {
          await new Promise((r) => setTimeout(r, 50));
          await rm(polyhiveHomeRoot, {
            recursive: true,
            force: true,
            maxRetries: 3,
            retryDelay: 100,
          });
          await rm(staticDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
        }
      };

      return {
        config,
        daemon,
        port: listenTarget.port,
        polyhiveHome,
        staticDir,
        close,
      };
    } catch (error) {
      lastError = error;
      await daemon.stop().catch(() => undefined);
      await rm(polyhiveHomeRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
      await rm(staticDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });

      if (
        (!isAddressInUseError(error) && !isStartupTimeoutError(error)) ||
        attempt === maxAttempts - 1
      ) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error("Failed to start test daemon");
}

function isAddressInUseError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const record = error as { code?: string };
  return record.code === "EADDRINUSE";
}

function isStartupTimeoutError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const record = error as { code?: string };
  return record.code === "TEST_DAEMON_START_TIMEOUT";
}
