import { GoogleGenAI } from "@google/genai";
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
 * Menjalankan pembuatan teks AI dengan urutan kaskade yang sama seperti penilaian tulisan tangan siswa:
 * 1. Primary: OpenRouter Nemotron 3.5 Super VL Free (nvidia/nemotron-3.5-super-vl:free)
 * 2. Secondary: Groq (Qwen models)
 * 3. Fallback 1: Gemini Multi-Model (2.0/1.5/3.8 Flash)
 * 4. Fallback 2: OpenRouter Gemma Free
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
  // 1. PRIMARY: OPENROUTER (NVIDIA Nemotron 3.5 Super VL)
  // ==========================================
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim().replace(/^["']|["']$/g, "");
  if (openRouterKey) {
    const primaryNemotron = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3.5-super-vl:free";
    try {
      console.log(`${logPrefix} Step 1 (Primary - OpenRouter): Memanggil ${primaryNemotron}...`);
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://solusi-guru.vercel.app",
          "X-Title": "Solusi Guru",
        },
        body: JSON.stringify({
          model: primaryNemotron,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content && content.trim().length > 30) {
          console.log(`${logPrefix} Berhasil menggunakan OpenRouter Primary (${primaryNemotron})! Panjang respon: ${content.length}`);
          return content;
        }
      } else {
        const errText = await res.text();
        console.warn(`${logPrefix} OpenRouter Primary ${primaryNemotron} returned ${res.status}: ${errText}`);
      }
    } catch (orErr: any) {
      console.warn(`${logPrefix} OpenRouter Primary ${primaryNemotron} exception:`, orErr?.message || orErr);
    }
  }

  // ==========================================
  // 2. SECONDARY: GROQ (Qwen Models)
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
          console.log(`${logPrefix} Step 2 (Secondary - Groq): Memanggil Groq (${groqModel})...`);
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
      console.warn(`${logPrefix} Groq secondary gagal:`, groqErr?.message || groqErr);
    }
  }

  // ==========================================
  // 3. FALLBACK 1: GEMINI Multi-Model
  // ==========================================
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const geminiModels = [
      process.env.GEMINI_MODEL?.trim(),
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-3.8-flash",
    ].filter(Boolean) as string[];

    for (const geminiModel of geminiModels) {
      try {
        console.log(`${logPrefix} Step 3 (Fallback 1 - Gemini): Memanggil Gemini (${geminiModel})...`);
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const config: any = {
          temperature,
        };
        if (responseJson) {
          config.responseMimeType = "application/json";
        }
        if (systemPrompt) {
          config.systemInstruction = systemPrompt;
        }

        const response = await ai.models.generateContent({
          model: geminiModel,
          contents: prompt,
          config,
        });

        const text = response?.text;
        if (text && text.trim().length > 30) {
          console.log(`${logPrefix} Berhasil menggunakan Gemini (${geminiModel})! Panjang respon: ${text.length}`);
          return text;
        }
      } catch (geminiErr: any) {
        console.warn(`${logPrefix} Gemini ${geminiModel} gagal (503/429/404):`, geminiErr?.message || geminiErr);
      }
    }
  }

  // ==========================================
  // 4. FALLBACK 2: OPENROUTER Gemma Models
  // ==========================================
  if (openRouterKey) {
    const fallbackOpenRouterModels = [
      "google/gemma-4-31b-it:free",
      "google/gemma-4-26b-a4b-it:free",
    ];

    for (const orModel of fallbackOpenRouterModels) {
      try {
        console.log(`${logPrefix} Step 4 (Fallback 2 - OpenRouter): Memanggil OpenRouter (${orModel})...`);
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://solusi-guru.vercel.app",
            "X-Title": "Solusi Guru",
          },
          body: JSON.stringify({
            model: orModel,
            messages,
            temperature,
            max_tokens: maxTokens,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.warn(`${logPrefix} OpenRouter ${orModel} returned ${res.status}: ${errText}`);
          continue;
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content && content.trim().length > 30) {
          console.log(`${logPrefix} Berhasil menggunakan OpenRouter (${orModel})! Panjang respon: ${content.length}`);
          return content;
        }
      } catch (orErr: any) {
        console.warn(`${logPrefix} OpenRouter ${orModel} exception:`, orErr?.message || orErr);
      }
    }
  }

  throw new Error(`${logPrefix} Semua provider AI (OpenRouter Primary, Groq Secondary, Gemini, OpenRouter Gemma) gagal atau tidak tersedia.`);
}
