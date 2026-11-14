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
export const SYSTEM_GRADED_TYPES = [
  "PILIHAN_GANDA",
  "BENAR_SALAH",
  "PILIHAN_GANDA_KOMPLEKS",
  "PILIHAN_GANDA_BERTINGKAT",
  "PG_KOMPLEKS",
  "PG_BERTINGKAT",
  "ISIAN_SINGKAT"
];

/**
 * Cek apakah tipe soal merupakan tipe objektif murni (Pilihan Ganda, Benar/Salah, Pilihan Ganda Bertingkat/Kompleks).
 * Tipe soal ini WAJIB 100% dinilai oleh aplikasi (System Grader), tidak boleh dinilai oleh AI.
 */
export function isPureObjectiveType(questionType: string): boolean {
  if (!questionType) return false;
  const t = questionType.toUpperCase().replace(/\s+/g, '_');
  return (
    t === "PILIHAN_GANDA" ||
    t === "BENAR_SALAH" ||
    t === "PILIHAN_GANDA_KOMPLEKS" ||
    t === "PILIHAN_GANDA_BERTINGKAT" ||
    t === "PG_KOMPLEKS" ||
    t === "PG_BERTINGKAT"
  );
}

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
 * Mengambil huruf (A-E) dari jawaban siswa.
 * Jika ada coretan atau koreksi dua huruf berurutan (misal: "A B"), ambil huruf kedua / tidak dicoret.
 * Contoh: "a", "A.", "A. Jawaban", "a)" → "A", "A B" → "B"
 */
function normalizePGAnswer(answer: string): string {
  if (!answer) return "";

  // 1. Bersihkan tanda coretan (strikethrough markdown atau tag coret)
  let text = answer
    .replace(/~~[^~]+~~/g, ' ')
    .replace(/\[(?:coret|dicoret)[^\]]*\]/gi, ' ')
    .replace(/\((?:coret|dicoret)[^\)]*\)/gi, ' ')
    .trim();

  // 2. Jika ada dua huruf dipisah spasi tanpa koma (koreksi jawaban: "A B"), ambil huruf kedua
  const letters = text.match(/\b([A-E])\b/gi);
  if (letters && letters.length >= 2 && !text.includes(',')) {
    return letters[letters.length - 1].toUpperCase();
  }

  const cleaned = text.trim().toUpperCase();
  // Cari huruf A-E di awal jawaban
  const match = cleaned.match(/^([A-E])/);
  return match ? match[1] : (letters && letters.length === 1 ? letters[0].toUpperCase() : cleaned);
}

/**
 * Deteksi apakah siswa menuliskan opsi Benar dan Salah secara bersamaan / ambigu:
 * Contoh: "Benar/Salah", "Benar / Salah", "Benar dan salah", "B/S", "B / S", "B & S", "Benar atau Salah", "Salah/Benar", "Pernyataan Benar/Salah"
 * Sesuai aturan: tulisan tersebut TIDAK DIANGGAP BAGIAN DARI SOAL, DILEWATI, dan TIDAK DIBERIKAN SKOR (skor 0).
 */
export function isAmbiguousBSAnswer(raw: string): boolean {
  if (!raw) return false;
  const cleaned = raw.trim().toLowerCase();

  // Pola gabungan dengan slash, backslash, ampersand, 'dan', 'atau', tanda hubung antar opsi
  if (
    /\b(?:benar|b)\s*(?:[\/\\&]|dan|atau|-)\s*(?:salah|s)\b/i.test(cleaned) ||
    /\b(?:salah|s)\s*(?:[\/\\&]|dan|atau|-)\s*(?:benar|b)\b/i.test(cleaned)
  ) {
    return true;
  }

  // Pola murni singkat: b/s, s/b, b\s, s\b, b & s
  if (/^[bs]\s*[\/\\&\-]\s*[bs]$/i.test(cleaned)) {
    return true;
  }

  // Deteksi teks judul / petunjuk "pernyataan ... benar/salah"
  if (/pernyataan.*(?:benar|salah|b\/s)/i.test(cleaned)) {
    return true;
  }

  return false;
}

/**
 * Normalisasi jawaban benar/salah.
 * Sesuai aturan:
 * 1. Abaikan bagian yang dicoret (~~teks~~ atau [coret: ...]).
 * 2. Jika ada dua kata berurutan ("Benar Salah" atau "Salah Benar", "B S", "S B"),
 *    ambil HANYA KATA KEDUA (jawaban perbaikan siswa).
 * 3. Ambil kata yang tidak dicoret jika ada coretan.
 */
