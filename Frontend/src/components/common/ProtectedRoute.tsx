import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  role?: UserRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const { isAuthenticated, isAdmin, isCustomer } = useAuth();
  const location = useLocation();

  // If not authenticated, redirect to appropriate login page
  if (!isAuthenticated) {
    return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} state={{ from: location }} replace />;
  }

  // If role is specified, check if user has the required role
  if (role === 'admin' && !isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role === 'customer' && !isCustomer) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // If all checks pass, render the children
  return <>{children}</>;
};

export default ProtectedRoute;