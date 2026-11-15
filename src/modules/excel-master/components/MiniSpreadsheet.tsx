'use client';

import React from 'react';
import { MiniTableData } from '../types';

interface MiniSpreadsheetProps {
  data: MiniTableData;
  className?: string;
}

export default function MiniSpreadsheet({ data, className = '' }: MiniSpreadsheetProps) {
  if (!data || !data.headers || data.headers.length === 0) return null;

  const colLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].slice(0, data.headers.length);

  return (
    <div className={`overflow-x-auto rounded-xl border-2 border-emerald-500/40 bg-slate-950/90 shadow-xl p-2 sm:p-3 ${className}`}>
      {/* Header Spreadsheet Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-500/20 text-xs font-mono text-emerald-400">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold">EXCEL SPREADSHEET PREVIEW</span>
        </div>
        <span className="text-[10px] text-slate-400">Sheet1</span>
      </div>

      <table className="w-full text-xs font-mono border-collapse">
        <thead>
          {/* Kolom Indeks Huruf A, B, C... */}
          <tr className="bg-slate-800/80 text-slate-300">
            <th className="w-8 py-1 px-1.5 border border-slate-700 text-center font-bold text-slate-400 bg-slate-900">
              #
            </th>
            {colLetters.map((col, idx) => (
              <th key={idx} className="py-1 px-2 border border-slate-700 text-center font-bold text-emerald-300">
                {col}
              </th>
            ))}
          </tr>
          {/* Kolom Header Label Data */}
          <tr className="bg-emerald-950/60 text-emerald-200">
            <th className="py-1 px-1.5 border border-slate-700 text-center font-bold text-slate-500 bg-slate-900">
              1
            </th>
            {data.headers.map((header, idx) => (
              <th key={idx} className="py-1.5 px-3 border border-slate-700 text-left font-bold text-emerald-100">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, rIdx) => {
            const rowNumber = rIdx + 2; // Baris data mulai dari 2
            return (
              <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-slate-900/60 hover:bg-slate-800/50' : 'bg-slate-950/60 hover:bg-slate-800/50'}>
                {/* Nomor Baris 2, 3, 4... */}
                <td className="py-1 px-1.5 border border-slate-700 text-center font-bold text-slate-500 bg-slate-900">
                  {rowNumber}
                </td>
                {/* Nilai Sel */}
                {row.map((cellValue, cIdx) => {
                  const isFormula = String(cellValue).startsWith('=');
                  const isNumber = typeof cellValue === 'number' || (!isNaN(Number(cellValue)) && String(cellValue).trim() !== '' && !isFormula);
                  const isHighlight = data.highlightCell && data.highlightCell === `${colLetters[cIdx]}${rowNumber}`;

                  return (
                    <td
                      key={cIdx}
                      className={`py-1.5 px-3 border border-slate-700 transition-colors ${
                        isNumber ? 'text-right text-cyan-300 font-semibold' : 'text-left text-slate-200'
                      } ${isFormula ? 'text-amber-300 font-bold bg-amber-950/20' : ''} ${
                        isHighlight ? 'bg-emerald-500/30 text-white font-black ring-2 ring-emerald-400' : ''
                      }`}
                    >
                      {String(cellValue)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
