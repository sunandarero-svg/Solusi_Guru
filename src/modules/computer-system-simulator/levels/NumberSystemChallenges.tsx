'use client';

import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  HelpCircle,
  Hash,
  Binary,
  Layers,
  Cpu,
  Palette,
  KeyRound,
  Calculator,
  ShieldAlert
} from 'lucide-react';

interface ChallengeProps {
  onWin: (score: number, stars: number, summary: string) => void;
}

// ============================================================================
// LEVEL 7: SAKLAR BIT BINER INTERAKTIF (8-Bit Switcher)
// ============================================================================
export function Level7BinaryBasics({ onWin }: ChallengeProps) {
  const BITS = [128, 64, 32, 16, 8, 4, 2, 1];
  const TARGETS = [
    { target: 13, desc: 'Bentuk angka 13 (8 + 4 + 1)' },
    { target: 42, desc: 'Bentuk angka 42 (32 + 8 + 2)' },
    { target: 105, desc: 'Bentuk angka 105 (64 + 32 + 8 + 1)' }
  ];

  const [stage, setStage] = useState(0);
  const [switches, setSwitches] = useState<boolean[]>([false, false, false, false, false, false, false, false]);
  const [mistakes, setMistakes] = useState(0);

  const currentTarget = TARGETS[stage];
  const currentSum = useMemo(() => {
    return switches.reduce((acc, on, idx) => acc + (on ? BITS[idx] : 0), 0);
  }, [switches]);

  const currentBinary = switches.map((s) => (s ? '1' : '0')).join('');

  const toggleBit = (index: number) => {
    setSwitches((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const handleCheck = () => {
    if (currentSum === currentTarget.target) {
      if (stage < TARGETS.length - 1) {
        setStage(stage + 1);
        setSwitches([false, false, false, false, false, false, false, false]);
      } else {
        const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
        const score = 100 - mistakes * 10;
        onWin(
          score,
          stars,
          `Berhasil menguasai konsep 8-bit transistor! Deretan bit aktif menghasilkan nilai desimal target dengan presisi tinggi.`
        );
      }
    } else {
      setMistakes((m) => m + 1);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-7 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
            Tantangan 1: Saklar Transistor Bit Digital (Tahap {stage + 1} dari {TARGETS.length})
          </span>
          <h2 className="text-xl md:text-2xl font-black text-white mt-1">
            Bentuk Angka Desimal Target: <span className="text-amber-400 font-mono text-3xl">{currentTarget.target}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">{currentTarget.desc}</p>
        </div>
        <div className="text-right bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400">Total Akumulasi Saat Ini:</div>
          <div className={`text-2xl font-black font-mono ${currentSum === currentTarget.target ? 'text-emerald-400' : 'text-sky-300'}`}>
            {currentSum}
          </div>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400 pb-2">
          <span>Bobot Bit Posisi (2⁷ sampai 2⁰):</span>
          <span className="font-mono text-emerald-400 text-sm">Kode Biner: {currentBinary}₂</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
          {BITS.map((weight, idx) => {
            const isOn = switches[idx];
            return (
              <button
                key={weight}
                onClick={() => toggleBit(idx)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  isOn
                    ? 'bg-sky-500/20 border-sky-400 text-white shadow-lg shadow-sky-500/20 scale-105'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-[10px] font-bold text-slate-400">2^{7 - idx}</span>
                <span className="text-lg font-black font-mono text-amber-300 my-1">{weight}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isOn ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>
                  {isOn ? 'ON (1)' : 'OFF (0)'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
          <span>Penjumlahan aktif:</span>
          <span className="font-mono text-sky-300">
            {switches.some(Boolean)
              ? switches
                  .map((on, i) => (on ? `${BITS[i]}` : null))
                  .filter(Boolean)
                  .join(' + ') + ` = ${currentSum}`
              : 'Belum ada saklar yang diaktifkan'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setSwitches([false, false, false, false, false, false, false, false])}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Matikan Semua Saklar</span>
        </button>

        <button
          onClick={handleCheck}
          className={`px-6 py-3 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition-all ${
            currentSum === currentTarget.target
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 animate-pulse'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
        >
          <span>{currentSum === currentTarget.target ? 'BENAR! SIMPAN & LANJUT' : 'UJI NILAI SAKLAR'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// LEVEL 8: KONVERSI BINER KE DESIMAL
// ============================================================================
export function Level8BinaryToDecimal({ onWin }: ChallengeProps) {
  const QUESTIONS = [
    { binary: '1011', decimal: 11, bits: [8, 0, 2, 1], weights: [8, 4, 2, 1] },
    { binary: '10101', decimal: 21, bits: [16, 0, 4, 0, 1], weights: [16, 8, 4, 2, 1] },
    { binary: '110010', decimal: 50, bits: [32, 16, 0, 0, 2, 0], weights: [32, 16, 8, 4, 2, 1] }
  ];

  const [qIdx, setQIdx] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [err, setErr] = useState('');
  const [mistakes, setMistakes] = useState(0);

  const currentQ = QUESTIONS[qIdx];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(userInput.trim()) === currentQ.decimal) {
      setErr('');
      if (qIdx < QUESTIONS.length - 1) {
        setQIdx(qIdx + 1);
        setUserInput('');
      } else {
        const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
        onWin(100 - mistakes * 10, stars, 'Luar biasa! Sukses menerjemahkan kode biner menjadi angka desimal dengan rumus bobot 2ⁿ!');
      }
    } else {
      setMistakes((m) => m + 1);
      setErr(`Belum tepat. Coba jumlahkan bobot bit 1: ${currentQ.bits.filter((b) => b > 0).join(' + ')}`);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-7 space-y-6">
      <div>
        <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
          Tantangan 2: Dekoder Biner ke Desimal (Soal {qIdx + 1} dari {QUESTIONS.length})
        </span>
        <h2 className="text-xl md:text-2xl font-black text-white mt-1">
          Berapa nilai desimal dari bilangan biner: <span className="font-mono text-amber-300 text-3xl font-black">{currentQ.binary}₂</span>?
        </h2>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 md:p-6 space-y-4">
        <div className="text-xs font-bold text-slate-300">Tabel Nilai Tempat Biner:</div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {currentQ.binary.split('').map((bit, idx) => {
            const weight = currentQ.weights[idx];
            return (
              <div key={idx} className="flex flex-col items-center bg-slate-900 border border-slate-800 p-3 rounded-xl min-w-[55px]">
                <span className="text-[11px] text-slate-400">2^{currentQ.weights.length - 1 - idx} ({weight})</span>
                <span className={`text-2xl font-black font-mono my-1 ${bit === '1' ? 'text-emerald-400' : 'text-slate-500'}`}>{bit}</span>
                <span className="text-[11px] text-amber-300 font-mono">{bit === '1' ? weight : '0'}</span>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <input
            type="number"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Masukkan nilai desimal..."
            className="w-full sm:w-64 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-lg text-center focus:outline-none focus:border-sky-400"
            autoFocus
          />
          <button type="submit" className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-sm">
            Periksa Jawaban
          </button>
        </form>

        {err && <div className="text-xs text-rose-400 text-center font-semibold bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30">{err}</div>}
      </div>
    </div>
  );
}

// ============================================================================
// LEVEL 9: KONVERSI DESIMAL KE BINER (Metode Bagi 2)
// ============================================================================
export function Level9DecimalToBinary({ onWin }: ChallengeProps) {
  const [currentVal, setCurrentVal] = useState(25);
  const [quotientInput, setQuotientInput] = useState('');
  const [remInput, setRemInput] = useState('');
  const [steps, setSteps] = useState<{ num: number; q: number; r: number }[]>([]);
  const [err, setErr] = useState('');
  const [mistakes, setMistakes] = useState(0);

  const initialTarget = 25;

  const handleStep = (e: React.FormEvent) => {
    e.preventDefault();
    const q = parseInt(quotientInput);
    const r = parseInt(remInput);

    const expectedQ = Math.floor(currentVal / 2);
    const expectedR = currentVal % 2;

    if (q === expectedQ && r === expectedR) {
      setErr('');
      const newSteps = [...steps, { num: currentVal, q, r }];
      setSteps(newSteps);
      setQuotientInput('');
      setRemInput('');

      if (q === 0) {
        // Selesai!
        const binaryResult = newSteps.map((s) => s.r).reverse().join('');
        const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
        onWin(100 - mistakes * 10, stars, `Hebat! Mengonversi ${initialTarget}₁₀ menghasilkan ${binaryResult}₂ dengan metode sisa pembagian 2.`);
      } else {
        setCurrentVal(q);
      }
    } else {
      setMistakes((m) => m + 1);
      setErr(`${currentVal} ÷ 2 = ${expectedQ} sisa ${expectedR}. Periksa kembali hasil bagimu!`);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-7 space-y-6">
      <div>
        <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
          Tantangan 3: Algoritma Bagi 2 Berulang
        </span>
        <h2 className="text-xl md:text-2xl font-black text-white mt-1">
          Ubah Angka Desimal <span className="font-mono text-amber-300 text-3xl font-black">{initialTarget}₁₀</span> Menjadi Biner
        </h2>
        <p className="text-xs text-slate-400 mt-1">Bagi angka dengan 2, masukkan hasil bagi dan sisa (0 atau 1) hingga hasil bagi mencapai 0.</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 md:p-6 space-y-4">
        {steps.length > 0 && (
          <div className="space-y-1.5 font-mono text-xs">
            {steps.map((st, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-300">{st.num} ÷ 2 = <strong className="text-sky-300">{st.q}</strong></span>
                <span className="text-emerald-400 font-bold">Sisa: {st.r}</span>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleStep} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-bold text-white">
            Hitung: <span className="font-mono text-amber-300 text-lg">{currentVal}</span> ÷ 2 =
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Hasil Bagi"
              value={quotientInput}
              onChange={(e) => setQuotientInput(e.target.value)}
              className="w-24 px-3 py-2 rounded-lg bg-slate-950 border border-slate-600 text-white font-mono text-center text-sm"
              autoFocus
            />
            <span className="text-xs text-slate-400">Sisa:</span>
            <input
              type="number"
              placeholder="0 atau 1"
              value={remInput}
              onChange={(e) => setRemInput(e.target.value)}
              className="w-24 px-3 py-2 rounded-lg bg-slate-950 border border-slate-600 text-emerald-400 font-mono text-center text-sm font-bold"
            />
            <button type="submit" className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs">
              Lanjut
            </button>
          </div>
        </form>

        {err && <div className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/30">{err}</div>}
      </div>
    </div>
  );
}

// ============================================================================
// LEVEL 10: SISTEM BILANGAN OKTAL (Basis 8 & Konversi ke Desimal)
// ============================================================================
export function Level10OctalToDecimal({ onWin }: ChallengeProps) {
  const QUESTIONS = [
    { octal: '35', decimal: 29, explain: '(3 × 8¹) + (5 × 8⁰) = 24 + 5 = 29' },
    { octal: '72', decimal: 58, explain: '(7 × 8¹) + (2 × 8⁰) = 56 + 2 = 58' },
    { octal: '144', decimal: 100, explain: '(1 × 8²) + (4 × 8¹) + (4 × 8⁰) = 64 + 32 + 4 = 100' }
  ];

  const [qIdx, setQIdx] = useState(0);
  const [ans, setAns] = useState('');
  const [err, setErr] = useState('');
  const [mistakes, setMistakes] = useState(0);

  const currentQ = QUESTIONS[qIdx];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(ans.trim()) === currentQ.decimal) {
      setErr('');
      if (qIdx < QUESTIONS.length - 1) {
        setQIdx(qIdx + 1);
        setAns('');
      } else {
        const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
        onWin(100 - mistakes * 10, stars, 'Sempurna! Konversi bilangan oktal (basis 8) ke desimal berhasil diselesaikan.');
      }
    } else {
      setMistakes((m) => m + 1);
      setErr(`Belum sesuai. Petunjuk: ${currentQ.explain}`);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-7 space-y-6">
      <div>
        <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
          Tantangan 4: Konversi Bilangan Oktal (Soal {qIdx + 1} dari {QUESTIONS.length})
        </span>
        <h2 className="text-xl md:text-2xl font-black text-white mt-1">
          Berapa nilai desimal dari bilangan oktal: <span className="font-mono text-amber-300 text-3xl font-black">{currentQ.octal}₈</span>?
        </h2>
        <p className="text-xs text-slate-400 mt-1">Kalikan setiap digit oktal dengan bobot perpangkatan 8 (8⁰ = 1, 8¹ = 8, 8² = 64).</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <input
            type="number"
            value={ans}
            onChange={(e) => setAns(e.target.value)}
            placeholder="Ketik nilai desimal..."
            className="w-full sm:w-64 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-center text-lg focus:outline-none focus:border-sky-400"
            autoFocus
          />
          <button type="submit" className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm">
            Validasi Nilai
          </button>
        </form>
        {err && <div className="text-xs text-rose-400 text-center bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30">{err}</div>}
      </div>
    </div>
  );
}

// ============================================================================
// LEVEL 11: KONVERSI BINER KE OKTAL (Pengelompokan 3 Bit)
// ============================================================================
export function Level11BinaryToOctal({ onWin }: ChallengeProps) {
  const QUESTIONS = [
    { binary: '101110', chunks: ['101', '110'], digits: ['5', '6'], result: '56' },
    { binary: '11011', chunks: ['011', '011'], digits: ['3', '3'], result: '33' },
    { binary: '111001010', chunks: ['111', '001', '010'], digits: ['7', '1', '2'], result: '712' }
  ];

  const [qIdx, setQIdx] = useState(0);
  const [inputs, setInputs] = useState<string[]>(['', '']);
  const [mistakes, setMistakes] = useState(0);
  const [err, setErr] = useState('');

  const currentQ = QUESTIONS[qIdx];

  const handleInputChange = (idx: number, val: string) => {
    setInputs((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const handleCheck = () => {
    const isCorrect = inputs.every((v, i) => v.trim() === currentQ.digits[i]);
    if (isCorrect) {
      setErr('');
      if (qIdx < QUESTIONS.length - 1) {
        const nextQ = QUESTIONS[qIdx + 1];
        setQIdx(qIdx + 1);
        setInputs(nextQ.digits.map(() => ''));
      } else {
        const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
        onWin(100 - mistakes * 10, stars, 'Keren! Berhasil mengelompokkan biner setiap 3-bit menjadi bilangan oktal!');
      }
    } else {
      setMistakes((m) => m + 1);
      setErr('Beberapa digit oktal belum tepat. Ingat: 4-2-1 bobot dari masing-masing 3 bit.');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-7 space-y-6">
      <div>
        <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
          Tantangan 5: Grouping 3-Bit Biner ke Oktal (Soal {qIdx + 1} dari {QUESTIONS.length})
        </span>
        <h2 className="text-xl md:text-2xl font-black text-white mt-1">
          Biner: <span className="font-mono text-amber-300 text-3xl font-black">{currentQ.binary}₂</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">Ubah setiap kelompok 3 bit berikut menjadi satu digit oktal (0-7):</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-center gap-4">
          {currentQ.chunks.map((chunk, idx) => (
            <div key={idx} className="flex flex-col items-center bg-slate-900 border-2 border-indigo-500/40 p-4 rounded-2xl min-w-[100px]">
              <span className="text-xs font-bold text-indigo-400 mb-1">Blok {idx + 1}</span>
              <span className="text-2xl font-black font-mono text-white mb-3">{chunk}₂</span>
              <input
                type="text"
                maxLength={1}
                value={inputs[idx] || ''}
                onChange={(e) => handleInputChange(idx, e.target.value)}
                placeholder="0-7"
                className="w-14 h-14 text-center font-mono font-black text-2xl rounded-xl bg-slate-950 border border-slate-700 text-amber-300 focus:outline-none focus:border-sky-400"
              />
            </div>
          ))}
        </div>

        <div className="text-center">
          <button onClick={handleCheck} className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-sm">
            Periksa Digit Oktal
          </button>
        </div>

        {err && <div className="text-xs text-rose-400 text-center bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30">{err}</div>}
      </div>
    </div>
  );
}

// ============================================================================
// LEVEL 12: PENGENALAN HEKSADESIMAL (Basis 16: Angka 0-9 & Huruf A-F)
// ============================================================================
export function Level12HexBasics({ onWin }: ChallengeProps) {
  const PAIRS = [
    { hex: 'A', dec: 10 },
    { hex: 'B', dec: 11 },
    { hex: 'C', dec: 12 },
    { hex: 'D', dec: 13 },
    { hex: 'E', dec: 14 },
    { hex: 'F', dec: 15 }
  ];

  const [selectedHex, setSelectedHex] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);

  const handleSelectHex = (hex: string) => {
    setSelectedHex(hex);
  };

  const handleSelectDec = (dec: number) => {
    if (!selectedHex) return;
    const pair = PAIRS.find((p) => p.hex === selectedHex);
    if (pair && pair.dec === dec) {
      const nextMatched = [...matched, selectedHex];
      setMatched(nextMatched);
      setSelectedHex(null);

      if (nextMatched.length === PAIRS.length) {
        const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
        onWin(100 - mistakes * 10, stars, 'Hebat! Anda telah menguasai kode simbol heksadesimal A(10) sampai F(15) secara sempurna.');
      }
    } else {
      setMistakes((m) => m + 1);
      setSelectedHex(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-7 space-y-6">
      <div>
        <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
          Tantangan 6: Pencocokan Simbol Heksadesimal (Basis 16)
        </span>
        <h2 className="text-xl md:text-2xl font-black text-white mt-1">
          Cocokkan Huruf Heksadesimal (A–F) dengan Nilai Desimalnya (10–15)
        </h2>
        <p className="text-xs text-slate-400 mt-1">Pilih kartu huruf Hex di kiri, lalu pilih kartu angka desimal padanannya di kanan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950 border border-slate-800 rounded-2xl p-6">
        <div>
          <h3 className="text-xs font-bold text-sky-400 uppercase mb-3">Simbol Heksadesimal:</h3>
          <div className="grid grid-cols-3 gap-3">
            {PAIRS.map((p) => {
              const isMatched = matched.includes(p.hex);
              const isSelected = selectedHex === p.hex;
              return (
                <button
                  key={p.hex}
                  disabled={isMatched}
                  onClick={() => handleSelectHex(p.hex)}
                  className={`p-4 rounded-xl font-mono text-2xl font-black border-2 transition-all ${
                    isMatched
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 opacity-50'
                      : isSelected
                      ? 'bg-amber-500/30 border-amber-400 text-white scale-105'
                      : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {p.hex}₁₆
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-amber-400 uppercase mb-3">Nilai Desimal:</h3>
          <div className="grid grid-cols-3 gap-3">
            {[14, 10, 15, 12, 11, 13].map((num) => {
              const pair = PAIRS.find((p) => p.dec === num);
              const isMatched = pair && matched.includes(pair.hex);
              return (
                <button
                  key={num}
                  disabled={isMatched}
                  onClick={() => handleSelectDec(num)}
                  className={`p-4 rounded-xl font-mono text-2xl font-black border-2 transition-all ${
                    isMatched
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 opacity-50'
                      : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {num}₁₀
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LEVEL 13: KONVERSI HEKSADESIMAL KE DESIMAL
// ============================================================================
export function Level13HexToDecimal({ onWin }: ChallengeProps) {
  const QUESTIONS = [
    { hex: '1A', decimal: 26, formula: '(1 × 16¹) + (10 × 16⁰) = 16 + 10 = 26' },
    { hex: '2F', decimal: 47, formula: '(2 × 16¹) + (15 × 16⁰) = 32 + 15 = 47' },
    { hex: 'FF', decimal: 255, formula: '(15 × 16¹) + (15 × 16⁰) = 240 + 15 = 255' }
  ];

  const [qIdx, setQIdx] = useState(0);
  const [ans, setAns] = useState('');
  const [err, setErr] = useState('');
  const [mistakes, setMistakes] = useState(0);

  const currentQ = QUESTIONS[qIdx];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(ans.trim()) === currentQ.decimal) {
      setErr('');
      if (qIdx < QUESTIONS.length - 1) {
        setQIdx(qIdx + 1);
        setAns('');
      } else {
        const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
        onWin(100 - mistakes * 10, stars, 'Hebat! Sukses mengonversi heksadesimal ke desimal menggunakan bobot posisi 16ⁿ.');
      }
    } else {
      setMistakes((m) => m + 1);
      setErr(`Jawaban belum pas. Petunjuk: ${currentQ.formula}`);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-7 space-y-6">
      <div>
        <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
          Tantangan 7: Dekoder Alamat Memori Hex (Soal {qIdx + 1} dari {QUESTIONS.length})
        </span>
        <h2 className="text-xl md:text-2xl font-black text-white mt-1">
          Berapa nilai desimal dari kode heksadesimal: <span className="font-mono text-amber-300 text-3xl font-black">{currentQ.hex}₁₆</span>?
        </h2>
        <p className="text-xs text-slate-400 mt-1">Kalikan tiap digit dengan bobot 16 (16⁰ = 1, 16¹ = 16, dst).</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <input
            type="number"
            value={ans}
            onChange={(e) => setAns(e.target.value)}
            placeholder="Masukkan nilai desimal..."
            className="w-full sm:w-64 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-center text-lg focus:outline-none focus:border-sky-400"
            autoFocus
          />
          <button type="submit" className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-sm">
            Hitung Nilai
          </button>
        </form>
        {err && <div className="text-xs text-rose-400 text-center bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30">{err}</div>}
      </div>
    </div>
  );
}

// ============================================================================
// LEVEL 14: KONVERSI DESIMAL KE HEKSADESIMAL (Metode Bagi 16)
// ============================================================================
export function Level14DecimalToHex({ onWin }: ChallengeProps) {
  const QUESTIONS = [
    { decimal: 45, hex: '2D', explain: '45 ÷ 16 = 2 sisa 13 (D) -> 2D₁₆' },
    { decimal: 171, hex: 'AB', explain: '171 ÷ 16 = 10 (A) sisa 11 (B) -> AB₁₆' },
    { decimal: 254, hex: 'FE', explain: '254 ÷ 16 = 15 (F) sisa 14 (E) -> FE₁₆' }
  ];

  const [qIdx, setQIdx] = useState(0);
  const [ans, setAns] = useState('');
  const [err, setErr] = useState('');
  const [mistakes, setMistakes] = useState(0);

  const currentQ = QUESTIONS[qIdx];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ans.trim().toUpperCase() === currentQ.hex) {
      setErr('');
      if (qIdx < QUESTIONS.length - 1) {
        setQIdx(qIdx + 1);
        setAns('');
      } else {
        const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
        onWin(100 - mistakes * 10, stars, 'Sukses besar! Mengonversi desimal ke heksadesimal dengan pembagian 16 dan substitusi huruf A-F.');
      }
    } else {
      setMistakes((m) => m + 1);
      setErr(`Belum tepat. Coba perhatikan sisa bagi 16: ${currentQ.explain}`);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-7 space-y-6">
      <div>
        <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
          Tantangan 8: Pembagian Modulo 16 (Soal {qIdx + 1} dari {QUESTIONS.length})
        </span>
        <h2 className="text-xl md:text-2xl font-black text-white mt-1">
          Ubah bilangan desimal <span className="font-mono text-amber-300 text-3xl font-black">{currentQ.decimal}₁₀</span> ke Heksadesimal!
        </h2>
        <p className="text-xs text-slate-400 mt-1">Ingat: Jika sisa bagi antara 10 sampai 15, ganti dengan A, B, C, D, E, atau F.</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <input
            type="text"
            value={ans}
            onChange={(e) => setAns(e.target.value.toUpperCase())}
            placeholder="Ketik kode Hex (misal: 2D)..."
            className="w-full sm:w-64 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-center text-lg uppercase tracking-wider focus:outline-none focus:border-sky-400"
            autoFocus
          />
          <button type="submit" className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm">
            Periksa Hex
          </button>
        </form>
        {err && <div className="text-xs text-rose-400 text-center bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30">{err}</div>}
      </div>
    </div>
  );
}

// ============================================================================
// LEVEL 15: KONVERSI BINER KE HEKSADESIMAL (Pengelompokan 4 Bit / Nibble)
// ============================================================================
export function Level15BinaryToHex({ onWin }: ChallengeProps) {
  const QUESTIONS = [
    { binary: '11001010', nibbleHigh: '1100', nibbleLow: '1010', hexHigh: 'C', hexLow: 'A' },
    { binary: '11110011', nibbleHigh: '1111', nibbleLow: '0011', hexHigh: 'F', hexLow: '3' },
    { binary: '10011110', nibbleHigh: '1001', nibbleLow: '1110', hexHigh: '9', hexLow: 'E' }
  ];

  const [qIdx, setQIdx] = useState(0);
  const [highInput, setHighInput] = useState('');
  const [lowInput, setLowInput] = useState('');
  const [err, setErr] = useState('');
  const [mistakes, setMistakes] = useState(0);

  const currentQ = QUESTIONS[qIdx];

  const handleCheck = () => {
    if (
      highInput.trim().toUpperCase() === currentQ.hexHigh &&
      lowInput.trim().toUpperCase() === currentQ.hexLow
    ) {
      setErr('');
      if (qIdx < QUESTIONS.length - 1) {
        setQIdx(qIdx + 1);
        setHighInput('');
        setLowInput('');
      } else {
        const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
        onWin(100 - mistakes * 10, stars, 'Fantastis! Pengelompokan 4-bit nibble berhasil mengonversi byte biner ke heksadesimal.');
      }
    } else {
      setMistakes((m) => m + 1);
      setErr('Salah satu nibble belum cocok. Ingat: 8-4-2-1 bobot masing-masing 4 bit.');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-7 space-y-6">
      <div>
        <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
          Tantangan 9: Nibble Packer 4-Bit (Soal {qIdx + 1} dari {QUESTIONS.length})
        </span>
        <h2 className="text-xl md:text-2xl font-black text-white mt-1">
          Biner 1 Byte: <span className="font-mono text-amber-300 text-3xl font-black">{currentQ.binary}₂</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">Pecah byte menjadi 2 Nibble (4 bit tinggi & 4 bit rendah), lalu konversi tiap nibble ke digit heksadesimal.</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
          <div className="bg-slate-900 border-2 border-sky-500/40 p-4 rounded-2xl text-center space-y-2">
            <span className="text-xs font-bold text-sky-400">High Nibble (4 Bit Kiri)</span>
            <div className="text-2xl font-black font-mono text-white">{currentQ.nibbleHigh}₂</div>
            <input
              type="text"
              maxLength={1}
              value={highInput}
              onChange={(e) => setHighInput(e.target.value.toUpperCase())}
              placeholder="0-F"
              className="w-16 h-16 text-center font-mono font-black text-2xl rounded-xl bg-slate-950 border border-slate-700 text-amber-300 focus:outline-none focus:border-sky-400 mx-auto"
            />
          </div>

          <div className="bg-slate-900 border-2 border-emerald-500/40 p-4 rounded-2xl text-center space-y-2">
            <span className="text-xs font-bold text-emerald-400">Low Nibble (4 Bit Kanan)</span>
            <div className="text-2xl font-black font-mono text-white">{currentQ.nibbleLow}₂</div>
            <input
              type="text"
              maxLength={1}
              value={lowInput}
              onChange={(e) => setLowInput(e.target.value.toUpperCase())}
              placeholder="0-F"
              className="w-16 h-16 text-center font-mono font-black text-2xl rounded-xl bg-slate-950 border border-slate-700 text-amber-300 focus:outline-none focus:border-emerald-400 mx-auto"
            />
          </div>
        </div>

        <div className="text-center">
          <button onClick={handleCheck} className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-sm">
            Periksa Digit Nibble Hex
          </button>
        </div>

        {err && <div className="text-xs text-rose-400 text-center bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30">{err}</div>}
      </div>
    </div>
  );
}

// ============================================================================
// LEVEL 16: KONVERSI HEKSADESIMAL KE BINER (Ekspansi 4 Bit per Digit)
// ============================================================================
export function Level16HexToBinary({ onWin }: ChallengeProps) {
  const QUESTIONS = [
    { hex: '7B', highDigit: '7', lowDigit: 'B', highBinary: '0111', lowBinary: '1011' },
    { hex: 'A4', highDigit: 'A', lowDigit: '4', highBinary: '1010', lowBinary: '0100' },
    { hex: 'F0', highDigit: 'F', lowDigit: '0', highBinary: '1111', lowBinary: '0000' }
  ];

  const [qIdx, setQIdx] = useState(0);
  const [highBits, setHighBits] = useState(['0', '0', '0', '0']);
  const [lowBits, setLowBits] = useState(['0', '0', '0', '0']);
  const [mistakes, setMistakes] = useState(0);
  const [err, setErr] = useState('');

  const currentQ = QUESTIONS[qIdx];

  const toggleHighBit = (idx: number) => {
    setHighBits((prev) => {
      const next = [...prev];
      next[idx] = next[idx] === '1' ? '0' : '1';
      return next;
    });
  };

  const toggleLowBit = (idx: number) => {
    setLowBits((prev) => {
      const next = [...prev];
      next[idx] = next[idx] === '1' ? '0' : '1';
      return next;
    });
  };

  const handleCheck = () => {
    const isHighMatch = highBits.join('') === currentQ.highBinary;
    const isLowMatch = lowBits.join('') === currentQ.lowBinary;

    if (isHighMatch && isLowMatch) {
      setErr('');
      if (qIdx < QUESTIONS.length - 1) {
        setQIdx(qIdx + 1);
        setHighBits(['0', '0', '0', '0']);
        setLowBits(['0', '0', '0', '0']);
      } else {
        const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
        onWin(100 - mistakes * 10, stars, 'Sempurna! Anda berhasil mengekspansi tiap digit heksadesimal menjadi tepat 4 bit biner.');
      }
    } else {
      setMistakes((m) => m + 1);
      setErr('Deretan bit biner belum cocok dengan nilai heksadesimal.');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-7 space-y-6">
      <div>
        <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
          Tantangan 10: Ekspansi 4-Bit Hex ke Biner (Soal {qIdx + 1} dari {QUESTIONS.length})
        </span>
        <h2 className="text-xl md:text-2xl font-black text-white mt-1">
          Ekspansi Kode Hex: <span className="font-mono text-amber-300 text-3xl font-black">{currentQ.hex}₁₆</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">Uraikan digit kiri ({currentQ.highDigit}) dan digit kanan ({currentQ.lowDigit}) masing-masing menjadi tepat 4 bit biner (8-4-2-1).</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 text-center">
            <span className="text-xs font-bold text-sky-400">Digit: {currentQ.highDigit}₁₆</span>
            <div className="flex justify-center gap-2">
              {[8, 4, 2, 1].map((weight, i) => (
                <button
                  key={weight}
                  onClick={() => toggleHighBit(i)}
                  className={`w-12 h-14 rounded-xl border flex flex-col items-center justify-center font-mono font-bold ${
                    highBits[i] === '1' ? 'bg-sky-500 border-sky-400 text-slate-950' : 'bg-slate-950 border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="text-[10px]">{weight}</span>
                  <span className="text-lg font-black">{highBits[i]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 text-center">
            <span className="text-xs font-bold text-emerald-400">Digit: {currentQ.lowDigit}₁₆</span>
            <div className="flex justify-center gap-2">
              {[8, 4, 2, 1].map((weight, i) => (
                <button
                  key={weight}
                  onClick={() => toggleLowBit(i)}
                  className={`w-12 h-14 rounded-xl border flex flex-col items-center justify-center font-mono font-bold ${
                    lowBits[i] === '1' ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'bg-slate-950 border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="text-[10px]">{weight}</span>
                  <span className="text-lg font-black">{lowBits[i]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center">
          <button onClick={handleCheck} className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm">
            Periksa Hasil Ekspansi Biner
          </button>
        </div>

        {err && <div className="text-xs text-rose-400 text-center bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30">{err}</div>}
      </div>
    </div>
  );
}

// ============================================================================
// LEVEL 17: KONVERSI HEKSADESIMAL KE OKTAL (Jalur Jembatan Biner)
// ============================================================================
export function Level17HexToOctal({ onWin }: ChallengeProps) {
  const QUESTIONS = [
    { hex: '2B', binary: '00101011', octal: '53', explain: '2B -> 0010 1011 -> (000)(101)(011) -> 53₈' },
    { hex: '1F', binary: '00011111', octal: '37', explain: '1F -> 0001 1111 -> (000)(011)(111) -> 37₈' }
  ];

  const [qIdx, setQIdx] = useState(0);
  const [ans, setAns] = useState('');
  const [err, setErr] = useState('');
  const [mistakes, setMistakes] = useState(0);

  const currentQ = QUESTIONS[qIdx];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ans.trim() === currentQ.octal) {
      setErr('');
      if (qIdx < QUESTIONS.length - 1) {
        setQIdx(qIdx + 1);
        setAns('');
      } else {
        const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
        onWin(100 - mistakes * 10, stars, 'Luar biasa! Mengonversi heksadesimal ke oktal melalui jembatan biner perantara.');
      }
    } else {
      setMistakes((m) => m + 1);
      setErr(`Belum sesuai. Petunjuk alur: ${currentQ.explain}`);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-7 space-y-6">
      <div>
        <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
          Tantangan 11: Jembatan Biner Hex ➔ Biner ➔ Oktal (Soal {qIdx + 1} dari {QUESTIONS.length})
        </span>
        <h2 className="text-xl md:text-2xl font-black text-white mt-1">
          Konversikan <span className="font-mono text-amber-300 text-3xl font-black">{currentQ.hex}₁₆</span> ke Oktal!
        </h2>
        <p className="text-xs text-slate-400 mt-1">Langkah: (1) Ubah tiap digit hex jadi 4 bit biner ➔ (2) Kelompokkan ulang tiap 3 bit dari kanan ➔ (3) Ubah jadi oktal.</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <input
            type="text"
            value={ans}
            onChange={(e) => setAns(e.target.value)}
            placeholder="Ketik nilai oktal..."
            className="w-full sm:w-64 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-center text-lg focus:outline-none focus:border-sky-400"
            autoFocus
          />
          <button type="submit" className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm">
            Verifikasi Nilai Oktal
          </button>
        </form>
        {err && <div className="text-xs text-rose-400 text-center bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30">{err}</div>}
      </div>
    </div>
  );
}

// ============================================================================
// LEVEL 18: KONVERSI OKTAL KE HEKSADESIMAL (Jalur Jembatan Biner)
// ============================================================================
export function Level18OctalToHex({ onWin }: ChallengeProps) {
  const QUESTIONS = [
    { octal: '75', binary: '111101', hex: '3D', explain: '75₈ -> (111)(101) -> (0011)(1101) -> 3D₁₆' },
    { octal: '42', binary: '100010', hex: '22', explain: '42₈ -> (100)(010) -> (0010)(0010) -> 22₁₆' }
  ];

  const [qIdx, setQIdx] = useState(0);
  const [ans, setAns] = useState('');
  const [err, setErr] = useState('');
  const [mistakes, setMistakes] = useState(0);

  const currentQ = QUESTIONS[qIdx];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ans.trim().toUpperCase() === currentQ.hex) {
      setErr('');
      if (qIdx < QUESTIONS.length - 1) {
        setQIdx(qIdx + 1);
        setAns('');
      } else {
        const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
        onWin(100 - mistakes * 10, stars, 'Hebat! Anda menguasai jalur konversi Oktal ke Heksadesimal menggunakan ekspansi 3-bit dan regrouping 4-bit.');
      }
    } else {
      setMistakes((m) => m + 1);
      setErr(`Belum sesuai. Petunjuk alur: ${currentQ.explain}`);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-7 space-y-6">
      <div>
        <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
          Tantangan 12: Jembatan Biner Oktal ➔ Biner ➔ Hex (Soal {qIdx + 1} dari {QUESTIONS.length})
        </span>
        <h2 className="text-xl md:text-2xl font-black text-white mt-1">
          Konversikan bilangan oktal <span className="font-mono text-amber-300 text-3xl font-black">{currentQ.octal}₈</span> ke Heksadesimal!
        </h2>
        <p className="text-xs text-slate-400 mt-1">Pecah tiap digit oktal ke 3 bit biner, satukan, lalu kelompokkan tiap 4 bit dari kanan.</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <input
            type="text"
            value={ans}
            onChange={(e) => setAns(e.target.value.toUpperCase())}
            placeholder="Ketik kode Hex (misal: 3D)..."
            className="w-full sm:w-64 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-center text-lg uppercase focus:outline-none focus:border-sky-400"
            autoFocus
          />
          <button type="submit" className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-sm">
            Verifikasi Kode Hex
          </button>
        </form>
        {err && <div className="text-xs text-rose-400 text-center bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30">{err}</div>}
      </div>
    </div>
  );
}

// ============================================================================
// LEVEL 19: KODE WARNA HEX & ASCII KOMPUTER
// ============================================================================
export function Level19HexColorAscii({ onWin }: ChallengeProps) {
  // Soal 1: Warna Web RGB #RRGGBB
  // Soal 2: Teks Kode ASCII Heksadesimal
  const [step, setStep] = useState<'color' | 'ascii'>('color');
  const [colorInput, setColorInput] = useState('');
  const [asciiInput, setAsciiInput] = useState('');
  const [err, setErr] = useState('');
  const [mistakes, setMistakes] = useState(0);

  const targetHexColor = 'FF00FF'; // Magenta
  const targetAsciiHex = '43 50 55'; // CPU (C=43, P=50, U=55)

  const handleCheckColor = () => {
    if (colorInput.trim().toUpperCase().replace('#', '') === targetHexColor) {
      setErr('');
      setStep('ascii');
    } else {
      setMistakes((m) => m + 1);
      setErr('Kode warna belum pas. Campuran Red penuh (FF), Green nol (00), Blue penuh (FF) menghasilkan Magenta.');
    }
  };

  const handleCheckAscii = () => {
    if (asciiInput.trim().toUpperCase() === 'CPU') {
      const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      onWin(100 - mistakes * 10, stars, 'Mantap! Anda memecahkan kode warna CSS RGB heksadesimal dan dekoder teks ASCII komputer!');
    } else {
      setMistakes((m) => m + 1);
      setErr("Karakter teks belum sesuai. 43₁₆ = 'C', 50₁₆ = 'P', 55₁₆ = 'U'. Ketik: CPU");
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-7 space-y-6">
      <div>
        <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
          Tantangan 13: Laboratorium Warna Hex Web & Sandi Teks ASCII
        </span>
        <h2 className="text-xl md:text-2xl font-black text-white mt-1">
          {step === 'color' ? 'Misi 1: Susun Kode Warna Web Hex (#RRGGBB)' : 'Misi 2: Pecahkan Sandi ASCII Teks Komputer'}
        </h2>
      </div>

      {step === 'color' ? (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5">
          <p className="text-xs md:text-sm text-slate-300">
            Warna pada monitor komputer disusun oleh tiga warna dasar: <strong>Red (RR)</strong>, <strong>Green (GG)</strong>, dan <strong>Blue (BB)</strong>.
            Tuliskan kode heksadesimal 6 digit untuk warna gabungan <strong>Red Penuh (255)</strong> dan <strong>Blue Penuh (255)</strong> tanpa warna Green (0)!
          </p>

          <div className="flex items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-2xl shadow-xl border-2 border-white/20" style={{ backgroundColor: '#FF00FF' }} />
            <div className="text-left font-mono text-xs text-slate-400">
              <div>Red: 255 desimal = <strong>FF</strong></div>
              <div>Green: 0 desimal = <strong>00</strong></div>
              <div>Blue: 255 desimal = <strong>FF</strong></div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <input
              type="text"
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value.toUpperCase())}
              placeholder="Contoh: FF00FF"
              className="w-full sm:w-64 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-center text-lg uppercase focus:outline-none focus:border-sky-400"
              autoFocus
            />
            <button onClick={handleCheckColor} className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-sm">
              Periksa Warna Hex
            </button>
          </div>
          {err && <div className="text-xs text-rose-400 text-center bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30">{err}</div>}
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5">
          <p className="text-xs md:text-sm text-slate-300">
            Tabel ASCII mengaitkan setiap karakter dengan kode numerik. Komputer menyimpan teks berikut dalam byte heksadesimal:
            <span className="font-mono text-amber-300 font-bold ml-2 text-base">43₁₆ 50₁₆ 55₁₆</span>.
            Terjemahkan menjadi kata teks 3 huruf rahasia!
          </p>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 max-w-md mx-auto text-xs text-slate-300 font-mono space-y-1">
            <div className="font-bold text-sky-400">Katalog ASCII Terpilih:</div>
            <div>41₁₆ = A | 42₁₆ = B | 43₁₆ = C</div>
            <div>50₁₆ = P | 51₁₆ = Q | 52₁₆ = R</div>
            <div>53₁₆ = S | 54₁₆ = T | 55₁₆ = U</div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <input
              type="text"
              value={asciiInput}
              onChange={(e) => setAsciiInput(e.target.value.toUpperCase())}
              placeholder="Ketik kata teks..."
              className="w-full sm:w-64 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-center text-lg uppercase tracking-widest focus:outline-none focus:border-emerald-400"
              autoFocus
            />
            <button onClick={handleCheckAscii} className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm">
              Buka Kunci Teks
            </button>
          </div>
          {err && <div className="text-xs text-rose-400 text-center bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30">{err}</div>}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// LEVEL 20: GRAND MASTER ARITMETIKA & KONVERSI MULTI-BASIS
// ============================================================================
export function Level20GrandMasterMultiBase({ onWin }: ChallengeProps) {
  // Phase 1: Penjumlahan biner di ALU: 1011₂ + 0110₂ = 10001₂ (11 + 6 = 17)
  // Phase 2: Konversi multi-basis cepat
  const [phase, setPhase] = useState<'alu' | 'multibase'>('alu');
  const [binSumAns, setBinSumAns] = useState('');
  const [hexFinalAns, setHexFinalAns] = useState('');
  const [err, setErr] = useState('');
  const [mistakes, setMistakes] = useState(0);

  const handleCheckALU = () => {
    // 1011 (11) + 0110 (6) = 10001 (17)
    if (binSumAns.trim() === '10001') {
      setErr('');
      setPhase('multibase');
    } else {
      setMistakes((m) => m + 1);
      setErr('Hasil penjumlahan biner belum tepat. 11₁₀ + 6₁₀ = 17₁₀ -> 10001₂.');
    }
  };

  const handleCheckFinal = () => {
    // Berapa nilai Hex dari 10001₂ (17 desimal) -> 11₁₆ (karena 1*16 + 1 = 17)
    if (hexFinalAns.trim().toUpperCase() === '11') {
      const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      onWin(
        100 - mistakes * 10,
        stars,
        'SELAMAT! Anda resmi menjadi Grand Master Sistem Komputer! Semua konsep arsitektur, perangkat keras, sistem bilangan desimal, biner, oktal, dan heksadesimal telah Anda kuasai dengan sempurna!'
      );
    } else {
      setMistakes((m) => m + 1);
      setErr('17₁₀ dalam heksadesimal adalah 11₁₆ (16 + 1 = 17).');
    }
  };

  return (
    <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black">
          <Sparkles className="w-4 h-4" />
          <span>UJIAN AKHIR LEVEL 20: GRAND MASTER KOMPUTER</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white">
          {phase === 'alu' ? 'Tahap 1: Operasi Aritmetika Biner ALU Komputer' : 'Tahap 2: Grand Converter Multi-Basis'}
        </h2>
      </div>

      {phase === 'alu' ? (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 max-w-xl mx-auto space-y-5">
          <p className="text-xs md:text-sm text-slate-300 text-center">
            ALU (Arithmetic Logic Unit) pada prosesor menjumlahkan dua bilangan biner 4-bit:
          </p>

          <div className="font-mono text-center text-2xl font-black text-sky-400 bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
            <div>&nbsp;&nbsp;1011₂ &nbsp;(11₁₀)</div>
            <div>+ 0110₂ &nbsp;(6₁₀)</div>
            <div className="border-t-2 border-slate-700 w-48 mx-auto my-1" />
            <div className="text-amber-300">?</div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <input
              type="text"
              value={binSumAns}
              onChange={(e) => setBinSumAns(e.target.value.trim())}
              placeholder="Ketik biner hasil (misal: 10001)..."
              className="w-full sm:w-64 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-center text-lg focus:outline-none focus:border-amber-400"
              autoFocus
            />
            <button onClick={handleCheckALU} className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm">
              Eksekusi ALU
            </button>
          </div>
          {err && <div className="text-xs text-rose-400 text-center bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30">{err}</div>}
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 max-w-xl mx-auto space-y-5">
          <p className="text-xs md:text-sm text-slate-300 text-center">
            Hasil biner ALU tadi adalah <strong className="text-sky-300">10001₂</strong> (17 desimal).
            Berapakah representasi bilangan tersebut dalam basis <strong>Heksadesimal (Basis 16)</strong>?
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <input
              type="text"
              value={hexFinalAns}
              onChange={(e) => setHexFinalAns(e.target.value.toUpperCase().trim())}
              placeholder="Ketik nilai heksadesimal..."
              className="w-full sm:w-64 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-center text-lg uppercase focus:outline-none focus:border-emerald-400"
              autoFocus
            />
            <button onClick={handleCheckFinal} className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl">
              KLAIM GELAR GRAND MASTER
            </button>
          </div>
          {err && <div className="text-xs text-rose-400 text-center bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30">{err}</div>}
        </div>
      )}
    </div>
  );
}

