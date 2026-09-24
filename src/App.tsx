/**
 * FinPulse Pro - Personal Finance, Expense & Income Tracking,
 * Automated Savings, Alerts/Reminders & Web Crypto Password Vault
 */

import React, { useState, useEffect } from 'react';
import { useFinPulseData } from './hooks/useFinPulseData';
import { CurrencyCode, Transaction, TransactionType } from './types';
import { Navbar, NavTab } from './components/Navigation/Navbar';
import { OverviewTab } from './components/Dashboard/OverviewTab';
import { TransactionsTab } from './components/Transactions/TransactionsTab';
import { AnalyticsTab } from './components/Analytics/AnalyticsTab';
import { GoalsTab } from './components/Goals/GoalsTab';
import { RemindersTab } from './components/Reminders/RemindersTab';
import { ProHubTab } from './components/Pro/ProHubTab';
import { TransactionModal } from './components/Transactions/TransactionModal';
import { SecurityLockScreen } from './components/Security/SecurityLockScreen';
import { EditAccountModal } from './components/Accounts/EditAccountModal';
import { CategoryManagerModal } from './components/Categories/CategoryManagerModal';
import { verifyPassword } from './utils/security';
import { Loader2, Plus, Sparkles } from 'lucide-react';

export default function App() {
  const {
    transactions,
    accounts,
    categories,
    goals,
    budgets,
    reminders,
    settings,
    isLoading,
    isOffline,
    categoriesMap,
    accountsMap,
    goalsMap,
    netWorth,
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
    activeReminders,
    dueRemindersCount,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    depositToGoal,
    withdrawFromGoal,
    setBudget,
    addReminder,
    updateReminder,
    toggleReminderCompleted,
    deleteReminder,
    addAccount,
    updateAccount,
    deleteAccount,
    addCategory,
    updateCategory,
    deleteCategory,
    updateSettings,
    removeAllSampleData,
    makeAllDataZero,
    exportBackupJSON,
    importBackupJSON,
    getCSVData,
  } = useFinPulseData();

  const [currentTab, setCurrentTab] = useState<NavTab>('overview');

  // Modal states for creating / editing entries
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<TransactionType>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Global modals for adding account & managing categories (e.g. from transaction modal)
  const [isGlobalCategoryManagerOpen, setIsGlobalCategoryManagerOpen] = useState(false);
  const [isGlobalAccountModalOpen, setIsGlobalAccountModalOpen] = useState(false);

  // Security Lock state
  const [isVaultLocked, setIsVaultLocked] = useState(false);

  // Initialize lock screen based on settings
  useEffect(() => {
    if (!isLoading && settings.security?.isPasswordProtected) {
      // Check session storage if already unlocked in current session
      const isUnlockedThisSession = sessionStorage.getItem('finpulse_vault_unlocked');
      if (!isUnlockedThisSession) {
        setIsVaultLocked(true);
      }
    }
  }, [isLoading, settings.security?.isPasswordProtected]);

  const handleUnlock = () => {
    sessionStorage.setItem('finpulse_vault_unlocked', 'true');
    setIsVaultLocked(false);
  };

  const handleLockVault = () => {
    sessionStorage.removeItem('finpulse_vault_unlocked');
    setIsVaultLocked(true);
  };

  // Reset password via security answer
  const handleResetPasswordWithAnswer = async (candidateAnswer: string): Promise<boolean> => {
    if (!settings.security?.securityAnswerHash || !settings.security?.securityAnswerSalt) {
      return false;
    }

    const isMatch = await verifyPassword(
      candidateAnswer.toLowerCase(),
      settings.security.securityAnswerHash,
      settings.security.securityAnswerSalt
    );

    if (isMatch) {
      // Remove password lock
      await updateSettings({
        security: {
          ...settings.security,
          isPasswordProtected: false,
          passwordHash: undefined,
          passwordSalt: undefined,
        },
      });
      sessionStorage.setItem('finpulse_vault_unlocked', 'true');
      return true;
    }
    return false;
  };

  // Open modal for add
  const handleOpenAdd = (type: TransactionType = 'expense') => {
    setEditingTransaction(null);
    setModalDefaultType(type);
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setModalDefaultType(tx.type);
    setIsModalOpen(true);
  };

  // Active currency (default Indian Rupee)
  const activeCurrency: CurrencyCode = settings.baseCurrency || 'INR';

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    updateSettings({ baseCurrency: newCurrency });
  };

  // Determine theme style classes
  const themeClass =
    settings.theme === 'emerald'
      ? 'bg-emerald-950/20 text-slate-100'
      : settings.theme === 'slate'
      ? 'bg-slate-950 text-slate-100'
      : settings.theme === 'light'
      ? 'bg-slate-100 text-slate-900'
      : 'bg-[#090d16] text-slate-100'; // Default midnight OLED

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-6 text-slate-300">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-semibold tracking-wide">Initializing FinPulse Pro Vault...</p>
        <p className="text-xs text-slate-500 mt-1">100% offline data encryption & fast local indexing</p>
      </div>
    );
  }

  // If vault is locked, render master passcode lock screen
  if (isVaultLocked && settings.security?.isPasswordProtected) {
    return (
      <SecurityLockScreen
        security={settings.security}
        onUnlock={handleUnlock}
        onResetPasswordWithSecurityAnswer={handleResetPasswordWithAnswer}
      />
    );
  }

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col font-sans transition-colors select-none ${themeClass}`}>
      {/* Top Bar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenAddModal={handleOpenAdd}
        currency={activeCurrency}
        onCurrencyChange={handleCurrencyChange}
        isOffline={isOffline}
        transactionsCount={transactions.length}
        dueRemindersCount={dueRemindersCount}
        isPasswordProtected={!!settings.security?.isPasswordProtected}
        onLockVault={handleLockVault}
      />

      {/* Main Workspace Canvas - Auto-fit to viewport without scroll bars */}
      <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 pb-16 md:pb-2.5 overflow-hidden flex flex-col">
        {currentTab === 'overview' && (
          <OverviewTab
            netWorth={netWorth}
            currentMonthIncome={currentMonthIncome}
            currentMonthExpense={currentMonthExpense}
            currentMonthSaved={currentMonthSaved}
            currentMonthSavingsRate={currentMonthSavingsRate}
            totalRoundUpsThisMonth={totalRoundUpsThisMonth}
            financialHealthScore={financialHealthScore}
            financialRunwayMonths={financialRunwayMonths}
            transactions={transactions}
            accounts={accounts}
            goals={goals}
            reminders={reminders}
            categories={categories}
            categorySpendBreakdown={categorySpendBreakdown}
            dailySpendTrend={dailySpendTrend}
            categoriesMap={categoriesMap}
            accountsMap={accountsMap}
            currency={activeCurrency}
            customRates={settings.customExchangeRates}
            settings={settings}
            onNavigateTab={setCurrentTab}
            onOpenAddModal={handleOpenAdd}
            onDepositToGoal={(goalId, amount) => depositToGoal(goalId, amount)}
            onDeleteTransaction={deleteTransaction}
            onRemoveAllData={makeAllDataZero}
            onAddAccount={addAccount}
            onUpdateAccount={updateAccount}
            onDeleteAccount={deleteAccount}
            onAddCategory={addCategory}
            onUpdateCategory={updateCategory}
            onDeleteCategory={deleteCategory}
          />
        )}

        {currentTab === 'expenses' && (
          <TransactionsTab
            transactions={transactions}
            categories={categories}
            accounts={accounts}
            categoriesMap={categoriesMap}
            accountsMap={accountsMap}
            currency={activeCurrency}
            customRates={settings.customExchangeRates}
            onOpenAddModal={handleOpenAdd}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={deleteTransaction}
            onExportCSV={getCSVData}
            onAddCategory={addCategory}
            onUpdateCategory={updateCategory}
            onDeleteCategory={deleteCategory}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsTab
            currentMonthIncome={currentMonthIncome}
            currentMonthExpense={currentMonthExpense}
            currentMonthSaved={currentMonthSaved}
            currentMonthSavingsRate={currentMonthSavingsRate}
            categorySpendBreakdown={categorySpendBreakdown}
            budgetStatuses={budgetStatuses}
            dailySpendTrend={dailySpendTrend}
            transactions={transactions}
            categories={categories}
            currency={activeCurrency}
            customRates={settings.customExchangeRates}
            onSetBudget={setBudget}
            onAddCategory={addCategory}
            onUpdateCategory={updateCategory}
            onDeleteCategory={deleteCategory}
          />
        )}

        {currentTab === 'goals' && (
          <GoalsTab
            goals={goals}
            accounts={accounts}
            settings={settings}
            currency={activeCurrency}
            customRates={settings.customExchangeRates}
            totalRoundUpsThisMonth={totalRoundUpsThisMonth}
            totalRoundUpsAllTime={totalRoundUpsAllTime}
            onAddGoal={addSavingsGoal}
            onUpdateGoal={updateSavingsGoal}
            onDeleteGoal={deleteSavingsGoal}
            onDepositToGoal={depositToGoal}
            onWithdrawFromGoal={withdrawFromGoal}
            onUpdateSettings={updateSettings}
          />
        )}

        {currentTab === 'reminders' && (
          <RemindersTab
            reminders={reminders}
            currency={activeCurrency}
            customRates={settings.customExchangeRates}
            onAddReminder={addReminder}
            onUpdateReminder={updateReminder}
            onToggleReminder={toggleReminderCompleted}
            onDeleteReminder={deleteReminder}
          />
        )}

        {currentTab === 'pro' && (
          <ProHubTab
            settings={settings}
            accounts={accounts}
            transactions={transactions}
            categories={categories}
            currency={activeCurrency}
            customRates={settings.customExchangeRates}
            netWorth={netWorth}
            financialRunwayMonths={financialRunwayMonths}
            onUpdateSettings={updateSettings}
            onExportBackup={exportBackupJSON}
            onImportBackup={importBackupJSON}
            onRemoveAllData={removeAllSampleData}
            onAddAccount={addAccount}
            onUpdateAccount={updateAccount}
            onDeleteAccount={deleteAccount}
            onAddCategory={addCategory}
            onUpdateCategory={updateCategory}
            onDeleteCategory={deleteCategory}
          />
        )}
      </main>

      {/* Floating Action Button for Mobile Thumb Zone */}
      <button
        onClick={() => handleOpenAdd('expense')}
        className="md:hidden fixed right-4 bottom-20 z-30 w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-500/30 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
        aria-label="Add transaction"
      >
        <Plus size={22} strokeWidth={2.6} />
      </button>

      {/* Add / Edit Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={addTransaction}
        onUpdate={updateTransaction}
        onDelete={deleteTransaction}
        initialTransaction={editingTransaction}
        defaultType={modalDefaultType}
        categories={categories}
        accounts={accounts}
        goals={goals}
        settings={settings}
        currency={activeCurrency}
        onManageCategories={() => setIsGlobalCategoryManagerOpen(true)}
        onAddAccount={() => setIsGlobalAccountModalOpen(true)}
      />

      {/* Global Add Account Modal (from transaction modal or anywhere) */}
      {isGlobalAccountModalOpen && (
        <EditAccountModal
          isOpen={isGlobalAccountModalOpen}
          account={null}
          totalAccountsCount={accounts.length}
          currency={activeCurrency}
          customRates={settings.customExchangeRates}
          onClose={() => setIsGlobalAccountModalOpen(false)}
          onSave={async (accData) => {
            await addAccount(accData);
            setIsGlobalAccountModalOpen(false);
          }}
        />
      )}

      {/* Global Category Manager Modal */}
      {isGlobalCategoryManagerOpen && (
        <CategoryManagerModal
          isOpen={isGlobalCategoryManagerOpen}
          categories={categories}
          transactions={transactions}
          onClose={() => setIsGlobalCategoryManagerOpen(false)}
          onAddCategory={addCategory}
          onUpdateCategory={updateCategory}
          onDeleteCategory={deleteCategory}
        />
      )}
    </div>
  );
}
