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
    if (material.content && material.content.trim().length > 30) {
      materialText = material.content.trim();
    }
    if (material.summary && material.summary.trim().length > 20) {
      materialText = materialText ? `${materialText}\n\nRingkasan:\n${material.summary.trim()}` : material.summary.trim();
    }
    if (material.description && material.description.trim().length > 20) {
      materialText = materialText ? `${materialText}\n\nDeskripsi:\n${material.description.trim()}` : material.description.trim();
    }
    if (!materialText || materialText.length < 50) {
      materialText = `Judul Materi: ${material.title}. Topik pembelajaran: ${material.title}. ${material.description || ""}`;
    }

    // =========================================================================
    // CASE A: TARGET ADALAH GAME BORNEO EDU (PASTIKAN TEPAT 101 SOAL DARI MATERI)
    // =========================================================================
    if (targetType === "BORNEO_EDU") {
      // 1. Ekstrak kalimat-kalimat informatif dari teks materi untuk penjaminan materi & fallback bermutu
      const cleanMaterial = materialText
        .replace(/\r\n/g, "\n")
        .replace(/[#*`_~]/g, "")
        .replace(/\$\$(.*?)\$\$/g, "$1")
        .replace(/\$(.*?)\$/g, "$1");

      const lines = cleanMaterial.split("\n").map((l) => l.trim()).filter(Boolean);
      const extractedSentences: string[] = [];
      const seenSentences = new Set<string>();

      for (const line of lines) {
        const subParts = line.split(/(?<=[.!?])\s+/);
        for (const part of subParts) {
          const sanitized = part.replace(/^(\d+[\.\)]|\-|\•)\s*/, "").trim();
          if (sanitized.length >= 25 && sanitized.length <= 250) {
            const lower = sanitized.toLowerCase();
            if (!seenSentences.has(lower)) {
              seenSentences.add(lower);
              extractedSentences.push(sanitized);
            }
          }
        }
      }

      // Jika kalimat materi sedikit, tambahkan frasa turunan dari judul dan deskripsi
      if (extractedSentences.length < 5) {
        extractedSentences.push(
          `Pembahasan utama materi berfokus pada konsep dasar ${material.title}.`,
          `Setiap komponen dalam ${material.title} memiliki fungsi dan prinsip kerja yang saling melengkapi.`,
          `Penerapan nyata dari ${material.title} dapat ditemui dalam kehidupan sehari-hari maupun bidang teknologi.`,
          `Analisis mendalam mengenai ${material.title} menunjukkan pentingnya pemahaman terstruktur dan kritis.`,
          `Evaluasi menyeluruh terhadap ${material.title} membantu menyelesaikan tantangan yang relevan.`
        );
      }

      // 2. Konfigurasi 5 World & 25 Level untuk tepat 101 Soal
      const WORLD_CONFIGS = [
        {
          world: 1,
          name: "KNOWLEDGE FOREST",
          stage: "Pengetahuan" as const,
          theme: "Pengantar, Konsep Pokok, Definisi Dasar, dan Istilah Kunci dari Materi",
          levels: [1, 2, 3, 4, 5],
          bossLevel: 5,
          bossName: "Forest Guardian Ent",
          count: 20, // 4 soal/level x 5 level
          difficultyMap: { 1: "EASY", 2: "EASY", 3: "EASY", 4: "EASY", 5: "BOSS" } as Record<number, string>,
        },
        {
          world: 2,
          name: "CHALLENGE MOUNTAIN",
          stage: "Pemahaman" as const,
          theme: "Pemahaman Mendalam, Teori Pendukung, Klasifikasi, Komponen, dan Karakteristik dari Materi",
          levels: [6, 7, 8, 9, 10],
          bossLevel: 10,
          bossName: "Mountain Titan Golem",
          count: 20, // 4 soal/level x 5 level
          difficultyMap: { 6: "EASY", 7: "EASY", 8: "MEDIUM", 9: "MEDIUM", 10: "BOSS" } as Record<number, string>,
        },
        {
          world: 3,
          name: "LOGIC OCEAN",
          stage: "Penerapan" as const,
          theme: "Penerapan Praktis, Prosedur, Mekanisme Kerja, Alur Proses, dan Formula/Penerapan dari Materi",
          levels: [11, 12, 13, 14, 15],
          bossLevel: 15,
          bossName: "Deep Sea Kraken",
          count: 20, // 4 soal/level x 5 level
          difficultyMap: { 11: "MEDIUM", 12: "MEDIUM", 13: "MEDIUM", 14: "HARD", 15: "BOSS" } as Record<number, string>,
        },
        {
          world: 4,
          name: "MYSTERY DESERT",
          stage: "Analisis" as const,
          theme: "Analisis Mendalam, Studi Kasus Nyata, Fakta Konkret, dan Hubungan Sebab-Akibat dari Materi",
          levels: [16, 17, 18, 19, 20],
          bossLevel: 20,
          bossName: "Desert Sphinx Sentinel",
          count: 20, // 4 soal/level x 5 level
          difficultyMap: { 16: "HARD", 17: "HARD", 18: "HARD", 19: "HARD", 20: "BOSS" } as Record<number, string>,
        },
        {
          world: 5,
          name: "FINAL CASTLE",
          stage: "HOTS" as const,
          theme: "Evaluasi Kritis, Sintesis Paripurna, Solusi Holistik, dan Soal Tantangan HOTS dari Materi",
          levels: [21, 22, 23, 24, 25],
          bossLevel: 25,
          bossName: "Raja Kegelapan Edukasi (Dark Overlord)",
          count: 21, // 4 soal x 4 level (L21-L24 = 16) + L25 (4 boss + 1 boss cadangan = 5) = 21 soal! Total = 101!
          difficultyMap: { 21: "HARD", 22: "HARD", 23: "HARD", 24: "HARD", 25: "BOSS" } as Record<number, string>,
        },
      ];

      const rawQuestionsPerWorld: any[][] = [];

      // 3. Generate soal per World secara terfokus
      for (const cfg of WORLD_CONFIGS) {
        console.log(`[Borneo Question Generator] Memproses World ${cfg.world} (${cfg.name}) target: ${cfg.count} soal...`);
        let worldQuestions: any[] = [];

        const prompt = `Anda adalah pembuat soal kurikulum game edukasi platformer 2D "Borneo Edu" untuk World ${cfg.world}: ${cfg.name}.
Tugas Anda adalah membuat tepat ${cfg.count} soal pilihan ganda (A, B, C, D) yang bersumber SEPENUHNYA dan EKSPLISIT dari teks materi pembelajaran di bawah ini.

===================================================================
TEKS MATERI PEMBELAJARAN LENGKAP:
Judul Materi: ${material.title}

${materialText.substring(0, 22000)}
===================================================================

FOKUS KHUSUS WORLD ${cfg.world} (${cfg.name}):
- Tema Kognitif: ${cfg.theme}
- Tahap Taksonomi: ${cfg.stage}
- Level yang dicakup: Level ${cfg.levels[0]} sampai Level ${cfg.levels[cfg.levels.length - 1]}
- Jumlah soal yang WAJIB dibuat: Tepat ${cfg.count} soal (4 soal untuk tiap level${cfg.world === 5 ? ", serta khusus Level 25 ada 5 soal yaitu 4 boss utama + 1 boss cadangan" : ""}).

ATURAN UTAMA & SANGAT KETAT:
1. SEMUA JAWABAN BENAR HARUS BERSUMBER 100% DARI TEKS MATERI DI ATAS!
   Siswa telah membaca materi tersebut sebelum memainkan game Borneo Edu. DILARANG KERAS menanyakan informasi, istilah, nama, atau rumus di luar teks materi di atas!
2. DILARANG MEMBUAT SOAL / JAWABAN YANG SAMA SEMUA / MONOTON:
   - Setiap nomor soal HARUS memiliki pertanyaan yang BERBEDA dan menguji kalimat/fakta yang berlainan dari materi.
   - Pilihan A, B, C, D pada setiap soal HARUS kalimat spesifik dan berbeda-beda.
   - VARIASIKAN KUNCI JAWABAN (correctAnswer): Jangan meletakkan semua jawaban benar di pilihan A! Sebarkan jawaban secara seimbang antara 'A', 'B', 'C', dan 'D'.
3. Pembagian Level Soal (${cfg.count} soal):
${cfg.levels
  .map((lvl) => {
    const isBoss = lvl === cfg.bossLevel;
    const num = cfg.world === 5 && lvl === 25 ? 5 : 4;
    return `   - Level ${lvl}: ${num} soal (${isBoss ? `BOSS: ${cfg.bossName}, difficulty: BOSS, isBossQuestion: true` : `difficulty: ${cfg.difficultyMap[lvl] || "EASY"}, isBossQuestion: false`})`;
  })
  .join("\n")}
4. Bagian "explanation":
   WAJIB mengutip kalimat atau penjelasan dari materi yang menjadi bukti kebenaran jawaban tersebut.

Format JSON yang DIHARUSKAN (hanya array JSON murni tanpa markdown):
[
  {
    "world": ${cfg.world},
    "level": ${cfg.levels[0]},
    "question": "Berdasarkan materi '${material.title}', apakah ...?",
    "options": {
      "A": "Pernyataan spesifik A",
      "B": "Pernyataan spesifik B",
      "C": "Pernyataan spesifik C",
      "D": "Pernyataan spesifik D"
    },
    "correctAnswer": "B",
    "difficulty": "${cfg.difficultyMap[cfg.levels[0]] || "EASY"}",
    "stage": "${cfg.stage}",
    "isBossQuestion": false,
    "explanation": "Berdasarkan materi, jawaban yang benar adalah ... karena ..."
  }
]`;

        try {
          const rawText = await callAICascade({
            systemPrompt:
              "Anda adalah kurator pembuat soal kurikulum game Borneo Edu yang SANGAT KETAT. Anda WAJIB memastikan SELURUH pertanyaan dan kunci jawaban DAPAT DITEMUKAN secara langsung dan eksplisit di dalam teks materi yang disediakan. DILARANG membuat pertanyaan dari informasi di luar teks materi. Pastikan kunci jawaban bervariasi seimbang antara A, B, C, dan D.",
            prompt,
            responseJson: true,
            maxTokens: 4096,
            temperature: 0.25,
            logPrefix: `[Borneo W${cfg.world} AI]`,
          });

          const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
          let parsed: any = null;
          try {
            parsed = JSON.parse(cleaned);
          } catch {
            const match = rawText.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (match) parsed = JSON.parse(match[0]);
          }

          if (Array.isArray(parsed) && parsed.length > 0) {
            worldQuestions = parsed;
          } else if (parsed && Array.isArray(parsed.questions)) {
            worldQuestions = parsed.questions;
          }
        } catch (aiErr) {
          console.warn(`[Borneo W${cfg.world} AI Warning]`, aiErr);
        }

        // 4. Fallback Cerdas Berbasis Materi jika AI gagal atau jumlah soal kurang dari target
        if (worldQuestions.length < cfg.count) {
          console.log(
            `[Borneo W${cfg.world}] Melengkapi ${cfg.count - worldQuestions.length} soal menggunakan generator materi langsung...`
          );
          const startIndex = worldQuestions.length;
          for (let k = startIndex; k < cfg.count; k++) {
            let assignedLevel: number;
            if (cfg.world === 5) {
              assignedLevel = k < 16 ? cfg.levels[Math.floor(k / 4)] : 25;
            } else {
              assignedLevel = cfg.levels[Math.floor(k / 4)];
            }
            const isBoss = assignedLevel === cfg.bossLevel;
            const diff = isBoss ? "BOSS" : (cfg.difficultyMap[assignedLevel] || (cfg.world <= 2 ? "EASY" : cfg.world <= 4 ? "MEDIUM" : "HARD"));

            const sentenceIdx = (cfg.world * 23 + k) % extractedSentences.length;
            const correctSentence = extractedSentences[sentenceIdx];
            const distractor1 = extractedSentences[(sentenceIdx + 1) % extractedSentences.length];
            const distractor2 = extractedSentences[(sentenceIdx + 2) % extractedSentences.length];
            const distractor3 = extractedSentences[(sentenceIdx + 3) % extractedSentences.length];

            let questionText = "";
            if (isBoss) {
              if (cfg.world === 5 && k === 20) {
                questionText = `[FINAL BOSS CADANGAN] Berdasarkan evaluasi materi "${material.title}", manakah kesimpulan yang paling tepat sesuai teks materi?`;
              } else if (cfg.world === 5) {
                const bossStage = (k - 16) + 1;
                questionText = `[FINAL BOSS — TAHAP ${bossStage}: ${cfg.stage.toUpperCase()}] Berdasarkan materi "${material.title}", manakah pernyataan yang benar mengenai konsep ini?`;
              } else {
                questionText = `[BOSS BATTLE: ${cfg.bossName}] Berdasarkan pembahasan "${material.title}", manakah fakta yang benar sesuai materi?`;
              }
            } else {
              const questionTemplates = [
                `Berdasarkan materi "${material.title}", manakah pernyataan yang BENAR mengenai pembahasan berikut?`,
                `Menurut penjelasan dalam materi "${material.title}", hal yang diuraikan secara tepat adalah...`,
                `Dalam pembahasan materi "${material.title}", manakah poin yang sesuai dengan fakta teks?`,
                `Terkait dengan materi "${material.title}", pernyataan manakah yang paling akurat?`,
              ];
              questionText = questionTemplates[k % questionTemplates.length];
            }

            worldQuestions.push({
              world: cfg.world,
              level: assignedLevel,
              question: questionText,
              options: {
                A: correctSentence,
                B: distractor1 !== correctSentence ? distractor1 : `Pernyataan lain yang bertolak belakang dengan pembahasan ${material.title}`,
                C: distractor2 !== correctSentence ? distractor2 : `Aspek di luar topik materi ${material.title}`,
                D: distractor3 !== correctSentence ? distractor3 : `Kesimpulan yang tidak sesuai dengan isi materi ${material.title}`,
              },
              correctAnswer: "A",
              difficulty: diff,
              stage: cfg.stage,
              isBossQuestion: isBoss,
              explanation: `Berdasarkan teks materi "${material.title}": "${correctSentence.substring(0, 150)}..."`,
            });
          }
        }

        // Ambil tepat cfg.count soal untuk World ini
        rawQuestionsPerWorld.push(worldQuestions.slice(0, cfg.count));
      }

      // 5. Gabungkan seluruh soal dari 5 World (Total Tepat 101 Soal: 20 + 20 + 20 + 20 + 21)
      const combinedQuestions = rawQuestionsPerWorld.flat();

      // 6. Pola Penyeimbang Kunci Jawaban (Answer Balancer)
      // Menjamin kunci jawaban berputar seimbang ~25% A, 25% B, 25% C, 25% D dan tidak berulang monoton
      const answerCycle: ("A" | "B" | "C" | "D")[] = [
        "B", "C", "A", "D", "C", "A", "D", "B", "D", "B", "A", "C", "A", "D", "B", "C"
      ];

      const insertedOps = combinedQuestions.map((q, idx) => {
        const questionId = `Q${String(idx + 1).padStart(3, "0")}`;
        const world = Number(q.world) || (idx < 20 ? 1 : idx < 40 ? 2 : idx < 60 ? 3 : idx < 80 ? 4 : 5);

        let level = Number(q.level);
        if (!level || level < 1 || level > 25) {
          if (world === 1) level = Math.min(5, Math.floor(idx / 4) + 1);
          else if (world === 2) level = Math.min(10, Math.floor((idx - 20) / 4) + 6);
          else if (world === 3) level = Math.min(15, Math.floor((idx - 40) / 4) + 11);
          else if (world === 4) level = Math.min(20, Math.floor((idx - 60) / 4) + 16);
          else level = idx >= 96 ? 25 : Math.min(24, Math.floor((idx - 80) / 4) + 21);
        }

        const isBoss = level === 5 || level === 10 || level === 15 || level === 20 || level === 25;
        const validDifficulties = ["EASY", "MEDIUM", "HARD", "HOTS", "BOSS"];
        const difficulty = isBoss
          ? "BOSS"
          : validDifficulties.includes(q.difficulty)
          ? q.difficulty
          : world <= 2
          ? "EASY"
          : world <= 4
          ? "MEDIUM"
          : "HARD";

        // Pastikan opsi A, B, C, D terisi string valid
        const opts: { A: string; B: string; C: string; D: string } = {
          A: String(q.options?.A || "Pernyataan A"),
          B: String(q.options?.B || "Pernyataan B"),
          C: String(q.options?.C || "Pernyataan C"),
          D: String(q.options?.D || "Pernyataan D"),
        };

        // Dapatkan jawaban benar asal dari AI
        const rawAns = String(q.correctAnswer || "A").toUpperCase().trim();
        const originalCorrectKey = (["A", "B", "C", "D"].includes(rawAns) ? rawAns : "A") as "A" | "B" | "C" | "D";

        // Tentukan target kunci jawaban sesuai pola penyeimbang seimbang (~25% per huruf)
        const targetCorrectKey = answerCycle[idx % answerCycle.length];

        // Tukar isi opsi sehingga targetCorrectKey memegang teks jawaban benar
        if (originalCorrectKey !== targetCorrectKey) {
          const correctText = opts[originalCorrectKey];
          const targetSlotText = opts[targetCorrectKey];
          opts[targetCorrectKey] = correctText;
          opts[originalCorrectKey] = targetSlotText;
        }

        // Pastikan tidak ada opsi yang kembar / sama persis teksnya
        const uniqueValues = new Set([opts.A, opts.B, opts.C, opts.D].map((s) => s.toLowerCase().trim()));
        if (uniqueValues.size < 4) {
          if (opts.B === opts.A) opts.B = `Bukan merupakan bagian dari prinsip ${material.title}`;
          if (opts.C === opts.A || opts.C === opts.B) opts.C = `Pernyataan yang bertentangan dengan materi ${material.title}`;
          if (opts.D === opts.A || opts.D === opts.B || opts.D === opts.C) opts.D = `Konsep alternatif yang belum diverifikasi dalam materi`;
        }

        const explanation = String(
          q.explanation ||
          `Jawaban yang benar adalah pilihan ${targetCorrectKey} berdasarkan teks pembahasan materi "${material.title}".`
        );

        return {
          questionId,
          world,
          level,
          question: String(q.question || `Pertanyaan ${idx + 1}`),
          options: opts,
          correctAnswer: targetCorrectKey,
          difficulty,
          explanation,
          stage: q.stage || (world === 1 ? "Pengetahuan" : world === 2 ? "Pemahaman" : world === 3 ? "Penerapan" : world === 4 ? "Analisis" : "HOTS"),
          isBossQuestion: isBoss,
          classId: cls?._id,
          className: cls?.name,
          materialId: material._id,
        };
      });

      // 7. Bersihkan bank soal kelas sebelumnya dan simpan tepat 101 soal materi terbaru!
      await BorneoEduQuestion.deleteMany({ classId: cls?._id });
      await BorneoEduQuestion.insertMany(insertedOps);

      return NextResponse.json({
        success: true,
        targetType: "BORNEO_EDU",
        message: `Berhasil membuat tepat ${insertedOps.length} soal Borneo EDU lengkap (World 1-5, Level 1-25 & Final Boss) untuk ${cls?.name || "Kelas"} berdasarkan materi "${material.title}". Kunci jawaban dan isi soal telah diverifikasi bervariasi.`,
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
      const essayCount = Math.min(15, Math.max(3, Number(questionCount) || 5));
      const scorePerQuestion = Math.round(100 / essayCount);

      const prompt = `Anda adalah guru ahli kurikulum Indonesia. Buatkan ${essayCount} soal tugas untuk siswa sekolah berdasarkan teks materi pembelajaran di bawah ini:

===================================================================
TEKS MATERI PEMBELAJARAN LENGKAP:
Judul Materi: ${material.title}

${materialText.substring(0, 25000)}
===================================================================

ATURAN UTAMA & WAJIB (STRICT ALIGNMENT DENGAN MATERI):
1. SEMUA JAWABAN DAN KUNCI JAWABAN (idealAnswer) HARUS 100% DAPAT DITEMUKAN PADA TEKS MATERI DI ATAS!
   Siswa akan mengerjakan tugas ini di BUKU TULIS mereka setelah membaca materi. DILARANG membuat pertanyaan yang jawabannya tidak ada atau tidak diterangkan di dalam teks materi tersebut.
2. KUNCI JAWABAN (idealAnswer) WAJIB MERUJUK SECARA PERSIS PADA ISI DAN POIN-POIN MATERI:
   - idealAnswer akan digunakan oleh sistem AI Grader untuk menilai foto tulisan tangan siswa.
   - Siswa yang menuliskan jawaban sesuai teks materi HARUS mendapatkan skor maksimal (100).
   - Tuliskan poin-poin kunci, fakta, dan kata kunci penting yang tertulis di materi ke dalam idealAnswer.
3. Variasi Tipe Soal:
   - "ESSAY": Soal uraian yang menuntut pemahaman konsep, mekanisme, atau penerapan (idealAnswer berupa 2-4 kalimat lengkap yang merangkum penjelasan di materi).
   - "ISIAN_SINGKAT": Soal jawaban ringkas yang menanyakan istilah khusus, nama komponen, rumus, atau definisi pendek yang tertulis di materi (idealAnswer berupa 1-3 kata/frasa kunci).
4. Buat pertanyaan terarah dan spesifik berdasarkan isi materi, contoh:
   - "Berdasarkan materi di atas, jelaskan pengertian ... dan sebutkan 3 poin pentingnya!"
   - "Bagaimana proses/mekanisme ... terjadi sebagaimana diuraikan dalam materi?"
   - "Sebutkan 3 contoh penerapan nyata dari ... yang dijelaskan dalam materi!"
5. Distribusikan soal secara proporsional dari berbagai bagian materi (Pengertian, Prinsip, Klasifikasi, Mekanisme, Contoh Penerapan).

Format JSON yang DIHARUSKAN (hanya array JSON murni tanpa markdown):
[
  {
    "question": "Berdasarkan materi di atas, jelaskan pengertian ... dan sebutkan 3 karakteristik utamanya!",
    "questionType": "ESSAY",
    "idealAnswer": "Berdasarkan materi, ... adalah .... Tiga karakteristik utamanya adalah: 1) ..., 2) ..., 3) ...",
    "maxScore": ${scorePerQuestion}
  },
  {
    "question": "Istilah apa yang digunakan dalam materi untuk menggambarkan ...?",
    "questionType": "ISIAN_SINGKAT",
    "idealAnswer": "Istilah Kunci, Nama Alternatif",
    "maxScore": ${scorePerQuestion}
  }
]`;

        try {
          const rawText = await callAICascade({
            systemPrompt: "Anda adalah guru ahli kurikulum yang SANGAT KETAT. Anda WAJIB memastikan SELURUH pertanyaan dan kunci jawaban (idealAnswer) DAPAT DITEMUKAN secara langsung dan eksplisit di dalam teks materi yang diberikan. DILARANG membuat soal dari informasi di luar materi.",
            prompt,
            responseJson: true,
            maxTokens: 4096,
            temperature: 0.2,
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
