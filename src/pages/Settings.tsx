import { useSpendStore } from '../lib/spendsense/store';
import { User, Bell, HelpCircle, Sliders, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const profile = useSpendStore((s) => s.profile);
  const setProfile = useSpendStore((s) => s.setProfile);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  };

  const handleNameChange = (name: string) => {
    setProfile({ name });
  };

  const handleIncomeChange = (income: number) => {
    setProfile({ income });
  };

  const handleBudgetChange = (category: string, value: number) => {
    setProfile({
      budgets: {
        ...profile.budgets,
        [category]: value
      }
    });
  };

  const handleNotificationChange = (key: 'weekly' | 'anomalies', value: boolean) => {
    setProfile({
      notifications: {
        ...profile.notifications,
        [key]: value
      }
    });
  };

  const categories = Object.keys(profile.budgets);

  return (
    <div className={`flex-1 max-w-2xl mx-auto w-full space-y-6 pt-4 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100">{t('settings.title', 'الإعدادات')}</h1>
          <span className="text-xs md:text-sm text-slate-400 font-medium block mt-1">{t('settings.subtitle', 'تخصيص مساعدك المالي الذكي')}</span>
        </div>
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-border-light text-slate-100 bg-card hover:bg-card/80 transition-all glow-teal-sm"
        >
          <Globe className="w-5 h-5 text-accent-teal" />
          <span>{i18n.language === 'ar' ? 'Switch to English' : 'التبديل للعربية'}</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* Profile Card */}
        <div className="glass-card p-5 rounded-2xl space-y-4">
          <div className={`flex items-center gap-3 border-b border-border/40 pb-3 ${i18n.language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
            <User className="w-5 h-5 text-accent-teal" />
            <h3 className="font-bold text-slate-100 text-sm md:text-base">{t('settings.profile', 'الملف الشخصي والراتب')}</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">{t('settings.first_name', 'الاسم الأول')}</label>
              <input 
                type="text"
                dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
                value={profile.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full bg-slate-950/65 border border-border focus:border-accent-teal text-slate-200 px-4 py-2 rounded-xl text-sm outline-none"
                placeholder={t('settings.name_placeholder', 'صديقي')}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className={`flex justify-between items-center text-xs font-semibold ${i18n.language === 'ar' ? 'flex-row' : 'flex-row-reverse'}`}>
                <span className="text-accent-teal font-bold" dir="ltr">
                  {profile.income.toLocaleString()} {t('currency', 'SAR')}
                </span>
                <span className="text-slate-400">{t('settings.monthly_income', 'الدخل الشهري التقريبي (الراتب)')}</span>
              </div>
              <input 
                type="range"
                min={2000}
                max={40000}
                step={500}
                value={profile.income}
                onChange={(e) => handleIncomeChange(Number(e.target.value))}
                className="w-full accent-accent-teal h-2 bg-slate-900 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Categories Budget Limits Card */}
        <div className="glass-card p-5 rounded-2xl space-y-4">
          <div className={`flex items-center gap-3 border-b border-border/40 pb-3 ${i18n.language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
            <Sliders className="w-5 h-5 text-accent-teal" />
            <h3 className="font-bold text-slate-100 text-sm md:text-base">{t('settings.budget_limits', 'حدود ميزانية الفئات')}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div key={cat} className={`p-3.5 rounded-xl border border-border bg-slate-950/20 space-y-2 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                <div className={`flex justify-between items-center text-xs font-semibold ${i18n.language === 'ar' ? 'flex-row' : 'flex-row-reverse'}`}>
                  <span className="text-accent-teal font-bold" dir="ltr">
                    {profile.budgets[cat].toLocaleString()} {t('currency', 'SAR')}
                  </span>
                  <span className="text-slate-300 font-bold">{t(`categories.${cat}`, cat)}</span>
                </div>
                <input 
                  type="range"
                  min={0}
                  max={4000}
                  step={50}
                  value={profile.budgets[cat]}
                  onChange={(e) => handleBudgetChange(cat, Number(e.target.value))}
                  className="w-full accent-accent-teal h-2 bg-slate-900 rounded-lg cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Security & Notification card */}
        <div className="glass-card p-5 rounded-2xl space-y-4">
          <div className={`flex items-center gap-3 border-b border-border/40 pb-3 ${i18n.language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
            <Bell className="w-5 h-5 text-accent-teal" />
            <h3 className="font-bold text-slate-100 text-sm md:text-base">{t('settings.notifications', 'تنبيهات الإشعارات')}</h3>
          </div>

          <div className="space-y-3.5">
            <div className={`flex justify-between items-center text-sm ${i18n.language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
              <span className="text-slate-200 font-medium">{t('settings.notify_budget', 'تنبيه عند تجاوز الميزانية الشهرية المقدرة')}</span>
              <input 
                type="checkbox" 
                checked={profile.notifications.weekly} 
                onChange={(e) => handleNotificationChange('weekly', e.target.checked)}
                className="w-4 h-4 accent-accent-teal cursor-pointer" 
              />
            </div>

            <div className={`flex justify-between items-center text-sm ${i18n.language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
              <span className="text-slate-200 font-medium">{t('settings.notify_subscriptions', 'التحذير من الاشتراكات المشبوهة تلقائياً')}</span>
              <input 
                type="checkbox" 
                checked={profile.notifications.anomalies} 
                onChange={(e) => handleNotificationChange('anomalies', e.target.checked)}
                className="w-4 h-4 accent-accent-teal cursor-pointer" 
              />
            </div>
          </div>
        </div>

        {/* System info */}
        <div className="glass-card p-5 rounded-2xl text-center space-y-2">
          <HelpCircle className="w-6 h-6 text-slate-500 mx-auto" />
          <h4 className="font-semibold text-slate-300 text-xs md:text-sm">SpendSense AI MVP v1.0.0</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            مطور بالكامل باستخدام React و Tailwind CSS. جميع البيانات محفوظة محلياً في المتصفح.
          </p>
        </div>
      </div>
    </div>
  );
}
