'use client';

import React from 'react';
import { COLS, ROWS, getComputedCellValue, formatDisplayValue } from '../../engine/formulaParser';
import { GridData } from '../../types';

interface GridTableProps {
  gridData: GridData;
  selectedCell: string;
  selectedRange: string;
  activeFilter: string;
  onCellClick: (cellId: string) => void;
  onHeaderClick: (uiType: string) => void;
  onAutoFillDown?: (sourceCellId: string) => void;
}

export const GridTable: React.FC<GridTableProps> = ({
  gridData,
  selectedCell,
  selectedRange,
  activeFilter,
  onCellClick,
  onHeaderClick,
  onAutoFillDown
}) => {
  return (
    <div className="overflow-x-auto w-full select-none">
      <table className="w-full border-collapse table-fixed min-w-[620px]">
        <thead>
          <tr>
            <th className="w-12 bg-slate-200 border border-slate-300 p-2 text-center text-xs font-bold text-slate-500">
              #
            </th>
            {COLS.map((col) => (
              <th
                key={col}
                onClick={() => onHeaderClick(`COL_${col}`)}
                className={`bg-slate-200 hover:bg-emerald-100 border border-slate-300 p-2.5 text-center font-mono font-bold text-sm cursor-pointer transition ${
                  selectedCell.startsWith(col) ? 'bg-emerald-200 text-emerald-950 font-black' : 'text-slate-700'
                }`}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((rowNum) => {
            // Cek apakah baris disembunyikan oleh Filter pada baris data 2..5
            if (activeFilter !== 'ALL' && rowNum >= 2 && rowNum <= 5) {
              const catVal = gridData[`B${rowNum}`]?.value;
              if (catVal && catVal !== activeFilter) {
                return null;
              }
            }

            return (
              <tr key={rowNum}>
                {/* Nomor Baris */}
                <td
                  onClick={() => onHeaderClick(`ROW_${rowNum}`)}
                  className={`bg-slate-200 hover:bg-emerald-100 border border-slate-300 p-2 text-center font-mono font-bold text-xs cursor-pointer ${
                    selectedCell.slice(1) === String(rowNum)
                      ? 'bg-emerald-200 text-emerald-950 font-black'
                      : 'text-slate-700'
                  }`}
                >
                  {rowNum}
                </td>

                {/* Sel-sel Kolom A-E */}
                {COLS.map((col) => {
                  const cellId = `${col}${rowNum}`;
                  const cellObj = gridData[cellId] || { value: '', style: {} };
                  const st = cellObj.style || {};
                  const isSelected = selectedCell === cellId;
                  const isInRange =
                    selectedRange === 'A1:D1' &&
                    rowNum === 1 &&
                    ['A', 'B', 'C', 'D'].includes(col);

                  const computedVal = getComputedCellValue(cellId, gridData);
                  const displayVal = formatDisplayValue(computedVal, st);
                  const isFormula = String(cellObj.value || '').startsWith('=');
                  const isError = String(displayVal).startsWith('#');

                  return (
                    <td
                      key={cellId}
                      onClick={() => onCellClick(cellId)}
                      style={{
                        backgroundColor: st.bg || '#ffffff',
                        textAlign: st.align || 'left',
                        fontWeight: st.bold ? '700' : '400',
                        fontStyle: st.italic ? 'italic' : 'normal',
                        textDecoration: st.underline ? 'underline' : 'none'
                      }}
                      className={`border border-slate-300 px-3 py-2.5 text-sm cursor-pointer transition relative h-11 ${
                        isSelected
                          ? 'ring-3 ring-emerald-600 z-10 bg-emerald-50/40 shadow-inner'
                          : isInRange
                          ? 'ring-2 ring-indigo-500 bg-indigo-50/50'
                          : 'hover:bg-slate-50'
                      } ${isError ? 'text-rose-600 font-bold' : 'text-slate-800'}`}
                    >
                      <div className="truncate">{displayVal}</div>

                      {/* Tag Rumus */}
                      {isFormula && (
                        <span
                          title={`Rumus: ${cellObj.value}`}
                          className="absolute top-0.5 right-1 text-[10px] font-mono text-emerald-700 bg-emerald-100 px-1 rounded pointer-events-none"
                        >
                          fx
                        </span>
                      )}

                      {/* Kotak AutoFill Handle ala Excel (Sudut Kanan Bawah) */}
                      {isSelected && onAutoFillDown && rowNum < 10 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAutoFillDown(cellId);
                          }}
                          title="Tarik ke bawah untuk AutoFill / Duplikasi rumus relatif"
                          className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-600 border border-white hover:scale-130 transition rounded-sm z-20 cursor-crosshair shadow"
                        />
                      )}
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
};
