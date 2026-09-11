import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function AuthGateway() {
  const { isAuthenticated, navigateToLogin } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    const returnTo = safeReturnTo();
    if (isAuthenticated) navigate(returnTo, { replace: true });
    else navigateToLogin(returnTo);
  }, [isAuthenticated, navigate, navigateToLogin]);
  return <div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
}