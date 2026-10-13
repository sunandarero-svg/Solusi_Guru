"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Gamepad2, Sparkles, BookOpen, CheckCircle, FileText, Video, Eye, Lock, ArrowRight } from "lucide-react";
import StudentQuickScan from "@/components/StudentQuickScan";
import MaterialReaderModal from "@/components/MaterialReaderModal";

interface MaterialItem {
  id: string;
  title: string;
  description?: string;
  className?: string;
  subjectName?: string;
  fileType?: string;
  sourceType?: string;
  fileUrl?: string;
  content?: string;
}

export default function StudentInteractiveDashboard() {
  const [loading, setLoading] = useState(true);
  const [hasUnread, setHasUnread] = useState(false);
  const [unreadMaterials, setUnreadMaterials] = useState<MaterialItem[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/student/material-status");
      const data = await res.json();
      if (data) {
        setHasUnread(Boolean(data.hasUnreadMaterials));
        setUnreadMaterials(data.unreadMaterials || []);
      }
    } catch (err) {
      console.error("Gagal mengecek status materi", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCompleteReading = async (materialId: string) => {
    const res = await fetch(`/api/materials/${materialId}/read`, {
      method: "POST",
    });
    if (res.ok) {
      await fetchStatus();
    } else {
      throw new Error("Gagal menandai materi");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. KARTU MATERI BELAJAR WAJIB DIBACA (Jika ada materi belum dibaca) */}
      {hasUnread && (
        <div className="rounded-3xl p-6 sm:p-7 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-xl shadow-amber-500/20 relative overflow-hidden border border-amber-400/40 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 text-white text-xs font-black uppercase tracking-wider backdrop-blur-md">
                <BookOpen size={14} className="text-amber-200" />
                <span>Materi Wajib Dibaca Terlebih Dahulu</span>
                <span className="px-1.5 py-0.2 bg-white text-amber-700 rounded-full text-[10px] font-black">
                  {unreadMaterials.length} Materi
                </span>
              </div>
              <span className="text-xs font-bold text-amber-100 flex items-center gap-1">
                <Lock size={12} /> Akses Game & Tugas Terkunci
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Selesaikan Membaca Materi Pelajaran
              </h2>
              <p className="text-amber-100 text-sm mt-1 max-w-2xl leading-relaxed">
                Guru Anda telah menyiapkan materi berikut. Pelajari materi terlebih dahulu untuk membuka kunci tombol <strong>Game Petualangan Borneo Edu</strong> dan <strong>Kamera Kumpulkan Tugas</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {unreadMaterials.map((mat) => (
                <div
                  key={mat.id}
                  className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md flex items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-white/20 text-white shrink-0">
                      {mat.fileType === "video" ? (
                        <Video size={20} />
                      ) : (
                        <FileText size={20} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-amber-200 tracking-wider block">
                        {mat.subjectName || "Umum"} • {mat.className || "Kelas"}
                      </span>
                      <h4 className="font-bold text-sm text-white truncate">{mat.title}</h4>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedMaterial(mat)}
                    className="px-4 py-2 rounded-xl bg-white text-amber-800 hover:bg-amber-50 font-black text-xs shadow-md shrink-0 flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all"
                  >
                    <span>Pelajari</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. TOMBOL MULAI GAME BORNEO EDU */}
      <div
        className={`rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden border transition-all duration-300 ${
          hasUnread
            ? "bg-gradient-to-r from-slate-800 via-slate-850 to-slate-900 border-slate-700/60 shadow-lg"
            : "bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-700 border-emerald-400/40 shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/30 group"
        }`}
      >
        {!hasUnread && (
          <>
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-amber-400/20 rounded-full blur-2xl pointer-events-none"></div>
          </>
        )}

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/20">
              <Gamepad2 size={14} className={hasUnread ? "text-slate-400" : "text-amber-300"} />
              <span>Pembelajaran Interaktif • Edisi Game Petualangan</span>
              {!hasUnread && <Sparkles size={13} className="text-yellow-300 animate-pulse" />}
              {hasUnread && (
                <span className="text-amber-300 flex items-center gap-1 text-[11px] font-bold">
                  <Lock size={11} /> Terkunci
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
              Game Petualangan Belajar Borneo Edu
            </h2>
            <p className={hasUnread ? "text-slate-400 text-sm leading-relaxed" : "text-emerald-50 text-sm leading-relaxed"}>
              {hasUnread
                ? "Fitur Game Borneo Edu terkunci sementara. Selesaikan membaca materi di atas untuk membuka akses petualangan."
                : "Jelajahi 5 World, taklukkan rintangan, dan selesaikan soal kurikulum kelas Anda dengan seru!"}
            </p>
            <div className="p-3.5 rounded-2xl bg-black/20 border border-white/15 backdrop-blur-sm text-xs text-amber-100 flex items-start gap-2.5">
              <span className="text-base shrink-0">📝</span>
              <p className="leading-snug">
                <strong>Tugas Khusus Setelah Selesai Game:</strong> Setelah menyelesaikan permainan sampai tamat, Anda akan mendapatkan <strong>5 Pertanyaan Refleksi</strong> yang wajib dikerjakan di buku tulis dan difoto menggunakan <strong>Kamera Kumpulkan Tugas</strong>.
              </p>
            </div>
          </div>

          <div className="shrink-0 w-full lg:w-auto">
            {hasUnread ? (
              <button
                onClick={() => {
                  alert("🔒 Fitur Game Terkunci!\n\nAnda harus membaca dan mempelajari materi pelajaran terlebih dahulu sebelum memulai game.");
                }}
                className="w-full lg:w-auto px-8 py-4 rounded-2xl bg-slate-800 text-slate-400 border border-slate-700 font-black text-base flex items-center justify-center gap-3 cursor-not-allowed opacity-90 shadow-md"
              >
                <span>🔒 Game Terkunci (Baca Materi Dulu)</span>
              </button>
            ) : (
              <Link
                href="/dashboard/interactive-learning/borneo-edu"
                className="w-full lg:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-800 hover:text-emerald-900 font-black text-base shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group"
              >
                <span>🎮 Mulai Game Sekarang</span>
                <span className="text-xl group-hover:translate-x-1 transition-transform">▶</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 3. KAMERA KUMPULKAN TUGAS DENGAN PROTEKSI ISLOCKED */}
      <StudentQuickScan
        isLocked={hasUnread}
        lockedReason="🔒 Fitur Kamera Kumpulkan Tugas Terkunci!\n\nAnda harus menyelesaikan membaca materi pelajaran terlebih dahulu sebelum dapat mengumpulkan tugas."
      />

      {/* 4. MODAL BACA MATERI */}
      {selectedMaterial && (
        <MaterialReaderModal
          material={selectedMaterial}
          onClose={() => setSelectedMaterial(null)}
          onCompleteReading={handleCompleteReading}
        />
      )}
    </div>
  );
}
