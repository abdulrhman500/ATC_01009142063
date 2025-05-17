import React, { useState, useEffect, ChangeEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { User as UserIcon, Mail, Lock, UserPlus, ArrowRight } from 'lucide-react';
import { CustomerRegisterData } from '../../services/authService';

interface AnimatedInputProps {
  label: string;
  type: string;
  id: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  autoComplete?: string;
  leftIcon?: React.ReactNode;
}

// Custom input component with CSS animations
const AnimatedInput: React.FC<AnimatedInputProps> = ({ 
  label, 
  type, 
  id, 
  name, 
  value, 
  onChange, 
  error, 
  required = false, 
  autoComplete, 
  leftIcon 
}) => {
  const [focused, setFocused] = useState(false);
  const [filled, setFilled] = useState(false);
  
  useEffect(() => {
    setFilled(!!value && value.length > 0);
  }, [value]);

  return (
    <div className="relative mb-2">
      <div 
        className={`absolute left-3 top-1/2 text-gray-400 transition-all duration-200 pointer-events-none
                  ${(focused || filled) ? '-translate-y-8 text-sm text-primary-600' : '-translate-y-1/2'}`}
      >
        {leftIcon && <span className="mr-2 inline-block">{leftIcon}</span>}
        {label} {required && '*'}
      </div>
      
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full px-4 py-4 ${leftIcon ? 'pl-10' : 'pl-4'} border-2 rounded-lg bg-gray-50 dark:bg-gray-800
                  transition-all duration-300 outline-none text-gray-800 dark:text-white
                  ${focused ? 'border-primary-500 shadow-md shadow-primary-100 dark:shadow-primary-900/20' : 
                            'border-gray-200 dark:border-gray-700'}
                  ${error ? 'border-red-500' : ''}`}
      />
      
      {leftIcon && (
        <span 
          className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200
                    ${focused ? 'text-primary-600 scale-110' : 'text-gray-400'}`}
        >
          {leftIcon}
        </span>
      )}
      
      {error && (
        <p className="text-red-500 text-xs mt-1 ml-1 animate-fadeIn">
          {error}
        </p>
      )}
    </div>
  );
};

interface AnimatedButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
}

