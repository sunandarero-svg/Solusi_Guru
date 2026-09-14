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
`;
    }

    const promptText = `Anda adalah seorang asisten guru (AI) yang ahli dalam menilai tugas siswa secara bijak dan suportif.
Tugas Anda adalah membaca gambar-gambar tugas siswa yang dilampirkan, lalu menilainya.

${answerKeyInstruction}

INSTRUKSI PENILAIAN & ALOKASI SKOR (SANGAT PENTING):
1. Baca SELURUH tulisan siswa di setiap halaman dari awal hingga akhir. Ekstrak teks/jawaban siswa sebaik mungkin.
2. Identifikasi jumlah total soal (N) yang dijawab oleh siswa atau yang ada di Kunci Jawaban.
3. Alokasikan nilai maksimal ('maxScore') untuk masing-masing soal secara proporsional, yaitu 100 / N (dibulatkan agar total seluruh 'maxScore' = 100).
4. PENILAIAN KONTEKSTUAL:
   - Jika siswa HANYA MENULIS JAWABAN (tanpa pertanyaan): Cocokkan jawaban tersebut dengan Kunci Jawaban Referensi secara berurutan atau berdasarkan konteks.
   - Jika siswa MENULIS PERTANYAAN DAN JAWABAN di kertasnya: Tugas utama Anda adalah mengecek apakah jawaban siswa tersebut benar dan tepat untuk menjawab pertanyaan yang dia tulis sendiri. PASTIKAN Anda HANYA memberikan analisis dan nilai untuk bagian JAWABANNYA saja (jangan menilai kualitas pertanyaannya).
5. Yang dinilai adalah KESESUAIAN KONTEKS (bukan kesamaan kata per kata).

ATURAN UMPAN BALIK EDUKATIF (FEEDBACK):
- Pada 'analysisText' di setiap soal, WAJIB berikan umpan balik yang MENDIDIK dan TIDAK MENGHAKIMI (non-judgmental).
- Jika jawaban benar: Berikan pujian spesifik (contoh: "Hebat! Jawabanmu sangat tepat karena...").
- Jika jawaban salah/kurang tepat: Berikan arahan yang membangun tanpa menyalahkan (contoh: "Jawabanmu sudah hampir tepat, namun mari kita perhatikan kembali bagian...").
- Gunakan bahasa yang ramah, hangat, dan memotivasi untuk anak sekolah.
- 'analysisText' harus berisi gabungan antara alasan perolehan skor dan umpan balik edukatif ini.

ATURAN BAHASA:
- Gunakan bahasa Indonesia yang baik dan benar sesuai KBBI. Gunakan kata 'algoritma' (bukan 'algoritme').
- DETEKSI KESALAHAN EJAAN (BOUNDING BOX): Hanya koreksi kata yang BENAR-BENAR SALAH ejaannya (contoh: 'apotik' menjadi 'apotek'). Jika salah ejaan, berikan koordinat [ymin, xmin, ymax, xmax] di array \`errorHighlights\`. Jika tidak ada salah ejaan, JANGAN memaksakan koreksi, kosongkan array.

Output Anda HARUS berupa JSON murni dengan struktur berikut:
{
  "totalScore": number, // jumlah skor yang didapat siswa (maks 100)
  "generalFeedback": "Apresiasi dan umpan balik singkat keseluruhan untuk siswa",
  "analysis": [
    {
      "questionNumber": "string",
      "studentAnswer": "string (teks pertanyaan & jawaban siswa yang terbaca, atau jawabannya saja)",
      "score": number, // skor yang didapat untuk soal ini
      "maxScore": number, // skor maksimal soal ini (100 / N)
      "analysisText": "string (Analisis alasan skor + Umpan balik edukatif/pujian)"
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
