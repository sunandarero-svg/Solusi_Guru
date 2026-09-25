import { AIProvider, AIAssessmentResult } from "./AIProvider";
import { readFile } from "fs/promises";
import path from "path";
import { groqRateLimiter } from "./rateLimiter";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    ]; // Fallback defaults
  }
  
  const data = await res.json();
  const availableModels = data.data.map((m: any) => m.id);
  console.log(`[Groq] Available models for key prefix ${apiKey.substring(0, 8)}:`, availableModels.join(", "));
  modelCache[apiKey] = availableModels;
  return availableModels;
}

export class GroqProvider implements AIProvider {
  readonly providerName = "Groq-Vision";

  private async _extractVisionWithGemini(
    visionPrompt: string,
    pages: any[],
    apiKeyName: string
  ): Promise<{ text: string, success: boolean, isRateLimited: boolean }> {
    const geminiKey = process.env[apiKeyName] || process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      console.warn(`[Gemini] No API key found for ${apiKeyName}.`);
      return { text: "", success: false, isRateLimited: false };
    }

    try {
      console.log(`[Gemini] Extracting vision using key from ${apiKeyName}...`);
      const genAI = new GoogleGenerativeAI(geminiKey);
      
      const imageParts: any[] = [];
      for (const page of pages) {
        try {
          let buffer: Buffer;
          if (page.storageKey.startsWith("http")) {
            const res = await fetch(page.storageKey);
            buffer = Buffer.from(await res.arrayBuffer());
          } else {
            const filePath = path.join(process.cwd(), "public", page.storageKey.replace(/^\//, ""));
            buffer = await readFile(filePath);
          }
          let mimeType = page.mimeType || "image/jpeg";
          if (!mimeType.startsWith("image/")) mimeType = "image/jpeg";
          
          imageParts.push({
            inlineData: {
              data: buffer.toString("base64"),
              mimeType
            }
          });
        } catch (fileErr: any) {
          console.warn(`[Gemini] Failed to read image file:`, fileErr?.message || fileErr);
        }
      }

      if (imageParts.length === 0) {
        console.warn(`[Gemini] No valid images found to process. Skipping Gemini call.`);
        return { text: "[Tidak ada gambar yang dapat dibaca atau file lampiran hilang dari server (ENOENT)]", success: true, isRateLimited: false };
      }

      let extractedText = "";
      let isSuccess = false;
      let lastGeminiError: any = null;

      for (const modelName of ["gemini-1.5-flash", "gemini-flash", "gemini-1.5-pro", "gemini-1.5-flash-latest", "gemini-pro-vision"]) {
        try {
          console.log(`[Gemini] Extracting vision using model: ${modelName}...`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent([
            visionPrompt,
            ...imageParts
          ]);
          extractedText = result.response.text();
          isSuccess = true;
          break; // Break loop on success
        } catch (modelErr: any) {
          lastGeminiError = modelErr;
          console.warn(`[Gemini] Model ${modelName} failed:`, modelErr?.message || modelErr);
          // If rate limited, don't try other Gemini models, just break and fallback to Groq
          if (modelErr?.status === 429 || String(modelErr).includes("429")) {
            break;
          }
        }
      }

      if (!isSuccess) {
        throw lastGeminiError || new Error("All Gemini models failed.");
      }

      return { text: extractedText, success: true, isRateLimited: false };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      console.warn(`[Gemini] Vision extraction failed:`, errMsg);
      const isRateLimited = err?.status === 429 || errMsg.includes("429");
      if (isRateLimited) {
         console.warn(`[Gemini] ⚠️ RATE LIMIT REACHED for ${apiKeyName}. Switching to Fallback...`);
      }
      return { text: "", success: false, isRateLimited };
    }
  }

  async assessSubmission(pages: any[], rubrics: any[], answerKey?: string, questions?: any[]): Promise<AIAssessmentResult> {
    const textModels = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.3-70b-versatile", "qwen/qwen-2.5-72b"];
    const customModel = process.env.GROQ_MODEL?.trim();
    const baseTextModels = customModel ? [customModel, ...textModels] : textModels;

    let lastError: any = null;
    const maxRetries = 4; // Beri kesempatan retry lebih banyak untuk menampung rotasi 3+ API key

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let apiKey = "";
      try {
        // Ambil key baru setiap attempt
        const { key, index: usedIndex } = await groqRateLimiter.waitForKey(30000);
        apiKey = key;
        const totalKeys = groqRateLimiter.getKeys().length;
        
        const availableModels = await getDynamicModels(apiKey);
        const activeTextModels = baseTextModels.filter(m => availableModels.includes(m) || m === customModel);
        const textModelsToTry = activeTextModels.length > 0 ? activeTextModels : ["openai/gpt-oss-120b"];

        const textModel = textModelsToTry[attempt % textModelsToTry.length];

        console.log(`[AI] Attempt ${attempt + 1}/${maxRetries}: Vision=Hybrid, Text=${textModel} (Key Index: ${usedIndex + 1}/${totalKeys})`);
        
        const result = await this._doAssessment(apiKey, textModel, pages, rubrics, answerKey, questions, availableModels);
        return result;
      } catch (error: any) {
        lastError = error;
        console.warn(`[AI] Error on attempt ${attempt + 1}:`, error?.message || error);
        
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

    throw lastError || new Error("All attempts failed in Two-Step Pipeline after rotating keys.");
  }

  private async _doAssessment(
    apiKey: string,
    textModel: string,
    pages: any[],
    rubrics: any[],
    answerKey?: string,
    questions?: any[],
    availableModels: string[]
  ): Promise<AIAssessmentResult> {
    
    // --- TAHAP 1: VISION (Ekstraksi Teks) ---
    const visionPrompt = `Tugas Anda adalah membaca seluruh tulisan tangan pada gambar-gambar ini. Transkripsikan semua teks dan angka persis seperti yang tertulis. 
SANGAT PENTING: 
- PASTIKAN Anda menangkap dan mempertahankan NOMOR SOAL (1, 2, 3, dst) yang ditulis oleh siswa. 
- Pisahkan setiap jawaban atau nomor soal dengan baris baru agar strukturnya sangat jelas dibaca.
Jangan ubah makna, jangan berikan penilaian, jangan menambahkan komentar apa pun. Cukup kembalikan hasil transkripsi teksnya saja. Jika tulisan sangat buram dan sama sekali tidak bisa dibaca, tulis "UNREADABLE".`;
    
    let extractedText = "";

    // 1. Try Gemini using Student Key
    const geminiResult = await this._extractVisionWithGemini(visionPrompt, pages, "GEMINI_API_KEY_STUDENT");
    
    if (geminiResult.success && geminiResult.text) {
      extractedText = geminiResult.text;
      console.log(`[Gemini] Step 1 Complete. Extracted Text Length: ${extractedText.length}`);
    } else {
      // 2. Fallback to Llama Maverick (Llama 3.2 Vision on Groq)
      const visionModels = ["llama-3.2-90b-vision-preview", "llama-3.2-11b-vision-preview", "qwen/qwen3.8-27b"];
      const activeVisionModels = visionModels.filter(m => availableModels.includes(m));
      const visionModelsToTry = activeVisionModels.length > 0 ? activeVisionModels : ["llama-3.2-90b-vision-preview"];

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

      let visionSuccess = false;
      let visionLastError: any = null;

      for (const visionModel of visionModelsToTry) {
        try {
          console.log(`[Groq Fallback] Step 1: Extracting text using Vision (${visionModel})...`);
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
              max_tokens: 800,
            }),
          });

          if (!visionResponse.ok) {
            const errBody = await visionResponse.text();
            throw new Error(`Vision API returned ${visionResponse.status}: ${errBody}`);
          }

          const visionData = await visionResponse.json();
          extractedText = visionData.choices?.[0]?.message?.content;
          
          if (!extractedText) {
            throw new Error("Fallback Vision API returned empty response.");
          }
          console.log(`[Groq Fallback] Step 1 Complete. Extracted Text Length: ${extractedText.length}`);
          visionSuccess = true;
          break; // Keluar loop jika sukses
        } catch (err: any) {
          visionLastError = err;
          console.warn(`[Groq Fallback] Vision model ${visionModel} failed:`, err?.message || err);
          if (err?.message?.includes("429") || String(err).includes("429")) {
            // Lanjut ke model vision berikutnya di key ini.
            continue;
          } else {
            // Jika bukan error rate limit, lemparkan error agar dicatch oleh assessSubmission
            throw err;
          }
        }
      }

      if (!visionSuccess) {
        throw visionLastError || new Error("All Fallback Vision models failed.");
      }
    }

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

