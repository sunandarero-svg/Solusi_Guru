import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized. Hanya guru yang dapat menggunakan fitur AI ini." }, { status: 401 });
    }

    const { topic, className, subjectName, instructions } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topik materi wajib diisi." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let generatedContent = "";
    let generatedSummary = "";

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Anda adalah asisten kurikulum guru ahli di Indonesia. Buatkan materi pembelajaran terstruktur, mendalam, dan menarik untuk siswa sekolah.
Topik Pembelajaran: ${topic}
Sasaran Kelas: ${className || "Semua Kelas"}
Mata Pelajaran: ${subjectName || "Umum"}
${instructions ? `Instruksi / Catatan Khusus Guru: ${instructions}` : ""}

Formatkan output materi dalam struktur berikut:
# ${topic}

## 📌 Ringkasan Singkat (Summary)
(1-2 paragraf padat tentang inti sari materi ini)

## 🎯 Tujuan Pembelajaran
- (Poin 1)
- (Poin 2)
- (Poin 3)

## 📖 Pembahasan Materi Lengkap
(Uraikan konsep dasar, penjelasan rinci, rumus/istilah kunci, dan tahapan dengan bahasa yang mudah dipahami siswa)

## 💡 Contoh Penerapan Nyata & Kasus
(Berikan 2 contoh konkret di kehidupan sehari-hari atau fenomena alam/sosial yang relevan)

## 🧠 Pertanyaan Pemantik Refleksi
1. ...
2. ...
3. ...

Gunakan format teks Markdown yang rapi dan mudah dibaca.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        generatedContent = response.text || "";
        
        // Buat ringkasan singkat dari baris pertama / section ringkasan
        const summaryMatch = generatedContent.match(/## 📌 Ringkasan Singkat[\s\S]*?(?=## 🎯|$)/);
        if (summaryMatch) {
          generatedSummary = summaryMatch[0].replace(/## 📌 Ringkasan Singkat\s*/, "").trim();
        } else {
          generatedSummary = `Materi pembelajaran mendalam tentang ${topic} untuk ${className || "siswa"}.`;
        }
      } catch (aiErr: any) {
        console.warn("[Gemini Generate Material Warning]", aiErr);
      }
    }

    // Fallback template jika Gemini gagal atau API key sedang rate limited
    if (!generatedContent) {
      generatedSummary = `Materi pembelajaran interaktif mengenai konsep dasar dan penerapan ${topic} untuk jenjang ${className || "kelas"}.`;
      generatedContent = `# ${topic}

## 📌 Ringkasan Singkat (Summary)
${generatedSummary}

## 🎯 Tujuan Pembelajaran
- Memahami konsep fundamental dan definisi penting seputar ${topic}.
- Mampu menganalisis dan menghubungkan teori dengan penerapan nyata di lingkungan sekitar.
- Membangun keterampilan berpikir kritis dalam memecahkan masalah terkait ${topic}.

## 📖 Pembahasan Materi Lengkap
Topik ${topic} merupakan materi penting dalam kurikulum ${subjectName || "pelajaran"}. 
1. **Konsep Dasar**: Pemahaman awal mengenai struktur dan prinsip kerja ${topic}.
2. **Karakteristik & Unsur Utama**: Bagian-bagian penting yang membentuk ekosistem materi ini.
3. **Analisis Mendalam**: Bagaimana hubungan sebab-akibat berlangsung dan pengaruhnya dalam pembelajaran.

## 💡 Contoh Penerapan Nyata
- Pengamatan langsung di lingkungan sekolah dan rumah.
- Studi kasus teknologi dan sains masa kini.

## 🧠 Pertanyaan Pemantik Refleksi
1. Mengapa materi ${topic} sangat penting bagi kehidupan kita?
2. Bagaimana Anda dapat menerapkan pemahaman materi ini dalam tugas sekolah?`;
    }

    return NextResponse.json({
      success: true,
      topic,
      content: generatedContent,
      summary: generatedSummary,
    });
  } catch (error: any) {
    console.error("[Generate Material Error]", error);
    return NextResponse.json({ error: error.message || "Gagal membuat materi dari AI" }, { status: 500 });
  }
}
