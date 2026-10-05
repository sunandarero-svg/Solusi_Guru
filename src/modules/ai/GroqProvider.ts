import { AIProvider, AIAssessmentResult } from "./AIProvider";
import { readFile } from "fs/promises";
import path from "path";
import { groqRateLimiter } from "./rateLimiter";
import { GoogleGenAI } from "@google/genai";
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


  async assessSubmission(pages: any[], rubrics: any[], answerKey?: string, questions?: any[]): Promise<AIAssessmentResult> {
    const textModels = ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "llama-3.3-70b-versatile", "qwen/qwen-2.5-72b"];
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
        const textModelsToTry = activeTextModels.length > 0 ? activeTextModels : ["openai/gpt-oss-20b"];

        const textModel = textModelsToTry[attempt % textModelsToTry.length];

        console.log(`[AI] Attempt ${attempt + 1}/${maxRetries}: Vision=Hybrid, Text=${textModel} (Key Index: ${usedIndex + 1}/${totalKeys})`);
        
        const result = await this._doAssessment(apiKey, textModel, pages, rubrics, availableModels, answerKey, questions);
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
    availableModels: string[],
    answerKey?: string,
    questions?: any[]
  ): Promise<AIAssessmentResult> {
    
    // --- TAHAP 1: VISION (Ekstraksi Teks) ---
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
    
    let extractedText = "";

    // Fallback to Qwen VL or Llama Vision
      const visionModels = ["qwen/qwen3.8-27b", "llama-3.2-90b-vision-preview", "llama-3.2-11b-vision-preview"];
      const activeVisionModels = visionModels.filter(m => availableModels.includes(m));
      const visionModelsToTry = activeVisionModels.length > 0 ? activeVisionModels : ["qwen/qwen3.8-27b"];

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

      try {
        console.log(`[AI Vision] Step 1: Extracting text using Primary (Gemini gemini-3.8-flash)...`);
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
          const base64Data = buffer.toString("base64");
          geminiContentParts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          });
        }

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: geminiContentParts,
          config: {
            temperature: 0.1,
          }
        });
        extractedText = response.text || "";
        if (!extractedText) throw new Error("Empty response from Gemini");
        console.log(`[AI Vision] Step 1 Complete via Gemini. Extracted Text Length: ${extractedText.length}`);
        visionSuccess = true;
      } catch (geminiError: any) {
        visionLastError = geminiError;
        console.warn(`[AI Vision] Gemini failed, falling back to Groq (Qwen):`, geminiError?.message || geminiError);

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
      }

      if (!visionSuccess) {
        throw visionLastError || new Error("All Vision models failed.");
      }


    // --- TAHAP 2: TEXT ANALYSIS (Grading) ---
    // Build answer key context if available
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
      }).join("\\n");
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

    const openRouterModel = "meta-llama/llama-4-maverick";
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    console.log(`[AI Grading] Step 2: Grading with OpenRouter (${openRouterModel})...`);

    const textResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://solusi-guru.vercel.app",
        "X-Title": "Solusi Guru",
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: [{ role: "user", content: textPrompt }],
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
      
      // Priority: Qwen VL, fallback to Llama Vision
        const visionModels = ["qwen/qwen3.8-27b", "llama-3.2-90b-vision-preview", "llama-3.2-11b-vision-preview"];
        const activeVisionModels = visionModels.filter(m => availableModels.includes(m));
        const visionModel = activeVisionModels[0] || "qwen/qwen3.8-27b";

        console.log(`[Groq Fallback] Step 1 (Answer Key): Extracting text using Vision (${visionModel})...`);
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

            console.log(`[Groq] Answer key generated successfully with ${modelName}.`);
            
            const jsonMatch = answerKeyStr.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
              throw new Error("Groq API returned invalid JSON for answer key.");
            }
            
            const parsedData = JSON.parse(jsonMatch[0].trim());
            generatedAnswer = parsedData; // Sekarang mengembalikan object utuh
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
