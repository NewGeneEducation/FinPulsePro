import React, { useState } from 'react';
import { CurrencyCode } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { CategoryIcon } from '../Common/CategoryIcon';

interface CategorySpendItem {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
}

interface CategoryDonutChartProps {
  data: CategorySpendItem[];
  currency: CurrencyCode;
  customRates?: Record<string, number>;
  totalExpense: number;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  data,
  currency,
  customRates,
  totalExpense,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0 || totalExpense === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <p className="text-sm">No expenses recorded for this period yet</p>
      </div>
    );
  }

  const size = 220;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate segment offsets
  let accumulatedPercent = 0;
  const segments = data.map((item, index) => {
    const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += item.percentage / 100;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
      index,
    };
  });

  const activeItem = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
      {/* SVG Donut Circle */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            className="text-slate-800/60"
            strokeWidth={strokeWidth}
          />
          {/* Segments */}
          {segments.map((seg) => (
            <circle
              key={seg.categoryId}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth={hoveredIndex === seg.index ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-200 cursor-pointer origin-center"
              onMouseEnter={() => setHoveredIndex(seg.index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() =>
                setHoveredIndex(hoveredIndex === seg.index ? null : seg.index)
              }
            />
          ))}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          {activeItem ? (
            <>
              <span className="text-xs font-medium text-slate-400 truncate max-w-[120px]">
                {activeItem.name}
              </span>
              <span className="text-lg font-bold text-white tabular-nums tracking-tight">
                {formatCurrency(activeItem.amount, currency, customRates)}
              </span>
              <span className="text-[11px] font-mono text-emerald-400">
                {activeItem.percentage.toFixed(1)}%
              </span>
            </>
          ) : (
            <>
              <span className="text-xs font-medium text-slate-400">Total Spent</span>
              <span className="text-xl font-bold text-white tabular-nums tracking-tight">
                {formatCurrency(totalExpense, currency, customRates)}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {data.length} categories
              </span>
            </>
          )}
        </div>
      </div>

      {/* Category Legend */}
      <div className="w-full flex-1 space-y-2">
        {data.slice(0, 5).map((item, index) => {
          const isSelected = hoveredIndex === index;
          return (
            <button
              key={item.categoryId}
              type="button"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => setHoveredIndex(hoveredIndex === index ? null : index)}
              className={`w-full flex items-center justify-between p-2 rounded-xl transition-all duration-150 text-left ${
                isSelected
                  ? 'bg-slate-800/80 ring-1 ring-slate-700'
                  : 'hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${item.color}20`, color: item.color }}
                >
                  <CategoryIcon name={item.icon} size={14} />
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-200 truncate">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {item.percentage.toFixed(1)}% of total
                  </p>
                </div>
              </div>
              <div className="text-right pl-2">
                <span className="text-xs font-semibold text-white font-mono tabular-nums">
                  {formatCurrency(item.amount, currency, customRates)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
