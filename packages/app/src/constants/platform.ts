import { isElectronRuntime, isElectronRuntimeMac } from "@/desktop/host";

/** Development build/runtime — true in Metro dev bundles, false in production. */
export const isDev = Boolean((globalThis as { __DEV__?: boolean }).__DEV__);

// ---------------------------------------------------------------------------
// Electron detection (cached — only caches `true`, keeps checking if false
// because the desktop bridge may load after initial module evaluation)
// ---------------------------------------------------------------------------

let _isElectronCached: boolean | null = null;
let _isElectronMacCached: boolean | null = null;

/** Running inside the Electron desktop wrapper (any OS). */
export function getIsElectron(): boolean {
  if (_isElectronCached === true) return true;
  const result = isElectronRuntime();
  if (result) _isElectronCached = true;
  return result;
}

/** Running inside the Electron desktop wrapper on macOS. */
export function getIsElectronMac(): boolean {
  if (_isElectronMacCached === true) return true;
  const result = isElectronRuntimeMac();
  if (result) _isElectronMacCached = true;
  return result;
}
