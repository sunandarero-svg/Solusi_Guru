'use client';

import React from 'react';
import {
  FileSpreadsheet,
  BarChart2,
  PieChart,
  TrendingUp,
  Search,
  Type,
  Percent,
  Layers,
  Calculator,
  Database,
  Package,
  Wallet,
  Crown
} from 'lucide-react';

export const FlashcardVisual: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'app-overview':
      return (
        <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-500/30 flex flex-col items-center gap-2">
          <div className="grid grid-cols-3 gap-1 w-48 text-xs font-mono">
            <div className="bg-emerald-600 text-white p-1.5 rounded text-center font-bold">Nama</div>
            <div className="bg-emerald-600 text-white p-1.5 rounded text-center font-bold">Nilai</div>
            <div className="bg-emerald-600 text-white p-1.5 rounded text-center font-bold">Status</div>
            <div className="bg-white/90 text-slate-800 p-1.5 rounded text-center">Andi</div>
            <div className="bg-white/90 text-slate-800 p-1.5 rounded text-center">90</div>
            <div className="bg-emerald-200 text-emerald-900 p-1.5 rounded text-center font-bold">Lulus</div>
          </div>
          <span className="text-xs text-emerald-200 mt-1">Tabel Otomatis & Rapi</span>
        </div>
      );
    case 'row-col':
      return (
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700 flex items-center justify-center gap-6">
          <div className="flex flex-col items-center">
            <div className="text-xs font-bold text-amber-300 mb-1">KOLOM (Vertikal ↓)</div>
            <div className="flex gap-1">
              <div className="w-8 h-20 bg-amber-500/30 border-2 border-amber-400 rounded flex flex-col items-center justify-start pt-1 font-bold text-amber-200 text-xs">
                A
              </div>
              <div className="w-8 h-20 bg-slate-800 border border-slate-600 rounded flex flex-col items-center justify-start pt-1 text-slate-400 text-xs">
                B
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-xs font-bold text-cyan-300 mb-1">BARIS (Horizontal →)</div>
            <div className="flex flex-col gap-1">
              <div className="w-24 h-8 bg-cyan-500/30 border-2 border-cyan-400 rounded flex items-center pl-2 font-bold text-cyan-200 text-xs">
                1
              </div>
              <div className="w-24 h-8 bg-slate-800 border border-slate-600 rounded flex items-center pl-2 text-slate-400 text-xs">
                2
              </div>
            </div>
          </div>
        </div>
      );
    case 'cell-address':
      return (
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700 inline-block">
          <div className="grid grid-cols-4 gap-1 text-xs font-mono w-56">
            <div className="bg-slate-800 p-1 text-center text-slate-400"></div>
            <div className="bg-slate-700 p-1 text-center text-white font-bold">A</div>
            <div className="bg-amber-500 text-slate-950 p-1 text-center font-black rounded">B</div>
            <div className="bg-slate-700 p-1 text-center text-white font-bold">C</div>
            <div className="bg-slate-700 p-1 text-center text-white font-bold">2</div>
            <div className="bg-slate-800 p-1"></div>
            <div className="bg-amber-500/20 p-1"></div>
            <div className="bg-slate-800 p-1"></div>
            <div className="bg-amber-500 text-slate-950 p-1 text-center font-black rounded">3</div>
            <div className="bg-amber-500/20 p-1"></div>
            <div className="bg-emerald-500 text-white p-1.5 text-center font-black rounded ring-2 ring-white animate-pulse">
              B3
            </div>
            <div className="bg-slate-800 p-1"></div>
          </div>
        </div>
      );
    case 'equals-sign':
    case 'operators':
    case 'cell-reference':
      return (
        <div className="bg-slate-900 p-4 rounded-xl border border-amber-500/40 font-mono text-sm flex items-center gap-2">
          <span className="px-2 py-1 bg-amber-500 text-slate-950 font-black rounded text-lg">=</span>
          <span className="text-cyan-300 font-bold">B2</span>
          <span className="text-amber-400 font-bold">*</span>
          <span className="text-emerald-300 font-bold">C2</span>
          <span className="text-slate-400 mx-1">➔</span>
          <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 rounded font-bold">
            20.000
          </span>
        </div>
      );
    case 'func-sum':
    case 'func-avg':
    case 'func-minmax':
      return (
        <div className="bg-slate-900 p-4 rounded-xl border border-cyan-500/40 font-mono text-sm flex flex-col items-center gap-1">
          <div className="text-cyan-300 font-bold text-base">
            =SUM(<span className="text-amber-300">B2:B6</span>)
          </div>
          <div className="text-xs text-slate-300">Menghitung seluruh sel dari B2 sampai B6 sekaligus</div>
        </div>
      );
    case 'func-if':
    case 'quotes-rule':
    case 'count-vs-counta':
      return (
        <div className="bg-slate-900 p-3.5 rounded-xl border border-rose-500/40 font-mono text-xs sm:text-sm text-center">
          <span className="text-rose-400 font-bold">=IF(</span>
          <span className="text-cyan-300">B2&gt;=75</span>,{' '}
          <span className="text-emerald-400">"Lulus"</span>,{' '}
          <span className="text-amber-300">"Remedial"</span>
          <span className="text-rose-400 font-bold">)</span>
        </div>
      );
    case 'chart-types':
    case 'chart-comparison':
      return (
        <div className="bg-slate-900 p-4 rounded-xl border border-pink-500/40 flex items-center justify-around gap-4">
          <div className="flex flex-col items-center text-xs text-pink-300">
            <BarChart2 className="w-8 h-8 text-pink-400 mb-1" />
            <span>Batang (Bar)</span>
          </div>
          <div className="flex flex-col items-center text-xs text-cyan-300">
            <TrendingUp className="w-8 h-8 text-cyan-400 mb-1" />
            <span>Garis (Line)</span>
          </div>
          <div className="flex flex-col items-center text-xs text-amber-300">
            <PieChart className="w-8 h-8 text-amber-400 mb-1" />
            <span>Lingkaran (Pie)</span>
          </div>
        </div>
      );
    case 'countif-sumif':
      return (
        <div className="bg-slate-900 p-3.5 rounded-xl border border-amber-500/40 font-mono text-xs sm:text-sm text-center">
          <span className="text-amber-400 font-bold">=COUNTIF(</span>
          <span className="text-cyan-300">B2:B5</span>,{' '}
          <span className="text-emerald-400">"Lulus"</span>
          <span className="text-amber-400 font-bold">)</span>
          <div className="text-[11px] text-slate-400 mt-1">Menghitung hanya sel yang cocok dengan kriteria</div>
        </div>
      );
    case 'vlookup-flow':
    case 'vlookup-database':
      return (
        <div className="bg-slate-900 p-3.5 rounded-xl border border-orange-500/40 font-mono text-xs sm:text-sm text-center">
          <span className="text-orange-400 font-bold">=VLOOKUP(</span>
          <span className="text-cyan-300">A2</span>,{' '}
          <span className="text-emerald-400">D1:E5</span>,{' '}
          <span className="text-amber-300">2</span>
          <span className="text-orange-400 font-bold">)</span>
          <div className="text-[11px] text-slate-400 mt-1">Mencari kunci A2 di tabel D1:E5 dan mengambil kolom 2</div>
        </div>
      );
    case 'text-functions':
      return (
        <div className="bg-slate-900 p-4 rounded-xl border border-teal-500/40 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 font-mono text-xs sm:text-sm">
            <span className="px-2 py-1 bg-teal-500/20 text-teal-300 rounded font-bold">=CONCAT(B2, " ", C2)</span>
            <span className="text-slate-400">➔</span>
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded font-bold">"Budi Santoso"</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-300 font-mono">
            <span className="text-cyan-300">UPPER: "BUDI"</span>
            <span>•</span>
            <span className="text-amber-300">LEFT: "2024"</span>
            <span>•</span>
            <span className="text-rose-300">RIGHT: "RPL"</span>
          </div>
        </div>
      );
    case 'percent-calc':
      return (
        <div className="bg-slate-900 p-4 rounded-xl border border-emerald-500/40 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 font-mono text-xs sm:text-sm">
            <span className="text-slate-300">Diskon 10% (0.1)</span>
            <span className="text-slate-400">➔</span>
            <span className="text-amber-300 font-bold">=B2*0.1</span>
            <span className="text-slate-400">➔</span>
            <span className="text-emerald-300 font-bold">=B2-D2</span>
          </div>
          <div className="text-xs text-slate-400">Mengalikan harga asli dengan % lalu mengurangkan dari harga asli</div>
        </div>
      );
    case 'nested-if':
      return (
        <div className="bg-slate-900 p-3.5 rounded-xl border border-purple-500/40 font-mono text-xs text-center">
          <div className="text-purple-300 font-bold">=IF(B2&gt;=90, "A", IF(B2&gt;=80, "B", "C"))</div>
          <div className="text-[11px] text-slate-400 mt-1">Uji kondisi bertingkat: 90+ dapat A, 80+ dapat B, sisanya C</div>
        </div>
      );
    case 'round-math':
      return (
        <div className="bg-slate-900 p-3.5 rounded-xl border border-amber-500/40 font-mono text-xs text-center space-y-1">
          <div className="text-amber-300 font-bold">=ROUND(87.666, 1) ➔ 87.7</div>
          <div className="text-cyan-300 font-bold">=ROUNDUP(15.2, 0) ➔ 16 | =POWER(8, 2) ➔ 64</div>
          <div className="text-[11px] text-slate-400">Membulatkan angka desimal dan operasi pangkat secara presisi</div>
        </div>
      );
    case 'averageif-flow':
      return (
        <div className="bg-slate-900 p-3.5 rounded-xl border border-orange-500/40 font-mono text-xs sm:text-sm text-center">
          <span className="text-orange-400 font-bold">=AVERAGEIF(</span>
          <span className="text-cyan-300">B2:B5</span>,{' '}
          <span className="text-emerald-400">"P"</span>,{' '}
          <span className="text-amber-300">C2:C5</span>
          <span className="text-orange-400 font-bold">)</span>
          <div className="text-[11px] text-slate-400 mt-1">Menghitung rata-rata nilai khusus kategori yang cocok</div>
        </div>
      );
    case 'inventory-stock':
      return (
        <div className="bg-slate-900 p-4 rounded-xl border border-teal-500/40 flex flex-col items-center gap-1.5 text-xs font-mono">
          <div className="text-teal-300 font-bold">Sisa Stok = Stok Awal (B2) - Terjual (C2)</div>
          <div className="text-amber-300 font-bold">=IF(D2&lt;=10, "Pesan Lagi", "Aman")</div>
          <div className="text-[11px] text-slate-400">Peringatan otomatis restock barang saat stok di bawah batas minimal</div>
        </div>
      );
    case 'cashflow-balance':
      return (
        <div className="bg-slate-900 p-4 rounded-xl border border-emerald-500/40 flex flex-col items-center gap-1.5 text-xs font-mono">
          <div className="text-emerald-300 font-bold">Saldo Berjalan = Saldo Lalu (D2) + Masuk (B3) - Keluar (C3)</div>
          <div className="text-cyan-300 font-bold">Verifikasi Saldo Akhir = =SUM(Masuk) - =SUM(Keluar)</div>
          <div className="text-[11px] text-slate-400">Pembukuan keuangan kas kelas yang akurat dan seimbang</div>
        </div>
      );
    case 'trend-line-chart':
      return (
        <div className="bg-slate-900 p-4 rounded-xl border border-pink-500/40 flex items-center justify-center gap-4 text-xs font-mono">
          <TrendingUp className="w-8 h-8 text-pink-400 shrink-0" />
          <div className="text-left">
            <div className="text-pink-300 font-bold">Pertumbuhan = Bulan Ini (B3) - Bulan Lalu (B2)</div>
            <div className="text-slate-400 text-[11px] mt-0.5">Line Chart memperlihatkan arah tren perkembangan bisnis</div>
          </div>
        </div>
      );
    case 'master-capstone':
      return (
        <div className="bg-slate-900 p-4 rounded-xl border border-amber-500/40 flex items-center justify-center gap-4 text-xs">
          <Crown className="w-8 h-8 text-amber-400 shrink-0 animate-bounce" />
          <div className="text-left text-slate-200">
            <div className="font-black text-amber-300 text-sm">Gelar Puncak: Legenda Spreadsheet</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Ujian pamungkas menggabungkan VLOOKUP, IF, AVERAGE & COUNTIF!</div>
          </div>
        </div>
      );
    default:
      return (
        <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-700 flex items-center gap-3">
          <FileSpreadsheet className="w-10 h-10 text-emerald-400 shrink-0" />
          <div className="text-left text-xs text-slate-200">
            Perhatikan bagian antarmuka dan contoh rumus pada kartu ini sebelum memulai misi praktik!
          </div>
        </div>
      );
  }
};
