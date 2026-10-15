import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { TeacherProfile } from "@/models/Profile";
import { Material } from "@/models/Material";
import { Class } from "@/models/Class";
import { BorneoEduQuestion, BorneoEduConfig } from "@/models/BorneoEdu";
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
      // Konfigurasi Game Borneo EDU:
      questionsPerLevel = 4,
      levelQuestionsMap = {},
      // Konfigurasi Tugas Tulis Tangan:
      questionTypesConfig = null,
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

    // 1b. Ekstrak kalimat-kalimat informatif dari teks materi untuk penjaminan materi & fallback bermutu
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

    // =========================================================================
    // CASE A: TARGET ADALAH GAME BORNEO EDU (JUMLAH SOAL PER LEVEL DAPAT DIATUR GURU)
    // =========================================================================
    if (targetType === "BORNEO_EDU") {
      const defaultPerLevel = Math.max(1, Math.min(10, Number(questionsPerLevel) || 4));
      const customMap: Record<number, number> = {};
      if (levelQuestionsMap && typeof levelQuestionsMap === "object") {
        for (const [k, v] of Object.entries(levelQuestionsMap)) {
          const lvlNum = Number(k);
          const cnt = Number(v);
          if (lvlNum >= 1 && lvlNum <= 25 && cnt >= 1 && cnt <= 10) {
            customMap[lvlNum] = cnt;
          }
        }
      }

      // Hitung kuota tepat tiap level 1..25
      const levelCounts: Record<number, number> = {};
      for (let lvl = 1; lvl <= 25; lvl++) {
        levelCounts[lvl] = customMap[lvl] || defaultPerLevel;
      }

      // Konfigurasi 5 World
      const WORLD_CONFIGS = [
        {
          world: 1,
          name: "KNOWLEDGE FOREST",
          stage: "Pengetahuan" as const,
          theme: "Pengantar, Konsep Pokok, Definisi Dasar, dan Istilah Kunci dari Materi",
          levels: [1, 2, 3, 4, 5],
          bossLevel: 5,
          bossName: "Forest Guardian Ent",
          count: [1, 2, 3, 4, 5].reduce((sum, l) => sum + levelCounts[l], 0),
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
          count: [6, 7, 8, 9, 10].reduce((sum, l) => sum + levelCounts[l], 0),
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
          count: [11, 12, 13, 14, 15].reduce((sum, l) => sum + levelCounts[l], 0),
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
          count: [16, 17, 18, 19, 20].reduce((sum, l) => sum + levelCounts[l], 0),
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
          count: [21, 22, 23, 24, 25].reduce((sum, l) => sum + levelCounts[l], 0),
          difficultyMap: { 21: "HARD", 22: "HARD", 23: "HARD", 24: "HARD", 25: "BOSS" } as Record<number, string>,
        },
      ];

      const rawQuestionsPerWorld: any[][] = [];

      // Generate soal per World
      for (const cfg of WORLD_CONFIGS) {
        console.log(`[Borneo Question Generator] Memproses World ${cfg.world} (${cfg.name}) target: ${cfg.count} soal...`);
        let aiParsedQuestions: any[] = [];

        const levelDistributionPrompt = cfg.levels.map((lvl) => {
          const isBoss = lvl === cfg.bossLevel;
          return `   - Level ${lvl}: tepat ${levelCounts[lvl]} soal (${isBoss ? `BOSS: ${cfg.bossName}, difficulty: BOSS, isBossQuestion: true` : `difficulty: ${cfg.difficultyMap[lvl] || "EASY"}, isBossQuestion: false`})`;
        }).join("\n");

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
- Total Soal Wajib World Ini: Tepat ${cfg.count} soal dengan alokasi jumlah soal per level sbb:
${levelDistributionPrompt}

ATURAN UTAMA & SANGAT KETAT:
1. SEMUA JAWABAN BENAR HARUS BERSUMBER 100% DARI TEKS MATERI DI ATAS!
   Siswa telah membaca materi tersebut sebelum memainkan game Borneo Edu. DILARANG KERAS menanyakan informasi, istilah, nama, atau rumus di luar teks materi di atas!
2. DILARANG MEMBUAT SOAL / JAWABAN YANG SAMA SEMUA / MONOTON:
   - Setiap nomor soal HARUS memiliki pertanyaan yang BERBEDA dan menguji kalimat/fakta yang berlainan dari materi.
   - Pilihan A, B, C, D pada setiap soal HARUS kalimat spesifik dan berbeda-beda.
   - VARIASIKAN KUNCI JAWABAN (correctAnswer): Sebarkan kunci jawaban secara seimbang antara 'A', 'B', 'C', dan 'D'.
3. Bagian "explanation":
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
            aiParsedQuestions = parsed;
          } else if (parsed && Array.isArray(parsed.questions)) {
            aiParsedQuestions = parsed.questions;
          }
        } catch (aiErr) {
          console.warn(`[Borneo W${cfg.world} AI Warning]`, aiErr);
        }

        // Kelompokkan hasil AI per level untuk memenuhi kuota per level
        const questionsByLevel: Record<number, any[]> = {};
        for (const lvl of cfg.levels) {
          questionsByLevel[lvl] = [];
        }

        for (const q of aiParsedQuestions) {
          const targetLvl = Number(q.level);
          if (cfg.levels.includes(targetLvl)) {
            if (questionsByLevel[targetLvl].length < levelCounts[targetLvl]) {
              questionsByLevel[targetLvl].push(q);
            }
          }
        }

        // Lengkapi level yang belum memenuhi target kuota menggunakan Fallback generator berbasis materi
        for (const lvl of cfg.levels) {
          const needed = levelCounts[lvl] - questionsByLevel[lvl].length;
          const isBoss = lvl === cfg.bossLevel;
          const diff = isBoss ? "BOSS" : (cfg.difficultyMap[lvl] || (cfg.world <= 2 ? "EASY" : cfg.world <= 4 ? "MEDIUM" : "HARD"));

          for (let k = 0; k < needed; k++) {
            const sentenceIdx = (cfg.world * 17 + lvl * 7 + k) % extractedSentences.length;
            const correctSentence = extractedSentences[sentenceIdx];
            const distractor1 = extractedSentences[(sentenceIdx + 1) % extractedSentences.length];
            const distractor2 = extractedSentences[(sentenceIdx + 2) % extractedSentences.length];
            const distractor3 = extractedSentences[(sentenceIdx + 3) % extractedSentences.length];

            let questionText = "";
            if (isBoss) {
              if (lvl === 25) {
                questionText = `[FINAL BOSS TANTANGAN] Berdasarkan evaluasi komprehensif materi "${material.title}", manakah kesimpulan yang paling tepat sesuai fakta teks?`;
              } else {
                questionText = `[BOSS BATTLE: ${cfg.bossName}] Berdasarkan pembahasan materi "${material.title}", manakah prinsip yang benar sesuai teks?`;
              }
            } else {
              const questionTemplates = [
                `Berdasarkan materi "${material.title}", manakah pernyataan yang BENAR mengenai pokok bahasan ini?`,
                `Menurut penjelasan dalam materi "${material.title}", hal yang diuraikan secara tepat adalah...`,
                `Dalam pembahasan materi "${material.title}", manakah poin yang paling akurat sesuai teks?`,
                `Terkait topik "${material.title}", pernyataan manakah yang menjadi fakta utama?`,
              ];
              questionText = questionTemplates[(lvl + k) % questionTemplates.length];
            }

            questionsByLevel[lvl].push({
              world: cfg.world,
              level: lvl,
              question: questionText,
              options: {
                A: correctSentence,
                B: distractor1 !== correctSentence ? distractor1 : `Pernyataan lain di luar prinsip ${material.title}`,
                C: distractor2 !== correctSentence ? distractor2 : `Aspek yang bertentangan dengan materi ${material.title}`,
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

        // Kumpulkan semua soal dari level-level di World ini
        const worldQuestions = cfg.levels.flatMap((lvl) => questionsByLevel[lvl]);
        rawQuestionsPerWorld.push(worldQuestions);
      }

      // Gabungkan seluruh soal dari 5 World
      const combinedQuestions = rawQuestionsPerWorld.flat();

      // Pola Penyeimbang Kunci Jawaban (Answer Balancer: ~25% A, B, C, D)
      const answerCycle: ("A" | "B" | "C" | "D")[] = [
        "B", "C", "A", "D", "C", "A", "D", "B", "D", "B", "A", "C", "A", "D", "B", "C"
      ];

      const insertedOps = combinedQuestions.map((q, idx) => {
        const questionId = `Q${String(idx + 1).padStart(3, "0")}`;
        const world = Number(q.world) || (idx < 20 ? 1 : idx < 40 ? 2 : idx < 60 ? 3 : idx < 80 ? 4 : 5);
        const level = Number(q.level) || 1;
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

        const opts: { A: string; B: string; C: string; D: string } = {
          A: String(q.options?.A || "Pernyataan A"),
          B: String(q.options?.B || "Pernyataan B"),
          C: String(q.options?.C || "Pernyataan C"),
          D: String(q.options?.D || "Pernyataan D"),
        };

        const rawAns = String(q.correctAnswer || "A").toUpperCase().trim();
        const originalCorrectKey = (["A", "B", "C", "D"].includes(rawAns) ? rawAns : "A") as "A" | "B" | "C" | "D";
        const targetCorrectKey = answerCycle[idx % answerCycle.length];

        if (originalCorrectKey !== targetCorrectKey) {
          const correctText = opts[originalCorrectKey];
          const targetSlotText = opts[targetCorrectKey];
          opts[targetCorrectKey] = correctText;
          opts[originalCorrectKey] = targetSlotText;
        }

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

      // Bersihkan bank soal kelas sebelumnya dan simpan paket soal terbaru
      await BorneoEduQuestion.deleteMany({ classId: cls?._id });
      await BorneoEduQuestion.insertMany(insertedOps);

      // Simpan konfigurasi jumlah soal level ini ke BorneoEduConfig agar langsung aktif di gameplay
      try {
        await BorneoEduConfig.findOneAndUpdate(
          {},
          {
            $set: {
              maxQuestionsPerLevel: defaultPerLevel,
              levelQuestionsMap: customMap,
            }
          },
          { upsert: true }
        );
      } catch (cfgErr) {
        console.warn("[BorneoEduConfig Update Warning]", cfgErr);
      }

      return NextResponse.json({
        success: true,
        targetType: "BORNEO_EDU",
        message: `Berhasil membuat ${insertedOps.length} soal Borneo EDU untuk ${cls?.name || "Kelas"} berdasarkan materi "${material.title}". Setiap level diatur dengan tepat ${defaultPerLevel} soal${Object.keys(customMap).length > 0 ? " (dengan kustomisasi level)" : ""}.`,
        count: insertedOps.length,
        questionsPerLevel: defaultPerLevel,
        levelCounts,
        className: cls?.name,
      });
    }

    // =========================================================================
    // CASE B: TARGET ADALAH TUGAS TULIS TANGAN (JENIS SOAL & JUMLAH DAPAT DIATUR GURU)
    // Mendukung: Pilihan Ganda, Benar-Salah, Isian Singkat, Essay, Pilihan Ganda Kompleks, Sebab-Akibat
    // =========================================================================
    if (targetType === "NEW_ASSIGNMENT") {
      // Baca konfigurasi jenis soal yang dipilih guru
      let typesConfig: Record<string, number> = {};
      if (questionTypesConfig && typeof questionTypesConfig === "object") {
        for (const [typeKey, countVal] of Object.entries(questionTypesConfig)) {
          const num = Math.max(0, Number(countVal) || 0);
          if (num > 0) {
            typesConfig[typeKey] = num;
          }
        }
      }

      // Default jika guru tidak menentukan rincian
      if (Object.keys(typesConfig).length === 0) {
        const totalReq = Math.min(25, Math.max(3, Number(questionCount) || 10));
        if (totalReq <= 5) {
          typesConfig = { PILIHAN_GANDA: 2, BENAR_SALAH: 1, ISIAN_SINGKAT: 1, ESSAY: 1 };
        } else if (totalReq <= 10) {
          typesConfig = { PILIHAN_GANDA: 4, BENAR_SALAH: 2, ISIAN_SINGKAT: 2, ESSAY: 2 };
        } else {
          typesConfig = { PILIHAN_GANDA: 6, BENAR_SALAH: 4, ISIAN_SINGKAT: 3, ESSAY: 3 };
        }
      }

      const totalQuestionsCount = Object.values(typesConfig).reduce((a, b) => a + b, 0);

      // Hitung bobot nilai (maxScore) per tipe agar total poin = 100
      const typeWeights: Record<string, number> = {
        BENAR_SALAH: 1.0,
        PILIHAN_GANDA: 1.5,
        ISIAN_SINGKAT: 2.0,
        PILIHAN_GANDA_KOMPLEKS: 2.5,
        SEBAB_AKIBAT: 3.0,
        ESSAY: 4.0,
      };

      let totalWeightUnits = 0;
      for (const [typeKey, count] of Object.entries(typesConfig)) {
        totalWeightUnits += (typeWeights[typeKey] || 2.0) * count;
      }

      // Hitung skor integer untuk tiap tipe soal
      const scoresPerType: Record<string, number> = {};
      let allocatedTotal = 0;
      const typeKeys = Object.keys(typesConfig);

      for (let i = 0; i < typeKeys.length; i++) {
        const typeKey = typeKeys[i];
        const count = typesConfig[typeKey];
        const w = typeWeights[typeKey] || 2.0;
        const scorePerQ = Math.max(1, Math.round((100 * w) / (totalWeightUnits || 1)));
        scoresPerType[typeKey] = scorePerQ;
        allocatedTotal += scorePerQ * count;
      }

      // Rincian permintaan ke AI
      const requestedTypesDescription = Object.entries(typesConfig)
        .map(([tKey, cnt]) => {
          let label = tKey;
          let notes = "";
          if (tKey === "PILIHAN_GANDA") {
            label = "PILIHAN GANDA";
            notes = "Opsi A, B, C, D dengan 1 jawaban benar. correctAnswer: 'A', 'B', 'C', atau 'D'.";
          } else if (tKey === "BENAR_SALAH") {
            label = "BENAR-SALAH";
            notes = "Pernyataan yang menuntut siswa menentukan Benar atau Salah. correctAnswer: 'Benar' atau 'Salah'.";
          } else if (tKey === "ISIAN_SINGKAT") {
            label = "ISIAN SINGKAT";
            notes = "Menanyakan istilah/nama/definisi pendek. correctAnswer: 1-3 kata kunci penting.";
          } else if (tKey === "ESSAY") {
            label = "ESSAY / URAIAN";
            notes = "Menuntut penjelasan mendalam, analisis, atau mekanisme. correctAnswer: 2-4 kalimat rangkuman poin materi.";
          } else if (tKey === "PILIHAN_GANDA_KOMPLEKS") {
            label = "PILIHAN GANDA KOMPLEKS";
            notes = "Opsi A, B, C, D dengan 2 pilihan benar. correctAnswer: e.g. 'A, C'.";
          } else if (tKey === "SEBAB_AKIBAT") {
            label = "SEBAB-AKIBAT / ANALISIS KASUS";
            notes = "Pernyataan sebab-akibat atau analisis studi kasus konkret dari materi.";
          }
          return `- ${cnt} soal ${label} (Bobot per butir: ${scoresPerType[tKey]} poin) → ${notes}`;
        })
        .join("\n");

      const prompt = `Anda adalah guru ahli kurikulum Indonesia. Buatkan total ${totalQuestionsCount} soal tugas tulisan tangan berdasarkan teks materi pembelajaran di bawah ini:

===================================================================
TEKS MATERI PEMBELAJARAN LENGKAP:
Judul Materi: ${material.title}

${materialText.substring(0, 25000)}
===================================================================

RINCIAN JENIS SOAL & JUMLAH YANG WAJIB DIBUAT:
${requestedTypesDescription}

ATURAN UTAMA & WAJIB:
1. SEMUA JAWABAN DAN KUNCI JAWABAN (correctAnswer) HARUS 100% DAPAT DITEMUKAN PADA TEKS MATERI DI ATAS!
   Siswa akan mengerjakan tugas ini di BUKU TULIS mereka setelah membaca materi. DILARANG membuat pertanyaan yang jawabannya tidak ada di teks materi.
2. KUNCI JAWABAN (correctAnswer) WAJIB LENGKAP & SPESIFIK:
   - Untuk PILIHAN_GANDA: options memuat A, B, C, D. correctAnswer berupa huruf ("A" / "B" / "C" / "D").
   - Untuk BENAR_SALAH: question berupa pernyataan faktual. correctAnswer berupa "Benar" atau "Salah".
   - Untuk ISIAN_SINGKAT: correctAnswer berupa istilah/kata kunci materi.
   - Untuk ESSAY: correctAnswer berupa rangkuman poin-poin penjelasan materi untuk panduan penilaian AI Grader.
   - Untuk PILIHAN_GANDA_KOMPLEKS: correctAnswer berupa huruf multi-jawaban (contoh: "A, C").
   - Untuk SEBAB_AKIBAT: correctAnswer berupa kesimpulan hubungan sebab-akibat.

Format JSON yang DIHARUSKAN (hanya array JSON murni tanpa markdown):
[
  {
    "questionType": "PILIHAN_GANDA",
    "question": "Berdasarkan materi '${material.title}', apakah fungsi utama dari ...?",
    "options": {
      "A": "Pernyataan A",
      "B": "Pernyataan B",
      "C": "Pernyataan C",
      "D": "Pernyataan D"
    },
    "correctAnswer": "A",
    "explanation": "Penjelasan bukti dari materi..."
  },
  {
    "questionType": "BENAR_SALAH",
    "question": "Pernyataan: Menurut materi, ... Apakah pernyataan ini Benar atau Salah?",
    "correctAnswer": "Benar",
    "explanation": "Penjelasan bukti dari materi..."
  },
  {
    "questionType": "ISIAN_SINGKAT",
    "question": "Istilah yang digunakan dalam materi untuk menyebut ... adalah ...",
    "correctAnswer": "Istilah Kunci",
    "explanation": "Penjelasan bukti dari materi..."
  },
  {
    "questionType": "ESSAY",
    "question": "Jelaskan proses terjadinya ... berdasarkan pembahasan materi!",
    "correctAnswer": "Proses dimulai dari ... kemudian ... sehingga menghasilkan ...",
    "explanation": "Penjelasan bukti dari materi..."
  }
]`;

      let parsedQuestionsFromAI: any[] = [];
      try {
        const rawText = await callAICascade({
          systemPrompt:
            "Anda adalah kurator pembuat soal kurikulum sekolah yang SANGAT KETAT. Anda WAJIB memastikan SELURUH pertanyaan dan kunci jawaban DAPAT DITEMUKAN secara langsung dan eksplisit di dalam teks materi yang disediakan.",
          prompt,
          responseJson: true,
          maxTokens: 4096,
          temperature: 0.2,
          logPrefix: "[Handwritten Assignment AI]",
        });

        const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
        let parsed: any = null;
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          const match = rawText.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (match) parsed = JSON.parse(match[0]);
        }

        if (Array.isArray(parsed)) {
          parsedQuestionsFromAI = parsed;
        } else if (parsed && Array.isArray(parsed.questions)) {
          parsedQuestionsFromAI = parsed.questions;
        }
      } catch (aiErr) {
        console.warn("[Handwritten Assignment AI Cascade Warning]", aiErr);
      }

      // Kelompokkan dan validasi hasil soal per jenis
      const finalQuestionsList: any[] = [];
      const questionsByType: Record<string, any[]> = {};
      for (const tKey of Object.keys(typesConfig)) {
        questionsByType[tKey] = [];
      }

      for (const q of parsedQuestionsFromAI) {
        const t = String(q.questionType || "ESSAY").toUpperCase();
        if (questionsByType[t] && questionsByType[t].length < typesConfig[t]) {
          questionsByType[t].push(q);
        }
      }

      // Lengkapi dengan fallback cerdas berbasis materi jika ada tipe yang kurang
      for (const [tKey, targetCount] of Object.entries(typesConfig)) {
        const existing = questionsByType[tKey].length;
        const needed = targetCount - existing;

        for (let k = 0; k < needed; k++) {
          const sIdx = (tKey.length * 13 + k * 7) % extractedSentences.length;
          const sent = extractedSentences[sIdx];
          const dist1 = extractedSentences[(sIdx + 1) % extractedSentences.length];
          const dist2 = extractedSentences[(sIdx + 2) % extractedSentences.length];
          const dist3 = extractedSentences[(sIdx + 3) % extractedSentences.length];

          if (tKey === "PILIHAN_GANDA") {
            questionsByType[tKey].push({
              questionType: "PILIHAN_GANDA",
              question: `Berdasarkan materi "${material.title}", manakah pernyataan yang BENAR mengenai topik ini?`,
              options: {
                A: sent,
                B: dist1 !== sent ? dist1 : `Bukan merupakan bagian dari konsep ${material.title}`,
                C: dist2 !== sent ? dist2 : `Pernyataan yang berlawanan dengan isi teks ${material.title}`,
                D: dist3 !== sent ? dist3 : `Aspek di luar bahasan materi ${material.title}`,
              },
              correctAnswer: "A",
              explanation: `Berdasarkan teks: "${sent.substring(0, 120)}..."`,
            });
          } else if (tKey === "BENAR_SALAH") {
            const isTrue = k % 2 === 0;
            const stmt = isTrue ? sent : `Topik ${material.title} tidak memiliki hubungan sama sekali dengan perkembangan ilmu maupun penerapan nyata.`;
            questionsByType[tKey].push({
              questionType: "BENAR_SALAH",
              question: `Pernyataan: "${stmt}". Apakah pernyataan di atas Benar atau Salah menurut materi?`,
              correctAnswer: isTrue ? "Benar" : "Salah",
              explanation: `Sesuai materi "${material.title}": "${sent.substring(0, 120)}..."`,
            });
          } else if (tKey === "ISIAN_SINGKAT") {
            const words = sent.split(" ").filter((w) => w.length > 4);
            const keyWord = words[0] || material.title;
            questionsByType[tKey].push({
              questionType: "ISIAN_SINGKAT",
              question: `Berdasarkan teks materi "${material.title}", sebutkan konsep atau istilah kunci yang diuraikan pada kalimat: "${sent.replace(keyWord, "...")}"!`,
              correctAnswer: keyWord,
              explanation: `Konsep kunci yang tepat adalah: ${keyWord}.`,
            });
          } else if (tKey === "PILIHAN_GANDA_KOMPLEKS") {
            questionsByType[tKey].push({
              questionType: "PILIHAN_GANDA_KOMPLEKS",
              question: `Berdasarkan materi "${material.title}", pilihlah DUA pernyataan yang sesuai dengan isi materi!`,
              options: {
                A: sent,
                B: dist1,
                C: `Konsep yang tidak pernah dibahas dalam materi ${material.title}`,
                D: `Kekeliruan pemahaman mengenai ${material.title}`,
              },
              correctAnswer: "A, B",
              explanation: `Pernyataan A dan B bersumber langsung dari materi.`,
            });
          } else if (tKey === "SEBAB_AKIBAT") {
            questionsByType[tKey].push({
              questionType: "SEBAB_AKIBAT",
              question: `Pernyataan: Konsep ${material.title} sangat penting untuk dipahami secara mendalam. SEBAB ${sent}. Apakah pernyataan dan sebab tersebut keduanya benar dan menunjukkan hubungan sebab-akibat?`,
              correctAnswer: "Pernyataan Benar, Sebab Benar, dan Menunjukkan Hubungan Sebab-Akibat",
              explanation: `Keduanya saling berkaitan erat berdasarkan materi.`,
            });
          } else {
            // ESSAY
            questionsByType[tKey].push({
              questionType: "ESSAY",
              question: `Uraikan secara jelas pemahaman Anda mengenai poin penting berikut dalam materi "${material.title}": "${sent}"!`,
              correctAnswer: `Siswa diharapkan mampu menjelaskan konsep dasar ${material.title}, menguraikan makna: "${sent}", serta memberikan contoh penerapan atau implikasinya secara sistematis.`,
              explanation: `Rujukan teks materi: "${sent}"`,
            });
          }
        }
      }

      // Susun soal terurut rapi: Pilihan Ganda -> Benar Salah -> Isian Singkat -> PG Kompleks -> Sebab Akibat -> Essay
      const orderPriority = [
        "PILIHAN_GANDA",
        "BENAR_SALAH",
        "ISIAN_SINGKAT",
        "PILIHAN_GANDA_KOMPLEKS",
        "SEBAB_AKIBAT",
        "ESSAY",
      ];

      for (const t of orderPriority) {
        if (questionsByType[t] && questionsByType[t].length > 0) {
          finalQuestionsList.push(...questionsByType[t]);
        }
      }

      // Hitung skor akhir persis 100 poin
      const totalCount = finalQuestionsList.length;
      let runningScoreSum = 0;
      const structuredFinal = finalQuestionsList.map((q, idx) => {
        const order = idx + 1;
        const qType = q.questionType || "ESSAY";
        let score = scoresPerType[qType] || Math.round(100 / totalCount);
        if (idx === totalCount - 1) {
          // Sesuaikan butir terakhir agar jumlah tepat 100
          score = Math.max(1, 100 - runningScoreSum);
        } else {
          runningScoreSum += score;
        }

        return {
          order,
          questionType: qType,
          question: String(q.question || `Soal nomor ${order}`),
          options: q.options || null,
          correctAnswer: String(q.correctAnswer || q.idealAnswer || ""),
          maxScore: score,
          explanation: String(q.explanation || ""),
        };
      });

      // Format teks penugasan terstruktur untuk buku tulis siswa
      const sectionLabels: Record<string, { title: string; instruction: string }> = {
        PILIHAN_GANDA: {
          title: "BAGIAN A: PILIHAN GANDA",
          instruction: "Pilihlah salah satu jawaban yang paling tepat (A, B, C, atau D). Tuliskan huruf jawaban pada lembar buku tulis Anda.",
        },
        BENAR_SALAH: {
          title: "BAGIAN B: BENAR - SALAH",
          instruction: "Tentukan apakah pernyataan berikut Benar atau Salah. Tuliskan 'Benar' atau 'Salah' pada buku tulis Anda.",
        },
        ISIAN_SINGKAT: {
          title: "BAGIAN C: ISIAN SINGKAT",
          instruction: "Jawablah dengan istilah, nama, atau kata kunci yang tepat dan ringkas.",
        },
        PILIHAN_GANDA_KOMPLEKS: {
          title: "BAGIAN D: PILIHAN GANDA KOMPLEKS",
          instruction: "Pilihlah semua opsi jawaban yang benar. Tuliskan huruf-huruf pilihan yang sesuai.",
        },
        SEBAB_AKIBAT: {
          title: "BAGIAN E: SEBAB - AKIBAT & ANALISIS KASUS",
          instruction: "Analisis hubungan sebab-akibat atau studi kasus berikut dengan cermat.",
        },
        ESSAY: {
          title: "BAGIAN F: ESSAY / URAIAN",
          instruction: "Jawablah pertanyaan uraian di bawah ini dengan penjelasan lengkap, runut, dan sistematis.",
        },
      };

      const sectionsText: string[] = [];
      let currentSectionType = "";

      for (const item of structuredFinal) {
        if (item.questionType !== currentSectionType) {
          currentSectionType = item.questionType;
          const meta = sectionLabels[currentSectionType] || {
            title: `BAGIAN: ${currentSectionType}`,
            instruction: "Kerjakan soal berikut dengan teliti.",
          };
          sectionsText.push(`\n### ${meta.title}\n*${meta.instruction}*\n`);
        }

        let itemText = `**${item.order}.** ${item.question} *(Bobot: ${item.maxScore} Poin)*`;
        if (item.options && typeof item.options === "object") {
          const optLines = ["A", "B", "C", "D"]
            .filter((key) => item.options[key])
            .map((key) => `   - **${key}.** ${item.options[key]}`)
            .join("\n");
          if (optLines) {
            itemText += `\n${optLines}`;
          }
        }
        sectionsText.push(itemText);
      }

      const formattedQuestionsDescription = sectionsText.join("\n");

      // Format kunci jawaban lengkap untuk aiAnswerKey
      const answerKeyText = structuredFinal
        .map((q) => {
          return `Nomor ${q.order} [${q.questionType}] (Bobot: ${q.maxScore} Poin):\nSoal: ${q.question}\nKunci Jawaban: ${q.correctAnswer}\nCatatan/Pembahasan: ${q.explanation || "-"}`;
        })
        .join("\n\n");

      const title = assignmentTitle || `Tugas Tulisan Tangan: ${material.title}`;
      const instructions = `PETUNJUK PENGERJAAN TULISAN TANGAN:\n1. Kerjakan semua butir soal di bawah ini pada BUKU TULIS Anda secara rapi dan tulisan tangan yang terbaca jelas.\n2. Tuliskan Nama Lengkap, Nomor Absen, dan Kelas pada bagian paling atas halaman buku tulis.\n3. Setelah selesai mengerjakan, gunakan fitur "Kamera Kumpulkan Tugas" di dashboard untuk memotret lembar jawaban Anda dan kirimkan ke sistem.`;

      // Simpan Assignment baru
      const newAssignment = await Assignment.create({
        title,
        sessionName: cls?.name || "Tugas Kelas",
        classId: cls?._id,
        subjectId: material.subjectId || null,
        teacherId: teacherProfile._id,
        description: `## Lembar Soal Tugas Mandiri (Dikerjakan di Buku Tulis)\n\n${formattedQuestionsDescription}`,
        instructions,
        deadline: deadline ? new Date(deadline) : null,
        maxPages: Math.max(3, Math.min(8, Math.ceil(structuredFinal.length / 4) + 1)),
        status: AssignmentStatus.PUBLISHED,
        aiAnswerKey: answerKeyText,
      });

      // Simpan AssignmentQuestion records dengan correctAnswer & questionType
      const questionRecords = structuredFinal.map((q) => ({
        assignmentId: newAssignment._id,
        order: q.order,
        questionType: q.questionType,
        maxScore: q.maxScore,
        correctAnswer: q.correctAnswer,
      }));

      await AssignmentQuestion.deleteMany({ assignmentId: newAssignment._id });
      await AssignmentQuestion.insertMany(questionRecords);

      return NextResponse.json({
        success: true,
        targetType: "NEW_ASSIGNMENT",
        message: `Berhasil membuat Tugas Baru "${title}" untuk ${cls?.name} dengan ${structuredFinal.length} soal (${Object.entries(typesConfig).map(([k, v]) => `${v} ${k.replace(/_/g, ' ')}`).join(", ")}) beserta kunci jawaban penilaian otomatis.`,
        assignmentId: newAssignment._id,
        questionsCount: structuredFinal.length,
        typesBreakdown: typesConfig,
        hasAnswerKeys: true,
      });
    }

    return NextResponse.json({ error: "Tujuan penugasan tidak valid (pilih Borneo EDU atau Tugas Baru)." }, { status: 400 });
  } catch (error: any) {
    console.error("[Generate Questions Error]", error);
    return NextResponse.json({ error: error.message || "Gagal membuat soal dari AI" }, { status: 500 });
  }
}
