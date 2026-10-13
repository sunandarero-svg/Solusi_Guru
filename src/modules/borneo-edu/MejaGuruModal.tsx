"use client";

import React, { useState, useEffect } from 'react';
import * as xlsx from 'xlsx';
import { PlayerState, TeacherConfig, QuestionItem, RecapStudentRow } from './types';
import {
  DEFAULT_TEACHER_CONFIG,
  calculateFinalScore,
  formatToRecapRow,
  getLocalRecords,
  getStoredQuestions,
  saveStoredQuestions,
  saveTeacherConfigToLocal,
  exportAllDataJson,
  importAllDataJson,
  resetSystemData
} from './storage';
import { DEFAULT_QUESTIONS } from './defaultQuestions';

interface MejaGuruModalProps {
  teacherConfig: TeacherConfig;
  onUpdateConfig: (cfg: TeacherConfig) => void;
  onClose: () => void;
  userRole?: string;
}

export default function MejaGuruModal({
  teacherConfig,
  onUpdateConfig,
  onClose,
  userRole
}: MejaGuruModalProps) {
  // Authentication PIN state
  const isAutoAuthorized = userRole === 'TEACHER' || userRole === 'ADMIN';
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(isAutoAuthorized);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // Tabs
  const [activeTab, setActiveTab] = useState<'rekap' | 'bank_soal' | 'pengaturan' | 'backup'>('rekap');

  // Rekap Data
  const [records, setRecords] = useState<PlayerState[]>([]);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<PlayerState | null>(null);

  // Bank Soal Data
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [filterWorld, setFilterWorld] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [searchQuestion, setSearchQuestion] = useState<string>('');
  const [selectedQIds, setSelectedQIds] = useState<string[]>([]);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);

  // New Question Form state
  const [newQuestionForm, setNewQuestionForm] = useState<QuestionItem>({
    questionId: `Q${String(Math.floor(Math.random() * 900) + 100)}`,
    world: 1,
    level: 1,
    question: '',
    options: { A: '', B: '', C: '', D: '' },
    correctAnswer: 'A',
    difficulty: 'EASY',
    explanation: '',
    stage: 'Pengetahuan'
  });

  // Settings State Form
  const [settingsForm, setSettingsForm] = useState<TeacherConfig>({ ...teacherConfig });
  const [settingsMessage, setSettingsMessage] = useState<string>('');

  // Reset PIN confirmation
  const [resetPinInput, setResetPinInput] = useState<string>('');
  const [resetError, setResetError] = useState<string>('');
  const [resetSuccess, setResetSuccess] = useState<string>('');

  // Load records & questions
  useEffect(() => {
    // 1. Fetch from LocalStorage and sync with API
    const localRecs = getLocalRecords();
    setRecords(localRecs);

    const localQuestions = getStoredQuestions();
    setQuestions(localQuestions);

    // Try fetching from API
    fetch('/api/borneo-edu/results')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          // Merge API results with local
          setRecords(data.data);
        }
      })
      .catch((err) => console.log('Offline/Local mode active for results'));

    fetch('/api/borneo-edu/questions')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setQuestions(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === teacherConfig.teacherPin) {
      setIsAuthenticated(true);
      setPinError('');
    } else {
      setPinError('Kode PIN salah. Default: guru123');
    }
  };

  // Filtered Rekap rows
  const filteredRecords = records.filter((r) => {
    const matchClass = filterClass === 'all' || r.className === filterClass;
    const matchSubject = filterSubject === 'all' || r.subject === filterSubject;
    const matchSearch =
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchSubject && matchSearch;
  });

  // Export Rekap Nilai to Excel (.xlsx)
  const handleDownloadRecapExcel = (onlyFiltered: boolean = false) => {
    const sourceData = onlyFiltered ? filteredRecords : records;
    if (sourceData.length === 0) {
      alert('Tidak ada data siswa untuk diunduh.');
      return;
    }

    const rows = sourceData.map((rec, index) => {
      const f = formatToRecapRow(rec, teacherConfig);
      return {
        'No': index + 1,
        'Nama Siswa': f.studentName,
        'Nomor Absen': f.studentNumber,
        'Kelas': f.className,
        'Mata Pelajaran': f.subject,
        'Materi': f.materi,
        'Level Tertinggi': f.highestLevel,
        'World Selesai': f.completedWorlds,
        'Total Skor': f.totalScore,
        'Total Koin': f.totalCoins,
        'Jawaban Benar': f.correctCount,
        'Jawaban Salah': f.wrongCount,
        'Total Soal': f.totalQuestions,
        'Akurasi (%)': `${f.accuracy}%`,
        'Combo Tertinggi': f.highestCombo,
        'Boss Dikalahkan': `${f.bossesDefeated} / 5`,
        'Badge': f.badgeText,
        'Nilai Akhir (0-100)': f.finalScore,
        'Status Permainan': f.gameStatus,
        'Tanggal dan Waktu': f.updatedAt
      };
    });

    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Rekap Nilai Borneo Edu');

    const fileName = `Rekap_Nilai_Borneo_Edu_${new Date().toISOString().slice(0, 10)}.xlsx`;
    xlsx.writeFile(workbook, fileName);
  };

  // Export Bank Soal to Excel
  const handleDownloadQuestionsExcel = (selectedOnly: boolean = false) => {
    const listToExport = selectedOnly
      ? questions.filter((q) => selectedQIds.includes(q.questionId))
      : questions;

    if (listToExport.length === 0) {
      alert('Tidak ada soal untuk diunduh.');
      return;
    }

    const rows = listToExport.map((q) => ({
      'ID Soal': q.questionId,
      'World': q.world,
      'Level': q.level,
      'Pertanyaan': q.question,
      'Pilihan A': q.options.A,
      'Pilihan B': q.options.B,
      'Pilihan C': q.options.C,
      'Pilihan D': q.options.D,
      'Kunci Jawaban': q.correctAnswer,
      'Tingkat Kesulitan': q.difficulty,
      'Tahap Materi': q.stage || 'Pengetahuan',
      'Soal Boss': q.isBossQuestion ? 'YA' : 'TIDAK',
      'Pembahasan Singkat': q.explanation
    }));

    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Bank Soal Borneo Edu');
    xlsx.writeFile(
      workbook,
      selectedOnly
        ? `Bank_Soal_Terpilih_${listToExport.length}_Soal.xlsx`
        : `Bank_Soal_Borneo_Edu_${questions.length}_Soal.xlsx`
    );
  };

  // Download Bank Soal Template
  const handleDownloadTemplate = () => {
    const templateRows = [
      {
        'ID Soal': 'Q101',
        'World': 1,
        'Level': 1,
        'Pertanyaan': 'Perangkat keras komputer yang berfungsi menampilkan output visual kepada pengguna adalah...',
        'Pilihan A': 'Monitor',
        'Pilihan B': 'Keyboard',
        'Pilihan C': 'Mouse',
        'Pilihan D': 'Scanner',
        'Kunci Jawaban': 'A',
        'Tingkat Kesulitan': 'EASY',
        'Tahap Materi': 'Pengetahuan',
        'Soal Boss': 'TIDAK',
        'Pembahasan Singkat': 'Monitor merupakan perangkat keluaran visual (display).'
      },
      {
        'ID Soal': 'Q102',
        'World': 1,
        'Level': 2,
        'Pertanyaan': 'Manakah di bawah ini yang merupakan contoh bahasa pemrograman tingkat tinggi?',
        'Pilihan A': 'Python',
        'Pilihan B': 'Assembly',
        'Pilihan C': 'Machine Code',
        'Pilihan D': 'Binary Code',
        'Kunci Jawaban': 'A',
        'Tingkat Kesulitan': 'MEDIUM',
        'Tahap Materi': 'Pemahaman',
        'Soal Boss': 'TIDAK',
        'Pembahasan Singkat': 'Python adalah bahasa pemrograman tingkat tinggi yang mudah dipahami manusia.'
      },
      {
        'ID Soal': 'Q105_BOSS',
        'World': 1,
        'Level': 5,
        'Pertanyaan': 'Tantangan Raja Hutan: Mengapa algoritma Binary Search lebih efisien daripada Linear Search?',
        'Pilihan A': 'Membagi ruang pencarian menjadi separuh pada tiap langkah',
        'Pilihan B': 'Memeriksa setiap elemen satu per satu secara berurutan',
        'Pilihan C': 'Dapat beroperasi pada data acak tanpa sorting',
        'Pilihan D': 'Menggunakan memori lebih kecil',
        'Kunci Jawaban': 'A',
        'Tingkat Kesulitan': 'BOSS',
        'Tahap Materi': 'Analisis',
        'Soal Boss': 'YA',
        'Pembahasan Singkat': 'Binary search bekerja dengan divide and conquer pada data terurut berorde O(log n).'
      }
    ];
    const worksheet = xlsx.utils.json_to_sheet(templateRows);
    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 8 },
      { wch: 8 },
      { wch: 45 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 14 },
      { wch: 18 },
      { wch: 16 },
      { wch: 12 },
      { wch: 45 }
    ];
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Template Bank Soal');
    xlsx.writeFile(workbook, 'Template_Upload_Bank_Soal_Borneo_Edu.xlsx');
  };

  // Upload Bank Soal Excel/CSV (Bulk Upload)
  const handleUploadQuestions = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = xlsx.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const parsedRows: any[] = xlsx.utils.sheet_to_json(ws);

        if (!parsedRows || parsedRows.length === 0) {
          alert('File Excel kosong atau tidak memiliki baris data.');
          return;
        }

        const validQuestions: QuestionItem[] = [];
        const timestamp = Date.now();

        parsedRows.forEach((r, idx) => {
          const qText = String(r['Pertanyaan'] || r['pertanyaan'] || r['Question'] || '').trim();
          const optA = String(r['Pilihan A'] || r['Opsi A'] || r['A'] || '').trim();
          const optB = String(r['Pilihan B'] || r['Opsi B'] || r['B'] || '').trim();
          const optC = String(r['Pilihan C'] || r['Opsi C'] || r['C'] || '').trim();
          const optD = String(r['Pilihan D'] || r['Opsi D'] || r['D'] || '').trim();
          let key = String(r['Kunci Jawaban'] || r['Kunci'] || r['Jawaban'] || 'A').trim().toUpperCase();
          if (!['A', 'B', 'C', 'D'].includes(key)) key = 'A';

          if (qText && optA && optB) {
            const worldVal = Math.min(5, Math.max(1, Number(r['World'] || r['world']) || 1));
            const levelVal = Math.min(25, Math.max(1, Number(r['Level'] || r['level']) || 1));
            let diffVal = String(r['Tingkat Kesulitan'] || r['Kesulitan'] || 'MEDIUM').toUpperCase().trim();
            if (!['EASY', 'MEDIUM', 'HARD', 'HOTS', 'BOSS'].includes(diffVal)) {
              diffVal = 'MEDIUM';
            }
            const bossRaw = String(r['Soal Boss'] || r['isBoss'] || '').toUpperCase().trim();
            const isBoss = bossRaw === 'YA' || bossRaw === 'TRUE' || bossRaw === '1' || diffVal === 'BOSS';
            const qId = String(r['ID Soal'] || r['id'] || `Q_${worldVal}_${levelVal}_${timestamp}_${idx + 1}`).trim();

            validQuestions.push({
              questionId: qId,
              world: worldVal,
              level: levelVal,
              question: qText,
              options: {
                A: optA,
                B: optB,
                C: optC || '-',
                D: optD || '-'
              },
              correctAnswer: key as 'A' | 'B' | 'C' | 'D',
              difficulty: diffVal as any,
              stage: (r['Tahap Materi'] || 'Pengetahuan') as any,
              isBossQuestion: isBoss,
              explanation: String(r['Pembahasan Singkat'] || r['Pembahasan'] || `Kunci jawaban adalah opsi ${key}`).trim()
            });
          }
        });

        if (validQuestions.length > 0) {
          const map = new Map<string, QuestionItem>();
          questions.forEach((q) => map.set(q.questionId, q));
          validQuestions.forEach((q) => map.set(q.questionId, q));
          const combined = Array.from(map.values());

          setQuestions(combined);
          saveStoredQuestions(combined);

          // Sync to Database
          await fetch('/api/borneo-edu/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validQuestions)
          });

          alert(`Berhasil mengunggah ${validQuestions.length} soal secara massal ke Bank Soal!`);
        } else {
          alert('Tidak ditemukan baris soal yang valid dalam berkas.');
        }
      } catch (err: any) {
        alert('Gagal membaca file: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // Delete Single Question
  const handleDeleteSingleQuestion = async (id: string) => {
    if (!confirm(`Hapus soal "${id}"?`)) return;
    const updated = questions.filter((q) => q.questionId !== id);
    setQuestions(updated);
    setSelectedQIds((prev) => prev.filter((item) => item !== id));
    saveStoredQuestions(updated);
    try {
      await fetch(`/api/borneo-edu/questions?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Bulk Delete Questions
  const handleBulkDeleteQuestions = async () => {
    if (selectedQIds.length === 0) return;
    if (!confirm(`Yakin ingin menghapus ${selectedQIds.length} soal terpilih secara massal?`)) return;

    const idsToDelete = [...selectedQIds];
    const updated = questions.filter((q) => !idsToDelete.includes(q.questionId));
    setQuestions(updated);
    setSelectedQIds([]);
    saveStoredQuestions(updated);

    try {
      await fetch('/api/borneo-edu/questions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds: idsToDelete })
      });
      alert(`Berhasil menghapus ${idsToDelete.length} soal terpilih.`);
    } catch (e) {
      console.error(e);
    }
  };

  // Save Edit Question
  const handleSaveEditQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    const updated = questions.map((q) =>
      q.questionId === editingQuestion.questionId ? editingQuestion : q
    );
    setQuestions(updated);
    saveStoredQuestions(updated);

    try {
      await fetch('/api/borneo-edu/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingQuestion)
      });
    } catch (e) {
      console.error(e);
    }

    setEditingQuestion(null);
    alert('Perubahan soal berhasil disimpan!');
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const totalWeights = settingsForm.weightAccuracy + settingsForm.weightLevel + settingsForm.weightBoss;
    if (totalWeights !== 100) {
      setSettingsMessage(`Error: Total bobot penilaian harus tepat 100% (Saat ini: ${totalWeights}%)`);
      return;
    }

    onUpdateConfig(settingsForm);
    saveTeacherConfigToLocal(settingsForm);

    fetch('/api/borneo-edu/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsForm)
    }).catch(() => {});

    setSettingsMessage('Pengaturan Meja Guru berhasil disimpan!');
    setTimeout(() => setSettingsMessage(''), 4000);
  };

  // Add question to Bank
  const handleSaveNewQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionForm.question) {
      alert('Pertanyaan wajib diisi.');
      return;
    }

    const updated = [newQuestionForm, ...questions];
    setQuestions(updated);
    saveStoredQuestions(updated);
    setShowAddQuestionModal(false);

    try {
      await fetch('/api/borneo-edu/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestionForm)
      });
    } catch (e) {
      console.error(e);
    }

    alert('Soal baru berhasil ditambahkan dan disimpan!');
    setNewQuestionForm({
      questionId: `Q${String(Math.floor(Math.random() * 900) + 100)}`,
      world: 1,
      level: 1,
      question: '',
      options: { A: '', B: '', C: '', D: '' },
      correctAnswer: 'A',
      difficulty: 'EASY',
      explanation: '',
      stage: 'Pengetahuan'
    });
  };

  // Reset Data
  const handleResetData = () => {
    if (resetPinInput !== teacherConfig.teacherPin) {
      setResetError('PIN Guru salah.');
      return;
    }

    const confirmed = confirm('PERINGATAN: Anda yakin ingin menghapus SELURUH data rekap siswa?');
    if (!confirmed) return;

    resetSystemData(resetPinInput);
    setRecords([]);
    setResetSuccess('Seluruh data rekap hasil siswa berhasil direset.');
    setResetPinInput('');
    setResetError('');

    fetch('/api/borneo-edu/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherPin: resetPinInput })
    }).catch(() => {});
  };

  // If not authenticated, show PIN modal
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/50 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-center text-white">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-3xl flex items-center justify-center mx-auto mb-4">
            👨‍🏫
          </div>
          <h2 className="text-xl font-black text-emerald-400 uppercase tracking-wide">
            AKSES KHUSUS GURU
          </h2>
          <p className="text-xs text-slate-300 mt-1 mb-6">
            Masukkan PIN Keamanan Meja Guru untuk mengakses rekap nilai, bank soal, dan pengaturan.
          </p>

          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Masukkan PIN (Default: guru123)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-center text-base font-bold focus:outline-none focus:border-emerald-500 tracking-widest placeholder:text-slate-500 placeholder:text-xs placeholder:tracking-normal"
                autoFocus
              />
              {pinError && <p className="text-xs text-red-400 font-bold mt-2">{pinError}</p>}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg transition-transform active:scale-95"
              >
                Masuk Meja Guru ▶
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Filtered Questions
  const filteredQuestions = questions.filter((q) => {
    const matchW = filterWorld === 'all' || String(q.world) === filterWorld;
    const matchDiff = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    const matchSearch =
      q.question.toLowerCase().includes(searchQuestion.toLowerCase()) ||
      q.questionId.toLowerCase().includes(searchQuestion.toLowerCase());
    return matchW && matchDiff && matchSearch;
  });

  const isAllFilteredSelected =
    filteredQuestions.length > 0 &&
    filteredQuestions.every((q) => selectedQIds.includes(q.questionId));

  const handleToggleSelect = (id: string) => {
    setSelectedQIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredQuestions.map((q) => q.questionId);
    if (isAllFilteredSelected) {
      setSelectedQIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedQIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-700 rounded-3xl max-w-6xl w-full p-4 sm:p-8 shadow-2xl relative text-white my-6 max-h-[92vh] flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/40">
              👨‍🏫
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-emerald-400 flex items-center gap-2">
                <span>MEJA GURU</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                  Panel Pengajar
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pusat monitoring leaderboard, rekap nilai siswa, kurikulum bank soal, dan konfigurasi game
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-sm font-bold border border-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 pt-4 pb-4 border-b border-slate-800/80 shrink-0">
          <button
            onClick={() => setActiveTab('rekap')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
              activeTab === 'rekap'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <span>📊</span>
            <span>Rekap Nilai & Leaderboard</span>
          </button>

          <button
            onClick={() => setActiveTab('bank_soal')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
              activeTab === 'bank_soal'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <span>📚</span>
            <span>Bank Soal ({questions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pengaturan')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
              activeTab === 'pengaturan'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <span>⚙️</span>
            <span>Pengaturan Guru</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
              activeTab === 'backup'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <span>💾</span>
            <span>Cadangan & Reset</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* TAB 1: REKAP NILAI & LEADERBOARD */}
          {activeTab === 'rekap' && (
            <div className="space-y-4">
              {/* Formula Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-500/30">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider block mb-1">
                  📐 FORMULA PERHITUNGAN NILAI AKHIR SISWA
                </span>
                <p className="text-xs sm:text-sm font-mono font-bold text-amber-300">
                  NILAI AKHIR = ({teacherConfig.weightAccuracy / 100} × Akurasi) + ({teacherConfig.weightLevel / 100} × % Level Selesai) + ({teacherConfig.weightBoss / 100} × % Boss Dikalahkan)
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Persentase Level Selesai = (Level Selesai / 25 × 100) • Persentase Boss Dikalahkan = (Boss Dikalahkan / 5 × 100). Dibulatkan ke bilangan bulat terdekat.
                </p>
              </div>

              {/* Filters & Download Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Cari nama / nomor absen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 w-48"
                  />
                  <select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  >
                    <option value="all" className="bg-slate-900 text-white">Semua Kelas</option>
                    <option value="Kelas 7A" className="bg-slate-900 text-white">Kelas 7A</option>
                    <option value="Kelas 7B" className="bg-slate-900 text-white">Kelas 7B</option>
                    <option value="Kelas 8" className="bg-slate-900 text-white">Kelas 8</option>
                    <option value="Kelas 9" className="bg-slate-900 text-white">Kelas 9</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadRecapExcel(false)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
                  >
                    <span>📥</span>
                    <span>UNDUH REKAP NILAI (EXCEL)</span>
                  </button>
                  {filteredRecords.length !== records.length && (
                    <button
                      onClick={() => handleDownloadRecapExcel(true)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-bold border border-slate-700"
                    >
                      Unduh Difilter ({filteredRecords.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Rekap Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-[10px] uppercase font-black tracking-wider text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="p-3">No</th>
                      <th className="p-3">Nama Siswa</th>
                      <th className="p-3">Absen</th>
                      <th className="p-3">Kelas</th>
                      <th className="p-3">Level</th>
                      <th className="p-3">Skor</th>
                      <th className="p-3">Koin</th>
                      <th className="p-3">Akurasi</th>
                      <th className="p-3">Combo</th>
                      <th className="p-3">Boss</th>
                      <th className="p-3">Badge</th>
                      <th className="p-3 font-bold text-amber-300">Nilai Akhir</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={14} className="p-8 text-center text-slate-500">
                          Belum ada data progres siswa yang tersimpan. Siswa yang bermain Borneo Edu akan otomatis muncul di sini!
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((rec, idx) => {
                        const row = formatToRecapRow(rec, teacherConfig);
                        return (
                          <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 font-bold text-slate-400">{idx + 1}</td>
                            <td className="p-3 font-bold text-white whitespace-nowrap">{row.studentName}</td>
                            <td className="p-3">{row.studentNumber}</td>
                            <td className="p-3">{row.className}</td>
                            <td className="p-3 font-bold text-emerald-400">{row.highestLevel} / 25</td>
                            <td className="p-3 font-bold text-yellow-400">{row.totalScore}</td>
                            <td className="p-3 text-amber-400">{row.totalCoins}</td>
                            <td className="p-3 font-semibold text-teal-300">{row.accuracy}%</td>
                            <td className="p-3">{row.highestCombo}x</td>
                            <td className="p-3">{row.bossesDefeated} / 5</td>
                            <td className="p-3 font-bold text-amber-300 text-[11px] whitespace-nowrap">{row.badgeText}</td>
                            <td className="p-3">
                              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-black border border-emerald-500/40">
                                {row.finalScore}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                                {row.gameStatus}
                              </span>
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => setSelectedStudentDetail(rec)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[10px] font-bold border border-indigo-500/40"
                              >
                                Detail 🔍
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

          {/* TAB 2: BANK SOAL */}
          {activeTab === 'bank_soal' && (
            <div className="space-y-4">
              {/* Header Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Cari isi pertanyaan..."
                    value={searchQuestion}
                    onChange={(e) => setSearchQuestion(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 w-44"
                  />
                  <select
                    value={filterWorld}
                    onChange={(e) => setFilterWorld(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  >
                    <option value="all" className="bg-slate-900 text-white">Semua World</option>
                    <option value="1" className="bg-slate-900 text-white">World 1 (Hutan)</option>
                    <option value="2" className="bg-slate-900 text-white">World 2 (Gunung)</option>
                    <option value="3" className="bg-slate-900 text-white">World 3 (Laut)</option>
                    <option value="4" className="bg-slate-900 text-white">World 4 (Gurun)</option>
                    <option value="5" className="bg-slate-900 text-white">World 5 (Kastel)</option>
                  </select>
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  >
                    <option value="all" className="bg-slate-900 text-white">Semua Kesulitan</option>
                    <option value="EASY" className="bg-slate-900 text-white">EASY</option>
                    <option value="MEDIUM" className="bg-slate-900 text-white">MEDIUM</option>
                    <option value="HARD" className="bg-slate-900 text-white">HARD</option>
                    <option value="HOTS" className="bg-slate-900 text-white">HOTS</option>
                    <option value="BOSS" className="bg-slate-900 text-white">BOSS</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowAddQuestionModal(true)}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                  >
                    + Tambah Soal
                  </button>
                  <button
                    onClick={handleDownloadTemplate}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700"
                  >
                    Template Excel
                  </button>
                  <label className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 cursor-pointer">
                    Unggah Excel
                    <input type="file" accept=".xlsx,.csv" onChange={handleUploadQuestions} className="hidden" />
                  </label>
                  <button
                    onClick={() => handleDownloadQuestionsExcel()}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                  >
                    Unduh Bank Soal ({questions.length})
                  </button>
                </div>
              </div>

              {/* Bulk Actions Bar */}
              {selectedQIds.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-indigo-950/80 border border-indigo-500/50 rounded-2xl animate-in fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{selectedQIds.length} soal dipilih (Centang)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBulkDeleteQuestions}
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                    >
                      <span>🗑️</span>
                      <span>Hapus Massal ({selectedQIds.length})</span>
                    </button>
                    <button
                      onClick={() => handleDownloadQuestionsExcel(true)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                    >
                      <span>📥</span>
                      <span>Unduh Terpilih ({selectedQIds.length})</span>
                    </button>
                    <button
                      onClick={() => setSelectedQIds([])}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {/* Questions List Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 max-h-[55vh]">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800 text-[10px] uppercase font-black text-slate-400 sticky top-0 border-b border-slate-700">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isAllFilteredSelected}
                          onChange={handleSelectAllFiltered}
                          className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                          title="Pilih Semua yang Ditampilkan"
                        />
                      </th>
                      <th className="p-3">ID</th>
                      <th className="p-3">W / Lvl</th>
                      <th className="p-3">Kesulitan</th>
                      <th className="p-3">Pertanyaan</th>
                      <th className="p-3">Kunci</th>
                      <th className="p-3">Pembahasan</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredQuestions.map((q) => (
                      <tr key={q.questionId} className={`hover:bg-slate-800/40 ${selectedQIds.includes(q.questionId) ? 'bg-indigo-950/20' : ''}`}>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedQIds.includes(q.questionId)}
                            onChange={() => handleToggleSelect(q.questionId)}
                            className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-bold text-emerald-400 whitespace-nowrap">{q.questionId}</td>
                        <td className="p-3 whitespace-nowrap">W{q.world} • L{q.level}</td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            q.difficulty === 'BOSS' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                            q.difficulty === 'HOTS' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                            q.difficulty === 'HARD' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {q.difficulty}
                          </span>
                        </td>
                        <td className="p-3 max-w-md font-medium text-slate-200">
                          {q.question}
                          <div className="text-[11px] text-slate-400 mt-1 grid grid-cols-2 gap-1">
                            <span>A: {q.options.A}</span>
                            <span>B: {q.options.B}</span>
                            <span>C: {q.options.C}</span>
                            <span>D: {q.options.D}</span>
                          </div>
                        </td>
                        <td className="p-3 font-black text-emerald-400">{q.correctAnswer}</td>
                        <td className="p-3 text-[11px] text-slate-400 max-w-xs">{q.explanation}</td>
                        <td className="p-3 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setEditingQuestion(q)}
                              className="px-2 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-bold border border-indigo-500/40"
                              title="Edit Soal"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteSingleQuestion(q.questionId)}
                              className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold border border-red-500/40"
                              title="Hapus Soal"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PENGATURAN GURU */}
          {activeTab === 'pengaturan' && (
            <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl">
              {settingsMessage && (
                <div className={`p-3 rounded-xl text-xs font-bold ${
                  settingsMessage.includes('Error') ? 'bg-red-950 text-red-300 border border-red-500' : 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                }`}>
                  {settingsMessage}
                </div>
              )}

              {/* Scoring Weights */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h3 className="text-sm font-black text-amber-400 uppercase tracking-wide">
                  Bobot Penilaian Nilai Akhir (Total Harus 100%)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Bobot Akurasi (%)</label>
                    <input
                      type="number"
                      value={settingsForm.weightAccuracy}
                      onChange={(e) => setSettingsForm({ ...settingsForm, weightAccuracy: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Bobot Level Selesai (%)</label>
                    <input
                      type="number"
                      value={settingsForm.weightLevel}
                      onChange={(e) => setSettingsForm({ ...settingsForm, weightLevel: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Bobot Boss Dikalahkan (%)</label>
                    <input
                      type="number"
                      value={settingsForm.weightBoss}
                      onChange={(e) => setSettingsForm({ ...settingsForm, weightBoss: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-white"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Total Bobot: <span className="font-bold text-white">{settingsForm.weightAccuracy + settingsForm.weightLevel + settingsForm.weightBoss}%</span> (Standar: 60% Akurasi, 25% Level, 15% Boss).
                </p>
              </div>

              {/* Question Timers */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wide">
                  Durasi Waktu Pertanyaan (Detik)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">EASY (Detik)</label>
                    <input
                      type="number"
                      value={settingsForm.timeEasy}
                      onChange={(e) => setSettingsForm({ ...settingsForm, timeEasy: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">MEDIUM (Detik)</label>
                    <input
                      type="number"
                      value={settingsForm.timeMedium}
                      onChange={(e) => setSettingsForm({ ...settingsForm, timeMedium: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">HARD (Detik)</label>
                    <input
                      type="number"
                      value={settingsForm.timeHard}
                      onChange={(e) => setSettingsForm({ ...settingsForm, timeHard: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">BOSS (Detik)</label>
                    <input
                      type="number"
                      value={settingsForm.timeBoss}
                      onChange={(e) => setSettingsForm({ ...settingsForm, timeBoss: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Badge Criteria */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h3 className="text-sm font-black text-purple-400 uppercase tracking-wide">
                  Kriteria Prestasi Badge Siswa
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Silver (Min Poin)</label>
                    <input
                      type="number"
                      value={settingsForm.badgeSilverScore}
                      onChange={(e) => setSettingsForm({ ...settingsForm, badgeSilverScore: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Gold (Min Poin)</label>
                    <input
                      type="number"
                      value={settingsForm.badgeGoldScore}
                      onChange={(e) => setSettingsForm({ ...settingsForm, badgeGoldScore: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Gold (Min Akurasi %)</label>
                    <input
                      type="number"
                      value={settingsForm.badgeGoldAccuracy}
                      onChange={(e) => setSettingsForm({ ...settingsForm, badgeGoldAccuracy: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles & PIN */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Izinkan Mengulang Level</h4>
                    <p className="text-[11px] text-slate-400">Siswa dapat memainkan kembali level yang sudah selesai</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsForm.allowLevelReplay}
                    onChange={(e) => setSettingsForm({ ...settingsForm, allowLevelReplay: e.target.checked })}
                    className="w-5 h-5 accent-emerald-500 rounded"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Ubah PIN Meja Guru</h4>
                    <p className="text-[11px] text-slate-400">Kode PIN rahasia pengajar</p>
                  </div>
                  <input
                    type="text"
                    value={settingsForm.teacherPin}
                    onChange={(e) => setSettingsForm({ ...settingsForm, teacherPin: e.target.value })}
                    className="w-32 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-white text-center"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-md"
                >
                  Simpan Pengaturan Guru 💾
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: CADANGAN & RESET */}
          {activeTab === 'backup' && (
            <div className="space-y-6 max-w-2xl">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wide">
                  Ekspor & Impor Data (JSON)
                </h3>
                <p className="text-xs text-slate-300">
                  Simpan seluruh cadangan bank soal, pengaturan, dan rekap siswa dalam format JSON atau pulihkan ke sistem lain.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => {
                      const json = exportAllDataJson();
                      const blob = new Blob([json], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Borneo_Edu_Backup_${new Date().toISOString().slice(0, 10)}.json`;
                      a.click();
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700"
                  >
                    EKSPOR DATA JSON 📤
                  </button>
                  <label className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 cursor-pointer">
                    IMPOR DATA JSON 📥
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          const content = evt.target?.result as string;
                          if (importAllDataJson(content)) {
                            alert('Data JSON berhasil dipulihkan!');
                            location.reload();
                          } else {
                            alert('Format file JSON tidak sesuai.');
                          }
                        };
                        reader.readAsText(file);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Reset Data Section */}
              <div className="p-5 rounded-2xl bg-red-950/40 border border-red-500/40 space-y-3">
                <h3 className="text-sm font-black text-red-400 uppercase tracking-wide">
                  Reset Data Rekap Pembelajaran Siswa
                </h3>
                <p className="text-xs text-slate-300">
                  Tindakan ini akan menghapus seluruh data siswa dan skor leaderboard di browser/database. Masukkan PIN Guru untuk konfirmasi.
                </p>
                {resetError && <p className="text-xs text-red-400 font-bold">{resetError}</p>}
                {resetSuccess && <p className="text-xs text-emerald-400 font-bold">{resetSuccess}</p>}
                <div className="flex gap-3 pt-2">
                  <input
                    type="password"
                    placeholder="Masukkan PIN Guru"
                    value={resetPinInput}
                    onChange={(e) => setResetPinInput(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-red-900 text-xs text-white"
                  />
                  <button
                    onClick={handleResetData}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-md"
                  >
                    RESET DATA 🗑️
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Student Detail Modal */}
        {selectedStudentDetail && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 text-white max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
                <div>
                  <h3 className="text-base font-black text-emerald-400">
                    Detail Progres: {selectedStudentDetail.studentName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Absen: {selectedStudentDetail.studentNumber} • Kelas: {selectedStudentDetail.className}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStudentDetail(null)}
                  className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Progress Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-800">
                  <span className="text-[10px] text-slate-400 block">Level</span>
                  <span className="font-bold text-white">{selectedStudentDetail.currentLevel} / 25</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800">
                  <span className="text-[10px] text-slate-400 block">Skor</span>
                  <span className="font-bold text-yellow-300">{selectedStudentDetail.score}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800">
                  <span className="text-[10px] text-slate-400 block">Koin</span>
                  <span className="font-bold text-amber-300">{selectedStudentDetail.coins}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800">
                  <span className="text-[10px] text-slate-400 block">Nilai Akhir</span>
                  <span className="font-bold text-emerald-300">
                    {calculateFinalScore(
                      selectedStudentDetail.correctCount + selectedStudentDetail.wrongCount > 0
                        ? Math.round((selectedStudentDetail.correctCount / (selectedStudentDetail.correctCount + selectedStudentDetail.wrongCount)) * 100)
                        : 0,
                      selectedStudentDetail.completedLevels.length,
                      selectedStudentDetail.bossesDefeated,
                      teacherConfig
                    )}
                  </span>
                </div>
              </div>

              {/* Question Attempt History */}
              <h4 className="text-xs font-black text-slate-300 mb-2 uppercase tracking-wider">
                Riwayat Jawaban Soal ({selectedStudentDetail.questionHistory?.length || 0})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {(!selectedStudentDetail.questionHistory || selectedStudentDetail.questionHistory.length === 0) ? (
                  <p className="text-xs text-slate-500 italic">Belum ada riwayat soal tercatat untuk sesi ini.</p>
                ) : (
                  selectedStudentDetail.questionHistory.map((h, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-xl border text-xs ${
                        h.isCorrect ? 'bg-emerald-950/40 border-emerald-800/60' : 'bg-red-950/40 border-red-800/60'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-white">
                          {h.questionId} • W{h.world} L{h.level}
                        </span>
                        <span className={`text-[10px] font-black ${h.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                          {h.isCorrect ? '✓ BENAR' : '✕ SALAH'} ({h.timeSpentSeconds}s)
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px]">{h.questionText}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Question Modal */}
        {showAddQuestionModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 text-white max-h-[88vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
                <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wide">
                  Tambah Soal Baru
                </h3>
                <button onClick={() => setShowAddQuestionModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleSaveNewQuestion} className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">ID Soal</label>
                    <input
                      type="text"
                      value={newQuestionForm.questionId}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, questionId: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">World (1-5)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={newQuestionForm.world}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, world: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Level (1-25)</label>
                    <input
                      type="number"
                      min={1}
                      max={25}
                      value={newQuestionForm.level}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, level: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Isi Pertanyaan</label>
                  <textarea
                    rows={2}
                    value={newQuestionForm.question}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, question: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-0.5">Opsi A</label>
                    <input
                      type="text"
                      value={newQuestionForm.options.A}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, options: { ...newQuestionForm.options, A: e.target.value } })}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-0.5">Opsi B</label>
                    <input
                      type="text"
                      value={newQuestionForm.options.B}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, options: { ...newQuestionForm.options, B: e.target.value } })}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-0.5">Opsi C</label>
                    <input
                      type="text"
                      value={newQuestionForm.options.C}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, options: { ...newQuestionForm.options, C: e.target.value } })}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-0.5">Opsi D</label>
                    <input
                      type="text"
                      value={newQuestionForm.options.D}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, options: { ...newQuestionForm.options, D: e.target.value } })}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Kunci Jawaban</label>
                    <select
                      value={newQuestionForm.correctAnswer}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, correctAnswer: e.target.value as any })}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    >
                      <option value="A" className="bg-slate-900 text-white">A</option>
                      <option value="B" className="bg-slate-900 text-white">B</option>
                      <option value="C" className="bg-slate-900 text-white">C</option>
                      <option value="D" className="bg-slate-900 text-white">D</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Kesulitan</label>
                    <select
                      value={newQuestionForm.difficulty}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, difficulty: e.target.value as any })}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    >
                      <option value="EASY" className="bg-slate-900 text-white">EASY</option>
                      <option value="MEDIUM" className="bg-slate-900 text-white">MEDIUM</option>
                      <option value="HARD" className="bg-slate-900 text-white">HARD</option>
                      <option value="HOTS" className="bg-slate-900 text-white">HOTS</option>
                      <option value="BOSS" className="bg-slate-900 text-white">BOSS</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Pembahasan Singkat</label>
                  <input
                    type="text"
                    value={newQuestionForm.explanation}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, explanation: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddQuestionModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black"
                  >
                    Simpan Soal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Question Modal */}
        {editingQuestion && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-indigo-500/50 rounded-3xl max-w-lg w-full p-6 text-white max-h-[88vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✏️</span>
                  <div>
                    <h3 className="text-sm font-black text-indigo-400 uppercase tracking-wide">
                      Edit Soal: {editingQuestion.questionId}
                    </h3>
                    <p className="text-[11px] text-slate-400">Ubah materi, pilihan opsi, dan kunci jawaban</p>
                  </div>
                </div>
                <button onClick={() => setEditingQuestion(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleSaveEditQuestion} className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">ID Soal</label>
                    <input
                      type="text"
                      value={editingQuestion.questionId}
                      disabled
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-400 cursor-not-allowed font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">World (1-5)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={editingQuestion.world}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, world: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Level (1-25)</label>
                    <input
                      type="number"
                      min={1}
                      max={25}
                      value={editingQuestion.level}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, level: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Isi Pertanyaan</label>
                  <textarea
                    rows={2}
                    value={editingQuestion.question}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-0.5">Opsi A</label>
                    <input
                      type="text"
                      value={editingQuestion.options.A}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, options: { ...editingQuestion.options, A: e.target.value } })}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-0.5">Opsi B</label>
                    <input
                      type="text"
                      value={editingQuestion.options.B}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, options: { ...editingQuestion.options, B: e.target.value } })}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-0.5">Opsi C</label>
                    <input
                      type="text"
                      value={editingQuestion.options.C}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, options: { ...editingQuestion.options, C: e.target.value } })}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-0.5">Opsi D</label>
                    <input
                      type="text"
                      value={editingQuestion.options.D}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, options: { ...editingQuestion.options, D: e.target.value } })}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Kunci Jawaban</label>
                    <select
                      value={editingQuestion.correctAnswer}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value as any })}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Kesulitan</label>
                    <select
                      value={editingQuestion.difficulty}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value as any })}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    >
                      <option value="EASY">EASY</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HARD">HARD</option>
                      <option value="HOTS">HOTS</option>
                      <option value="BOSS">BOSS</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Pembahasan Singkat</label>
                  <input
                    type="text"
                    value={editingQuestion.explanation}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingQuestion(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-md transition-transform active:scale-95"
                  >
                    Simpan Perubahan 💾
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
