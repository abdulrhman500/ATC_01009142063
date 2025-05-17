import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Create a base axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Handle unauthorized errors (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Could implement token refresh logic here
      originalRequest._retry = true;
      
      // For now, just redirecting to login on 401
      // You could also dispatch a logout action or emit an event
      window.location.href = '/login';
    }
    
    // Handle forbidden errors (403)
    if (error.response?.status === 403) {
      console.error('Forbidden request:', error.response);
      // Handle forbidden access - perhaps redirect to an access denied page
    }
    
    // Handle server errors (500, etc)
    if (error.response?.status && error.response.status >= 500) {
      console.error('Server error:', error.response);
      // Show a toast or notification about server error
    }
    
    return Promise.reject(error);
  }
);

export default api;