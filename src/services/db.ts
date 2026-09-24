import {
  Account,
  AlertReminder,
  AppSettings,
  Budget,
  Category,
  SavingsGoal,
  Transaction,
} from '../types';

const DB_NAME = 'FinPulsePro_DB';
const DB_VERSION = 3; // Version 3: Clean zero slate architecture

export const FRESH_ZERO_INIT_KEY = 'finpulse_zeroed_fresh_state_v3';
export const INR_MIGRATION_KEY = 'finpulse_default_currency_inr_v1';

export const STORES = {
  TRANSACTIONS: 'transactions',
  ACCOUNTS: 'accounts',
  CATEGORIES: 'categories',
  GOALS: 'goals',
  BUDGETS: 'budgets',
  SETTINGS: 'settings',
  REMINDERS: 'reminders',
} as const;

type StoreName = typeof STORES[keyof typeof STORES];

let dbInstance: IDBDatabase | null = null;
const listeners = new Set<() => void>();

export function subscribeToDB(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function notifySubscribers() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error('Error in DB subscriber:', e);
    }
  });
}

/**
 * Open or initialize IndexedDB
 */
export async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
        const transStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
        transStore.createIndex('date', 'date', { unique: false });
        transStore.createIndex('type', 'type', { unique: false });
        transStore.createIndex('categoryId', 'categoryId', { unique: false });
        transStore.createIndex('accountId', 'accountId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.ACCOUNTS)) {
        db.createObjectStore(STORES.ACCOUNTS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
        db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.GOALS)) {
        db.createObjectStore(STORES.GOALS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.BUDGETS)) {
        db.createObjectStore(STORES.BUDGETS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains(STORES.REMINDERS)) {
        const reminderStore = db.createObjectStore(STORES.REMINDERS, { keyPath: 'id' });
        reminderStore.createIndex('dueDate', 'dueDate', { unique: false });
        reminderStore.createIndex('isCompleted', 'isCompleted', { unique: false });
      }
    };

    request.onsuccess = async (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      await ensureSeedData(dbInstance);
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Generic fetch all records from a store
 */
export async function getAllFromStore<T>(storeName: StoreName): Promise<T[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic put record into a store
 */
export async function putInStore<T>(storeName: StoreName, value: T): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(value);

    request.onsuccess = () => {
      notifySubscribers();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic delete record from a store
 */
export async function deleteFromStore(storeName: StoreName, key: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => {
      notifySubscribers();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear a store
 */
export async function clearStore(storeName: StoreName): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => {
      notifySubscribers();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Default categories (clean taxonomy ready for personal use)
 */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-salary', name: 'Salary & Wages', icon: 'Briefcase', color: '#22c55e', type: 'income' },
  { id: 'cat-invest', name: 'Investments & Dividends', icon: 'TrendingUp', color: '#3b82f6', type: 'income' },
  { id: 'cat-freelance', name: 'Freelance & Business', icon: 'Sparkles', color: '#a855f7', type: 'income' },
  { id: 'cat-other-income', name: 'Other Income', icon: 'Coins', color: '#10b981', type: 'income' },
  { id: 'cat-food', name: 'Food & Dining', icon: 'Utensils', color: '#f59e0b', type: 'expense' },
  { id: 'cat-groceries', name: 'Groceries & Household', icon: 'ShoppingBag', color: '#10b981', type: 'expense' },
  { id: 'cat-housing', name: 'Housing & Rent', icon: 'Home', color: '#6366f1', type: 'expense' },
  { id: 'cat-transport', name: 'Transit & Auto', icon: 'Car', color: '#06b6d4', type: 'expense' },
  { id: 'cat-entertainment', name: 'Entertainment & Leisure', icon: 'Film', color: '#ec4899', type: 'expense' },
  { id: 'cat-tech', name: 'Tech & Subscriptions', icon: 'Laptop', color: '#8b5cf6', type: 'expense' },
  { id: 'cat-utilities', name: 'Bills & Utilities', icon: 'Zap', color: '#f97316', type: 'expense' },
  { id: 'cat-health', name: 'Health & Wellness', icon: 'HeartPulse', color: '#ef4444', type: 'expense' },
  { id: 'cat-travel', name: 'Travel & Vacations', icon: 'Plane', color: '#14b8a6', type: 'expense' },
];

/**
 * Clean starter accounts with zero balance
 */
export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc-checking',
    name: 'Primary Checking',
    type: 'checking',
    balance: 0,
    currency: 'INR',
    color: '#3b82f6',
    icon: 'Landmark',
    accountNumber: '•••• 1001',
  },
  {
    id: 'acc-savings',
    name: 'High-Yield Savings',
    type: 'savings',
    balance: 0,
    currency: 'INR',
    color: '#10b981',
    icon: 'ShieldCheck',
    accountNumber: '•••• 2002',
  },
  {
    id: 'acc-credit',
    name: 'Credit Card',
    type: 'credit',
    balance: 0,
    currency: 'INR',
    color: '#8b5cf6',
    icon: 'CreditCard',
    accountNumber: '•••• 3003',
  },
  {
    id: 'acc-cash',
    name: 'Cash Wallet',
    type: 'cash',
    balance: 0,
    currency: 'INR',
    color: '#f59e0b',
    icon: 'Coins',
  },
];

export const DEFAULT_GOALS: SavingsGoal[] = [];

export const DEFAULT_BUDGETS: Budget[] = [];

export const DEFAULT_REMINDERS: AlertReminder[] = [];

/**
 * Default App Settings with full security configuration and Indian Rupee base
 */
export const DEFAULT_SETTINGS: AppSettings = {
  baseCurrency: 'INR',
  theme: 'fintech-dark',
  roundUpEnabled: false,
  roundUpRule: 10,
  roundUpTargetGoalId: '',
  isProUnlocked: true,
  userName: 'FinPulse User',
  monthlySavingsTarget: 25000,
  customExchangeRates: {},
  security: {
    isPasswordProtected: false,
    autoLockTimeoutMinutes: 5,
    dataEncryptionEnabled: false,
  },
};

/**
 * Ensure initial database structure is populated with CLEAN empty data (no sample transactions, 0 balances)
 */
async function ensureSeedData(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    let freshNeeded = false;
    try {
      if (typeof window !== 'undefined' && localStorage.getItem(FRESH_ZERO_INIT_KEY) !== 'done') {
        freshNeeded = true;
      }
    } catch (e) {
      freshNeeded = false;
    }

    const tx = db.transaction(
      [
        STORES.TRANSACTIONS,
        STORES.ACCOUNTS,
        STORES.CATEGORIES,
        STORES.GOALS,
        STORES.BUDGETS,
        STORES.SETTINGS,
        STORES.REMINDERS,
      ],
      'readwrite'
    );

    const catStore = tx.objectStore(STORES.CATEGORIES);
    const countReq = catStore.count();

    countReq.onsuccess = () => {
      if (countReq.result === 0 || freshNeeded) {
        // Clear all stores to ensure 100% clean zero state
        if (freshNeeded) {
          tx.objectStore(STORES.TRANSACTIONS).clear();
          tx.objectStore(STORES.GOALS).clear();
          tx.objectStore(STORES.BUDGETS).clear();
          tx.objectStore(STORES.REMINDERS).clear();
          tx.objectStore(STORES.ACCOUNTS).clear();
          tx.objectStore(STORES.CATEGORIES).clear();
        }

        // Fresh default taxonomy
        DEFAULT_CATEGORIES.forEach((cat) => tx.objectStore(STORES.CATEGORIES).put(cat));
        // Clean starter accounts with exactly 0.00 balances
        DEFAULT_ACCOUNTS.forEach((acc) => tx.objectStore(STORES.ACCOUNTS).put({ ...acc, balance: 0 }));
        // Clean default settings
        tx.objectStore(STORES.SETTINGS).put({ key: 'app_settings', value: DEFAULT_SETTINGS });

        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(FRESH_ZERO_INIT_KEY, 'done');
          }
        } catch (e) {}
      }
    };

    tx.oncomplete = () => {
      resolve();
    };

    tx.onerror = () => {
      console.error('Seed setup failed:', tx.error);
      reject(tx.error);
    };
  });
}

