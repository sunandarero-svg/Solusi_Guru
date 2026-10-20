"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Gamepad2, Sparkles, BookOpen, Lock, RotateCcw } from 'lucide-react';

const BorneoEduGame = dynamic(
  () => import('./BorneoEduGame'),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center min-h-[520px] p-8 bg-slate-950 rounded-3xl text-white border-2 border-emerald-500/30 shadow-2xl space-y-4">
        <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
        <div className="text-center">
          <p className="font-black text-lg text-emerald-300">Menyiapkan Game Borneo Edu...</p>
          <p className="text-xs text-slate-400 mt-1">Mengunduh aset arena platformer & modul kuis interaktif</p>
        </div>
      </div>
    )
  }
);

const BorneoEduTeacherProgress = dynamic(
  () => import('./BorneoEduTeacherProgress'),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="font-bold text-slate-700">Memuat Rekap Progress Guru...</p>
      </div>
    )
  }
);

interface BorneoEduClientWrapperProps {
  userRole?: string;
  teacherName?: string;
  showStandaloneHeader?: boolean;
}

export default function BorneoEduClientWrapper({
  userRole,
  teacherName = 'Bapak/Ibu Guru',
  showStandaloneHeader = false
}: BorneoEduClientWrapperProps) {
  const router = useRouter();
  const isTeacherOrAdmin = userRole === 'TEACHER' || userRole === 'ADMIN' || userRole === 'PRINCIPAL';

  const [checkingMaterials, setCheckingMaterials] = useState(!isTeacherOrAdmin);
  const [hasUnreadMaterials, setHasUnreadMaterials] = useState(false);
  const [isGameLocked, setIsGameLocked] = useState(false);
  const [lockReason, setLockReason] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!isTeacherOrAdmin) {
      Promise.all([
        fetch('/api/student/material-status').then((res) => res.json()).catch(() => null),
        fetch('/api/borneo-edu/student-info').then((res) => res.json()).catch(() => null)
      ])
        .then(([matData, studentData]) => {
          if (matData && matData.hasUnreadMaterials) {
            setHasUnreadMaterials(true);
          } else {
            setHasUnreadMaterials(false);
          }

          if (studentData && studentData.isGameLocked) {
            setIsGameLocked(true);
            setLockReason(studentData.lockReason || 'Game Petualangan Borneo Edu sedang dikunci oleh guru.');
          } else {
            setIsGameLocked(false);
          }
        })
        .finally(() => setCheckingMaterials(false));
    }
  }, [isTeacherOrAdmin]);

  const handleResetMaterialsAndExit = async () => {
    const confirmed = window.confirm(
      "Apakah Anda yakin ingin reset dan kembali membaca materi?\n\nGame Borneo Edu dan Kamera Tugas akan KEMBALI TERKUNCI sampai Anda selesai membaca materi di halaman Dashboard."
    );
    if (!confirmed) return;

    setResetting(true);
    try {
      const res = await fetch("/api/student/reset-materials", { method: "POST" });
      if (res.ok) {
        alert("🔒 Status materi berhasil di-reset!\n\nSemua fitur game dan foto tugas telah terkunci kembali. Mengalihkan ke dashboard materi...");
        router.push("/dashboard");
      } else {
        alert("Gagal mereset materi.");
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setResetting(false);
    }
  };

  if (isTeacherOrAdmin) {
    return <BorneoEduTeacherProgress userRole={userRole} teacherName={teacherName} />;
  }

  // Jika sedang memeriksa status materi & kunci siswa
  if (checkingMaterials) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-slate-950 rounded-3xl text-white space-y-3">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        <p className="text-sm font-bold text-slate-300">Memverifikasi izin akses game...</p>
      </div>
    );
  }

  // Proteksi jika game dikunci oleh guru
  if (isGameLocked) {
    return (
      <div className="rounded-3xl p-8 sm:p-12 bg-slate-950 border-2 border-rose-500/50 text-white shadow-2xl max-w-2xl mx-auto my-8 text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/20 border border-rose-500/40 text-rose-400 mx-auto flex items-center justify-center text-4xl shadow-inner">
          🔒
        </div>
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-black uppercase tracking-wider border border-rose-500/30">
            Akses Game Dikunci Guru
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Game Borneo Edu Ditutup Sementara
          </h2>
          <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            {lockReason || 'Game Borneo Edu saat ini sedang dikunci oleh guru pengampu. Silakan tunggu hingga guru membuka akses kembali.'}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <span>🏠 Kembali ke Dashboard Utama</span>
          </Link>
        </div>
      </div>
    );
  }

  // Proteksi jika siswa belum membaca materi
  if (hasUnreadMaterials) {
    return (
      <div className="rounded-3xl p-8 sm:p-12 bg-slate-950 border-2 border-amber-500/40 text-white shadow-2xl max-w-2xl mx-auto my-8 text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center text-4xl shadow-inner">
          🔒
        </div>
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-500/30">
            Akses Game Terkunci
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Materi Pelajaran Belum Selesai Dibaca
          </h2>
          <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            Sesuai aturan pembelajaran kelas, Anda harus membaca dan mempelajari materi pelajaran terlebih dahulu sebelum memulai petualangan di Borneo Edu.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <BookOpen size={18} />
            <span>📖 Buka Materi Pelajaran di Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      {!showStandaloneHeader && (
        <div className="landscape:hidden lg:landscape:flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1.5 shadow-sm">
                <Gamepad2 size={14} />
                <span>Pembelajaran Interaktif Siswa</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black flex items-center gap-1 shadow-sm">
                <Sparkles size={14} />
                <span>Game Edukasi 2D Platformer</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              Game Borneo Edu
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Petualangan Belajar, Kumpulkan Koin, Taklukkan Tantangan!
            </p>
          </div>

          {/* TOMBOL RESET KEMBALI KE MATERI & KUNCI GAME */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetMaterialsAndExit}
              disabled={resetting}
              className="px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 text-xs font-bold transition flex items-center gap-2 shadow-sm"
              title="Reset status belajar dan kunci kembali fitur game serta foto tugas"
            >
              <RotateCcw size={14} className={resetting ? "animate-spin" : ""} />
              <span>{resetting ? "Mereset..." : "🔄 Reset Kembali ke Materi & Kunci"}</span>
            </button>
          </div>
        </div>
      )}

      <BorneoEduGame />
    </div>
  );
}
