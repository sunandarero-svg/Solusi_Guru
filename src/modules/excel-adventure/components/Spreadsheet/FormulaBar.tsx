'use client';

import React from 'react';
import { Check, ArrowDownToLine, Sparkles, X } from 'lucide-react';

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
      id="formula-bar-container"
      onSubmit={onCommit}
      className="bg-slate-50 border-b-2 border-slate-300 p-2 sm:p-2.5 flex flex-col gap-2 select-none shadow-xs"
    >
      {/* BARIS UTAMA: Name Box + Formula Bar Input + Tombol Aksi */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full">
        {/* Name Box */}
        <div
          onClick={onNameBoxClick}
          title="Name Box: Menampilkan alamat sel atau rentang aktif (Klik untuk melihat)"
          className="h-11 min-w-[90px] sm:w-28 bg-white border-2 border-slate-300 rounded-xl px-2.5 sm:px-3 flex items-center justify-between font-mono font-bold text-slate-800 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 shrink-0 shadow-sm transition"
        >
          <span className="text-sm font-black text-emerald-800 tracking-tight">
            {selectedRange || selectedCell}
          </span>
          <span className="text-[10px] text-slate-400 font-sans font-bold">SEL</span>
        </div>

        {/* Input Formula Bar Utama */}
        <div
          onClick={onFormulaBarFocus}
          className="flex-1 min-w-[200px] flex items-center bg-white border-2 border-emerald-500 hover:border-emerald-600 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl overflow-hidden h-11 shadow-inner transition"
        >
          <button
            type="button"
            onClick={onFormulaBarFocus}
            title="Formula Bar (fx): Tempat melihat dan mengetik isi rumus/nilai sel"
            className="h-full px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-serif italic font-bold border-r border-emerald-200 select-none flex items-center gap-1.5 shrink-0 transition"
          >
            <span className="text-base font-black text-emerald-700">fx</span>
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-emerald-800 hidden md:inline">
              Formula Bar
            </span>
          </button>

          <input
            id="formula-bar-input"
            type="text"
            value={formulaInput}
            onFocus={onFormulaBarFocus}
            onChange={(e) => setFormulaInput(e.target.value)}
            placeholder="Ketik nilai atau rumus (contoh: =B2*C2) di sini..."
            className="formula-bar-input flex-1 w-full h-full px-3 bg-white text-slate-900 font-mono text-base sm:text-sm font-semibold focus:outline-none"
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

          {formulaInput && (
            <button
              type="button"
              onClick={() => setFormulaInput('')}
              title="Hapus isian input"
              className="p-1.5 text-slate-400 hover:text-rose-600 mr-1.5 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tombol Simpan & AutoFill */}
        <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end sm:justify-start">
          <button
            type="submit"
            className="flex-1 sm:flex-initial h-11 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 text-xs sm:text-sm shadow-sm transition active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[3]" /> Simpan Sel
          </button>

          {onAutoFillDown && (
            <button
              type="button"
              onClick={onAutoFillDown}
              title="AutoFill: Tarik rumus sel ini ke baris berikutnya"
              className="h-11 px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-emerald-400 font-bold rounded-xl flex items-center gap-1.5 text-xs shadow-sm transition active:scale-95"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span className="hidden lg:inline">AutoFill Bawah</span>
            </button>
          )}
        </div>
      </div>

      {/* BARIS DUA: Bilah Sisipkan Rumus Cepat (Membantu Layar Sentuh HP, IFP & Tablet) */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 touch-pan-x bg-emerald-50/60 border border-emerald-200/80 rounded-xl no-scrollbar">
        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-900 uppercase tracking-wider px-2 py-1 bg-emerald-200/80 rounded-lg shrink-0 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          <span>Rumus Cepat:</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {SNIPPETS.map((snippet) => (
            <button
              key={snippet}
              type="button"
              onClick={() => onSnippetClick(snippet)}
              className="px-2.5 py-1 bg-white hover:bg-emerald-100 active:bg-emerald-200 text-emerald-900 border border-emerald-300/80 rounded-lg font-mono text-xs font-bold shrink-0 shadow-2xs transition active:scale-95"
            >
              {snippet}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
};
