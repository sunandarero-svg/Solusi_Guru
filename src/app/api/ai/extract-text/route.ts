import { NextRequest, NextResponse } from "next/server";
import { groqRateLimiter } from "@/modules/ai/rateLimiter";
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

    // 1. PRIMARY: Groq (Qwen)
    try {
      const { key } = await groqRateLimiter.waitForKey(30000);
      const primaryModel = "qwen/qwen3.8-27b";
      console.log(`[Extract Text API] Memanggil model (Primary - Groq): ${primaryModel}`);

      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
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
      });

      if (!groqResponse.ok) {
        const errBody = await groqResponse.text();
        console.error("[Extract Text API] Groq Primary Error:", errBody);
        throw new Error(`Groq API returned ${groqResponse.status}`);
      }

      const groqData = await groqResponse.json();
      extractedText = groqData.choices?.[0]?.message?.content || "";
      if (!extractedText) throw new Error("Empty response from Groq");

      console.log(`[Extract Text API] Ekstraksi berhasil menggunakan model Groq Qwen: ${primaryModel}`);
    } catch (groqError: any) {
      console.warn("[Extract Text API] Groq gagal, mencoba fallback ke Gemini 3.8 Flash...", groqError?.message || groqError);
      
      // 2. FALLBACK 1: Gemini 3.8 Flash
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const fallbackModel1 = "gemini-3.8-flash";
        console.log(`[Extract Text API] Memanggil model (Fallback 1 - Gemini): ${fallbackModel1}`);

        const response = await ai.models.generateContent({
          model: fallbackModel1,
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
        if (!extractedText) throw new Error("Empty response from Gemini fallback");

        console.log(`[Extract Text API] Ekstraksi berhasil menggunakan model Gemini fallback: ${fallbackModel1}`);
      } catch (geminiError: any) {
        console.warn("[Extract Text API] Gemini juga gagal, mencoba fallback ke OpenRouter Llama 4 Maverick...", geminiError?.message || geminiError);

        // 3. FALLBACK 2: OpenRouter (Llama 4 Maverick)
        const openRouterApiKey = process.env.OPENROUTER_API_KEY;
        if (!openRouterApiKey) throw new Error("OPENROUTER_API_KEY is not configured");

        const fallbackModel2 = "meta-llama/llama-4-maverick";
        console.log(`[Extract Text API] Memanggil model (Fallback 2 - OpenRouter): ${fallbackModel2}`);

        const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openRouterApiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://solusi-guru.vercel.app",
            "X-Title": "Solusi Guru",
          },
          body: JSON.stringify({
            model: fallbackModel2,
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

        if (!orResponse.ok) {
          const errBody = await orResponse.text();
          console.error("[Extract Text API] OpenRouter Fallback Error:", errBody);
          throw new Error(`OpenRouter API returned ${orResponse.status}`);
        }

        const orData = await orResponse.json();
        extractedText = orData.choices?.[0]?.message?.content || "";
        if (!extractedText) throw new Error("Empty response from OpenRouter fallback");

        console.log(`[Extract Text API] Ekstraksi berhasil menggunakan model OpenRouter: ${fallbackModel2}`);
      }
    }

    return NextResponse.json({ text: extractedText });
  } catch (error: any) {
    console.error("[Extract Text API] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to extract text" }, { status: 500 });
  }
}

