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
  Unlock,
  RotateCcw,
  RefreshCw,
  Layers,
  Save,
  Loader2,
  ExternalLink,
  HelpCircle,
  Eye,
  Search,
  Cpu
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
  isLocked?: boolean;
  lockMessage?: string;
}

interface BorneoEduConfigData {
  isLocked: boolean;
  lockedClassNames: string[];
  lockMessage?: string;
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
    instructions: "Selesaikan seluruh misi dan latihan spreadsheet sesuai petunjuk guru.",
    isLocked: false,
    lockMessage: "Game Simulasi Excel sedang dikunci oleh guru."
  });
  const [borneoConfig, setBorneoConfig] = useState<BorneoEduConfigData>({
    isLocked: false,
    lockedClassNames: [],
    lockMessage: "Game Petualangan Borneo Edu sedang dikunci oleh guru."
  });

  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Modal Reset Game State
  const [showResetModal, setShowResetModal] = useState(false);
  const [activeResetGame, setActiveResetGame] = useState<'EXCEL' | 'BORNEO'>('EXCEL');
  const [resetSelectedClass, setResetSelectedClass] = useState<string>('ALL');
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [excelStudents, setExcelStudents] = useState<any[]>([]);
  const [borneoStudents, setBorneoStudents] = useState<any[]>([]);
  const [resetActionLoading, setResetActionLoading] = useState(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      const [excelRes, borneoRes] = await Promise.all([
        fetch("/api/excel-adventure/settings", { credentials: "include" }),
        fetch("/api/borneo-edu/settings")
      ]);

      const excelData = await excelRes.json();
      if (excelData && excelData.success) {
        if (Array.isArray(excelData.teacherClasses)) {
          setTeacherClasses(excelData.teacherClasses);
        }
        if (excelData.config) {
          setConfig(excelData.config);
          setSelectedClassIds(excelData.config.assignedClassIds || []);
        }
      }

      const borneoData = await borneoRes.json();
      if (borneoData && borneoData.success && borneoData.data) {
        setBorneoConfig(borneoData.data);
      }
    } catch (err) {
      console.error("Gagal memuat pengaturan game:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentLists = async () => {
    try {
      const [exRes, boRes] = await Promise.all([
        fetch("/api/excel-adventure/results"),
        fetch("/api/borneo-edu/results")
      ]);
      const exData = await exRes.json();
      if (exData && exData.success && Array.isArray(exData.data)) {
        setExcelStudents(exData.data);
      }
      const boData = await boRes.json();
      if (boData && boData.success && Array.isArray(boData.data)) {
        setBorneoStudents(boData.data);
      }
    } catch (err) {
      console.error("Gagal mengambil data siswa game:", err);
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
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedClassIds: selectedClassIds,
          isLocked: config.isLocked,
          lockMessage: config.lockMessage,
          kkmScore: config.kkmScore,
          activeLevels: config.activeLevels,
          instructions: config.instructions,
          userRole: "TEACHER"
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

  // Toggle Lock Game Simulasi Excel
  const handleToggleExcelLock = async () => {
    const nextLocked = !Boolean(config.isLocked);
    try {
      const res = await fetch("/api/excel-adventure/settings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedClassIds: selectedClassIds,
          isLocked: nextLocked,
          lockMessage: config.lockMessage || "Game Simulasi Excel sedang dikunci oleh guru.",
          kkmScore: config.kkmScore,
          instructions: config.instructions,
          userRole: "TEACHER"
        })
      });
      if (res.ok) {
        setConfig((prev) => ({ ...prev, isLocked: nextLocked }));
      } else {
        alert("Gagal mengubah status kunci game Excel.");
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    }
  };

  // Toggle Lock Game Borneo Edu
  const handleToggleBorneoLock = async () => {
    const nextLocked = !Boolean(borneoConfig.isLocked);
    try {
      const res = await fetch("/api/borneo-edu/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...borneoConfig,
          isLocked: nextLocked
        })
      });
      if (res.ok) {
        setBorneoConfig((prev) => ({ ...prev, isLocked: nextLocked }));
      } else {
        alert("Gagal mengubah status kunci game Borneo Edu.");
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    }
  };

  // Handler Reset Per-Kelas
  const handleResetClass = async (game: 'EXCEL' | 'BORNEO', className: string) => {
    if (!className || className === 'ALL') {
      alert("Pilih kelas tertentu terlebih dahulu untuk mereset seluruh siswa.");
      return;
    }

    const gameTitle = game === 'EXCEL' ? "Game Simulasi Excel" : "Game Borneo Edu";
    const confirmed = window.confirm(
      `⚠️ PERINGATAN RESET KELAS!\n\nApakah Anda yakin ingin mereset seluruh siswa di "${className}" pada ${gameTitle} kembali ke Level 1?\n\nSemua riwayat level, skor, dan capaian siswa di kelas ini akan kembali ke awal.`
    );
    if (!confirmed) return;

    setResetActionLoading(true);
    setResetNotice(null);
    try {
      const endpoint = game === 'EXCEL' ? "/api/excel-adventure/reset" : "/api/borneo-edu/reset";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "class", className })
      });
      const data = await res.json();
      if (data.success) {
        setResetNotice(`✓ Seluruh siswa di ${className} berhasil direset ke Level 1.`);
        await fetchStudentLists();
        setTimeout(() => setResetNotice(null), 3500);
      } else {
        alert(data.error || "Gagal mereset kelas.");
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setResetActionLoading(false);
    }
  };

  // Handler Reset Per-Siswa
  const handleResetStudent = async (game: 'EXCEL' | 'BORNEO', studentIdOrName: string, studentName: string, className?: string) => {
    const gameTitle = game === 'EXCEL' ? "Game Simulasi Excel" : "Game Borneo Edu";
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin mereset progres siswa "${studentName}" pada ${gameTitle} ke Level 1?`
    );
    if (!confirmed) return;

    setResetActionLoading(true);
    setResetNotice(null);
    try {
      const endpoint = game === 'EXCEL' ? "/api/excel-adventure/reset" : "/api/borneo-edu/reset";
      const payload: any = { target: "student", studentName, className };
      if (studentIdOrName) payload.resultId = studentIdOrName;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setResetNotice(`✓ Progres ${studentName} berhasil direset ke Level 1.`);
        await fetchStudentLists();
        setTimeout(() => setResetNotice(null), 3500);
      } else {
        alert(data.error || "Gagal mereset siswa.");
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setResetActionLoading(false);
    }
  };

  // Buka modal reset level
  const openResetModal = (game: 'EXCEL' | 'BORNEO') => {
    setActiveResetGame(game);
    setShowResetModal(true);
    fetchStudentLists();
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
            Kontrol kunci akses game, kelola penugasan kelas, dan reset level siswa per-individu maupun per-kelas.
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
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* KARTU 1: EXCEL ADVENTURE DENGAN KENDALI PENUGASAN KELAS & KUNCI */}
        <div className="rounded-3xl bg-gradient-to-br from-teal-950 via-slate-900 to-slate-950 border-2 border-emerald-500/40 p-6 sm:p-7 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-inner">
                  <FileSpreadsheet size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                      Simulasi Spreadsheet & Rumus
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                      config.isLocked
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    }`}>
                      {config.isLocked ? "🔒 Terkunci" : "🔓 Terbuka"}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-1">
                    Excel Adventure: Misi Ahli Spreadsheet
                  </h3>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Modul 10 level simulasi spreadsheet: rumus matematika, statistik, logika IF, AutoFill, diagram grafik visual, duel cerdas cermat, serta ekspor file .XLSX asli.
            </p>

            {/* Status Penugasan Kelas & Kunci */}
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
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAssignModal(true)}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition active:scale-95"
              >
                <Settings size={14} />
                <span>Tugaskan Kelas</span>
              </button>

              {/* Tombol Kunci / Buka Cepat */}
              <button
                type="button"
                onClick={handleToggleExcelLock}
                className={`px-3 py-2.5 rounded-xl text-xs font-black border transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
                  config.isLocked
                    ? "bg-rose-900/80 hover:bg-rose-800 text-rose-200 border-rose-500/50"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
                title={config.isLocked ? "Buka akses game untuk siswa" : "Kunci akses game untuk siswa"}
              >
                {config.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                <span>{config.isLocked ? "Buka Kunci" : "Kunci Game"}</span>
              </button>

              {/* Tombol Reset Level */}
              <button
                type="button"
                onClick={() => openResetModal('EXCEL')}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-200 hover:text-rose-200 border border-slate-700 hover:border-rose-500/40 text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
                title="Reset progres level siswa atau kelas"
              >
                <RotateCcw size={14} />
                <span>Reset Level</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/interactive-learning/excel-adventure"
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center gap-1.5"
              >
                <span>Panel IFP</span>
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

        {/* KARTU 2: BORNEO EDU DENGAN KENDALI KUNCI & RESET */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 border-2 border-amber-500/40 p-6 sm:p-7 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner">
                  <Trophy size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                      Platformer 2D Kurikulum
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                      borneoConfig.isLocked
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    }`}>
                      {borneoConfig.isLocked ? "🔒 Terkunci" : "🔓 Terbuka"}
                    </span>
                  </div>
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
                <span className="text-amber-300 text-xs">
                  {borneoConfig.isLocked ? "Akses Sedang Dikunci" : "Aktif Sepanjang Tahun"}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Siswa diwajibkan menyelesaikan membaca materi sebelum game terbuka, dan mengerjakan 5 pertanyaan refleksi setelah tamat.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-5 mt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/dashboard/interactive-learning/borneo-edu"
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition active:scale-95"
              >
                <Trophy size={14} />
                <span>Meja Guru</span>
              </Link>

              {/* Tombol Kunci / Buka Cepat Borneo Edu */}
              <button
                type="button"
                onClick={handleToggleBorneoLock}
                className={`px-3 py-2.5 rounded-xl text-xs font-black border transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
                  borneoConfig.isLocked
                    ? "bg-rose-900/80 hover:bg-rose-800 text-rose-200 border-rose-500/50"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
                title={borneoConfig.isLocked ? "Buka akses game untuk siswa" : "Kunci akses game untuk siswa"}
              >
                {borneoConfig.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                <span>{borneoConfig.isLocked ? "Buka Kunci" : "Kunci Game"}</span>
              </button>

              {/* Tombol Reset Level Borneo Edu */}
              <button
                type="button"
                onClick={() => openResetModal('BORNEO')}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-200 hover:text-rose-200 border border-slate-700 hover:border-rose-500/40 text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
                title="Reset progres level siswa atau kelas"
              >
                <RotateCcw size={14} />
                <span>Reset Level</span>
              </button>
            </div>

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

        {/* KARTU 3: COMPUTER SYSTEM SIMULATOR */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-950 via-sky-950 to-slate-950 border-2 border-sky-500/40 p-6 sm:p-7 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-inner">
                  <Cpu size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-black uppercase tracking-wider border border-sky-500/30">
                      Simulasi Hardware & Arsitektur
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                      🔓 Aktif Bebas
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-1">
                    Computer System Simulator
                  </h3>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Modul interaktif 6 level: flashcard perangkat keras, klasifikasi perangkat I/O & storage, siklus alur data pemrosesan CPU, simulasi proses sistem, troubleshooting, dan perakitan PC virtual interaktif.
            </p>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-sky-400" />
                  <span>Fitur Guru & SmartBoard IFP:</span>
                </span>
                <span className="text-sky-300 text-xs font-black">
                  Mode Guru Didukung
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Mode Guru memungkinkan demonstrasi langsung di depan kelas, membuka semua level secara instan, dan menampilkan kunci jawaban untuk diskusi interaktif.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-5 mt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/interactive-learning/computer-system-simulator"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-300 hover:to-cyan-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition active:scale-95"
              >
                <Cpu size={14} />
                <span>Panel IFP SmartBoard</span>
              </Link>
            </div>

            <Link
              href="/interactive-learning/computer-system-simulator"
              target="_blank"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Buka Layar Penuh Standalone"
            >
              <ExternalLink size={15} />
            </Link>
          </div>
        </div>
      </div>

      {/* MODAL 1: PENUGASAN KELAS KHUSUS GURU */}
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
                            : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                        }`}
                      >
                        <span>{cls.name}</span>
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-black ${
                            isChecked
                              ? "bg-emerald-500 text-slate-950"
                              : "border border-slate-600"
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

            {/* Pengaturan Kunci Langsung di Modal */}
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Status Kunci Permainan:</span>
                <span className="text-[11px] text-slate-400">
                  {config.isLocked ? "Game sedang dikunci untuk semua kelas" : "Game terbuka bagi kelas yang dicentang"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, isLocked: !prev.isLocked }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-black border transition ${
                  config.isLocked
                    ? "bg-rose-900 text-rose-200 border-rose-500"
                    : "bg-emerald-600 text-white border-emerald-500"
                }`}
              >
                {config.isLocked ? "🔒 Terkunci" : "🔓 Terbuka"}
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {selectedClassIds.length} kelas dipilih
              </span>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveAssignments}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Simpan Penugasan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RESET LEVEL SISWA (PER-KELAS & PER-SISWA) */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-rose-500/50 rounded-3xl max-w-2xl w-full p-6 sm:p-8 text-white shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  <RotateCcw size={22} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    Reset Level Game Siswa ke Level 1
                  </h3>
                  <p className="text-xs text-slate-400">
                    Kembalikan progres permainan ke kondisi awal baik per-kelas maupun individu per-siswa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Switch Tab Game */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveResetGame('EXCEL');
                  setResetSelectedClass('ALL');
                }}
                className={`py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition ${
                  activeResetGame === 'EXCEL'
                    ? "bg-emerald-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileSpreadsheet size={15} />
                <span>Game Simulasi Excel</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveResetGame('BORNEO');
                  setResetSelectedClass('ALL');
                }}
                className={`py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition ${
                  activeResetGame === 'BORNEO'
                    ? "bg-amber-400 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Trophy size={15} />
                <span>Borneo Edu</span>
              </button>
            </div>

            {resetNotice && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs font-bold animate-in fade-in">
                {resetNotice}
              </div>
            )}

            {/* SEKSI A: RESET PER-KELAS */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-300">
                  1. Reset Seluruh Siswa di Satu Kelas:
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <select
                  value={resetSelectedClass}
                  onChange={(e) => setResetSelectedClass(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none"
                >
                  <option value="ALL">Pilih Kelas yang Ingin Direset...</option>
                  {teacherClasses.map((cls) => (
                    <option key={cls.id} value={cls.name}>{cls.name}</option>
                  ))}
                </select>

                <button
                  type="button"
                  disabled={resetActionLoading || resetSelectedClass === 'ALL'}
                  onClick={() => handleResetClass(activeResetGame, resetSelectedClass)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-95 shrink-0"
                >
                  <RotateCcw size={14} className={resetActionLoading ? "animate-spin" : ""} />
                  <span>Reset Kelas Ini</span>
                </button>
              </div>
            </div>

            {/* SEKSI B: RESET PER-SISWA */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                  2. Reset Siswa Tertentu:
                </span>
                <div className="relative w-full sm:w-56">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama siswa..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>

              {/* Tabel Siswa */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                {(() => {
                  const studentList = activeResetGame === 'EXCEL' ? excelStudents : borneoStudents;
                  const filtered = studentList.filter((s) => {
                    const nameMatch = s.studentName?.toLowerCase().includes(studentSearchQuery.toLowerCase());
                    const classMatch = resetSelectedClass === 'ALL' || s.className?.toLowerCase() === resetSelectedClass.toLowerCase();
                    return nameMatch && classMatch;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        Tidak ada data siswa ditemukan untuk {activeResetGame === 'EXCEL' ? "Game Excel" : "Borneo Edu"}. Siswa yang memainkan game akan otomatis tercatat di sini.
                      </div>
                    );
                  }

                  return (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px] font-black sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">Nama Siswa</th>
                          <th className="py-2.5 px-3">Kelas</th>
                          <th className="py-2.5 px-3">Level Terkini</th>
                          <th className="py-2.5 px-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {filtered.map((s, idx) => (
                          <tr key={s._id || `${s.studentName}-${idx}`} className="hover:bg-slate-900/50">
                            <td className="py-2.5 px-3 font-bold text-white">{s.studentName}</td>
                            <td className="py-2.5 px-3">{s.className || 'Kelas 7'}</td>
                            <td className="py-2.5 px-3 font-black text-amber-400">
                              Level {s.highestLevel || s.completedLevels?.length || 1}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                disabled={resetActionLoading}
                                onClick={() => handleResetStudent(activeResetGame, s._id, s.studentName, s.className)}
                                className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-500/40 rounded-lg text-xs font-bold transition flex items-center gap-1 mx-auto"
                              >
                                <RotateCcw size={12} />
                                <span>Reset L1</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
