import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Trash2,
  Edit2,
  Tag,
  DollarSign,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { AlertReminder, CurrencyCode, ReminderFrequency } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { ConfirmModal } from '../Common/ConfirmModal';

interface RemindersTabProps {
  reminders: AlertReminder[];
  currency: CurrencyCode;
  customRates?: Record<string, number>;
  onAddReminder: (data: Omit<AlertReminder, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateReminder?: (reminder: AlertReminder) => Promise<void>;
  onToggleReminder: (id: string) => Promise<void>;
  onDeleteReminder: (id: string) => Promise<void>;
}

export const RemindersTab: React.FC<RemindersTabProps> = ({
  reminders,
  currency,
  customRates,
  onAddReminder,
  onUpdateReminder,
  onToggleReminder,
  onDeleteReminder,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  // Form states
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<AlertReminder['category']>('bill');
  const [frequency, setFrequency] = useState<ReminderFrequency>('monthly');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [notes, setNotes] = useState('');

  // Edit and Delete states
  const [editingReminder, setEditingReminder] = useState<AlertReminder | null>(null);
  const [deleteTargetReminder, setDeleteTargetReminder] = useState<AlertReminder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const filteredReminders = reminders.filter((r) => {
    if (filter === 'pending') return !r.isCompleted;
    if (filter === 'completed') return r.isCompleted;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await onAddReminder({
      title: title.trim(),
      amount: amountStr ? parseFloat(amountStr) : undefined,
      dueDate,
      category,
      frequency,
      isCompleted: false,
      priority,
      notes: notes.trim() || undefined,
    });

    setTitle('');
    setAmountStr('');
    setNotes('');
    setIsModalOpen(false);
  };

  const getCategoryBadge = (cat: AlertReminder['category']) => {
    switch (cat) {
      case 'bill':
        return { label: 'Recurring Bill', color: 'text-amber-400 bg-amber-500/10' };
      case 'savings':
        return { label: 'Savings Deposit', color: 'text-emerald-400 bg-emerald-500/10' };
      case 'salary':
        return { label: 'Expected Salary', color: 'text-blue-400 bg-blue-500/10' };
      case 'tax':
        return { label: 'Tax Deadline', color: 'text-rose-400 bg-rose-500/10' };
      case 'budget_check':
        return { label: 'Budget Checkup', color: 'text-purple-400 bg-purple-500/10' };
      default:
        return { label: 'Custom Alert', color: 'text-slate-400 bg-slate-800' };
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-y-auto no-scrollbar space-y-3.5 pb-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Alerts & Bill Reminders</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Automated Sentinel
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Never miss upcoming rent, utilities, credit card due dates, or planned savings goals
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>New Reminder</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex items-center justify-between gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl max-w-sm text-xs">
        {(['pending', 'completed', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 py-1.5 rounded-lg font-semibold capitalize transition-all cursor-pointer ${
              filter === tab
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Reminders List */}
      {filteredReminders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Bell size={20} />
          </div>
          <h3 className="text-sm font-bold text-white">No reminders here</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Set up bill alerts, salary notifications, or savings deposit reminders.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Create Alert</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReminders.map((rem) => {
            const isDueOrPast = !rem.isCompleted && rem.dueDate <= today;
            const badge = getCategoryBadge(rem.category);

            return (
              <div
                key={rem.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  rem.isCompleted
                    ? 'bg-slate-950/60 border-slate-850 opacity-60'
                    : isDueOrPast
                    ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    onClick={() => onToggleReminder(rem.id)}
                    className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
                    title={rem.isCompleted ? 'Mark as pending' : 'Mark as completed'}
                  >
                    {rem.isCompleted ? (
                      <CheckCircle2 size={20} className="text-emerald-400" />
                    ) : (
                      <Circle size={20} />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`text-sm font-bold truncate ${
                          rem.isCompleted ? 'line-through text-slate-400' : 'text-white'
                        }`}
                      >
                        {rem.title}
                      </h3>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${badge.color}`}>
                        {badge.label}
                      </span>
                      {rem.frequency !== 'once' && (
                        <span className="text-[10px] text-blue-400 font-mono">
                          ↻ {rem.frequency}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <Calendar size={13} />
                      <span className={isDueOrPast ? 'text-amber-400 font-semibold' : ''}>
                        Due: {rem.dueDate} {isDueOrPast && '(Action Due)'}
                      </span>
                      {rem.notes && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="italic truncate max-w-[200px]">{rem.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-8 sm:pl-0">
                  {rem.amount && rem.amount > 0 && (
                    <span className="text-sm sm:text-base font-extrabold font-mono tabular-nums text-white">
                      {formatCurrency(rem.amount, currency, customRates)}
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingReminder(rem)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                      title="Edit reminder"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTargetReminder(rem)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete reminder"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Reminder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-hidden">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-3.5 max-h-[92vh] overflow-y-auto no-scrollbar">
            <h3 className="text-base font-bold text-white">Create Alert / Reminder</h3>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electric Utility Bill, Monthly Rent, Roth IRA"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Amount ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Optional amount"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="bill">Recurring Bill</option>
                    <option value="savings">Savings Deposit</option>
                    <option value="salary">Salary Expected</option>
                    <option value="budget_check">Budget Check</option>
                    <option value="tax">Tax / Insurance</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="once">Once</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Auto-pay account or special instructions"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Reminder Modal */}
      {editingReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-hidden">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-3.5 max-h-[92vh] overflow-y-auto no-scrollbar">
            <h3 className="text-base font-bold text-white">Edit Alert / Reminder</h3>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!onUpdateReminder) return;
                setIsUpdating(true);
                try {
                  await onUpdateReminder(editingReminder);
                  setEditingReminder(null);
                } finally {
                  setIsUpdating(false);
                }
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Title</label>
                <input
                  type="text"
                  required
                  value={editingReminder.title}
                  onChange={(e) => setEditingReminder({ ...editingReminder, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Amount ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Optional amount"
                    value={editingReminder.amount || ''}
                    onChange={(e) =>
                      setEditingReminder({
                        ...editingReminder,
                        amount: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Due Date</label>
                  <input
                    type="date"
                    required
                    value={editingReminder.dueDate}
                    onChange={(e) => setEditingReminder({ ...editingReminder, dueDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Category</label>
                  <select
                    value={editingReminder.category}
                    onChange={(e) =>
                      setEditingReminder({ ...editingReminder, category: e.target.value as any })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="bill">Recurring Bill</option>
                    <option value="savings">Savings Deposit</option>
                    <option value="salary">Salary Expected</option>
                    <option value="budget_check">Budget Check</option>
                    <option value="tax">Tax / Insurance</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Frequency</label>
                  <select
                    value={editingReminder.frequency}
                    onChange={(e) =>
                      setEditingReminder({ ...editingReminder, frequency: e.target.value as any })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="once">Once</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Auto-pay account or special instructions"
                  value={editingReminder.notes || ''}
                  onChange={(e) => setEditingReminder({ ...editingReminder, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingReminder(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const toDelete = editingReminder;
                    setEditingReminder(null);
                    setDeleteTargetReminder(toDelete);
                  }}
                  className="px-3 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold cursor-pointer"
                >
                  Delete
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  {isUpdating ? 'Saving...' : 'Update Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Reminder Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetReminder}
        title="Delete Reminder?"
        message={`Are you sure you want to delete "${deleteTargetReminder?.title || 'this reminder'}"? You will no longer receive alerts for it.`}
        confirmText="Delete Reminder"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isDeleting}
        onCancel={() => setDeleteTargetReminder(null)}
        onConfirm={async () => {
          if (deleteTargetReminder) {
            setIsDeleting(true);
            try {
              await onDeleteReminder(deleteTargetReminder.id);
              setDeleteTargetReminder(null);
            } finally {
              setIsDeleting(false);
            }
          }
        }}
      />
    </div>
  );
};
