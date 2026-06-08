import { useEffect, useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Settings from './pages/Settings';
import { OnboardingModal } from './components/spendsense/OnboardingStack';
import { useSpendStore } from './lib/spendsense/store';
import { Transaction, Subscription } from './lib/types';
import { useTranslation } from 'react-i18next';
import { LoginModal } from './components/spendsense/LoginModal';
import { useAuth } from './lib/AuthContext';

// Initial transactions from screenshot for demo fallback
const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2025-05-15', merchant: 'University Cafeteria', amount: 22.00, category: 'Food' },
  { id: '2', date: '2025-05-18', merchant: 'Jarir Bookstore', amount: 1899.00, category: 'Electronics' },
  { id: '3', date: '2025-08-15', merchant: 'Jahez App', amount: 68.00, category: 'Food' },
  { id: '4', date: '2025-08-19', merchant: 'Fuel Gas Station', amount: 60.00, category: 'Transport' },
  { id: '5', date: '2025-11-15', merchant: 'Netflix Subscription', amount: 56.00, category: 'Subscriptions' },
  { id: '6', date: '2025-11-20', merchant: 'TRX_8841_X', amount: 42.00, category: 'Food' },
  { id: '7', date: '2026-02-15', merchant: 'University Cafeteria', amount: 18.00, category: 'Food' },
  { id: '8', date: '2026-02-17', merchant: 'Al-Mazra\'a Supermarket', amount: 145.00, category: 'Groceries' },
  { id: '9', date: '2026-05-15', merchant: 'Fuel Gas Station', amount: 25.00, category: 'Transport' },
  { id: '10', date: '2026-05-20', merchant: 'Local Cafe', amount: 24.00, category: 'Food' },
  { id: '11', date: '2026-05-22', merchant: 'Campus Copy & Print Center', amount: 15.00, category: 'Education' }
];

// Initial subscriptions from screenshot
const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  { id: 's1', name: 'Netflix', amount: 55, status: 'active', lastPaymentDate: '2026-05-22', category: 'Subscriptions', iconType: 'clapboard' },
  { id: 's2', name: 'Anghami Plus', amount: 21, status: 'suspicious', lastPaymentDate: '2026-05-18', category: 'Subscriptions', iconType: 'music' },
  { id: 's3', name: 'iCloud+ 200GB', amount: 11, status: 'active', lastPaymentDate: '2026-05-15', category: 'Subscriptions', iconType: 'cloud' },
  { id: 's4', name: 'Shahid VIP', amount: 39, status: 'suspicious', lastPaymentDate: '2026-04-30', category: 'Subscriptions', iconType: 'tv' }
];

interface AppContextType {
  transactions: Transaction[];
  addTransactions: (txs: Omit<Transaction, 'id'>[]) => void;
  clearTransactions: () => void;
  updateTransactionCategory: (id: string, newCategory: Transaction['category']) => void;
  subscriptions: Subscription[];
  cancelSubscription: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}

