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
 * 1. Primary: Groq (Kecepatan tinggi, batas kuota fleksibel)
 * 2. Fallback 1: Gemini (gemini-3.8-flash)
 * 3. Fallback 2: OpenRouter (Llama 4 Maverick, Qwen, dll.)
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
  // 1. PRIMARY: GROQ (Sama seperti penilaian tugas siswa)
  // ==========================================
  const groqKeysStr = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY;
  if (groqKeysStr) {
    try {
      const { key } = await groqRateLimiter.waitForKey(10000);
      const groqModels = [
        process.env.GROQ_MODEL?.trim(),
        "llama-3.3-70b-versatile",
        "qwen/qwen3.8-27b",
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "llama-3.1-8b-instant",
      ].filter(Boolean) as string[];

      for (const groqModel of groqModels) {
        try {
          console.log(`${logPrefix} Step 1 (Primary): Memanggil Groq (${groqModel})...`);
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
      console.warn(`${logPrefix} Groq primary gagal:`, groqErr?.message || groqErr);
    }
  }

  // ==========================================
  // 2. FALLBACK 1: GEMINI (gemini-3.8-flash)
  // ==========================================
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const geminiModels = [
      process.env.GEMINI_MODEL?.trim(),
      "gemini-3.8-flash",
    ].filter(Boolean) as string[];

    for (const geminiModel of geminiModels) {
      try {
        console.log(`${logPrefix} Step 2 (Fallback 1): Memanggil Gemini (${geminiModel})...`);
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const config: any = {
          temperature,
        };
        if (responseJson) {
          config.responseMimeType = "application/json";
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
  // 3. FALLBACK 2: OPENROUTER
  // ==========================================
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim().replace(/^["']|["']$/g, "");
  if (openRouterKey) {
    const openRouterModels = [
      "meta-llama/llama-4-maverick",
      "meta-llama/llama-3.3-70b-instruct",
      "qwen/qwen3.8-27b:free",
      "google/gemma-4-31b-it:free",
      "meta-llama/llama-3.1-8b-instruct:free",
    ];

    for (const orModel of openRouterModels) {
      try {
        console.log(`${logPrefix} Step 3 (Fallback 2): Memanggil OpenRouter (${orModel})...`);
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

  throw new Error(`${logPrefix} Semua provider AI (Groq, Gemini, OpenRouter) gagal atau tidak tersedia.`);
}
