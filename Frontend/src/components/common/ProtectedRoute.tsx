import React, { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Adjust path if needed
import { Navigate, useLocation } from 'react-router-dom';
import { AppRoles, AppUserRole } from '../../config/AppRoles'; // Import your AppRoles enum and derived AppUserRole type

interface ProtectedRouteProps {
    children: ReactNode;
    /**
     * An array of roles that are allowed to access this route.
     * If undefined or empty, any authenticated user might be allowed (depending on desired behavior).
     * If specific roles are listed, the user must have one of them.
     */
    rolesAllowed?: AppUserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, rolesAllowed }) => {
    const { isAuthenticated, user, isLoading } = useAuth();
    const location = useLocation();

    // Show a loading state while initial authentication status is being determined
    if (isLoading) {
        // Replace with your actual loading component or a simple div
        return <div>Loading authentication...</div>;
    }

    // If not authenticated, redirect to the login page
    // Pass the current location so we can redirect back after login
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If rolesAllowed is provided and has roles, check user's role
    if (rolesAllowed && rolesAllowed.length > 0) {
        if (!user?.role || !rolesAllowed.includes(user.role as AppUserRole)) {
            // User is authenticated but does not have any of the required roles
            // Redirect to a "forbidden" page, home page, or show an access denied message.
            // For now, redirecting to home and logging a warning.
            console.warn(
                `Access Denied: User with role '${user?.role}' attempted to access a route requiring one of [${rolesAllowed.join(', ')}]. Path: ${location.pathname}`
            );
            // You should ideally have a dedicated /forbidden or /unauthorized-access page
            return <Navigate to="/" state={{ error: "You do not have permission to access this page." }} replace />;
        }
    }
    // If rolesAllowed is not provided or is an empty array,
    // this component currently allows access as long as the user is authenticated.
    // You can add stricter logic here if an empty rolesAllowed array should deny access.

    // If authenticated and (no specific roles required OR user has an allowed role), render the children
    return <>{children}</>;
};

export default ProtectedRoute;