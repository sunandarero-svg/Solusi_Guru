import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import { Assignment, AssignmentAttachment, AssignmentQuestion } from "@/models/Assignment";
import { AIAssessment, StudentAnswerAnalysis, Submission } from "@/models/Submission";
import { GoogleGenAI } from "@google/genai";
import { attachmentService } from "@/modules/attachment/attachmentService";

// OCR prompt — same as extract-text API
const OCR_PROMPT = `Kamu adalah sistem AI ahli dalam Optical Character Recognition (OCR) dan analisis tata letak dokumen, khususnya untuk membaca dan mendigitalkan catatan tulisan tangan. Tugasmu adalah mengekstrak teks dari gambar yang diberikan secara akurat, rapi, dan terstruktur.

Patuhi aturan operasional ketat berikut:

1. PENANGANAN KOREKSI & CORETAN (SANGAT PENTING):
Identifikasi teks, huruf, atau angka yang dicoret (strikethrough), dicoret tebal, atau ditimpa oleh penulis. ABAIKAN bagian tersebut sepenuhnya. JANGAN transkripsikan teks yang sudah dibatalkan. Hanya ekstrak teks final yang dipertahankan/dimaksudkan oleh penulis.

2. STRUKTUR & HIERARKI (MARKDOWN):
Pertahankan hierarki dokumen asli. Gunakan format Markdown untuk merapikan hasil:
Gunakan huruf tebal (**teks**) untuk judul blok atau kategori (contoh: A. Pilihan Ganda, B. Isian).
Gunakan penomoran (1, 2, 3) persis seperti urutan di dokumen.
Jika ada teks yang diatur dalam dua kolom (seperti format nomor 1-5 di kiri dan 6-10 di kanan), susun agar tetap sejajar menggunakan spasi atau tabulasi yang rapi.

3. TRANSKRIPSI VERBATIM (APA ADANYA):
Ekstrak teks persis seperti yang tertulis, termasuk variasi ejaan atau singkatan yang digunakan penulis. Jangan melakukan koreksi tata bahasa pada teks yang valid.

4. KELUARAN MURNI (TANPA BASA-BASI):
Hasilkan HANYA teks yang diekstrak. Dilarang keras menambahkan kalimat pembuka, penjelasan, atau kalimat penutup.

5. WAJIB BAHASA INDONESIA PADA UMUMNYA:
PASTIKAN seluruh hasil ekstraksi teks ditulis menggunakan bahasa Indonesia pada umumnya. JANGAN PERNAH menerjemahkan teks tersebut ke bahasa Inggris atau bahasa lain.`;

/**
 * Extract text from a single base64 image using Gemini (primary) or Groq (fallback).
 */
async function extractTextFromImage(base64Image: string): Promise<string> {
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
  const mimeMatch = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

  // PRIMARY: Gemini
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const visionModel = "gemini-3.8-flash";
    console.log(`[Grade BG] OCR menggunakan model: ${visionModel}`);

    const response = await ai.models.generateContent({
      model: visionModel,
      contents: [
        OCR_PROMPT,
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        }
      ],
      config: {
        temperature: 0.1,
      }
    });

    const text = response.text || "";
    if (!text) throw new Error("Empty response from Gemini");
    return text;
  } catch (geminiError: any) {
    console.warn("[Grade BG] Gemini OCR gagal, mencoba fallback Groq...", geminiError?.message);

    // FALLBACK: Groq
    const { groqRateLimiter } = await import("@/modules/ai/rateLimiter");
    const { key } = await groqRateLimiter.waitForKey(30000);
    const fallbackModel = "qwen/qwen3.8-27b";

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: fallbackModel,
        messages: [{
          role: "user",
          content: [
            { type: "text", text: OCR_PROMPT },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
          ]
        }],
        temperature: 0.1,
        max_tokens: 800,
      }),
    });

    if (!groqResponse.ok) {
      const errBody = await groqResponse.text();
      throw new Error(`Groq OCR fallback failed: ${groqResponse.status} - ${errBody}`);
    }

    const groqData = await groqResponse.json();
    return groqData.choices?.[0]?.message?.content || "";
  }
}

