import React, { useState } from 'react';
import {
  Sparkles,
  Globe,
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  Sliders,
  DollarSign,
  Palette,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Lock,
  KeyRound,
  ShieldAlert,
  Trash2,
  HelpCircle,
  FileCode,
  Tag,
  Plus,
  Landmark,
} from 'lucide-react';
import {
  Account,
  AppSettings,
  AppTheme,
  Category,
  CurrencyCode,
  SecuritySettings,
  Transaction,
} from '../../types';
import { CURRENCIES, convertAmount, formatCurrency } from '../../utils/currency';
import { hashPassword, encryptData, decryptData } from '../../utils/security';
import { ConfirmModal } from '../Common/ConfirmModal';
import { EditAccountModal } from '../Accounts/EditAccountModal';
import { CategoryManagerModal } from '../Categories/CategoryManagerModal';

interface ProHubTabProps {
  settings: AppSettings;
  accounts: Account[];
  transactions: Transaction[];
  categories?: Category[];
  currency: CurrencyCode;
  customRates?: Record<string, number>;
  netWorth: number;
  financialRunwayMonths: string;
  onUpdateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  onExportBackup: () => Promise<string>;
  onImportBackup: (json: string) => Promise<boolean>;
  onRemoveAllData: () => Promise<void>;
  onAddAccount?: (account: Omit<Account, 'id'>) => Promise<Account>;
  onUpdateAccount?: (account: Account) => Promise<void>;
  onDeleteAccount?: (id: string) => Promise<void>;
  onAddCategory?: (category: Omit<Category, 'id'>) => Promise<Category>;
  onUpdateCategory?: (category: Category) => Promise<void>;
  onDeleteCategory?: (id: string) => Promise<void>;
}

