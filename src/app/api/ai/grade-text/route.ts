import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import { Assignment, AssignmentAttachment, AssignmentQuestion } from "@/models/Assignment";
import { AIAssessment, StudentAnswerAnalysis, Submission } from "@/models/Submission";
import { attachmentService } from "@/modules/attachment/attachmentService";
import { compressImageForOCR } from "@/modules/ai/compressImageForOCR";
import { gradeObjectiveQuestion, hasValidCorrectAnswer, isPureObjectiveType, parseAnswerKeyMap, isAmbiguousBSAnswer, normalizePGAnswer, normalizeBSAnswer } from "@/modules/grading/systemGrader";
import { getDefaultPresetIndicators, QuestionIndicator } from "@/modules/grading/indicators";

interface CompressedImage {
  base64Data: string;
  mimeType: string;
}

/**
 * Compress a single base64 image for AI processing.
 */
async function compressSingleImage(base64Image: string, maxDimension: number = 1024): Promise<CompressedImage> {
  const rawBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
  const mimeMatch = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  const rawMimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

  const { compressedBase64, compressedMimeType, savings } =
    await compressImageForOCR(rawBase64, rawMimeType, maxDimension);
  console.log(`[Grade BG] Kompresi gambar: ${savings}`);

  return { base64Data: compressedBase64, mimeType: compressedMimeType };
}

/**
 * Resilient JSON Parser for AI Outputs
 * Menangani:
 * 1. Markdown code blocks (```json ... ```)
 * 2. Trailing comma sebelum } atau ]
 * 3. Missing comma antar elemen array (} \n {) — penyebab error: "Expected ',' or ']' after array element"
 * 4. Missing comma antar baris properti
 * 5. Regex salvage extractor jika JSON terpotong (truncated) atau ada unescaped quotes
 */
function safeParseAIJson(responseText: string): any {
  if (!responseText || typeof responseText !== 'string') {
    throw new Error("Empty AI response text");
  }

  // 1. Bersihkan markdown code blocks & whitespace
  let cleanText = responseText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  // 2. Ekstrak substring JSON terluar dari { pertama ke } terakhir
  const firstBrace = cleanText.indexOf('{');
  const lastBrace = cleanText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleanText = cleanText.substring(firstBrace, lastBrace + 1).trim();
  }

  // Attempt 1: Standard JSON parse
  try {
    const parsed = JSON.parse(cleanText);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch (err1) {
    // Lanjut ke perbaikan sintaks otomatis
  }

  // Attempt 2: Auto-repair common LLM JSON syntax errors
  try {
    let repaired = cleanText;

    // a. Hapus trailing comma sebelum } atau ] (misal: "a": 1, } -> "a": 1 })
    repaired = repaired.replace(/,(\s*[\]}])/g, '$1');

    // b. Perbaiki missing comma antar objek dalam array (misal: } \n { -> }, \n {)
    repaired = repaired.replace(/}(\s*){/g, '},$1{');

    // c. Perbaiki missing comma antar string elemen array (misal: "A" \n "B" -> "A", \n "B")
    repaired = repaired.replace(/(")\s*\n\s*(")/g, '$1,\n$2');

    // d. Perbaiki missing comma setelah nilai field sebelum field baru
    // misal: "score": 5 \n "maxScore": 5 -> "score": 5, \n "maxScore": 5
    repaired = repaired.replace(/((?:true|false|null|\d+|"[^"\\]*(?:\\.[^"\\]*)*"))\s*\n\s*("[a-zA-Z0-9_]+"\s*:)/g, '$1,\n$2');

    const parsed = JSON.parse(repaired);
    if (parsed && typeof parsed === 'object') {
      console.log("[Safe JSON Parser] Berhasil mem-parsing JSON setelah auto-repair sintaks.");
      return parsed;
    }
  } catch (err2) {
    // Lanjut ke regex salvage
  }

  // Attempt 3: Regex Salvage Parser (Ekstrak setiap objek soal satu per satu)
  try {
    const analysisItems: any[] = [];

    // Cari semua blok objek yang memiliki "questionNumber"
    const objectRegex = /\{[^{}]*?"questionNumber"\s*:\s*"?(\d+|[a-zA-Z0-9_\-]+)"?[\s\S]*?\}/g;
    let match: RegExpExecArray | null;

    while ((match = objectRegex.exec(cleanText)) !== null) {
      let block = match[0];
      // Bersihkan trailing comma di dalam blok
      block = block.replace(/,(\s*})/g, '$1');
      try {
        const item = JSON.parse(block);
        if (item.questionNumber !== undefined) {
          analysisItems.push(item);
        }
      } catch (itemErr) {
        // Fallback manual field extraction jika 1 blok tersebut ada unescaped quotes
        const qNumMatch = block.match(/"questionNumber"\s*:\s*"?([^",}\n]+)"?/);
        const ansMatch = block.match(/"studentAnswer"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
        const scoreMatch = block.match(/"score"\s*:\s*(\d+(?:\.\d+)?)/);
        const maxScoreMatch = block.match(/"maxScore"\s*:\s*(\d+(?:\.\d+)?)/);
        const reasoningMatch = block.match(/"reasoning"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
        const analysisTextMatch = block.match(/"analysisText"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);

        if (qNumMatch) {
          analysisItems.push({
            questionNumber: qNumMatch[1].trim(),
            studentAnswer: ansMatch ? ansMatch[1] : "",
            score: scoreMatch ? Number(scoreMatch[1]) : 0,
            maxScore: maxScoreMatch ? Number(maxScoreMatch[1]) : 10,
            reasoning: reasoningMatch ? reasoningMatch[1] : "",
            analysisText: analysisTextMatch ? analysisTextMatch[1] : "",
            status: "OK"
          });
        }
      }
    }

    if (analysisItems.length > 0) {
      console.warn(`[Safe JSON Parser] ⚠️ Berhasil memulihkan ${analysisItems.length} butir analisis soal via Regex Salvage!`);
      const fbMatch = cleanText.match(/"generalFeedback"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
      const scoreMatch = cleanText.match(/"totalScore"\s*:\s*(\d+(?:\.\d+)?)/);

      return {
        totalScore: scoreMatch ? Number(scoreMatch[1]) : 0,
        generalFeedback: fbMatch ? fbMatch[1] : "Penilaian diproses dengan pemulihan parser resilien.",
        analysis: analysisItems
      };
    }
  } catch (err3) {
    // Gagal total
  }

  throw new Error(`Gagal mem-parsing format JSON dari AI: ${cleanText.substring(0, 150)}...`);
}

/**
 * Build the unified prompt that combines OCR reading + grading in one step.
 */
function buildUnifiedPrompt(
  answerKey: string,
  questions: any[],
  imageCount: number
): string {
  let effectiveAnswerKey = answerKey || "";
  if (!effectiveAnswerKey.trim() && questions && questions.length > 0) {
    const synthLines = questions
      .filter((q: any) => q.correctAnswer && q.correctAnswer.trim().length > 0)
      .map((q: any) => `${q.order}. ${q.correctAnswer}`);
    if (synthLines.length > 0) {
      effectiveAnswerKey = synthLines.join("\n");
    }
  }

  let answerKeyInstruction = "";
  if (effectiveAnswerKey && effectiveAnswerKey.trim().length > 0) {
    answerKeyInstruction = `KUNCI JAWABAN REFERENSI:\n${effectiveAnswerKey}\n`;
  }

  let questionsInstruction = "";
  if (questions && questions.length > 0) {
    const sortedQuestions = [...questions].sort((a: any, b: any) => {
      const aNum = typeof a.order === 'number' ? a.order : (parseInt(String(a.order).replace(/\D/g, '')) || 0);
      const bNum = typeof b.order === 'number' ? b.order : (parseInt(String(b.order).replace(/\D/g, '')) || 0);
      return aNum - bNum;
    });
    const qList = sortedQuestions.map((q: any) => {
      let line = `Nomor ${q.order}: Tipe ${q.questionType}, Bobot Nilai Maksimal ${q.maxScore}`;
      if (q.correctAnswer && q.correctAnswer.trim().length > 0) {
        line += `, Kunci Jawaban Referensi: ${q.correctAnswer}`;
      }
      if (Array.isArray(q.indicators) && q.indicators.length > 0) {
        line += `\n   * Indikator Penilaian (${q.indicators.length} indikator, Total 100%):\n` +
          q.indicators.map((ind: any, i: number) => {
            const indMax = Math.round((Number(ind.weight) / 100) * q.maxScore * 10) / 10;
            return `     - Indikator ${i + 1}: "${ind.name}" (Bobot ${ind.weight}% = maks ${indMax} poin)`;
          }).join("\n");
      } else {
        line += `\n   * Indikator Penilaian: Nilai Default 100% (maks ${q.maxScore} poin)`;
      }
      return line;
    }).join("\n\n");
    questionsInstruction = `KONFIGURASI SOAL, BOBOT & INDIKATOR PENILAIAN:\n${qList}\nNilailah setiap soal berpatokan pada bobot maksimal tersebut (maxScore) dan rincian indikator penilaian (jika tersedia).\n`;
  } else {
    questionsInstruction = `2. Identifikasi jumlah total soal (N). Alokasikan nilai maksimal (maxScore) proporsional, yaitu 100 / N. Nilai Default 100% per soal.`;
  }

  return `Anda adalah asisten guru (AI) penilai tugas siswa. Anda bertugas mengekstrak tulisan tangan siswa (OCR) lalu menilainya secara berurutan.

=== INFORMASI PENILAIAN TUGAS ===
${answerKeyInstruction}
${questionsInstruction}

=== INSTRUKSI PENILAIAN & ALOKASI SKOR ===
0. WAJIB MENILAI KESELURUHAN SOAL TANPA TERKECUALI! PASTIKAN JUMLAH ITEM DALAM ARRAY 'analysis' SAMA PERSIS DENGAN JUMLAH SOAL, KUNCI JAWABAN, DAN JAWABAN SISWA. JANGAN MEMOTONG ATAU MENGHENTIKAN PENILAIAN DI TENGAH JALAN!
1. PENCOCOKAN NOMOR SOAL: Kaitkan jawaban siswa dengan nomor soal yang benar. Pastikan nomor soal 1 sampai akhir terisi lengkap dan berurutan.
2. TAHAP PENALARAN SINGKAT: Tulis 1 kalimat penalaran di 'reasoning' membandingkan inti jawaban siswa dan kunci.
3. PANDUAN KHUSUS PEMBACAAN OCR TULISAN TANGAN PILIHAN GANDA (A, B, C, D, E):
   - Ambil HANYA 1 huruf pilihan (A, B, C, D, atau E) ke dalam 'studentAnswer'.
   - PEMBEDAAN HURUF 'C' vs 'E' (SANGAT KRITIS - HINDARI KESALAHAN INI):
     * Huruf 'C' (kapital maupun kecil) HANYA berupa SATU lengkungan busur kurva terbuka ke kanan (sisi kiri melengkung mulus cembung, terbuka di sisi kanan). Huruf 'C' TIDAK MEMILIKI tiang vertikal tegak lurus di kiri dan TIDAK MEMILIKI garis mendatar di tengah!
     * WASPADAI GARIS BUKU TULIS BERGARIS: Pada lembar jawaban bergaris, garis horizontal tipis cetakan buku tulis seringkali melintas tepat memotong bagian tengah bukaan huruf 'C'. JANGAN PERNAH menyangka garis horizontal buku tulis tersebut sebagai garis tengah huruf 'E'! Perhatikan tinta pulpen: jika tinta pena melengkung bulat dan hanya ada garis tipis buku di tengahnya, itu 100% adalah huruf 'C', BUKAN 'E'!
     * WASPADAI KAIT/SERIF PADA HURUF 'C': Siswa sering menulis huruf 'C' dengan sedikit lengkungan kait di ujung atas atau bawah. Jangan pernah membacanya sebagai 'E'!
     * Huruf 'E' yang sebenarnya WAJIB memiliki tiang vertikal tegak lurus yang jelas di sisi kiri dan TIGA garis mendatar tebal yang ditarik sengaja dengan tinta pena yang sama (atas, tengah, bawah).
   - PEMBEDAAN HURUF 'B' vs 'D' (SANGAT KRITIS):
     * Huruf 'B' (kapital) WAJIB memiliki tiang vertikal tegak lurus di sisi kiri DAN DUA lekukan bulatan (bulatan atas dan bulatan bawah) yang bertemu di pinggang tengah sisi kanan.
     * Huruf 'D' (kapital) hanya memiliki tiang vertikal di kiri DAN SATU lengkungan busur besar tunggal yang menyatu dari ujung atas sampai ujung bawah.
     * JIKA ADA LEKUKAN PINGGANG DI TENGAH SISI KANAN, ITU ADALAH HURUF 'B', BUKAN 'D'!
   - PEMBEDAAN HURUF KECIL 'b' vs 'd':
     * Siswa sering menulis huruf kecil!
     * Huruf 'b' kecil: tiang vertikal tinggi di sebelah KIRI, bulatan di sebelah KANAN bawah.
     * Huruf 'd' kecil: bulatan di sebelah KIRI bawah, tiang vertikal tinggi di sebelah KANAN. JANGAN SAMPAI TERTUKAR!
   - PEMBEDAAN HURUF 'A' vs 'D'/'4':
     * Huruf 'A' memiliki dua kaki miring membentuk tenda/segitiga meruncing ke atas dengan garis mendatar di tengah.
   - PEMBEDAAN HURUF 'C' vs 'O'/'G':
     * Huruf 'C' memiliki bukaan lengkungan yang jelas dan lebar di sebelah kanan.
   - FORMAT PENULISAN SISWA:
     * Jika siswa menulis dengan nomor (misal "1. A", "1) B", "(A)"), BUANG nomor soalnya dan ambil HANYA huruf pilihannya ("A", "B").
     * Jika siswa melingkari atau menyilang salah satu huruf opsi pada lembar, ambil huruf opsi yang dilingkari/dipilih.
     * Jika terdapat coretan atau perbaikan (misal "A B", "A dicoret lalu B", "A -> B"), ambil HANYA HURUF TERAKHIR yang tidak dicoret (huruf kedua).
3b. PANDUAN KHUSUS PEMBACAAN OCR TULISAN TANGAN BENAR / SALAH (BENAR_SALAH):
   - KETENTUAN MUTLAK NILAI studentAnswer:
     * Pada soal bertipe BENAR_SALAH, kolom 'studentAnswer' HANYA BOLEH bernilai salah satu dari dua kata baku: "Benar" ATAU "Salah" (atau singkatan huruf "B" / "S", "✓" / "✗").
     * DILARANG KERAS mengeluarkan kata-kata non-kamus, typo, atau kesalahan OCR fonetik seperti "lenar", "terlah", "tenar", "denar", "serlah", "bener", "slah"!
     * PENGECUALIAN ATURAN VERBATIM: Aturan transkripsi verbatim TIDAK BERLAKU untuk soal BENAR_SALAH dan PILIHAN_GANDA. Anda bertugas mengenali intensi kata siswa apakah "Benar" atau "Salah".
   - KENALI TULISAN TANGAN SAMBUNG (CURSIVE) KATA "Benar":
     * Siswa sering menulis kata "Benar" dengan huruf sambung / cursive:
       - Huruf 'B' bersambung memiliki tiang tinggi yang sering salah dibaca oleh OCR mentah sebagai huruf 'l' (sehingga terbaca "lenar") atau 't' (sehingga terbaca "tenar" atau "terlah").
       - Huruf 'r' di akhir kata "Benar" sering memiliki kait ke atas yang salah dibaca sebagai 'h' (sehingga terbaca "terlah").
       - PAHAMI DENGAN TEGAS: Tulisan tangan seperti "lenar", "terlah", "tenar", "denar", "penar", "bener", "benr" 100% ADALAH KATA "Benar"! Wajib dituliskan ke 'studentAnswer' sebagai "Benar"!
   - KENALI TULISAN TANGAN KATA "Salah":
     * Kata "Salah" selalu diawali huruf lengkung bergelombang 'S' (atau 's') tanpa tiang vertikal lurus di depan. Jika tulisan menyerupai "salah", "slah", "selah", masukkan ke 'studentAnswer' sebagai "Salah".
   - PERBEDAAN BENTUK HURUF 'S' (Salah) vs 'B' (Benar) (SANGAT KRITIS):
     * Huruf 'S' tulisan tangan berupa SATU GARIS GELOMBANG LENGKUNG KONTINU seperti ular (melengkung ke kiri di atas, melengkung ke kanan di bawah). Huruf 'S' TIDAK MEMILIKI TIANG VERTIKAL LURUS!
     * Huruf 'B' WAJIB MEMILIKI TIANG VERTIKAL LURUS TEGAK di sisi kiri dengan dua bulatan di kanan.
     * PERINGATAN KERAS: JANGAN PERNAH membaca huruf kurva gelombang 'S' sebagai 'B'! Jika goresan adalah garis lengkung bergelombang tanpa tiang tegak lurus, itu 100% adalah huruf 'S' (Salah) atau kata "Salah"!
   - PEMBEDAAN KATA "Benar" vs "Salah":
     * Kata "Benar" selalu diawali huruf 'B' dengan tiang tegak lurus ke bawah.
     * Kata "Salah" selalu diawali huruf 'S' dengan lengkungan kurva bergelombang tanpa tiang tegak.
   - SIMBOL CENTANG DAN SILANG:
     * Simbol centang (✓, ✔, v) = transkripsikan sebagai "Benar".
     * Simbol silang (✗, ✕, x, X) = transkripsikan sebagai "Salah".
   - PENGABAIAN JUDUL / PETUNJUK KOLOM:
     * Jika terdapat tulisan "Benar/Salah", "Benar dan salah", "B/S", "B / S", "Pernyataan Benar/Salah", atau teks petunjuk di header tabel: TULISAN TERSEBUT BUKAN JAWABAN SOAL, HARUS DILEWATI SEPENUHNYA! Jangan masukkan judul ini sebagai nomor soal dan jangan menggeser urutan soal siswa.
   - PENANGANAN KOREKSI / CORETAN:
     * Jika siswa menulis dua kata berurutan (misal: "Benar Salah" atau "Salah Benar") atau mencoret kata pertama dan menulis kata kedua, AMBIL HANYA KATA KEDUA / KATA YANG TIDAK DICORET sebagai jawaban akhir siswa di 'studentAnswer'.
     * Jika ragu, tuliskan keduanya apa adanya (misal "Benar Salah") agar sistem pemeriksa otomatis dapat mengambil kata perbaikan kedua secara aman.
3c. KRITERIA PILIHAN GANDA KOMPLEKS / BERTINGKAT:
   - Ekstrak seluruh huruf pilihan yang dipilih siswa (misal: "A, C, E").
*CATATAN INTEGRITAS PENILAIAN: Seluruh soal Pilihan Ganda, Benar/Salah, dan Pilihan Ganda Kompleks/Bertingkat dinilai secara mutlak oleh Aplikasi Sistem (System Grader). AI bertugas membaca dan mentranskripsikan jawaban siswa (OCR) dengan setepat dan seakurat mungkin ke dalam 'studentAnswer'.*
4. KRITERIA ISIAN SINGKAT (SKOR PARSIAL - SANGAT PENTING):
   Penilaian ISIAN SINGKAT harus FLEKSIBEL. Jawaban TIDAK harus exact match. Berikan skor GRADUAL berdasarkan kecocokan makna/konsep:
   - 100% maxScore: Jawaban identik, sinonim sempurna, atau hanya typo minor (cth: "fotosintesa" ≈ "fotosintesis", "Jkt" ≈ "Jakarta")
   - 75% maxScore: Jawaban benar konsepnya tapi beda kata/ejaan signifikan (cth: "pengumuman kemerdekaan" ≈ "proklamasi")
   - 50% maxScore: Jawaban sebagian benar, menyebutkan bagian dari konsep (cth: "Soekarno" ketika kunci "Soekarno-Hatta")
   - 0% maxScore: Jawaban salah total, tidak relevan, atau kosong
   ABAIKAN: typo, kapitalisasi, tanda baca, spasi ekstra.
4b. KRITERIA ESSAY (SKOR PARSIAL - SANGAT PENTING):
   Penilaian ESSAY harus berdasarkan SEBERAPA LENGKAP poin-poin kunci terjawab. Berikan skor GRADUAL:
   - 100% maxScore: Semua poin kunci terjawab lengkap, penjelasan tepat & runtut
   - 75% maxScore: Sebagian besar poin kunci ada, penjelasan cukup baik
   - 50% maxScore: Setengah poin kunci terjawab, atau penjelasan kurang lengkap
   - 25% maxScore: Hanya sedikit poin kunci, jawaban menunjukkan sedikit pemahaman
   - 0% maxScore: Jawaban salah total, tidak relevan, atau kosong
   JANGAN berikan 0 jika siswa menunjukkan USAHA menjawab dengan benar sebagian.
4c. PANDUAN KHUSUS INDIKATOR PENILAIAN PER SOAL (%):
   Jika pada konfigurasi suatu soal tertera rincian 'Indikator Penilaian', alokasikan penilaian berdasarkan bobot persentase indikator tersebut:
   - Pilihan Ganda (PILIHAN_GANDA):
     * Indikator "Pilihan jawaban benar" (Bobot 50%): Nilai ketepatan huruf pilihan (A, B, C, D, E) terhadap kunci jawaban.
     * Indikator "Terdapat Cara pengerjaan yang tepat" (Bobot 50%): Nilai apakah pada lembar jawaban terdapat cara kerja, rumus, atau langkah pengerjaan yang relevan. Jika ada cara lengkap & tepat: 50% maxScore. Jika cara sebagian/kurang: skor proporsional. Jika hanya menulis huruf tanpa cara pengerjaan: skor 0 untuk indikator cara pengerjaan ini.
   - Benar dan Salah (BENAR_SALAH):
     * Indikator "Pilihan jawaban Benar" (Bobot 50%): Nilai ketepatan pilihan kata "Benar" atau "Salah".
     * Indikator "Terdapat Penjelasan/Cara Pengerjaan" (Bobot 50%): Nilai apakah siswa menyertakan penjelasan/argumen pendukung mengapa pernyataan tersebut Benar/Salah. Jika ada penjelasan tepat: 50% maxScore. Jika penjelasan kurang lengkap: skor proporsional. Jika tanpa penjelasan sama sekali: skor 0 untuk indikator penjelasan ini.
   - Essay (ESSAY / URAIAN):
     * Indikator "Tulisan jawaban Tidak ada Typo" (Bobot 25%): Nilai ketelitian ejaan dan ketiadaan salah tulis/typo. Tanpa typo: 25% maxScore penuh. Sedikit typo minor: 15-20%. Banyak typo: 0-10%.
     * Indikator "Tulisan tidak sesuai dengan kunci jawaban tapi sesuai konteks pertanyaan" (Bobot 75%): Nilai pemahaman konsep dan substansi jawaban yang relevan dengan pertanyaan, meskipun susunan kalimat atau istilah berbeda dari kunci jawaban guru.
   - Nilai Default 100%: Jika guru tidak menambahkan indikator pada soal, nilai diberikan 100% secara utuh pada kesesuaian jawaban.
   Pada setiap soal yang memiliki indikator, sertakan array 'indicators' yang mengevaluasi masing-masing indikator.
5. ATURAN TEKS TIDAK TERBACA: Jika tulisan mengandung kata aneh tak bermakna (UNREADABLE), anggap salah. Jangan menebak.
6. KONSISTENSI MUTLAK (SANGAT PENTING): Jika dua atau lebih siswa memberikan jawaban dengan makna dan substansi yang sama persis, Anda WAJIB memberikan skor yang SAMA PERSIS. Jangan mengubah standar penilaian di tengah jalan. Jangan mengurangi poin tanpa alasan logis yang kuat.
7. STATUS PENILAIAN ('status'): Kolom ini HANYA boleh diisi dengan "OK" atau "UNREADABLE". Jangan gunakan kata lain seperti "Salah", "Benar", atau "ERROR".

=== ATURAN EKSTRAKSI TEKS (OCR) ===
1. PENANGANAN KOREKSI & CORETAN (SANGAT PENTING): Identifikasi teks, huruf, atau angka yang dicoret (strikethrough), dicoret tebal, atau ditimpa oleh penulis. ABAIKAN bagian tersebut sepenuhnya. JANGAN transkripsikan teks yang sudah dibatalkan. Hanya ekstrak teks FINAL yang dipertahankan/dimaksudkan oleh penulis.
2. STRUKTUR & HIERARKI: Pertahankan hierarki dokumen asli. Pertahankan penomoran persis seperti urutan di dokumen.
3. TRANSKRIPSI TEKS & NORMALISASI OBJEKTIF: Ekstrak teks persis seperti yang tertulis untuk soal ISIAN dan ESSAY. Untuk soal PILIHAN GANDA, HANYA ambil 1 huruf opsi (A, B, C, D, E). Untuk soal BENAR_SALAH, HANYA ambil kata baku "Benar" atau "Salah" (jangan mengeluarkan kata cacat/typo OCR seperti "lenar" atau "terlah"). Jangan melakukan koreksi tata bahasa pada teks yang valid.
4. TEKS TIDAK TERBACA: Jika tulisan mengandung kata aneh tak bermakna (UNREADABLE), tandai sebagai tidak terbaca. Jangan menebak.
5. WAJIB BAHASA INDONESIA: PASTIKAN seluruh hasil pembacaan teks ditulis menggunakan bahasa Indonesia. JANGAN PERNAH menerjemahkan teks tersebut ke bahasa Inggris atau bahasa lain.

=== FORMAT OUTPUT JSON (SANGAT PENTING - WAJIB VALID SINTAKS JSON) ===
Output WAJIB berupa JSON murni yang VALID secara sintaks tanpa markdown, tanpa backticks, dan TANPA KALIMAT PEMBUKA/PENUTUP.
ATURAN SINTAKS JSON SANGAT KETAT:
1. Pastikan SETIAP elemen objek di dalam array 'analysis' SELALU dipisahkan dengan tanda koma (','). Contoh: [ { ... }, { ... } ]. JANGAN PERNAH melewatkan tanda koma antar elemen!
2. DILARANG menambahkan tanda koma setelah elemen terakhir (TIDAK BOLEH ada trailing comma sebelum kurung siku penutup ']').
3. Jika di dalam teks (studentAnswer, reasoning, atau analysisText) terdapat tanda kutip ganda, WAJIB di-escape dengan '\\"'.
Struktur JSON yang dihasilkan:
{
  "totalScore": number,
  "generalFeedback": "Apresiasi/umpan balik singkat keseluruhan",
  "analysis": [
    {
      "questionNumber": "string",
      "studentAnswer": "teks jawaban siswa",
      "reasoning": "1 kalimat perbandingan",
      "score": number,
      "maxScore": number,
      "analysisText": "Penjelasan singkat",
      "indicators": [
        {
          "name": "nama indikator",
          "weight": number,
          "score": number,
          "maxScore": number,
          "feedback": "ulasan pemenuhan indikator"
        }
      ],
      "status": "OK"
    }
  ]
}

=== TUGAS ANDA SEKARANG ===
${imageCount > 1 ? `Terdapat ${imageCount} gambar halaman jawaban siswa yang dilampirkan. Baca semuanya secara BERURUTAN (Halaman 1, 2, dst) lalu nilai berdasarkan aturan dan kunci di atas.` : 'Terdapat 1 gambar halaman jawaban siswa yang dilampirkan. Baca lalu nilai berdasarkan aturan dan kunci di atas.'}
`;
}

/**
 * Call AI with multi-image support using fallback chain.
 * Hierarchy:
 * 1. PRIMARY: OpenRouter2 (Free) - nvidia/nemotron-3.5-super-vl:free (OPENROUTER_API_KEY2)
 * 2. FALLBACK 1: NVIDIA Direct API (https://integrate.api.nvidia.com/v1) - nvidia/nemotron-3.5-super-vl-120b-a12b & meta/muse-glimmer-30b
 * 3. FALLBACK 2: OpenRouter (Berbayar) - nvidia/nemotron-3.5-super-vl (OPENROUTER_API_KEY)
 * 4. FALLBACK 3: Groq (Qwen - qwen/qwen3.8-27b)
 */
async function callUnifiedAI(
  prompt: string,
  compressedImages: CompressedImage[]
): Promise<string> {
  const contentParts: any[] = [{ type: "text", text: prompt }];
  for (const img of compressedImages) {
    contentParts.push({
      type: "image_url",
      image_url: { url: `data:${img.mimeType};base64,${img.base64Data}` }
    });
  }

  // ============================================================
  // 1. PRIMARY: OpenRouter2 (NVIDIA Nemotron 3.5 Super VL Free)
  // ============================================================
  const openRouterApiKey2 = (process.env.OPENROUTER_API_KEY2 || process.env.OPENROUTER_API_KEY)?.trim().replace(/^["']|["']$/g, "");
  if (openRouterApiKey2) {
    const primaryModel = process.env.OPENROUTER_MODEL_FREE || "nvidia/nemotron-3.5-super-vl:free";
    try {
      console.log(`[Grade BG] Memanggil model unified (Primary - OpenRouter2 Free): ${primaryModel}`);

      const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterApiKey2}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://solusi-guru.vercel.app",
          "X-Title": "Solusi Guru",
        },
        body: JSON.stringify({
          model: primaryModel,
          messages: [{ role: "user", content: contentParts }],
          temperature: 0.0,
          max_tokens: 16384,
        }),
      });

      if (!orResponse.ok) {
        const errBody = await orResponse.text();
        console.error(`[Grade BG] OpenRouter2 Primary Error (${primaryModel}):`, errBody);
        throw new Error(`OpenRouter2 API returned ${orResponse.status} - ${errBody}`);
      }

      const orData = await orResponse.json();
      const text = orData.choices?.[0]?.message?.content || "";
      if (!text) throw new Error("Empty response from OpenRouter2 Primary");

      // Validasi awal bahwa teks AI dapat diparse/dipulihkan menjadi JSON
      safeParseAIJson(text);

      console.log(`[Grade BG] Unified OCR+Grade berhasil menggunakan OpenRouter2 Primary: ${primaryModel}`);
      return text;
    } catch (or2Err: any) {
      console.warn("[Grade BG] OpenRouter2 Primary gagal, mencoba Fallback 1 (NVIDIA Direct)...", or2Err?.message);
    }
  } else {
    console.warn("[Grade BG] OPENROUTER_API_KEY2 tidak ditemukan, melanjutkan ke Fallback 1 NVIDIA Direct...");
  }

  // ============================================================
  // 2. FALLBACK 1: NVIDIA Direct API (Nemotron 120B / meta/muse-glimmer-30b)
  // ============================================================
  const nvidiaApiKey = (process.env.NVIDIA_API_KEY || process.env.NVIDIA_KEY)?.trim().replace(/^["']|["']$/g, "");
  if (nvidiaApiKey) {
    const nvidiaModels = [
      process.env.NVIDIA_MODEL || "nvidia/nemotron-3.5-super-vl-120b-a12b",
      "meta/muse-glimmer-30b"
    ];

    for (const nvModel of nvidiaModels) {
      try {
        console.log(`[Grade BG] Memanggil model unified (Fallback 1 - NVIDIA): ${nvModel}`);

        const nvResponse = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${nvidiaApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: nvModel,
            messages: [{ role: "user", content: contentParts }],
            temperature: 0.0,
            max_tokens: 16384,
          }),
        });

        if (!nvResponse.ok) {
          const errBody = await nvResponse.text();
          console.error(`[Grade BG] NVIDIA Fallback 1 Error (${nvModel}):`, errBody);
          throw new Error(`NVIDIA API returned ${nvResponse.status} - ${errBody}`);
        }

        const nvData = await nvResponse.json();
        const text = nvData.choices?.[0]?.message?.content || "";
        if (!text) throw new Error(`Empty response from NVIDIA (${nvModel})`);

        // Validasi awal bahwa teks AI dapat diparse/dipulihkan menjadi JSON
        safeParseAIJson(text);

        console.log(`[Grade BG] Unified OCR+Grade berhasil menggunakan NVIDIA Fallback 1: ${nvModel}`);
        return text;
      } catch (nvErr: any) {
        console.warn(`[Grade BG] NVIDIA model ${nvModel} gagal:`, nvErr?.message);
      }
    }
    console.warn("[Grade BG] Seluruh model NVIDIA gagal, mencoba Fallback 2 (OpenRouter Berbayar)...");
  } else {
    console.warn("[Grade BG] NVIDIA_API_KEY tidak ditemukan, melanjutkan ke Fallback 2 OpenRouter...");
  }

  // ============================================================
  // 3. FALLBACK 2: OpenRouter (nvidia/nemotron-3.5-super-vl - Berbayar)
  // ============================================================
  const openRouterApiKey = process.env.OPENROUTER_API_KEY?.trim().replace(/^["']|["']$/g, "");
  if (openRouterApiKey) {
    try {
      const orModel = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3.5-super-vl";
      console.log(`[Grade BG] Memanggil model unified (Fallback 2 - OpenRouter Berbayar): ${orModel}`);

      const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://solusi-guru.vercel.app",
          "X-Title": "Solusi Guru",
        },
        body: JSON.stringify({
          model: orModel,
          messages: [{ role: "user", content: contentParts }],
          temperature: 0.0,
          max_tokens: 16384,
        }),
      });

      if (!orResponse.ok) {
        const errBody = await orResponse.text();
        console.error(`[Grade BG] OpenRouter Fallback 2 Error (${orModel}):`, errBody);
        throw new Error(`OpenRouter API returned ${orResponse.status} - ${errBody}`);
      }

      const orData = await orResponse.json();
      const text = orData.choices?.[0]?.message?.content || "";
      if (!text) throw new Error("Empty response from OpenRouter Fallback 2");

      // Validasi awal bahwa teks AI dapat diparse/dipulihkan menjadi JSON
      safeParseAIJson(text);

      console.log(`[Grade BG] Unified OCR+Grade berhasil menggunakan OpenRouter Fallback 2: ${orModel}`);
      return text;
    } catch (openRouterErr: any) {
      console.warn("[Grade BG] OpenRouter Fallback 2 (Nemotron berbayar) gagal, mencoba Fallback 3 (Groq)...", openRouterErr?.message);
    }
  }

  // ============================================================
  // 4. FALLBACK 3: Groq (Qwen)
  // ============================================================
  try {
    const { groqRateLimiter } = await import("@/modules/ai/rateLimiter");
    const { key } = await groqRateLimiter.waitForKey(30000);
    const tertiaryModel = "qwen/qwen3.8-27b";
    console.log(`[Grade BG] Memanggil model unified (Fallback 3 - Groq): ${tertiaryModel}`);

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: tertiaryModel,
        messages: [{ role: "user", content: contentParts }],
        temperature: 0.0,
        max_tokens: 16384,
      }),
    });

    if (!groqResponse.ok) {
      const errBody = await groqResponse.text();
      console.error("[Grade BG] Groq Fallback 3 Error:", errBody);
      throw new Error(`Groq API returned ${groqResponse.status} - ${errBody}`);
    }

    const groqData = await groqResponse.json();
    const text = groqData.choices?.[0]?.message?.content || "";
    if (!text) throw new Error("Empty response from Groq Fallback 3");

    // Validasi awal bahwa teks AI dapat diparse/dipulihkan menjadi JSON
    safeParseAIJson(text);

    console.log(`[Grade BG] Unified OCR+Grade berhasil menggunakan Groq Fallback 3: ${tertiaryModel}`);
    return text;
  } catch (groqError: any) {
    console.error("[Grade BG] Seluruh provider (OpenRouter2 Primary, NVIDIA Fallback 1, OpenRouter Fallback 2, Groq Fallback 3) gagal:", groqError?.message);
  }

  throw new Error("Semua provider AI (OpenRouter2 Primary, NVIDIA Fallback 1, OpenRouter Fallback 2, Groq Fallback 3) gagal.");
}

// In-flight tracking to prevent concurrent double-grading on the same submission
const inFlightGradings = new Set<string>();

/**
 * Background function: Unified Extract + Grade in ONE AI call per student, then save results.
 * Runs after HTTP response has been sent.
 */
async function processFullGradingInBackground(
  base64Images: string[],
  assignmentId: string,
  submissionId: string
) {
  if (inFlightGradings.has(submissionId)) {
    console.log(`[Grade BG][Sub ${submissionId.slice(-6)}] Penilaian sedang berjalan untuk submission ini. Mengabaikan panggilan duplikat.`);
    return;
  }
  inFlightGradings.add(submissionId);

  try {
    await dbConnect();

    // === STEP 1: Compress all images ===
    // Resolusi tinggi (1400-1800px) untuk memastikan goresan huruf tangan (B vs D, S vs B) terbaca sangat tajam
    const targetDimension = base64Images.length >= 3 ? 1400 : (base64Images.length === 2 ? 1600 : 1800);
    console.log(`[Grade BG][Sub ${submissionId.slice(-6)}] Mulai kompresi ${base64Images.length} gambar (target max ${targetDimension}px)`);
    const compressedImages: CompressedImage[] = [];
    for (let i = 0; i < base64Images.length; i++) {
      try {
        const compressed = await compressSingleImage(base64Images[i], targetDimension);
        compressedImages.push(compressed);
        console.log(`[Grade BG][Sub ${submissionId.slice(-6)}] Halaman ${i + 1}/${base64Images.length} berhasil dikompres`);
      } catch (err: any) {
        console.error(`[Grade BG][Sub ${submissionId.slice(-6)}] Gagal kompresi halaman ${i + 1}:`, err.message);
        // Skip gambar yang gagal dikompres
      }
    }

    if (compressedImages.length === 0) {
      throw new Error("Tidak ada gambar yang berhasil diproses.");
    }

    // === STEP 2: Fetch assignment data (parallel) ===
    console.log(`[Grade BG][Sub ${submissionId.slice(-6)}] Mengambil data tugas untuk assignment ${assignmentId}`);
    const [assignment, existingAnswerKey, questions] = await Promise.all([
      Assignment.findById(assignmentId).lean(),
      attachmentService.getAnswerKey(assignmentId),
      AssignmentQuestion.find({ assignmentId }).sort({ order: 1 }).lean()
    ]);

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    const answerKey = existingAnswerKey || "";

    // === STEP 3: Build unified prompt & call AI (1 panggilan untuk OCR + Grade) ===
    const unifiedPrompt = buildUnifiedPrompt(answerKey, questions, compressedImages.length);

    console.log(`[Grade BG][Sub ${submissionId.slice(-6)}] Memanggil AI unified (OCR+Grade) dengan ${compressedImages.length} gambar`);
    const responseText = await callUnifiedAI(unifiedPrompt, compressedImages);

    console.log(`[Grade BG][Sub ${submissionId.slice(-6)}] Respons AI diterima. Parsing JSON...`);

    // === STEP 4: Parse JSON response with auto-repair and regex salvage ===
    const assessmentResult = safeParseAIJson(responseText);

    // === STEP 5: Normalize and enforce scores ===
    let actualTotalScore = 0;
    const normalizedAnalyses: any[] = [];
    const answerKeyMap = parseAnswerKeyMap(answerKey);

    if (questions && questions.length > 0) {
      // WAJIB URUTKAN SOAL SECARA NUMERIK (1, 2, 3, ... N) SEBELUM DINILAI
      const sortedQuestions = [...questions].sort((a: any, b: any) => {
        const aNum = typeof a.order === 'number' ? a.order : (parseInt(String(a.order).replace(/\D/g, '')) || 0);
        const bNum = typeof b.order === 'number' ? b.order : (parseInt(String(b.order).replace(/\D/g, '')) || 0);
        return aNum - bNum;
      });

      for (const q of sortedQuestions) {
        const aiAnalysis = assessmentResult.analysis?.find((a: any) => {
          const qn = parseInt(String(a.questionNumber).replace(/\D/g, '')) || 0;
          return qn === q.order;
        });

        let finalScore = 0;
        let maxScore = q.maxScore || 10;
        let reasoning = "";
        let analysisText = "Jawaban tidak ditemukan pada hasil pembacaan tulisan.";
        let validStatus = "UNREADABLE";
        let studentAnswer = "[Kosong/Tidak Terjawab]";
        let evaluatedIndicators: any[] = [
          {
            name: "Kesesuaian Jawaban",
            weight: 100,
            score: 0,
            maxScore,
            feedback: "Jawaban kosong atau tidak ditemukan."
          }
        ];

        if (aiAnalysis) {
          studentAnswer = aiAnalysis.studentAnswer || "[Kosong]";

          // Kunci jawaban efektif: prioritas q.correctAnswer, fallback ke answerKeyMap
          const fallbackKey = answerKeyMap.get(q.order)?.key;
          const effectiveCorrectAnswer = (q.correctAnswer && q.correctAnswer.trim().length > 0)
            ? q.correctAnswer
            : (fallbackKey || "");

          const hasCustomIndicators = Array.isArray(q.indicators) && q.indicators.length > 0;
          evaluatedIndicators = [];

          if (hasCustomIndicators) {
            // === KASUS 1: GURU MENAMBAHKAN INDIKATOR PADA SOAL (BOBOT %) ===
            for (let indIdx = 0; indIdx < q.indicators.length; indIdx++) {
              const ind = q.indicators[indIdx];
              const indWeight = Number(ind.weight) || 0;
              const indMaxScore = Math.round((indWeight / 100) * maxScore * 10) / 10;
              let indScore = 0;
              let indFeedback = "";
              const indNameLower = (ind.name || "").toLowerCase();

              // A. PILIHAN GANDA (Pilihan jawaban benar 50%, Terdapat Cara pengerjaan yang tepat 50%)
              if (q.questionType === "PILIHAN_GANDA") {
                if (indNameLower.includes("pilihan") || indNameLower.includes("jawaban") || indNameLower.includes("benar") || indNameLower.includes("opsi")) {
                  const normStudent = normalizePGAnswer(studentAnswer);
                  const normKey = normalizePGAnswer(effectiveCorrectAnswer);
                  if (normStudent && normKey && normStudent === normKey) {
                    indScore = indMaxScore;
                    indFeedback = `Pilihan huruf (${normStudent}) benar (Kunci: ${normKey}).`;
                  } else {
                    indScore = 0;
                    indFeedback = `Pilihan huruf (${normStudent || studentAnswer}) salah (Kunci: ${normKey || effectiveCorrectAnswer}).`;
                  }
                } else {
                  // Indikator Cara Pengerjaan / Langkah Kerja
                  const aiInd = aiAnalysis.indicators?.find((aiI: any) =>
                    aiI.name?.toLowerCase().includes("cara") ||
                    aiI.name?.toLowerCase().includes("pengerjaan") ||
                    aiI.name?.toLowerCase().includes("langkah") ||
                    aiI.name === ind.name
                  ) || aiAnalysis.indicators?.[indIdx];

                  const rawScore = Number(aiInd?.score);
                  if (!isNaN(rawScore)) {
                    indScore = Math.min(indMaxScore, Math.max(0, Math.round(rawScore * 10) / 10));
                  } else {
                    indScore = 0;
                  }
                  indFeedback = aiInd?.feedback || (indScore > 0 ? "Cara pengerjaan ditemukan dan tepat." : "Cara pengerjaan tidak ditemukan pada lembar siswa.");
                }
              }
              // B. BENAR DAN SALAH (Pilihan jawaban Benar 50%, Terdapat Penjelasan/Cara Pengerjaan 50%)
              else if (q.questionType === "BENAR_SALAH") {
                if (indNameLower.includes("pilihan") || (indNameLower.includes("benar") && !indNameLower.includes("penjelasan"))) {
                  if (isAmbiguousBSAnswer(studentAnswer)) {
                    indScore = 0;
                    indFeedback = '❌ Jawaban ambigu/menulis kedua opsi ("Benar/Salah"). Skor: 0.';
                  } else {
                    const normStudent = normalizeBSAnswer(studentAnswer);
                    const normKey = normalizeBSAnswer(effectiveCorrectAnswer);
                    if (normStudent && normKey && normStudent === normKey) {
                      indScore = indMaxScore;
                      indFeedback = `Pilihan jawaban (${normStudent}) benar.`;
                    } else {
                      indScore = 0;
                      indFeedback = `Pilihan jawaban (${normStudent || studentAnswer}) salah (Kunci: ${normKey || effectiveCorrectAnswer}).`;
                    }
                  }
                } else {
                  // Indikator Penjelasan / Cara Pengerjaan
                  const aiInd = aiAnalysis.indicators?.find((aiI: any) =>
                    aiI.name?.toLowerCase().includes("penjelasan") ||
                    aiI.name?.toLowerCase().includes("alasan") ||
                    aiI.name?.toLowerCase().includes("cara") ||
                    aiI.name === ind.name
                  ) || aiAnalysis.indicators?.[indIdx];

                  const rawScore = Number(aiInd?.score);
                  if (!isNaN(rawScore)) {
                    indScore = Math.min(indMaxScore, Math.max(0, Math.round(rawScore * 10) / 10));
                  } else {
                    indScore = 0;
                  }
                  indFeedback = aiInd?.feedback || (indScore > 0 ? "Terdapat penjelasan/cara pengerjaan yang relevan." : "Tidak ada penjelasan/cara pengerjaan yang disertakan.");
                }
              }
              // C. ESSAY (Tulisan jawaban Tidak ada Typo: 25%, Tulisan tidak sesuai kunci tapi sesuai konteks: 75%)
              else {
                const aiInd = aiAnalysis.indicators?.find((aiI: any) => {
                  const aName = (aiI.name || "").toLowerCase();
                  if (indNameLower.includes("typo") || indNameLower.includes("type")) return aName.includes("typo") || aName.includes("ejaan");
                  if (indNameLower.includes("konteks")) return aName.includes("konteks") || aName.includes("substansi") || aName.includes("kunci");
                  return aName === indNameLower;
                }) || aiAnalysis.indicators?.[indIdx];

                const rawScore = Number(aiInd?.score);
                if (!isNaN(rawScore)) {
                  indScore = Math.min(indMaxScore, Math.max(0, Math.round(rawScore * 10) / 10));
                } else {
                  // Proporsikan dari skor total AI jika LLM tidak memecah per-sub-item
                  const aiRatio = maxScore > 0 ? (Number(aiAnalysis.score) || 0) / maxScore : 0;
                  indScore = Math.round(indMaxScore * aiRatio * 10) / 10;
                }
                indFeedback = aiInd?.feedback || aiAnalysis.analysisText || "Dinilai berdasarkan rubrik indikator.";
              }

              evaluatedIndicators.push({
                name: ind.name,
                weight: indWeight,
                score: indScore,
                maxScore: indMaxScore,
                feedback: indFeedback
              });
            }

            finalScore = evaluatedIndicators.reduce((sum, item) => sum + item.score, 0);
            finalScore = Math.min(maxScore, Math.max(0, Math.round(finalScore * 10) / 10));
            reasoning = evaluatedIndicators.map(i => `${i.name} (${i.weight}%): ${i.score}/${i.maxScore}`).join("; ");
            analysisText = evaluatedIndicators.map(i => `• ${i.name} (${i.weight}%): ${i.score}/${i.maxScore} — ${i.feedback || ''}`).join("\n");
            validStatus = (aiAnalysis.status === "UNREADABLE" || aiAnalysis.status === "MANUAL_EDIT") ? aiAnalysis.status : "OK";

            console.log(`[Indicator Grader][Sub ${submissionId.slice(-6)}] Soal ${q.order} (${q.questionType}): Total ${finalScore}/${maxScore} (${evaluatedIndicators.map(i => `${i.name}: ${i.score}/${i.maxScore}`).join(', ')})`);
          } else {
            // === KASUS 2: NILAI DEFAULT 100% (GURU TIDAK MENAMBAHKAN INDIKATOR) ===
            // Soal Objektif Murni (PILIHAN_GANDA, BENAR_SALAH, PILIHAN_GANDA_BERTINGKAT/KOMPLEKS) HANYA DINILAI OLEH APLIKASI
            if (isPureObjectiveType(q.questionType)) {
              const systemResult = gradeObjectiveQuestion({
                questionNumber: String(q.order),
                questionType: q.questionType,
                studentAnswer,
                correctAnswer: effectiveCorrectAnswer,
                maxScore
              });

              if (systemResult !== null) {
                finalScore = systemResult.score;
                reasoning = systemResult.reasoning;
                analysisText = systemResult.analysisText;
                studentAnswer = systemResult.studentAnswer;
                validStatus = systemResult.status;
                console.log(`[System Grader][Sub ${submissionId.slice(-6)}] Soal ${q.order} (${q.questionType}): "${studentAnswer}" vs "${effectiveCorrectAnswer}" → ${finalScore}/${maxScore}`);
              } else {
                finalScore = 0;
                reasoning = `Kunci jawaban untuk soal ${q.questionType} tidak ditemukan.`;
                analysisText = `⚠️ Kunci jawaban belum dikonfigurasi.`;
                validStatus = "OK";
                console.warn(`[System Grader][Sub ${submissionId.slice(-6)}] Soal ${q.order} (${q.questionType}): Kunci jawaban tidak ditemukan.`);
              }
            } else if (hasValidCorrectAnswer({ questionType: q.questionType, correctAnswer: effectiveCorrectAnswer })) {
              // Soal Isian Singkat dengan kunci jawaban
              const systemResult = gradeObjectiveQuestion({
                questionNumber: String(q.order),
                questionType: q.questionType,
                studentAnswer,
                correctAnswer: effectiveCorrectAnswer,
                maxScore
              });
              if (systemResult !== null) {
                finalScore = systemResult.score;
                reasoning = systemResult.reasoning;
                analysisText = systemResult.analysisText;
                studentAnswer = systemResult.studentAnswer;
                validStatus = systemResult.status;
                console.log(`[System Grader][Sub ${submissionId.slice(-6)}] Soal ${q.order} (${q.questionType}): "${studentAnswer}" vs "${effectiveCorrectAnswer}" → ${finalScore}/${maxScore}`);
              } else {
                // Similarity rendah pada ISIAN_SINGKAT → evaluasi kontekstual AI
                finalScore = Number(aiAnalysis.score) || 0;
                if (finalScore > maxScore) finalScore = maxScore;
                if (finalScore < 0) finalScore = 0;
                reasoning = aiAnalysis.reasoning || "";
                analysisText = aiAnalysis.analysisText || "";
                validStatus = (aiAnalysis.status === "UNREADABLE" || aiAnalysis.status === "MANUAL_EDIT") ? aiAnalysis.status : "OK";
                console.log(`[AI Fallback][Sub ${submissionId.slice(-6)}] Soal ${q.order} (${q.questionType}): Evaluasi kontekstual AI: ${finalScore}/${maxScore}`);
              }
            } else {
              // Soal Non-Objektif (ESSAY atau tanpa kunci jawaban)
              finalScore = Number(aiAnalysis.score) || 0;
              if (finalScore > maxScore) finalScore = maxScore;
              if (finalScore < 0) finalScore = 0;
              reasoning = aiAnalysis.reasoning || "";
              analysisText = aiAnalysis.analysisText || "";
              validStatus = (aiAnalysis.status === "UNREADABLE" || aiAnalysis.status === "MANUAL_EDIT") ? aiAnalysis.status : "OK";
            }

            evaluatedIndicators = [
              {
                name: "Kesesuaian Jawaban",
                weight: 100,
                score: finalScore,
                maxScore,
                feedback: reasoning || analysisText
              }
            ];
          }
        }

        actualTotalScore += finalScore;

        normalizedAnalyses.push({
          questionNumber: String(q.order),
          score: finalScore,
          maxScore,
          reasoning,
          analysisText,
          studentAnswer,
          indicators: evaluatedIndicators,
          status: validStatus
        });
      }
    } else {
      // Fallback jika tidak ada konfigurasi structured questions:
      // WAJIB URUTKAN ANALISIS AI SECARA NUMERIK (1, 2, 3, ... N)
      const rawAnalysis = Array.isArray(assessmentResult.analysis) ? assessmentResult.analysis : [];
      const sortedAnalysis = [...rawAnalysis].sort((a: any, b: any) => {
        const aNum = parseInt(String(a.questionNumber).replace(/\D/g, '')) || 0;
        const bNum = parseInt(String(b.questionNumber).replace(/\D/g, '')) || 0;
        return aNum - bNum;
      });

      sortedAnalysis.forEach((analysis: any) => {
        const qOrder = parseInt(String(analysis.questionNumber).replace(/\D/g, '')) || 0;
        // Jika nomor soal tidak valid atau merupakan judul petunjuk "Benar/Salah", lewati sepenuhnya!
        if (qOrder === 0 || isAmbiguousBSAnswer(String(analysis.questionNumber))) {
          console.log(`[Grade BG][Sub ${submissionId.slice(-6)}] Mengabaikan teks petunjuk/judul bukan soal: "${analysis.questionNumber}"`);
          return;
        }
        let maxScore = Number(analysis.maxScore) || 10;
        let finalScore = Number(analysis.score) || 0;
        let reasoning = analysis.reasoning || "";
        let analysisText = analysis.analysisText || "";
        let studentAnswer = analysis.studentAnswer || "[Kosong]";
        let validStatus = (analysis.status === "UNREADABLE" || analysis.status === "MANUAL_EDIT") ? analysis.status : "OK";

        const keyInfo = answerKeyMap.get(qOrder);
        if (keyInfo && keyInfo.detectedType && isPureObjectiveType(keyInfo.detectedType)) {
          const systemResult = gradeObjectiveQuestion({
            questionNumber: String(qOrder),
            questionType: keyInfo.detectedType,
            studentAnswer,
            correctAnswer: keyInfo.key,
            maxScore
          });
          if (systemResult !== null) {
            finalScore = systemResult.score;
            reasoning = systemResult.reasoning;
            analysisText = systemResult.analysisText;
            studentAnswer = systemResult.studentAnswer;
            validStatus = systemResult.status;
            console.log(`[System Grader Auto][Sub ${submissionId.slice(-6)}] Soal ${qOrder} (${keyInfo.detectedType}): "${studentAnswer}" vs "${keyInfo.key}" → ${finalScore}/${maxScore}`);
          }
        }

        if (finalScore > maxScore) finalScore = maxScore;
        if (finalScore < 0) finalScore = 0;

        actualTotalScore += finalScore;

        normalizedAnalyses.push({
          ...analysis,
          questionNumber: String(analysis.questionNumber),
          studentAnswer,
          score: finalScore,
          maxScore,
          reasoning,
          analysisText,
          indicators: [
            {
              name: "Kesesuaian Jawaban",
              weight: 100,
              score: finalScore,
              maxScore,
              feedback: reasoning || analysisText
            }
          ],
          status: validStatus
        });
      });
    }

    // === STEP 6: Delete old assessment if exists to prevent E11000 duplicate key error ===
    await AIAssessment.deleteMany({ submissionId });

    // === STEP 7: Save Assessment and Analysis to DB ===
    const assessmentRecord = await AIAssessment.create({
      submissionId,
      provider: "Unified-OCR-Grade",
      suggestedScore: actualTotalScore,
      feedback: assessmentResult.generalFeedback,
      status: "SUCCESS",
    });

    for (const analysis of normalizedAnalyses) {
      const combinedAnalysis = (analysis.reasoning ? `**Penalaran AI:**\n${analysis.reasoning}\n\n**Umpan Balik:**\n` : '') + (analysis.analysisText || "Tidak ada analisis.");

      let validStatus = "OK";
      if (analysis.status === "UNREADABLE" || analysis.status === "MANUAL_EDIT") {
        validStatus = analysis.status;
      }

      await StudentAnswerAnalysis.create({
        assessmentId: assessmentRecord._id,
        questionNumber: analysis.questionNumber,
        studentAnswer: analysis.studentAnswer || "[Kosong]",
        score: analysis.score,
        maxScore: analysis.maxScore,
        analysis: combinedAnalysis,
        indicators: analysis.indicators || [],
        status: validStatus,
      });
    }

    // === STEP 8: Update submission status to AI_COMPLETED ===
    await Submission.findByIdAndUpdate(submissionId, {
      status: "AI_COMPLETED",
      submittedAt: new Date()
    });

    console.log(`\n============================================================`);
    console.log(`[Grade BG] ✅ SELESAI PENILAIAN SUBMISSION: ${submissionId}`);
    console.log(`[Grade BG] Total Soal Diperiksa: ${normalizedAnalyses.length} butir (Berurutan Soal 1 s/d ${normalizedAnalyses.length})`);
    console.log(`[Grade BG] 🏆 TOTAL SKOR AKHIR: ${actualTotalScore}`);
    console.log(`============================================================\n`);

  } catch (error: any) {
    console.error(`[Grade BG] ❌ Gagal memproses submission ${submissionId}:`, error);
    // Update submission status to FAILED so teacher knows it didn't work
    try {
      await Submission.findByIdAndUpdate(submissionId, { status: "FAILED" });
    } catch (updateErr) {
      console.error("[Grade BG] Gagal mengupdate status ke FAILED:", updateErr);
    }
  } finally {
    inFlightGradings.delete(submissionId);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { base64Images, assignmentId, studentId } = body;

    // Support both new format (base64Images) and legacy format (extractedText)
    if ((!base64Images || !Array.isArray(base64Images) || base64Images.length === 0) && !body.extractedText) {
      return NextResponse.json({ error: "Missing required fields: base64Images or extractedText" }, { status: 400 });
    }

    if (!assignmentId || !studentId) {
      return NextResponse.json({ error: "Missing required fields: assignmentId, studentId" }, { status: 400 });
    }

    await dbConnect();

    // 1. Create or update Submission with PROCESSING status immediately
    let submission = await Submission.findOne({ assignmentId, studentId });
    if (!submission) {
      submission = await Submission.create({
        assignmentId,
        studentId,
        status: "PROCESSING",
        submittedAt: new Date()
      });
    } else {
      submission.status = "PROCESSING";
      submission.submittedAt = new Date();
      await submission.save();
    }

    const submissionId = submission._id.toString();

    // 2. Fire-and-forget: Start background processing (don't await)
    if (base64Images && base64Images.length > 0) {
      // Unified flow: OCR + Grade all in ONE AI call in background
      processFullGradingInBackground(base64Images, assignmentId, submissionId)
        .catch(err => console.error("[Grade API] Background processing error:", err));
    }

    // 3. Return immediately so teacher can continue scanning
    return NextResponse.json({
      success: true,
      submissionId,
      status: "PROCESSING",
      message: "AI sedang menganalisis tugas. Anda bisa melanjutkan foto tugas siswa berikutnya."
    });

  } catch (error: any) {
    console.error("[Grade API] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process" }, { status: 500 });
  }
}
