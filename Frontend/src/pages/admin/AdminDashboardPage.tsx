import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Users, Calendar, TrendingUp } from 'lucide-react';

const AdminDashboardPage: React.FC = () => {
  const { t } = useTranslation();

  const stats = [
    {
      title: t('admin.dashboard.totalEvents'),
      value: '156',
      icon: Calendar,
      change: '+12%',
      trend: 'up'
    },
    {
      title: t('admin.dashboard.activeUsers'),
      value: '2,345',
      icon: Users,
      change: '+25%',
      trend: 'up'
    },
    {
      title: t('admin.dashboard.totalBookings'),
      value: '4,129',
      icon: BarChart3,
      change: '+18%',
      trend: 'up'
    },
    {
      title: t('admin.dashboard.revenue'),
      value: '$45,231',
      icon: TrendingUp,
      change: '+32%',
      trend: 'up'
    }
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        {t('admin.dashboard.title')}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <Icon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                <span className={`text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {stat.change}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {stat.title}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('admin.dashboard.recentEvents')}
          </h2>
          {/* Recent events content would go here */}
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              {t('admin.dashboard.noRecentEvents')}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('admin.dashboard.recentBookings')}
          </h2>
          {/* Recent bookings content would go here */}
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              {t('admin.dashboard.noRecentBookings')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;