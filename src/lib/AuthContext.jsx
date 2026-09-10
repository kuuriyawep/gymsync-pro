import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getProfile } from "@/lib/supabaseAuth";
import { base44 } from "@/api/base44Client";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const authStateRef = useRef({ checked: false, authenticated: false });
  const authCheckRef = useRef(null);

  const loadSession = useCallback(async (session) => {
    setAuthError(null);
    const nextUser = session?.user || null;
    setUser(nextUser);
    setIsAuthenticated(Boolean(nextUser));
    authStateRef.current.authenticated = Boolean(nextUser);
    if (!nextUser) { setProfile(null); return; }
    try { setProfile(await getProfile(nextUser.id)); }
    catch (error) { setProfile(null); setAuthError({ type: "profile_error", message: error.message || "Unable to load your profile" }); }
  }, []);

  const checkUserAuth = useCallback(() => {
    if (authCheckRef.current) return authCheckRef.current;
    const check = (async () => {
      setIsLoadingAuth(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (data.session) {
          await loadSession(data.session);
        } else {
          const builder = await base44.auth.me();
          setUser(builder);
          setProfile({ id: builder.id, role: builder.role || "owner", gym_id: null });
          setIsAuthenticated(true);
          authStateRef.current.authenticated = true;
          setAuthError(null);
        }
      } catch (error) {
        if (!authStateRef.current.authenticated) {
          setUser(null); setProfile(null); setIsAuthenticated(false);
          setAuthError({ type: "auth_error", message: error.message || "Authentication failed" });
        }
      } finally {
        authStateRef.current.checked = true;
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    })();
    authCheckRef.current = check;
    check.finally(() => { if (authCheckRef.current === check) authCheckRef.current = null; });
    return check;
  }, [loadSession]);

  useEffect(() => {
    checkUserAuth();
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        loadSession(session).finally(() => { setIsLoadingAuth(false); setAuthChecked(true); });
        return;
      }
      if (event === "SIGNED_OUT" || !authStateRef.current.checked) checkUserAuth();
    });
    return () => listener.subscription.unsubscribe();
  }, [checkUserAuth, loadSession]);

  const logout = async (shouldRedirect = true) => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null); setIsAuthenticated(false);
    authStateRef.current = { checked: true, authenticated: false };
    if (shouldRedirect) window.location.href = "/welcome";
  };

  const navigateToLogin = () => { window.location.href = "/login"; };

  return <AuthContext.Provider value={{ user, profile, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, appPublicSettings: null, authChecked, logout, navigateToLogin, checkUserAuth, checkAppState: checkUserAuth }}>
    {children}
  </AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};