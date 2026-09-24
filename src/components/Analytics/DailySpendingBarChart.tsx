import React, { useState } from 'react';
import { CurrencyCode } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface DaySpend {
  date: string;
  label: string;
  expense: number;
  income: number;
}

interface DailySpendingBarChartProps {
  data: DaySpend[];
  currency: CurrencyCode;
  customRates?: Record<string, number>;
}

export const DailySpendingBarChart: React.FC<DailySpendingBarChartProps> = ({
  data,
  currency,
  customRates,
}) => {
  const [activeDay, setActiveDay] = useState<DaySpend | null>(null);

  const maxExpense = Math.max(...data.map((d) => d.expense), 50);
  const totalExpense = data.reduce((sum, d) => sum + d.expense, 0);
  const avgExpense = totalExpense / (data.length || 1);

  return (
    <div className="w-full space-y-3">
      {/* Active tooltip header */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">14-Day Velocity</span>
          <span className="text-slate-500 font-mono text-[11px]">
            Avg {formatCurrency(avgExpense, currency, customRates)}/day
          </span>
        </div>
        {activeDay ? (
          <div className="text-right">
            <span className="text-slate-400 mr-2">{activeDay.label}:</span>
            <span className="font-semibold text-emerald-400 font-mono tabular-nums">
              {formatCurrency(activeDay.expense, currency, customRates)}
            </span>
          </div>
        ) : (
          <span className="text-slate-500 text-[11px]">Hover or tap bars for details</span>
        )}
      </div>

      {/* SVG Bar Chart */}
      <div className="h-36 w-full flex items-end gap-1.5 pt-4 pb-1">
        {data.map((day) => {
          const heightPercent = Math.min(100, Math.max(6, (day.expense / maxExpense) * 100));
          const isSelected = activeDay?.date === day.date;
          const isAboveAvg = day.expense > avgExpense * 1.3;

          return (
            <div
              key={day.date}
              className="flex-1 h-full flex flex-col items-center justify-end group cursor-pointer relative"
              onMouseEnter={() => setActiveDay(day)}
              onMouseLeave={() => setActiveDay(null)}
              onClick={() => setActiveDay(activeDay?.date === day.date ? null : day)}
            >
              {/* Bar */}
              <div className="w-full max-w-[20px] flex flex-col justify-end h-full">
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t-md transition-all duration-200 ${
                    isSelected
                      ? 'bg-emerald-400 shadow-lg shadow-emerald-500/20'
                      : isAboveAvg
                      ? 'bg-amber-400/80 group-hover:bg-amber-300'
                      : day.expense > 0
                      ? 'bg-blue-500/70 group-hover:bg-blue-400'
                      : 'bg-slate-800'
                  }`}
                />
              </div>

              {/* Day label */}
              <span className="mt-1 text-[9px] font-mono text-slate-400 truncate w-full text-center">
                {day.label.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
