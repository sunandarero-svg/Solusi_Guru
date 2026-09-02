import { readFile } from "fs/promises";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GROQ_MODELS = [
  "llama-3.2-11b-vision-preview",
  "llama-3.2-90b-vision-preview",
];

const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
];

export interface VerifyResult {
  feasible: boolean;
  readabilityScore: number;
  reason: string;
}

/**
  * Clean and parse comma-separated or single API key string
  */
function parseKeys(envValue?: string): string[] {
  if (!envValue) return [];
  return envValue
    .replace(/[\r\n]/g, "")
    .split(",")
    .map((k) => k.replace(/['"` ]/g, "").trim())
    .filter((k) => k.length > 5);
}

/**
 * Verify page readability using Groq primary (5 keys) and Gemini fallback (1 key)
 */
export async function verifyPageReadability(pages: any[]): Promise<VerifyResult> {
  const prompt = `Anda adalah AI pemeriksa kelayakan foto tugas sekolah. Anda menerima ${pages.length} halaman foto sekaligus. Tugas Anda:
1. Pastikan Anda membaca SELURUH teks di setiap halaman dari awal hingga akhir.
2. Mengecek apakah tulisan tangan di SEMUA halaman dapat dibaca jelas, tidak terpotong, dan pencahayaannya baik.
3. Memberikan skor keterbacaan keseluruhan (readabilityScore) dari 0-100.
4. Hitung kesalahan (typo, salah tulis, kata buram, kata terpotong) di semua halaman. DILARANG KERAS menebak kata yang buram.
5. ATURAN KETAT: Jika terdapat >= 5 kesalahan SECARA KESELURUHAN atau JIKA ADA SATU SAJA HALAMAN YANG BURAM/TIDAK TERBACA, Anda WAJIB memberikan skor di bawah 85 (misal 84 atau lebih rendah) dan set 'feasible' ke false. Berikan rekomendasi spesifik (misal: "Tulisan di Halaman 2 paragraf 2 buram, mohon tulis ulang/foto kembali halaman 2").
6. Jika semua halaman jelas dan kesalahan total < 5, berikan skor 85 atau lebih tinggi dan set 'feasible' ke true. Tugas ini layak diperiksa.

WAJIB balas dalam format JSON murni (tanpa markdown) seperti ini:
{"feasible": true/false, "readabilityScore": 0-100, "reason": "alasan spesifik"}`;

  // Prepare images buffer and mimeTypes
  const imageBuffers: { buffer: Buffer; mimeType: string }[] = [];
  for (const page of pages) {
    let buffer: Buffer;
    if (page.storageKey.startsWith("http")) {
      const res = await fetch(page.storageKey);
      const arrayBuffer = await res.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      const filePath = path.join(process.cwd(), "public", page.storageKey.replace(/^\//, ""));
      buffer = await readFile(filePath);
    }
    imageBuffers.push({
      buffer,
      mimeType: page.mimeType || "image/jpeg",
    });
  }

  // 1. Try Groq Primary (up to 5 keys)
  const groqKeys = parseKeys(process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY);
  if (groqKeys.length > 0) {
    const shuffledGroqKeys = [...groqKeys].sort(() => Math.random() - 0.5);
    for (const apiKey of shuffledGroqKeys) {
      for (const modelName of GROQ_MODELS) {
        try {
          console.log(`[Verify-Groq] Trying model ${modelName} with key prefix ${apiKey.substring(0, 8)}...`);
          const result = await runGroqVerify(apiKey, modelName, prompt, imageBuffers);
          console.log(`[Verify-Groq] Success with model: ${modelName}`);
          return result;
        } catch (err: any) {
          console.warn(`[Verify-Groq] Failed with model ${modelName}:`, err?.message || err);
        }
      }
    }
  }

  // 2. Fallback to Gemini Secondary
  console.log("[Verify] Groq unavailable/failed. Falling back to Gemini...");
  const geminiKeys = parseKeys(process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY);
  if (geminiKeys.length === 0) {
    throw new Error("No Groq or Gemini API keys configured.");
  }

  const selectedGeminiKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
  const genAI = new GoogleGenerativeAI(selectedGeminiKey);

  let lastError: any = null;
  for (const modelName of GEMINI_MODELS) {
    try {
      console.log(`[Verify-Gemini] Trying model ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const imageParts = imageBuffers.map((img) => ({
        inlineData: {
          data: img.buffer.toString("base64"),
          mimeType: img.mimeType,
        },
      }));
      const result = await model.generateContent([prompt, ...imageParts]);
      const text = result.response.text();
      const cleanText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      console.log(`[Verify-Gemini] Success with model: ${modelName}`);
      return JSON.parse(cleanText) as VerifyResult;
    } catch (err: any) {
      lastError = err;
      const errorMsg = err?.message || String(err);
      if (errorMsg.includes("not found") || errorMsg.includes("not supported") || errorMsg.includes("404")) {
        console.warn(`[Verify-Gemini] Model ${modelName} not available, trying next...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error("All AI verification providers failed.");
}

async function runGroqVerify(
  apiKey: string,
  modelName: string,
  prompt: string,
  imageBuffers: { buffer: Buffer; mimeType: string }[]
): Promise<VerifyResult> {
  const contentParts: any[] = [{ type: "text", text: prompt }];

  for (const img of imageBuffers) {
    contentParts.push({
      type: "image_url",
      image_url: {
        url: `data:${img.mimeType};base64,${img.buffer.toString("base64")}`,
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
      messages: [{ role: "user", content: contentParts }],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API returned ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq API returned empty response");

  const cleanText = content.replace(/```json/gi, "").replace(/```/g, "").trim();
  return JSON.parse(cleanText) as VerifyResult;
}
