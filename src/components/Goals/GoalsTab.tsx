import React, { useState } from 'react';
import {
  Target,
  Sparkles,
  Plus,
  Coins,
  Shield,
  Zap,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import {
  Account,
  AppSettings,
  CurrencyCode,
  SavingsGoal,
} from '../../types';
import { formatCurrency } from '../../utils/currency';
import { ConfirmModal } from '../Common/ConfirmModal';

interface GoalsTabProps {
  goals: SavingsGoal[];
  accounts: Account[];
  settings: AppSettings;
  currency: CurrencyCode;
  customRates?: Record<string, number>;
  totalRoundUpsThisMonth: number;
  totalRoundUpsAllTime: number;
  onAddGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateGoal: (goal: SavingsGoal) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
  onDepositToGoal: (goalId: string, amount: number, fromAccountId?: string) => Promise<void>;
  onWithdrawFromGoal: (goalId: string, amount: number, toAccountId?: string) => Promise<void>;
  onUpdateSettings: (partial: Partial<AppSettings>) => Promise<void>;
}

export const GoalsTab: React.FC<GoalsTabProps> = ({
  goals,
  accounts,
  settings,
  currency,
  customRates,
  totalRoundUpsThisMonth,
  totalRoundUpsAllTime,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onDepositToGoal,
  onWithdrawFromGoal,
  onUpdateSettings,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeDepositGoal, setActiveDepositGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('100');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [isWithdraw, setIsWithdraw] = useState(false);

  // New goal state
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('3000');
  const [newGoalInitial, setNewGoalInitial] = useState('500');
  const [newGoalDeadline, setNewGoalDeadline] = useState('2026-12-31');
  const [newGoalColor, setNewGoalColor] = useState('#10b981');
  const [newGoalCategory, setNewGoalCategory] = useState('General');
  const [newGoalAutoRoundUp, setNewGoalAutoRoundUp] = useState(false);
  const [newGoalAutoAllocation, setNewGoalAutoAllocation] = useState(5);
  const [newGoalPriority, setNewGoalPriority] = useState<'high' | 'medium' | 'low'>('medium');

  // Edit and Delete states
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [deleteTargetGoal, setDeleteTargetGoal] = useState<SavingsGoal | null>(null);
  const [isDeletingGoal, setIsDeletingGoal] = useState(false);
  const [isUpdatingGoal, setIsUpdatingGoal] = useState(false);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName.trim()) return;

    await onAddGoal({
      name: newGoalName.trim(),
      targetAmount: parseFloat(newGoalTarget) || 1000,
      currentAmount: parseFloat(newGoalInitial) || 0,
      deadline: newGoalDeadline,
      color: newGoalColor,
      icon: 'Target',
      category: newGoalCategory,
      autoRoundUp: newGoalAutoRoundUp,
      autoAllocationPercent: newGoalAutoAllocation,
      priority: newGoalPriority,
    });

    setIsAddModalOpen(false);
    setNewGoalName('');
  };

  const handleDepositSubmit = async () => {
    if (!activeDepositGoal) return;
    const amt = parseFloat(depositAmount);
    if (amt <= 0) return;

    if (isWithdraw) {
      await onWithdrawFromGoal(activeDepositGoal.id, amt, selectedAccountId);
    } else {
      await onDepositToGoal(activeDepositGoal.id, amt, selectedAccountId);
    }
    setActiveDepositGoal(null);
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-y-auto no-scrollbar space-y-3.5 pb-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Automated Savings Goals
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Micro-invest spare change, automate income deductions, and reach financial milestones
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Automated Round-Up Configuration Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Smart Round-Up Automation Engine</h2>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically rounds up every purchase to nearest amount and transfers change to your target goal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Total Auto-Saved</span>
              <span className="text-base font-extrabold text-emerald-400 font-mono tabular-nums">
                {formatCurrency(totalRoundUpsAllTime, currency, customRates)}
              </span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.roundUpEnabled}
                onChange={(e) => onUpdateSettings({ roundUpEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        {/* Configuration Selectors */}
        {settings.roundUpEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Round-Up Increment Rule
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([1, 5, 10] as const).map((rule) => (
                  <button
                    key={rule}
                    type="button"
                    onClick={() => onUpdateSettings({ roundUpRule: rule })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                      settings.roundUpRule === rule
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    Nearest ${rule}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Target Savings Destination
              </label>
              <select
                value={settings.roundUpTargetGoalId}
                onChange={(e) => onUpdateSettings({ roundUpTargetGoalId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({formatCurrency(g.currentAmount, currency, customRates)} saved)
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {goals.map((goal) => {
          const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
          const isCompleted = percent >= 100;

          return (
            <div
              key={goal.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold"
                      style={{ backgroundColor: `${goal.color}25`, color: goal.color }}
                    >
                      <Target size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white truncate max-w-[180px]">
                        {goal.name}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{goal.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>Due {goal.deadline}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {goal.autoRoundUp && (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles size={10} /> Round-Up
                      </span>
                    )}
                    {goal.autoAllocationPercent > 0 && (
                      <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                        {goal.autoAllocationPercent}% Income
                      </span>
                    )}
                    <button
                      onClick={() => setEditingGoal(goal)}
                      className="p-1 text-slate-500 hover:text-blue-400 transition-colors cursor-pointer"
                      title="Edit savings goal"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTargetGoal(goal)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete goal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Amounts */}
                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-xl sm:text-2xl font-black text-white font-mono tabular-nums tracking-tight">
                      {formatCurrency(goal.currentAmount, currency, customRates)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono ml-2">
                      of {formatCurrency(goal.targetAmount, currency, customRates)}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-extrabold font-mono tabular-nums ${
                      isCompleted ? 'text-emerald-400' : 'text-slate-200'
                    }`}
                  >
                    {percent}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-2.5">
                  <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-700 shadow-sm"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: goal.color,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 font-mono">
                    <span>
                      {isCompleted ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 size={12} /> Target Reached!
                        </span>
                      ) : (
                        `${formatCurrency(remaining, currency, customRates)} to go`
                      )}
                    </span>
                    <span>Priority: {goal.priority}</span>
                  </div>
                </div>

                {goal.notes && (
                  <p className="mt-3 text-xs text-slate-400 italic bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    "{goal.notes}"
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    setActiveDepositGoal(goal);
                    setIsWithdraw(false);
                    setDepositAmount('100');
                  }}
                  className="py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowDownLeft size={14} className="text-emerald-400" />
                  <span>Deposit</span>
                </button>

                <button
                  onClick={() => {
                    setActiveDepositGoal(goal);
                    setIsWithdraw(true);
                    setDepositAmount('50');
                  }}
                  className="py-2 rounded-xl bg-slate-950 hover:bg-slate-850 text-slate-300 text-xs font-bold border border-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowUpRight size={14} className="text-amber-400" />
                  <span>Withdraw</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deposit / Withdraw Modal */}
      {activeDepositGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">
              {isWithdraw ? 'Withdraw from' : 'Deposit to'} {activeDepositGoal.name}
            </h3>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Amount ({currency})</label>
              <input
                type="number"
                step="1"
                min="1"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xl font-bold font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">
                {isWithdraw ? 'Destination Account' : 'Source Account'}
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatCurrency(a.balance, currency, customRates)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveDepositGoal(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDepositSubmit}
                className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                {isWithdraw ? 'Withdraw Funds' : 'Confirm Deposit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-hidden">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-3.5 max-h-[92vh] overflow-y-auto no-scrollbar">
            <h3 className="text-base font-bold text-white">Create New Savings Goal</h3>

            <form onSubmit={handleCreateGoal} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Goal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Iceland Summer Trek, New Laptop"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Target Amount ({currency})</label>
                  <input
                    type="number"
                    step="10"
                    required
                    value={newGoalTarget}
                    onChange={(e) => setNewGoalTarget(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Initial Deposit ({currency})</label>
                  <input
                    type="number"
                    step="10"
                    value={newGoalInitial}
                    onChange={(e) => setNewGoalInitial(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Target Date</label>
                  <input
                    type="date"
                    required
                    value={newGoalDeadline}
                    onChange={(e) => setNewGoalDeadline(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Category Tag</label>
                  <input
                    type="text"
                    placeholder="Travel, Tech, Reserve..."
                    value={newGoalCategory}
                    onChange={(e) => setNewGoalCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Color picker */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Color Theme</label>
                <div className="flex items-center gap-2">
                  {['#10b981', '#3b82f6', '#ec4899', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewGoalColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        newGoalColor === c ? 'scale-110 border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Automation Rules */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-400" />
                  Automated Rules
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Auto Round-Up Destination</span>
                  <input
                    type="checkbox"
                    checked={newGoalAutoRoundUp}
                    onChange={(e) => setNewGoalAutoRoundUp(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Auto % of Income Inflows</span>
                  <select
                    value={newGoalAutoAllocation}
                    onChange={(e) => setNewGoalAutoAllocation(parseInt(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={10}>10%</option>
                    <option value={15}>15%</option>
                    <option value={20}>20%</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-hidden">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-3.5 max-h-[92vh] overflow-y-auto no-scrollbar">
            <h3 className="text-base font-bold text-white">Edit Savings Goal</h3>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsUpdatingGoal(true);
                try {
                  await onUpdateGoal(editingGoal);
                  setEditingGoal(null);
                } finally {
                  setIsUpdatingGoal(false);
                }
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Goal Title</label>
                <input
                  type="text"
                  required
                  value={editingGoal.name}
                  onChange={(e) => setEditingGoal({ ...editingGoal, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Target Amount ({currency})</label>
                  <input
                    type="number"
                    step="10"
                    required
                    value={editingGoal.targetAmount}
                    onChange={(e) =>
                      setEditingGoal({
                        ...editingGoal,
                        targetAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Current Saved ({currency})</label>
                  <input
                    type="number"
                    step="10"
                    value={editingGoal.currentAmount}
                    onChange={(e) =>
                      setEditingGoal({
                        ...editingGoal,
                        currentAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Target Date</label>
                  <input
                    type="date"
                    required
                    value={editingGoal.deadline}
                    onChange={(e) => setEditingGoal({ ...editingGoal, deadline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Category Tag</label>
                  <input
                    type="text"
                    value={editingGoal.category}
                    onChange={(e) => setEditingGoal({ ...editingGoal, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Color picker */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Color Theme</label>
                <div className="flex items-center gap-2">
                  {['#10b981', '#3b82f6', '#ec4899', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditingGoal({ ...editingGoal, color: c })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        editingGoal.color === c ? 'scale-110 border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Automation Rules */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-400" />
                  Automated Rules
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Auto Round-Up Destination</span>
                  <input
                    type="checkbox"
                    checked={editingGoal.autoRoundUp}
                    onChange={(e) => setEditingGoal({ ...editingGoal, autoRoundUp: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Auto % of Income Inflows</span>
                  <select
                    value={editingGoal.autoAllocationPercent}
                    onChange={(e) => setEditingGoal({ ...editingGoal, autoAllocationPercent: parseInt(e.target.value) })}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={10}>10%</option>
                    <option value={15}>15%</option>
                    <option value={20}>20%</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGoal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const goalToDelete = editingGoal;
                    setEditingGoal(null);
                    setDeleteTargetGoal(goalToDelete);
                  }}
                  className="px-3 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold cursor-pointer"
                >
                  Delete Goal
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingGoal}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  {isUpdatingGoal ? 'Saving...' : 'Update Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Goal Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetGoal}
        title="Delete Savings Goal?"
        message={`Are you sure you want to delete "${deleteTargetGoal?.name || 'this goal'}"? Any accumulated funds can be withdrawn to your accounts.`}
        confirmText="Delete Goal"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isDeletingGoal}
        onCancel={() => setDeleteTargetGoal(null)}
        onConfirm={async () => {
          if (deleteTargetGoal) {
            setIsDeletingGoal(true);
            try {
              await onDeleteGoal(deleteTargetGoal.id);
              setDeleteTargetGoal(null);
            } finally {
              setIsDeletingGoal(false);
            }
          }
        }}
      />
    </div>
  );
};
