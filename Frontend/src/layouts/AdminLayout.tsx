import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import { useLanguage } from '../contexts/LanguageContext';

const AdminLayout: React.FC = () => {
  const { isRTL } = useLanguage();
  
  return (
    <div className="min-h-screen bg-bg-secondary flex flex-col">
      <AdminHeader />
      <div className="flex flex-1 flex-col md:flex-row">
        <AdminSidebar className={`w-full md:w-64 ${isRTL ? 'md:order-last' : 'md:order-first'}`} />
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;