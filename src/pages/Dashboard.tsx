import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const watsonInitialized = useRef(false);

  useEffect(() => {
    // Only initialize Watson once per mount
    if (watsonInitialized.current) return;

    // Give React a tick to render the container div, then load Watson
    const timer = setTimeout(() => {
      // Check if Watson is already loaded (e.g. from a previous mount)
      if ((window as any).wxoLoader) {
        try {
          (window as any).wxoLoader.init();
        } catch (e) {
          console.warn('Watson re-init skipped:', e);
        }
        watsonInitialized.current = true;
        return;
      }

      // Set Watson config on window
      (window as any).wxOConfiguration = {
        orchestrationID: "598d5817e57c40ea9fb0bb09d12f6e53_44e67084-7a20-4dd4-bd68-6f287602b663",
        hostURL: "https://eu-gb.watson-orchestrate.cloud.ibm.com",
        rootElementID: "watson-chat-panel",
        deploymentPlatform: "ibmcloud",
        crn: "crn:v1:bluemix:public:watsonx-orchestrate:eu-gb:a/598d5817e57c40ea9fb0bb09d12f6e53:44e67084-7a20-4dd4-bd68-6f287602b663::",
        chatOptions: {
          agentId: "59201b67-6653-42a2-97c9-d2559f1c6c3d",
          agentEnvironmentId: "09633ba2-1f3f-4cfa-aec4-d06f0b3d0f3a",
          showLauncher: false,
        }
      };

      // Dynamically load the Watson script
      const script = document.createElement('script');
      script.src = `${(window as any).wxOConfiguration.hostURL}/wxochat/wxoLoader.js?embed=true`;
      script.addEventListener('load', () => {
        (window as any).wxoLoader.init();
      });
      document.head.appendChild(script);
      watsonInitialized.current = true;
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full min-h-[calc(100vh-140px)]">
      {/* Header badge */}
      <div className="flex flex-col items-center pt-6 pb-4">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-accent-teal text-xs font-semibold px-4 py-2 rounded-full glow-teal-sm animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Powered by watsonx Orchestrate</span>
        </div>
        <h1 className={`text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight mt-3 ${i18n.language === 'en' ? 'text-left' : 'text-right'}`}>
          {t('dashboard.welcome', 'أهلاً بك 👋')}
        </h1>
        <p className="text-slate-400 text-sm mt-1 text-center max-w-md">
          {t('dashboard.welcome_desc', 'الصق مصاريفك بأي صيغة — رح أسجلها بهدوء، وإذا طلبت تقرير، رح أحللها لك بالعربي.')}
        </p>
      </div>

      {/* Watson Chat Panel — IBM renders directly into this container */}
      <div 
        id="watson-chat-panel"
        ref={chatContainerRef}
        className="flex-1 rounded-2xl border border-border-light bg-card/30 overflow-hidden min-h-[400px]"
        style={{ position: 'relative' }}
      />
    </div>
  );
}
