import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function RoleRoute({ allowedRole, redirectTo }) {
  const { profile, user } = useAuth();
  const allowed = Array.isArray(allowedRole) ? allowedRole : [allowedRole];

  // During the Base44 → Supabase bridge bootstrap there can be a short period
  // where the Base44 user is authenticated but the GymSync profile is not yet
  // available. Never bounce between / and /member in that state.
  if (!profile) {
    const intendedRole = sessionStorage.getItem("onboarding_role");
    const appRole = String(user?.app_role || intendedRole || "").toLowerCase();
    if (appRole === "owner") return <Navigate to="/onboarding" replace />;
    if (appRole === "member") return <Navigate to="/join-gym" replace />;
    return <Navigate to="/welcome" replace />;
  }

  return allowed.includes(profile.role) ? <Outlet /> : <Navigate to={redirectTo} replace />;
}