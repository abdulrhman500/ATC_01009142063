import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle } from 'lucide-react';

const BookingConfirmationPage: React.FC = () => {
  const { t } = useTranslation();
  const { eventId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {t('booking.confirmationTitle')}
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {t('booking.confirmationMessage')}
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => navigate(`/events/${eventId}`)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('booking.viewEventDetails')}
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {t('booking.goToDashboard')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;