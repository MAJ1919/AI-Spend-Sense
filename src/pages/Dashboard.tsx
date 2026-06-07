import { useState, useEffect, useRef } from 'react';
import { useApp } from '../App';
import { useTranslation } from 'react-i18next';
import { parseExpenseInput } from '../lib/spendsense/parser';
import { useAuth } from '../lib/AuthContext';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { addTransactions } = useApp();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [watsonError, setWatsonError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText;
    setInputText("");
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    
    // Attempt parsing for expenses from user message (optional fallback)
    const parsed = parseExpenseInput(text);
    if (!parsed.isQuery && parsed.transactions.length > 0) {
       console.log("Expense detected! Saving to DB:", parsed.transactions);
       addTransactions(parsed.transactions);
    }

    setIsSending(true);
    setWatsonError(null);

    try {
      const response = await fetch('/api/watson-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: text,
          sessionId: user?.id 
        }),
      });
  
      if (!response.ok) {
        throw new Error('Watson API returned an error');
      }

      const data = await response.json();
      const agentReply = data.choices?.[0]?.message?.content || t('dashboard.no_response', 'لم يتم استلام رد.');
      
      setMessages(prev => [...prev, { role: 'assistant', content: agentReply }]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setWatsonError(t('dashboard.send_error', 'حدث خطأ أثناء إرسال الرسالة. يرجى التحقق من إعدادات Watson Orchestrate.'));
    } finally {
      setIsSending(false);
    }
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
      <div className="flex-1 min-h-[580px] w-full rounded-2xl border border-border bg-card/15 backdrop-blur-md relative overflow-hidden flex flex-col shadow-2xl">
        
        {/* Messages View */}
        <div className="flex-1 w-full overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-slate-500 text-sm">
              {t('dashboard.start_chatting', 'ابدأ المحادثة الآن...')}
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-accent-teal/20 text-teal-100 border border-teal-500/20' : 'bg-slate-800 text-slate-200 border border-slate-700'}`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-slate-800 rounded-2xl p-4 flex gap-3 items-center border border-slate-700">
                <Loader2 className="w-4 h-4 text-accent-teal animate-spin" />
                <span className="text-slate-400 text-xs">{t('dashboard.typing', 'يكتب...')}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error State */}
        {watsonError && (
          <div className="w-full bg-red-950/40 text-red-400 p-3 text-xs flex items-center justify-center gap-2 border-t border-red-900/30">
            <AlertCircle className="w-4 h-4" />
            {watsonError}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="w-full border-t border-border bg-card/50 p-4 flex gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('dashboard.chat_placeholder', 'اكتب رسالتك هنا...')}
            className={`flex-1 bg-slate-900 border border-border rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-accent-teal/50 ${i18n.language === 'en' ? 'text-left' : 'text-right'}`}
            disabled={isSending || !user}
          />
          <button
            type="submit"
            disabled={isSending || !inputText.trim() || !user}
            className="bg-accent-teal hover:bg-teal-500 text-slate-900 px-6 py-3 rounded-xl font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('dashboard.send', 'إرسال')}
          </button>
        </form>
      </div>
    </div>
  );
}
