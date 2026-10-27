"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Gamepad2,
  Sparkles,
  BookOpen,
  CheckCircle,
  FileText,
  Video,
  Eye,
  Lock,
  ArrowRight,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  Cpu,
} from "lucide-react";
import StudentQuickScan from "@/components/StudentQuickScan";
import MaterialReaderModal from "@/components/MaterialReaderModal";
import { MaterialDisplayFormat, IInteractiveData } from "@/models/Material";

interface MaterialItem {
  id: string;
  title: string;
  description?: string;
  className?: string;
  subjectName?: string;
  fileType?: string;
  sourceType?: string;
  fileUrl?: string;
  fileName?: string;
  content?: string;
  summary?: string;
  displayFormat?: MaterialDisplayFormat;
  interactiveData?: IInteractiveData;
  isReadByMe?: boolean;
}

export default function StudentInteractiveDashboard() {
  const [loading, setLoading] = useState(true);
  const [hasUnread, setHasUnread] = useState(false);
  const [unreadMaterials, setUnreadMaterials] = useState<MaterialItem[]>([]);
  const [allMaterials, setAllMaterials] = useState<MaterialItem[]>([]);
  const [totalMaterials, setTotalMaterials] = useState(0);
  const [readMaterialsCount, setReadMaterialsCount] = useState(0);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [resetting, setResetting] = useState(false);
  const [borneoLockStatus, setBorneoLockStatus] = useState<{ isLocked: boolean; lockReason: string }>({
    isLocked: false,
    lockReason: "Game Petualangan Borneo Edu sedang dikunci oleh guru."
  });
  const [excelStatus, setExcelStatus] = useState<{ isAssigned: boolean; isLocked: boolean; lockReason: string; studentClassName: string }>({
    isAssigned: false,
    isLocked: false,
    lockReason: "Game Simulasi Excel sedang dikunci oleh guru.",
    studentClassName: "",
  });

  const fetchStatus = async () => {
    try {
      const [matRes, borneoRes, excelRes] = await Promise.all([
        fetch("/api/student/material-status").then((r) => r.json()).catch(() => null),
        fetch("/api/borneo-edu/student-info").then((r) => r.json()).catch(() => null),
        fetch("/api/excel-adventure/settings", { credentials: "include" }).then((r) => r.json()).catch(() => null)
      ]);

      if (matRes) {
        setHasUnread(Boolean(matRes.hasUnreadMaterials));
        setUnreadMaterials(matRes.unreadMaterials || []);
        setAllMaterials(matRes.allMaterials || []);
        setTotalMaterials(Number(matRes.totalMaterials) || 0);
        setReadMaterialsCount(Number(matRes.readMaterialsCount) || 0);
      }

      if (borneoRes) {
        setBorneoLockStatus({
          isLocked: Boolean(borneoRes.isGameLocked),
          lockReason: borneoRes.lockReason || "Game Petualangan Borneo Edu sedang dikunci oleh guru."
        });
      }

      if (excelRes) {
        setExcelStatus({
          isAssigned: Boolean(excelRes.isAssigned),
          isLocked: Boolean(excelRes.isLocked),
          lockReason: excelRes.lockReason || "Game Simulasi Excel sedang dikunci oleh guru.",
          studentClassName: excelRes.studentClassName || "",
        });
      }
    } catch (err) {
      console.error("Gagal mengecek status materi atau game", err);
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

  const handleResetMaterials = async () => {
    const confirmed = window.confirm(
      "Apakah Anda yakin ingin reset kembali ke materi?\n\nSemua materi pelajaran kelas Anda akan kembali berstatus BELUM DIBACA. Fitur Game Petualangan Borneo Edu dan Kamera Kumpulkan Tugas akan KEMBALI TERKUNCI sampai Anda membaca materi pelajaran."
    );
    if (!confirmed) return;

    setResetting(true);
    try {
      const res = await fetch("/api/student/reset-materials", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        alert(
          "🔒 Status membaca materi berhasil di-reset!\n\nFitur Game Borneo Edu dan Kamera Tugas telah terkunci kembali. Silakan baca dan pelajari materi pelajaran untuk membuka kuncinya."
        );
        await fetchStatus();
      } else {
        alert(data.error || "Gagal mereset status materi.");
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan saat mereset materi.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1A. KARTU STATUS SELESAI & TOMBOL RESET KEMBALI KE MATERI (Jika semua materi sudah dibaca) */}
      {!hasUnread && totalMaterials > 0 && (
        <div className="rounded-3xl p-6 sm:p-7 bg-slate-900 border-2 border-emerald-500/30 text-white shadow-xl relative overflow-hidden animate-in fade-in duration-300">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                <CheckCircle size={26} />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-black uppercase tracking-wider border border-emerald-500/30">
                    ✓ Status Membaca Selesai ({totalMaterials} Materi)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30">
                    🎮 Game & 📷 Kamera Terbuka
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Materi Pelajaran Telah Selesai Dibaca
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Seluruh materi kelas telah Anda pelajari. Jika Anda ingin membaca ulang dari awal dan menguji pemahaman, tekan tombol di samping untuk <strong>mereset materi dan mengunci kembali semua fitur</strong>.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto shrink-0">
              {allMaterials.length > 0 && (
                <button
                  onClick={() => setSelectedMaterial(allMaterials[0])}
                  className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Eye size={15} className="text-amber-300" />
                  <span>Baca Ulang Materi</span>
                </button>
              )}

              {/* TOMBOL RESET KEMBALI KE MATERI AGAR SEMUA FITUR TERKUNCI KEMBALI */}
              <button
                onClick={handleResetMaterials}
                disabled={resetting}
                className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 hover:scale-105"
                title="Reset status belajar agar semua materi kembali belum dibaca dan fitur Game serta Kamera Foto terkunci kembali"
              >
                <RotateCcw size={15} className={resetting ? "animate-spin" : ""} />
                <span>{resetting ? "Mereset..." : "🔄 Reset Kembali ke Materi (Kunci Game & Foto)"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1B. KARTU MATERI BELAJAR WAJIB DIBACA (Jika ada materi belum dibaca) */}
      {hasUnread && (
        <div className="rounded-3xl p-6 sm:p-7 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-xl shadow-amber-500/20 relative overflow-hidden border border-amber-400/40 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 text-white text-xs font-black uppercase tracking-wider backdrop-blur-md">
                <BookOpen size={14} className="text-amber-200" />
                <span>Materi Wajib Dibaca Terlebih Dahulu</span>
                <span className="px-1.5 py-0.2 bg-white text-amber-700 rounded-full text-[10px] font-black">
                  {unreadMaterials.length} Belum Dibaca
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-100 flex items-center gap-1">
                  <Lock size={12} /> Akses Game & Tugas Terkunci
                </span>
                {readMaterialsCount > 0 && (
                  <button
                    onClick={handleResetMaterials}
                    disabled={resetting}
                    className="px-3 py-1 rounded-xl bg-black/30 hover:bg-black/50 text-[11px] font-bold text-amber-100 transition flex items-center gap-1 border border-white/20"
                    title="Reset semua status membaca ke awal"
                  >
                    <RotateCcw size={11} className={resetting ? "animate-spin" : ""} />
                    <span>Reset ke Awal</span>
                  </button>
                )}
              </div>
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
          hasUnread || borneoLockStatus.isLocked
            ? "bg-gradient-to-r from-slate-800 via-slate-850 to-slate-900 border-slate-700/60 shadow-lg"
            : "bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-700 border-emerald-400/40 shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/30 group"
        }`}
      >
        {!hasUnread && !borneoLockStatus.isLocked && (
          <>
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-amber-400/20 rounded-full blur-2xl pointer-events-none"></div>
          </>
        )}

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/20">
              <Gamepad2 size={14} className={hasUnread || borneoLockStatus.isLocked ? "text-slate-400" : "text-amber-300"} />
              <span>Pembelajaran Interaktif • Edisi Game Petualangan</span>
              {!hasUnread && !borneoLockStatus.isLocked && <Sparkles size={13} className="text-yellow-300 animate-pulse" />}
              {borneoLockStatus.isLocked ? (
                <span className="text-rose-300 flex items-center gap-1 text-[11px] font-bold">
                  <Lock size={11} /> Dikunci Guru
                </span>
              ) : hasUnread ? (
                <span className="text-amber-300 flex items-center gap-1 text-[11px] font-bold">
                  <Lock size={11} /> Terkunci (Baca Materi)
                </span>
              ) : null}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
              Game Petualangan Belajar Borneo Edu
            </h2>
            <p className={hasUnread || borneoLockStatus.isLocked ? "text-slate-400 text-sm leading-relaxed" : "text-emerald-50 text-sm leading-relaxed"}>
              {borneoLockStatus.isLocked
                ? borneoLockStatus.lockReason
                : hasUnread
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
            {borneoLockStatus.isLocked ? (
              <button
                type="button"
                onClick={() => {
                  alert(`🔒 Akses Game Borneo Edu Dikunci!\n\n${borneoLockStatus.lockReason}`);
                }}
                className="w-full lg:w-auto px-8 py-4 rounded-2xl bg-slate-800 text-rose-300 border border-rose-500/40 font-black text-base flex items-center justify-center gap-3 cursor-not-allowed opacity-90 shadow-md"
              >
                <Lock size={18} />
                <span>Game Sedang Dikunci oleh Guru</span>
              </button>
            ) : hasUnread ? (
              <button
                type="button"
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

      {/* 2B. TOMBOL MULAI GAME EXCEL ADVENTURE DENGAN PROTEKSI PENUGASAN KELAS & KUNCI GURU */}
      <div
        className={`rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden border transition-all duration-300 ${
          !excelStatus.isAssigned || hasUnread || excelStatus.isLocked
            ? "bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-slate-700/60 shadow-lg"
            : "bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 border-emerald-500/40 shadow-2xl shadow-emerald-500/10 hover:shadow-emerald-500/20 group"
        }`}
      >
        {excelStatus.isAssigned && !hasUnread && !excelStatus.isLocked && (
          <>
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-teal-400/15 rounded-full blur-2xl pointer-events-none"></div>
          </>
        )}

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/20">
              <FileSpreadsheet size={14} className={!excelStatus.isAssigned || excelStatus.isLocked ? "text-slate-400" : "text-emerald-400"} />
              <span>Praktik Digital • Simulasi Spreadsheet</span>
              {excelStatus.isLocked ? (
                <span className="text-rose-300 flex items-center gap-1 text-[11px] font-bold">
                  <Lock size={11} /> Dikunci Guru
                </span>
              ) : excelStatus.isAssigned && !hasUnread ? (
                <span className="text-emerald-300 flex items-center gap-1 text-[11px] font-bold">
                  <CheckCircle size={12} /> Ditugaskan untuk Kelas {excelStatus.studentClassName}
                </span>
              ) : (
                <span className="text-amber-300 flex items-center gap-1 text-[11px] font-bold">
                  <Lock size={11} /> {!excelStatus.isAssigned ? "Belum Ditugaskan Guru" : "Terkunci (Baca Materi)"}
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
              Excel Adventure: Misi Ahli Spreadsheet
            </h2>

            <p className={!excelStatus.isAssigned || hasUnread || excelStatus.isLocked ? "text-slate-400 text-sm leading-relaxed" : "text-emerald-100 text-sm leading-relaxed"}>
              {excelStatus.isLocked
                ? excelStatus.lockReason
                : !excelStatus.isAssigned
                ? `Game Excel Adventure saat ini belum diaktifkan/ditugaskan oleh guru untuk kelas Anda (${excelStatus.studentClassName || "Kelas Siswa"}). Silakan hubungi guru mata pelajaran untuk membuka penugasan latihan spreadsheet ini.`
                : hasUnread
                ? "Selesaikan membaca materi di atas terlebih dahulu untuk membuka akses Excel Adventure."
                : "Kuasai 10 Level materi spreadsheet: rumus matematika, fungsi statistik SUM & AVERAGE, logika IF, COUNTIF/SUMIF, AutoFill, serta visualisasi diagram interaktif!"}
            </p>

            <div className="p-3.5 rounded-2xl bg-black/20 border border-white/15 backdrop-blur-sm text-xs text-emerald-200 flex items-start gap-2.5">
              <span className="text-base shrink-0">📊</span>
              <p className="leading-snug">
                <strong>Target Keterampilan:</strong> Pembelajaran rumus aritmetika, pemformatan tabel, logika keputusan, dan pembuatan grafik visual yang kompatibel dengan Microsoft Excel asli (.xlsx).
              </p>
            </div>
          </div>

          <div className="shrink-0 w-full lg:w-auto">
            {excelStatus.isLocked ? (
              <button
                type="button"
                onClick={() => {
                  alert(`🔒 Game Simulasi Excel Dikunci!\n\n${excelStatus.lockReason}`);
                }}
                className="w-full lg:w-auto px-8 py-4 rounded-2xl bg-slate-800 text-rose-300 border border-rose-500/40 font-black text-sm sm:text-base flex items-center justify-center gap-3 cursor-not-allowed opacity-90 shadow-md"
              >
                <Lock size={18} />
                <span>Game Sedang Dikunci oleh Guru</span>
              </button>
            ) : !excelStatus.isAssigned ? (
              <button
                type="button"
                onClick={() => {
                  alert(
                    `🔒 Game Belum Ditugaskan!\n\nGuru belum menugaskan modul Excel Adventure untuk kelas Anda (${excelStatus.studentClassName || "Kelas Anda"}).\n\nSilakan konfirmasi ke guru mata pelajaran.`
                  );
                }}
                className="w-full lg:w-auto px-8 py-4 rounded-2xl bg-slate-800 text-slate-400 border border-slate-700 font-black text-sm sm:text-base flex items-center justify-center gap-3 cursor-not-allowed opacity-90 shadow-md"
              >
                <Lock size={18} />
                <span>Belum Ditugaskan untuk Kelas Anda</span>
              </button>
            ) : hasUnread ? (
              <button
                type="button"
                onClick={() => {
                  alert("🔒 Fitur Game Terkunci!\n\nAnda harus membaca dan mempelajari materi pelajaran terlebih dahulu sebelum memulai game.");
                }}
                className="w-full lg:w-auto px-8 py-4 rounded-2xl bg-slate-800 text-slate-400 border border-slate-700 font-black text-sm sm:text-base flex items-center justify-center gap-3 cursor-not-allowed opacity-90 shadow-md"
              >
                <Lock size={18} />
                <span>Game Terkunci (Baca Materi Dulu)</span>
              </button>
            ) : (
              <Link
                href="/dashboard/interactive-learning/excel-adventure"
                className="w-full lg:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-base shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group"
              >
                <span>🎮 Mulai Misi Excel Sekarang</span>
                <span className="text-xl group-hover:translate-x-1 transition-transform">▶</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 2C. TOMBOL MULAI GAME COMPUTER SYSTEM SIMULATOR */}
      <div
        className={`rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden border transition-all duration-300 ${
          hasUnread
            ? "bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-slate-700/60 shadow-lg"
            : "bg-gradient-to-r from-indigo-950 via-sky-950 to-slate-900 border-sky-500/40 shadow-2xl shadow-sky-500/10 hover:shadow-sky-500/20 group"
        }`}
      >
        {!hasUnread && (
          <>
            <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/15 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none"></div>
          </>
        )}

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/20">
              <Cpu size={14} className={hasUnread ? "text-slate-400" : "text-sky-400"} />
              <span>Sistem Komputer • Lab Interaktif & Perakitan PC</span>
              {hasUnread ? (
                <span className="text-amber-300 flex items-center gap-1 text-[11px] font-bold">
                  <Lock size={11} /> Terkunci (Baca Materi Dulu)
                </span>
              ) : (
                <span className="text-sky-300 flex items-center gap-1 text-[11px] font-bold">
                  <Sparkles size={11} /> Siap Dimainkan
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
              Computer System Simulator: Arsitektur & Perakitan PC
            </h2>

            <p className={hasUnread ? "text-slate-400 text-sm leading-relaxed" : "text-sky-100 text-sm leading-relaxed"}>
              {hasUnread
                ? "Selesaikan membaca materi di atas terlebih dahulu untuk membuka akses Computer System Simulator."
                : "Pelajari cara kerja komputer dari dalam! Taklukkan 6 level seru: pelajari flashcard perangkat keras, pilah perangkat input/output/storage, susun siklus pemrosesan data CPU, selesaikan troubleshooting, dan rakit PC virtual impianmu!"}
            </p>

            <div className="p-3.5 rounded-2xl bg-black/20 border border-white/15 backdrop-blur-sm text-xs text-sky-200 flex items-start gap-2.5">
              <span className="text-base shrink-0">🖥️</span>
              <p className="leading-snug">
                <strong>6 Level & Lab Virtual:</strong> Dapatkan bintang dan lencana ahli sistem komputer dengan menyelesaikan kuis interaktif, drag-and-drop perangkat, serta perakitan komponen PC.
              </p>
            </div>
          </div>

          <div className="shrink-0 w-full lg:w-auto">
            {hasUnread ? (
              <button
                type="button"
                onClick={() => {
                  alert("🔒 Fitur Game Terkunci!\n\nAnda harus membaca dan mempelajari materi pelajaran terlebih dahulu sebelum memulai game.");
                }}
                className="w-full lg:w-auto px-8 py-4 rounded-2xl bg-slate-800 text-slate-400 border border-slate-700 font-black text-sm sm:text-base flex items-center justify-center gap-3 cursor-not-allowed opacity-90 shadow-md"
              >
                <Lock size={18} />
                <span>Game Terkunci (Baca Materi Dulu)</span>
              </button>
            ) : (
              <Link
                href="/dashboard/interactive-learning/computer-system-simulator"
                className="w-full lg:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-300 hover:to-cyan-300 text-slate-950 font-black text-base shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group"
              >
                <span>🎮 Mulai Simulasi Komputer Sekarang</span>
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
