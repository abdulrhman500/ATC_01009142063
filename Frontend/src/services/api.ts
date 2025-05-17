import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig, // Use this for the request interceptor config
  AxiosResponse,
  // AxiosRequestConfig, // No longer needed for the interceptor parameter here
  // RawAxiosRequestHeaders, // Not directly needed if using InternalAxiosRequestConfig
  // AxiosHeaders // Also not directly needed for setting Authorization
} from 'axios';

// Create a base axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1', // Ensure this correctly points to your API root
  headers: {
      'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => { // MODIFIED: Use InternalAxiosRequestConfig
      const token = localStorage.getItem('token');
      if (token) {
          // config.headers is guaranteed to exist on InternalAxiosRequestConfig
          config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
  },
  (error: AxiosError) => {
      // It's good practice to log or handle request setup errors if needed
      console.error('Axios request interceptor error:', error);
      return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
      const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

      if (error.response?.status === 401) {
          // Check if the 401 error did NOT originate from a login attempt
          if (originalRequest && !originalRequest.url?.endsWith('/auth/login')) {
              if (!originalRequest._retry) {
                  console.warn('Axios Interceptor: 401 on a protected route. Attempting to redirect to login.');
                  originalRequest._retry = true; // Mark to prevent potential redirect loops

                  // It's good practice to clear any stale auth data before redirecting
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  // If you have an AuthContext logout function that does more, consider how to call it here
                  // or ensure components listening to auth state react to localStorage changes if needed.

                  window.location.href = '/login'; // Redirect to login page
                  // To prevent the original promise from resolving/rejecting further and potentially
                  // causing issues in the component that made the call, you can return a new promise
                  // that never resolves, or a specific error indicating redirection.
                  // However, window.location.href will typically halt script execution for the current page.
                  return Promise.reject(new AxiosError("Session expired or unauthorized. Redirecting to login.", "ERR_REDIRECTING_TO_LOGIN", originalRequest, error.request, error.response));
              }
          } else if (originalRequest && originalRequest.url?.endsWith('/auth/login')) {
              // This 401 is from the login page itself (invalid credentials).
              // Do NOT redirect. Let the error propagate to the login form's error handling.
              console.log('Axios Interceptor: 401 on login attempt. Error will be handled by the caller.');
          }
      } else if (error.response?.status === 403) {
          console.error('Forbidden request (403):', error.response.data || error.message);
          // You might want to navigate to a '/forbidden' page or show a global notification
      } else if (error.response?.status && error.response.status >= 500) {
          console.error('Server error:', error.response.data || error.message);
          // Show a global toast/notification for server errors
      }

      // For 401s on /auth/login or any other errors, reject the promise
      // so that the calling service/component can handle it (e.g., authService -> AuthContext -> LoginPage)
      return Promise.reject(error);
  }
);

export default api;