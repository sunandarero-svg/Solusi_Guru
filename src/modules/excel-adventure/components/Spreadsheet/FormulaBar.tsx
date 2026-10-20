'use client';

import React from 'react';
import { Check, ArrowDownToLine } from 'lucide-react';

interface FormulaBarProps {
  selectedCell: string;
  selectedRange: string;
  formulaInput: string;
  setFormulaInput: React.Dispatch<React.SetStateAction<string>>;
  onCommit: (e?: React.FormEvent) => void;
  onSnippetClick: (snippet: string) => void;
  onNameBoxClick: () => void;
  onFormulaBarFocus: () => void;
  onAutoFillDown?: () => void;
}

const SNIPPETS = [
  '=',
  '=SUM(',
  '=AVERAGE(',
  '=MAX(',
  '=MIN(',
  '=COUNT(',
  '=COUNTA(',
  '=IF(',
  '=COUNTIF(',
  '=SUMIF(',
  '=VLOOKUP('
];

export const FormulaBar: React.FC<FormulaBarProps> = ({
  selectedCell,
  selectedRange,
  formulaInput,
  setFormulaInput,
  onCommit,
  onSnippetClick,
  onNameBoxClick,
  onFormulaBarFocus,
  onAutoFillDown
}) => {
  return (
    <form
      onSubmit={onCommit}
      className="bg-slate-50 border-b border-slate-300 p-2 flex flex-wrap sm:flex-nowrap items-center gap-2"
    >
      {/* Name Box */}
      <div
        onClick={onNameBoxClick}
        title="Name Box: Menampilkan alamat sel atau rentang aktif"
        className="w-20 sm:w-28 min-h-[44px] bg-white border-2 border-slate-300 rounded-lg px-2.5 sm:px-3 flex items-center justify-between font-mono font-bold text-slate-800 cursor-pointer hover:border-emerald-500 shrink-0 shadow-sm"
      >
        <span className="text-sm font-black text-emerald-800">{selectedRange || selectedCell}</span>
        <span className="text-[10px] text-slate-400 font-sans">SEL</span>
      </div>

      {/* Tombol Sisipkan Rumus Cepat (Membantu layar sentuh HP, IFP & Tablet) */}
      <div className="flex-1 sm:flex-initial flex items-center gap-1 overflow-x-auto py-1 touch-pan-x no-scrollbar shrink-0 max-w-full">
        {SNIPPETS.map((snippet) => (
          <button
            key={snippet}
            type="button"
            onClick={() => onSnippetClick(snippet)}
            className="px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 border border-emerald-300 rounded-lg font-mono text-xs font-bold shrink-0 transition"
          >
            {snippet}
          </button>
        ))}
      </div>

      {/* Input Formula Bar */}
      <div
        onClick={onFormulaBarFocus}
        className="w-full sm:flex-1 flex items-center bg-white border-2 border-emerald-500 rounded-lg overflow-hidden min-h-[44px] shadow-inner"
      >
        <span className="px-3 py-2 bg-emerald-50 text-emerald-700 font-serif italic font-bold border-r border-emerald-200 select-none shrink-0">
          fx
        </span>
        <input
          id="formula-bar-input"
          type="text"
          value={formulaInput}
          onFocus={onFormulaBarFocus}
          onChange={(e) => setFormulaInput(e.target.value)}
          placeholder="Ketik nilai atau rumus (contoh: =B2*C2) di sini..."
          className="formula-bar-input w-full px-3 py-2 bg-white text-slate-900 font-mono text-base sm:text-sm focus:outline-none"
          style={{
            color: '#0f172a',
            WebkitTextFillColor: '#0f172a',
            backgroundColor: '#ffffff',
            caretColor: '#059669'
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          inputMode="text"
        />
      </div>

      <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end sm:justify-start">
        <button
          type="submit"
          className="flex-1 sm:flex-initial min-h-[44px] px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition"
        >
          <Check className="w-4 h-4" /> Simpan Sel
        </button>

        {onAutoFillDown && (
          <button
            type="button"
            onClick={onAutoFillDown}
            title="AutoFill: Tarik rumus sel ini ke baris berikutnya"
            className="min-h-[44px] px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-emerald-400 font-bold rounded-lg flex items-center gap-1 text-xs shadow-sm transition"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span className="hidden md:inline">AutoFill Bawah</span>
          </button>
        )}
      </div>
    </form>
  );
};
