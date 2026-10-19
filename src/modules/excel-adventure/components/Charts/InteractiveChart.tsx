'use client';

import React from 'react';
import { GridData } from '../../types';
import { expandRange, getComputedCellValue } from '../../engine/formulaParser';

interface InteractiveChartProps {
  type: 'bar' | 'line' | 'pie';
  title: string;
  labelRange: string;
  valueRange: string;
  gridData: GridData;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  type,
  title,
  labelRange,
  valueRange,
  gridData
}) => {
  const labelCells = expandRange(labelRange);
  const valueCells = expandRange(valueRange);

  const items = labelCells.map((lblCell, idx) => {
    const valCell = valueCells[idx] || valueCells[valueCells.length - 1];
    const rawLabel = String(getComputedCellValue(lblCell, gridData) || lblCell);
    const rawVal = Number(getComputedCellValue(valCell, gridData) || 0);
    return {
      label: rawLabel,
      value: isNaN(rawVal) ? 0 : rawVal
    };
  });

  const maxValue = Math.max(...items.map((i) => i.value), 10);
  const totalValue = items.reduce((acc, curr) => acc + curr.value, 0) || 1;

  const colors = [
    '#10b981', // emerald
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#f59e0b', // amber
    '#14b8a6'  // teal
  ];

  return (
    <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-6 text-white shadow-xl">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <h4 className="font-black text-sm sm:text-base text-emerald-300 flex items-center gap-2">
          <span>📊</span>
          <span>{title || 'Visualisasi Grafik Lembar Kerja'}</span>
        </h4>
        <span className="text-[11px] font-mono bg-slate-800 px-2.5 py-1 rounded-md text-slate-400">
          Tipe: {type.toUpperCase()} | Rentang: {labelRange} vs {valueRange}
        </span>
      </div>

      {/* 1. DIAGRAM BATANG (BAR CHART) */}
      {type === 'bar' && (
        <div className="space-y-3">
          <div className="h-56 sm:h-64 flex items-end justify-around gap-2 sm:gap-4 pt-6 pb-2 border-b border-slate-700 px-2">
            {items.map((item, idx) => {
              const heightPct = Math.max(8, Math.round((item.value / maxValue) * 100));
              const color = colors[idx % colors.length];

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <span className="text-xs font-bold text-slate-200 mb-1 opacity-90 group-hover:scale-110 transition">
                    {item.value}
                  </span>
                  <div
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: color
                    }}
                    className="w-full max-w-[48px] rounded-t-lg transition-all duration-500 shadow-md group-hover:brightness-110"
                  />
                  <span className="text-[11px] text-slate-400 mt-2 truncate max-w-[70px] text-center">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. DIAGRAM GARIS (LINE CHART) */}
      {type === 'line' && (
        <div className="py-2">
          <div className="h-56 sm:h-64 relative flex items-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 180" preserveAspectRatio="none">
              {/* Garis Grid Horizontal */}
              <line x1="0" y1="40" x2="400" y2="40" stroke="#334155" strokeDasharray="3 3" />
              <line x1="0" y1="90" x2="400" y2="90" stroke="#334155" strokeDasharray="3 3" />
              <line x1="0" y1="140" x2="400" y2="140" stroke="#334155" strokeDasharray="3 3" />

              {/* Garis Tren */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={items
                  .map((item, idx) => {
                    const x = (idx / Math.max(1, items.length - 1)) * 360 + 20;
                    const y = 160 - (item.value / maxValue) * 130;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* Titik Data Poin */}
              {items.map((item, idx) => {
                const x = (idx / Math.max(1, items.length - 1)) * 360 + 20;
                const y = 160 - (item.value / maxValue) * 130;
                return (
                  <g key={idx}>
                    <circle cx={x} cy={y} r="5" fill="#34d399" stroke="#064e3b" strokeWidth="2" />
                    <text x={x} y={y - 10} fill="#f1f5f9" fontSize="10" fontWeight="bold" textAnchor="middle">
                      {item.value}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="flex justify-around mt-3 border-t border-slate-800 pt-2 text-[11px] text-slate-400">
            {items.map((item, idx) => (
              <span key={idx} className="truncate max-w-[70px] text-center">
                {item.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 3. DIAGRAM LINGKARAN (PIE CHART) */}
      {type === 'pie' && (
        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
          {/* Donut SVG */}
          <div className="relative w-44 h-44 shrink-0">
            <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90">
              {(() => {
                let accumulatedPercent = 0;
                return items.map((item, idx) => {
                  const pct = Math.round((item.value / totalValue) * 100);
                  const strokeDasharray = `${pct} ${100 - pct}`;
                  const strokeDashoffset = -accumulatedPercent;
                  accumulatedPercent += pct;
                  const color = colors[idx % colors.length];

                  return (
                    <circle
                      key={idx}
                      cx="21"
                      cy="21"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke={color}
                      strokeWidth="6"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="hover:opacity-80 transition cursor-pointer"
                    />
                  );
                });
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total</span>
              <span className="text-sm font-black text-white">{totalValue}</span>
            </div>
          </div>

          {/* Legenda */}
          <div className="grid grid-cols-1 gap-2 w-full max-w-xs text-xs">
            {items.map((item, idx) => {
              const pct = Math.round((item.value / totalValue) * 100);
              const color = colors[idx % colors.length];

              return (
                <div key={idx} className="flex items-center justify-between bg-slate-800/60 p-2 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-slate-200 font-medium truncate max-w-[120px]">{item.label}</span>
                  </div>
                  <div className="font-bold font-mono">
                    <span className="text-white">{item.value}</span>
                    <span className="text-emerald-400 ml-1">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
