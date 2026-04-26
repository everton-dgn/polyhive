/**
 * Path utilities for cwd filtering in agent commands.
 */

/**
 * Check if `candidatePath` is the same directory as `basePath` or a descendant of it.
 *
 * Handles POSIX paths (forward-slash separators).
 */
export function isSameOrDescendantPath(basePath: string, candidatePath: string): boolean {
  // Strip trailing separator for consistent comparison.
  const normalizedBase = basePath.replace(/\/$/, "");
  const normalizedCandidate = candidatePath.replace(/\/$/, "");

  return (
    normalizedCandidate === normalizedBase || normalizedCandidate.startsWith(normalizedBase + "/")
  );
}
