import { AIProvider, AIAssessmentResult } from "./AIProvider";
import { readFile } from "fs/promises";
import path from "path";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

export class OpenRouterProvider implements AIProvider {
  readonly providerName = "OpenRouter-MaverickScout";

  private getApiKey(): string {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error("OPENROUTER_API_KEY is not configured.");
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
    const apiKey = this.getApiKey();
    const visionModel = "meta-llama/llama-4-maverick";
    
    console.log(`[OpenRouter Vision] Step 1: Extracting text using Maverick (${visionModel})...`);
    
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
      const mimeType = page.mimeType || "image/jpeg";
      const base64Data = buffer.toString("base64");
      visionContentParts.push({
        type: "image_url",
        image_url: { url: `data:${mimeType};base64,${base64Data}` },
      });
    }

    const response = await fetch(OPENROUTER_BASE_URL, {
      method: "POST",
      headers: this.getHeaders(apiKey),
      body: JSON.stringify({
        model: visionModel,
        messages: [{ role: "user", content: visionContentParts }],
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`OpenRouter Vision API returned ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content;
    
    if (!extractedText) {
      throw new Error("OpenRouter Vision API returned empty response.");
    }
    
    console.log(`[OpenRouter Vision] Step 1 Complete. Extracted Text Length: ${extractedText.length}`);
    return extractedText;
  }

  async assessSubmission(
    pages: any[],
    rubrics: any[],
    answerKey?: string,
    questions?: any[]
  ): Promise<AIAssessmentResult> {
    const apiKey = this.getApiKey();

    // --- TAHAP 1: VISION (Ekstraksi Teks) ---
    const visionPrompt = `Tugas Anda adalah membaca seluruh tulisan tangan pada gambar-gambar ini. Transkripsikan semua teks dan angka persis seperti yang tertulis. 
SANGAT PENTING: 
- PASTIKAN Anda menangkap dan mempertahankan NOMOR SOAL (1, 2, 3, dst) yang ditulis oleh siswa. 
- Pisahkan setiap jawaban atau nomor soal dengan baris baru agar strukturnya sangat jelas dibaca.
Jangan ubah makna, jangan berikan penilaian, jangan menambahkan komentar apa pun. Cukup kembalikan hasil transkripsi teksnya saja. Jika tulisan sangat buram dan sama sekali tidak bisa dibaca, tulis "UNREADABLE".`;

    const extractedText = await this._extractVision(visionPrompt, pages);

    // --- TAHAP 2: TEXT ANALYSIS (Grading) ---
    const textModel = process.env.OPENROUTER_MODEL || "meta-llama/llama-4-scout";

    let answerKeyInstruction = "";
    if (answerKey && answerKey.trim().length > 0) {
      answerKeyInstruction = `\nKUNCI JAWABAN REFERENSI (dari soal yang dilampirkan guru):\n${answerKey}\n`;
    }

    let questionsInstruction = "";
    if (questions && questions.length > 0) {
      const qList = questions.map(q => `Nomor ${q.order}: Tipe ${q.questionType}, Bobot ${q.maxScore}`).join("\\n");
      questionsInstruction = `\nKONFIGURASI SOAL & BOBOT (DARI GURU):\nBerikut adalah struktur dan pedoman bobot maksimal untuk setiap soal:\n${qList}\nNilailah setiap soal siswa berpatokan pada bobot maksimal tersebut (maxScore).\n`;
    } else {
      questionsInstruction = `2. Identifikasi jumlah total soal (N) yang dijawab oleh siswa atau yang ada di Kunci Jawaban.
3. Alokasikan nilai maksimal ('maxScore') untuk masing-masing soal secara proporsional, yaitu 100 / N (dibulatkan agar total seluruh 'maxScore' = 100).`;
    }

    const textPrompt = `Anda adalah seorang asisten guru (AI) yang ahli dalam menilai tugas siswa secara bijak, objektif, dan suportif.
Tugas Anda adalah membaca *hasil transkripsi tulisan siswa* yang sudah diekstrak, lalu menilainya secara akurat berdasarkan Kunci Jawaban.

BERIKUT ADALAH HASIL TRANSKRIPSI JAWABAN SISWA:
"""
${extractedText}
"""

${answerKeyInstruction}
${questionsInstruction && questions && questions.length > 0 ? questionsInstruction : ""}

INSTRUKSI PENILAIAN & ALOKASI SKOR (SANGAT PENTING):
0. PERINGATAN KERAS: ANDA WAJIB MENILAI KESELURUHAN SOAL TANPA TERKECUALI! Terdapat total ${questions && questions.length > 0 ? questions.length : "semua"} soal yang harus dinilai. PASTIKAN array 'analysis' pada JSON berisi tepat ${questions && questions.length > 0 ? questions.length : "seluruh"} item soal. JANGAN PERNAH menjadi malas atau berhenti di tengah jalan!
1. Baca SELURUH tulisan siswa dari awal hingga akhir.
2. PENCOCOKAN NOMOR SOAL: Anda WAJIB MENGKAITKAN SETIAP JAWABAN SISWA DENGAN NOMOR SOAL YANG BENAR DI KUNCI JAWABAN.
${!questions || questions.length === 0 ? questionsInstruction : ""}
4. TAHAP PENALARAN (CHAIN-OF-THOUGHT):
   - JANGAN langsung memberikan nilai. Anda WAJIB membandingkan inti argumen siswa dengan inti Kunci Jawaban terlebih dahulu.
   - Tuliskan langkah penalaran Anda di properti 'reasoning_steps' pada JSON.
5. PENILAIAN KONTEKSTUAL & PARSIAL (PARTIAL SCORING):
   - Yang dinilai adalah KESESUAIAN KONTEKS (bukan kesamaan kata per kata).
   - Terapkan penilaian sebagian (partial scoring):
     * BENAR SEMPURNA (100% dari maxScore): Mengandung seluruh konsep utama.
     * BENAR SEBAGIAN (50% dari maxScore): Hanya mengandung sebagian konsep yang benar.
     * SALAH (0): Konsep bertolak belakang, melenceng jauh.
6. ATURAN PENILAIAN TYPO & EJAAN (SANGAT PENTING):
   - Periksa seluruh tulisan siswa secara mendetail.
   - Jika ada kata yang salah ejaan (typo), Anda WAJIB memprediksi kata yang benar.
   - Masukkan setiap kesalahan ke dalam properti 'typos' di JSON (array of {salah, perbaikan}).
   - Untuk SETIAP kata yang typo, KURANGI 1 poin dari total 'score' soal tersebut. Jika skor jadi di bawah 0, jadikan 0.

ATURAN UMPAN BALIK EDUKATIF (FEEDBACK):
- Pada 'analysisText' di setiap soal:
- JELASKAN ALASAN MENGAPA JAWABAN TERSEBUT MENDAPATKAN SKOR TERSEBUT secara singkat (maksimal 2 kalimat). Termasuk jika skor dikurangi karena typo.
- Jika jawaban SALAH atau KURANG TEPAT: WAJIB berikan analisis kesalahan dan arahan yang membangun tanpa menyalahkan serta berikan motivasi.
- JIKA TRANSKRIPSI SISWA MENGANDUNG KATA "UNREADABLE": Berikan nilai 0, tuliskan "Tulisan tidak dapat dibaca" pada 'analysisText', dan WAJIB set 'status' menjadi "UNREADABLE". Jika terbaca, set 'status' menjadi "OK".

ATURAN BAHASA:
- Gunakan bahasa Indonesia yang baik dan benar sesuai KBBI.
- Kosongkan array 'errorHighlights' ([]).

Output Anda HARUS berupa JSON murni dengan struktur berikut:
{
  "totalScore": number,
  "generalFeedback": "Apresiasi dan umpan balik singkat keseluruhan untuk siswa",
  "analysis": [
    {
      "questionNumber": "string",
      "studentAnswer": "string (teks pertanyaan & jawaban siswa)",
      "reasoning_steps": "string (Langkah-langkah penalaran membandingkan jawaban siswa dan kunci jawaban)",
      "typos": [{"salah": "kata typo", "perbaikan": "prediksi kata yang benar"}],
      "score": number,
      "maxScore": number,
      "analysisText": "string (Penjelasan ringkas alasan skor dan umpan balik motivasi)",
      "status": "OK"
    }
  ],
  "errorHighlights": []
}`;

    console.log(`[OpenRouter Scout] Step 2: Grading with ${textModel}...`);
    const response = await fetch(OPENROUTER_BASE_URL, {
      method: "POST",
      headers: this.getHeaders(apiKey),
      body: JSON.stringify({
        model: textModel,
        messages: [{ role: "user", content: textPrompt }],
        temperature: 0.2,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`OpenRouter Text API returned ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content;
    if (!responseText) throw new Error("OpenRouter Text API returned empty response.");

    const cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
    console.log(`[OpenRouter Scout] Step 2 Complete. Assessment successful.`);
    return JSON.parse(cleanText) as AIAssessmentResult;
  }

  async generateAnswerKey(taskText: string, rubrics: any[], imageAttachments?: any[]): Promise<any> {
    const apiKey = this.getApiKey();
    const hasImages = imageAttachments && imageAttachments.length > 0;
    
    let extractedText = "";

    // TAHAP 1: EKSTRAKSI GAMBAR DENGAN MAVERICK
    if (hasImages) {
      const visionPrompt = `Tugas Anda adalah membaca seluruh tulisan pada gambar-gambar soal/tugas ini. Transkripsikan semua teks, soal, pilihan ganda, dan angka persis seperti yang tertulis.
Jangan ubah makna, jangan berikan jawaban. Cukup kembalikan hasil transkripsi teks soalnya saja. Jika gambar tidak berisi teks soal yang relevan, jelaskan dengan singkat.`;
      
      extractedText = await this._extractVision(visionPrompt, imageAttachments as any[]);
    }

    // TAHAP 2: GENERATE KUNCI JAWABAN DENGAN SCOUT
    const textModel = process.env.OPENROUTER_MODEL || "meta-llama/llama-4-scout";
    
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
3. Pertahankan struktur poin-poin agar tetap rapi.

Anda JUGA harus menebak struktur soal dari input di atas (ada berapa soal, dan tipenya). Tipe soal yang didukung: "PILIHAN_GANDA", "BENAR_SALAH", "ISIAN_SINGKAT", "ESSAY", "PILIHAN_GANDA_KOMPLEKS".
Berikan bobot maksimal merata (misal 100/N).

Output WAJIB berupa JSON MURNI (tanpa block code markdown) dengan struktur:
{
  "answerKey": "Teks lengkap kunci jawaban (plain text, dipisahkan newline \\n)",
  "parsedQuestions": [
    {
      "order": 1,
      "questionType": "ESSAY",
      "maxScore": 20
    }
  ]
}`;

    console.log(`[OpenRouter Scout] Step 2: Generating answer key with ${textModel}...`);
    const response = await fetch(OPENROUTER_BASE_URL, {
      method: "POST",
      headers: this.getHeaders(apiKey),
      body: JSON.stringify({
        model: textModel,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`OpenRouter Text API returned ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content;
    if (!responseText) throw new Error("OpenRouter Text API returned empty response for answer key.");

    const cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
    console.log(`[OpenRouter Scout] Step 2 Complete. Answer key generated successfully.`);
    return JSON.parse(cleanText);
  }
}
