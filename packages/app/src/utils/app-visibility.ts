import { AppState } from "react-native";

export function getIsAppActivelyVisible(appState: string = AppState.currentState): boolean {
  if (appState !== "active") {
    return false;
  }

  const documentVisible = typeof document === "undefined" || document.visibilityState === "visible";
  const windowFocused =
    typeof document === "undefined" ||
    typeof document.hasFocus !== "function" ||
    document.hasFocus();

  return documentVisible && windowFocused;
}
