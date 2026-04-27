/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PASEO_WEB_APP_URL?: string;
  readonly VITE_PASEO_SITE_HOST?: string;
  readonly VITE_PASEO_GITHUB_REPO?: string;
  readonly VITE_PASEO_HOMEBREW_CASK_COMMAND?: string;
  readonly VITE_PASEO_CLI_INSTALL_COMMAND?: string;
  readonly VITE_PASEO_CLI_START_COMMAND?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