/**
 * Background function: Extract text from all images, then grade, then save results.
 * Runs after HTTP response has been sent.
 */
async function processFullGradingInBackground(
  base64Images: string[],
  assignmentId: string,
  submissionId: string
) {
  try {
    await dbConnect();

    // === PHASE 1: Extract text from all images ===
    console.log(`[Grade BG] Mulai ekstraksi teks dari ${base64Images.length} gambar untuk submission ${submissionId}`);
    let combinedText = "";
    for (let i = 0; i < base64Images.length; i++) {
      try {
        const pageText = await extractTextFromImage(base64Images[i]);
        if (pageText) {
          combinedText += `\n\n--- Halaman ${i + 1} ---\n${pageText}`;
        }
      } catch (err: any) {
        console.error(`[Grade BG] Gagal OCR halaman ${i + 1}:`, err.message);
        combinedText += `\n\n--- Halaman ${i + 1} ---\n[GAGAL MEMBACA HALAMAN INI]`;
      }
    }
    combinedText = combinedText.trim();

    if (!combinedText) {
      throw new Error("Tidak ada teks yang berhasil diekstrak dari semua gambar.");
    }

    console.log(`[Grade BG] Ekstraksi selesai. Mulai penilaian AI untuk submission ${submissionId}`);

    // === PHASE 2: Grade the extracted text ===
    // 1. Fetch assignment details
    const assignment = await Assignment.findById(assignmentId).lean();
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // 2. Fetch answer key and questions
    const existingAnswerKey = await attachmentService.getAnswerKey(assignmentId);
    let answerKey = existingAnswerKey || "";

    const questions = await AssignmentQuestion.find({ assignmentId }).sort({ order: 1 }).lean();

    // 3. Prepare Prompt for AI Grading
    let answerKeyInstruction = "";
    if (answerKey && answerKey.trim().length > 0) {
      answerKeyInstruction = `KUNCI JAWABAN REFERENSI:\n${answerKey}\n`;
    }

    let questionsInstruction = "";
    if (questions && questions.length > 0) {
      const qList = questions.map(q => `Nomor ${q.order}: Tipe ${q.questionType}, Bobot ${q.maxScore}`).join("\\n");
      questionsInstruction = `KONFIGURASI SOAL & BOBOT:\n${qList}\nNilailah setiap soal siswa berpatokan pada bobot maksimal tersebut (maxScore).\n`;
    } else {
      questionsInstruction = `2. Identifikasi jumlah total soal (N). Alokasikan nilai maksimal (maxScore) proporsional, yaitu 100 / N.`;
    }

    const textPrompt = `Anda adalah asisten guru (AI) penilai tugas siswa.
Tugas Anda menilai transkripsi tulisan siswa secara akurat berdasarkan Kunci Jawaban.

BERIKUT ADALAH HASIL TRANSKRIPSI JAWABAN SISWA:
"""
${combinedText}
"""

${answerKeyInstruction}
${questionsInstruction}

INSTRUKSI PENILAIAN & ALOKASI SKOR:
0. WAJIB MENILAI KESELURUHAN SOAL TANPA TERKECUALI! PASTIKAN JUMLAH ITEM DALAM ARRAY 'analysis' SAMA PERSIS DENGAN JUMLAH SOAL, KUNCI JAWABAN, DAN JAWABAN SISWA. JANGAN MEMOTONG ATAU MENGHENTIKAN PENILAIAN DI TENGAH JALAN!
1. PENCOCOKAN NOMOR SOAL: Kaitkan jawaban siswa dengan nomor soal yang benar.
2. TAHAP PENALARAN SINGKAT: Tulis 1 kalimat penalaran di 'reasoning' membandingkan inti jawaban siswa dan kunci.
3. KRITERIA PILIHAN GANDA: Ambil HANYA huruf pilihan. Abaikan teks setelahnya. Huruf cocok = BENAR 100% (maxScore).
4. KRITERIA BENAR/SALAH - ISIAN SINGKAT & ESSAY: Kesamaan makna/konsep minimal 80% = BENAR SEMPURNA (100% maxScore). Abaikan typo.
5. ATURAN TEKS TIDAK TERBACA: Jika tulisan mengandung kata aneh tak bermakna (UNREADABLE), anggap salah. Jangan menebak.
7. STATUS PENILAIAN ('status'): Kolom ini HANYA boleh diisi dengan "OK" atau "UNREADABLE". Jangan gunakan kata lain seperti "Salah", "Benar", atau "ERROR".

Output WAJIB berupa JSON murni dengan struktur:
{
  "totalScore": number,
  "generalFeedback": "Apresiasi/umpan balik singkat keseluruhan",
  "analysis": [
    {
      "questionNumber": "string",
      "studentAnswer": "teks jawaban siswa",
      "reasoning": "1 kalimat perbandingan",
      "score": number,
      "maxScore": number,
      "analysisText": "Penjelasan singkat",
      "status": "OK"
    }
  ]
}`;

    const textModel = "meta-llama/llama-4-maverick";
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;

    console.log(`[Grade BG] Memanggil model grading: ${textModel} untuk submission ${submissionId}`);

    const textResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://solusi-guru.vercel.app",
        "X-Title": "Solusi Guru",
      },
      body: JSON.stringify({
        model: textModel,
        messages: [{ role: "user", content: textPrompt }],
        temperature: 0.2,
        max_tokens: 8192,
        response_format: { type: "json_object" },
      }),
    });

    if (!textResponse.ok) {
      const errBody = await textResponse.text();
      console.error("[Grade BG] OpenRouter Error:", errBody);
      throw new Error(`OpenRouter API returned ${textResponse.status}`);
    }

    const textData = await textResponse.json();
    const responseText = textData.choices?.[0]?.message?.content || "";

    console.log(`[Grade BG] Penilaian berhasil menggunakan model: ${textModel}`);

    const cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const assessmentResult = JSON.parse(cleanText);

    // 4. Normalize and enforce scores
    let actualTotalScore = 0;
    const normalizedAnalyses: any[] = [];

    if (questions && questions.length > 0) {
      for (const q of questions) {
        const aiAnalysis = assessmentResult.analysis.find((a: any) => {
          const qn = parseInt(String(a.questionNumber).replace(/\D/g, '')) || 0;
          return qn === q.order;
        });

        let finalScore = 0;
        let maxScore = q.maxScore || 10;
        let reasoning = "";
        let analysisText = "Jawaban tidak ditemukan pada hasil pembacaan tulisan.";
        let validStatus = "UNREADABLE";
        let studentAnswer = "[Kosong/Tidak Terjawab]";

        if (aiAnalysis) {
          finalScore = Number(aiAnalysis.score) || 0;
          if (finalScore > maxScore) finalScore = maxScore;
          if (finalScore < 0) finalScore = 0;
          reasoning = aiAnalysis.reasoning || "";
          analysisText = aiAnalysis.analysisText || "";
          studentAnswer = aiAnalysis.studentAnswer || "[Kosong]";
          if (aiAnalysis.status === "UNREADABLE" || aiAnalysis.status === "MANUAL_EDIT") {
            validStatus = aiAnalysis.status;
          } else {
            validStatus = "OK";
          }
        }

        actualTotalScore += finalScore;

        normalizedAnalyses.push({
          questionNumber: String(q.order),
          score: finalScore,
          maxScore,
          reasoning,
          analysisText,
          studentAnswer,
          status: validStatus
        });
      }
    } else {
      // Fallback if there are no structured questions
      assessmentResult.analysis.forEach((analysis: any) => {
        let maxScore = Number(analysis.maxScore) || 10;
        let finalScore = Number(analysis.score) || 0;
        if (finalScore > maxScore) finalScore = maxScore;
        if (finalScore < 0) finalScore = 0;

        actualTotalScore += finalScore;

        let validStatus = "OK";
        if (analysis.status === "UNREADABLE" || analysis.status === "MANUAL_EDIT") {
          validStatus = analysis.status;
        }

        normalizedAnalyses.push({
          ...analysis,
          questionNumber: String(analysis.questionNumber),
          score: finalScore,
          maxScore,
          status: validStatus
        });
      });
    }

    // 5. Delete old assessment if exists to prevent E11000 duplicate key error
    await AIAssessment.deleteMany({ submissionId });

    // 6. Save Assessment and Analysis to DB
    const assessmentRecord = await AIAssessment.create({
      submissionId,
      provider: "OpenRouter-Text",
      suggestedScore: actualTotalScore,
      feedback: assessmentResult.generalFeedback,
      status: "SUCCESS",
    });

    for (const analysis of normalizedAnalyses) {
      const combinedAnalysis = (analysis.reasoning ? `**Penalaran AI:**\n${analysis.reasoning}\n\n**Umpan Balik:**\n` : '') + (analysis.analysisText || "Tidak ada analisis.");

      let validStatus = "OK";
      if (analysis.status === "UNREADABLE" || analysis.status === "MANUAL_EDIT") {
        validStatus = analysis.status;
      }

      await StudentAnswerAnalysis.create({
        assessmentId: assessmentRecord._id,
        questionNumber: analysis.questionNumber,
        studentAnswer: analysis.studentAnswer || "[Kosong]",
        score: analysis.score,
        maxScore: analysis.maxScore,
        analysis: combinedAnalysis,
        status: validStatus,
      });
    }

    // 7. Update submission status to AI_COMPLETED
    await Submission.findByIdAndUpdate(submissionId, {
      status: "AI_COMPLETED",
      submittedAt: new Date()
    });

    console.log(`[Grade BG] ✅ Submission ${submissionId} berhasil dinilai. Skor: ${actualTotalScore}`);

  } catch (error: any) {
    console.error(`[Grade BG] ❌ Gagal memproses submission ${submissionId}:`, error);
    // Update submission status to FAILED so teacher knows it didn't work
    try {
      await Submission.findByIdAndUpdate(submissionId, { status: "FAILED" });
    } catch (updateErr) {
      console.error("[Grade BG] Gagal mengupdate status ke FAILED:", updateErr);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { base64Images, assignmentId, studentId } = body;

    // Support both new format (base64Images) and legacy format (extractedText)
    if ((!base64Images || !Array.isArray(base64Images) || base64Images.length === 0) && !body.extractedText) {
      return NextResponse.json({ error: "Missing required fields: base64Images or extractedText" }, { status: 400 });
    }

    if (!assignmentId || !studentId) {
      return NextResponse.json({ error: "Missing required fields: assignmentId, studentId" }, { status: 400 });
    }

    await dbConnect();

    // 1. Create or update Submission with PROCESSING status immediately
    let submission = await Submission.findOne({ assignmentId, studentId });
    if (!submission) {
      submission = await Submission.create({
        assignmentId,
        studentId,
        status: "PROCESSING",
        submittedAt: new Date()
      });
    } else {
      submission.status = "PROCESSING";
      submission.submittedAt = new Date();
      await submission.save();
    }

    const submissionId = submission._id.toString();

    // 2. Fire-and-forget: Start background processing (don't await)
    if (base64Images && base64Images.length > 0) {
      // New flow: extract + grade all in background
      processFullGradingInBackground(base64Images, assignmentId, submissionId)
        .catch(err => console.error("[Grade API] Background processing error:", err));
    }

    // 3. Return immediately so teacher can continue scanning
    return NextResponse.json({
      success: true,
      submissionId,
      status: "PROCESSING",
      message: "AI sedang menganalisis tugas. Anda bisa melanjutkan foto tugas siswa berikutnya."
    });

  } catch (error: any) {
    console.error("[Grade API] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process" }, { status: 500 });
  }
}
