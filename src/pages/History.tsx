import { useState } from 'react';
import { useApp } from '../App';
import { Search, FolderOpen, Trash2 } from 'lucide-react';


const CATEGORIES: { key: string; label: string }[] = [
  { key: 'all', label: 'all' },
  { key: 'Food', label: 'Food' },
  { key: 'Transport', label: 'Transport' },
  { key: 'Entertainment', label: 'Entertainment' },
  { key: 'Subscriptions', label: 'Subscriptions' },
  { key: 'Shopping', label: 'Shopping' }
];

export default function History() {
  const { transactions, clearTransactions } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = transactions.filter((tx) => {
    const merchantName = tx.merchant || '';
    const matchesSearch = merchantName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || tx.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full space-y-6 pt-4 text-right">
      {/* Top Filter and Search Bar Row */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        
        {/* Left Side (Arabic Header) */}
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100">سجل المعاملات</h1>
          <span className="text-xs md:text-sm text-slate-400 font-medium block mt-1">
            {filtered.length} {filtered.length === 1 ? 'معاملة' : 'معاملات'}
          </span>
        </div>

        {/* Right Side Search */}
        <div className="relative w-full md:w-72">
          <input 
            type="text"
            dir="ltr"
            placeholder="Search merchant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/65 border border-border hover:border-border-light focus:border-accent-teal focus:ring-0 text-slate-200 pl-10 pr-4 py-2 rounded-xl text-sm transition"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        </div>
      </div>

      {/* Categories Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 flex-row-reverse -mx-4 px-4 md:mx-0 md:px-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-4.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition duration-200 ${
              activeCategory === cat.key
                ? 'bg-accent-teal text-slate-950 border-accent-teal shadow-md glow-teal-sm'
                : 'bg-card/40 border-border text-slate-300 hover:text-slate-100 hover:border-border-light'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Table and Log List Container */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-2xl">
        {filtered.length === 0 ? (
          /* Empty Database View matching screens */
          <div className="p-16 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900/60 border border-border/80 flex items-center justify-center text-slate-500">
              <FolderOpen className="w-8 h-8" />
            </div>
            <p className="text-slate-400 text-sm md:text-base font-semibold leading-relaxed max-w-sm">
              لا توجد معاملات بعد — ابدأ بلصق مصاريفك في الدردشة
            </p>
          </div>
        ) : (
          /* Responsive Transactions table list */
          <div className="divide-y divide-border/40">
            {/* Table Header for desktop */}
            <div className="hidden md:flex justify-between items-center py-3.5 px-6 bg-slate-900/25 text-xs font-bold text-slate-400 flex-row-reverse border-b border-border/40">
              <div className="w-1/3 text-right">التاجر / الوصف</div>
              <div className="w-1/4 text-center">التصنيف</div>
              <div className="w-1/4 text-center">التاريخ</div>
              <div className="w-1/6 text-left">المبلغ</div>
            </div>

            {/* Rows */}
            {filtered.map((tx) => (
              <div 
                key={tx.id} 
                className="flex flex-col md:flex-row justify-between items-stretch md:items-center py-4 px-6 hover:bg-slate-900/10 transition duration-150 flex-row-reverse gap-2 text-right"
              >
                {/* Desc */}
                <div className="md:w-1/3 flex flex-col justify-center">
                  <span className="font-bold text-slate-100 text-sm md:text-base">{tx.merchant}</span>
                </div>

                {/* Cat */}
                <div className="md:w-1/4 flex items-center justify-start md:justify-center">
                  <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-900 border border-border/60 text-slate-300">
                    {tx.category}
                  </span>
                </div>

                {/* Date */}
                <div className="md:w-1/4 text-xs font-medium text-slate-400 md:text-center flex items-center justify-start md:justify-center">
                  <span>{tx.date}</span>
                </div>

                {/* Amount */}
                <div className="md:w-1/6 text-left font-bold text-slate-200 text-sm md:text-base flex justify-start md:justify-end items-center gap-1">
                  <span>{tx.amount.toFixed(2)}</span>
                  <span className="text-[10px] text-accent-teal">SAR</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Database simulation */}
      {transactions.length > 0 && (
        <div className="flex justify-start pt-2">
          <button 
            onClick={() => {
              if (confirm('هل أنت متأكد من مسح جميع المعاملات؟')) {
                clearTransactions();
              }
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>مسح كافة السجلات</span>
          </button>
        </div>
      )}
    </div>
  );
}
