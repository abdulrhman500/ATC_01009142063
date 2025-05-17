import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, Theme } from '../../contexts/ThemeContext';
import { useLanguage, Language } from '../../contexts/LanguageContext';
import { Sun, Moon, Monitor, Languages } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  
  const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: t('common.light'), icon: <Sun size={20} /> },
    { value: 'dark', label: t('common.dark'), icon: <Moon size={20} /> },
    { value: 'dim', label: t('common.dim'), icon: <Monitor size={20} /> },
  ];
  
  const languages: { value: Language; label: string }[] = [
    { value: 'en', label: t('common.english') },
    { value: 'ar', label: t('common.arabic') },
  ];
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('common.settings')}</h1>
      
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{t('common.theme')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themes.map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`p-4 rounded-lg border transition-all duration-200 flex items-center ${
                theme === value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-sm'
                  : 'border-border hover:border-primary-300 hover:bg-bg-accent'
              }`}
            >
              <div className={`mr-3 rtl:ml-3 rtl:mr-0 ${theme === value ? 'text-primary-600' : 'text-text-tertiary'}`}>
                {icon}
              </div>
              <span className={theme === value ? 'font-medium' : ''}>{label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">{t('common.language')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {languages.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setLanguage(value)}
              className={`p-4 rounded-lg border transition-all duration-200 flex items-center ${
                language === value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-sm'
                  : 'border-border hover:border-primary-300 hover:bg-bg-accent'
              }`}
            >
              <div className={`mr-3 rtl:ml-3 rtl:mr-0 ${language === value ? 'text-primary-600' : 'text-text-tertiary'}`}>
                <Languages size={20} />
              </div>
              <span className={language === value ? 'font-medium' : ''}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;