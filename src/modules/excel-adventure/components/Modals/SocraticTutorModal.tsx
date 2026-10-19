'use client';

import React, { useState } from 'react';
import { X, Sparkles, MessageSquare, HelpCircle, CheckCircle } from 'lucide-react';
import { Task } from '../../types';

interface SocraticTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTask: Task;
  currentFormulaInput: string;
  selectedCell: string;
}

export const SocraticTutorModal: React.FC<SocraticTutorModalProps> = ({
  isOpen,
  onClose,
  currentTask,
  currentFormulaInput,
  selectedCell
}) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAskTutor = (questionType: 'why_error' | 'how_to_start' | 'check_syntax') => {
    setLoading(true);

    setTimeout(() => {
      let response = '';

      if (questionType === 'why_error') {
        if (!currentFormulaInput.startsWith('=')) {
          response =
            '💡 Coba perhatikan karakter pertama yang kamu ketik! Apakah sudah ada tanda sama dengan (=)? Ingat, tanpa tanda =, Excel mengira itu hanya teks biasa dan tidak akan menghitung.';
        } else if (currentFormulaInput.includes('(') && !currentFormulaInput.includes(')')) {
          response =
            '💡 Periksa tanda kurungmu! Setiap kurung buka "(" harus ditutup dengan kurung tutup ")". Coba hitung apakah kurungnya sudah berpasangan.';
        } else if (currentTask.expectedFunc && !currentFormulaInput.toUpperCase().includes(currentTask.expectedFunc)) {
          response = `💡 Misi ini meminta penggunaan fungsi "${currentTask.expectedFunc}". Apakah kamu sudah memasukkan nama fungsi tersebut setelah tanda =?`;
        } else {
          response = `💡 Coba cek kembali alamat selnya. Kamu sedang memilih sel ${selectedCell}. Apakah sel yang diminta instruksi adalah ${currentTask.targetCell || 'sel lain'}?`;
        }
      } else if (questionType === 'how_to_start') {
        response = `🎯 Langkah awal: Baca instruksi misi dengan teliti. Instruksi meminta: "${currentTask.instruction}". Sel target yang harus kamu tuju adalah ${currentTask.targetCell || 'antarmuka terkait'}.`;
      } else if (questionType === 'check_syntax') {
        response = `🔍 Petunjuk Struktur Rumus:\n• Awal rumus: =\n• Nama fungsi: ${currentTask.expectedFunc || 'Operator (+, -, *, /)'}\n• Petunjuk khusus: ${currentTask.hint}`;
      }

      setAdvice(response);
      setLoading(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Tutor Pintar Excel</h3>
              <p className="text-xs text-slate-400">Bimbingan belajar dengan metode pertanyaan pemandu</p>
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

        {/* Info Misi */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 mb-4 text-xs">
          <div className="text-slate-400 font-bold uppercase mb-1">Misi yang Sedang Dikerjakan:</div>
          <p className="text-white font-semibold leading-relaxed">{currentTask.instruction}</p>
          <div className="mt-2 text-slate-400 font-mono">
            Isi ketikanmu saat ini: <strong className="text-amber-300">{currentFormulaInput || '(Masih Kosong)'}</strong>
          </div>
        </div>

        {/* Pilihan Pertanyaan Siswa */}
        <div className="space-y-2 mb-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Pilih Hal yang Ingin Kamu Tanyakan:
          </span>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => handleAskTutor('why_error')}
              className="p-3 bg-slate-800 hover:bg-indigo-600/20 hover:border-indigo-500 border border-slate-700 rounded-xl text-left text-xs font-bold text-white flex items-center justify-between transition"
            >
              <span>🤔 Mengapa rumusan atau hasilku masih salah?</span>
              <MessageSquare className="w-4 h-4 text-indigo-400" />
            </button>
            <button
              type="button"
              onClick={() => handleAskTutor('how_to_start')}
              className="p-3 bg-slate-800 hover:bg-indigo-600/20 hover:border-indigo-500 border border-slate-700 rounded-xl text-left text-xs font-bold text-white flex items-center justify-between transition"
            >
              <span>🧭 Bagaimana langkah awal mengerjakan misi ini?</span>
              <HelpCircle className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              type="button"
              onClick={() => handleAskTutor('check_syntax')}
              className="p-3 bg-slate-800 hover:bg-indigo-600/20 hover:border-indigo-500 border border-slate-700 rounded-xl text-left text-xs font-bold text-white flex items-center justify-between transition"
            >
              <span>📝 Tunjukkan pola dan aturan penulisan rumusnya</span>
              <CheckCircle className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>

        {/* Respon Tutor */}
        {loading && (
          <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl text-center text-xs text-indigo-300 animate-pulse">
            Tutor Pintar sedang menganalisis ketikan rumusmu...
          </div>
        )}

        {advice && !loading && (
          <div className="p-4 bg-gradient-to-r from-indigo-950/70 to-slate-900 border-2 border-indigo-500/50 rounded-2xl text-xs sm:text-sm text-indigo-100 whitespace-pre-line leading-relaxed shadow-lg mb-4">
            {advice}
          </div>
        )}

        <div className="pt-3 border-t border-slate-800 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
          >
            Kembali Mencoba di Spreadsheet
          </button>
        </div>
      </div>
    </div>
  );
};
