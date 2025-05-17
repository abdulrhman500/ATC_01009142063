import api from './api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  name: string;
}

interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  token: string;
}

const authService = {
  // Customer authentication
  loginCustomer: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // This would typically be a real API call
    // For now we'll return mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          user: {
            id: '1',
            name: credentials.email.split('@')[0],
            email: credentials.email,
            role: 'customer'
          },
          token: 'mock-jwt-token-for-customer'
        });
      }, 500);
    });
  },
  
  registerCustomer: async (data: RegisterData): Promise<AuthResponse> => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          user: {
            id: Math.random().toString(36).substring(2, 9),
            name: data.name,
            email: data.email,
            role: 'customer'
          },
          token: 'mock-jwt-token-for-customer'
        });
      }, 500);
    });
  },
  
  // Admin authentication
  loginAdmin: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          user: {
            id: '2',
            name: 'Admin User',
            email: credentials.email,
            role: 'admin'
          },
          token: 'mock-jwt-token-for-admin'
        });
      }, 500);
    });
  },
  
  registerAdmin: async (data: RegisterData): Promise<AuthResponse> => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          user: {
            id: Math.random().toString(36).substring(2, 9),
            name: data.name,
            email: data.email,
            role: 'admin'
          },
          token: 'mock-jwt-token-for-admin'
        });
      }, 500);
    });
  },
  
  // Logout (common for both roles)
  logout: async (): Promise<void> => {
    // Clear token from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  // Get current user profile
  getCurrentUser: async (): Promise<AuthResponse['user'] | null> => {
    // In a real app, we would validate the token with the server
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  }
};

export default authService;