import { AIProvider, AIAssessmentResult } from "./AIProvider";
import { readFile } from "fs/promises";
import path from "path";

export class QwenProvider implements AIProvider {
  readonly providerName = "Qwen-VL";

  private getApiKey(): string | null {
    const key = process.env.QWEN_API_KEY;
    if (!key || key.trim() === "") return null;
    return key.trim();
  }

  async assessSubmission(pages: any[], rubrics: any[], answerKey?: string): Promise<AIAssessmentResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("QWEN_API_KEY is not configured.");
    }

    // Default Qwen Vision model via DashScope compatible mode
    const modelName = "gpt-5.6";

    // Build answer key context if available
    let answerKeyInstruction = "";
    if (answerKey && answerKey.trim().length > 0) {
      answerKeyInstruction = `
KUNCI JAWABAN REFERENSI (dari soal yang dilampirkan guru):
${answerKey}

PENTING — ATURAN PENILAIAN BERDASARKAN KUNCI JAWABAN:
- Bandingkan setiap jawaban siswa (per soal) dengan kunci jawaban di atas.
- Jawaban siswa TIDAK HARUS sama persis kata per kata dengan kunci jawaban.
- Yang dinilai adalah KESESUAIAN KONTEKS: apakah jawaban siswa memiliki makna dan konteks yang sama dengan jawaban yang diharapkan.
- Jika siswa menjawab dengan kata-kata berbeda tetapi konteksnya benar dan tepat, berikan skor penuh untuk soal tersebut.
- Jika siswa menjawab dengan konteks yang sebagian benar, berikan skor proporsional.
- Jika jawaban siswa sama sekali tidak sesuai konteks, berikan skor rendah atau 0.
- Dalam 'analysisText', jelaskan secara detail perbandingan antara jawaban siswa dengan kunci jawaban, dan alasan skor yang diberikan.
`;
    }

    const promptText = `Anda adalah seorang asisten guru (AI) yang ahli dalam menilai tugas siswa. 
Tugas Anda adalah membaca gambar-gambar tugas siswa yang dilampirkan, lalu menilainya.

${answerKeyInstruction}

INSTRUKSI PENILAIAN:
1. Baca SELURUH tulisan siswa di setiap halaman dari awal hingga akhir. Ekstrak teks/jawaban siswa sebaik mungkin.
2. Identifikasi setiap nomor soal yang dijawab siswa.
3. Berikan penilaian per soal berdasarkan kunci jawaban.
${answerKey ? "4. Gunakan KUNCI JAWABAN REFERENSI di atas sebagai acuan utama, dengan menitikberatkan pada KESESUAIAN KONTEKS.\n" : ""}

ATURAN BAHASA DAN FEEDBACK (WAJIB DIPATUHI):
- Gunakan bahasa Indonesia yang baik dan benar sesuai KBBI dalam seluruh umpan balik. Catatan khusus: Gunakan kata 'algoritma' (bukan 'algoritme').
- DILARANG KERAS membuat koreksi palsu atau redundan. JANGAN PERNAH menyarankan perbaikan jika kata sebelum dan sesudahnya SAMA PERSIS.
- JANGAN PERNAH mengoreksi kata yang SUDAH BENAR ejaannya menurut KBBI.
- HANYA koreksi kata yang BENAR-BENAR SALAH ejaannya (contoh: 'apotik' menjadi 'apotek').
- Jika tidak ada kesalahan ejaan yang sebenarnya, JANGAN bahas atau memaksakan koreksi ejaan.
- SELALU berikan apresiasi positif kepada siswa dalam 'generalFeedback'. Buatlah agar siswa merasa dihargai dan termotivasi.
- Gunakan bahasa dan gaya penyampaian (tone) yang ramah, hangat, dan mudah dipahami oleh anak usia 10 tahun.
- Kalimat singkat dan jelas pada 'analysisText'.

DETEKSI KESALAHAN EJAAN (BOUNDING BOX):
Jika ada kata yang benar-benar salah ejaannya, Anda WAJIB memberikan koordinat kotak penanda (bounding box) untuk kata tersebut di dalam gambar, agar guru dapat melihat bagian mana yang perlu diperbaiki (seperti stabilo merah).
Koordinat menggunakan rentang 0 hingga 1000, dengan format [ymin, xmin, ymax, xmax]. (ymin = batas atas, xmin = batas kiri, ymax = batas bawah, xmax = batas kanan).
Jika tidak ada kata yang salah, kosongkan array \`errorHighlights\`.

Output Anda HARUS berupa JSON murni dengan struktur berikut:
{
  "totalScore": number,
  "generalFeedback": "Apresiasi dan umpan balik singkat untuk siswa",
  "analysis": [
    {
      "questionNumber": "string",
      "studentAnswer": "string",
      "score": number,
      "maxScore": number,
      "analysisText": "string"
    }
  ],
  "errorHighlights": [
    {
      "word": "kata yang salah",
      "correction": "perbaikan kata sesuai KBBI",
      "box": [0, 0, 0, 0],
      "pageIndex": 0
    }
  ]
}`;

    const contentParts: any[] = [{ type: "text", text: promptText }];

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      let buffer: Buffer;
      if (page.storageKey.startsWith("http")) {
        const res = await fetch(page.storageKey);
        const arrayBuffer = await res.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } else {
        const filePath = path.join(process.cwd(), "public", page.storageKey.replace(/^\//, ""));
        buffer = await readFile(filePath);
      }

      const mimeType = page.mimeType || "image/jpeg";
      const base64Data = buffer.toString("base64");

      contentParts.push({
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${base64Data}`,
        },
      });
    }

    const modelsToTry = ["gpt-5.6-luna", "gpt-5.6-sol", "gpt-5.6-terra"];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      console.log(`[QwenProvider] Trying model ${modelName} as fallback via bandelbanget...`);
      try {
        const response = await fetch("https://bandelbanget.xyz/v1/chat/completions", {
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
            max_tokens: 4096,
            response_format: { type: "json_object" },
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`API returned ${response.status}: ${errBody}`);
        }

        const data = await response.json();
        const responseText = data.choices?.[0]?.message?.content;
        if (!responseText) {
          throw new Error("API returned empty response.");
        }

        let cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleanText = cleanText.substring(firstBrace, lastBrace + 1);
        }
        return JSON.parse(cleanText) as AIAssessmentResult;
      } catch (err: any) {
        console.warn(`[QwenProvider] Model ${modelName} failed:`, err.message);
        lastError = err;
      }
    }

    throw lastError || new Error("All fallback models failed.");
  }

  async generateAnswerKey(taskText: string, rubrics: any[], imageAttachments?: any[]): Promise<string> {
    throw new Error("Not implemented for QwenProvider. Gemini should be used for this.");
  }
}
