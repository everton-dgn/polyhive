export interface BuildStringCommandShellInvocationOptions {
  command: string;
}

export interface StringCommandShellInvocation {
  shell: string;
  args: string[];
}

export function buildStringCommandShellInvocation(
  options: BuildStringCommandShellInvocationOptions,
): StringCommandShellInvocation {
  return {
    shell: "/bin/bash",
    args: ["-lc", options.command],
  };
}
