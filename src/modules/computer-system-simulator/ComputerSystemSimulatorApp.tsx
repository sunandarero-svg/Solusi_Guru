'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Cpu,
  HardDrive,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Award,
  Star,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  BookOpen,
  Gamepad2,
  Sliders,
  User,
  GraduationCap,
  Layers,
  Zap,
  ArrowRight,
  Trash2,
  FolderOpen,
  Save,
  Home,
  Compass,
  RefreshCw,
  FileText,
  Eye,
  EyeOff,
  Check,
  Lock,
  Unlock,
  Settings,
  Users,
  CheckSquare,
  Square,
  Search,
  ShieldAlert
} from 'lucide-react';
import {
  Level7BinaryBasics,
  Level8BinaryToDecimal,
  Level9DecimalToBinary,
  Level10OctalToDecimal,
  Level11BinaryToOctal,
  Level12HexBasics,
  Level13HexToDecimal,
  Level14DecimalToHex,
  Level15BinaryToHex,
  Level16HexToBinary,
  Level17HexToOctal,
  Level18OctalToHex,
  Level19HexColorAscii,
  Level20GrandMasterMultiBase
} from './levels/NumberSystemChallenges';

// ============================================================================
// WEB AUDIO SYNTHESIZER (Tanpa file eksternal, berjalan di semua browser)
// ============================================================================
class SoundEffects {
  ctx: AudioContext | null;
  enabled: boolean;
  bgmEnabled: boolean;
  bgmInterval: ReturnType<typeof setInterval> | null;

  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.bgmEnabled = false;
    this.bgmInterval = null;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq: number, type: OscillatorType = 'sine', duration = 0.12, volume = 0.12, delay = 0) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Ignore audio context errors on restricted devices
    }
  }

  click() { this.playTone(520, 'triangle', 0.06, 0.1); }
  keyPress() { this.playTone(680, 'sine', 0.05, 0.08); }
  flip() { this.playTone(400, 'sine', 0.08, 0.09); this.playTone(600, 'sine', 0.08, 0.09, 0.05); }
  correct() { this.playTone(523.25, 'triangle', 0.12, 0.15, 0); this.playTone(659.25, 'triangle', 0.12, 0.15, 0.1); this.playTone(783.99, 'triangle', 0.2, 0.15, 0.2); }
  wrong() { this.playTone(240, 'sawtooth', 0.16, 0.12, 0); this.playTone(180, 'sawtooth', 0.22, 0.12, 0.14); }
  saveFile() { this.playTone(440, 'sine', 0.08, 0.12, 0); this.playTone(554.37, 'sine', 0.08, 0.12, 0.08); this.playTone(659.25, 'sine', 0.14, 0.12, 0.16); }
  deleteFile() { this.playTone(400, 'triangle', 0.08, 0.1, 0); this.playTone(260, 'triangle', 0.15, 0.1, 0.08); }
  levelWin() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => { this.playTone(n, 'triangle', 0.18, 0.16, idx * 0.11); });
  }

  toggleBgm(turnOn: boolean) {
    this.bgmEnabled = turnOn;
    if (this.bgmInterval) { clearInterval(this.bgmInterval); this.bgmInterval = null; }
    if (turnOn && this.enabled) {
      const melody = [261.63, 329.63, 392.0, 329.63, 293.66, 349.23, 440.0, 349.23];
      let step = 0;
      this.bgmInterval = setInterval(() => {
        if (this.enabled && this.bgmEnabled) { this.playTone(melody[step % melody.length], 'sine', 0.35, 0.03); step++; }
      }, 650);
    }
  }
}

const sfx = new SoundEffects();

// ============================================================================
// CUSTOM SVG HARDWARE ILLUSTRATIONS
// ============================================================================
interface HardwareSVGProps {
  type: string;
  active?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const HardwareSVG: React.FC<HardwareSVGProps> = ({ type, active = false, size = 'md', animate = false }) => {
  const sizeClass = size === 'sm' ? 'w-14 h-14' : size === 'lg' ? 'w-28 h-28' : 'w-20 h-20';
  const glowClass = active ? 'drop-shadow-[0_0_12px_rgba(56,189,248,0.85)]' : '';

  switch (type) {
    case 'keyboard':
      return (
        <svg viewBox="0 0 100 70" className={`${sizeClass} ${glowClass} transition-all duration-300`}>
          <rect x="6" y="16" width="88" height="44" rx="7" fill="#1e293b" stroke={active ? '#38bdf8' : '#64748b'} strokeWidth="3" />
          <path d="M50 16 V6 Q50 2 62 2" fill="none" stroke={active ? '#38bdf8' : '#94a3b8'} strokeWidth="2.5" strokeDasharray={animate ? '3 2' : 'none'} />
          {[0, 1, 2].map((row) =>
            [0, 1, 2, 3, 4, 5, 6].map((col) => (
              <rect key={`${row}-${col}`} x={13 + col * 11} y={22 + row * 10} width="8" height="7" rx="1.5" fill={animate && (row + col) % 3 === 0 ? '#38bdf8' : '#cbd5e1'} />
            ))
          )}
          <rect x="26" y="51" width="48" height="6" rx="2" fill={active ? '#38bdf8' : '#94a3b8'} />
        </svg>
      );
    case 'mouse':
      return (
        <svg viewBox="0 0 80 80" className={`${sizeClass} ${glowClass} transition-all duration-300`}>
          <path d="M40 16 V4" stroke={active ? '#38bdf8' : '#94a3b8'} strokeWidth="2.5" fill="none" />
          <rect x="22" y="16" width="36" height="54" rx="18" fill="#1e293b" stroke={active ? '#38bdf8' : '#64748b'} strokeWidth="3" />
          <line x1="40" y1="16" x2="40" y2="38" stroke="#64748b" strokeWidth="2" />
          <line x1="22" y1="38" x2="58" y2="38" stroke="#64748b" strokeWidth="2" />
          <rect x="37" y="22" width="6" height="11" rx="3" fill={active || animate ? '#38bdf8' : '#f43f5e'} />
          {animate && <circle cx="40" cy="24" r="14" fill="none" stroke="#38bdf8" strokeWidth="1.5" className="animate-ping" />}
        </svg>
      );
    case 'mic':
      return (
        <svg viewBox="0 0 80 80" className={`${sizeClass} ${glowClass} transition-all duration-300`}>
          <rect x="28" y="12" width="24" height="36" rx="12" fill="#334155" stroke={active ? '#38bdf8' : '#94a3b8'} strokeWidth="3" />
          <path d="M20 34 A20 20 0 0 0 60 34" fill="none" stroke={active ? '#38bdf8' : '#cbd5e1'} strokeWidth="3" />
          <line x1="40" y1="54" x2="40" y2="68" stroke="#cbd5e1" strokeWidth="3" />
          <line x1="26" y1="68" x2="54" y2="68" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
          {animate && (
            <>
              <circle cx="40" cy="30" r="24" fill="none" stroke="#38bdf8" strokeWidth="1.5" className="animate-ping" />
              <line x1="32" y1="24" x2="48" y2="24" stroke="#38bdf8" strokeWidth="2" />
              <line x1="32" y1="32" x2="48" y2="32" stroke="#38bdf8" strokeWidth="2" />
            </>
          )}
        </svg>
      );
    case 'scanner':
      return (
        <svg viewBox="0 0 90 75" className={`${sizeClass} ${glowClass} transition-all duration-300`}>
          <rect x="10" y="34" width="70" height="28" rx="5" fill="#1e293b" stroke={active ? '#38bdf8' : '#64748b'} strokeWidth="3" />
          <path d="M12 34 L22 12 H76 L68 34 Z" fill="#334155" stroke="#94a3b8" strokeWidth="2.5" />
          <rect x="22" y="38" width="46" height="16" rx="2" fill="#0f172a" />
          <line x1="24" y1={animate ? 42 : 46} x2="66" y2={animate ? 42 : 46} stroke="#22d3ee" strokeWidth="3" className={animate ? 'animate-pulse' : ''} />
        </svg>
      );
    case 'webcam':
      return (
        <svg viewBox="0 0 80 80" className={`${sizeClass} ${glowClass} transition-all duration-300`}>
          <circle cx="40" cy="36" r="22" fill="#1e293b" stroke={active ? '#38bdf8' : '#94a3b8'} strokeWidth="3" />
          <circle cx="40" cy="36" r="11" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
          <circle cx="37" cy="33" r="3" fill="#e0f2fe" />
          <circle cx="54" cy="24" r="2.5" fill={animate || active ? '#22c55e' : '#64748b'} />
          <path d="M24 64 Q40 54 56 64" fill="none" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );
    case 'touchscreen':
      return (
        <svg viewBox="0 0 90 75" className={`${sizeClass} ${glowClass} transition-all duration-300`}>
          <rect x="12" y="10" width="66" height="52" rx="7" fill="#0f172a" stroke={active ? '#38bdf8' : '#94a3b8'} strokeWidth="3" />
          <rect x="18" y="16" width="54" height="40" rx="4" fill="#1e293b" />
          <circle cx="45" cy="36" r="8" fill="#38bdf8" fillOpacity="0.35" stroke="#38bdf8" strokeWidth="2" />
          {animate && <circle cx="45" cy="36" r="15" fill="none" stroke="#38bdf8" strokeWidth="1.5" className="animate-ping" />}
          <path d="M45 36 L52 54 L44 56 Z" fill="#fde047" />
        </svg>
      );
    case 'cpu':
      return (
        <svg viewBox="0 0 90 90" className={`${sizeClass} ${glowClass} transition-all duration-300`}>
          {[22, 36, 50, 64].map((pos) => (
            <g key={pos} stroke={active || animate ? '#fbbf24' : '#94a3b8'} strokeWidth="3" strokeLinecap="round">
              <line x1={pos} y1="6" x2={pos} y2="16" />
              <line x1={pos} y1="74" x2={pos} y2="84" />
              <line x1="6" y1={pos} x2="16" y2={pos} />
              <line x1="74" y1={pos} x2="84" y2={pos} />
            </g>
          ))}
          <rect x="16" y="16" width="58" height="58" rx="8" fill="#0f172a" stroke={active ? '#fbbf24' : '#64748b'} strokeWidth="3.5" />
          <rect x="26" y="26" width="38" height="38" rx="5" fill={animate ? '#1e3a8a' : '#1e293b'} stroke="#38bdf8" strokeWidth="2" />
          <text x="45" y="49" textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="bold" fontFamily="monospace">CPU</text>
          {animate && <rect x="23" y="23" width="44" height="44" rx="6" fill="none" stroke="#fbbf24" strokeWidth="2" className="animate-pulse" />}
        </svg>
      );
    case 'ram':
      return (
        <svg viewBox="0 0 95 70" className={`${sizeClass} ${glowClass} transition-all duration-300`}>
          <rect x="8" y="18" width="79" height="32" rx="4" fill="#065f46" stroke={active ? '#34d399' : '#10b981'} strokeWidth="2.5" />
          {[16, 32, 48, 64].map((x) => (<rect key={x} x={x} y="23" width="11" height="18" rx="1.5" fill="#1e293b" stroke="#6ee7b7" strokeWidth="1" />))}
          {[14, 22, 30, 38, 52, 60, 68, 76].map((x) => (<rect key={x} x={x} y="50" width="4" height="6" fill="#fbbf24" />))}
        </svg>
      );
    case 'gpu':
      return (
        <svg viewBox="0 0 95 75" className={`${sizeClass} ${glowClass} transition-all duration-300`}>
          <rect x="10" y="18" width="75" height="40" rx="6" fill="#1e1b4b" stroke={active ? '#a855f7' : '#6366f1'} strokeWidth="3" />
          <circle cx="32" cy="38" r="13" fill="#0f172a" stroke="#c084fc" strokeWidth="2" />
          <circle cx="63" cy="38" r="13" fill="#0f172a" stroke="#c084fc" strokeWidth="2" />
          <circle cx="32" cy="38" r="4" fill="#a855f7" />
          <circle cx="63" cy="38" r="4" fill="#a855f7" />
        </svg>
      );
    case 'monitor':
      return (
        <svg viewBox="0 0 95 85" className={`${sizeClass} ${glowClass} transition-all duration-300`}>
          <rect x="10" y="10" width="75" height="50" rx="6" fill="#1e293b" stroke={active ? '#38bdf8' : '#94a3b8'} strokeWidth="3" />
          <rect x="16" y="16" width="63" height="38" rx="3" fill={active || animate ? '#0284c7' : '#0f172a'} />
          {animate ? (
            <text x="47" y="39" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="monospace">HASIL: OK</text>
          ) : (
            <path d="M24 44 L36 28 L48 38 L60 24 L72 44" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
          )}
          <rect x="41" y="60" width="13" height="11" fill="#64748b" />
          <rect x="28" y="71" width="39" height="5" rx="2.5" fill="#94a3b8" />
        </svg>
      );
    case 'printer':
      return (
        <svg viewBox="0 0 90 85" className={`${sizeClass} ${glowClass} transition-all duration-300`}>
          <rect x="24" y="10" width="42" height="18" rx="2" fill="#e2e8f0" stroke="#64748b" strokeWidth="2" />
          <rect x="12" y="26" width="66" height="32" rx="6" fill="#1e293b" stroke={active ? '#38bdf8' : '#94a3b8'} strokeWidth="3" />
          <circle cx="64" cy="38" r="3" fill="#22c55e" />
          <rect x="24" y={animate ? 52 : 48} width="42" height="24" rx="2" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
          <line x1="30" y1="58" x2="60" y2="58" stroke="#334155" strokeWidth="2" />
          <line x1="30" y1="64" x2="52" y2="64" stroke="#334155" strokeWidth="2" />
        </svg>
      );
    case 'speaker':
      return (
        <svg viewBox="0 0 85 85" className={`${sizeClass} ${glowClass} transition-all duration-300`}>
          <rect x="18" y="12" width="44" height="62" rx="7" fill="#1e293b" stroke={active ? '#38bdf8' : '#94a3b8'} strokeWidth="3" />
          <circle cx="40" cy="28" r="7" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
          <circle cx="40" cy="52" r="13" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
          <circle cx="40" cy="52" r="5" fill="#38bdf8" />
          {animate && (
            <>
              <path d="M66 34 Q76 44 66 54" fill="none" stroke="#38bdf8" strokeWidth="2.5" className="animate-ping" />
              <path d="M72 28 Q84 44 72 60" fill="none" stroke="#22d3ee" strokeWidth="2" />
            </>
          )}
        </svg>
      );
    case 'projector':
      return (
        <svg viewBox="0 0 95 75" className={`${sizeClass} ${glowClass} transition-all duration-300`}>
          <rect x="12" y="26" width="58" height="28" rx="6" fill="#1e293b" stroke={active ? '#38bdf8' : '#94a3b8'} strokeWidth="3" />
          <circle cx="54" cy="40" r="9" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
          <circle cx="54" cy="40" r="4" fill="#bae6fd" />
          {animate && <polygon points="63,36 92,20 92,60 63,44" fill="#38bdf8" fillOpacity="0.35" />}
        </svg>
      );
    case 'ssd':
      return (
        <svg viewBox="0 0 90 75" className={`${sizeClass} ${glowClass} transition-all duration-300`}>
          <rect x="14" y="14" width="62" height="48" rx="6" fill="#0f172a" stroke={active ? '#10b981' : '#64748b'} strokeWidth="3" />
          <rect x="22" y="22" width="46" height="24" rx="4" fill="#065f46" />
          <text x="45" y="38" textAnchor="middle" fill="#ecfdf5" fontSize="12" fontWeight="bold" fontFamily="monospace">SSD</text>
          <rect x="26" y="52" width="22" height="5" rx="1" fill="#fbbf24" />
          <circle cx="64" cy="54" r="3" fill={animate || active ? '#10b981' : '#475569'} />
        </svg>
      );
    case 'hdd':
      return (
        <svg viewBox="0 0 90 80" className={`${sizeClass} ${glowClass} transition-all duration-300`}>
          <rect x="16" y="10" width="58" height="60" rx="6" fill="#1e293b" stroke={active ? '#10b981' : '#94a3b8'} strokeWidth="3" />
          <circle cx="45" cy="36" r="18" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
          <circle cx="45" cy="36" r="5" fill="#1e293b" />
          <path d="M45 36 L60 56 L52 60 Z" fill="#f59e0b" />
        </svg>
      );
    case 'flashdisk':
      return (
        <svg viewBox="0 0 90 70" className={`${sizeClass} ${glowClass} transition-all duration-300`}>
          <rect x="14" y="25" width="20" height="20" rx="2" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
          <rect x="19" y="29" width="5" height="4" fill="#1e293b" />
          <rect x="19" y="37" width="5" height="4" fill="#1e293b" />
          <rect x="34" y="20" width="44" height="30" rx="8" fill="#0284c7" stroke={active ? '#38bdf8' : '#0369a1'} strokeWidth="3" />
          <circle cx="68" cy="35" r="3.5" fill={animate ? '#fde047' : '#e0f2fe'} />
        </svg>
      );
    case 'sdcard':
      return (
        <svg viewBox="0 0 80 80" className={`${sizeClass} ${glowClass} transition-all duration-300`}>
          <path d="M22 12 H52 L62 22 V68 H22 Z" fill="#1e293b" stroke={active ? '#10b981' : '#94a3b8'} strokeWidth="3" />
          {[28, 35, 42, 49].map((x) => (<rect key={x} x={x} y="17" width="4" height="10" rx="1" fill="#fbbf24" />))}
          <text x="42" y="52" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">SD</text>
        </svg>
      );
    default:
      return <Cpu className="w-12 h-12 text-sky-400" />;
  }
};

// ============================================================================
// DATA FLASHCARD UNIK UNTUK SETIAP LEVEL (Level 1 s/d Level 20)
// ============================================================================
interface FlashcardData {
  id: string;
  category: string;
  title: string;
  svgType: string;
  summary: string;
  dailyExample: string;
  animText: string;
}

interface LevelData {
  id: number;
  title: string;
  subtitle: string;
  badgeName: string;
  description: string;
  flashcards: FlashcardData[];
}

const LEVEL_DATA: LevelData[] = [
  {
    id: 1, title: 'Kenali Perangkat Komputer', subtitle: 'Identifikasi Input, Processing, Output, dan Storage Device', badgeName: 'Pengenal Perangkat Andal',
    description: 'Pelajari 4 kategori utama perangkat keras komputer dan kelompokkan setiap komponen ke dalam tempat yang tepat.',
    flashcards: [
      { id: 'l1-c1', category: 'Input Device (Perangkat Masukan)', title: 'Keyboard & Mouse', svgType: 'keyboard', summary: 'Keyboard dan Mouse adalah perangkat masukan (Input Device) yang digunakan untuk memasukkan huruf, angka, simbol, dan perintah klik ke dalam komputer.', dailyExample: 'Mengetik tugas sekolah di pengolah kata atau mengklik tombol pada layar game edukasi.', animText: 'Tombol ditekan → Sinyal karakter dikirim ke komputer' },
      { id: 'l1-c2', category: 'Processing Device (Perangkat Pemrosesan)', title: 'CPU (Central Processing Unit)', svgType: 'cpu', summary: 'CPU adalah komponen pemrosesan utama (otak komputer) yang menjalankan instruksi dan mengolah data yang masuk.', dailyExample: 'Saat kamu menghitung 25 × 4 di kalkulator komputer, CPU yang menghitung jawabannya.', animText: 'Menerima instruksi → Mengolah di ALU/CU → Menghasilkan informasi' },
      { id: 'l1-c3', category: 'Output Device (Perangkat Keluaran)', title: 'Monitor & Printer', svgType: 'monitor', summary: 'Monitor menampilkan informasi hasil olahan komputer secara visual di layar, sedangkan Printer mencetaknya ke kertas.', dailyExample: 'Melihat gambar/video pembelajaran di layar monitor atau mencetak laporan tugas.', animText: 'Data hasil olahan CPU → Ditampilkan menjadi gambar atau teks' },
      { id: 'l1-c4', category: 'Storage Device (Perangkat Penyimpanan)', title: 'SSD & Flashdisk', svgType: 'ssd', summary: 'SSD (Solid State Drive) dan Flashdisk digunakan untuk menyimpan sistem operasi, aplikasi, dan file agar dapat dibuka kembali kapan saja.', dailyExample: 'Menyimpan file "Tugas_Informatika.txt" agar tidak hilang saat komputer dimatikan.', animText: 'Menyimpan file permanen ↔ Membaca kembali file saat dibutuhkan' },
      { id: 'l1-c5', category: 'Hubungan Antarkomponen', title: 'Kerja Sama 4 Komponen', svgType: 'cpu', summary: 'Keyboard memasukkan data (Input), CPU mengolah data (Processing), Monitor menampilkan hasil (Output), dan SSD menyimpan data (Storage).', dailyExample: 'Seluruh komponen saling terhubung agar komputer dapat membantu pekerjaan manusia.', animText: 'INPUT → PROCESSING → OUTPUT (+ STORAGE)' }
    ]
  },
  {
    id: 2, title: 'Susun Alur Sistem Komputer', subtitle: 'Pahami Urutan Pengolahan Data dan Peran Storage', badgeName: 'Arsitek Alur Data',
    description: 'Susun urutan perjalanan data mulai dari perangkat masukan, pemrosesan di CPU, tampilan di keluaran, hingga penyimpanan.',
    flashcards: [
      { id: 'l2-c1', category: 'Tahap 1: Data Masuk (Input)', title: 'Awal Perjalanan Data', svgType: 'keyboard', summary: 'Alur sistem komputer selalu diawali dari Input atau pengambilan data. Tanpa input, CPU tidak memiliki data baru dari pengguna untuk diolah.', dailyExample: 'Pengguna menekan huruf pada keyboard atau memindai gambar menggunakan scanner.', animText: 'Pengguna → Perangkat Input → Sinyal Digital' },
      { id: 'l2-c2', category: 'Tahap 2: Pengolahan (Processing)', title: 'Pusat Kendali di CPU', svgType: 'cpu', summary: 'Data dari perangkat input TIDAK langsung ke monitor, melainkan harus dikirim ke CPU terlebih dahulu untuk diterjemahkan dan diproses.', dailyExample: 'CPU menerjemahkan kode tombol keyboard menjadi huruf yang siap ditampilkan.', animText: 'Input Data → Masuk ke CPU → Diolah sesuai instruksi' },
      { id: 'l2-c3', category: 'Tahap 3: Menampilkan Hasil (Output)', title: 'Informasi untuk Pengguna', svgType: 'monitor', summary: 'Setelah selesai diolah CPU, hasilnya dikirim ke perangkat Output seperti Monitor atau Speaker agar dapat dilihat atau didengar manusia.', dailyExample: 'Huruf yang diketik muncul di layar monitor hanya dalam hitungan milidetik.', animText: 'CPU selesai mengolah → Dikirim ke Monitor → Tampil di layar' },
      { id: 'l2-c4', category: 'Peran Storage: Menyimpan Data', title: 'Menyimpan Hasil ke SSD', svgType: 'ssd', summary: 'Jika pengguna memilih perintah Simpan (Save), CPU akan mengirimkan data hasil olahan ke Storage (SSD/HDD) agar tersimpan permanen.', dailyExample: 'Menekan Ctrl+S setelah selesai mengetik dokumen di komputer.', animText: 'Keyboard → CPU → SSD (Tersimpan Permanen)' },
      { id: 'l2-c5', category: 'Peran Storage: Membaca Data', title: 'Membuka File Lama dari SSD', svgType: 'flashdisk', summary: 'Saat membuka file lama, data diambil dari Storage (SSD/Flashdisk) menuju CPU untuk diproses, lalu ditampilkan ke Monitor.', dailyExample: 'Membuka kembali file tugas minggu lalu dari SSD untuk ditampilkan di layar.', animText: 'SSD (Baca Data) → CPU (Proses) → Monitor (Tampil)' }
    ]
  },
  {
    id: 3, title: 'Simulasi Input dan Output', subtitle: 'Eksperimen Mengetik, Menghitung, dan Mengeluarkan Informasi', badgeName: 'Ahli Input-Output',
    description: 'Praktikkan langsung bagaimana ketikan teks dan angka di keyboard diproses oleh CPU dan ditampilkan oleh perangkat keluaran.',
    flashcards: [
      { id: 'l3-c1', category: 'Simulasi Teks', title: 'Mengetik Kata pada Keyboard', svgType: 'keyboard', summary: 'Setiap tombol huruf yang kamu ketuk pada keyboard mengirimkan kode karakter ke CPU untuk dirangkai menjadi kata pada layar.', dailyExample: 'Mengetik kata "INFORMATIKA" satu per satu hingga tampil utuh di monitor.', animText: 'Ketuk I-N-F-O... → CPU merangkai karakter → Layar menampilkan teks' },
      { id: 'l3-c2', category: 'Simulasi Perhitungan (ALU)', title: 'Operasi Penjumlahan di CPU', svgType: 'cpu', summary: 'Di dalam CPU terdapat bagian Arithmetic Logic Unit (ALU) yang bertugas menghitung operasi matematika seperti penjumlahan.', dailyExample: 'Memasukkan angka 10 dan 5, lalu CPU menjumlahkannya menjadi 15.', animText: 'Input: 10 + 5 → CPU menghitung → Output Monitor: 15' },
      { id: 'l3-c3', category: 'Output Visual', title: 'Monitor & Proyektor', svgType: 'projector', summary: 'Monitor menampilkan grafik dan teks untuk penggunaan dekat, sedangkan Proyektor memancarkan tampilan ke layar besar di kelas.', dailyExample: 'Guru menampilkan slide presentasi materi sistem komputer di depan kelas.', animText: 'Sinyal video dari CPU/GPU → Dipancarkan menjadi tampilan visual' },
      { id: 'l3-c4', category: 'Output Cetak', title: 'Mencetak Dokumen dengan Printer', svgType: 'printer', summary: 'Printer mengubah data digital dari komputer menjadi cetakan fisik (hardcopy) di atas lembaran kertas.', dailyExample: 'Mencetak sertifikat atau lembar tugas sekolah setelah selesai diketik.', animText: 'Perintah Cetak → CPU kirim data → Kertas keluar bertahap dari Printer' },
      { id: 'l3-c5', category: 'Output Audio', title: 'Suara dari Speaker', svgType: 'speaker', summary: 'Speaker mengubah sinyal audio digital hasil olahan komputer menjadi gelombang suara yang dapat didengar telinga kita.', dailyExample: 'Mendengarkan efek suara game edukasi atau musik pembelajaran.', animText: 'Data Audio Digital → Speaker bergetar → Gelombang Suara' }
    ]
  },
  {
    id: 4, title: 'Misi Penyimpanan File', subtitle: 'Simpan, Baca, dan Kelola File di Perangkat Storage', badgeName: 'Master Storage',
    description: 'Pelajari perbedaan berbagai perangkat penyimpanan serta bedakan proses menulis (menyimpan), membaca (membuka), dan menghapus data.',
    flashcards: [
      { id: 'l4-c1', category: 'Penyimpanan Utama Cepat', title: 'SSD (Solid State Drive)', svgType: 'ssd', summary: 'SSD menyimpan data menggunakan chip memori flash tanpa piringan berputar, sehingga proses menyimpan dan membuka file sangat cepat.', dailyExample: 'Komputer dengan SSD menyala (booting) dan membuka aplikasi dalam hitungan detik.', animText: 'Kecepatan Tinggi • Tahan Guncangan • Penyimpanan Utama' },
      { id: 'l4-c2', category: 'Penyimpanan Kapasitas Besar', title: 'HDD (Hard Disk Drive)', svgType: 'hdd', summary: 'HDD menggunakan piringan magnetik berputar untuk menyimpan data berukuran besar dengan harga yang lebih terjangkau.', dailyExample: 'Menyimpan cadangan (backup) ratusan video dokumentasi kegiatan sekolah.', animText: 'Piringan Magnetik Berputar • Kapasitas Besar' },
      { id: 'l4-c3', category: 'Penyimpanan Portabel', title: 'Flashdisk & Kartu Memori (SD Card)', svgType: 'flashdisk', summary: 'Flashdisk dan Kartu Memori berukuran kecil sehingga praktis dibawa untuk memindahkan file antarperangkat.', dailyExample: 'Membawa file presentasi kelompok dari rumah ke komputer laboratorium sekolah.', animText: 'Mudah Dibawa (Portabel) • Pasang lewat port USB / Slot SD' },
      { id: 'l4-c4', category: 'Proses Menyimpan (Write) vs Membaca (Read)', title: 'Perbedaan Menyimpan dan Membuka File', svgType: 'ssd', summary: 'Menyimpan (Write) berarti mengirim data DARI CPU KE Storage. Membaca (Read) berarti mengambil data DARI Storage KE CPU untuk ditampilkan.', dailyExample: 'Menyimpan "Tugas_Informatika.txt" (Write) lalu membukanya keesokan hari (Read).', animText: 'WRITE: CPU ➔ Storage | READ: Storage ➔ CPU ➔ Monitor' },
      { id: 'l4-c5', category: 'Keamanan Penghapusan Data', title: 'Konfirmasi Sebelum Menghapus File', svgType: 'hdd', summary: 'Menghapus file akan menghilangkan data dari ruang penyimpanan. Sistem komputer menampilkan dialog konfirmasi agar pengguna tidak salah hapus.', dailyExample: 'Memeriksa kembali nama file pada kotak konfirmasi sebelum menekan tombol "Hapus".', animText: 'Pilih Hapus → Muncul Dialog Konfirmasi → File Dihapus' }
    ]
  },
  {
    id: 5, title: 'Perbaiki Komputer Bermasalah', subtitle: 'Analisis Gejala Kerusakan dan Temukan Solusinya', badgeName: 'Detektif Hardware',
    description: 'Jadilah teknisi analisis! Periksa gejala masalah pada komputer dan tentukan komponen atau jalur sistem yang perlu diperiksa.',
    flashcards: [
      { id: 'l5-c1', category: 'Gejala Masalah Input', title: 'Teks Tidak Muncul Saat Mengetik', svgType: 'keyboard', summary: 'Jika tombol ditekan tetapi huruf tidak masuk, penyebab utamanya bisa berasal dari koneksi Keyboard yang terlepas atau aplikasi yang belum aktif.', dailyExample: 'Memeriksa kabel USB keyboard atau memastikan kursor sudah diklik pada lembar kerja.', animText: 'Cek Koneksi Fisik Input → Cek Pengaturan Perangkat' },
      { id: 'l5-c2', category: 'Gejala Masalah Output Visual', title: 'Monitor Gelap / Tidak Menampilkan Gambar', svgType: 'monitor', summary: 'Layar gelap saat komputer menyala dapat disebabkan oleh tombol daya monitor belum aktif, kabel video (HDMI/VGA) longgar, atau gangguan GPU.', dailyExample: 'Memeriksa lampu indikator monitor dan kekencangan kabel HDMI ke komputer.', animText: 'Cek Daya Monitor → Cek Kabel Video → Cek Pemroses Grafis' },
      { id: 'l5-c3', category: 'Gejala Masalah Storage', title: 'File Tugas Tidak Dapat Ditemukan', svgType: 'ssd', summary: 'File yang hilang bisa terjadi karena belum disimpan ke Storage sebelum komputer mati, tersimpan di folder berbeda, atau Flashdisk belum terpasang.', dailyExample: 'Memeriksa apakah Flashdisk sudah tertancap dengan benar atau mencari di folder penyimpanan.', animText: 'Cek Perangkat Storage → Cek Lokasi Folder Penyimpanan' },
      { id: 'l5-c4', category: 'Gejala Masalah Processing', title: 'Komputer Lambat atau Membeku (Hang)', svgType: 'cpu', summary: 'Ketika terlalu banyak instruksi berat dijalankan sekaligus, beban kerja CPU dan RAM menjadi penuh atau suhu CPU terlalu panas (overheat).', dailyExample: 'Menutup aplikasi berat yang tidak diperlukan dan memastikan kipas pendingin CPU bekerja.', animText: 'Beban CPU/RAM 100% → Kurangi Beban Instruksi & Cek Pendingin' },
      { id: 'l5-c5', category: 'Prinsip Teknisi Komputer', title: 'Satu Gejala Bisa Memiliki Beberapa Penyebab', svgType: 'webcam', summary: 'Seorang teknisi yang baik memeriksa dari hal paling sederhana (kabel & koneksi perangkat terkait) sebelum menyimpulkan komponen rusak.', dailyExample: 'Suara tidak keluar? Periksa volume dan kabel Speaker dulu sebelum mengganti komponen.', animText: 'Amati Gejala → Analisis Fungsi Komponen → Uji Solusi' }
    ]
  },
  {
    id: 6, title: 'Bangun Sistem Komputer', subtitle: 'Rakit PC Sesuai Kebutuhan dan Anggaran Virtual', badgeName: 'Teknisi Komputer Junior',
    description: 'Misi Puncak! Pilih kombinasi perangkat Input, Processing, Output, dan Storage terbaik menggunakan anggaran virtual, lalu uji simulasinya.',
    flashcards: [
      { id: 'l6-c1', category: 'Syarat Sistem Komputer Lengkap', title: '4 Pilar Komponen Wajib', svgType: 'cpu', summary: 'Agar komputer dapat bekerja penuh untuk belajar, sistem harus memiliki perangkat Input, Processing, Output, dan Storage.', dailyExample: 'Tanpa salah satu komponen (misalnya tanpa Monitor atau tanpa CPU), komputer tidak dapat digunakan dengan normal.', animText: 'Wajib Ada: Input + Processing + Output + Storage' },
      { id: 'l6-c2', category: 'Memilih Perangkat Input & Output', title: 'Kenyamanan Interaksi Pengguna', svgType: 'monitor', summary: 'Pilih Keyboard & Mouse untuk memasukkan data tugas, serta Monitor yang jelas (dan Printer/Speaker sesuai kebutuhan misi).', dailyExample: 'Komputer siswa membutuhkan Keyboard-Mouse dan Monitor tajam agar nyaman mengerjakan tugas.', animText: 'Input Nyaman + Output Jelas = Produktivitas Belajar Optimal' },
      { id: 'l6-c3', category: 'Memilih Processing Device', title: 'Keseimbangan CPU dan RAM', svgType: 'ram', summary: 'Pilih CPU dan RAM yang mampu menjalankan sistem operasi dan aplikasi belajar dengan lancar tanpa melebihi anggaran.', dailyExample: 'Prosesor Quad-Core dengan RAM 8GB sudah sangat responsif untuk tugas sekolah dan simulasi.', animText: 'CPU Mengolah Instruksi + RAM Menyimpan Data Kerja Sementara' },
      { id: 'l6-c4', category: 'Memilih Storage Device', title: 'Kecepatan dan Kapasitas Penyimpanan', svgType: 'ssd', summary: 'Gunakan SSD agar sistem operasi dan file tugas cepat dibuka serta aman tersimpan.', dailyExample: 'SSD 256GB atau 512GB cukup untuk sistem operasi, aplikasi sekolah, dan ribuan dokumen tugas.', animText: 'SSD Cepat → Waktu Muat Singkat & Data Aman' },
      { id: 'l6-c5', category: 'Manajemen Anggaran & Pengujian', title: 'Hemat Biaya & Uji Simulasi Sistem', svgType: 'keyboard', summary: 'Teknisi cerdas memilih komponen yang memenuhi semua kebutuhan pengguna tanpa melampaui batas anggaran yang tersedia.', dailyExample: 'Setelah semua komponen terpasang, nyalakan simulasi untuk menguji alur Input → CPU → Output → Storage!', animText: 'Pilih Komponen → Cek Anggaran → Jalankan Simulasi Pengujian' }
    ]
  },
  {
    id: 7,
    title: 'Sistem Bilangan Biner & Desimal',
    subtitle: 'Bahasa Digital Komputer: Bit 0 dan 1 vs Desimal Basis 10',
    badgeName: 'Inisiator Bahasa Biner',
    description: 'Pahami bagaimana sirkuit komputer hanya memahami sinyal listrik On (1) dan Off (0), serta konsep dasar bobot perpangkatan 2.',
    flashcards: [
      { id: 'l7-c1', category: 'Sistem Bilangan Digital', title: 'Basis 10 (Desimal) vs Basis 2 (Biner)', svgType: 'cpu', summary: 'Manusia menggunakan sistem Desimal (basis 10: angka 0-9), sedangkan komputer menggunakan sistem Biner (basis 2: angka 0 dan 1).', dailyExample: 'Angka 10 pada desimal bernilai sepuluh, tetapi 10 pada biner bernilai dua.', animText: 'Desimal: 0-9 • Biner: 0 dan 1' },
      { id: 'l7-c2', category: 'Konsep Bit', title: 'Binary Digit (Bit)', svgType: 'cpu', summary: 'Bit adalah satuan data terkecil dalam komputer. Satu bit hanya bisa bernilai 0 (mati/low voltage) atau 1 (hidup/high voltage).', dailyExample: 'Sebuah saklar lampu: posisi OFF adalah 0, posisi ON adalah 1.', animText: 'OFF (0) ↔ ON (1)' },
      { id: 'l7-c3', category: 'Transistor Komputer', title: 'Miliaran Saklar dalam Prosesor', svgType: 'cpu', summary: 'Prosesor (CPU) tersusun dari miliaran transistor mikroskopis yang berfungsi sebagai saklar digital pengolah bit biner.', dailyExample: 'Saat CPU menghitung, jutaan transistor berpindah kondisi 0 dan 1 miliaran kali per detik.', animText: 'Transistor: Mengatur aliran arus listrik 0 dan 1' },
      { id: 'l7-c4', category: 'Bobot Nilai Tempat Biner', title: 'Perpangkatan Basis 2 (2ⁿ)', svgType: 'ram', summary: 'Setiap posisi bit dari kanan ke kiri memiliki bobot perpangkatan 2: 2⁰=1, 2¹=2, 2²=4, 2³=8, 2⁴=16, 2⁵=32, 2⁶=64, 2⁷=128.', dailyExample: 'Kombinasi bit 00001001 memiliki nilai aktif di bobot 8 dan 1, sehingga nilainya 8 + 1 = 9.', animText: 'Bobot: 128 • 64 • 32 • 16 • 8 • 4 • 2 • 1' },
      { id: 'l7-c5', category: 'Satuan Penyimpanan Data', title: 'Byte dan Kelipatannya', svgType: 'ssd', summary: '8 bit digabungkan menjadi 1 Byte. 1 Byte mampu menampung 256 variasi nilai (0 sampai 255) atau satu karakter huruf.', dailyExample: 'Satu huruf "A" yang diketik disimpan sebagai 1 Byte memori komputer.', animText: '8 Bit = 1 Byte • 1024 Byte = 1 KB' }
    ]
  },
  {
    id: 8,
    title: 'Konversi Biner ke Desimal',
    subtitle: 'Menghitung Nilai Posisi Bobot Pangkat Dua (2ⁿ)',
    badgeName: 'Penerjemah Biner Mahir',
    description: 'Pelajari rumus posisi bobot perpangkatan dua untuk mengonversi deretan biner apa pun menjadi angka desimal dengan cepat.',
    flashcards: [
      { id: 'l8-c1', category: 'Teknik Konversi', title: 'Metode Penjumlahan Bobot', svgType: 'cpu', summary: 'Untuk mengubah biner ke desimal, kalikan setiap digit bit (0 atau 1) dengan bobot posisinya (2ⁿ), lalu jumlahkan semuanya.', dailyExample: 'Biner 1011₂ = (1×8) + (0×4) + (1×2) + (1×1) = 8 + 0 + 2 + 1 = 11₁₀.', animText: 'Bit × Bobot Posisi ➔ Jumlahkan Semua' },
      { id: 'l8-c2', category: 'Identifikasi Bit', title: 'MSB dan LSB', svgType: 'ram', summary: 'Bit paling kanan disebut LSB (Least Significant Bit) dengan bobot 2⁰=1. Bit paling kiri disebut MSB (Most Significant Bit) dengan bobot terbesar.', dailyExample: 'Pada biner 1000, bit 1 adalah MSB bernilai 8, sedangkan bit 0 paling kanan adalah LSB bernilai 1.', animText: 'MSB (Kiri, Bobot Terbesar) ➔ LSB (Kanan, Bobot 1)' },
      { id: 'l8-c3', category: 'Contoh Praktis', title: 'Menghitung 1111₂ (Semua Bit Aktif)', svgType: 'cpu', summary: 'Jika 4 bit semuanya bernilai 1 (1111₂), nilai desimalnya adalah 8 + 4 + 2 + 1 = 15₁₀.', dailyExample: '15 adalah nilai maksimal yang bisa disimpan dalam 4 bit data (1 nibble).', animText: '1111₂ = 8 + 4 + 2 + 1 = 15₁₀' },
      { id: 'l8-c4', category: 'Aplikasi Komputer', title: 'Pembacaan Instruksi Mesin', svgType: 'ssd', summary: 'Komputer membaca instruksi program sebagai biner, lalu sirkuit perangkat keras menerjemahkannya ke angka dan perintah nyata.', dailyExample: 'Instruksi ADD, SUB, dan JUMP disimpan dalam memori sebagai kumpulan biner.', animText: 'Kode Biner ➔ Diterjemahkan Sirkuit CPU ➔ Eksekusi' },
      { id: 'l8-c5', category: 'Tips Cepat', title: 'Abaikan Bit Bernilai Nol', svgType: 'gpu', summary: 'Karena 0 dikali berapa pun bernilai 0, kamu cukup menjumlahkan bobot nilai tempat yang memiliki bit bernilai 1 saja.', dailyExample: '100001₂: cukup hitung 32 + 1 = 33₁₀. Sangat cepat dan menghemat waktu!', animText: 'Hanya hitung bobot bit yang bernilai 1' }
    ]
  },
  {
    id: 9,
    title: 'Konversi Desimal ke Biner',
    subtitle: 'Metode Pembagian Berulang dengan Basis 2 (Sisa Bagi)',
    badgeName: 'Ahli Modulo Biner',
    description: 'Pelajari algoritma pembagian berulang dengan 2 (modulo 2) dan susun sisa pembagian dari urutan terbawah ke teratas.',
    flashcards: [
      { id: 'l9-c1', category: 'Algoritma Pembagian', title: 'Metode Bagi 2 Berulang', svgType: 'cpu', summary: 'Bagi bilangan desimal dengan 2, catat hasil bagi dan sisanya (0 atau 1). Ulangi proses hingga hasil bagi menjadi 0.', dailyExample: 'Contoh: 13 ÷ 2 = 6 sisa 1; 6 ÷ 2 = 3 sisa 0; 3 ÷ 2 = 1 sisa 1; 1 ÷ 2 = 0 sisa 1.', animText: 'Desimal ÷ 2 ➔ Catat Hasil Bagi & Sisa Bagi' },
      { id: 'l9-c2', category: 'Arah Pembacaan Sisa', title: 'Membaca dari Bawah ke Atas', svgType: 'ram', summary: 'Sisa pembagian terakhir menjadi bit paling depan (MSB), dan sisa pembagian pertama menjadi bit paling belakang (LSB).', dailyExample: 'Sisa dari angka 13 adalah 1, 0, 1, 1 (dari pertama ke terakhir), dibaca dari bawah: 1101₂.', animText: 'Sisa Terakhir (MSB) ➔ Sisa Pertama (LSB)' },
      { id: 'l9-c3', category: 'Metode Alternatif', title: 'Metode Pengurangan Bobot Pangkat 2', svgType: 'ssd', summary: 'Kurangi angka desimal dengan bobot pangkat 2 terbesar yang muat. Jika muat beri bit 1, jika tidak muat beri bit 0.', dailyExample: 'Desimal 25: kurangi 16 (sisa 9, bit=1), kurangi 8 (sisa 1, bit=1), kurangi 4 (tak muat, bit=0), kurangi 2 (tak muat, bit=0), kurangi 1 (sisa 0, bit=1) -> 11001₂.', animText: 'Kurangi Bobot Terbesar yang Muat' },
      { id: 'l9-c4', category: 'Penerapan Sistem Komputer', title: 'Kompilator Bahasa Pemrograman', svgType: 'keyboard', summary: 'Kompilator (compiler) mengubah angka dan teks desimal yang diketik pemrogram menjadi kode biner sebelum dijalankan prosesor.', dailyExample: 'Saat kamu menulis int skor = 25;, komputer menyimpannya sebagai biner 00011001.', animText: 'Kode Desimal Pengguna ➔ Kompiler ➔ Biner Mesin' },
      { id: 'l9-c5', category: 'Latihan Mandiri', title: 'Verifikasi Hasil Biner', svgType: 'monitor', summary: 'Selalu uji kembali hasil biner dengan mengonversinya kembali ke desimal untuk memastikan tidak ada sisa bagi yang terlewat.', dailyExample: 'Biner 11001₂ = 16 + 8 + 1 = 25₁₀ (Cocok!).', animText: 'Biner ➔ Uji Balik ke Desimal ➔ Validasi' }
    ]
  },
  {
    id: 10,
    title: 'Sistem Bilangan Oktal (Basis 8)',
    subtitle: 'Karakteristik Digit 0-7 dan Konversi Oktal ke Desimal',
    badgeName: 'Kalkulator Oktal',
    description: 'Pelajari sistem bilangan oktal berbasis 8 yang hanya menggunakan digit 0 sampai 7, serta cara mengonversinya ke sistem desimal.',
    flashcards: [
      { id: 'l10-c1', category: 'Karakteristik Oktal', title: 'Sistem Bilangan Basis 8', svgType: 'cpu', summary: 'Sistem bilangan oktal hanya memiliki 8 simbol angka: 0, 1, 2, 3, 4, 5, 6, dan 7. Angka 8 dan 9 TIDAK PERNAH ada di sistem oktal!', dailyExample: 'Setelah angka 7₈, bilangan berikutnya adalah 10₈ (yang bernilai 8 desimal).', animText: 'Digit Valid: 0, 1, 2, 3, 4, 5, 6, 7 (Tanpa 8 dan 9)' },
      { id: 'l10-c2', category: 'Bobot Posisi Oktal', title: 'Perpangkatan Basis 8 (8ⁿ)', svgType: 'ram', summary: 'Bobot posisi oktal dari kanan ke kiri adalah: 8⁰ = 1, 8¹ = 8, 8² = 64, 8³ = 512, 8⁴ = 4096.', dailyExample: 'Oktal 25₈ = (2 × 8¹) + (5 × 8⁰) = 16 + 5 = 21₁₀.', animText: 'Posisi: ... 8²(64) • 8¹(8) • 8⁰(1)' },
      { id: 'l10-c3', category: 'Sejarah & Fungsi', title: 'Mengapa Oktal Diciptakan?', svgType: 'ssd', summary: 'Oktal diciptakan para insinyur komputer untuk meringkas deretan angka biner yang panjang tanpa harus menggunakan desimal.', dailyExample: 'Satu digit oktal mewakili tepat 3 digit biner (karena 2³ = 8).', animText: '1 Digit Oktal = 3 Bit Biner' },
      { id: 'l10-c4', category: 'Penerapan Praktis', title: 'Hak Akses File Sistem Operasi Linux (chmod)', svgType: 'ssd', summary: 'Sistem operasi Linux dan server internet menggunakan oktal untuk mengatur izin file (permission): Read(4), Write(2), Execute(1).', dailyExample: 'Perintah chmod 755 file.txt menggunakan angka oktal 7 (4+2+1) dan 5 (4+1).', animText: 'Izin File Linux: 755, 644, 777 (Format Oktal)' },
      { id: 'l10-c5', category: 'Rumus Konversi ke Desimal', title: 'Langkah Menghitung Oktal ke Desimal', svgType: 'monitor', summary: 'Kalikan setiap digit oktal dengan 8 pangkat posisinya, lalu jumlahkan seluruh hasil kali tersebut.', dailyExample: '144₈ = (1×64) + (4×8) + (4×1) = 64 + 32 + 4 = 100₁₀.', animText: 'Digit × 8ⁿ ➔ Jumlahkan ➔ Nilai Desimal' }
    ]
  },
  {
    id: 11,
    title: 'Konversi Biner ke Oktal',
    subtitle: 'Trik Pengelompokan 3 Bit (2³ = 8) Cepat dan Akurat',
    badgeName: 'Master Pola 3-Bit',
    description: 'Kuasai teknik ajaib mengelompokkan biner setiap 3 bit dari kanan ke kiri untuk langsung diubah menjadi digit oktal tanpa lewat desimal.',
    flashcards: [
      { id: 'l11-c1', category: 'Rahasia Hubungan 2³ = 8', title: 'Mengapa Dikelompokkan Tiap 3 Bit?', svgType: 'cpu', summary: 'Karena 2 pangkat 3 sama dengan 8, setiap kombinasi 3 bit biner (dari 000 hingga 111) setara dengan tepat satu digit oktal (0 sampai 7).', dailyExample: 'Biner 101 setara dengan 4 + 0 + 1 = 5 dalam oktal.', animText: '2³ = 8 ➔ 3 Bit Biner = 1 Digit Oktal' },
      { id: 'l11-c2', category: 'Arah Pengelompokan', title: 'Wajib dari Kanan ke Kiri (LSB ke MSB)', svgType: 'ram', summary: 'Pengelompokan 3 bit harus selalu dimulai dari bit paling kanan. Jika kelompok bit paling kiri kurang dari 3 bit, tambahkan angka 0 di depannya.', dailyExample: 'Biner 11011 dibagi menjadi: [011] dan [011] (bukan dari kiri!).', animText: 'Mulai dari KANAN ➔ Tambah 0 di Kiri jika kurang' },
      { id: 'l11-c3', category: 'Tabel Pintar 3-Bit', title: 'Daftar Padanan 3 Bit ke Oktal', svgType: 'ssd', summary: '000=0, 001=1, 010=2, 011=3, 100=4, 101=5, 110=6, 111=7. Hafalkan pola bobot 4-2-1 untuk mengingatnya dengan instan.', dailyExample: 'Kombinasi 110 memiliki bit aktif di bobot 4 dan 2, sehingga nilainya 6.', animText: 'Bobot 3-Bit: 4 - 2 - 1' },
      { id: 'l11-c4', category: 'Contoh Lengkap', title: 'Konversi 101110₂ ke Oktal', svgType: 'gpu', summary: 'Bagi 101110 menjadi dua kelompok 3 bit: [101] dan [110]. [101] = 5, [110] = 6. Hasilnya adalah 56₈.', dailyExample: 'Biner sepanjang 6 bit langsung ringkas menjadi 2 digit oktal saja.', animText: '101 110₂ ➔ 5 6₈' },
      { id: 'l11-c5', category: 'Keuntungan bagi Teknisi', title: 'Efisiensi Pembacaan Data', svgType: 'monitor', summary: 'Menggunakan oktal mempercepat komunikasi antar teknisi saat membaca status bit register perangkat keras tanpa salah hitung.', dailyExample: 'Menyebut "Status 56 oktal" jauh lebih ringkas daripada menyebut "1-0-1-1-1-0 biner".', animText: 'Ringkas • Akurat • Mudah Dibaca' }
    ]
  },
  {
    id: 12,
    title: 'Pengenalan Heksadesimal (Basis 16)',
    subtitle: 'Dunia 16 Simbol: Angka 0-9 dan Huruf A, B, C, D, E, F',
    badgeName: 'Penjelajah Heksadesimal',
    description: 'Kenali sistem bilangan basis 16 yang menjadi standar utama arsitektur komputer modern, alamat memori RAM, dan kode warna grafis.',
    flashcards: [
      { id: 'l12-c1', category: 'Karakteristik Heksadesimal', title: 'Sistem Bilangan Basis 16', svgType: 'cpu', summary: 'Heksadesimal memiliki 16 simbol: angka 0 sampai 9, dilanjutkan dengan 6 huruf: A(10), B(11), C(12), D(13), E(14), dan F(15).', dailyExample: 'Angka 15 dalam desimal ditulis sebagai satu karakter "F" dalam heksadesimal.', animText: 'Simbol: 0-9 dan A, B, C, D, E, F' },
      { id: 'l12-c2', category: 'Mengapa Menggunakan Huruf?', title: 'Mencegah Kerancuan 2 Digit', svgType: 'ram', summary: 'Jika angka 10 ditulis sebagai "10" dalam basis 16, akan membingungkan antara angka sepuluh atau nilai 1×16+0. Oleh karena itu digunakan huruf A sampai F.', dailyExample: 'Huruf A mewakili nilai 10, C mewakili 12, dan F mewakili nilai 15.', animText: 'A=10, B=11, C=12, D=13, E=14, F=15' },
      { id: 'l12-c3', category: 'Alamat Memori Komputer (RAM)', title: 'Representasi Pointer dan Lokasi Memori', svgType: 'ram', summary: 'Sistem operasi menampilkan alamat fisik memori RAM dalam format heksadesimal (misalnya: 0x0040FA12) agar mudah dilacak.', dailyExample: 'Pesan kesalahan Blue Screen atau crash sering menunjukkan alamat memori hex.', animText: 'Alamat Memori RAM: Format Hexadesimal (0x...)' },
      { id: 'l12-c4', category: 'Media Grafis & Desain Web', title: 'Kode Warna CSS (#RRGGBB)', svgType: 'gpu', summary: 'Warna digital pada layar komputer menggunakan kode heksadesimal 6 digit: 2 digit Red, 2 digit Green, dan 2 digit Blue.', dailyExample: '#FFFFFF adalah warna Putih murni, #000000 adalah Hitam, #FF0000 adalah Merah.', animText: '#RR GG BB ➔ Merah • Hijau • Biru' },
      { id: 'l12-c5', category: 'MAC Address Kartu Jaringan', title: 'Identitas Unik Perangkat WiFi & LAN', svgType: 'ssd', summary: 'Kartu jaringan komputer memiliki nomor identitas unik fisik (MAC Address) sepanjang 12 digit heksadesimal.', dailyExample: 'Contoh MAC Address laptop: E4:5F:01:3B:89:A2.', animText: 'MAC Address: 12 Digit Heksadesimal Unik' }
    ]
  },
  {
    id: 13,
    title: 'Konversi Heksadesimal ke Desimal',
    subtitle: 'Perhitungan Nilai Bobot Posisi Berbasis 16 (16ⁿ)',
    badgeName: 'Dekoder Memori Heksadesimal',
    description: 'Ubah kode heksadesimal menjadi bilangan desimal dengan mengalikan tiap digit dengan bobot perpangkatan 16 (1, 16, 256, 4096).',
    flashcards: [
      { id: 'l13-c1', category: 'Bobot Posisi Heksadesimal', title: 'Perpangkatan 16 (16ⁿ)', svgType: 'cpu', summary: 'Bobot posisi dari kanan ke kiri adalah: 16⁰ = 1, 16¹ = 16, 16² = 256, 16³ = 4096, 16⁴ = 65536.', dailyExample: 'Heksadesimal 1A₁₆ = (1 × 16) + (A × 1) = 16 + 10 = 26₁₀.', animText: 'Posisi: ... 16²(256) • 16¹(16) • 16⁰(1)' },
      { id: 'l13-c2', category: 'Langkah Substitusi Huruf', title: 'Ubah Huruf Menjadi Nilai Angka Dulu', svgType: 'ram', summary: 'Sebelum mengalikan dengan bobot, ubah huruf A-F menjadi angka desimalnya: A=10, B=11, C=12, D=13, E=14, F=15.', dailyExample: '2F₁₆ = (2 × 16¹) + (15 × 16⁰) = 32 + 15 = 47₁₀.', animText: 'Ganti Huruf ke Angka ➔ Kalikan Bobot ➔ Jumlahkan' },
      { id: 'l13-c3', category: 'Nilai Spesial: FF₁₆', title: 'Nilai Maksimum 1 Byte', svgType: 'ssd', summary: 'FF₁₆ adalah nilai heksadesimal terbesar untuk 1 byte (2 digit). Nilai desimalnya adalah (15 × 16) + 15 = 240 + 15 = 255₁₀.', dailyExample: 'Itulah mengapa intensitas warna RGB web bernilai maksimal 255 (FF)!', animText: 'FF₁₆ = 255₁₀ (Kapasitas Maksimal 1 Byte)' },
      { id: 'l13-c4', category: 'Konversi 3 Digit Hex', title: 'Menghitung Digit Bernilai Ratusan', svgType: 'gpu', summary: 'Untuk 3 digit seperti 1C4₁₆: (1 × 256) + (12 × 16) + (4 × 1) = 256 + 192 + 4 = 452₁₀.', dailyExample: 'Perhitungan ini digunakan saat prosesor menghitung offset alamat data.', animText: '1C4₁₆ = 256 + 192 + 4 = 452₁₀' },
      { id: 'l13-c5', category: 'Tips Cepat', title: 'Awalan "0x" pada Bahasa Pemrograman', svgType: 'keyboard', summary: 'Dalam bahasa pemrograman seperti C++, Java, dan JavaScript, bilangan heksadesimal ditulis dengan awalan "0x", misalnya 0x2A.', dailyExample: 'Kode 0x2A dibaca oleh komputer sebagai desimal 42.', animText: 'Notasi: 0x... Menandakan Bilangan Heksadesimal' }
    ]
  },
  {
    id: 14,
    title: 'Konversi Desimal ke Heksadesimal',
    subtitle: 'Metode Pembagian Berulang dengan Basis 16',
    badgeName: 'Spesialis Konversi Hex',
    description: 'Bagi bilangan desimal dengan 16 berulang kali, catat sisa bagi, dan ubah sisa 10–15 menjadi huruf A–F untuk mendapat kode hex yang tepat.',
    flashcards: [
      { id: 'l14-c1', category: 'Algoritma Pembagian', title: 'Bagi 16 Secara Bertahap', svgType: 'cpu', summary: 'Bagi angka desimal dengan 16. Catat hasil bagi dan sisanya. Ulangi terus proses pembagian hingga hasil bagi bernilai 0.', dailyExample: 'Desimal 45: 45 ÷ 16 = 2 sisa 13. 2 ÷ 16 = 0 sisa 2.', animText: 'Desimal ÷ 16 ➔ Catat Hasil & Sisa Bagi' },
      { id: 'l14-c2', category: 'Substitusi Sisa Bernilai 10-15', title: 'Ubah Sisa Menjadi Karakter A-F', svgType: 'ram', summary: 'Jika sisa pembagian adalah angka antara 10 sampai 15, kamu WAJIB menggantinya dengan huruf A sampai F.', dailyExample: 'Sisa 13 diganti menjadi huruf D. Sisa 10 menjadi A. Sisa 15 menjadi F.', animText: 'Sisa 10=A, 11=B, 12=C, 13=D, 14=E, 15=F' },
      { id: 'l14-c3', category: 'Arah Penulisan Hasil', title: 'Susun Sisa dari Bawah ke Atas', svgType: 'ssd', summary: 'Sisa pembagian terakhir diletakkan di posisi paling depan (kiri), dan sisa pertama di posisi belakang (kanan).', dailyExample: 'Desimal 45 menghasilkan sisa 13 (D) lalu sisa 2. Dibaca dari bawah: 2D₁₆.', animText: 'Sisa Terakhir ➔ Sisa Pertama ➔ Hasil Hex' },
      { id: 'l14-c4', category: 'Contoh Angka Besar', title: 'Konversi 254₁₀ ke Heksadesimal', svgType: 'gpu', summary: '254 ÷ 16 = 15 sisa 14. 15 ÷ 16 = 0 sisa 15. Sisa 14 adalah E, sisa 15 adalah F. Hasilnya: FE₁₆.', dailyExample: 'FE₁₆ = (15 × 16) + 14 = 240 + 14 = 254₁₀. Sangat presisi!', animText: '254₁₀ ➔ FE₁₆' },
      { id: 'l14-c5', category: 'Uji Mandiri Cepat', title: 'Verifikasi Melalui Perkalian', svgType: 'monitor', summary: 'Kalikan kembali digit heksadesimal dengan 16 untuk memastikan hasil konversimu sama dengan desimal awal.', dailyExample: '2D₁₆ = (2 × 16) + 13 = 32 + 13 = 45₁₀ (Tepat!).', animText: 'Verifikasi: Hex × 16ⁿ = Desimal Semula' }
    ]
  },
  {
    id: 15,
    title: 'Konversi Biner ke Heksadesimal',
    subtitle: 'Pengelompokan 4 Bit (1 Nibble = 1 Digit Hex, 2⁴ = 16)',
    badgeName: 'Arsitek Nibble Biner',
    description: 'Ketahui rahasia mengapa 1 byte (8 bit) selalu tepat menjadi 2 digit heksadesimal melalui pengelompokan 4 bit (nibble).',
    flashcards: [
      { id: 'l15-c1', category: 'Rahasia Hubungan 2⁴ = 16', title: '1 Digit Hex = Tepat 4 Bit Biner', svgType: 'cpu', summary: 'Karena 2 pangkat 4 sama dengan 16, setiap 4 bit biner (dari 0000 sampai 1111) dapat dinyatakan persis oleh 1 digit heksadesimal (0 sampai F).', dailyExample: 'Biner 1010 bernilai 10, yang ditulis sebagai satu huruf A dalam heksadesimal.', animText: '2⁴ = 16 ➔ 4 Bit Biner = 1 Digit Hex' },
      { id: 'l15-c2', category: 'Konsep Nibble', title: 'Setengah Byte (4 Bit)', svgType: 'ram', summary: 'Dalam istilah informatika, 4 bit disebut 1 Nibble. Satu Byte (8 bit) terdiri dari High Nibble (4 bit kiri) dan Low Nibble (4 bit kanan).', dailyExample: 'Setiap Byte memori komputer selalu ditampilkan sebagai 2 digit hex (contoh: 7F, A2).', animText: '4 Bit = 1 Nibble • 8 Bit (1 Byte) = 2 Nibble' },
      { id: 'l15-c3', category: 'Aturan Pengelompokan', title: 'Kelompokkan 4 Bit dari Kanan', svgType: 'ssd', summary: 'Selalu bagi biner menjadi kelompok 4 bit dimulai dari bit paling kanan. Tambahkan 0 di depan jika kelompok kiri kurang dari 4 bit.', dailyExample: 'Biner 1101011 dibagi menjadi: [0110] dan [1011].', animText: 'Kelompokkan Tiap 4 Bit dari KANAN' },
      { id: 'l15-c4', category: 'Bobot 4-Bit: 8-4-2-1', title: 'Menghitung Cepat Tiap Nibble', svgType: 'gpu', summary: 'Gunakan bobot 8, 4, 2, 1 untuk setiap kelompok 4 bit. Jumlahkan bit aktif lalu sesuaikan dengan huruf A-F jika nilainya ≥ 10.', dailyExample: '1100 = 8 + 4 = 12 = C₁₆. 1010 = 8 + 2 = 10 = A₁₆.', animText: 'Bobot Nibble: 8 - 4 - 2 - 1' },
      { id: 'l15-c5', category: 'Contoh 1 Byte Penuh', title: 'Konversi 11001010₂ ke Hex', svgType: 'monitor', summary: 'Kelompok 1 (Kiri): 1100 = 12 = C. Kelompok 2 (Kanan): 1010 = 10 = A. Hasil akhirnya adalah CA₁₆.', dailyExample: 'Byte biner panjang langsung ringkas menjadi 2 karakter "CA"!', animText: '1100 1010₂ ➔ CA₁₆' }
    ]
  },
  {
    id: 16,
    title: 'Konversi Heksadesimal ke Biner',
    subtitle: 'Ekspansi Langsung 4 Bit per Digit Hex',
    badgeName: 'Insinyur Biner Mikroprosesor',
    description: 'Setiap satu digit heksadesimal diuraikan menjadi tepat 4 bit biner lengkap (termasuk angka nol di depan).',
    flashcards: [
      { id: 'l16-c1', category: 'Metode Ekspansi Langsung', title: '1 Digit Hex ➔ 4 Bit Biner', svgType: 'cpu', summary: 'Untuk mengubah heksadesimal ke biner, uraikan setiap digit hex secara terpisah menjadi tepat 4 bit biner menggunakan bobot 8-4-2-1.', dailyExample: 'Digit 7 diubah menjadi 0111₂, bukan 111₂ (wajib 4 bit lengkap!).', animText: 'Setiap Digit Hex ➔ Buka Menjadi 4 Bit Biner' },
      { id: 'l16-c2', category: 'Pentingnya Angka Nol di Depan', title: 'Jangan Hilangkan Leading Zero!', svgType: 'ram', summary: 'Jika suatu digit menghasilkan kurang dari 4 bit, kamu wajib menambahkan angka 0 di depannya agar panjang nibble tetap 4 bit.', dailyExample: 'Digit 3 harus ditulis 0011₂. Jika hanya ditulis 11₂, posisi bit berikutnya akan kacau.', animText: 'Digit 3 = 0011₂ (Wajib 4 Bit Lengkap)' },
      { id: 'l16-c3', category: 'Ekspansi Huruf A-F', title: 'Ubah Huruf Menjadi Biner', svgType: 'ssd', summary: 'Ingat nilai desimal dari huruf: A(10)=1010₂, B(11)=1011₂, C(12)=1100₂, D(13)=1101₂, E(14)=1110₂, F(15)=1111₂.', dailyExample: 'B5₁₆ diuraikan menjadi: B=1011₂ dan 5=0101₂. Digabungkan menjadi 10110101₂.', animText: 'B5₁₆ ➔ [1011] [0101]₂' },
      { id: 'l16-c4', category: 'Bahasa Assembly & Mikroprosesor', title: 'Instruksi Mesin Tingkat Rendah', svgType: 'keyboard', summary: 'Programmer bahasa Assembly menulis instruksi opcode dalam heksadesimal (misal: B8 untuk MOV), dan CPU menerjemahkannya ke biner sirkuit.', dailyExample: 'Instruksi hex B8 langsung diterjemahkan menjadi 10111000₂ di bus data prosesor.', animText: 'Opcode Hex ➔ Jalur Bus Biner CPU' },
      { id: 'l16-c5', category: 'Gabungkan Semua Bit', title: 'Menyusun Hasil Biner Akhir', svgType: 'monitor', summary: 'Setelah semua digit hex diekspansi menjadi 4 bit, satukan semua kelompok bit dari kiri ke kanan menjadi satu deretan biner utuh.', dailyExample: 'Hex 3C₁₆ ➔ 3(0011) dan C(1100) ➔ 00111100₂.', animText: 'Satukan Seluruh 4-Bit ➔ Kode Biner Utuh' }
    ]
  },
  {
    id: 17,
    title: 'Konversi Heksadesimal ke Oktal',
    subtitle: 'Jembatan Biner: Heksadesimal (4-Bit) ➔ Biner ➔ Oktal (3-Bit)',
    badgeName: 'Jembatan Emas Hex-Oktal',
    description: 'Konversikan heksadesimal ke oktal secara elegan melalui jembatan biner perantara tanpa perlu menghitung perkalian desimal.',
    flashcards: [
      { id: 'l17-c1', category: 'Konsep Jembatan Biner', title: 'Mengapa Menggunakan Jalur Biner?', svgType: 'cpu', summary: 'Mengubah hex ke desimal lalu ke oktal memakan waktu dan rentan salah hitung. Jalur biner jauh lebih cepat: Hex (4-bit) ➔ Biner ➔ Regrouping (3-bit) ➔ Oktal.', dailyExample: 'Jembatan biner adalah trik paling populer yang digunakan para insinyur informatika.', animText: 'Hex (4-bit) ➔ BINER ➔ Oktal (3-bit)' },
      { id: 'l17-c2', category: 'Langkah 1: Ekspansi Hex ke Biner', title: 'Uraikan Tiap Digit Hex Jadi 4 Bit', svgType: 'ram', summary: 'Ubah setiap digit heksadesimal menjadi 4 bit biner seperti yang dipelajari pada level sebelumnya.', dailyExample: 'Contoh 2B₁₆: digit 2 menjadi 0010, dan digit B(11) menjadi 1011 ➔ biner: 00101011₂.', animText: 'Langkah 1: Hex ➔ 4 Bit per digit' },
      { id: 'l17-c3', category: 'Langkah 2: Kelompokkan Ulang 3 Bit', title: 'Regrouping dari Kanan ke Kiri', svgType: 'ssd', summary: 'Ambil deretan biner yang dihasilkan, lalu kelompokkan ulang setiap 3 bit dari arah kanan ke kiri.', dailyExample: 'Biner 00101011 dikelompokkan: [000] [101] [011].', animText: 'Langkah 2: Kelompokkan Tiap 3 Bit dari KANAN' },
      { id: 'l17-c4', category: 'Langkah 3: Ubah ke Digit Oktal', title: 'Konversikan Tiap 3 Bit ke Digit 0-7', svgType: 'gpu', summary: 'Ubah setiap blok 3 bit menjadi nilai oktalnya: 000=0, 101=5, 011=3. Hasil akhirnya adalah 53₈!', dailyExample: 'Sehingga heksadesimal 2B₁₆ sama nilainya dengan 53₈ dalam oktal.', animText: '[000] [101] [011] ➔ 53₈' },
      { id: 'l17-c5', category: 'Kecepatan dan Keakuratan', title: 'Keunggulan Menggunakan Jembatan Biner', svgType: 'monitor', summary: 'Metode ini tidak memerlukan operasi perkalian dan pembagian sama sekali, hanya melihat pola bit 4-bit dan 3-bit.', dailyExample: 'Mengonversi file biner besar antarformat dilakukan komputer menggunakan metode ini.', animText: 'Cepat • Tanpa Perkalian Rumit • Presisi' }
    ]
  },
  {
    id: 18,
    title: 'Konversi Oktal ke Heksadesimal',
    subtitle: 'Jembatan Biner: Oktal (3-Bit) ➔ Biner ➔ Heksadesimal (4-Bit)',
    badgeName: 'Transformator Oktal-Hex',
    description: 'Kuasai kebalikan jembatan biner: pecah digit oktal ke 3 bit biner, lalu kelompokkan ulang setiap 4 bit dari kanan untuk memperoleh heksadesimal.',
    flashcards: [
      { id: 'l18-c1', category: 'Konsep Kebalikan Jembatan Biner', title: 'Oktal (3-Bit) ➔ Biner ➔ Hex (4-Bit)', svgType: 'cpu', summary: 'Untuk mengubah oktal ke heksadesimal, gunakan biner sebagai jembatan: uraikan oktal ke 3 bit biner, lalu kelompokkan ulang menjadi blok 4 bit.', dailyExample: 'Oktal 75₈ ➔ Biner ➔ Heksadesimal 3D₁₆.', animText: 'Oktal (3-bit) ➔ BINER ➔ Hex (4-bit)' },
      { id: 'l18-c2', category: 'Langkah 1: Ekspansi 3 Bit per Digit Oktal', title: 'Pecah Tiap Digit Oktal ke 3 Bit', svgType: 'ram', summary: 'Ubah setiap digit oktal (0-7) menjadi tepat 3 bit biner. Contoh: 7 = 111, 5 = 101.', dailyExample: 'Oktal 75₈ diuraikan menjadi: 111 dan 101 ➔ biner: 111101₂.', animText: 'Langkah 1: Oktal ➔ 3 Bit per digit' },
      { id: 'l18-c3', category: 'Langkah 2: Regrouping 4 Bit dari Kanan', title: 'Kelompokkan Ulang Tiap 4 Bit', svgType: 'ssd', summary: 'Mulai dari kanan, ambil 4 bit untuk Low Nibble. Bit sisanya di sebelah kiri ditambah nol agar genap 4 bit untuk High Nibble.', dailyExample: 'Biner 111101₂ dikelompokkan dari kanan: [0011] dan [1101].', animText: 'Langkah 2: Kelompokkan Tiap 4 Bit dari KANAN' },
      { id: 'l18-c4', category: 'Langkah 3: Konversi Tiap Nibble ke Hex', title: 'Ubah Tiap 4 Bit Menjadi Simbol Hex', svgType: 'gpu', summary: '[0011] bernilai 3, dan [1101] bernilai 13 (huruf D). Maka hasilnya adalah 3D₁₆.', dailyExample: '75₈ = (7×8)+5 = 61₁₀. 3D₁₆ = (3×16)+13 = 61₁₀. Nilainya terbukti sama persis!', animText: '[0011] [1101] ➔ 3D₁₆' },
      { id: 'l18-c5', category: 'Penerapan di Sistem Operasi Modern', title: 'Interoperabilitas Sistem', svgType: 'monitor', summary: 'Sistem operasi modern sering membaca log lama berformat oktal dan mengonversinya ke hex untuk ditampilkan di antarmuka sistem.', dailyExample: 'Konversi otomatis log server dari basis 8 ke basis 16.', animText: 'Log Sistem Oktal ➔ Konversi Biner ➔ Tampilan Hex' }
    ]
  },
  {
    id: 19,
    title: 'Kode Warna Hex & ASCII Komputer',
    subtitle: 'Aplikasi Nyata Heksadesimal pada Grafis RGB (#RRGGBB) dan Teks',
    badgeName: 'Hacker Kode Warna & ASCII',
    description: 'Pelajari bagaimana heksadesimal digunakan di dunia nyata untuk kode warna web CSS dan tabel representasi huruf teks ASCII.',
    flashcards: [
      { id: 'l19-c1', category: 'Kode Warna Grafis Web', title: 'Format Hex RGB (#RRGGBB)', svgType: 'gpu', summary: 'Layar komputer menghasilkan jutaan warna dari gabungan Red, Green, Blue. Setiap warna diwakili oleh 2 digit hex dari 00 (mati) hingga FF (maksimal 255).', dailyExample: '#FF0000 = Merah murni, #00FF00 = Hijau murni, #0000FF = Biru murni.', animText: '#RR GG BB • 2 Digit Hex per Warna' },
      { id: 'l19-c2', category: 'Warna Campuran Sekunder', title: 'Kombinasi Warna RGB', svgType: 'gpu', summary: 'Menggabungkan Red dan Green (#FFFF00) menghasilkan Kuning. Red dan Blue (#FF00FF) menghasilkan Magenta/Ungu. Green dan Blue (#00FFFF) menghasilkan Cyan.', dailyExample: 'Layar monitor smartphone kamu mencampurkan piksel sub-RGB ini untuk menampilkan semua foto.', animText: '#FFFF00=Kuning • #FF00FF=Magenta • #00FFFF=Cyan' },
      { id: 'l19-c3', category: 'Teks Digital Komputer', title: 'Standar ASCII (American Standard Code)', svgType: 'keyboard', summary: 'Komputer tidak menyimpan huruf secara langsung, melainkan menyimpan angka kodenya. Standar ASCII memetakan setiap tombol huruf/angka ke sebuah byte heksadesimal.', dailyExample: 'Huruf "A" besar memiliki kode desimal 65, atau dalam heksadesimal adalah 41₁₆.', animText: 'Huruf "A" = 65₁₀ = 41₁₆ = 01000001₂' },
      { id: 'l19-c4', category: 'Membaca Pesan Hexadecimal', title: 'Pesan Teks Tersandi dalam Hex', svgType: 'ssd', summary: 'Jika memori RAM membaca urutan byte: 43 50 55, komputer menerjemahkannya menjadi: 43=C, 50=P, 55=U, membentuk kata "CPU".', dailyExample: 'Analisis forensik digital membaca teks di dalam file menggunakan editor hex (Hex Editor).', animText: 'Hex: 43 50 55 ➔ Teks: C P U' },
      { id: 'l19-c5', category: 'Header Paket Jaringan Internet', title: 'Analisis Lalu Lintas Jaringan', svgType: 'monitor', summary: 'Paket data yang dikirim melalui internet memiliki header heksadesimal yang berisi alamat IP, port aplikasi, dan checksum keamanan.', dailyExample: 'Aplikasi Wireshark menampilkan paket internet dalam format heksadesimal dan ASCII.', animText: 'Paket Data Internet: Hex Header + Payload ASCII' }
    ]
  },
  {
    id: 20,
    title: 'Grand Master Konversi Multi-Basis',
    subtitle: 'Ujian Puncak: Biner, Oktal, Desimal, Heksadesimal & ALU',
    badgeName: 'Grand Master Sistem Komputer',
    description: 'Ujian komprehensif menguji penguasaan seluruh 4 sistem bilangan, operasi aritmetika biner prosesor (ALU), dan verifikasi sistem komputer.',
    flashcards: [
      { id: 'l20-c1', category: 'Rangkuman 4 Sistem Bilangan', title: 'Tabel Ekuivalensi Multi-Basis', svgType: 'cpu', summary: 'Desimal (Basis 10: 0-9), Biner (Basis 2: 0-1), Oktal (Basis 8: 0-7), dan Heksadesimal (Basis 16: 0-9 & A-F). Keempatnya saling melengkapi di dunia komputasi.', dailyExample: 'Angka 15 desimal = 1111 biner = 17 oktal = F heksadesimal.', animText: 'Desimal ➔ Biner ➔ Oktal ➔ Heksadesimal' },
      { id: 'l20-c2', category: 'Aritmetika ALU Komputer', title: 'Operasi Penjumlahan Biner Dasar', svgType: 'cpu', summary: 'ALU menghitung penjumlahan biner dengan aturan: 0+0=0, 0+1=1, 1+0=1, dan 1+1=10 (tulis 0 simpan carry 1 ke posisi berikutnya).', dailyExample: '1011₂ (11) + 0110₂ (6) = 10001₂ (17 desimal).', animText: 'Penjumlahan Biner: 1 + 1 = 10 (Carry 1)' },
      { id: 'l20-c3', category: 'Konversi Cepat Antar Basis', title: 'Peta Navigasi Konversi', svgType: 'ram', summary: 'Gunakan Biner sebagai terminal transit utama! Konversi Oktal ➔ Biner ➔ Hex atau sebaliknya adalah rute tercepat tanpa perhitungan rumit.', dailyExample: 'Insinyur komputer selalu menggunakan biner sebagai jembatan transit serbaguna.', animText: 'Biner = Terminal Transit Seluruh Sistem Bilangan' },
      { id: 'l20-c4', category: 'Arsitektur Komputer Modern', title: '64-Bit Arsitektur CPU', svgType: 'gpu', summary: 'Prosesor 64-bit modern mampu memproses 64 bit biner (atau 8 byte / 16 digit hex) dalam satu siklus clock instruksi.', dailyExample: 'Sistem operasi 64-bit dapat mengakses memori RAM hingga lebih dari 16 Exabyte!', animText: 'CPU 64-Bit: Memproses 16 Digit Hex per Siklus' },
      { id: 'l20-c5', category: 'Puncak Pencapaian Teknisi Muda', title: 'Gelar Grand Master Sistem Komputer', svgType: 'monitor', summary: 'Selamat! Menguasai perangkat keras fisik, alur proses data, penyimpanan file, pemecahan masalah, dan sistem bilangan digital membuktikan kamu siap menjadi ahli informatika!', dailyExample: 'Gelar ini adalah bukti keahlian tingkat lanjutmu di bidang sistem komputer.', animText: 'Raih Gelar Tertinggi: Grand Master Sistem Komputer!' }
    ]
  }
];

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
interface LevelProgress {
  unlocked: boolean;
  completed: boolean;
  stars: number;
  score: number;
  flashcardsDone: boolean;
}

interface AppProps {
  initialMode?: 'STUDENT' | 'TEACHER';
  userRole?: string;
  userName?: string;
}

// ============================================================================
// KOMPONEN UTAMA APLIKASI
// ============================================================================
export default function ComputerSystemSimulatorApp({
  initialMode = 'STUDENT',
  userRole,
  userName = 'Siswa Hebat'
}: AppProps) {
  const [screen, setScreen] = useState<string>('home');
  const [activeLevelId, setActiveLevelId] = useState(1);
  const [userMode, setUserMode] = useState<'student' | 'teacher'>(
    initialMode === 'TEACHER' ? 'teacher' : 'student'
  );
  const [hideScoreInTeacherMode, setHideScoreInTeacherMode] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [bgmOn, setBgmOn] = useState(false);
  const [animSpeed, setAnimSpeed] = useState(1);

  // Inisialisasi 20 Level
  const createDefaultProgress = () => {
    const prog: Record<number, LevelProgress> = {};
    for (let i = 1; i <= 20; i++) {
      prog[i] = {
        unlocked: i === 1,
        completed: false,
        stars: 0,
        score: 0,
        flashcardsDone: false
      };
    }
    return prog;
  };

  const [levelProgress, setLevelProgress] = useState<Record<number, LevelProgress>>(createDefaultProgress);
  const [badges, setBadges] = useState<string[]>([]);
  const [notification, setNotification] = useState<{ msg: string; type: string } | null>(null);

  // Penugasan Kelas & Pengaturan Guru
  const [availableTeacherClasses, setAvailableTeacherClasses] = useState<{ id: string; name: string }[]>([]);
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>([]);
  const [assignedClassNames, setAssignedClassNames] = useState<string[]>([]);
  const [teacherIsLocked, setTeacherIsLocked] = useState(false);
  const [teacherLockMessage, setTeacherLockMessage] = useState('Simulator Sistem Komputer sedang dikunci oleh guru.');
  const [kkmScore, setKkmScore] = useState(75);
  const [teacherInstructions, setTeacherInstructions] = useState('Selesaikan seluruh misi sistem komputer dan konversi basis bilangan sesuai petunjuk.');
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [teacherActiveTab, setTeacherActiveTab] = useState<'demo' | 'assignment' | 'recap'>('demo');

  // Gating & Status Siswa
  const [isSimulatorLocked, setIsSimulatorLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState('Simulator Sistem Komputer sedang dikunci oleh guru.');
  const [isClassAssigned, setIsClassAssigned] = useState(true);
  const [studentClassName, setStudentClassName] = useState('Kelas Siswa');

  // Rekap & Reset Siswa di Mode Guru
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [selectedResetClass, setSelectedResetClass] = useState<string>('ALL');
  const [resettingClassLoading, setResettingClassLoading] = useState(false);
  const [resettingStudentId, setResettingStudentId] = useState<string | null>(null);

  useEffect(() => {
    sfx.enabled = soundOn;
    if (!soundOn) { sfx.toggleBgm(false); } else if (bgmOn) { sfx.toggleBgm(true); }
  }, [soundOn, bgmOn]);

  const showToast = (msg: string, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => { setNotification((prev) => (prev?.msg === msg ? null : prev)); }, 3200);
  };

  // Muat pengaturan penugasan kelas dan sinkronisasi reset/progres siswa
  const fetchAssignmentSettings = async () => {
    try {
      const res = await fetch('/api/computer-system-simulator/settings', {
        credentials: 'include'
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success) return;

      if (data.isTeacher) {
        if (data.teacherClasses) setAvailableTeacherClasses(data.teacherClasses);
        if (data.config) {
          setAssignedClassIds(data.config.assignedClassIds || []);
          setAssignedClassNames(data.config.assignedClassNames || []);
          if (data.config.kkmScore) setKkmScore(data.config.kkmScore);
          if (data.config.instructions) setTeacherInstructions(data.config.instructions);
          setTeacherIsLocked(Boolean(data.config.isLocked));
          if (data.config.lockMessage) setTeacherLockMessage(data.config.lockMessage);
        }
      } else {
        // Mode Siswa
        setIsSimulatorLocked(Boolean(data.isLocked));
        setIsClassAssigned(Boolean(data.isAssigned));
        if (data.lockReason) setLockMessage(data.lockReason);
        if (data.studentClassName) setStudentClassName(data.studentClassName);

        // Ambil hasil dan periksa apakah ada reset dari guru
        fetch('/api/computer-system-simulator/results')
          .then((r) => r.json())
          .then((resData) => {
            if (resData.success && resData.data) {
              const sData = resData.data;
              if (sData.lastResetAt) {
                const localReset = typeof window !== 'undefined' ? localStorage.getItem('css_simulator_last_reset_at') : null;
                const serverResetTime = new Date(sData.lastResetAt).getTime();
                const localResetTime = localReset ? new Date(localReset).getTime() : 0;

                if (serverResetTime > localResetTime) {
                  setLevelProgress(createDefaultProgress());
                  setBadges([]);
                  setActiveLevelId(1);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('css_simulator_last_reset_at', sData.lastResetAt);
                  }
                  showToast('Guru telah mereset progres simulasi Anda kembali ke Level 1.', 'info');
                  return;
                }
              }

              if (sData.levelScores && Object.keys(sData.levelScores).length > 0) {
                setLevelProgress((prev) => {
                  const merged = { ...prev };
                  Object.keys(sData.levelScores).forEach((k) => {
                    const numK = Number(k);
                    if (merged[numK]) {
                      merged[numK] = {
                        ...merged[numK],
                        ...sData.levelScores[k],
                        unlocked: true
                      };
                    }
                  });
                  if (sData.highestLevel && sData.highestLevel <= 20) {
                    for (let i = 1; i <= sData.highestLevel; i++) {
                      if (merged[i]) merged[i].unlocked = true;
                    }
                  }
                  return merged;
                });
                if (sData.badges) setBadges(sData.badges);
              }
            }
          })
          .catch(() => {});
      }
    } catch {
      // offline fallback
    }
  };

  useEffect(() => {
    fetchAssignmentSettings();
  }, []);

  const fetchTeacherStudentResults = async (cls = selectedResetClass) => {
    try {
      const url = cls && cls !== 'ALL' ? `/api/computer-system-simulator/results?className=${encodeURIComponent(cls)}` : '/api/computer-system-simulator/results';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setStudentResults(data.data || []);
      }
    } catch {
      // ignore
    }
  };

