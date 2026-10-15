import { IFlashcardItem, ISlideItem, IMindMapItem, IInteractiveData } from "@/models/Material";

/**
 * Ekstraktor cerdas untuk mengonversi teks materi pembelajaran menjadi
 * Flash Card interaktif, Slide Presentasi, dan Peta Konsep (Mind Map).
 */
export function extractInteractiveDataFromMaterial(
  content: string,
  topicTitle?: string
): IInteractiveData {
  if (!content || typeof content !== "string") {
    return { flashcards: [], slides: [], mindmap: [] };
  }

  // Bersihkan judul topik
  const firstLine = content.split("\n")[0].trim();
  const cleanTopic = (topicTitle || firstLine || "Materi Pembelajaran").replace(/[#*_-]/g, "").trim();

  // Pisahkan teks menjadi paragraf-paragraf substantive
  const rawParagraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Cari bagian-bagian tertentu berdasarkan kata kunci judul bagian
  let ringkasanText = "";
  let tujuanList: string[] = [];
  let definisiText = "";
  let prinsipList: string[] = [];
  let klasifikasiList: string[] = [];
  let penerapanList: string[] = [];
  let rangkumanText = "";

  let currentSection = "intro";

  for (let i = 0; i < rawParagraphs.length; i++) {
    const p = rawParagraphs[i];
    const lower = p.toLowerCase();

    if (lower.startsWith("ringkasan")) {
      currentSection = "ringkasan";
      ringkasanText = p.replace(/^ringkasan\s*/i, "").trim();
      continue;
    }
    if (lower.startsWith("tujuan pembelajaran") || lower.includes("tujuan pembelajaran")) {
      currentSection = "tujuan";
      continue;
    }
    if (lower.startsWith("pengertian") || lower.startsWith("definisi") || lower.includes("pengertian dan definisi")) {
      currentSection = "definisi";
      definisiText = p.replace(/^pengertian.*?\n/i, "").trim();
      continue;
    }
    if (lower.includes("prinsip-prinsip") || lower.includes("prinsip utama")) {
      currentSection = "prinsip";
      continue;
    }
    if (lower.includes("klasifikasi") || lower.includes("jenis-jenis") || lower.includes("kategori")) {
      currentSection = "klasifikasi";
      continue;
    }
    if (lower.includes("contoh penerapan") || lower.includes("penerapan di kehidupan")) {
      currentSection = "penerapan";
      continue;
    }
    if (lower.startsWith("rangkuman") || lower.includes("rangkuman akhir")) {
      currentSection = "rangkuman";
      rangkumanText = p.replace(/^rangkuman.*?\n/i, "").trim();
      continue;
    }

    // Ambil isi sesuai section
    if (currentSection === "ringkasan" && !ringkasanText) {
      ringkasanText = p;
    } else if (currentSection === "definisi" && !definisiText) {
      definisiText = p;
    } else if (currentSection === "rangkuman" && !rangkumanText) {
      rangkumanText = p;
    } else if (currentSection === "tujuan") {
      const lines = p.split("\n").filter((l) => l.trim().length > 0);
      lines.forEach((l) => {
        const clean = l.replace(/^\d+[\.\)]\s*/, "").replace(/^[-*]\s*/, "").trim();
        if (clean.length > 5) tujuanList.push(clean);
      });
    } else if (currentSection === "prinsip") {
      const lines = p.split("\n").filter((l) => l.trim().length > 0);
      lines.forEach((l) => {
        const clean = l.replace(/^\d+[\.\)]\s*/, "").replace(/^[-*]\s*/, "").trim();
        if (clean.length > 5) prinsipList.push(clean);
      });
    } else if (currentSection === "klasifikasi") {
      const lines = p.split("\n").filter((l) => l.trim().length > 0);
      lines.forEach((l) => {
        const clean = l.replace(/^\d+[\.\)]\s*/, "").replace(/^[-*]\s*/, "").trim();
        if (clean.length > 5) klasifikasiList.push(clean);
      });
    } else if (currentSection === "penerapan") {
      const lines = p.split("\n").filter((l) => l.trim().length > 0);
      lines.forEach((l) => {
        const clean = l.replace(/^\d+[\.\)]\s*/, "").replace(/^[-*]\s*/, "").trim();
        if (clean.length > 5) penerapanList.push(clean);
      });
    }
  }

  // Fallback defaults jika teks bebas tanpa header formal
  if (!definisiText && rawParagraphs.length > 1) {
    definisiText = rawParagraphs[1];
  }
  if (!ringkasanText && rawParagraphs.length > 2) {
    ringkasanText = rawParagraphs[2];
  }
  if (!rangkumanText && rawParagraphs.length > 3) {
    rangkumanText = rawParagraphs[rawParagraphs.length - 1];
  }

  // =========================================================================
  // 1. GENERATE FLASH CARDS
  // =========================================================================
  const flashcards: IFlashcardItem[] = [];

  // Card 1: Definisi Dasar
  flashcards.push({
    id: "fc-1",
    front: `Apa pengertian dan hakikat utama dari ${cleanTopic}?`,
    back: definisiText || `${cleanTopic} merupakan konsep fundamental yang mempelajari struktur, fungsi, dan keterkaitan teori dengan fenomena nyata.`,
    category: "Definisi & Konsep Dasar",
  });

  // Card 2: Tujuan Pembelajaran
  if (tujuanList.length > 0) {
    flashcards.push({
      id: "fc-2",
      front: `Apa tujuan utama yang ingin dicapai setelah mempelajari ${cleanTopic}?`,
      back: `Siswa diharapkan mampu:\n• ${tujuanList.slice(0, 3).join("\n• ")}`,
      category: "Tujuan Pembelajaran",
    });
  } else {
    flashcards.push({
      id: "fc-2",
      front: `Mengapa materi ${cleanTopic} penting untuk dipelajari?`,
      back: `Materi ini melatih nalar kritis, kemampuan analisis, dan membantu memahami aplikasi konsep dalam lingkungan nyata.`,
      category: "Tujuan Pembelajaran",
    });
  }

  // Card 3: Prinsip Utama
  if (prinsipList.length > 0) {
    flashcards.push({
      id: "fc-3",
      front: `Sebutkan prinsip-prinsip penting yang mendasari ${cleanTopic}!`,
      back: prinsipList.slice(0, 3).join("\n\n"),
      category: "Prinsip Utama",
    });
  } else {
    flashcards.push({
      id: "fc-3",
      front: `Bagaimana prinsip dasar mekanisme kerja ${cleanTopic}?`,
      back: `Prinsip dasarnya berfokus pada keteraturan hubungan sebab-akibat, struktur komponen, dan konsistensi hukum ilmiah yang berlaku.`,
      category: "Prinsip Utama",
    });
  }

  // Card 4: Klasifikasi & Karakteristik
  if (klasifikasiList.length > 0) {
    flashcards.push({
      id: "fc-4",
      front: `Bagaimana pembagian atau klasifikasi dalam materi ${cleanTopic}?`,
      back: klasifikasiList.slice(0, 3).join("\n\n"),
      category: "Klasifikasi & Jenis",
    });
  } else {
    flashcards.push({
      id: "fc-4",
      front: `Apa saja karakteristik utama yang membedakan ${cleanTopic}?`,
      back: `Memiliki ciri khas struktural tersendiri, pola interaksi teratur, serta fleksibilitas dalam implementasi sains dan teknologi.`,
      category: "Karakteristik",
    });
  }

  // Card 5 & 6: Penerapan Nyata
  if (penerapanList.length > 0) {
    flashcards.push({
      id: "fc-5",
      front: `Berikan contoh konkret penerapan ${cleanTopic} di kehidupan sehari-hari!`,
      back: penerapanList[0] || `Dapat diamati langsung pada fenomena lingkungan sekitar kita sehari-hari.`,
      category: "Penerapan Nyata",
    });

    if (penerapanList.length > 1) {
      flashcards.push({
        id: "fc-6",
        front: `Bagaimana peran ${cleanTopic} dalam bidang teknologi atau lingkungan?`,
        back: penerapanList.slice(1, 3).join("\n\n"),
        category: "Aplikasi Teknologi & Lingkungan",
      });
    }
  } else {
    flashcards.push({
      id: "fc-5",
      front: `Sebutkan contoh penerapan nyata konsep ${cleanTopic}!`,
      back: `Diterapkan dalam pemecahan masalah praktis di lingkungan sekitar, industri teknologi, dan tata kelola kehidupan berkelanjutan.`,
      category: "Penerapan Nyata",
    });
  }

  // Card 7: Rangkuman & Intisari
  flashcards.push({
    id: `fc-${flashcards.length + 1}`,
    front: `Apa kesimpulan kunci yang wajib diingat dari materi ${cleanTopic}?`,
    back: rangkumanText || ringkasanText || `Penguasaan ${cleanTopic} memberikan bekal analitis untuk memecahkan persoalan kompleks dan menghubungkan teori dengan realitas.`,
    category: "Rangkuman Inti",
  });

  // Ekstraksi kartu tambahan dari list bernomor jika masih < 8
  if (flashcards.length < 8) {
    const extraMatches = content.match(/\d+[\.\)]\s+([^:\n]+)[:\-]\s*([^\n]+)/g);
    if (extraMatches && extraMatches.length > 0) {
      extraMatches.slice(0, 8 - flashcards.length).forEach((item, idx) => {
        const parts = item.split(/[:\-]/);
        if (parts.length >= 2) {
          const frontTitle = parts[0].replace(/^\d+[\.\)]\s*/, "").trim();
          const backDesc = parts.slice(1).join(":").trim();
          if (frontTitle.length > 3 && backDesc.length > 8) {
            flashcards.push({
              id: `fc-extra-${idx}`,
              front: `Apa yang dimaksud dengan ${frontTitle} pada ${cleanTopic}?`,
              back: backDesc,
              category: "Fakta Kunci",
            });
          }
        }
      });
    }
  }

  // =========================================================================
  // 2. GENERATE PRESENTATION SLIDES
  // =========================================================================
  const slides: ISlideItem[] = [
    {
      id: "slide-1",
      title: `Pengenalan ${cleanTopic}`,
      points: [
        `Konsep fundamental dalam mata pelajaran kurikulum nasional.`,
        definisiText.substring(0, 160) + (definisiText.length > 160 ? "..." : "") || `Membahas struktur dasar dan keterkaitannya dengan fenomena lingkungan.`,
        `Fondasi penting untuk jenjang pembelajaran tingkat lanjut.`,
      ],
      note: `Gunakan slide pembuka ini untuk memberikan gambaran besar konsep materi kepada siswa.`,
    },
    {
      id: "slide-2",
      title: `Tujuan Pembelajaran`,
      points:
        tujuanList.length > 0
          ? tujuanList.slice(0, 4)
          : [
              `Memahami definisi dan konsep esensial secara tuntas.`,
              `Menganalisis karakteristik dan mekanisme kerja.`,
              `Menghubungkan konsep teoritis dengan studi kasus konkret.`,
            ],
      note: `Pastikan siswa memahami target kompetensi yang harus dicapai pada sesi ini.`,
    },
    {
      id: "slide-3",
      title: `Prinsip & Teori Kunci`,
      points:
        prinsipList.length > 0
          ? prinsipList.slice(0, 4)
          : [
              `Prinsip pertama: Struktur dan relasi antar komponen pendukung.`,
              `Prinsip kedua: Hubungan kausalitas dan mekanisme yang bekerja.`,
              `Prinsip ketiga: Kaidah ilmiah yang konsisten dalam penerapannya.`,
            ],
      note: `Jelaskan secara perlahan prinsip inti dengan memberikan analogi sederhana.`,
    },
    {
      id: "slide-4",
      title: `Klasifikasi & Karakteristik`,
      points:
        klasifikasiList.length > 0
          ? klasifikasiList.slice(0, 4)
          : [
              `Kategori Dasar: Aspek fundamental yang membentuk sistem.`,
              `Kategori Terapan: Implementasi dalam konteks praktis.`,
              `Inovasi Terkini: Perkembangan modern dan riset kontemporer.`,
            ],
      note: `Bandingkan perbedaan dan persamaan antar masing-masing kategori.`,
    },
    {
      id: "slide-5",
      title: `Contoh Penerapan di Kehidupan Nyata`,
      points:
        penerapanList.length > 0
          ? penerapanList.slice(0, 4)
          : [
              `Penerapan dalam kehidupan sehari-hari di rumah dan sekolah.`,
              `Implementasi di bidang teknologi dan sains terapan.`,
              `Kontribusi terhadap kelestarian lingkungan dan masyarakat.`,
            ],
      note: `Ajak siswa berdiskusi mengenai contoh lain yang pernah mereka alami sendiri.`,
    },
    {
      id: "slide-6",
      title: `Rangkuman Akhir & Refleksi`,
      points: [
        rangkumanText.substring(0, 160) + (rangkumanText.length > 160 ? "..." : "") ||
          `${cleanTopic} merupakan topik yang komprehensif dan esensial.`,
        `Kunci sukses: Pahami konsep dasar, ingat prinsip utama, dan cermati contohnya.`,
        `Siap melanjutkan ke tantangan game Borneo EDU dan tugas refleksi!`,
      ],
      note: `Tutup sesi dengan menanyakan pertanyaan reflektif untuk menguji pemahaman siswa.`,
    },
  ];

  // =========================================================================
  // 3. GENERATE MIND MAP (PETA KONSEP)
  // =========================================================================
  const mindmap: IMindMapItem[] = [
    {
      topic: "1. Konsep & Definisi Dasar",
      subtopics: [
        "Pengertian umum konsep",
        "Latar belakang dan sejarah konsep",
        "Kompetensi dan tujuan pembelajaran",
      ],
    },
    {
      topic: "2. Struktur & Prinsip Inti",
      subtopics:
        prinsipList.length > 0
          ? prinsipList.slice(0, 3).map((p) => p.substring(0, 60))
          : [
              "Komponen penyusun sistem",
              "Hukum dan prinsip ilmiah",
              "Mekanisme dan proses kerja",
            ],
    },
    {
      topic: "3. Klasifikasi & Ciri Khas",
      subtopics:
        klasifikasiList.length > 0
          ? klasifikasiList.slice(0, 3).map((k) => k.substring(0, 60))
          : [
              "Kategori dasar & karakteristik",
              "Kategori lanjutan & perbedaannya",
              "Identifikasi pola keteraturan",
            ],
    },
    {
      topic: "4. Penerapan & Studi Kasus",
      subtopics:
        penerapanList.length > 0
          ? penerapanList.slice(0, 3).map((p) => p.substring(0, 60))
          : [
              "Observasi di lingkungan sekolah",
              "Penerapan teknologi modern",
              "Dampak sosial dan lingkungan",
            ],
    },
  ];

  return { flashcards, slides, mindmap };
}
