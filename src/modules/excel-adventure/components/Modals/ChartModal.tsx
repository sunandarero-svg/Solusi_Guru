'use client';

import React, { useState } from 'react';
import { X, BarChart2, PieChart, TrendingUp, Check } from 'lucide-react';
import { GridData, ChartConfig } from '../../types';
import { InteractiveChart } from '../Charts/InteractiveChart';

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  gridData: GridData;
  onApplyChart: (config: ChartConfig) => void;
}

export const ChartModal: React.FC<ChartModalProps> = ({
  isOpen,
  onClose,
  gridData,
  onApplyChart
}) => {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [chartTitle, setChartTitle] = useState('Diagram Nilai Siswa');
  const [labelRange, setLabelRange] = useState('A2:A6');
  const [valueRange, setValueRange] = useState('B2:B6');

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyChart({
      type: chartType,
      title: chartTitle,
      labelRange,
      valueRange
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl my-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <BarChart2 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-xl font-black text-white">Buat Grafik Baru</h3>
              <p className="text-xs text-slate-400">Pilih jenis visualisasi dan tentukan rentang data tabel</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pemilih Jenis Grafik */}
        <div className="space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Pilih Jenis Diagram
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { type: 'bar' as const, label: 'Diagram Batang', icon: BarChart2, desc: 'Perbandingan data' },
              { type: 'line' as const, label: 'Diagram Garis', icon: TrendingUp, desc: 'Tren waktu' },
              { type: 'pie' as const, label: 'Diagram Lingkaran', icon: PieChart, desc: 'Proporsi total' }
            ].map((c) => {
              const Icon = c.icon;
              const isSelected = chartType === c.type;
              return (
                <button
                  key={c.type}
                  type="button"
                  onClick={() => setChartType(c.type)}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center text-center transition ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-400 text-white scale-102 shadow-lg'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <Icon className={`w-7 h-7 mb-2 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-white">{c.label}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{c.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Konfigurasi Rentang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Judul Grafik
              </label>
              <input
                type="text"
                value={chartTitle}
                onChange={(e) => setChartTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Rentang Nilai Angka (Y-Axis)
              </label>
              <input
                type="text"
                value={valueRange}
                onChange={(e) => setValueRange(e.target.value.toUpperCase())}
                placeholder="Misal: B2:B6"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Rentang Label Kategori / Nama (X-Axis)
              </label>
              <input
                type="text"
                value={labelRange}
                onChange={(e) => setLabelRange(e.target.value.toUpperCase())}
                placeholder="Misal: A2:A6"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm focus:border-emerald-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Pratinjau Live */}
          <div className="pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300 mb-2">
              Pratinjau Grafik
            </label>
            <InteractiveChart
              type={chartType}
              title={chartTitle}
              labelRange={labelRange}
              valueRange={valueRange}
              gridData={gridData}
            />
          </div>

          {/* Tombol Aksi */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center gap-1.5 shadow-lg"
            >
              <Check className="w-4 h-4" /> Pasang Grafik
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
