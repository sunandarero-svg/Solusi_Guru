import { AIProvider, AIAssessmentResult } from "./AIProvider";
import { GroqProvider } from "./GroqProvider";
import { GeminiProvider } from "./GeminiProvider";

export class FallbackAIProvider implements AIProvider {
  readonly providerName = "Groq-Gemini-Fallback";

  private groqProvider = new GroqProvider();
  private geminiProvider = new GeminiProvider();

  async assessSubmission(pages: any[], rubrics: any[]): Promise<AIAssessmentResult> {
    // 1. Try Primary: Groq (uses up to 5 API keys)
    try {
      console.log("[AI] Attempting assessment with Groq (Primary)...");
      const result = await this.groqProvider.assessSubmission(pages, rubrics);
      console.log("[AI] Assessment successful with Groq.");
      return result;
    } catch (groqError: any) {
      console.warn("[AI] Groq provider failed:", groqError?.message || groqError);
      console.log("[AI] Falling back to Gemini provider...");
    }

    // 2. Secondary Fallback: Gemini (uses 1 API key)
    try {
      const result = await this.geminiProvider.assessSubmission(pages, rubrics);
      console.log("[AI] Assessment successful with Gemini fallback.");
      return result;
    } catch (geminiError: any) {
      console.error("[AI] Gemini fallback also failed:", geminiError?.message || geminiError);
      throw new Error(
        `All AI Providers (Groq & Gemini) failed. Gemini error: ${geminiError?.message || geminiError}`
      );
    }
  }
}
