import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function RoleRoute({ allowedRole, redirectTo }) {
  const { profile } = useAuth();
  const allowed = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
  return allowed.includes(profile?.role) ? <Outlet /> : <Navigate to={redirectTo} replace />;
}
