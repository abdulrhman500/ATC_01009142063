import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CategoryManagementSection from '../../components/admin/categories/CategoryManagementSection'; // We'll create this
import EventManagementSection from '../../components/admin/events/EventManagementSection'; // For later

type ManagementSection = 'categories' | 'events';

const AdminSystemManagementPage: React.FC = () => {
    const { t } = useTranslation();
    const [activeSection, setActiveSection] = useState<ManagementSection>('categories');

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary dark:text-white">
                    {t('admin.management.title', 'System Management')}
                </h1>
            </div>

            {/* Tab-like navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-4 rtl:space-x-reverse" aria-label="Tabs">
                    <button
                        onClick={() => setActiveSection('categories')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm
                            ${activeSection === 'categories'
                                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                            }`}
                    >
                        {t('admin.management.manageCategories', 'Manage Categories')}
                    </button>
                    <button
                        onClick={() => setActiveSection('events')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm
                            ${activeSection === 'events'
                                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                            }`}
                    >
                        {t('admin.management.manageEvents', 'Manage Events')}
                    </button>
                </nav>
            </div>

            {/* Content based on active section */}
            <div className="mt-6">
                {activeSection === 'categories' && <CategoryManagementSection />}
                {activeSection === 'events' && (
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4 text-text-primary dark:text-white">
                            {t('admin.events.title', 'Event Management')}
                        </h2>
                        <p className="text-text-secondary dark:text-gray-400">
                            {t('common.featureComingSoon', 'Event management (CRUD) will be implemented here.')}
                        </p>
                       <EventManagementSection></EventManagementSection>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSystemManagementPage;