import React, { useState, useMemo } from 'react';
import { Category, Transaction } from '../../types';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  Search,
  Tag,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { CategoryIcon, AVAILABLE_CATEGORY_ICONS } from '../Common/CategoryIcon';
import { ConfirmModal } from '../Common/ConfirmModal';

interface CategoryManagerModalProps {
  isOpen: boolean;
  categories: Category[];
  transactions: Transaction[];
  onClose: () => void;
  onAddCategory: (category: Omit<Category, 'id'>) => Promise<Category>;
  onUpdateCategory: (category: Category) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

const PRESET_COLORS = [
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#ef4444', // Red
  '#14b8a6', // Teal
  '#84cc16', // Lime
  '#64748b', // Slate
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  categories,
  transactions,
  onClose,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [color, setColor] = useState('#10b981');
  const [icon, setIcon] = useState('Tag');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deletion confirm modal state
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Count transactions per category
  const txCountMap = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((tx) => {
      map.set(tx.categoryId, (map.get(tx.categoryId) || 0) + 1);
    });
    return map;
  }, [transactions]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories
      .filter((c) => c.type === activeTab)
      .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));
  }, [categories, activeTab, searchQuery]);

  const openAddForm = () => {
    setEditingCategory(null);
    setName('');
    setType(activeTab);
    setColor(activeTab === 'expense' ? '#f59e0b' : '#22c55e');
    setIcon(activeTab === 'expense' ? 'ShoppingBag' : 'Briefcase');
    setBudgetLimit('');
    setIsEditorOpen(true);
  };

  const openEditForm = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setType(cat.type);
    setColor(cat.color);
    setIcon(cat.icon);
    setBudgetLimit(cat.budgetLimit ? cat.budgetLimit.toString() : '');
    setIsEditorOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const budgetNum = budgetLimit ? parseFloat(budgetLimit) : undefined;
      if (editingCategory) {
        await onUpdateCategory({
          ...editingCategory,
          name: name.trim(),
          type,
          color,
          icon,
          budgetLimit: budgetNum && budgetNum > 0 ? budgetNum : undefined,
        });
      } else {
        await onAddCategory({
          name: name.trim(),
          type,
          color,
          icon,
          budgetLimit: budgetNum && budgetNum > 0 ? budgetNum : undefined,
        });
      }
      setIsEditorOpen(false);
      setEditingCategory(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteCategory(categoryToDelete.id);
      setCategoryToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-hidden">
        <div className="relative w-full max-w-2xl max-h-[95vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Tag size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Categories Manager</h3>
                <p className="text-[11px] text-slate-400">
                  Customise & organize your income and expense categories
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

          {/* Subheader Controls: Type Switcher, Search, and New Category CTA */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('expense')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'expense'
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowUpRight size={13} />
                  <span>Expenses ({categories.filter((c) => c.type === 'expense').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('income')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'income'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowDownLeft size={13} />
                  <span>Income ({categories.filter((c) => c.type === 'income').length})</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={openAddForm}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-500/15 active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>+ Category</span>
              </button>
            </div>
          </div>

          {/* Body: List or Category Editor */}
          {isEditorOpen ? (
            <div className="p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-emerald-400" />
                  <span>{editingCategory ? 'Edit Category' : 'Create New Category'}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Back to list
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Category Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Groceries, Fuel, Dividends"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Flow Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setType('expense')}
                        className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          type === 'expense'
                            ? 'bg-rose-500/15 border-rose-500 text-rose-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <ArrowUpRight size={14} />
                        <span>Expense</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setType('income')}
                        className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          type === 'income'
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <ArrowDownLeft size={14} />
                        <span>Income</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Color Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Badge Color Accent
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

                {/* Icon Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Category Icon
                  </label>
                  <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 max-h-36 overflow-y-auto no-scrollbar p-2 bg-slate-950 rounded-xl border border-slate-800">
                    {AVAILABLE_CATEGORY_ICONS.map((iconName) => {
                      const isSelected = icon === iconName;
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setIcon(iconName)}
                          className={`p-2 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                          title={iconName}
                        >
                          <CategoryIcon name={iconName} size={18} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Monthly Budget Limit (optional for expense) */}
                {type === 'expense' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Monthly Budget Limit (Optional)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={budgetLimit}
                      onChange={(e) => setBudgetLimit(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                {/* Form Buttons */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !name.trim()}
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/10 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-4 flex-1 min-h-0 overflow-y-auto no-scrollbar">
              {filteredCategories.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <Tag size={28} className="mx-auto text-slate-600" />
                  <p className="text-sm font-medium">No {activeTab} categories found</p>
                  <button
                    type="button"
                    onClick={openAddForm}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add New Category</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredCategories.map((cat) => {
                    const txCount = txCountMap.get(cat.id) || 0;
                    return (
                      <div
                        key={cat.id}
                        className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-3 group transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                            style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                          >
                            <CategoryIcon name={cat.icon} size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{cat.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {txCount} {txCount === 1 ? 'transaction' : 'transactions'}
                              {cat.budgetLimit ? ` · Budget: ₹${cat.budgetLimit}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditForm(cat)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit category"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={categories.filter((c) => c.type === cat.type).length <= 1}
                            onClick={() => setCategoryToDelete(cat)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            title={
                              categories.filter((c) => c.type === cat.type).length <= 1
                                ? 'At least one category is required'
                                : 'Delete category'
                            }
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Category Confirm Modal */}
      {categoryToDelete && (
        <ConfirmModal
          isOpen={!!categoryToDelete}
          title={`Delete "${categoryToDelete.name}" Category?`}
          message={`Are you sure you want to remove this ${categoryToDelete.type} category? Any transactions linked to this category will still remain in your ledger.`}
          confirmText="Yes, Delete Category"
          cancelText="Cancel"
          isDanger={true}
          isLoading={isDeleting}
          onCancel={() => setCategoryToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
};
