import { AIProvider, AIAssessmentResult } from "./AIProvider";
import { readFile } from "fs/promises";
import path from "path";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

export class OpenRouterProvider implements AIProvider {
  readonly providerName = "OpenRouter-Scout";

  private getApiKey(): string {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error("OPENROUTER_API_KEY is not configured.");
    return key.trim().replace(/^[\"']|[\"']$/g, "");
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

  async assessSubmission(
    pages: any[],
    rubrics: any[],
    answerKey?: string,
    questions?: any[]
  ): Promise<AIAssessmentResult> {
    const apiKey = this.getApiKey();

    // Model priority: Scout (efficient, fast), fallback to Maverick (flagship)
    const modelsToTry = [
      process.env.OPENROUTER_MODEL || "meta-llama/llama-4-scout",
      "meta-llama/llama-4-maverick",
    ];

    // Build prompt context
    let answerKeyInstruction = "";
    if (answerKey && answerKey.trim().length > 0) {
      answerKeyInstruction = `
KUNCI JAWABAN REFERENSI (dari soal yang dilampirkan guru):
${answerKey}
`;
    }

    let questionsInstruction = "";
    if (questions && questions.length > 0) {
      const qList = questions
        .map((q) => `Nomor ${q.order}: Tipe ${q.questionType}, Bobot ${q.maxScore}`)
        .join("\\n");
      questionsInstruction = `
KONFIGURASI SOAL & BOBOT (DARI GURU):
Berikut adalah struktur dan pedoman bobot maksimal untuk setiap soal:
${qList}
Nilailah setiap soal siswa berpatokan pada bobot maksimal tersebut (maxScore).
`;
    } else {
      questionsInstruction = `2. Identifikasi jumlah total soal (N) yang dijawab oleh siswa atau yang ada di Kunci Jawaban.
3. Alokasikan nilai maksimal ('maxScore') untuk masing-masing soal secara proporsional, yaitu 100 / N (dibulatkan agar total seluruh 'maxScore' = 100).`;
    }

    const promptText = `Anda adalah seorang asisten guru (AI) yang ahli dalam menilai tugas siswa secara bijak dan suportif.
Tugas Anda adalah membaca gambar-gambar tugas siswa yang dilampirkan, lalu menilainya.

${answerKeyInstruction}
${questionsInstruction && questions && questions.length > 0 ? questionsInstruction : ""}

INSTRUKSI PENILAIAN & ALOKASI SKOR (SANGAT PENTING):
1. Baca SELURUH tulisan siswa di setiap halaman dari awal hingga akhir. Ekstrak teks/jawaban siswa sebaik mungkin.
${!questions || questions.length === 0 ? questionsInstruction : ""}
4. PENILAIAN KONTEKSTUAL:
   - Jika siswa HANYA MENULIS JAWABAN (tanpa pertanyaan): Cocokkan jawaban tersebut dengan Kunci Jawaban Referensi secara berurutan atau berdasarkan konteks.
   - Jika siswa MENULIS PERTANYAAN DAN JAWABAN di kertasnya: Anda WAJIB memetakan dan mencocokkan setiap pertanyaan dengan jawabannya berdasarkan NOMOR YANG SAMA. Setelah dipasangkan, HANYA nilai bagian JAWABANNYA saja.
5. Yang dinilai adalah KESESUAIAN KONTEKS (bukan kesamaan kata per kata).

ATURAN UMPAN BALIK EDUKATIF (FEEDBACK):
- Pada 'analysisText' di setiap soal:
- JELASKAN ALASAN MENGAPA JAWABAN TERSEBUT BENAR ATAU SALAH secara singkat dan padat (maksimal 2 kalimat).
- Jika jawaban SALAH/KURANG TEPAT: WAJIB berikan analisis kesalahan dan arahan yang membangun tanpa menyalahkan serta berikan motivasi (contoh: "Jawabanmu masih kurang tepat, mari perhatikan kembali bagian... tetap semangat!").
- Gunakan bahasa yang ramah, hangat, dan memotivasi HANYA pada jawaban yang salah.
- JIKA TULISAN SISWA TIDAK DAPAT DIBACA SAMA SEKALI PADA SOAL TERTENTU: Berikan nilai 0, tuliskan "Tulisan tidak dapat dibaca" pada 'analysisText', dan WAJIB set 'status' menjadi "UNREADABLE". Jika terbaca, set 'status' menjadi "OK".

ATURAN BAHASA:
- Gunakan bahasa Indonesia yang baik dan benar sesuai KBBI.
- DETEKSI KESALAHAN EJAAN (BOUNDING BOX): Hanya koreksi kata yang BENAR-BENAR SALAH ejaannya. Jika salah ejaan, berikan koordinat [ymin, xmin, ymax, xmax] di array \`errorHighlights\`. Jika tidak ada salah ejaan, kosongkan array.

Output Anda HARUS berupa JSON murni dengan struktur berikut:
{
  "totalScore": number,
  "generalFeedback": "Apresiasi dan umpan balik singkat keseluruhan untuk siswa",
  "analysis": [
    {
      "questionNumber": "string",
      "studentAnswer": "string (teks pertanyaan & jawaban siswa yang terbaca, atau jawabannya saja)",
      "score": number,
      "maxScore": number,
      "analysisText": "string (Analisis alasan skor + Umpan balik edukatif/pujian)",
      "status": "OK"
    }
  ],
  "errorHighlights": []
}`;

    // Build image content parts
    const contentParts: any[] = [{ type: "text", text: promptText }];
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
      contentParts.push({
        type: "image_url",
        image_url: { url: `data:${mimeType};base64,${base64Data}` },
      });
    }

    let lastError: any = null;
    for (const modelName of modelsToTry) {
      try {
        console.log(`[OpenRouter] Assessing submission with model ${modelName}...`);
        const response = await fetch(OPENROUTER_BASE_URL, {
          method: "POST",
          headers: this.getHeaders(apiKey),
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: "user", content: contentParts }],
            temperature: 0.2,
            max_tokens: 4096,
            response_format: { type: "json_object" },
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`OpenRouter API returned ${response.status}: ${errBody}`);
        }

        const data = await response.json();
        const responseText = data.choices?.[0]?.message?.content;
        if (!responseText) throw new Error("OpenRouter returned empty response.");

        const cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
        console.log(`[OpenRouter] Assessment successful with ${modelName}.`);
        return JSON.parse(cleanText) as AIAssessmentResult;
      } catch (error: any) {
        lastError = error;
        console.warn(`[OpenRouter] Error with model ${modelName}:`, error?.message || error);
      }
    }

    throw lastError || new Error("All OpenRouter models failed.");
  }

