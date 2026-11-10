import { EXAM_QUESTIONS_DATA, ExamQuestion } from '../data/examQuestionsData';

export interface SubQuestionEvaluation {
  label: string;
  earnedPoints: number;
  maxPoints: number;
  isCorrect: boolean;
  feedback: string;
}

export interface QuestionEvaluationResult {
  questionId: number;
  earnedPoints: number;
  maxPoints: number;
  isCorrect: boolean;
  studentAnswer: string | Record<string, string>;
  correctAnswer: string;
  explanation: string;
  subEvaluations?: SubQuestionEvaluation[];
}

export interface ExamOverallResult {
  totalScore: number; // max 100
  pgScore: number;    // max 20
  tfScore: number;    // max 20
  essayScore: number; // max 60
  stars: number;      // 1-3 stars
  badgeName: string;
  isPassed: boolean;  // score >= kkm
  kkm: number;
  evaluatedQuestions: QuestionEvaluationResult[];
}

/**
 * Normalisasi string formula untuk membandingkan kesetaraan sintaks:
 * - Menghapus spasi
 * - Mengubah ke huruf besar (UPPERCASE)
 * - Menyeragamkan pemisah argumen koma (,) menjadi titik koma (;)
 * - Menghilangkan tanda sama dengan (=) di awal jika ada
 */
