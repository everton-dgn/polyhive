import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HostProfile } from "@/types/host-connection";

const openExternalUrlMock = vi.hoisted(() => vi.fn<(_: string) => Promise<void>>());

vi.mock("@/utils/open-external-url", () => ({
  openExternalUrl: openExternalUrlMock,
}));

import { useDownloadStore } from "./download-store";

function makeHostProfile(endpoint: string): HostProfile {
  return {
    serverId: "server-1",
    label: "server-1",
    lifecycle: {},
    connections: [{ id: `direct:${endpoint}`, type: "directTcp", endpoint }],
    preferredConnectionId: `direct:${endpoint}`,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}

describe("download-store", () => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;

  beforeEach(() => {
    useDownloadStore.setState({
      downloads: new Map(),
      activeDownloadId: null,
    });
    openExternalUrlMock.mockReset();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalDocument === undefined) {
      Reflect.deleteProperty(globalThis, "document");
    } else {
      globalThis.document = originalDocument;
    }

    if (originalWindow === undefined) {
      Reflect.deleteProperty(globalThis, "window");
    } else {
      globalThis.window = originalWindow;
    }
  });

  it("starts a browser download without embedding credentials in the URL", async () => {
    const click = vi.fn();
    const remove = vi.fn();
    const appendChild = vi.fn();
    const link = { href: "", download: "", rel: "", click, remove };
    globalThis.document = {
      createElement: vi.fn(() => link),
      body: { appendChild },
    } as unknown as Document;

    await useDownloadStore.getState().startDownload({
      serverId: "server-1",
      scopeId: "scope-1",
      fileName: "report.txt",
      path: "report.txt",
      daemonProfile: makeHostProfile("user:pass@daemon.test:6768"),
      requestFileDownloadToken: async () => ({
        token: "tok_123",
        fileName: "report.txt",
        mimeType: "text/plain",
        error: null,
      }),
    });

    const [download] = useDownloadStore.getState().downloads.values();
    expect(download?.status).toBe("complete");
    expect(click).toHaveBeenCalledOnce();
    expect(link.href).toBe("http://daemon.test:6768/api/files/download?token=tok_123");
    expect(link.download).toBe("report.txt");
    expect(link.href).not.toContain("user:pass@");
    expect(openExternalUrlMock).not.toHaveBeenCalled();
  });

  it("marks the download as error when the handoff cannot start", async () => {
    Reflect.deleteProperty(globalThis, "document");
    Reflect.deleteProperty(globalThis, "window");

    await useDownloadStore.getState().startDownload({
      serverId: "server-1",
      scopeId: "scope-1",
      fileName: "report.txt",
      path: "report.txt",
      daemonProfile: makeHostProfile("daemon.test:6768"),
      requestFileDownloadToken: async () => ({
        token: "tok_123",
        fileName: "report.txt",
        mimeType: "text/plain",
        error: null,
      }),
    });

    const [download] = useDownloadStore.getState().downloads.values();
    expect(download?.status).toBe("error");
    expect(download?.message).toBe("Download handoff is unavailable in this runtime.");
  });

  it("propagates openExternalUrl failures instead of marking complete", async () => {
    Reflect.deleteProperty(globalThis, "document");
    globalThis.window = {} as Window & typeof globalThis;
    openExternalUrlMock.mockRejectedValueOnce(new Error("handoff failed"));

    await useDownloadStore.getState().startDownload({
      serverId: "server-1",
      scopeId: "scope-1",
      fileName: "report.txt",
      path: "report.txt",
      daemonProfile: makeHostProfile("daemon.test:6768"),
      requestFileDownloadToken: async () => ({
        token: "tok_123",
        fileName: "report.txt",
        mimeType: "text/plain",
        error: null,
      }),
    });

    const [download] = useDownloadStore.getState().downloads.values();
    expect(openExternalUrlMock).toHaveBeenCalledWith(
      "http://daemon.test:6768/api/files/download?token=tok_123",
    );
    expect(download?.status).toBe("error");
    expect(download?.message).toBe("handoff failed");
  });

  it("uses a token-only URL in the external handoff path", async () => {
    Reflect.deleteProperty(globalThis, "document");
    globalThis.window = {} as Window & typeof globalThis;
    openExternalUrlMock.mockResolvedValueOnce(undefined);

    await useDownloadStore.getState().startDownload({
      serverId: "server-1",
      scopeId: "scope-1",
      fileName: "report.txt",
      path: "report.txt",
      daemonProfile: makeHostProfile("user:pass@daemon.test:6768"),
      requestFileDownloadToken: async () => ({
        token: "tok_123",
        fileName: "report.txt",
        mimeType: "text/plain",
        error: null,
      }),
    });

    const [download] = useDownloadStore.getState().downloads.values();
    expect(openExternalUrlMock).toHaveBeenCalledWith(
      "http://daemon.test:6768/api/files/download?token=tok_123",
    );
    expect(download?.status).toBe("complete");
  });
});
