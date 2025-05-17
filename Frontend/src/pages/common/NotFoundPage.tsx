import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import { MoveLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-bg-secondary flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-bold text-primary-500">404</h1>
        <h2 className="text-2xl font-semibold mt-4 mb-2">{t('common.error')}</h2>
        <p className="text-text-secondary mb-8">
          We couldn't find the page you're looking for.
        </p>
        <Link to="/">
          <Button leftIcon={<MoveLeft size={18} />}>
            {t('common.backToHome')}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;