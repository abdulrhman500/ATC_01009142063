import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const CustomerRegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }

    try {
      await register(formData);
      navigate('/events');
    } catch (err) {
      setError(t('auth.registrationFailed'));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('auth.createAccount')}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <Input
              id="name"
              name="name"
              type="text"
              required
              placeholder={t('auth.fullName')}
              value={formData.name}
              onChange={handleChange}
              className="rounded-t-md"
            />
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder={t('auth.email')}
              value={formData.email}
              onChange={handleChange}
            />
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder={t('auth.password')}
              value={formData.password}
              onChange={handleChange}
            />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              placeholder={t('auth.confirmPassword')}
              value={formData.confirmPassword}
              onChange={handleChange}
              className="rounded-b-md"
            />
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
            >
              {t('auth.register')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerRegisterPage;