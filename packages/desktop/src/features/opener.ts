import { shell, ipcMain } from "electron";

export function registerOpenerHandlers(): void {
  ipcMain.handle("polyhive:opener:openUrl", async (_event, url: string) => {
    await shell.openExternal(url);
  });
}
