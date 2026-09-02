import { AIProvider, AIAssessmentResult } from "./AIProvider";
import { readFile } from "fs/promises";
import path from "path";

// Global counter for round-robin
let currentKeyIndex = 0;

// Cache for dynamically fetched models per API key
const modelCache: Record<string, string[]> = {};

async function getDynamicModels(apiKey: string): Promise<string[]> {
  if (modelCache[apiKey]) {
    return modelCache[apiKey];
  }
  
  const res = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  
  if (!res.ok) {
    console.warn(`[Groq] Failed to fetch models list for key prefix ${apiKey.substring(0, 8)}`);
    return [
      "llama-4-scout-17b-16e-instruct",
      "llama-4-maverick-17b-128e-instruct",
      "llama-3.2-11b-vision-instruct",
      "llama-3.2-90b-vision-instruct",
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant"
    ]; // Ultimate fallback defaults if fetch fails
  }
  
  const data = await res.json();
  const availableModels = data.data.map((m: any) => m.id);
  modelCache[apiKey] = availableModels;
  return availableModels;
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

    // Select key using round robin
    const apiKey = keys[currentKeyIndex % keys.length];
    const usedIndex = currentKeyIndex % keys.length;
    // Increment and wrap around to prevent overflow
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    
    const availableModels = await getDynamicModels(apiKey);
    
    // Sort models: Vision models first, then general Llama models
    const visionModels = availableModels.filter(m => m.toLowerCase().includes("vision") || m.toLowerCase().includes("llava") || m.toLowerCase().includes("pixtral"));
    // Since we are assessing images, we MUST use a vision model. Do not fallback to text models.
    let modelsToTry = visionModels.length > 0 ? visionModels : ["llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview"];
    
    const customModel = process.env.GROQ_MODEL?.trim();
    if (customModel) {
      modelsToTry = [customModel, ...modelsToTry];
    }
    
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[Groq] Trying model ${modelName} with key prefix ${apiKey.substring(0, 8)}... (Key Index: ${usedIndex + 1}/${keys.length})`);
        const result = await this._doAssessment(apiKey, modelName, pages, rubrics);
        return result;
      } catch (error: any) {
        lastError = error;
        console.warn(`[Groq] Error with model ${modelName}:`, error?.message || error);
        // Clear cache so it fetches fresh models list next time if there's permission error
        if (error?.message?.includes("404") || error?.message?.includes("400")) {
           delete modelCache[apiKey];
        }
      }
    }

    throw lastError || new Error("All dynamically fetched Groq API models failed for the selected key.");
  }

  private async _doAssessment(
    apiKey: string,
    modelName: string,
    pages: any[],
    rubrics: any[]
  ): Promise<AIAssessmentResult> {
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

    const contentParts: any[] = [{ type: "text", text: promptText }];

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
