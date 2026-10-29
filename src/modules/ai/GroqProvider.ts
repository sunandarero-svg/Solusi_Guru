import { AIProvider, AIAssessmentResult } from "./AIProvider";
import { readFile } from "fs/promises";
import path from "path";
import { groqRateLimiter } from "./rateLimiter";
import { GoogleGenAI } from "@google/genai";

// Cache for dynamically fetched models per API key
const modelCache: Record<string, string[]> = {};

// Circuit breaker untuk Gemini jika kuota harian habis (429 RESOURCE_EXHAUSTED)
let geminiQuotaCooldownUntil = 0;

/**
 * Mengambil daftar model Groq yang tersedia untuk API key tertentu.
 * KHUSUS: Hanya mengambil dan mengembalikan model QWEN sesuai instruksi sistem.
 */
async function getDynamicModels(apiKey: string): Promise<string[]> {
  if (modelCache[apiKey]) {
    return modelCache[apiKey];
  }
  
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    
    if (res.ok) {
      const data = await res.json();
      // Filter KHUSUS model yang berawalan atau mengandung "qwen"
      const qwenModels = (data.data || [])
        .map((m: any) => m.id as string)
        .filter((id: string) => id.toLowerCase().includes("qwen"));
      
      if (qwenModels.length > 0) {
        console.log(`[Groq] Model Qwen terdeteksi untuk key ${apiKey.substring(0, 8)}:`, qwenModels.join(", "));
        modelCache[apiKey] = qwenModels;
        return qwenModels;
      }
    }
  } catch (err: any) {
    console.warn(`[Groq] Gagal mengambil daftar model dinamis: ${err?.message || err}`);
  }

  // Fallback default: Hanya model Qwen
  const fallbackQwen = [
    "qwen/qwen3.8-27b",
    "qwen/qwen-2.5-72b",
    "qwen/qwen-2.5-32b",
    "qwen/qwen3.6-27b"
  ];
  modelCache[apiKey] = fallbackQwen;
  return fallbackQwen;
}

export class GroqProvider implements AIProvider {
  readonly providerName = "Groq-Vision";

  /**
   * Menilai tugas siswa dengan Pipeline 2 Tahap yang Terpisah (Decoupled):
   * Tahap 1: Ekstraksi OCR Teks (Gemini dengan fallback Groq Qwen Vision)
   * Tahap 2: Penilaian Teks Jawaban (MURNI menggunakan Groq Qwen Text)
   * 
   * Keuntungan: Jika penilaian teks diulang (retry), Tahap 1 TIDAK PERNAH diulang,
   * sehingga menghemat kuota token gambar (ITPM) 100%.
   */
  async assessSubmission(
    pages: any[],
    rubrics: any[],
    answerKey?: string,
    questions?: any[]
  ): Promise<AIAssessmentResult> {
    // ----------------------------------------------------
    // TAHAP 1: EKSTRAKSI TEKS DARI GAMBAR (VISION OCR)
    // ----------------------------------------------------
    console.log(`[AI Assessment] Memulai penilaian tugas (${pages.length} halaman)...`);
    const extractedText = await this._extractTextFromPages(pages);
    console.log(`[AI Assessment] Tahap 1 Selesai. Hasil ekstraksi: ${extractedText.length} karakter. Melanjutkan ke Tahap 2...`);

    // ----------------------------------------------------
    // TAHAP 2: PENILAIAN TEKS JAWABAN (GROQ QWEN ONLY)
    // ----------------------------------------------------
    return await this._gradeExtractedText(extractedText, answerKey, questions);
  }

  /**
   * Tahap 1: Ekstrak tulisan tangan siswa dari gambar halaman tugas
   */
  private async _extractTextFromPages(pages: any[]): Promise<string> {
    const visionPrompt = `Kamu adalah sistem AI ahli dalam Optical Character Recognition (OCR) dan analisis tata letak dokumen, khususnya untuk membaca dan mendigitalkan catatan tulisan tangan. Tugasmu adalah mengekstrak teks dari gambar yang diberikan secara akurat, rapi, dan terstruktur.

Patuhi aturan operasional ketat berikut:

1. PENANGANAN KOREKSI & CORETAN (SANGAT PENTING):
Identifikasi teks, huruf, atau angka yang dicoret (strikethrough), dicoret tebal, atau ditimpa oleh penulis. ABAIKAN bagian tersebut sepenuhnya. JANGAN transkripsikan teks yang sudah dibatalkan. Hanya ekstrak teks final yang dipertahankan/dimaksudkan oleh penulis.

2. STRUKTUR & HIERARKI (MARKDOWN):
Pertahankan hierarki dokumen asli. Gunakan format Markdown untuk merapikan hasil:
Gunakan huruf tebal (**teks**) untuk judul blok atau kategori (contoh: A. Pilihan Ganda, B. Isian).
Gunakan penomoran (1, 2, 3) persis seperti urutan di dokumen.
Jika ada teks yang diatur dalam dua kolom (seperti format nomor 1-5 di kiri dan 6-10 di kanan), susun agar tetap sejajar menggunakan spasi atau tabulasi yang rapi.

3. TRANSKRIPSI VERBATIM (APA ADANYA):
Ekstrak teks persis seperti yang tertulis, termasuk variasi ejaan atau singkatan yang digunakan penulis. Jangan melakukan koreksi tata bahasa pada teks yang valid.

4. KELUARAN MURNI (TANPA BASA-BASI):
Hasilkan HANYA teks yang diekstrak. Dilarang keras menambahkan kalimat pembuka, penjelasan, atau kalimat penutup.

5. WAJIB BAHASA INDONESIA PADA UMUMNYA:
PASTIKAN seluruh hasil ekstraksi teks ditulis menggunakan bahasa Indonesia pada umumnya. JANGAN PERNAH menerjemahkan teks tersebut ke bahasa Inggris atau bahasa lain.`;

    // 1. Coba Gemini Vision terlebih dahulu (jika circuit breaker tidak aktif)
    const geminiKey = process.env.GEMINI_API_KEY;
    const isGeminiCoolingDown = Date.now() < geminiQuotaCooldownUntil;

    if (geminiKey && !isGeminiCoolingDown) {
      try {
        console.log(`[AI Vision] Step 1: Mengekstrak teks menggunakan Gemini Primary...`);
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const geminiContentParts: any[] = [visionPrompt];

        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          let buffer: Buffer;
          if (page.storageKey.startsWith("http")) {
            const res = await fetch(page.storageKey);
            buffer = Buffer.from(await res.arrayBuffer());
          } else {
            const filePath = path.join(process.cwd(), "public", page.storageKey.replace(/^\//, ""));
            buffer = await readFile(filePath);
          }
          const mimeType = page.mimeType || "image/jpeg";
          geminiContentParts.push({
            inlineData: {
              data: buffer.toString("base64"),
              mimeType
            }
          });
        }

        const geminiModels = [
          process.env.GEMINI_MODEL?.trim(),
          "gemini-2.0-flash",
          "gemini-1.5-flash",
          "gemini-3.8-flash"
        ].filter(Boolean) as string[];

        let geminiText = "";
        for (const gModel of geminiModels) {
          try {
            const response = await ai.models.generateContent({
              model: gModel,
              contents: geminiContentParts,
              config: { temperature: 0.1 }
            });
            geminiText = response.text || "";
            if (geminiText.trim().length > 0) break;
          } catch (modelErr: any) {
            if (modelErr?.message?.includes("429") || modelErr?.message?.includes("RESOURCE_EXHAUSTED") || modelErr?.message?.includes("quota")) {
              throw modelErr; // Langsung trigger circuit breaker
            }
          }
        }

        if (geminiText.trim().length > 0) {
          console.log(`[AI Vision] Step 1 Berhasil via Gemini (${geminiText.length} karakter).`);
          return geminiText;
        }
      } catch (geminiError: any) {
        const errMsg = geminiError?.message || String(geminiError);
        console.warn(`[AI Vision] Gemini gagal:`, errMsg);
        if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota")) {
          geminiQuotaCooldownUntil = Date.now() + 60 * 60 * 1000; // 60 menit cooldown
          console.warn(`[AI Vision] Kuota harian Gemini habis. Circuit breaker aktif selama 60 menit.`);
        }
      }
    } else if (isGeminiCoolingDown) {
      console.log(`[AI Vision] Gemini dalam masa cooldown kuota harian. Langsung menggunakan Groq Qwen Vision...`);
    }

    // 2. Fallback ke Groq Vision (HANYA MODEL QWEN)
    console.log(`[Groq Fallback] Step 1: Mengekstrak teks menggunakan Groq Qwen Vision...`);
    
    // Siapkan buffer gambar untuk Groq
    const visionContentParts: any[] = [{ type: "text", text: visionPrompt }];
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      let buffer: Buffer;
      if (page.storageKey.startsWith("http")) {
        const res = await fetch(page.storageKey);
        buffer = Buffer.from(await res.arrayBuffer());
      } else {
        const filePath = path.join(process.cwd(), "public", page.storageKey.replace(/^\//, ""));
        buffer = await readFile(filePath);
      }
      const mimeType = page.mimeType || "image/jpeg";
      visionContentParts.push({
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${buffer.toString("base64")}`
        }
      });
    }

    let groqVisionError: any = null;
    const maxRetries = 4;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let apiKey = "";
      try {
        const { key, index: usedIndex } = await groqRateLimiter.waitForKey(30000);
        apiKey = key;
        const totalKeys = groqRateLimiter.getKeys().length;

        const availableModels = await getDynamicModels(apiKey);
        // HANYA model Qwen untuk vision
        const qwenVisionModels = ["qwen/qwen3.8-27b", "qwen/qwen3.6-27b"].filter(m => availableModels.includes(m));
        const modelsToTry = qwenVisionModels.length > 0 ? qwenVisionModels : ["qwen/qwen3.8-27b"];

        for (const visionModel of modelsToTry) {
          try {
            console.log(`[Groq Vision] Attempt ${attempt + 1}/${maxRetries}: Ekstraksi dengan ${visionModel} (Key Index: ${usedIndex + 1}/${totalKeys})...`);
            const visionResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: visionModel,
                messages: [{ role: "user", content: visionContentParts }],
                temperature: 0.1,
                max_tokens: 4096,
              }),
            });

            if (!visionResponse.ok) {
              const errBody = await visionResponse.text();
              if (visionResponse.status === 429) {
                groqRateLimiter.setCooldown(apiKey, 60);
              }
              throw new Error(`Groq Vision API returned ${visionResponse.status}: ${errBody}`);
            }

            const visionData = await visionResponse.json();
            const text = visionData.choices?.[0]?.message?.content;
            if (!text || text.trim().length === 0) {
              throw new Error("Groq Vision API mengembalikan respons kosong.");
            }

            console.log(`[Groq Vision] Ekstraksi berhasil dengan ${visionModel}! Panjang teks: ${text.length}`);
            return text;
          } catch (modelErr: any) {
            groqVisionError = modelErr;
            console.warn(`[Groq Vision] Model ${visionModel} gagal:`, modelErr?.message || modelErr);
            if (modelErr?.message?.includes("429")) {
              continue; // Coba model vision Qwen berikutnya
            }
            throw modelErr;
          }
        }
      } catch (err: any) {
        groqVisionError = err;
        console.warn(`[Groq Vision] Attempt ${attempt + 1} gagal:`, err?.message || err);
        if (apiKey && (err?.message?.includes("429") || err?.status === 429)) {
          groqRateLimiter.setCooldown(apiKey, 60);
        }
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    throw groqVisionError || new Error("Seluruh percobaan ekstraksi gambar (Vision OCR) gagal.");
  }

  /**
   * Tahap 2: Menilai teks jawaban siswa menggunakan Groq MURNI DENGAN MODEL QWEN
   */
  private async _gradeExtractedText(
    extractedText: string,
    answerKey?: string,
    questions?: any[]
  ): Promise<AIAssessmentResult> {
    // Build context instruksi kunci jawaban & konfigurasi soal
    let answerKeyInstruction = "";
    if (answerKey && answerKey.trim().length > 0) {
      answerKeyInstruction = `KUNCI JAWABAN REFERENSI:\n${answerKey}\n`;
    }

    let questionsInstruction = "";
    if (questions && questions.length > 0) {
      const qList = questions.map((q: any) => {
        let line = `Nomor ${q.order}: Tipe ${q.questionType}, Bobot ${q.maxScore}`;
        if (q.correctAnswer && (q.questionType === 'ISIAN_SINGKAT' || q.questionType === 'ESSAY')) {
          line += `, Kunci/Poin: ${q.correctAnswer}`;
        }
        return line;
      }).join("\n");
      questionsInstruction = `KONFIGURASI SOAL & BOBOT:\n${qList}\nNilailah setiap soal siswa berpatokan pada bobot maksimal tersebut (maxScore).\n`;
    } else {
      questionsInstruction = `2. Identifikasi jumlah total soal (N). Alokasikan nilai maksimal (maxScore) proporsional, yaitu 100 / N.`;
    }

    const textPrompt = `Anda adalah asisten guru (AI) penilai tugas siswa.
Tugas Anda menilai transkripsi tulisan siswa secara akurat berdasarkan Kunci Jawaban.

BERIKUT ADALAH HASIL TRANSKRIPSI JAWABAN SISWA:
"""
${extractedText}
"""

${answerKeyInstruction}
${questionsInstruction}

INSTRUKSI PENILAIAN & ALOKASI SKOR:
0. WAJIB MENILAI KESELURUHAN SOAL TANPA TERKECUALI! PASTIKAN JUMLAH ITEM DALAM ARRAY 'analysis' SAMA PERSIS DENGAN JUMLAH SOAL, KUNCI JAWABAN, DAN JAWABAN SISWA. JANGAN MEMOTONG ATAU MENGHENTIKAN PENILAIAN DI TENGAH JALAN!
1. PENCOCOKAN NOMOR SOAL: Kaitkan jawaban siswa dengan nomor soal yang benar.
2. TAHAP PENALARAN SINGKAT: Tulis 1 kalimat penalaran di 'reasoning' membandingkan inti jawaban siswa dan kunci.
3. KRITERIA PILIHAN GANDA: Ambil HANYA huruf pilihan. Abaikan teks setelahnya. Huruf cocok = BENAR 100% (maxScore).
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
5. ATURAN TEKS TIDAK TERBACA: Jika tulisan mengandung kata aneh tak bermakna (UNREADABLE), anggap salah. Jangan menebak.
7. STATUS PENILAIAN ('status'): Kolom ini HANYA boleh diisi dengan "OK" atau "UNREADABLE". Jangan gunakan kata lain seperti "Salah", "Benar", atau "ERROR".

Output WAJIB berupa JSON murni dengan struktur:
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
      "status": "OK"
    }
  ]
}`;

    let lastGradingError: any = null;
    const maxRetries = 4;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let apiKey = "";
      try {
        const { key, index: usedIndex } = await groqRateLimiter.waitForKey(30000);
        apiKey = key;
        const totalKeys = groqRateLimiter.getKeys().length;

        const availableModels = await getDynamicModels(apiKey);
        // HANYA model Qwen untuk penilaian teks
        const qwenTextCandidates = [
          "qwen/qwen3.8-27b",
          "qwen/qwen-2.5-72b",
          "qwen/qwen-2.5-32b",
          "qwen/qwen3.6-27b"
        ];
        const activeTextModels = qwenTextCandidates.filter(m => availableModels.includes(m));
        const textModelsToTry = activeTextModels.length > 0 ? activeTextModels : ["qwen/qwen3.8-27b"];

        const textModel = textModelsToTry[attempt % textModelsToTry.length];
        console.log(`[AI Grading] Tahap 2: Menilai tugas dengan Groq Qwen (${textModel}) [Key Index: ${usedIndex + 1}/${totalKeys}]...`);

        const textResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: textModel,
            messages: [{ role: "user", content: textPrompt }],
            temperature: 0.2,
            max_tokens: 8192,
            response_format: { type: "json_object" },
          }),
        });

        if (!textResponse.ok) {
          const errBody = await textResponse.text();
          if (textResponse.status === 429) {
            groqRateLimiter.setCooldown(apiKey, 60);
          }
          throw new Error(`Groq Text API returned ${textResponse.status}: ${errBody}`);
        }

        const textData = await textResponse.json();
        const responseText = textData.choices?.[0]?.message?.content;
        if (!responseText || responseText.trim().length === 0) {
          throw new Error("Groq Text API mengembalikan respons kosong.");
        }

        const cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanText) as AIAssessmentResult;
        console.log(`[AI Grading] Tahap 2 Berhasil menggunakan Groq Qwen (${textModel})! Total skor: ${parsed.totalScore}`);
        return parsed;

      } catch (err: any) {
        lastGradingError = err;
        console.warn(`[AI Grading] Attempt ${attempt + 1} gagal:`, err?.message || err);
        if (apiKey && (err?.message?.includes("429") || err?.status === 429)) {
          groqRateLimiter.setCooldown(apiKey, 60);
        }
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
    }

    throw lastGradingError || new Error("Seluruh percobaan penilaian teks dengan Groq Qwen gagal.");
  }

  /**
   * Generate Kunci Jawaban dari dokumen/soal yang diunggah guru.
   * KHUSUS: Menggunakan model Qwen murni pada Groq.
   */
  async generateAnswerKey(taskText: string, rubrics: any[], imageAttachments?: any[]): Promise<any> {
    let lastError: any = null;
    const maxRetries = 4;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let apiKey = "";
      try {
        const { key } = await groqRateLimiter.waitForKey(30000);
        apiKey = key;
        const availableModels = await getDynamicModels(apiKey);
        const hasImages = imageAttachments && imageAttachments.length > 0;

        let extractedText = "";

        // TAHAP 1: EKSTRAKSI GAMBAR (QWEN VISION ONLY)
        if (hasImages) {
          const visionPrompt = `Tugas Anda adalah membaca seluruh tulisan pada gambar-gambar soal/tugas ini. Transkripsikan semua teks, soal, pilihan ganda, dan angka persis seperti yang tertulis.
Jangan ubah makna, jangan berikan jawaban. Cukup kembalikan hasil transkripsi teks soalnya saja. Jika gambar tidak berisi teks soal yang relevan, jelaskan dengan singkat.`;
          
          const qwenVisionCandidates = ["qwen/qwen3.8-27b", "qwen/qwen3.6-27b"];
          const activeVisionModels = qwenVisionCandidates.filter(m => availableModels.includes(m));
          const visionModel = activeVisionModels[0] || "qwen/qwen3.8-27b";

          console.log(`[Groq] Step 1 (Answer Key): Ekstrak teks soal dengan Qwen (${visionModel})...`);
          const visionContentParts: any[] = [{ type: "text", text: visionPrompt }];
          
          for (const attachment of imageAttachments!) {
            try {
              let buffer: Buffer;
              if (attachment.storageKey.startsWith("http")) {
                const res = await fetch(attachment.storageKey);
                buffer = Buffer.from(await res.arrayBuffer());
              } else {
                const filePath = path.join(process.cwd(), "public", attachment.storageKey.replace(/^\//, ""));
                buffer = await readFile(filePath);
              }
              const mimeType = attachment.mimeType || "image/jpeg";
              visionContentParts.push({
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${buffer.toString("base64")}` },
              });
            } catch (err) {
              console.warn(`[Groq] Gagal memuat attachment gambar: ${attachment.originalFileName}`, err);
            }
          }

          const visionResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: visionModel,
              messages: [{ role: "user", content: visionContentParts }],
              temperature: 0.1,
              max_tokens: 4096,
            }),
          });

          if (!visionResponse.ok) {
            const errBody = await visionResponse.text();
            throw new Error(`Groq Vision API returned ${visionResponse.status}: ${errBody}`);
          }
          const visionData = await visionResponse.json();
          extractedText = visionData.choices?.[0]?.message?.content || "";
          console.log(`[Groq] Step 1 Selesai. Panjang teks soal: ${extractedText.length}`);
        }

        // TAHAP 2: GENERATE KUNCI JAWABAN DENGAN QWEN TEXT
        const qwenTextCandidates = [
          "qwen/qwen3.8-27b",
          "qwen/qwen-2.5-72b",
          "qwen/qwen-2.5-32b",
          "qwen/qwen3.6-27b"
        ];
        const activeTextModels = qwenTextCandidates.filter(m => availableModels.includes(m));
        const modelsToTry = activeTextModels.length > 0 ? activeTextModels : ["qwen/qwen3.8-27b"];

        let combinedTaskText = taskText;
        if (extractedText) {
          combinedTaskText += `\n\n=== HASIL EKSTRAKSI TEKS SOAL DARI GAMBAR ===\n${extractedText}\n===========================================\n`;
        }

        const prompt = `Anda adalah seorang guru yang sangat berpengalaman. Tugas Anda adalah membuat KUNCI JAWABAN berdasarkan soal/tugas yang diberikan.

SOAL/TUGAS DARI GURU:
${combinedTaskText}

INSTRUKSI UMUM:
1. Baca dan pahami seluruh soal/tugas di atas dengan cermat.
2. Buat kunci jawaban yang lengkap dan akurat untuk setiap pertanyaan, disesuaikan dengan tingkat pendidikan siswa (SD/SMP/SMA).
3. Untuk soal esai, berikan jawaban yang mencakup poin-poin utama yang harus ada.
4. Untuk soal pilihan ganda, sebutkan jawaban yang benar beserta penjelasan singkat.
5. Gunakan tata bahasa Indonesia yang baku, efektif, dan natural (sesuai EYD/PUEBI).
6. DILARANG KERAS memberikan komentar tentang kondisi gambar (misal: buram/gelap). Kerjakan sebaik mungkin tanpa keluhan.
7. DILARANG KERAS menggunakan kalimat pengantar atau penutup. Langsung berikan isi kunci jawaban saja.

INSTRUKSI FORMAT TULISAN (SANGAT PENTING):
1. DILARANG KERAS menggunakan simbol Markdown untuk menebalkan teks (seperti **teks**) atau memiringkan teks (seperti *teks*).
2. Jika terdapat rumus matematika, fisika, atau simbol ilmiah, tuliskan rumus sesuai kaidah penulisan yang baku secara natural.
3. Pertahankan struktur poin-poin agar tetap rapi. PASTIKAN setiap baris/paragraf kunci jawaban selalu diawali dengan NOMOR SOAL secara eksplisit (Contoh: "1. A - Penjelasan...", "2. Benar..."). Nomor ini harus sama dengan soal asli.

Anda JUGA harus menebak struktur soal dari input di atas (ada berapa soal, dan tipenya). Tipe soal yang didukung: "PILIHAN_GANDA", "BENAR_SALAH", "ISIAN_SINGKAT", "ESSAY", "PILIHAN_GANDA_KOMPLEKS".
Hitung total soal (N), lalu berikan bobot maksimal merata (yaitu 100 / N).
PASTIKAN penomoran ("order") pada "parsedQuestions" persis urut dan cocok dengan nomor urut pada teks "answerKey".
Untuk soal tipe PILIHAN_GANDA, BENAR_SALAH, dan PILIHAN_GANDA_KOMPLEKS, Anda WAJIB mengisi field "correctAnswer" dengan kunci jawabannya (misal: "A", "Benar", "A,C,E").

Output WAJIB berupa JSON MURNI (tanpa block code markdown) dengan struktur:
{
  "answerKey": "Teks lengkap kunci jawaban (plain text, dipisahkan newline \\n)",
  "parsedQuestions": [
    {
      "order": 1,
      "questionType": "PILIHAN_GANDA",
      "maxScore": 20,
      "correctAnswer": "A"
    }
  ]
}`;

        const contentParts: any[] = [{ type: "text", text: prompt }];
        let modelLastError: any = null;
        let success = false;
        let generatedAnswer: any = null;

        for (const modelName of modelsToTry) {
          try {
            console.log(`[Groq] Step 2: Membuat kunci jawaban dengan model Qwen ${modelName}...`);
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: modelName,
                messages: [{ role: "user", content: contentParts }],
                temperature: 0.3,
                max_tokens: 8192,
                response_format: { type: "json_object" }
              }),
            });

            if (!response.ok) {
              const errBody = await response.text();
              throw new Error(`Groq API returned ${response.status}: ${errBody}`);
            }

            const data = await response.json();
            const answerKeyStr = data.choices?.[0]?.message?.content;
            if (!answerKeyStr) {
              throw new Error("Groq API returned empty response for answer key.");
            }

            console.log(`[Groq] Kunci jawaban berhasil digenerate dengan model Qwen ${modelName}.`);
            
            const jsonMatch = answerKeyStr.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
              throw new Error("Groq API returned invalid JSON for answer key.");
            }
            
            const parsedData = JSON.parse(jsonMatch[0].trim());
            generatedAnswer = parsedData;
            success = true;
            break;
          } catch (error: any) {
            modelLastError = error;
            console.warn(`[Groq] Generate kunci jawaban gagal dengan model ${modelName}:`, error?.message);
            if (error?.message?.includes("429") || String(error).includes("429")) {
              continue;
            } else {
              throw error;
            }
          }
        }

        if (success) return generatedAnswer;
        throw modelLastError || new Error("Gagal membuat kunci jawaban dengan seluruh model Qwen pada key ini.");

      } catch (error: any) {
        lastError = error;
        console.warn(`[Groq] Attempt ${attempt + 1} generate kunci jawaban gagal:`, error?.message || error);
        
        if (error?.message?.includes("429") || error?.status === 429) {
          if (apiKey) groqRateLimiter.setCooldown(apiKey, 60);
        }
        if (error?.message?.includes("404") || error?.message?.includes("400")) {
          if (apiKey) delete modelCache[apiKey];
        }
        
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    throw lastError || new Error("Gagal membuat kunci jawaban setelah mencoba seluruh kunci Groq.");
  }
}
