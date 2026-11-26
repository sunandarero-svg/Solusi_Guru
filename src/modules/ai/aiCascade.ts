import { groqRateLimiter } from "./rateLimiter";

export interface CascadeOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  responseJson?: boolean;
  logPrefix?: string;
}

function cleanCascadeOutput(raw: string, responseJson: boolean): string | null {
  if (!raw) return null;
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  if (cleaned.length <= 30) return null;

  if (responseJson) {
    const jsonCleaned = cleaned.replace(/```json/gi, "").replace(/```/g, "").trim();
    const hasJsonBounds =
      (jsonCleaned.includes("{") && jsonCleaned.includes("}")) ||
      (jsonCleaned.includes("[") && jsonCleaned.includes("]"));
    if (!hasJsonBounds) return null;
  }

  return cleaned;
}

/**
 * Menjalankan pembuatan teks AI dengan urutan kaskade:
 * 1. Primary: OpenRouter2 Free (https://openrouter.ai/api/v1) - nvidia/nemotron-3.5-super-vl:free (OPENROUTER_API_KEY2)
 * 2. Fallback 1: NVIDIA Direct API (https://integrate.api.nvidia.com/v1) - nvidia/nemotron-3.5-super-vl-120b-a12b & meta/muse-glimmer-30b
 * 3. Fallback 2: OpenRouter (Berbayar) - nvidia/nemotron-3.5-super-vl (OPENROUTER_API_KEY)
 * 4. Fallback 3: Groq (Qwen models)
 */
