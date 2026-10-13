import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { TeacherProfile } from "@/models/Profile";
import { Material } from "@/models/Material";
import { Class } from "@/models/Class";
import { BorneoEduQuestion } from "@/models/BorneoEdu";
import { Assignment, AssignmentStatus, AssignmentQuestion } from "@/models/Assignment";
import { callAICascade } from "@/modules/ai/aiCascade";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized. Hanya guru yang dapat mengakses fitur ini." }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const teacherProfile = await TeacherProfile.findOne({ userId: user._id }).lean();
    if (!teacherProfile) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      materialId,
      classId,
      targetType, // 'BORNEO_EDU' | 'NEW_ASSIGNMENT'
      questionCount = 10,
      customPrompt = "",
      assignmentTitle = "",
      deadline = null,
    } = body;

    if (!materialId || !classId) {
      return NextResponse.json({ error: "Materi dan Kelas Tujuan wajib dipilih." }, { status: 400 });
    }

    // 1. Ambil data materi dan pastikan materi berada pada kelas yang sama dengan tujuan kelas
    const material = await Material.findById(materialId).lean();
    if (!material) {
      return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });
    }

    if (material.classId.toString() !== classId.toString()) {
      return NextResponse.json({
        error: "Materi yang dipilih harus berada pada kelas yang sama dengan tujuan kelas.",
      }, { status: 400 });
    }

    const cls = await Class.findById(classId).lean();
    // Build materialText with best available content — support both AI-generated and manually uploaded materials
    let materialText = "";
    if (material.content && material.content.trim().length > 50) {
      // AI-generated materials or extracted text from PDF/DOCX
      materialText = material.content;
    } else if (material.summary && material.summary.trim().length > 30) {
      materialText = material.summary;
    } else {
      // Fallback for video/PPT uploads or files with no extractable text
      materialText = `Judul Materi: ${material.title}. ${material.description || ""}`;
    }
    const isSparseContent = materialText.length < 200;
    const count = Math.min(25, Math.max(3, Number(questionCount) || 5));

    // =========================================================================
    // CASE A: TARGET ADALAH GAME BORNEO EDU
    // =========================================================================
    if (targetType === "BORNEO_EDU") {
      let questionsList: any[] = [];

      const prompt = `Anda adalah pembuat soal kurikulum game edukasi platformer 2D "Borneo Edu".
Buatkan ${count} soal pilihan ganda (A, B, C, D) yang edukatif dan menarik berdasarkan materi berikut:
---
Judul Materi: ${material.title}
Isi Materi:
${materialText.substring(0, 5000)}
---
${isSparseContent ? `PERHATIAN: Teks materi yang tersedia sangat terbatas. Gunakan pengetahuan umum Anda tentang topik "${material.title}" untuk membuat soal yang relevan dan berkualitas. Pastikan soal tetap akurat secara ilmiah dan sesuai kurikulum Indonesia.\n` : ""}
Ketentuan Soal Game:
- Distribusikan soal dari level awal sampai level akhir (World 1 sampai 5, Level 1 sampai 25).
- Tipe soal bergradasi: 'Pengetahuan', 'Pemahaman', 'Penerapan', 'Analisis', 'HOTS'.
- Difficulty: 'EASY', 'MEDIUM', 'HARD', 'HOTS', 'BOSS'.
- Jika soal untuk level kelipatan 5 (Level 5, 10, 15, 20, 25), jadikan sebagai 'isBossQuestion: true' dan difficulty 'BOSS'.
- Jawaban benar harus tepat satu (A, B, C, atau D).
- Berikan penjelasan singkat namun padat pada setiap soal.

Format JSON yang DIHARUSKAN (hanya array JSON murni tanpa markdown pembungkus):
[
  {
    "world": 1,
    "level": 1,
    "question": "Pertanyaan...",
    "options": {
      "A": "Pilihan A",
      "B": "Pilihan B",
      "C": "Pilihan C",
      "D": "Pilihan D"
    },
    "correctAnswer": "A",
    "difficulty": "EASY",
    "stage": "Pengetahuan",
    "isBossQuestion": false,
    "explanation": "Penjelasan..."
  }
]`;

        try {
          const rawText = await callAICascade({
            prompt,
            responseJson: true,
            maxTokens: 4096,
            temperature: 0.3,
            logPrefix: "[Borneo Question AI Cascade]",
          });

          // Parse JSON murni dari respon AI
          const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
          let parsed: any = null;
          try {
            parsed = JSON.parse(cleaned);
          } catch {
            const match = rawText.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (match) parsed = JSON.parse(match[0]);
          }

          if (Array.isArray(parsed) && parsed.length > 0) {
            questionsList = parsed;
          } else if (parsed && Array.isArray(parsed.questions)) {
            questionsList = parsed.questions;
          }
        } catch (aiErr) {
          console.warn("[Borneo Question AI Cascade Warning]", aiErr);
        }

      // Fallback jika AI tidak tersedia
      if (questionsList.length === 0) {
        for (let i = 1; i <= count; i++) {
          const world = Math.min(5, Math.ceil(i / 5));
          const levelInWorld = ((i - 1) % 5) + 1;
          const globalLevel = (world - 1) * 5 + levelInWorld;
          const isBoss = levelInWorld === 5;
          const stages = ['Pengetahuan', 'Pemahaman', 'Penerapan', 'Analisis', 'HOTS'] as const;
          const stage = stages[Math.min(4, world - 1)];

          questionsList.push({
            world,
            level: globalLevel,
            question: `Berdasarkan materi "${material.title}", manakah pernyataan yang paling tepat mengenai konsep utama tahap ${stage}?`,
            options: {
              A: `Konsep dasar ${material.title} yang telah dipelajari`,
              B: `Penerapan tidak langsung tanpa dasar teori`,
              C: `Definisi yang bertentangan dengan materi`,
              D: `Pernyataan yang belum terbukti kebenarannya`,
            },
            correctAnswer: 'A',
            difficulty: isBoss ? 'BOSS' : world <= 2 ? 'EASY' : world <= 4 ? 'MEDIUM' : 'HARD',
            stage,
            isBossQuestion: isBoss,
            explanation: `Pilihan A adalah jawaban tepat yang selaras dengan pembahasan ${material.title}.`,
          });
        }
      }

      // Simpan soal ke database BorneoEduQuestion yang terasosiasi dengan classId!
      const insertedOps = questionsList.map((q, idx) => {
        const questionId = `gen_${classId}_${material._id}_${Date.now()}_${idx + 1}`;
        return {
          questionId,
          world: q.world || 1,
          level: q.level || idx + 1,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer || 'A',
          difficulty: q.difficulty || 'MEDIUM',
          stage: q.stage || 'Pengetahuan',
          isBossQuestion: Boolean(q.isBossQuestion),
          classId: cls?._id,
          className: cls?.name,
          materialId: material._id,
        };
      });

      // Hapus soal lama untuk kelas & materi ini jika ada, lalu masukkan yang baru
      await BorneoEduQuestion.deleteMany({ classId: cls?._id, materialId: material._id });
      await BorneoEduQuestion.insertMany(insertedOps);

      return NextResponse.json({
        success: true,
        targetType: "BORNEO_EDU",
        message: `Berhasil membuat ${insertedOps.length} soal Borneo EDU untuk ${cls?.name || "Kelas"} berdasarkan materi "${material.title}".`,
        count: insertedOps.length,
        className: cls?.name,
      });
    }

    // =========================================================================
    // CASE B: TARGET ADALAH TUGAS BARU (DITULIS TANGAN OLEH SISWA)
    // Soal di-generate BESERTA KUNCI JAWABAN agar AI grader dapat menilai.
    // =========================================================================
    if (targetType === "NEW_ASSIGNMENT") {
      interface EssayQuestionWithKey {
        question: string;
        questionType: "ESSAY" | "ISIAN_SINGKAT";
        idealAnswer: string;  // Kunci jawaban / jawaban ideal untuk penilaian AI
        maxScore: number;
      }

      let structuredQuestions: EssayQuestionWithKey[] = [];
      const essayCount = Math.min(count, 10);
      const scorePerQuestion = Math.round(100 / essayCount);

      const prompt = `Anda adalah guru ahli kurikulum Indonesia. Buatkan ${essayCount} soal untuk siswa sekolah berdasarkan materi berikut:

Judul Materi: ${material.title}
Teks Materi:
${materialText.substring(0, 5000)}
${isSparseContent ? `\nPERHATIAN: Teks materi yang tersedia sangat terbatas. Gunakan pengetahuan umum Anda tentang topik "${material.title}" untuk membuat soal yang relevan, akurat, dan sesuai kurikulum Indonesia.\n` : ""}

KETENTUAN PENTING:
1. Soal-soal ini akan DIKERJAKAN DENGAN TULISAN TANGAN DI BUKU TULIS oleh siswa, kemudian difoto dan dinilai oleh AI.
2. Setiap soal WAJIB dilengkapi dengan JAWABAN IDEAL (kunci jawaban) yang lengkap dan detail. Jawaban ideal ini digunakan sebagai referensi penilaian otomatis oleh AI.
3. Variasikan tipe soal antara:
   - "ESSAY": Soal uraian yang membutuhkan penjelasan panjang (2-4 kalimat jawaban ideal)
   - "ISIAN_SINGKAT": Soal jawaban singkat (1-3 kata/frase jawaban ideal)
4. Buatkan soal yang mengasah pemahaman konsep, penalaran, dan analisis kritis.
5. Pastikan soal bergradasi dari mudah ke sulit.
6. Jawaban ideal harus mencakup SEMUA poin kunci yang diharapkan ada dalam jawaban siswa.
7. Untuk soal ISIAN_SINGKAT, jika ada beberapa kemungkinan jawaban benar, tuliskan semua dipisah koma.

Format JSON yang DIHARUSKAN (hanya array JSON murni tanpa markdown):
[
  {
    "question": "Jelaskan pengertian ... dan sebutkan 3 contoh penerapannya dalam kehidupan sehari-hari!",
    "questionType": "ESSAY",
    "idealAnswer": "... adalah ... yang berfungsi untuk .... Tiga contoh penerapannya: 1) ..., 2) ..., 3) ...",
    "maxScore": ${scorePerQuestion}
  },
  {
    "question": "Siapakah tokoh yang pertama kali menemukan ...?",
    "questionType": "ISIAN_SINGKAT",
    "idealAnswer": "Nama Tokoh, Nama Alternatif",
    "maxScore": ${scorePerQuestion}
  }
]`;

        try {
          const rawText = await callAICascade({
            prompt,
            responseJson: true,
            maxTokens: 4096,
            temperature: 0.3,
            logPrefix: "[Essay Question AI Cascade]",
          });

          // Parse JSON murni dari respon AI
          const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
          let parsed: any = null;
          try {
            parsed = JSON.parse(cleaned);
          } catch {
            const match = rawText.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (match) parsed = JSON.parse(match[0]);
          }

          const questionArray = Array.isArray(parsed) ? parsed : (parsed?.questions || []);
          if (Array.isArray(questionArray) && questionArray.length > 0) {
            structuredQuestions = questionArray.map((q: any) => ({
              question: q.question || "",
              questionType: q.questionType === "ISIAN_SINGKAT" ? "ISIAN_SINGKAT" : "ESSAY",
              idealAnswer: q.idealAnswer || q.ideal_answer || q.answer || "",
              maxScore: q.maxScore || scorePerQuestion,
            }));
          }
        } catch (aiErr) {
          console.warn("[Essay Question AI Cascade Warning]", aiErr);
        }

      // Fallback if AI fails
      if (structuredQuestions.length === 0) {
        structuredQuestions = [
          {
            question: `Jelaskan dengan kata-kata Anda sendiri konsep utama yang dipelajari pada materi "${material.title}"!`,
            questionType: "ESSAY",
            idealAnswer: `Konsep utama dari materi "${material.title}" mencakup pengertian dasar, prinsip-prinsip utama, dan penerapannya. Siswa diharapkan mampu menjelaskan definisi, mengidentifikasi komponen kunci, dan menghubungkan konsep dengan kehidupan sehari-hari.`,
            maxScore: 35,
          },
          {
            question: `Mengapa materi "${material.title}" penting untuk dipahami? Sebutkan setidaknya 2 alasan!`,
            questionType: "ESSAY",
            idealAnswer: `Materi "${material.title}" penting karena: 1) Memberikan dasar pemahaman yang diperlukan untuk topik lanjutan, 2) Memiliki relevansi langsung dengan kehidupan sehari-hari dan perkembangan teknologi modern.`,
            maxScore: 30,
          },
          {
            question: `Berikan satu contoh konkret penerapan materi "${material.title}" di kehidupan sehari-hari atau di lingkungan sekitar Anda!`,
            questionType: "ESSAY",
            idealAnswer: `Contoh penerapan materi ini dapat ditemukan dalam berbagai aspek kehidupan, misalnya dalam teknologi, lingkungan, atau aktivitas sehari-hari. Siswa harus mampu memberikan contoh spesifik yang menunjukkan pemahaman terhadap konsep yang dipelajari.`,
            maxScore: 35,
          },
        ];
      }

      // Format questions for display in the assignment description
      const formattedQuestions = structuredQuestions.map((q, idx) => {
        return `${idx + 1}. ${q.question}`;
      }).join("\n\n");

      // Build answer key text for the assignment's aiAnswerKey field
      const answerKeyText = structuredQuestions.map((q, idx) => {
        return `Nomor ${idx + 1} (${q.questionType === "ISIAN_SINGKAT" ? "Isian Singkat" : "Essay"}, Bobot: ${q.maxScore}):\nSoal: ${q.question}\nKunci Jawaban: ${q.idealAnswer}`;
      }).join("\n\n");

      const title = assignmentTitle || `Tugas Tulisan Tangan: ${material.title}`;
      const instructions = `PETUNJUK PENGERJAAN TULISAN TANGAN:\n1. Kerjakan semua soal di bawah ini di BUKU TULIS Anda dengan rapi dan tulisan tangan yang jelas terbaca.\n2. Tuliskan Nama Lengkap, Nomor Absen, dan Kelas di bagian atas lembar buku tulis.\n3. Setelah selesai, gunakan fitur "Kamera Kumpulkan Tugas" untuk memotret lembar jawaban Anda dan kirimkan ke sistem.`;

      // Create the assignment with answer key embedded
      const newAssignment = await Assignment.create({
        title,
        sessionName: cls?.name || "Tugas Kelas",
        classId: cls?._id,
        subjectId: material.subjectId || null,
        teacherId: teacherProfile._id,
        description: `Soal Tugas Mandiri (Dikerjakan di Buku Tulis):\n\n${formattedQuestions}`,
        instructions,
        deadline: deadline ? new Date(deadline) : null,
        maxPages: 4,
        status: AssignmentStatus.PUBLISHED,
        aiAnswerKey: answerKeyText,
      });

      // Create AssignmentQuestion records WITH correctAnswer for AI grading
      const questionRecords = structuredQuestions.map((q, idx) => ({
        assignmentId: newAssignment._id,
        order: idx + 1,
        questionType: q.questionType,
        maxScore: q.maxScore,
        correctAnswer: q.idealAnswer,
      }));

      await AssignmentQuestion.deleteMany({ assignmentId: newAssignment._id });
      await AssignmentQuestion.insertMany(questionRecords);

      return NextResponse.json({
        success: true,
        targetType: "NEW_ASSIGNMENT",
        message: `Berhasil membuat Tugas Baru "${title}" untuk ${cls?.name} dengan ${structuredQuestions.length} soal beserta kunci jawaban untuk penilaian otomatis.`,
        assignmentId: newAssignment._id,
        questionsCount: structuredQuestions.length,
        hasAnswerKeys: true,
      });
    }

    return NextResponse.json({ error: "Tujuan penugasan tidak valid (pilih Borneo EDU atau Tugas Baru)." }, { status: 400 });
  } catch (error: any) {
    console.error("[Generate Questions Error]", error);
    return NextResponse.json({ error: error.message || "Gagal membuat soal dari AI" }, { status: 500 });
  }
}