function normalizeBSAnswer(answer: string): string {
  if (!answer) return "";

  // 1. Bersihkan tanda coretan (strikethrough markdown atau tag coret)
  let text = answer
    .replace(/~~[^~]+~~/g, ' ')
    .replace(/\[(?:coret|dicoret)[^\]]*\]/gi, ' ')
    .replace(/\((?:coret|dicoret)[^\)]*\)/gi, ' ')
    .trim();

  // 2. Ekstrak kata-kata kunci Benar / Salah secara urut dari teks
  const words = text.split(/[\s,.;:]+/).filter(Boolean);
  const detectedTokens: string[] = [];

  for (const w of words) {
    const lw = w.toLowerCase();
    if (lw === "benar" || lw === "betul" || lw === "true" || lw === "ya" || lw === "b") {
      detectedTokens.push("Benar");
    } else if (lw === "salah" || lw === "false" || lw === "tidak" || lw === "s") {
      detectedTokens.push("Salah");
    }
  }

  // Jika terdeteksi lebih dari satu kata (misal: "Benar Salah" atau "Salah Benar"):
  // Ambil kata KEDUA / TERAKHIR (jawaban perbaikan siswa)
  if (detectedTokens.length >= 2) {
    return detectedTokens[detectedTokens.length - 1];
  }

  if (detectedTokens.length === 1) {
    return detectedTokens[0];
  }

  const cleaned = text.trim().toLowerCase();

  // Deteksi "Benar"
  if (
    cleaned === "benar" ||
    cleaned === "b" ||
    cleaned === "true" ||
    cleaned === "betul" ||
    cleaned === "ya" ||
    cleaned === "y" ||
    cleaned === "t"
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

  // Jika tidak cocok, kembalikan apa adanya
  return text.trim();
}

/**
 * Normalisasi jawaban PG Kompleks.
 * Mengekstrak huruf-huruf A-E dari jawaban dan mengembalikan set terurut.
 * Contoh: "A, C, E" → ["A", "C", "E"]
 *         "ACE" → ["A", "C", "E"]
 *         "A dan C dan E" → ["A", "C", "E"]
 */
function normalizePGKompleksAnswer(answer: string): string[] {
  let text = (answer || "")
    .replace(/~~[^~]+~~/g, ' ')
    .replace(/\[(?:coret|dicoret)[^\]]*\]/gi, ' ')
    .replace(/\((?:coret|dicoret)[^\)]*\)/gi, ' ')
    .trim();
  const cleaned = text.toUpperCase();
  // Ekstrak semua huruf A-E yang muncul
  const matches = cleaned.match(/[A-E]/g);
  if (!matches) return [];
  // Deduplicate dan sort
  return [...new Set(matches)].sort();
}

/**
 * Normalisasi jawaban isian singkat.
 * Lowercase, trim, hapus tanda baca, collapse whitespace.
 */
