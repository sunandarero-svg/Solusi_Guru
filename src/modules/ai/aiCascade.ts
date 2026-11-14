import { groqRateLimiter } from "./rateLimiter";

export interface CascadeOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  responseJson?: boolean;
  logPrefix?: string;
}

/**
 * Menjalankan pembuatan teks AI dengan urutan kaskade:
 * 1. Primary: NVIDIA Direct API (https://integrate.api.nvidia.com/v1) - nvidia/nemotron-3.5-super-vl-120b-a12b
 * 2. Fallback 1: OpenRouter (Berbayar) - nvidia/nemotron-3.5-super-vl
 * 3. Fallback 2: Groq (Qwen models)
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
  // 1. PRIMARY: NVIDIA DIRECT API (Nemotron 3.5 Super VL 120B)
  // ==========================================
  const nvidiaApiKey = (process.env.NVIDIA_API_KEY || process.env.NVIDIA_KEY)?.trim().replace(/^["']|["']$/g, "");
  if (nvidiaApiKey) {
    const nvidiaModel = process.env.NVIDIA_MODEL || "nvidia/nemotron-3.5-super-vl-120b-a12b";
    try {
      console.log(`${logPrefix} Step 1 (Primary - NVIDIA): Memanggil ${nvidiaModel}...`);
      const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${nvidiaApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: nvidiaModel,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content && content.trim().length > 30) {
          console.log(`${logPrefix} Berhasil menggunakan NVIDIA Primary (${nvidiaModel})! Panjang respon: ${content.length}`);
          return content;
        }
      } else {
        const errText = await res.text();
        console.warn(`${logPrefix} NVIDIA Primary ${nvidiaModel} returned ${res.status}: ${errText}`);
      }
    } catch (nvErr: any) {
      console.warn(`${logPrefix} NVIDIA Primary ${nvidiaModel} exception:`, nvErr?.message || nvErr);
    }
  }

  // ==========================================
  // 2. FALLBACK 1: OPENROUTER (NVIDIA Nemotron 3.5 Super VL Berbayar)
  // ==========================================
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim().replace(/^["']|["']$/g, "");
  if (openRouterKey) {
    const openRouterModel = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3.5-super-vl";
    try {
      console.log(`${logPrefix} Step 2 (Fallback 1 - OpenRouter): Memanggil ${openRouterModel}...`);
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
        const content = data.choices?.[0]?.message?.content;
        if (content && content.trim().length > 30) {
          console.log(`${logPrefix} Berhasil menggunakan OpenRouter Fallback 1 (${openRouterModel})! Panjang respon: ${content.length}`);
          return content;
        }
      } else {
        const errText = await res.text();
        console.warn(`${logPrefix} OpenRouter Fallback 1 ${openRouterModel} returned ${res.status}: ${errText}`);
      }
    } catch (orErr: any) {
      console.warn(`${logPrefix} OpenRouter Fallback 1 ${openRouterModel} exception:`, orErr?.message || orErr);
    }
  }

  // ==========================================
  // 3. FALLBACK 2: GROQ (Qwen Models)
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
          console.log(`${logPrefix} Step 3 (Fallback 2 - Groq): Memanggil Groq (${groqModel})...`);
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
          const content = data.choices?.[0]?.message?.content;
          if (content && content.trim().length > 30) {
            console.log(`${logPrefix} Berhasil menggunakan Groq (${groqModel})! Panjang respon: ${content.length}`);
            return content;
          }
        } catch (mErr: any) {
          console.warn(`${logPrefix} Groq ${groqModel} exception:`, mErr?.message || mErr);
        }
      }
    } catch (groqErr: any) {
      console.warn(`${logPrefix} Groq fallback 2 gagal:`, groqErr?.message || groqErr);
    }
  }

  throw new Error(`${logPrefix} Semua provider AI (NVIDIA Primary, OpenRouter Fallback 1, Groq Fallback 2) gagal atau tidak tersedia.`);
}
