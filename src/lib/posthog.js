import posthog from "posthog-js";

const apiKey = import.meta.env.VITE_POSTHOG_KEY;
const apiHost = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

if (apiKey) {
  posthog.init(apiKey, {
    api_host: apiHost,
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
    persistence: "localStorage",
    person_profiles: "identified_only",
    disable_session_recording: false,
  });
}

export { posthog };