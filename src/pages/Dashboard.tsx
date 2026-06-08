import { useState, useEffect, useRef } from 'react';
import { useApp } from '../App';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/AuthContext';
import { Sparkles, Loader2, AlertCircle, Paperclip, X, CheckCircle2 } from 'lucide-react';
import { Transaction } from '../lib/types';
import { useSpendStore } from '../lib/spendsense/store';

// Helper: extract structured transactions from Watson's response text
function extractTransactionsFromResponse(responseText: string): {
  cleanText: string;
  transactions: { date: string; merchant: string; amount: number; category: Transaction['category'] }[];
} {
  const marker = /\[TRANSACTIONS_JSON\]([\s\S]*?)\[\/TRANSACTIONS_JSON\]/;
  const match = responseText.match(marker);

  if (!match) {
    return { cleanText: responseText, transactions: [] };
  }

  // Remove the JSON block from the display text
  const cleanText = responseText.replace(marker, '').trim();

  try {
    const parsed = JSON.parse(match[1].trim());
    if (Array.isArray(parsed)) {
      // Validate each transaction has required fields
      const valid = parsed.filter(
        (tx: any) => tx.merchant && typeof tx.amount === 'number' && tx.amount > 0
      ).map((tx: any) => ({
        date: tx.date || new Date().toISOString().split('T')[0],
        merchant: tx.merchant,
        amount: tx.amount,
        category: (tx.category || 'Other') as Transaction['category'],
      }));
      return { cleanText, transactions: valid };
    }
  } catch (e) {
    console.warn('Failed to parse TRANSACTIONS_JSON from Watson response:', e);
  }

  return { cleanText, transactions: [] };
}

export default function Dashboard() {
  const { addTransactions } = useApp();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  
  // Store messages in global persistent store
  const messages = useSpendStore((s) => s.messages);
  const addMessage = useSpendStore((s) => s.addMessage);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [watsonError, setWatsonError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [savedTxCount, setSavedTxCount] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-dismiss the "saved" notification
  useEffect(() => {
    if (savedTxCount !== null) {
      const timer = setTimeout(() => setSavedTxCount(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [savedTxCount]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !selectedFile) return;

    const text = inputText;
    const file = selectedFile;
    
    setInputText("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    let fileText = "";
    if (file) {
      try {
        fileText = await file.text();
      } catch (err) {
        console.error("Failed to read file", err);
      }
    }

    // Build display content for the user bubble
    let displayContent = text;
    let actualContent = text;
    
    if (file) {
      displayContent = text ? `[📎 ${file.name}]\n${text}` : `[📎 ${file.name}]`;
      actualContent = text ? `[Attached File: ${file.name}]\n${fileText}\n\n[User Message]:\n${text}` : `[Attached File: ${file.name}]\n${fileText}`;
    }

    // Add user message to global state
    const userMessage = { id: Date.now().toString(), role: 'user' as const, content: actualContent, displayContent, timestamp: Date.now() };
    addMessage(userMessage);
    
    // We send the updated array to Watson
    const updatedMessages = [...messages, userMessage];
    
    // Removed local parsing fallback to rely purely on Watson's structured output

    setIsSending(true);
    setWatsonError(null);

    try {
      const response = await fetch('/api/watson-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token ? { 'Authorization': `Bearer ${user.token}` } : {})
        },
        body: JSON.stringify({ 
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content }))
        }),
      });
  
      if (!response.ok) {
        throw new Error('Watson API returned an error');
      }

      const data = await response.json();
      const rawReply = data.choices?.[0]?.message?.content || t('dashboard.no_response', 'لم يتم استلام رد.');
      
      // Extract structured transactions from Watson's response
      const { cleanText, transactions: extractedTxs } = extractTransactionsFromResponse(rawReply);

      // Save extracted transactions to the database
      if (extractedTxs.length > 0) {
        console.log(`Watson extracted ${extractedTxs.length} transactions, saving to DB:`, extractedTxs);
        addTransactions(extractedTxs);
        setSavedTxCount(extractedTxs.length);
      }

      // Add the assistant's response to global store
      addMessage({ id: (Date.now() + 1).toString(), role: 'assistant', content: rawReply, displayContent: cleanText, timestamp: Date.now() });
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
                <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-accent-teal/20 text-teal-100 border border-teal-500/20' : 'bg-slate-800 text-slate-200 border border-slate-700'}`}>
                  {msg.displayContent !== undefined ? msg.displayContent : msg.content}
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

        {/* Transaction Saved Notification */}
        {savedTxCount !== null && (
          <div className="w-full bg-emerald-950/50 text-emerald-300 p-3 text-xs flex items-center justify-center gap-2 border-t border-emerald-900/30 animate-pulse">
            <CheckCircle2 className="w-4 h-4" />
            {savedTxCount === 1
              ? t('dashboard.tx_saved_one', 'تم حفظ معاملة واحدة في السجل ✓')
              : t('dashboard.tx_saved_many', `تم حفظ ${savedTxCount} معاملات في السجل ✓`)}
          </div>
        )}

        {/* Error State */}
        {watsonError && (
          <div className="w-full bg-red-950/40 text-red-400 p-3 text-xs flex items-center justify-center gap-2 border-t border-red-900/30">
            <AlertCircle className="w-4 h-4" />
            {watsonError}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="w-full border-t border-border bg-card/50 p-4 flex flex-col gap-3 relative">
          
          {/* Selected File Badge */}
          {selectedFile && (
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 w-max px-3 py-1.5 rounded-lg text-xs text-slate-300">
              <Paperclip className="w-3.5 h-3.5 text-accent-teal" />
              <span className="truncate max-w-[200px]">{selectedFile.name}</span>
              <button 
                type="button" 
                onClick={() => setSelectedFile(null)}
                className="ml-2 hover:bg-slate-700 p-1 rounded-full text-slate-400 hover:text-white transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex gap-3 items-end">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} 
              className="hidden" 
              id="file-upload"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-slate-400 hover:text-accent-teal bg-slate-900 border border-border rounded-xl transition flex-shrink-0 mb-1"
              title="Upload file"
              disabled={isSending || !user}
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('dashboard.chat_placeholder', 'اكتب رسالتك هنا... (Shift + Enter لسطر جديد)')}
              className={`flex-1 bg-slate-900 border border-border rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-accent-teal/50 resize-none min-h-[50px] max-h-[150px] overflow-y-auto ${i18n.language === 'en' ? 'text-left' : 'text-right'}`}
              disabled={isSending || !user}
              rows={1}
            />
            
            <button
              type="submit"
              disabled={isSending || (!inputText.trim() && !selectedFile) || !user}
              className="bg-accent-teal hover:bg-teal-500 text-slate-900 px-6 py-3 rounded-xl font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 mb-1"
            >
              {t('dashboard.send', 'إرسال')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
