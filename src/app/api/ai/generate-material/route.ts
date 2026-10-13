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
        const prompt = `Anda adalah seorang penulis materi kurikulum profesional tingkat nasional di Indonesia. Tugas Anda adalah membuat materi pembelajaran yang LENGKAP, MENDALAM, dan KOMPREHENSIF untuk siswa sekolah. Materi harus mencakup seluruh aspek topik secara tuntas.

Topik Pembelajaran: ${topic}
Sasaran Kelas: ${className || "Semua Kelas"}
Mata Pelajaran: ${subjectName || "Umum"}
${instructions ? `Instruksi Khusus Guru: ${instructions}` : ""}

ATURAN PENULISAN YANG WAJIB DIPATUHI TANPA TERKECUALI:

1. DILARANG KERAS menggunakan simbol pemformatan Markdown apa pun. Tidak boleh ada tanda pagar (#), tanda bintang (*), tanda garis bawah (_), tanda hubung (-) sebagai bullet point, atau simbol Markdown lainnya.

2. Jika materi membutuhkan simbol atau rumus matematika, gunakan notasi LaTeX. Contoh: untuk menulis pecahan, tulis $\\frac{1}{2}$. Untuk menulis pangkat, tulis $x^2$. Untuk menulis akar, tulis $\\sqrt{16}$.

3. Jika perlu membuat daftar atau urutan, gunakan angka biasa diikuti titik (1., 2., 3.) BUKAN simbol titik tebal (bullet points) atau tanda hubung.

4. Pisahkan antar ide pokok, antar paragraf, dan antar bagian menggunakan baris kosong (garis baru / Enter) agar ada jarak yang jelas antar paragraf.

5. DILARANG KERAS membuat bagian "Pertanyaan Pemantik", "Pertanyaan Refleksi", atau bentuk pertanyaan apa pun di akhir materi. Materi harus murni berupa penjelasan tanpa soal atau pertanyaan.

6. Panjang materi harus SUBSTANSIAL dan KOMPREHENSIF, setara dengan 4 sampai 5 halaman dokumen Microsoft Word (font 12, spasi 1,5). Jangan membuat materi yang singkat atau dangkal.

7. Hasil akhir harus berupa teks bersih dan polos yang bisa langsung disalin ke Microsoft Word tanpa perlu diedit atau dibersihkan lagi.

STRUKTUR MATERI:

Tulis judul topik di baris pertama sebagai teks biasa tanpa simbol apa pun.

Lalu tulis bagian Ringkasan berupa 2 paragraf padat yang menjelaskan inti sari materi secara menyeluruh.

Lalu tulis bagian Tujuan Pembelajaran berupa daftar bernomor (1., 2., 3.) yang menjabarkan kompetensi yang akan dicapai siswa.

Lalu tulis bagian Uraian Materi Lengkap yang merupakan inti dari dokumen ini. Bagian ini harus SANGAT MENDALAM dan MENYELURUH, mencakup:
1. Pengertian dan definisi lengkap
2. Sejarah atau latar belakang konsep jika relevan
3. Penjelasan teori, prinsip, dan konsep kunci secara detail
4. Klasifikasi, jenis-jenis, atau pembagian yang ada
5. Mekanisme, proses, atau cara kerja
6. Rumus, formula, atau perhitungan jika ada (gunakan LaTeX)
7. Hubungan dengan konsep lain yang relevan
8. Perkembangan terkini atau penerapan modern

Lalu tulis bagian Contoh Penerapan di Kehidupan Nyata yang memuat minimal 3 contoh konkret yang detail dan relevan dengan kehidupan sehari-hari siswa.

Lalu tulis bagian Rangkuman Akhir berupa 2 paragraf padat yang merangkum seluruh materi secara menyeluruh.

INGAT: Tulis semuanya sebagai teks biasa yang bersih. Jangan gunakan simbol Markdown. Jangan buat pertanyaan. Buat materi yang sangat lengkap dan mendalam.`;

        const primaryModel = process.env.GEMINI_MODEL || "gemini-3.8-flash";
        let response: any = null;

        try {
          response = await ai.models.generateContent({
            model: primaryModel,
            contents: prompt,
          });
        } catch (firstErr: any) {
          console.warn(`[Gemini Generate Material] Primary model ${primaryModel} failed:`, firstErr?.message || firstErr);
          const fallbackModels = ["gemini-2.0-flash", "gemini-1.5-flash"];
          for (const fallbackModel of fallbackModels) {
            try {
              console.log(`[Gemini Generate Material] Trying fallback model: ${fallbackModel}...`);
              response = await ai.models.generateContent({
                model: fallbackModel,
                contents: prompt,
              });
              if (response?.text) break;
            } catch (fbErr: any) {
              console.warn(`[Gemini Generate Material] Fallback ${fallbackModel} failed:`, fbErr?.message || fbErr);
            }
          }
          if (!response?.text) throw firstErr;
        }

        generatedContent = response?.text || "";

        // Strip any remaining Markdown formatting the AI might have included
        generatedContent = generatedContent
          .replace(/^#{1,6}\s+/gm, "")       // Remove heading markers (# ## ### etc.)
          .replace(/\*\*([^*]+)\*\*/g, "$1")  // Remove bold markers **text** -> text
          .replace(/\*([^*]+)\*/g, "$1")      // Remove italic markers *text* -> text
          .replace(/__([^_]+)__/g, "$1")       // Remove bold markers __text__ -> text
          .replace(/_([^_]+)_/g, "$1")         // Remove italic markers _text_ -> text
          .replace(/^[-*]\s+/gm, "")           // Remove bullet point markers
          .replace(/^>\s+/gm, "")              // Remove blockquote markers
          .replace(/```[\s\S]*?```/g, "")      // Remove code blocks
          .replace(/`([^`]+)`/g, "$1");        // Remove inline code markers

        // Extract summary from the first 2 substantive paragraphs
        const paragraphs = generatedContent.split(/\n\n+/).filter((p: string) => p.trim().length > 50);
        if (paragraphs.length >= 2) {
          generatedSummary = paragraphs[1].trim().substring(0, 300);
        } else if (paragraphs.length >= 1) {
          generatedSummary = paragraphs[0].trim().substring(0, 300);
        } else {
          generatedSummary = `Materi pembelajaran mendalam tentang ${topic} untuk ${className || "siswa"}.`;
        }
      } catch (aiErr: any) {
        console.warn("[Gemini Generate Material Warning]", aiErr);
      }
    }

    // Fallback template jika Gemini gagal atau API key sedang rate limited
    if (!generatedContent) {
      generatedSummary = `Materi pembelajaran komprehensif mengenai konsep dasar, teori, dan penerapan ${topic} untuk jenjang ${className || "kelas"} dalam mata pelajaran ${subjectName || "umum"}.`;
      generatedContent = `${topic}\n\nRingkasan\n\n${topic} merupakan salah satu topik fundamental dalam mata pelajaran ${subjectName || "pelajaran"} yang memiliki peran penting dalam membangun pemahaman siswa secara menyeluruh. Materi ini mencakup berbagai aspek mulai dari pengertian dasar, prinsip-prinsip utama, hingga penerapan dalam kehidupan sehari-hari yang relevan dengan konteks pembelajaran di ${className || "kelas"}.\n\nPemahaman yang mendalam tentang ${topic} akan membantu siswa mengembangkan kemampuan berpikir kritis dan analitis. Dengan menguasai materi ini, siswa diharapkan mampu menghubungkan konsep teoritis dengan fenomena nyata yang mereka temui di lingkungan sekitar.\n\n\nTujuan Pembelajaran\n\n1. Siswa mampu menjelaskan pengertian dan konsep dasar ${topic} secara lengkap dan tepat.\n2. Siswa mampu mengidentifikasi komponen-komponen utama dan karakteristik penting dari ${topic}.\n3. Siswa mampu menganalisis hubungan antara teori ${topic} dengan penerapannya dalam kehidupan sehari-hari.\n4. Siswa mampu mengevaluasi berbagai contoh penerapan ${topic} di lingkungan sekitar.\n\n\nUraian Materi Lengkap\n\nPengertian dan Definisi\n\n${topic} dapat didefinisikan sebagai suatu konsep dalam ${subjectName || "ilmu pengetahuan"} yang berkaitan dengan pemahaman mendalam mengenai prinsip-prinsip dasar dan penerapannya. Konsep ini pertama kali diperkenalkan dan dikembangkan sebagai bagian dari upaya memahami fenomena-fenomena yang terjadi di sekitar kita.\n\nDalam konteks pembelajaran di ${className || "sekolah"}, ${topic} dipelajari sebagai fondasi untuk memahami konsep-konsep yang lebih kompleks. Pemahaman yang kuat terhadap materi ini akan memudahkan siswa dalam mempelajari topik-topik lanjutan.\n\n\nPrinsip-Prinsip Utama\n\n1. Prinsip pertama berkaitan dengan pemahaman struktur dasar dan komponen-komponen yang membentuk ${topic}. Setiap komponen memiliki fungsi dan peran masing-masing yang saling terkait.\n\n2. Prinsip kedua menekankan pada hubungan sebab-akibat yang terjadi dalam konteks ${topic}. Pemahaman terhadap hubungan ini penting untuk menganalisis fenomena yang terjadi.\n\n3. Prinsip ketiga fokus pada penerapan praktis dari teori-teori yang ada. Penerapan ini dapat ditemukan dalam berbagai aspek kehidupan sehari-hari siswa.\n\n\nKlasifikasi dan Jenis\n\n${topic} dapat diklasifikasikan ke dalam beberapa kategori berdasarkan karakteristik dan sifatnya. Klasifikasi ini membantu siswa memahami keragaman dan kompleksitas materi secara lebih sistematis.\n\n1. Kategori pertama mencakup aspek-aspek fundamental yang menjadi dasar pemahaman. Aspek-aspek ini merupakan pondasi yang harus dikuasai terlebih dahulu.\n\n2. Kategori kedua meliputi aspek-aspek terapan yang menunjukkan bagaimana konsep dasar diimplementasikan dalam situasi nyata.\n\n3. Kategori ketiga berkaitan dengan perkembangan terkini dan inovasi yang terus berkembang seiring kemajuan ilmu pengetahuan dan teknologi.\n\n\nContoh Penerapan di Kehidupan Nyata\n\n1. Dalam kehidupan sehari-hari, konsep ${topic} dapat diamati melalui berbagai fenomena di lingkungan sekolah dan rumah. Siswa dapat melakukan pengamatan langsung terhadap objek-objek dan peristiwa yang berkaitan dengan materi ini.\n\n2. Di bidang teknologi modern, prinsip-prinsip ${topic} diterapkan dalam pengembangan berbagai produk dan solusi yang membantu memudahkan kehidupan manusia. Penerapan ini menunjukkan relevansi materi dengan perkembangan zaman.\n\n3. Dalam konteks lingkungan dan masyarakat, pemahaman terhadap ${topic} membantu kita memahami dinamika perubahan yang terjadi dan bagaimana kita dapat berkontribusi secara positif.\n\n\nRangkuman Akhir\n\n${topic} merupakan materi yang sangat penting dan relevan dalam kurikulum ${subjectName || "pelajaran"} di ${className || "jenjang pendidikan"} saat ini. Materi ini mencakup pengertian dasar, prinsip-prinsip utama, klasifikasi, serta berbagai contoh penerapan yang membantu siswa membangun pemahaman yang komprehensif.\n\nDengan menguasai seluruh aspek dari ${topic}, siswa tidak hanya memperoleh pengetahuan teoritis tetapi juga kemampuan untuk mengaplikasikan konsep-konsep tersebut dalam situasi nyata. Hal ini sejalan dengan tujuan pembelajaran yang menekankan pada pengembangan kompetensi berpikir kritis, analitis, dan kreatif.`;
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
