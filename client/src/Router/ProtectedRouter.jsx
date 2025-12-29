import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AdminLayout from "../layouts/AdminLayout";
import DoctorLayout from "../layouts/DoctorLayout";
import ReceptionLayout from "../layouts/ReceptionLayout";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <div>Đang tải...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user?.role_name?.toLowerCase();

  // Check if user has permission to access this route
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  // Select appropriate layout based on user role
  const LayoutComponent = (() => {
    switch (userRole) {
      case "admin":
        return AdminLayout;
      case "doctor":
        return DoctorLayout;
      case "receptionist":
        return ReceptionLayout;
      default:
        return AdminLayout;
    }
  })();

  return <LayoutComponent>{children}</LayoutComponent>;
};

export default ProtectedRoute;