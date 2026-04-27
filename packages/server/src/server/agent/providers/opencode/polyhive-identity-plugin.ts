import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

export const POLYHIVE_IDENTITY_PLUGIN_FILE = "polyhive-identity-plugin.mjs";

export const POLYHIVE_IDENTITY_PLUGIN_ID = "polyhive-identity";

export const POLYHIVE_SESSION_MAP_ENV_VAR = "POLYHIVE_OPENCODE_SESSION_MAP_PATH";

export const POLYHIVE_IDENTITY_PLUGIN_SOURCE = `// PolyHive identity plugin for OpenCode.
// Auto-installed by the PolyHive daemon. Do not edit manually — changes will be overwritten.
//
// Injects POLYHIVE_AGENT_ID into the shell environment of every tool call based on
// the OpenCode sessionID reported by the runtime. The mapping is maintained by
// the PolyHive daemon at the file named in ${POLYHIVE_SESSION_MAP_ENV_VAR}.

import { existsSync, readFileSync, statSync } from "node:fs";

const SESSION_MAP_PATH = process.env.${POLYHIVE_SESSION_MAP_ENV_VAR} ?? "";

let cached = { mtimeMs: 0, map: /** @type {Record<string, string>} */ ({}) };

function readMap() {
  if (!SESSION_MAP_PATH) return {};
  try {
    if (!existsSync(SESSION_MAP_PATH)) return {};
    const stat = statSync(SESSION_MAP_PATH);
    if (stat.mtimeMs === cached.mtimeMs) return cached.map;
    const parsed = JSON.parse(readFileSync(SESSION_MAP_PATH, "utf8"));
    const map = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    cached = { mtimeMs: stat.mtimeMs, map };
    return map;
  } catch {
    return cached.map;
  }
}

function resolveAgentId(sessionId) {
  if (!sessionId) return undefined;
  const value = readMap()[sessionId];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

// File-loaded OpenCode plugins must export an "id" so the runtime loader can
// register them. Both the named export and the PluginModule-shaped default
// export are provided to be compatible with either resolver path.
export const id = "${POLYHIVE_IDENTITY_PLUGIN_ID}";

export const server = async () => {
  return {
    "shell.env": async (input, output) => {
      const agentId = resolveAgentId(input?.sessionID);
      if (agentId) {
        output.env.POLYHIVE_AGENT_ID = agentId;
      }
    },
  };
};

export default { id, server };
`;

export interface InstalledIdentityPlugin {
  filePath: string;
  fileUrl: string;
}

export function installIdentityPlugin(polyhiveHome: string): InstalledIdentityPlugin {
  const filePath = join(polyhiveHome, POLYHIVE_IDENTITY_PLUGIN_FILE);
  mkdirSync(dirname(filePath), { recursive: true });

  let existing: string | null = null;
  try {
    existing = readFileSync(filePath, "utf8");
  } catch {
    existing = null;
  }

  if (existing !== POLYHIVE_IDENTITY_PLUGIN_SOURCE) {
    writeFileSync(filePath, POLYHIVE_IDENTITY_PLUGIN_SOURCE, "utf8");
  }

  return {
    filePath,
    fileUrl: pathToFileURL(filePath).href,
  };
}

// Builds the OPENCODE_CONFIG_CONTENT payload for the spawned `opencode serve`.
//
// We only inject our plugin URL — OpenCode merges this `plugin` array with the
// arrays declared in the project's ./opencode.json and the user's global
// config (~/.config/opencode/opencode.json), so the user's existing plugins
// (e.g. qwen-auth, rtk) keep loading untouched.
export function buildOpenCodeServerConfig(pluginFileUrl: string): { plugin: string[] } {
  return { plugin: [pluginFileUrl] };
}
