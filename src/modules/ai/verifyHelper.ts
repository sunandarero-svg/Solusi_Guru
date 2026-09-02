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
      "llama-4-scout-17b-16e-instruct",
      "llama-4-maverick-17b-128e-instruct",
      "llama-3.2-11b-vision-instruct",
      "llama-3.2-90b-vision-instruct",
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant"
    ]; // Ultimate fallback defaults if fetch fails
  }
  
  const data = await res.json();
  const availableModels = data.data.map((m: any) => m.id);
  modelCache[apiKey] = availableModels;
  return availableModels;
}

export interface VerifyResult {
  feasible: boolean;
  readabilityScore: number;
  reason: string;
}

function parseKeys(envValue?: string): string[] {
  if (!envValue) return [];
  return envValue
    .replace(/[\r\n]/g, "")
    .split(",")
    .map((k) => k.replace(/['"` ]/g, "").trim())
    .filter((k) => k.length > 5);
}

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

  const keys = parseKeys(process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY);
  if (keys.length === 0) {
    throw new Error("No valid Groq API keys configured.");
  }

  // Select key using round robin
  const apiKey = keys[currentKeyIndex % keys.length];
  const usedIndex = currentKeyIndex % keys.length;
  // Increment and wrap around
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;

  const availableModels = await getDynamicModels(apiKey);
  
  // Sort models: Vision models first, then general Llama models
  const visionModels = availableModels.filter(m => m.toLowerCase().includes("vision") || m.toLowerCase().includes("llava") || m.toLowerCase().includes("pixtral"));
  const textModels = availableModels.filter(m => !visionModels.includes(m));
  
  // Add env custom model to front if provided and valid
  const customModel = process.env.GROQ_MODEL?.trim();
  let modelsToTry = [...visionModels, ...textModels];
  
  if (customModel) {
    modelsToTry = [customModel, ...modelsToTry];
  }

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[Verify-Groq] Trying model ${modelName} with key prefix ${apiKey.substring(0, 8)}... (Key Index: ${usedIndex + 1}/${keys.length})`);
      const result = await runGroqVerify(apiKey, modelName, prompt, imageBuffers);
      console.log(`[Verify-Groq] Success with model: ${modelName}`);
      return result;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Verify-Groq] Failed with model ${modelName}:`, err?.message || err);
      // If unauthorized/not found, clear cache so we fetch fresh next time
      if (err?.message?.includes("404") || err?.message?.includes("400")) {
        delete modelCache[apiKey];
      }
    }
  }

  throw lastError || new Error("All dynamically fetched Groq API models failed for the selected key.");
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
      messages: [
        {
          role: "user",
          content: contentParts,
        },
      ],
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