export function normalizeFormula(f: string): string {
  if (!f) return '';
  return f
    .trim()
    .replace(/^=/, '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/,/g, ';')
    .replace(/""/g, '"');
}

/**
 * Normalisasi teks jawaban uraian umum (lowercase, trim, collapse whitespace)
 */
export function normalizeText(t: string): string {
  if (!t) return '';
  return t
    .toLowerCase()
    .trim()
    .replace(/[.,;:!?'"()\[\]{}\-_\/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Menilai satu butir soal essay berdasarkan sub-pertanyaan
 */
export function evaluateEssayQuestion(
  q: ExamQuestion,
  answers: Record<string, string>
): { earnedPoints: number; maxPoints: number; isCorrect: boolean; subEvaluations: SubQuestionEvaluation[] } {
  const subEvaluations: SubQuestionEvaluation[] = [];
  let earnedPoints = 0;
  const maxPoints = q.points;

  if (!q.essaySubQuestions || q.essaySubQuestions.length === 0) {
    return {
      earnedPoints: 0,
      maxPoints,
      isCorrect: false,
      subEvaluations: []
    };
  }

  q.essaySubQuestions.forEach((sub, idx) => {
    const studentAns = (answers[sub.label] || answers[`sub_${idx}`] || '').trim();
    let subScore = 0;
    let feedback = '';

    const normStudent = normalizeText(studentAns);
    const normFormula = normalizeFormula(studentAns);

    // Evaluasi spesifik berdasarkan ID Soal dan Label
    if (q.id === 21) {
      if (sub.label.startsWith('A')) {
        // Rumus G2: IF + AND(E2>=D2; F2>=150000000) ...
        const hasIf = normFormula.includes('IF(');
        const hasAnd = normFormula.includes('AND(');
        const hasRealisasi = normFormula.includes('E2>=D2') || normFormula.includes('D2<=E2');
        const hasOmzet = normFormula.includes('F2>=150000000') || normFormula.includes('150000000<=F2') || normFormula.includes('150.000.000');
        const hasSangatBaik = normFormula.includes('"SANGATBAIK"');
        const hasBaik = normFormula.includes('"BAIK"');
        const hasEvaluasi = normFormula.includes('"PERLUEVALUASI"');

        if (hasIf && hasAnd && hasRealisasi && hasOmzet && hasSangatBaik && hasBaik && hasEvaluasi) {
          subScore = sub.points;
          feedback = 'Sempurna! Rumus logika Nested IF dan AND ditulis dengan sintaks yang tepat.';
        } else if (hasIf && hasAnd && hasRealisasi && (hasSangatBaik || hasBaik)) {
          subScore = Math.round(sub.points * 0.7);
          feedback = 'Hampir tepat! Logika IF dan AND sudah benar, namun periksa kelengkapan argumen kriteria omzet atau predikat.';
        } else if (hasIf) {
          subScore = Math.round(sub.points * 0.4);
          feedback = 'Menggunakan fungsi IF, namun struktur fungsi AND atau kriteria perbandingan belum lengkap.';
        } else {
          subScore = 0;
          feedback = 'Rumus belum sesuai. Gunakan: =IF(AND(E2>=D2; F2>=150000000); "Sangat Baik"; IF(E2>=D2; "Baik"; "Perlu Evaluasi"))';
        }
      } else if (sub.label.startsWith('B')) {
        // Baris 2 -> Sangat Baik
        if (normStudent.includes('sangat') && normStudent.includes('baik')) {
          subScore = sub.points;
          feedback = 'Benar! Baris 2 memenuhi kedua syarat (Realisasi >= Target dan Omzet >= 150jt).';
        } else {
          feedback = 'Kurang tepat. Baris 2 mendapat predikat "Sangat Baik".';
        }
      } else if (sub.label.startsWith('C')) {
        // Baris 3 -> Perlu Evaluasi
        if (normStudent.includes('evaluasi')) {
          subScore = sub.points;
          feedback = 'Benar! Baris 3 realisasinya (75) di bawah target (80).';
        } else {
          feedback = 'Kurang tepat. Baris 3 mendapat predikat "Perlu Evaluasi".';
        }
      } else if (sub.label.startsWith('D')) {
        // Baris 5 -> Baik
        if (normStudent === 'baik' || (normStudent.includes('baik') && !normStudent.includes('sangat'))) {
          subScore = sub.points;
          feedback = 'Benar! Baris 5 realisasi tercapai (160 >= 150) namun omzet di bawah 150jt.';
        } else {
          feedback = 'Kurang tepat. Baris 5 mendapat predikat "Baik".';
        }
      }
    } else if (q.id === 22) {
      if (sub.label.startsWith('A')) {
        // Rumus SUMIFS Kalimantan, Elektronik, Realisasi >= 100
        const hasSumifs = normFormula.includes('SUMIFS(');
        const hasRangeF = normFormula.includes('F2:F7');
        const hasKalimantan = normFormula.includes('"KALIMANTAN"');
        const hasElektronik = normFormula.includes('"ELEKTRONIK"');
        const hasUnit100 = normFormula.includes('">=100"') || normFormula.includes('>=100');
        const hasResultNumber = normStudent.includes('345') || normStudent.includes('345.000.000') || normStudent.includes('345000000');

        if (hasSumifs && hasRangeF && hasKalimantan && hasElektronik) {
          subScore = sub.points;
          feedback = 'Sempurna! Rumus SUMIFS ditulis dengan struktur range dan kriteria yang tepat (Hasil: Rp345.000.000).';
        } else if (hasSumifs && (hasKalimantan || hasElektronik)) {
          subScore = Math.round(sub.points * 0.7);
          feedback = 'Baik! Rumus SUMIFS sudah digunakan, periksa urutan sum_range dan kriteria unit >= 100.';
        } else if (hasResultNumber) {
          subScore = Math.round(sub.points * 0.5);
          feedback = 'Nilai hasil perhitungan benar (345 Juta), namun sintaks rumus SUMIFS belum ditulis lengkap.';
        } else {
          feedback = 'Rumus belum tepat. Gunakan: =SUMIFS(F2:F7; B2:B7; "Kalimantan"; C2:C7; "Elektronik"; E2:E7; ">=100")';
        }
      } else if (sub.label.startsWith('B')) {
        // COUNTIFS omzet > 100jt -> hasil 4
        const hasCountifs = normFormula.includes('COUNTIFS(') || normFormula.includes('COUNTIF(');
        const hasRangeF = normFormula.includes('F2:F7');
        const hasCriteria = normFormula.includes('">100000000"') || normFormula.includes('>100000000') || normFormula.includes('>100jt');
        const hasResult4 = normStudent.includes('4') || normStudent.includes('empat');

        if (hasCountifs && (hasRangeF || hasCriteria)) {
          subScore = sub.points;
          feedback = 'Sempurna! Rumus COUNTIFS tepat untuk menghitung banyaknya transaksi di atas 100 juta (Hasil: 4).';
        } else if (hasResult4) {
          subScore = Math.round(sub.points * 0.5);
          feedback = 'Hasil 4 transaksi benar, namun rumus COUNTIFS belum lengkap.';
        } else {
          feedback = 'Rumus belum tepat. Gunakan: =COUNTIFS(F2:F7; ">100000000")';
        }
      }
    } else if (q.id === 23) {
      if (sub.label.startsWith('A')) {
        // 2 kesalahan VLOOKUP: kolom 4 melebihi 3 kolom & referensi belum absolut
        const mentionsCol4 = normStudent.includes('4') || normStudent.includes('kolom');
        const mentionsLimit = normStudent.includes('melebihi') || normStudent.includes('hanya 3') || normStudent.includes('3 kolom') || normStudent.includes('bukan 4');
        const mentionsAbsolute = normStudent.includes('absolut') || normStudent.includes('kunci') || normStudent.includes('$') || normStudent.includes('bergeser') || normStudent.includes('relatif');

        if ((mentionsCol4 || mentionsLimit) && mentionsAbsolute) {
          subScore = sub.points;
          feedback = 'Sempurna! Anda berhasil mengidentifikasi kedua kesalahan (nomor kolom melebihi 3 dan rentang belum dikunci absolut).';
        } else if (mentionsCol4 || mentionsLimit || mentionsAbsolute) {
          subScore = Math.round(sub.points * 0.5);
          feedback = 'Baik! Satu kesalahan teridentifikasi dengan tepat. Pastikan menyebutkan kesalahan nomor kolom dan penguncian tanda dollar ($).';
        } else {
          feedback = 'Kesalahan: 1) Nomor kolom 4 tidak valid karena tabel J2:L10 hanya 3 kolom; 2) Tabel referensi belum dikunci absolut ($J$2:$L$10).';
        }
      } else if (sub.label.startsWith('B')) {
        // Perbaikan: =IFERROR(VLOOKUP(A2; $J$2:$L$10; 3; FALSE); "Kode Tidak Terdaftar")
        const hasIferror = normFormula.includes('IFERROR(');
        const hasVlookup = normFormula.includes('VLOOKUP(');
        const hasTableLocked = normFormula.includes('$J$2:$L$10') || normFormula.includes('J$2:L$10') || normFormula.includes('J2:L10');
        const hasCol3 = normFormula.includes(';3;') || normFormula.includes(',3,');
        const hasFalse = normFormula.includes('FALSE') || normFormula.includes(';0)') || normFormula.includes(',0)');
        const hasCustomMsg = normFormula.includes('KODETIDAKTERDAFTAR');

        if (hasIferror && hasVlookup && hasCol3 && hasCustomMsg) {
          subScore = sub.points;
          feedback = 'Sempurna! Rumus perbaikan VLOOKUP dan fungsi IFERROR ditulis dengan sangat rapi dan tepat.';
        } else if (hasVlookup && (hasCol3 || hasTableLocked)) {
          subScore = Math.round(sub.points * 0.6);
          feedback = 'Hampir tepat! VLOOKUP sudah diperbaiki, pastikan dilengkapi IFERROR dengan pesan "Kode Tidak Terdaftar".';
        } else {
          feedback = 'Gunakan: =IFERROR(VLOOKUP(A2; $J$2:$L$10; 3; FALSE); "Kode Tidak Terdaftar")';
        }
      }
    } else if (q.id === 24) {
      if (sub.label.startsWith('A')) {
        // =LEFT(A2; 3)
        if (normFormula.includes('LEFT(') && normFormula.includes('A2') && normFormula.includes('3')) {
          subScore = sub.points;
          feedback = 'Sempurna! =LEFT(A2; 3) menghasilkan teks "ELK".';
        } else if (normStudent.includes('elk')) {
          subScore = Math.round(sub.points * 0.5);
          feedback = 'Hasil ELK benar, namun sintaks rumus Excel belum ditulis lengkap.';
        } else {
          feedback = 'Gunakan rumus: =LEFT(A2; 3)';
        }
      } else if (sub.label.startsWith('B')) {
        // =MID(A2; 10; 3)
        if (normFormula.includes('MID(') && normFormula.includes('A2') && (normFormula.includes('10;3') || normFormula.includes('10,3'))) {
          subScore = sub.points;
          feedback = 'Sempurna! =MID(A2; 10; 3) mengekstrak 3 huruf kota mulai karakter ke-10 ("BPP").';
        } else if (normStudent.includes('bpp')) {
          subScore = Math.round(sub.points * 0.5);
          feedback = 'Hasil BPP benar, namun sintaks rumus MID belum tepat.';
        } else {
          feedback = 'Gunakan rumus: =MID(A2; 10; 3)';
        }
      } else if (sub.label.startsWith('C')) {
        // =VALUE(RIGHT(A2; 2))
        const hasValue = normFormula.includes('VALUE(');
        const hasRight = normFormula.includes('RIGHT(');
        if (hasValue && hasRight && normFormula.includes('2')) {
          subScore = sub.points;
          feedback = 'Sempurna! Kombinasi VALUE dan RIGHT berhasil mengubah teks 2 digit akhir menjadi angka numerik 1.';
        } else if (hasRight) {
          subScore = Math.round(sub.points * 0.6);
          feedback = 'RIGHT sudah benar, jangan lupa bungkus dengan VALUE() agar berubah menjadi tipe angka murni.';
        } else {
          feedback = 'Gunakan rumus: =VALUE(RIGHT(A2; 2))';
        }
      }
    } else if (q.id === 25) {
      if (sub.label.startsWith('A')) {
        // Alasan MEDIAN vs AVERAGE
        const mentionsOutlier = normStudent.includes('outlier') || normStudent.includes('ekstrem') || normStudent.includes('tinggi') || normStudent.includes('980');
        const mentionsEffect = normStudent.includes('rata') || normStudent.includes('average') || normStudent.includes('melonjak') || normStudent.includes('tertarik') || normStudent.includes('distorsi');
        const mentionsMedianRobust = normStudent.includes('median') || normStudent.includes('tahan') || normStudent.includes('tengah') || normStudent.includes('representatif') || normStudent.includes('akurat');

        if (mentionsOutlier && (mentionsEffect || mentionsMedianRobust)) {
          subScore = sub.points;
          feedback = 'Sempurna! Penjelasan tepat: nilai ekstrem Rp980 juta mendistorsi AVERAGE, sedangkan MEDIAN lebih tahan terhadap outlier.';
        } else if (mentionsOutlier || mentionsMedianRobust) {
          subScore = Math.round(sub.points * 0.6);
          feedback = 'Baik! Konsep outlier atau nilai tengah sudah dipahami, lengkapi alasan pengaruhnya terhadap rata-rata.';
        } else {
          feedback = 'MEDIAN lebih tepat karena tidak terpengaruh oleh nilai ekstrem (outlier) Rp980 juta yang menarik rata-rata melonjak.';
        }
      } else if (sub.label.startsWith('B')) {
        // PivotTable Rows=Wilayah, Values=Sum Realisasi, Avg Omzet
        const mentionsRows = normStudent.includes('row') || normStudent.includes('baris');
        const mentionsWilayah = normStudent.includes('wilayah');
        const mentionsValues = normStudent.includes('value') || normStudent.includes('nilai');
        const mentionsSum = normStudent.includes('sum') || normStudent.includes('total') || normStudent.includes('jumlah');
        const mentionsAvg = normStudent.includes('average') || normStudent.includes('rata');

        if (mentionsWilayah && (mentionsSum || mentionsAvg)) {
          subScore = sub.points;
          feedback = 'Sempurna! Penataan field: Rows = Wilayah; Values = Sum of Realisasi Unit dan Average of Total Omzet.';
        } else if (mentionsWilayah || (mentionsRows && mentionsValues)) {
          subScore = Math.round(sub.points * 0.6);
          feedback = 'Hampir tepat! Pastikan menyebutkan field Wilayah di Rows serta Realisasi (Sum) & Omzet (Average) di Values.';
        } else {
          feedback = 'Atur field: Rows: Wilayah; Values: Sum of Realisasi Unit dan Average of Total Omzet.';
        }
      }
    }

    earnedPoints += subScore;
    subEvaluations.push({
      label: sub.label,
      earnedPoints: subScore,
      maxPoints: sub.points,
      isCorrect: subScore === sub.points,
      feedback
    });
  });

  return {
    earnedPoints,
    maxPoints,
    isCorrect: earnedPoints === maxPoints,
    subEvaluations
  };
}

/**
 * Menilai keseluruhan lembar jawaban ujian siswa (25 soal)
 */
export function gradeWholeExam(
  answers: Record<number, any>,
  kkm: number = 75
): ExamOverallResult {
  let pgScore = 0;
  let tfScore = 0;
  let essayScore = 0;
  const evaluatedQuestions: QuestionEvaluationResult[] = [];

  EXAM_QUESTIONS_DATA.forEach((q) => {
    const studentAns = answers[q.id];

    if (q.type === 'MULTIPLE_CHOICE') {
      const isCorrect = String(studentAns || '').toUpperCase().trim() === q.correctAnswer;
      const pts = isCorrect ? q.points : 0;
      pgScore += pts;
      evaluatedQuestions.push({
        questionId: q.id,
        earnedPoints: pts,
        maxPoints: q.points,
        isCorrect,
        studentAnswer: studentAns || '[Kosong]',
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      });
    } else if (q.type === 'TRUE_FALSE') {
      const isCorrect = String(studentAns || '').toUpperCase().trim() === q.correctAnswer;
      const pts = isCorrect ? q.points : 0;
      tfScore += pts;
      evaluatedQuestions.push({
        questionId: q.id,
        earnedPoints: pts,
        maxPoints: q.points,
        isCorrect,
        studentAnswer: studentAns || '[Kosong]',
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      });
    } else if (q.type === 'ESSAY') {
      const essayAnswersObj = (typeof studentAns === 'object' && studentAns !== null) ? studentAns : {};
      const evalResult = evaluateEssayQuestion(q, essayAnswersObj);
      essayScore += evalResult.earnedPoints;

      evaluatedQuestions.push({
        questionId: q.id,
        earnedPoints: evalResult.earnedPoints,
        maxPoints: q.points,
        isCorrect: evalResult.isCorrect,
        studentAnswer: essayAnswersObj,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        subEvaluations: evalResult.subEvaluations
      });
    }
  });

  const totalScore = pgScore + tfScore + essayScore;

  // Bintang
  let stars = 1;
  let badgeName = 'Perlu Penguatan Materi';
  if (totalScore >= 90) {
    stars = 3;
    badgeName = 'Junior Data Analyst';
  } else if (totalScore >= 75) {
    stars = 2;
    badgeName = 'Data Specialist';
  } else if (totalScore >= 60) {
    stars = 1;
    badgeName = 'Data Assistant';
  }

  return {
    totalScore,
    pgScore,
    tfScore,
    essayScore,
    stars,
    badgeName,
    isPassed: totalScore >= kkm,
    kkm,
    evaluatedQuestions
  };
}

