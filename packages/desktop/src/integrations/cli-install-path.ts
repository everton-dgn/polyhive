export function resolveCliInstallSourcePath(input: {
  isPackaged: boolean;
  executablePath: string;
  shimPath: string;
}): string {
  return input.isPackaged ? input.executablePath : input.shimPath;
}
