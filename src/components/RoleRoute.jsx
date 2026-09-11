import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function RoleRoute({ allowedRole, redirectTo }) {
  const { profile } = useAuth();
  return profile?.role === allowedRole ? <Outlet /> : <Navigate to={redirectTo} replace />;
}