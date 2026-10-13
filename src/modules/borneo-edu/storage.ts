import { PlayerState, TeacherConfig, QuestionItem, RecapStudentRow } from './types';
import { DEFAULT_QUESTIONS } from './defaultQuestions';

export const DEFAULT_TEACHER_CONFIG: TeacherConfig = {
  teacherPin: 'guru123',
  weightAccuracy: 60,
  weightLevel: 25,
  weightBoss: 15,
  timeEasy: 30,
  timeMedium: 20,
  timeHard: 15,
  timeBoss: 30,
  allowLevelReplay: true,
  badgeBronzeLevels: 25,
  badgeSilverScore: 2000,
  badgeGoldScore: 3000,
  badgeGoldAccuracy: 85,
  badgeSuperScore: 4000,
  badgeSuperCombo: 5,
  soundEnabled: true
};

const STORAGE_KEY_PLAYER = 'borneo_edu_player_state_v1';
const STORAGE_KEY_CONFIG = 'borneo_edu_teacher_config_v1';
const STORAGE_KEY_QUESTIONS = 'borneo_edu_questions_v1';
const STORAGE_KEY_RECORDS = 'borneo_edu_records_v1';

export function calculateFinalScore(
  accuracy: number,
  completedLevelsCount: number,
  bossesDefeated: number,
  config: TeacherConfig = DEFAULT_TEACHER_CONFIG
): number {
  const percLevel = (Math.min(completedLevelsCount, 25) / 25) * 100;
  const percBoss = (Math.min(bossesDefeated, 5) / 5) * 100;

  const wAcc = config.weightAccuracy / 100;
  const wLev = config.weightLevel / 100;
  const wBos = config.weightBoss / 100;

  const score = (wAcc * accuracy) + (wLev * percLevel) + (wBos * percBoss);
  return Math.round(Math.min(100, Math.max(0, score)));
}

export function evaluateBadges(
  state: {
    completedLevels: number[];
    score: number;
    accuracy: number;
    highestCombo: number;
    bossesDefeated: number;
  },
  config: TeacherConfig = DEFAULT_TEACHER_CONFIG
): string[] {
  const badges: string[] = [];
  const count = state.completedLevels.length;

  if (count >= config.badgeBronzeLevels) {
    badges.push('BRONZE LEARNER');
  }

  if (count >= config.badgeBronzeLevels && state.score >= config.badgeSilverScore) {
    badges.push('SILVER LEARNER');
  }

  if (
    count >= config.badgeBronzeLevels &&
    state.score >= config.badgeGoldScore &&
    state.accuracy >= config.badgeGoldAccuracy
  ) {
    badges.push('GOLD LEARNER');
  }

  if (
    state.bossesDefeated >= 5 &&
    state.score >= config.badgeSuperScore &&
    state.highestCombo >= config.badgeSuperCombo
  ) {
    badges.push('SUPER LEARNER');
  }

  return badges;
}

export function createInitialPlayerState(
  name: string = 'Siswa Petualang',
  className: string = 'Kelas 7A',
  studentNumber: string = '01',
  subject: string = 'Informatika & Sains',
  materi: string = 'Petualangan Borneo Edu'
): PlayerState {
  return {
    studentName: name,
    studentNumber,
    className,
    subject,
    materi,
    lives: 3,
    coins: 0,
    score: 0,
    combo: 0,
    highestCombo: 0,
    currentWorld: 1,
    currentLevel: 1,
    completedLevels: [],
    completedWorlds: 0,
    bossesDefeated: 0,
    correctCount: 0,
    wrongCount: 0,
    powerUps: {
      mushroom: 0,
      hintFlower: 0,
      superStar: 0,
      shield: 0
    },
    starBoostCount: 0,
    shieldActive: false,
    badges: [],
    questionHistory: [],
    gameStatus: 'Sedang Berjalan',
    checkpointScore: 0,
    checkpointCoins: 0,
    lastUpdated: new Date().toISOString()
  };
}

// Local Storage helpers
export function getSavedPlayerState(): PlayerState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLAYER);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const initial = createInitialPlayerState();
    return {
      ...initial,
      ...parsed,
      powerUps: {
        ...initial.powerUps,
        ...(parsed.powerUps || {})
      },
      badges: Array.isArray(parsed.badges) ? parsed.badges : initial.badges,
      completedLevels: Array.isArray(parsed.completedLevels) ? parsed.completedLevels : initial.completedLevels,
      questionHistory: Array.isArray(parsed.questionHistory) ? parsed.questionHistory : initial.questionHistory
    };
  } catch (e) {
    console.error('Error loading player state:', e);
    return null;
  }
}

