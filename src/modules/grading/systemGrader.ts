/**
 * System Grader — Pencocokan Jawaban Deterministik (Tanpa AI)
 * 
 * Modul ini menangani penilaian soal objektif:
 * - PILIHAN_GANDA: Exact match huruf (A-E)
 * - BENAR_SALAH: Exact match Benar/Salah
 * - PILIHAN_GANDA_KOMPLEKS: Set comparison multi-jawaban (A,C,E)
 * 
 * AI tetap digunakan untuk OCR (membaca tulisan tangan).
 * System grader hanya mencocokkan hasil OCR dengan kunci jawaban guru.
 */

// Tipe soal yang dinilai oleh sistem
export const SYSTEM_GRADED_TYPES = ["PILIHAN_GANDA", "BENAR_SALAH", "PILIHAN_GANDA_KOMPLEKS"];

export interface SystemGradingInput {
  questionNumber: string;
  questionType: string;
  studentAnswer: string;   // Dari hasil OCR/AI
  correctAnswer: string;   // Dari kunci jawaban guru
  maxScore: number;
}

export interface SystemGradingResult {
  questionNumber: string;
  studentAnswer: string;
  score: number;
  maxScore: number;
  analysisText: string;
  reasoning: string;
  status: "OK" | "UNREADABLE";
  gradedBy: "SYSTEM";
}

/**
 * Normalisasi jawaban pilihan ganda.
 * Mengambil huruf pertama (A-E) dari jawaban siswa, case-insensitive.
 * Contoh: "a", "A.", "A. Jawaban", "a)" → "A"
 */
function normalizePGAnswer(answer: string): string {
  const cleaned = answer.trim().toUpperCase();
  // Cari huruf A-E di awal jawaban
  const match = cleaned.match(/^([A-E])/);
  return match ? match[1] : cleaned;
}

/**
 * Normalisasi jawaban benar/salah.
 * Mendeteksi variasi penulisan "Benar" dan "Salah".
 * Contoh: "B", "benar", "BENAR", "True" → "Benar"
 *         "S", "salah", "SALAH", "False" → "Salah"
 */
function normalizeBSAnswer(answer: string): string {
  const cleaned = answer.trim().toLowerCase();

  // Deteksi "Benar"
  if (
    cleaned === "benar" ||
    cleaned === "b" ||
    cleaned === "true" ||
    cleaned === "betul" ||
    cleaned === "ya" ||
    cleaned === "y" ||
    cleaned === "t" // "T" for True dalam konteks tertentu — hati-hati ambiguitas
  ) {
    return "Benar";
  }

  // Deteksi "Salah"
  if (
    cleaned === "salah" ||
    cleaned === "s" ||
    cleaned === "false" ||
    cleaned === "tidak" ||
    cleaned === "f"
  ) {
    return "Salah";
  }

  // Jika tidak cocok, kembalikan apa adanya (capitalized)
  return answer.trim();
}

/**
 * Normalisasi jawaban PG Kompleks.
 * Mengekstrak huruf-huruf A-E dari jawaban dan mengembalikan set terurut.
 * Contoh: "A, C, E" → ["A", "C", "E"]
 *         "ACE" → ["A", "C", "E"]
 *         "A dan C dan E" → ["A", "C", "E"]
 */
function normalizePGKompleksAnswer(answer: string): string[] {
  const cleaned = answer.trim().toUpperCase();
  // Ekstrak semua huruf A-E yang muncul
  const matches = cleaned.match(/[A-E]/g);
  if (!matches) return [];
  // Deduplicate dan sort
  return [...new Set(matches)].sort();
}

/**
 * Mencocokkan jawaban siswa dengan kunci jawaban.
 * Mengembalikan hasil penilaian deterministik.
 */
