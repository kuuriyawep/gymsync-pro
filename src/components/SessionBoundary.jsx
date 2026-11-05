import { useEffect } from "react";
import { watchAuthUserChanges } from "@/lib/sessionCleanup";

/**
 * Keeps cached gym data tied to the authenticated account. Rendered once at the
 * app root; it renders nothing itself.
 */
export default function SessionBoundary({ children }) {
  useEffect(() => watchAuthUserChanges(), []);
  return children;
}