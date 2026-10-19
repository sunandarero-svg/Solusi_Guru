'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  Play,
  Award,
  Settings,
  User,
  Users,
  CheckCircle,
  HelpCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Sparkles,
  Trophy,
  Star,
  Lock,
  Eye,
  AlertTriangle,
  FileSpreadsheet,
  Compass,
  Zap,
  RefreshCw,
  Clock,
  Swords,
  BarChart2,
  Printer,
  Save,
  Loader2,
  Maximize2,
  Minimize2
} from 'lucide-react';

import { LEVELS_DATA } from './data/levelsData';
import { GridData, CellStyle, ChartConfig } from './types';
import { playSound } from './engine/soundEffects';
import {
  COLS,
  getComputedCellValue,
  evaluateFormula
} from './engine/formulaParser';
import { executeAutoFill } from './engine/formulaShifter';

import { GridTable } from './components/Spreadsheet/GridTable';
import { FormulaBar } from './components/Spreadsheet/FormulaBar';
import { RibbonToolbar } from './components/Spreadsheet/RibbonToolbar';
import { FlashcardVisual } from './components/FlashcardVisual';
import { InteractiveChart } from './components/Charts/InteractiveChart';

import { ChartModal } from './components/Modals/ChartModal';
import { ExportImportModal } from './components/Modals/ExportImportModal';
import { SocraticTutorModal } from './components/Modals/SocraticTutorModal';
import { ClassroomDuelModal } from './components/Modals/ClassroomDuelModal';

interface ExcelAdventureAppProps {
  initialMode?: 'STUDENT' | 'TEACHER';
  userRole?: string;
  defaultPlayerName?: string;
  defaultPlayerClass?: string;
}

