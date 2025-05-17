import React, { useEffect } from 'react'; // Removed unused React from import
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from './contexts/ThemeContext';
import { useLanguage } from './contexts/LanguageContext';
// useAuth might not be directly needed in App.tsx if ProtectedRoute handles all auth logic
// import { useAuth } from './contexts/AuthContext';

// Layout components
import AdminLayout from './layouts/AdminLayout';
import CustomerLayout from './layouts/CustomerLayout';
import AuthLayout from './layouts/AuthLayout'; // For login, register pages

// Common Pages
import NotFoundPage from './pages/common/NotFoundPage';
import SettingsPage from './pages/common/SettingsPage';

// Auth pages
import LoginPage from './pages/auth/LoginPage';                 // Unified Login Page
import CustomerRegisterPage from './pages/auth/RegisterPage'; // Assuming this is for public customer registration
// import AdminRegisterPage from './pages/auth/AdminRegisterPage';     // For admins to register other admins

// Customer pages
import EventsPage from './pages/customer/EventsPage';
import EventDetailsPage from './pages/customer/EventDetailsPage';
import BookingConfirmationPage from './pages/customer/BookingConfirmationPage';
import CustomerDashboardPage from './pages/customer/CustomerDashboardPage';

// Admin pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
// import EventManagementPage from './pages/admin/EventManagementPage';
// import CategoryManagementPage from './pages/admin/CategoryManagementPage';

// Protected route component
import ProtectedRoute from './components/common/ProtectedRoute';
import { AppRoles } from './config/AppRoles'; // Import your role constants

function App() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { language, isRTL } = useLanguage();

    useEffect(() => {
        document.title = t('common.appName', 'Eventora'); // Provide a default app name
    }, [language, t]);

    return (
      <div className={`app min-h-screen ${isRTL ? 'rtl' : 'ltr'} theme-${theme} font-sans bg-background text-text-primary`}>
          <Routes>
              {/* Auth Routes Layout */}
              <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<CustomerRegisterPage />} />
              </Route>

              {/* Admin Routes */}
              <Route
                  path="/admin"
                  element={
                      <ProtectedRoute rolesAllowed={[AppRoles.Admin]}> {/* Use enum member */}
                          <AdminLayout />
                      </ProtectedRoute>
                  }
              >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboardPage />} />
                  {/* <Route path="events" element={<EventManagementPage />} /> */}
                  {/* <Route path="categories" element={<CategoryManagementPage />} /> */}
                  <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Customer and Public Routes */}
              <Route path="/" element={<CustomerLayout />}>
                  <Route index element={<Navigate to="/events" replace />} />
                  <Route path="events" element={<EventsPage />} />
                  <Route path="events/:eventId" element={<EventDetailsPage />} />
                  
                  <Route path="booking-confirmation/:bookingId" element={
                      <ProtectedRoute rolesAllowed={[AppRoles.Customer]}> {/* Use enum member */}
                          <BookingConfirmationPage />
                      </ProtectedRoute>
                  } />
                  <Route path="dashboard" element={
                      <ProtectedRoute rolesAllowed={[AppRoles.Customer]}> {/* Use enum member */}
                          <CustomerDashboardPage />
                      </ProtectedRoute>
                  } />
                  <Route path="settings" element={
                       <ProtectedRoute rolesAllowed={[AppRoles.Customer, AppRoles.Admin]}> {/* Example with multiple roles */}
                          <SettingsPage />
                      </ProtectedRoute>
                  } />
              </Route>

              {/* Fallback 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
          </Routes>
      </div>    );
}

export default App;