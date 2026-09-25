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
      "qwen/qwen3.8-27b",
      "qwen/qwen3.6-27b"
    ]; // Fallback defaults: Llama 4 (higher TPM) + Qwen3 (lower TPM fallback)
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
1. Cek apakah tulisan tangan di SEMUA halaman dapat dibaca, tidak terpotong, dan pencahayaannya memadai.
2. Berikan skor keterbacaan keseluruhan (readabilityScore) dari 0-100.

ATURAN 'feasible':
- Jika Anda BISA MEMBACA seluruh tulisan di semua halaman, set 'feasible' ke TRUE.
- HANYA set 'feasible' ke FALSE jika ada halaman yang BENAR-BENAR TIDAK TERBACA (buram total, gelap, terpotong parah).

ATURAN 'reason' (feedback untuk siswa):
- Jika feasible = TRUE (tugas bisa dibaca): Berikan pesan SINGKAT (1 kalimat) yang menyatakan tugas bisa dibaca dengan baik dan layak dikumpul. JANGAN berikan komentar apapun tentang ejaan atau typo. (Contoh: "Wah, tulisanmu sudah terlihat jelas dan bisa dibaca, silakan kumpulkan ya!")
- Jika feasible = FALSE (tugas tidak terbaca): Beri tahu siswa bagian mana yang buram/terpotong dan minta mereka memfoto ulang dengan bahasa yang ramah.

WAJIB balas dalam format JSON murni (tanpa markdown) seperti ini:
{"feasible": true/false, "readabilityScore": 0-100, "reason": "pesan singkat untuk siswa"}`;

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

  let lastError: any = null;
  const maxRetries = 4;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let apiKey = "";
    try {
      const { key, index: usedIndex } = await groqRateLimiter.waitForKey(20000);
      apiKey = key;
      const totalKeys = groqRateLimiter.getKeys().length;

      const availableModels = await getDynamicModels(apiKey);
      const multimodalModels = availableModels.filter(isMultimodalModel);
      
      let modelsToTry = multimodalModels.length > 0 ? multimodalModels : [
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "meta-llama/llama-4-maverick-17b-128e-instruct",
        "qwen/qwen3.8-27b",
        "qwen/qwen3.6-27b"
      ];
      
      const customModel = process.env.GROQ_MODEL?.trim();
      if (customModel) {
        modelsToTry = [customModel, ...modelsToTry];
      }

      let modelSuccess = false;
      let modelResult: VerifyResult | null = null;

      for (const modelName of modelsToTry) {
        try {
          console.log(`[Verify-Groq] Attempt ${attempt + 1}: Trying model ${modelName} (Key Index: ${usedIndex + 1}/${totalKeys})`);
          modelResult = await runGroqVerify(apiKey, modelName, prompt, imageBuffers);
          console.log(`[Verify-Groq] Success with model: ${modelName}`);
          modelSuccess = true;
          break;
        } catch (err: any) {
          lastError = err;
          console.warn(`[Verify-Groq] Error with model ${modelName}:`, err?.message || err);
          if (err?.message?.includes("429") || err?.status === 429) {
            continue; // try next model in the same key
          } else {
            throw err; // throw to trigger outer retry block (fetch new key)
          }
        }
      }

      if (modelSuccess && modelResult) return modelResult;
      throw lastError || new Error("All models failed on this key.");

    } catch (err: any) {
      lastError = err;
      if (err?.message?.includes("429") || err?.status === 429) {
        if (apiKey) groqRateLimiter.setCooldown(apiKey, 60);
      }
      if (err?.message?.includes("404") || err?.message?.includes("400")) {
         if (apiKey) delete modelCache[apiKey];
      }
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
  }

  throw lastError || new Error("All dynamically fetched Groq API models failed after rotating keys.");
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
