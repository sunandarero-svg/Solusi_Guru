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
      "llama-3.2-90b-vision-preview",
      "llama-3.2-11b-vision-preview",
      "llama-3.3-70b-versatile"
    ]; // Fallback defaults: Llama 3.2 Vision (multimodal) + Llama 3.3 (text)
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
    // Select key using rate limiter (waits up to 60 seconds if all keys are busy)
    const { key: apiKey, index: usedIndex } = await groqRateLimiter.waitForKey(60000);
    const totalKeys = groqRateLimiter.getKeys().length;
    
    const availableModels = await getDynamicModels(apiKey);
    
    // Filter for multimodal models that can process images
    // Covers: vision models, Llama 4 Scout/Maverick, Qwen3 VL series
    const multimodalModels = availableModels.filter(m => {
      const lower = m.toLowerCase();
      return lower.includes("vision") || lower.includes("llava") || lower.includes("pixtral")
        || lower.includes("scout") || lower.includes("maverick")
        || lower.includes("qwen3") || lower.includes("qwen-vl");
    });
    
    console.log(`[Groq] Detected multimodal models: ${multimodalModels.length > 0 ? multimodalModels.join(", ") : "NONE"}`);
    
    // Since we are assessing images, we MUST use a multimodal model.
    let modelsToTry = multimodalModels.length > 0 ? multimodalModels : [
      "llama-3.2-90b-vision-preview",
      "llama-3.2-11b-vision-preview",
      "llama-3.2-11b-vision-preview"
    ];
    
    const customModel = process.env.GROQ_MODEL?.trim();
    if (customModel) {
      modelsToTry = [customModel, ...modelsToTry];
    }
    
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[Groq] Trying model ${modelName} with key prefix ${apiKey.substring(0, 8)}... (Key Index: ${usedIndex + 1}/${totalKeys})`);
        const result = await this._doAssessment(apiKey, modelName, pages, rubrics, answerKey, questions);
        return result;
      } catch (error: any) {
        lastError = error;
        console.warn(`[Groq] Error with model ${modelName}:`, error?.message || error);
        
        // Handle rate limit specifically
        if (error?.message?.includes("429") || error?.status === 429) {
          groqRateLimiter.setCooldown(apiKey, 60);
        }

        // Clear cache so it fetches fresh models list next time if there's permission error
        if (error?.message?.includes("404") || error?.message?.includes("400")) {
           delete modelCache[apiKey];
        }
      }
    }

    throw lastError || new Error("All dynamically fetched Groq API models failed for the selected key.");
  }

  private async _doAssessment(
    apiKey: string,
    modelName: string,
    pages: any[],
    rubrics: any[],
    answerKey?: string,
    questions?: any[]
  ): Promise<AIAssessmentResult> {
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

    const promptText = `Anda adalah seorang asisten guru (AI) yang ahli dalam menilai tugas siswa secara bijak dan suportif.
Tugas Anda adalah membaca gambar-gambar tugas siswa yang dilampirkan, lalu menilainya.

${answerKeyInstruction}
${questionsInstruction && questions && questions.length > 0 ? questionsInstruction : ""}

INSTRUKSI PENILAIAN & ALOKASI SKOR (SANGAT PENTING):
1. Baca SELURUH tulisan siswa di setiap halaman dari awal hingga akhir. Ekstrak teks/jawaban siswa sebaik mungkin.
${!questions || questions.length === 0 ? questionsInstruction : ""}
4. PENILAIAN KONTEKSTUAL:
   - Jika siswa HANYA MENULIS JAWABAN (tanpa pertanyaan): Cocokkan jawaban tersebut dengan Kunci Jawaban Referensi secara berurutan atau berdasarkan konteks.
   - Jika siswa MENULIS PERTANYAAN DAN JAWABAN di kertasnya: Anda WAJIB memetakan dan mencocokkan setiap pertanyaan dengan jawabannya berdasarkan NOMOR YANG SAMA (contoh: Pertanyaan nomor 1 dipasangkan dengan Jawaban nomor 1). Baca seluruh kata dari pertanyaan tersebut secara menyeluruh agar tidak salah konteks. Setelah dipasangkan, tugas Anda adalah mengecek apakah JAWABAN siswa tersebut benar dan tepat terhadap PERTANYAAN-nya sendiri. PASTIKAN Anda HANYA memberikan analisis dan nilai untuk bagian JAWABANNYA saja (jangan menilai kualitas pertanyaannya).
