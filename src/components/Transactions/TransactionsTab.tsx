import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Sparkles,
  Tag,
} from 'lucide-react';
import {
  Account,
  Category,
  CurrencyCode,
  Transaction,
  TransactionType,
} from '../../types';
import { formatCurrency } from '../../utils/currency';
import { CategoryIcon } from '../Common/CategoryIcon';
import { ConfirmModal } from '../Common/ConfirmModal';
import { CategoryManagerModal } from '../Categories/CategoryManagerModal';

interface TransactionsTabProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  categoriesMap: Map<string, Category>;
  accountsMap: Map<string, Account>;
  currency: CurrencyCode;
  customRates?: Record<string, number>;
  onOpenAddModal: (type?: TransactionType) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => Promise<void>;
  onExportCSV: () => string;
  onAddCategory?: (category: Omit<Category, 'id'>) => Promise<Category>;
  onUpdateCategory?: (category: Category) => Promise<void>;
  onDeleteCategory?: (id: string) => Promise<void>;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  categories,
  accounts,
  categoriesMap,
  accountsMap,
  currency,
  customRates,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
  onExportCSV,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [deleteTargetTxId, setDeleteTargetTxId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Type filter
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      // Category filter
      if (selectedCategory !== 'all' && t.categoryId !== selectedCategory) return false;
      // Account filter
      if (selectedAccount !== 'all' && t.accountId !== selectedAccount) return false;
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cat = categoriesMap.get(t.categoryId)?.name.toLowerCase() || '';
        const acc = accountsMap.get(t.accountId)?.name.toLowerCase() || '';
        const merchant = (t.merchant || '').toLowerCase();
        const note = (t.note || '').toLowerCase();
        const tags = (t.tags || []).join(' ').toLowerCase();

        return (
          merchant.includes(q) ||
          cat.includes(q) ||
          acc.includes(q) ||
          note.includes(q) ||
          tags.includes(q)
        );
      }
      return true;
    });
  }, [transactions, typeFilter, selectedCategory, selectedAccount, searchQuery, categoriesMap, accountsMap]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups: { date: string; displayDate: string; items: Transaction[] }[] = [];
    const map = new Map<string, Transaction[]>();

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    filteredTransactions.forEach((t) => {
      if (!map.has(t.date)) {
        map.set(t.date, []);
      }
      map.get(t.date)!.push(t);
    });

    Array.from(map.entries()).forEach(([date, items]) => {
      let displayDate = date;
      if (date === todayStr) displayDate = 'Today';
      else if (date === yesterdayStr) displayDate = 'Yesterday';
      else {
        const d = new Date(date + 'T00:00:00');
        displayDate = d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
      groups.push({ date, displayDate, items });
    });

    return groups;
  }, [filteredTransactions]);

  const handleDownloadCSV = () => {
    const csvContent = onExportCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FinPulse_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden space-y-3">
      {/* Header with Title & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Financial Ledger & Entries
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time tracking of all income, expenses, and account transfers ({filteredTransactions.length} entries)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onAddCategory && (
            <button
              onClick={() => setIsCategoryManagerOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Add, edit or remove categories"
            >
              <Tag size={14} />
              <span>Categories</span>
            </button>
          )}

          <button
            onClick={handleDownloadCSV}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            title="Download CSV for Excel or Google Sheets"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          {/* Add Income dedicated CTA */}
          <button
            onClick={() => onOpenAddModal('income')}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowDownLeft size={15} />
            <span>+ Add Income</span>
          </button>

          {/* Add Expense / Any Entry CTA */}
          <button
            onClick={() => onOpenAddModal('expense')}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Record Entry</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2.5 shadow-lg shrink-0">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full md:flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search merchant, tag (#salary, #groceries), note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Type Segmented buttons */}
          <div className="w-full md:w-auto flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs shrink-0 overflow-x-auto">
            {(['all', 'income', 'expense', 'transfer'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-all cursor-pointer whitespace-nowrap ${
                  typeFilter === t
                    ? 'bg-slate-800 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'all' ? 'All Entries' : t === 'income' ? 'Income Inflow' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Category & Account Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 text-xs">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>

          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {(searchQuery || typeFilter !== 'all' || selectedCategory !== 'all' || selectedAccount !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('all');
                setSelectedCategory('all');
                setSelectedAccount('all');
              }}
              className="text-[11px] text-slate-400 hover:text-emerald-400 px-2 py-1 underline cursor-pointer shrink-0"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Transactions List Grouped by Date */}
      {groupedTransactions.length === 0 ? (
        <div className="flex-1 min-h-0 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Filter size={20} />
          </div>
          <h3 className="text-sm font-bold text-white">No transactions recorded yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Get started by recording your primary income source or your first expense entry.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onOpenAddModal('income')}
              className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-bold text-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <ArrowDownLeft size={14} />
              <span>Add Income</span>
            </button>
            <button
              onClick={() => onOpenAddModal('expense')}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Add Expense</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-3 pb-2">
          {groupedTransactions.map((group) => (
            <div
              key={group.date}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg"
            >
              {/* Group Date Header */}
              <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">{group.displayDate}</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {group.items.length} {group.items.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>

              {/* Items */}
              <div className="divide-y divide-slate-800/60">
                {group.items.map((tx) => {
                  const cat = categoriesMap.get(tx.categoryId);
                  const acc = accountsMap.get(tx.accountId);
                  const isExpense = tx.type === 'expense';
                  const isIncome = tx.type === 'income';

                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                          style={{
                            backgroundColor: `${cat?.color || '#3b82f6'}20`,
                            color: cat?.color || '#3b82f6',
                          }}
                        >
                          <CategoryIcon name={cat?.icon || 'Tag'} size={18} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs sm:text-sm font-bold text-white truncate">
                              {tx.merchant || cat?.name || 'Transaction'}
                            </p>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                                isIncome
                                  ? 'text-emerald-400 bg-emerald-500/10'
                                  : isExpense
                                  ? 'text-rose-400 bg-rose-500/10'
                                  : 'text-blue-400 bg-blue-500/10'
                              }`}
                            >
                              {tx.type}
                            </span>
                            {tx.isRecurring && (
                              <span className="text-[10px] text-blue-400 font-mono">
                                ↺ {tx.recurringFrequency}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400 mt-0.5">
                            <span>{cat?.name || 'Category'}</span>
                            <span aria-hidden="true">·</span>
                            <span>{acc?.name || 'Account'}</span>
                            {tx.note && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="italic text-slate-400 truncate max-w-[150px]">
                                  {tx.note}
                                </span>
                              </>
                            )}
                            {tx.roundUpAmount && tx.roundUpAmount > 0 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-0.5">
                                  <Sparkles size={11} /> +${tx.roundUpAmount.toFixed(2)} saved
                                </span>
                              </>
                            )}
                          </div>

                          {/* Tags */}
                          {tx.tags && tx.tags.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-1">
                              {tx.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] text-slate-400 font-mono"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right amount & action icons (Edit & Delete) */}
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <div className="text-right">
                          <p
                            className={`text-sm sm:text-base font-extrabold font-mono tabular-nums ${
                              isIncome
                                ? 'text-emerald-400'
                                : isExpense
                                ? 'text-white'
                                : 'text-blue-400'
                            }`}
                          >
                            {isIncome ? '+' : isExpense ? '-' : ''}
                            {formatCurrency(tx.amount, currency, customRates)}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {tx.time || '00:00'}
                          </span>
                        </div>

                        {/* Edit button */}
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer"
                          title="Edit transaction entry"
                        >
                          <Edit2 size={15} />
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => setDeleteTargetTxId(tx.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                          title="Delete transaction entry"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Ledger Entry Confirmation Dialog */}
      <ConfirmModal
        isOpen={!!deleteTargetTxId}
        title="Delete Transaction Entry?"
        message="Are you sure you want to delete this entry? Associated account balances and round-up savings will be accurately reversed."
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
