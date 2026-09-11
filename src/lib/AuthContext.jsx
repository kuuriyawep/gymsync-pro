import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { gymData, gymDataError } from "@/lib/gymDataClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);

  const loadBusinessProfile = useCallback(async () => {
    try {
      const result = await gymData("context");
      setProfile(result?.profile || null);
      return result?.profile || null;
    } catch (error) {
      // Authentication remains valid even when the Supabase bridge is not configured yet.
      // Business pages stay protected until a real GymSync profile is available.
      setProfile(null);
      if (/unauthorized/i.test(error?.message || "")) throw error;
      return null;
    }
  }, []);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const authenticated = await base44.auth.isAuthenticated();
      if (!authenticated) {
        setUser(null); setProfile(null); setIsAuthenticated(false);
      } else {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setIsAuthenticated(true);
        await loadBusinessProfile();
      }
    } catch (error) {
      setUser(null); setProfile(null); setIsAuthenticated(false);
      setAuthError({ type: "auth_error", message: gymDataError(error, "Authentication failed") });
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, [loadBusinessProfile]);

  useEffect(() => { checkUserAuth(); }, [checkUserAuth]);

  const logout = async () => { await base44.auth.logout("/welcome"); };
  const navigateToLogin = useCallback((nextUrl = "/") => { base44.auth.redirectToLogin(nextUrl); }, []);
  const checkAppState = useCallback(async () => { await checkUserAuth(); }, [checkUserAuth]);

  return <AuthContext.Provider value={{ user, profile, isAuthenticated, isLoadingAuth, isLoadingPublicSettings: false, authError, appPublicSettings: null, authChecked, logout, navigateToLogin, checkUserAuth, checkAppState, loadBusinessProfile }}>
    {children}
  </AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
