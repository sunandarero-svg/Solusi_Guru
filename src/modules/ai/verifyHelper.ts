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
      "qwen/qwen3.6-27b",
      "qwen/qwen3.8-27b",
      "meta-llama/llama-4-scout-17b-16e-instruct",
      "llama-4-scout-17b-16e-instruct"
    ]; // Fallback defaults: Qwen3 (free tier multimodal) + Llama 4 (paid tier)
  }
  
  const data = await res.json();
  const availableModels = data.data.map((m: any) => m.id);
  console.log(`[Groq] Available models for key prefix ${apiKey.substring(0, 8)}:`, availableModels.join(", "));
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

/**
 * Check if a model supports multimodal (image) input.
 * Covers: vision models, Llama 4 Scout/Maverick, Qwen3 VL series
 */
function isMultimodalModel(modelId: string): boolean {
  const lower = modelId.toLowerCase();
  return (
    lower.includes("vision") ||
    lower.includes("llava") ||
    lower.includes("pixtral") ||
    lower.includes("scout") ||
    lower.includes("maverick") ||
    lower.includes("qwen3") ||
    lower.includes("qwen-vl")
  );
}

export async function verifyPageReadability(pages: any[]): Promise<VerifyResult> {
  const prompt = `Anda adalah AI pemeriksa kelayakan foto tugas sekolah. Anda menerima ${pages.length} halaman foto sekaligus. Tugas Anda:
1. Baca SELURUH teks di setiap halaman dari awal hingga akhir.
2. Cek apakah tulisan tangan di SEMUA halaman dapat dibaca, tidak terpotong, dan pencahayaannya memadai.
3. Berikan skor keterbacaan keseluruhan (readabilityScore) dari 0-100.

ATURAN 'feasible':
- Jika Anda BISA MEMBACA seluruh tulisan di semua halaman, set 'feasible' ke TRUE.
- HANYA set 'feasible' ke FALSE jika ada halaman yang BENAR-BENAR TIDAK TERBACA (buram total, gelap, terpotong parah).

ATURAN 'reason' (feedback untuk siswa):
- Berikan feedback SINGKAT (maksimal 2-3 kalimat) dengan bahasa yang sangat ramah, hangat, dan bersahabat (cocok untuk anak usia 10 tahun / kelas 4-5 SD).
- SELALU awali dengan apresiasi positif untuk siswa (contoh: "Wah, tulisanmu sudah rapi dan mudah dibaca lho, hebat!").
- HANYA koreksi kata yang BENAR-BENAR SALAH ejaan menurut KBBI. JANGAN PERNAH mengoreksi kata yang sudah benar. Jika siswa menulis kata dengan ejaan yang sudah sesuai KBBI, JANGAN sebutkan kata itu sebagai koreksi.
- Jika ada hal yang perlu diperbaiki (seperti salah ejaan atau kurang rapi), sampaikan dengan cara yang menyemangati (contoh: "Supaya makin keren, kata 'apotik' bisa kamu perbaiki jadi 'apotek' ya.").
- Jika tidak ada kesalahan ejaan, cukup berikan apresiasi singkat saja, JANGAN memaksakan koreksi.

WAJIB balas dalam format JSON murni (tanpa markdown) seperti ini:
{"feasible": true/false, "readabilityScore": 0-100, "reason": "feedback singkat untuk siswa"}`;

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
  
  // Filter for multimodal models that can process images
  const multimodalModels = availableModels.filter(isMultimodalModel);
  
  console.log(`[Verify-Groq] Detected multimodal models: ${multimodalModels.length > 0 ? multimodalModels.join(", ") : "NONE"}`);

  // Use detected multimodal models, or fallback to known free-tier multimodal models
  let modelsToTry = multimodalModels.length > 0 ? multimodalModels : [
    "qwen/qwen3.6-27b",
    "qwen/qwen3.8-27b",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "llama-4-scout-17b-16e-instruct"
  ];
  
  const customModel = process.env.GROQ_MODEL?.trim();
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
      max_tokens: 2048,
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
