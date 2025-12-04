import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function AdminRoute({ children }) {
  // Simple guard: allow only when localStorage.isAdmin === 'true'
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const location = useLocation();

  if (isAdmin) return children;

  // If not admin, redirect to login, preserve attempted path
  return <Navigate to="/login" state={{ fromAdmin: false, attempted: location.pathname }} replace />;
}
