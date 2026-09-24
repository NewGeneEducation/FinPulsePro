import React, { useState } from 'react';
import {
  Lock,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { SecuritySettings } from '../../types';
import { hashPassword, verifyPassword } from '../../utils/security';

interface SecurityLockScreenProps {
  security: SecuritySettings;
  onUnlock: () => void;
  onResetPasswordWithSecurityAnswer: (answer: string) => Promise<boolean>;
}

export const SecurityLockScreen: React.FC<SecurityLockScreenProps> = ({
  security,
  onUnlock,
  onResetPasswordWithSecurityAnswer,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Password reset flow
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetAnswer, setResetAnswer] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput) return;
    setErrorMsg(null);
    setIsVerifying(true);

    try {
      if (!security.passwordHash || !security.passwordSalt) {
        onUnlock();
        return;
      }

      const isValid = await verifyPassword(
        passwordInput,
        security.passwordHash,
        security.passwordSalt
      );

      if (isValid) {
        onUnlock();
      } else {
        setErrorMsg('Incorrect password. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Error verifying credentials');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    if (!resetAnswer.trim()) return;

    try {
      const ok = await onResetPasswordWithSecurityAnswer(resetAnswer.trim());
      if (ok) {
        setResetSuccess(true);
        setTimeout(() => {
          setShowResetModal(false);
          onUnlock();
        }, 1500);
      } else {
        setResetError('Security answer did not match. Please verify your answer.');
      }
    } catch (err) {
      setResetError('Failed to verify security answer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950 text-slate-100 overflow-hidden">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
        {/* Emblem */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <Lock size={32} />
        </div>

        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            FinPulse Pro Vault
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Protected with Client-Side 256-bit Web Crypto encryption
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 text-left">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-slate-300">
              Enter Master Passcode
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                required
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-lg font-mono text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isVerifying || !passwordInput}
            className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck size={18} />
            <span>{isVerifying ? 'Decrypting Vault...' : 'Unlock FinPulse'}</span>
          </button>
        </form>

        {/* Security Reset Link */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <KeyRound size={12} /> Local PBKDF2
          </span>
          {security.securityQuestion && (
            <button
              type="button"
              onClick={() => {
                setShowResetModal(true);
                setResetError(null);
                setResetSuccess(false);
              }}
              className="text-emerald-400 hover:underline cursor-pointer"
            >
              Forgot Passcode?
            </button>
          )}
        </div>
      </div>

      {/* Forgot Password Recovery Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <HelpCircle size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Reset Master Password</h3>
                <p className="text-[11px] text-slate-400">Answer your security challenge question</p>
              </div>
            </div>

            {resetSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center space-y-1">
                <p className="font-bold">Identity Verified!</p>
                <p>Vault unlocked and passcode cleared. You can set a new one in Pro Settings.</p>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-3.5">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                    Your Challenge Question
                  </span>
                  <p className="text-slate-200 font-semibold mt-1">
                    "{security.securityQuestion}"
                  </p>
                </div>

                {resetError && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {resetError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">Your Answer</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Enter answer provided during setup"
                    value={resetAnswer}
                    onChange={(e) => setResetAnswer(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    Verify & Unlock
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