    const textPrompt = `Anda adalah asisten guru (AI) penilai tugas siswa.
Tugas Anda menilai transkripsi tulisan siswa secara akurat berdasarkan Kunci Jawaban.

BERIKUT ADALAH HASIL TRANSKRIPSI JAWABAN SISWA:
"""
${extractedText}
"""

${answerKeyInstruction}
${questionsInstruction && questions && questions.length > 0 ? questionsInstruction : ""}

INSTRUKSI PENILAIAN & ALOKASI SKOR:
0. WAJIB MENILAI KESELURUHAN SOAL TANPA TERKECUALI! Pastikan array 'analysis' berisi penilaian untuk semua soal.
1. PENCOCOKAN NOMOR SOAL: Kaitkan jawaban siswa dengan nomor soal yang benar.
2. TAHAP PENALARAN SINGKAT: Tulis 1 kalimat penalaran di 'reasoning' membandingkan inti jawaban siswa dan kunci.
3. KRITERIA BENAR/SALAH - PILIHAN GANDA (SANGAT PENTING - WAJIB DIPATUHI):
   - Untuk soal PILIHAN GANDA: Yang PALING UTAMA dinilai adalah HURUF PILIHAN JAWABAN (A, B, C, D, atau E) yang ditulis siswa.
   - Jika HURUF jawaban siswa SAMA dengan huruf di Kunci Jawaban (abaikan besar/kecil huruf), maka jawaban tersebut WAJIB dinilai BENAR SEMPURNA (100% maxScore), TANPA TERKECUALI.
   - Abaikan SEPENUHNYA teks, kalimat, atau kata yang ditulis siswa SETELAH huruf jawaban. Meskipun teks tersebut mengandung typo, salah tulis, tidak lengkap, atau bahkan berbeda dari kunci jawaban, selama HURUF jawabannya BENAR, maka jawabannya tetap BENAR SEMPURNA.
   - Contoh: Kunci jawaban = "B. Fotosintesis". Siswa menulis "B. Potosintesis" atau "B. Fotosentesis" atau "B" saja → Semua BENAR SEMPURNA karena huruf B-nya cocok.
   - Contoh: Kunci jawaban = "A. Jakarta". Siswa menulis "A. Jakrta" atau "A. jakrta" → BENAR SEMPURNA karena huruf A-nya cocok.
   - HANYA salahkan jika HURUF jawaban siswa BERBEDA dari huruf di Kunci Jawaban.
4. KRITERIA BENAR/SALAH - ISIAN SINGKAT & ESSAY (SANGAT PENTING - WAJIB DIPATUHI):
   - Untuk soal ISIAN SINGKAT dan ESSAY: Gunakan pencocokan KESAMAAN MAKNA/KONSEP dengan toleransi tinggi.
   - Jika jawaban siswa memiliki KESAMAAN MAKNA/KONSEP minimal 80% dari Kunci Jawaban, maka jawaban siswa WAJIB dinilai BENAR SEMPURNA (100% maxScore).
   - Abaikan perbedaan ejaan, typo, tata bahasa, urutan kata, atau penggunaan sinonim selama MAKNA/KONSEP utamanya sama.
   - BENAR SEMPURNA (100% maxScore): Makna/konsep jawaban siswa sama atau setara ≥80% dengan kunci jawaban.
   - BENAR SEBAGIAN (50% maxScore): Jawaban siswa mengandung sebagian konsep benar namun kesamaan <80%.
   - SALAH (0): Jawaban salah, melenceng jauh, atau tidak ada hubungannya dengan kunci jawaban.
5. ATURAN TEKS TIDAK TERBACA (SANGAT PENTING):
   - JANGAN PERNAH memprediksi, menebak, atau mengasumsikan kata/kalimat yang TIDAK DAPAT DIBACA atau TIDAK MEMILIKI MAKNA.
   - Jika transkripsi mengandung teks yang sama sekali tidak bisa dipahami maknanya (bukan typo biasa, melainkan karakter acak atau kata yang benar-benar tidak bermakna), anggap bagian tersebut sebagai tidak terjawab.
   - Jika 'UNREADABLE', berikan skor 0, analysisText "Tulisan kurang jelas terbaca, silakan coba foto ulang ya.", dan status "UNREADABLE".
6. UMPAN BALIK EDUKATIF ('analysisText') - SANGAT PENTING:
   - Jika jawaban BENAR SEMPURNA: Berikan apresiasi atau pujian singkat (1 kalimat).
   - Jika jawaban SALAH atau BENAR SEBAGIAN (nilai < maxScore): WAJIB berikan analisis singkat kenapa salah/kurang tepat, DAN jelaskan jawaban yang seharusnya benar berdasarkan Kunci Jawaban (dengan bahasa yang memotivasi siswa).

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

    console.log(`[Groq] Step 2: Grading with ${textModel}...`);
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
        max_tokens: 4096,
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

        // TAHAP 1: EKSTRAKSI GAMBAR
    if (hasImages) {
      const visionPrompt = `Tugas Anda adalah membaca seluruh tulisan pada gambar-gambar soal/tugas ini. Transkripsikan semua teks, soal, pilihan ganda, dan angka persis seperti yang tertulis.
Jangan ubah makna, jangan berikan jawaban. Cukup kembalikan hasil transkripsi teks soalnya saja. Jika gambar tidak berisi teks soal yang relevan, jelaskan dengan singkat.`;
      
      // 1. Try Gemini using Teacher Key
      const geminiResult = await this._extractVisionWithGemini(visionPrompt, imageAttachments as any, "GEMINI_API_KEY_TEACHER");
      
      if (geminiResult.success && geminiResult.text) {
        extractedText = geminiResult.text;
        console.log(`[Gemini] Step 1 (Answer Key) Complete. Extracted Text Length: ${extractedText.length}`);
      } else {
        // 2. Fallback to Llama Maverick (Llama 3.2 Vision on Groq)
        const visionModels = ["llama-3.2-90b-vision-preview", "llama-3.2-11b-vision-preview", "qwen/qwen3.8-27b"];
        const activeVisionModels = visionModels.filter(m => availableModels.includes(m));
        const visionModel = activeVisionModels[0] || "llama-3.2-90b-vision-preview";

        console.log(`[Groq Fallback] Step 1 (Answer Key): Extracting text using Llama Maverick Vision (${visionModel})...`);
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
            console.warn(`[Groq] Failed to load image attachment: ${attachment.originalFileName}`, err);
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
            max_tokens: 800,
          }),
        });

        if (!visionResponse.ok) {
          const errBody = await visionResponse.text();
          throw new Error(`Vision API returned ${visionResponse.status}: ${errBody}`);
        }
        const visionData = await visionResponse.json();
        extractedText = visionData.choices?.[0]?.message?.content || "";
        console.log(`[Groq Fallback] Step 1 Complete. Extracted Text Length: ${extractedText.length}`);
      }
    }

    // TAHAP 2: GENERATE KUNCI JAWABAN DENGAN GPT-OSS-20B
    const textModels = ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3.8-27b", "llama-3.3-70b-versatile"];
    const activeTextModels = textModels.filter(m => availableModels.includes(m));
    let modelsToTry = activeTextModels.length > 0 ? activeTextModels : ["openai/gpt-oss-20b"];

    const customModel = process.env.GROQ_MODEL?.trim();
    if (customModel) {
      modelsToTry = [customModel, ...modelsToTry];
    }

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
1. Hasil teks harus persis seperti format ketikan standar pada Microsoft Word (teks biasa/plain text).
2. DILARANG KERAS menggunakan simbol Markdown untuk menebalkan teks (seperti **teks**) atau memiringkan teks (seperti *teks*).
3. Jika terdapat rumus matematika, fisika, atau simbol ilmiah, tuliskan rumus sesuai kaidah penulisan yang baku secara natural. 
4. PASTIKAN rumus ditulis BERSIH tanpa ada simbol tambahan seperti menebalkan (**rumus**) atau pemformatan lain di sekitarnya. 
5. Pertahankan struktur poin-poin agar tetap rapi, gunakan spasi baris yang jelas, dan penomoran standar yang sesuai dengan soal.

Berikan kunci jawaban dalam format teks biasa (bukan JSON atau Markdown berlebihan).`;

