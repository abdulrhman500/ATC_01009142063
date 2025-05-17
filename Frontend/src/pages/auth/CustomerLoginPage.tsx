import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Mail, Lock } from 'lucide-react';

const CustomerLoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = t('validation.required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('validation.invalidEmail');
    }
    
    if (!formData.password) {
      newErrors.password = t('validation.required');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setLoginError(null);
    
    try {
      await login(formData.email, formData.password, 'customer');
      navigate('/events');
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="card p-6 w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{t('auth.customerLogin')}</h1>
        <p className="text-text-tertiary mt-2">{t('common.appName')}</p>
      </div>
      
      {loginError && (
        <div className="bg-error-50 text-error-700 p-3 rounded-md mb-4 text-sm">
          {loginError}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          name="email"
          id="email"
          label={t('auth.email')}
          value={formData.email}
          onChange={handleChange}
          placeholder="your.email@example.com"
          error={errors.email}
          leftIcon={<Mail size={18} />}
          required
        />
        
        <Input
          type="password"
          name="password"
          id="password"
          label={t('auth.password')}
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          error={errors.password}
          leftIcon={<Lock size={18} />}
          required
        />
        
        <Button
          type="submit"
          loading={loading}
          className="w-full"
        >
          {t('auth.signIn')}
        </Button>
      </form>
      
      <div className="mt-6 text-center text-sm">
        <p className="text-text-secondary">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-primary-600 hover:underline font-medium">
            {t('auth.signUp')}
          </Link>
        </p>
      </div>
      
      <div className="mt-4 text-center">
        <Link to="/admin/login" className="text-text-tertiary text-sm hover:text-text-secondary">
          {t('auth.adminLogin')}
        </Link>
      </div>
    </div>
  );
};

export default CustomerLoginPage;