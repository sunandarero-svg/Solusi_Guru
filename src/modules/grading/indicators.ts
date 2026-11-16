/**
 * Modul Indikator Penilaian per Soal
 * 
 * Aturan Bobot & Indikator:
 * - Nilai default 100% jika guru tidak menambahkan indikator pada soal.
 * - Jika guru menambahkan indikator, template default per jenis soal adalah:
 *   1. Pilihan Ganda (PILIHAN_GANDA):
 *      - Pilihan jawaban benar (50%)
 *      - Terdapat Cara pengerjaan yang tepat (50%)
 *   2. Benar dan Salah (BENAR_SALAH):
 *      - Pilihan jawaban Benar (50%)
 *      - Terdapat Penjelasan/Cara Pengerjaan (50%)
 *   3. Essay (ESSAY / URAIAN):
 *      - Tulisan jawaban Tidak ada Typo (25%)
 *      - Tulisan tidak sesuai dengan kunci jawaban tapi sesuai konteks pertanyaan (75%)
 *   4. Isian Singkat / lainnya:
 *      - Kesesuaian dan ketepatan jawaban (100%)
 */

export interface QuestionIndicator {
  name: string;
  weight: number; // Persentase bobot dalam % (contoh: 50 untuk 50%)
}

/**
 * Kembalikan template indikator standar berdasarkan jenis soal.
 */
export function getDefaultPresetIndicators(questionType: string): QuestionIndicator[] {
  const norm = (questionType || "").toUpperCase().replace(/\s+/g, '_');

  if (norm === "PILIHAN_GANDA") {
    return [
      { name: "Pilihan jawaban benar", weight: 50 },
      { name: "Terdapat Cara pengerjaan yang tepat", weight: 50 }
    ];
  }

  if (norm === "BENAR_SALAH") {
    return [
      { name: "Pilihan jawaban Benar", weight: 50 },
      { name: "Terdapat Penjelasan/Cara Pengerjaan", weight: 50 }
    ];
  }

  if (norm === "ESSAY" || norm === "URAIAN") {
    return [
      { name: "Tulisan jawaban Tidak ada Typo", weight: 25 },
      { name: "Tulisan tidak sesuai dengan kunci jawaban tapi sesuai konteks pertanyaan", weight: 75 }
    ];
  }

  // Fallback untuk tipe lain seperti ISIAN_SINGKAT atau PILIHAN_GANDA_KOMPLEKS
  return [
    { name: "Kesesuaian dan ketepatan jawaban", weight: 100 }
  ];
}

/**
 * Nilai default jika guru tidak menambahkan indikator pada soal (Bobot 100%).
 */
export function getFallbackIndicators(): QuestionIndicator[] {
  return [
    { name: "Kesesuaian Jawaban", weight: 100 }
  ];
}

/**
 * Validasi apakah kumpulan indikator memiliki total bobot 100%.
 */
export function validateIndicatorWeights(indicators?: QuestionIndicator[]): {
  isValid: boolean;
  totalWeight: number;
  message?: string;
} {
  if (!indicators || indicators.length === 0) {
    return { isValid: true, totalWeight: 100 };
  }

  const totalWeight = indicators.reduce((sum, ind) => sum + (Number(ind.weight) || 0), 0);
  if (totalWeight !== 100) {
    return {
      isValid: false,
      totalWeight,
      message: `Total bobot indikator harus 100%, saat ini berjumlah ${totalWeight}%.`
    };
  }

  return { isValid: true, totalWeight };
}
