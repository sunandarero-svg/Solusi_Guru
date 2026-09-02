import { AIProvider, AIAssessmentResult } from "./AIProvider";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFile } from "fs/promises";
import path from "path";

function getGeminiModels(): string[] {
  const custom = process.env.GEMINI_MODEL?.trim();
  const defaults = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
  ];
  return custom ? [custom, ...defaults] : defaults;
}

export class GeminiProvider implements AIProvider {
  readonly providerName = "Gemini-Flash";

  private getRandomKey(): string {
    const keysStr = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;
    if (keysStr) {
      const keys = keysStr
        .replace(/[\r\n]/g, "")
        .split(",")
        .map((k) => k.replace(/['"` ]/g, "").trim())
        .filter((k) => k.length > 10);

      console.log(`[Gemini] Found ${keys.length} API keys`);

      if (keys.length > 0) {
        const selectedIndex = Math.floor(Math.random() * keys.length);
        console.log(`[Gemini] Using key index: ${selectedIndex}`);
        return keys[selectedIndex];
      }
    }
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  async assessSubmission(pages: any[], rubrics: any[]): Promise<AIAssessmentResult> {
    const apiKey = this.getRandomKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModels = getGeminiModels();

    let lastError: any = null;
    for (const modelName of geminiModels) {
      try {
        const result = await this._doAssessment(genAI, modelName, pages, rubrics);
        return result;
      } catch (error: any) {
        lastError = error;
        const errorMsg = error?.message || String(error);
        console.warn(`[Gemini] Model ${modelName} failed:`, errorMsg);
        if (errorMsg.includes("not found") || errorMsg.includes("not supported") || errorMsg.includes("404")) {
          continue;
        }
        // If it's a model error, continue to try next model
        continue;
      }
    }
    throw lastError || new Error("No Gemini model available");
  }

  private async _doAssessment(
    genAI: any,
    modelName: string,
    pages: any[],
    rubrics: any[]
  ): Promise<AIAssessmentResult> {
    console.log(`[Gemini] Using model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });

    const imageParts = [];
    for (const page of pages) {
      let buffer: Buffer;

      if (page.storageKey.startsWith("http")) {
        const res = await fetch(page.storageKey);
        const arrayBuffer = await res.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } else {
        const filePath = path.join(process.cwd(), "public", page.storageKey.replace(/^\//, ""));
        buffer = await readFile(filePath);
      }

      imageParts.push({
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: page.mimeType || "image/jpeg",
        },
      });
    }

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
  "totalScore": number,
  "generalFeedback": "Umpan balik keseluruhan untuk siswa",
  "rubricScores": [
    {
      "rubricCriterionId": "ID Kriteria",
      "score": number,
      "maxScore": number,
      "reasoning": "Alasan penilaian..."
    }
  ]
}`;

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();

    try {
      const cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
      return JSON.parse(cleanText) as AIAssessmentResult;
    } catch (e) {
      console.error("Failed to parse Gemini response:", responseText);
      throw new Error("Failed to parse AI response into valid JSON.");
    }
  }
}
