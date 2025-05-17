import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Ticket, Clock } from 'lucide-react';

const CustomerDashboardPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">{t('customer.dashboard.title', 'Dashboard')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Upcoming Events Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Calendar className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold">{t('customer.dashboard.upcomingEvents', 'Upcoming Events')}</h2>
          </div>
          <p className="text-3xl font-bold text-blue-600">0</p>
        </div>

        {/* Active Bookings Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Ticket className="w-6 h-6 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold">{t('customer.dashboard.activeBookings', 'Active Bookings')}</h2>
          </div>
          <p className="text-3xl font-bold text-green-600">0</p>
        </div>

        {/* Past Events Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Clock className="w-6 h-6 text-purple-600 mr-3" />
            <h2 className="text-xl font-semibold">{t('customer.dashboard.pastEvents', 'Past Events')}</h2>
          </div>
          <p className="text-3xl font-bold text-purple-600">0</p>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">{t('customer.dashboard.recentActivity', 'Recent Activity')}</h2>
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 text-center text-gray-500">
            {t('customer.dashboard.noActivity', 'No recent activity to display')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboardPage;