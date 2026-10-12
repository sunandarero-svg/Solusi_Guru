"use client";

import React from 'react';

interface PetunjukModalProps {
  onClose: () => void;
}

export default function PetunjukModal({ onClose }: PetunjukModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative text-white my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📖</span>
            <div>
              <h2 className="text-xl font-black text-amber-300">PETUNJUK PERMAINAN</h2>
              <p className="text-xs text-slate-400">Panduan lengkap menjelajah Borneo Edu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
          {/* Controls */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <h3 className="font-black text-emerald-400 text-sm mb-2 flex items-center gap-2">
              <span>🎮</span>
              <span>KONTROL PERMAINAN</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded bg-slate-700 font-mono text-white font-bold">A / ◀</span>
                <span>Bergerak ke Kiri</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded bg-slate-700 font-mono text-white font-bold">D / ▶</span>
                <span>Bergerak ke Kanan</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded bg-slate-700 font-mono text-white font-bold">W / ▲ / Spasi</span>
                <span>Melompat (Jump)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded bg-slate-700 font-mono text-white font-bold">Layar Sentuh</span>
                <span>Disediakan tombol navigasi & lompat di layar</span>
              </div>
            </div>
          </div>

          {/* Question Blocks & Enemies */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <h3 className="font-black text-amber-400 text-sm mb-2 flex items-center gap-2">
              <span>❓</span>
              <span>QUESTION BLOCK & ENEMY BATTLE</span>
            </h3>
            <p className="mb-2">
              Sentuh kotak bertanda <strong>(?)</strong> atau hadapi Enemy di sepanjang lintasan untuk memicu kuis interaktif.
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs">
              <li><strong>Jawaban Benar:</strong> +10 koin (+20 untuk soal sulit/HOTS), poin materi + combo, pembahasan singkat.</li>
              <li><strong>Bonus Cepat:</strong> Jawab di 35% waktu pertama untuk mendapat +10 koin ekstra!</li>
              <li><strong>Jawaban Salah:</strong> -1 nyawa (kecuali memiliki Shield), combo kembali ke 0.</li>
              <li><strong>Timer Menjawab:</strong> EASY (30s), MEDIUM (20s), HARD (15s), BOSS (30s).</li>
            </ul>
          </div>

          {/* Combo System */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <h3 className="font-black text-orange-400 text-sm mb-2 flex items-center gap-2">
              <span>🔥</span>
              <span>SISTEM COMBO BERUNTUN</span>
            </h3>
            <p className="text-xs">
              Jawab benar berturut-turut untuk melipatgandakan bonus poin:
              1x (+50), 2x (+100), 3x (+150), 4x (+200), dan 5x+ (SUPER COMBO +250 poin!).
            </p>
          </div>

          {/* Power-Ups */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <h3 className="font-black text-purple-400 text-sm mb-2 flex items-center gap-2">
              <span>🍄</span>
              <span>POWER-UP SHOP</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div><strong>🍄 Super Mushroom (30🪙):</strong> +1 Nyawa (Maks 5).</div>
              <div><strong>🌸 Hint Flower (20🪙):</strong> Hapus 2 jawaban salah (50:50).</div>
              <div><strong>⭐ Super Star (50🪙):</strong> Gandakan poin 3 soal ke depan.</div>
              <div><strong>🛡️ Shield (40🪙):</strong> Kebal 1 kesalahan/serangan musuh.</div>
            </div>
          </div>

          {/* Boss Battle */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <h3 className="font-black text-red-400 text-sm mb-2 flex items-center gap-2">
              <span>👑</span>
              <span>BOSS BATTLE & FINAL CASTLE</span>
            </h3>
            <p className="text-xs">
              Level 5, 10, 15, dan 20 diakhiri Boss 3 HP (Pengetahuan, Penerapan, HOTS).
              Level 25 merupakan FINAL CASTLE dengan 5 HP dan hadiah total 700 poin + 100 koin!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-slate-800 mt-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-sm shadow-md transition-transform active:scale-95"
          >
            Mengerti & Siap Bermain! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
