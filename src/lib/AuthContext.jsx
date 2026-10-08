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

      let resolvedProfile = data ?? null;
      let resolvedRole = data?.role ?? null;

      // A member can already be linked in members even if an older auth flow
      // left profiles.gym_id empty or the profile row was not created yet.
      // Use the linked membership as a safe member-role fallback.
      if (!resolvedRole) {
        const { data: member } = await supabase
          .from("members")
          .select("id, gym_id, full_name, email")
          .eq("user_id", userId)
          .maybeSingle();

        if (member?.id) {
          resolvedRole = "member";
          resolvedProfile = {
            ...(data || {}),
            id: userId,
            role: "member",
            gym_id: member.gym_id,
            full_name: member.full_name || data?.full_name || null,
            email: member.email || data?.email || null,
          };
        }
      } else if (resolvedRole === "member" && !resolvedProfile.gym_id) {
        const { data: member } = await supabase
          .from("members")
          .select("gym_id, full_name, email")
          .eq("user_id", userId)
          .maybeSingle();

        if (member?.gym_id) {
          resolvedProfile = {
            ...resolvedProfile,
            gym_id: member.gym_id,
            full_name: member.full_name || resolvedProfile.full_name,
            email: member.email || resolvedProfile.email,
          };
        }
      }

      setProfile(resolvedProfile);
      setRole(resolvedRole);
      setRoles(resolvedRole ? [resolvedRole] : []);
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
    // Authentication is independent from business-role resolution. Do not
    // block the whole app on a profile query: ProtectedRoute only needs the
    // Supabase session, while RoleRoute can wait for/handle role resolution.
    // This prevents a transient RLS/network/profile error from trapping a
    // valid authenticated user on the login loading screen.
    void resolveRole(session.user.id);
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
