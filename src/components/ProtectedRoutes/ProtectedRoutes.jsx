import PropTypes from "prop-types";
import { Navigate, Outlet } from "react-router-dom";

import { LoadingOverlay } from "../LoadingOverlay/LoadingOverlay.jsx";
import { useAuth } from "../AuthProvider/AuthContext";

export const ProtectedRoutes = ({ role }) => {
  const { loading, user } = useAuth();

  if (loading) {
    return <LoadingOverlay />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/unauthorized" />;
  }

  return <Outlet />;
};

ProtectedRoutes.propTypes = {
  role: PropTypes.string,
};
