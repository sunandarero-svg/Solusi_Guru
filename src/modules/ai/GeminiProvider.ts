import { AIProvider, AIAssessmentResult } from "./AIProvider";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFile } from "fs/promises";
import path from "path";

export class GeminiProvider implements AIProvider {
  readonly providerName = "Gemini-3.6-Flash";

  private getRandomKey(): string {
    const keysStr = process.env.GEMINI_API_KEYS;
    if (keysStr) {
      const keys = keysStr.split(',').map(k => k.trim()).filter(Boolean);
      if (keys.length > 0) {
        return keys[Math.floor(Math.random() * keys.length)];
      }
    }
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }
    return process.env.GEMINI_API_KEY;
  }

  async assessSubmission(pages: any[], rubrics: any[]): Promise<AIAssessmentResult> {
    const genAI = new GoogleGenerativeAI(this.getRandomKey());
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    // 1. Prepare images
    const imageParts = [];
    for (const page of pages) {
      // In production (Railway), storageKey could be an absolute URL or local path.
      // If it's local (e.g. /uploads/submissions/xxx.jpg), we need to read it.
      let buffer: Buffer;
      
      if (page.storageKey.startsWith("http")) {
        const res = await fetch(page.storageKey);
        const arrayBuffer = await res.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } else {
        // Local path
        const filePath = path.join(process.cwd(), "public", page.storageKey);
        buffer = await readFile(filePath);
      }

      imageParts.push({
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: page.mimeType || "image/jpeg"
        }
      });
    }

    // 2. Prepare rubrics prompt
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

    const prompt = `Anda adalah seorang asisten guru (AI) yang ahli dalam menilai tugas siswa. 
Tugas Anda adalah membaca gambar-gambar tugas siswa yang dilampirkan, lalu menilainya berdasarkan kriteria rubrik berikut.

${rubricInstruction}

Berikan penilaian yang objektif. Untuk setiap kriteria, tentukan skor dan berikan penjelasan (reasoning) yang mendetail mengapa skor tersebut diberikan berdasarkan tulisan siswa di gambar.

Output Anda HARUS berupa JSON murni (tanpa format markdown) dengan struktur berikut:
{
  "totalScore": number, // total semua skor
  "generalFeedback": "Umpan balik keseluruhan untuk siswa",
  "rubricScores": [
    {
      "rubricCriterionId": "ID Kriteria",
      "score": number, // skor yang diberikan
      "maxScore": number, // skor maksimal kriteria
      "reasoning": "Alasan penilaian..."
    }
  ]
}
`;

    // 3. Send to Gemini
    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();
    
    // Parse JSON
    try {
      const cleanText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText) as AIAssessmentResult;
      
      return parsed;
    } catch (e) {
      console.error("Failed to parse Gemini response:", responseText);
      throw new Error("Failed to parse AI response into valid JSON.");
    }
  }
}
