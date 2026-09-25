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
    const visionModel = "openrouter/free";
    
    console.log(`[OpenRouter Vision] Step 1: Extracting text using (${visionModel})...`);
    
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

  private async _executeTextWithFallback(apiKey: string, prompt: string, temperature: number, maxTokens: number): Promise<string> {
    const fallbackModels = [
      "qwen/qwen3.8-27b:free",
      "google/gemma-4-31b-it:free",
      "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
      "nex-agi/nex-n2.5-pro:free",
      "google/gemma-4-26b-a4b-it:free"
    ];

    let lastError: Error | null = null;

    for (const model of fallbackModels) {
      console.log(`[OpenRouter] Trying text model: ${model}...`);
      try {
        const response = await fetch(OPENROUTER_BASE_URL, {
          method: "POST",
          headers: this.getHeaders(apiKey),
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

    throw lastError || new Error("All fallback models failed.");
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
    // (Model selection is now handled by _executeTextWithFallback)

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

5. KRITERIA PENILAIAN - PILIHAN GANDA (ATURAN MUTLAK - TIDAK BOLEH DILANGGAR):
   - Untuk soal PILIHAN GANDA: SATU-SATUNYA hal yang dinilai adalah HURUF PILIHAN JAWABAN siswa.
   - Bandingkan HANYA huruf jawaban siswa (A/B/C/D/E) dengan huruf di Kunci Jawaban. ABAIKAN BESAR/KECIL HURUF.
   - Huruf 'a' SAMA dengan 'A', huruf 'b' SAMA dengan 'B', huruf 'c' SAMA dengan 'C', huruf 'd' SAMA dengan 'D', huruf 'e' SAMA dengan 'E'.
   - Jika HURUF jawaban siswa COCOK dengan huruf Kunci Jawaban → WAJIB BENAR SEMPURNA (100% maxScore). TITIK. TIDAK ADA PENGECUALIAN.
   - ABAIKAN SEPENUHNYA semua teks, kalimat, atau kata yang ditulis SETELAH huruf jawaban. Teks tersebut TIDAK RELEVAN untuk penilaian pilihan ganda.
   - Meskipun kata/kalimat setelah huruf mengandung typo, salah ejaan, berbeda susunan huruf, tidak lengkap, atau bahkan SAMA SEKALI BERBEDA dari kunci jawaban → jawaban TETAP BENAR selama HURUF-nya cocok.
   - CONTOH-CONTOH (semua ini BENAR SEMPURNA):
     * Kunci: "A. Fotosintesis" → Siswa: "A. Potosintesis" ✅ BENAR (huruf A cocok)
     * Kunci: "A. Fotosintesis" → Siswa: "a. fotosintesis" ✅ BENAR (huruf a=A cocok)
     * Kunci: "A. Fotosintesis" → Siswa: "a" ✅ BENAR (huruf a=A cocok)
     * Kunci: "B. Jakarta" → Siswa: "B. Jakrta" ✅ BENAR (huruf B cocok)
     * Kunci: "B. Jakarta" → Siswa: "b. jakrta" ✅ BENAR (huruf b=B cocok)
     * Kunci: "C. Proklamasi" → Siswa: "c. proklamsi" ✅ BENAR (huruf c=C cocok)
     * Kunci: "C. Proklamasi" → Siswa: "C. Proklmasi" ✅ BENAR (huruf C cocok)
     * Kunci: "D. Soekarno" → Siswa: "d. soekarno" ✅ BENAR (huruf d=D cocok)
     * Kunci: "D. Soekarno" → Siswa: "D. Sukarno" ✅ BENAR (huruf D cocok)
     * Kunci: "E. Pancasila" → Siswa: "e. pancasla" ✅ BENAR (huruf e=E cocok)
     * Kunci: "E. Pancasila" → Siswa: "E" ✅ BENAR (huruf E cocok)
   - CONTOH SALAH (huruf BERBEDA):
     * Kunci: "A. Fotosintesis" → Siswa: "B. Fotosintesis" ❌ SALAH (huruf B ≠ A)
     * Kunci: "C. Proklamasi" → Siswa: "D. Proklamasi" ❌ SALAH (huruf D ≠ C)
   - HANYA berikan nilai SALAH (0) jika HURUF jawaban siswa BERBEDA dari huruf di Kunci Jawaban.

6. KRITERIA PENILAIAN - ISIAN SINGKAT & ESSAY (SANGAT PENTING - WAJIB DIPATUHI):
   - Untuk soal ISIAN SINGKAT dan ESSAY: Gunakan pencocokan KESAMAAN MAKNA/KONSEP dengan toleransi tinggi.
   - Jika jawaban siswa memiliki KESAMAAN MAKNA/KONSEP minimal 80% dari Kunci Jawaban, maka jawaban siswa WAJIB dinilai BENAR SEMPURNA (100% maxScore).
   - Abaikan perbedaan ejaan, typo, tata bahasa, urutan kata, atau penggunaan sinonim selama MAKNA/KONSEP utamanya sama.
   - BENAR SEMPURNA (100% maxScore): Makna/konsep jawaban siswa sama atau setara ≥80% dengan kunci jawaban.
   - BENAR SEBAGIAN (50% maxScore): Jawaban siswa mengandung sebagian konsep benar namun kesamaan <80%.
   - SALAH (0): Jawaban salah, melenceng jauh, atau tidak ada hubungannya dengan kunci jawaban.

7. ATURAN TEKS TIDAK TERBACA (SANGAT PENTING):
   - JANGAN PERNAH memprediksi, menebak, atau mengasumsikan kata/kalimat yang TIDAK DAPAT DIBACA atau TIDAK MEMILIKI MAKNA.
   - Jika transkripsi mengandung teks yang sama sekali tidak bisa dipahami maknanya (bukan typo biasa, melainkan karakter acak atau kata yang benar-benar tidak bermakna), anggap bagian tersebut sebagai tidak terjawab.
   - JIKA TRANSKRIPSI SISWA MENGANDUNG KATA "UNREADABLE": Berikan nilai 0, tuliskan "Tulisan tidak dapat dibaca" pada 'analysisText', dan WAJIB set 'status' menjadi "UNREADABLE". Jika terbaca, set 'status' menjadi "OK".

ATURAN UMPAN BALIK EDUKATIF (FEEDBACK):
- Pada 'analysisText' di setiap soal:
- JELASKAN ALASAN MENGAPA JAWABAN TERSEBUT MENDAPATKAN SKOR TERSEBUT secara singkat (maksimal 2 kalimat).
- Jika jawaban BENAR SEMPURNA: Berikan apresiasi atau pujian singkat.
- Jika jawaban SALAH atau KURANG TEPAT: WAJIB berikan analisis kesalahan dan arahan yang membangun tanpa menyalahkan serta berikan motivasi.

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

    console.log(`[OpenRouter Scout] Step 2: Grading with fallback models...`);
    const responseText = await this._executeTextWithFallback(apiKey, textPrompt, 0.2, 4096);

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`OpenRouter returned invalid JSON format: ${responseText.substring(0, 100)}...`);
    }

    const cleanText = jsonMatch[0].trim();
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

    // TAHAP 2: GENERATE KUNCI JAWABAN DENGAN AI
    // (Model selection is now handled by _executeTextWithFallback)
    
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

    console.log(`[OpenRouter Scout] Step 2: Generating answer key with fallback models...`);
    const responseText = await this._executeTextWithFallback(apiKey, prompt, 0.3, 4096);

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("OpenRouter Text API returned invalid JSON for answer key.");
    }

    const cleanText = jsonMatch[0].trim();
    console.log(`[OpenRouter Scout] Step 2 Complete. Answer key generated successfully.`);
    return JSON.parse(cleanText);
  }
}
