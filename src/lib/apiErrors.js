// Turns a failed request into a small, honest description the UI can act on.
// The point is to stop surfacing "not linked" for a network blip, and to stop
// offering a retry where retrying cannot help (an expired session needs a
// sign-in, not another request).
export const ERROR_KINDS = {
  auth: "auth",
  permission: "permission",
  notFound: "notFound",
  network: "network",
  server: "server",
  unknown: "unknown",
};

function statusOf(error) {
  const status = error?.status ?? error?.response?.status ?? error?.statusCode;
  return Number.isFinite(Number(status)) ? Number(status) : null;
}

function rawMessage(error) {
  return String(
    error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.data?.error ||
      error?.message ||
      ""
  ).trim();
}

export function apiErrorInfo(error) {
  const status = statusOf(error);
  const message = rawMessage(error);
  const lower = message.toLowerCase();

  const isAuth =
    status === 401 ||
    /authentication_required|jwt expired|invalid jwt|session (?:expired|missing)|sign in again|not authenticated/.test(lower);
  const isPermission = status === 403 || /permission|not allowed|forbidden|denied|only an? (?:owner|staff|member)/.test(lower);
  const isNotFound = status === 404 || /not found|no linked membership|member_not_found/.test(lower);
  const isNetwork = !status && /network|failed to fetch|timeout|offline|load failed|connection/.test(lower);

  if (isAuth) {
    return { kind: ERROR_KINDS.auth, status, message: message || "Your sign-in session has expired.", retryable: false };
  }
  if (isPermission) {
    return { kind: ERROR_KINDS.permission, status, message: message || "Your account does not have access to this.", retryable: false };
  }
  if (isNetwork) {
    return { kind: ERROR_KINDS.network, status, message: message || "You appear to be offline.", retryable: true };
  }
  if (isNotFound) {
    return { kind: ERROR_KINDS.notFound, status, message: message || "We could not find that record.", retryable: false };
  }
  if (status && status >= 500) {
    return { kind: ERROR_KINDS.server, status, message: message || "The server could not complete the request.", retryable: true };
  }
  return { kind: ERROR_KINDS.unknown, status, message: message || "Something went wrong.", retryable: true };
}

export function isSessionExpired(error) {
  return apiErrorInfo(error).kind === ERROR_KINDS.auth;
}