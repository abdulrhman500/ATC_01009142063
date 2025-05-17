import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, User as UserIcon, Lock, ArrowRight } from 'lucide-react';
import { LoginCredentials } from '../../services/authService';
import { AppRoles } from '../../config/AppRoles';
import { motion } from 'framer-motion'; // Added for animations

// Custom Input component with modern styling
const ModernInput: React.FC<{
  label: string;
  type: string;
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  error?: string;
  leftIcon?: React.ReactNode;
  required?: boolean;
  autoComplete?: string;
}> = ({ 
  label, 
  type, 
  id, 
  name, 
  value, 
  onChange, 
  placeholder, 
  error, 
  leftIcon, 
  required = false, 
  autoComplete 
}) => {
  return (
    <div className="relative space-y-2">
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        {label}
      </label>
      <div className="relative group">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className={`w-full py-3 pl-10 pr-4 bg-gray-50 border ${
            error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 
            'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
          } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
        />
      </div>
      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mt-1 text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

// Custom Button component with modern styling
const ModernButton: React.FC<{
  type?: "button" | "submit" | "reset";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ 
  type = "button", 
  loading = false, 
  disabled = false, 
  className = "", 
  children,
  onClick
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`relative flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      <span>{children}</span>
      {!loading && (
        <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
      )}
    </button>
  );
};

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isAdmin, isLoading, error, clearError } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Determine where to redirect after login
  const from = (location.state as any)?.from?.pathname || null;

  // Handle redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (from) {
        navigate(from, { replace: true });
      } else {
        navigate(isAdmin ? '/admin' : '/events', { replace: true });
      }
    }
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin, navigate, from]);

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdentifier(e.target.value);
    if (formErrors.identifier) {
      setFormErrors(prev => ({ ...prev, identifier: '' }));
    }
    clearError();
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (formErrors.password) {
      setFormErrors(prev => ({ ...prev, password: '' }));
    }
    clearError();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!identifier.trim()) {
      newErrors.identifier = t('validation.identifierRequired', 'Email or username is required.');
    }
    if (!password) {
      newErrors.password = t('validation.passwordRequired', 'Password is required.');
    } else if (password.length < 8) {
      newErrors.password = t('validation.passwordMinLength', 'Password must be at least 8 characters.');
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    clearError();
    if (!validateForm()) return;

    const credentials: LoginCredentials = identifier.includes('@')
      ? { email: identifier, password }
      : { username: identifier, password };

    const loginResult = await login(credentials);

    if (loginResult.success) {
      const redirectTo = from || (loginResult.role === AppRoles.Admin ? '/admin' : '/events');
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 sm:p-10 border border-gray-200 dark:border-gray-700">
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 -mt-10 -ml-10 h-32 w-32 rounded-full bg-primary-100 dark:bg-primary-900 opacity-20"></div>
          <div className="absolute bottom-0 right-0 -mb-10 -mr-10 h-32 w-32 rounded-full bg-primary-100 dark:bg-primary-900 opacity-20"></div>
          
          <div className="relative">
            {/* Brand logo placeholder - replace with your actual logo */}
            <div className="mx-auto w-14 h-14 flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
            
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t('auth.loginTitle', 'Welcome back')}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              {t('auth.signInPrompt', 'Sign in to your account to continue')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-5">
              <ModernInput
                label={t('auth.emailOrUsernameLabel', 'Email or Username')}
                type="text"
                id="identifier"
                name="identifier"
                value={identifier}
                onChange={handleIdentifierChange}
                placeholder={t('auth.emailOrUsernamePlaceholder', 'your@email.com or username')}
                error={formErrors.identifier}
                leftIcon={identifier.includes('@') ? <Mail size={18} /> : <UserIcon size={18} />}
                required
                autoComplete="username"
              />
              
              <ModernInput
                label={t('auth.passwordLabel', 'Password')}
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder={t('auth.passwordPlaceholder', '••••••••')}
                error={formErrors.password}
                leftIcon={<Lock size={18} />}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  {t('auth.rememberMe', 'Remember me')}
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors">
                  {t('auth.forgotPassword', 'Forgot password?')}
                </Link>
              </div>
            </div>

            {/* Display API error */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="rounded-md bg-red-50 dark:bg-red-900/20 p-4"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}

            <ModernButton
              type="submit"
              loading={isLoading}
              disabled={isLoading}
              className="w-full group"
            >
              {isLoading ? t('auth.loggingInButton', 'Signing in...') : t('auth.loginButton', 'Sign In')}
            </ModernButton>
          </form>

          <div className="mt-8 flex flex-col items-center space-y-6">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  {t('auth.orContinueWith', 'Or continue with')}
                </span>
              </div>
            </div>

            <div className="flex space-x-3">
              {/* Social login buttons */}
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.0001 2.00001C6.47793 2.00001 2.00006 6.47788 2.00006 12C2.00006 16.9913 5.65783 21.1283 10.4376 21.8785V14.8906H7.89941V12H10.4376V9.79688C10.4376 7.29063 11.9314 5.90626 14.2157 5.90626C15.3096 5.90626 16.4533 6.10157 16.4533 6.10157V8.56251H15.1922C13.9502 8.56251 13.5626 9.33335 13.5626 10.1242V12H16.3361L15.8936 14.8906H13.5626V21.8785C18.3423 21.1283 22.0001 16.9913 22.0001 12C22.0001 6.47788 17.5223 2.00001 12.0001 2.00001Z" />
                </svg>
              </button>
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.0001 12.2224C22.0001 11.4002 21.9329 10.8002 21.7985 10.178H12.0001V13.8891H17.6457C17.5441 14.8113 16.9569 16.178 15.7129 17.0669L15.6912 17.2091L18.9021 19.6224L19.1166 19.6446C21.1329 17.778 22.0001 15.2669 22.0001 12.2224Z" />
                  <path d="M12.0001 22.0001C14.9367 22.0001 17.3789 21.1112 19.1167 19.6446L15.7129 17.0669C14.8053 17.6679 13.5924 18.0891 12.0001 18.0891C9.13366 18.0891 6.70699 16.1779 5.84217 13.5112L5.70394 13.5224L2.36686 16.0224L2.32324 16.1557C4.04853 19.6224 7.7446 22.0001 12.0001 22.0001Z" />
                  <path d="M5.84217 13.5112C5.62937 12.8891 5.50961 12.2224 5.50961 11.5334C5.50961 10.8446 5.62937 10.1779 5.8293 9.55573L5.82278 9.4046L2.43842 6.86682L2.32325 6.91125C1.69492 8.33791 1.34277 9.89348 1.34277 11.5334C1.34277 13.1735 1.69492 14.7291 2.32325 16.1557L5.84217 13.5112Z" />
                  <path d="M12.0001 5.00004C13.6887 5.00004 14.9041 5.75573 15.5836 6.38907L18.6389 3.44462C17.3534 2.2668 14.9367 1.33348 12.0001 1.33348C7.7446 1.33348 4.04853 3.7113 2.32324 7.17797L5.8293 9.55573C6.70699 6.8891 9.13366 5.00004 12.0001 5.00004Z" />
                </svg>
              </button>
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M16.8033 3.63125C15.4568 3.57508 14.0343 4.15799 13.0966 5.11643C12.0966 6.13502 11.5164 7.52732 11.6724 8.88887C13.0217 8.92084 14.4008 8.33115 15.3683 7.37502C16.2935 6.35643 16.8685 4.97154 16.8033 3.63125ZM17.9599 9.56291C16.1383 9.49209 14.5087 10.5535 13.6685 10.5535C12.7856 10.5535 11.4087 9.6107 10.0037 9.64336C8.1981 9.67602 6.50727 10.7481 5.56404 12.4106C3.61831 15.7368 5.0431 20.6665 6.91727 23.321C7.85164 24.6271 8.95229 26.0866 10.392 26.0307C11.7631 25.9747 12.2964 25.0994 13.932 25.0994C15.5735 25.0994 16.0551 26.0307 17.5162 25.9979C19.0162 25.9653 19.9583 24.6665 20.892 23.3603C21.9599 21.8743 22.4045 20.4336 22.432 20.3214C22.3993 20.3072 19.467 19.1803 19.4337 15.8868C19.4068 13.1481 21.7568 11.8139 21.8854 11.728C20.5935 9.78272 18.5037 9.5934 17.9599 9.56291ZM27.4162 7.07997V24.4707H29.8045V18.2678H34.2308C38.2345 18.2678 40.7837 15.7779 40.7837 11.6723C40.7837 7.56674 38.2839 5.08027 34.3339 5.08027H29.8045V7.08087H29.8054L27.4162 7.07997ZM29.8045 16.2894V7.06809H33.9085C36.8122 7.06809 38.3185 8.70151 38.3185 11.6741C38.3185 14.6467 36.8122 16.2887 33.8877 16.2887H29.8045V16.2894ZM47.3368 24.6271C49.1033 24.6271 50.7033 23.7814 51.5431 22.4103H51.6208V24.4698H53.8516V15.2247C53.8516 12.3759 51.8172 10.663 48.6287 10.663C45.6989 10.663 43.5516 12.4071 43.4408 14.8651H45.5993C45.7854 13.6001 46.9041 12.8348 48.5475 12.8348C50.4533 12.8348 51.5308 13.6942 51.5308 15.3034V16.4303L47.9533 16.5983C44.6364 16.7662 42.9487 18.1694 42.9487 20.496C42.9487 22.8226 44.6516 24.6262 47.3368 24.6262V24.6271ZM47.9212 22.5053C46.1808 22.5053 45.2195 21.6921 45.2195 20.4429C45.2195 19.1614 46.1527 18.3968 47.992 18.2773L51.5316 18.1094V19.2363C51.5316 21.108 49.9583 22.5053 47.9212 22.5053ZM61.2993 24.871C64.6985 24.871 66.8775 22.5696 66.8775 19.4278V10.8633H64.5771V12.3803H64.4993C63.7962 11.2534 62.5485 10.6627 60.9904 10.6627C58.0762 10.6627 56.0002 12.9144 56.0002 16.3106C56.0002 19.7381 58.0518 21.9016 61.0368 21.9016C62.5329 21.9016 63.7485 21.3961 64.4356 20.3557H64.5287V19.4687C64.5287 17.607 63.3677 16.3412 61.5029 16.3412C60.1627 16.3412 59.2245 17.1058 58.9177 18.2647H56.6708C57.0229 16.0554 58.7895 14.871 61.2993 14.871V24.871ZM61.2837 19.7381C59.6477 19.7381 58.3845 18.3968 58.3845 16.3267C58.3845 14.2566 59.6641 12.9152 61.3001 12.9152C62.9516 12.9152 64.231 14.2879 64.231 16.3267C64.231 18.3655 62.9516 19.7381 61.2837 19.7381ZM72.5364 28.321C75.1029 28.321 76.4743 27.2255 77.5679 24.3447L82.9954 10.8633H80.4773L76.6745 21.2722H76.5968L72.7937 10.8633H70.2287L75.2362 23.47L75.002 24.1474C74.4383 25.6977 73.6735 26.324 72.262 26.324C72.0064 26.324 71.5685 26.296 71.3904 26.2632V28.2242C71.5514 28.2882 72.2079 28.321 72.5364 28.321Z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Registration link */}
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('auth.noAccountPrompt', "Don't have an account?")}{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-all duration-200 hover:underline">
              {t('auth.signUpLink', 'Create an account')}
            </Link>
          </p>
        </div>

        {/* Footer text */}
        <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          {t('auth.termsText', 'By signing in, you agree to our')}{' '}
          <Link to="/terms" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
            {t('auth.termsLink', 'Terms of Service')}
          </Link>{' '}
          {t('auth.andText', 'and')}{' '}
          <Link to="/privacy" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
            {t('auth.privacyLink', 'Privacy Policy')}
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;