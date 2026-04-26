/**
 * Shortens a file path by replacing the home directory prefix with ~.
 * Handles macOS paths like `/Users/username`.
 */
export function shortenPath(path: string | undefined | null): string {
  if (!path) {
    return "";
  }
  return path.replace(/^\/(?:Users|home)\/[^/]+/, "~");
}