export function gradeObjectiveQuestion(input: SystemGradingInput): SystemGradingResult {
  const { questionNumber, questionType, studentAnswer, correctAnswer, maxScore } = input;

  // Cek jika jawaban kosong atau tidak terbaca
  const trimmed = studentAnswer.trim();
  if (!trimmed || trimmed === "[Kosong]" || trimmed === "[Kosong/Tidak Terjawab]" || trimmed.toLowerCase().includes("unreadable")) {
    return {
      questionNumber,
      studentAnswer: trimmed || "[Kosong/Tidak Terjawab]",
      score: 0,
      maxScore,
      analysisText: "⚠️ Jawaban tidak ditemukan atau tidak dapat dibaca oleh sistem.",
      reasoning: "Jawaban kosong atau tidak terbaca.",
      status: "UNREADABLE",
      gradedBy: "SYSTEM"
    };
  }

  switch (questionType) {
    case "PILIHAN_GANDA":
      return gradePilihanGanda(questionNumber, trimmed, correctAnswer, maxScore);

    case "BENAR_SALAH":
      return gradeBenarSalah(questionNumber, trimmed, correctAnswer, maxScore);

    case "PILIHAN_GANDA_KOMPLEKS":
      return gradePGKompleks(questionNumber, trimmed, correctAnswer, maxScore);

    default:
      // Seharusnya tidak terjadi, tapi safety net
      return {
        questionNumber,
        studentAnswer: trimmed,
        score: 0,
        maxScore,
        analysisText: "Tipe soal tidak didukung untuk penilaian sistem.",
        reasoning: `Tipe soal "${questionType}" tidak didukung.`,
        status: "OK",
        gradedBy: "SYSTEM"
      };
  }
}

/**
 * Menilai soal Pilihan Ganda (exact match A-E)
 */
function gradePilihanGanda(
  questionNumber: string,
  studentAnswer: string,
  correctAnswer: string,
  maxScore: number
): SystemGradingResult {
  const normalizedStudent = normalizePGAnswer(studentAnswer);
  const normalizedCorrect = normalizePGAnswer(correctAnswer);

  const isCorrect = normalizedStudent === normalizedCorrect;

  return {
    questionNumber,
    studentAnswer: normalizedStudent,
    score: isCorrect ? maxScore : 0,
    maxScore,
    analysisText: isCorrect
      ? `✅ Jawaban benar. Jawaban Anda: **${normalizedStudent}**, Kunci: **${normalizedCorrect}**`
      : `❌ Jawaban salah. Jawaban Anda: **${normalizedStudent}**, Kunci: **${normalizedCorrect}**`,
    reasoning: isCorrect
      ? `Jawaban "${normalizedStudent}" cocok dengan kunci "${normalizedCorrect}".`
      : `Jawaban "${normalizedStudent}" tidak cocok dengan kunci "${normalizedCorrect}".`,
    status: "OK",
    gradedBy: "SYSTEM"
  };
}

/**
 * Menilai soal Benar/Salah (exact match setelah normalisasi)
 */
function gradeBenarSalah(
  questionNumber: string,
  studentAnswer: string,
  correctAnswer: string,
  maxScore: number
): SystemGradingResult {
  const normalizedStudent = normalizeBSAnswer(studentAnswer);
  const normalizedCorrect = normalizeBSAnswer(correctAnswer);

  const isCorrect = normalizedStudent === normalizedCorrect;

  return {
    questionNumber,
    studentAnswer: normalizedStudent,
    score: isCorrect ? maxScore : 0,
    maxScore,
    analysisText: isCorrect
      ? `✅ Jawaban benar. Jawaban Anda: **${normalizedStudent}**, Kunci: **${normalizedCorrect}**`
      : `❌ Jawaban salah. Jawaban Anda: **${normalizedStudent}**, Kunci: **${normalizedCorrect}**`,
    reasoning: isCorrect
      ? `Jawaban "${normalizedStudent}" cocok dengan kunci "${normalizedCorrect}".`
      : `Jawaban "${normalizedStudent}" tidak cocok dengan kunci "${normalizedCorrect}".`,
    status: "OK",
    gradedBy: "SYSTEM"
  };
}

