import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { TeacherProfile } from "@/models/Profile";
import { Material } from "@/models/Material";
import { Class } from "@/models/Class";
import { BorneoEduQuestion } from "@/models/BorneoEdu";
import { Assignment, AssignmentStatus } from "@/models/Assignment";
import { GoogleGenAI } from "@google/genai";

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
    const materialText = material.content || material.summary || material.title || "";

    const apiKey = process.env.GEMINI_API_KEY;
    const count = Math.min(25, Math.max(3, Number(questionCount) || 5));

    // =========================================================================
    // CASE A: TARGET ADALAH GAME BORNEO EDU
    // =========================================================================
    if (targetType === "BORNEO_EDU") {
      let questionsList: any[] = [];

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `Anda adalah pembuat soal kurikulum game edukasi platformer 2D "Borneo Edu".
Buatkan ${count} soal pilihan ganda (A, B, C, D) yang edukatif dan menarik berdasarkan materi berikut:
---
Judul Materi: ${material.title}
Isi Materi:
${materialText.substring(0, 5000)}
---
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

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            },
          });

          const rawText = response.text || "[]";
          const parsed = JSON.parse(rawText.replace(/```json/g, "").replace(/```/g, "").trim());
          if (Array.isArray(parsed) && parsed.length > 0) {
            questionsList = parsed;
          }
        } catch (aiErr) {
          console.warn("[Gemini Question Gen Warning]", aiErr);
        }
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
    // =========================================================================
    if (targetType === "NEW_ASSIGNMENT") {
      let essayQuestions: string[] = [];

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `Anda adalah guru ahli. Buatkan ${Math.min(count, 5)} soal uraian / esai mendalam untuk siswa sekolah berdasarkan materi berikut:
Judul Materi: ${material.title}
Teks Materi: ${materialText.substring(0, 4000)}

Soal-soal ini WAJIB DIKERJAKAN DENGAN TULISAN TANGAN DI BUKU TULIS OLEH SISWA, kemudian difoto.
Buatkan soal yang mengasah pemahaman konsep, penalaran sebab-akibat, dan analisis kritis.

Format JSON yang DIHARUSKAN (hanya array string JSON murni):
[
  "1. Jelaskan konsep utama dari ... berdasarkan materi yang telah dipelajari!",
  "2. Analisislah bagaimana fenomena ... dapat terjadi!",
  "3. Berikan contoh nyata penerapan ... dalam kehidupan sehari-hari!"
]`;

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            },
          });

          const rawText = response.text || "[]";
          const parsed = JSON.parse(rawText.replace(/```json/g, "").replace(/```/g, "").trim());
          if (Array.isArray(parsed) && parsed.length > 0) {
            essayQuestions = parsed;
          }
        } catch (aiErr) {
          console.warn("[Gemini Essay Gen Warning]", aiErr);
        }
      }

      if (essayQuestions.length === 0) {
        essayQuestions = [
          `1. Jelaskan dengan kata-kata Anda sendiri konsep utama yang dipelajari pada materi "${material.title}"!`,
          `2. Mengapa materi "${material.title}" penting untuk dipahami? Sebutkan setidaknya 2 alasan!`,
          `3. Berikan satu contoh konkret penerapan materi ini di kehidupan sehari-hari atau di lingkungan sekitar Anda!`,
        ];
      }

      const formattedQuestions = essayQuestions.map((q, idx) => {
        return typeof q === "string" ? (q.startsWith(`${idx + 1}.`) ? q : `${idx + 1}. ${q}`) : `${idx + 1}. ${JSON.stringify(q)}`;
      }).join("\n\n");

      const title = assignmentTitle || `Tugas Tulisan Tangan: ${material.title}`;
      const instructions = `PETUNJUK PENGERJAAN TULISAN TANGAN:
1. Kerjakan semua soal di bawah ini di BUKU TULIS Anda dengan rapi dan tulisan tangan yang jelas terbaca.
2. Tuliskan Nama Lengkap, Nomor Absen, dan Kelas di bagian atas lembar buku tulis.
3. Setelah selesai, gunakan fitur "Kamera Kumpulkan Tugas" untuk memotret lembar jawaban Anda dan kirimkan ke sistem.`;

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
      });

      return NextResponse.json({
        success: true,
        targetType: "NEW_ASSIGNMENT",
        message: `Berhasil membuat Tugas Baru "${title}" untuk ${cls?.name} yang siap dikerjakan tulisan tangan oleh siswa.`,
        assignmentId: newAssignment._id,
        questionsCount: essayQuestions.length,
      });
    }

    return NextResponse.json({ error: "Tujuan penugasan tidak valid (pilih Borneo EDU atau Tugas Baru)." }, { status: 400 });
  } catch (error: any) {
    console.error("[Generate Questions Error]", error);
    return NextResponse.json({ error: error.message || "Gagal membuat soal dari AI" }, { status: 500 });
  }
}
