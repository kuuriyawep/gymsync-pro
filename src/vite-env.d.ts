/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE44_APP_ID?: string;
  readonly VITE_BASE44_FUNCTIONS_VERSION?: string;
  readonly VITE_BASE44_APP_BASE_URL?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_POSTHOG_KEY?: string;
  readonly MODE?: string;
  readonly DEV?: boolean;
  readonly PROD?: boolean;
  readonly SSR?: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}