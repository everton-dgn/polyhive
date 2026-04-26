import { getDesktopHost } from "@/desktop/host";

export async function openExternalUrl(url: string): Promise<void> {
  const opener = getDesktopHost()?.opener?.openUrl;
  if (typeof opener === "function") {
    await opener(url);
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}
