import { AIProvider, AIAssessmentResult } from "./AIProvider";
import { readFile } from "fs/promises";
import path from "path";
import { groqRateLimiter } from "./rateLimiter";

// Cache for dynamically fetched models per API key
const modelCache: Record<string, string[]> = {};

async function getDynamicModels(apiKey: string): Promise<string[]> {
  if (modelCache[apiKey]) {
    return modelCache[apiKey];
  }
  
  const res = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  
  if (!res.ok) {
    console.warn(`[Groq] Failed to fetch models list for key prefix ${apiKey.substring(0, 8)}`);
    return [
      "meta-llama/llama-4-scout-17b-16e-instruct",
      "meta-llama/llama-4-maverick-17b-128e-instruct",
      "llama-3.2-90b-vision-preview",
      "llama-3.2-11b-vision-preview"
    ]; // Fallback defaults: Llama 4 Scout/Maverick (higher TPM) + Llama 3.2 Vision
  }
  
  const data = await res.json();
  const availableModels = data.data.map((m: any) => m.id);
  console.log(`[Groq] Available models for key prefix ${apiKey.substring(0, 8)}:`, availableModels.join(", "));
  modelCache[apiKey] = availableModels;
  return availableModels;
}

export class GroqProvider implements AIProvider {
  readonly providerName = "Groq-Vision";

  async assessSubmission(pages: any[], rubrics: any[], answerKey?: string, questions?: any[]): Promise<AIAssessmentResult> {
    const { key: apiKey, index: usedIndex } = await groqRateLimiter.waitForKey(60000);
    const totalKeys = groqRateLimiter.getKeys().length;
    
    const availableModels = await getDynamicModels(apiKey);
    
    const visionModels = ["qwen/qwen3.8-27b", "llama-3.2-90b-vision-preview", "llama-3.2-11b-vision-preview"];
    const textModels = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.3-70b-versatile"];

    const activeVisionModels = visionModels.filter(m => availableModels.includes(m));
    const activeTextModels = textModels.filter(m => availableModels.includes(m));

    const visionModel = activeVisionModels[0] || "qwen/qwen3.8-27b";
    let textModelsToTry = activeTextModels.length > 0 ? activeTextModels : ["openai/gpt-oss-120b"];
    
    const customModel = process.env.GROQ_MODEL?.trim();
    if (customModel) {
      textModelsToTry = [customModel, ...textModelsToTry];
    }
    
    let lastError: any = null;

    for (const textModel of textModelsToTry) {
      try {
        console.log(`[Groq] Two-Step: Vision=${visionModel}, Text=${textModel} (Key Index: ${usedIndex + 1}/${totalKeys})`);
        // We pass BOTH models to _doAssessment
        const result = await this._doAssessment(apiKey, visionModel, textModel, pages, rubrics, answerKey, questions);
        return result;
      } catch (error: any) {
        lastError = error;
        console.warn(`[Groq] Error with Text Model ${textModel}:`, error?.message || error);
        
        if (error?.message?.includes("429") || error?.status === 429) {
          groqRateLimiter.setCooldown(apiKey, 60);
        }

        if (error?.message?.includes("404") || error?.message?.includes("400")) {
           delete modelCache[apiKey];
        }
      }
    }

    throw lastError || new Error("All text models failed in Two-Step Pipeline.");
  }