5. Yang dinilai adalah KESESUAIAN KONTEKS (bukan kesamaan kata per kata).

ATURAN UMPAN BALIK EDUKATIF (FEEDBACK):
- Pada 'analysisText' di setiap soal:
- Jika jawaban BENAR: Cukup tuliskan "Benar" tanpa pujian atau analisis tambahan untuk menghemat token.
- Jika jawaban SALAH/KURANG TEPAT: WAJIB berikan analisis kesalahan dan arahan yang membangun tanpa menyalahkan serta berikan motivasi (contoh: "Jawabanmu masih kurang tepat, mari perhatikan kembali bagian... tetap semangat!").
- Gunakan bahasa yang ramah, hangat, dan memotivasi HANYA pada jawaban yang salah.
- JIKA TULISAN SISWA TIDAK DAPAT DIBACA SAMA SEKALI PADA SOAL TERTENTU: Berikan nilai 0, tuliskan "Tulisan tidak dapat dibaca" pada 'analysisText', dan WAJIB set 'status' menjadi "UNREADABLE". Jika terbaca, set 'status' menjadi "OK".

ATURAN BAHASA:
- Gunakan bahasa Indonesia yang baik dan benar sesuai KBBI. Gunakan kata 'algoritma' (bukan 'algoritme').
- DETEKSI KESALAHAN EJAAN (BOUNDING BOX): Hanya koreksi kata yang BENAR-BENAR SALAH ejaannya (contoh: 'apotik' menjadi 'apotek'). Jika salah ejaan, berikan koordinat [ymin, xmin, ymax, xmax] di array \`errorHighlights\`. Jika tidak ada salah ejaan, JANGAN memaksakan koreksi, kosongkan array.

Output Anda HARUS berupa JSON murni dengan struktur berikut:
{
  "totalScore": number, // jumlah skor yang didapat siswa (maks 100)
  "generalFeedback": "Apresiasi dan umpan balik singkat keseluruhan untuk siswa",
  "analysis": [
    {
      "questionNumber": "string",
      "studentAnswer": "string (teks pertanyaan & jawaban siswa yang terbaca, atau jawabannya saja)",
      "score": number, // skor yang didapat untuk soal ini
      "maxScore": number, // skor maksimal soal ini (100 / N)
      "analysisText": "string (Analisis alasan skor + Umpan balik edukatif/pujian)",
      "status": "OK" // atau "UNREADABLE" jika tulisan tidak dapat dibaca
    }
  ],
  "errorHighlights": [
    {
      "word": "kata yang salah",
      "correction": "perbaikan kata sesuai KBBI",
      "box": [0, 0, 0, 0],
      "pageIndex": 0
    }
  ]
}`;

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
        image_url: {
          url: `data:${mimeType};base64,${base64Data}`,
        },
      });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: "user",
            content: contentParts,
          },
        ],
        temperature: 0.2,
        max_tokens: 4096,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Groq API returned ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content;
    if (!responseText) {
      throw new Error("Groq API returned empty response.");
    }

    const cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText) as AIAssessmentResult;
  }

  /**
   * Generate an answer key from teacher-uploaded task documents.
   * Analyzes the extracted text (and optionally images) from attachments
   * and produces reference answers.
   */
  async generateAnswerKey(taskText: string, rubrics: any[], imageAttachments?: any[]): Promise<string> {
    const keys = this.getApiKeys();
    if (keys.length === 0) {
      throw new Error("GROQ_API_KEY / GROQ_API_KEYS is not configured.");
    }

    const apiKey = keys[currentKeyIndex % keys.length];
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;

    const availableModels = await getDynamicModels(apiKey);
    
    // Determine if we need multimodal (have images) or text-only
    const hasImages = imageAttachments && imageAttachments.length > 0;
    
    let modelsToTry: string[];
    if (hasImages) {
      const multimodalModels = availableModels.filter(m => {
        const lower = m.toLowerCase();
        return lower.includes("vision") || lower.includes("llava") || lower.includes("pixtral")
          || lower.includes("scout") || lower.includes("maverick")
          || lower.includes("qwen3") || lower.includes("qwen-vl");
      });
      modelsToTry = multimodalModels.length > 0 ? multimodalModels : [
        "llama-3.2-90b-vision-preview",
        "llama-3.2-11b-vision-preview"
      ];
    } else {
      // For text-only, prefer larger text models
      modelsToTry = availableModels.length > 0 ? availableModels : [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant"
      ];
    }

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
