import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import CustomerHeader from '../components/customer/CustomerHeader';
import CustomerSidebar from '../components/customer/CustomerSidebar';
import { useLanguage } from '../contexts/LanguageContext';

const CustomerLayout: React.FC = () => {
  const { isRTL } = useLanguage();
  const location = useLocation();
  const showSidebar = location.pathname === '/events';
  
  return (
    <div className="min-h-screen bg-bg-secondary flex flex-col">
      <CustomerHeader />
      <div className="flex flex-1 flex-col md:flex-row">
        {showSidebar && (
          <CustomerSidebar className={`w-full md:w-64 ${isRTL ? 'md:order-last' : 'md:order-first'}`} />
        )}
        <main className={`flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full ${!showSidebar && 'md:px-8'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CustomerLayout;