import { NextRequest, NextResponse } from "next/server";
import { groqRateLimiter } from "@/modules/ai/rateLimiter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

    // 1. PRIMARY: OpenRouter2 (nvidia/nemotron-3.5-super-vl:free)
    const openRouterApiKey2 = (process.env.OPENROUTER_API_KEY2 || process.env.OPENROUTER_API_KEY)?.trim().replace(/^["']|["']$/g, "");
    if (openRouterApiKey2) {
      try {
        const primaryModel = process.env.OPENROUTER_MODEL_FREE || "nvidia/nemotron-3.5-super-vl:free";
        console.log(`[Extract Text API] Memanggil model (Primary - OpenRouter2 Free): ${primaryModel}`);

        const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openRouterApiKey2}`,
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
            temperature: 0.0,
            max_tokens: 16384,
          }),
        });

        if (orResponse.ok) {
          const orData = await orResponse.json();
          extractedText = orData.choices?.[0]?.message?.content || "";
          if (extractedText.trim().length > 0) {
            console.log(`[Extract Text API] Ekstraksi berhasil menggunakan OpenRouter2 Primary: ${primaryModel}`);
          }
        } else {
          const errBody = await orResponse.text();
          console.warn(`[Extract Text API] OpenRouter2 Primary Error (${primaryModel}):`, errBody);
        }
      } catch (or2Err: any) {
        console.warn("[Extract Text API] OpenRouter2 Primary gagal, mencoba Fallback 1 NVIDIA Direct...", or2Err?.message);
      }
    } else {
      console.warn("[Extract Text API] OPENROUTER_API_KEY2 tidak ditemukan, melanjutkan ke Fallback 1 NVIDIA...");
    }

    // 2. FALLBACK 1: NVIDIA Direct API (Nemotron 120B & meta/muse-glimmer-30b)
    const nvidiaApiKey = (process.env.NVIDIA_API_KEY || process.env.NVIDIA_KEY)?.trim().replace(/^["']|["']$/g, "");
    if (!extractedText && nvidiaApiKey) {
      const nvidiaModels = [
        process.env.NVIDIA_MODEL || "nvidia/nemotron-3.5-super-vl-120b-a12b",
        "meta/muse-glimmer-30b"
      ];

      for (const nvModel of nvidiaModels) {
        try {
          console.log(`[Extract Text API] Memanggil model (Fallback 1 - NVIDIA): ${nvModel}`);

          const nvResponse = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${nvidiaApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: nvModel,
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
                  ]
                }
              ],
              temperature: 0.0,
              max_tokens: 16384,
            }),
          });

          if (nvResponse.ok) {
            const nvData = await nvResponse.json();
            extractedText = nvData.choices?.[0]?.message?.content || "";
            if (extractedText.trim().length > 0) {
              console.log(`[Extract Text API] Ekstraksi berhasil menggunakan NVIDIA Fallback 1: ${nvModel}`);
              break;
            }
          } else {
            const errBody = await nvResponse.text();
            console.warn(`[Extract Text API] NVIDIA Error (${nvModel}):`, errBody);
          }
        } catch (nvErr: any) {
          console.warn(`[Extract Text API] NVIDIA model ${nvModel} gagal:`, nvErr?.message);
        }
      }
    }

    // 3. FALLBACK 2: OpenRouter (nvidia/nemotron-3.5-super-vl - Berbayar)
    const openRouterApiKey = process.env.OPENROUTER_API_KEY?.trim().replace(/^["']|["']$/g, "");
    if (!extractedText && openRouterApiKey) {
      try {
        const orModel = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3.5-super-vl";
        console.log(`[Extract Text API] Memanggil model (Fallback 2 - OpenRouter Berbayar): ${orModel}`);

        const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openRouterApiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://solusi-guru.vercel.app",
            "X-Title": "Solusi Guru",
          },
          body: JSON.stringify({
            model: orModel,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
                ]
              }
            ],
            temperature: 0.0,
            max_tokens: 16384,
          }),
        });

        if (orResponse.ok) {
          const orData = await orResponse.json();
          extractedText = orData.choices?.[0]?.message?.content || "";
          if (extractedText.trim().length > 0) {
            console.log(`[Extract Text API] Ekstraksi berhasil menggunakan OpenRouter Fallback 2: ${orModel}`);
          }
        } else {
          const errBody = await orResponse.text();
          console.warn("[Extract Text API] OpenRouter Fallback 2 Error:", errBody);
        }
      } catch (orErr: any) {
        console.warn("[Extract Text API] OpenRouter Fallback 2 gagal, mencoba Fallback 3 Groq...", orErr?.message);
      }
    }

    // 4. FALLBACK 3: Groq (Qwen)
    if (!extractedText) {
      try {
        const { key } = await groqRateLimiter.waitForKey(30000);
        const tertiaryModel = "qwen/qwen3.8-27b";
        console.log(`[Extract Text API] Memanggil model (Fallback 3 - Groq): ${tertiaryModel}`);

        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: tertiaryModel,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
                ]
              }
            ],
            temperature: 0.0,
            max_tokens: 16384,
          }),
        });

        if (groqResponse.ok) {
          const groqData = await groqResponse.json();
          extractedText = groqData.choices?.[0]?.message?.content || "";
          if (extractedText.trim().length > 0) {
            console.log(`[Extract Text API] Ekstraksi berhasil menggunakan Groq Fallback 3: ${tertiaryModel}`);
          }
        } else {
          const errBody = await groqResponse.text();
          console.warn("[Extract Text API] Groq Fallback 3 Error:", errBody);
        }
      } catch (groqErr: any) {
        console.warn("[Extract Text API] Groq Fallback 3 gagal:", groqErr?.message);
      }
    }

    if (!extractedText) {
      throw new Error("Semua provider AI (OpenRouter2 Primary, NVIDIA Fallback 1, OpenRouter Fallback 2, Groq Fallback 3) gagal mengekstrak teks.");
    }

    return NextResponse.json({ text: extractedText });
  } catch (error: any) {
    console.error("[Extract Text API] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to extract text" }, { status: 500 });
  }
}

