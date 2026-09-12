import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabaseClient";
import { clearSupabaseAccessToken } from "@/lib/invokeWithAuth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      // Check Supabase auth first (used by the app's Login/Register pages)
      const { data: supabaseData } = await supabase.auth.getUser();
      if (supabaseData?.user) {
        setUser(supabaseData.user);
        setProfile({ id: supabaseData.user.id, role: "owner", gym_id: null });
        setIsAuthenticated(true);
        return;
      }
      // Fall back to base44 platform auth (builder / platform users)
      const authenticated = await base44.auth.isAuthenticated();
      if (!authenticated) {
        setUser(null); setProfile(null); setIsAuthenticated(false);
      } else {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setProfile({ id: currentUser.id, role: currentUser.role === "admin" ? "owner" : "member", gym_id: null });
        setIsAuthenticated(true);
      }
    } catch (error) {
      setUser(null); setProfile(null); setIsAuthenticated(false);
      setAuthError({ type: "auth_error", message: error.message || "Authentication failed" });
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => { checkUserAuth(); }, [checkUserAuth]);

  // Keep auth state in sync when Supabase session changes (login/logout/register)
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      clearSupabaseAccessToken();
      checkUserAuth();
    });
    return () => listener?.subscription?.unsubscribe();
  }, [checkUserAuth]);

  const logout = async () => {
    await supabase.auth.signOut();
    clearSupabaseAccessToken();
    await base44.auth.logout("/welcome");
  };
  const navigateToLogin = useCallback((nextUrl = "/") => { base44.auth.redirectToLogin(nextUrl); }, []);

  return <AuthContext.Provider value={{ user, profile, isAuthenticated, isLoadingAuth, isLoadingPublicSettings: false, authError, appPublicSettings: null, authChecked, logout, navigateToLogin, checkUserAuth, checkAppState: checkUserAuth }}>
    {children}
  </AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};