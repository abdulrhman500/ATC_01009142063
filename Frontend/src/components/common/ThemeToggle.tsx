import React from 'react';
import { useTheme, Theme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor } from 'lucide-react';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  
  const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: t('common.light'), icon: <Sun size={18} /> },
    { value: 'dark', label: t('common.dark'), icon: <Moon size={18} /> },
    { value: 'dim', label: t('common.dim'), icon: <Monitor size={18} /> },
  ];
  
  return (
    <div className="relative">
      <label htmlFor="theme-toggle" className="sr-only">{t('common.theme')}</label>
      <div className="flex items-center space-x-1 rtl:space-x-reverse">
        {themes.map(({ value, label, icon }) => (
          <button
            key={value}
            type="button"
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={`p-2 rounded-md transition-colors duration-200 ${
              theme === value
                ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300'
                : 'text-text-tertiary hover:text-text-primary hover:bg-bg-accent'
            }`}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeToggle;