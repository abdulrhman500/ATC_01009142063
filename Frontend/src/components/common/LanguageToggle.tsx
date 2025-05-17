import React from 'react';
import { useLanguage, Language } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  
  const languages: { value: Language; label: string }[] = [
    { value: 'en', label: t('common.english') },
    { value: 'ar', label: t('common.arabic') },
  ];
  
  const [isOpen, setIsOpen] = React.useState(false);
  
  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);
  
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    closeDropdown();
  };
  
  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => closeDropdown();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleDropdown();
        }}
        className="p-2 rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-accent transition-colors duration-200"
        aria-label={t('common.language')}
        title={t('common.language')}
      >
        <Languages size={18} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 py-1 w-36 bg-bg-primary border border-border rounded-md shadow-lg z-10 animate-fade-in">
          {languages.map(({ value, label }) => (
            <button
              key={value}
              onClick={(e) => {
                e.stopPropagation();
                handleLanguageChange(value);
              }}
              className={`w-full text-left rtl:text-right px-4 py-2 text-sm ${
                language === value
                  ? 'bg-primary-50 text-primary-800 dark:bg-primary-900 dark:text-primary-300'
                  : 'text-text-primary hover:bg-bg-accent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageToggle;