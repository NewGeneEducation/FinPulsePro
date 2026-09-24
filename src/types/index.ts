/**
 * FinPulse Pro Data Types
 */

export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'CAD'
  | 'AUD'
  | 'INR'
  | 'CHF'
  | 'SGD'
  | 'AED'
  | 'CNY'
  | 'BRL';

export interface CurrencyInfo {
  code: CurrencyCode;
  name: string;
  symbol: string;
  rateToUSD: number; // e.g., EUR = 0.92 (1 USD = 0.92 EUR)
  symbolBefore: boolean;
  decimalDigits: number;
}

export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Transaction {
  id: string;
  amount: number; // in base currency amount
  originalAmount?: number;
  originalCurrency?: CurrencyCode;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  targetAccountId?: string; // used when type === 'transfer'
  date: string; // ISO date string YYYY-MM-DD
  time?: string;
  merchant?: string;
  note?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  currency?: CurrencyCode;
  roundUpAmount?: number; // amount contributed to savings goal via round-up
  roundUpGoalId?: string;
  isEncrypted?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  budgetLimit?: number;
}

export type AccountType = 'checking' | 'savings' | 'credit' | 'cash' | 'investment';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: CurrencyCode;
  color: string;
  icon: string;
  accountNumber?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO string YYYY-MM-DD
  color: string;
  icon: string;
  category: string;
  autoRoundUp: boolean; // whether round-ups feed into this goal
  autoAllocationPercent: number; // e.g. 5% of all income
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  monthlyLimit: number;
  alertThreshold: number; // e.g. 0.8 for 80%
}

export type ReminderFrequency = 'once' | 'daily' | 'weekly' | 'monthly';

export interface AlertReminder {
  id: string;
  title: string;
  amount?: number;
  dueDate: string; // YYYY-MM-DD
  category: 'bill' | 'savings' | 'budget_check' | 'tax' | 'salary' | 'custom';
  frequency: ReminderFrequency;
  isCompleted: boolean;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  createdAt: string;
}

export type AppTheme = 'fintech-dark' | 'emerald' | 'slate' | 'light';

export interface SecuritySettings {
  isPasswordProtected: boolean;
  passwordHash?: string;
  passwordSalt?: string;
  securityQuestion?: string;
  securityAnswerHash?: string;
  securityAnswerSalt?: string;
  autoLockTimeoutMinutes: number; // 0 for immediate, 5, 15, 30
  dataEncryptionEnabled: boolean;
}

export interface AppSettings {
  baseCurrency: CurrencyCode;
  theme: AppTheme;
  roundUpEnabled: boolean;
  roundUpRule: 1 | 5 | 10; // round up to nearest $1, $5, or $10
  roundUpTargetGoalId: string;
  isProUnlocked: boolean;
  userName: string;
  monthlySavingsTarget: number;
  customExchangeRates: Record<string, number>;
  security: SecuritySettings;
}
