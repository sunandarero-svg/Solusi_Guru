import { AIProvider, AIAssessmentResult } from "./AIProvider";
import { readFile } from "fs/promises";
import path from "path";

function getGroqModels(): string[] {
  const custom = process.env.GROQ_MODEL?.trim();
  const defaults = [
    "llama-3.2-11b-vision-instruct",
    "llama-3.2-90b-vision-instruct",
    "llava-v1.5-7b-cloud",
  ];
  return custom ? [custom, ...defaults] : defaults;
}

export class GroqProvider implements AIProvider {
  readonly providerName = "Groq-Vision";

  private getApiKeys(): string[] {
    const keysStr = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY;
    if (!keysStr) return [];
    return keysStr
      .replace(/[\r\n]/g, "")
      .split(",")
      .map((k) => k.replace(/['"` ]/g, "").trim())
      .filter((k) => k.length > 5);
  }

  async assessSubmission(pages: any[], rubrics: any[]): Promise<AIAssessmentResult> {
    const keys = this.getApiKeys();
    if (keys.length === 0) {
      throw new Error("GROQ_API_KEY / GROQ_API_KEYS is not configured.");
    }

    const groqModels = getGroqModels();
    const shuffledKeys = [...keys].sort(() => Math.random() - 0.5);
    let lastError: any = null;

    for (const apiKey of shuffledKeys) {
      for (const modelName of groqModels) {
        try {
          console.log(`[Groq] Trying model ${modelName} with key prefix ${apiKey.substring(0, 8)}...`);
          const result = await this._doAssessment(apiKey, modelName, pages, rubrics);
          return result;
        } catch (error: any) {
          lastError = error;
          console.warn(`[Groq] Error with model ${modelName}:`, error?.message || error);
        }
      }
    }

    throw lastError || new Error("All Groq API keys and models failed.");
  }

  private async _doAssessment(
    apiKey: string,
    modelName: string,
    pages: any[],
    rubrics: any[]
  ): Promise<AIAssessmentResult> {
    const contentParts: any[] = [];

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

    const promptText = `Anda adalah seorang asisten guru (AI) yang ahli dalam menilai tugas siswa. 
Tugas Anda adalah membaca gambar-gambar tugas siswa yang dilampirkan, lalu menilainya berdasarkan kriteria rubrik berikut.

${rubricInstruction}

Berikan penilaian yang objektif. Untuk setiap kriteria, tentukan skor dan berikan penjelasan (reasoning) yang mendetail mengapa skor tersebut diberikan berdasarkan tulisan siswa di gambar.

Output Anda HARUS berupa JSON murni dengan struktur berikut:
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

    contentParts.push({ type: "text", text: promptText });

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

      const mimeType = page.mimeType || "image/jpeg";
      const base64Data = buffer.toString("base64");

      contentParts.push({
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${base64Data}`,
        },
      });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Groq API returned ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content;
    if (!responseText) {
      throw new Error("Groq API returned empty response.");
    }

    const cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText) as AIAssessmentResult;
  }
}
