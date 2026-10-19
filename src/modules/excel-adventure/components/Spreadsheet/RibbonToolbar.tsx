'use client';

import React from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  DollarSign,
  Percent,
  Grid,
  ArrowUpDown,
  Filter,
  BarChart2,
  FileSpreadsheet,
  Sparkles,
  RotateCcw,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { CellStyle } from '../../types';

interface RibbonToolbarProps {
  activeStyle: CellStyle;
  currentLevelId: number;
  activeFilter: string;
  isTeacherDemo?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onToggleStyle: (key: keyof CellStyle, val?: any) => void;
  onSelectRangeHelper: () => void;
  onSortTable: (col: string, dir: 'ASC' | 'DESC') => void;
  onFilterTable: (category: string) => void;
  onOpenChartModal: () => void;
  onOpenExportModal: () => void;
  onOpenTutorModal: () => void;
  onResetGrid: () => void;
  onRibbonClick: () => void;
}

export const RibbonToolbar: React.FC<RibbonToolbarProps> = ({
  activeStyle,
  currentLevelId,
  activeFilter,
  isTeacherDemo,
  isFullscreen,
  onToggleFullscreen,
  onToggleStyle,
  onSelectRangeHelper,
  onSortTable,
  onFilterTable,
  onOpenChartModal,
  onOpenExportModal,
  onOpenTutorModal,
  onResetGrid,
  onRibbonClick
}) => {
  return (
    <div
      onClick={onRibbonClick}
      className="bg-slate-100 border-b border-slate-300 p-2 flex flex-wrap items-center gap-1.5 sm:gap-2 select-none"
    >
      {/* 1. Font Style */}
      <div className="flex items-center bg-white rounded-lg border border-slate-300 p-1 shadow-sm">
        <button
          type="button"
          onClick={() => onToggleStyle('bold')}
          title="Tebal (Bold)"
          className={`min-w-[42px] min-h-[42px] px-2.5 rounded flex items-center justify-center font-bold transition ${
            activeStyle.bold ? 'bg-emerald-600 text-white' : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onToggleStyle('italic')}
          title="Miring (Italic)"
          className={`min-w-[42px] min-h-[42px] px-2.5 rounded flex items-center justify-center transition ${
            activeStyle.italic ? 'bg-emerald-600 text-white' : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onToggleStyle('underline')}
          title="Garis Bawah (Underline)"
          className={`min-w-[42px] min-h-[42px] px-2.5 rounded flex items-center justify-center transition ${
            activeStyle.underline ? 'bg-emerald-600 text-white' : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <Underline className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Alignment */}
      <div className="flex items-center bg-white rounded-lg border border-slate-300 p-1 shadow-sm">
        <button
          type="button"
          onClick={() => onToggleStyle('align', 'left')}
          title="Rata Kiri"
          className={`min-w-[42px] min-h-[42px] px-2.5 rounded flex items-center justify-center transition ${
            activeStyle.align === 'left' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onToggleStyle('align', 'center')}
          title="Rata Tengah"
          className={`min-w-[42px] min-h-[42px] px-2.5 rounded flex items-center justify-center transition ${
            activeStyle.align === 'center' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onToggleStyle('align', 'right')}
          title="Rata Kanan"
          className={`min-w-[42px] min-h-[42px] px-2.5 rounded flex items-center justify-center transition ${
            activeStyle.align === 'right' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <AlignRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Format Angka & Warna Latar */}
      <div className="flex items-center bg-white rounded-lg border border-slate-300 p-1 shadow-sm gap-1">
        <button
          type="button"
          onClick={() =>
            onToggleStyle('format', activeStyle.format === 'currency' ? 'number' : 'currency')
          }
          className={`min-h-[42px] px-3 rounded font-bold text-xs flex items-center gap-1 transition ${
            activeStyle.format === 'currency'
              ? 'bg-emerald-600 text-white'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Format Rp
        </button>
        <button
          type="button"
          onClick={() =>
            onToggleStyle('format', activeStyle.format === 'percent' ? 'number' : 'percent')
          }
          title="Format Persen (%)"
          className={`min-h-[42px] px-2.5 rounded font-bold text-xs flex items-center justify-center transition ${
            activeStyle.format === 'percent'
              ? 'bg-emerald-600 text-white'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <Percent className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onToggleStyle('bg', '#fef08a')}
          title="Warna Latar Kuning"
          className="w-9 h-9 rounded bg-yellow-200 border border-yellow-400 hover:scale-105 transition"
        />
        <button
          type="button"
          onClick={() => onToggleStyle('bg', '#bbf7d0')}
          title="Warna Latar Hijau"
          className="w-9 h-9 rounded bg-green-200 border border-green-400 hover:scale-105 transition"
        />
        <button
          type="button"
          onClick={() => onToggleStyle('bg', '#bfdbfe')}
          title="Warna Latar Biru"
          className="w-9 h-9 rounded bg-blue-200 border border-blue-400 hover:scale-105 transition"
        />
      </div>

      {/* 4. Fitur Baru: Buat Grafik, Ekspor Excel, Tutor AI, Fullscreen Lanskap */}
      <div className="flex flex-wrap items-center gap-1.5 ml-auto">
        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className={`min-h-[42px] px-3.5 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm transition border ${
              isFullscreen
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-400/40'
            }`}
            title={
              isFullscreen
                ? 'Keluar dari Layar Penuh (ESC)'
                : 'Layar Penuh Lanskap (Kunci Layar Sentuh SmartBoard / IFP & Tablet)'
            }
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {isFullscreen ? 'Keluar Fullscreen' : 'Lanskap Fullscreen'}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenChartModal}
          className="min-h-[42px] px-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm"
        >
          <BarChart2 className="w-4 h-4" /> 📊 Buat Grafik
        </button>

        <button
          type="button"
          onClick={onOpenExportModal}
          className="min-h-[42px] px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4" /> File .XLSX
        </button>

        <button
          type="button"
          onClick={onOpenTutorModal}
          className="min-h-[42px] px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-amber-300" /> Tutor AI
        </button>

        {/* Alat Bantu Rentang, Sort & Filter */}
        {(currentLevelId === 2 || isTeacherDemo) && (
          <button
            type="button"
            onClick={onSelectRangeHelper}
            className="min-h-[42px] px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Grid className="w-4 h-4" /> Pilih Rentang A1:D1
          </button>
        )}

        {(currentLevelId === 7 || currentLevelId === 8 || isTeacherDemo) && (
          <>
            <button
              type="button"
              onClick={() => onSortTable('C', 'DESC')}
              className="min-h-[42px] px-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
            >
              <ArrowUpDown className="w-4 h-4" /> Sort Skor (9→0)
            </button>
            <button
              type="button"
              onClick={() => onSortTable('A', 'ASC')}
              className="min-h-[42px] px-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
            >
              <ArrowUpDown className="w-4 h-4" /> Sort Nama (A→Z)
            </button>
            <div className="flex items-center bg-white border border-slate-300 rounded-lg p-1 gap-1">
              <Filter className="w-4 h-4 text-slate-500 ml-1" />
              {['ALL', 'Robotik', 'Futsal'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onFilterTable(cat)}
                  className={`px-2.5 py-1.5 rounded text-xs font-bold transition ${
                    activeFilter === cat
                      ? 'bg-indigo-600 text-white'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {cat === 'ALL' ? 'Semua' : cat}
                </button>
              ))}
            </div>
          </>
        )}

        <button
          type="button"
          onClick={onResetGrid}
          className="min-h-[42px] px-3 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 rounded-lg text-xs font-bold flex items-center gap-1"
        >
          <RotateCcw className="w-4 h-4" /> Reset Tabel
        </button>
      </div>
    </div>
  );
};