/**
 * Menilai soal PG Kompleks (set comparison, skor proporsional)
 * Skor = maxScore × (jumlah benar / total kunci) — penalti untuk jawaban salah
 */
function gradePGKompleks(
  questionNumber: string,
  studentAnswer: string,
  correctAnswer: string,
  maxScore: number
): SystemGradingResult {
  const studentSet = normalizePGKompleksAnswer(studentAnswer);
  const correctSet = normalizePGKompleksAnswer(correctAnswer);

  if (correctSet.length === 0) {
    return {
      questionNumber,
      studentAnswer: studentSet.join(",") || studentAnswer,
      score: 0,
      maxScore,
      analysisText: "⚠️ Kunci jawaban tidak valid.",
      reasoning: "Kunci jawaban PG Kompleks kosong.",
      status: "OK",
      gradedBy: "SYSTEM"
    };
  }

  // Hitung jawaban benar (intersection)
  const correctCount = studentSet.filter(a => correctSet.includes(a)).length;
  // Hitung jawaban salah (student punya tapi bukan di kunci)
  const wrongCount = studentSet.filter(a => !correctSet.includes(a)).length;

  const studentStr = studentSet.join(",") || "[Kosong]";
  const correctStr = correctSet.join(",");

  // Semua cocok sempurna
  if (correctCount === correctSet.length && wrongCount === 0) {
    return {
      questionNumber,
      studentAnswer: studentStr,
      score: maxScore,
      maxScore,
      analysisText: `✅ Jawaban benar sempurna. Jawaban Anda: **${studentStr}**, Kunci: **${correctStr}**`,
      reasoning: `Semua jawaban cocok: ${studentStr} = ${correctStr}.`,
      status: "OK",
      gradedBy: "SYSTEM"
    };
  }

  // Tidak ada yang benar
  if (correctCount === 0) {
    return {
      questionNumber,
      studentAnswer: studentStr,
      score: 0,
      maxScore,
      analysisText: `❌ Jawaban salah. Jawaban Anda: **${studentStr}**, Kunci: **${correctStr}**`,
      reasoning: `Tidak ada jawaban yang cocok. Jawaban: ${studentStr}, Kunci: ${correctStr}.`,
      status: "OK",
      gradedBy: "SYSTEM"
    };
  }

  // Sebagian benar — skor proporsional dengan penalti jawaban salah
  const rawScore = Math.max(0, correctCount - wrongCount);
  const proportionalScore = Math.round((rawScore / correctSet.length) * maxScore);
  const finalScore = Math.max(0, Math.min(maxScore, proportionalScore));

  return {
    questionNumber,
    studentAnswer: studentStr,
    score: finalScore,
    maxScore,
    analysisText: `⚠️ Sebagian benar (${correctCount}/${correctSet.length}). Jawaban Anda: **${studentStr}**, Kunci: **${correctStr}**${wrongCount > 0 ? ` (${wrongCount} jawaban salah)` : ""}`,
    reasoning: `Sebagian jawaban cocok: ${correctCount}/${correctSet.length} benar, ${wrongCount} salah. Skor proporsional.`,
    status: "OK",
    gradedBy: "SYSTEM"
  };
}

/**
 * Cek apakah suatu tipe soal harus dinilai oleh sistem (bukan AI).
 */
export function isSystemGradedType(questionType: string): boolean {
  return SYSTEM_GRADED_TYPES.includes(questionType);
}

/**
 * Cek apakah suatu soal memiliki kunci jawaban yang valid untuk system grading.
 */
export function hasValidCorrectAnswer(question: { questionType: string; correctAnswer?: string }): boolean {
  if (!isSystemGradedType(question.questionType)) return false;
  return !!question.correctAnswer && question.correctAnswer.trim().length > 0;
}
