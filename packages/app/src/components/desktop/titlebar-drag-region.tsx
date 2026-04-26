import { getIsElectronRuntime } from "@/constants/layout";

/**
 * VS Code-style titlebar drag region for Electron.
 *
 * Copied from VS Code at commit daa0a70:
 *   - titlebarPart.ts:463-464  → prepend(container, $('div.titlebar-drag-region'))
 *   - titlebarpart.css:57-64   → position: absolute, full size, -webkit-app-region: drag
 *
 * VS Code's drag region is a static DOM element — no z-index, no pointer-events,
 * no state, no event listeners. Interactive elements get no-drag from their own
 * CSS (global backstop in index.html). The drag region never re-renders.
 *
 * On macOS, Electron handles edge resize natively, so no resizer is needed.
 */

/**
 * Static drag overlay. Returns null on non-Electron.
 * Place as FIRST child of any positioned container that should be draggable.
 */
export function TitlebarDragRegion() {
  if (!getIsElectronRuntime()) {
    return null;
  }

  return (
    <div
      style={{
        top: 0,
        left: 0,
        display: "block",
        position: "absolute",
        width: "100%",
        height: "100%",
        // @ts-expect-error — WebkitAppRegion is not in CSSProperties
        WebkitAppRegion: "drag",
      }}
    />
  );
}
