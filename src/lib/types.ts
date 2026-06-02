export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: 'Food' | 'Transport' | 'Entertainment' | 'Subscriptions' | 'Shopping' | 'Electronics' | 'Education' | 'Groceries' | 'Other';
  rawText?: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  status: 'active' | 'suspicious' | 'inactive';
  lastPaymentDate: string;
  category: string;
  iconType: 'clapboard' | 'music' | 'cloud' | 'tv' | 'default';
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text?: string;
  timestamp: string;
  type?: 'text' | 'extracted_logs' | 'spending_alerts' | 'financial_report' | 'subscriptions';
  // Specific card data
  extractedLogs?: string[];
  spendingAlerts?: {
    category: string;
    arabicCategory: string;
    amount: number;
    percentChange: number;
    color: string;
  }[];
  financialReport?: {
    userName: string;
    sparklineData: number[];
    adviceText: string;
  };
  subscriptions?: Subscription[];
}

export interface SpendingCategoryLimit {
  category: string;
  arabicCategory: string;
  limit: number;
  spent: number;
}
