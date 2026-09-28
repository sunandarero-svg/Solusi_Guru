import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import { Assignment, AssignmentAttachment, AssignmentQuestion } from "@/models/Assignment";
import { AIAssessment, StudentAnswerAnalysis, Submission } from "@/models/Submission";

/**
 * Background grading function — runs after the HTTP response has been sent.
 * Creates the AI assessment and updates the submission status to AI_COMPLETED or FAILED.
 */
async function processGradingInBackground(
  extractedText: string,
  assignmentId: string,
  submissionId: string
) {
  try {
    await dbConnect();

    // 1. Fetch assignment details
    const assignment = await Assignment.findById(assignmentId).lean();
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // 2. Fetch answer key and questions
    let answerKey = "";
    const attachment = await AssignmentAttachment.findOne({
      assignmentId,
      aiAnswerKey: { $exists: true, $nin: [null, ""] },
    }).select("aiAnswerKey").lean();
    if (attachment?.aiAnswerKey) {
      answerKey = attachment.aiAnswerKey;
    }

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
${extractedText}
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

    console.log(`[Grade Text BG] Memanggil model (Primary): ${textModel} untuk submission ${submissionId}`);

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
      console.error("[Grade Text BG] OpenRouter Error:", errBody);
      throw new Error(`OpenRouter API returned ${textResponse.status}`);
    }

    const textData = await textResponse.json();
    const responseText = textData.choices?.[0]?.message?.content || "";

    console.log(`[Grade Text BG] Penilaian berhasil menggunakan model: ${textModel}`);

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
        const questionOrder = parseInt(String(analysis.questionNumber).replace(/\D/g, '')) || 0;
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
    // Note: We don't have direct link from submission to StudentAnswerAnalysis,
    // but StudentAnswerAnalysis is linked to assessmentId which we just orphaned/deleted.
    // To be clean, we should delete them, but deleting AIAssessment is enough to avoid the crash.

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

    console.log(`[Grade Text BG] ✅ Submission ${submissionId} berhasil dinilai. Skor: ${actualTotalScore}`);

  } catch (error: any) {
    console.error(`[Grade Text BG] ❌ Gagal menilai submission ${submissionId}:`, error);
    // Update submission status to FAILED so teacher knows it didn't work
    try {
      await Submission.findByIdAndUpdate(submissionId, { status: "FAILED" });
    } catch (updateErr) {
      console.error("[Grade Text BG] Gagal mengupdate status ke FAILED:", updateErr);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { extractedText, assignmentId, studentId } = await req.json();

    if (!extractedText || !assignmentId || !studentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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

    // 2. Fire-and-forget: Start background grading (don't await)
    processGradingInBackground(extractedText, assignmentId, submissionId)
      .catch(err => console.error("[Grade Text API] Background processing error:", err));

    // 3. Return immediately so teacher can continue scanning
    return NextResponse.json({
      success: true,
      submissionId,
      status: "PROCESSING",
      message: "AI sedang menganalisis tugas. Anda bisa melanjutkan foto tugas siswa berikutnya."
    });

  } catch (error: any) {
    console.error("[Grade Text API] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to grade text" }, { status: 500 });
  }
}
