import { Transaction } from '../types';

// Map of Arabic digits to English digits
const ARABIC_DIGITS: { [key: string]: string } = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
};

function normalizeDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (char) => ARABIC_DIGITS[char] || char);
}

// Category keywords mapper
const CATEGORY_KEYWORDS: { [key: string]: Array<string> } = {
  Food: ['قهوة', 'جبل', 'كافيه', 'مطعم', 'جاهز', 'هنقرستيشن', 'دليفري', 'شاورما', 'البيك', 'ماك', 'وجبة', 'غداء', 'عشاء', 'فطور', 'cafe', 'restaurant', 'coffee', 'local cafe', 'cafeteria'],
  Transport: ['بنزين', 'اوبر', 'تاكسي', 'مواصلات', 'سيارة', 'شحن', 'محطة', 'سابتكو', 'قطار', 'uber', 'taxi', 'fuel', 'gas', 'transportation'],
  Entertainment: ['العاب', 'سينما', 'ترفيه', 'بلايستيشن', 'بلاي ستيشن', 'cinema', 'games', 'playstation', 'shahid', 'شاهد', 'anghami', 'انغامي'],
  Subscriptions: ['اشتراك', 'نتفلكس', 'netflix', 'شاهد', 'shahid', 'انغامي', 'anghami', 'ايكلاود', 'icloud', 'سبوتيفاي', 'spotify', 'subscription'],
  Shopping: ['نون', 'noon', 'امازون', 'amazon', 'جرير', 'jarir', 'ملابس', 'محل', 'شي ان', 'shein', 'تسوق', 'electronics', 'shopping'],
  Education: ['جامعة', 'كتب', 'مكتبة', 'تصوير', 'طباعة', 'دراسة', 'كورسات', 'university', 'bookstore', 'copy', 'print', 'education'],
  Groceries: ['بقالة', 'سوبرماركت', 'المزرعة', 'الدانوب', 'بندة', 'لولو', 'تموينات', 'اسواق', 'supermarket', 'groceries']
};

export function detectCategory(text: string): Transaction['category'] {
  const lowerText = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return category as Transaction['category'];
      }
    }
  }
  return 'Other';
}

export interface ParseResult {
  isQuery: boolean;
  queryType?: 'analysis' | 'subscriptions' | 'general';
  transactions: Omit<Transaction, 'id'>[];
}

export function parseExpenseInput(rawText: string): ParseResult {
  const normalized = normalizeDigits(rawText).trim();

  // Check if it's a query instead of expense logging
  const lowerNormalized = normalized.toLowerCase();
  
  if (
    lowerNormalized.includes('وين صرفت') || 
    lowerNormalized.includes('تحليل') || 
    lowerNormalized.includes('تقرير') || 
    lowerNormalized.includes('where did i spend')
  ) {
    return { isQuery: true, queryType: 'analysis', transactions: [] };
  }

  if (
    lowerNormalized.includes('اشتراك') || 
    lowerNormalized.includes('check my subscription') || 
    lowerNormalized.includes('الاشتراكات') || 
    lowerNormalized.includes('subscriptions')
  ) {
    return { isQuery: true, queryType: 'subscriptions', transactions: [] };
  }

  // Parse potential multiple transactions split by comma or newline
  const parts = normalized.split(/[،,\n]+/);
  const transactions: Omit<Transaction, 'id'>[] = [];

  for (const part of parts) {
    const cleanPart = part.trim();
    if (!cleanPart) continue;

    // Regex to capture pattern: [Merchant Name] [Number] [optional: SAR / ريال]
    // or [Number] [SAR / ريال] [Merchant Name]
    // Example: "نون 78 ريال", "قهوة جبل 22", "نتفلكس 55"
    // Also support numbers at the start or end
    
    // Pattern 1: Merchant name then amount
    // Let's split by spaces and analyze
    const words = cleanPart.split(/\s+/);
    if (words.length < 2) continue;

    let amount: number | null = null;
    let merchantWords: string[] = [];

    // Find the number in the phrase
    for (let i = 0; i < words.length; i++) {
      const parsedVal = parseFloat(words[i]);
      if (!isNaN(parsedVal) && !words[i].includes('-') && !words[i].includes('/')) {
        amount = parsedVal;
        // The merchant name is everything except the number and currency keywords
        merchantWords = words.filter((_, idx) => idx !== i && !['ريال', 'SAR', 'sar', 'ريالا', 'sr'].includes(words[idx]));
        break;
      }
    }

    if (amount !== null && merchantWords.length > 0) {
      const merchant = merchantWords.join(' ');
      const category = detectCategory(cleanPart);
      const today = new Date().toISOString().split('T')[0];

      transactions.push({
        date: today,
        merchant,
        amount,
        category,
        rawText: cleanPart
      });
    }
  }

  // If no transactions could be parsed, check if it's just a general question
  if (transactions.length === 0) {
    return { isQuery: true, queryType: 'general', transactions: [] };
  }

  return {
    isQuery: false,
    transactions
  };
}
