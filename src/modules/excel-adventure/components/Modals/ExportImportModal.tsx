'use client';

import React, { useRef, useState } from 'react';
import { X, Download, Upload, Printer, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { GridData } from '../../types';
import { exportGridToXLSX, importXLSXToGrid } from '../../engine/xlsxExport';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  gridData: GridData;
  onImportSuccess: (imported: GridData) => void;
  levelTitle: string;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  gridData,
  onImportSuccess,
  levelTitle
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      const cleanTitle = levelTitle.replace(/[^a-zA-Z0-9]/g, '_');
      exportGridToXLSX(gridData, `Laporan_${cleanTitle}`);
      setStatusMsg({ type: 'success', text: 'File Excel (.xlsx) berhasil diunduh ke perangkatmu!' });
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: 'Gagal mengekspor file: ' + e.message });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importXLSXToGrid(file);
      onImportSuccess(imported);
      setStatusMsg({ type: 'success', text: 'Data dari file Excel berhasil dimasukkan ke tabel!' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Gagal membaca file: Pastikan format .xlsx atau .csv valid.' });
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-xl font-black text-white">Ekspor & Impor File Excel</h3>
              <p className="text-xs text-slate-400">Interoperabilitas nyata dengan Microsoft Excel (.xlsx)</p>
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

        {statusMsg && (
          <div
            className={`p-3.5 rounded-xl mb-4 text-xs font-bold flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-200'
                : 'bg-rose-950/80 border border-rose-500 text-rose-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="space-y-3.5">
          {/* 1. Ekspor ke .xlsx */}
          <button
            type="button"
            onClick={handleExport}
            className="w-full p-4 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 hover:border-emerald-500 text-left flex items-center justify-between transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-black text-white">Unduh sebagai File Excel (.xlsx)</div>
                <div className="text-xs text-slate-400">Buka hasil praktikmu di MS Excel atau Google Sheets</div>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400 px-3 py-1 bg-emerald-500/10 rounded-lg">
              Unduh .xlsx
            </span>
          </button>

          {/* 2. Impor dari .xlsx */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 hover:border-cyan-500 text-left flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-white">Buka File Excel dari Perangkat</div>
                  <div className="text-xs text-slate-400">Muat data spreadsheet eksternal ke dalam grid</div>
                </div>
              </div>
              <span className="text-xs font-bold text-cyan-400 px-3 py-1 bg-cyan-500/10 rounded-lg">
                Pilih File
              </span>
            </button>
          </div>

          {/* 3. Cetak Lembar Kerja / Raport */}
          <button
            type="button"
            onClick={handlePrint}
            className="w-full p-4 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 hover:border-amber-500 text-left flex items-center justify-between transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-black text-white">Cetak Laporan / Simpan PDF</div>
                <div className="text-xs text-slate-400">Format cetak siap serah untuk guru atau portofolio</div>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-400 px-3 py-1 bg-amber-500/10 rounded-lg">
              Cetak / PDF
            </span>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