  const saveTeacherAssignment = async () => {
    setAssignmentSaving(true);
    try {
      const res = await fetch('/api/computer-system-simulator/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedClassIds,
          isLocked: teacherIsLocked,
          lockMessage: teacherLockMessage,
          kkmScore,
          instructions: teacherInstructions,
          userRole: userRole || 'TEACHER',
          userName: userName || 'Guru'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Pengaturan penugasan kelas berhasil disimpan!', 'success');
        if (data.data?.assignedClassNames) setAssignedClassNames(data.data.assignedClassNames);
      } else {
        showToast(data.error || 'Gagal menyimpan penugasan kelas.', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Terjadi kesalahan jaringan.', 'error');
    } finally {
      setAssignmentSaving(false);
    }
  };

  const handleTeacherResetClass = async (cls: string) => {
    if (!cls || cls === 'ALL') {
      showToast('Pilih kelas spesifik untuk melakukan reset.', 'warn');
      return;
    }
    if (typeof window !== 'undefined' && !window.confirm(`Yakin ingin mereset seluruh progres siswa di ${cls} kembali ke Level 1?`)) {
      return;
    }
    setResettingClassLoading(true);
    try {
      const res = await fetch('/api/computer-system-simulator/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'class', className: cls })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Progres kelas ${cls} berhasil direset ke Level 1.`, 'success');
        fetchTeacherStudentResults(cls);
      } else {
        showToast(data.error || 'Gagal mereset kelas.', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Kesalahan jaringan.', 'error');
    } finally {
      setResettingClassLoading(false);
    }
  };

  const handleTeacherResetStudent = async (studentId: string, name: string) => {
    if (typeof window !== 'undefined' && !window.confirm(`Reset progres siswa "${name}" kembali ke Level 1?`)) {
      return;
    }
    setResettingStudentId(studentId);
    try {
      const res = await fetch('/api/computer-system-simulator/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'student', resultId: studentId, studentName: name })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Progres ${name} berhasil direset ke Level 1.`, 'success');
        fetchTeacherStudentResults();
      } else {
        showToast(data.error || 'Gagal mereset siswa.', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Kesalahan jaringan.', 'error');
    } finally {
      setResettingStudentId(null);
    }
  };

  const handleResetCurrentGame = () => {
    if (typeof window !== 'undefined' && !window.confirm('Reset game ke Level 1? Seluruh progres akan kembali dari awal.')) {
      return;
    }
    sfx.deleteFile();
    setLevelProgress(createDefaultProgress());
    setBadges([]);
    setActiveLevelId(1);
    setScreen('home');
    showToast('Game berhasil direset ke Level 1!', 'info');
  };

  const totalScore = useMemo(() => Object.values(levelProgress).reduce((acc, curr) => acc + curr.score, 0), [levelProgress]);
  const totalStars = useMemo(() => Object.values(levelProgress).reduce((acc, curr) => acc + curr.stars, 0), [levelProgress]);
  const completedLevelsCount = useMemo(() => Object.values(levelProgress).filter((l) => l.completed).length, [levelProgress]);

  const handleSelectLevel = (lvlId: number, targetScreen: 'level' | 'flashcard' = 'level') => {
    sfx.click();
    const isUnlocked = userMode === 'teacher' || levelProgress[lvlId]?.unlocked;
    if (!isUnlocked) {
      showToast('Selesaikan level sebelumnya terlebih dahulu, atau aktifkan Mode Guru untuk demonstrasi.', 'warn');
      return;
    }
    setActiveLevelId(lvlId);
    setScreen(targetScreen);
  };

  const handleCompleteFlashcards = (lvlId: number) => {
    sfx.correct();
    setLevelProgress((prev) => ({ ...prev, [lvlId]: { ...prev[lvlId], flashcardsDone: true } }));
    setScreen('level');
  };

  const handleLevelSuccess = (lvlId: number, earnedScore: number, earnedStars: number) => {
    sfx.levelWin();
    const lvlInfo = LEVEL_DATA.find((l) => l.id === lvlId);
    const nextLvl = lvlId < 20 ? lvlId + 1 : null;
    const updated = {
      ...levelProgress,
      [lvlId]: {
        ...levelProgress[lvlId],
        completed: true,
        stars: Math.max(levelProgress[lvlId].stars, earnedStars),
        score: Math.max(levelProgress[lvlId].score, earnedScore)
      }
    };
    if (nextLvl) {
      updated[nextLvl] = { ...updated[nextLvl], unlocked: true };
    }
    setLevelProgress(updated);

    const updatedBadges = lvlInfo && !badges.includes(lvlInfo.badgeName) ? [...badges, lvlInfo.badgeName] : badges;
    if (lvlInfo && !badges.includes(lvlInfo.badgeName)) {
      setBadges(updatedBadges);
    }

    // Simpan progres ke API
    const updatedTotalScore = Object.values(updated).reduce((acc, curr) => acc + curr.score, 0);
    const unlockedList = Object.keys(updated).filter((k) => updated[Number(k)].unlocked).map(Number);

    fetch('/api/computer-system-simulator/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: userName || 'Siswa',
        className: studentClassName || 'Kelas Siswa',
        highestLevel: nextLvl || lvlId,
        unlockedLevels: unlockedList,
        levelScores: updated,
        totalScore: updatedTotalScore,
        badges: updatedBadges
      })
    }).catch(() => {});
  };

  const activeLevelObj = LEVEL_DATA.find((l) => l.id === activeLevelId) || LEVEL_DATA[0];

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white ${userMode === 'teacher' ? 'text-base md:text-lg' : 'text-sm md:text-base'}`}>
      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 py-2.5 md:px-6 md:py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <button onClick={() => { sfx.click(); setScreen('home'); }} className="flex items-center gap-2.5 text-left group focus:outline-none" title="Kembali ke Halaman Utama">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-tight text-sm md:text-lg bg-gradient-to-r from-sky-300 via-cyan-200 to-indigo-300 bg-clip-text text-transparent">COMPUTER SYSTEM SIMULATOR</span>
                  <span className="hidden sm:inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">20 LEVEL</span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">Perangkat Keras, Alur Sistem & Konversi Basis Bilangan</p>
              </div>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button onClick={() => { sfx.click(); setUserMode('student'); showToast('Mode Siswa aktif: Belajar mandiri dan raih lencana!', 'info'); }} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${userMode === 'student' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                <User className="w-3.5 h-3.5" /><span>Mode Siswa</span>
              </button>
              <button onClick={() => { sfx.click(); setUserMode('teacher'); showToast('Mode Guru (IFP/Smartboard) aktif: Semua level & kontrol demonstrasi terbuka.', 'info'); }} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${userMode === 'teacher' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}>
                <GraduationCap className="w-3.5 h-3.5" /><span>Mode Guru (IFP)</span>
              </button>
            </div>

            {!(userMode === 'teacher' && hideScoreInTeacherMode) && (
              <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl">
                <div className="flex items-center gap-1 text-amber-400 font-bold text-xs md:text-sm"><Star className="w-4 h-4 fill-amber-400" /><span>{totalStars}/60</span></div>
                <span className="text-slate-600">|</span>
                <div className="flex items-center gap-1 text-sky-400 font-bold text-xs md:text-sm"><Zap className="w-4 h-4" /><span>{totalScore} Poin</span></div>
              </div>
            )}

            <button onClick={() => setSoundOn(!soundOn)} className={`p-2 rounded-xl border transition-all ${soundOn ? 'bg-slate-800 border-slate-700 text-sky-400 hover:bg-slate-700' : 'bg-slate-900 border-slate-800 text-slate-500'}`} title={soundOn ? 'Matikan Efek Suara' : 'Nyalakan Efek Suara'}>
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button onClick={() => { sfx.click(); setScreen('map'); }} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${screen === 'map' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'}`}>
              <Compass className="w-4 h-4" /><span className="hidden md:inline">Peta Level</span>
            </button>

            <button onClick={() => { sfx.click(); setScreen('lab'); }} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${screen === 'lab' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'}`}>
              <Sparkles className="w-4 h-4" /><span className="hidden md:inline">Simulasi & Animasi</span>
            </button>
          </div>
        </div>

        {/* PANEL KHUSUS MODE GURU */}
        {userMode === 'teacher' && (
          <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-amber-500/30 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-500/10 px-3 py-2 rounded-xl">
              <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-amber-500/30">
                <button
                  onClick={() => { sfx.click(); setTeacherActiveTab('demo'); }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    teacherActiveTab === 'demo' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Presentasi IFP</span>
                </button>
                <button
                  onClick={() => { sfx.click(); setTeacherActiveTab('assignment'); }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    teacherActiveTab === 'assignment' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Penugasan Kelas</span>
                </button>
                <button
                  onClick={() => { sfx.click(); setTeacherActiveTab('recap'); fetchTeacherStudentResults(); }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    teacherActiveTab === 'recap' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Rekap & Reset Siswa</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetCurrentGame}
                  className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1 transition"
                  title="Reset permainan sesi saat ini ke Level 1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Sesi ke Level 1</span>
                </button>
              </div>
            </div>

            {/* TAB 1: PRESENTASI IFP */}
            {teacherActiveTab === 'demo' && (
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-xl text-xs">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-slate-400 mr-1 font-semibold">Lompat Level (1-20):</span>
                  <div className="flex flex-wrap gap-1 max-w-2xl">
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        onClick={() => { sfx.click(); setActiveLevelId(num); setScreen('level'); }}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                          activeLevelId === num && (screen === 'flashcard' || screen === 'level')
                            ? 'bg-amber-400 text-slate-950 shadow'
                            : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                        }`}
                      >
                        L{num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-700">
                    <span className="text-slate-400">Kecepatan:</span>
                    {[0.5, 1, 2].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => { sfx.click(); setAnimSpeed(spd); }}
                        className={`px-1.5 py-0.5 rounded font-bold ${animSpeed === spd ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => { sfx.click(); setHideScoreInTeacherMode(!hideScoreInTeacherMode); }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700"
                  >
                    {hideScoreInTeacherMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{hideScoreInTeacherMode ? 'Tampilkan Skor' : 'Sembunyikan Skor'}</span>
                  </button>

                  {(screen === 'flashcard' || screen === 'level') && (
                    <button
                      onClick={() => { sfx.click(); setScreen(screen === 'flashcard' ? 'level' : 'flashcard'); }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                    >
                      {screen === 'flashcard' ? 'Langsung ke Tantangan →' : '← Buka Flashcard Materi'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: PENUGASAN KELAS */}
            {teacherActiveTab === 'assignment' && (
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4 text-xs md:text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                      <Settings className="w-4 h-4 text-amber-400" />
                      <span>Pengaturan Penugasan Kelas & Kunci Simulator</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pilih kelas yang ditugaskan untuk Simulator Sistem Komputer (20 Level).
                    </p>
                  </div>
                  <button
                    disabled={assignmentSaving}
                    onClick={saveTeacherAssignment}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl flex items-center gap-1.5 shadow transition disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{assignmentSaving ? 'Menyimpan...' : 'Simpan Penugasan'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-sky-400" />
                      <span>Daftar Kelas yang Ditugaskan:</span>
                    </span>
                    {availableTeacherClasses.length === 0 ? (
                      <p className="text-xs text-slate-500">Memuat opsi kelas...</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                        {availableTeacherClasses.map((cls) => {
                          const isChecked = assignedClassIds.includes(cls.id);
                          return (
                            <button
                              key={cls.id}
                              type="button"
                              onClick={() => {
                                setAssignedClassIds((prev) =>
                                  isChecked ? prev.filter((id) => id !== cls.id) : [...prev, cls.id]
                                );
                              }}
                              className={`p-2 rounded-lg border text-left flex items-center gap-2 transition ${
                                isChecked
                                  ? 'bg-sky-500/20 border-sky-400 text-white'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              {isChecked ? <CheckSquare className="w-4 h-4 text-sky-400 shrink-0" /> : <Square className="w-4 h-4 shrink-0 text-slate-600" />}
                              <span className="font-semibold text-xs truncate">{cls.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-[11px] text-slate-500 italic">
                      *Jika belum ada kelas yang dipilih, simulator dapat diakses oleh semua kelas siswa.
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        {teacherIsLocked ? <Lock className="w-4 h-4 text-rose-400" /> : <Unlock className="w-4 h-4 text-emerald-400" />}
                        <span>Status Kunci Simulator:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setTeacherIsLocked(!teacherIsLocked)}
                        className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                          teacherIsLocked ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-slate-950'
                        }`}
                      >
                        {teacherIsLocked ? 'TERKUNCI' : 'DIBUKA'}
                      </button>
                    </div>

                    {teacherIsLocked && (
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Pesan Kunci untuk Siswa:</label>
                        <input
                          type="text"
                          value={teacherLockMessage}
                          onChange={(e) => setTeacherLockMessage(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-medium"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Target KKM Poin:</label>
                        <input
                          type="number"
                          value={kkmScore}
                          onChange={(e) => setKkmScore(Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Petunjuk Guru:</label>
                        <input
                          type="text"
                          value={teacherInstructions}
                          onChange={(e) => setTeacherInstructions(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: REKAP NILAI & RESET SISWA */}
            {teacherActiveTab === 'recap' && (
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4 text-xs md:text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                      <Users className="w-4 h-4 text-sky-400" />
                      <span>Rekapitulasi Siswa & Fitur Reset ke Level 1</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pantau capaian 20 level dan reset progres per-kelas atau per-siswa secara langsung.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedResetClass}
                      onChange={(e) => {
                        setSelectedResetClass(e.target.value);
                        fetchTeacherStudentResults(e.target.value);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold"
                    >
                      <option value="ALL">Semua Kelas</option>
                      {availableTeacherClasses.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>

                    <button
                      disabled={resettingClassLoading || selectedResetClass === 'ALL'}
                      onClick={() => handleTeacherResetClass(selectedResetClass)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow"
                      title={selectedResetClass === 'ALL' ? 'Pilih kelas tertentu untuk mereset seluruh kelas' : `Reset seluruh siswa di ${selectedResetClass}`}
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${resettingClassLoading ? 'animate-spin' : ''}`} />
                      <span>{resettingClassLoading ? 'Mereset...' : `Reset Kelas ${selectedResetClass !== 'ALL' ? selectedResetClass : ''}`}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto">
                  {studentResults.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      Belum ada data rekap siswa pada filter ini.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Nama Siswa</th>
                          <th className="py-2.5 px-3">Kelas</th>
                          <th className="py-2.5 px-3 text-center">Level Terbuka</th>
                          <th className="py-2.5 px-3 text-center">Total Skor</th>
                          <th className="py-2.5 px-3 text-center">Lencana</th>
                          <th className="py-2.5 px-3 text-center">Aksi Reset</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {studentResults.map((s) => (
                          <tr key={s._id} className="hover:bg-slate-900/60 transition">
                            <td className="py-2.5 px-3 font-bold text-white">{s.studentName}</td>
                            <td className="py-2.5 px-3">{s.className}</td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-sky-400">
                              Level {s.highestLevel || 1} / 20
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-300">
                              {s.totalScore || 0}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-emerald-400">
                              {s.badges?.length || 0} / 20
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                disabled={resettingStudentId === s._id}
                                onClick={() => handleTeacherResetStudent(s._id, s.studentName)}
                                className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-500/40 rounded-lg text-[11px] font-bold transition flex items-center gap-1 mx-auto"
                              >
                                <RotateCcw className={`w-3 h-3 ${resettingStudentId === s._id ? 'animate-spin' : ''}`} />
                                <span>{resettingStudentId === s._id ? 'Mereset...' : 'Reset ke L1'}</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {notification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 border-2 border-sky-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-sky-400 shrink-0" /><span className="text-sm font-medium">{notification.msg}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 py-5 md:px-6 md:py-8">
        {/* LAYAR KUNCI / GATING PENUGASAN JIKA SISWA TIDAK DITUGASKAN ATAU SIMULATOR DIKUNCI */}
        {userMode === 'student' && (!isClassAssigned || isSimulatorLocked) ? (
          <div className="max-w-2xl mx-auto my-12 bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {isSimulatorLocked ? 'SIMULATOR SEDANG DIKUNCI' : 'PENUGASAN KELAS'}
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white">
                {isSimulatorLocked ? 'Akses Simulator Dinonaktifkan Sementara' : 'Kelas Belum Ditugaskan'}
              </h2>
              <p className="text-sm md:text-base text-slate-300 max-w-lg mx-auto">
                {isSimulatorLocked
                  ? lockMessage
                  : assignedClassNames.length > 0
                  ? `Simulator ini saat ini hanya ditugaskan untuk: ${assignedClassNames.join(', ')}. Kelas Anda terdeteksi sebagai ${studentClassName}.`
                  : 'Guru belum membuka penugasan kelas untuk Simulator Sistem Komputer ini.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => { sfx.click(); fetchAssignmentSettings(); }}
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs md:text-sm flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Periksa Ulang Status</span>
              </button>
              <a
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs md:text-sm"
              >
                Kembali ke Dashboard
              </a>
            </div>
          </div>
        ) : (
          <>
            {screen === 'home' && (
              <HomeScreen
                onStartAdventure={() => {
                  sfx.click();
                  const nextPlayable = Array.from({ length: 20 }, (_, i) => i + 1).find(
                    (id) => !levelProgress[id].completed && levelProgress[id].unlocked
                  ) || 1;
                  handleSelectLevel(nextPlayable, 'level');
                }}
                onOpenMap={() => { sfx.click(); setScreen('map'); }}
                onOpenLab={() => { sfx.click(); setScreen('lab'); }}
                onOpenGuide={() => { sfx.click(); setScreen('guide'); }}
                onOpenResults={() => { sfx.click(); setScreen('results'); }}
                totalScore={totalScore}
                totalStars={totalStars}
                completedLevelsCount={completedLevelsCount}
                badges={badges}
                soundOn={soundOn}
                setSoundOn={setSoundOn}
                bgmOn={bgmOn}
                setBgmOn={setBgmOn}
                animSpeed={animSpeed}
                setAnimSpeed={setAnimSpeed}
                userMode={userMode}
              />
            )}
            {screen === 'map' && (
              <LevelMapScreen
                levels={LEVEL_DATA}
                levelProgress={levelProgress}
                userMode={userMode}
                onSelectLevel={(lvlId: number, target: 'level' | 'flashcard' = 'level') => handleSelectLevel(lvlId, target)}
                onOpenLab={() => { sfx.click(); setScreen('lab'); }}
                onBackHome={() => { sfx.click(); setScreen('home'); }}
              />
            )}
            {screen === 'lab' && (
              <SimulationLabScreen
                animSpeed={animSpeed}
                setAnimSpeed={setAnimSpeed}
                userMode={userMode}
                onBack={() => { sfx.click(); setScreen('home'); }}
              />
            )}
            {screen === 'flashcard' && (
              <FlashcardScreen
                level={activeLevelObj}
                userMode={userMode}
                animSpeed={animSpeed}
                onFinishFlashcards={() => handleCompleteFlashcards(activeLevelObj.id)}
                onBackToMap={() => { sfx.click(); setScreen('map'); }}
              />
            )}
            {screen === 'level' && (
              <LevelChallengeRouter
                level={activeLevelObj}
                userMode={userMode}
                animSpeed={animSpeed}
                onOpenFlashcards={() => { sfx.click(); setScreen('flashcard'); }}
                onCompleteLevel={(score: number, stars: number) => handleLevelSuccess(activeLevelObj.id, score, stars)}
                onNextLevel={() => {
                  if (activeLevelObj.id < 20) {
                    handleSelectLevel(activeLevelObj.id + 1, 'level');
                  } else {
                    setScreen('results');
                  }
                }}
                onBackToMap={() => { sfx.click(); setScreen('map'); }}
              />
            )}
            {screen === 'results' && (
              <ResultsScreen
                levels={LEVEL_DATA}
                levelProgress={levelProgress}
                totalScore={totalScore}
                totalStars={totalStars}
                badges={badges}
                onSelectLevel={(lvlId: number) => handleSelectLevel(lvlId, 'level')}
                onBackHome={() => { sfx.click(); setScreen('home'); }}
              />
            )}
            {screen === 'guide' && (
              <GuideScreen
                onBackHome={() => { sfx.click(); setScreen('home'); }}
                onOpenLab={() => { sfx.click(); setScreen('lab'); }}
              />
            )}
          </>
        )}
      </main>

      <footer className="bg-slate-900/80 border-t border-slate-800 py-3 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span><strong>COMPUTER SYSTEM SIMULATOR</strong> — Media Pembelajaran Interaktif Informatika SMP & SMK</span>
          <span className="text-slate-500">Progres tersimpan selama sesi • Mendukung Layar Sentuh & IFP</span>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// HOME SCREEN
// ============================================================================
function HomeScreen({ onStartAdventure, onOpenMap, onOpenLab, onOpenGuide, onOpenResults, totalScore, totalStars, completedLevelsCount, badges, soundOn, setSoundOn, bgmOn, setBgmOn, animSpeed, setAnimSpeed, userMode }: any) {
  const [heroDemoActive, setHeroDemoActive] = useState(true);
  const [heroStep, setHeroStep] = useState(0);

  useEffect(() => {
    if (!heroDemoActive) return;
    const timer = setInterval(() => { setHeroStep((prev: number) => (prev + 1) % 4); }, 1800 / animSpeed);
    return () => clearInterval(timer);
  }, [heroDemoActive, animSpeed]);

  const progressPercentage = Math.round((completedLevelsCount / 20) * 100);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 p-6 md:p-10 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 text-xs md:text-sm font-bold"><Sparkles className="w-4 h-4" /><span>Simulasi Interaktif Informatika SMP & SMK</span></div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">COMPUTER SYSTEM{' '}<span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">SIMULATOR</span></h1>
            <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-2xl">Selamat datang, <strong>Teknisi Komputer Muda!</strong> Mari bertualang mengenal bagaimana <span className="text-sky-300 font-semibold">Input Device</span>, <span className="text-amber-300 font-semibold">Processing Device (CPU)</span>, <span className="text-purple-300 font-semibold">Output Device</span>, <span className="text-emerald-300 font-semibold">Storage Device</span>, serta <span className="text-cyan-300 font-semibold">Konversi Bilangan Biner, Oktal & Heksadesimal</span> bekerja sama mengolah data.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <button onClick={onStartAdventure} className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-base md:text-lg shadow-lg shadow-sky-500/25 transform hover:-translate-y-0.5 active:translate-y-0 transition-all"><Play className="w-6 h-6 fill-white" /><span>MULAI PETUALANGAN</span></button>
              <button onClick={onOpenLab} className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-base md:text-lg shadow-lg shadow-emerald-600/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all"><Zap className="w-6 h-6" /><span>LABORATORIUM ANIMASI</span></button>
              <button onClick={onOpenMap} className="flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-bold border border-slate-700 transition-all"><Compass className="w-5 h-5 text-sky-400" /><span>PETA LEVEL (20 MISI)</span></button>
              <button onClick={onOpenGuide} className="flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-bold border border-slate-700 transition-all"><BookOpen className="w-5 h-5 text-amber-400" /><span>PANDUAN BERMAIN</span></button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" /><span className="text-xs font-bold uppercase tracking-wider text-slate-300">Visualisasi Langsung Alur Sistem</span></div>
              <button onClick={() => setHeroDemoActive(!heroDemoActive)} className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold">{heroDemoActive ? 'Jeda' : 'Putar'}</button>
            </div>
            <div className="grid grid-cols-3 gap-2 items-center text-center py-2">
              {[{step:0,type:'keyboard',label:'1. INPUT',sub:'Keyboard',color:'sky'},{step:1,type:'cpu',label:'2. PROCESS',sub:'CPU',color:'amber'},{step:2,type:'monitor',label:'3. OUTPUT',sub:'Monitor',color:'purple'}].map((item) => (
                <div key={item.step} onClick={() => setHeroStep(item.step)} className={`cursor-pointer p-3 rounded-xl border transition-all flex flex-col items-center ${heroStep === item.step ? `bg-${item.color}-500/20 border-${item.color}-400 scale-105` : 'bg-slate-900/60 border-slate-800 opacity-75'}`}>
                  <HardwareSVG type={item.type} size="sm" active={heroStep === item.step} animate={heroStep === item.step} />
                  <span className={`text-xs font-bold text-${item.color}-300 mt-1`}>{item.label}</span>
                  <span className="text-[11px] text-slate-400">{item.sub}</span>
                </div>
              ))}
            </div>
            <div onClick={() => setHeroStep(3)} className={`cursor-pointer p-3 rounded-xl border transition-all flex items-center justify-center gap-4 ${heroStep === 3 ? 'bg-emerald-500/20 border-emerald-400' : 'bg-slate-900/60 border-slate-800 opacity-75'}`}>
              <HardwareSVG type="ssd" size="sm" active={heroStep === 3} animate={heroStep === 3} />
              <div className="text-left"><div className="text-xs font-bold text-emerald-300">4. STORAGE DEVICE (SSD)</div><div className="text-xs text-slate-300">Menyimpan data dari CPU agar dapat dibuka kembali kapan saja.</div></div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs md:text-sm text-center text-sky-200 font-medium">
              {heroStep === 0 && 'Tahap 1: Pengguna menekan tombol Keyboard untuk memasukkan data ke sistem.'}
              {heroStep === 1 && 'Tahap 2: CPU menerima sinyal data dan mengolah instruksi dengan cepat.'}
              {heroStep === 2 && 'Tahap 3: Hasil pemrosesan CPU dikirim ke Monitor agar tampil secara visual.'}
              {heroStep === 3 && 'Tahap 4: Jika diperintahkan, CPU menyimpan file secara permanen ke dalam SSD.'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between"><h2 className="font-bold text-lg text-white flex items-center gap-2"><Layers className="w-5 h-5 text-sky-400" /><span>Progres Petualangan</span></h2><span className="text-sm font-extrabold text-sky-400">{progressPercentage}%</span></div>
          <div className="space-y-2"><div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden p-0.5"><div className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all duration-500" style={{ width: `${Math.max(progressPercentage, 5)}%` }} /></div><p className="text-xs text-slate-400">{completedLevelsCount} dari 20 Level Tantangan telah diselesaikan.</p></div>
          <button onClick={onOpenResults} className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-xs md:text-sm border border-slate-700 transition-all flex items-center justify-center gap-2"><Award className="w-4 h-4" /><span>Lihat Rapor & Lencana Siswa</span></button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between"><h2 className="font-bold text-lg text-white flex items-center gap-2"><Award className="w-5 h-5 text-amber-400" /><span>Skor & Pencapaian</span></h2></div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5"><div className="text-xl font-black text-sky-400">{totalScore}</div><div className="text-[11px] text-slate-400">Total Skor</div></div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5"><div className="text-xl font-black text-amber-400">{totalStars} / 60</div><div className="text-[11px] text-slate-400">Bintang</div></div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5"><div className="text-xl font-black text-emerald-400">{badges.length} / 20</div><div className="text-[11px] text-slate-400">Lencana</div></div>
          </div>
          <div className="text-xs text-slate-400 truncate">{badges.length > 0 ? `Lencana terbaru: ${badges[badges.length - 1]}` : 'Selesaikan level untuk membuka lencana!'}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-3">
          <h2 className="font-bold text-lg text-white flex items-center gap-2"><Sliders className="w-5 h-5 text-emerald-400" /><span>Pengaturan Suara & Animasi</span></h2>
          <div className="space-y-2.5 text-xs md:text-sm">
            <div className="flex items-center justify-between"><span className="text-slate-300">Efek Suara Interaksi (SFX)</span><button onClick={() => setSoundOn(!soundOn)} className={`px-3 py-1 rounded-lg font-bold ${soundOn ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>{soundOn ? 'AKTIF (ON)' : 'MATI (OFF)'}</button></div>
            <div className="flex items-center justify-between"><span className="text-slate-300">Musik Latar (Ambient)</span><button onClick={() => { if (!soundOn) setSoundOn(true); setBgmOn(!bgmOn); }} className={`px-3 py-1 rounded-lg font-bold ${bgmOn && soundOn ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>{bgmOn && soundOn ? 'AKTIF (ON)' : 'MATI (OFF)'}</button></div>
            <div className="flex items-center justify-between pt-1"><span className="text-slate-300">Kecepatan Simulasi</span><div className="flex gap-1">{[{label:'Lambat',val:0.5},{label:'Normal',val:1},{label:'Cepat',val:2}].map((opt) => (<button key={opt.val} onClick={() => { sfx.click(); setAnimSpeed(opt.val); }} className={`px-2.5 py-1 rounded-lg text-xs font-bold ${animSpeed === opt.val ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{opt.label}</button>))}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LEVEL MAP SCREEN
// ============================================================================
function LevelMapScreen({ levels, levelProgress, userMode, onSelectLevel, onOpenLab, onBackHome }: any) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Peta Petualangan Sistem Komputer</h1>
          <p className="text-slate-400 text-sm">Pilih level untuk <strong>langsung bermain tantangan</strong> atau buka flashcard materi jika memerlukan referensi.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onOpenLab} className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs md:text-sm flex items-center gap-2"><Sparkles className="w-4 h-4" /><span>Buka Lab Animasi Perangkat</span></button>
          <button onClick={onBackHome} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs md:text-sm flex items-center gap-2"><Home className="w-4 h-4" /><span>Beranda</span></button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {levels.map((lvl: LevelData) => {
          const prog = levelProgress[lvl.id];
          const isUnlocked = userMode === 'teacher' || prog?.unlocked;
          return (
            <div key={lvl.id} className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${isUnlocked ? 'bg-slate-900 border-slate-700 hover:border-sky-400 shadow-lg' : 'bg-slate-900/50 border-slate-800/80 opacity-65'}`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-sky-500/20 text-sky-300 border border-sky-500/30">LEVEL {lvl.id}</span>
                  <div className="flex items-center gap-1">{[1, 2, 3].map((s) => (<Star key={s} className={`w-4 h-4 ${prog.stars >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />))}</div>
                </div>
                <h3 className="text-xl font-extrabold text-white">{lvl.title}</h3>
                <p className="text-xs font-semibold text-sky-400">{lvl.subtitle}</p>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">{lvl.description}</p>
              </div>
              <div className="pt-5 mt-5 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400"><span>Skor Terbaik: <strong className="text-white">{prog.score}</strong></span><span>5 Flashcard (Opsional)</span></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => onSelectLevel(lvl.id, 'level')}
                    disabled={!isUnlocked}
                    className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-xs md:text-sm flex items-center justify-center gap-1.5 transition-all ${
                      isUnlocked
                        ? prog.completed
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-md'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed sm:col-span-2'
                    }`}
                  >
                    {isUnlocked ? (
                      <>
                        <Gamepad2 className="w-4 h-4" />
                        <span>{prog.completed ? 'ULANGI GAME' : 'MAINKAN GAME'}</span>
                      </>
                    ) : (
                      <span>SELESAIKAN LEVEL {lvl.id - 1} DAHULU</span>
                    )}
                  </button>
                  {isUnlocked && (
                    <button
                      onClick={() => onSelectLevel(lvl.id, 'flashcard')}
                      className="w-full py-2.5 px-3 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all hover:text-white"
                      title="Pelajari atau baca materi flashcard (opsional)"
                    >
                      <BookOpen className="w-4 h-4 text-sky-400" />
                      <span>Materi (Opsional)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// FLASHCARD SCREEN
// ============================================================================
function FlashcardScreen({ level, userMode, animSpeed, onFinishFlashcards, onBackToMap }: any) {
  const cards = level.flashcards;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [animPlaying, setAnimPlaying] = useState(true);
  const [visitedCards, setVisitedCards] = useState<Record<number, boolean>>({ 0: true });

  const currentCard = cards[currentIdx];
  const handleGoToCard = (newIdx: number) => { sfx.click(); setFlipped(false); setCurrentIdx(newIdx); setVisitedCards((prev) => ({ ...prev, [newIdx]: true })); };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">MATERI LEVEL {level.id} (OPSIONAL)</span>
            <span className="text-xs text-slate-400">Kartu {currentIdx + 1} dari {cards.length}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white mt-1">Flashcard Pembelajaran: {level.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onFinishFlashcards}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Lewati & Langsung Main Game →</span>
          </button>
          <button onClick={onBackToMap} className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300">← Peta Level</button>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2">{cards.map((c: FlashcardData, idx: number) => (<button key={c.id} onClick={() => handleGoToCard(idx)} className={`h-3 rounded-full transition-all ${idx === currentIdx ? 'w-10 bg-sky-400' : visitedCards[idx] ? 'w-3 bg-emerald-400' : 'w-3 bg-slate-700'}`} title={`Kartu ${idx + 1}: ${c.title}`} />))}</div>

      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-sky-500/40 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div><span className="text-xs font-extrabold uppercase tracking-wider text-sky-400">{currentCard.category}</span><h2 className="text-2xl md:text-3xl font-black text-white">{currentCard.title}</h2></div>
          <div className="flex items-center gap-2">
            <button onClick={() => { sfx.click(); setAnimPlaying(!animPlaying); }} className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${animPlaying ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>{animPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}<span>{animPlaying ? 'JEDA ANIMASI' : 'PUTAR ANIMASI'}</span></button>
            <button onClick={() => { sfx.flip(); setFlipped(!flipped); }} className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"><RefreshCw className="w-3.5 h-3.5" /><span>{flipped ? 'LIHAT RINGKASAN DEPAN' : 'BALIK KARTU / CONTOH NYATA'}</span></button>
          </div>
        </div>

        {!flipped ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-2">
            <div className="md:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4">
              <HardwareSVG type={currentCard.svgType} size="lg" active={true} animate={animPlaying} />
              <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-center"><div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Simulasi Konsep:</div><div className="text-xs text-slate-200 font-mono mt-1">{currentCard.animText}</div></div>
            </div>
            <div className="md:col-span-7 space-y-4">
              <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-5 space-y-2"><div className="text-xs font-bold uppercase text-sky-300">Fungsi Utama Perangkat:</div><p className="text-base md:text-lg text-white leading-relaxed font-medium">{currentCard.summary}</p></div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1"><div className="text-xs font-bold uppercase text-amber-400">Contoh Penerapan Sehari-hari:</div><p className="text-sm md:text-base text-slate-300">{currentCard.dailyExample}</p></div>
            </div>
          </div>
        ) : (
          <div className="bg-indigo-950/40 border border-indigo-500/40 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm"><Sparkles className="w-5 h-5" /><span>Penjelasan Mendalam & Contoh Kehidupan Sehari-hari</span></div>
            <p className="text-base md:text-lg text-white leading-relaxed"><strong>{currentCard.title}</strong> termasuk dalam kategori <span className="text-sky-300 font-bold">{currentCard.category}</span>. {currentCard.summary}</p>
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700 space-y-2"><div className="text-xs font-bold text-emerald-400 uppercase">Penerapan oleh Siswa di Sekolah/Rumah:</div><p className="text-sm md:text-base text-slate-200">{currentCard.dailyExample}</p></div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <button onClick={() => currentIdx > 0 && handleGoToCard(currentIdx - 1)} disabled={currentIdx === 0} className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${currentIdx > 0 ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-900 text-slate-600 cursor-not-allowed'}`}><ChevronLeft className="w-5 h-5" /><span>SEBELUMNYA</span></button>
          <div className="text-xs md:text-sm font-bold text-slate-300">Kartu <span className="text-sky-400">{currentIdx + 1}</span> dari {cards.length}</div>
          <div className="flex items-center gap-3">
            {currentIdx < cards.length - 1 && (<button onClick={() => handleGoToCard(currentIdx + 1)} className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-sky-500/20"><span>BERIKUTNYA</span><ChevronRight className="w-5 h-5" /></button>)}
            <button onClick={onFinishFlashcards} className="px-6 py-3 rounded-xl font-extrabold text-sm flex items-center gap-2 transition-all bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25"><Gamepad2 className="w-5 h-5" /><span>MULAI TANTANGAN LEVEL {level.id}</span></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SIMULATION LAB SCREEN (Simplified for brevity - core tabs)
// ============================================================================
function SimulationLabScreen({ animSpeed, setAnimSpeed, userMode, onBack }: any) {
  const [activeTab, setActiveTab] = useState('flow');
  const [typedWord, setTypedWord] = useState('INFORMATIKA');
  const [flyingChar, setFlyingChar] = useState<string | null>(null);
  const [selectedInputDev, setSelectedInputDev] = useState('keyboard');
  const [mouseClickPos, setMouseClickPos] = useState({ x: 50, y: 50, clicked: false });
  const [cpuStep, setCpuStep] = useState(0);
  const [cpuRunning, setCpuRunning] = useState(true);
  const [numA, setNumA] = useState(10);
  const [numB, setNumB] = useState(5);
  const [calcState, setCalcState] = useState('done');
  const [printerPrinting, setPrinterPrinting] = useState(false);
  const [speakerPlaying, setSpeakerPlaying] = useState(false);
  const [selectedStorage, setSelectedStorage] = useState('ssd');
  const [storageFiles, setStorageFiles] = useState([{ name: 'Tugas_Informatika.txt', content: 'Rangkuman Materi Input, Process, Output, dan Storage.', size: '12 KB' }]);
  const [storageStatus, setStorageStatus] = useState('Siap menerima atau membaca file.');
  const [storageActionType, setStorageActionType] = useState<string | null>(null);
  const [openedFileContent, setOpenedFileContent] = useState<any>(null);
  const [fileToDelete, setFileToDelete] = useState<any>(null);
  const [flowStep, setFlowStep] = useState(0);
  const [flowStatus, setFlowStatus] = useState('paused');
  const [saveToSsdOption, setSaveToSsdOption] = useState(true);

  useEffect(() => { if (activeTab !== 'cpu' || !cpuRunning) return; const t = setInterval(() => { setCpuStep((prev) => (prev >= 4 ? 1 : prev + 1)); }, 1500 / animSpeed); return () => clearInterval(t); }, [activeTab, cpuRunning, animSpeed]);
  useEffect(() => { if (activeTab !== 'flow' || flowStatus !== 'running') return; const t = setInterval(() => { setFlowStep((prev) => { if (prev >= 6) { setFlowStatus('paused'); return 6; } if (prev === 4 && !saveToSsdOption) return 6; return prev + 1; }); }, 1800 / animSpeed); return () => clearInterval(t); }, [activeTab, flowStatus, animSpeed, saveToSsdOption]);

  const handleVirtualKey = (char: string) => { sfx.keyPress(); setFlyingChar(char); setTypedWord((prev) => (prev.length >= 18 ? char : prev + char)); setTimeout(() => setFlyingChar(null), 650 / animSpeed); };
  const triggerAdditionSim = () => { sfx.click(); setCalcState('processing'); setTimeout(() => { sfx.correct(); setCalcState('done'); }, 1000 / animSpeed); };
  const handleSaveFileToStorage = (fileName: string, content: string) => { sfx.saveFile(); setStorageActionType('write'); setStorageStatus(`Menyimpan "${fileName}" menuju ${selectedStorage.toUpperCase()}...`); setTimeout(() => { setStorageFiles((prev) => { if (prev.some((f) => f.name === fileName)) return prev; return [...prev, { name: fileName, content, size: '18 KB' }]; }); setStorageStatus(`File "${fileName}" berhasil disimpan di ${selectedStorage.toUpperCase()}!`); }, 700 / animSpeed); };
  const handleReadFileFromStorage = (file: any) => { sfx.click(); setStorageActionType('read'); setStorageStatus(`Membaca file "${file.name}" dari ${selectedStorage.toUpperCase()} ke Monitor...`); setTimeout(() => { setOpenedFileContent(file); setStorageStatus(`File "${file.name}" berhasil dibuka!`); }, 600 / animSpeed); };
  const confirmDeleteFile = () => { if (!fileToDelete) return; sfx.deleteFile(); const targetName = fileToDelete.name; setStorageActionType('delete'); setStorageFiles((prev) => prev.filter((f) => f.name !== targetName)); if (openedFileContent?.name === targetName) setOpenedFileContent(null); setStorageStatus(`File "${targetName}" telah dihapus dari penyimpanan.`); setFileToDelete(null); };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2.5"><Sparkles className="w-7 h-7 text-emerald-400" /><span>Laboratorium Animasi Perangkat & Alur Sistem</span></h1><p className="text-slate-400 text-xs md:text-sm">Eksplorasi cara kerja Input, Processing (CPU), Output, Storage, dan Alur Sistem Komputer secara visual.</p></div>
        <button onClick={onBack} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs md:text-sm">← Kembali ke Beranda</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[{id:'flow',label:'E. Alur Sistem Komputer'},{id:'input',label:'A. Animasi Input Device'},{id:'cpu',label:'B. Animasi Processing (CPU)'},{id:'output',label:'C. Animasi Output Device'},{id:'storage',label:'D. Animasi Storage Device'}].map((t) => (
          <button key={t.id} onClick={() => { sfx.click(); setActiveTab(t.id); }} className={`px-4 py-3 rounded-xl font-extrabold text-xs md:text-sm transition-all border ${activeTab === t.id ? 'bg-sky-500 text-slate-950 border-sky-300 shadow-lg' : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'}`}>{t.label}</button>
        ))}
      </div>

      {/* TAB E: ALUR SISTEM KOMPUTER */}
      {activeTab === 'flow' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div><h2 className="text-xl font-extrabold text-white">Simulasi Utama Alur Sistem Komputer: INPUT → PROCESSING → OUTPUT (+ STORAGE)</h2></div>
            <div className="flex flex-wrap items-center gap-2">
              {flowStatus !== 'running' ? (
                <button onClick={() => { sfx.click(); if (flowStep === 0 || flowStep >= 6) setFlowStep(1); setFlowStatus('running'); }} className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs md:text-sm flex items-center gap-1.5"><Play className="w-4 h-4 fill-slate-950" /><span>{flowStep > 0 && flowStep < 6 ? 'LANJUTKAN' : 'JALANKAN SIMULASI'}</span></button>
              ) : (
                <button onClick={() => { sfx.click(); setFlowStatus('paused'); }} className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs md:text-sm flex items-center gap-1.5"><Pause className="w-4 h-4" /><span>JEDA</span></button>
              )}
              <button onClick={() => { sfx.click(); setFlowStatus('paused'); setFlowStep(1); }} className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs md:text-sm flex items-center gap-1.5"><RotateCcw className="w-4 h-4" /><span>ULANGI</span></button>
              <button onClick={() => { sfx.click(); setSaveToSsdOption(!saveToSsdOption); }} className={`px-3.5 py-2.5 rounded-xl font-bold text-xs border transition-all ${saveToSsdOption ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>{saveToSsdOption ? '✓ Simpan ke SSD: AKTIF' : 'Simpan ke SSD: NONAKTIF'}</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center py-4">
            <div className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center text-center ${flowStep === 1 || flowStep === 2 ? 'bg-sky-500/15 border-sky-400 shadow-lg shadow-sky-500/20' : 'bg-slate-950/80 border-slate-800'}`}>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-500/20 text-sky-300 mb-2">1. INPUT DEVICE</span>
              <HardwareSVG type="keyboard" size="lg" active={flowStep === 1 || flowStep === 2} animate={flowStep === 1} />
              <h3 className="font-bold text-white mt-2">Keyboard</h3>
              {flowStep === 2 && <div className="mt-3 px-3 py-1 rounded-full bg-sky-400 text-slate-950 font-mono text-xs font-extrabold animate-bounce">DATA: &quot;INFORMATIKA&quot; ➔</div>}
            </div>
            <div className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center text-center ${flowStep === 2 || flowStep === 3 || flowStep === 4 || flowStep === 5 ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/20' : 'bg-slate-950/80 border-slate-800'}`}>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-300 mb-2">2. PROCESSING DEVICE</span>
              <HardwareSVG type="cpu" size="lg" active={flowStep === 3} animate={flowStep === 3} />
              <h3 className="font-bold text-white mt-2">CPU (Prosesor)</h3>
              {flowStep === 3 && <div className="mt-3 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-mono text-xs font-extrabold animate-pulse">⚡ MEMPROSES INSTRUKSI...</div>}
            </div>
            <div className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center text-center ${flowStep === 4 || flowStep === 6 ? 'bg-purple-500/15 border-purple-400 shadow-lg shadow-purple-500/20' : 'bg-slate-950/80 border-slate-800'}`}>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-500/20 text-purple-300 mb-2">3. OUTPUT DEVICE</span>
              <HardwareSVG type="monitor" size="lg" active={flowStep >= 4} animate={flowStep >= 4} />
              <h3 className="font-bold text-white mt-2">Monitor</h3>
              {flowStep >= 4 && <div className="mt-3 px-3 py-1 rounded-full bg-purple-400 text-slate-950 font-mono text-xs font-extrabold">LAYAR: &quot;INFORMATIKA&quot;</div>}
            </div>
          </div>

          <div className="max-w-md mx-auto">
            <div className="flex justify-center mb-2"><div className={`h-8 w-1 rounded ${flowStep === 5 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`} /></div>
            <div className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-4 ${flowStep === 5 ? 'bg-emerald-500/20 border-emerald-400 shadow-lg shadow-emerald-500/20' : 'bg-slate-950/80 border-slate-800'}`}>
              <HardwareSVG type="ssd" size="md" active={flowStep === 5} animate={flowStep === 5} />
              <div><span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300">STORAGE DEVICE</span><h4 className="font-bold text-white text-sm mt-1">SSD (Solid State Drive)</h4></div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase">Pilih Tahapan Secara Manual:</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {[{step:1,title:'1. Input Diterima',desc:'Keyboard menerima ketikan.'},{step:2,title:'2. Kirim ke CPU',desc:'Data dikirim menuju CPU.'},{step:3,title:'3. CPU Memproses',desc:'CPU mengolah data.'},{step:4,title:'4. Tampil ke Monitor',desc:'Hasil ke Monitor.'},{step:5,title:'5. Simpan ke SSD',desc:'Data disimpan ke SSD.'},{step:6,title:'6. Ringkasan Alur',desc:'Siklus selesai!'}].map((item) => (
                <button key={item.step} onClick={() => { sfx.click(); setFlowStatus('paused'); setFlowStep(item.step); }} className={`p-2.5 rounded-xl border text-left transition-all ${flowStep === item.step ? 'bg-sky-500/20 border-sky-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}>
                  <div className="text-xs font-extrabold text-sky-300">{item.title}</div><div className="text-[11px] mt-1 leading-snug">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB A: INPUT DEVICE */}
      {activeTab === 'input' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div><h2 className="text-xl font-extrabold text-white">A. Simulasi Perangkat Masukan (Input Device)</h2></div>
            <div className="flex flex-wrap gap-1.5">
              {[{id:'keyboard',name:'Keyboard'},{id:'mouse',name:'Mouse'},{id:'mic',name:'Mikrofon'},{id:'scanner',name:'Scanner'},{id:'webcam',name:'Webcam'},{id:'touchscreen',name:'Touchscreen'}].map((dev) => (
                <button key={dev.id} onClick={() => { sfx.click(); setSelectedInputDev(dev.id); }} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${selectedInputDev === dev.id ? 'bg-sky-500 text-slate-950 border-sky-300' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>{dev.name}</button>
              ))}
            </div>
          </div>

          {selectedInputDev === 'keyboard' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-950 border border-slate-800 rounded-2xl p-5">
                <div className="flex flex-col items-center"><HardwareSVG type="keyboard" size="md" active={true} animate={!!flyingChar} /><span className="text-xs font-bold text-sky-300 mt-1">Keyboard Virtual</span></div>
                <div className="flex flex-col items-center justify-center h-16 relative">
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className={`h-full bg-gradient-to-r from-sky-400 to-amber-400 transition-all ${flyingChar ? 'w-full' : 'w-1/4'}`} /></div>
                  {flyingChar ? <div className="mt-2 px-3 py-1 rounded-full bg-sky-400 text-slate-950 font-extrabold text-sm animate-bounce">Mengirim huruf &apos;{flyingChar}&apos; ➔ CPU</div> : <span className="text-xs text-slate-400 mt-2">Ketuk tombol huruf di bawah!</span>}
                </div>
                <div className="flex flex-col items-center"><HardwareSVG type="cpu" size="md" active={!!flyingChar} animate={!!flyingChar} /><div className="mt-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-sm font-bold text-amber-300">Data Diterima: &quot;{typedWord}&quot;</div></div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-400">Ketuk tombol keyboard virtual:</span><button onClick={() => { sfx.click(); setTypedWord(''); }} className="text-xs px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold">Bersihkan Teks</button></div>
                <div className="flex flex-wrap justify-center gap-1.5">{'INFORMATIKA12345'.split('').map((ch, i) => (<button key={i} onClick={() => handleVirtualKey(ch)} className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-slate-800 hover:bg-sky-500 hover:text-slate-950 active:scale-95 text-white font-extrabold text-base border border-slate-700 transition-all shadow">{ch}</button>))}</div>
              </div>
            </div>
          )}

          {selectedInputDev === 'mouse' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center space-y-3"><HardwareSVG type="mouse" size="lg" active={true} animate={mouseClickPos.clicked} /><h3 className="text-lg font-bold text-white">Simulasi Pergerakan & Klik Mouse</h3><p className="text-xs md:text-sm text-slate-300">Mouse mengirimkan data koordinat posisi (X, Y) dan sinyal klik ke CPU.</p></div>
              <div onClick={(e) => { sfx.click(); const rect = e.currentTarget.getBoundingClientRect(); const x = Math.round(((e.clientX - rect.left) / rect.width) * 100); const y = Math.round(((e.clientY - rect.top) / rect.height) * 100); setMouseClickPos({ x, y, clicked: true }); setTimeout(() => setMouseClickPos((p) => ({ ...p, clicked: false })), 500); }} className="h-56 bg-slate-950 border-2 border-dashed border-sky-500/50 rounded-2xl relative cursor-crosshair flex items-center justify-center overflow-hidden">
                <span className="text-xs text-slate-400 pointer-events-none">Klik di mana saja!</span>
                <div style={{ left: `${mouseClickPos.x}%`, top: `${mouseClickPos.y}%` }} className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-200"><div className="w-6 h-6 rounded-full bg-sky-400/40 border-2 border-sky-300 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-white" /></div><span className="text-[10px] font-mono bg-slate-900 px-1.5 py-0.5 rounded text-sky-300">X:{mouseClickPos.x} Y:{mouseClickPos.y}</span></div>
              </div>
            </div>
          )}

          {['mic', 'scanner', 'webcam', 'touchscreen'].includes(selectedInputDev) && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="flex flex-col items-center text-center space-y-3"><HardwareSVG type={selectedInputDev} size="lg" active={true} animate={true} /><h3 className="text-lg font-extrabold text-white uppercase">{selectedInputDev}</h3></div>
              <div className="space-y-3">
                <div className="text-xs font-bold text-sky-400 uppercase">Cara Kerja Input:</div>
                {selectedInputDev === 'mic' && <p className="text-sm md:text-base text-slate-200"><strong>Mikrofon</strong> menangkap gelombang suara dan mengubahnya menjadi sinyal audio digital.</p>}
                {selectedInputDev === 'scanner' && <p className="text-sm md:text-base text-slate-200"><strong>Scanner</strong> menggunakan sensor cahaya untuk memindai dokumen menjadi file gambar digital.</p>}
                {selectedInputDev === 'webcam' && <p className="text-sm md:text-base text-slate-200"><strong>Webcam</strong> menangkap gambar atau video wajah pengguna secara langsung.</p>}
                {selectedInputDev === 'touchscreen' && <p className="text-sm md:text-base text-slate-200"><strong>Touchscreen</strong> mendeteksi sentuhan jari pengguna sebagai perintah input.</p>}
                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-200 font-mono">Sinyal Input ➔ Dikirim ke CPU (Processing)</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB B: CPU */}
      {activeTab === 'cpu' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div><h2 className="text-xl font-extrabold text-white">B. Visualisasi Internal CPU</h2></div>
            <button onClick={() => { sfx.click(); setCpuRunning(!cpuRunning); }} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5">{cpuRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}<span>{cpuRunning ? 'JEDA' : 'LANJUTKAN'}</span></button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 bg-slate-950 border-2 border-amber-500/40 rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className={`p-4 rounded-xl border transition-all ${cpuStep === 1 || cpuStep === 2 ? 'bg-sky-500/20 border-sky-400' : 'bg-slate-900 border-slate-800'}`}><div className="text-xs font-extrabold text-sky-300">1. CONTROL UNIT (CU)</div><p className="text-[11px] text-slate-300 mt-1">Mengatur dan menerjemahkan instruksi.</p></div>
                <div className={`p-4 rounded-xl border transition-all ${cpuStep === 3 ? 'bg-amber-500/20 border-amber-400 scale-105' : 'bg-slate-900 border-slate-800'}`}><div className="text-xs font-extrabold text-amber-300">2. ALU</div><p className="text-[11px] text-slate-300 mt-1">Melakukan perhitungan matematika.</p></div>
                <div className={`p-4 rounded-xl border transition-all ${cpuStep === 4 ? 'bg-emerald-500/20 border-emerald-400' : 'bg-slate-900 border-slate-800'}`}><div className="text-xs font-extrabold text-emerald-300">3. REGISTER / CACHE</div><p className="text-[11px] text-slate-300 mt-1">Menyimpan hasil sementara.</p></div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs font-mono">
                <span className={cpuStep === 1 ? 'text-sky-300 font-bold' : 'text-slate-500'}>[Data Masuk]</span><span>➔</span>
                <span className={cpuStep === 2 ? 'text-sky-300 font-bold' : 'text-slate-500'}>[CU]</span><span>➔</span>
                <span className={cpuStep === 3 ? 'text-amber-300 font-bold' : 'text-slate-500'}>[ALU]</span><span>➔</span>
                <span className={cpuStep === 4 ? 'text-emerald-300 font-bold' : 'text-slate-500'}>[Output]</span>
              </div>
            </div>
            <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex justify-center"><HardwareSVG type="cpu" size="lg" active={true} animate={cpuRunning} /></div>
              <h3 className="font-bold text-white text-center">Konsep Dasar Pemrosesan</h3>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed"><strong>CPU</strong> mengolah data mentah dari perangkat Input menjadi informasi yang bermanfaat.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB C: OUTPUT */}
      {activeTab === 'output' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div><h2 className="text-xl font-extrabold text-white">C. Simulasi Perangkat Keluaran (Output Device)</h2></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3"><span className="text-xs font-bold text-purple-400 uppercase">1. Simulasi Monitor</span><div className="flex justify-center"><HardwareSVG type="monitor" size="md" active={true} animate={calcState === 'done'} /></div>
                <div className="flex items-center justify-center gap-2"><input type="number" value={numA} onChange={(e) => setNumA(Number(e.target.value) || 0)} className="w-16 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-center font-bold text-white" /><span className="font-bold text-sky-400">+</span><input type="number" value={numB} onChange={(e) => setNumB(Number(e.target.value) || 0)} className="w-16 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-center font-bold text-white" /><button onClick={triggerAdditionSim} className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs">Hitung</button></div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-purple-500/40 text-center font-mono">{calcState === 'processing' ? <span className="text-amber-300 text-xs animate-pulse">CPU sedang menghitung...</span> : <span className="text-emerald-300 font-extrabold text-sm">Monitor: {numA} + {numB} = {numA + numB}</span>}</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3"><span className="text-xs font-bold text-sky-400 uppercase">2. Simulasi Printer</span><div className="flex justify-center"><HardwareSVG type="printer" size="md" active={printerPrinting} animate={printerPrinting} /></div></div>
              <div className="space-y-2">{printerPrinting && <div className="p-2 rounded-lg bg-white text-slate-900 text-xs font-mono text-center animate-bounce">📄 Mencetak: Laporan_Informatika.pdf</div>}<button onClick={() => { sfx.click(); setPrinterPrinting(true); setTimeout(() => setPrinterPrinting(false), 2200); }} className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs">{printerPrinting ? 'Sedang Mencetak...' : 'CETAK DOKUMEN'}</button></div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3"><span className="text-xs font-bold text-emerald-400 uppercase">3. Simulasi Speaker</span><div className="flex justify-center"><HardwareSVG type="speaker" size="md" active={speakerPlaying} animate={speakerPlaying} /></div></div>
              <button onClick={() => { setSpeakerPlaying(true); sfx.correct(); setTimeout(() => setSpeakerPlaying(false), 1500); }} className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs">{speakerPlaying ? '🔊 Suara Aktif...' : 'MAINKAN AUDIO'}</button>
            </div>
          </div>
        </div>
      )}

      {/* TAB D: STORAGE */}
      {activeTab === 'storage' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div><h2 className="text-xl font-extrabold text-white">D. Simulasi Perangkat Penyimpanan (Storage Device)</h2></div>
            <div className="flex gap-1.5">{[{id:'ssd',name:'SSD'},{id:'hdd',name:'HDD'},{id:'flashdisk',name:'Flashdisk'},{id:'sdcard',name:'Kartu Memori'}].map((st) => (<button key={st.id} onClick={() => { sfx.click(); setSelectedStorage(st.id); }} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${selectedStorage === st.id ? 'bg-emerald-500 text-slate-950 border-emerald-300' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>{st.name}</button>))}</div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="text-xs font-bold text-sky-400 uppercase">1. File Baru (Siap Disimpan):</div>
              {[{name:'Tugas_Informatika.txt',content:'Catatan: Input, Processing, Output, dan Storage.'},{name:'Presentasi_Kelompok.pptx',content:'Slide Presentasi Sistem Komputer.'},{name:'Nilai_Praktikum.xlsx',content:'Daftar Skor Simulasi.'}].map((item) => (
                <div key={item.name} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate"><FileText className="w-4 h-4 text-sky-400 shrink-0" /><span className="text-xs font-bold text-white truncate">{item.name}</span></div>
                  <button onClick={() => handleSaveFileToStorage(item.name, item.content)} className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shrink-0 flex items-center gap-1"><Save className="w-3.5 h-3.5" /><span>Simpan</span></button>
                </div>
              ))}
            </div>
            <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-between text-center space-y-4">
              <HardwareSVG type={selectedStorage} size="lg" active={true} animate={!!storageActionType} />
              <div><h3 className="font-extrabold text-white text-lg uppercase">{selectedStorage}</h3><div className={`mt-2 px-3 py-2 rounded-xl text-xs font-bold border ${storageActionType === 'write' ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : storageActionType === 'read' ? 'bg-sky-500/20 border-sky-400 text-sky-300' : storageActionType === 'delete' ? 'bg-rose-500/20 border-rose-400 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>{storageStatus}</div></div>
            </div>
            <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="text-xs font-bold text-emerald-400 uppercase">2. Isi Penyimpanan ({storageFiles.length} File):</div>
              {storageFiles.length === 0 ? <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">Penyimpanan kosong.</div> : (
                <div className="space-y-2">{storageFiles.map((f) => (
                  <div key={f.name} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                    <div className="truncate"><div className="text-xs font-bold text-white truncate">{f.name}</div><div className="text-[10px] text-slate-400">{f.size}</div></div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => handleReadFileFromStorage(f)} className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-bold flex items-center gap-1"><FolderOpen className="w-3.5 h-3.5" /><span>Buka</span></button>
                      <button onClick={() => { sfx.click(); setFileToDelete(f); }} className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}</div>
              )}
              {openedFileContent && <div className="p-3.5 rounded-xl bg-sky-950/50 border border-sky-500/40 space-y-1"><div className="text-[11px] font-bold text-sky-300">📖 Isi File ({openedFileContent.name}):</div><p className="text-xs text-white font-mono">{openedFileContent.content}</p></div>}
            </div>
          </div>

          {fileToDelete && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border-2 border-rose-500 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center gap-3 text-rose-400"><AlertTriangle className="w-7 h-7 shrink-0" /><h3 className="text-lg font-extrabold text-white">Konfirmasi Hapus File</h3></div>
                <p className="text-sm text-slate-300">Apakah kamu yakin ingin menghapus file <strong className="text-white">&quot;{fileToDelete.name}&quot;</strong>?</p>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button onClick={() => setFileToDelete(null)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs">Batal</button>
                  <button onClick={confirmDeleteFile} className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-xs">Ya, Hapus File</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// LEVEL CHALLENGE ROUTER
// ============================================================================
function LevelChallengeRouter({ level, userMode, animSpeed, onOpenFlashcards, onCompleteLevel, onNextLevel, onBackToMap }: any) {
  const [levelDoneModal, setLevelDoneModal] = useState<{ score: number; stars: number; summary: string } | null>(null);
  const triggerLevelWin = (score: number, stars: number, summary: string) => { onCompleteLevel(score, stars); setLevelDoneModal({ score, stars, summary }); };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-3">
        <div><div className="flex items-center gap-2"><span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">TANTANGAN LEVEL {level.id}</span></div><h1 className="text-xl md:text-2xl font-black text-white mt-1">{level.title}</h1></div>
        <div className="flex items-center gap-2">
          <button onClick={onOpenFlashcards} className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-xs flex items-center gap-1.5 border border-slate-700"><BookOpen className="w-4 h-4" /><span>Buka Flashcard</span></button>
          <button onClick={onBackToMap} className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs">Peta Level</button>
        </div>
      </div>

      {level.id === 1 && <Level1SortHardware onWin={triggerLevelWin} />}
      {level.id === 2 && <Level2BuildFlow onWin={triggerLevelWin} />}
      {level.id === 3 && <Level3InputOutputSim onWin={triggerLevelWin} />}
      {level.id === 4 && <Level4StorageMission onWin={triggerLevelWin} />}
      {level.id === 5 && <Level5Troubleshooting onWin={triggerLevelWin} />}
      {level.id === 6 && <Level6BuildPCSystem onWin={triggerLevelWin} />}
      {level.id === 7 && <Level7BinaryBasics onWin={triggerLevelWin} />}
      {level.id === 8 && <Level8BinaryToDecimal onWin={triggerLevelWin} />}
      {level.id === 9 && <Level9DecimalToBinary onWin={triggerLevelWin} />}
      {level.id === 10 && <Level10OctalToDecimal onWin={triggerLevelWin} />}
      {level.id === 11 && <Level11BinaryToOctal onWin={triggerLevelWin} />}
      {level.id === 12 && <Level12HexBasics onWin={triggerLevelWin} />}
      {level.id === 13 && <Level13HexToDecimal onWin={triggerLevelWin} />}
      {level.id === 14 && <Level14DecimalToHex onWin={triggerLevelWin} />}
      {level.id === 15 && <Level15BinaryToHex onWin={triggerLevelWin} />}
      {level.id === 16 && <Level16HexToBinary onWin={triggerLevelWin} />}
      {level.id === 17 && <Level17HexToOctal onWin={triggerLevelWin} />}
      {level.id === 18 && <Level18OctalToHex onWin={triggerLevelWin} />}
      {level.id === 19 && <Level19HexColorAscii onWin={triggerLevelWin} />}
      {level.id === 20 && <Level20GrandMasterMultiBase onWin={triggerLevelWin} />}

      {levelDoneModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-400 rounded-3xl max-w-lg w-full p-6 md:p-8 text-center space-y-5 shadow-2xl">
            <div className="flex justify-center gap-2">{[1, 2, 3].map((s) => (<Star key={s} className={`w-10 h-10 ${levelDoneModal.stars >= s ? 'text-amber-400 fill-amber-400 animate-bounce' : 'text-slate-700'}`} />))}</div>
            <div><span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300">LEVEL {level.id} SELESAI!</span><h2 className="text-2xl md:text-3xl font-black text-white mt-2">Luar Biasa, Teknisi Muda!</h2><p className="text-sm text-slate-300 mt-1">{levelDoneModal.summary}</p></div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-around">
              <div><div className="text-xs text-slate-400">Total Poin</div><div className="text-2xl font-black text-sky-400">+{levelDoneModal.score}</div></div>
              <div className="h-8 w-px bg-slate-800" />
              <div><div className="text-xs text-slate-400">Lencana</div><div className="text-sm font-extrabold text-amber-300">{level.badgeName}</div></div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button onClick={() => setLevelDoneModal(null)} className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs md:text-sm">Ulangi Level</button>
              <button onClick={() => { setLevelDoneModal(null); onNextLevel(); }} className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-lg"><span>{level.id < 20 ? `LANJUT KE LEVEL ${level.id + 1}` : 'LIHAT HASIL BELAJAR'}</span><ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// LEVEL 1: SORT HARDWARE
// ============================================================================
function Level1SortHardware({ onWin }: { onWin: (score: number, stars: number, summary: string) => void }) {
  const items = useMemo(() => [
    { id: 'kbd', name: 'Keyboard', svg: 'keyboard', correctCat: 'Input', explain: 'Keyboard merupakan perangkat Input.' },
    { id: 'cpu', name: 'CPU', svg: 'cpu', correctCat: 'Processing', explain: 'CPU adalah perangkat Processing.' },
    { id: 'mon', name: 'Monitor', svg: 'monitor', correctCat: 'Output', explain: 'Monitor merupakan perangkat Output.' },
    { id: 'ssd', name: 'SSD', svg: 'ssd', correctCat: 'Storage', explain: 'SSD adalah perangkat Storage.' },
    { id: 'mse', name: 'Mouse', svg: 'mouse', correctCat: 'Input', explain: 'Mouse adalah perangkat Input.' },
    { id: 'prn', name: 'Printer', svg: 'printer', correctCat: 'Output', explain: 'Printer adalah perangkat Output.' },
    { id: 'ram', name: 'RAM', svg: 'ram', correctCat: 'Processing', explain: 'RAM mendampingi CPU dalam Processing.' },
    { id: 'usb', name: 'Flashdisk', svg: 'flashdisk', correctCat: 'Storage', explain: 'Flashdisk termasuk Storage portabel.' }
  ], []);

  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [selectedItemId, setSelectedItemId] = useState('kbd');
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<{ type: string; text: string } | null>(null);
  const [usedHint, setUsedHint] = useState(false);

  const remainingItems = items.filter((it) => !placed[it.id]);
  const activeItem = items.find((it) => it.id === selectedItemId) || remainingItems[0];

  const handleAssignCategory = (categoryName: string) => {
    if (!activeItem) return;
    if (activeItem.correctCat === categoryName) {
      sfx.correct();
      const nextPlaced = { ...placed, [activeItem.id]: categoryName };
      setPlaced(nextPlaced);
      setFeedback({ type: 'ok', text: `Tepat! ${activeItem.explain}` });
      const nextRem = items.filter((it) => !nextPlaced[it.id]);
      if (nextRem.length > 0) { setSelectedItemId(nextRem[0].id); } else {
        const baseScore = items.length * 100;
        const bonus = !usedHint && mistakes === 0 ? 50 : 0;
        const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
        setTimeout(() => { onWin(baseScore + bonus, stars, 'Kamu berhasil mengklasifikasikan seluruh perangkat!'); }, 700);
      }
    } else {
      sfx.wrong(); setMistakes((m) => m + 1);
      setFeedback({ type: 'err', text: `Belum tepat! ${activeItem.explain} Coba kategori ${activeItem.correctCat} Device!` });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg md:text-xl font-extrabold text-white">Kelompokkan 8 Perangkat ke Kategori yang Tepat!</h2>
        <button onClick={() => { sfx.click(); setUsedHint(true); if (activeItem) setFeedback({ type: 'hint', text: `Petunjuk: ${activeItem.explain}` }); }} className="px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-bold flex items-center gap-1.5"><HelpCircle className="w-4 h-4" /><span>Petunjuk</span></button>
      </div>

      <div className="flex flex-wrap gap-3 justify-center bg-slate-950 border border-slate-800 rounded-2xl p-4">
        {remainingItems.length === 0 ? <div className="text-emerald-400 font-bold text-sm py-3">✓ Semua perangkat telah dikelompokkan!</div> : remainingItems.map((it) => (
          <button key={it.id} onClick={() => { sfx.click(); setSelectedItemId(it.id); }} className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${activeItem?.id === it.id ? 'bg-sky-500/20 border-sky-400 scale-105 shadow-lg' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}>
            <HardwareSVG type={it.svg} size="sm" active={activeItem?.id === it.id} /><span className="text-xs font-extrabold text-white">{it.name}</span>
          </button>
        ))}
      </div>

      {feedback && <div className={`p-4 rounded-2xl border flex items-start gap-3 ${feedback.type === 'ok' ? 'bg-emerald-500/15 border-emerald-400 text-emerald-200' : feedback.type === 'hint' ? 'bg-amber-500/15 border-amber-400 text-amber-200' : 'bg-rose-500/15 border-rose-400 text-rose-200'}`}>{feedback.type === 'ok' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> : <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}<div className="text-xs md:text-sm font-medium">{feedback.text}</div></div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[{id:'Input',label:'INPUT DEVICE',color:'sky'},{id:'Processing',label:'PROCESSING DEVICE',color:'amber'},{id:'Output',label:'OUTPUT DEVICE',color:'purple'},{id:'Storage',label:'STORAGE DEVICE',color:'emerald'}].map((cat) => {
          const catItems = items.filter((it) => placed[it.id] === cat.id);
          return (
            <div key={cat.id} onClick={() => handleAssignCategory(cat.id)} className="cursor-pointer bg-slate-950 hover:bg-slate-900 border-2 border-dashed border-slate-700 hover:border-sky-400 rounded-2xl p-4 flex flex-col justify-between min-h-[210px] transition-all">
              <div><div className="text-xs font-black text-sky-400 uppercase">{cat.label}</div><div className="flex flex-wrap gap-2 mt-3">{catItems.map((ci) => (<div key={ci.id} className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-bold flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /><span>{ci.name}</span></div>))}</div></div>
              <div className="mt-4 pt-2 border-t border-slate-800 text-center text-xs font-bold text-sky-300">{activeItem ? `+ Tempatkan "${activeItem.name}" di sini` : 'Selesai'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// LEVEL 2: BUILD FLOW
// ============================================================================
function Level2BuildFlow({ onWin }: { onWin: (score: number, stars: number, summary: string) => void }) {
  const scenarios = [
    { id: 1, title: 'Misi 1 dari 3: Alur Menampilkan Ketikan', prompt: 'Susun urutan perangkat ketika siswa mengetik huruf hingga tampil di layar!', correctOrder: ['Keyboard', 'CPU', 'Monitor'], explain: 'Data masuk dari Keyboard → CPU → Monitor.' },
    { id: 2, title: 'Misi 2 dari 3: Alur Menyimpan Dokumen', prompt: 'Siswa menekan Save. Susun alur perangkatnya!', correctOrder: ['Keyboard', 'CPU', 'SSD'], explain: 'Keyboard → CPU → SSD (tersimpan permanen).' },
    { id: 3, title: 'Misi 3 dari 3: Alur Membuka File Lama', prompt: 'Siswa membuka file dari SSD ke Monitor. Susun alur datanya!', correctOrder: ['SSD', 'CPU', 'Monitor'], explain: 'SSD → CPU → Monitor.' }
  ];
  const [scenIdx, setScenIdx] = useState(0);
  const [selectedChain, setSelectedChain] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ type: string; text: string } | null>(null);
  const [animSuccess, setAnimSuccess] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const currentScen = scenarios[scenIdx];
  const availableCards = [{ name: 'Keyboard', svg: 'keyboard', role: 'Input' }, { name: 'CPU', svg: 'cpu', role: 'Processing' }, { name: 'Monitor', svg: 'monitor', role: 'Output' }, { name: 'SSD', svg: 'ssd', role: 'Storage' }];
  const handleAddCard = (cardName: string) => { if (selectedChain.length >= 3 || animSuccess) return; sfx.click(); setSelectedChain((prev) => [...prev, cardName]); };
  const handleCheckChain = () => { if (selectedChain.length < 3) { setFeedback({ type: 'err', text: 'Pilih 3 perangkat!' }); return; } const isCorrect = selectedChain.every((val, i) => val === currentScen.correctOrder[i]); if (isCorrect) { sfx.correct(); setAnimSuccess(true); setFeedback({ type: 'ok', text: `Benar! ${currentScen.explain}` }); } else { sfx.wrong(); setMistakes((m) => m + 1); setFeedback({ type: 'err', text: `Belum tepat. ${currentScen.explain}` }); } };
  const handleNextScenario = () => { sfx.click(); if (scenIdx < scenarios.length - 1) { setScenIdx(scenIdx + 1); setSelectedChain([]); setFeedback(null); setAnimSuccess(false); } else { const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1; onWin(350, stars, 'Kamu memahami urutan pengolahan data serta peran Storage!'); } };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-2"><span className="text-xs font-extrabold text-sky-400 uppercase">{currentScen.title}</span><p className="text-base md:text-lg font-bold text-white">{currentScen.prompt}</p></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{availableCards.map((c) => (<button key={c.name} onClick={() => handleAddCard(c.name)} className="p-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-700 flex flex-col items-center gap-2"><HardwareSVG type={c.svg} size="sm" active={true} /><span className="font-extrabold text-white text-sm">{c.name}</span></button>))}</div>
      <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-400 uppercase">Susunan Alur:</span><button onClick={() => { sfx.click(); setSelectedChain([]); setFeedback(null); setAnimSuccess(false); }} className="text-xs text-rose-400 font-bold hover:underline">Kosongkan</button></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          {[0, 1, 2].map((slotIdx) => { const chosenName = selectedChain[slotIdx]; const cardObj = availableCards.find((c) => c.name === chosenName); return (
            <div key={slotIdx} className={`p-4 rounded-2xl border-2 min-h-[120px] flex flex-col items-center justify-center text-center transition-all ${chosenName ? animSuccess ? 'bg-emerald-500/20 border-emerald-400' : 'bg-sky-500/15 border-sky-400' : 'bg-slate-900 border-dashed border-slate-700'}`}>
              <span className="text-[11px] font-bold text-slate-400 mb-1">URUTAN {slotIdx + 1}</span>
              {cardObj ? (<><HardwareSVG type={cardObj.svg} size="sm" active={true} animate={animSuccess} /><span className="font-extrabold text-white text-sm mt-1">{cardObj.name}</span></>) : <span className="text-xs text-slate-500">Pilih perangkat...</span>}
            </div>
          ); })}
        </div>
      </div>
      {feedback && <div className={`p-4 rounded-2xl border text-xs md:text-sm font-medium ${feedback.type === 'ok' ? 'bg-emerald-500/15 border-emerald-400 text-emerald-200' : 'bg-rose-500/15 border-rose-400 text-rose-200'}`}>{feedback.text}</div>}
      <div className="flex justify-end gap-3">
        {!animSuccess ? <button onClick={handleCheckChain} className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-sm">PERIKSA ALUR</button> : <button onClick={handleNextScenario} className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm flex items-center gap-2"><span>{scenIdx < scenarios.length - 1 ? 'LANJUT MISI' : 'SELESAIKAN LEVEL 2'}</span><ArrowRight className="w-4 h-4" /></button>}
      </div>
    </div>
  );
}

// ============================================================================
// LEVEL 3: INPUT OUTPUT SIM
// ============================================================================
function Level3InputOutputSim({ onWin }: { onWin: (score: number, stars: number, summary: string) => void }) {
  const [stage, setStage] = useState(1);
  const [typed, setTyped] = useState('');
  const [mathInput, setMathInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: string; text: string } | null>(null);
  const targetWord = 'KOMPUTER';
  const handlePressLetter = (ch: string) => { sfx.keyPress(); const next = typed + ch; setTyped(next); if (next === targetWord) { sfx.correct(); setFeedback({ type: 'ok', text: 'Hebat! Keyboard → CPU → Monitor menampilkan "KOMPUTER".' }); } };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
      <div className="flex items-center gap-2 text-xs font-bold">{[1, 2, 3].map((s) => (<span key={s} className={`px-3 py-1 rounded-full ${stage === s ? 'bg-sky-500 text-slate-950' : stage > s ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>Simulasi {s} / 3</span>))}</div>

      {stage === 1 && (
        <div className="space-y-5">
          <h2 className="text-lg font-extrabold text-white">Simulasi 1: Ketik &quot;KOMPUTER&quot;!</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-950 border border-slate-800 rounded-2xl p-5 text-center">
            <div className="flex flex-col items-center"><HardwareSVG type="keyboard" size="md" active={true} /><span className="text-xs font-bold text-sky-300 mt-1">Keyboard</span></div>
            <div className="flex flex-col items-center"><HardwareSVG type="cpu" size="md" active={typed.length > 0} animate={typed.length > 0} /><span className="text-xs font-bold text-amber-300 mt-1">CPU</span></div>
            <div className="flex flex-col items-center"><HardwareSVG type="monitor" size="md" active={typed.length > 0} /><div className="mt-2 px-4 py-1.5 rounded-xl bg-slate-900 border border-sky-500/40 font-mono font-extrabold text-sky-300">{typed || '________'}</div></div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">{'KOMPUTERABC'.split('').map((ch, idx) => (<button key={idx} onClick={() => handlePressLetter(ch)} className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-sky-500 hover:text-slate-950 font-extrabold text-white border border-slate-700">{ch}</button>))}<button onClick={() => setTyped('')} className="px-4 h-12 rounded-xl bg-rose-500/20 border border-rose-400 text-rose-300 font-bold text-xs">Reset</button></div>
          {typed === targetWord && <div className="flex justify-end"><button onClick={() => { setFeedback(null); setStage(2); }} className="px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-sm">Lanjut Simulasi 2 →</button></div>}
        </div>
      )}

      {stage === 2 && (
        <div className="space-y-5">
          <h2 className="text-lg font-extrabold text-white">Simulasi 2: CPU Menghitung (10 + 5)</h2>
          <div className="flex flex-wrap items-center gap-3">{[12, 15, 20, 50].map((ans) => (<button key={ans} onClick={() => { if (ans === 15) { sfx.correct(); setMathInput('15'); setFeedback({ type: 'ok', text: 'Tepat! ALU menghitung 10 + 5 = 15.' }); } else { sfx.wrong(); setFeedback({ type: 'err', text: 'Belum tepat!' }); } }} className="px-6 py-4 rounded-2xl bg-slate-950 hover:bg-sky-500 hover:text-slate-950 font-black text-lg border border-slate-700">Hasil: {ans}</button>))}</div>
          {mathInput === '15' && <div className="flex justify-end"><button onClick={() => { setFeedback(null); setStage(3); }} className="px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-sm">Lanjut Simulasi 3 →</button></div>}
        </div>
      )}

      {stage === 3 && (
        <div className="space-y-5">
          <h2 className="text-lg font-extrabold text-white">Simulasi 3: Pilih Output Untuk Mencetak ke Kertas!</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[{id:'monitor',name:'Monitor',ok:false,msg:'Monitor menampilkan di layar.'},{id:'printer',name:'Printer',ok:true,msg:'Tepat! Printer mencetak ke kertas.'},{id:'speaker',name:'Speaker',ok:false,msg:'Speaker mengeluarkan suara.'}].map((opt) => (
              <button key={opt.id} onClick={() => { if (opt.ok) { sfx.correct(); onWin(350, 3, 'Kamu sukses menjalankan simulasi Input, CPU, dan Output!'); } else { sfx.wrong(); setFeedback({ type: 'err', text: opt.msg }); } }} className="p-5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-700 flex flex-col items-center gap-2"><HardwareSVG type={opt.id} size="md" active={true} /><span className="font-extrabold text-white">{opt.name}</span></button>
            ))}
          </div>
        </div>
      )}

      {feedback && <div className={`p-4 rounded-2xl border text-xs md:text-sm ${feedback.type === 'ok' ? 'bg-emerald-500/15 border-emerald-400 text-emerald-200' : 'bg-rose-500/15 border-rose-400 text-rose-200'}`}>{feedback.text}</div>}
    </div>
  );
}

// ============================================================================
// LEVEL 4: STORAGE MISSION
// ============================================================================
function Level4StorageMission({ onWin }: { onWin: (score: number, stars: number, summary: string) => void }) {
  const [step, setStep] = useState(1);
  const [saved, setSaved] = useState(false);
  const [opened, setOpened] = useState(false);
  const [feedback, setFeedback] = useState<{ type: string; text: string } | null>(null);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
      <span className="text-xs font-extrabold text-emerald-400 uppercase">Misi Storage • Tahap {step} dari 3</span>

      {step === 1 && (
        <div className="space-y-5">
          <h2 className="text-lg font-extrabold text-white">Tahap 1: Simpan File ke SSD!</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-slate-950 border border-slate-800 rounded-2xl p-6">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3"><FileText className="w-8 h-8 text-sky-400" /><div><div className="font-bold text-white text-sm">Tugas_Informatika.txt</div><div className="text-xs text-slate-400">{saved ? 'Tersimpan di SSD' : 'Belum Disimpan'}</div></div></div>
              <button onClick={() => { sfx.saveFile(); setSaved(true); setFeedback({ type: 'ok', text: 'File berhasil disimpan! Proses ini disebut WRITE.' }); }} className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs">Simpan ke SSD ➔</button>
            </div>
            <div className="flex flex-col items-center"><HardwareSVG type="ssd" size="lg" active={saved} animate={saved} /><span className="text-xs font-bold text-emerald-300 mt-2">{saved ? '✓ Tersimpan' : 'Menunggu...'}</span></div>
          </div>
          {saved && <div className="flex justify-end"><button onClick={() => { setFeedback(null); setStep(2); }} className="px-6 py-3 rounded-xl bg-sky-500 text-slate-950 font-extrabold text-sm">Lanjut Tahap 2 →</button></div>}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <h2 className="text-lg font-extrabold text-white">Tahap 2: Buka File dari SSD!</h2>
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-around gap-4">
            <div className="flex flex-col items-center gap-2"><HardwareSVG type="ssd" size="md" active={true} /><button onClick={() => { sfx.correct(); setOpened(true); setFeedback({ type: 'ok', text: 'File berhasil dibuka! Ini disebut proses READ.' }); }} className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs">📂 Buka File</button></div>
            <ArrowRight className="w-6 h-6 text-sky-400" />
            <div className="flex flex-col items-center"><HardwareSVG type="monitor" size="md" active={opened} animate={opened} /><span className="text-xs font-mono text-sky-300 mt-2">{opened ? 'File Tampil!' : 'Menunggu...'}</span></div>
          </div>
          {opened && <div className="flex justify-end"><button onClick={() => { setFeedback(null); setStep(3); }} className="px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-sm">Lanjut Tahap 3 →</button></div>}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold text-white">Tahap 3: Pilih Pernyataan yang Tepat!</h2>
          <div className="space-y-3">
            {[{id:'a',text:'Menyimpan = CPU ke Storage, Membuka = Storage ke CPU.',ok:true},{id:'b',text:'Menyimpan dilakukan oleh Monitor tanpa CPU.',ok:false},{id:'c',text:'Data di SSD hilang saat komputer dimatikan.',ok:false}].map((opt) => (
              <button key={opt.id} onClick={() => { if (opt.ok) { sfx.correct(); onWin(350, 3, 'Kamu menguasai Storage Device!'); } else { sfx.wrong(); setFeedback({ type: 'err', text: 'Belum tepat! SSD menyimpan data secara permanen.' }); } }} className="w-full p-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-left text-xs md:text-sm font-semibold text-white">{opt.text}</button>
            ))}
          </div>
        </div>
      )}

      {feedback && <div className={`p-4 rounded-2xl border text-xs md:text-sm ${feedback.type === 'ok' ? 'bg-emerald-500/15 border-emerald-400 text-emerald-200' : 'bg-rose-500/15 border-rose-400 text-rose-200'}`}>{feedback.text}</div>}
    </div>
  );
}

// ============================================================================
// LEVEL 5: TROUBLESHOOTING
// ============================================================================
function Level5Troubleshooting({ onWin }: { onWin: (score: number, stars: number, summary: string) => void }) {
  const cases = [
    { id: 1, symptom: 'Kasus 1: Teks tidak muncul saat mengetik.', hint: 'Periksa perangkat Input.', options: [{ id: 'kbd', title: 'Periksa koneksi Keyboard', correct: true, reason: 'Benar! Masalah Input Device.' }, { id: 'prn', title: 'Mengganti tinta Printer', correct: false, reason: 'Printer adalah Output cetak.' }, { id: 'spk', title: 'Menaikkan volume Speaker', correct: false, reason: 'Speaker adalah Output suara.' }] },
    { id: 2, symptom: 'Kasus 2: Monitor gelap saat CPU menyala.', hint: 'Masalah Output visual.', options: [{ id: 'mon', title: 'Periksa kabel Monitor & GPU', correct: true, reason: 'Tepat! Masalah Output Device.' }, { id: 'mic', title: 'Mengganti Mikrofon', correct: false, reason: 'Mikrofon adalah Input suara.' }, { id: 'mse', title: 'Membersihkan sensor Mouse', correct: false, reason: 'Mouse tidak menyebabkan layar mati.' }] },
    { id: 3, symptom: 'Kasus 3: File tugas tidak ditemukan.', hint: 'Masalah Storage.', options: [{ id: 'ssd', title: 'Periksa Storage & folder penyimpanan', correct: true, reason: 'Tepat! Masalah Storage Device.' }, { id: 'spk', title: 'Memeriksa kabel Speaker', correct: false, reason: 'Speaker bukan penyimpanan file.' }] },
    { id: 4, symptom: 'Kasus 4: Komputer sangat lambat.', hint: 'Masalah Processing.', options: [{ id: 'cpu', title: 'Periksa beban CPU & RAM', correct: true, reason: 'Benar! Masalah Processing Device.' }, { id: 'scn', title: 'Membersihkan kaca Scanner', correct: false, reason: 'Scanner tidak mempengaruhi kecepatan CPU.' }] }
  ];
  const [caseIdx, setCaseIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [answered, setAnswered] = useState<any>(null);
  const [mistakes, setMistakes] = useState(0);
  const currentCase = cases[caseIdx];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-extrabold text-amber-400 uppercase">Kasus {caseIdx + 1} dari {cases.length}</span><button onClick={() => { sfx.click(); setShowHint(true); }} className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-bold">💡 Petunjuk</button></div>
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-2"><h2 className="text-lg font-extrabold text-white">{currentCase.symptom}</h2>{showHint && <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">{currentCase.hint}</div>}</div>
      <div className="space-y-3">{currentCase.options.map((opt) => (
        <button key={opt.id} onClick={() => { if (opt.correct) { sfx.correct(); setAnswered(opt); } else { sfx.wrong(); setMistakes((m) => m + 1); setAnswered(opt); } }} className={`w-full p-4 rounded-2xl border text-left transition-all ${answered?.id === opt.id ? opt.correct ? 'bg-emerald-500/20 border-emerald-400 text-white' : 'bg-rose-500/20 border-rose-400 text-white' : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-200'}`}><div className="font-bold text-sm">{opt.title}</div></button>
      ))}</div>
      {answered && (
        <div className={`p-4 rounded-2xl border space-y-3 ${answered.correct ? 'bg-emerald-500/15 border-emerald-400 text-emerald-200' : 'bg-rose-500/15 border-rose-400 text-rose-200'}`}>
          <div className="text-xs md:text-sm font-medium">{answered.reason}</div>
          {answered.correct && <div className="flex justify-end"><button onClick={() => { if (caseIdx < cases.length - 1) { setCaseIdx(caseIdx + 1); setAnswered(null); setShowHint(false); } else { const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1; onWin(400, stars, 'Kamu berhasil menjadi Detektif Hardware!'); } }} className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs md:text-sm">{caseIdx < cases.length - 1 ? 'Lanjut →' : 'Selesaikan Level 5'}</button></div>}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// LEVEL 6: BUILD PC SYSTEM
// ============================================================================
function Level6BuildPCSystem({ onWin }: { onWin: (score: number, stars: number, summary: string) => void }) {
  const budgetLimit = 5000000;
  const catalog: Record<string, any[]> = {
    input: [{ id: 'in-std', name: 'Paket Keyboard + Mouse Standar', price: 250000, svg: 'keyboard', desc: 'Kebutuhan mengetik dan navigasi.' }, { id: 'in-pro', name: 'Keyboard Mekanikal + Mouse + Scanner', price: 1400000, svg: 'scanner', desc: 'Lengkap dengan scanner.' }],
    processing: [{ id: 'pr-std', name: 'CPU Quad-Core + RAM 8GB', price: 2100000, svg: 'cpu', desc: 'Cepat dan stabil.' }, { id: 'pr-high', name: 'CPU Octa-Core + RAM 32GB', price: 4200000, svg: 'cpu', desc: 'Performa sangat tinggi.' }],
    output: [{ id: 'out-std', name: 'Monitor LED 22" + Speaker', price: 1450000, svg: 'monitor', desc: 'Hemat biaya.' }, { id: 'out-pro', name: 'Monitor 4K + Printer + Proyektor', price: 3600000, svg: 'projector', desc: 'Paket premium.' }],
    storage: [{ id: 'st-ssd', name: 'SSD 512GB', price: 650000, svg: 'ssd', desc: 'Cepat dan efisien.' }, { id: 'st-dual', name: 'SSD 2TB + HDD 4TB', price: 2400000, svg: 'hdd', desc: 'Kapasitas server.' }]
  };
  const [selectedParts, setSelectedParts] = useState<Record<string, any>>({ input: null, processing: null, output: null, storage: null });
  const [simTesting, setSimTesting] = useState(false);
  const [evalMessage, setEvalMessage] = useState<{ type: string; text: string } | null>(null);
  const totalCost = Object.values(selectedParts).reduce((acc, part) => acc + (part ? part.price : 0), 0);
  const allFourSelected = selectedParts.input && selectedParts.processing && selectedParts.output && selectedParts.storage;
  const withinBudget = totalCost <= budgetLimit;
  const formatRupiah = (num: number) => 'Rp ' + num.toLocaleString('id-ID');

  const handleRunSystemTest = () => {
    if (!allFourSelected) { sfx.wrong(); setEvalMessage({ type: 'err', text: 'Pilih minimal 1 perangkat dari setiap kategori!' }); return; }
    if (!withinBudget) { sfx.wrong(); setEvalMessage({ type: 'err', text: `Total (${formatRupiah(totalCost)}) melebihi anggaran!` }); return; }
    sfx.correct(); setSimTesting(true);
    setEvalMessage({ type: 'ok', text: 'Menguji sistem: Keyboard → CPU → Monitor → SSD!' });
    setTimeout(() => { onWin(500, 3, 'Selamat! Kamu berhasil merakit sistem komputer lengkap!'); }, 1800);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1"><span className="text-xs font-extrabold text-sky-400 uppercase">Misi Puncak</span><h2 className="text-lg font-black text-white">Rakit Sistem Komputer Lengkap!</h2></div>
        <div className="bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-right"><div className="text-xs text-slate-400">Anggaran: {formatRupiah(budgetLimit)}</div><div className={`text-lg font-black ${withinBudget ? 'text-emerald-400' : 'text-rose-400'}`}>Terpakai: {formatRupiah(totalCost)}</div></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[{key:'input',title:'1. INPUT'},{key:'processing',title:'2. PROCESSING'},{key:'output',title:'3. OUTPUT'},{key:'storage',title:'4. STORAGE'}].map((group) => (
          <div key={group.key} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-extrabold text-sky-300">{group.title}</h3>
            <div className="space-y-2.5">{catalog[group.key].map((item: any) => { const isChosen = selectedParts[group.key]?.id === item.id; return (
              <button key={item.id} onClick={() => { sfx.click(); setSelectedParts((prev) => ({ ...prev, [group.key]: item })); }} className={`w-full p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${isChosen ? 'bg-sky-500/20 border-sky-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}>
                <HardwareSVG type={item.svg} size="sm" active={isChosen} animate={simTesting && isChosen} />
                <div className="flex-1"><div className="font-bold text-xs md:text-sm text-white">{item.name}</div><div className="text-[11px] text-slate-400">{item.desc}</div><div className="text-xs font-extrabold text-emerald-400 mt-1">{formatRupiah(item.price)}</div></div>
              </button>
            ); })}</div>
          </div>
        ))}
      </div>
      {evalMessage && <div className={`p-4 rounded-2xl border text-xs md:text-sm font-semibold ${evalMessage.type === 'ok' ? 'bg-emerald-500/15 border-emerald-400 text-emerald-200' : 'bg-rose-500/15 border-rose-400 text-rose-200'}`}>{evalMessage.text}</div>}
      <div className="flex justify-end"><button onClick={handleRunSystemTest} className="px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm md:text-base flex items-center gap-2 shadow-xl"><Zap className="w-5 h-5" /><span>UJI SISTEM KOMPUTER</span></button></div>
    </div>
  );
}

// ============================================================================
// RESULTS SCREEN
// ============================================================================
function ResultsScreen({ levels, levelProgress, totalScore, totalStars, badges, onSelectLevel, onBackHome }: any) {
  const allCompleted = Object.values(levelProgress).every((l: any) => l.completed);
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-center space-y-4">
        <div className="inline-flex p-4 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300"><Award className="w-12 h-12" /></div>
        <h1 className="text-2xl md:text-4xl font-black text-white">Rapor Hasil Belajar & Pencapaian</h1>
        <p className="text-slate-300 text-sm md:text-base max-w-2xl mx-auto">{allCompleted ? 'Selamat! Kamu telah lulus semua level!' : 'Terus selesaikan tantangan untuk meraih semua lencana!'}</p>
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto pt-2">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3"><div className="text-2xl font-black text-sky-400">{totalScore}</div><div className="text-xs text-slate-400">Total Skor</div></div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3"><div className="text-2xl font-black text-amber-400">{totalStars} / 60</div><div className="text-xs text-slate-400">Bintang</div></div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3"><div className="text-2xl font-black text-emerald-400">{badges.length} / 20</div><div className="text-xs text-slate-400">Lencana</div></div>
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-white">Detail Capaian Setiap Level:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {levels.map((l: LevelData) => { const p = levelProgress[l.id]; return (
            <div key={l.id} onClick={() => onSelectLevel(l.id)} className="cursor-pointer p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-400 flex items-center justify-between gap-3 transition-all">
              <div><div className="text-xs font-bold text-sky-400">LEVEL {l.id} • {p.completed ? 'TUNTAS' : 'BELUM TUNTAS'}</div><div className="font-extrabold text-white text-sm">{l.title}</div><div className="text-xs text-amber-300 mt-0.5">Lencana: {l.badgeName}</div></div>
              <div className="text-right space-y-1"><div className="flex justify-end gap-0.5">{[1, 2, 3].map((s) => (<Star key={s} className={`w-4 h-4 ${p.stars >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />))}</div><div className="text-xs text-slate-400">Skor: <strong className="text-white">{p.score}</strong></div></div>
            </div>
          ); })}
        </div>
      </div>
      <div className="flex justify-center"><button onClick={onBackHome} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm flex items-center gap-2"><Home className="w-4 h-4" /><span>Kembali ke Beranda</span></button></div>
    </div>
  );
}

// ============================================================================
// GUIDE SCREEN
// ============================================================================
function GuideScreen({ onBackHome, onOpenLab }: any) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl md:text-3xl font-black text-white">Panduan Bermain</h1><p className="text-slate-400 text-sm">Pelajari cara memainkan Computer System Simulator</p></div>
        <button onClick={onBackHome} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs md:text-sm"><Home className="w-4 h-4 inline mr-1" />Beranda</button>
      </div>

      <div className="space-y-4">
        {[
          { title: '1. Mulai Petualangan', desc: 'Pilih "Mulai Petualangan" di halaman utama untuk memulai dari level pertama yang tersedia.' },
          { title: '2. Pelajari Flashcard', desc: 'Setiap level diawali 5 kartu flashcard interaktif. Balik kartu untuk melihat penjelasan mendalam. Pelajari semua kartu sebelum memulai tantangan.' },
          { title: '3. Selesaikan 20 Tantangan Level', desc: 'Setiap level memiliki tantangan unik: klasifikasi perangkat, alur sistem, simulasi I/O, manajemen storage, troubleshooting, rakit PC virtual, serta konversi sistem bilangan Biner, Oktal, dan Heksadesimal hingga operasi ALU!' },
          { title: '4. Raih Bintang & Lencana', desc: 'Dapatkan 3 bintang dengan menjawab tanpa kesalahan. Selesaikan seluruh 20 level untuk meraih lencana Grand Master Sistem Komputer!' },
          { title: '5. Laboratorium Animasi', desc: 'Buka Lab Animasi untuk bereksperimen bebas dengan perangkat Input, CPU, Output, Storage, dan melihat alur sistem komputer secara visual.' },
          { title: '6. Mode Guru (IFP, Penugasan & Reset)', desc: 'Guru dapat melakukan penugasan ke kelas tertentu, membuka seluruh level untuk presentasi IFP, memantau rekap skor siswa, dan mereset permainan ke Level 1 per-kelas maupun per-siswa.' }
        ].map((item, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <h3 className="text-lg font-extrabold text-white">{item.title}</h3>
            <p className="text-sm text-slate-300">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={onOpenLab} className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center gap-2"><Sparkles className="w-4 h-4" /><span>Buka Laboratorium Animasi</span></button>
        <button onClick={onBackHome} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm">Kembali ke Beranda</button>
      </div>
    </div>
  );
}