  async generateAnswerKey(taskText: string, rubrics: any[], imageAttachments?: any[]): Promise<any> {
    const apiKey = this.getApiKey();

    // Model priority: Scout (efficient, fast), fallback to Maverick (flagship)
    const modelsToTry = [
      process.env.OPENROUTER_MODEL || "meta-llama/llama-4-scout",
      "meta-llama/llama-4-maverick",
    ];

    const prompt = `Anda adalah seorang guru yang sangat berpengalaman. Tugas Anda adalah membuat KUNCI JAWABAN berdasarkan soal/tugas yang diberikan.

SOAL/TUGAS DARI GURU:
${taskText}

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

Anda JUGA harus menebak struktur soal dari lampiran (ada berapa soal, dan tipenya). Tipe soal yang didukung: "PILIHAN_GANDA", "BENAR_SALAH", "ISIAN_SINGKAT", "ESSAY", "PILIHAN_GANDA_KOMPLEKS".
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

    const contentParts: any[] = [{ type: "text", text: prompt }];

    const hasImages = imageAttachments && imageAttachments.length > 0;
    if (hasImages) {
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
          let mimeType = attachment.mimeType || "image/jpeg";
          if (!mimeType.startsWith("image/")) mimeType = "image/jpeg";

          if (attachment.description) {
            contentParts.push({ type: "text", text: `[Gambar untuk: ${attachment.description}]` });
          }
          contentParts.push({
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${buffer.toString("base64")}` },
          });
        } catch (err) {
          console.warn(`[OpenRouter] Failed to load attachment: ${attachment.originalFileName}`, err);
        }
      }
    }

    let lastError: any = null;
    for (const modelName of modelsToTry) {
      try {
        console.log(`[OpenRouter] Generating answer key with model ${modelName}...`);
        const response = await fetch(OPENROUTER_BASE_URL, {
          method: "POST",
          headers: this.getHeaders(apiKey),
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: "user", content: contentParts }],
            temperature: 0.3,
            max_tokens: 4096,
            response_format: { type: "json_object" },
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`OpenRouter API returned ${response.status}: ${errBody}`);
        }

        const data = await response.json();
        const responseText = data.choices?.[0]?.message?.content;
        if (!responseText) throw new Error("OpenRouter returned empty response for answer key.");

        const cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
        console.log(`[OpenRouter] Answer key generated successfully with ${modelName}.`);
        return JSON.parse(cleanText);
      } catch (error: any) {
        lastError = error;
        console.warn(`[OpenRouter] Answer key failed with ${modelName}:`, error?.message);
      }
    }

    throw lastError || new Error("All OpenRouter models failed for answer key generation.");
  }
}
