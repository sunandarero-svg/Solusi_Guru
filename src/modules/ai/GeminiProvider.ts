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

  async assessSubmission(pages: any[], rubrics: any[], answerKey?: string, questions?: any[]): Promise<AIAssessmentResult> {
    const apiKey = this.getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Fallback models for Gemini
    const fallbackModels = [
      process.env.GEMINI_MODEL || "gemini-1.5-flash",
      "gemini-1.5-flash-8b",
      "gemini-1.5-pro"
    ];
    const uniqueModels = Array.from(new Set(fallbackModels));

    // Build answer key context if available
    let answerKeyInstruction = "";
    if (answerKey && answerKey.trim().length > 0) {
      answerKeyInstruction = `
KUNCI JAWABAN REFERENSI (dari soal yang dilampirkan guru):
${answerKey}
`;
    }

    let questionsInstruction = "";
    if (questions && questions.length > 0) {
      const qList = questions.map(q => `Nomor ${q.order}: Tipe ${q.questionType}, Bobot ${q.maxScore}`).join("\\n");
      questionsInstruction = `
KONFIGURASI SOAL & BOBOT (DARI GURU):
Berikut adalah struktur dan pedoman bobot maksimal untuk setiap soal:
${qList}
Nilailah setiap soal siswa berpatokan pada bobot maksimal tersebut (maxScore).
`;
    } else {
      questionsInstruction = `2. Identifikasi jumlah total soal (N) yang dijawab oleh siswa atau yang ada di Kunci Jawaban.
3. Alokasikan nilai maksimal ('maxScore') untuk masing-masing soal secara proporsional, yaitu 100 / N (dibulatkan agar total seluruh 'maxScore' = 100).`;
    }

    const promptText = `Anda adalah seorang asisten guru (AI) yang ahli dalam menilai tugas siswa secara bijak dan suportif.
Tugas Anda adalah membaca gambar-gambar tugas siswa yang dilampirkan, lalu menilainya.

${answerKeyInstruction}
${questionsInstruction && questions && questions.length > 0 ? questionsInstruction : ""}

INSTRUKSI PENILAIAN & ALOKASI SKOR (SANGAT PENTING):
1. Baca SELURUH tulisan siswa di setiap halaman dari awal hingga akhir. Ekstrak teks/jawaban siswa sebaik mungkin.
${!questions || questions.length === 0 ? questionsInstruction : ""}
4. PENILAIAN KONTEKSTUAL:
   - Jika siswa HANYA MENULIS JAWABAN (tanpa pertanyaan): Cocokkan jawaban tersebut dengan Kunci Jawaban Referensi secara berurutan atau berdasarkan konteks.
   - Jika siswa MENULIS PERTANYAAN DAN JAWABAN di kertasnya: Anda WAJIB memetakan dan mencocokkan setiap pertanyaan dengan jawabannya berdasarkan NOMOR YANG SAMA (contoh: Pertanyaan nomor 1 dipasangkan dengan Jawaban nomor 1). Baca seluruh kata dari pertanyaan tersebut secara menyeluruh agar tidak salah konteks. Setelah dipasangkan, tugas Anda adalah mengecek apakah JAWABAN siswa tersebut benar dan tepat terhadap PERTANYAAN-nya sendiri. PASTIKAN Anda HANYA memberikan analisis dan nilai untuk bagian JAWABANNYA saja (jangan menilai kualitas pertanyaannya).
5. Yang dinilai adalah KESESUAIAN KONTEKS (bukan kesamaan kata per kata).

ATURAN UMPAN BALIK EDUKATIF (FEEDBACK):
- Pada 'analysisText' di setiap soal:
- JELASKAN ALASAN MENGAPA JAWABAN TERSEBUT BENAR ATAU SALAH secara singkat dan padat (maksimal 2 kalimat).
- Jika jawaban SALAH/KURANG TEPAT: WAJIB berikan analisis kesalahan dan arahan yang membangun tanpa menyalahkan serta berikan motivasi (contoh: "Jawabanmu masih kurang tepat, mari perhatikan kembali bagian... tetap semangat!").
- Gunakan bahasa yang ramah, hangat, dan memotivasi HANYA pada jawaban yang salah.
- JIKA TULISAN SISWA TIDAK DAPAT DIBACA SAMA SEKALI PADA SOAL TERTENTU: Berikan nilai 0, tuliskan "Tulisan tidak dapat dibaca" pada 'analysisText', dan WAJIB set 'status' menjadi "UNREADABLE". Jika terbaca, set 'status' menjadi "OK".

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
      "analysisText": "string (Analisis alasan skor + Umpan balik edukatif/pujian)",
      "status": "OK" // atau "UNREADABLE" jika tulisan tidak dapat dibaca
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

  async generateAnswerKey(taskText: string, rubrics: any[], imageAttachments?: any[]): Promise<any> {
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

    const prompt = `Anda adalah seorang guru yang sangat berpengalaman. Tugas Anda adalah membuat KUNCI JAWABAN berdasarkan soal/tugas yang diberikan.

SOAL/TUGAS DARI GURU:
${taskText}

INSTRUKSI UMUM:
1. Baca dan pahami seluruh soal/tugas di atas dengan cermat.
2. Buat kunci jawaban yang lengkap dan akurat untuk setiap pertanyaan, disesuaikan dengan tingkat pendidikan siswa (SD/SMP/SMA).
3. Untuk soal esai, berikan jawaban yang mencakup poin-poin utama yang harus ada.
4. Untuk soal pilihan ganda, sebutkan jawaban yang benar beserta penjelasan singkat.
5. Gunakan tata bahasa Indonesia yang baku, efektif, dan natural (sesuai EYD/PUEBI).
6. DILARANG KERAS memberikan komentar tentang kondisi gambar (misal: buram/gelap). Kerjakan sebaik mungkin tanpa keluhan.
7. DILARANG KERAS menggunakan kalimat pengantar atau penutup. Langsung berikan isi kunci jawaban saja.

INSTRUKSI FORMAT TULISAN (SANGAT PENTING):
1. DILARANG KERAS menggunakan simbol Markdown untuk menebalkan teks (seperti **teks**) atau memiringkan teks (seperti *teks*) pada bagian \`answerKey\`.
2. Jika terdapat rumus matematika, fisika, atau simbol ilmiah, tuliskan rumus sesuai kaidah penulisan yang baku secara natural tanpa markdown khusus. 
3. Pertahankan struktur poin-poin agar tetap rapi pada \`answerKey\`.

Anda JUGA harus menebak struktur soal dari lampiran (ada berapa soal, dan tipenya). Tipe soal yang didukung: "PILIHAN_GANDA", "BENAR_SALAH", "ISIAN_SINGKAT", "ESSAY", "PILIHAN_GANDA_KOMPLEKS".
Berikan bobot maksimal merata (misal 100/N).

Output WAJIB berupa JSON MURNI (tanpa block code markdown) dengan struktur:
{
  "answerKey": "Teks lengkap kunci jawaban persis seperti instruksi di atas (plain text, dipisahkan newline \\n)",
  "parsedQuestions": [
    {
      "order": 1, // Nomor urut soal
      "questionType": "ESSAY", // Tebakan tipe soal
      "maxScore": 20 // Tebakan bobot
    }
  ]
}`;

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
            responseMimeType: "application/json",
          }
        });

        const responseText = result.response.text();
        if (!responseText) {
          throw new Error("Gemini API returned empty response for answer key.");
        }

        console.log(`[Gemini] Answer key generated successfully with ${modelName}.`);
        const cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
        return JSON.parse(cleanText);
      } catch (error: any) {
        console.warn(`[Gemini] Answer key generation failed with ${modelName}:`, error.message || error);
        lastError = error;
      }
    }

    throw lastError || new Error("All Gemini fallback models failed for answer key generation.");
  }
}