export function savePlayerStateToLocal(state: PlayerState): void {
  if (typeof window === 'undefined') return;
  try {
    state.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY_PLAYER, JSON.stringify(state));
    
    // Also update/sync locally to records list
    saveRecordLocally(state);
  } catch (e) {
    console.error('Error saving player state:', e);
  }
}

export function getSavedConfig(): TeacherConfig {
  if (typeof window === 'undefined') return DEFAULT_TEACHER_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) return DEFAULT_TEACHER_CONFIG;
    return { ...DEFAULT_TEACHER_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_TEACHER_CONFIG;
  }
}

export function saveTeacherConfigToLocal(cfg: TeacherConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(cfg));
  } catch (e) {
    console.error('Error saving teacher config:', e);
  }
}

export function getStoredQuestions(): QuestionItem[] {
  if (typeof window === 'undefined') return DEFAULT_QUESTIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUESTIONS);
    if (!raw) return DEFAULT_QUESTIONS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Error parsing stored questions:', e);
  }
  return DEFAULT_QUESTIONS;
}

export function saveStoredQuestions(questions: QuestionItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(questions));
  } catch (e) {
    console.error('Error saving questions:', e);
  }
}

export function saveRecordLocally(state: PlayerState): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECORDS);
    let records: PlayerState[] = raw ? JSON.parse(raw) : [];

    // Find if student with same name/number exists
    const idx = records.findIndex(
      (r) => r.studentName.toLowerCase() === state.studentName.toLowerCase() &&
             r.studentNumber === state.studentNumber
    );

    if (idx >= 0) {
      records[idx] = state;
    } else {
      records.unshift(state);
    }

    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving record locally:', e);
  }
}

export function getLocalRecords(): PlayerState[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECORDS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Convert state to recap table format
export function formatToRecapRow(state: PlayerState, config: TeacherConfig): RecapStudentRow {
  const totalQuestions = state.correctCount + state.wrongCount;
  const accuracy = totalQuestions > 0 ? Math.round((state.correctCount / totalQuestions) * 100) : 0;
  const finalScore = calculateFinalScore(accuracy, state.completedLevels.length, state.bossesDefeated, config);

  const highestBadge = state.badges.includes('SUPER LEARNER')
    ? '🏆 SUPER LEARNER'
    : state.badges.includes('GOLD LEARNER')
    ? '🥇 GOLD LEARNER'
    : state.badges.includes('SILVER LEARNER')
    ? '🥈 SILVER LEARNER'
    : state.badges.includes('BRONZE LEARNER')
    ? '🥉 BRONZE LEARNER'
    : '-';

  return {
    studentName: state.studentName,
    studentNumber: state.studentNumber,
    className: state.className,
    subject: state.subject,
    materi: state.materi,
    highestLevel: state.currentLevel,
    completedLevelsCount: state.completedLevels.length,
    completedWorlds: state.completedWorlds,
    totalScore: state.score,
    totalCoins: state.coins,
    correctCount: state.correctCount,
    wrongCount: state.wrongCount,
    totalQuestions,
    accuracy,
    highestCombo: state.highestCombo,
    bossesDefeated: state.bossesDefeated,
    badgeText: highestBadge,
    finalScore,
    gameStatus: state.gameStatus,
    updatedAt: state.lastUpdated ? new Date(state.lastUpdated).toLocaleString('id-ID') : '-'
  };
}

// Export All Data JSON
export function exportAllDataJson(): string {
  const player = getSavedPlayerState();
  const config = getSavedConfig();
  const questions = getStoredQuestions();
  const records = getLocalRecords();

  const exportPayload = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    player,
    config,
    questions,
    records
  };

  return JSON.stringify(exportPayload, null, 2);
}

// Import All Data JSON
export function importAllDataJson(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (data.config) saveTeacherConfigToLocal(data.config);
    if (data.questions && Array.isArray(data.questions)) saveStoredQuestions(data.questions);
    if (data.records && Array.isArray(data.records)) {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(data.records));
    }
    if (data.player) savePlayerStateToLocal(data.player);
    return true;
  } catch (e) {
    console.error('Import error:', e);
    return false;
  }
}

// Reset data
export function resetSystemData(pin: string): boolean {
  const config = getSavedConfig();
  if (pin !== config.teacherPin) {
    return false;
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_PLAYER);
    localStorage.removeItem(STORAGE_KEY_RECORDS);
    localStorage.removeItem(STORAGE_KEY_QUESTIONS);
  }
  return true;
}
