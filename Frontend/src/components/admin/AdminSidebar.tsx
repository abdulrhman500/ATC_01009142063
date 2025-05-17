import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Calendar, Tag, Settings } from 'lucide-react';
import clsx from 'clsx';

interface AdminSidebarProps {
  className?: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ className }) => {
  const { t } = useTranslation();
  
  const navItems = [
    { to: '/admin', icon: <LayoutDashboard size={20} />, label: t('admin.dashboard'), exact: true },
    { to: '/admin/events', icon: <Calendar size={20} />, label: t('admin.eventsManagement') },
    { to: '/admin/categories', icon: <Tag size={20} />, label: t('admin.categoriesManagement') },
    { to: '/admin/settings', icon: <Settings size={20} />, label: t('common.settings') },
  ];
  
  return (
    <aside className={clsx('bg-bg-primary border-b md:border-r rtl:md:border-l rtl:md:border-r-0 border-border p-4', className)}>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) => 
              clsx(
                'flex items-center px-4 py-3 text-sm rounded-md transition-colors duration-200',
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-accent'
              )
            }
          >
            <span className="mr-3 rtl:ml-3 rtl:mr-0">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;