function normalizeIsianSingkat(answer: string): string {
  return answer.trim().toLowerCase()
    .replace(/[.,;:!?'"()\[\]{}\-_\/\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Hitung Levenshtein distance antara dua string.
 * Algoritma edit distance standar tanpa dependency eksternal.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

/**
 * Hitung similarity (0-1) berdasarkan Levenshtein distance.
 * 1.0 = identik, 0.0 = benar-benar berbeda.
 */
function levenshteinSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

/**
 * Mencocokkan jawaban siswa dengan kunci jawaban.
 * Mengembalikan hasil penilaian deterministik.
 */
export function gradeObjectiveQuestion(input: SystemGradingInput): SystemGradingResult | null {
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

  const normalizedType = (questionType || "").toUpperCase().replace(/\s+/g, '_');

  switch (normalizedType) {
    case "PILIHAN_GANDA":
      return gradePilihanGanda(questionNumber, trimmed, correctAnswer, maxScore);

    case "BENAR_SALAH":
      return gradeBenarSalah(questionNumber, trimmed, correctAnswer, maxScore);

    case "PILIHAN_GANDA_KOMPLEKS":
    case "PILIHAN_GANDA_BERTINGKAT":
    case "PG_KOMPLEKS":
    case "PG_BERTINGKAT":
      return gradePGKompleks(questionNumber, trimmed, correctAnswer, maxScore);

    case "ISIAN_SINGKAT":
      return gradeIsianSingkat(questionNumber, trimmed, correctAnswer, maxScore);

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
      ? `✅ Jawaban benar. Jawaban: **${normalizedStudent}**${studentAnswer !== normalizedStudent ? ` (dari "${studentAnswer}")` : ""}, Kunci: **${normalizedCorrect}**`
      : `❌ Jawaban salah. Jawaban: **${normalizedStudent}**${studentAnswer !== normalizedStudent ? ` (dari "${studentAnswer}")` : ""}, Kunci: **${normalizedCorrect}**`,
    reasoning: isCorrect
      ? `Jawaban "${normalizedStudent}" cocok dengan kunci "${normalizedCorrect}".`
      : `Jawaban "${normalizedStudent}" tidak cocok dengan kunci "${normalizedCorrect}".`,
    status: "OK",
    gradedBy: "SYSTEM"
  };
}

/**
 * Menilai soal Benar/Salah:
 * - Jika ada tulisan "Benar/Salah", "Benar dan salah", "B/S", "Pernyataan Benar/Salah", dst:
 *   -> TIDAK DIANGGAP BAGIAN DARI SOAL, DILEWATI, dan TIDAK DIBERIKAN SKOR (skor 0, status UNREADABLE).
 * - Jika ada dua kata "Benar Salah" atau "Salah Benar" -> ambil kata kedua (atau yang tidak dicoret).
 * - Cocokkan dengan kunci jawaban -> skor maxScore jika cocok, 0 jika salah.
 */
function gradeBenarSalah(
  questionNumber: string,
  studentAnswer: string,
  correctAnswer: string,
  maxScore: number
): SystemGradingResult {
  // 1. Cek jika jawaban berupa "Benar/Salah", "Benar dan salah", "B/S", dsb:
  // Sesuai aturan: tidak dianggap bagian dari soal, dilewati dan tidak diberikan skor (skor 0).
  if (isAmbiguousBSAnswer(studentAnswer)) {
    return {
      questionNumber,
      studentAnswer: `${studentAnswer} [Dilewati]`,
      score: 0,
      maxScore,
      analysisText: `⚠️ Dilewati: Tulisan "${studentAnswer}" tidak dianggap sebagai bagian dari soal dan tidak diberikan skor (Skor: 0).`,
      reasoning: `Tulisan "${studentAnswer}" tidak dianggap sebagai bagian dari soal, dilewati dan tidak diberikan skor.`,
      status: "UNREADABLE",
      gradedBy: "SYSTEM"
    };
  }

  // 2. Normalisasi: Jika ada dua kata "Benar Salah" atau "Salah Benar", ambil kata kedua atau yang tidak dicoret
  const normalizedStudent = normalizeBSAnswer(studentAnswer);
  const normalizedCorrect = normalizeBSAnswer(correctAnswer);

  const isCorrect = normalizedStudent === normalizedCorrect;

  return {
    questionNumber,
    studentAnswer: normalizedStudent,
    score: isCorrect ? maxScore : 0,
    maxScore,
    analysisText: isCorrect
      ? `✅ Jawaban benar. Jawaban: **${normalizedStudent}**${studentAnswer !== normalizedStudent ? ` (dari "${studentAnswer}")` : ""}, Kunci: **${normalizedCorrect}**`
      : `❌ Jawaban salah. Jawaban: **${normalizedStudent}**${studentAnswer !== normalizedStudent ? ` (dari "${studentAnswer}")` : ""}, Kunci: **${normalizedCorrect}**`,
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
 * Menilai soal Isian Singkat dengan fuzzy matching.
 * Mendukung multi-jawaban (dipisah koma) dan toleransi typo.
 * Mengembalikan null jika similarity terlalu rendah → fallback ke AI.
 */
function gradeIsianSingkat(
  questionNumber: string,
  studentAnswer: string,
  correctAnswer: string,
  maxScore: number
): SystemGradingResult | null {
  const normalizedStudent = normalizeIsianSingkat(studentAnswer);

  // Support multi-answer: "jawaban1, jawaban2"
  const correctAnswers = correctAnswer.split(',')
    .map(a => normalizeIsianSingkat(a))
    .filter(a => a.length > 0);

  if (correctAnswers.length === 0) return null;

  // Cek setiap kemungkinan jawaban benar, ambil kecocokan terbaik
  let bestSimilarity = 0;
  let bestCorrectAnswer = correctAnswers[0];

  for (const correct of correctAnswers) {
    // Exact match setelah normalisasi
    if (normalizedStudent === correct) {
      return {
        questionNumber,
        studentAnswer,
        score: maxScore,
        maxScore,
        analysisText: `✅ Jawaban benar. Jawaban Anda: **${studentAnswer}**, Kunci: **${correctAnswer}**`,
        reasoning: `Jawaban "${studentAnswer}" cocok dengan kunci "${correctAnswer}".`,
        status: "OK",
        gradedBy: "SYSTEM"
      };
    }

    // Hitung similarity
    const similarity = levenshteinSimilarity(normalizedStudent, correct);
    // Bonus untuk substring match (jawaban siswa ada di kunci atau sebaliknya)
    const isSubstring = normalizedStudent.length >= 2 &&
      (normalizedStudent.includes(correct) || correct.includes(normalizedStudent));
    const effectiveSimilarity = isSubstring ? Math.max(similarity, 0.76) : similarity;

    if (effectiveSimilarity > bestSimilarity) {
      bestSimilarity = effectiveSimilarity;
      bestCorrectAnswer = correct;
    }
  }

  // Skor berdasarkan similarity
  if (bestSimilarity >= 0.85) {
    // Sangat mirip — kemungkinan typo
    return {
      questionNumber,
      studentAnswer,
      score: maxScore,
      maxScore,
      analysisText: `✅ Jawaban benar (typo minor diabaikan). Jawaban Anda: **${studentAnswer}**, Kunci: **${correctAnswer}**`,
      reasoning: `Jawaban "${studentAnswer}" sangat mirip dengan kunci "${bestCorrectAnswer}" (kecocokan ${Math.round(bestSimilarity * 100)}%).`,
      status: "OK",
      gradedBy: "SYSTEM"
    };
  }

  if (bestSimilarity >= 0.70) {
    // Hampir benar
    const score = Math.round(maxScore * 0.75);
    return {
      questionNumber,
      studentAnswer,
      score,
      maxScore,
      analysisText: `⚠️ Jawaban hampir benar. Jawaban Anda: **${studentAnswer}**, Kunci: **${correctAnswer}** (kecocokan ${Math.round(bestSimilarity * 100)}%)`,
      reasoning: `Jawaban "${studentAnswer}" hampir cocok dengan kunci "${bestCorrectAnswer}" (kecocokan ${Math.round(bestSimilarity * 100)}%).`,
      status: "OK",
      gradedBy: "SYSTEM"
    };
  }

  if (bestSimilarity >= 0.50) {
    // Sebagian benar
    const score = Math.round(maxScore * 0.50);
    return {
      questionNumber,
      studentAnswer,
      score,
      maxScore,
      analysisText: `⚠️ Jawaban sebagian benar. Jawaban Anda: **${studentAnswer}**, Kunci: **${correctAnswer}** (kecocokan ${Math.round(bestSimilarity * 100)}%)`,
      reasoning: `Jawaban "${studentAnswer}" sebagian cocok dengan kunci "${bestCorrectAnswer}" (kecocokan ${Math.round(bestSimilarity * 100)}%).`,
      status: "OK",
      gradedBy: "SYSTEM"
    };
  }

  // Similarity terlalu rendah — kembalikan null agar fallback ke AI
  // AI lebih mampu menilai kecocokan konseptual yang tidak terdeteksi string matching
  return null;
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

/**
 * Mengekstrak kunci jawaban dari teks kunci jawaban tugas ke dalam Map<nomorSoal, { key, detectedType }>.
 * Berguna jika data AssignmentQuestion di database tidak memiliki correctAnswer lengkap,
 * atau jika guru hanya mengunggah teks kunci jawaban.
 */
export function parseAnswerKeyMap(answerKeyText: string): Map<number, { key: string; detectedType?: string }> {
  const map = new Map<number, { key: string; detectedType?: string }>();
  if (!answerKeyText) return map;

  const lines = answerKeyText.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Format baris: "1. B" atau "1) Benar" atau "Nomor 1: A, C, E"
    const match = trimmed.match(/^(?:(?:Nomor|Soal|No\.?)\s*)?(\d+)[\.\)\:\-]\s*(.*)$/i);
    if (match) {
      const qNum = parseInt(match[1]);
      const rest = match[2].trim();

      // Cek Benar/Salah
      if (/^(benar|betul|salah|true|false)\b/i.test(rest)) {
        const bsMatch = rest.match(/^(benar|betul|salah|true|false)\b/i);
        map.set(qNum, { key: bsMatch ? bsMatch[1] : rest, detectedType: "BENAR_SALAH" });
      }
      // Cek PG Kompleks / Bertingkat (misal: "A, C, E" atau "A,B")
      else if (/^[A-E](?:\s*,\s*[A-E])+$/i.test(rest)) {
        map.set(qNum, { key: rest, detectedType: "PILIHAN_GANDA_KOMPLEKS" });
      }
      // Cek Pilihan Ganda Tunggal (misal: "A" atau "B. Penjelasan...")
      else if (/^[A-E]\b/i.test(rest)) {
        const pgMatch = rest.match(/^([A-E])\b/i);
        map.set(qNum, { key: pgMatch ? pgMatch[1].toUpperCase() : rest, detectedType: "PILIHAN_GANDA" });
      } else {
        map.set(qNum, { key: rest });
      }
    }
  }
  return map;
}