    const contentParts: any[] = [{ type: "text", text: prompt }];

        let modelLastError: any = null;
        let success = false;
        let generatedAnswer = "";

        for (const modelName of modelsToTry) {
          try {
            console.log(`[Groq] Step 2: Generating answer key with model ${modelName}...`);
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
            const answerKeyStr = data.choices?.[0]?.message?.content;
            if (!answerKeyStr) {
              throw new Error("Groq API returned empty response for answer key.");
            }

            console.log(`[Groq] Answer key generated successfully with ${modelName}.`);
            generatedAnswer = answerKeyStr.trim();
            success = true;
            break;
          } catch (error: any) {
            modelLastError = error;
            console.warn(`[Groq] Answer key generation failed with ${modelName}:`, error?.message);
            if (error?.message?.includes("429") || String(error).includes("429")) {
              continue; // try next model
            } else {
              throw error; // throw to trigger retry with new key
            }
          }
        }

        if (success) return generatedAnswer;
        throw modelLastError || new Error("Failed to generate answer key with all available models on this key.");

      } catch (error: any) {
        lastError = error;
        console.warn(`[Groq] Answer key generation attempt ${attempt + 1} failed:`, error?.message || error);
        
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

    throw lastError || new Error("Failed to generate answer key after rotating keys.");
  }
}
