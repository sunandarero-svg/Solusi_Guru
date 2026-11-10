import React from 'react';
import { Trophy, Star, CheckCircle, XCircle, Award, BookOpen, RotateCcw, ArrowRight } from 'lucide-react';
import { ExamOverallResult } from '../../engine/examGrader';

interface ExamResultModalProps {
  result: ExamOverallResult;
  onReview: () => void;
  onRetake: () => void;
  onClose: () => void;
}

export const ExamResultModal: React.FC<ExamResultModalProps> = ({
  result,
  onReview,
  onRetake,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 text-center relative overflow-hidden">
        {/* Glow visual */}
        <div className="absolute -top-20 -left-20 w-44 h-44 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Badge Icon */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 border-2 border-emerald-300 mx-auto flex items-center justify-center text-slate-950 shadow-xl shadow-emerald-500/20">
          <Trophy className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Hasil Evaluasi Sumatif
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
            {result.isPassed ? 'Selamat, Anda Berhasil!' : 'Evaluasi Selesai'}
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Gelar: <span className="text-emerald-400 font-extrabold">{result.badgeName}</span>
          </p>
        </div>

        {/* Star Rating */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <Star
              key={s}
              className={`w-8 h-8 ${
                result.stars >= s
                  ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]'
                  : 'text-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Skor Utama */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Total Nilai Akhir (KKM: {result.kkm})
          </div>
          <div className="text-4xl sm:text-5xl font-black text-emerald-400 mt-1">
            {result.totalScore} <span className="text-lg font-bold text-slate-500">/ 100</span>
          </div>

          {/* Rincian Sub-Skor */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800 text-xs">
            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
              <div className="text-slate-400 font-medium">Pilihan Ganda</div>
              <div className="text-sm font-black text-white mt-0.5">{result.pgScore} / 20</div>
            </div>
            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
              <div className="text-slate-400 font-medium">Benar / Salah</div>
              <div className="text-sm font-black text-white mt-0.5">{result.tfScore} / 20</div>
            </div>
            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
              <div className="text-slate-400 font-medium">Studi Kasus</div>
              <div className="text-sm font-black text-white mt-0.5">{result.essayScore} / 60</div>
            </div>
          </div>
        </div>

        {/* Status KKM */}
        <div className="flex items-center justify-center gap-2 text-xs font-bold">
          {result.isPassed ? (
            <span className="text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Memenuhi Kriteria Ketuntasan Minimal (KKM {result.kkm})
            </span>
          ) : (
            <span className="text-rose-400 flex items-center gap-1.5">
              <XCircle className="w-4 h-4" /> Belum Mencapai KKM ({result.kkm}). Pelajari pembahasan untuk penguatan.
            </span>
          )}
        </div>

        {/* Tombol Aksi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onReview}
            className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition"
          >
            <BookOpen className="w-4 h-4" /> Buka Pembahasan (25 Soal)
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-sm flex items-center justify-center gap-2 border border-slate-700 transition"
          >
            Kembali ke Petualangan <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

