import { contextBridge, ipcRenderer } from "electron";

type EventHandler = (payload: unknown) => void;

contextBridge.exposeInMainWorld("polyhiveDesktop", {
  platform: process.platform,
  invoke: (command: string, args?: Record<string, unknown>) =>
    ipcRenderer.invoke("polyhive:invoke", command, args),
  getPendingOpenProject: () =>
    ipcRenderer.invoke("polyhive:get-pending-open-project") as Promise<string | null>,
  events: {
    on: (event: string, handler: EventHandler): Promise<() => void> => {
      const listener = (_ipcEvent: Electron.IpcRendererEvent, payload: unknown) => {
        handler(payload);
      };
      ipcRenderer.on(`polyhive:event:${event}`, listener);
      return Promise.resolve(() => {
        ipcRenderer.removeListener(`polyhive:event:${event}`, listener);
      });
    },
  },
  window: {
    getCurrentWindow: () => ({
      toggleMaximize: () => ipcRenderer.invoke("polyhive:window:toggleMaximize"),
      isFullscreen: () => ipcRenderer.invoke("polyhive:window:isFullscreen"),
      updateWindowControls: (update: {
        height?: number;
        backgroundColor?: string;
        foregroundColor?: string;
      }) => ipcRenderer.invoke("polyhive:window:updateWindowControls", update),
      onResized: (handler: EventHandler): (() => void) => {
        const listener = (_ipcEvent: Electron.IpcRendererEvent, payload: unknown) => {
          handler(payload);
        };
        ipcRenderer.on("polyhive:window:resized", listener);
        return () => {
          ipcRenderer.removeListener("polyhive:window:resized", listener);
        };
      },
      setBadgeCount: (count?: number) => ipcRenderer.invoke("polyhive:window:setBadgeCount", count),
    }),
  },
  dialog: {
    ask: (message: string, options?: Record<string, unknown>) =>
      ipcRenderer.invoke("polyhive:dialog:ask", message, options),
    open: (options?: Record<string, unknown>) =>
      ipcRenderer.invoke("polyhive:dialog:open", options),
  },
  notification: {
    isSupported: () => ipcRenderer.invoke("polyhive:notification:isSupported"),
    sendNotification: (payload: { title: string; body?: string; data?: Record<string, unknown> }) =>
      ipcRenderer.invoke("polyhive:notification:send", payload),
  },
  opener: {
    openUrl: (url: string) => ipcRenderer.invoke("polyhive:opener:openUrl", url),
  },
  menu: {
    showContextMenu: (input?: Record<string, unknown>) =>
      ipcRenderer.invoke("polyhive:menu:showContextMenu", input),
  },
});
