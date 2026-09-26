import { NextRequest, NextResponse } from "next/server";
import { groqRateLimiter } from "@/modules/ai/rateLimiter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import { Assignment, AssignmentAttachment, AssignmentQuestion } from "@/models/Assignment";
import { AIAssessment, StudentAnswerAnalysis, Submission } from "@/models/Submission";

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

    // 1. Fetch assignment details
    const assignment = await Assignment.findById(assignmentId).lean();
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
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
0. WAJIB MENILAI KESELURUHAN SOAL TANPA TERKECUALI!
1. PENCOCOKAN NOMOR SOAL: Kaitkan jawaban siswa dengan nomor soal yang benar.
2. TAHAP PENALARAN SINGKAT: Tulis 1 kalimat penalaran di 'reasoning' membandingkan inti jawaban siswa dan kunci.
3. KRITERIA BENAR/SALAH - PILIHAN GANDA: Ambil HANYA huruf pilihan. Abaikan teks setelahnya. Huruf cocok = BENAR 100% (maxScore).
4. KRITERIA BENAR/SALAH - ISIAN SINGKAT & ESSAY: Kesamaan makna/konsep minimal 80% = BENAR SEMPURNA (100% maxScore). Abaikan typo.
5. ATURAN TEKS TIDAK TERBACA: Jika tulisan mengandung kata aneh tak bermakna (UNREADABLE), anggap salah. Jangan menebak.
6. UMPAN BALIK EDUKATIF ('analysisText'): Berikan apresiasi jika benar. Jelaskan alasan jika salah.

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

    const { key } = await groqRateLimiter.waitForKey(30000);
    const textModel = "openai/gpt-oss-120b";

    const textResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: textModel,
        messages: [{ role: "user", content: textPrompt }],
        temperature: 0.2,
        max_tokens: 4096,
        response_format: { type: "json_object" },
      }),
    });

    if (!textResponse.ok) {
      const errBody = await textResponse.text();
      console.error("[Grade Text API] Groq Error:", errBody);
      throw new Error(`Groq API returned ${textResponse.status}`);
    }

    const textData = await textResponse.json();
    const responseText = textData.choices?.[0]?.message?.content || "";
    const cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const assessmentResult = JSON.parse(cleanText);

    // 4. Create Submission record (if not exists)
    let submission = await Submission.findOne({ assignmentId, studentId });
    if (!submission) {
      submission = await Submission.create({
        assignmentId,
        studentId,
        status: "GRADED",
        submittedAt: new Date()
      });
    } else {
      submission.status = "GRADED";
      submission.submittedAt = new Date();
      await submission.save();
    }

    // 5. Normalize and enforce scores
    let actualTotalScore = 0;
    const normalizedAnalyses = assessmentResult.analysis.map((analysis: any) => {
      const questionOrder = parseInt(String(analysis.questionNumber).replace(/\D/g, '')) || 0;
      let maxScore = Number(analysis.maxScore) || 10;
      
      const matchedQuestion = questions.find(q => q.order === questionOrder);
      if (matchedQuestion && matchedQuestion.maxScore !== undefined) {
        maxScore = matchedQuestion.maxScore;
      }
      
      let finalScore = Number(analysis.score) || 0;
      if (finalScore > maxScore) finalScore = maxScore;
      if (finalScore < 0) finalScore = 0;
      
      actualTotalScore += finalScore;
      
      return {
        ...analysis,
        questionNumber: String(analysis.questionNumber),
        score: finalScore,
        maxScore
      };
    });

    // 6. Delete old assessment if exists to prevent E11000 duplicate key error
    await AIAssessment.deleteMany({ submissionId: submission._id });
    // Note: We don't have direct link from submission to StudentAnswerAnalysis,
    // but StudentAnswerAnalysis is linked to assessmentId which we just orphaned/deleted.
    // To be clean, we should delete them, but deleting AIAssessment is enough to avoid the crash.

    // 7. Save Assessment and Analysis to DB
    const assessmentRecord = await AIAssessment.create({
      submissionId: submission._id,
      provider: "Groq-Text",
      suggestedScore: actualTotalScore,
      feedback: assessmentResult.generalFeedback,
      status: "SUCCESS",
    });

    for (const analysis of normalizedAnalyses) {
      const combinedAnalysis = (analysis.reasoning ? `**Penalaran AI:**\n${analysis.reasoning}\n\n**Umpan Balik:**\n` : '') + (analysis.analysisText || "Tidak ada analisis.");
      await StudentAnswerAnalysis.create({
        assessmentId: assessmentRecord._id,
        questionNumber: analysis.questionNumber,
        studentAnswer: analysis.studentAnswer || "[Kosong]",
        score: analysis.score,
        maxScore: analysis.maxScore,
        analysis: combinedAnalysis,
        status: analysis.status || "OK",
      });
    }

    return NextResponse.json({
      success: true,
      submissionId: submission._id,
      score: actualTotalScore,
      feedback: assessmentResult.generalFeedback
    });

  } catch (error: any) {
    console.error("[Grade Text API] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to grade text" }, { status: 500 });
  }
}
