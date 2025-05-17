import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../common/ThemeToggle';
import LanguageToggle from '../common/LanguageToggle';
import { Menu, User, LogOut } from 'lucide-react';

const AdminHeader: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };
  
  return (
    <header className="bg-bg-primary shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Menu Toggle */}
          <div className="flex items-center">
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-accent"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex-shrink-0 font-bold text-xl text-primary-600 ml-2 md:ml-0">
              {t('admin.dashboard')}
            </div>
          </div>
          
          {/* User Menu and Actions */}
          <div className="flex items-center">
            <ThemeToggle />
            <LanguageToggle />
            
            {/* User dropdown */}
            <div className="relative ml-4 rtl:mr-4 rtl:ml-0">
              <button
                type="button"
                className="flex items-center p-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <span className="sr-only">Open user menu</span>
                <User className="h-6 w-6 text-primary-600 bg-primary-100 dark:bg-primary-900 rounded-full p-0.5" />
              </button>
              
              {isMenuOpen && (
                <div className="origin-top-right absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-48 rounded-md shadow-lg bg-bg-primary border border-border ring-1 ring-black ring-opacity-5 z-10 animate-fade-in">
                  <div className="py-1 border-b border-border">
                    <div className="px-4 py-2">
                      <p className="text-sm font-medium text-text-primary">{user?.name}</p>
                      <p className="text-xs text-text-tertiary">{user?.email}</p>
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-left rtl:text-right text-text-primary hover:bg-bg-accent"
                    >
                      <LogOut className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
                      {t('auth.signOut')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;