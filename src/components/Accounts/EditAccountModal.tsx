import React, { useState, useEffect } from 'react';
import { Account, AccountType, CurrencyCode } from '../../types';
import { X, Landmark, ShieldCheck, CreditCard, Coins, Check, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { ConfirmModal } from '../Common/ConfirmModal';

export interface AccountModalProps {
  isOpen: boolean;
  account: Account | null; // null for creating a new account
  totalAccountsCount?: number;
  currency: CurrencyCode;
  customRates?: Record<string, number>;
  onClose: () => void;
  onSave: (accountData: Omit<Account, 'id'> & { id?: string }) => Promise<void>;
  onDelete?: (accountId: string) => Promise<void>;
}

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#64748b', // Slate
];

const ACCOUNT_TYPES: { type: AccountType; label: string; icon: typeof Landmark }[] = [
  { type: 'checking', label: 'Checking Account', icon: Landmark },
  { type: 'savings', label: 'Savings Account', icon: ShieldCheck },
  { type: 'credit', label: 'Credit Card', icon: CreditCard },
  { type: 'cash', label: 'Cash Wallet', icon: Coins },
  { type: 'investment', label: 'Investment / Brokerage', icon: Landmark },
];

export const EditAccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  account,
  totalAccountsCount = 1,
  currency,
  customRates,
  onClose,
  onSave,
  onDelete,
}) => {
  const isEditing = !!account;
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('0');
  const [type, setType] = useState<AccountType>('checking');
  const [color, setColor] = useState('#3b82f6');
  const [accountNumber, setAccountNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setBalance(account.balance.toString());
      setType(account.type);
      setColor(account.color);
      setAccountNumber(account.accountNumber || '');
    } else {
      setName('');
      setBalance('0');
      setType('checking');
      setColor('#10b981');
      setAccountNumber('');
    }
    setShowDeleteConfirm(false);
  }, [account, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const parsedBalance = parseFloat(balance) || 0;
      await onSave({
        ...(account ? account : {}),
        name: name.trim(),
        balance: Number(parsedBalance.toFixed(2)),
        type,
        color,
        icon: type === 'savings' ? 'ShieldCheck' : type === 'credit' ? 'CreditCard' : type === 'cash' ? 'Coins' : 'Landmark',
        currency: currency || 'INR',
        accountNumber: accountNumber.trim() || undefined,
        ...(account?.id ? { id: account.id } : {}),
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!account || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(account.id);
      setShowDeleteConfirm(false);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-hidden">
        <div className="relative w-full max-w-md max-h-[95vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {isEditing ? <Landmark size={18} /> : <Plus size={18} />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {isEditing ? 'Edit Account' : 'Add New Account'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isEditing ? 'Update balances & account configurations' : 'Create a fresh account in your vault'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 flex-1 min-h-0 overflow-y-auto no-scrollbar">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Account Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. HDFC Bank, ICICI Savings, Cash Wallet"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {isEditing ? 'Current / Starting Balance' : 'Opening Balance'} ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Set to 0.00 for clean slate or enter your real starting funds.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ACCOUNT_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = type === t.type;
                  return (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => setType(t.type)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Icon size={14} className={isSelected ? 'text-emerald-400' : 'text-slate-400'} />
                      <span className="truncate">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Masked Number or Tag (Optional)
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. •••• 4021 or Salary"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Color Accent
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check size={14} className="text-white" strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons with clear Cancel, Delete & Save */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
              {isEditing && onDelete ? (
                <button
                  type="button"
                  disabled={totalAccountsCount <= 1}
                  onClick={() => setShowDeleteConfirm(true)}
                  title={totalAccountsCount <= 1 ? 'At least one account is required' : 'Delete this account'}
                  className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/10 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : isEditing ? 'Update Account' : 'Add Account'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      {showDeleteConfirm && account && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          title={`Delete "${account.name}" Account?`}
          message="Are you sure you want to remove this account? Any transactions assigned to this account will remain in your records."
          confirmText="Yes, Delete Account"
          cancelText="Cancel"
          isDanger={true}
          isLoading={isDeleting}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
};
