import { NextRequest, NextResponse } from "next/server";
import { groqRateLimiter } from "@/modules/ai/rateLimiter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

    const prompt = "Tugas Anda adalah membaca seluruh tulisan tangan pada gambar ini. Transkripsikan semua teks dan angka persis seperti yang tertulis. Jangan ubah makna, jangan berikan penilaian, jangan menambahkan komentar apa pun. Cukup kembalikan hasil transkripsi teksnya saja.";
    
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    const mimeMatch = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

    const { key } = await groqRateLimiter.waitForKey(30000);
    
    // We will use qwen3.8-27b or llama-3.2-90b-vision-preview
    const visionModel = "qwen/qwen3.8-27b"; // Fast and reliable on Groq for OCR

    const visionResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: visionModel,
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

    if (!visionResponse.ok) {
      const errBody = await visionResponse.text();
      console.error("[Extract Text API] Groq Error:", errBody);
      throw new Error(`Groq API returned ${visionResponse.status}`);
    }

    const visionData = await visionResponse.json();
    const extractedText = visionData.choices?.[0]?.message?.content || "";

    return NextResponse.json({ text: extractedText });
  } catch (error: any) {
    console.error("[Extract Text API] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to extract text" }, { status: 500 });
  }
}

