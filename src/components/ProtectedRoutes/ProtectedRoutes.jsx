import { Navigate, Outlet } from "react-router-dom";

import { LoadingOverlay } from "../LoadingOverlay/LoadingOverlay.jsx";
import { useAuth } from "../AuthProvider/AuthContext";

export const ProtectedRoutes = () => {
  const { loading, user } = useAuth();

  if (loading) {
    return <LoadingOverlay />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
};
