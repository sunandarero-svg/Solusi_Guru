"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, ArrowLeft, AlertTriangle } from 'lucide-react';

export default function BorneoEduErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Borneo Edu Client Error:', error);
  }, [error]);

  const handleResetCacheAndRetry = () => {
    try {
      if (typeof window !== 'undefined') {
        // Clear corrupt player state if schema was incompatible
        localStorage.removeItem('borneo_edu_player_state_v1');
      }
    } catch (_) {}
    reset();
  };

  return (
    <div className="min-h-[500px] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
          <AlertTriangle size={32} />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Gagal Memuat Permainan
          </h2>
          <p className="text-sm text-slate-300">
            Terjadi kendala saat memuat aset game petualangan Borneo Edu. Silakan coba muat ulang sesi Anda.
          </p>
          {error?.message && (
            <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-white/10 font-mono text-left break-words">
              {error.message}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <RefreshCw size={16} />
            <span>Coba Lagi</span>
          </button>

          <button
            onClick={handleResetCacheAndRetry}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 transition-all"
            title="Reset cache game lokal dan mulai baru"
          >
            Reset Cache & Mulai
          </button>
        </div>

        <div className="pt-2 border-t border-slate-800">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Dashboard Utama</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
