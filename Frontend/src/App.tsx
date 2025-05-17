import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from './contexts/ThemeContext';
import { useLanguage } from './contexts/LanguageContext';
import { useAuth } from './contexts/AuthContext';

// Layout components
import AdminLayout from './layouts/AdminLayout';
import CustomerLayout from './layouts/CustomerLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages for both roles
import NotFoundPage from './pages/common/NotFoundPage';
import SettingsPage from './pages/common/SettingsPage';

// Auth pages
import AdminLoginPage from './pages/auth/AdminLoginPage';
import AdminRegisterPage from './pages/auth/AdminRegisterPage';
import CustomerLoginPage from './pages/auth/CustomerLoginPage';
import CustomerRegisterPage from './pages/auth/CustomerRegisterPage';

// Customer pages
import EventsPage from './pages/customer/EventsPage';
import EventDetailsPage from './pages/customer/EventDetailsPage';
import BookingConfirmationPage from './pages/customer/BookingConfirmationPage';
import CustomerDashboardPage from './pages/customer/CustomerDashboardPage';

// Admin pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import EventManagementPage from './pages/admin/EventManagementPage';
import CategoryManagementPage from './pages/admin/CategoryManagementPage';

// Protected route component
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language, isRTL } = useLanguage();
  const { isAuthenticated, isAdmin, isCustomer } = useAuth();

  // Update document title based on language
  React.useEffect(() => {
    document.title = t('common.appName');
  }, [language, t]);

  return (
    <div className={`app ${isRTL ? 'rtl' : 'ltr'} theme-${theme}`}>
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<AuthLayout />}>
          <Route path="admin/login" element={<AdminLoginPage />} />
          <Route path="admin/register" element={
            <ProtectedRoute role="admin">
              <AdminRegisterPage />
            </ProtectedRoute>
          } />
          <Route path="login" element={<CustomerLoginPage />} />
          <Route path="register" element={<CustomerRegisterPage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboardPage />} />
          <Route path="events" element={<EventManagementPage />} />
          <Route path="categories" element={<CategoryManagementPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Customer Routes */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<Navigate to="/events" replace />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="events/:eventId" element={<EventDetailsPage />} />
          <Route path="booking-confirmation/:eventId" element={
            <ProtectedRoute role="customer">
              <BookingConfirmationPage />
            </ProtectedRoute>
          } />
          <Route path="dashboard" element={
            <ProtectedRoute role="customer">
              <CustomerDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;