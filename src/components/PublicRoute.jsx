// src/components/PublicRoute.jsx
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

const PublicRoute = ({ redirectTo = "/dashboard" }) => {
  const { isAuthenticated, loading } = useAuth();

  // While checking auth status, you can show nothing or a spinner
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // If already logged in → redirect away from login/register pages
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Not logged in → show the public page (login, register, forgot-password, etc.)
  return <Outlet />;
};

export default PublicRoute;