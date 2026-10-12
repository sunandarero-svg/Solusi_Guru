"use client";

import React, { useState, useEffect, useMemo } from 'react';
import * as xlsx from 'xlsx';
import { PlayerState, TeacherConfig, QuestionItem, RecapStudentRow } from './types';
import {
  DEFAULT_TEACHER_CONFIG,
  calculateFinalScore,
  formatToRecapRow,
  getLocalRecords,
  getStoredQuestions,
  getSavedConfig,
  saveTeacherConfigToLocal
} from './storage';
import {
  Trophy,
  Users,
  Award,
  CheckCircle2,
  FileSpreadsheet,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Sliders,
  HelpCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface BorneoEduTeacherProgressProps {
  userRole?: string;
  teacherName?: string;
}

export default function BorneoEduTeacherProgress({
  userRole = 'TEACHER',
  teacherName = 'Guru'
}: BorneoEduTeacherProgressProps) {
  const [records, setRecords] = useState<PlayerState[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [config, setConfig] = useState<TeacherConfig>(() => getSavedConfig());
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'rekap' | 'bank_soal' | 'pengaturan'>('rekap');

  // Filters
  const [filterClass, setFilterClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<PlayerState | null>(null);

  // Load data from DB / LocalStorage
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Get from localStorage as baseline
      const localRecs = getLocalRecords();
      setRecords(localRecs);
      setQuestions(getStoredQuestions());

      // 2. Fetch latest from API
      const res = await fetch('/api/borneo-edu/results');
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setRecords(data.data);
      }

      const qRes = await fetch('/api/borneo-edu/questions');
      const qData = await qRes.json();
      if (qData.success && Array.isArray(qData.data) && qData.data.length > 0) {
        setQuestions(qData.data);
      }
    } catch (e) {
      console.log('Borneo Edu local fallback mode:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Distinct classes for filter dropdown
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.className) set.add(r.className.trim());
    });
    return Array.from(set);
  }, [records]);

  // Formatted & filtered rows
  const formattedRows: RecapStudentRow[] = useMemo(() => {
    return records.map((r) => formatToRecapRow(r, config));
  }, [records, config]);

  const filteredRows = useMemo(() => {
    return formattedRows.filter((r) => {
      const matchClass = filterClass === 'all' || r.className.toLowerCase() === filterClass.toLowerCase();
      const matchSearch =
        r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.studentNumber.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchSearch;
    });
  }, [formattedRows, filterClass, searchQuery]);

  // Summary Metrics
  const stats = useMemo(() => {
    const totalStudents = formattedRows.length;
    if (totalStudents === 0) {
      return { total: 0, avgScore: 0, avgAccuracy: 0, passedCount: 0, passRate: 0 };
    }
    const sumScore = formattedRows.reduce((acc, curr) => acc + curr.finalScore, 0);
    const sumAcc = formattedRows.reduce((acc, curr) => acc + curr.accuracy, 0);
    const passed = formattedRows.filter((r) => r.finalScore >= 75).length;

    return {
      total: totalStudents,
      avgScore: Math.round(sumScore / totalStudents),
      avgAccuracy: Math.round(sumAcc / totalStudents),
      passedCount: passed,
      passRate: Math.round((passed / totalStudents) * 100)
    };
  }, [formattedRows]);

  // Excel Export (.xlsx)
  const handleExportExcel = () => {
    if (filteredRows.length === 0) {
      alert('Tidak ada data siswa untuk diekspor.');
      return;
    }

    const rows = filteredRows.map((f, idx) => ({
      'No': idx + 1,
      'Nama Siswa': f.studentName,
      'Nomor Absen': f.studentNumber,
      'Kelas': f.className,
      'Mata Pelajaran': f.subject,
      'World Selesai': `${f.completedWorlds} / 5`,
      'Level Selesai': `${f.completedLevelsCount} / 25`,
      'Total Koin': f.totalCoins,
      'Skor Game': f.totalScore,
      'Jawaban Benar': f.correctCount,
      'Jawaban Salah': f.wrongCount,
      'Total Soal': f.totalQuestions,
      'Akurasi (%)': `${f.accuracy}%`,
      'Combo Tertinggi': f.highestCombo,
      'Boss Dikalahkan': `${f.bossesDefeated} / 5`,
      'Badge': f.badgeText,
      'Nilai Akhir (0-100)': f.finalScore,
      'Status Ketuntasan': f.finalScore >= 75 ? 'TUNTAS' : 'BELUM TUNTAS',
      'Status Permainan': f.gameStatus,
      'Terakhir Diperbarui': f.updatedAt
    }));

    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Hasil Borneo Edu');

    const fileName = `Rekap_Progress_Borneo_Edu_${new Date().toISOString().slice(0, 10)}.xlsx`;
    xlsx.writeFile(workbook, fileName);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-2xl border border-emerald-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black flex items-center gap-1.5 border border-emerald-400/40">
                <ShieldCheck size={14} />
                <span>Mode Guru & Pemantauan</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black flex items-center gap-1.5 border border-amber-400/40">
                <Trophy size={14} />
                <span>Progress Borneo Edu</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Progress & Rekap Hasil Borneo Edu
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Halo, <strong>{teacherName}</strong>. Pantau keterlibatan belajar, capaian level petualangan, akurasi soal kurikulum, dan rekapitulasi nilai akhir siswa yang memainkan game Borneo Edu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleExportExcel}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl transition-all active:scale-95 flex items-center gap-2"
            >
              <FileSpreadsheet size={18} />
              <span>Unduh Excel (.xlsx)</span>
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm border border-slate-700 flex items-center gap-2 transition-colors"
              title="Perbarui Data"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Siswa */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Siswa Memainkan</span>
            <span className="text-2xl font-black text-slate-800">{stats.total} Orang</span>
          </div>
        </div>

        {/* Rata-rata Nilai */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Trophy size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Rata-rata Nilai</span>
            <span className="text-2xl font-black text-amber-600">{stats.avgScore} <span className="text-xs text-slate-400">/ 100</span></span>
          </div>
        </div>

        {/* Akurasi Jawaban */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Rata-rata Akurasi</span>
            <span className="text-2xl font-black text-emerald-600">{stats.avgAccuracy}%</span>
          </div>
        </div>

        {/* Ketuntasan KKM */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Tuntas KKM (&ge;75)</span>
            <span className="text-2xl font-black text-purple-700">{stats.passRate}% <span className="text-xs font-bold text-slate-400">({stats.passedCount} siswa)</span></span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('rekap')}
          className={`px-5 py-3 font-bold text-sm border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'rekap'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award size={16} />
          <span>Rekap Hasil & Peringkat Siswa ({filteredRows.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('bank_soal')}
          className={`px-5 py-3 font-bold text-sm border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'bank_soal'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HelpCircle size={16} />
          <span>Bank Soal Game ({questions.length} Soal)</span>
        </button>
        <button
          onClick={() => setActiveTab('pengaturan')}
          className={`px-5 py-3 font-bold text-sm border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'pengaturan'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders size={16} />
          <span>Bobot Penilaian & Timer</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: REKAP HASIL SISWA */}
      {/* ===================================================================== */}
      {activeTab === 'rekap' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama atau absen siswa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter size={16} className="text-slate-400" />
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Semua Kelas</option>
                  {availableClasses.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-bold self-end sm:self-center">
              Menampilkan {filteredRows.length} dari {records.length} siswa
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            {filteredRows.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <div className="text-4xl mb-3">🎮</div>
                <h3 className="text-base font-bold text-slate-700">Belum Ada Data Siswa</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Siswa yang masuk dan memainkan Game Borneo Edu akan otomatis tercatat hasil permainannya di sini secara real-time.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-[11px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-200">
                      <th className="py-4 px-4 text-center">Rank</th>
                      <th className="py-4 px-4">Nama Siswa</th>
                      <th className="py-4 px-3">Kelas & Absen</th>
                      <th className="py-4 px-3">Progres Level</th>
                      <th className="py-4 px-3">Koin & Skor Game</th>
                      <th className="py-4 px-3">Akurasi Soal</th>
                      <th className="py-4 px-3 text-center">Nilai Akhir</th>
                      <th className="py-4 px-3 text-center">Status</th>
                      <th className="py-4 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {filteredRows.map((row, idx) => {
                      const orig = records.find(
                        (r) => r.studentName === row.studentName && r.studentNumber === row.studentNumber
                      );
                      const isPassed = row.finalScore >= 75;

                      return (
                        <tr key={`${row.studentName}-${row.studentNumber}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 text-center font-black">
                            {idx === 0 ? (
                              <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 inline-flex items-center justify-center font-bold">🥇</span>
                            ) : idx === 1 ? (
                              <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 inline-flex items-center justify-center font-bold">🥈</span>
                            ) : idx === 2 ? (
                              <span className="w-7 h-7 rounded-full bg-amber-200 text-amber-800 inline-flex items-center justify-center font-bold">🥉</span>
                            ) : (
                              <span className="text-slate-400 font-bold">#{idx + 1}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{row.studentName}</div>
                            <div className="text-[11px] text-slate-400 font-medium">{row.badgeText}</div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">
                              {row.className}
                            </span>
                            <div className="text-[11px] text-slate-400 mt-0.5">Absen: {row.studentNumber}</div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="font-black text-emerald-700">Level {row.completedLevelsCount} / 25</span>
                            <div className="text-[11px] text-slate-400">World {row.completedWorlds} Selesai</div>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="font-bold text-amber-600 flex items-center gap-1">
                              <span>🪙</span>
                              <span>{row.totalCoins}</span>
                            </div>
                            <div className="text-[11px] text-slate-400">Skor: {row.totalScore}</div>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    row.accuracy >= 80 ? 'bg-emerald-500' : row.accuracy >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${row.accuracy}%` }}
                                />
                              </div>
                              <span className="font-black text-slate-700">{row.accuracy}%</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {row.correctCount} benar / {row.totalQuestions} soal
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span className="text-base font-black text-slate-900">
                              {row.finalScore}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-bold">Skala 100</span>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-black inline-flex items-center gap-1 ${
                                isPassed
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {isPassed ? '✓ TUNTAS' : '✗ REMEDIAL'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => setSelectedStudentDetail(orig || null)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-xs transition-colors flex items-center gap-1 mx-auto"
                            >
                              <Eye size={14} />
                              <span>Detail</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: BANK SOAL */}
      {/* ===================================================================== */}
      {activeTab === 'bank_soal' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-800">
                Bank Soal Kurikulum Game Borneo Edu
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Total {questions.length} butir soal terintegrasi dalam Question Block dan Musuh Patroli di 5 World petualangan.
              </p>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              Materi Informatika & Sains
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questions.slice(0, 10).map((q) => (
              <div key={q.questionId} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black">
                    {q.questionId} • World {q.world} Level {q.level}
                  </span>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                    {q.difficulty}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 leading-relaxed">
                  {q.question}
                </p>
                <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                  {(['A', 'B', 'C', 'D'] as const).map((k) => (
                    <div
                      key={k}
                      className={`px-2 py-1 rounded-lg border ${
                        q.correctAnswer === k
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <strong>{k}:</strong> {q.options[k]}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {questions.length > 10 && (
            <p className="text-center text-xs text-slate-400 font-bold pt-2">
              Dan {questions.length - 10} soal lainnya tersimpan dalam bank soal aktif.
            </p>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: PENGATURAN BOBOT NILAI & KKM */}
      {/* ===================================================================== */}
      {activeTab === 'pengaturan' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 max-w-2xl space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-800">
              Pengaturan Bobot Penilaian Game
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Rumus nilai akhir otomatis: (Bobot Akurasi &times; % Akurasi) + (Bobot Level &times; % Level) + (Bobot Boss &times; % Boss).
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-black text-slate-700 block mb-1">
                Bobot Akurasi Jawaban ({config.weightAccuracy}%)
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={config.weightAccuracy}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const updated = { ...config, weightAccuracy: val };
                  setConfig(updated);
                  saveTeacherConfigToLocal(updated);
                }}
                className="w-full accent-emerald-600"
              />
            </div>

            <div>
              <label className="text-xs font-black text-slate-700 block mb-1">
                Bobot Level Selesai ({config.weightLevel}%)
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={config.weightLevel}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const updated = { ...config, weightLevel: val };
                  setConfig(updated);
                  saveTeacherConfigToLocal(updated);
                }}
                className="w-full accent-emerald-600"
              />
            </div>

            <div>
              <label className="text-xs font-black text-slate-700 block mb-1">
                Bobot Boss Battle ({config.weightBoss}%)
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={config.weightBoss}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const updated = { ...config, weightBoss: val };
                  setConfig(updated);
                  saveTeacherConfigToLocal(updated);
                }}
                className="w-full accent-emerald-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* STUDENT DETAIL MODAL */}
      {/* ===================================================================== */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-black">
                  🎓
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {selectedStudentDetail.studentName}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Kelas: {selectedStudentDetail.className} • Absen: {selectedStudentDetail.studentNumber}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                <span className="text-[10px] text-slate-400 font-bold block">Level Tercapai</span>
                <span className="text-base font-black text-emerald-600">
                  W{selectedStudentDetail.currentWorld} L{selectedStudentDetail.currentLevel}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                <span className="text-[10px] text-slate-400 font-bold block">Total Koin</span>
                <span className="text-base font-black text-amber-500">
                  🪙 {selectedStudentDetail.coins}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                <span className="text-[10px] text-slate-400 font-bold block">Akurasi Soal</span>
                <span className="text-base font-black text-slate-800">
                  {selectedStudentDetail.correctCount + selectedStudentDetail.wrongCount > 0
                    ? Math.round(
                        (selectedStudentDetail.correctCount /
                          (selectedStudentDetail.correctCount + selectedStudentDetail.wrongCount)) *
                          100
                      )
                    : 0}%
                </span>
              </div>
            </div>

            {/* Answer History */}
            <div>
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Riwayat Jawaban Soal ({selectedStudentDetail.questionHistory?.length || 0} Soal Dijawab)
              </h4>

              {(!selectedStudentDetail.questionHistory || selectedStudentDetail.questionHistory.length === 0) ? (
                <p className="text-xs text-slate-400 italic p-4 text-center bg-slate-50 rounded-xl">
                  Belum ada rekaman soal terperinci untuk sesi ini.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedStudentDetail.questionHistory.map((h, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                        h.isCorrect
                          ? 'bg-emerald-50/60 border-emerald-200 text-slate-800'
                          : 'bg-red-50/60 border-red-200 text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <span>{h.isCorrect ? '✅' : '❌'}</span>
                          <span>{h.questionText || `Soal ${h.questionId}`}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Jawaban Siswa: <strong>{h.chosenOption}</strong> • Kunci: <strong>{h.correctAnswer}</strong> • Waktu: {h.timeSpentSeconds}s
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-right pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-slate-800 transition-colors"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