/**
 * Reset all stores to completely clean, fresh empty slate with all accounts at ₹0.00
 */
export async function clearAllSampleData(preserveSecuritySettings: boolean = true): Promise<void> {
  const db = await getDB();
  const storeNames = [
    STORES.TRANSACTIONS,
    STORES.ACCOUNTS,
    STORES.CATEGORIES,
    STORES.GOALS,
    STORES.BUDGETS,
    STORES.SETTINGS,
    STORES.REMINDERS,
  ];

  let existingSettings: AppSettings = DEFAULT_SETTINGS;
  if (preserveSecuritySettings) {
    try {
      const sets = await getAllFromStore<{ key: string; value: AppSettings }>(STORES.SETTINGS);
      if (sets && sets[0]?.value) {
        existingSettings = {
          ...DEFAULT_SETTINGS,
          security: sets[0].value.security || DEFAULT_SETTINGS.security,
          baseCurrency: sets[0].value.baseCurrency || 'INR',
        };
      }
    } catch (e) {
      console.warn('Could not read existing settings for preservation:', e);
    }
  }

  const tx = db.transaction(storeNames, 'readwrite');
  storeNames.forEach((s) => tx.objectStore(s).clear());

  DEFAULT_CATEGORIES.forEach((cat) => tx.objectStore(STORES.CATEGORIES).put(cat));
  // All accounts guaranteed 0 balance
  DEFAULT_ACCOUNTS.forEach((acc) => tx.objectStore(STORES.ACCOUNTS).put({ ...acc, balance: 0 }));
  tx.objectStore(STORES.SETTINGS).put({ key: 'app_settings', value: existingSettings });

  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(FRESH_ZERO_INIT_KEY, 'done');
    }
  } catch (e) {}

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      notifySubscribers();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Explicit alias to make all financial data zero for fresh entry
 */
