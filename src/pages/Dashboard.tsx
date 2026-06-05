import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { useTranslation } from 'react-i18next';
import { parseExpenseInput } from '../lib/spendsense/parser';
import { useAuth } from '../lib/AuthContext';
import { Sparkles, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const { addTransactions } = useApp();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [isWatsonLoading, setIsWatsonLoading] = useState(true);
  const [watsonError, setWatsonError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  useEffect(() => {
    if (!user) {
      setIsWatsonLoading(false);
      const container = document.getElementById('watson-chat-container');
      if (container) {
        container.innerHTML = '';
      }
      return;
    }

    setIsWatsonLoading(true);
    setWatsonError(null);

    // 1. Configure the Watson Orchestrate webchat configuration
    (window as any).wxOConfiguration = {
      orchestrationID: "598d5817e57c40ea9fb0bb09d12f6e53_44e67084-7a20-4dd4-bd68-6f287602b663",
      hostURL: "https://eu-gb.watson-orchestrate.cloud.ibm.com",
      rootElementID: "watson-chat-container",
      deploymentPlatform: "ibmcloud",
      crn: "crn:v1:bluemix:public:watsonx-orchestrate:eu-gb:a/598d5817e57c40ea9fb0bb09d12f6e53:44e67084-7a20-4dd4-bd68-6f287602b663::",
      showLauncher: false, // Hide the floating chat launcher bubble
      chatOptions: {
        agentId: "59201b67-6653-42a2-97c9-d2559f1c6c3d",
        agentEnvironmentId: "09633ba2-1f3f-4cfa-aec4-d06f0b3d0f3a",
        carbonTheme: "g100", // Dark theme matching SpendSense AI dark mode
        onLoad: (instance: any) => {
          console.log("Watson Orchestrate chat instance loaded successfully.");
          setIsWatsonLoading(false);
          clearTimeout(loadingTimer);

          // Listen for user messages to extract expense logs and save to Neon
          instance.on({
            type: "send",
            handler: (event: any) => {
              console.log("User sent message:", event);
              const text = event.input?.text;
              if (text) {
                const parsed = parseExpenseInput(text);
                if (!parsed.isQuery && parsed.transactions.length > 0) {
                  console.log("Expense detected! Saving to DB:", parsed.transactions);
                  addTransactions(parsed.transactions);
                }
              }
            }
          });

          instance.on({
            type: "error",
            handler: (err: any) => {
              console.error("Watson webchat error event:", err);
            }
          });

          // Render inline inside #watson-chat-container
          instance.render();
        }
      }
    };

    // Safety timeout to abort loading if Watson takes too long
    const loadingTimer = setTimeout(() => {
      if (isWatsonLoading) {
        console.warn("Watson initialization timed out.");
        setWatsonError(
          t('dashboard.watson_timeout_error', 'تأخر تحميل المساعد. يرجى التحقق من اتصالك بالإنترنت، والتأكد من إيقاف مانع الإعلانات، وإضافة النطاق local/Vercel إلى قائمة Allowed Origins في IBM.')
        );
        setIsWatsonLoading(false);
      }
    }, 12000);

    // 2. Load the Watson widget loader script
    const scriptId = 'watson-orchestrate-loader-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    
    const initLoader = () => {
      try {
        if ((window as any).wxoLoader) {
          (window as any).wxoLoader.init();
        } else {
          throw new Error("wxoLoader not found on window object");
        }
      } catch (e) {
        console.error("Failed to run wxoLoader.init():", e);
        setWatsonError(t('dashboard.watson_init_error', 'حدث خطأ أثناء تشغيل المساعد. يرجى مراجعة إعدادات IBM.'));
        setIsWatsonLoading(false);
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = (window as any).wxOConfiguration.hostURL + '/wxochat/wxoLoader.js?embed=true';
      script.addEventListener('load', initLoader);
      script.addEventListener('error', (e) => {
        console.error("Failed to fetch Watson script:", e);
        setWatsonError(t('dashboard.watson_script_error', 'فشل تحميل ملف التشغيل الخاص بـ Watson. يرجى التحقق من حظر الإعلانات أو القيود الشبكية.'));
        setIsWatsonLoading(false);
      });
      document.head.appendChild(script);
    } else {
      initLoader();
    }

    return () => {
      clearTimeout(loadingTimer);
      const globalInstance = (window as any).watsonAssistantChatInstance;
      if (globalInstance && typeof globalInstance.destroy === 'function') {
        try {
          globalInstance.destroy();
        } catch (e) {
          console.error("Failed to destroy Watson chat instance:", e);
        }
      }
    };
  }, [user, addTransactions, retryTrigger, t]);

  const handleRetry = () => {
    // Clean up cached global variables
    const script = document.getElementById('watson-orchestrate-loader-script');
    if (script) {
      script.remove();
    }
    delete (window as any).wxoLoader;
    delete (window as any).wxOConfiguration;
    delete (window as any).watsonAssistantChatInstance;

    // Reset container DOM content
    const container = document.getElementById('watson-chat-container');
    if (container) {
      container.innerHTML = '';
    }

    setRetryTrigger(prev => prev + 1);
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-4xl mx-auto w-full min-h-[calc(100vh-140px)] relative pb-12">
      {/* Sparkles tag and welcome text */}
      <div className="flex flex-col items-center justify-center text-center mt-6 px-4 mb-4">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-accent-teal text-xs font-semibold px-4 py-2 rounded-full mb-3 glow-teal-sm animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Powered by watsonx Orchestrate</span>
        </div>

        <h1 className={`text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight mb-2 font-sans ${i18n.language === 'en' ? 'text-left' : 'text-right'}`}>
          {t('dashboard.welcome', 'أهلاً بك 👋')}
        </h1>

        <p className={`text-slate-400 max-w-xl text-sm leading-relaxed ${i18n.language === 'en' ? 'text-left' : 'text-right'}`}>
          {t('dashboard.welcome_desc_watson', 'تحدث مع وكيلك المالي الذكي لإدخال مصاريفك أو تحليل ميزانيتك. سيتم تسجيل مصاريفك تلقائياً في جداولك.')}
        </p>
      </div>

      {/* Chat container */}
      <div className="flex-1 min-h-[580px] w-full rounded-2xl border border-border bg-card/15 backdrop-blur-md relative overflow-hidden flex flex-col items-center justify-center shadow-2xl">
        {/* Loading Overlay */}
        {isWatsonLoading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm space-y-4">
            <Loader2 className="w-10 h-10 text-accent-teal animate-spin" />
            <p className="text-slate-300 font-medium text-sm">
              {t('dashboard.watson_loading', 'جاري بدء تشغيل مساعد Watson المالي...')}
            </p>
          </div>
        )}

        {/* Error Overlay */}
        {watsonError && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm p-6 text-center max-w-md mx-auto space-y-6">
            <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-slate-200 font-bold text-lg">{t('dashboard.error_title', 'فشل في الاتصال')}</h3>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                {watsonError}
              </p>
            </div>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 bg-slate-900 border border-border hover:border-accent-teal/60 hover:text-accent-teal text-slate-300 px-5 py-2.5 rounded-xl text-xs font-semibold transition duration-200 shadow-md active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t('dashboard.retry_button', 'إعادة المحاولة')}</span>
            </button>
          </div>
        )}

        {/* Dynamic target container for the embedded Watson Chat */}
        <div 
          id="watson-chat-container" 
          className="w-full h-full flex-1 min-h-[580px]" 
        />
      </div>
    </div>
  );
}
