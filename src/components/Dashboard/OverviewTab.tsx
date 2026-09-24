import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  CreditCard,
  Plus,
  ChevronRight,
  Target,
  Zap,
  Clock,
  Layers,
  Bell,
  Trash2,
  Edit2,
  RotateCcw,
  Tag,
} from 'lucide-react';
import {
  Account,
  AlertReminder,
  AppSettings,
  Category,
  CurrencyCode,
  SavingsGoal,
  Transaction,
  TransactionType,
} from '../../types';
import { formatCurrency } from '../../utils/currency';
import { CategoryDonutChart } from '../Analytics/CategoryDonutChart';
import { DailySpendingBarChart } from '../Analytics/DailySpendingBarChart';
import { CategoryIcon } from '../Common/CategoryIcon';
import { ConfirmModal } from '../Common/ConfirmModal';
import { NavTab } from '../Navigation/Navbar';
import { EditAccountModal } from '../Accounts/EditAccountModal';
import { CategoryManagerModal } from '../Categories/CategoryManagerModal';

interface OverviewTabProps {
  netWorth: number;
  currentMonthIncome: number;
  currentMonthExpense: number;
  currentMonthSaved: number;
  currentMonthSavingsRate: number;
  totalRoundUpsThisMonth: number;
  financialHealthScore: number;
  financialRunwayMonths: string;
  transactions: Transaction[];
  accounts: Account[];
  goals: SavingsGoal[];
  reminders: AlertReminder[];
  categories?: Category[];
  categorySpendBreakdown: any[];
  dailySpendTrend: any[];
  categoriesMap: Map<string, Category>;
  accountsMap: Map<string, Account>;
  currency: CurrencyCode;
  customRates?: Record<string, number>;
  settings: AppSettings;
  onNavigateTab: (tab: NavTab) => void;
  onOpenAddModal: (type?: TransactionType) => void;
  onDepositToGoal: (goalId: string, amount: number) => void;
  onDeleteTransaction: (id: string) => Promise<void>;
  onRemoveAllData: () => Promise<void>;
  onAddAccount?: (account: Omit<Account, 'id'>) => Promise<Account>;
  onUpdateAccount?: (account: Account) => Promise<void>;
  onDeleteAccount?: (id: string) => Promise<void>;
  onAddCategory?: (category: Omit<Category, 'id'>) => Promise<Category>;
  onUpdateCategory?: (category: Category) => Promise<void>;
  onDeleteCategory?: (id: string) => Promise<void>;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  netWorth,
  currentMonthIncome,
  currentMonthExpense,
  currentMonthSaved,
  currentMonthSavingsRate,
  totalRoundUpsThisMonth,
  financialHealthScore,
  financialRunwayMonths,
  transactions,
  accounts,
  goals,
  reminders,
  categories = [],
  categorySpendBreakdown,
  dailySpendTrend,
  categoriesMap,
  accountsMap,
  currency,
  customRates,
  settings,
  onNavigateTab,
  onOpenAddModal,
  onDepositToGoal,
  onDeleteTransaction,
  onRemoveAllData,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [quickDepositGoalId, setQuickDepositGoalId] = useState<string | null>(null);
  const [quickDepositAmount, setQuickDepositAmount] = useState<string>('50');
  const [deleteTargetTxId, setDeleteTargetTxId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [showZeroConfirm, setShowZeroConfirm] = useState(false);
  const [isZeroing, setIsZeroing] = useState(false);

  const recentTransactions = transactions.slice(0, 6);
  const targetRoundUpGoal = goals.find((g) => g.id === settings.roundUpTargetGoalId);

  const pendingReminders = reminders.filter((r) => !r.isCompleted).slice(0, 3);

  return (
    <div className="h-full flex flex-col min-h-0 overflow-y-auto no-scrollbar space-y-3.5 pb-2">
      {/* Hero Financial Health & Net Worth Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 shrink-0">
        {/* Net Worth Card (2 cols on large) */}
        <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Net Worth
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
                  {formatCurrency(netWorth, currency, customRates)}
                </h1>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp size={14} /> Active Balance
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAddModal('income')}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowDownLeft size={14} />
                <span>+ Income</span>
              </button>
              <button
                onClick={() => onOpenAddModal('expense')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/10 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Record Entry</span>
              </button>
            </div>
          </div>

          {/* Accounts mini row */}
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Accounts ({accounts.length}) · Tap to edit or manage
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAccount(null);
                    setIsAddingAccount(true);
                  }}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus size={12} strokeWidth={2.5} />
                  <span>Add Account</span>
                </button>
                <span className="text-slate-700">|</span>
                <button
                  type="button"
                  onClick={() => setShowZeroConfirm(true)}
                  className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Wipe and start fresh"
                >
                  <RotateCcw size={11} />
                  <span>Reset All</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setEditingAccount(acc)}
                  className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-950/90 border border-slate-800/60 hover:border-slate-700 flex flex-col justify-between text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-200 truncate max-w-[90px]">
                      {acc.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Edit2 size={11} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: acc.color }}
                      />
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-100 font-mono tabular-nums mt-1">
                    {formatCurrency(acc.balance, currency, customRates)}
                  </span>
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setEditingAccount(null);
                  setIsAddingAccount(true);
                }}
                className="p-2 rounded-xl border border-dashed border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-slate-400 hover:text-emerald-300 flex items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer min-h-[52px]"
                title="Add a new account to your vault"
              >
                <Plus size={14} />
                <span>New Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pro Health Score & Runway Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Financial Health Score
              </span>
              <span className="text-xs font-bold text-emerald-400 font-mono">PRO</span>
            </div>

            <div className="flex items-center gap-4 mt-2.5">
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <svg className="w-14 h-14 transform -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    stroke="currentColor"
                    strokeWidth="4.5"
                    className="text-slate-800"
                    fill="transparent"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    stroke="#10b981"
                    strokeWidth="4.5"
                    strokeDasharray={138.2}
                    strokeDashoffset={138.2 - (138.2 * financialHealthScore) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <span className="absolute text-sm font-extrabold text-white font-mono tabular-nums">
                  {financialHealthScore}
                </span>
              </div>

              <div>
                <p className="text-sm font-bold text-slate-100">
                  {financialHealthScore >= 80 ? 'Robust Health' : 'Moderate Pace'}
                </p>
                <p className="text-xs text-slate-400">
                  Runway: <span className="font-mono text-emerald-300 font-bold">{financialRunwayMonths} mos</span>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Savings Velocity</span>
            <span className="font-mono text-slate-200 font-semibold">{currentMonthSavingsRate}%</span>
          </div>
        </div>
      </div>

      {/* Fresh Clean Slate Active Banner */}
      {transactions.length === 0 && (
        <div className="bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Clean Zero Slate Ready</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold">
                  Zero Data
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                All records and account balances are at zero. You can enter fresher by adding your first income, expense, or savings goal below.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenAddModal('income')}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowDownLeft size={14} />
              <span>+ Add Income</span>
            </button>
            <button
              onClick={() => onOpenAddModal('expense')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>+ Expense</span>
            </button>
          </div>
        </div>
      )}

      {/* Cashflow Metrics Trio */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
        {/* Income */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400 font-medium">Income This Month</span>
            <p className="text-lg font-bold text-emerald-400 font-mono tabular-nums">
              {formatCurrency(currentMonthIncome, currency, customRates)}
            </p>
          </div>
          <button
            onClick={() => onOpenAddModal('income')}
            className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20 transition-colors cursor-pointer"
            title="Add income entry"
          >
            <ArrowDownLeft size={18} />
          </button>
        </div>

        {/* Expenses */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400 font-medium">Spent This Month</span>
            <p className="text-lg font-bold text-white font-mono tabular-nums">
              {formatCurrency(currentMonthExpense, currency, customRates)}
            </p>
          </div>
          <button
            onClick={() => onOpenAddModal('expense')}
            className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center hover:bg-rose-500/20 transition-colors cursor-pointer"
            title="Add expense entry"
          >
            <ArrowUpRight size={18} />
          </button>
        </div>

        {/* Net Saved */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400 font-medium">Net Retained</span>
            <p
              className={`text-lg font-bold font-mono tabular-nums ${
                currentMonthSaved >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(currentMonthSaved, currency, customRates)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Layers size={18} />
          </div>
        </div>
      </div>

      {/* Due Alerts / Reminders Banner */}
      {pendingReminders.length > 0 && (
        <div className="p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Bell size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Upcoming Alerts ({pendingReminders.length} pending)
              </p>
              <p className="text-[11px] text-slate-400">
                Next: <strong className="text-amber-300">{pendingReminders[0].title}</strong> (Due {pendingReminders[0].dueDate})
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('reminders')}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>View All</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Visual Analytics Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 shrink-0">
        {/* Spending by Category Donut */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Category Spending</h3>
              <p className="text-[10px] text-slate-400">Current calendar month</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCategoryManagerOpen(true)}
                className="text-xs text-slate-300 hover:text-emerald-400 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-750 transition-colors cursor-pointer"
                title="Add, edit or remove categories"
              >
                <Tag size={12} />
                <span>Categories</span>
              </button>
              <button
                onClick={() => onNavigateTab('analytics')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <span>Full Analytics</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          <div className="mt-3">
            <CategoryDonutChart
              data={categorySpendBreakdown}
              currency={currency}
              customRates={customRates}
              totalExpense={currentMonthExpense}
            />
          </div>
        </div>

        {/* 14-Day Velocity Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Daily Outflow Velocity</h3>
              <p className="text-[10px] text-slate-400">Trailing 14 days breakdown</p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Real-time</span>
          </div>

          <div className="mt-3">
            <DailySpendingBarChart
              data={dailySpendTrend}
              currency={currency}
              customRates={customRates}
            />
          </div>
        </div>
      </div>

      {/* Recent Transactions Ledger with Delete Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2.5 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recent Transactions</h3>
            <p className="text-[10px] text-slate-400">Latest activity from IndexedDB ledger</p>
          </div>
          <button
            onClick={() => onNavigateTab('expenses')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>View All Ledger</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-6 text-center text-slate-400 space-y-2 my-auto">
            <p className="text-xs">No entries recorded yet.</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => onOpenAddModal('income')}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold cursor-pointer"
              >
                + Add Income
              </button>
              <button
                onClick={() => onOpenAddModal('expense')}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold cursor-pointer"
              >
                + Record Expense
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80 overflow-y-auto no-scrollbar max-h-56">
            {recentTransactions.map((tx) => {
              const cat = categoriesMap.get(tx.categoryId);
              const acc = accountsMap.get(tx.accountId);
              const isExpense = tx.type === 'expense';
              const isIncome = tx.type === 'income';

              return (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-3 group hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${cat?.color || '#3b82f6'}20`,
                        color: cat?.color || '#3b82f6',
                      }}
                    >
                      <CategoryIcon name={cat?.icon || 'Tag'} size={16} />
                    </div>
                    <div className="min-w-0 truncate">
                      <p className="text-xs font-semibold text-slate-100 truncate">
                        {tx.merchant || cat?.name || 'Transaction'}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
                        <span>{acc?.name || 'Account'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{tx.date}</span>
                        {tx.roundUpAmount && tx.roundUpAmount > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-emerald-400 font-mono text-[10px]">
                              +${tx.roundUpAmount.toFixed(2)} saved
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span
                        className={`text-xs sm:text-sm font-bold font-mono tabular-nums ${
                          isIncome
                            ? 'text-emerald-400'
                            : isExpense
                            ? 'text-slate-100'
                            : 'text-blue-400'
                        }`}
                      >
                        {isIncome ? '+' : isExpense ? '-' : ''}
                        {formatCurrency(tx.amount, currency, customRates)}
                      </span>
                    </div>

                    <button
                      onClick={() => setDeleteTargetTxId(tx.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      title="Delete entry"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Ledger Entry Confirmation Dialog */}
      <ConfirmModal
        isOpen={!!deleteTargetTxId}
        title="Delete Transaction Entry?"
        message="Are you sure you want to delete this entry? Associated account balances will be accurately restored."
        confirmText="Delete Entry"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isDeleting}
        onCancel={() => setDeleteTargetTxId(null)}
        onConfirm={async () => {
          if (deleteTargetTxId) {
            setIsDeleting(true);
            try {
              await onDeleteTransaction(deleteTargetTxId);
              setDeleteTargetTxId(null);
            } finally {
              setIsDeleting(false);
            }
          }
        }}
      />

      {/* Reset All to Zero (Fresh Start) Confirmation Dialog */}
      <ConfirmModal
        isOpen={showZeroConfirm}
        title="Reset All Data to Zero (Start Fresh)?"
        message="This will clear all transactions, savings goals, alerts, and reset all account balances to ₹0.00 so you can enter fresh data. This action cannot be undone."
        confirmText="Make All Data Zero"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isZeroing}
        onCancel={() => setShowZeroConfirm(false)}
        onConfirm={async () => {
          setIsZeroing(true);
          try {
            await onRemoveAllData();
            setShowZeroConfirm(false);
          } finally {
            setIsZeroing(false);
          }
        }}
      />

      {/* Account Modal (Add, Edit, Delete) */}
      {(isAddingAccount || !!editingAccount) && (
        <EditAccountModal
          isOpen={isAddingAccount || !!editingAccount}
          account={editingAccount}
          totalAccountsCount={accounts.length}
          currency={currency}
          customRates={customRates}
          onClose={() => {
            setEditingAccount(null);
            setIsAddingAccount(false);
          }}
          onSave={async (accData) => {
            if (accData.id && onUpdateAccount) {
              await onUpdateAccount(accData as Account);
            } else if (onAddAccount) {
              await onAddAccount(accData);
            }
            setEditingAccount(null);
            setIsAddingAccount(false);
          }}
          onDelete={
            onDeleteAccount
              ? async (id) => {
                  await onDeleteAccount(id);
                  setEditingAccount(null);
                  setIsAddingAccount(false);
                }
              : undefined
          }
        />
      )}

      {/* Category Manager Modal */}
      {isCategoryManagerOpen && onAddCategory && onUpdateCategory && onDeleteCategory && (
        <CategoryManagerModal
          isOpen={isCategoryManagerOpen}
          categories={categories}
          transactions={transactions}
          onClose={() => setIsCategoryManagerOpen(false)}
          onAddCategory={onAddCategory}
          onUpdateCategory={onUpdateCategory}
          onDeleteCategory={onDeleteCategory}
        />
      )}
    </div>
  );
};
