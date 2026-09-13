import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { invokeWithAuth } from "@/lib/invokeWithAuth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoadingRole, setIsLoadingRole] = useState(false);
  const [roleError, setRoleError] = useState(null);

  // Resolve the authenticated user's business role from actual backend data
  // (gym ownership, staff record, or linked member record) — never from a
  // client-supplied toggle or the Base44 built-in admin/user flag.
  const resolveRole = useCallback(async () => {
    setIsLoadingRole(true);
    setRoleError(null);
    try {
      const response = await invokeWithAuth("gymAccess", { operation: "resolveRole" });
      setRole(response.data?.role ?? null);
    } catch (error) {
      setRoleError(error?.response?.data?.error || error?.message || "Role resolution failed");
      setRole(null);
    } finally {
      setIsLoadingRole(false);
    }
  }, []);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const authenticated = await base44.auth.isAuthenticated();
      if (!authenticated) {
        setUser(null);
        setIsAuthenticated(false);
        setRole(null);
        setRoleError(null);
      } else {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setIsAuthenticated(true);
        // Resolve the business role before auth loading completes so that
        // protected routes never render with an unresolved role.
        await resolveRole();
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setRole(null);
      setAuthError({ type: "auth_error", message: error.message || "Authentication failed" });
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, [resolveRole]);

  useEffect(() => { checkUserAuth(); }, [checkUserAuth]);

  const logout = useCallback(async () => {
    setRole(null);
    setRoleError(null);
    base44.auth.logout("/welcome");
  }, []);

  const navigateToLogin = useCallback((nextUrl = "/") => {
    window.location.href = "/login" + (nextUrl && nextUrl !== "/" ? "?returnTo=" + encodeURIComponent(nextUrl) : "");
  }, []);

  const profile = user ? { id: user.id, role, gym_id: null } : null;

  return (
    <AuthContext.Provider value={{ user, profile, role, isAuthenticated, isLoadingAuth, isLoadingRole, roleError, isLoadingPublicSettings: false, authError, appPublicSettings: null, authChecked, logout, navigateToLogin, checkUserAuth, checkAppState: checkUserAuth, reloadRole: resolveRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};