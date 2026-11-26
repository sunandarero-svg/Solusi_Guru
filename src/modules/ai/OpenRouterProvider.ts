import { AIProvider, AIAssessmentResult } from "./AIProvider";
import { readFile } from "fs/promises";
import path from "path";
import { compressBufferForOCR } from "./compressImageForOCR";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Resilient JSON parser for AI outputs.
 * Menangani:
 * 1. Tag <think>...</think> dari reasoning model
 * 2. Markdown code blocks (```json ... ```)
 * 3. Trailing comma sebelum } atau ]
 * 4. Missing comma antar elemen array / baris properti
 */
function safeParseAIJson(responseText: string): any {
  if (!responseText || typeof responseText !== "string") {
    throw new Error("Empty AI response text");
  }

  let cleanText = responseText
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const firstBrace = cleanText.indexOf("{");
  const lastBrace = cleanText.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleanText = cleanText.substring(firstBrace, lastBrace + 1).trim();
  }

  // Attempt 1: Standard JSON parse
  try {
    const parsed = JSON.parse(cleanText);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    // Continue to repair
  }

  // Attempt 2: Auto-repair common LLM JSON syntax quirks
  let repaired = cleanText
    .replace(/,(\s*[\]}])/g, "$1")
    .replace(/}(\s*){/g, "},$1{")
    .replace(/(")\s*\n\s*(")/g, "$1,\n$2")
    .replace(
      /((?:true|false|null|\d+|"[^"\\]*(?:\\.[^"\\]*)*"))\s*\n\s*("[a-zA-Z0-9_]+"\s*:)/g,
      "$1,\n$2"
    );

  const parsed = JSON.parse(repaired);
  if (parsed && typeof parsed === "object") {
    return parsed;
  }

  throw new Error("AI response did not parse into a valid JSON object.");
}

export class OpenRouterProvider implements AIProvider {
  readonly providerName = "OpenRouter-Nemotron3.5-SuperVL";