export async function makeAllDataZero(preserveSecuritySettings: boolean = true): Promise<void> {
  return clearAllSampleData(preserveSecuritySettings);
}

/**
 * Full Database JSON Backup Export
 */
export async function exportDatabaseBackup(): Promise<string> {
  const [transactions, accounts, categories, goals, budgets, reminders, settingsRecords] = await Promise.all([
    getAllFromStore<Transaction>(STORES.TRANSACTIONS),
    getAllFromStore<Account>(STORES.ACCOUNTS),
    getAllFromStore<Category>(STORES.CATEGORIES),
    getAllFromStore<SavingsGoal>(STORES.GOALS),
    getAllFromStore<Budget>(STORES.BUDGETS),
    getAllFromStore<AlertReminder>(STORES.REMINDERS),
    getAllFromStore<{ key: string; value: AppSettings }>(STORES.SETTINGS),
  ]);

  const backup = {
    appName: 'FinPulse Pro',
    exportedAt: new Date().toISOString(),
    version: DB_VERSION,
    data: {
      transactions,
      accounts,
      categories,
      goals,
      budgets,
      reminders,
      settings: settingsRecords[0]?.value || DEFAULT_SETTINGS,
    },
  };

  return JSON.stringify(backup, null, 2);
}

/**
 * Full Database Import
 */
export async function importDatabaseBackup(jsonString: string): Promise<boolean> {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.data) throw new Error('Invalid backup format');

    const db = await getDB();
    const tx = db.transaction(
      [
        STORES.TRANSACTIONS,
        STORES.ACCOUNTS,
        STORES.CATEGORIES,
        STORES.GOALS,
        STORES.BUDGETS,
        STORES.SETTINGS,
        STORES.REMINDERS,
      ],
      'readwrite'
    );

    tx.objectStore(STORES.TRANSACTIONS).clear();
    tx.objectStore(STORES.ACCOUNTS).clear();
    tx.objectStore(STORES.CATEGORIES).clear();
    tx.objectStore(STORES.GOALS).clear();
    tx.objectStore(STORES.BUDGETS).clear();
    tx.objectStore(STORES.SETTINGS).clear();
    if (tx.objectStoreNames.contains(STORES.REMINDERS)) {
      tx.objectStore(STORES.REMINDERS).clear();
    }

    const data = parsed.data;
    (data.categories || []).forEach((c: Category) => tx.objectStore(STORES.CATEGORIES).put(c));
    (data.accounts || []).forEach((a: Account) => tx.objectStore(STORES.ACCOUNTS).put(a));
    (data.goals || []).forEach((g: SavingsGoal) => tx.objectStore(STORES.GOALS).put(g));
    (data.budgets || []).forEach((b: Budget) => tx.objectStore(STORES.BUDGETS).put(b));
    (data.transactions || []).forEach((t: Transaction) => tx.objectStore(STORES.TRANSACTIONS).put(t));
    (data.reminders || []).forEach((r: AlertReminder) => tx.objectStore(STORES.REMINDERS).put(r));
    if (data.settings) {
      tx.objectStore(STORES.SETTINGS).put({ key: 'app_settings', value: data.settings });
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        notifySubscribers();
        resolve(true);
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Import failed:', err);
    throw err;
  }
}

/**
 * Export Transactions as CSV
 */
export function exportTransactionsCSV(
  transactions: Transaction[],
  categoriesMap: Map<string, Category>,
  accountsMap: Map<string, Account>
): string {
  const headers = ['Date', 'Type', 'Amount', 'Merchant', 'Category', 'Account', 'Notes', 'Tags', 'RoundUp'];
  const rows = transactions.map((t) => {
    const cat = categoriesMap.get(t.categoryId)?.name || t.categoryId;
    const acc = accountsMap.get(t.accountId)?.name || t.accountId;
    return [
      `"${t.date}"`,
      `"${t.type}"`,
      t.amount.toFixed(2),
      `"${(t.merchant || '').replace(/"/g, '""')}"`,
      `"${cat.replace(/"/g, '""')}"`,
      `"${acc.replace(/"/g, '""')}"`,
      `"${(t.note || '').replace(/"/g, '""')}"`,
      `"${(t.tags || []).join('; ')}"`,
      (t.roundUpAmount || 0).toFixed(2),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
