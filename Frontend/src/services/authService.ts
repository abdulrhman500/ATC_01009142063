// src/services/authService.ts

import api from './api'; // Your configured Axios instance

// Define UserRole type consistently for the frontend.
// This should match the string values your backend uses (e.g., 'admin', 'customer').
// You already have this in your AuthContext, ensure it's consistent or import from a shared frontend types file.
export type UserRole = 'admin' | 'customer' | null;

// Interface for user data received from the API
interface UserDataFromApi {
    id: string;
    username: string;
    email: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    fullName?: string; // Include if your backend DTO for user details provides this
    role: UserRole;   // Uses the frontend UserRole type
}

// Interface for the expected payload from login/register API calls
export interface AuthApiResponsePayload {
    user: UserDataFromApi;
    accessToken: string;
    tokenType: string;  // Should be "Bearer"
    expiresIn: number;  // Expiration time in seconds
}

// Interface for login credentials
export interface LoginCredentials {
    email?: string;
    username?: string; // Allow login with either email or username
    password: string;
}

// Interface for registration data (for customers)
export interface CustomerRegisterData {
    firstName: string;
    middleName?: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    // Role is typically NOT sent by client for public registration; backend assigns default
}

// Interface for admin registration data (payload for POST /auth/register/admin)
// Typically, an existing admin makes this call, and the backend assigns the ADMIN role.
export interface AdminRegisterData {
    firstName: string;
    middleName?: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    // Client does not specify the role here; backend /auth/register/admin endpoint sets it to ADMIN
}


const AUTH_API_PATH = '/auth'; // Relative to your axios baseURL (e.g., http://localhost:3000/api/v1)

const authService = {
    /**
     * Logs in a user (customer or admin). The backend determines the role.
     */
    login: async (credentials: LoginCredentials): Promise<AuthApiResponsePayload> => {
        try {
            const response = await api.post<{ statusCode: number, message: string, payload: AuthApiResponsePayload }>(
                `${AUTH_API_PATH}/login`,
                credentials
            );
            // Assuming backend wraps the actual DTO in a 'payload' field of ResponseEntity
            return response.data.payload;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data; // Re-throw structured error from backend
            }
            throw new Error(error.message || 'Login failed. Please check your credentials or try again later.');
        }
    },

    /**
     * Registers a new customer. Backend assigns default role (e.g., CUSTOMER).
     */
    registerCustomer: async (data: CustomerRegisterData): Promise<AuthApiResponsePayload> => {
        try {
            // Assuming your backend /auth/register for customers returns a similar payload
            // to login upon successful registration (e.g., for auto-login).
            // If it only returns user info without a token, adjust AuthApiResponsePayload for this method.
            const response = await api.post<{ statusCode: number, message: string, payload: AuthApiResponsePayload }>(
                `${AUTH_API_PATH}/register`,
                data
            );
            return response.data.payload;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw new Error(error.message || 'Registration failed. Please try again.');
        }
    },

    /**
     * Registers a new admin. This action must be performed by an already authenticated admin.
     * The calling context (e.g., an admin panel UI) must ensure an admin token is present.
     * The 'api' instance will automatically include the Authorization header if a token is in localStorage.
     */
    registerAdmin: async (data: AdminRegisterData): Promise<AuthApiResponsePayload> => {
        // This should call your specific backend endpoint for creating admins by an admin.
        // The backend endpoint will handle setting the role to ADMIN.
        try {
            const response = await api.post<{ statusCode: number, message: string, payload: AuthApiResponsePayload }>(
                `${AUTH_API_PATH}/register/admin`, // Endpoint for admin to register another admin
                data
            );
            return response.data.payload;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw new Error(error.message || 'Admin registration failed. Please try again.');
        }
    },

    logout: (): void => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // If your 'api' instance defaults Authorization header, you might want to clear it explicitly:
        // delete api.defaults.headers.common['Authorization'];
        // Or better, the request interceptor simply won't add it if 'token' is null.
        console.log("User logged out, local data and token cleared.");
    },

    getCurrentUser: (): UserDataFromApi | null => {
        const storedUser = localStorage.getItem('user');
        try {
            return storedUser ? JSON.parse(storedUser) as UserDataFromApi : null;
        } catch (e) {
            console.error("Failed to parse stored user data:", e);
            localStorage.removeItem('token'); // Also clear token if user data is corrupt
            localStorage.removeItem('user');
            return null;
        }
    }
};

export default authService;