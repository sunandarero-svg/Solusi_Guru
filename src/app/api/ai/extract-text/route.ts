import { NextRequest, NextResponse } from "next/server";
import { groqRateLimiter } from "@/modules/ai/rateLimiter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenAI } from "@google/genai";

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
    
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    const mimeMatch = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

    let extractedText = "";

    // 1. PRIMARY: Gemini
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const visionModel = "gemini-3.8-flash"; 
      console.log(`[Extract Text API] Memanggil model (Primary): ${visionModel}`);

      const response = await ai.models.generateContent({
        model: visionModel,
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
      if (!extractedText) throw new Error("Empty response from Gemini");
      
      console.log(`[Extract Text API] Ekstraksi berhasil menggunakan model: ${visionModel}`);
    } catch (geminiError: any) {
      console.warn("[Extract Text API] Gemini gagal, mencoba fallback ke Groq Qwen...", geminiError?.message || geminiError);
      
      // 2. FALLBACK 1: Groq (Qwen)
      const { key } = await groqRateLimiter.waitForKey(30000);
      const fallbackModel = "qwen/qwen3.8-27b";
      console.log(`[Extract Text API] Memanggil model (Fallback 1 - Groq): ${fallbackModel}`);

      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: fallbackModel,
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
          max_tokens: 800,
        }),
      });

      if (!groqResponse.ok) {
        const errBody = await groqResponse.text();
        console.error("[Extract Text API] Groq Fallback Error:", errBody);
        throw new Error(`Groq API returned ${groqResponse.status}`);
      }

      const groqData = await groqResponse.json();
      extractedText = groqData.choices?.[0]?.message?.content || "";
      console.log(`[Extract Text API] Ekstraksi berhasil menggunakan model Groq Qwen: ${fallbackModel}`);
    }

    return NextResponse.json({ text: extractedText });
  } catch (error: any) {
    console.error("[Extract Text API] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to extract text" }, { status: 500 });
  }
}

