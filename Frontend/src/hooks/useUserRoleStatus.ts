import { useAuth } from '../contexts/AuthContext'; // Adjust path to your AuthContext
// import { UserRoleStatus } from '../types/auth';   // Adjust path to your type definition
// Or if AppRoles enum is preferred for the return values:
import { AppRoles } from '../config/AppRoles';
// export type UserRoleStatus = AppRoles.Admin | AppRoles.Customer | 'guest';


/**
 * Custom hook to determine the current user's role status.
 * @returns {'admin' | 'customer' | 'guest'} The role status of the current user.
 */
export function useUserRoleStatus(): AppRoles | null {
    const { isAuthenticated, isAdmin, isCustomer, user } = useAuth();

    if (!isAuthenticated || !user) {
        return null;
    }

    // The isAdmin and isCustomer flags from your AuthContext already perform
    // the check against user.role.
    if (isAdmin) {
        return AppRoles.Admin;
    }

    if (isCustomer) {
        return AppRoles.Customer;
    }


    console.warn(`Authenticated user found with an unexpected role: ${user.role}`);
    return null; 
}