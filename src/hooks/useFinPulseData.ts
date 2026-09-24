import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Account,
  AlertReminder,
  AppSettings,
  Budget,
  Category,
  SavingsGoal,
  Transaction,
} from '../types';
import {
  getAllFromStore,
  putInStore,
  deleteFromStore,
  subscribeToDB,
  STORES,
  DEFAULT_SETTINGS,
  DEFAULT_ACCOUNTS,
  clearAllSampleData,
  makeAllDataZero as dbMakeAllDataZero,
  FRESH_ZERO_INIT_KEY,
  INR_MIGRATION_KEY,
  exportDatabaseBackup,
  importDatabaseBackup,
  exportTransactionsCSV,
} from '../services/db';
import { calculateRoundUp, convertAmount } from '../utils/currency';

export function useFinPulseData() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [reminders, setReminders] = useState<AlertReminder[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch all stores from IndexedDB
  const refreshData = useCallback(async () => {
    try {
      // Auto-zero clean state verification: if user requested all data zero, enforce it on startup
      try {
        if (typeof window !== 'undefined' && localStorage.getItem(FRESH_ZERO_INIT_KEY) !== 'done') {
          await dbMakeAllDataZero(true);
          localStorage.setItem(FRESH_ZERO_INIT_KEY, 'done');
        }
      } catch (e) {
        console.warn('Auto fresh zero check encountered:', e);
      }

      // Default Indian Rupees (INR) migration: automatically ensure default currency is INR
      try {
        if (typeof window !== 'undefined' && localStorage.getItem(INR_MIGRATION_KEY) !== 'done') {
          const existingSets = await getAllFromStore<{ key: string; value: AppSettings }>(STORES.SETTINGS);
          if (existingSets && existingSets.length > 0 && existingSets[0]?.value) {
            const currentSets = existingSets[0].value;
            if (!currentSets.baseCurrency || currentSets.baseCurrency === 'USD') {
              currentSets.baseCurrency = 'INR';
              await putInStore(STORES.SETTINGS, { key: 'app_settings', value: currentSets });
            }
          }

          const existingAccs = await getAllFromStore<Account>(STORES.ACCOUNTS);
          if (existingAccs && existingAccs.length > 0) {
            for (const acc of existingAccs) {
              if (!acc.currency || acc.currency === 'USD') {
                await putInStore(STORES.ACCOUNTS, { ...acc, currency: 'INR' });
              }
            }
          }

          localStorage.setItem(INR_MIGRATION_KEY, 'done');
        }
      } catch (e) {
        console.warn('INR default migration encountered:', e);
      }

      const [txs, accs, cats, gls, bdgs, sets, rems] = await Promise.all([
        getAllFromStore<Transaction>(STORES.TRANSACTIONS),
        getAllFromStore<Account>(STORES.ACCOUNTS),
        getAllFromStore<Category>(STORES.CATEGORIES),
        getAllFromStore<SavingsGoal>(STORES.GOALS),
        getAllFromStore<Budget>(STORES.BUDGETS),
        getAllFromStore<{ key: string; value: AppSettings }>(STORES.SETTINGS),
        getAllFromStore<AlertReminder>(STORES.REMINDERS).catch(() => []),
      ]);

      // Check if previous legacy sample transactions exist, clean them if needed
      // If user had seed transactions starting with 'tx-1', 'tx-2' etc from prior version:
      // We will allow user to keep or clear with clearAllSampleData
      txs.sort((a, b) => {
        const dCompare = b.date.localeCompare(a.date);
        if (dCompare !== 0) return dCompare;
        return (b.time || '').localeCompare(a.time || '');
      });

      setTransactions(txs);
      setAccounts(accs);
      setCategories(cats);
      setGoals(gls);
      setBudgets(bdgs);
      setReminders(rems || []);

      if (sets && sets.length > 0 && sets[0].value) {
        // ensure security settings exist
        const loadedSettings = sets[0].value;
        if (!loadedSettings.security) {
          loadedSettings.security = DEFAULT_SETTINGS.security;
        }
        setSettings(loadedSettings);
      }
    } catch (err) {
      console.error('Failed to load data from IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Subscribe to IndexedDB changes
  useEffect(() => {
    refreshData();
    const unsubscribe = subscribeToDB(refreshData);
    return () => unsubscribe();
  }, [refreshData]);

  // Fast Category & Account lookup maps
  const categoriesMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const accountsMap = useMemo(() => {
    const map = new Map<string, Account>();
    accounts.forEach((a) => map.set(a.id, a));
    return map;
  }, [accounts]);

  const goalsMap = useMemo(() => {
    const map = new Map<string, SavingsGoal>();
    goals.forEach((g) => map.set(g.id, g));
    return map;
  }, [goals]);

  // Net Worth (checking + savings + cash - credit cards or liabilities)
  const netWorth = useMemo(() => {
    return accounts.reduce((acc, a) => acc + a.balance, 0);
  }, [accounts]);

  // Current Month calculations
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(currentYearMonth));
  }, [transactions, currentYearMonth]);

  const currentMonthIncome = useMemo(() => {
    return currentMonthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTransactions]);

  const currentMonthExpense = useMemo(() => {
    return currentMonthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTransactions]);

  const currentMonthSaved = currentMonthIncome - currentMonthExpense;
  const currentMonthSavingsRate = currentMonthIncome > 0
    ? Math.max(0, Math.round((currentMonthSaved / currentMonthIncome) * 100))
    : 0;

  // Round-ups aggregated
  const totalRoundUpsThisMonth = useMemo(() => {
    return currentMonthTransactions.reduce((sum, t) => sum + (t.roundUpAmount || 0), 0);
  }, [currentMonthTransactions]);

  const totalRoundUpsAllTime = useMemo(() => {
    return transactions.reduce((sum, t) => sum + (t.roundUpAmount || 0), 0);
  }, [transactions]);

  // Spending Breakdown by Category
  const categorySpendBreakdown = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    let totalExpense = 0;

    currentMonthTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount;
        totalExpense += t.amount;
      });

    return Object.entries(categoryTotals)
      .map(([catId, amount]) => {
        const cat = categoriesMap.get(catId);
        return {
          categoryId: catId,
          name: cat?.name || 'Other',
          color: cat?.color || '#94a3b8',
          icon: cat?.icon || 'Tag',
          amount,
          percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [currentMonthTransactions, categoriesMap]);

  // Budget Status & Alert Thresholds
  const budgetStatuses = useMemo(() => {
    return budgets.map((b) => {
      const cat = categoriesMap.get(b.categoryId);
      const spent = currentMonthTransactions
        .filter((t) => t.type === 'expense' && t.categoryId === b.categoryId)
        .reduce((sum, t) => sum + t.amount, 0);

      const ratio = b.monthlyLimit > 0 ? spent / b.monthlyLimit : 0;
      const percentage = Math.round(ratio * 100);
      const isWarning = ratio >= b.alertThreshold && ratio < 1;
      const isOverBudget = ratio >= 1;

      return {
        budgetId: b.id,
        categoryId: b.categoryId,
        categoryName: cat?.name || 'Category',
        color: cat?.color || '#3b82f6',
        icon: cat?.icon || 'Tag',
        spent,
        monthlyLimit: b.monthlyLimit,
        remaining: Math.max(0, b.monthlyLimit - spent),
        percentage,
        isWarning,
        isOverBudget,
        alertThreshold: b.alertThreshold,
      };
    });
  }, [budgets, categoriesMap, currentMonthTransactions]);

  // Daily Spending Trend (Last 14 days)
  const dailySpendTrend = useMemo(() => {
    const days: { date: string; label: string; expense: number; income: number }[] = [];
    const today = new Date();

    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });

      const dayTxs = transactions.filter((t) => t.date === dateStr);
      const exp = dayTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const inc = dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);

      days.push({
        date: dateStr,
        label: dayLabel,
        expense: exp,
        income: inc,
      });
    }
    return days;
  }, [transactions]);

  // Pro Financial Runway
  const averageMonthlyExpense = useMemo(() => {
    if (currentMonthExpense > 0) return currentMonthExpense;
    return 1000;
  }, [currentMonthExpense]);

  const liquidSavings = useMemo(() => {
    return accounts
      .filter((a) => a.type === 'checking' || a.type === 'savings' || a.type === 'cash')
      .reduce((sum, a) => sum + Math.max(0, a.balance), 0);
  }, [accounts]);

  const financialRunwayMonths = averageMonthlyExpense > 0
    ? (liquidSavings / averageMonthlyExpense).toFixed(1)
    : '0';

  // Overall Financial Health Score (0 - 100)
  const financialHealthScore = useMemo(() => {
    if (accounts.length === 0 || (currentMonthIncome === 0 && currentMonthExpense === 0 && netWorth === 0)) {
      return 75; // Neutral starting score for clean slate
    }
    let score = 60;
    score += Math.min(25, Math.max(-20, (currentMonthSavingsRate - 15) * 1.5));
    const runway = parseFloat(financialRunwayMonths);
    if (runway >= 6) score += 15;
    else if (runway >= 3) score += 10;
    else if (runway >= 1) score += 5;
    else if (runway > 0) score -= 5;

    const overCount = budgetStatuses.filter((b) => b.isOverBudget).length;
    score -= overCount * 6;
    return Math.max(10, Math.min(99, Math.round(score)));
  }, [accounts, currentMonthIncome, currentMonthExpense, netWorth, currentMonthSavingsRate, financialRunwayMonths, budgetStatuses]);

  // Active / Due Reminders
  const activeReminders = useMemo(() => {
    return reminders.filter((r) => !r.isCompleted);
  }, [reminders]);

  const dueRemindersCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return reminders.filter((r) => !r.isCompleted && r.dueDate <= today).length;
  }, [reminders]);

  // MUTATIONS

  // Add Transaction with automated smart round-up & savings allocation
  const addTransaction = useCallback(
    async (txData: Omit<Transaction, 'id'>) => {
      const id = 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      let roundUpAmount = 0;
      let roundUpGoalId: string | undefined = undefined;

      // Automated Round-Up logic on expenses
      if (txData.type === 'expense' && settings.roundUpEnabled && settings.roundUpTargetGoalId) {
        roundUpAmount = calculateRoundUp(txData.amount, settings.roundUpRule);
        if (roundUpAmount > 0) {
          roundUpGoalId = settings.roundUpTargetGoalId;
          const targetGoal = goalsMap.get(roundUpGoalId);
          if (targetGoal) {
            await putInStore(STORES.GOALS, {
              ...targetGoal,
              currentAmount: Number((targetGoal.currentAmount + roundUpAmount).toFixed(2)),
            });
          }
        }
      }

      // Automated Savings Allocation on Income (e.g. 5% or 10% auto-allocated to goals with autoAllocationPercent > 0)
      if (txData.type === 'income') {
        for (const goal of goals) {
          if (goal.autoAllocationPercent > 0) {
            const allocated = Number(((txData.amount * goal.autoAllocationPercent) / 100).toFixed(2));
            if (allocated > 0) {
              await putInStore(STORES.GOALS, {
                ...goal,
                currentAmount: Number((goal.currentAmount + allocated).toFixed(2)),
              });
            }
          }
        }
      }

      const newTx: Transaction = {
        ...txData,
        id,
        roundUpAmount: roundUpAmount > 0 ? roundUpAmount : undefined,
        roundUpGoalId: roundUpGoalId,
      };

      // Adjust Account balance
      const account = accountsMap.get(txData.accountId);
      if (account) {
        const netAdjustment = txData.type === 'expense'
          ? -(txData.amount + roundUpAmount)
          : txData.type === 'income'
          ? txData.amount
          : -txData.amount;

        await putInStore(STORES.ACCOUNTS, {
          ...account,
          balance: Number((account.balance + netAdjustment).toFixed(2)),
        });

        // If transfer, credit destination account
        if (txData.type === 'transfer' && txData.targetAccountId) {
          const destAccount = accountsMap.get(txData.targetAccountId);
          if (destAccount) {
            await putInStore(STORES.ACCOUNTS, {
              ...destAccount,
              balance: Number((destAccount.balance + txData.amount).toFixed(2)),
            });
          }
        }
      }

      await putInStore(STORES.TRANSACTIONS, newTx);
    },
    [settings, goalsMap, goals, accountsMap]
  );

  // Edit / Update Transaction
  const updateTransaction = useCallback(
    async (updatedTx: Transaction) => {
      const oldTx = transactions.find((t) => t.id === updatedTx.id);
      if (!oldTx) return;

      // First revert old transaction effect on old account
      const oldAcc = accountsMap.get(oldTx.accountId);
      if (oldAcc) {
        const oldRoundUp = oldTx.roundUpAmount || 0;
        const revertAmt = oldTx.type === 'expense'
          ? oldTx.amount + oldRoundUp
          : oldTx.type === 'income'
          ? -oldTx.amount
          : oldTx.amount;

        await putInStore(STORES.ACCOUNTS, {
          ...oldAcc,
          balance: Number((oldAcc.balance + revertAmt).toFixed(2)),
        });

        if (oldTx.type === 'transfer' && oldTx.targetAccountId) {
          const oldDest = accountsMap.get(oldTx.targetAccountId);
          if (oldDest) {
            await putInStore(STORES.ACCOUNTS, {
              ...oldDest,
              balance: Number((oldDest.balance - oldTx.amount).toFixed(2)),
            });
          }
        }
      }

      // Revert old round-up from goal if existed
      if (oldTx.roundUpAmount && oldTx.roundUpGoalId) {
        const goal = goalsMap.get(oldTx.roundUpGoalId);
        if (goal) {
          await putInStore(STORES.GOALS, {
            ...goal,
            currentAmount: Math.max(0, Number((goal.currentAmount - oldTx.roundUpAmount).toFixed(2))),
          });
        }
      }

      // Calculate new round-up if expense
      let newRoundUp = 0;
      let newRoundUpGoalId: string | undefined = undefined;
      if (updatedTx.type === 'expense' && settings.roundUpEnabled && settings.roundUpTargetGoalId) {
        newRoundUp = calculateRoundUp(updatedTx.amount, settings.roundUpRule);
        if (newRoundUp > 0) {
          newRoundUpGoalId = settings.roundUpTargetGoalId;
          const targetGoal = goalsMap.get(newRoundUpGoalId);
          if (targetGoal) {
            await putInStore(STORES.GOALS, {
              ...targetGoal,
              currentAmount: Number((targetGoal.currentAmount + newRoundUp).toFixed(2)),
            });
          }
        }
      }

      const txToSave: Transaction = {
        ...updatedTx,
        roundUpAmount: newRoundUp > 0 ? newRoundUp : undefined,
        roundUpGoalId: newRoundUpGoalId,
      };

      // Apply new transaction balance adjustment
      // Need fresh account balance
      const newAcc = accountsMap.get(updatedTx.accountId);
      if (newAcc) {
        // compute new balance from current in map (incorporating previous revert)
        const isSameAcc = oldAcc && oldAcc.id === newAcc.id;
        const baseBal = isSameAcc
          ? newAcc.balance + (oldTx.type === 'expense' ? (oldTx.amount + (oldTx.roundUpAmount || 0)) : oldTx.type === 'income' ? -oldTx.amount : oldTx.amount)
          : newAcc.balance;

        const netAdj = updatedTx.type === 'expense'
          ? -(updatedTx.amount + newRoundUp)
          : updatedTx.type === 'income'
          ? updatedTx.amount
          : -updatedTx.amount;

        await putInStore(STORES.ACCOUNTS, {
          ...newAcc,
          balance: Number((baseBal + netAdj).toFixed(2)),
        });

        if (updatedTx.type === 'transfer' && updatedTx.targetAccountId) {
          const dest = accountsMap.get(updatedTx.targetAccountId);
          if (dest) {
            await putInStore(STORES.ACCOUNTS, {
              ...dest,
              balance: Number((dest.balance + updatedTx.amount).toFixed(2)),
            });
          }
        }
      }

      await putInStore(STORES.TRANSACTIONS, txToSave);
    },
    [transactions, accountsMap, goalsMap, settings]
  );

  // Delete Transaction
  const deleteTransaction = useCallback(
    async (id: string) => {
      // Optimistically remove from state immediately so UI updates with zero delay
      setTransactions((prev) => prev.filter((t) => t.id !== id));

      const tx = transactions.find((t) => t.id === id);
      if (tx) {
        const account = accountsMap.get(tx.accountId);
        if (account) {
          const roundUp = tx.roundUpAmount || 0;
          const reverseAmount = tx.type === 'expense'
            ? tx.amount + roundUp
            : tx.type === 'income'
            ? -tx.amount
            : tx.amount;

          await putInStore(STORES.ACCOUNTS, {
            ...account,
            balance: Number((account.balance + reverseAmount).toFixed(2)),
          });

          if (tx.type === 'transfer' && tx.targetAccountId) {
            const dest = accountsMap.get(tx.targetAccountId);
            if (dest) {
              await putInStore(STORES.ACCOUNTS, {
                ...dest,
                balance: Number((dest.balance - tx.amount).toFixed(2)),
              });
            }
          }

          if (roundUp > 0 && tx.roundUpGoalId) {
            const targetGoal = goalsMap.get(tx.roundUpGoalId);
            if (targetGoal) {
              await putInStore(STORES.GOALS, {
                ...targetGoal,
                currentAmount: Math.max(0, Number((targetGoal.currentAmount - roundUp).toFixed(2))),
              });
            }
          }
        }
      }
      await deleteFromStore(STORES.TRANSACTIONS, id);
      await refreshData();
    },
    [transactions, accountsMap, goalsMap, refreshData]
  );

  // Reminders Operations
  const addReminder = useCallback(async (data: Omit<AlertReminder, 'id' | 'createdAt'>) => {
    const id = 'rem-' + Date.now();
    const newRem: AlertReminder = {
      ...data,
      id,
      createdAt: new Date().toISOString().split('T')[0],
    };
    await putInStore(STORES.REMINDERS, newRem);
    await refreshData();
  }, [refreshData]);

  const updateReminder = useCallback(async (reminder: AlertReminder) => {
    await putInStore(STORES.REMINDERS, reminder);
    await refreshData();
  }, [refreshData]);

  const toggleReminderCompleted = useCallback(async (id: string) => {
    const rem = reminders.find((r) => r.id === id);
    if (rem) {
      await putInStore(STORES.REMINDERS, {
        ...rem,
        isCompleted: !rem.isCompleted,
      });
      await refreshData();
    }
  }, [reminders, refreshData]);

  const deleteReminder = useCallback(async (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    await deleteFromStore(STORES.REMINDERS, id);
    await refreshData();
  }, [refreshData]);

  // Goal operations
  const addSavingsGoal = useCallback(async (goalData: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    const id = 'goal-' + Date.now();
    const newGoal: SavingsGoal = {
      ...goalData,
      id,
      createdAt: new Date().toISOString().split('T')[0],
    };
    await putInStore(STORES.GOALS, newGoal);
    await refreshData();
  }, [refreshData]);

  const updateSavingsGoal = useCallback(async (goal: SavingsGoal) => {
    await putInStore(STORES.GOALS, goal);
    await refreshData();
  }, [refreshData]);

  const deleteSavingsGoal = useCallback(async (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    await deleteFromStore(STORES.GOALS, id);
    await refreshData();
  }, [refreshData]);

  const depositToGoal = useCallback(
    async (goalId: string, amount: number, fromAccountId?: string) => {
      const goal = goalsMap.get(goalId);
      if (!goal || amount <= 0) return;

      const newGoal = {
        ...goal,
        currentAmount: Number((goal.currentAmount + amount).toFixed(2)),
      };
      await putInStore(STORES.GOALS, newGoal);

      if (fromAccountId) {
        const account = accountsMap.get(fromAccountId);
        if (account) {
          await putInStore(STORES.ACCOUNTS, {
            ...account,
            balance: Number((account.balance - amount).toFixed(2)),
          });
        }
      }
    },
    [goalsMap, accountsMap]
  );

  const withdrawFromGoal = useCallback(
    async (goalId: string, amount: number, toAccountId?: string) => {
      const goal = goalsMap.get(goalId);
      if (!goal || amount <= 0) return;

      const actualWithdraw = Math.min(amount, goal.currentAmount);
      const newGoal = {
        ...goal,
        currentAmount: Number((goal.currentAmount - actualWithdraw).toFixed(2)),
      };
      await putInStore(STORES.GOALS, newGoal);

      if (toAccountId) {
        const account = accountsMap.get(toAccountId);
        if (account) {
          await putInStore(STORES.ACCOUNTS, {
            ...account,
            balance: Number((account.balance + actualWithdraw).toFixed(2)),
          });
        }
      }
    },
    [goalsMap, accountsMap]
  );

  // Budget operation
  const setBudget = useCallback(
    async (categoryId: string, monthlyLimit: number, alertThreshold = 0.8) => {
      const existing = budgets.find((b) => b.categoryId === categoryId);
      const budget: Budget = {
        id: existing ? existing.id : 'b-' + categoryId,
        categoryId,
        monthlyLimit,
        alertThreshold,
      };
      await putInStore(STORES.BUDGETS, budget);
    },
    [budgets]
  );

  const deleteBudget = useCallback(async (id: string) => {
    await deleteFromStore(STORES.BUDGETS, id);
  }, []);

  // Account operations
  const addAccount = useCallback(async (accData: Omit<Account, 'id'>) => {
    const id = 'acc-' + Date.now();
    const newAcc: Account = { ...accData, id };
    setAccounts((prev) => [...prev, newAcc]);
    await putInStore(STORES.ACCOUNTS, newAcc);
    await refreshData();
    return newAcc;
  }, [refreshData]);

  const updateAccount = useCallback(
    async (account: Account) => {
      setAccounts((prev) => prev.map((a) => (a.id === account.id ? account : a)));
      await putInStore(STORES.ACCOUNTS, account);
      await refreshData();
    },
    [refreshData]
  );

  const updateAccountBalance = useCallback(
    async (accountId: string, newBalance: number) => {
      const acc = accounts.find((a) => a.id === accountId);
      if (!acc) return;
      const updated = { ...acc, balance: Number(newBalance.toFixed(2)) };
      setAccounts((prev) => prev.map((a) => (a.id === accountId ? updated : a)));
      await putInStore(STORES.ACCOUNTS, updated);
      await refreshData();
    },
    [accounts, refreshData]
  );

  const deleteAccount = useCallback(
    async (id: string, reassignToAccountId?: string) => {
      // Reassign transactions to alternative account if designated
      if (reassignToAccountId) {
        const txs = await getAllFromStore<Transaction>(STORES.TRANSACTIONS);
        const affected = txs.filter((t) => t.accountId === id || t.targetAccountId === id);
        for (const t of affected) {
          const updated = {
            ...t,
            accountId: t.accountId === id ? reassignToAccountId : t.accountId,
            targetAccountId: t.targetAccountId === id ? reassignToAccountId : t.targetAccountId,
          };
          await putInStore(STORES.TRANSACTIONS, updated);
        }
      }
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      await deleteFromStore(STORES.ACCOUNTS, id);
      await refreshData();
    },
    [refreshData]
  );

  // Category operations
  const addCategory = useCallback(
    async (catData: Omit<Category, 'id'>) => {
      const id = 'cat-' + Date.now();
      const newCat: Category = { ...catData, id };
      setCategories((prev) => [...prev, newCat]);
      await putInStore(STORES.CATEGORIES, newCat);
      await refreshData();
      return newCat;
    },
    [refreshData]
  );

  const updateCategory = useCallback(
    async (category: Category) => {
      setCategories((prev) => prev.map((c) => (c.id === category.id ? category : c)));
      await putInStore(STORES.CATEGORIES, category);
      await refreshData();
    },
    [refreshData]
  );

  const deleteCategory = useCallback(
    async (id: string, reassignToCategoryId?: string) => {
      if (reassignToCategoryId) {
        const txs = await getAllFromStore<Transaction>(STORES.TRANSACTIONS);
        const affected = txs.filter((t) => t.categoryId === id);
        for (const t of affected) {
          await putInStore(STORES.TRANSACTIONS, { ...t, categoryId: reassignToCategoryId });
        }
      }
      // Also delete any budget configured for this category
      const bdgs = await getAllFromStore<Budget>(STORES.BUDGETS);
      const affectedBudgets = bdgs.filter((b) => b.categoryId === id);
      for (const b of affectedBudgets) {
        await deleteFromStore(STORES.BUDGETS, b.id);
      }

      setCategories((prev) => prev.filter((c) => c.id !== id));
      await deleteFromStore(STORES.CATEGORIES, id);
      await refreshData();
    },
    [refreshData]
  );

  // Settings operation
  const updateSettings = useCallback(
    async (partial: Partial<AppSettings>) => {
      const updated = { ...settings, ...partial };
      setSettings(updated);
      await putInStore(STORES.SETTINGS, { key: 'app_settings', value: updated });
    },
    [settings]
  );

  // Reset to clean slate (make all data zero so user can enter fresh)
  const makeAllDataZero = useCallback(async () => {
    // Immediate optimistic zeroing of all state
    setTransactions([]);
    setGoals([]);
    setBudgets([]);
    setReminders([]);
    setAccounts(DEFAULT_ACCOUNTS.map((a) => ({ ...a, balance: 0 })));

    await dbMakeAllDataZero(true);
    await refreshData();
  }, [refreshData]);

  // Alias for backward compatibility
  const removeAllSampleData = makeAllDataZero;

  const exportBackupJSON = useCallback(async () => {
    return await exportDatabaseBackup();
  }, []);

  const importBackupJSON = useCallback(
    async (json: string) => {
      const success = await importDatabaseBackup(json);
      if (success) {
        await refreshData();
      }
      return success;
    },
    [refreshData]
  );

  const getCSVData = useCallback(() => {
    return exportTransactionsCSV(transactions, categoriesMap, accountsMap);
  }, [transactions, categoriesMap, accountsMap]);

  return {
    // Core data
    transactions,
    accounts,
    categories,
    goals,
    budgets,
    reminders,
    settings,
    isLoading,
    isOffline,

    // Maps
    categoriesMap,
    accountsMap,
    goalsMap,

    // Analytics & Metrics
    netWorth,
    currentMonthTransactions,
    currentMonthIncome,
    currentMonthExpense,
    currentMonthSaved,
    currentMonthSavingsRate,
    totalRoundUpsThisMonth,
    totalRoundUpsAllTime,
    categorySpendBreakdown,
    budgetStatuses,
    dailySpendTrend,
    financialHealthScore,
    financialRunwayMonths,
    averageMonthlyExpense,
    activeReminders,
    dueRemindersCount,

    // Actions
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    depositToGoal,
    withdrawFromGoal,
    setBudget,
    deleteBudget,
    addAccount,
    updateAccount,
    updateAccountBalance,
    deleteAccount,
    addCategory,
    updateCategory,
    deleteCategory,
    addReminder,
    updateReminder,
    toggleReminderCompleted,
    deleteReminder,
    updateSettings,
    removeAllSampleData,
    makeAllDataZero,
    exportBackupJSON,
    importBackupJSON,
    getCSVData,
    refreshData,
  };
}
