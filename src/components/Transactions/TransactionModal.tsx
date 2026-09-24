import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Calendar,
  Sparkles,
  Tag,
  CreditCard,
  Building,
  RotateCw,
  Lock,
} from 'lucide-react';
import {
  Account,
  AppSettings,
  Category,
  CurrencyCode,
  SavingsGoal,
  Transaction,
  TransactionType,
} from '../../types';
import { calculateRoundUp, formatCurrency } from '../../utils/currency';
import { CategoryIcon } from '../Common/CategoryIcon';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  onUpdate?: (tx: Transaction) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  initialTransaction?: Transaction | null;
  defaultType?: TransactionType;
  categories: Category[];
  accounts: Account[];
  goals: SavingsGoal[];
  settings: AppSettings;
  currency: CurrencyCode;
  onManageCategories?: () => void;
  onAddAccount?: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  initialTransaction,
  defaultType = 'expense',
  categories,
  accounts,
  goals,
  settings,
  currency,
  onManageCategories,
  onAddAccount,
}) => {
  const isEditing = !!initialTransaction;
  const [confirmDeleteInModal, setConfirmDeleteInModal] = useState(false);

  const [type, setType] = useState<TransactionType>(
    initialTransaction?.type || defaultType
  );
  const [amountStr, setAmountStr] = useState<string>(
    initialTransaction ? initialTransaction.amount.toString() : ''
  );
  const [merchant, setMerchant] = useState<string>(
    initialTransaction?.merchant || ''
  );
  const [categoryId, setCategoryId] = useState<string>(
    initialTransaction?.categoryId || categories[0]?.id || ''
  );
  const [accountId, setAccountId] = useState<string>(
    initialTransaction?.accountId || accounts[0]?.id || ''
  );
  const [targetAccountId, setTargetAccountId] = useState<string>(
    initialTransaction?.targetAccountId || accounts[1]?.id || ''
  );
  const [date, setDate] = useState<string>(
    initialTransaction?.date || new Date().toISOString().split('T')[0]
  );
  const [note, setNote] = useState<string>(initialTransaction?.note || '');
  const [tagsInput, setTagsInput] = useState<string>(
    initialTransaction?.tags?.join(', ') || ''
  );
  const [isRecurring, setIsRecurring] = useState<boolean>(
    initialTransaction?.isRecurring || false
  );
  const [recurringFreq, setRecurringFreq] = useState<'weekly' | 'monthly' | 'yearly'>(
    initialTransaction?.recurringFrequency === 'daily'
      ? 'weekly'
      : initialTransaction?.recurringFrequency || 'monthly'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync state whenever initialTransaction or defaultType changes
  useEffect(() => {
    if (initialTransaction) {
      setType(initialTransaction.type);
      setAmountStr(initialTransaction.amount.toString());
      setMerchant(initialTransaction.merchant || '');
      setCategoryId(initialTransaction.categoryId);
      setAccountId(initialTransaction.accountId);
      setTargetAccountId(initialTransaction.targetAccountId || accounts[1]?.id || '');
      setDate(initialTransaction.date);
      setNote(initialTransaction.note || '');
      setTagsInput(initialTransaction.tags?.join(', ') || '');
      setIsRecurring(initialTransaction.isRecurring || false);
      setRecurringFreq(
        initialTransaction.recurringFrequency === 'daily'
          ? 'weekly'
          : initialTransaction.recurringFrequency || 'monthly'
      );
    } else {
      setType(defaultType);
      setAmountStr('');
      setMerchant('');
      const defaultCat = categories.find((c) =>
        defaultType === 'income' ? c.type === 'income' : c.type === 'expense'
      );
      setCategoryId(defaultCat?.id || categories[0]?.id || '');
      setAccountId(accounts[0]?.id || '');
      setTargetAccountId(accounts[1]?.id || '');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setTagsInput('');
      setIsRecurring(false);
    }
  }, [initialTransaction, defaultType, isOpen, categories, accounts]);

  if (!isOpen) return null;

  // Filter categories by type
  const availableCategories = categories.filter((c) =>
    type === 'expense' ? c.type === 'expense' : type === 'income' ? c.type === 'income' : true
  );

  const numericAmount = parseFloat(amountStr) || 0;
  const simulatedRoundUp =
    type === 'expense' && settings.roundUpEnabled
      ? calculateRoundUp(numericAmount, settings.roundUpRule)
      : 0;

  const targetGoal = goals.find((g) => g.id === settings.roundUpTargetGoalId);

  const handleQuickAdd = (delta: number) => {
    const current = parseFloat(amountStr) || 0;
    setAmountStr((current + delta).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) return;

    setIsSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => (t.startsWith('#') ? t : `#${t}`));

      const payload = {
        amount: numericAmount,
        type,
        categoryId: type === 'transfer' ? 'cat-transfer' : categoryId,
        accountId,
        targetAccountId: type === 'transfer' ? targetAccountId : undefined,
        date,
        time: initialTransaction?.time || new Date().toTimeString().slice(0, 5),
        merchant: merchant.trim() || undefined,
        note: note.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        isRecurring,
        recurringFrequency: isRecurring ? recurringFreq : undefined,
        currency,
      };

      if (isEditing && initialTransaction && onUpdate) {
        await onUpdate({
          ...payload,
          id: initialTransaction.id,
        });
      } else {
        await onSave(payload);
      }

      onClose();
    } catch (err) {
      console.error('Failed to save transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-hidden">
      <div className="relative w-full max-w-lg max-h-[95vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isEditing
                  ? 'bg-blue-500/10 text-blue-400'
                  : type === 'income'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-emerald-500/10 text-emerald-400'
              }`}
            >
              {isEditing ? <Edit2 size={16} /> : <Plus size={18} />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEditing ? 'Update Transaction Entry' : type === 'income' ? 'Record Income Entry' : 'Record Transaction'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isEditing ? 'Modify amount, category, or account details' : 'Direct encrypted storage in IndexedDB'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 flex-1 min-h-0 overflow-y-auto no-scrollbar">
          {/* Segmented Type Switcher */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                const firstExp = categories.find((c) => c.type === 'expense');
                if (firstExp) setCategoryId(firstExp.id);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight size={14} />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                const firstInc = categories.find((c) => c.type === 'income');
                if (firstInc) setCategoryId(firstInc.id);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownLeft size={14} />
              <span>Income</span>
            </button>
            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
                type === 'transfer'
                  ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowLeftRight size={14} />
              <span>Transfer</span>
            </button>
          </div>

          {/* Amount Input with Quick Denomination Chips */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Amount ({currency})
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                autoFocus
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-2xl font-bold font-mono tabular-nums text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>

            {/* Quick addition chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {(currency === 'INR' ? [50, 100, 200, 500, 1000, 2000] : [10, 25, 50, 100, 500, 1000]).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAdd(val)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-mono tabular-nums border border-slate-700/60 hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  +{currency === 'INR' ? `₹${val}` : val}
                </button>
              ))}
            </div>
          </div>

          {/* Smart Round-Up Preview Callout (When type === 'expense' & feature is active) */}
          {type === 'expense' && settings.roundUpEnabled && simulatedRoundUp > 0 && targetGoal && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-400 shrink-0" />
                <span>
                  Save the change: <strong>+{formatCurrency(simulatedRoundUp, currency)}</strong> auto-sent to{' '}
                  <span className="text-white font-medium">{targetGoal.name}</span>
                </span>
              </div>
            </div>
          )}

          {/* Merchant / Source Payee */}
          {type !== 'transfer' && (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                {type === 'expense' ? 'Merchant / Vendor' : 'Source / Employer / Client'}
              </label>
              <input
                type="text"
                placeholder={type === 'expense' ? 'e.g. Grocery Store, Coffee Shop, Gas' : 'e.g. Monthly Salary, Freelance Client, Bonus'}
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          )}

          {/* Category Picker (if not transfer) */}
          {type !== 'transfer' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">Category</label>
                {onManageCategories && (
                  <button
                    type="button"
                    onClick={onManageCategories}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Plus size={12} strokeWidth={2.5} />
                    <span>Manage Categories</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
                {availableCategories.map((cat) => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/15 text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} size={13} />
                      </div>
                      <span className="text-[11px] font-medium truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Account Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  {type === 'transfer' ? 'From Account' : type === 'income' ? 'Deposit Into Account' : 'Account'}
                </label>
                {onAddAccount && (
                  <button
                    type="button"
                    onClick={onAddAccount}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Plus size={12} strokeWidth={2.5} />
                    <span>+ Account</span>
                  </button>
                )}
              </div>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(acc.balance, currency)})
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  To Account
                </label>
                <select
                  value={targetAccountId}
                  onChange={(e) => setTargetAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatCurrency(acc.balance, currency)})
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Notes & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Note / Memo</label>
              <input
                type="text"
                placeholder="Optional description"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Tags</label>
              <input
                type="text"
                placeholder="#salary, #freelance, #bills"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Recurring rule toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <RotateCw size={15} className="text-slate-400" />
              <div>
                <p className="font-semibold text-slate-200">Recurring Rule</p>
                <p className="text-[10px] text-slate-400">Scheduled repeat entry</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isRecurring && (
                <select
                  value={recurringFreq}
                  onChange={(e) => setRecurringFreq(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              )}
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Action buttons: Cancel + Submit (and Delete if editing) */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs sm:text-sm transition-all cursor-pointer text-center"
            >
              Cancel
            </button>

            {isEditing && onDelete && initialTransaction && (
              <button
                type="button"
                onClick={async () => {
                  if (confirmDeleteInModal) {
                    setIsSubmitting(true);
                    try {
                      await onDelete(initialTransaction.id);
                      onClose();
                    } finally {
                      setIsSubmitting(false);
                    }
                  } else {
                    setConfirmDeleteInModal(true);
                  }
                }}
                disabled={isSubmitting}
                className={`py-3 px-3.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  confirmDeleteInModal
                    ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                    : 'bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400'
                }`}
                title={confirmDeleteInModal ? 'Click again to confirm delete' : 'Delete transaction entry'}
              >
                <Trash2 size={16} />
                <span>{confirmDeleteInModal ? 'Confirm Delete?' : 'Delete'}</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting || numericAmount <= 0}
              className="flex-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>
                {isSubmitting
                  ? 'Saving...'
                  : isEditing
                  ? 'Update Entry'
                  : type === 'income'
                  ? 'Save Income Entry'
                  : 'Save Transaction'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
