type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

interface ImportMetaEnv {
  readonly PARTNER_API_BASE_URL?: string;
  readonly SESSION_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals extends Runtime {}
}