export async function callAICascade(options: CascadeOptions): Promise<string> {
  const {
    prompt,
    systemPrompt,
    maxTokens = 8192,
    temperature = 0.5,
    responseJson = false,
    logPrefix = "[AI Cascade]",
  } = options;

  const messages: any[] = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  // ==========================================
  // 1. PRIMARY: OpenRouter2 Free (Nemotron 3.5 Super VL Free)
  // ==========================================
  const openRouterKey2 = (process.env.OPENROUTER_API_KEY2 || process.env.OPENROUTER_API_KEY)?.trim().replace(/^["']|["']$/g, "");
  if (openRouterKey2) {
    const freeModel = process.env.OPENROUTER_MODEL_FREE || "nvidia/nemotron-3.5-super-vl:free";
    try {
      console.log(`${logPrefix} Step 1 (Primary - OpenRouter2 Free): Memanggil ${freeModel}...`);
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterKey2}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://solusi-guru.vercel.app",
          "X-Title": "Solusi Guru",
        },
        body: JSON.stringify({
          model: freeModel,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const cleaned = cleanCascadeOutput(data.choices?.[0]?.message?.content || "", responseJson);
        if (cleaned) {
          console.log(`${logPrefix} Berhasil menggunakan OpenRouter2 Primary (${freeModel})! Panjang respon: ${cleaned.length}`);
          return cleaned;
        }
        console.warn(`${logPrefix} OpenRouter2 Primary ${freeModel} mengembalikan respon tidak valid/kosong.`);
      } else {
        const errText = await res.text();
        console.warn(`${logPrefix} OpenRouter2 Primary ${freeModel} returned ${res.status}: ${errText}`);
      }
    } catch (or2Err: any) {
      console.warn(`${logPrefix} OpenRouter2 Primary exception:`, or2Err?.message || or2Err);
    }
  }

  // ==========================================
  // 2. FALLBACK 1: NVIDIA DIRECT API (Nemotron 120B & meta/muse-glimmer-30b)
  // ==========================================
  const nvidiaApiKey = (process.env.NVIDIA_API_KEY || process.env.NVIDIA_KEY)?.trim().replace(/^["']|["']$/g, "");
  if (nvidiaApiKey) {
    const nvidiaModels = [
      process.env.NVIDIA_MODEL || "nvidia/nemotron-3.5-super-vl-120b-a12b",
      "meta/muse-glimmer-30b"
    ];

    for (const nvModel of nvidiaModels) {
      try {
        console.log(`${logPrefix} Step 2 (Fallback 1 - NVIDIA): Memanggil ${nvModel}...`);
        const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${nvidiaApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: nvModel,
            messages,
            temperature,
            max_tokens: maxTokens,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const cleaned = cleanCascadeOutput(data.choices?.[0]?.message?.content || "", responseJson);
          if (cleaned) {
            console.log(`${logPrefix} Berhasil menggunakan NVIDIA Fallback 1 (${nvModel})! Panjang respon: ${cleaned.length}`);
            return cleaned;
          }
          console.warn(`${logPrefix} NVIDIA Fallback 1 ${nvModel} mengembalikan respon tidak valid/kosong.`);
        } else {
          const errText = await res.text();
          console.warn(`${logPrefix} NVIDIA Fallback 1 ${nvModel} returned ${res.status}: ${errText}`);
        }
      } catch (nvErr: any) {
        console.warn(`${logPrefix} NVIDIA Fallback 1 ${nvModel} exception:`, nvErr?.message || nvErr);
      }
    }
  }

  // ==========================================
  // 3. FALLBACK 2: OPENROUTER (NVIDIA Nemotron 3.5 Super VL Berbayar)
  // ==========================================
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim().replace(/^["']|["']$/g, "");
  if (openRouterKey) {
    const openRouterModel = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3.5-super-vl";
    try {
      console.log(`${logPrefix} Step 3 (Fallback 2 - OpenRouter Berbayar): Memanggil ${openRouterModel}...`);
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://solusi-guru.vercel.app",
          "X-Title": "Solusi Guru",
        },
        body: JSON.stringify({
          model: openRouterModel,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const cleaned = cleanCascadeOutput(data.choices?.[0]?.message?.content || "", responseJson);
        if (cleaned) {
          console.log(`${logPrefix} Berhasil menggunakan OpenRouter Fallback 2 (${openRouterModel})! Panjang respon: ${cleaned.length}`);
          return cleaned;
        }
        console.warn(`${logPrefix} OpenRouter Fallback 2 ${openRouterModel} mengembalikan respon tidak valid/kosong.`);
      } else {
        const errText = await res.text();
        console.warn(`${logPrefix} OpenRouter Fallback 2 ${openRouterModel} returned ${res.status}: ${errText}`);
      }
    } catch (orErr: any) {
      console.warn(`${logPrefix} OpenRouter Fallback 2 ${openRouterModel} exception:`, orErr?.message || orErr);
    }
  }

  // ==========================================
  // 4. FALLBACK 3: GROQ (Qwen Models)
  // ==========================================
  const groqKeysStr = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY;
  if (groqKeysStr) {
    try {
      const { key } = await groqRateLimiter.waitForKey(10000);
      const rawGroqModels = [
        process.env.GROQ_MODEL?.trim(),
        "qwen/qwen3.8-27b",
        "qwen/qwen-2.5-72b",
        "qwen/qwen-2.5-32b",
        "qwen/qwen3.6-27b",
      ].filter((m) => m && m.toLowerCase().includes("qwen")) as string[];
      const groqModels = rawGroqModels.length > 0 ? rawGroqModels : ["qwen/qwen3.8-27b", "qwen/qwen-2.5-72b"];

      for (const groqModel of groqModels) {
        try {
          console.log(`${logPrefix} Step 4 (Fallback 3 - Groq): Memanggil Groq (${groqModel})...`);
          const bodyPayload: any = {
            model: groqModel,
            messages,
            temperature,
            max_tokens: maxTokens,
          };

          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(bodyPayload),
          });

          if (!res.ok) {
            const errText = await res.text();
            if (res.status === 429) {
              groqRateLimiter.setCooldown(key, 60);
              console.warn(`${logPrefix} Groq key rate limited (429). Cooldown aktif.`);
              break;
            }
            console.warn(`${logPrefix} Groq model ${groqModel} gagal (${res.status}): ${errText}`);
            continue;
          }

          const data = await res.json();
          const cleaned = cleanCascadeOutput(data.choices?.[0]?.message?.content || "", responseJson);
          if (cleaned) {
            console.log(`${logPrefix} Berhasil menggunakan Groq (${groqModel})! Panjang respon: ${cleaned.length}`);
            return cleaned;
          }
          console.warn(`${logPrefix} Groq (${groqModel}) mengembalikan respon tidak valid/kosong.`);
        } catch (mErr: any) {
          console.warn(`${logPrefix} Groq ${groqModel} exception:`, mErr?.message || mErr);
        }
      }
    } catch (groqErr: any) {
      console.warn(`${logPrefix} Groq fallback 3 gagal:`, groqErr?.message || groqErr);
    }
  }

  throw new Error(`${logPrefix} Semua provider AI (OpenRouter2 Primary, NVIDIA Fallback 1, OpenRouter Fallback 2, Groq Fallback 3) gagal atau tidak tersedia.`);
}
