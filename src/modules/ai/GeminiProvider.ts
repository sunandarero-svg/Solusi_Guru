import { AIProvider, AIAssessmentResult } from "./AIProvider";
import { readFile } from "fs/promises";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiProvider implements AIProvider {
  readonly providerName = "Gemini-Vision";

  private getApiKey(): string {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }
    return key.trim().replace(/^["']|["']$/g, '');
  }

  async assessSubmission(pages: any[], rubrics: any[], answerKey?: string): Promise<AIAssessmentResult> {
    const apiKey = this.getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Fallback models for Gemini
    const fallbackModels = [
      process.env.GEMINI_MODEL || "gemini-1.5-flash",
      "gemini-1.5-flash-8b",
      "gemini-1.5-pro"
    ];
    const uniqueModels = Array.from(new Set(fallbackModels));

    const firstRubric = rubrics[0];
    let rubricInstruction = "";
    if (firstRubric && firstRubric.criteria) {
      rubricInstruction = "Berikut adalah kriteria penilaian (rubrik):\n";
      firstRubric.criteria.forEach((c: any) => {
        rubricInstruction += `- ID Kriteria: ${c._id}\n`;
        rubricInstruction += `  Nama: ${c.name}\n`;
        rubricInstruction += `  Deskripsi: ${c.description}\n`;
        rubricInstruction += `  Skor Maksimal: ${c.maxScore}\n\n`;
      });
    }

    let answerKeyInstruction = "";
    if (answerKey && answerKey.trim().length > 0) {
      answerKeyInstruction = `
KUNCI JAWABAN REFERENSI (dari soal yang dilampirkan guru):
${answerKey}

PENTING — ATURAN PENILAIAN BERDASARKAN KUNCI JAWABAN:
- Bandingkan jawaban siswa dengan kunci jawaban di atas.
- Jawaban siswa TIDAK HARUS sama persis kata per kata dengan kunci jawaban.
- Yang dinilai adalah KESESUAIAN KONSEP: apakah jawaban siswa menunjukkan pemahaman yang benar terhadap konsep yang ditanyakan.
- Jika siswa menjawab dengan kata-kata berbeda tetapi konsepnya benar dan tepat, berikan skor penuh untuk kriteria tersebut.
- Jika siswa menjawab dengan konsep yang sebagian benar, berikan skor proporsional.
- Jika jawaban siswa sama sekali tidak sesuai dengan konsep yang ditanyakan, berikan skor rendah.
- Dalam 'reasoning', jelaskan secara singkat bagaimana jawaban siswa dibandingkan dengan konsep kunci jawaban.
`;
    }

    const promptText = `Anda adalah seorang asisten guru (AI) yang ahli dalam menilai tugas siswa. 
Tugas Anda adalah membaca gambar-gambar tugas siswa yang dilampirkan, lalu menilainya berdasarkan kriteria rubrik berikut.

${rubricInstruction}
${answerKeyInstruction}

INSTRUKSI PENILAIAN:
1. Baca SELURUH tulisan siswa di setiap halaman dari awal hingga akhir.
2. Berikan penilaian yang objektif untuk setiap kriteria rubrik.
3. Untuk setiap kriteria, tentukan skor dan berikan penjelasan (reasoning) singkat dan jelas.
${answerKey ? "4. Gunakan KUNCI JAWABAN REFERENSI di atas sebagai acuan utama untuk menilai kebenaran jawaban siswa.\n" : ""}

ATURAN BAHASA DAN FEEDBACK (WAJIB DIPATUHI):
- Gunakan bahasa Indonesia yang baik dan benar sesuai KBBI dalam seluruh umpan balik. Catatan khusus: Gunakan kata 'algoritma' (bukan 'algoritme').
- DILARANG KERAS membuat koreksi palsu atau redundan. JANGAN PERNAH menyarankan perbaikan jika kata sebelum dan sesudahnya SAMA PERSIS (contoh SALAH: "'memerlukan' sebaiknya ditulis menjadi 'memerlukan'"). Ini sangat dilarang!
- JANGAN PERNAH mengoreksi kata yang SUDAH BENAR ejaannya menurut KBBI. Jika siswa sudah menulis kata dengan benar, JANGAN bahas ejaannya sama sekali.
- HANYA koreksi kata yang BENAR-BENAR SALAH ejaannya (contoh: 'apotik' menjadi 'apotek', 'algoritme' menjadi 'algoritma').
- Jika tidak ada kesalahan ejaan yang sebenarnya, JANGAN bahas atau memaksakan koreksi ejaan.
- SELALU berikan apresiasi positif kepada siswa dalam 'generalFeedback'. Buatlah agar siswa merasa dihargai dan termotivasi.
- Gunakan bahasa dan gaya penyampaian (tone) yang ramah, hangat, dan mudah dipahami oleh anak usia 10 tahun (kelas 4-5 SD). Hindari kalimat yang kaku atau menghakimi.
- Jika ada hal yang perlu diperbaiki, sampaikan dengan cara yang membangun dan menyemangati (contoh: "Wah, jawabanmu sudah bagus! Akan lebih sempurna kalau kata 'apotik' ditulis menjadi 'apotek', ya.").
- Gunakan kalimat yang singkat, padat, dan jelas.

DETEKSI KESALAHAN EJAAN (BOUNDING BOX):
Jika ada kata yang benar-benar salah ejaannya, Anda WAJIB memberikan koordinat kotak penanda (bounding box) untuk kata tersebut di dalam gambar, agar guru dapat melihat bagian mana yang perlu diperbaiki (seperti stabilo merah).
Koordinat menggunakan rentang 0 hingga 1000, dengan format [ymin, xmin, ymax, xmax]. (ymin = batas atas, xmin = batas kiri, ymax = batas bawah, xmax = batas kanan).
Jika tidak ada kata yang salah, kosongkan array \`errorHighlights\`.

Output Anda HARUS berupa JSON murni dengan struktur berikut:
{
  "totalScore": number,
  "generalFeedback": "Apresiasi dan umpan balik singkat untuk siswa",
  "rubricScores": [
    {
      "rubricCriterionId": "ID Kriteria",
      "score": number,
      "maxScore": number,
      "reasoning": "Alasan penilaian singkat..."
    }
  ],
  "errorHighlights": [
    {
      "word": "kata yang salah",
      "correction": "perbaikan kata sesuai KBBI",
      "box": [ymin, xmin, ymax, xmax],
      "pageIndex": 0 // 0 untuk halaman pertama, 1 untuk kedua, dst
    }
  ]
}`;

    const contentParts: any[] = [{ text: promptText }];

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
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        }
      });
    }

    let lastError: any = null;

    for (const modelName of uniqueModels) {
      try {
        console.log(`[Gemini] Assessing submission with model ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent({
          contents: [{ role: "user", parts: contentParts }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          }
        });

        const responseText = result.response.text();
        if (!responseText) {
          throw new Error("Gemini API returned empty response.");
        }

        const cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
        return JSON.parse(cleanText) as AIAssessmentResult;
      } catch (error: any) {
        console.warn(`[Gemini] Error assessing submission with ${modelName}:`, error.message || error);
        lastError = error;
      }
    }

    throw lastError || new Error("All Gemini fallback models failed.");
  }

  async generateAnswerKey(taskText: string, rubrics: any[], imageAttachments?: any[]): Promise<string> {
    const apiKey = this.getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Fokus ke gemini-3.5-flash atau yang terbaru (fallback ke versi sebelumnya yang stabil)
    const fallbackModels = [
      process.env.GEMINI_MODEL || "gemini-3.5-flash",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash"
    ];
    const uniqueModels = Array.from(new Set(fallbackModels));

    let rubricContext = "";
    const firstRubric = rubrics[0];
    if (firstRubric && firstRubric.criteria) {
      rubricContext = "\nKriteria rubrik yang digunakan:\n";
      firstRubric.criteria.forEach((c: any) => {
        rubricContext += `- ${c.name}: ${c.description || ""} (Maks skor: ${c.maxScore})\n`;
      });
    }

    const prompt = `Anda adalah seorang guru yang sangat berpengalaman. Tugas Anda adalah membuat KUNCI JAWABAN berdasarkan soal/tugas yang diberikan.

SOAL/TUGAS DARI GURU:
${taskText}
${rubricContext}

INSTRUKSI UMUM:
1. Baca dan pahami seluruh soal/tugas di atas dengan cermat.
2. Buat kunci jawaban yang lengkap dan akurat untuk setiap pertanyaan, disesuaikan dengan tingkat pendidikan siswa (SD/SMP/SMA).
3. Untuk soal esai, berikan jawaban yang mencakup poin-poin utama yang harus ada.
4. Untuk soal pilihan ganda, sebutkan jawaban yang benar beserta penjelasan singkat.
5. Gunakan tata bahasa Indonesia yang baku, efektif, dan natural (sesuai EYD/PUEBI).
6. DILARANG KERAS memberikan komentar tentang kondisi gambar (misal: buram/gelap). Kerjakan sebaik mungkin tanpa keluhan.
7. DILARANG KERAS menggunakan kalimat pengantar atau penutup. Langsung berikan isi kunci jawaban saja.

INSTRUKSI FORMAT TULISAN (SANGAT PENTING):
1. Hasil teks harus persis seperti format ketikan standar pada Microsoft Word (teks biasa/plain text).
2. DILARANG KERAS menggunakan simbol Markdown untuk menebalkan teks (seperti **teks**) atau memiringkan teks (seperti *teks*).
3. Jika terdapat rumus matematika, fisika, atau simbol ilmiah, tuliskan rumus sesuai kaidah penulisan yang baku secara natural. 
4. PASTIKAN rumus ditulis BERSIH tanpa ada simbol tambahan seperti menebalkan (**rumus**) atau pemformatan lain di sekitarnya. 
5. Pertahankan struktur poin-poin agar tetap rapi, gunakan spasi baris yang jelas, dan penomoran standar yang sesuai dengan soal.

Berikan kunci jawaban dalam format teks biasa (bukan JSON atau Markdown berlebihan).`;

    const contentParts: any[] = [{ text: prompt }];

    const hasImages = imageAttachments && imageAttachments.length > 0;
    if (hasImages) {
      for (const attachment of imageAttachments!) {
        try {
          let buffer: Buffer;
          if (attachment.storageKey.startsWith("http")) {
            const res = await fetch(attachment.storageKey);
            buffer = Buffer.from(await res.arrayBuffer());
          } else {
            const filePath = path.join(process.cwd(), "public", attachment.storageKey.replace(/^\//, ""));
            buffer = await readFile(filePath);
          }
          
          let mimeType = attachment.mimeType || "image/jpeg";
          
          // Fix for docx image mimetypes if needed
          if (!mimeType.startsWith("image/")) {
              mimeType = "image/jpeg";
          }
          
          if (attachment.description) {
            contentParts.push({ text: `[Berikut adalah gambar untuk: ${attachment.description}]` });
          }
          
          contentParts.push({
            inlineData: {
              data: buffer.toString("base64"),
              mimeType: mimeType,
            }
          });
        } catch (err) {
          console.warn(`[Gemini] Failed to load image attachment: ${attachment.originalFileName}`, err);
        }
      }
    }

    let lastError: any = null;

    for (const modelName of uniqueModels) {
      try {
        console.log(`[Gemini] Generating answer key with model ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent({
          contents: [{ role: "user", parts: contentParts }],
          generationConfig: {
            temperature: 0.3,
          }
        });

        const responseText = result.response.text();
        if (!responseText) {
          throw new Error("Gemini API returned empty response for answer key.");
        }

        console.log(`[Gemini] Answer key generated successfully with ${modelName}.`);
        return responseText.trim();
      } catch (error: any) {
        console.warn(`[Gemini] Answer key generation failed with ${modelName}:`, error.message || error);
        lastError = error;
      }
    }

    throw lastError || new Error("All Gemini fallback models failed for answer key generation.");
  }
}
