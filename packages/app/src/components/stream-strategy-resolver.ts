import type { ResolveStreamRenderStrategyInput, StreamStrategy } from "./stream-strategy";
import { createWebStreamStrategy } from "./stream-strategy-web";

export function resolveStreamRenderStrategy(
  input: ResolveStreamRenderStrategyInput,
): StreamStrategy {
  return createWebStreamStrategy({
    isMobileBreakpoint: input.isMobileBreakpoint,
  });
}
