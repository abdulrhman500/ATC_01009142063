import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from '../components/common/ThemeToggle';
import LanguageToggle from '../components/common/LanguageToggle';
import { useTranslation } from 'react-i18next';

const AuthLayout: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const { t } = useTranslation();
  
  // Redirect authenticated users to appropriate dashboard
  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin' : '/events'} replace />;
  }
  
  return (
    <div className="min-h-screen bg-bg-secondary flex flex-col">
      <header className="bg-bg-primary p-4 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary-600">{t('common.appName')}</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
      <footer className="bg-bg-primary p-4 text-center text-text-tertiary text-sm">
        <div className="container mx-auto">
          &copy; {new Date().getFullYear()} {t('common.appName')}
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;