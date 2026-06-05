import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('ar') ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  };

  useEffect(() => {
    // Update direction and lang attributes on the html tag whenever language changes
    document.documentElement.dir = i18n.language.startsWith('ar') ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language.startsWith('ar') ? 'ar' : 'en';
  }, [i18n.language]);

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border border-border-light text-slate-300 hover:text-slate-100 bg-card hover:bg-card/80 transition-all"
    >
      <Globe className="w-4 h-4" />
      <span>{i18n.language.startsWith('ar') ? 'English' : 'عربي'}</span>
    </button>
  );
}