export default function App() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  
  const storeTransactions = useSpendStore((s) => s.transactions);
  const storeAddTransactions = useSpendStore((s) => s.addTransactions);
  const storeUpdateTransaction = useSpendStore((s) => s.updateTransaction);
  const resetStoreData = useSpendStore((s) => s.resetData);
  
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(INITIAL_SUBSCRIPTIONS);

  // Sync with Neon database on startup or when user changes
  useEffect(() => {
    if (!user) {
      resetStoreData();
      return;
    }

    const fetchDBData = async () => {
      try {
        const headers: HeadersInit = user.token ? { 'Authorization': `Bearer ${user.token}` } : {};
        const response = await fetch(`/api/transactions`, { headers });
        if (!response.ok) throw new Error('Database serverless API offline');
        
        const data = await response.json();
        if (Array.isArray(data)) {
          // Clear current store cache to avoid duplicates and load fresh Postgres data
          resetStoreData();
          const mapped: Transaction[] = data.map((tx: any) => ({
            id: tx.id,
            date: tx.date,
            merchant: tx.merchant,
            category: tx.category,
            amount: tx.amount,
            source: tx.source || 'db'
          }));
          storeAddTransactions(mapped);
        }

        // Fetch subscriptions
        const subHeaders: HeadersInit = user.token ? { 'Authorization': `Bearer ${user.token}` } : {};
        const subResponse = await fetch(`/api/subscriptions`, { headers: subHeaders });
        if (subResponse.ok) {
          const subData = await subResponse.json();
          if (Array.isArray(subData) && subData.length > 0) {
            setSubscriptions(subData);
          }
        }
      } catch (err) {
        console.warn('Neon database syncing unavailable, falling back to local mock data:', err);
      }

      // Pre-seed demo fallback if database sync failed and store is empty
      if (storeTransactions.length === 0) {
        const mapped: Transaction[] = INITIAL_TRANSACTIONS.map(tx => ({
          id: tx.id,
          date: tx.date,
          merchant: tx.merchant,
          category: tx.category,
          amount: tx.amount,
          source: 'demo'
        }));
        storeAddTransactions(mapped);
      }
    };

    fetchDBData();
  }, [user]);

  const addTransactions = async (newTxs: Omit<Transaction, 'id'>[]) => {
    const prepared = newTxs.map((tx, idx) => ({
      id: `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      date: tx.date,
      merchant: tx.merchant,
      category: tx.category,
      amount: tx.amount,
      source: 'manual'
    }));

    // Optimistically update local Zustand store
    const mappedStore: Transaction[] = prepared.map(tx => ({
      id: tx.id,
      date: tx.date,
      merchant: tx.merchant,
      category: tx.category,
      amount: tx.amount,
      source: tx.source
    }));
    storeAddTransactions(mappedStore);

    // Save transactions directly to Neon PostgreSQL via Serverless API in bulk
    try {
      if (!user) throw new Error('Not logged in');
      await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user.token ? { 'Authorization': `Bearer ${user.token}` } : {})
        },
        body: JSON.stringify({ transactions: prepared })
      });
    } catch (err) {
      console.error('Failed to sync transaction to Neon Postgres database:', err);
    }
  };

  const updateTransactionCategory = async (id: string, newCategory: Transaction['category']) => {
    storeUpdateTransaction(id, { category: newCategory });
    
    if (user) {
      try {
        await fetch('/api/transactions', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            ...(user.token ? { 'Authorization': `Bearer ${user.token}` } : {})
          },
          body: JSON.stringify({ id, category: newCategory })
        });
      } catch (err) {
        console.error('Failed to update transaction category:', err);
      }
    }
  };

  const clearTransactions = async () => {
    // Clear local UI state instantly
    resetStoreData();

    // Clear Neon PostgreSQL database
    try {
      if (!user) throw new Error('Not logged in');
      const headers: HeadersInit = user?.token ? { 'Authorization': `Bearer ${user.token}` } : {};
      await fetch(`/api/transactions`, { method: 'DELETE', headers });
    } catch (err) {
      console.error('Failed to clear transactions from Neon Postgres database:', err);
    }
  };

  const cancelSubscription = async (id: string) => {
    // Optimistic UI update
    setSubscriptions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, status: 'inactive' } : sub))
    );

    // Persist to DB
    try {
      if (!user) return;
      const subToUpdate = subscriptions.find(s => s.id === id);
      if (subToUpdate) {
        await fetch('/api/subscriptions', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(user.token ? { 'Authorization': `Bearer ${user.token}` } : {})
          },
          body: JSON.stringify({ ...subToUpdate, status: 'inactive' })
        });
      }
    } catch (err) {
      console.error('Failed to cancel subscription in DB:', err);
    }
  };

  // Map store transactions back to local type
  const transactions: Transaction[] = storeTransactions.map(tx => ({
    id: tx.id,
    date: tx.date,
    merchant: tx.merchant,
    amount: tx.amount,
    category: tx.category as Transaction['category']
  }));

  return (
    <AppContext.Provider value={{ transactions, addTransactions, clearTransactions, updateTransactionCategory, subscriptions, cancelSubscription }}>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          {/* Onboarding Questions Overlay */}
          <OnboardingModal />
          <LoginModal />

          {/* Header Navigation */}
          <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-card border border-border-light flex items-center justify-center text-accent-teal glow-teal-sm">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent flex items-center gap-1.5">
                SpendSense <span className="text-accent-teal">AI</span>
              </span>
            </div>

            <nav className="flex items-center gap-2">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-card border border-border-light text-slate-100 glow-teal-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                {t('nav.dashboard', 'Dashboard')}
              </NavLink>
              <NavLink
                to="/history"
                className={({ isActive }) =>
                  `px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-card border border-border-light text-slate-100 glow-teal-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                {t('nav.history', 'History')}
              </NavLink>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-card border border-border-light text-slate-100 glow-teal-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                {t('nav.settings', 'Settings')}
              </NavLink>
              {user && (
                <button
                  onClick={logout}
                  className="px-3 py-1.5 rounded-full text-sm font-medium border border-border-light text-red-400 hover:text-red-300 bg-card hover:bg-card/80 transition-all ml-2"
                >
                  {t('nav.logout', 'Logout')}
                </button>
              )}
            </nav>
          </header>

          {/* Main App Content Area */}
          <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 flex flex-col">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AppContext.Provider>
  );
}
