import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import authService, {
    LoginCredentials,
    CustomerRegisterData, // Using the more specific type for customer registration
    AuthApiResponsePayload,
    // UserDataFromApi is implicitly used via AuthUser
} from '../services/authService'; // Adjust path if needed

// Define UserRole type consistently for the frontend.
// This should match the string values your backend uses (e.g., 'admin', 'customer').
export type UserRole = 'admin' | 'customer' | null;

// This User type is what your frontend components will primarily interact with via the context.
// It should align with the UserDataFromApi structure returned by your authService.
export interface AuthUser {
    id: string;
    username: string;
    email: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    fullName?: string; // If your backend DTO includes this
    role: UserRole;
}

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isCustomer: boolean;
    isLoading: boolean;
    error: string | null;
    login: (credentials: LoginCredentials) => Promise<{ success: boolean; role?: UserRole }>; // Returns success and role for redirection
    registerCustomer: (data: CustomerRegisterData) => Promise<boolean>; // Specifically for customer registration
    // registerAdmin: (data: AdminRegisterData) => Promise<boolean>; // TODO: Add if needed for admin panel
    logout: () => void;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true); // True initially to check localStorage
    const [error, setError] = useState<string | null>(null);

    // Effect to load user and token from localStorage on initial app load
    useEffect(() => {
        try {
            const storedToken = localStorage.getItem('token');
            const storedUserJson = localStorage.getItem('user');

            if (storedToken && storedUserJson) {
                const storedUser: AuthUser = JSON.parse(storedUserJson);
                setUser(storedUser);
                setToken(storedToken);
                // Axios interceptor in api.ts will pick up the token for subsequent requests
            }
        } catch (e) {
            console.error("Error parsing auth data from localStorage", e);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
        setIsLoading(false); // Finished initial auth check
    }, []);

    // Effect to update localStorage when user or token state changes
    useEffect(() => {
        if (user && token) {
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', token);
        } else {
            // If user or token is null, clear from localStorage (e.g., on logout)
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
    }, [user, token]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const login = async (credentials: LoginCredentials): Promise<{ success: boolean; role?: UserRole }> => {
        setIsLoading(true);
        setError(null);
        try {
            // authService.login makes the actual API call
            const response: AuthApiResponsePayload = await authService.login(credentials);
            setUser(response.user as AuthUser); // Cast as AuthUser if UserDataFromApi is compatible
            setToken(response.accessToken);
            setIsLoading(false);
            return { success: true, role: response.user.role };
        } catch (err: any) {
            const errorMessage = err.message || (err.errors && err.errors[0]?.msg) || 'Login failed. Please check credentials.';
            setError(errorMessage);
            setIsLoading(false);
            return { success: false };
        }
    };

    const registerCustomer = async (data: CustomerRegisterData): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            // authService.registerCustomer makes the actual API call
            // Assuming it returns token + user for auto-login upon successful registration
            const response: AuthApiResponsePayload = await authService.registerCustomer(data);
            setUser(response.user as AuthUser);
            setToken(response.accessToken);
            setIsLoading(false);
            return true;
        } catch (err: any) {
            const errorMessage = err.message || (err.errors && err.errors[0]?.msg) || 'Registration failed. Please try again.';
            setError(errorMessage);
            setIsLoading(false);
            return false;
        }
    };

    const logout = useCallback(() => {
        authService.logout(); // Clears localStorage
        setUser(null);
        setToken(null);
        setError(null);
        // Navigation after logout (e.g., to '/login') is typically handled by the component
        // that calls logout or by a ProtectedRoute.
    }, []);

    const isAuthenticated = !!user && !!token; // User is authenticated if both user object and token exist
    const isAdmin = user?.role === 'admin';
    const isCustomer = user?.role === 'customer';

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated,
            isAdmin,
            isCustomer,
            isLoading,
            error,
            login,
            registerCustomer, 
            logout,
            clearError
        }}>
            {children}
        </AuthContext.Provider>
    );
};