import * as Sentry from "@sentry/react";

const dsn = import.meta.env.VITE_SENTRY_DSN || "https://802a844ea86cf0bfa075c10b00e3a3e6@o4512133270863872.ingest.us.sentry.io/4512133350686721";

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: import.meta.env.MODE,
  sendDefaultPii: false,
  tracesSampleRate: 0.1,
});

export { Sentry };