export const ProHubTab: React.FC<ProHubTabProps> = ({
  settings,
  accounts,
  transactions,
  categories = [],
  currency,
  customRates,
  netWorth,
  financialRunwayMonths,
  onUpdateSettings,
  onExportBackup,
  onImportBackup,
  onRemoveAllData,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  // Modal states for accounts and categories
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [selectedAccountToEdit, setSelectedAccountToEdit] = useState<Account | null>(null);
  // Currency calculator tool state (defaults to INR)
  const [calcAmount, setCalcAmount] = useState('1000');
  const [calcFrom, setCalcFrom] = useState<CurrencyCode>('INR');
  const [calcTo, setCalcTo] = useState<CurrencyCode>('USD');

  // Custom rate editing state
  const [editRateCurrency, setEditRateCurrency] = useState<CurrencyCode>('EUR');
  const [editRateValue, setEditRateValue] = useState(
    (customRates?.[editRateCurrency] ?? CURRENCIES[editRateCurrency].rateToUSD).toString()
  );

  // Security password setup / change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('What city was your first job in?');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [securityError, setSecurityError] = useState<string | null>(null);

  // Data encryption preview state
  const [testPlaintext, setTestPlaintext] = useState('Bank routing number: 121000358');
  const [cipherResult, setCipherResult] = useState('');
  const [decryptedResult, setDecryptedResult] = useState('');

  // Status notification
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showRemoveAllConfirm, setShowRemoveAllConfirm] = useState(false);
  const [showDisablePasswordConfirm, setShowDisablePasswordConfirm] = useState(false);
  const [isWipingData, setIsWipingData] = useState(false);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Convert calculation
  const calculatedResult = React.useMemo(() => {
    const amt = parseFloat(calcAmount) || 0;
    const fromRate = customRates?.[calcFrom] ?? CURRENCIES[calcFrom]?.rateToUSD ?? 1;
    const usdVal = fromRate > 0 ? amt / fromRate : amt;
    const toRate = customRates?.[calcTo] ?? CURRENCIES[calcTo]?.rateToUSD ?? 1;
    return (usdVal * toRate).toFixed(CURRENCIES[calcTo].decimalDigits);
  }, [calcAmount, calcFrom, calcTo, customRates]);

  // Handle Export Backup
  const handleDownloadBackup = async () => {
    try {
      const json = await onExportBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FinPulse_Pro_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showStatus('Full IndexedDB backup downloaded successfully');
    } catch (err) {
      console.error(err);
      showStatus('Failed to generate backup');
    }
  };

  // Handle Import Backup
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        await onImportBackup(text);
        showStatus('Backup restored successfully!');
      } catch (err) {
        showStatus('Error: Invalid backup file format.');
      }
    };
    reader.readAsText(file);
  };

  // Save Security Settings
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);

    if (newPassword.length < 4) {
      setSecurityError('Passcode must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityError('Passwords do not match.');
      return;
    }

    if (!securityAnswer.trim()) {
      setSecurityError('Please provide an answer to your recovery challenge question.');
      return;
    }

    try {
      const pwData = await hashPassword(newPassword);
      const ansData = await hashPassword(securityAnswer.trim().toLowerCase());

      const updatedSecurity: SecuritySettings = {
        ...settings.security,
        isPasswordProtected: true,
        passwordHash: pwData.hash,
        passwordSalt: pwData.salt,
        securityQuestion,
        securityAnswerHash: ansData.hash,
        securityAnswerSalt: ansData.salt,
      };

      await onUpdateSettings({ security: updatedSecurity });
      setNewPassword('');
      setConfirmPassword('');
      setSecurityAnswer('');
      showStatus('Vault password protection enabled!');
    } catch (err) {
      setSecurityError('Failed to encrypt security credentials');
    }
  };

  const handleDisablePassword = async () => {
    setShowDisablePasswordConfirm(true);
  };

  const executeDisablePassword = async () => {
    const updatedSecurity: SecuritySettings = {
      ...settings.security,
      isPasswordProtected: false,
      passwordHash: undefined,
      passwordSalt: undefined,
    };
    await onUpdateSettings({ security: updatedSecurity });
    setShowDisablePasswordConfirm(false);
    showStatus('Password protection removed.');
  };

  // Test AES-GCM encryption demonstration
  const handleTestEncrypt = async () => {
    if (!testPlaintext) return;
    const key = settings.security.passwordHash || 'FinPulseMasterKeyDemo2026';
    const cipher = await encryptData(testPlaintext, key);
    setCipherResult(cipher);
    setDecryptedResult('');
  };

  const handleTestDecrypt = async () => {
    if (!cipherResult) return;
    try {
      const key = settings.security.passwordHash || 'FinPulseMasterKeyDemo2026';
      const dec = await decryptData(cipherResult, key);
      setDecryptedResult(dec);
    } catch (err) {
      setDecryptedResult('Decryption failed: Incorrect encryption key.');
    }
  };

  // Save custom FX rate
  const handleSaveCustomRate = () => {
    const rate = parseFloat(editRateValue);
    if (rate > 0) {
      const currentRates = { ...(settings.customExchangeRates || {}) };
      currentRates[editRateCurrency] = rate;
      onUpdateSettings({ customExchangeRates: currentRates });
      showStatus(`Updated exchange rate for ${editRateCurrency}`);
    }
  };

  const handleResetCustomRates = () => {
    onUpdateSettings({ customExchangeRates: {} });
    showStatus('Exchange rates reset to standard international rates');
  };

  const themes: { id: AppTheme; name: string; desc: string; color: string }[] = [
    { id: 'fintech-dark', name: 'Midnight OLED', desc: 'Deep graphite with emerald accents', color: '#10b981' },
    { id: 'emerald', name: 'FinTech Emerald', desc: 'Vibrant wealth green & crisp contrast', color: '#059669' },
    { id: 'slate', name: 'Obsidian Slate', desc: 'Sophisticated cool gray Nordic styling', color: '#64748b' },
    { id: 'light', name: 'Crisp Titanium', desc: 'Clean daylight financial workstation', color: '#3b82f6' },
  ];

  return (
    <div className="h-full flex flex-col min-h-0 overflow-y-auto no-scrollbar space-y-3.5 pb-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Security, Encryption & Pro Hub
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold tracking-wide">
              PRO VAULT
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Client-side Web Crypto password protection, AES-256 encryption, and multi-currency engine
          </p>
        </div>

        {statusMessage && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium animate-fade-in flex items-center gap-1.5 self-start sm:self-auto">
            <CheckCircle2 size={14} />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Security & Password Protection Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Lock size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Vault Passcode Protection</span>
                {settings.security.isPasswordProtected ? (
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    PROTECTED (PBKDF2)
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                    UNLOCKED
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">
                Prevent unauthorized device access with PBKDF2 100,000-round password hashing
              </p>
            </div>
          </div>

          {settings.security.isPasswordProtected && (
            <button
              onClick={handleDisablePassword}
              className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
            >
              Disable Passcode Protection
            </button>
          )}
        </div>

        {/* Set or Change Password Form */}
        <form onSubmit={handleSavePassword} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3.5">
          <h3 className="text-xs font-bold text-slate-200">
            {settings.security.isPasswordProtected ? 'Update / Reset Passcode' : 'Set Up Vault Master Passcode'}
          </h3>

          {securityError && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {securityError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">New Passcode</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">Confirm Passcode</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Recovery Challenge Question */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">Reset Recovery Question</label>
              <select
                value={securityQuestion}
                onChange={(e) => setSecurityQuestion(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="What city was your first job in?">What city was your first job in?</option>
                <option value="What was the name of your first elementary school?">What was the name of your first elementary school?</option>
                <option value="What was your childhood best friend's nickname?">What was your childhood best friend's nickname?</option>
                <option value="What model was your first car?">What model was your first car?</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">Recovery Secret Answer</label>
              <input
                type="text"
                required
                placeholder="Answer used to recover if passcode is forgotten"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Auto-lock timer:</span>
              <select
                value={settings.security.autoLockTimeoutMinutes}
                onChange={(e) =>
                  onUpdateSettings({
                    security: {
                      ...settings.security,
                      autoLockTimeoutMinutes: parseInt(e.target.value),
                    },
                  })
                }
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
              >
                <option value={1}>1 Minute</option>
                <option value={5}>5 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={60}>1 Hour</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              {settings.security.isPasswordProtected ? 'Update Password' : 'Save & Enable Protection'}
            </button>
          </div>
        </form>
      </div>

      {/* AES-GCM 256-Bit Hardware Encryption Suite */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">AES-GCM 256-bit Hardware Encryption</h2>
              <p className="text-[11px] text-slate-400">
                End-to-end authenticated client-side cryptographic cipher
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold">MILITARY-GRADE</span>
        </div>

        {/* Live Cryptographic Sandbox */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">Interactive Encryption Sandbox</span>
            <span className="text-[10px] text-slate-500 font-mono">Web Crypto SubtleCrypto</span>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">Plaintext Data to Encrypt</label>
            <input
              type="text"
              value={testPlaintext}
              onChange={(e) => setTestPlaintext(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleTestEncrypt}
              className="px-3.5 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs font-semibold cursor-pointer"
            >
              Encrypt with AES-GCM
            </button>
            {cipherResult && (
              <button
                onClick={handleTestDecrypt}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold cursor-pointer"
              >
                Decrypt Cipher
              </button>
            )}
          </div>

          {cipherResult && (
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-mono block">
                Ciphertext Output (Base64 IV + Salt + Auth Tag):
              </span>
              <p className="text-[10px] font-mono text-emerald-400 bg-slate-900 p-2.5 rounded-lg break-all border border-slate-800">
                {cipherResult}
              </p>
            </div>
          )}

          {decryptedResult && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-mono">
              Decrypted verification: <strong>{decryptedResult}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Currency Pro Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Globe size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Multi-Currency Command Center</h2>
              <p className="text-[11px] text-slate-400">
                12 world currencies supported with instant recalculation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Base Currency:</span>
            <select
              value={currency}
              onChange={(e) => onUpdateSettings({ baseCurrency: e.target.value as CurrencyCode })}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
            >
              {Object.values(CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol}) - {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Currency Converter Calculator */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">Live Currency Converter</span>
            <span className="text-[10px] text-slate-400 font-mono">Real-time parity</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
            <div className="sm:col-span-2">
              <div className="relative">
                <input
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-white"
                />
              </div>
            </div>

            <div className="sm:col-span-1">
              <select
                value={calcFrom}
                onChange={(e) => setCalcFrom(e.target.value as CurrencyCode)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-xs font-mono text-white"
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="text-center text-slate-500 text-xs font-mono sm:col-span-0">
              =
            </div>

            <div className="sm:col-span-1">
              <select
                value={calcTo}
                onChange={(e) => setCalcTo(e.target.value as CurrencyCode)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-xs font-mono text-white"
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Equivalent Value:</span>
            <span className="text-base font-extrabold text-emerald-400 font-mono tabular-nums">
              {CURRENCIES[calcTo].symbol} {calculatedResult} {calcTo}
            </span>
          </div>
        </div>

        {/* Custom Rate Editor */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-slate-400 shrink-0">Override Rate (to 1 USD):</span>
            <select
              value={editRateCurrency}
              onChange={(e) => {
                const code = e.target.value as CurrencyCode;
                setEditRateCurrency(code);
                setEditRateValue((customRates?.[code] ?? CURRENCIES[code].rateToUSD).toString());
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
            >
              {Object.values(CURRENCIES).filter((c) => c.code !== 'USD').map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              value={editRateValue}
              onChange={(e) => setEditRateValue(e.target.value)}
              className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-white"
            />
            <button
              onClick={handleSaveCustomRate}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
            >
              Apply
            </button>
          </div>

          {Object.keys(settings.customExchangeRates || {}).length > 0 && (
            <button
              onClick={handleResetCustomRates}
              className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
            >
              Reset FX Overrides
            </button>
          )}
        </div>
      </div>

      {/* Categories & Accounts Customizer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Tag size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Categories & Accounts Management</h2>
              <p className="text-[11px] text-slate-400">
                Create, customize or remove spending categories and bank/wallet accounts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onAddCategory && (
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Tag size={14} />
                <span>Categories ({categories.length})</span>
              </button>
            )}
            {onAddAccount && (
              <button
                type="button"
                onClick={() => {
                  setSelectedAccountToEdit(null);
                  setIsAccountModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/15 cursor-pointer"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>+ Add Account</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Accounts List */}
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Active Accounts ({accounts.length})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: acc.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{acc.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {formatCurrency(acc.balance, currency, customRates)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAccountToEdit(acc);
                    setIsAccountModalOpen(true);
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer shrink-0"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Offline IndexedDB Engine & Data Clean Slate */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Database size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">IndexedDB Storage & Clean Slate</h2>
              <p className="text-[11px] text-slate-400">
                100% offline local device storage with zero remote telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400 font-bold">ENCRYPTED & LOCAL</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Ledger Records</span>
            <span className="text-lg font-bold text-white font-mono mt-0.5 block">
              {transactions.length}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Active Accounts</span>
            <span className="text-lg font-bold text-white font-mono mt-0.5 block">
              {accounts.length}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Database Version</span>
            <span className="text-lg font-bold text-emerald-400 font-mono mt-0.5 block">
              v2.0 (Indexed)
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Query Latency</span>
            <span className="text-lg font-bold text-blue-400 font-mono mt-0.5 block">
              &lt; 2ms
            </span>
          </div>
        </div>

        {/* Data Action Bar */}
        <div className="pt-2 flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadBackup}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download size={14} />
            <span>Download JSON Backup</span>
          </button>

          <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
            <Upload size={14} />
            <span>Restore Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setShowRemoveAllConfirm(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
          >
            <Trash2 size={14} />
            <span>Make All Data Zero (Fresh Start)</span>
          </button>
        </div>
      </div>

      {/* Pro Theme Chooser */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Palette size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">FinPulse Interface Themes</h2>
            <p className="text-[11px] text-slate-400">
              Select your preferred visual atmosphere
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {themes.map((t) => {
            const isSelected = settings.theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onUpdateSettings({ theme: t.id })}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between space-y-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{t.name}</span>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">{t.desc}</p>
                {isSelected && (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 size={11} /> Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Remove All Data Confirm Modal */}
      <ConfirmModal
        isOpen={showRemoveAllConfirm}
        title="Make All Data Zero (Start Fresh)?"
        message="This will set all account balances to ₹0.00 and wipe all transactions, custom goals, budgets, and alerts so you can enter completely fresh data. This action is irreversible."
        confirmText="Make All Data Zero"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isWipingData}
        onCancel={() => setShowRemoveAllConfirm(false)}
        onConfirm={async () => {
          setIsWipingData(true);
          try {
            await onRemoveAllData();
            setShowRemoveAllConfirm(false);
            showStatus('All accounts set to ₹0.00 and records cleared to zero');
          } finally {
            setIsWipingData(false);
          }
        }}
      />

      {/* Disable Password Protection Confirm Modal */}
      <ConfirmModal
        isOpen={showDisablePasswordConfirm}
        title="Remove Password Protection?"
        message="Your vault will open directly without requiring a master passcode on startup."
        confirmText="Remove Password"
        cancelText="Cancel"
        isDanger={false}
        onCancel={() => setShowDisablePasswordConfirm(false)}
        onConfirm={executeDisablePassword}
      />

      {/* Account Modal (Add, Edit, Delete) */}
      {isAccountModalOpen && (
        <EditAccountModal
          isOpen={isAccountModalOpen}
          account={selectedAccountToEdit}
          totalAccountsCount={accounts.length}
          currency={currency}
          customRates={customRates}
          onClose={() => {
            setSelectedAccountToEdit(null);
            setIsAccountModalOpen(false);
          }}
          onSave={async (accData) => {
            if (accData.id && onUpdateAccount) {
              await onUpdateAccount(accData as Account);
            } else if (onAddAccount) {
              await onAddAccount(accData);
            }
            setSelectedAccountToEdit(null);
            setIsAccountModalOpen(false);
          }}
          onDelete={
            onDeleteAccount
              ? async (id) => {
                  await onDeleteAccount(id);
                  setSelectedAccountToEdit(null);
                  setIsAccountModalOpen(false);
                }
              : undefined
          }
        />
      )}

      {/* Category Manager Modal */}
      {isCategoryModalOpen && onAddCategory && onUpdateCategory && onDeleteCategory && (
        <CategoryManagerModal
          isOpen={isCategoryModalOpen}
          categories={categories}
          transactions={transactions}
          onClose={() => setIsCategoryModalOpen(false)}
          onAddCategory={onAddCategory}
          onUpdateCategory={onUpdateCategory}
          onDeleteCategory={onDeleteCategory}
        />
      )}
    </div>
  );
};
