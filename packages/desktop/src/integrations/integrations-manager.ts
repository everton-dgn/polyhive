import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { app } from "electron";
import log from "electron-log/main";
import { resolveCliInstallSourcePath } from "./cli-install-path.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InstallStatus {
  installed: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SKILL_NAMES = [
  "polyhive",
  "polyhive-loop",
  "polyhive-handoff",
  "polyhive-orchestrator",
  "polyhive-chat",
  "polyhive-committee",
];

// ---------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------

async function pathOrSymlinkExists(p: string): Promise<boolean> {
  try {
    await fs.lstat(p);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

function getLocalBinDir(): string {
  return path.join(os.homedir(), ".local", "bin");
}

function getCliTargetPath(): string {
  return path.join(getLocalBinDir(), "polyhive");
}

function getBundledCliShimPath(): string {
  const electronExePath = app.getPath("exe");
  const appBundle = electronExePath.replace(/\/Contents\/MacOS\/.+$/, "");
  return path.join(appBundle, "Contents", "Resources", "bin", "polyhive");
}

function getBundledSkillsDir(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "skills");
  }
  return path.join(__dirname, "..", "..", "..", "..", "skills");
}

function getAgentsSkillsDir(): string {
  return path.join(os.homedir(), ".agents", "skills");
}

function getClaudeSkillsDir(): string {
  return path.join(os.homedir(), ".claude", "skills");
}

function getCodexSkillsDir(): string {
  return path.join(os.homedir(), ".codex", "skills");
}

// ---------------------------------------------------------------------------
// Shell PATH helpers
// ---------------------------------------------------------------------------

interface ShellRcInfo {
  shell: string;
  rcFile: string;
  pathCheckPattern: RegExp;
  exportLine: string;
}

function detectShellRcInfo(): ShellRcInfo | null {
  const shell = process.env.SHELL;
  if (!shell) return null;

  const shellName = path.basename(shell);

  if (shellName === "zsh") {
    return {
      shell: "zsh",
      rcFile: path.join(os.homedir(), ".zshrc"),
      pathCheckPattern: /\.local\/bin/,
      exportLine: 'export PATH="$HOME/.local/bin:$PATH"',
    };
  }

  if (shellName === "bash") {
    return {
      shell: "bash",
      rcFile: path.join(os.homedir(), ".bash_profile"),
      pathCheckPattern: /\.local\/bin/,
      exportLine: 'export PATH="$HOME/.local/bin:$PATH"',
    };
  }

  if (shellName === "fish") {
    return {
      shell: "fish",
      rcFile: path.join(os.homedir(), ".config", "fish", "config.fish"),
      pathCheckPattern: /\.local\/bin/,
      exportLine: "fish_add_path $HOME/.local/bin",
    };
  }

  return null;
}

function pathAlreadyContainsLocalBin(): boolean {
  const pathEnv = process.env.PATH ?? "";
  const localBin = path.join(os.homedir(), ".local", "bin");
  return pathEnv.split(path.delimiter).some((p) => p === localBin || p === "~/.local/bin");
}

async function ensurePathInShellRc(): Promise<{ shellUpdated: boolean }> {
  if (pathAlreadyContainsLocalBin()) {
    return { shellUpdated: false };
  }

  const info = detectShellRcInfo();
  if (!info) {
    return { shellUpdated: false };
  }

  try {
    const exists = await pathOrSymlinkExists(info.rcFile);
    if (exists) {
      const content = await fs.readFile(info.rcFile, "utf-8");
      if (info.pathCheckPattern.test(content)) {
        return { shellUpdated: false };
      }
    }

    await fs.mkdir(path.dirname(info.rcFile), { recursive: true });
    await fs.appendFile(info.rcFile, `\n# Added by PolyHive\n${info.exportLine}\n`);

    return { shellUpdated: true };
  } catch (err) {
    log.warn("[integrations] Failed to update shell rc file", { rcFile: info.rcFile, err });
    return { shellUpdated: false };
  }
}

// ---------------------------------------------------------------------------
// CLI Installation
// ---------------------------------------------------------------------------

export async function installCli(): Promise<InstallStatus> {
  const targetPath = getCliTargetPath();
  const shimPath = getBundledCliShimPath();
  const installSourcePath = resolveCliInstallSourcePath({
    isPackaged: app.isPackaged,
    executablePath: app.getPath("exe"),
    shimPath,
  });
  const binDir = getLocalBinDir();

  await fs.mkdir(binDir, { recursive: true });

  if (await pathOrSymlinkExists(targetPath)) {
    await fs.unlink(targetPath);
  }
  await fs.symlink(installSourcePath, targetPath);

  const { shellUpdated } = await ensurePathInShellRc();
  if (shellUpdated) {
    log.info("[integrations] Updated shell rc with ~/.local/bin PATH");
  }

  return getCliInstallStatus();
}

export async function getCliInstallStatus(): Promise<InstallStatus> {
  const targetPath = getCliTargetPath();
  return { installed: await pathOrSymlinkExists(targetPath) };
}

// ---------------------------------------------------------------------------
// Skills Installation
// ---------------------------------------------------------------------------

async function copySkillFile(
  sourceFile: string,
  destDir: string,
  skillName: string,
): Promise<void> {
  const destSkillDir = path.join(destDir, skillName);
  await fs.mkdir(destSkillDir, { recursive: true });
  await fs.copyFile(sourceFile, path.join(destSkillDir, "SKILL.md"));
}

async function symlinkSkillDir(
  skillName: string,
  targetDir: string,
  linkParentDir: string,
): Promise<void> {
  await fs.mkdir(linkParentDir, { recursive: true });
  const target = path.join(targetDir, skillName);
  const linkPath = path.join(linkParentDir, skillName);

  if (await pathOrSymlinkExists(linkPath)) {
    await fs.rm(linkPath, { recursive: true, force: true });
  }

  await fs.symlink(target, linkPath);
}

export async function installSkills(): Promise<InstallStatus> {
  const sourceDir = getBundledSkillsDir();
  const agentsDir = getAgentsSkillsDir();
  const claudeDir = getClaudeSkillsDir();
  const codexDir = getCodexSkillsDir();

  log.info("[integrations] installSkills", { sourceDir, agentsDir, claudeDir, codexDir });

  for (const skillName of SKILL_NAMES) {
    const sourceFile = path.join(sourceDir, skillName, "SKILL.md");
    await copySkillFile(sourceFile, agentsDir, skillName);
    await symlinkSkillDir(skillName, agentsDir, claudeDir);
    await copySkillFile(sourceFile, codexDir, skillName);
  }

  return getSkillsInstallStatus();
}

export async function getSkillsInstallStatus(): Promise<InstallStatus> {
  const claudeDir = getClaudeSkillsDir();
  for (const skillName of SKILL_NAMES) {
    const skillFile = path.join(claudeDir, skillName, "SKILL.md");
    try {
      await fs.access(skillFile);
    } catch {
      return { installed: false };
    }
  }
  return { installed: true };
}
