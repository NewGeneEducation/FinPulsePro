import { CurrencyCode, CurrencyInfo } from '../types';

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    rateToUSD: 84.1,
    symbolBefore: true,
    decimalDigits: 2,
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    rateToUSD: 1.0,
    symbolBefore: true,
    decimalDigits: 2,
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    rateToUSD: 0.92,
    symbolBefore: false,
    decimalDigits: 2,
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    rateToUSD: 0.79,
    symbolBefore: true,
    decimalDigits: 2,
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    rateToUSD: 153.5,
    symbolBefore: true,
    decimalDigits: 0,
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'CA$',
    rateToUSD: 1.38,
    symbolBefore: true,
    decimalDigits: 2,
  },
  AUD: {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    rateToUSD: 1.52,
    symbolBefore: true,
    decimalDigits: 2,
  },
  CHF: {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF',
    rateToUSD: 0.88,
    symbolBefore: true,
    decimalDigits: 2,
  },
  SGD: {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    rateToUSD: 1.34,
    symbolBefore: true,
    decimalDigits: 2,
  },
  AED: {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    rateToUSD: 3.67,
    symbolBefore: false,
    decimalDigits: 2,
  },
  CNY: {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    rateToUSD: 7.24,
    symbolBefore: true,
    decimalDigits: 2,
  },
  BRL: {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$',
    rateToUSD: 5.75,
    symbolBefore: true,
    decimalDigits: 2,
  },
};

/**
 * Convert an amount from one currency to another using exchange rates
 */
export function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  customRates?: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;
  const fromRate = customRates?.[fromCurrency] ?? CURRENCIES[fromCurrency]?.rateToUSD ?? 1;
  const toRate = customRates?.[toCurrency] ?? CURRENCIES[toCurrency]?.rateToUSD ?? 1;
  if (fromRate === 0) return amount;
  // Convert from currency -> USD -> to currency
  const inUSD = amount / fromRate;
  return inUSD * toRate;
}

/**
 * Convert an amount from base currency to target currency,
 * taking into account any custom rates overridden by user.
 */
export function convertAmount(
  amount: number,
  targetCurrency: CurrencyCode = 'INR',
  baseCurrency: CurrencyCode = 'INR',
  customRates?: Record<string, number>
): number {
  return convertCurrency(amount, baseCurrency, targetCurrency, customRates);
}

/**
 * Convert an amount from source currency back to base USD
 */
export function convertToUSD(
  amount: number,
  sourceCurrency: CurrencyCode = 'INR',
  customRates?: Record<string, number>
): number {
  return convertCurrency(amount, sourceCurrency, 'USD', customRates);
}

/**
 * Format a numeric amount in a specified currency with proper symbols and commas
 */
export function formatCurrency(
  amount: number,
  targetCurrency: CurrencyCode = 'INR',
  customRates?: Record<string, number>,
  options?: { compact?: boolean; hideSymbol?: boolean; baseCurrency?: CurrencyCode }
): string {
  // If baseCurrency matches targetCurrency (the standard ledger view), no conversion is applied.
  const base = options?.baseCurrency ?? targetCurrency;
  const converted = base === targetCurrency
    ? amount
    : convertCurrency(amount, base, targetCurrency, customRates);
  const info = CURRENCIES[targetCurrency] || CURRENCIES.INR;

  const isINR = targetCurrency === 'INR';
  const locale = isINR ? 'en-IN' : undefined;

  // Indian Rupee compact notation (Cr / L)
  if (options?.compact && Math.abs(converted) >= 10000000 && isINR) {
    const compactVal = (converted / 10000000).toFixed(2) + ' Cr';
    if (options.hideSymbol) return compactVal;
    return info.symbolBefore ? `${info.symbol}${compactVal}` : `${compactVal} ${info.symbol}`;
  }

  if (options?.compact && Math.abs(converted) >= 100000 && isINR) {
    const compactVal = (converted / 100000).toFixed(2) + ' L';
    if (options.hideSymbol) return compactVal;
    return info.symbolBefore ? `${info.symbol}${compactVal}` : `${compactVal} ${info.symbol}`;
  }

  // Western compact notation
  if (options?.compact && Math.abs(converted) >= 1000000 && !isINR) {
    const compactVal = (converted / 1000000).toFixed(1) + 'M';
    if (options.hideSymbol) return compactVal;
    return info.symbolBefore ? `${info.symbol}${compactVal}` : `${compactVal} ${info.symbol}`;
  }

  if (options?.compact && Math.abs(converted) >= 10000) {
    const compactVal = (converted / 1000).toFixed(1) + 'k';
    if (options.hideSymbol) return compactVal;
    return info.symbolBefore ? `${info.symbol}${compactVal}` : `${compactVal} ${info.symbol}`;
  }

  const formattedNum = converted.toLocaleString(locale, {
    minimumFractionDigits: info.decimalDigits,
    maximumFractionDigits: info.decimalDigits,
  });

  if (options?.hideSymbol) return formattedNum;

  return info.symbolBefore
    ? `${info.symbol}${formattedNum}`
    : `${formattedNum} ${info.symbol}`;
}

/**
 * Calculate round-up amount given a transaction amount and rule (1, 5, 10)
 */
export function calculateRoundUp(amount: number, rule: 1 | 5 | 10 = 10): number {
  if (amount <= 0) return 0;
  const target = Math.ceil(amount / rule) * rule;
  const diff = Number((target - amount).toFixed(2));
  return diff > 0 ? diff : 0;
}
