/// <reference types="@rsbuild/core/types" />

interface ImportMetaEnv {
	readonly PUBLIC_APP_NAME: string;
	readonly PUBLIC_WORKER_URL: string;
	readonly PUBLIC_WORKER_ENTERPRISE_URL: string;
	readonly PUBLIC_POSTHOG_KEY: string;
	readonly PUBLIC_POSTHOG_HOST: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
