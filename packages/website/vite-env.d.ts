/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POLYHIVE_WEB_APP_URL?: string;
  readonly VITE_POLYHIVE_SITE_HOST?: string;
  readonly VITE_POLYHIVE_GITHUB_REPO?: string;
  readonly VITE_POLYHIVE_HOMEBREW_CASK_COMMAND?: string;
  readonly VITE_POLYHIVE_CLI_INSTALL_COMMAND?: string;
  readonly VITE_POLYHIVE_CLI_START_COMMAND?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
