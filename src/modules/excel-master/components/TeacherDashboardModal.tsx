'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  Users,
  CheckSquare,
  Square,
  FileSpreadsheet,
  Download,
  RotateCcw,
  AlertTriangle,
  Award,
  Search,
  Filter,
  CheckCircle2,
  HelpCircle,
  Clock,
  Sparkles,
  BarChart3,
  Sliders,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface StudentItem {
  id: string;
  fullName: string;
  studentNumber: string;
}

interface ClassItem {
  id: string;
  name: string;
  students: StudentItem[];
}

interface TeacherDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated?: () => void;
}

export default function TeacherDashboardModal({
  isOpen,
  onClose,
  onConfigUpdated
}: TeacherDashboardModalProps) {
  const [activeTab, setActiveTab] = useState<'SETTINGS' | 'RESULTS' | 'ANALYTICS'>('SETTINGS');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Settings State
  const [isLocked, setIsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState('Game Excel Master Challenge sedang dikunci oleh guru.');
  const [assignmentMode, setAssignmentMode] = useState<'ALL' | 'CLASS_ONLY' | 'SPECIFIC_STUDENTS'>('ALL');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [kkmScore, setKkmScore] = useState<number>(75);
  const [allowReplay, setAllowReplay] = useState<boolean>(true);

  // Available classes & students from server
  const [availableClasses, setAvailableClasses] = useState<ClassItem[]>([]);
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});

  // Results State
  const [results, setResults] = useState<any[]>([]);
  const [questionAnalytics, setQuestionAnalytics] = useState<any[]>([]);
  const [summaryStats, setSummaryStats] = useState<any>({
    totalStudents: 0,
    avgScore: 0,
    completedStudents: 0,
    completionRate: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch settings
      const settingsRes = await fetch('/api/excel-master/settings');
      const settingsData = await settingsRes.json();
      if (settingsData.success && settingsData.config) {
        setIsLocked(!!settingsData.config.isLocked);
        setLockMessage(settingsData.config.lockMessage || 'Game Excel Master Challenge sedang dikunci.');
        setAssignmentMode(settingsData.config.assignmentMode || 'ALL');
        setSelectedClassIds(settingsData.config.assignedClassIds || []);
        setSelectedStudentIds(settingsData.config.assignedStudentIds || []);
        setKkmScore(settingsData.config.kkmScore || 75);
        setAllowReplay(settingsData.config.allowReplay !== false);
      }

      // 2. Fetch classes & students
      const classesRes = await fetch('/api/excel-master/classes-students');
      const classesData = await classesRes.json();
      if (classesData.success && Array.isArray(classesData.classes)) {
        setAvailableClasses(classesData.classes);
        // Expand first class by default
        if (classesData.classes.length > 0) {
          setExpandedClasses({ [classesData.classes[0].id]: true });
        }
      }

      // 3. Fetch results
      fetchResults();
    } catch (err) {
      console.error('Error loading teacher data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      const res = await fetch('/api/excel-master/results');
      const data = await res.json();
      if (data.success) {
        setResults(data.results || []);
        setQuestionAnalytics(data.questionAnalytics || []);
        setSummaryStats(data.stats || {});
      }
    } catch (err) {
      console.error('Error fetching results:', err);
    }
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Find class names and student names for metadata
      const assignedClassNames: string[] = [];
      availableClasses.forEach((c) => {
        if (selectedClassIds.includes(c.id)) {
          assignedClassNames.push(c.name);
        }
      });

      const assignedStudentNames: string[] = [];
      availableClasses.forEach((c) => {
        c.students.forEach((s) => {
          if (selectedStudentIds.includes(s.id)) {
            assignedStudentNames.push(`${s.fullName} (${c.name})`);
          }
        });
      });

      const res = await fetch('/api/excel-master/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isLocked,
          lockMessage,
          assignmentMode,
          assignedClassIds: selectedClassIds,
          assignedClassNames,
          assignedStudentIds: selectedStudentIds,
          assignedStudentNames,
          kkmScore,
          allowReplay
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast('✅ Pengaturan game & penugasan berhasil disimpan!');
        if (onConfigUpdated) onConfigUpdated();
      } else {
        alert(data.error || 'Gagal menyimpan pengaturan');
      }
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleClass = (classId: string) => {
    if (selectedClassIds.includes(classId)) {
      setSelectedClassIds(selectedClassIds.filter((id) => id !== classId));
    } else {
      setSelectedClassIds([...selectedClassIds, classId]);
    }
  };

  const handleToggleStudent = (studentId: string) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(selectedStudentIds.filter((id) => id !== studentId));
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
    }
  };

  const handleSelectAllStudentsInClass = (c: ClassItem) => {
    const classStudentIds = c.students.map((s) => s.id);
    const allSelected = classStudentIds.every((id) => selectedStudentIds.includes(id));

    if (allSelected) {
      // Deselect all in this class
      setSelectedStudentIds(selectedStudentIds.filter((id) => !classStudentIds.includes(id)));
    } else {
      // Select all in this class
      const newIds = Array.from(new Set([...selectedStudentIds, ...classStudentIds]));
      setSelectedStudentIds(newIds);
    }
  };

  const handleResetStudent = async (resultId: string, studentName: string) => {
    if (!confirm(`Yakin ingin mereset riwayat & progres ${studentName}? Siswa dapat bermain kembali dari awal.`)) {
      return;
    }

    try {
      const res = await fetch('/api/excel-master/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultId })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Progres ${studentName} berhasil direset.`);
        fetchResults();
      } else {
        alert(data.error || 'Gagal mereset');
      }
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + err.message);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/excel-master/results?format=csv', '_blank');
  };

  if (!isOpen) return null;

  const filteredResults = results.filter((r) => {
    const matchSearch =
      (r.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.className || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchClass = classFilter === 'ALL' || r.className === classFilter;
    return matchSearch && matchClass;
  });

  const uniqueClassNames = Array.from(new Set(results.map((r) => r.className || 'Kelas Siswa')));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg flex items-center justify-center text-white">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">
                  Panel Kontrol Guru — Excel Master Challenge
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  Mode Pendidik
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Atur penugasan per kelas/siswa, pantau nilai 50 soal, dan analisis butir soal tersulit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-2">
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`py-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'SETTINGS'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders size={16} />
            <span>Penugasan & Kunci Game</span>
          </button>
          <button
            onClick={() => setActiveTab('RESULTS')}
            className={`py-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'RESULTS'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 size={16} />
            <span>Rekap Nilai Siswa ({results.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`py-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'ANALYTICS'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle size={16} />
            <span>Analisis Butir Soal Tersulit</span>
          </button>
        </div>

        {/* Toast Alert */}
        {successToast && (
          <div className="absolute top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 animate-in slide-in-from-top duration-200">
            <CheckCircle2 size={16} />
            <span>{successToast}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: SETTINGS & ASSIGNMENT */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-6">
              {/* Lock / Unlock Switch */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {isLocked ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1">
                        <Lock size={12} /> Game Terkunci
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                        <Unlock size={12} /> Game Terbuka
                      </span>
                    )}
                    <h3 className="font-bold text-white text-base">Akses & Status Game</h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    Kunci game jika Anda ingin membatasi pengerjaan hanya pada jam mata pelajaran tertentu.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsLocked(!isLocked)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      isLocked
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40'
                    }`}
                  >
                    {isLocked ? (
                      <>
                        <Unlock size={14} />
                        <span>Buka Kunci Game</span>
                      </>
                    ) : (
                      <>
                        <Lock size={14} />
                        <span>Kunci Game Sekarang</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {isLocked && (
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-2">
                  <label className="text-xs font-bold text-slate-300">Pesan Penguncian untuk Siswa:</label>
                  <input
                    type="text"
                    value={lockMessage}
                    onChange={(e) => setLockMessage(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    placeholder="Contoh: Game akan dibuka pukul 09.00 saat sesi lab komputer dimulai."
                  />
                </div>
              )}

              {/* Assignment Mode */}
              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Users size={18} className="text-emerald-400" />
                    <span>Target Penugasan Permainan</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tentukan siapa saja yang diperbolehkan mengakses dan memainkan tantangan 50 soal ini.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Mode 1: ALL */}
                  <div
                    onClick={() => setAssignmentMode('ALL')}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                      assignmentMode === 'ALL'
                        ? 'bg-emerald-500/15 border-emerald-400 shadow-md shadow-emerald-500/10'
                        : 'bg-slate-900/60 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-white">Semua Siswa & Publik</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          assignmentMode === 'ALL'
                            ? 'border-emerald-400 bg-emerald-500'
                            : 'border-slate-500'
                        }`}
                      >
                        {assignmentMode === 'ALL' && <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">
                      Terbuka untuk semua akun siswa dan tamu umum tanpa pembatasan daftar kelas.
                    </p>
                  </div>

                  {/* Mode 2: CLASS ONLY */}
                  <div
                    onClick={() => setAssignmentMode('CLASS_ONLY')}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                      assignmentMode === 'CLASS_ONLY'
                        ? 'bg-emerald-500/15 border-emerald-400 shadow-md shadow-emerald-500/10'
                        : 'bg-slate-900/60 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-white">Hanya Kelas Tertentu</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          assignmentMode === 'CLASS_ONLY'
                            ? 'border-emerald-400 bg-emerald-500'
                            : 'border-slate-500'
                        }`}
                      >
                        {assignmentMode === 'CLASS_ONLY' && (
                          <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">
                      Hanya siswa yang terdaftar di kelas yang Anda centang yang dapat membuka game.
                    </p>
                  </div>

                  {/* Mode 3: SPECIFIC STUDENTS */}
                  <div
                    onClick={() => setAssignmentMode('SPECIFIC_STUDENTS')}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                      assignmentMode === 'SPECIFIC_STUDENTS'
                        ? 'bg-emerald-500/15 border-emerald-400 shadow-md shadow-emerald-500/10'
                        : 'bg-slate-900/60 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-white">Siswa Tertentu (Remedial)</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          assignmentMode === 'SPECIFIC_STUDENTS'
                            ? 'border-emerald-400 bg-emerald-500'
                            : 'border-slate-500'
                        }`}
                      >
                        {assignmentMode === 'SPECIFIC_STUDENTS' && (
                          <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">
                      Pilih siswa spesifik dari daftar kelas untuk penugasan remedial atau pengayaan khusus.
                    </p>
                  </div>
                </div>

                {/* Sub-selector for CLASS_ONLY */}
                {assignmentMode === 'CLASS_ONLY' && (
                  <div className="pt-2 border-t border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">
                        Pilih Kelas yang Ditugaskan ({selectedClassIds.length} kelas terpilih):
                      </span>
                      <button
                        onClick={() => {
                          if (selectedClassIds.length === availableClasses.length) {
                            setSelectedClassIds([]);
                          } else {
                            setSelectedClassIds(availableClasses.map((c) => c.id));
                          }
                        }}
                        className="text-xs text-emerald-400 hover:underline font-semibold"
                      >
                        {selectedClassIds.length === availableClasses.length
                          ? 'Batalkan Semua'
                          : 'Pilih Semua Kelas'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {availableClasses.map((c) => {
                        const isChecked = selectedClassIds.includes(c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => handleToggleClass(c.id)}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                              isChecked
                                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200'
                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                            }`}
                          >
                            {isChecked ? (
                              <CheckSquare size={16} className="text-emerald-400 shrink-0" />
                            ) : (
                              <Square size={16} className="text-slate-500 shrink-0" />
                            )}
                            <span className="text-xs font-bold truncate">{c.name}</span>
                            <span className="text-[10px] text-slate-400 ml-auto">({c.students.length})</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub-selector for SPECIFIC_STUDENTS */}
                {assignmentMode === 'SPECIFIC_STUDENTS' && (
                  <div className="pt-2 border-t border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">
                        Centang Siswa Tertentu ({selectedStudentIds.length} siswa terpilih):
                      </span>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {availableClasses.map((c) => {
                        const isExpanded = !!expandedClasses[c.id];
                        const classStudentIds = c.students.map((s) => s.id);
                        const selectedInThisClass = classStudentIds.filter((id) =>
                          selectedStudentIds.includes(id)
                        ).length;

                        return (
                          <div key={c.id} className="border border-slate-700 rounded-xl bg-slate-900/60 overflow-hidden">
                            {/* Class Row Header */}
                            <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-800/60">
                              <div
                                onClick={() =>
                                  setExpandedClasses({ ...expandedClasses, [c.id]: !isExpanded })
                                }
                                className="flex items-center gap-2 cursor-pointer flex-1"
                              >
                                {isExpanded ? (
                                  <ChevronDown size={16} className="text-slate-400" />
                                ) : (
                                  <ChevronRight size={16} className="text-slate-400" />
                                )}
                                <span className="text-xs font-bold text-white">{c.name}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                                  {selectedInThisClass} / {c.students.length} Siswa Terpilih
                                </span>
                              </div>

                              <button
                                onClick={() => handleSelectAllStudentsInClass(c)}
                                className="text-[11px] text-emerald-400 hover:underline font-bold"
                              >
                                {selectedInThisClass === c.students.length
                                  ? 'Batal Kelas Ini'
                                  : 'Pilih Semua Siswa'}
                              </button>
                            </div>

                            {/* Students List in this class */}
                            {isExpanded && (
                              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 bg-slate-950/40">
                                {c.students.length === 0 ? (
                                  <span className="text-xs text-slate-500 italic">Belum ada siswa terdaftar</span>
                                ) : (
                                  c.students.map((s) => {
                                    const isSelected = selectedStudentIds.includes(s.id);
                                    return (
                                      <div
                                        key={s.id}
                                        onClick={() => handleToggleStudent(s.id)}
                                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-all ${
                                          isSelected
                                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200'
                                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                                        }`}
                                      >
                                        {isSelected ? (
                                          <CheckSquare size={14} className="text-emerald-400 shrink-0" />
                                        ) : (
                                          <Square size={14} className="text-slate-500 shrink-0" />
                                        )}
                                        <div className="min-w-0 flex-1">
                                          <div className="text-xs font-semibold truncate text-slate-200">
                                            {s.fullName}
                                          </div>
                                          <div className="text-[10px] text-slate-400">NIS: {s.studentNumber}</div>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* KKM & Replay Settings */}
              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Passing Grade / KKM Nilai (%):</label>
                  <p className="text-[11px] text-slate-400">
                    Batas persentase kelulusan untuk status Tuntas (default 75% atau 3.750 poin).
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <input
                      type="range"
                      min={50}
                      max={95}
                      step={5}
                      value={kkmScore}
                      onChange={(e) => setKkmScore(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-black text-sm rounded-xl border border-emerald-500/30">
                      {kkmScore}%
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Izinkan Pengerjaan Ulang (Replay):</label>
                  <p className="text-[11px] text-slate-400">
                    Bila diaktifkan, siswa yang telah selesai dapat mengulang untuk memperbaiki skor.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setAllowReplay(!allowReplay)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        allowReplay
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      <RotateCcw size={14} />
                      <span>{allowReplay ? 'Aktif (Siswa Boleh Mengulang)' : 'Nonaktif (Satu Kali Saja)'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-emerald-950/40 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 size={18} />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Game'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: STUDENT RESULTS */}
          {activeTab === 'RESULTS' && (
            <div className="space-y-5">
              {/* Summary KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
                  <div className="text-xs text-slate-400 font-medium">Total Siswa Bermain</div>
                  <div className="text-2xl font-black text-white mt-1">{summaryStats.totalStudents}</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
                  <div className="text-xs text-slate-400 font-medium">Rata-rata Skor</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {summaryStats.avgScore} <span className="text-xs text-slate-400 font-normal">/ 5000</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
                  <div className="text-xs text-slate-400 font-medium">Selesai 50 Soal</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">{summaryStats.completedStudents}</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
                  <div className="text-xs text-slate-400 font-medium">Tingkat Ketuntasan</div>
                  <div className="text-2xl font-black text-cyan-400 mt-1">{summaryStats.completionRate}%</div>
                </div>
              </div>

              {/* Action Bar (Search, Filter, Export) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1 max-w-sm">
                    <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama siswa atau kelas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ALL">Semua Kelas</option>
                    {uniqueClassNames.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCsv}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md"
                  >
                    <Download size={14} />
                    <span>Download Excel (CSV)</span>
                  </button>
                  <button
                    onClick={fetchResults}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Refresh Data"
                  >
                    <RotateCcw size={15} />
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-800/80 text-slate-300 font-bold border-b border-slate-700">
                      <th className="py-3 px-4">No</th>
                      <th className="py-3 px-4">Nama Siswa</th>
                      <th className="py-3 px-4">Kelas</th>
                      <th className="py-3 px-4">Level</th>
                      <th className="py-3 px-4">Skor Akhir</th>
                      <th className="py-3 px-4">Akurasi</th>
                      <th className="py-3 px-4">Gelar & Medali</th>
                      <th className="py-3 px-4">Waktu</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredResults.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-500">
                          Belum ada data pengerjaan siswa yang sesuai.
                        </td>
                      </tr>
                    ) : (
                      filteredResults.map((r, idx) => {
                        const isPassKkm = (r.accuracy || 0) >= kkmScore;
                        return (
                          <tr key={r._id || idx} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                            <td className="py-3 px-4 font-bold text-white">{r.studentName}</td>
                            <td className="py-3 px-4">{r.className || '-'}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                                Lvl {r.highestLevel || 1}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-black text-emerald-400">
                              {r.totalScore || 0}
                              <span className="text-[10px] text-slate-400 font-normal"> / 5000</span>
                            </td>
                            <td className="py-3 px-4 font-bold">
                              <span
                                className={`px-2 py-0.5 rounded-full ${
                                  isPassKkm
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-rose-500/20 text-rose-300'
                                }`}
                              >
                                {r.accuracy ? r.accuracy.toFixed(1) : 0}%
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-amber-300">{r.titleAwarded || 'EXCEL BEGINNER'}</div>
                              <div className="text-[10px] text-slate-400">
                                {(r.medals || []).length} Medali diraih
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-400">
                              {Math.floor((r.totalTimeSeconds || 0) / 60)}m {(r.totalTimeSeconds || 0) % 60}s
                            </td>
                            <td className="py-3 px-4">
                              {r.isCompleted ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                                  SELESAI (50 Soal)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                                  DALAM PROSES
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleResetStudent(r._id, r.studentName)}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-bold flex items-center gap-1 mx-auto transition-colors"
                                title="Reset untuk Remedial"
                              >
                                <RotateCcw size={12} />
                                <span>Remedial</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MOST MISSED QUESTIONS ANALYTICS */}
          {activeTab === 'ANALYTICS' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-amber-300">
                    Analisis Butir Soal Paling Banyak Salah (Tingkat Kesulitan Siswa)
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    Daftar di bawah diurutkan berdasarkan persentase kesalahan siswa. Gunakan insight ini untuk
                    memberikan penguatan materi Excel di kelas pada rumus atau konsep yang paling membingungkan siswa.
                  </p>
                </div>
              </div>

              {questionAnalytics.length === 0 ? (
                <div className="p-8 text-center text-slate-500 border border-slate-800 rounded-2xl">
                  Belum ada data kesalahan soal dari pengerjaan siswa.
                </div>
              ) : (
                <div className="space-y-3">
                  {questionAnalytics.slice(0, 10).map((qa, idx) => (
                    <div
                      key={qa.id}
                      className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-black text-xs">
                            #{idx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-bold text-[11px]">
                            Level {qa.level}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px]">
                            {qa.theme}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-rose-400 font-black">
                            Tingkat Salah: {qa.errorRate}%
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({qa.wrongAttempts} dari {qa.totalAttempts} percobaan)
                          </span>
                        </div>
                      </div>

                      <p className="text-xs font-semibold text-slate-200 leading-relaxed">
                        <span className="text-slate-400 font-normal">Soal #{qa.id}:</span> {qa.question}
                      </p>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="text-[11px] font-bold text-emerald-400">
                          Kunci Jawaban: ({qa.correctAnswer})
                        </div>
                        <div className="text-[11px] text-slate-300 leading-relaxed">
                          <span className="font-semibold text-slate-400">Pembahasan: </span>
                          {qa.explanation}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>Solusi Guru • Excel Master Challenge Modul Pendidik</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </div>
  );
}