export default function ExcelAdventureApp({
  initialMode = 'STUDENT',
  userRole = 'STUDENT',
  defaultPlayerName = 'Siswa Hebat',
  defaultPlayerClass = '8A'
}: ExcelAdventureAppProps) {
  const isTeacherUser =
    userRole === 'TEACHER' || userRole === 'ADMIN' || userRole === 'PRINCIPAL';
  // Navigasi Layar Utama
  const [screen, setScreen] = useState<
    | 'SPLASH'
    | 'HOME'
    | 'PROFILE'
    | 'MAP'
    | 'FLASHCARD'
    | 'GAME'
    | 'RESULT'
    | 'ACHIEVEMENTS'
    | 'TEACHER_DASHBOARD'
    | 'SETTINGS'
  >('SPLASH');

  const [appMode, setAppMode] = useState<'STUDENT' | 'TEACHER'>(initialMode);

  // Pengaturan & Aksesibilitas IFP & Fullscreen Lanskap
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [zoomScale, setZoomScale] = useState(1);
  const [kkmScore, setKkmScore] = useState(75);
  const [teacherUnlockAll, setTeacherUnlockAll] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sinkronisasi status fullscreen dari perubahan browser
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = Boolean(
        (typeof document !== 'undefined' && document.fullscreenElement) ||
        (typeof document !== 'undefined' && (document as any).webkitFullscreenElement) ||
        (typeof document !== 'undefined' && (document as any).mozFullScreenElement) ||
        (typeof document !== 'undefined' && (document as any).msFullscreenElement)
      );
      setIsFullscreen(isFs);
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('fullscreenchange', handleFsChange);
      document.addEventListener('webkitfullscreenchange', handleFsChange);
      document.addEventListener('mozfullscreenchange', handleFsChange);
      document.addEventListener('MSFullscreenChange', handleFsChange);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('fullscreenchange', handleFsChange);
        document.removeEventListener('webkitfullscreenchange', handleFsChange);
        document.removeEventListener('mozfullscreenchange', handleFsChange);
        document.removeEventListener('MSFullscreenChange', handleFsChange);
      }
    };
  }, []);

  // Handler Tombol Full Screen Lanskap
  const toggleFullscreen = () => {
    playSound('click', soundEnabled);
    const elem = containerRef.current || (typeof document !== 'undefined' ? document.documentElement : null);
    if (!isFullscreen) {
      setIsFullscreen(true);
      if (elem) {
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(() => {});
        } else if ((elem as any).webkitRequestFullscreen) {
          (elem as any).webkitRequestFullscreen();
        } else if ((elem as any).mozRequestFullScreen) {
          (elem as any).mozRequestFullScreen();
        } else if ((elem as any).msRequestFullscreen) {
          (elem as any).msRequestFullscreen();
        }
      }
      try {
        if (
          typeof window !== 'undefined' &&
          typeof window.screen !== 'undefined' &&
          window.screen.orientation &&
          'lock' in window.screen.orientation
        ) {
          (window.screen.orientation as any).lock('landscape').catch(() => {});
        }
      } catch (_) {}
    } else {
      setIsFullscreen(false);
      if (typeof document !== 'undefined') {
        const doc = document as any;
        if (doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement) {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else if (doc.webkitExitFullscreen) {
            doc.webkitExitFullscreen();
          } else if (doc.mozCancelFullScreen) {
            doc.mozCancelFullScreen();
          } else if (doc.msExitFullscreen) {
            doc.msExitFullscreen();
          }
        }
      }
      try {
        if (
          typeof window !== 'undefined' &&
          typeof window.screen !== 'undefined' &&
          window.screen.orientation &&
          'unlock' in window.screen.orientation
        ) {
          (window.screen.orientation as any).unlock();
        }
      } catch (_) {}
    }
  };

  // Profil Pemain
  const [playerName, setPlayerName] = useState(defaultPlayerName);
  const [playerClass, setPlayerClass] = useState(defaultPlayerClass);
  const [playerAvatar, setPlayerAvatar] = useState('🧑💻');
  const [sessionCode, setSessionCode] = useState('');
  const [activeClassCode, setActiveClassCode] = useState('');

  // Progres Permainan
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1]);
  const [studiedFlashcards, setStudiedFlashcards] = useState<Record<number, boolean>>({});
  const [levelScores, setLevelScores] = useState<Record<number, any>>({});
  const [badges, setBadges] = useState<string[]>([]);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);

  // State Level Aktif & Flash Card
  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [fcIndex, setFcIndex] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);
  const [fcUnderstood, setFcUnderstood] = useState<Record<string, boolean>>({});

  // State Simulasi Spreadsheet
  const [gridData, setGridData] = useState<GridData>({});
  const [selectedCell, setSelectedCell] = useState('A1');
  const [selectedRange, setSelectedRange] = useState('');
  const [formulaInput, setFormulaInput] = useState('');
  const [lastClickedUI, setLastClickedUI] = useState('');
  const [tableActionLog, setTableActionLog] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState('ALL');

  // State Misi & Penilaian
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [taskAttempts, setTaskAttempts] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [showHintBox, setShowHintBox] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [levelScore, setLevelScore] = useState(0);
  const [levelMistakes, setLevelMistakes] = useState(0);
  const [levelStartTime, setLevelStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // State Fitur Baru Modal (Chart, Export, Tutor, Duel)
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isTutorModalOpen, setIsTutorModalOpen] = useState(false);
  const [isDuelModalOpen, setIsDuelModalOpen] = useState(false);
  const [activeChart, setActiveChart] = useState<ChartConfig | null>(null);

  // State Khusus Mode Guru IFP
  const [teacherTab, setTeacherTab] = useState<'DEMO' | 'FLASHCARD' | 'CHALLENGE' | 'RECAP' | 'ASSIGNMENT'>('DEMO');
  const [classTimerSec, setClassTimerSec] = useState(60);
  const [classTimerRunning, setClassTimerRunning] = useState(false);
  const [revealAnswer, setRevealAnswer] = useState(false);
  const [classVotes, setClassVotes] = useState({ A: 0, B: 0, C: 0, D: 0 });

  // State Penugasan Kelas & Gating Siswa
  const [assignmentLoading, setAssignmentLoading] = useState(true);
  const [isStudentAssigned, setIsStudentAssigned] = useState(false);
  const [studentAssignedClassName, setStudentAssignedClassName] = useState('');
  const [availableTeacherClasses, setAvailableTeacherClasses] = useState<{ id: string; name: string }[]>([]);
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>([]);
  const [assignedClassNames, setAssignedClassNames] = useState<string[]>([]);
  const [teacherInstructions, setTeacherInstructions] = useState('');
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [assignmentNotice, setAssignmentNotice] = useState<string | null>(null);

  // Ambil data penugasan kelas dari database
  const fetchAssignmentSettings = async () => {
    try {
      const res = await fetch('/api/excel-adventure/settings', {
        credentials: 'include'
      });
      const data = await res.json();
      if (data && data.success) {
        if (data.isTeacher) {
          setAvailableTeacherClasses(data.teacherClasses || []);
          if (data.config) {
            setAssignedClassIds(data.config.assignedClassIds || []);
            setAssignedClassNames(data.config.assignedClassNames || []);
            if (data.config.kkmScore) setKkmScore(data.config.kkmScore);
            if (data.config.instructions) setTeacherInstructions(data.config.instructions);
          }
        } else {
          setIsStudentAssigned(Boolean(data.isAssigned));
          setStudentAssignedClassName(data.studentClassName || defaultPlayerClass);
          if (data.studentClassName) {
            setPlayerClass(data.studentClassName);
          }
          if (data.kkmScore) setKkmScore(data.kkmScore);
        }
      }
    } catch (err) {
      console.error('Gagal mengambil konfigurasi Excel Adventure', err);
    } finally {
      setAssignmentLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentSettings();
  }, [defaultPlayerClass]);

  // Simpan penugasan kelas oleh guru
  const handleSaveTeacherAssignment = async () => {
    setAssignmentSaving(true);
    setAssignmentNotice(null);
    try {
      const res = await fetch('/api/excel-adventure/settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedClassIds,
          kkmScore,
          instructions: teacherInstructions,
          userRole: isTeacherUser ? 'TEACHER' : userRole,
          userName: playerName
        })
      });
      const data = await res.json();
      if (res.ok) {
        playSound('success', soundEnabled);
        setAssignmentNotice('✓ Penugasan kelas berhasil diperbarui!');
        await fetchAssignmentSettings();
        setTimeout(() => setAssignmentNotice(null), 3000);
      } else {
        alert(data.error || 'Gagal menyimpan penugasan kelas');
      }
    } catch (e) {
      alert('Terjadi kesalahan jaringan saat menyimpan penugasan.');
    } finally {
      setAssignmentSaving(false);
    }
  };

  const handleToggleClassAssignment = (classId: string) => {
    setAssignedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const handleSelectAllTeacherClasses = () => {
    const myIds = availableTeacherClasses.map((c) => c.id);
    const allSelected = myIds.every((id) => assignedClassIds.includes(id));
    if (allSelected) {
      setAssignedClassIds((prev) => prev.filter((id) => !myIds.includes(id)));
    } else {
      setAssignedClassIds((prev) => Array.from(new Set([...prev, ...myIds])));
    }
  };

  const currentLevel = useMemo(
    () => LEVELS_DATA.find((l) => l.id === currentLevelId) || LEVELS_DATA[0],
    [currentLevelId]
  );

  // Muat progres tersimpan di browser localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('excel_adventure_progress');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.playerName) setPlayerName(parsed.playerName);
        if (parsed.playerClass) setPlayerClass(parsed.playerClass);
        if (parsed.playerAvatar) setPlayerAvatar(parsed.playerAvatar);
        if (parsed.unlockedLevels) setUnlockedLevels(parsed.unlockedLevels);
        if (parsed.studiedFlashcards) setStudiedFlashcards(parsed.studiedFlashcards);
        if (parsed.levelScores) setLevelScores(parsed.levelScores);
        if (parsed.badges) setBadges(parsed.badges);
        if (parsed.historyLogs) setHistoryLogs(parsed.historyLogs);
      }
    } catch (e) {
      // Abaikan jika storage dinonaktifkan
    }
  }, []);

  const saveProgress = (extra = {}) => {
    try {
      const payload = {
        playerName,
        playerClass,
        playerAvatar,
        unlockedLevels,
        studiedFlashcards,
        levelScores,
        badges,
        historyLogs,
        ...extra
      };
      localStorage.setItem('excel_adventure_progress', JSON.stringify(payload));
    } catch (e) {
      // Abaikan
    }
  };

  // Timer bermain level
  useEffect(() => {
    if (screen !== 'GAME' || !levelStartTime) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - levelStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [screen, levelStartTime]);

  // Timer Tantangan Kelas di Mode Guru
  useEffect(() => {
    if (!classTimerRunning) return;
    if (classTimerSec <= 0) {
      setClassTimerRunning(false);
      playSound('success', soundEnabled);
      return;
    }
    const timer = setTimeout(() => setClassTimerSec((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [classTimerRunning, classTimerSec, soundEnabled]);

  // Inisialisasi ulang grid saat memasuki level
  const initLevelGrid = (levelObj: typeof currentLevel) => {
    const cloned = JSON.parse(JSON.stringify(levelObj.initialGrid || {}));
    setGridData(cloned);
    setSelectedCell('A1');
    setSelectedRange('');
    setFormulaInput(cloned['A1']?.value !== undefined ? String(cloned['A1'].value) : '');
    setCurrentTaskIndex(0);
    setTaskAttempts(0);
    setHintUsed(false);
    setShowHintBox(false);
    setFeedbackBanner(null);
    setLevelScore(0);
    setLevelMistakes(0);
    setLastClickedUI('');
    setTableActionLog([]);
    setActiveFilter('ALL');
    setActiveChart(null);
    setLevelStartTime(Date.now());
    setElapsedSeconds(0);
  };

  const handleSelectLevel = (lvlId: number) => {
    playSound('click', soundEnabled);
    setCurrentLevelId(lvlId);
    setFcIndex(0);
    setFcFlipped(false);
    setScreen('FLASHCARD');
  };

  const handleStartMissionFromFlashcard = () => {
    playSound('success', soundEnabled);
    const updatedStudied = { ...studiedFlashcards, [currentLevelId]: true };
    setStudiedFlashcards(updatedStudied);
    saveProgress({ studiedFlashcards: updatedStudied });
    initLevelGrid(currentLevel);
    setScreen('GAME');
  };

  const handleCellClick = (cellId: string) => {
    playSound('click', soundEnabled);
    setSelectedCell(cellId);
    setSelectedRange('');
    const rawVal = gridData[cellId]?.value !== undefined ? String(gridData[cellId].value) : '';
    setFormulaInput(rawVal);
    setLastClickedUI(`CELL_${cellId}`);
  };

  const handleCommitCellValue = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    playSound('click', soundEnabled);

    const trimmed = String(formulaInput).trim();
    if (trimmed.startsWith('=')) {
      const checkEval = evaluateFormula(trimmed, gridData);
      if (checkEval.error) {
        playSound('error', soundEnabled);
        setFeedbackBanner({
          type: 'error',
          message: `Petunjuk Rumus: ${checkEval.error}`
        });
      }
    }

    const existing = gridData[selectedCell] || { value: '', style: {} };
    const updatedGrid = {
      ...gridData,
      [selectedCell]: {
        ...existing,
        value: formulaInput
      }
    };
    setGridData(updatedGrid);
  };

  const handleToggleStyle = (key: keyof CellStyle, val?: any) => {
    playSound('click', soundEnabled);
    const existing = gridData[selectedCell] || { value: '', style: {} };
    const currentStyle = existing.style || {};
    const newVal = val !== undefined ? val : !currentStyle[key];

    const updatedGrid = {
      ...gridData,
      [selectedCell]: {
        ...existing,
        style: {
          ...currentStyle,
          [key]: newVal
        }
      }
    };
    setGridData(updatedGrid);
  };

  // FITUR BARU: AutoFill Bawah
  const handleAutoFillDown = (sourceId?: string) => {
    const src = sourceId || selectedCell;
    const col = src[0];
    const row = parseInt(src.slice(1), 10);
    if (row >= 10) return;

    playSound('success', soundEnabled);
    const targetCellId = `${col}${row + 1}`;
    const updated = executeAutoFill(src, [targetCellId], gridData);
    setGridData(updated);
    setSelectedCell(targetCellId);
    setFormulaInput(String(updated[targetCellId]?.value || ''));
    setFeedbackBanner({
      type: 'info',
      message: `AutoFill berhasil! Rumus/data di ${src} diduplikasi secara relatif ke ${targetCellId}.`
    });
  };

  // Fitur Sort Baris Tabel
  const handleSortTable = (colLetter: string, direction: 'ASC' | 'DESC' = 'DESC') => {
    playSound('click', soundEnabled);
    const rowIndices = [2, 3, 4, 5];
    const extractedRows = rowIndices
      .map((r) => {
        const rowObj: Record<string, any> = {};
        COLS.forEach((c) => {
          rowObj[c] = gridData[`${c}${r}`]
            ? JSON.parse(JSON.stringify(gridData[`${c}${r}`]))
            : { value: '', style: {} };
        });
        return rowObj;
      })
      .filter((rObj) => rObj['A']?.value || rObj['B']?.value || rObj['C']?.value);

    extractedRows.sort((a, b) => {
      const valA = a[colLetter]?.value || '';
      const valB = b[colLetter]?.value || '';
      const numA = Number(valA);
      const numB = Number(valB);
      if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
        return direction === 'ASC' ? numA - numB : numB - numA;
      }
      return direction === 'ASC'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    const newGrid = { ...gridData };
    extractedRows.forEach((rObj, idx) => {
      const targetRow = rowIndices[idx];
      COLS.forEach((c) => {
        newGrid[`${c}${targetRow}`] = rObj[c];
      });
    });

    setGridData(newGrid);
    const actionTag = `SORT_${colLetter}_${direction}`;
    setTableActionLog((prev) => [...prev, actionTag]);
    setFeedbackBanner({
      type: 'info',
      message: `Tabel diurutkan berdasarkan Kolom ${colLetter} (${
        direction === 'ASC' ? 'A-Z' : '9-0'
      }).`
    });
  };

  const handleFilterTable = (category: string) => {
    playSound('click', soundEnabled);
    setActiveFilter(category);
    setTableActionLog((prev) => [...prev, `FILTER_${category}`]);
    setFeedbackBanner({
      type: 'info',
      message:
        category === 'ALL'
          ? 'Menampilkan seluruh baris data.'
          : `Filter aktif: Hanya menampilkan kategori '${category}'.`
    });
  };

  // Validasi Misi Tugas
  const handleVerifyCurrentTask = () => {
    const task = currentLevel.tasks[currentTaskIndex];
    if (!task) return;

    let workingGrid = { ...gridData };
    if (selectedCell && formulaInput !== (gridData[selectedCell]?.value ?? '')) {
      const existing = workingGrid[selectedCell] || { value: '', style: {} };
      workingGrid[selectedCell] = { ...existing, value: formulaInput };
      setGridData(workingGrid);
    }

    let isCorrect = false;
    let failureReason = '';

    if (task.type === 'click_ui') {
      if (lastClickedUI === task.targetUI) isCorrect = true;
      else failureReason = `Kamu belum mengetuk bagian antarmuka yang diminta. ${task.hint}`;
    } else if (task.type === 'select_cell') {
      if (selectedCell === task.targetCell) isCorrect = true;
      else failureReason = `Saat ini sel aktif adalah ${selectedCell}, seharusnya ${task.targetCell}.`;
    } else if (task.type === 'select_range') {
      if (selectedRange.toUpperCase() === (task.targetRange || '').toUpperCase()) isCorrect = true;
      else failureReason = `Rentang ${task.targetRange} belum dipilih.`;
    } else if (task.type === 'cell_value') {
      const rawVal = String(workingGrid[task.targetCell || '']?.value || '').trim();
      if (rawVal.toLowerCase() === String(task.expectedValue).toLowerCase()) isCorrect = true;
      else failureReason = `Isi sel ${task.targetCell} saat ini adalah "${rawVal || 'Kosong'}", seharusnya "${task.expectedValue}".`;
    } else if (task.type === 'cell_style') {
      const st = workingGrid[task.targetCell || '']?.style || {};
      if (task.styleKey && st[task.styleKey] === task.expectedStyle) isCorrect = true;
      else failureReason = `Format visual pada sel ${task.targetCell} belum sesuai.`;
    } else if (task.type === 'cell_style_any_bg') {
      const st = workingGrid[task.targetCell || '']?.style || {};
      if (st.bg && st.bg !== 'transparent') isCorrect = true;
      else failureReason = `Sel ${task.targetCell} belum diberi warna latar (Highlight).`;
    } else if (task.type === 'create_chart') {
      if (activeChart && (!task.chartType || activeChart.type === task.chartType)) isCorrect = true;
      else failureReason = `Kamu belum memasang grafik ${task.chartType || 'diagram'} yang diminta. Buka menu '📊 Buat Grafik' pada Ribbon.`;
    } else if (task.type === 'formula_result') {
      const rawFormula = String(workingGrid[task.targetCell || '']?.value || '').trim();
      const computed = getComputedCellValue(task.targetCell || '', workingGrid);

      if (!rawFormula.startsWith('=')) {
        failureReason = `Sel ${task.targetCell} harus menggunakan RUMUS berawalan sama dengan (=)!`;
      } else if (task.expectedFunc && !rawFormula.toUpperCase().includes(task.expectedFunc)) {
        failureReason = `Gunakan fungsi ${task.expectedFunc} pada rumus di sel ${task.targetCell}!`;
      } else if (String(computed).toLowerCase() === String(task.expectedValue).toLowerCase()) {
        isCorrect = true;
      } else {
        failureReason = `Hasil rumusmu di sel ${task.targetCell} adalah "${computed}", seharusnya "${task.expectedValue}".`;
      }
    } else if (task.type === 'table_action') {
      if (tableActionLog.includes(task.expectedAction || '')) isCorrect = true;
      else failureReason = `Lakukan aksi tabel yang diminta pada toolbar Ribbon.`;
    }

    if (isCorrect) {
      playSound('success', soundEnabled);
      let earnedPoints = 100;
      if (hintUsed) earnedPoints = 60;
      else if (taskAttempts === 1) earnedPoints = 80;
      else if (taskAttempts >= 2) earnedPoints = 60;

      const newTotalScore = levelScore + earnedPoints;
      setLevelScore(newTotalScore);

      if (currentTaskIndex + 1 < currentLevel.tasks.length) {
        setFeedbackBanner({
          type: 'success',
          message: `Luar Biasa! Misi selesai (+${earnedPoints} Poin). Lanjut ke misi berikutnya!`
        });
        setCurrentTaskIndex((idx) => idx + 1);
        setTaskAttempts(0);
        setHintUsed(false);
        setShowHintBox(false);
      } else {
        completeCurrentLevel(newTotalScore);
      }
    } else {
      playSound('error', soundEnabled);
      setTaskAttempts((a) => a + 1);
      setLevelMistakes((m) => m + 1);
      setFeedbackBanner({
        type: 'error',
        message: `Belum Tepat: ${failureReason}`
      });
    }
  };

  const completeCurrentLevel = (finalRawPoints: number) => {
    const maxPossible = currentLevel.tasks.length * 100;
    const percentage = Math.round((finalRawPoints / maxPossible) * 100);
    const stars = levelMistakes === 0 ? 3 : percentage >= 80 ? 2 : 1;

    const updatedScores = {
      ...levelScores,
      [currentLevelId]: {
        score: percentage,
        rawPoints: finalRawPoints,
        stars,
        mistakes: levelMistakes,
        timeSec: elapsedSeconds,
        completedAt: new Date().toLocaleDateString('id-ID')
      }
    };

    const nextLevelId = currentLevelId + 1;
    const updatedUnlocked = [...unlockedLevels];
    if (nextLevelId <= LEVELS_DATA.length && !updatedUnlocked.includes(nextLevelId)) {
      updatedUnlocked.push(nextLevelId);
    }

    const updatedBadges = [...badges];
    if (!updatedBadges.includes(currentLevel.badgeName)) {
      updatedBadges.push(currentLevel.badgeName);
    }

    const newLog = {
      levelId: currentLevelId,
      levelTitle: currentLevel.title,
      score: percentage,
      stars,
      timeSec: elapsedSeconds,
      date: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
    const updatedHistory = [newLog, ...historyLogs.slice(0, 14)];

    setLevelScores(updatedScores);
    setUnlockedLevels(updatedUnlocked);
    setBadges(updatedBadges);
    setHistoryLogs(updatedHistory);

    saveProgress({
      levelScores: updatedScores,
      unlockedLevels: updatedUnlocked,
      badges: updatedBadges,
      historyLogs: updatedHistory
    });

    setScreen('RESULT');
  };

  const totalXP = useMemo(() => {
    const flashcardXP = Object.keys(studiedFlashcards).length * 50;
    const missionXP = Object.values(levelScores).reduce(
      (acc: number, item: any) => acc + (item.rawPoints || 0),
      0
    );
    return flashcardXP + missionXP;
  }, [studiedFlashcards, levelScores]);

  const totalStars = useMemo(() => {
    return Object.values(levelScores).reduce(
      (acc: number, item: any) => acc + (item.stars || 0),
      0
    );
  }, [levelScores]);

  // Fungsi Gulir Cepat untuk Layar Sentuh SmartBoard / IFP & Mobile Landscape
  const scrollToSpreadsheet = () => {
    playSound('click', soundEnabled);
    const el = document.getElementById('spreadsheet-workspace');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToMission = () => {
    playSound('click', soundEnabled);
    const el = document.getElementById('mission-instruction-banner');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Render Simulator Spreadsheet
  const renderSpreadsheet = (isTeacherDemo = false) => {
    const activeCellObj = gridData[selectedCell] || { value: '', style: {} };
    const activeStyle = activeCellObj.style || {};

    return (
      <div
        id="spreadsheet-workspace"
        className="bg-white text-slate-800 rounded-2xl shadow-xl border-2 border-emerald-600/30 overflow-hidden flex flex-col"
        style={{ fontSize: `${zoomScale * 100}%` }}
      >
        {/* Header Spreadsheet */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
            <span className="font-bold tracking-wide text-sm sm:text-base">
              Simulasi Spreadsheet Edukatif — {currentLevel.title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-900/60 px-2.5 py-1 rounded-full border border-emerald-400/30">
              Misi_Level_{currentLevelId}.xlsx (Simulasi)
            </span>
          </div>
        </div>

        {/* Toolbar Ribbon */}
        <RibbonToolbar
          activeStyle={activeStyle}
          currentLevelId={currentLevelId}
          activeFilter={activeFilter}
          isTeacherDemo={isTeacherDemo}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onToggleStyle={handleToggleStyle}
          onSelectRangeHelper={() => {
            playSound('click', soundEnabled);
            setSelectedRange('A1:D1');
            setFeedbackBanner({ type: 'info', message: 'Rentang sel A1:D1 berhasil dipilih!' });
          }}
          onSortTable={handleSortTable}
          onFilterTable={handleFilterTable}
          onOpenChartModal={() => setIsChartModalOpen(true)}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onOpenTutorModal={() => setIsTutorModalOpen(true)}
          onResetGrid={() => {
            playSound('click', soundEnabled);
            initLevelGrid(currentLevel);
          }}
          onRibbonClick={() => setLastClickedUI('RIBBON')}
        />

        {/* Formula Bar */}
        <FormulaBar
          selectedCell={selectedCell}
          selectedRange={selectedRange}
          formulaInput={formulaInput}
          setFormulaInput={setFormulaInput}
          onCommit={handleCommitCellValue}
          onSnippetClick={(snippet) => {
            playSound('click', soundEnabled);
            setFormulaInput((prev) => (prev.startsWith('=') ? prev + snippet.slice(1) : snippet));
          }}
          onNameBoxClick={() => setLastClickedUI('NAME_BOX')}
          onFormulaBarFocus={() => setLastClickedUI('FORMULA_BAR')}
          onAutoFillDown={handleAutoFillDown}
        />

        {/* Grid Spreadsheet */}
        <GridTable
          gridData={gridData}
          selectedCell={selectedCell}
          selectedRange={selectedRange}
          activeFilter={activeFilter}
          onCellClick={handleCellClick}
          onHeaderClick={(uiType) => {
            playSound('click', soundEnabled);
            setLastClickedUI(uiType);
          }}
          onAutoFillDown={handleAutoFillDown}
        />

        {/* Jika ada grafik terpasang, tampilkan di bawah grid */}
        {activeChart && (
          <div className="p-3 bg-slate-950 border-t border-slate-700">
            <InteractiveChart
              type={activeChart.type}
              title={activeChart.title}
              labelRange={activeChart.labelRange}
              valueRange={activeChart.valueRange}
              gridData={gridData}
            />
          </div>
        )}

        {/* Sheet Tab */}
        <div
          onClick={() => setLastClickedUI('SHEET_TAB')}
          className="bg-slate-200 border-t border-slate-300 px-3 py-1.5 flex items-center justify-between text-xs"
        >
          <div className="flex items-center gap-1">
            <div className="bg-white text-emerald-800 font-bold px-4 py-1.5 rounded-t-lg border-t-2 border-emerald-600 shadow-sm flex items-center gap-1.5 cursor-pointer">
              <span>Sheet1_Misi_{currentLevelId}</span>
            </div>
            <div className="text-slate-500 px-3 py-1.5 hover:bg-slate-300/60 rounded cursor-pointer">
              + Lembar Baru
            </div>
          </div>
          <div className="text-slate-600 font-mono hidden sm:block">
            Status: Siap | Sel Aktif: <strong className="text-emerald-800">{selectedCell}</strong>
          </div>
        </div>
      </div>
    );
  };

  // Top Nav Bar
  const renderNavbar = () => {
    if (screen === 'SPLASH') return null;

    return (
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 py-2 sm:py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          <div
            onClick={() => {
              playSound('click', soundEnabled);
              setScreen('HOME');
            }}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-600/20 group-hover:scale-105 transition shrink-0">
              <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm sm:text-base md:text-lg tracking-tight text-white">
                  EXCEL ADVENTURE
                </h1>
                <span
                  className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${
                    appMode === 'TEACHER'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {appMode === 'TEACHER' ? 'MODE GURU / IFP' : 'MODE SISWA'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden lg:block">
                Misi Ahli Spreadsheet • Pembelajaran Interaktif SMP & SMA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 overflow-x-auto py-0.5">
            {appMode === 'STUDENT' && (
              <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl text-xs sm:text-sm">
                <span className="text-lg">{playerAvatar}</span>
                <span className="font-bold text-white hidden md:inline">{playerName}</span>
                <span className="text-amber-400 font-bold flex items-center gap-1 ml-1">
                  <Zap className="w-4 h-4 fill-amber-400" /> {totalXP} XP
                </span>
                <span className="text-yellow-400 font-bold flex items-center gap-1 ml-1">
                  <Star className="w-4 h-4 fill-yellow-400" /> {totalStars}
                </span>
              </div>
            )}

            {/* Tombol Cepat Duel Kelas IFP */}
            <button
              type="button"
              onClick={() => setIsDuelModalOpen(true)}
              className="min-h-[44px] px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md"
              title="Mulai Duel Cerdas Cermat Kelas di Layar Sentuh"
            >
              <Swords className="w-4 h-4" />
              <span className="hidden sm:inline">Duel Kelas</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                setScreen(appMode === 'TEACHER' ? 'TEACHER_DASHBOARD' : 'MAP');
              }}
              className="min-h-[44px] px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 border border-slate-700"
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">
                {appMode === 'TEACHER' ? 'Panel Guru' : 'Peta Level'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                setScreen('ACHIEVEMENTS');
              }}
              className="min-h-[44px] px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 border border-slate-700"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Lencana</span>
            </button>

            {/* Tombol Full Screen Lanskap */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className={`min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition border shadow-sm ${
                isFullscreen
                  ? 'bg-amber-400 text-slate-950 border-amber-300 hover:bg-amber-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/40'
              }`}
              title={
                isFullscreen
                  ? 'Keluar dari Layar Penuh (ESC)'
                  : 'Mode Layar Penuh Lanskap (SmartBoard/IFP & Layar Sentuh)'
              }
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {isFullscreen ? 'Keluar Fullscreen' : 'Full Screen Lanskap'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="min-w-[44px] min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center justify-center border border-slate-700"
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-500" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                setScreen('SETTINGS');
              }}
              className="min-w-[44px] min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center justify-center border border-slate-700"
            >
              <Settings className="w-5 h-5 text-slate-300" />
            </button>
          </div>
        </div>
      </header>
    );
  };

  // 1. SPLASH SCREEN
  if (screen === 'SPLASH') {
    return (
      <div
        ref={containerRef}
        className={`relative bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white flex flex-col items-center justify-center p-4 sm:p-6 text-center ${
          isFullscreen
            ? 'fixed inset-0 z-[99999] w-screen h-screen min-h-[100dvh] max-h-[100dvh] overflow-y-auto overscroll-contain touch-pan-y'
            : 'min-h-screen w-full overflow-y-auto overscroll-contain'
        }`}
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y'
        }}
      >
        {/* Floating Tombol Fullscreen Lanskap */}
        <div className="sticky sm:absolute top-4 right-4 z-50 self-end mb-2 sm:mb-0">
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-2 transition border shadow-lg backdrop-blur-md ${
              isFullscreen
                ? 'bg-amber-400 text-slate-950 border-amber-300'
                : 'bg-slate-900/80 text-emerald-300 border-emerald-500/40 hover:bg-slate-800'
            }`}
            title="Layar Penuh Lanskap (Kunci Layar Sentuh SmartBoard / IFP & Tablet)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh Lanskap'}</span>
          </button>
        </div>

        <div className="my-auto max-w-xl w-full bg-slate-900/80 border border-emerald-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-600 mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/30 mb-6 animate-bounce">
            <FileSpreadsheet className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-widest">
            Game Edukasi Informatika SMP/SMA
          </span>
          <h1 className="text-3xl sm:text-5xl font-black mt-4 tracking-tight bg-gradient-to-r from-white via-emerald-200 to-teal-300 bg-clip-text text-transparent">
            EXCEL ADVENTURE
          </h1>
          <p className="text-lg sm:text-xl font-bold text-emerald-400 mt-1">
            Misi Ahli Spreadsheet
          </p>
          <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed">
            Kuasai antarmuka spreadsheet, pemformatan tabel, rumus matematika, fungsi statistik, logika, hingga visualisasi diagram interaktif!
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                playSound('success', soundEnabled);
                setScreen('HOME');
              }}
              className="flex-1 min-h-[58px] bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-base sm:text-lg rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition transform active:scale-95"
            >
              <Play className="w-5 h-5 fill-slate-950" /> MULAI PETUALANGAN
            </button>
            <button
              type="button"
              onClick={() => {
                toggleFullscreen();
                playSound('success', soundEnabled);
                setScreen('HOME');
              }}
              className="min-h-[58px] px-5 bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white font-bold text-xs sm:text-sm rounded-2xl border border-emerald-500/30 flex items-center justify-center gap-2 transition active:scale-95 shadow-md"
              title="Mulai langsung dalam mode Layar Penuh Lanskap untuk SmartBoard / IFP & Layar Sentuh"
            >
              <Maximize2 className="w-5 h-5" />
              <span>Full Screen Lanskap</span>
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400">
            <span>✓ Layar Sentuh IFP / SmartBoard</span>
            <span>•</span>
            <span>✓ AutoFill & Diagram SVG</span>
            <span>•</span>
            <span>✓ Ekspor .XLSX Riil</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 ${
        isFullscreen
          ? 'fixed inset-0 z-[99999] w-screen h-screen min-h-[100dvh] max-h-[100dvh] overflow-y-auto overscroll-contain touch-pan-y'
          : 'min-h-screen w-full overflow-y-auto overscroll-contain'
      }`}
      style={{
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y'
      }}
    >
      {renderNavbar()}

      <main className="flex-1 pb-24">
        {/* BERANDA */}
        {screen === 'HOME' && (
          <div className="max-w-6xl mx-auto p-4 sm:p-8">
            <div className="bg-gradient-to-r from-emerald-900/60 via-teal-900/50 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-10 mb-8 shadow-xl">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Selamat Datang Calon Excel Master
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mt-3">
                Pilih Mode Pembelajaranmu Hari Ini
              </h2>
              <p className="text-slate-300 mt-2 text-sm sm:text-base">
                Aplikasi ini mendukung pembelajaran klasikal di SmartBoard/IFP kelas maupun latihan mandiri oleh siswa di laptop/tablet masing-masing.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* Siswa */}
                <div
                  className={`border-2 rounded-2xl p-6 flex flex-col justify-between shadow-lg transition ${
                    !isTeacherUser && !assignmentLoading && !isStudentAssigned
                      ? 'bg-slate-900/60 border-slate-700/80 opacity-90'
                      : 'bg-slate-900/90 border-emerald-500/40 hover:border-emerald-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                        <User className="w-8 h-8" />
                      </div>
                      {!isTeacherUser && (
                        isStudentAssigned ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Ditugaskan ({studentAssignedClassName})
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" /> Belum Ditugaskan Guru
                          </span>
                        )
                      )}
                    </div>
                    <h3 className="text-xl font-black text-white">Mode Siswa — Belajar Mandiri</h3>
                    <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                      {!isTeacherUser && !isStudentAssigned
                        ? `Kelas Anda (${studentAssignedClassName || 'Kelas Siswa'}) belum dimasukkan ke daftar penugasan aktif oleh guru. Anda belum dapat memulai level latihan sebelum guru menugaskannya.`
                        : 'Pelajari Flash Card visual, selesaikan 10 Level petualangan bertahap, pasang diagram, gunakan AutoFill, raih XP, dan gelar Excel Master!'}
                    </p>
                  </div>

                  {!isTeacherUser && !isStudentAssigned ? (
                    <button
                      type="button"
                      onClick={() => {
                        playSound('error', soundEnabled);
                        alert(
                          `🔒 Modul Belum Ditugaskan!\n\nGuru mata pelajaran belum menugaskan game Excel Adventure untuk kelas Anda (${studentAssignedClassName || 'Kelas Siswa'}).\n\nSilakan konfirmasi ke guru Anda.`
                        );
                      }}
                      className="mt-6 w-full min-h-[54px] bg-slate-800 text-slate-400 font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-700 shadow cursor-not-allowed"
                    >
                      <Lock className="w-4 h-4" /> Belum Ditugaskan untuk Kelas Anda
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        playSound('click', soundEnabled);
                        setAppMode('STUDENT');
                        setScreen('PROFILE');
                      }}
                      className="mt-6 w-full min-h-[54px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl flex items-center justify-center gap-2 shadow-md transition"
                    >
                      Masuk sebagai Siswa <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Guru */}
                <div
                  className={`border-2 rounded-2xl p-6 flex flex-col justify-between shadow-lg transition ${
                    !isTeacherUser
                      ? 'bg-slate-900/40 border-slate-800 opacity-60'
                      : 'bg-slate-900/90 border-amber-500/40 hover:border-amber-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                        <Users className="w-8 h-8" />
                      </div>
                      {!isTeacherUser ? (
                        <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-bold border border-slate-700 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> Khusus Akun Guru
                        </span>
                      ) : (
                        assignedClassNames.length > 0 && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> {assignedClassNames.length} Kelas Aktif
                          </span>
                        )
                      )}
                    </div>
                    <h3 className="text-xl font-black text-white">Mode Guru — SmartBoard & Penugasan</h3>
                    <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                      Dirancang khusus untuk guru: atur penugasan ke kelas tertentu, demonstrasi di layar sentuh SmartBoard/IFP, tantangan timer kelas, dan mode turnamen duel 2 tim!
                    </p>
                  </div>

                  {!isTeacherUser ? (
                    <button
                      type="button"
                      disabled
                      className="mt-6 w-full min-h-[54px] bg-slate-800/80 text-slate-500 font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed border border-slate-800"
                    >
                      <Lock className="w-4 h-4" /> Hanya untuk Akun Guru
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        playSound('click', soundEnabled);
                        setAppMode('TEACHER');
                        setTeacherUnlockAll(true);
                        initLevelGrid(currentLevel);
                        setScreen('TEACHER_DASHBOARD');
                      }}
                      className="mt-6 w-full min-h-[54px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl flex items-center justify-center gap-2 shadow-md transition"
                    >
                      Buka Mode Guru (IFP) <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GATEKEEPER: TAMPILKAN LAYAR TERKUNCI JIKA SISWA BELUM DITUGASKAN OLEH GURU */}
        {!isTeacherUser && !assignmentLoading && !isStudentAssigned && screen !== 'SPLASH' && screen !== 'HOME' && (
          <div className="max-w-xl mx-auto p-4 sm:p-8 text-center animate-in fade-in duration-300">
            <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-5">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/40 mx-auto flex items-center justify-center shadow-lg">
                <Lock className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-white">
                Akses Excel Adventure Terkunci
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Modul ini belum ditugaskan oleh guru untuk kelas Anda (<strong>{studentAssignedClassName || 'Kelas Anda'}</strong>). Silakan hubungi bapak/ibu guru pengajar untuk menambahkan kelas Anda ke dalam penugasan game spreadsheet ini.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setScreen('HOME')}
                  className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700"
                >
                  Kembali ke Beranda Game
                </button>
                <a
                  href="/dashboard"
                  className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md"
                >
                  Kembali ke Dashboard Solusi Guru
                </a>
              </div>
            </div>
          </div>
        )}

        {/* PROFIL SISWA */}
        {screen === 'PROFILE' && (
          <div className="max-w-xl mx-auto p-4 sm:p-8">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <User className="w-6 h-6 text-emerald-400" /> Identitas Calon Ahli Spreadsheet
              </h2>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Pilih Avatar
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {['🧑💻', '👩🎓', '👨🎓', '🦸♂️', '🦸♀️', '🧙♂️', '🤖', '🦊'].map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setPlayerAvatar(av)}
                      className={`h-12 rounded-xl text-2xl flex items-center justify-center border-2 transition ${
                        playerAvatar === av
                          ? 'border-emerald-400 bg-emerald-500/20 scale-105'
                          : 'border-slate-700 bg-slate-800'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Nama</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full min-h-[46px] px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Kelas</label>
                  <input
                    type="text"
                    value={playerClass}
                    onChange={(e) => setPlayerClass(e.target.value)}
                    className="w-full min-h-[46px] px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  playSound('success', soundEnabled);
                  saveProgress({ playerName, playerClass, playerAvatar });
                  setScreen('MAP');
                }}
                className="w-full min-h-[54px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-base shadow-lg flex items-center justify-center gap-2"
              >
                Buka Peta 10 Level <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* PETA 10 LEVEL */}
        {screen === 'MAP' && (
          <div className="max-w-7xl mx-auto p-4 sm:p-8">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-8 flex flex-wrap items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-3xl">
                  {playerAvatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white">{playerName}</h2>
                    <span className="text-xs px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded-full border border-slate-700 font-bold">
                      Kelas {playerClass}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    10 Level Terstruktur • Flash Card & Simulasi Rumus Interaktif
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Level Tuntas</div>
                  <div className="text-lg font-black text-emerald-400">
                    {Object.keys(levelScores).length} / {LEVELS_DATA.length}
                  </div>
                </div>
                <div className="bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Total Bintang</div>
                  <div className="text-lg font-black text-yellow-400 flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400" /> {totalStars} / 30
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 10 Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {LEVELS_DATA.map((lvl) => {
                const isUnlocked = teacherUnlockAll || unlockedLevels.includes(lvl.id);
                const isStudied = !!studiedFlashcards[lvl.id];
                const scoreObj = levelScores[lvl.id];

                return (
                  <div
                    key={lvl.id}
                    className={`rounded-3xl border-2 p-5 flex flex-col justify-between transition relative overflow-hidden ${
                      isUnlocked
                        ? 'bg-slate-900 border-slate-700 hover:border-emerald-500 shadow-xl'
                        : 'bg-slate-900/40 border-slate-800/80 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black text-white bg-gradient-to-r ${lvl.color}`}>
                          LEVEL {lvl.id}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                scoreObj && scoreObj.stars >= s
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <h3 className="text-base font-black text-white leading-snug">{lvl.title}</h3>
                      <p className="text-[11px] text-slate-400 mt-1 min-h-[32px]">{lvl.subtitle}</p>

                      <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Flash Card:</span>
                          <span className={isStudied ? 'text-cyan-400 font-bold' : 'text-amber-400 font-semibold'}>
                            {isStudied ? '✓ Selesai' : 'Wajib'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Skor:</span>
                          <span className="text-emerald-400 font-bold">
                            {scoreObj ? `${scoreObj.score}%` : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      {isUnlocked ? (
                        <button
                          type="button"
                          onClick={() => handleSelectLevel(lvl.id)}
                          className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition"
                        >
                          <BookOpen className="w-3.5 h-3.5" /> Buka Misi
                        </button>
                      ) : (
                        <div className="w-full py-2.5 bg-slate-800 text-slate-500 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1 border border-slate-700">
                          <Lock className="w-3.5 h-3.5" /> Level {lvl.id - 1} Dahulu
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FLASHCARD SCREEN */}
        {screen === 'FLASHCARD' && (
          <div className="max-w-4xl mx-auto p-4 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Materi Pembelajaran Wajib • Level {currentLevelId}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Flash Card: {currentLevel.title}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-emerald-300">
                  Kartu {fcIndex + 1} dari {currentLevel.flashcards.length}
                </span>
                <button
                  type="button"
                  onClick={() => setScreen(appMode === 'TEACHER' ? 'TEACHER_DASHBOARD' : 'MAP')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Kembali
                </button>
              </div>
            </div>

            {/* Kartu Flip */}
            <div
              onClick={() => {
                playSound('flip', soundEnabled);
                setFcFlipped(!fcFlipped);
              }}
              className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/60 border-2 border-emerald-500/40 hover:border-emerald-400 rounded-3xl p-6 sm:p-10 min-h-[360px] flex flex-col justify-between cursor-pointer shadow-2xl transition"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
                  {fcFlipped ? 'PENJELASAN & CONTOH' : 'KONSEP & PERTANYAAN'}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1.5 font-semibold">
                  <RefreshCw className="w-4 h-4 text-emerald-400" /> Ketuk untuk Membalik
                </span>
              </div>

              <div className="my-6 text-center space-y-4">
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {currentLevel.flashcards[fcIndex]?.term}
                </h3>

                <div className="flex justify-center">
                  <FlashcardVisual type={currentLevel.flashcards[fcIndex]?.visualType || ''} />
                </div>

                {!fcFlipped ? (
                  <div className="max-w-2xl mx-auto bg-slate-800/70 border border-slate-700 rounded-2xl p-4">
                    <p className="text-base text-amber-200 font-semibold">
                      “{currentLevel.flashcards[fcIndex]?.frontQuestion}”
                    </p>
                    <p className="text-xs text-emerald-400 mt-2 font-bold uppercase">
                      👆 Ketuk kartu ini untuk melihat penjelasannya!
                    </p>
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto space-y-3 text-left bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4">
                    <p className="text-sm text-slate-100 whitespace-pre-line leading-relaxed">
                      {currentLevel.flashcards[fcIndex]?.explanation}
                    </p>
                    <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-3 text-xs text-emerald-300 font-mono">
                      <strong>💡 Contoh:</strong> {currentLevel.flashcards[fcIndex]?.example}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
                <span>Pelajari seluruh kartu sebelum membuka misi praktik</span>
              </div>
            </div>

            {/* Navigasi Kartu */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                disabled={fcIndex === 0}
                onClick={() => {
                  playSound('click', soundEnabled);
                  setFcIndex((i) => Math.max(0, i - 1));
                  setFcFlipped(false);
                }}
                className="min-h-[50px] px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold flex items-center gap-1.5"
              >
                <ChevronLeft className="w-5 h-5" /> Sebelumnya
              </button>

              <div className="flex items-center gap-3">
                {fcIndex < currentLevel.flashcards.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', soundEnabled);
                      setFcIndex((i) => i + 1);
                      setFcFlipped(false);
                    }}
                    className="min-h-[50px] px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center gap-1.5 shadow"
                  >
                    Kartu Berikutnya <ChevronRight className="w-5 h-5" />
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={handleStartMissionFromFlashcard}
                  className="min-h-[50px] px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black flex items-center gap-2 shadow-xl"
                >
                  <Play className="w-5 h-5 fill-slate-950" /> Mulai Misi Level {currentLevelId}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GAME SCREEN */}
        {screen === 'GAME' && (
          <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4">
            {/* Bar Level Info */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-xl text-xs font-black text-white bg-gradient-to-r ${currentLevel.color}`}>
                  LEVEL {currentLevelId}
                </span>
                <div>
                  <h2 className="font-black text-white text-base sm:text-lg">{currentLevel.title}</h2>
                  <p className="text-xs text-slate-400">
                    Misi {currentTaskIndex + 1} dari {currentLevel.tasks.length}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>{elapsedSeconds} dtk</span>
                </div>
                <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Skor: {levelScore}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTutorModalOpen(true)}
                  className="min-h-[42px] px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" /> Tanya Tutor AI
                </button>
              </div>
            </div>

            {/* Banner Misi Aktif & Tombol Periksa */}
            <div id="mission-instruction-banner" className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-900 border-2 border-emerald-500/50 rounded-2xl p-4 sm:p-5 shadow-lg">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-black text-xs uppercase">
                      Instruksi Misi {currentTaskIndex + 1}
                    </span>
                    <span className="text-xs text-slate-400">
                      (Percobaan ke-{taskAttempts + 1})
                    </span>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-white leading-snug">
                    {currentLevel.tasks[currentTaskIndex]?.instruction}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', soundEnabled);
                      setHintUsed(true);
                      setShowHintBox(!showHintBox);
                    }}
                    className="min-h-[48px] px-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-4 h-4" /> Petunjuk
                  </button>

                  <button
                    type="button"
                    onClick={handleVerifyCurrentTask}
                    className="min-h-[48px] px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-sm sm:text-base flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition"
                  >
                    <CheckCircle className="w-5 h-5" /> Periksa Misi
                  </button>
                </div>
              </div>

              {showHintBox && (
                <div className="mt-3 bg-amber-950/60 border border-amber-500/40 rounded-xl p-3 text-xs sm:text-sm text-amber-200 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Petunjuk:</strong> {currentLevel.tasks[currentTaskIndex]?.hint}
                  </div>
                </div>
              )}

              {feedbackBanner && (
                <div
                  className={`mt-3 rounded-xl p-3 text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 border ${
                    feedbackBanner.type === 'success'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                      : feedbackBanner.type === 'error'
                      ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                      : 'bg-indigo-950/80 border-indigo-500 text-indigo-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {feedbackBanner.type === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : feedbackBanner.type === 'error' ? (
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
                    )}
                    <span>{feedbackBanner.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeedbackBanner(null)}
                    className="text-xs underline opacity-80 hover:opacity-100"
                  >
                    Tutup
                  </button>
                </div>
              )}
            </div>

            {/* Komponen Spreadsheet */}
            {renderSpreadsheet(false)}

            {/* Tombol Floating Navigasi Naik/Turun & Fullscreen Lanskap */}
            <div className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-40 flex items-center gap-1.5 p-1.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl backdrop-blur-md shadow-2xl">
              <button
                type="button"
                onClick={scrollToMission}
                className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold flex items-center gap-1 border border-slate-700 shadow-sm transition active:scale-95"
                title="Gulir Cepat ke Atas (Instruksi Misi)"
              >
                <ChevronUp className="w-4 h-4" />
                <span className="hidden sm:inline">Ke Misi</span>
              </button>
              <button
                type="button"
                onClick={scrollToSpreadsheet}
                className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold flex items-center gap-1 border border-slate-700 shadow-sm transition active:scale-95"
                title="Gulir Cepat ke Bawah (Lembar Kerja Spreadsheet)"
              >
                <ChevronDown className="w-4 h-4" />
                <span className="hidden sm:inline">Ke Tabel</span>
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                className={`min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition border shadow-sm ${
                  isFullscreen
                    ? 'bg-amber-400 text-slate-950 border-amber-300 hover:bg-amber-300'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/40'
                }`}
                title={isFullscreen ? 'Keluar Fullscreen (ESC)' : 'Mode Layar Penuh Lanskap'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{isFullscreen ? 'Keluar' : 'Lanskap'}</span>
              </button>
            </div>
          </div>
        )}

        {/* RESULT EVALUATION */}
        {screen === 'RESULT' && (
          <div className="max-w-2xl mx-auto p-4 sm:p-8 text-center">
            <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl">
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-12 h-12 ${
                      levelScores[currentLevelId]?.stars >= s
                        ? 'text-yellow-400 fill-yellow-400 animate-bounce'
                        : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase">
                Evaluasi Level {currentLevelId} Selesai
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                {currentLevelId === LEVELS_DATA.length
                  ? '🎉 SELAMAT! GELAR EXCEL MASTER DIRAIH!'
                  : `Misi ${currentLevel.title} Tuntas!`}
              </h2>
              <p className="text-slate-300 text-sm mt-2">
                Lencana: <strong className="text-amber-400">{currentLevel.badgeName}</strong>
              </p>

              <div className="grid grid-cols-3 gap-3 my-6">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                  <div className="text-xs text-slate-400">Skor</div>
                  <div className="text-2xl font-black text-emerald-400">
                    {levelScores[currentLevelId]?.score}%
                  </div>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                  <div className="text-xs text-slate-400">Waktu</div>
                  <div className="text-2xl font-black text-cyan-400">
                    {levelScores[currentLevelId]?.timeSec} dtk
                  </div>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                  <div className="text-xs text-slate-400">Status KKM</div>
                  <div className="text-lg font-black text-amber-400">
                    {levelScores[currentLevelId]?.score >= kkmScore ? 'KOMPETEN' : 'REMEDIAL'}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectLevel(currentLevelId)}
                  className="min-h-[50px] px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm flex items-center gap-2 border border-slate-700"
                >
                  <RotateCcw className="w-4 h-4" /> Ulangi Level
                </button>
                <button
                  type="button"
                  onClick={() => setScreen('MAP')}
                  className="min-h-[50px] px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-sm flex items-center gap-2 border border-slate-700"
                >
                  <Compass className="w-4 h-4" /> Peta Level
                </button>
                {currentLevelId < LEVELS_DATA.length && (
                  <button
                    type="button"
                    onClick={() => handleSelectLevel(currentLevelId + 1)}
                    className="min-h-[50px] px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg"
                  >
                    Lanjut Level {currentLevelId + 1} <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ACHIEVEMENTS */}
        {screen === 'ACHIEVEMENTS' && (
          <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <Trophy className="w-7 h-7 text-amber-400" /> Koleksi Lencana & Riwayat
                </h2>
                <p className="text-slate-400 text-sm mt-1">10 Lencana Keterampilan Spreadsheet</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {LEVELS_DATA.map((lvl) => {
                const earned = badges.includes(lvl.badgeName);
                return (
                  <div
                    key={lvl.id}
                    className={`p-4 rounded-2xl border text-center transition ${
                      earned
                        ? 'bg-slate-900 border-amber-500/50 shadow-md'
                        : 'bg-slate-900/40 border-slate-800 opacity-50'
                    }`}
                  >
                    <Award className={`w-8 h-8 mx-auto mb-2 ${earned ? 'text-amber-400' : 'text-slate-600'}`} />
                    <div className="font-black text-white text-xs">{lvl.badgeName}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">L{lvl.id}: {lvl.title}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TEACHER DASHBOARD (SMARTBOARD / IFP) */}
        {screen === 'TEACHER_DASHBOARD' && (
          <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-5">
            <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border-2 border-amber-500/40 rounded-3xl p-4 sm:p-5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                    MODE GURU • SMARTBOARD / IFP
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                    Pusat Kendali Demonstrasi & Turnamen Kelas
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-300 mr-1">Level:</span>
                  {LEVELS_DATA.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        playSound('click', soundEnabled);
                        setCurrentLevelId(l.id);
                        initLevelGrid(l);
                      }}
                      className={`min-w-[42px] min-h-[42px] px-2 rounded-xl font-black text-xs transition border ${
                        currentLevelId === l.id
                          ? 'bg-amber-500 text-slate-950 border-amber-300 shadow scale-105'
                          : 'bg-slate-800 text-slate-200 border-slate-700'
                      }`}
                    >
                      L{l.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-menu Guru */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-4 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTeacherTab('DEMO')}
                  className={`min-h-[50px] px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 ${
                    teacherTab === 'DEMO' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" /> A. Demonstrasi
                </button>
                <button
                  type="button"
                  onClick={() => setTeacherTab('FLASHCARD')}
                  className={`min-h-[50px] px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 ${
                    teacherTab === 'FLASHCARD' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  <BookOpen className="w-4 h-4" /> B. Flash Card
                </button>
                <button
                  type="button"
                  onClick={() => setTeacherTab('CHALLENGE')}
                  className={`min-h-[50px] px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 ${
                    teacherTab === 'CHALLENGE' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  <Clock className="w-4 h-4" /> C. Soal & Timer
                </button>
                <button
                  type="button"
                  onClick={() => setIsDuelModalOpen(true)}
                  className="min-h-[50px] px-3.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow"
                >
                  <Swords className="w-4 h-4" /> D. Duel Cerdas
                </button>
                <button
                  type="button"
                  onClick={() => setTeacherTab('ASSIGNMENT')}
                  className={`min-h-[50px] px-3.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 col-span-2 sm:col-span-1 border ${
                    teacherTab === 'ASSIGNMENT'
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                      : 'bg-slate-800 text-amber-300 border-amber-500/30 hover:bg-slate-700'
                  }`}
                >
                  <Users className="w-4 h-4" /> E. 🎯 Penugasan Kelas
                </button>
              </div>
            </div>

            {teacherTab === 'DEMO' && (
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-white">
                      Demonstrasi: Level {currentLevelId} — {currentLevel.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-300 font-bold">Skala Zoom IFP:</span>
                    {[
                      { label: '100%', val: 1 },
                      { label: '115%', val: 1.15 },
                      { label: '125%', val: 1.25 }
                    ].map((z) => (
                      <button
                        key={z.label}
                        type="button"
                        onClick={() => setZoomScale(z.val)}
                        className={`min-h-[40px] px-3 rounded-lg text-xs font-bold ${
                          zoomScale === z.val ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {z.label}
                      </button>
                    ))}
                  </div>
                </div>
                {renderSpreadsheet(true)}
              </div>
            )}

            {teacherTab === 'FLASHCARD' && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4">
                <FlashcardVisual type={currentLevel.flashcards[0]?.visualType || ''} />
                <div className="mt-4 text-center">
                  <h4 className="text-lg font-black text-white">{currentLevel.flashcards[0]?.term}</h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl mx-auto">
                    {currentLevel.flashcards[0]?.explanation}
                  </p>
                </div>
              </div>
            )}

            {teacherTab === 'CHALLENGE' && (
              <div className="space-y-4">
                <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-xs font-bold text-indigo-400">
                        Soal Kelas • {currentLevel.title}
                      </span>
                      <h3 className="text-lg font-black text-white mt-1">
                        {currentLevel.tasks[currentTaskIndex]?.instruction}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-2 rounded-2xl">
                      <span className="text-2xl font-mono font-black text-amber-400 px-3">
                        {classTimerSec}s
                      </span>
                      <button
                        type="button"
                        onClick={() => setClassTimerRunning(!classTimerRunning)}
                        className="px-3 py-2 bg-emerald-500 text-slate-950 font-black rounded-xl text-xs"
                      >
                        {classTimerRunning ? 'Jeda' : 'Mulai'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRevealAnswer(!revealAnswer)}
                      className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" /> {revealAnswer ? 'Tutup Kunci' : 'Ungkap Kunci Jawaban'}
                    </button>
                  </div>

                  {revealAnswer && (
                    <div className="mt-3 p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs">
                      <strong>Kunci:</strong> {currentLevel.tasks[currentTaskIndex]?.hint} (Target: {String(currentLevel.tasks[currentTaskIndex]?.expectedValue || '')})
                    </div>
                  )}
                </div>
                {renderSpreadsheet(true)}
              </div>
            )}

            {teacherTab === 'ASSIGNMENT' && (
              <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-500/30">
                      Kendali Hak Akses Siswa
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                      Penugasan Game Excel Adventure ke Kelas Tertentu
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Game ini hanya akan terbuka untuk siswa pada kelas yang Anda centang di bawah. Kelas yang tidak dicentang akan otomatis terkunci.
                    </p>
                  </div>

                  {assignmentNotice && (
                    <div className="px-4 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-bold animate-in fade-in">
                      {assignmentNotice}
                    </div>
                  )}
                </div>

                {/* Daftar Kelas */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                      Pilih Kelas Ajar Anda yang Ditugaskan:
                    </label>
                    {availableTeacherClasses.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSelectAllTeacherClasses}
                        className="text-xs text-amber-400 hover:text-amber-300 font-bold"
                      >
                        Pilih / Batal Semua Kelas Saya
                      </button>
                    )}
                  </div>

                  {availableTeacherClasses.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-center text-xs text-slate-400">
                      Tidak ada kelas yang terhubung dengan akun guru Anda. Hubungi administrator jika kelas Anda belum didaftarkan.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {availableTeacherClasses.map((cls) => {
                        const isChecked = assignedClassIds.includes(cls.id);
                        return (
                          <button
                            key={cls.id}
                            type="button"
                            onClick={() => handleToggleClassAssignment(cls.id)}
                            className={`p-4 rounded-2xl border text-left text-xs font-bold transition flex items-center justify-between ${
                              isChecked
                                ? 'bg-amber-950/70 border-amber-400 text-amber-200 shadow-md scale-[1.02]'
                                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            <span>{cls.name}</span>
                            <span
                              className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-black ${
                                isChecked ? 'bg-amber-400 text-slate-950' : 'border border-slate-500'
                              }`}
                            >
                              {isChecked ? '✓' : ''}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Target Nilai KKM & Petunjuk */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Target Nilai KKM Minimal:
                    </label>
                    <input
                      type="number"
                      min={50}
                      max={100}
                      value={kkmScore}
                      onChange={(e) => setKkmScore(Number(e.target.value) || 75)}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Siswa dinyatakan tuntas jika mencapai skor minimal KKM ini.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Instruksi Khusus untuk Siswa:
                    </label>
                    <input
                      type="text"
                      value={teacherInstructions}
                      onChange={(e) => setTeacherInstructions(e.target.value)}
                      placeholder="Contoh: Selesaikan latihan Level 1 s.d. Level 5"
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-amber-400 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Pesan instruksi akan tampil di bagian atas layar siswa.
                    </p>
                  </div>
                </div>

                {/* Simpan Penugasan */}
                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs text-slate-400">
                    <strong>Kelas Aktif Saat Ini:</strong>{' '}
                    {assignedClassNames.length > 0 ? (
                      <span className="text-emerald-400 font-bold">{assignedClassNames.join(', ')}</span>
                    ) : (
                      <span className="text-amber-400 font-bold">Belum ada kelas yang ditugaskan</span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={assignmentSaving}
                    onClick={handleSaveTeacherAssignment}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition transform active:scale-95"
                  >
                    {assignmentSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Simpan Perubahan Penugasan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SETTINGS */}
        {screen === 'SETTINGS' && (
          <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Settings className="w-6 h-6 text-emerald-400" /> Pengaturan Game & Kelas
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-800/70 border border-slate-700 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-sm">Efek Suara Audio</div>
                    <div className="text-xs text-slate-400">Suara klik, sukses, buzzer, dan flip kartu</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`px-4 py-2 rounded-xl font-bold text-xs ${
                      soundEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {soundEnabled ? 'Aktif' : 'Mati'}
                  </button>
                </div>

                <div className="bg-slate-800/70 border border-slate-700 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-sm">Buka Seluruh 10 Level</div>
                    <div className="text-xs text-slate-400">Kontrol guru untuk akses langsung materi</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTeacherUnlockAll(!teacherUnlockAll)}
                    className={`px-4 py-2 rounded-xl font-bold text-xs ${
                      teacherUnlockAll ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {teacherUnlockAll ? 'Terbuka' : 'Bertahap'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL-MODAL FITUR BARU */}
      <ChartModal
        isOpen={isChartModalOpen}
        onClose={() => setIsChartModalOpen(false)}
        gridData={gridData}
        onApplyChart={(cfg) => {
          setActiveChart(cfg);
          playSound('success', soundEnabled);
          setFeedbackBanner({
            type: 'success',
            message: `Grafik ${cfg.type.toUpperCase()} '${cfg.title}' berhasil disematkan pada lembar kerja!`
          });
        }}
      />

      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        gridData={gridData}
        levelTitle={currentLevel.title}
        onImportSuccess={(imported) => {
          setGridData(imported);
          playSound('success', soundEnabled);
        }}
      />

      <SocraticTutorModal
        isOpen={isTutorModalOpen}
        onClose={() => setIsTutorModalOpen(false)}
        currentTask={currentLevel.tasks[currentTaskIndex]}
        currentFormulaInput={formulaInput}
        selectedCell={selectedCell}
      />

      <ClassroomDuelModal
        isOpen={isDuelModalOpen}
        onClose={() => setIsDuelModalOpen(false)}
        soundEnabled={soundEnabled}
      />
    </div>
  );
}