// Custom animated button component
const AnimatedButton: React.FC<AnimatedButtonProps> = ({ 
  children, 
  loading = false, 
  disabled = false, 
  className = "", 
  type = "button", 
  onClick 
}) => {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`relative overflow-hidden flex items-center justify-center gap-2 py-3 px-6 
                rounded-lg font-medium text-white bg-gradient-to-r from-primary-600 to-primary-500
                hover:from-primary-500 hover:to-primary-400 disabled:opacity-70 
                disabled:from-gray-400 disabled:to-gray-500 transition-transform duration-200
                hover:scale-[1.02] active:scale-[0.98] ${className}`}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Processing...</span>
        </div>
      ) : (
        <>
          {children}
          <ArrowRight className="ml-1 h-4 w-4" />
        </>
      )}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-full bg-white opacity-20
                  ${loading ? 'animate-waveEffect' : ''}`}
      />
    </button>
  );
};

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

// Progress indicator component
const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="flex justify-center items-center mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <React.Fragment key={index}>
          <div 
            className={`h-3 w-3 rounded-full transition-all duration-500
                      ${currentStep > index ? 'bg-primary-500' : 'bg-gray-300'}
                      ${currentStep === index + 1 ? 'animate-pulse' : ''}`}
          />
          {index < totalSteps - 1 && (
            <div 
              className={`h-1 w-8 mx-1 transition-colors duration-500
                        ${currentStep > index + 1 ? 'bg-primary-500' : 'bg-gray-300'}`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const CustomerRegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { registerCustomer, isLoading, error: apiError, clearError, isAuthenticated } = useAuth();
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  const [formData, setFormData] = useState<CustomerRegisterData & { confirmPassword: string }>({
    firstName: '',
    middleName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof typeof formData, string>>>({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/events', { replace: true });
    }
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (formErrors[name as keyof typeof formData]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
    clearError();
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof typeof formData, string>> = {};
    
    if (step === 1) {
      // Step 1 validation (Personal Info)
      if (!formData.firstName.trim()) 
        newErrors.firstName = t('validation.firstNameRequired', 'First name is required.');
      else if (formData.firstName.trim().length < 2) 
        newErrors.firstName = t('validation.firstNameMinLength', 'First name must be at least 2 characters.');

      if (!formData.lastName.trim()) 
        newErrors.lastName = t('validation.lastNameRequired', 'Last name is required.');
      else if (formData.lastName.trim().length < 2) 
        newErrors.lastName = t('validation.lastNameMinLength', 'Last name must be at least 2 characters.');
    }
    
    if (step === 2) {
      // Step 2 validation (Account Details)
      const emailRegex = /\S+@\S+\.\S+/;
      const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
      
      if (!formData.username.trim()) 
        newErrors.username = t('validation.usernameRequired', 'Username is required.');
      else if (formData.username.trim().length < 3) 
        newErrors.username = t('validation.usernameMinLength', 'Username must be at least 3 characters.');
      else if (!usernameRegex.test(formData.username.trim())) 
        newErrors.username = t('validation.usernamePattern', 'Username can only contain letters, numbers, underscores, dots, and hyphens.');

      if (!formData.email.trim()) 
        newErrors.email = t('validation.emailRequired', 'Email is required.');
      else if (!emailRegex.test(formData.email.trim())) 
        newErrors.email = t('validation.invalidEmail', 'Invalid email format.');

      if (!formData.password) 
        newErrors.password = t('validation.passwordRequired', 'Password is required.');
      else if (formData.password.length < 8) 
        newErrors.password = t('validation.passwordMinLength', 'Password must be at least 8 characters.');

      if (!formData.confirmPassword) 
        newErrors.confirmPassword = t('validation.confirmPasswordRequired', 'Confirm password is required.');
      else if (formData.password !== formData.confirmPassword) 
        newErrors.confirmPassword = t('auth.passwordsDoNotMatch', 'Passwords do not match.');
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!validateStep(currentStep)) return;

    const registrationData: CustomerRegisterData = {
      firstName: formData.firstName.trim(),
      middleName: formData.middleName?.trim() || undefined,
      lastName: formData.lastName.trim(),
      username: formData.username.trim(),
      email: formData.email.trim(),
      password: formData.password,
    };

    const success = await registerCustomer(registrationData);

    if (success) {
      navigate('/events', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md relative overflow-hidden animate-fadeSlideUp">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary-100 dark:bg-primary-900/20 rounded-full -translate-y-20 translate-x-20 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-secondary-100 dark:bg-secondary-900/20 rounded-full translate-y-20 -translate-x-20 blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex justify-center mb-6 animate-iconEnter">
              <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-full">
                <UserPlus className="h-10 w-10 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            
            <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white mb-1 animate-fadeIn">
              {t('auth.createAccount', 'Create your account')}
            </h2>
            
            <p className="text-center text-gray-500 dark:text-gray-400 mb-6 animate-fadeIn animation-delay-200">
              {currentStep === 1 ? 'Start with your personal details' : 'Set up your login credentials'}
            </p>
            
            <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />

            {apiError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md animate-slideInLeft" role="alert">
                <p className="text-red-700 text-sm">{apiError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {currentStep === 1 && (
                <div className={`space-y-4 animate-slideInRight`}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <AnimatedInput
                      label={t('auth.firstName', 'First Name')}
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      error={formErrors.firstName}
                      required
                      autoComplete="given-name"
                      leftIcon={<UserIcon size={18} />}
                    />
                    
                    <AnimatedInput
                      label={t('auth.lastName', 'Last Name')}
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      error={formErrors.lastName}
                      required
                      autoComplete="family-name"
                      leftIcon={<UserIcon size={18} />}
                    />
                  </div>
                  
                  <AnimatedInput
                    label={t('auth.middleNameOptional', 'Middle Name (Optional)')}
                    type="text"
                    id="middleName"
                    name="middleName"
                    value={formData.middleName || ''}
                    onChange={handleChange}
                    error={formErrors.middleName}
                    autoComplete="additional-name"
                    leftIcon={<UserIcon size={18} />}
                  />
                  
                  <div className="pt-4">
                    <AnimatedButton
                      type="button"
                      onClick={nextStep}
                      className="w-full"
                    >
                      Continue to Account Setup
                    </AnimatedButton>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className={`space-y-4 animate-slideInRight`}>
                  <AnimatedInput
                    label={t('auth.username', 'Username')}
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    error={formErrors.username}
                    required
                    autoComplete="username"
                    leftIcon={<UserIcon size={18} />}
                  />
                  
                  <AnimatedInput
                    label={t('auth.email', 'Email address')}
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={formErrors.email}
                    required
                    autoComplete="email"
                    leftIcon={<Mail size={18} />}
                  />
                  
                  <AnimatedInput
                    label={t('auth.password', 'Password')}
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={formErrors.password}
                    required
                    autoComplete="new-password"
                    leftIcon={<Lock size={18} />}
                  />
                  
                  <AnimatedInput
                    label={t('auth.confirmPassword', 'Confirm Password')}
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={formErrors.confirmPassword}
                    required
                    autoComplete="new-password"
                    leftIcon={<Lock size={18} />}
                  />
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-5 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium 
                                hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200
                                hover:scale-[1.02] active:scale-[0.98] transition-transform"
                    >
                      Back
                    </button>
                    
                    <AnimatedButton
                      type="submit"
                      loading={isLoading}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {t('auth.registerButton', 'Create Account')}
                    </AnimatedButton>
                  </div>
                </div>
              )}
            </form>
            
            <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 animate-fadeIn animation-delay-300">
              {t('auth.alreadyHaveAccountPrompt', 'Already have an account?')}{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors">
                {t('auth.signInLink', 'Sign in')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerRegisterPage;