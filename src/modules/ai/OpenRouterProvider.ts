import { AIProvider, AIAssessmentResult } from "./AIProvider";
import { readFile } from "fs/promises";
import path from "path";
import { compressBufferForOCR } from "./compressImageForOCR";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

export class OpenRouterProvider implements AIProvider {
  readonly providerName = "OpenRouter-Nemotron3.5-SuperVL";

  private getApiKey(): string {
    const key = process.env.OPENROUTER_API_KEY || process.env.NVIDIA_API_KEY || process.env.NVIDIA_KEY;
    if (!key) throw new Error("API key (OPENROUTER_API_KEY or NVIDIA_API_KEY) is not configured.");
    return key.trim().replace(/^["']|["']$/g, "");
  }

  private getNvidiaApiKey(): string | null {
    const key = process.env.NVIDIA_API_KEY || process.env.NVIDIA_KEY;
    if (!key) return null;
    return key.trim().replace(/^["']|["']$/g, "");
  }

  private getOpenRouterApiKey(): string | null {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) return null;
    return key.trim().replace(/^["']|["']$/g, "");
  }

  private getHeaders(apiKey: string): Record<string, string> {
    return {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // Required by OpenRouter
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://solusi-guru.vercel.app",
      "X-Title": "Solusi Guru",
    };
  }

  private async _extractVision(visionPrompt: string, pages: any[]): Promise<string> {
    const visionContentParts: any[] = [{ type: "text", text: visionPrompt }];
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      let buffer: Buffer;
      if (page.storageKey.startsWith("http")) {
        const res = await fetch(page.storageKey);
        const arrayBuffer = await res.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } else {
        const filePath = path.join(process.cwd(), "public", page.storageKey.replace(/^\//, ""));
        buffer = await readFile(filePath);
      }
      const rawMimeType = page.mimeType || "image/jpeg";
      
      // Kompresi buffer adaptif agar menghemat token vision (60-70%)
      const targetDimension = pages.length >= 3 ? 800 : (pages.length === 2 ? 900 : 1024);
      const { compressedBase64, compressedMimeType } = await compressBufferForOCR(buffer, rawMimeType, targetDimension);

      visionContentParts.push({
        type: "image_url",
        image_url: { url: `data:${compressedMimeType};base64,${compressedBase64}` },
      });
    }

    // 1. PRIMARY: NVIDIA Direct API (nvidia/nemotron-3.5-super-vl-120b-a12b)
    const nvidiaKey = this.getNvidiaApiKey();
    if (nvidiaKey) {
      const nvidiaModel = process.env.NVIDIA_MODEL || "nvidia/nemotron-3.5-super-vl-120b-a12b";
      try {
        console.log(`[Vision OCR] Step 1 (Primary - NVIDIA): Extracting text using (${nvidiaModel})...`);
        const response = await fetch(NVIDIA_BASE_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${nvidiaKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: nvidiaModel,
            messages: [{ role: "user", content: visionContentParts }],
            temperature: 0.1,
            max_tokens: 8192,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const extractedText = data.choices?.[0]?.message?.content;
          if (extractedText && extractedText.trim().length > 0) {
            console.log(`[Vision OCR] Primary NVIDIA berhasil! Panjang teks: ${extractedText.length}`);
            return extractedText;
          }
        } else {
          const errBody = await response.text();
          console.warn(`[Vision OCR] NVIDIA Primary returned ${response.status}: ${errBody}`);
        }
      } catch (nvErr: any) {
        console.warn(`[Vision OCR] NVIDIA Primary exception:`, nvErr?.message || nvErr);
      }
    }

    // 2. FALLBACK 1: OpenRouter (nvidia/nemotron-3.5-super-vl)
    const openRouterKey = this.getOpenRouterApiKey();
    if (openRouterKey) {
      const candidateVisionModels = [
        process.env.OPENROUTER_MODEL,
        "nvidia/nemotron-3.5-super-vl",
        "nvidia/nemotron-3.5-super-vl:free",
      ].filter(Boolean) as string[];

      let lastError: Error | null = null;
      for (const rawVisionModel of candidateVisionModels) {
        const visionModel = rawVisionModel.includes("/") ? rawVisionModel : `nvidia/${rawVisionModel}`;
        console.log(`[OpenRouter Vision] Step 1 (Fallback): Extracting text using (${visionModel})...`);

        try {
          const response = await fetch(OPENROUTER_BASE_URL, {
            method: "POST",
            headers: this.getHeaders(openRouterKey),
            body: JSON.stringify({
              model: visionModel,
              messages: [{ role: "user", content: visionContentParts }],
              temperature: 0.1,
              max_tokens: 8192,
            }),
          });

          if (!response.ok) {
            const errBody = await response.text();
            console.warn(`[OpenRouter Vision] Model ${visionModel} returned ${response.status}: ${errBody}`);
            lastError = new Error(`OpenRouter Vision API returned ${response.status}: ${errBody}`);
            continue;
          }

          const data = await response.json();
          const extractedText = data.choices?.[0]?.message?.content;
          
          if (!extractedText) {
            console.warn(`[OpenRouter Vision] Model ${visionModel} returned empty response.`);
            lastError = new Error("OpenRouter Vision API returned empty response.");
            continue;
          }
          
          console.log(`[OpenRouter Vision] Complete with (${visionModel}). Extracted Text Length: ${extractedText.length}`);
          return extractedText;
        } catch (err: any) {
          lastError = err;
          console.warn(`[OpenRouter Vision] Exception with ${visionModel}:`, err?.message || err);
        }
      }

      if (lastError) throw lastError;
    }

    throw new Error("Semua provider vision OCR (NVIDIA Primary & OpenRouter Fallback) gagal atau API key tidak tersedia.");
  }

  private async _executeTextWithFallback(apiKey: string, prompt: string, temperature: number, maxTokens: number): Promise<string> {
    // 1. PRIMARY: NVIDIA Direct API
    const nvidiaKey = this.getNvidiaApiKey();
    if (nvidiaKey) {
      const nvidiaModel = process.env.NVIDIA_MODEL || "nvidia/nemotron-3.5-super-vl-120b-a12b";
      try {
        console.log(`[AI Text] Trying NVIDIA Direct (${nvidiaModel})...`);
        const response = await fetch(NVIDIA_BASE_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${nvidiaKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: nvidiaModel,
            messages: [{ role: "user", content: prompt }],
            temperature: temperature,
            max_tokens: maxTokens,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const responseText = data.choices?.[0]?.message?.content;
          if (responseText && responseText.trim().length > 0) {
            console.log(`[AI Text] Successfully got response from NVIDIA Direct (${nvidiaModel})`);
            return responseText;
          }
        } else {
          const errBody = await response.text();
          console.warn(`[AI Text] NVIDIA Direct returned ${response.status}: ${errBody}`);
        }
      } catch (nvErr: any) {
        console.warn(`[AI Text] NVIDIA Direct exception:`, nvErr?.message || nvErr);
      }
    }

    // 2. FALLBACK 1: OpenRouter (nvidia/nemotron-3.5-super-vl)
    const openRouterKey = this.getOpenRouterApiKey();
    if (openRouterKey) {
      const rawFallbackModels = [
        process.env.OPENROUTER_MODEL,
        "nvidia/nemotron-3.5-super-vl",
        "nvidia/nemotron-3.5-super-vl:free",
      ].filter(Boolean) as string[];
      const fallbackModels = rawFallbackModels.map(m => m.includes("/") ? m : `nvidia/${m}`);

      let lastError: Error | null = null;

      for (const model of fallbackModels) {
        console.log(`[OpenRouter] Trying text model: ${model}...`);
        try {
          const response = await fetch(OPENROUTER_BASE_URL, {
            method: "POST",
            headers: this.getHeaders(openRouterKey),
            body: JSON.stringify({
              model: model,
              messages: [{ role: "user", content: prompt }],
              temperature: temperature,
              max_tokens: maxTokens,
            }),
          });

          if (!response.ok) {
            const errBody = await response.text();
            if (response.status === 429 || response.status === 529 || response.status === 404) {
              console.warn(`[OpenRouter] Model ${model} returned ${response.status}. Trying next...`);
              lastError = new Error(`OpenRouter API returned ${response.status}: ${errBody}`);
              continue;
            }
            throw new Error(`OpenRouter API returned ${response.status}: ${errBody}`);
          }

          const data = await response.json();
          const responseText = data.choices?.[0]?.message?.content;
          
          if (!responseText) {
             console.warn(`[OpenRouter] Model ${model} returned empty response. Trying next...`);
             lastError = new Error("OpenRouter Text API returned empty response.");
             continue;
          }

          console.log(`[OpenRouter] Successfully got response from ${model}`);
          return responseText;
        } catch (err: any) {
          lastError = err;
          if (err.message.includes("429") || err.message.includes("529") || err.message.includes("empty response") || err.message.includes("404")) {
            continue;
          }
          throw err;
        }
      }

      if (lastError) throw lastError;
    }

    throw new Error("Semua model teks (NVIDIA Primary & OpenRouter Fallback) gagal.");
  }

  /**
   * Menilai teks yang sudah diekstrak (Tahap 2) langsung dengan OpenRouter (Qwen 3.8 27B Free)
   * tanpa perlu mengulang ekstraksi gambar Vision.
   */
  async gradeExtractedText(
    extractedText: string,
    answerKey?: string,
    questions?: any[]
  ): Promise<AIAssessmentResult> {
    const apiKey = this.getApiKey();

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
3. KRITERIA PILIHAN GANDA:
   - Ambil HANYA huruf pilihan (A, B, C, D, E) ke dalam 'studentAnswer'.
   - Jika siswa menulis dua huruf seperti "A B" (koreksi jawaban) atau ada coretan, ambil huruf KEDUA / huruf yang TIDAK DICORET.
3b. KRITERIA BENAR / SALAH (SANGAT PENTING):
   - Jika siswa menuliskan "Benar/Salah", "Benar dan salah", "B/S", "B / S", atau kedua pilihan sekaligus dengan garis miring/kata sambung, tuliskan persis apa adanya di 'studentAnswer' dan BERIKAN SKOR 0 (JANGAN DINILAI).
   - Jika ada dua tulisan berurutan seperti "Benar Salah" atau "Salah Benar" (misal karena siswa mengganti jawaban atau mencoret), ambil HANYA kata KEDUA, atau kata yang TIDAK ADA CORETAN sebagai jawaban akhir siswa di 'studentAnswer'.
3c. KRITERIA PILIHAN GANDA KOMPLEKS / BERTINGKAT:
   - Ekstrak seluruh huruf pilihan yang dipilih siswa (misal: "A, C, E").
*CATATAN INTEGRITAS PENILAIAN: Seluruh soal Pilihan Ganda, Benar/Salah, dan Pilihan Ganda Kompleks/Bertingkat diverifikasi dan dinilai secara mutlak oleh Aplikasi Sistem (System Grader). AI bertugas membaca transkripsi jawaban siswa (OCR) dengan setepat mungkin ke dalam 'studentAnswer'.*
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

    console.log(`[OpenRouter Nemotron] Step 2: Menilai teks tugas dengan OpenRouter (Nemotron 3.5 Super VL)...`);
    const responseText = await this._executeTextWithFallback(apiKey, textPrompt, 0.2, 8192);

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`OpenRouter returned invalid JSON format: ${responseText.substring(0, 100)}...`);
    }

    const cleanText = jsonMatch[0].trim();
    console.log(`[OpenRouter Nemotron] Step 2 Selesai. Penilaian berhasil.`);
    return JSON.parse(cleanText) as AIAssessmentResult;
  }

  async assessSubmission(
    pages: any[],
    rubrics: any[],
    answerKey?: string,
    questions?: any[]
  ): Promise<AIAssessmentResult> {
    // --- TAHAP 1: VISION (Ekstraksi Teks) ---
    const visionPrompt = `Kamu adalah sistem AI ahli dalam Optical Character Recognition (OCR) dan analisis tata letak dokumen, khususnya untuk membaca dan mendigitalkan catatan tulisan tangan. Tugasmu adalah mengekstrak teks dari gambar yang diberikan secara akurat, rapi, dan terstruktur.

Patuhi aturan operasional ketat berikut:

1. PENANGANAN KOREKSI & CORETAN (SANGAT PENTING):
Identifikasi teks, huruf, atau angka yang dicoret (strikethrough), dicoret tebal, atau ditimpa oleh penulis. ABAIKAN bagian tersebut sepenuhnya. JANGAN transkripsikan teks yang sudah dibatalkan. Hanya ekstrak teks final yang dipertahankan/dimaksudkan oleh penulis.
Jika terdapat dua kata pilihan berurutan (misal: "Benar Salah" atau "Salah Benar") atau huruf pilihan (misal: "A B"), ambil kata/huruf KEDUA atau kata/huruf yang TIDAK ADA CORETAN. Jika tertulis "Benar/Salah" atau "B/S", transkripsikan apa adanya.

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

    const extractedText = await this._extractVision(visionPrompt, pages);

    // --- TAHAP 2: TEXT ANALYSIS (Grading) ---
    return await this.gradeExtractedText(extractedText, answerKey, questions);
  }

  async generateAnswerKey(taskText: string, rubrics: any[], imageAttachments?: any[]): Promise<any> {
    const apiKey = this.getApiKey();
    const hasImages = imageAttachments && imageAttachments.length > 0;
    
    let extractedText = "";

    // TAHAP 1: EKSTRAKSI GAMBAR DENGAN OPENROUTER MULTIVISION (NEMOTRON 3.5 SUPER VL FREE)
    if (hasImages) {
      const visionPrompt = `Kamu adalah sistem AI ahli dalam Optical Character Recognition (OCR) dan analisis tata letak dokumen, khususnya untuk membaca dan mendigitalkan catatan tulisan tangan. Tugasmu adalah mengekstrak teks dari gambar yang diberikan secara akurat, rapi, dan terstruktur.

Patuhi aturan operasional ketat berikut:

1. PENANGANAN KOREKSI & CORETAN (SANGAT PENTING):
Identifikasi teks, huruf, atau angka yang dicoret (strikethrough), dicoret tebal, atau ditimpa oleh penulis. ABAIKAN bagian tersebut sepenuhnya. JANGAN transkripsikan teks yang sudah dibatalkan. Hanya ekstrak teks final yang dipertahankan/dimaksudkan oleh penulis.
Jika terdapat dua kata pilihan berurutan (misal: "Benar Salah" atau "Salah Benar") atau huruf pilihan (misal: "A B"), ambil kata/huruf KEDUA atau kata/huruf yang TIDAK ADA CORETAN. Jika tertulis "Benar/Salah" atau "B/S", transkripsikan apa adanya.

2. STRUKTUR & HIERARKI (MARKDOWN):
Pertahankan hierarki dokumen asli. Gunakan format Markdown untuk merapikan hasil:
Gunakan huruf tebal (**teks**) untuk judul blok atau kategori (contoh: A. Pilihan Ganda, B. Isian).
Gunakan penomoran (1, 2, 3) persis seperti urutan di dokumen.
Jika ada teks yang diatur dalam dua kolom (seperti format nomor 1-5 di kiri dan 6-10 di kanan), susun agar tetap sejajar menggunakan spasi atau tabulasi yang rapi.

3. TRANSKRIPSI VERBATIM (APA ADANYA):
Ekstrak teks persis seperti yang tertulis, termasuk variasi ejaan atau singkatan yang digunakan penulis (misalnya, jika tertulis "documen" alih-alih "document", atau "Pilgan" alih-alih "Pilihan Ganda", pertahankan ejaan aslinya). Jangan melakukan koreksi tata bahasa pada teks yang valid.

4. KELUARAN MURNI (TANPA BASA-BASI):
Hasilkan HANYA teks yang diekstrak. Dilarang keras menambahkan kalimat pembuka (seperti 'Berikut adalah hasil ekstraksinya:'), penjelasan, atau kalimat penutup. Mulai dari baris pertama dokumen dan akhiri di baris terakhir.

5. WAJIB BAHASA INDONESIA PADA UMUMNYA:
PASTIKAN seluruh hasil ekstraksi teks ditulis menggunakan bahasa Indonesia pada umumnya. Terlepas dari setelan bahasa pada modelmu, JANGAN PERNAH menerjemahkan teks tersebut ke bahasa Inggris atau bahasa lain. Tuliskan persis sebagaimana makna aslinya dalam bahasa Indonesia.`;
      
      extractedText = await this._extractVision(visionPrompt, imageAttachments as any[]);
    }

    // TAHAP 2: GENERATE KUNCI JAWABAN DENGAN AI
    let combinedTaskText = taskText;
    if (extractedText) {
      combinedTaskText += `\n\n--- TEKS DARI LAMPIRAN GAMBAR ---\n${extractedText}`;
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
6. DILARANG KERAS memberikan komentar tentang kondisi gambar (misal: buram/gelap). Kerjakan sebaik mungkin.
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

    console.log(`[OpenRouter Nemotron] Step 2: Generating answer key with OpenRouter (Nemotron 3.5 Super VL)...`);
    const responseText = await this._executeTextWithFallback(apiKey, prompt, 0.3, 8192);

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("OpenRouter Text API returned invalid JSON for answer key.");
    }

    const cleanText = jsonMatch[0].trim();
    console.log(`[OpenRouter Nemotron] Step 2 Selesai. Kunci jawaban berhasil dibuat.`);
    return JSON.parse(cleanText);
  }
}
