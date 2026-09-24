import React, { useState } from 'react';
import {
  PieChart,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Plus,
  Sliders,
  Sparkles,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  Category,
  CurrencyCode,
  Transaction,
} from '../../types';
import { formatCurrency } from '../../utils/currency';
import { CategoryDonutChart } from './CategoryDonutChart';
import { DailySpendingBarChart } from './DailySpendingBarChart';
import { CategoryIcon } from '../Common/CategoryIcon';
import { Tag } from 'lucide-react';
import { CategoryManagerModal } from '../Categories/CategoryManagerModal';

interface AnalyticsTabProps {
  currentMonthIncome: number;
  currentMonthExpense: number;
  currentMonthSaved: number;
  currentMonthSavingsRate: number;
  categorySpendBreakdown: any[];
  budgetStatuses: any[];
  dailySpendTrend: any[];
  transactions: Transaction[];
  categories: Category[];
  currency: CurrencyCode;
  customRates?: Record<string, number>;
  onSetBudget: (categoryId: string, limit: number, alertThreshold: number) => Promise<void>;
  onAddCategory?: (category: Omit<Category, 'id'>) => Promise<Category>;
  onUpdateCategory?: (category: Category) => Promise<void>;
  onDeleteCategory?: (id: string) => Promise<void>;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  currentMonthIncome,
  currentMonthExpense,
  currentMonthSaved,
  currentMonthSavingsRate,
  categorySpendBreakdown,
  budgetStatuses,
  dailySpendTrend,
  transactions,
  categories,
  currency,
  customRates,
  onSetBudget,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [editingBudgetCatId, setEditingBudgetCatId] = useState<string | null>(null);
  const [budgetLimitInput, setBudgetLimitInput] = useState<string>('500');
  const [budgetThresholdInput, setBudgetThresholdInput] = useState<number>(0.8);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  // Top spending merchants
  const topMerchants = React.useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number }>();
    transactions
      .filter((t) => t.type === 'expense' && t.merchant)
      .forEach((t) => {
        const m = t.merchant!;
        const existing = map.get(m) || { name: m, total: 0, count: 0 };
        existing.total += t.amount;
        existing.count += 1;
        map.set(m, existing);
      });

    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [transactions]);

  // Largest single expense
  const largestExpense = React.useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense');
    if (expenses.length === 0) return null;
    return expenses.reduce((max, t) => (t.amount > max.amount ? t : max), expenses[0]);
  }, [transactions]);

  const handleSaveBudget = async () => {
    if (!editingBudgetCatId) return;
    const limit = parseFloat(budgetLimitInput);
    if (limit > 0) {
      await onSetBudget(editingBudgetCatId, limit, budgetThresholdInput);
    }
    setEditingBudgetCatId(null);
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-y-auto no-scrollbar space-y-3.5 pb-2">
      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Visual Spending Analytics
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Dynamic spending velocity, interactive SVG charts, and budget threshold sentinels
        </p>
      </div>

      {/* High-level performance cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] text-slate-400 font-medium">Monthly Inflow</span>
          <p className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono tabular-nums mt-1">
            {formatCurrency(currentMonthIncome, currency, customRates)}
          </p>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Active Period</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] text-slate-400 font-medium">Monthly Outflow</span>
          <p className="text-lg sm:text-xl font-extrabold text-white font-mono tabular-nums mt-1">
            {formatCurrency(currentMonthExpense, currency, customRates)}
          </p>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Total debits</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] text-slate-400 font-medium">Savings Rate</span>
          <p className="text-lg sm:text-xl font-extrabold text-blue-400 font-mono tabular-nums mt-1">
            {currentMonthSavingsRate}%
          </p>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
            {currentMonthSavingsRate >= 20 ? 'Above target benchmark' : 'Target: 20%+'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] text-slate-400 font-medium">Largest Outlay</span>
          <p className="text-lg sm:text-xl font-extrabold text-rose-300 font-mono tabular-nums mt-1 truncate">
            {largestExpense ? formatCurrency(largestExpense.amount, currency, customRates) : formatCurrency(0, currency, customRates)}
          </p>
          <span className="text-[10px] text-slate-400 truncate block mt-0.5">
            {largestExpense?.merchant || 'None'}
          </span>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Donut Interactive Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white">Expense Distribution by Category</h2>
              <p className="text-[11px] text-slate-400">Interactive SVG segment inspection</p>
            </div>
          </div>

          <CategoryDonutChart
            data={categorySpendBreakdown}
            currency={currency}
            customRates={customRates}
            totalExpense={currentMonthExpense}
          />
        </div>

        {/* 14-Day Velocity Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white">14-Day Spending Velocity</h2>
              <p className="text-[11px] text-slate-400">Daily outflow variation vs daily baseline</p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Normal
              <span className="w-2 h-2 rounded-full bg-amber-400 ml-1.5" /> High
            </div>
          </div>

          <DailySpendingBarChart
            data={dailySpendTrend}
            currency={currency}
            customRates={customRates}
          />
        </div>
      </div>

      {/* Category Budget Limits & Sentinel Thresholds */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Budget Limits & Sentinel Alerts</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                Threshold Alert at 80% & 100%
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Configure strict monthly spending boundaries to avoid budget runaways
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {onAddCategory && (
              <button
                type="button"
                onClick={() => setIsCategoryManagerOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Create and manage categories"
              >
                <Tag size={13} />
                <span>Manage Categories</span>
              </button>
            )}

            <button
              onClick={() => {
                const firstExpenseCat = categories.find((c) => c.type === 'expense');
                if (firstExpenseCat) {
                  setEditingBudgetCatId(firstExpenseCat.id);
                  setBudgetLimitInput('500');
                  setBudgetThresholdInput(0.8);
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Configure Limit</span>
            </button>
          </div>
        </div>

        {/* Budget Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetStatuses.map((b) => (
            <div
              key={b.budgetId}
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-colors ${
                b.isOverBudget
                  ? 'bg-rose-950/20 border-rose-500/40'
                  : b.isWarning
                  ? 'bg-amber-950/20 border-amber-500/40'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${b.color}25`, color: b.color }}
                    >
                      <CategoryIcon name={b.icon} size={14} />
                    </div>
                    <span className="text-xs font-bold text-white truncate">
                      {b.categoryName}
                    </span>
                  </div>

                  {b.isOverBudget ? (
                    <span className="text-[10px] font-bold text-rose-400 flex items-center gap-0.5 bg-rose-500/10 px-1.5 py-0.5 rounded">
                      <AlertTriangle size={11} /> Over Limit
                    </span>
                  ) : b.isWarning ? (
                    <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      <AlertTriangle size={11} /> 80% Warning
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-0.5">
                      <CheckCircle2 size={11} /> On Track
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-sm font-bold text-white font-mono tabular-nums">
                    {formatCurrency(b.spent, currency, customRates)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono tabular-nums">
                    / {formatCurrency(b.monthlyLimit, currency, customRates)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      b.isOverBudget
                        ? 'bg-rose-500'
                        : b.isWarning
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, b.percentage)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>{b.percentage}% used</span>
                  <span>{formatCurrency(b.remaining, currency, customRates)} left</span>
                </div>
              </div>

              {/* Quick adjust limit */}
              <button
                onClick={() => {
                  setEditingBudgetCatId(b.categoryId);
                  setBudgetLimitInput(b.monthlyLimit.toString());
                  setBudgetThresholdInput(b.alertThreshold || 0.8);
                }}
                className="w-full py-1 text-[11px] text-slate-400 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
              >
                Adjust Limit
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Top Merchants Ranked Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <h2 className="text-sm font-bold text-white">Top Spending Merchants & Payees</h2>
        <p className="text-[11px] text-slate-400">Where capital is flowing most frequently</p>

        <div className="divide-y divide-slate-800 mt-2">
          {topMerchants.map((m, idx) => (
            <div key={m.name} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-500 font-mono font-semibold w-5">{idx + 1}.</span>
                <div>
                  <p className="font-semibold text-slate-200">{m.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {m.count} {m.count === 1 ? 'transaction' : 'transactions'}
                  </p>
                </div>
              </div>
              <span className="font-bold text-white font-mono tabular-nums">
                {formatCurrency(m.total, currency, customRates)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Budget Modal */}
      {editingBudgetCatId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Set Category Budget Limit</h3>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Category</label>
              <select
                value={editingBudgetCatId}
                onChange={(e) => setEditingBudgetCatId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                {categories
                  .filter((c) => c.type === 'expense')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Monthly Limit ({currency})</label>
              <input
                type="number"
                step="25"
                value={budgetLimitInput}
                onChange={(e) => setBudgetLimitInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-lg font-bold font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Alert Warning Threshold</label>
              <select
                value={budgetThresholdInput}
                onChange={(e) => setBudgetThresholdInput(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value={0.7}>Warn at 70% used</option>
                <option value={0.8}>Warn at 80% used (Standard)</option>
                <option value={0.9}>Warn at 90% used</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingBudgetCatId(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBudget}
                className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Save Limit
              </button>
            </div>
          </div>
        </div>
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