  private async _doAssessment(
    apiKey: string,
    visionModel: string,
    textModel: string,
    pages: any[],
    rubrics: any[],
    answerKey?: string,
    questions?: any[]
  ): Promise<AIAssessmentResult> {
    
    // --- TAHAP 1: VISION (Ekstraksi Teks) ---
    const visionPrompt = `Tugas Anda adalah membaca seluruh tulisan tangan pada gambar-gambar ini. Transkripsikan semua teks dan angka persis seperti yang tertulis. 
SANGAT PENTING: 
- PASTIKAN Anda menangkap dan mempertahankan NOMOR SOAL (1, 2, 3, dst) yang ditulis oleh siswa. 
- Pisahkan setiap jawaban atau nomor soal dengan baris baru agar strukturnya sangat jelas dibaca.
Jangan ubah makna, jangan berikan penilaian, jangan menambahkan komentar apa pun. Cukup kembalikan hasil transkripsi teksnya saja. Jika tulisan sangat buram dan sama sekali tidak bisa dibaca, tulis "UNREADABLE".`;
    
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
        image_url: {
          url: `data:${mimeType};base64,${base64Data}`,
        },
      });
    }

    console.log(`[Groq] Step 1: Extracting text using ${visionModel}...`);
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
      throw new Error(`Vision API returned ${visionResponse.status}: ${errBody}`);
    }

    const visionData = await visionResponse.json();
    const extractedText = visionData.choices?.[0]?.message?.content;
    
    if (!extractedText) {
      throw new Error("Vision API returned empty response.");
    }
    console.log(`[Groq] Step 1 Complete. Extracted Text Length: ${extractedText.length}`);

    // --- TAHAP 2: TEXT ANALYSIS (Grading) ---
    // Build answer key context if available
    let answerKeyInstruction = "";
    if (answerKey && answerKey.trim().length > 0) {
      answerKeyInstruction = `
KUNCI JAWABAN REFERENSI (dari soal yang dilampirkan guru):
${answerKey}
`;
    }

    let questionsInstruction = "";
    if (questions && questions.length > 0) {
      const qList = questions.map(q => `Nomor ${q.order}: Tipe ${q.questionType}, Bobot ${q.maxScore}`).join("\\n");
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
2. PENCOCOKAN NOMOR SOAL: Anda WAJIB MENGKAITKAN SETIAP JAWABAN SISWA DENGAN NOMOR SOAL YANG BENAR DI KUNCI JAWABAN. Jangan sampai tertukar! Perhatikan angka nomor soal pada transkripsi siswa. Jika siswa tidak menuliskan nomor urut, cocokkan berdasarkan konteksnya dengan sangat hati-hati.
${!questions || questions.length === 0 ? questionsInstruction : ""}
4. TAHAP PENALARAN (CHAIN-OF-THOUGHT):
   - JANGAN langsung memberikan nilai. Anda WAJIB membandingkan inti argumen siswa dengan inti Kunci Jawaban terlebih dahulu.
   - Tuliskan langkah penalaran Anda di properti 'reasoning_steps' pada JSON.
   - Contoh penalaran: "1. Kunci jawaban menuntut konsep A. 2. Siswa menjawab konsep A dengan bahasa berbeda. 3. Oleh karena itu, jawaban relevan."
5. PENILAIAN KONTEKSTUAL & PARSIAL (PARTIAL SCORING):
   - Yang dinilai adalah KESESUAIAN KONTEKS (bukan kesamaan kata per kata).
   - Terapkan penilaian sebagian (partial scoring):
     * BENAR SEMPURNA (100% dari maxScore): Mengandung seluruh konsep utama Kunci Jawaban.
     * BENAR SEBAGIAN (50% dari maxScore): Hanya mengandung sebagian konsep yang benar, atau konsepnya kurang tepat tapi ada indikasi pemahaman.
     * SALAH (0): Konsep bertolak belakang, melenceng jauh, atau tidak ada sama sekali.
6. ATURAN PENILAIAN TYPO & EJAAN (SANGAT PENTING):
   - Periksa seluruh tulisan siswa secara mendetail.
   - Jika ada kata yang salah ejaan (typo) atau perlu diperbaiki, Anda WAJIB memprediksi kata atau kalimat yang benar.
   - Masukkan setiap kesalahan ke dalam properti 'typos' di JSON (berisi array object dengan kunci 'salah' dan 'perbaikan').
   - Untuk SETIAP kata yang typo, KURANGI 1 poin dari total 'score' soal tersebut. Jika skor jadi di bawah 0, jadikan 0.

ATURAN UMPAN BALIK EDUKATIF (FEEDBACK):
- Pada 'analysisText' di setiap soal:
- JELASKAN ALASAN MENGAPA JAWABAN TERSEBUT MENDAPATKAN SKOR TERSEBUT secara singkat (maksimal 2 kalimat). Termasuk jika skor dikurangi karena typo.
- Jika jawaban SALAH atau KURANG TEPAT: WAJIB berikan analisis kesalahan dan arahan yang membangun tanpa menyalahkan serta berikan motivasi (contoh: "Jawabanmu hampir tepat, namun mari perhatikan kembali bagian... tetap semangat!").
- Gunakan bahasa yang ramah, hangat, dan memotivasi HANYA pada jawaban yang belum sempurna.
- JIKA TRANSKRIPSI SISWA MENGANDUNG KATA "UNREADABLE": Berikan nilai 0, tuliskan "Tulisan tidak dapat dibaca" pada 'analysisText', dan WAJIB set 'status' menjadi "UNREADABLE". Jika terbaca, set 'status' menjadi "OK".

ATURAN BAHASA:
- Gunakan bahasa Indonesia yang baik dan benar sesuai KBBI.
- Abaikan 'errorHighlights' karena posisi koordinat ejaan salah tidak relevan pada tahap ini. Kosongkan array-nya ([]).

Output Anda HARUS berupa JSON murni dengan struktur berikut:
{
  "totalScore": number,
  "generalFeedback": "Apresiasi dan umpan balik singkat keseluruhan untuk siswa",
  "analysis": [
    {
      "questionNumber": "string",
      "studentAnswer": "string (teks pertanyaan & jawaban siswa)",
      "reasoning_steps": "string (Langkah-langkah penalaran membandingkan jawaban siswa dan kunci jawaban, WAJIB diisi sebelum skor)",
      "typos": [{"salah": "kata typo", "perbaikan": "prediksi kata yang benar"}],
      "score": number,
      "maxScore": number,
      "analysisText": "string (Penjelasan ringkas alasan skor dan umpan balik motivasi)",
      "status": "OK"
    }
  ],
  "errorHighlights": []
}`;

    console.log(`[Groq] Step 2: Grading with ${textModel}...`);
    const textResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: textModel,
        messages: [{ role: "user", content: textPrompt }], // Text only!
        temperature: 0.2,
        max_tokens: 8192,
        response_format: { type: "json_object" },
      }),
    });

    if (!textResponse.ok) {
      const errBody = await textResponse.text();
      throw new Error(`Text API returned ${textResponse.status}: ${errBody}`);
    }

    const textData = await textResponse.json();
    const responseText = textData.choices?.[0]?.message?.content;
    if (!responseText) {
      throw new Error("Text API returned empty response.");
    }

    const cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText) as AIAssessmentResult;
  }

  /**
   * Generate an answer key from teacher-uploaded task documents.
   * Analyzes the extracted text (and optionally images) from attachments
   * and produces reference answers.
   */
  async generateAnswerKey(taskText: string, rubrics: any[], imageAttachments?: any[]): Promise<any> {
    const { key: apiKey } = await groqRateLimiter.waitForKey(60000);

    const availableModels = await getDynamicModels(apiKey);
    const hasImages = imageAttachments && imageAttachments.length > 0;
    
    const topModels = hasImages ? [
      "llama-3.2-90b-vision-preview",
      "llama-3.2-11b-vision-preview"
    ] : [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "openai/gpt-oss-120b",
      "qwen/qwen3.8-27b"
    ];

    const matchedModels = topModels.filter(m => availableModels.includes(m));
    console.log(`[Groq] Matched top models for answer key: ${matchedModels.length > 0 ? matchedModels.join(", ") : "NONE"}`);
    
    let modelsToTry = matchedModels.length > 0 ? matchedModels : topModels;

    const customModel = process.env.GROQ_MODEL?.trim();
    if (customModel) {
      modelsToTry = [customModel, ...modelsToTry];
    }

    const prompt = `Anda adalah seorang guru yang sangat berpengalaman. Tugas Anda adalah membuat KUNCI JAWABAN berdasarkan soal/tugas yang diberikan.

SOAL/TUGAS DARI GURU:
${taskText}

INSTRUKSI UMUM:
1. Baca dan pahami seluruh soal/tugas di atas dengan cermat.
2. Buat kunci jawaban yang lengkap dan akurat untuk setiap pertanyaan, disesuaikan dengan tingkat pendidikan siswa (SD/SMP/SMA).
3. Untuk soal esai, berikan jawaban yang mencakup poin-poin utama yang harus ada.
4. Untuk soal pilihan ganda, sebutkan jawaban yang benar beserta penjelasan singkat.
5. Gunakan tata bahasa Indonesia yang baku, efektif, dan natural (sesuai EYD/PUEBI).
6. DILARANG KERAS memberikan komentar tentang kondisi gambar (misal: buram/gelap). Kerjakan sebaik mungkin tanpa keluhan.
7. DILARANG KERAS menggunakan kalimat pengantar atau penutup. Langsung berikan isi kunci jawaban saja.

INSTRUKSI FORMAT TULISAN (SANGAT PENTING):
1. Hasil teks harus persis seperti format ketikan standar pada Microsoft Word (teks biasa/plain text).
2. DILARANG KERAS menggunakan simbol Markdown untuk menebalkan teks (seperti **teks**) atau memiringkan teks (seperti *teks*).
3. Jika terdapat rumus matematika, fisika, atau simbol ilmiah, tuliskan rumus sesuai kaidah penulisan yang baku secara natural. 
4. PASTIKAN rumus ditulis BERSIH tanpa ada simbol tambahan seperti menebalkan (**rumus**) atau pemformatan lain di sekitarnya. 
5. Pertahankan struktur poin-poin agar tetap rapi, gunakan spasi baris yang jelas, dan penomoran standar yang sesuai dengan soal.

Berikan kunci jawaban dalam format teks biasa (bukan JSON atau Markdown berlebihan).`;

    const contentParts: any[] = [{ type: "text", text: prompt }];

    // Add image attachments if any
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
          const mimeType = attachment.mimeType || "image/jpeg";
          
          if (attachment.description) {
            contentParts.push({
              type: "text",
              text: `[Berikut adalah gambar untuk: ${attachment.description}]`
            });
          }
          
          contentParts.push({
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${buffer.toString("base64")}`,
            },
          });
        } catch (err) {
          console.warn(`[Groq] Failed to load image attachment: ${attachment.originalFileName}`, err);
        }
      }
    }

    let lastError: any = null;
    for (const modelName of modelsToTry) {
      try {
        console.log(`[Groq] Generating answer key with model ${modelName}...`);
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
            max_tokens: 4096,
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`Groq API returned ${response.status}: ${errBody}`);
        }

        const data = await response.json();
        const answerKey = data.choices?.[0]?.message?.content;
        if (!answerKey) {
          throw new Error("Groq API returned empty response for answer key.");
        }

        console.log(`[Groq] Answer key generated successfully with ${modelName}.`);
        return answerKey.trim();
      } catch (error: any) {
        lastError = error;
        console.warn(`[Groq] Answer key generation failed with ${modelName}:`, error?.message);
      }
    }

    throw lastError || new Error("Failed to generate answer key with all available models.");
  }
}
