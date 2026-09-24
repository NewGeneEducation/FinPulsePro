import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Target,
  Sparkles,
  Plus,
  Globe,
  WifiOff,
  Database,
  ChevronDown,
  Bell,
  Lock,
  ArrowDownLeft,
} from 'lucide-react';
import { CurrencyCode, TransactionType } from '../../types';
import { CURRENCIES } from '../../utils/currency';

export type NavTab = 'overview' | 'expenses' | 'analytics' | 'goals' | 'reminders' | 'pro';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenAddModal: (type?: TransactionType) => void;
  currency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  isOffline: boolean;
  transactionsCount: number;
  dueRemindersCount: number;
  isPasswordProtected: boolean;
  onLockVault: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenAddModal,
  currency,
  onCurrencyChange,
  isOffline,
  transactionsCount,
  dueRemindersCount,
  isPasswordProtected,
  onLockVault,
}) => {
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: typeof LayoutDashboard; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'expenses', label: 'Ledger', icon: Receipt },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'goals', label: 'Savings Goals', icon: Target },
    { id: 'reminders', label: 'Alerts', icon: Bell, badge: dueRemindersCount },
    { id: 'pro', label: 'Pro & Security', icon: Sparkles },
  ];

  return (
    <>
      {/* Top Bar (Clean 3-Zone Contract) */}
      <header className="sticky top-0 z-30 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onTabChange('overview')}
              className="text-lg md:text-xl font-extrabold tracking-tight text-white flex items-center gap-2 group text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <span className="text-slate-950 font-black text-base">F</span>
              </div>
              <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                FinPulse Pro
              </span>
            </button>

            {/* Offline IndexedDB Status indicator */}
            <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400 pl-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>IndexedDB Active</span>
              <span aria-hidden="true">·</span>
              <span>{transactionsCount} records</span>
              {isOffline && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-400 flex items-center gap-1">
                    <WifiOff size={11} /> Offline mode
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Zone 2: Desktop clean text navigation links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`relative flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-emerald-400' : ''} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Actions (Lock, Currency Switcher, Add Income, Quick Record) */}
          <div className="flex items-center gap-2">
            {/* Quick Lock Button if password protected */}
            {isPasswordProtected && (
              <button
                onClick={onLockVault}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                title="Lock Vault Now"
              >
                <Lock size={15} />
              </button>
            )}

            {/* Currency Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 hover:border-slate-700 transition-colors cursor-pointer"
                title="Change active currency"
              >
                <Globe size={13} className="text-emerald-400" />
                <span className="font-mono">{currency}</span>
                <span className="text-slate-500 font-mono text-[10px]">
                  {CURRENCIES[currency].symbol}
                </span>
                <ChevronDown size={12} className="text-slate-400 ml-0.5" />
              </button>

              {currencyDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setCurrencyDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-50 max-h-72 overflow-y-auto">
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      Multi-Currency Pro
                    </div>
                    {Object.values(CURRENCIES).map((c) => (
                      <button
                        key={c.code}
                        onClick={() => {
                          onCurrencyChange(c.code);
                          setCurrencyDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer ${
                          currency === c.code
                            ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold w-8">{c.code}</span>
                          <span className="text-slate-400 text-[11px] truncate max-w-[80px]">
                            {c.name}
                          </span>
                          {c.code === 'INR' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-medium">
                              Default
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-slate-300 font-bold">{c.symbol}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Quick Add Split Menu */}
            <div className="relative">
              <button
                onClick={() => setQuickAddOpen(!quickAddOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus size={15} strokeWidth={2.8} />
                <span>Entry</span>
                <ChevronDown size={12} strokeWidth={2.5} />
              </button>

              {quickAddOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setQuickAddOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-50 text-xs">
                    <button
                      onClick={() => {
                        setQuickAddOpen(false);
                        onOpenAddModal('income');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-emerald-400 hover:bg-slate-800 text-left font-semibold cursor-pointer"
                    >
                      <ArrowDownLeft size={14} />
                      <span>+ Add Income</span>
                    </button>
                    <button
                      onClick={() => {
                        setQuickAddOpen(false);
                        onOpenAddModal('expense');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-rose-300 hover:bg-slate-800 text-left font-semibold cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>- Add Expense</span>
                    </button>
                    <button
                      onClick={() => {
                        setQuickAddOpen(false);
                        onOpenAddModal('transfer');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-blue-300 hover:bg-slate-800 text-left font-semibold cursor-pointer border-t border-slate-800/80"
                    >
                      <span>Account Transfer</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (Pattern 1) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 pb-safe">
        <div className="grid grid-cols-6 items-center h-16 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
                  isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className="relative">
                  <Icon size={18} className={isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[8px] flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                  )}
                </div>
                <span className="text-[9px] font-semibold tracking-tight mt-1 truncate max-w-[50px]">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
