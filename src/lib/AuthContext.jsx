import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getProfile } from "@/lib/supabaseAuth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const loadSession = useCallback(async (session) => {
    setAuthError(null);
    const nextUser = session?.user || null;
    setUser(nextUser);
    setIsAuthenticated(Boolean(nextUser));
    if (!nextUser) { setProfile(null); return; }
    try { setProfile(await getProfile(nextUser.id)); }
    catch (error) { setProfile(null); setAuthError({ type: "profile_error", message: error.message || "Unable to load your profile" }); }
  }, []);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      await loadSession(data.session);
    } catch (error) {
      setUser(null); setProfile(null); setIsAuthenticated(false);
      setAuthError({ type: "auth_error", message: error.message || "Authentication failed" });
    } finally { setIsLoadingAuth(false); setAuthChecked(true); }
  }, [loadSession]);

  useEffect(() => {
    checkUserAuth();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      loadSession(session).finally(() => { setIsLoadingAuth(false); setAuthChecked(true); });
    });
    return () => listener.subscription.unsubscribe();
  }, [checkUserAuth, loadSession]);

  const logout = async (shouldRedirect = true) => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null); setIsAuthenticated(false);
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
