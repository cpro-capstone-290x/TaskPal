import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("authToken");

  // 🚫 If no token, send back to home (or login)
  if (!token) {
    alert("⚠️ Your session has expired. Please log in again.");
    return <Navigate to="/" replace />;
  }

  // ✅ If token exists, render the protected page
  return children;
};

export default ProtectedRoute;