  private getApiKey(): string {
    const key =
      process.env.OPENROUTER_API_KEY2 ||
      process.env.OPENROUTER_API_KEY ||
      process.env.NVIDIA_API_KEY ||
      process.env.NVIDIA_KEY ||
      process.env.GROQ_API_KEYS ||
      process.env.GROQ_API_KEY;
    if (!key) {
      throw new Error("API key (OPENROUTER_API_KEY2, OPENROUTER_API_KEY, NVIDIA_API_KEY, or GROQ_API_KEY) is not configured.");
    }
    return key.trim().replace(/^["']|["']$/g, "");
  }

  private getOpenRouter2ApiKey(): string | null {
    const key = process.env.OPENROUTER_API_KEY2 || process.env.OPENROUTER_API_KEY;
    if (!key) return null;
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
      
      // Kompresi buffer adaptif resolusi tinggi (1400-1800px) agar detail huruf tulisan tangan tetap tajam
      const targetDimension = pages.length >= 3 ? 1400 : (pages.length === 2 ? 1600 : 1800);
      const { compressedBase64, compressedMimeType } = await compressBufferForOCR(buffer, rawMimeType, targetDimension);

      visionContentParts.push({
        type: "image_url",
        image_url: { url: `data:${compressedMimeType};base64,${compressedBase64}` },
      });
    }

    // 1. PRIMARY: OpenRouter2 Free (nvidia/nemotron-3.5-super-vl:free)
    const openRouter2Key = this.getOpenRouter2ApiKey();
    if (openRouter2Key) {
      const freeModel = process.env.OPENROUTER_MODEL_FREE || "nvidia/nemotron-3.5-super-vl:free";
      try {
        console.log(`[Vision OCR] Step 1 (Primary - OpenRouter2 Free): Extracting text using (${freeModel})...`);
        const response = await fetch(OPENROUTER_BASE_URL, {
          method: "POST",
          headers: this.getHeaders(openRouter2Key),
          body: JSON.stringify({
            model: freeModel,
            messages: [{ role: "user", content: visionContentParts }],
            temperature: 0.0,
            max_tokens: 16384,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const extractedText = data.choices?.[0]?.message?.content;
          if (extractedText && extractedText.trim().length > 0) {
            console.log(`[Vision OCR] Primary OpenRouter2 Free berhasil! Panjang teks: ${extractedText.length}`);
            return extractedText;
          }
        } else {
          const errBody = await response.text();
          console.warn(`[Vision OCR] OpenRouter2 Primary returned ${response.status}: ${errBody}`);
        }
      } catch (or2Err: any) {
        console.warn("[Vision OCR] OpenRouter2 Primary exception, melanjutkan ke Fallback 1 NVIDIA:", or2Err?.message);
      }
    }

    // 2. FALLBACK 1: NVIDIA Direct API (Nemotron 120B & meta/muse-glimmer-30b)
    const nvidiaKey = this.getNvidiaApiKey();
    if (nvidiaKey) {
      const nvidiaModels = [
        process.env.NVIDIA_MODEL || "nvidia/nemotron-3.5-super-vl-120b-a12b",
        "meta/muse-glimmer-30b"
      ];

      for (const nvModel of nvidiaModels) {
        try {
          console.log(`[Vision OCR] Step 2 (Fallback 1 - NVIDIA): Extracting text using (${nvModel})...`);
          const response = await fetch(NVIDIA_BASE_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${nvidiaKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: nvModel,
              messages: [{ role: "user", content: visionContentParts }],
              temperature: 0.0,
              max_tokens: 16384,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const extractedText = data.choices?.[0]?.message?.content;
            if (extractedText && extractedText.trim().length > 0) {
              console.log(`[Vision OCR] NVIDIA Fallback 1 (${nvModel}) berhasil! Panjang teks: ${extractedText.length}`);
              return extractedText;
            }
          } else {
            const errBody = await response.text();
            console.warn(`[Vision OCR] NVIDIA (${nvModel}) returned ${response.status}: ${errBody}`);
          }
        } catch (nvErr: any) {
          console.warn(`[Vision OCR] NVIDIA (${nvModel}) exception:`, nvErr?.message || nvErr);
        }
      }
    }

    // 3. FALLBACK 2: OpenRouter (nvidia/nemotron-3.5-super-vl - Berbayar)
    const openRouterKey = this.getOpenRouterApiKey();
    if (openRouterKey) {
      const paidModel = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3.5-super-vl";
      try {
        console.log(`[Vision OCR] Step 3 (Fallback 2 - OpenRouter Berbayar): Extracting text using (${paidModel})...`);
        const response = await fetch(OPENROUTER_BASE_URL, {
          method: "POST",
          headers: this.getHeaders(openRouterKey),
          body: JSON.stringify({
            model: paidModel,
            messages: [{ role: "user", content: visionContentParts }],
            temperature: 0.0,
            max_tokens: 16384,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const extractedText = data.choices?.[0]?.message?.content;
          if (extractedText && extractedText.trim().length > 0) {
            console.log(`[Vision OCR] OpenRouter Fallback 2 Berbayar berhasil! Panjang teks: ${extractedText.length}`);
            return extractedText;
          }
        } else {
          const errBody = await response.text();
          console.warn(`[Vision OCR] OpenRouter Fallback 2 returned ${response.status}: ${errBody}`);
        }
      } catch (orErr: any) {
        console.warn("[Vision OCR] OpenRouter Fallback 2 exception:", orErr?.message);
      }
    }

    // 4. FALLBACK 3: Groq Qwen
    try {
      const { groqRateLimiter } = await import("@/modules/ai/rateLimiter");
      const { key } = await groqRateLimiter.waitForKey(30000);
      const groqModel = "qwen/qwen3.8-27b";
      console.log(`[Vision OCR] Step 4 (Fallback 3 - Groq): Extracting text using (${groqModel})...`);

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: groqModel,
          messages: [{ role: "user", content: visionContentParts }],
          temperature: 0.0,
          max_tokens: 16384,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const extractedText = data.choices?.[0]?.message?.content;
        if (extractedText && extractedText.trim().length > 0) {
          console.log(`[Vision OCR] Groq Fallback 3 berhasil! Panjang teks: ${extractedText.length}`);
          return extractedText;
        }
      }
    } catch (groqErr: any) {
      console.warn("[Vision OCR] Groq Fallback 3 exception:", groqErr?.message);
    }

    throw new Error("Semua provider vision OCR (OpenRouter2 Primary, NVIDIA Fallback 1, OpenRouter Fallback 2, Groq Fallback 3) gagal atau API key tidak tersedia.");
  }

  private async _executeTextWithFallback(
    _apiKey: string | null,
    prompt: string,
    temperature: number,
    maxTokens: number,
    validateResponse?: (text: string) => void
  ): Promise<string> {
    // 1. PRIMARY: OpenRouter2 Free (nvidia/nemotron-3.5-super-vl:free)
    const openRouter2Key = this.getOpenRouter2ApiKey();
    if (openRouter2Key) {
      const freeModel = process.env.OPENROUTER_MODEL_FREE || "nvidia/nemotron-3.5-super-vl:free";
      try {
        console.log(`[AI Text] Step 1 (Primary - OpenRouter2 Free): ${freeModel}...`);
        const response = await fetch(OPENROUTER_BASE_URL, {
          method: "POST",
          headers: this.getHeaders(openRouter2Key),
          body: JSON.stringify({
            model: freeModel,
            messages: [{ role: "user", content: prompt }],
            temperature,
            max_tokens: maxTokens,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const responseText = data.choices?.[0]?.message?.content;
          if (responseText && responseText.trim().length > 0) {
            if (validateResponse) validateResponse(responseText);
            console.log(`[AI Text] Berhasil menggunakan OpenRouter2 Primary (${freeModel}).`);
            return responseText;
          }
          console.warn(`[AI Text] OpenRouter2 Primary (${freeModel}) mengembalikan respon kosong.`);
        } else {
          const errBody = await response.text();
          console.warn(`[AI Text] OpenRouter2 Primary (${freeModel}) returned ${response.status}: ${errBody}`);
        }
      } catch (or2Err: any) {
        console.warn("[AI Text] OpenRouter2 Primary failed, mencoba Fallback 1 NVIDIA Direct:", or2Err?.message);
      }
    } else {
      console.warn("[AI Text] OPENROUTER_API_KEY2 tidak ditemukan, melanjutkan ke Fallback 1 NVIDIA Direct...");
    }

    // 2. FALLBACK 1: NVIDIA Direct API (Nemotron 120B & meta/muse-glimmer-30b)
    const nvidiaKey = this.getNvidiaApiKey();
    if (nvidiaKey) {
      const nvidiaModels = [
        process.env.NVIDIA_MODEL || "nvidia/nemotron-3.5-super-vl-120b-a12b",
        "meta/muse-glimmer-30b"
      ];
      for (const nvidiaModel of nvidiaModels) {
        try {
          console.log(`[AI Text] Step 2 (Fallback 1 - NVIDIA Direct): ${nvidiaModel}...`);
          const response = await fetch(NVIDIA_BASE_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${nvidiaKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: nvidiaModel,
              messages: [{ role: "user", content: prompt }],
              temperature,
              max_tokens: maxTokens,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const responseText = data.choices?.[0]?.message?.content;
            if (responseText && responseText.trim().length > 0) {
              if (validateResponse) validateResponse(responseText);
              console.log(`[AI Text] Berhasil menggunakan NVIDIA Direct Fallback 1 (${nvidiaModel})`);
              return responseText;
            }
            console.warn(`[AI Text] NVIDIA Direct (${nvidiaModel}) mengembalikan respon kosong.`);
          } else {
            const errBody = await response.text();
            console.warn(`[AI Text] NVIDIA Direct (${nvidiaModel}) returned ${response.status}: ${errBody}`);
          }
        } catch (nvErr: any) {
          console.warn(`[AI Text] NVIDIA Direct (${nvidiaModel}) exception:`, nvErr?.message);
        }
      }
    }

    // 3. FALLBACK 2: OpenRouter (nvidia/nemotron-3.5-super-vl - Berbayar)
    const openRouterKey = this.getOpenRouterApiKey();
    if (openRouterKey) {
      const paidModel = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3.5-super-vl";
      try {
        console.log(`[AI Text] Step 3 (Fallback 2 - OpenRouter Berbayar): ${paidModel}...`);
        const response = await fetch(OPENROUTER_BASE_URL, {
          method: "POST",
          headers: this.getHeaders(openRouterKey),
          body: JSON.stringify({
            model: paidModel,
            messages: [{ role: "user", content: prompt }],
            temperature,
            max_tokens: maxTokens,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const responseText = data.choices?.[0]?.message?.content;
          if (responseText && responseText.trim().length > 0) {
            if (validateResponse) validateResponse(responseText);
            console.log(`[AI Text] Berhasil menggunakan OpenRouter Fallback 2 (${paidModel}).`);
            return responseText;
          }
          console.warn(`[AI Text] OpenRouter Paid (${paidModel}) mengembalikan respon kosong.`);
        } else {
          const errBody = await response.text();
          console.warn(`[AI Text] OpenRouter Paid (${paidModel}) returned ${response.status}: ${errBody}`);
        }
      } catch (orErr: any) {
        console.warn("[AI Text] OpenRouter Paid exception:", orErr?.message);
      }
    }

    // 4. FALLBACK 3: Groq (Qwen Models)
    const groqKeysStr = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY;
    if (groqKeysStr) {
      try {
        const { groqRateLimiter } = await import("@/modules/ai/rateLimiter");
        const { key } = await groqRateLimiter.waitForKey(30000);
        const groqModels = [
          process.env.GROQ_MODEL?.trim(),
          "qwen/qwen3.8-27b",
          "qwen/qwen-2.5-72b",
          "qwen/qwen-2.5-32b",
        ].filter((m) => m && m.toLowerCase().includes("qwen")) as string[];
        const modelsToTry = groqModels.length > 0 ? groqModels : ["qwen/qwen3.8-27b", "qwen/qwen-2.5-72b"];

        for (const groqModel of modelsToTry) {
          try {
            console.log(`[AI Text] Step 4 (Fallback 3 - Groq): ${groqModel}...`);
            const response = await fetch(GROQ_BASE_URL, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${key}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: groqModel,
                messages: [{ role: "user", content: prompt }],
                temperature,
                max_tokens: maxTokens,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              const responseText = data.choices?.[0]?.message?.content;
              if (responseText && responseText.trim().length > 0) {
                if (validateResponse) validateResponse(responseText);
                console.log(`[AI Text] Berhasil menggunakan Groq Fallback 3 (${groqModel}).`);
                return responseText;
              }
            } else {
              const errBody = await response.text();
              console.warn(`[AI Text] Groq (${groqModel}) returned ${response.status}: ${errBody}`);
              if (response.status === 429) {
                groqRateLimiter.setCooldown(key, 60);
                break;
              }
            }
          } catch (mErr: any) {
            console.warn(`[AI Text] Groq (${groqModel}) exception:`, mErr?.message);
          }
        }
      } catch (groqErr: any) {
        console.warn("[AI Text] Groq Fallback 3 exception:", groqErr?.message);
      }
    }

    throw new Error("Semua model teks (OpenRouter2 Primary, NVIDIA Fallback 1, OpenRouter Fallback 2, Groq Fallback 3) gagal.");
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
   - Jika terdapat tulisan "Benar/Salah", "Benar dan salah", "B/S", "B / S", "Pernyataan Benar/Salah", atau kedua pilihan sekaligus: Tulisan tersebut TIDAK DIANGGAP SEBAGAI BAGIAN DARI SOAL, DILEWATI, dan TIDAK DIBERIKAN SKOR (skor 0, status UNREADABLE).
   - DILARANG KERAS menganggap teks judul/petunjuk seperti "Benar/Salah", "Pernyataan (Benar/Salah)", atau "B/S" sebagai nomor soal atau jawaban! Teks tersebut harus DILEWATI sepenuhnya.
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

    console.log(`[OpenRouter Nemotron] Step 2: Menilai teks tugas dengan OpenRouter2 Primary (nvidia/nemotron-3.5-super-vl:free)...`);
    const responseText = await this._executeTextWithFallback(
      apiKey,
      textPrompt,
      0.2,
      8192,
      (text) => {
        const parsed = safeParseAIJson(text);
        if (!parsed || typeof parsed !== "object") {
          throw new Error("Invalid JSON assessment structure");
        }
      }
    );

    const parsed = safeParseAIJson(responseText);
    console.log(`[OpenRouter Nemotron] Step 2 Selesai. Penilaian berhasil.`);
    return parsed as AIAssessmentResult;
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

    // TAHAP 1: EKSTRAKSI GAMBAR DENGAN OPENROUTER2 PRIMARY (nvidia/nemotron-3.5-super-vl:free)
    if (hasImages) {
      const visionPrompt = `Kamu adalah sistem AI ahli dalam Optical Character Recognition (OCR) dan analisis tata letak dokumen soal/tugas (cetak maupun tulisan tangan). Tugasmu adalah mengekstrak seluruh teks soal, pilihan ganda (A, B, C, D, E), pernyataan Benar/Salah, rumus matematika, tabel, serta mendeskripsikan secara ringkas gambar/diagram pendukung jika ada di dalam soal.

Patuhi aturan operasional ketat berikut:

1. PENANGANAN KOREKSI & CORETAN:
Identifikasi teks, huruf, atau angka yang dicoret (strikethrough) atau ditimpa oleh penulis. ABAIKAN bagian yang dicoret tersebut.

2. STRUKTUR & HIERARKI (MARKDOWN):
Pertahankan nomor urut soal (1, 2, 3, dst.), judul bagian (contoh: A. Pilihan Ganda, B. Benar/Salah, C. Essay), dan seluruh opsi jawaban (A, B, C, D, E) dengan rapi dan lengkap.

3. KELENGKAPAN SOAL & RUMUS:
Pastikan setiap angka, satuan, pecahan, akar, eksponen, atau data pada tabel soal tersalin secara akurat agar kunci jawaban dapat dihitung dengan tepat.

4. KELUARAN MURNI (TANPA BASA-BASI):
Hasilkan HANYA teks soal dan deskripsi visual relevan yang diekstrak. Dilarang menambahkan kalimat pembuka atau penutup.

5. WAJIB BAHASA INDONESIA:
PASTIKAN seluruh hasil ekstraksi teks ditulis menggunakan bahasa Indonesia sesuai naskah aslinya.`;
      
      extractedText = await this._extractVision(visionPrompt, imageAttachments as any[]);
    }

    // TAHAP 2: GENERATE KUNCI JAWABAN DENGAN MODEL PRIMARY nvidia/nemotron-3.5-super-vl:free
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

Output WAJIB berupa JSON MURNI (tanpa block code markdown, tanpa trailing comma) dengan struktur:
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

    console.log(`[OpenRouter Nemotron] Step 2: Generating answer key dengan OpenRouter2 Primary (nvidia/nemotron-3.5-super-vl:free)...`);
    const responseText = await this._executeTextWithFallback(
      apiKey,
      prompt,
      0.3,
      8192,
      (text) => {
        const parsed = safeParseAIJson(text);
        if (!parsed || typeof parsed.answerKey !== "string") {
          throw new Error("Invalid JSON structure for generated answerKey");
        }
      }
    );

    const parsed = safeParseAIJson(responseText);
    console.log(`[OpenRouter Nemotron] Step 2 Selesai. Kunci jawaban berhasil dibuat.`);
    return {
      answerKey: parsed.answerKey || "",
      parsedQuestions: Array.isArray(parsed.parsedQuestions) ? parsed.parsedQuestions : [],
    };
  }
}
