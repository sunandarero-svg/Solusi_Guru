import { NextRequest, NextResponse } from "next/server";
import { groqRateLimiter } from "@/modules/ai/rateLimiter";
import { openRouterQueue } from "@/modules/ai/openRouterQueue";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenAI } from "@google/genai";
import { compressImageForOCR } from "@/modules/ai/compressImageForOCR";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { base64Image } = await req.json();
    if (!base64Image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const prompt = `Kamu adalah sistem AI ahli dalam Optical Character Recognition (OCR) dan analisis tata letak dokumen, khususnya untuk membaca dan mendigitalkan catatan tulisan tangan. Tugasmu adalah mengekstrak teks dari gambar yang diberikan secara akurat, rapi, dan terstruktur.

Patuhi aturan operasional ketat berikut:

1. PENANGANAN KOREKSI & CORETAN (SANGAT PENTING):
Identifikasi teks, huruf, atau angka yang dicoret (strikethrough), dicoret tebal, atau ditimpa oleh penulis. ABAIKAN bagian tersebut sepenuhnya. JANGAN transkripsikan teks yang sudah dibatalkan. Hanya ekstrak teks final yang dipertahankan/dimaksudkan oleh penulis.

2. STRUKTUR & HIERARKI (MARKDOWN):
Pertahankan hierarki dokumen asli. Gunakan format Markdown untuk merapikan hasil:

Gunakan huruf tebal (**teks**) untuk judul blok atau kategori (contoh: A. Pilihan Ganda, B. Isian).

Gunakan penomoran (1, 2, 3) persis seperti urutan di dokumen.

Jika ada teks yang diatur dalam dua kolom (seperti format nomor 1-5 di kiri dan 6-10 di kanan), susun agar tetap sejajar menggunakan spasi atau tabulasi yang rapi.

3. TRANSKRIPSI VERBATIM (APA ADANYA):
Ekstrak teks persis seperti yang tertulis, termasuk variasi ejaan atau singkatan yang digunakan penulis (misalnya, jika tertulis "documen" alih-alih "document", atau "Pilgan" alih-alih "Pilihan Ganda", pertahankan ejaan aslinya). Jangan melakukan koreksi tata bahasa pada teks yang valid.

4. KELUARAN MURNI (TANPA BASA-BASI):
Hasilkan HANYA teks yang diekstrak. Dilarang keras menambahkan kalimat pembuka (seperti 'Berikut adalah hasil ekstraksinya:'), penjelasan, atau kalimat penutup. Mulai dari baris pertama dokumen dan akhiri di baris terakhir.

5. WAJIB BAHASA INDONESIA PADA UMUMNYA:
PASTIKAN seluruh hasil ekstraksi teks ditulis menggunakan bahasa Indonesia pada umumnya. Terlepas dari setelan bahasa pada modelmu, JANGAN PERNAH menerjemahkan teks tersebut ke bahasa Inggris atau bahasa lain. Tuliskan persis sebagaimana makna aslinya dalam bahasa Indonesia.`;
    
    const rawBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    const mimeMatch = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    const rawMimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

    // Kompres gambar sebelum kirim ke AI untuk hemat token
    const { compressedBase64: base64Data, compressedMimeType: mimeType, savings } = 
      await compressImageForOCR(rawBase64, rawMimeType);
    console.log(`[Extract Text API] Kompresi gambar: ${savings}`);

    let extractedText = "";

    // 1. PRIMARY: OpenRouter NVIDIA Nemotron 3.5 Super VL Free
    const openRouterApiKey = process.env.OPENROUTER_API_KEY?.trim().replace(/^["']|["']$/g, "");
    if (openRouterApiKey) {
      try {
        const primaryModel = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3.5-super-vl:free";
        console.log(`[Extract Text API] Memanggil model (Primary - OpenRouter Free): ${primaryModel}`);

        const orResponse = await openRouterQueue.executeRequest(primaryModel, () =>
          fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${openRouterApiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://solusi-guru.vercel.app",
              "X-Title": "Solusi Guru",
            },
            body: JSON.stringify({
              model: primaryModel,
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
                  ]
                }
              ],
              temperature: 0.1,
              max_tokens: 2048,
            }),
          })
        );

        if (orResponse.ok) {
          const orData = await orResponse.json();
          extractedText = orData.choices?.[0]?.message?.content || "";
          if (extractedText.trim().length > 0) {
            console.log(`[Extract Text API] Ekstraksi berhasil menggunakan OpenRouter Primary: ${primaryModel}`);
          }
        } else {
          const errBody = await orResponse.text();
          console.warn("[Extract Text API] OpenRouter Primary Error:", errBody);
        }
      } catch (orErr: any) {
        console.warn("[Extract Text API] OpenRouter Primary (Nemotron Free) gagal, mencoba Alternatif Kedua...", orErr?.message);
      }

      // 1b. ALTERNATIF KEDUA: OpenRouter NVIDIA Nemotron 3.5 Super VL (Non-free)
      if (!extractedText) {
        try {
          const altModel = "nvidia/nemotron-3.5-super-vl";
          console.log(`[Extract Text API] Memanggil model (Alternatif Kedua - OpenRouter): ${altModel}`);

          const orResponse = await openRouterQueue.executeRequest(altModel, () =>
            fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${openRouterApiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://solusi-guru.vercel.app",
                "X-Title": "Solusi Guru",
              },
              body: JSON.stringify({
                model: altModel,
                messages: [
                  {
                    role: "user",
                    content: [
                      { type: "text", text: prompt },
                      { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
                    ]
                  }
                ],
                temperature: 0.1,
                max_tokens: 2048,
              }),
            })
          );

          if (orResponse.ok) {
            const orData = await orResponse.json();
            extractedText = orData.choices?.[0]?.message?.content || "";
            if (extractedText.trim().length > 0) {
              console.log(`[Extract Text API] Ekstraksi berhasil menggunakan OpenRouter Alternatif Kedua: ${altModel}`);
            }
          } else {
            const errBody = await orResponse.text();
            console.warn("[Extract Text API] OpenRouter Alternatif Kedua Error:", errBody);
          }
        } catch (orAltErr: any) {
          console.warn("[Extract Text API] OpenRouter Alternatif Kedua (Nemotron non-free) gagal, mencoba Secondary Groq...", orAltErr?.message);
        }
      }
    }

    // 2. SECONDARY: Groq (Qwen)
    if (!extractedText) {
      try {
        const { key } = await groqRateLimiter.waitForKey(30000);
        const secondaryModel = "qwen/qwen3.8-27b";
        console.log(`[Extract Text API] Memanggil model (Secondary - Groq): ${secondaryModel}`);

        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: secondaryModel,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
                ]
              }
            ],
            temperature: 0.1,
            max_tokens: 2048,
          }),
        });

        if (groqResponse.ok) {
          const groqData = await groqResponse.json();
          extractedText = groqData.choices?.[0]?.message?.content || "";
          if (extractedText.trim().length > 0) {
            console.log(`[Extract Text API] Ekstraksi berhasil menggunakan model Groq Qwen: ${secondaryModel}`);
          }
        } else {
          const errBody = await groqResponse.text();
          console.warn("[Extract Text API] Groq Secondary Error:", errBody);
        }
      } catch (groqError: any) {
        console.warn("[Extract Text API] Groq gagal, mencoba fallback ke Gemini...", groqError?.message || groqError);
      }
    }

    // 3. FALLBACK 1: Gemini Multi-Model Chain (2.0 Flash, 1.5 Flash, 3.8 Flash)
    if (!extractedText && process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const geminiCandidateModels = [
          process.env.GEMINI_MODEL?.trim(),
          "gemini-2.0-flash",
          "gemini-1.5-flash",
          "gemini-3.8-flash",
        ].filter(Boolean) as string[];

        for (const gModel of geminiCandidateModels) {
          try {
            console.log(`[Extract Text API] Memanggil model (Fallback 1 - Gemini): ${gModel}`);
            const response = await ai.models.generateContent({
              model: gModel,
              contents: [
                prompt,
                {
                  inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                  }
                }
              ],
              config: {
                temperature: 0.1,
              }
            });

            extractedText = response.text || "";
            if (extractedText.trim().length > 0) {
              console.log(`[Extract Text API] Ekstraksi berhasil menggunakan model Gemini: ${gModel}`);
              break;
            }
          } catch (gErr: any) {
            console.warn(`[Extract Text API] Gemini ${gModel} gagal (${gErr?.message || gErr}). Mencoba model berikutnya...`);
          }
        }
      } catch (geminiError: any) {
        console.warn("[Extract Text API] Gemini multi-model gagal, mencoba fallback OpenRouter Gemma...", geminiError?.message || geminiError);
      }
    }

    // 4. FALLBACK 2: OpenRouter Gemma Models (Gemma 4 31B & 26B)
    if (!extractedText && openRouterApiKey) {
      const fallbackOrModels = [
        "google/gemma-4-31b-it:free",
        "google/gemma-4-26b-a4b-it:free",
      ];

      for (const modelId of fallbackOrModels) {
        try {
          console.log(`[Extract Text API] Memanggil model (Fallback 2 - OpenRouter): ${modelId}`);

          const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${openRouterApiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://solusi-guru.vercel.app",
              "X-Title": "Solusi Guru",
            },
            body: JSON.stringify({
              model: modelId,
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
                  ]
                }
              ],
              temperature: 0.1,
              max_tokens: 2048,
            }),
          });

          if (orResponse.ok) {
            const orData = await orResponse.json();
            extractedText = orData.choices?.[0]?.message?.content || "";
            if (extractedText.trim().length > 0) {
              console.log(`[Extract Text API] Ekstraksi berhasil menggunakan OpenRouter Fallback: ${modelId}`);
              break;
            }
          }
        } catch (modelErr: any) {
          console.warn(`[Extract Text API] Exception on model ${modelId}:`, modelErr?.message || modelErr);
        }
      }
    }

    if (!extractedText) {
      throw new Error("Semua provider AI (OpenRouter Primary, Groq Secondary, Gemini Fallback) gagal mengekstrak teks.");
    }

    return NextResponse.json({ text: extractedText });
  } catch (error: any) {
    console.error("[Extract Text API] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to extract text" }, { status: 500 });
  }
}

