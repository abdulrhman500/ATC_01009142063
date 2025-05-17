import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const EventDetailsPage: React.FC = () => {
  const { eventId } = useParams();
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t('events.details.title')}</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 mb-4">{t('events.details.loading')}</p>
        <p className="text-sm text-gray-500">Event ID: {eventId}</p>
      </div>
    </div>
  );
};

export default EventDetailsPage;