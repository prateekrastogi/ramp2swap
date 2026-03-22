type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

interface Env {
	MAIN_API: Fetcher;
}

interface ImportMetaEnv {
	readonly MAIN_API_LOCAL_ORIGIN?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

declare namespace App {
	interface Locals extends Runtime {}
}
