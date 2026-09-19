import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { clearClientSessionState } from "@/lib/sessionCleanup";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [roles, setRoles] = useState([]);
  const [isLoadingRole, setIsLoadingRole] = useState(false);
  const [roleError, setRoleError] = useState(null);

  // Guards against a resolveRole() call from a superseded session finishing
  // after a newer one has already started (e.g. logout firing mid-request).
  const roleRequestId = useRef(0);

  // Resolve the authenticated user's business role from the actual profiles
  // row (RLS-scoped: a user may only read their own row) — never from a
  // client-supplied toggle. profiles.role/gym_id can only be written by the
  // trusted backend (complete_owner_onboarding, the join-gym function); a
  // direct client write is blocked by the profiles_prevent_role_escalation
  // trigger.
  const resolveRole = useCallback(async (userId) => {
    const requestId = ++roleRequestId.current;
    setIsLoadingRole(true);
    setRoleError(null);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, gym_id, staff_role, full_name, email")
        .eq("id", userId)
        .maybeSingle();

      if (requestId !== roleRequestId.current) return; // superseded
      if (error) throw error;

      setProfile(data ?? null);
      setRole(data?.role ?? null);
      setRoles(data?.role ? [data.role] : []);
    } catch (error) {
      if (requestId !== roleRequestId.current) return;
      setRoleError(error?.message || "Role resolution failed");
      setProfile(null);
      setRole(null);
      setRoles([]);
    } finally {
      if (requestId === roleRequestId.current) setIsLoadingRole(false);
    }
  }, []);

  const applySession = useCallback(async (session) => {
    if (!session?.user) {
      roleRequestId.current += 1; // invalidate any in-flight resolveRole
      setUser(null);
      setIsAuthenticated(false);
      setProfile(null);
      setRole(null);
      setRoles([]);
      setRoleError(null);
      return;
    }
    setUser(session.user);
    setIsAuthenticated(true);
    // Resolve the business role before auth loading completes so protected
    // routes never render with an unresolved role.
    await resolveRole(session.user.id);
  }, [resolveRole]);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      await applySession(data.session);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setProfile(null);
      setRole(null);
      setRoles([]);
      setAuthError({ type: "auth_error", message: error.message || "Authentication failed" });
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, [applySession]);

  useEffect(() => {
    checkUserAuth();

    // Keeps session/role in sync across sign-in, sign-out, token refresh, and
    // the redirect back into the app after an OAuth or email-link flow.
    // PASSWORD_RECOVERY also lands here and still updates user/session state
    // — ResetPassword decides what to render on its own, it doesn't depend on
    // being routed here first.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => listener?.subscription?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = useCallback(async () => {
    clearClientSessionState();
    roleRequestId.current += 1;
    setUser(null);
    setIsAuthenticated(false);
    setProfile(null);
    setRole(null);
    setRoles([]);
    setRoleError(null);
    setAuthError(null);
    setIsLoadingRole(false);
    await supabase.auth.signOut();
    window.location.href = "/welcome";
  }, []);

  const navigateToLogin = useCallback((nextUrl = "/") => {
    window.location.href = "/login" + (nextUrl && nextUrl !== "/" ? "?returnTo=" + encodeURIComponent(nextUrl) : "");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        roles,
        isAuthenticated,
        isLoadingAuth,
        isLoadingRole,
        roleError,
        isLoadingPublicSettings: false,
        authError,
        appPublicSettings: null,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState: checkUserAuth,
        reloadRole: () => (user ? resolveRole(user.id) : Promise.resolve()),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
