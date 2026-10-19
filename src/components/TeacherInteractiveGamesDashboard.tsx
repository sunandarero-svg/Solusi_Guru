"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Gamepad2,
  FileSpreadsheet,
  Trophy,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Settings,
  Sparkles,
  Users,
  Lock,
  Layers,
  Save,
  Loader2,
  ExternalLink,
  HelpCircle,
  Eye
} from "lucide-react";

interface TeacherClassItem {
  id: string;
  name: string;
}

interface ExcelAdventureConfigData {
  assignedClassIds: string[];
  assignedClassNames: string[];
  kkmScore: number;
  activeLevels: number[];
  instructions: string;
}

export default function TeacherInteractiveGamesDashboard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacherClasses, setTeacherClasses] = useState<TeacherClassItem[]>([]);
  const [config, setConfig] = useState<ExcelAdventureConfigData>({
    assignedClassIds: [],
    assignedClassNames: [],
    kkmScore: 75,
    activeLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    instructions: "Selesaikan seluruh misi dan latihan spreadsheet sesuai petunjuk guru."
  });
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/excel-adventure/settings");
      const data = await res.json();
      if (data && data.success) {
        if (Array.isArray(data.teacherClasses)) {
          setTeacherClasses(data.teacherClasses);
        }
        if (data.config) {
          setConfig(data.config);
          setSelectedClassIds(data.config.assignedClassIds || []);
        }
      }
    } catch (err) {
      console.error("Gagal memuat pengaturan game:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggleClass = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const handleSelectAllMyClasses = () => {
    const myIds = teacherClasses.map((c) => c.id);
    const allSelected = myIds.every((id) => selectedClassIds.includes(id));
    if (allSelected) {
      setSelectedClassIds((prev) => prev.filter((id) => !myIds.includes(id)));
    } else {
      setSelectedClassIds((prev) => Array.from(new Set([...prev, ...myIds])));
    }
  };

  const handleSaveAssignments = async () => {
    setSaving(true);
    setSaveSuccessNotice(null);
    try {
      const res = await fetch("/api/excel-adventure/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedClassIds: selectedClassIds,
          kkmScore: config.kkmScore,
          activeLevels: config.activeLevels,
          instructions: config.instructions
        })
      });
      const data = await res.json();
      if (res.ok) {
        await fetchSettings();
        setSaveSuccessNotice("✓ Pengaturan penugasan kelas berhasil diperbarui!");
        setTimeout(() => {
          setShowAssignModal(false);
          setSaveSuccessNotice(null);
        }, 1500);
      } else {
        alert(data.error || "Gagal menyimpan penugasan.");
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan saat menyimpan penugasan.");
    } finally {
      setSaving(false);
    }
  };

  // Hitung kelas guru yang saat ini ditugaskan
  const assignedTeacherClasses = teacherClasses.filter((tc) =>
    config.assignedClassIds?.includes(tc.id)
  );

  return (
    <div className="mt-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black mb-2 shadow-sm">
            <Gamepad2 size={14} />
            <span>Meja Guru • Modul Gamifikasi & Praktik Digital</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Game Edukasi & Pembelajaran Interaktif
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Kelola penugasan modul game ke kelas tertentu dan demonstrasikan di layar sentuh SmartBoard / IFP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/interactive-learning"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
          >
            <span>Buka Hub Modul</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Grid Kartu Game */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KARTU 1: EXCEL ADVENTURE DENGAN KENDALI PENUGASAN KELAS */}
        <div className="rounded-3xl bg-gradient-to-br from-teal-950 via-slate-900 to-slate-950 border-2 border-emerald-500/40 p-6 sm:p-7 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-inner">
                  <FileSpreadsheet size={26} />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                    Simulasi Spreadsheet & Rumus
                  </span>
                  <h3 className="text-xl font-black text-white mt-1">
                    Excel Adventure: Misi Ahli Spreadsheet
                  </h3>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Modul 10 level simulasi spreadsheet: rumus matematika, statistik, logika IF, AutoFill, diagram grafik visual, duel cerdas cermat, serta ekspor file .XLSX asli.
            </p>

            {/* Status Penugasan Kelas */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Users size={14} className="text-emerald-400" />
                  <span>Status Penugasan Kelas:</span>
                </span>
                {assignedTeacherClasses.length > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-black border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle size={12} /> {assignedTeacherClasses.length} Kelas Aktif
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-black border border-amber-500/40 flex items-center gap-1">
                    <AlertCircle size={12} /> Belum Ditugaskan
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {assignedTeacherClasses.length > 0 ? (
                  assignedTeacherClasses.map((c) => (
                    <span
                      key={c.id}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/70 text-emerald-200 border border-emerald-500/30 text-xs font-bold"
                    >
                      ✓ {c.name}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-amber-200/80 italic">
                    Siswa tidak dapat mengakses game ini sebelum Anda memilih kelas yang ditugaskan di bawah.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-5 mt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md transition active:scale-95"
            >
              <Settings size={15} />
              <span>Tugaskan ke Kelas Tertentu</span>
            </button>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/interactive-learning/excel-adventure"
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center gap-1.5"
              >
                <span>Panel Guru (IFP)</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/interactive-learning/excel-adventure"
                target="_blank"
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                title="Buka Layar Penuh Standalone"
              >
                <ExternalLink size={15} />
              </Link>
            </div>
          </div>
        </div>

        {/* KARTU 2: BORNEO EDU */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 border-2 border-amber-500/40 p-6 sm:p-7 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner">
                  <Trophy size={26} />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                    Platformer 2D Kurikulum
                  </span>
                  <h3 className="text-xl font-black text-white mt-1">
                    Game Petualangan Borneo Edu
                  </h3>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Pantau progres petualangan 25 level di 5 World, kelola bank soal kurikulum, analisis tingkat pemahaman materi siswa, dan ekspor lembar rekapitulasi nilai.
            </p>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" />
                  <span>Fitur Guru Borneo Edu:</span>
                </span>
                <span className="text-amber-300 text-xs">Aktif Sepanjang Tahun</span>
              </div>
              <p className="text-xs text-slate-300">
                Siswa diwajibkan menyelesaikan membaca materi sebelum game terbuka, dan mengerjakan 5 pertanyaan refleksi setelah tamat.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-5 mt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/dashboard/interactive-learning/borneo-edu"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md transition active:scale-95"
            >
              <Trophy size={15} />
              <span>Buka Meja Guru Borneo Edu</span>
            </Link>

            <Link
              href="/interactive-learning/borneo-edu"
              target="_blank"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Coba Game Borneo Edu"
            >
              <ExternalLink size={15} />
            </Link>
          </div>
        </div>
      </div>

      {/* MODAL PENUGASAN KELAS KHUSUS GURU */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl max-w-xl w-full p-6 sm:p-7 text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Settings size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    Penugasan Game Excel Adventure
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pilih kelas yang diizinkan untuk mengakses modul spreadsheet ini
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {saveSuccessNotice && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs font-bold animate-in fade-in">
                {saveSuccessNotice}
              </div>
            )}

            {/* Checklist Kelas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Daftar Kelas Ajar Anda:
                </label>
                {teacherClasses.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllMyClasses}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold"
                  >
                    Pilih / Batal Semua
                  </button>
                )}
              </div>

              {teacherClasses.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-800 text-center text-xs text-slate-400">
                  Belum ada kelas yang terdaftar pada profil ajar Anda. Silakan hubungi admin sekolah jika data kelas belum sesuai.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
                  {teacherClasses.map((cls) => {
                    const isChecked = selectedClassIds.includes(cls.id);
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => handleToggleClass(cls.id)}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between ${
                          isChecked
                            ? "bg-emerald-950/70 border-emerald-400 text-emerald-200 shadow-sm"
                            : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        <span>{cls.name}</span>
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-black ${
                            isChecked ? "bg-emerald-500 text-slate-950" : "border border-slate-500"
                          }`}
                        >
                          {isChecked ? "✓" : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pengaturan Nilai KKM & Petunjuk */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Target Nilai KKM Minimal:
                </label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={config.kkmScore}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, kkmScore: Number(e.target.value) || 75 }))
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Petunjuk Khusus untuk Siswa:
                </label>
                <input
                  type="text"
                  value={config.instructions}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, instructions: e.target.value }))
                  }
                  placeholder="Contoh: Selesaikan Level 1-5"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveAssignments}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Simpan Penugasan Kelas</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
