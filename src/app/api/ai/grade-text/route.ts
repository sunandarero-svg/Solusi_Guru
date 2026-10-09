import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import { Assignment, AssignmentAttachment, AssignmentQuestion } from "@/models/Assignment";
import { AIAssessment, StudentAnswerAnalysis, Submission } from "@/models/Submission";
import { GoogleGenAI } from "@google/genai";
import { attachmentService } from "@/modules/attachment/attachmentService";
import { compressImageForOCR } from "@/modules/ai/compressImageForOCR";
import { gradeObjectiveQuestion, hasValidCorrectAnswer } from "@/modules/grading/systemGrader";

interface CompressedImage {
  base64Data: string;
  mimeType: string;
}

/**
 * Compress a single base64 image for AI processing.
 */
async function compressSingleImage(base64Image: string): Promise<CompressedImage> {
  const rawBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
  const mimeMatch = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  const rawMimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

  const { compressedBase64, compressedMimeType, savings } =
    await compressImageForOCR(rawBase64, rawMimeType);
  console.log(`[Grade BG] Kompresi gambar: ${savings}`);

  return { base64Data: compressedBase64, mimeType: compressedMimeType };
}

/**
 * Build the unified prompt that combines OCR reading + grading in one step.
 */
function buildUnifiedPrompt(
  answerKey: string,
  questions: any[],
  imageCount: number
): string {
  let answerKeyInstruction = "";
  if (answerKey && answerKey.trim().length > 0) {
    answerKeyInstruction = `KUNCI JAWABAN REFERENSI:\n${answerKey}\n`;
  }

  let questionsInstruction = "";
  if (questions && questions.length > 0) {
    const qList = questions.map((q: any) => {
      let line = `Nomor ${q.order}: Tipe ${q.questionType}, Bobot ${q.maxScore}`;
      if (q.correctAnswer && (q.questionType === 'ISIAN_SINGKAT' || q.questionType === 'ESSAY')) {
        line += `, Kunci/Poin: ${q.correctAnswer}`;
      }
      return line;
    }).join("\\n");
    questionsInstruction = `KONFIGURASI SOAL & BOBOT:\n${qList}\nNilailah setiap soal siswa berpatokan pada bobot maksimal tersebut (maxScore).\n`;
  } else {
    questionsInstruction = `2. Identifikasi jumlah total soal (N). Alokasikan nilai maksimal (maxScore) proporsional, yaitu 100 / N.`;
  }

  return `Anda adalah asisten guru (AI) penilai tugas siswa. Tugas Anda terdiri dari DUA TAHAP yang harus dilakukan secara berurutan:

=== TAHAP 1: BACA TULISAN TANGAN (OCR) ===
${imageCount > 1 ? `Terdapat ${imageCount} gambar halaman jawaban siswa yang harus dibaca semuanya secara BERURUTAN (Halaman 1, 2, dst).` : 'Terdapat 1 gambar halaman jawaban siswa.'}

Patuhi aturan OCR berikut:
1. PENANGANAN KOREKSI & CORETAN (SANGAT PENTING): Identifikasi teks, huruf, atau angka yang dicoret (strikethrough), dicoret tebal, atau ditimpa oleh penulis. ABAIKAN bagian tersebut sepenuhnya. JANGAN transkripsikan teks yang sudah dibatalkan. Hanya ekstrak teks FINAL yang dipertahankan/dimaksudkan oleh penulis.
2. STRUKTUR & HIERARKI: Pertahankan hierarki dokumen asli. Pertahankan penomoran persis seperti urutan di dokumen.
3. TRANSKRIPSI VERBATIM (APA ADANYA): Ekstrak teks persis seperti yang tertulis, termasuk variasi ejaan atau singkatan yang digunakan penulis. Jangan melakukan koreksi tata bahasa pada teks yang valid.
4. TEKS TIDAK TERBACA: Jika tulisan mengandung kata aneh tak bermakna (UNREADABLE), tandai sebagai tidak terbaca. Jangan menebak.
5. WAJIB BAHASA INDONESIA: PASTIKAN seluruh hasil pembacaan teks ditulis menggunakan bahasa Indonesia. JANGAN PERNAH menerjemahkan teks tersebut ke bahasa Inggris atau bahasa lain.

=== TAHAP 2: NILAI JAWABAN SISWA ===
Setelah membaca SEMUA halaman, cocokkan jawaban siswa dengan kunci jawaban dan berikan penilaian.

${answerKeyInstruction}
${questionsInstruction}

INSTRUKSI PENILAIAN & ALOKASI SKOR:
0. WAJIB MENILAI KESELURUHAN SOAL TANPA TERKECUALI! PASTIKAN JUMLAH ITEM DALAM ARRAY 'analysis' SAMA PERSIS DENGAN JUMLAH SOAL, KUNCI JAWABAN, DAN JAWABAN SISWA. JANGAN MEMOTONG ATAU MENGHENTIKAN PENILAIAN DI TENGAH JALAN!
1. PENCOCOKAN NOMOR SOAL: Kaitkan jawaban siswa dengan nomor soal yang benar.
2. TAHAP PENALARAN SINGKAT: Tulis 1 kalimat penalaran di 'reasoning' membandingkan inti jawaban siswa dan kunci.
3. KRITERIA PILIHAN GANDA: Ambil HANYA huruf pilihan. Abaikan teks setelahnya. Huruf cocok = BENAR 100% (maxScore).
4. KRITERIA ISIAN SINGKAT (SKOR PARSIAL - SANGAT PENTING):
   Penilaian ISIAN SINGKAT harus FLEKSIBEL. Jawaban TIDAK harus exact match. Berikan skor GRADUAL berdasarkan kecocokan makna/konsep:
   - 100% maxScore: Jawaban identik, sinonim sempurna, atau hanya typo minor (cth: "fotosintesa" ≈ "fotosintesis", "Jkt" ≈ "Jakarta")
   - 75% maxScore: Jawaban benar konsepnya tapi beda kata/ejaan signifikan (cth: "pengumuman kemerdekaan" ≈ "proklamasi")
   - 50% maxScore: Jawaban sebagian benar, menyebutkan bagian dari konsep (cth: "Soekarno" ketika kunci "Soekarno-Hatta")
   - 0% maxScore: Jawaban salah total, tidak relevan, atau kosong
   ABAIKAN: typo, kapitalisasi, tanda baca, spasi ekstra.
4b. KRITERIA ESSAY (SKOR PARSIAL - SANGAT PENTING):
   Penilaian ESSAY harus berdasarkan SEBERAPA LENGKAP poin-poin kunci terjawab. Berikan skor GRADUAL:
   - 100% maxScore: Semua poin kunci terjawab lengkap, penjelasan tepat & runtut
   - 75% maxScore: Sebagian besar poin kunci ada, penjelasan cukup baik
   - 50% maxScore: Setengah poin kunci terjawab, atau penjelasan kurang lengkap
   - 25% maxScore: Hanya sedikit poin kunci, jawaban menunjukkan sedikit pemahaman
   - 0% maxScore: Jawaban salah total, tidak relevan, atau kosong
   JANGAN berikan 0 jika siswa menunjukkan USAHA menjawab dengan benar sebagian.
5. ATURAN TEKS TIDAK TERBACA: Jika tulisan mengandung kata aneh tak bermakna (UNREADABLE), anggap salah. Jangan menebak.
7. STATUS PENILAIAN ('status'): Kolom ini HANYA boleh diisi dengan "OK" atau "UNREADABLE". Jangan gunakan kata lain seperti "Salah", "Benar", atau "ERROR".

Output WAJIB berupa JSON murni tanpa markdown, tanpa backticks, dan TANPA KALIMAT PEMBUKA/PENUTUP seperti 'Berikut adalah...'. DILARANG KERAS menambahkan teks di luar struktur JSON ini:
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
}

/**
 * Call AI with multi-image support using fallback chain.
 * Fallback chain (unchanged): Groq Qwen (primary) → Gemini 3.8 Flash → OpenRouter Llama 4 Maverick
 */
async function callUnifiedAI(
  prompt: string,
  compressedImages: CompressedImage[]
): Promise<string> {
  // 1. PRIMARY: Groq (Qwen)
  try {
    const { groqRateLimiter } = await import("@/modules/ai/rateLimiter");
    const { key } = await groqRateLimiter.waitForKey(30000);
    const primaryModel = "qwen/qwen3.8-27b";
    console.log(`[Grade BG] Memanggil model unified (Primary - Groq): ${primaryModel}`);

    const contentParts: any[] = [{ type: "text", text: prompt }];
    for (const img of compressedImages) {
      contentParts.push({
        type: "image_url",
        image_url: { url: `data:${img.mimeType};base64,${img.base64Data}` }
      });
    }

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: primaryModel,
        messages: [{ role: "user", content: contentParts }],
        temperature: 0.2,
        max_tokens: 16384,
      }),
    });

    if (!groqResponse.ok) {
      const errBody = await groqResponse.text();
      console.error("[Grade BG] Groq Primary Error:", errBody);
      throw new Error(`Groq API returned ${groqResponse.status} - ${errBody}`);
    }

    const groqData = await groqResponse.json();
    const text = groqData.choices?.[0]?.message?.content || "";
    if (!text) throw new Error("Empty response from Groq");
    console.log(`[Grade BG] Unified OCR+Grade berhasil menggunakan Groq: ${primaryModel}`);
    return text;
  } catch (groqError: any) {
    console.warn("[Grade BG] Groq unified gagal, mencoba fallback Gemini 3.8 Flash...", groqError?.message);

    // 2. FALLBACK 1: Gemini 3.8 Flash
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const fallbackModel1 = "gemini-3.8-flash";
      console.log(`[Grade BG] Memanggil model unified (Fallback 1 - Gemini): ${fallbackModel1}`);

      const contents: any[] = [prompt];
      for (const img of compressedImages) {
        contents.push({
          inlineData: {
            data: img.base64Data,
            mimeType: img.mimeType
          }
        });
      }

      const response = await ai.models.generateContent({
        model: fallbackModel1,
        contents,
        config: {
          temperature: 0.2,
          maxOutputTokens: 16384,
        }
      });

      const text = response.text || "";
      if (!text) throw new Error("Empty response from Gemini fallback");
      console.log(`[Grade BG] Unified OCR+Grade berhasil menggunakan Gemini: ${fallbackModel1}`);
      return text;
    } catch (geminiError: any) {
      console.warn("[Grade BG] Gemini unified juga gagal, mencoba fallback OpenRouter berantai...", geminiError?.message);

      // 3. FALLBACK 2: OpenRouter (Multiple Models Chain)
      const openRouterApiKey = process.env.OPENROUTER_API_KEY;
      if (!openRouterApiKey) throw new Error("OPENROUTER_API_KEY is not configured");

      const contentParts: any[] = [{ type: "text", text: prompt }];
      for (const img of compressedImages) {
        contentParts.push({
          type: "image_url",
          image_url: { url: `data:${img.mimeType};base64,${img.base64Data}` }
        });
      }

      const openRouterModels = [
        "nvidia/llama-nemotron-rerank-vl-1b-v2:free",
        "qwen/qwen3.8-27b:free",
        "meta-llama/llama-4-maverick"
      ];

      let lastOrError: any;

      for (const orModel of openRouterModels) {
        try {
          console.log(`[Grade BG] Memanggil model unified (OpenRouter Fallback): ${orModel}`);

          const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${openRouterApiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://solusi-guru.vercel.app",
              "X-Title": "Solusi Guru",
            },
            body: JSON.stringify({
              model: orModel,
              messages: [{ role: "user", content: contentParts }],
              temperature: 0.2,
              max_tokens: 16384,
            }),
          });

          if (!orResponse.ok) {
            const errBody = await orResponse.text();
            console.error(`[Grade BG] OpenRouter Fallback Error (${orModel}):`, errBody);
            throw new Error(`OpenRouter API returned ${orResponse.status} - ${errBody}`);
          }

          const orData = await orResponse.json();
          const text = orData.choices?.[0]?.message?.content || "";
          if (!text) throw new Error(`Empty response from OpenRouter fallback (${orModel})`);
          
          console.log(`[Grade BG] Unified OCR+Grade berhasil menggunakan OpenRouter: ${orModel}`);
          return text;
        } catch (orError: any) {
          console.warn(`[Grade BG] OpenRouter model ${orModel} gagal: ${orError?.message}. Mencoba model selanjutnya...`);
          lastOrError = orError;
        }
      }
      
      throw new Error(`Semua fallback OpenRouter gagal. Error terakhir: ${lastOrError?.message}`);
    }
  }
}

/**
 * Background function: Unified Extract + Grade in ONE AI call per student, then save results.
 * Runs after HTTP response has been sent.
 */
async function processFullGradingInBackground(
  base64Images: string[],
  assignmentId: string,
  submissionId: string
) {
  try {
    await dbConnect();

    // === STEP 1: Compress all images ===
    console.log(`[Grade BG] Mulai kompresi ${base64Images.length} gambar untuk submission ${submissionId}`);
    const compressedImages: CompressedImage[] = [];
    for (let i = 0; i < base64Images.length; i++) {
      try {
        const compressed = await compressSingleImage(base64Images[i]);
        compressedImages.push(compressed);
        console.log(`[Grade BG] Halaman ${i + 1}/${base64Images.length} berhasil dikompres`);
      } catch (err: any) {
        console.error(`[Grade BG] Gagal kompresi halaman ${i + 1}:`, err.message);
        // Skip gambar yang gagal dikompres
      }
    }

    if (compressedImages.length === 0) {
      throw new Error("Tidak ada gambar yang berhasil diproses.");
    }

    // === STEP 2: Fetch assignment data (parallel) ===
    console.log(`[Grade BG] Mengambil data tugas untuk assignment ${assignmentId}`);
    const [assignment, existingAnswerKey, questions] = await Promise.all([
      Assignment.findById(assignmentId).lean(),
      attachmentService.getAnswerKey(assignmentId),
      AssignmentQuestion.find({ assignmentId }).sort({ order: 1 }).lean()
    ]);

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    const answerKey = existingAnswerKey || "";

    // === STEP 3: Build unified prompt & call AI (1 panggilan untuk OCR + Grade) ===
    const unifiedPrompt = buildUnifiedPrompt(answerKey, questions, compressedImages.length);

    console.log(`[Grade BG] Memanggil AI unified (OCR+Grade) untuk submission ${submissionId} dengan ${compressedImages.length} gambar`);
    const responseText = await callUnifiedAI(unifiedPrompt, compressedImages);

    console.log(`[Grade BG] Respons AI diterima. Parsing JSON...`);

    // === STEP 4: Parse JSON response ===
    let jsonString = responseText;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    const cleanText = jsonString.replace(/```json/gi, "").replace(/```/g, "").trim();
    const assessmentResult = JSON.parse(cleanText);

    // === STEP 5: Normalize and enforce scores ===
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
          studentAnswer = aiAnalysis.studentAnswer || "[Kosong]";

          // === SYSTEM GRADING: Soal objektif dengan kunci jawaban ===
          if (hasValidCorrectAnswer(q)) {
            const systemResult = gradeObjectiveQuestion({
              questionNumber: String(q.order),
              questionType: q.questionType,
              studentAnswer,
              correctAnswer: q.correctAnswer!,
              maxScore
            });
            if (systemResult !== null) {
              finalScore = systemResult.score;
              reasoning = systemResult.reasoning;
              analysisText = systemResult.analysisText;
              studentAnswer = systemResult.studentAnswer;
              validStatus = systemResult.status;
              console.log(`[System Grader] Soal ${q.order} (${q.questionType}): "${studentAnswer}" vs "${q.correctAnswer}" \u2192 ${finalScore}/${maxScore}`);
            } else {
              // System grader tidak yakin (ISIAN_SINGKAT similarity rendah) → fallback ke AI
              finalScore = Number(aiAnalysis.score) || 0;
              if (finalScore > maxScore) finalScore = maxScore;
              if (finalScore < 0) finalScore = 0;
              reasoning = aiAnalysis.reasoning || "";
              analysisText = aiAnalysis.analysisText || "";
              if (aiAnalysis.status === "UNREADABLE" || aiAnalysis.status === "MANUAL_EDIT") {
                validStatus = aiAnalysis.status;
              } else {
                validStatus = "OK";
              }
              console.log(`[AI Fallback] Soal ${q.order} (${q.questionType}): System grader tidak yakin, skor AI: ${finalScore}/${maxScore}`);
            }
          } else {
            // === AI GRADING: Soal non-objektif atau tanpa kunci ===
            finalScore = Number(aiAnalysis.score) || 0;
            if (finalScore > maxScore) finalScore = maxScore;
            if (finalScore < 0) finalScore = 0;
            reasoning = aiAnalysis.reasoning || "";
            analysisText = aiAnalysis.analysisText || "";
            if (aiAnalysis.status === "UNREADABLE" || aiAnalysis.status === "MANUAL_EDIT") {
              validStatus = aiAnalysis.status;
            } else {
              validStatus = "OK";
            }
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

    // === STEP 6: Delete old assessment if exists to prevent E11000 duplicate key error ===
    await AIAssessment.deleteMany({ submissionId });

    // === STEP 7: Save Assessment and Analysis to DB ===
    const assessmentRecord = await AIAssessment.create({
      submissionId,
      provider: "Unified-OCR-Grade",
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

    // === STEP 8: Update submission status to AI_COMPLETED ===
    await Submission.findByIdAndUpdate(submissionId, {
      status: "AI_COMPLETED",
      submittedAt: new Date()
    });

    console.log(`[Grade BG] ✅ Submission ${submissionId} berhasil dinilai (unified OCR+Grade). Skor: ${actualTotalScore}`);

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
      // Unified flow: OCR + Grade all in ONE AI call in background
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
