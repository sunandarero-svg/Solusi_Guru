"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as xlsx from 'xlsx';
import { PlayerState, TeacherConfig, QuestionItem, RecapStudentRow } from './types';
import {
  DEFAULT_TEACHER_CONFIG,
  calculateFinalScore,
  formatToRecapRow,
  getLocalRecords,
  getStoredQuestions,
  saveStoredQuestions,
  getSavedConfig,
  saveTeacherConfigToLocal
} from './storage';
import dynamic from 'next/dynamic';
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
  AlertCircle,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit3,
  CheckSquare,
  Square,
  Save,
  Layers,
  Settings2,
  X,
  AlertTriangle,
  Loader2,
  Gamepad2
} from 'lucide-react';

const BorneoEduGame = dynamic(
  () => import('./BorneoEduGame'),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-slate-950 rounded-3xl text-white space-y-3">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        <p className="text-sm font-bold text-slate-300">Menyiapkan Game Borneo Edu...</p>
      </div>
    )
  }
);

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

  // Filters for Rekap
  const [filterClass, setFilterClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<PlayerState | null>(null);

  // Filters & State for Bank Soal
  const [qSearch, setQSearch] = useState<string>('');
  const [qWorldFilter, setQWorldFilter] = useState<string>('all');
  const [qLevelFilter, setQLevelFilter] = useState<string>('all');
  const [qDiffFilter, setQDiffFilter] = useState<string>('all');
  const [qBossFilter, setQBossFilter] = useState<string>('all');
  const [qActiveStatusFilter, setQActiveStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Preview & Settings state
  const [showGamePreview, setShowGamePreview] = useState<boolean>(false);
  const [settingsMessage, setSettingsMessage] = useState<string>('');

  // Checkbox Selection for Bank Soal
  const [selectedQIds, setSelectedQIds] = useState<string[]>([]);

  // Modals for Bank Soal
  const [showAddQModal, setShowAddQModal] = useState<boolean>(false);
  const [editingQ, setEditingQ] = useState<QuestionItem | null>(null);
  const [showBulkEditModal, setShowBulkEditModal] = useState<boolean>(false);
  const [bulkWorld, setBulkWorld] = useState<string>('keep');
  const [bulkLevel, setBulkLevel] = useState<string>('keep');
  const [bulkDiff, setBulkDiff] = useState<string>('keep');
  const [bulkIsBoss, setBulkIsBoss] = useState<string>('keep');

  // New Question Form state
  const [newQForm, setNewQForm] = useState<QuestionItem>({
    questionId: `Q_1_1_${Date.now()}`,
    world: 1,
    level: 1,
    question: '',
    options: { A: '', B: '', C: '', D: '' },
    correctAnswer: 'A',
    difficulty: 'EASY',
    stage: 'Pengetahuan',
    isBossQuestion: false,
    explanation: ''
  });

  // Alert & Upload state
  const [qAlertMessage, setQAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

      // 3. Fetch latest teacher config
      const cfgRes = await fetch('/api/borneo-edu/settings');
      const cfgData = await cfgRes.json();
      if (cfgData.success && cfgData.data) {
        setConfig((prev) => ({ ...prev, ...cfgData.data }));
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

  // Filtered Questions for Bank Soal
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchWorld = qWorldFilter === 'all' || String(q.world) === qWorldFilter;
      const matchLevel = qLevelFilter === 'all' || String(q.level) === qLevelFilter;
      const matchDiff = qDiffFilter === 'all' || q.difficulty === qDiffFilter;
      const matchBoss =
        qBossFilter === 'all' ||
        (qBossFilter === 'boss' && q.isBossQuestion) ||
        (qBossFilter === 'regular' && !q.isBossQuestion);
      const matchActive =
        qActiveStatusFilter === 'all' ||
        (qActiveStatusFilter === 'active' && q.isActive !== false) ||
        (qActiveStatusFilter === 'inactive' && q.isActive === false);
      const searchLower = qSearch.toLowerCase().trim();
      const matchSearch =
        !searchLower ||
        q.question.toLowerCase().includes(searchLower) ||
        q.questionId.toLowerCase().includes(searchLower) ||
        (q.explanation && q.explanation.toLowerCase().includes(searchLower)) ||
        Object.values(q.options).some((opt) => opt.toLowerCase().includes(searchLower));

      return matchWorld && matchLevel && matchDiff && matchBoss && matchActive && matchSearch;
    });
  }, [questions, qWorldFilter, qLevelFilter, qDiffFilter, qBossFilter, qActiveStatusFilter, qSearch]);

  const isAllFilteredSelected = useMemo(() => {
    return (
      filteredQuestions.length > 0 &&
      filteredQuestions.every((q) => selectedQIds.includes(q.questionId))
    );
  }, [filteredQuestions, selectedQIds]);

  const handleToggleSelect = (id: string) => {
    setSelectedQIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle Active Status for a single question
  const handleToggleQuestionActive = async (questionId: string, currentActive?: boolean) => {
    const nextStatus = currentActive === false ? true : false;
    const nextQuestions = questions.map((q) =>
      q.questionId === questionId ? { ...q, isActive: nextStatus } : q
    );
    setQuestions(nextQuestions);
    saveStoredQuestions(nextQuestions);

    try {
      await fetch('/api/borneo-edu/questions/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds: [questionId], isActive: nextStatus })
      });
      setQAlertMessage({
        type: 'success',
        text: `Status soal ${questionId} berhasil diubah menjadi ${nextStatus ? 'AKTIF' : 'NONAKTIF'}.`
      });
      setTimeout(() => setQAlertMessage(null), 3000);
    } catch {
      // Local storage saved
    }
  };

  // Bulk Toggle Active Status
  const handleBulkToggleActive = async (targetActive: boolean) => {
    if (selectedQIds.length === 0) return;
    const nextQuestions = questions.map((q) =>
      selectedQIds.includes(q.questionId) ? { ...q, isActive: targetActive } : q
    );
    setQuestions(nextQuestions);
    saveStoredQuestions(nextQuestions);

    try {
      await fetch('/api/borneo-edu/questions/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds: selectedQIds, isActive: targetActive })
      });
      setQAlertMessage({
        type: 'success',
        text: `${selectedQIds.length} butir soal berhasil ${targetActive ? 'diaktifkan' : 'dinonaktifkan'}!`
      });
      setTimeout(() => setQAlertMessage(null), 3000);
    } catch {
      // Local storage saved
    }
  };

  // Save Settings Config
  const handleSaveSettingsConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    saveTeacherConfigToLocal(config);
    try {
      await fetch('/api/borneo-edu/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      setSettingsMessage('Pengaturan Meja Guru berhasil disimpan ke sistem!');
      setTimeout(() => setSettingsMessage(''), 4000);
    } catch {
      setSettingsMessage('Pengaturan disimpan di penyimpanan browser lokal.');
      setTimeout(() => setSettingsMessage(''), 4000);
    }
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredQuestions.map((q) => q.questionId);
    if (isAllFilteredSelected) {
      setSelectedQIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedQIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // 1. Download Template Excel Bank Soal
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
        'Pembahasan Singkat': 'Monitor merupakan perangkat keluaran (output device) yang menyajikan tampilan grafis.'
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
        'Pembahasan Singkat': 'Python adalah bahasa pemrograman tingkat tinggi yang mudah dibaca oleh manusia.'
      },
      {
        'ID Soal': 'Q105_BOSS',
        'World': 1,
        'Level': 5,
        'Pertanyaan': 'Tantangan Raja Hutan: Mengapa algoritma pencarian biner (Binary Search) lebih cepat daripada linier?',
        'Pilihan A': 'Membagi ruang pencarian menjadi separuh pada tiap langkah',
        'Pilihan B': 'Memeriksa setiap elemen satu per satu dari awal',
        'Pilihan C': 'Hanya bekerja pada data yang tidak terurut',
        'Pilihan D': 'Menggunakan memori komputer lebih sedikit',
        'Kunci Jawaban': 'A',
        'Tingkat Kesulitan': 'BOSS',
        'Tahap Materi': 'Analisis',
        'Soal Boss': 'YA',
        'Pembahasan Singkat': 'Binary Search memiliki efisiensi O(log n) karena membagi dua ruang pencarian data terurut.'
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

  // 2. Upload Massal Excel/CSV
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = xlsx.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const parsedRows: any[] = xlsx.utils.sheet_to_json(ws);

        if (!parsedRows || parsedRows.length === 0) {
          alert('File Excel/CSV kosong atau tidak memiliki baris data.');
          setIsUploading(false);
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
              explanation: String(r['Pembahasan Singkat'] || r['Pembahasan'] || 'Jawaban yang tepat adalah opsi ' + key).trim()
            });
          }
        });

        if (validQuestions.length === 0) {
          alert('Tidak ditemukan baris soal yang valid. Pastikan kolom Pertanyaan, Pilihan A, B, dan Kunci Jawaban terisi.');
          setIsUploading(false);
          return;
        }

        // Save to backend MongoDB
        await fetch('/api/borneo-edu/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validQuestions)
        });

        // Update local state
        setQuestions((prev) => {
          const map = new Map<string, QuestionItem>();
          prev.forEach((q) => map.set(q.questionId, q));
          validQuestions.forEach((q) => map.set(q.questionId, q));
          const updated = Array.from(map.values());
          saveStoredQuestions(updated);
          return updated;
        });

        setQAlertMessage({
          type: 'success',
          text: `Berhasil mengunggah ${validQuestions.length} soal secara massal ke Bank Soal!`
        });
        setTimeout(() => setQAlertMessage(null), 5000);
      } catch (err: any) {
        alert('Gagal memproses file Excel: ' + err.message);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  // 3. Download/Export Questions to Excel
  const handleDownloadQuestionsExcel = (selectedOnly: boolean = false) => {
    const listToExport = selectedOnly
      ? questions.filter((q) => selectedQIds.includes(q.questionId))
      : filteredQuestions;

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
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Bank Soal Borneo Edu');
    xlsx.writeFile(
      workbook,
      selectedOnly
        ? `Bank_Soal_Terpilih_${listToExport.length}_Soal.xlsx`
        : `Bank_Soal_Borneo_Edu_${listToExport.length}_Soal.xlsx`
    );
  };

  // 4. Delete Single Question
  const handleDeleteSingleQuestion = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus butir soal ini dari bank soal?')) {
      return;
    }

    try {
      await fetch(`/api/borneo-edu/questions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: id })
      });

      setQuestions((prev) => {
        const next = prev.filter((q) => q.questionId !== id);
        saveStoredQuestions(next);
        return next;
      });
      setSelectedQIds((prev) => prev.filter((item) => item !== id));
      setQAlertMessage({ type: 'success', text: 'Soal berhasil dihapus.' });
      setTimeout(() => setQAlertMessage(null), 3000);
    } catch (err: any) {
      alert('Gagal menghapus soal: ' + err.message);
    }
  };

  // 5. Bulk Delete Selected Questions
  const handleBulkDelete = async () => {
    if (selectedQIds.length === 0) return;
    if (
      !confirm(
        `PERINGATAN: Apakah Anda yakin ingin menghapus ${selectedQIds.length} butir soal yang dipilih secara massal?`
      )
    ) {
      return;
    }

    try {
      await fetch('/api/borneo-edu/questions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds: selectedQIds })
      });

      setQuestions((prev) => {
        const next = prev.filter((q) => !selectedQIds.includes(q.questionId));
        saveStoredQuestions(next);
        return next;
      });
      const count = selectedQIds.length;
      setSelectedQIds([]);
      setQAlertMessage({
        type: 'success',
        text: `Berhasil menghapus ${count} butir soal secara massal!`
      });
      setTimeout(() => setQAlertMessage(null), 4000);
    } catch (err: any) {
      alert('Gagal menghapus soal massal: ' + err.message);
    }
  };

  // 6. Apply Bulk Edit / Bulk Save
  const handleApplyBulkEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQIds.length === 0) return;

    const updates: Partial<QuestionItem> = {};
    if (bulkWorld !== 'keep') updates.world = Number(bulkWorld);
    if (bulkLevel !== 'keep') updates.level = Number(bulkLevel);
    if (bulkDiff !== 'keep') updates.difficulty = bulkDiff as any;
    if (bulkIsBoss !== 'keep') updates.isBossQuestion = bulkIsBoss === 'true';

    if (Object.keys(updates).length === 0) {
      alert('Pilih setidaknya satu atribut yang ingin diubah.');
      return;
    }

    try {
      await fetch('/api/borneo-edu/questions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionIds: selectedQIds,
          updates
        })
      });

      setQuestions((prev) => {
        const next = prev.map((q) => {
          if (selectedQIds.includes(q.questionId)) {
            return { ...q, ...updates };
          }
          return q;
        });
        saveStoredQuestions(next);
        return next;
      });

      setShowBulkEditModal(false);
      setQAlertMessage({
        type: 'success',
        text: `Berhasil memperbarui & menyimpan atribut ${selectedQIds.length} soal secara massal!`
      });
      setTimeout(() => setQAlertMessage(null), 4000);
    } catch (err: any) {
      alert('Gagal melakukan update massal: ' + err.message);
    }
  };

  // 7. Save New Single Question
  const handleSaveNewQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQForm.question.trim()) {
      alert('Isi pertanyaan wajib diisi.');
      return;
    }
    if (!newQForm.options.A.trim() || !newQForm.options.B.trim()) {
      alert('Pilihan A dan B wajib diisi.');
      return;
    }

    try {
      await fetch('/api/borneo-edu/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQForm)
      });

      setQuestions((prev) => {
        const next = [newQForm, ...prev];
        saveStoredQuestions(next);
        return next;
      });

      setShowAddQModal(false);
      setNewQForm({
        questionId: `Q_${newQForm.world}_${newQForm.level}_${Date.now()}`,
        world: newQForm.world,
        level: newQForm.level,
        question: '',
        options: { A: '', B: '', C: '', D: '' },
        correctAnswer: 'A',
        difficulty: 'EASY',
        stage: 'Pengetahuan',
        isBossQuestion: false,
        explanation: ''
      });

      setQAlertMessage({ type: 'success', text: 'Soal baru berhasil ditambahkan ke bank soal!' });
      setTimeout(() => setQAlertMessage(null), 4000);
    } catch (err: any) {
      alert('Gagal menyimpan soal: ' + err.message);
    }
  };

  // 8. Save Edited Single Question
  const handleSaveEditQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQ) return;
    if (!editingQ.question.trim()) {
      alert('Isi pertanyaan wajib diisi.');
      return;
    }

    try {
      await fetch('/api/borneo-edu/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingQ)
      });

      setQuestions((prev) => {
        const next = prev.map((item) => (item.questionId === editingQ.questionId ? editingQ : item));
        saveStoredQuestions(next);
        return next;
      });

      setEditingQ(null);
      setQAlertMessage({ type: 'success', text: `Soal ${editingQ.questionId} berhasil diperbarui!` });
      setTimeout(() => setQAlertMessage(null), 4000);
    } catch (err: any) {
      alert('Gagal memperbarui soal: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Header: MEJA GURU */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-2xl border border-emerald-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black flex items-center gap-1.5 border border-emerald-400/40">
                <ShieldCheck size={14} />
                <span>MEJA GURU • KONTROL SOAL & PEMANTAUAN</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black flex items-center gap-1.5 border border-amber-400/40">
                <Trophy size={14} />
                <span>Borneo Edu</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Meja Guru — Progress & Bank Soal Borneo Edu
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Halo, <strong>{teacherName}</strong>. Selamat datang di Meja Guru! Pantau keterlibatan belajar siswa, kelola bank soal kurikulum, serta atur jumlah butir soal dan rentang level yang dimainkan siswa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowGamePreview(true)}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl transition-all active:scale-95 flex items-center gap-2"
              title="Uji coba mainkan game dengan konfigurasi soal yang Anda atur"
            >
              <Gamepad2 size={18} />
              <span>🎮 Uji Coba Game (Preview)</span>
            </button>
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
          <span>Pengaturan Soal, Level & Bobot</span>
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
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter size={16} className="text-slate-400" />
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all" className="text-slate-800 bg-white">Semua Kelas</option>
                  {availableClasses.map((c) => (
                    <option key={c} value={c} className="text-slate-800 bg-white">{c}</option>
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
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          {/* Alert Notification */}
          {qAlertMessage && (
            <div
              className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 shadow-md transition-all ${
                qAlertMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border border-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{qAlertMessage.type === 'success' ? '✅' : '⚠️'}</span>
                <span>{qAlertMessage.text}</span>
              </div>
              <button
                onClick={() => setQAlertMessage(null)}
                className="text-xs p-1 rounded-lg hover:bg-black/5"
              >
                ✕
              </button>
            </div>
          )}

          {/* Top Header & Stat Counters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black tracking-wide">
                  MODUL BANK SOAL
                </span>
                <span className="text-xs text-slate-400 font-medium">Kurikulum Game Edukasi 2D</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Kelola Bank Soal Borneo Edu
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Soal terintegrasi otomatis dalam Question Block & Musuh Patroli di 5 World & 25 Level.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Soal</span>
                <span className="text-sm font-black text-slate-800">{questions.length} Butir</span>
              </div>
              <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[10px] text-emerald-700 font-bold block uppercase">Soal Reguler</span>
                <span className="text-sm font-black text-emerald-800">
                  {questions.filter((q) => !q.isBossQuestion).length} Soal
                </span>
              </div>
              <div className="px-3.5 py-2 rounded-2xl bg-purple-50 border border-purple-200 text-center">
                <span className="text-[10px] text-purple-700 font-bold block uppercase">Boss Battle</span>
                <span className="text-sm font-black text-purple-800">
                  {questions.filter((q) => q.isBossQuestion).length} Soal
                </span>
              </div>
              {selectedQIds.length > 0 && (
                <div className="px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-300 text-center animate-pulse">
                  <span className="text-[10px] text-amber-700 font-bold block uppercase">Dipilih</span>
                  <span className="text-sm font-black text-amber-900">{selectedQIds.length} Soal</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex flex-wrap items-center gap-2">
              {/* Template Download Button */}
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 shadow-sm flex items-center gap-2 transition-transform active:scale-95"
                title="Unduh Format Template Excel untuk Upload Massal"
              >
                <Download size={15} className="text-emerald-600" />
                <span>Unduh Template Excel</span>
              </button>

              {/* Bulk Upload Button */}
              <label
                className={`px-3.5 py-2 rounded-xl text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-transform active:scale-95 ${
                  isUploading
                    ? 'bg-emerald-400 cursor-not-allowed opacity-75'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
                title="Unggah File Excel/CSV Berisi Banyak Soal Sekaligus"
              >
                {isUploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                <span>{isUploading ? 'Mengunggah...' : 'Unggah Massal (Excel / CSV)'}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleBulkUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>

              {/* Manual Add Single Question Button */}
              <button
                type="button"
                onClick={() => {
                  setNewQForm({
                    questionId: `Q_1_1_${Date.now()}`,
                    world: 1,
                    level: 1,
                    question: '',
                    options: { A: '', B: '', C: '', D: '' },
                    correctAnswer: 'A',
                    difficulty: 'EASY',
                    stage: 'Pengetahuan',
                    isBossQuestion: false,
                    explanation: ''
                  });
                  setShowAddQModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <Plus size={15} />
                <span>+ Tambah Soal Manual</span>
              </button>
            </div>

            {/* Export All Questions Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadQuestionsExcel(false)}
                className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 shadow-sm flex items-center gap-1.5 transition-colors"
                title="Unduh seluruh bank soal aktif ke file Excel"
              >
                <FileSpreadsheet size={15} className="text-teal-600" />
                <span>Ekspor Semua ({questions.length})</span>
              </button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
            {/* Search Input */}
            <div className="sm:col-span-2 lg:col-span-2 relative">
              <Search size={15} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari pertanyaan, ID, opsi, atau pembahasan..."
                value={qSearch}
                onChange={(e) => setQSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Filter World */}
            <div>
              <select
                value={qWorldFilter}
                onChange={(e) => setQWorldFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Semua World (1-5)</option>
                <option value="1">World 1 (Hutan Borneo)</option>
                <option value="2">World 2 (Pegunungan Meratus)</option>
                <option value="3">World 3 (Sungai Mahakam)</option>
                <option value="4">World 4 (Gurun & Savana)</option>
                <option value="5">World 5 (Kastel Penguasa)</option>
              </select>
            </div>

            {/* Filter Level */}
            <div>
              <select
                value={qLevelFilter}
                onChange={(e) => setQLevelFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Level (1-25)</option>
                {Array.from({ length: 25 }, (_, i) => i + 1).map((lvl) => (
                  <option key={lvl} value={String(lvl)}>
                    Level {lvl} {lvl % 5 === 0 ? '👑 (Boss)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Kesulitan */}
            <div>
              <select
                value={qDiffFilter}
                onChange={(e) => setQDiffFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Kesulitan</option>
                <option value="EASY">EASY (Mudah)</option>
                <option value="MEDIUM">MEDIUM (Sedang)</option>
                <option value="HARD">HARD (Sulit)</option>
                <option value="HOTS">HOTS (Tinggi)</option>
                <option value="BOSS">BOSS (Raja)</option>
              </select>
            </div>

            {/* Filter Tipe Boss */}
            <div>
              <select
                value={qBossFilter}
                onChange={(e) => setQBossFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Tipe Soal</option>
                <option value="regular">Soal Rintangan Biasa</option>
                <option value="boss">Soal Boss Battle</option>
              </select>
            </div>

            {/* Filter Status Aktif */}
            <div>
              <select
                value={qActiveStatusFilter}
                onChange={(e) => setQActiveStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Status Soal</option>
                <option value="active">✅ Hanya Soal Aktif</option>
                <option value="inactive">⏸️ Hanya Soal Nonaktif</option>
              </select>
            </div>
          </div>

          {/* Sticky / Floating Bulk Actions Banner when items are selected */}
          {selectedQIds.length > 0 && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/50 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top duration-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center font-black text-sm">
                  ✓
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-black text-indigo-200">
                    {selectedQIds.length} butir soal dipilih
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Gunakan tombol di samping untuk menerapkan aksi massal ke seluruh soal yang dicentang.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Bulk Activate / Deactivate */}
                <button
                  type="button"
                  onClick={() => handleBulkToggleActive(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
                  title="Aktifkan seluruh soal yang dicentang agar dikerjakan siswa"
                >
                  <span>✅ Aktifkan Terpilih</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkToggleActive(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
                  title="Nonaktifkan seluruh soal yang dicentang agar tidak muncul dalam game"
                >
                  <span>⏸️ Nonaktifkan Terpilih</span>
                </button>

                {/* Bulk Edit Button */}
                <button
                  type="button"
                  onClick={() => {
                    setBulkWorld('keep');
                    setBulkLevel('keep');
                    setBulkDiff('keep');
                    setBulkIsBoss('keep');
                    setShowBulkEditModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  <Edit3 size={14} />
                  <span>Ubah Massal</span>
                </button>

                {/* Bulk Delete Button */}
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  <Trash2 size={14} />
                  <span>Hapus Massal ({selectedQIds.length})</span>
                </button>

                {/* Export Selected Button */}
                <button
                  type="button"
                  onClick={() => handleDownloadQuestionsExcel(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5"
                >
                  <Download size={14} />
                  <span>Unduh Terpilih</span>
                </button>

                {/* Deselect All */}
                <button
                  type="button"
                  onClick={() => setSelectedQIds([])}
                  className="px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold transition-colors"
                >
                  Batal Pilih
                </button>
              </div>
            </div>
          )}

          {/* Interactive Questions Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm max-h-[60vh] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllFilteredSelected}
                      onChange={handleSelectAllFiltered}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      title={isAllFilteredSelected ? 'Batalkan pilihan semua' : 'Pilih semua soal di tampilan'}
                    />
                  </th>
                  <th className="p-3 whitespace-nowrap">ID Soal</th>
                  <th className="p-3 whitespace-nowrap">World & Level</th>
                  <th className="p-3 whitespace-nowrap">Kesulitan</th>
                  <th className="p-3 min-w-[280px]">Pertanyaan & Pilihan Jawaban</th>
                  <th className="p-3 text-center whitespace-nowrap">Kunci</th>
                  <th className="p-3 min-w-[180px]">Pembahasan</th>
                  <th className="p-3 text-center whitespace-nowrap">Status Soal</th>
                  <th className="p-3 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredQuestions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-slate-400">
                      <div className="text-3xl mb-2">🔍</div>
                      <p className="font-bold text-sm text-slate-600">Tidak ada soal yang cocok dengan filter.</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Coba sesuaikan kata kunci pencarian atau bersihkan filter di atas.
                      </p>
                      <button
                        onClick={() => {
                          setQSearch('');
                          setQWorldFilter('all');
                          setQLevelFilter('all');
                          setQDiffFilter('all');
                          setQBossFilter('all');
                        }}
                        className="mt-3 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                      >
                        Reset Filter
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredQuestions.map((q) => {
                    const isSelected = selectedQIds.includes(q.questionId);
                    return (
                      <tr
                        key={q.questionId}
                        className={`transition-colors ${
                          isSelected ? 'bg-indigo-50/70 hover:bg-indigo-50' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(q.questionId)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>

                        {/* ID Soal */}
                        <td className="p-3 font-mono font-black text-emerald-700 whitespace-nowrap">
                          {q.questionId}
                        </td>

                        {/* World & Level */}
                        <td className="p-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-black text-[11px] text-slate-700">
                              W{q.world} • L{q.level}
                            </span>
                            {q.isBossQuestion && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-black" title="Soal Boss Battle">
                                👑 BOSS
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Kesulitan */}
                        <td className="p-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                              q.difficulty === 'BOSS'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : q.difficulty === 'HOTS'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : q.difficulty === 'HARD'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : q.difficulty === 'MEDIUM'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {q.difficulty}
                          </span>
                        </td>

                        {/* Pertanyaan & Pilihan Jawaban */}
                        <td className="p-3">
                          <p className="font-bold text-slate-900 leading-snug">{q.question}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-2 text-[11px]">
                            {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                              <div
                                key={opt}
                                className={`px-2 py-1 rounded-lg border ${
                                  q.correctAnswer === opt
                                    ? 'bg-emerald-100/80 border-emerald-300 text-emerald-900 font-bold'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                <span className="font-black mr-1">{opt}:</span>
                                <span>{q.options[opt]}</span>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Kunci Jawaban */}
                        <td className="p-3 text-center">
                          <span className="inline-flex w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs items-center justify-center shadow-sm">
                            {q.correctAnswer}
                          </span>
                        </td>

                        {/* Pembahasan */}
                        <td className="p-3 text-slate-500 text-[11px] leading-relaxed">
                          {q.explanation || '-'}
                        </td>

                        {/* Status Soal (Aktif / Nonaktif) */}
                        <td className="p-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleQuestionActive(q.questionId, q.isActive)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-black border transition-all inline-flex items-center gap-1.5 ${
                              q.isActive !== false
                                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border-slate-300'
                            }`}
                            title={q.isActive !== false ? 'Klik untuk menonaktifkan soal ini dari permainan' : 'Klik untuk mengaktifkan soal ini ke permainan'}
                          >
                            <span>{q.isActive !== false ? '✅' : '⏸️'}</span>
                            <span>{q.isActive !== false ? 'Aktif' : 'Nonaktif'}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingQ({ ...q })}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors"
                              title="Edit Soal Ini"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSingleQuestion(q.questionId)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors"
                              title="Hapus Soal Ini"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer info */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-xs text-slate-500">
            <span>
              Menampilkan <strong>{filteredQuestions.length}</strong> dari total <strong>{questions.length}</strong> soal di database.
            </span>
            {selectedQIds.length > 0 && (
              <span className="font-bold text-indigo-600">
                {selectedQIds.length} soal sedang dicentang untuk aksi massal.
              </span>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: PENGATURAN MEJA GURU (SOAL, LEVEL, TIMER & BOBOT) */}
      {/* ===================================================================== */}
      {activeTab === 'pengaturan' && (
        <form onSubmit={handleSaveSettingsConfig} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 max-w-4xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black tracking-wide">
                  PENGATURAN MEJA GURU
                </span>
                <span className="text-xs text-slate-400 font-medium">Kontrol Siswa & Game</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Pengaturan Jumlah Soal, Level & Evaluasi
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Konfigurasikan batas level, jumlah butir soal per level, timer batas waktu, dan bobot perhitungan nilai akhir.
              </p>
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-xl flex items-center gap-2 transition-transform active:scale-95 shrink-0"
            >
              <Save size={16} />
              <span>Simpan Pengaturan Meja Guru</span>
            </button>
          </div>

          {settingsMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
              <span>✅</span>
              <span>{settingsMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CARD 1: PENGATURAN JUMLAH SOAL & LEVEL */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-800 font-black text-sm">
                <Layers size={18} className="text-emerald-600" />
                <span>Jumlah Soal & Rentang Level Siswa</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Jumlah Soal per Level yang Dimainkan Siswa: <strong className="text-emerald-700 text-sm font-black">{config.maxQuestionsPerLevel ?? 5} Soal</strong>
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Mengatur berapa banyak butir soal rintangan yang harus dijawab siswa di setiap level petualangan (default: 5 soal).
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={config.maxQuestionsPerLevel ?? 5}
                    onChange={(e) => setConfig({ ...config, maxQuestionsPerLevel: Number(e.target.value) })}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={config.maxQuestionsPerLevel ?? 5}
                    onChange={(e) => setConfig({ ...config, maxQuestionsPerLevel: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })}
                    className="w-16 px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-black text-center text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Rentang Level Aktif Siswa:
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Siswa hanya diizinkan memainkan level dalam rentang ini (contoh: Level 1 sampai 10).
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">Level Mulai (Min: 1)</span>
                    <input
                      type="number"
                      min={1}
                      max={config.activeLevelEnd ?? 25}
                      value={config.activeLevelStart ?? 1}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(config.activeLevelEnd ?? 25, Number(e.target.value) || 1));
                        setConfig({ ...config, activeLevelStart: val });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">Level Selesai (Max: 25)</span>
                    <input
                      type="number"
                      min={config.activeLevelStart ?? 1}
                      max={25}
                      value={config.activeLevelEnd ?? 25}
                      onChange={(e) => {
                        const val = Math.max(config.activeLevelStart ?? 1, Math.min(25, Number(e.target.value) || 25));
                        setConfig({ ...config, activeLevelEnd: val });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: PENGATURAN WAKTU TIMER SOAL */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-800 font-black text-sm">
                <Clock size={18} className="text-teal-600" />
                <span>Timer Batas Waktu Menjawab</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Waktu Soal Mudah (EASY): <strong className="text-teal-700 font-black">{config.timeEasy} Detik</strong>
                </label>
                <input
                  type="range"
                  min={10}
                  max={120}
                  step={5}
                  value={config.timeEasy}
                  onChange={(e) => setConfig({ ...config, timeEasy: Number(e.target.value) })}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Waktu Soal Sedang (MEDIUM): <strong className="text-teal-700 font-black">{config.timeMedium} Detik</strong>
                </label>
                <input
                  type="range"
                  min={15}
                  max={180}
                  step={5}
                  value={config.timeMedium}
                  onChange={(e) => setConfig({ ...config, timeMedium: Number(e.target.value) })}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Waktu Soal Sulit & Boss (HARD/BOSS): <strong className="text-teal-700 font-black">{config.timeHard} Detik</strong>
                </label>
                <input
                  type="range"
                  min={20}
                  max={300}
                  step={5}
                  value={config.timeHard}
                  onChange={(e) => setConfig({ ...config, timeHard: Number(e.target.value) })}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>
            </div>

            {/* CARD 3: BOBOT PENILAIAN OTOMATIS */}
            <div className="md:col-span-2 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-800 font-black text-sm">
                <Sliders size={18} className="text-indigo-600" />
                <span>Bobot Penilaian Nilai Akhir Siswa (Total: {config.weightAccuracy + config.weightLevel + config.weightBoss}%)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">
                    Bobot Akurasi Jawaban ({config.weightAccuracy}%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={config.weightAccuracy}
                    onChange={(e) => setConfig({ ...config, weightAccuracy: Number(e.target.value) })}
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
                    onChange={(e) => setConfig({ ...config, weightLevel: Number(e.target.value) })}
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
                    onChange={(e) => setConfig({ ...config, weightBoss: Number(e.target.value) })}
                    className="w-full accent-emerald-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
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

      {/* ===================================================================== */}
      {/* MODAL 1: TAMBAH SOAL MANUAL */}
      {/* ===================================================================== */}
      {showAddQModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-5 my-6 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-lg">
                  ➕
                </span>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Tambah Soal Baru Manual</h3>
                  <p className="text-xs text-slate-500">
                    Masukkan rincian butir soal platformer baru ke dalam bank soal kurikulum.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddQModal(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewQuestion} className="space-y-4">
              {/* World, Level, Kesulitan Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">World (1-5)</label>
                  <select
                    value={newQForm.world}
                    onChange={(e) => setNewQForm({ ...newQForm, world: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                  >
                    {[1, 2, 3, 4, 5].map((w) => (
                      <option key={w} value={w} className="text-slate-900 bg-white">World {w}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Level (1-25)</label>
                  <select
                    value={newQForm.level}
                    onChange={(e) => setNewQForm({ ...newQForm, level: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                  >
                    {Array.from({ length: 25 }, (_, i) => i + 1).map((lvl) => (
                      <option key={lvl} value={lvl} className="text-slate-900 bg-white">Level {lvl}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Kesulitan</label>
                  <select
                    value={newQForm.difficulty}
                    onChange={(e) => setNewQForm({ ...newQForm, difficulty: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                  >
                    <option value="EASY" className="text-slate-900 bg-white">EASY</option>
                    <option value="MEDIUM" className="text-slate-900 bg-white">MEDIUM</option>
                    <option value="HARD" className="text-slate-900 bg-white">HARD</option>
                    <option value="HOTS" className="text-slate-900 bg-white">HOTS</option>
                    <option value="BOSS" className="text-slate-900 bg-white">BOSS</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Tahap Materi</label>
                  <select
                    value={newQForm.stage || 'Pengetahuan'}
                    onChange={(e) => setNewQForm({ ...newQForm, stage: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                  >
                    <option value="Pengetahuan" className="text-slate-900 bg-white">Pengetahuan</option>
                    <option value="Pemahaman" className="text-slate-900 bg-white">Pemahaman</option>
                    <option value="Penerapan" className="text-slate-900 bg-white">Penerapan</option>
                    <option value="Analisis" className="text-slate-900 bg-white">Analisis</option>
                    <option value="HOTS" className="text-slate-900 bg-white">HOTS</option>
                  </select>
                </div>
              </div>

              {/* Checkbox Soal Boss */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <label htmlFor="chk-new-boss" className="text-xs font-black text-slate-800 cursor-pointer">
                    👑 Jadikan Soal Boss Battle
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Soal ini akan dimunculkan saat siswa melawan Raja/Boss di level kelipatan 5 (Level 5, 10, 15, 20, 25).
                  </p>
                </div>
                <input
                  id="chk-new-boss"
                  type="checkbox"
                  checked={newQForm.isBossQuestion}
                  onChange={(e) => setNewQForm({ ...newQForm, isBossQuestion: e.target.checked })}
                  className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
              </div>

              {/* Isi Pertanyaan */}
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">
                  Isi Pertanyaan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={newQForm.question}
                  onChange={(e) => setNewQForm({ ...newQForm, question: e.target.value })}
                  placeholder="Tuliskan pertanyaan soal..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Pilihan Opsi A, B, C, D */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 block">
                  Pilihan Jawaban (A, B, C, D) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                    <div
                      key={opt}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                        newQForm.correctAnswer === opt ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 bg-white'
                      }`}
                    >
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="new-correct-ans"
                          checked={newQForm.correctAnswer === opt}
                          onChange={() => setNewQForm({ ...newQForm, correctAnswer: opt })}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-black text-xs text-slate-800">{opt}</span>
                      </label>
                      <input
                        type="text"
                        placeholder={`Teks pilihan ${opt}...`}
                        value={newQForm.options[opt]}
                        onChange={(e) =>
                          setNewQForm({
                            ...newQForm,
                            options: { ...newQForm.options, [opt]: e.target.value }
                          })
                        }
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                        required={opt === 'A' || opt === 'B'}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400">
                  Tandai tombol radio di samping pilihan yang merupakan kunci jawaban yang benar.
                </p>
              </div>

              {/* Pembahasan Singkat */}
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">
                  Pembahasan Singkat
                </label>
                <textarea
                  rows={2}
                  value={newQForm.explanation}
                  onChange={(e) => setNewQForm({ ...newQForm, explanation: e.target.value })}
                  placeholder="Penjelasan ringkas mengapa jawaban tersebut benar..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddQModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-transform active:scale-95"
                >
                  Simpan Soal Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: EDIT SOAL INDIVIDU */}
      {/* ===================================================================== */}
      {editingQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-5 my-6 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-2xl bg-indigo-100 text-indigo-800 font-black text-lg">
                  ✏️
                </span>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Edit Butir Soal: {editingQ.questionId}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Perbarui isi pertanyaan, pilihan opsi, kunci jawaban, atau tingkat kesulitan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingQ(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditQuestion} className="space-y-4">
              {/* World, Level, Kesulitan Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">World (1-5)</label>
                  <select
                    value={editingQ.world}
                    onChange={(e) => setEditingQ({ ...editingQ, world: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                  >
                    {[1, 2, 3, 4, 5].map((w) => (
                      <option key={w} value={w} className="text-slate-900 bg-white">World {w}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Level (1-25)</label>
                  <select
                    value={editingQ.level}
                    onChange={(e) => setEditingQ({ ...editingQ, level: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                  >
                    {Array.from({ length: 25 }, (_, i) => i + 1).map((lvl) => (
                      <option key={lvl} value={lvl} className="text-slate-900 bg-white">Level {lvl}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Kesulitan</label>
                  <select
                    value={editingQ.difficulty}
                    onChange={(e) => setEditingQ({ ...editingQ, difficulty: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                  >
                    <option value="EASY" className="text-slate-900 bg-white">EASY</option>
                    <option value="MEDIUM" className="text-slate-900 bg-white">MEDIUM</option>
                    <option value="HARD" className="text-slate-900 bg-white">HARD</option>
                    <option value="HOTS" className="text-slate-900 bg-white">HOTS</option>
                    <option value="BOSS" className="text-slate-900 bg-white">BOSS</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Tahap Materi</label>
                  <select
                    value={editingQ.stage || 'Pengetahuan'}
                    onChange={(e) => setEditingQ({ ...editingQ, stage: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                  >
                    <option value="Pengetahuan" className="text-slate-900 bg-white">Pengetahuan</option>
                    <option value="Pemahaman" className="text-slate-900 bg-white">Pemahaman</option>
                    <option value="Penerapan" className="text-slate-900 bg-white">Penerapan</option>
                    <option value="Analisis" className="text-slate-900 bg-white">Analisis</option>
                    <option value="HOTS" className="text-slate-900 bg-white">HOTS</option>
                  </select>
                </div>
              </div>

              {/* Checkbox Soal Boss */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <label htmlFor="chk-edit-boss" className="text-xs font-black text-slate-800 cursor-pointer">
                    👑 Jadikan Soal Boss Battle
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Soal ini akan dimunculkan saat siswa melawan Boss di level kelipatan 5.
                  </p>
                </div>
                <input
                  id="chk-edit-boss"
                  type="checkbox"
                  checked={editingQ.isBossQuestion}
                  onChange={(e) => setEditingQ({ ...editingQ, isBossQuestion: e.target.checked })}
                  className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
              </div>

              {/* Isi Pertanyaan */}
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">
                  Isi Pertanyaan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={editingQ.question}
                  onChange={(e) => setEditingQ({ ...editingQ, question: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Pilihan Opsi A, B, C, D */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 block">
                  Pilihan Jawaban (A, B, C, D) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                    <div
                      key={opt}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                        editingQ.correctAnswer === opt ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 bg-white'
                      }`}
                    >
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="edit-correct-ans"
                          checked={editingQ.correctAnswer === opt}
                          onChange={() => setEditingQ({ ...editingQ, correctAnswer: opt })}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-black text-xs text-slate-800">{opt}</span>
                      </label>
                      <input
                        type="text"
                        value={editingQ.options[opt]}
                        onChange={(e) =>
                          setEditingQ({
                            ...editingQ,
                            options: { ...editingQ.options, [opt]: e.target.value }
                          })
                        }
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                        required={opt === 'A' || opt === 'B'}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Pembahasan Singkat */}
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">
                  Pembahasan Singkat
                </label>
                <textarea
                  rows={2}
                  value={editingQ.explanation}
                  onChange={(e) => setEditingQ({ ...editingQ, explanation: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingQ(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition-transform active:scale-95"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: UBAH MASSAL ATRIBUT SOAL TERPILIH */}
      {/* ===================================================================== */}
      {showBulkEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 my-6 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-2xl bg-indigo-100 text-indigo-800 font-black text-lg">
                  ⚙️
                </span>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Ubah Massal ({selectedQIds.length} Soal)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Terapkan perubahan atribut sekaligus untuk seluruh soal yang dipilih.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkEditModal(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyBulkEdit} className="space-y-4">
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                💡 <em>Catatan:</em> Pilih atribut yang ingin diganti. Atribut dengan pilihan <strong>Biarkan Seperti Semula</strong> tidak akan diubah pada data soal.
              </p>

              {/* Ubah World */}
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">Pindahkan ke World</label>
                <select
                  value={bulkWorld}
                  onChange={(e) => setBulkWorld(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                >
                  <option value="keep" className="text-slate-900 bg-white">— Biarkan Seperti Semula —</option>
                  <option value="1" className="text-slate-900 bg-white">World 1 (Hutan Borneo)</option>
                  <option value="2" className="text-slate-900 bg-white">World 2 (Pegunungan Meratus)</option>
                  <option value="3" className="text-slate-900 bg-white">World 3 (Sungai Mahakam)</option>
                  <option value="4" className="text-slate-900 bg-white">World 4 (Gurun & Savana)</option>
                  <option value="5" className="text-slate-900 bg-white">World 5 (Kastel Penguasa)</option>
                </select>
              </div>

              {/* Ubah Level */}
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">Pindahkan ke Level</label>
                <select
                  value={bulkLevel}
                  onChange={(e) => setBulkLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                >
                  <option value="keep" className="text-slate-900 bg-white">— Biarkan Seperti Semula —</option>
                  {Array.from({ length: 25 }, (_, i) => i + 1).map((lvl) => (
                    <option key={lvl} value={String(lvl)} className="text-slate-900 bg-white">Level {lvl}</option>
                  ))}
                </select>
              </div>

              {/* Ubah Kesulitan */}
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">Ubah Tingkat Kesulitan</label>
                <select
                  value={bulkDiff}
                  onChange={(e) => setBulkDiff(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                >
                  <option value="keep" className="text-slate-900 bg-white">— Biarkan Seperti Semula —</option>
                  <option value="EASY" className="text-slate-900 bg-white">EASY (Mudah)</option>
                  <option value="MEDIUM" className="text-slate-900 bg-white">MEDIUM (Sedang)</option>
                  <option value="HARD" className="text-slate-900 bg-white">HARD (Sulit)</option>
                  <option value="HOTS" className="text-slate-900 bg-white">HOTS (Tinggi)</option>
                  <option value="BOSS" className="text-slate-900 bg-white">BOSS (Raja)</option>
                </select>
              </div>

              {/* Ubah Status Soal Boss */}
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">Status Soal Boss Battle</label>
                <select
                  value={bulkIsBoss}
                  onChange={(e) => setBulkIsBoss(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                >
                  <option value="keep" className="text-slate-900 bg-white">— Biarkan Seperti Semula —</option>
                  <option value="true" className="text-slate-900 bg-white">👑 Ubah Menjadi Soal Boss Battle</option>
                  <option value="false" className="text-slate-900 bg-white">⚪ Ubah Menjadi Soal Biasa (Non-Boss)</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBulkEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition-transform active:scale-95"
                >
                  Terapkan & Simpan Massal ({selectedQIds.length})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* GAME PREVIEW MODAL */}
      {showGamePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl bg-slate-950 border-2 border-emerald-500/40 rounded-3xl p-3 sm:p-5 shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-400/30">
                  🎮 Mode Preview Uji Coba Guru
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  Uji coba level, gameplay, dan butir soal yang telah Anda atur di Meja Guru
                </span>
              </div>
              <button
                onClick={() => setShowGamePreview(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <span>✕</span>
                <span>Tutup Preview</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <BorneoEduGame />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

