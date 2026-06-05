import { useState, useRef, useEffect } from 'react';
import { useApp } from '../App';
import { useTranslation } from 'react-i18next';
import { parseExpenseInput } from '../lib/spendsense/parser';
import { Message } from '../lib/types';
import { 
  Paperclip, 
  Send, 
  Sparkles, 
  TrendingUp, 
  Music, 
  Tv, 
  Cloud, 
  Clapperboard, 
  Share2, 
  Bookmark,
  AlertTriangle
} from 'lucide-react';


export default function Dashboard() {
  const { addTransactions, subscriptions, cancelSubscription } = useApp();
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `${Date.now()}-user`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    const apiURL = import.meta.env.VITE_AGENT_API_URL;
    const apiKey = import.meta.env.VITE_AGENT_API_KEY;
    const assistantMsgId = `${Date.now()}-assistant`;
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    if (apiURL) {
      try {
        // Query the live custom Agent API
        const response = await fetch(apiURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
          },
          body: JSON.stringify({ message: text })
        });

        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();

        // Extract response text (customize based on your agent API response payload schema)
        const textResponse = data.response || data.text || data.message || JSON.stringify(data);

        // Also check if we should parse the user text locally to record transactions
        const parsed = parseExpenseInput(text);
        if (!parsed.isQuery && parsed.transactions.length > 0) {
          addTransactions(parsed.transactions);
        }

        const agentMsg: Message = {
          id: assistantMsgId,
          sender: 'assistant',
          timestamp: timeStr,
          type: 'text',
          text: textResponse
        };
        setMessages((prev) => [...prev, agentMsg]);
      } catch (error) {
        console.error("Agent API error:", error);
        const errorMsg: Message = {
          id: `${Date.now()}-error`,
          sender: 'assistant',
          timestamp: timeStr,
          type: 'text',
          text: 'عذراً، حدث خطأ أثناء الاتصال بالوكيل المخصص. يرجى التحقق من إعدادات API في ملف .env'
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } else {
      // Simulate local/mock Watsonx parsing/processing (Fallback)
      setTimeout(() => {
        const parsed = parseExpenseInput(text);
        
        if (parsed.isQuery) {
          if (parsed.queryType === 'analysis') {
            const reportMsg: Message = {
              id: assistantMsgId,
              sender: 'assistant',
              timestamp: timeStr,
              type: 'financial_report',
              spendingAlerts: [
                { category: 'Food', arabicCategory: 'الطعام', amount: 620, percentChange: 35, color: '#ef4444' },
                { category: 'Entertainment', arabicCategory: 'الترفيه', amount: 310, percentChange: -22, color: '#0df5d2' },
                { category: 'Transport', arabicCategory: 'المواصلات', amount: 240, percentChange: -52, color: '#0df5d2' }
              ],
              financialReport: {
                userName: 'فهد',
                sparklineData: [20, 45, 28, 60, 34, 45, 65],
                adviceText: 'أسبوع جيد بشكل عام يا فهد — قدرت تحافظ على ميزانية المواصلات والترفيه ضمن حدودك المريحة. لكن لاحظت إن مصاريف الطعام ارتفعت بـ 35% فوق متوسطك، غالباً بسبب طلبات التوصيل المسائية. جرّب تخصص يومين بالأسبوع للطبخ في البيت، رح يوفر لك تقريباً 180 ريال شهرياً. كمان فيه اشتراكين باينين خاملين — راجعهم وقرر إذا تبيهم. تذكّر: الهدف مش الحرمان، الهدف الوعي.'
              }
            };
            setMessages((prev) => [...prev, reportMsg]);
          } else if (parsed.queryType === 'subscriptions') {
            const subMsg: Message = {
              id: assistantMsgId,
              sender: 'assistant',
              timestamp: timeStr,
              type: 'subscriptions',
              subscriptions: subscriptions.filter(sub => sub.status !== 'inactive')
            };
            setMessages((prev) => [...prev, subMsg]);
          } else {
            const helpMsg: Message = {
              id: assistantMsgId,
              sender: 'assistant',
              timestamp: timeStr,
              type: 'text',
              text: 'أهلاً بك في SpendSense AI. يمكنك كتابة مصاريفك لتسجيلها (مثال: قهوة جبل 22، نون 78 ريال) أو كتابة "وين صرفت هذا الأسبوع" لتحليل إنفاقك، أو "الاشتراكات" لفحص الاشتراكات الخفية.'
            };
            setMessages((prev) => [...prev, helpMsg]);
          }
        } else {
          addTransactions(parsed.transactions);

          const logs = [
            'Extracted Consolidated Transaction Logs:',
            ...parsed.transactions.map(t => `- ${t.date}: ${t.merchant}, ${t.amount.toFixed(2)} SAR, ${t.category}`)
          ];

          const logMsg: Message = {
            id: assistantMsgId,
            sender: 'assistant',
            timestamp: timeStr,
            type: 'extracted_logs',
            extractedLogs: logs
          };

          setMessages((prev) => [...prev, logMsg]);
        }
      }, 800);
    }
  };

  const getSubIcon = (iconType: string) => {
    switch (iconType) {
      case 'clapboard': return <Clapperboard className="w-5 h-5 text-indigo-400" />;
      case 'music': return <Music className="w-5 h-5 text-purple-400" />;
      case 'cloud': return <Cloud className="w-5 h-5 text-cyan-400" />;
      case 'tv': return <Tv className="w-5 h-5 text-pink-400" />;
      default: return <Sparkles className="w-5 h-5 text-teal-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-4xl mx-auto w-full min-h-[calc(100vh-140px)] relative pb-24">
      {/* Messages / Welcome View Container */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        {messages.length === 0 ? (
          /* Empty / Welcome View */
          <div className="flex flex-col items-center justify-center text-center mt-12 md:mt-20 px-4">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-accent-teal text-xs font-semibold px-4 py-2 rounded-full mb-6 glow-teal-sm animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Powered by watsonx Orchestrate</span>
            </div>

            <h1 className={`text-4xl md:text-5xl font-extrabold text-slate-100 tracking-tight leading-tight mb-4 font-sans ${i18n.language === 'en' ? 'text-left' : 'text-right'}`}>
              {t('dashboard.welcome', 'أهلاً بك 👋')}
            </h1>

            <p className={`text-slate-400 max-w-xl text-base md:text-lg leading-relaxed mb-10 ${i18n.language === 'en' ? 'text-left' : 'text-right'}`}>
              {t('dashboard.welcome_desc', 'الصق مصاريفك بأي صيغة — رح أسجلها بهدوء، وإذا طلبت تقرير، رح أحللها لك بالعربي.')}
            </p>

            {/* Quick Actions Suggestions */}
            <div className="w-full max-w-xl space-y-4">
              <button 
                onClick={() => handleSend(t('dashboard.example_record_text', 'نون 78 ريال، قهوة جبل 22، نتفلكس 55'))}
                className={`w-full glass-card p-4 rounded-2xl flex flex-col gap-1.5 transition-all active:scale-[0.99] border-border hover:border-accent-teal/40 ${i18n.language === 'en' ? 'text-left' : 'text-right'}`}
              >
                <span className="text-xs font-semibold text-accent-teal">{t('dashboard.example_record', 'مثال للتسجيل')}</span>
                <span className="text-slate-300 text-sm md:text-base font-medium">{t('dashboard.example_record_text', 'نون 78 ريال، قهوة جبل 22، نتفلكس 55')}</span>
              </button>

              <button 
                onClick={() => handleSend(t('dashboard.example_analysis_text', 'وين صرفت هذا الأسبوع؟'))}
                className={`w-full glass-card p-4 rounded-2xl flex flex-col gap-1.5 transition-all active:scale-[0.99] border-border hover:border-accent-teal/40 ${i18n.language === 'en' ? 'text-left' : 'text-right'}`}
              >
                <span className="text-xs font-semibold text-accent-teal">{t('dashboard.example_analysis', 'مثال للتحليل')}</span>
                <span className="text-slate-300 text-sm md:text-base font-medium">{t('dashboard.example_analysis_text', 'وين صرفت هذا الأسبوع؟')}</span>
              </button>

              <button 
                onClick={() => handleSend(t('dashboard.example_subs_text', 'Check my subscriptions'))}
                className={`w-full glass-card p-4 rounded-2xl flex flex-col gap-1.5 transition-all active:scale-[0.99] border-border hover:border-accent-teal/40 ${i18n.language === 'en' ? 'text-left' : 'text-right'}`}
              >
                <span className="text-xs font-semibold text-accent-teal">{t('dashboard.check_subs', 'فحص الاشتراكات')}</span>
                <span className="text-slate-300 text-sm md:text-base font-medium">{t('dashboard.example_subs_text', 'Check my subscriptions')}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Render Active Chat Stream */
          <div className="space-y-6 pb-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} w-full`}
              >
                {/* User Message Bubble */}
                {msg.sender === 'user' && (
                  <div className="max-w-[85%] bg-card border border-border-light text-slate-200 px-5 py-3 rounded-2xl rounded-tr-none shadow-md text-sm md:text-base text-right leading-relaxed">
                    {msg.text}
                  </div>
                )}

                {/* Assistant Responses */}
                {msg.sender === 'assistant' && (
                  <div className="w-full space-y-4">
                    
                    {/* Mode 1: Plain text help message */}
                    {msg.type === 'text' && (
                      <div className="max-w-[85%] bg-card/45 border border-border/60 text-slate-300 px-5 py-3.5 rounded-2xl rounded-tl-none text-sm md:text-base text-right leading-relaxed">
                        {msg.text}
                      </div>
                    )}

                    {/* Mode 2: Extracted blue raw console log log block */}
                    {msg.type === 'extracted_logs' && msg.extractedLogs && (
                      <div className="w-full max-w-xl bg-blue-950/80 border border-blue-900/60 text-blue-200 p-5 rounded-2xl font-mono text-xs md:text-sm text-left leading-relaxed shadow-lg overflow-x-auto whitespace-pre">
                        {msg.extractedLogs.join('\n')}
                        <div className="text-[10px] text-blue-400/70 mt-2 text-right">{msg.timestamp}</div>
                      </div>
                    )}

                    {/* Mode 3: Spending Alerts and Reports */}
                    {msg.type === 'financial_report' && (
                      <div className="w-full max-w-xl space-y-4">
                        {/* Spending Alerts Progress Card */}
                        {msg.spendingAlerts && (
                          <div className="glass-card p-5 rounded-2xl shadow-xl space-y-4 text-right">
                            <div className="flex justify-between items-center flex-row-reverse border-b border-border/40 pb-3">
                              <div className="flex items-center gap-2 flex-row-reverse">
                                <div className="w-8 h-8 rounded-lg bg-red-950/40 border border-red-500/20 flex items-center justify-center text-red-400">
                                  <AlertTriangle className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-slate-100 text-sm md:text-base">تنبيهات الإنفاق ⚡</h3>
                              </div>
                              <span className="text-xs text-slate-400 font-medium">هذا الأسبوع</span>
                            </div>

                            <div className="space-y-4.5">
                              {msg.spendingAlerts.map((alert, idx) => (
                                <div key={idx} className="space-y-2">
                                  <div className="flex justify-between items-center text-xs font-semibold">
                                    <span className={alert.percentChange > 0 ? 'text-red-400' : 'text-accent-teal'}>
                                      {alert.amount} SAR {alert.percentChange > 0 ? `+${alert.percentChange}%` : `${alert.percentChange}%`}
                                    </span>
                                    <span className="text-slate-300">{alert.arabicCategory}</span>
                                  </div>
                                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full rounded-full transition-all duration-500" 
                                      style={{ 
                                        width: `${Math.min(100, Math.abs(alert.percentChange) * 1.5 + 20)}%`,
                                        backgroundColor: alert.color 
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="pt-3 flex justify-start">
                              <button className="border border-border-light hover:border-accent-teal/50 hover:text-accent-teal transition px-4 py-1.5 rounded-full text-xs font-semibold text-slate-300 bg-slate-900/30">
                                راجع المصاريف
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Financial Report sparkline & advisory */}
                        {msg.financialReport && (
                          <div className="glass-card p-5 rounded-2xl shadow-xl space-y-4 text-right">
                            <div className="flex justify-between items-center flex-row-reverse border-b border-border/40 pb-3">
                              <div className="flex items-center gap-2 flex-row-reverse">
                                <div className="w-8 h-8 rounded-lg bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-accent-teal">
                                  <TrendingUp className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-slate-100 text-sm md:text-base">تقريرك المالي 📊</h3>
                              </div>
                              {/* Sparkline visualization */}
                              <svg className="w-24 h-8" viewBox="0 0 150 40">
                                <path 
                                  d="M 5 35 Q 25 10, 45 30 T 85 10 T 125 25 T 145 15" 
                                  fill="none" 
                                  stroke="#0df5d2" 
                                  strokeWidth="2" 
                                  strokeLinecap="round"
                                />
                                <circle cx="145" cy="15" r="3" fill="#0df5d2" className="animate-ping" />
                                <circle cx="145" cy="15" r="2" fill="#0df5d2" />
                              </svg>
                            </div>

                            <p className="text-slate-300 text-xs md:text-sm leading-relaxed text-right font-medium">
                              {msg.financialReport.adviceText}
                            </p>

                            <div className="pt-3 border-t border-border/40 flex justify-between items-center">
                              <button className="flex items-center gap-1.5 hover:text-slate-200 text-xs font-semibold text-slate-400">
                                <Share2 className="w-3.5 h-3.5" />
                                <span>شارك</span>
                              </button>
                              <button className="flex items-center gap-1.5 bg-accent-teal hover:bg-teal-400 text-slate-950 font-bold px-4 py-1.5 rounded-full text-xs transition shadow-md">
                                <Bookmark className="w-3.5 h-3.5" />
                                <span>احفظ التقرير</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mode 4: Subscriptions */}
                    {msg.type === 'subscriptions' && msg.subscriptions && (
                      <div className="w-full max-w-xl glass-card p-5 rounded-2xl shadow-xl space-y-4 text-right">
                        <div className="flex justify-between items-center flex-row-reverse border-b border-border/40 pb-3">
                          <div className="flex items-center gap-2 flex-row-reverse">
                            <span className="text-xl">🔍</span>
                            <h3 className="font-bold text-slate-100 text-sm md:text-base">المصاريف الخفية</h3>
                          </div>
                          <span className="text-xs text-slate-400 font-medium">آخر 30 يوم</span>
                        </div>

                        {msg.subscriptions.length === 0 ? (
                          <div className="py-6 text-center text-slate-400 text-sm font-medium">
                            لا توجد اشتراكات نشطة حالياً.
                          </div>
                        ) : (
                          <div className="divide-y divide-border/40">
                            {msg.subscriptions.map((sub) => (
                              <div key={sub.id} className="py-3.5 flex justify-between items-center flex-row-reverse">
                                <div className="flex items-center gap-3 flex-row-reverse">
                                  <div className="w-10 h-10 rounded-xl bg-slate-900/60 border border-border/60 flex items-center justify-center">
                                    {getSubIcon(sub.iconType)}
                                  </div>
                                  <div className="text-right">
                                    <h4 className="font-bold text-slate-100 text-sm md:text-base">{sub.name}</h4>
                                    <span className="text-[10px] text-slate-400 block mt-0.5">Last: {sub.lastPaymentDate}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  {sub.status === 'active' ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                      نشط
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 border border-orange-500/20 text-orange-400">
                                      مشبوه
                                    </span>
                                  )}
                                  <span className="font-bold text-slate-200 text-sm md:text-base">{sub.amount} SAR</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="pt-3 flex justify-start">
                          <button 
                            onClick={() => {
                              // Cancel suspicious subscription simulation
                              const suspiciousSub = msg.subscriptions?.find(s => s.status === 'suspicious');
                              if (suspiciousSub) {
                                cancelSubscription(suspiciousSub.id);
                                alert(`تم إرسال طلب إلغاء اشتراك ${suspiciousSub.name} بنجاح!`);
                              }
                            }}
                            className="border border-orange-500/40 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/80 px-5 py-2 rounded-full text-xs font-bold transition duration-200"
                          >
                            إلغاء الاشتراك
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Chat Input Box */}
      <div className="absolute bottom-4 left-0 right-0 px-2">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputText);
          }}
          className="w-full glass-card p-3 rounded-2xl flex items-center gap-3 max-w-xl mx-auto border-border-light shadow-2xl focus-within:border-accent-teal/60 focus-within:glow-teal-sm transition duration-300"
        >
          <button 
            type="button" 
            className="w-10 h-10 rounded-xl bg-slate-900/60 border border-border/80 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <input 
            type="text"
            dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('dashboard.input_placeholder', 'الصق مصاريفك أو اسأل عن إنفاقك...')}
            className={`flex-1 bg-transparent border-0 outline-none ring-0 text-slate-100 placeholder-slate-500 pr-2 text-sm md:text-base ${i18n.language === 'en' ? 'text-left pl-2' : 'text-right'}`}
          />

          <button 
            type="submit" 
            className="w-10 h-10 rounded-xl bg-accent-teal hover:bg-teal-400 text-slate-950 flex items-center justify-center transition shadow-lg shrink-0"
          >
            <Send className="w-5 h-5 transform rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
}
