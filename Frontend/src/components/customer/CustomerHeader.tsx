import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../common/ThemeToggle';
import LanguageToggle from '../common/LanguageToggle';
import { Search, User, LogOut, Menu } from 'lucide-react';
import Button from '../common/Button';

interface CustomerHeaderProps {
  onSearch?: (query: string) => void;
}

const CustomerHeader: React.FC<CustomerHeaderProps> = ({ onSearch }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <header className="bg-bg-primary shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Mobile Menu Toggle */}
          <div className="flex items-center">
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-accent"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
            <Link to="/" className="flex-shrink-0 font-bold text-xl text-primary-600 ml-2 md:ml-0">
              {t('common.appName')}
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex ml-6 rtl:mr-6 rtl:ml-0 space-x-4 rtl:space-x-reverse">
              <Link to="/events" className="nav-link">
                {t('events.title')}
              </Link>
              {isAuthenticated && (
                <Link to="/dashboard" className="nav-link">
                  {t('customer.dashboard')}
                </Link>
              )}
            </nav>
          </div>
          
          {/* Search, Theme Toggle, Language Toggle, and User Menu */}
          <div className="flex items-center">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="hidden md:flex relative mr-4 rtl:ml-4 rtl:mr-0">
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 lg:w-64 h-9 pl-9 rtl:pr-9 rtl:pl-3 pr-3 rounded-md border border-border bg-bg-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
              <Search size={16} className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 text-text-tertiary" />
            </form>
            
            <ThemeToggle />
            <LanguageToggle />
            
            {/* User Menu / Auth Buttons */}
            {isAuthenticated ? (
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
                        <p className="text-sm font-medium text-text-primary">{user?.fullName}</p>
                        <p className="text-xs text-text-tertiary">{user?.email}</p>
                      </div>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-text-primary hover:bg-bg-accent"
                      >
                        {t('common.settings')}
                      </Link>
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
            ) : (
              <div className="ml-4 rtl:mr-4 rtl:ml-0 flex space-x-2 rtl:space-x-reverse">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/login')}
                >
                  {t('common.login')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate('/register')}
                >
                  {t('common.register')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default CustomerHeader;