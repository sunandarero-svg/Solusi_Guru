import { AIProvider, AIAssessmentResult } from "./AIProvider";
import { readFile } from "fs/promises";
import path from "path";

// Global counter for round-robin
let currentKeyIndex = 0;

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

  private getApiKeys(): string[] {
    const keysStr = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY;
    if (!keysStr) return [];
    return keysStr
      .replace(/[\r\n]/g, "")
      .split(",")
      .map((k) => k.replace(/['"` ]/g, "").trim())
      .filter((k) => k.length > 5);
  }

  async assessSubmission(pages: any[], rubrics: any[], answerKey?: string): Promise<AIAssessmentResult> {
    const keys = this.getApiKeys();
    if (keys.length === 0) {
      throw new Error("GROQ_API_KEY / GROQ_API_KEYS is not configured.");
    }

    // Select key using round robin
    const apiKey = keys[currentKeyIndex % keys.length];
    const usedIndex = currentKeyIndex % keys.length;
    // Increment and wrap around to prevent overflow
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    
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
        console.log(`[Groq] Trying model ${modelName} with key prefix ${apiKey.substring(0, 8)}... (Key Index: ${usedIndex + 1}/${keys.length})`);
        const result = await this._doAssessment(apiKey, modelName, pages, rubrics, answerKey);
        return result;
      } catch (error: any) {
        lastError = error;
        console.warn(`[Groq] Error with model ${modelName}:`, error?.message || error);
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
    answerKey?: string
  ): Promise<AIAssessmentResult> {
    const firstRubric = rubrics[0];
    let rubricInstruction = "";
    if (firstRubric && firstRubric.criteria) {
      rubricInstruction = "Berikut adalah kriteria penilaian (rubrik):\n";
      firstRubric.criteria.forEach((c: any) => {
        rubricInstruction += `- ID Kriteria: ${c._id}\n`;
        rubricInstruction += `  Nama: ${c.name}\n`;
        rubricInstruction += `  Deskripsi: ${c.description}\n`;
        rubricInstruction += `  Skor Maksimal: ${c.maxScore}\n\n`;
      });
    }

    // Build answer key context if available
    let answerKeyInstruction = "";
    if (answerKey && answerKey.trim().length > 0) {
      answerKeyInstruction = `
KUNCI JAWABAN REFERENSI (dari soal yang dilampirkan guru):
${answerKey}

PENTING — ATURAN PENILAIAN BERDASARKAN KUNCI JAWABAN:
- Bandingkan jawaban siswa dengan kunci jawaban di atas.
- Jawaban siswa TIDAK HARUS sama persis kata per kata dengan kunci jawaban.
- Yang dinilai adalah KESESUAIAN KONSEP: apakah jawaban siswa menunjukkan pemahaman yang benar terhadap konsep yang ditanyakan.
- Jika siswa menjawab dengan kata-kata berbeda tetapi konsepnya benar dan tepat, berikan skor penuh untuk kriteria tersebut.
- Jika siswa menjawab dengan konsep yang sebagian benar, berikan skor proporsional.
- Jika jawaban siswa sama sekali tidak sesuai dengan konsep yang ditanyakan, berikan skor rendah.
- Dalam 'reasoning', jelaskan secara singkat bagaimana jawaban siswa dibandingkan dengan konsep kunci jawaban.
`;
    }

    const promptText = `Tugas Anda adalah menilai tugas siswa berdasarkan rubrik berikut.

${rubricInstruction}
${answerKeyInstruction}

INSTRUKSI:
1. Baca tulisan siswa di setiap halaman.
2. Berikan penilaian objektif untuk tiap kriteria.
3. Tentukan skor & berikan penjelasan singkat (reasoning).
${answerKey ? "4. Gunakan KUNCI JAWABAN sebagai acuan utama.\n" : ""}

ATURAN (WAJIB):
- Gunakan bahasa Indonesia baku (KBBI).
- HANYA koreksi ejaan jika SALAH MUTLAK (contoh: 'apotik' jadi 'apotek'). JANGAN perbaiki kata yang sudah benar atau ejaannya sama.
- Beri apresiasi di 'generalFeedback' dgn bahasa ramah.
- Kalimat singkat dan jelas.

DETEKSI KESALAHAN EJAAN:
Jika ada ejaan salah, WAJIB beri koordinat (bounding box) format [ymin, xmin, ymax, xmax] (skala 0-1000). Jika tidak ada, kosongkan array.

Output WAJIB berupa JSON:
{
  "totalScore": number,
  "generalFeedback": "string",
  "rubricScores": [{"rubricCriterionId":"string","score":number,"maxScore":number,"reasoning":"string"}],
  "errorHighlights": [{"word":"string","correction":"string","box":[0,0,0,0],"pageIndex":0}]
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
        max_tokens: 800,
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

    let rubricContext = "";
    const firstRubric = rubrics[0];
    if (firstRubric && firstRubric.criteria) {
      rubricContext = "\nKriteria rubrik yang digunakan:\n";
      firstRubric.criteria.forEach((c: any) => {
        rubricContext += `- ${c.name}: ${c.description || ""} (Maks skor: ${c.maxScore})\n`;
      });
    }

    const prompt = `Anda adalah seorang guru yang sangat berpengalaman. Tugas Anda adalah membuat KUNCI JAWABAN berdasarkan soal/tugas yang diberikan.

SOAL/TUGAS DARI GURU:
${taskText}
${rubricContext}

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
            max_tokens: 800,
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
