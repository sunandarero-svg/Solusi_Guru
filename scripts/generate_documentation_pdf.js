const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Colors Palette
const PRIMARY = '#0f766e'; // Deep Emerald Teal
const PRIMARY_DARK = '#115e59';
const PRIMARY_LIGHT = '#f0fdfa';
const SECONDARY = '#0369a1'; // Ocean Blue
const SECONDARY_LIGHT = '#f0f9ff';
const ACCENT = '#7c3aed'; // Purple Accent
const ACCENT_LIGHT = '#f5f3ff';
const AMBER = '#b45309';
const AMBER_LIGHT = '#fffbeb';
const DARK_TEXT = '#0f172a';
const BODY_TEXT = '#334155';
const MUTED_TEXT = '#64748b';
const BORDER_COLOR = '#cbd5e1';
const BORDER_LIGHT = '#e2e8f0';
const WHITE = '#ffffff';

const OUTPUT_FILE = path.join(__dirname, '../Solusi_Guru_Dokumen_Arsitektur_SOP_Manfaat.pdf');

async function generatePDF() {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 55, left: 45, right: 45 },
    bufferPages: true,
    autoFirstPage: false
  });

  const stream = fs.createWriteStream(OUTPUT_FILE);
  doc.pipe(stream);

  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const CONTENT_WIDTH = PAGE_WIDTH - 90; // 505.28
  const MAX_Y = 745;

  function ensureSpace(neededHeight) {
    if (doc.y + neededHeight > MAX_Y) {
      doc.addPage();
      doc.y = 55;
    }
  }

  function drawChapterHeader(title, subtitle) {
    ensureSpace(70);
    const startY = doc.y;

    // Left accent bar
    doc.rect(45, startY, 6, 38).fill(PRIMARY);

    doc.fillColor(PRIMARY)
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(title, 60, startY + 2, { width: CONTENT_WIDTH - 15 });

    if (subtitle) {
      doc.fillColor(MUTED_TEXT)
        .fontSize(9.5)
        .font('Helvetica-Oblique')
        .text(subtitle, 60, startY + 22, { width: CONTENT_WIDTH - 15 });
    }

    doc.y = startY + 48;
    // Horizontal divider
    doc.strokeColor(BORDER_LIGHT).lineWidth(1).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
    doc.y += 10;
  }

  function drawSubSection(title) {
    ensureSpace(32);
    const startY = doc.y;

    doc.rect(45, startY + 3, 4, 12).fill(SECONDARY);

    doc.fillColor(DARK_TEXT)
      .fontSize(11.5)
      .font('Helvetica-Bold')
      .text(title, 55, startY + 2, { width: CONTENT_WIDTH - 10 });

    doc.y = startY + 20;
  }

  function drawParagraph(text, options = {}) {
    ensureSpace(24);
    doc.fillColor(options.color || BODY_TEXT)
      .fontSize(options.size || 9.5)
      .font(options.font || 'Helvetica')
      .text(text, options.x || 45, doc.y, {
        width: options.width || CONTENT_WIDTH,
        align: options.align || 'justify',
        lineGap: options.lineGap || 3.5
      });
    doc.y += options.spacing || 7;
  }

  function drawCard(title, contentLines, type = 'teal') {
    const colorMap = {
      teal: { bg: PRIMARY_LIGHT, border: PRIMARY, title: PRIMARY_DARK },
      blue: { bg: SECONDARY_LIGHT, border: SECONDARY, title: SECONDARY },
      purple: { bg: ACCENT_LIGHT, border: ACCENT, title: ACCENT },
      amber: { bg: AMBER_LIGHT, border: AMBER, title: AMBER }
    };
    const c = colorMap[type] || colorMap.teal;

    // Approximate height calculation
    let estimatedHeight = 24; // padding + title
    contentLines.forEach(l => {
      estimatedHeight += Math.ceil(l.length / 85) * 14 + 3;
    });

    ensureSpace(estimatedHeight + 10);
    const startY = doc.y;
    const cardWidth = CONTENT_WIDTH;

    // Background and left border
    doc.rect(45, startY, cardWidth, estimatedHeight).fill(c.bg);
    doc.rect(45, startY, 4, estimatedHeight).fill(c.border);
    doc.rect(45, startY, cardWidth, estimatedHeight).strokeColor(BORDER_LIGHT).lineWidth(0.5).stroke();

    let curY = startY + 7;
    if (title) {
      doc.fillColor(c.title).font('Helvetica-Bold').fontSize(10).text(title, 56, curY, { width: cardWidth - 20 });
      curY += 15;
    }

    doc.font('Helvetica').fontSize(9).fillColor(BODY_TEXT);
    contentLines.forEach(line => {
      doc.text(line, 56, curY, { width: cardWidth - 22, lineGap: 2.5, align: 'justify' });
      const lineH = Math.ceil(line.length / 85) * 12 + 3;
      curY += lineH;
    });

    doc.y = startY + estimatedHeight + 9;
  }

  function drawTable(headers, rows, colWidths, options = {}) {
    ensureSpace(50);

    const startX = 45;
    let curY = doc.y;

    // Draw Header
    const headerHeight = 22;
    doc.rect(startX, curY, CONTENT_WIDTH, headerHeight).fill(PRIMARY_DARK);

    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(WHITE);
    let xOffset = startX;
    headers.forEach((h, idx) => {
      doc.text(h, xOffset + 5, curY + 6, { width: colWidths[idx] - 10, align: 'left' });
      xOffset += colWidths[idx];
    });

    curY += headerHeight;

    // Draw Rows
    rows.forEach((row, rIdx) => {
      // Calculate row height based on longest column text
      let maxLines = 1;
      row.forEach((cell, cIdx) => {
        const charPerLine = Math.floor(colWidths[cIdx] / 5.2);
        const lines = Math.ceil(cell.length / charPerLine);
        if (lines > maxLines) maxLines = lines;
      });
      const rowHeight = Math.max(20, maxLines * 12 + 8);

      if (curY + rowHeight > MAX_Y) {
        doc.addPage();
        curY = 55;
        // Redraw Header on new page
        doc.rect(startX, curY, CONTENT_WIDTH, headerHeight).fill(PRIMARY_DARK);
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(WHITE);
        let xOff = startX;
        headers.forEach((h, idx) => {
          doc.text(h, xOff + 5, curY + 6, { width: colWidths[idx] - 10, align: 'left' });
          xOff += colWidths[idx];
        });
        curY += headerHeight;
      }

      const bg = rIdx % 2 === 0 ? WHITE : '#f8fafc';
      doc.rect(startX, curY, CONTENT_WIDTH, rowHeight).fill(bg);
      doc.rect(startX, curY, CONTENT_WIDTH, rowHeight).strokeColor(BORDER_LIGHT).lineWidth(0.5).stroke();

      xOffset = startX;
      doc.font('Helvetica').fontSize(8).fillColor(BODY_TEXT);
      row.forEach((cell, cIdx) => {
        doc.text(cell, xOffset + 5, curY + 5, { width: colWidths[cIdx] - 10, align: 'left', lineGap: 1.5 });
        xOffset += colWidths[cIdx];
      });

      curY += rowHeight;
    });

    doc.y = curY + 12;
  }

  function drawWorkflowStep(number, role, title, desc) {
    ensureSpace(42);
    const startY = doc.y;
    const cardWidth = CONTENT_WIDTH;

    // Circle number badge
    doc.circle(60, startY + 16, 12).fill(PRIMARY);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(WHITE).text(number.toString(), 56, startY + 12, { width: 8, align: 'center' });

    // Step Content Card
    doc.rect(80, startY, cardWidth - 35, 34).fill(WHITE);
    doc.rect(80, startY, cardWidth - 35, 34).strokeColor(BORDER_LIGHT).lineWidth(0.8).stroke();
    doc.rect(80, startY, 3, 34).fill(SECONDARY);

    // Role badge
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(SECONDARY).text(`[ROLE: ${role}]`, 90, startY + 5);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK_TEXT).text(title, 160, startY + 5, { width: 330 });

    doc.font('Helvetica').fontSize(8).fillColor(BODY_TEXT).text(desc, 90, startY + 18, { width: cardWidth - 55, lineGap: 1 });

    doc.y = startY + 40;
  }

  // ==========================================
  // PAGE 1: COVER PAGE
  // ==========================================
  doc.addPage();

  // Decorative Top Accent Band
  doc.rect(0, 0, PAGE_WIDTH, 14).fill(PRIMARY);
  doc.rect(0, 14, PAGE_WIDTH, 6).fill(SECONDARY);

  // Logo if exists
  const logoPath = path.join(__dirname, '../public/logo.png');
  let topOffset = 70;
  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, (PAGE_WIDTH - 85) / 2, topOffset, { width: 85, height: 85 });
      topOffset += 100;
    } catch (e) {
      topOffset += 20;
    }
  }

  // Badge
  doc.rect((PAGE_WIDTH - 280) / 2, topOffset, 280, 22).fill(PRIMARY_LIGHT);
  doc.rect((PAGE_WIDTH - 280) / 2, topOffset, 280, 22).strokeColor(PRIMARY).lineWidth(1).stroke();
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(PRIMARY)
    .text('DOKUMEN RESMI BLUEPRINT & PANDUAN STRATEGIS', (PAGE_WIDTH - 280) / 2, topOffset + 6, { width: 280, align: 'center' });

  topOffset += 38;

  // Title
  doc.font('Helvetica-Bold').fontSize(26).fillColor(DARK_TEXT)
    .text('SOLUSI GURU', 45, topOffset, { width: CONTENT_WIDTH, align: 'center' });

  topOffset += 34;

  doc.font('Helvetica-Bold').fontSize(14).fillColor(PRIMARY)
    .text('Sistem Penilaian Tulisan Tangan Siswa Berbasis AI & Pembelajaran Interaktif', 45, topOffset, { width: CONTENT_WIDTH, align: 'center' });

  topOffset += 25;

  // Tagline
  doc.font('Helvetica-Oblique').fontSize(10.5).fillColor(MUTED_TEXT)
    .text('"AI Tidak Akan Menggantikan Peran Guru, Namun Memberdayakan Pendidikan"', 45, topOffset, { width: CONTENT_WIDTH, align: 'center' });

  topOffset += 40;

  // Meta Box
  const metaBoxY = topOffset;
  doc.rect(55, metaBoxY, PAGE_WIDTH - 110, 190).fill(WHITE);
  doc.rect(55, metaBoxY, PAGE_WIDTH - 110, 190).strokeColor(BORDER_COLOR).lineWidth(1).stroke();
  doc.rect(55, metaBoxY, PAGE_WIDTH - 110, 28).fill(PRIMARY_DARK);

  doc.font('Helvetica-Bold').fontSize(10).fillColor(WHITE)
    .text('INFORMASI DOKUMEN & SPESIFIKASI OPERASIONAL', 65, metaBoxY + 9, { width: PAGE_WIDTH - 130, align: 'center' });

  const metaRows = [
    ['Judul Dokumen', ': Dokumen Arsitektur, SOP Penggunaan, Manfaat, & Mitigasi Risiko'],
    ['Ekosistem Aplikasi', ': Solusi Guru (Next.js 16, React 19, MongoDB, AI Vision Multi-Cascade)'],
    ['Edisi / Versi', ': 2.4 - Full Production Edition (Oktober 2026)'],
    ['Target Stakeholder', ': Guru Mata Pelajaran, Kepala Sekolah, Siswa, Admin IT, dan Orang Tua'],
    ['Klasifikasi Akses', ': Panduan Resmi Pengelolaan & Implementasi Transformasi Digital'],
    ['Pengembang Sistem', ': Tim Pengembang Solusi Guru & Inovasi Teknologi Pendidikan']
  ];

  let mY = metaBoxY + 38;
  metaRows.forEach(([lbl, val]) => {
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(DARK_TEXT).text(lbl, 75, mY, { width: 125 });
    doc.font('Helvetica').fontSize(8.5).fillColor(BODY_TEXT).text(val, 205, mY, { width: PAGE_WIDTH - 325 });
    mY += 23;
  });

  // Callout Quote at bottom of cover
  const quoteY = 660;
  doc.rect(45, quoteY, CONTENT_WIDTH, 75).fill(PRIMARY_LIGHT);
  doc.rect(45, quoteY, 4, 75).fill(PRIMARY);
  doc.rect(45, quoteY, CONTENT_WIDTH, 75).strokeColor(BORDER_LIGHT).lineWidth(0.5).stroke();

  doc.font('Helvetica-Bold').fontSize(9).fillColor(PRIMARY_DARK)
    .text('PRINSIP DASAR TEKNOLOGI (HUMAN-IN-THE-LOOP)', 56, quoteY + 10);

  doc.font('Helvetica').fontSize(8.5).fillColor(BODY_TEXT)
    .text('Solusi Guru dirancang bukan untuk mengotomatisasi guru secara membabi buta, melainkan sebagai asisten cerdas yang memangkas 75% beban mekanis koreksi esai tulisan tangan. Integritas akademis tetap berada di tangan guru sebagai penilai mutlak (Human-in-the-Loop), sementara siswa tetap mempertahankan esensi keterampilan motorik menulis di atas kertas.', 56, quoteY + 24, { width: CONTENT_WIDTH - 22, align: 'justify', lineGap: 2 });

  // Bottom Footer band on cover
  doc.rect(0, PAGE_HEIGHT - 12, PAGE_WIDTH, 12).fill(PRIMARY);


  // ==========================================
  // PAGE 2: RINGKASAN EKSEKUTIF & DAFTAR ISI
  // ==========================================
  doc.addPage();
  doc.y = 55;

  drawChapterHeader('RINGKASAN EKSEKUTIF', 'Latar Belakang Transformasi Penilaian Tulisan Tangan di Era AI');

  drawParagraph('Kemajuan kecerdasan buatan generatif membawa dilema ganda dalam dunia pendidikan modern. Di satu sisi, ketergantungan peserta didik terhadap salin-tempel (copy-paste) berbasis teks digital telah mendegradasi kemampuan literasi mendalam dan keterampilan motorik halus menulis tangan. Di sisi lain, guru menghadapi beban administratif luar biasa ketika harus mengoreksi puluhan hingga ratusan lembar jawaban esai tulisan tangan secara manual setiap minggunya, yang kerap memicu kelelahan mental (grading burnout) dan memperlambat umpan balik bagi siswa.');

  drawParagraph('Platform Solusi Guru hadir memberikan terobosan komprehensif: memadukan kebiasaan menulis di atas kertas fisik dengan teknologi mutakhir Computer Vision dan Large Multimodal Models (LMM). Siswa tetap menulis jawaban di lembar kertas ujian, lalu memotretnya menggunakan kamera gawai atau webcam. Sistem secara otomatis melakukan edge-detection, peningkatan kontras citra, ekstraksi tulisan tangan (OCR/Vision), perbandingan dengan rubrik kriteria guru, serta menyajikan draf analisis nilai per butir soal lengkap dengan deteksi salah eja (typo).');

  drawCard('Pilar Utama Platform Solusi Guru', [
    '1. Preservasi Budaya Menulis: Menjaga tradisi menulis tangan sebagai sarana stimulasi kognitif motorik siswa.',
    '2. Efisiensi Kerja Guru: Memangkas waktu penilaian esai dari rata-rata 8-10 menit per siswa menjadi kurang dari 1 menit per siswa.',
    '3. Human-in-the-Loop Governance: Guru memegang kendali penuh untuk meninjau, mengoreksi, dan menyetujui skor rekomendasi AI.',
    '4. Transparansi & Hak Siswa: Dilengkapi sistem sanggahan nilai (Student Appeal) untuk melatih argumentasi kritis dan akuntabilitas.',
    '5. Ekosistem Edukasi Utuh: Terintegrasi dengan Presensi Digital, Jurnal Mengajar Harian, Supervisi Kepala Sekolah, dan Gamifikasi Borneo Edu.'
  ], 'teal');

  doc.y += 5;
  drawSubSection('Struktur Dokumen Panduan');

  const tocHeaders = ['Bab / Bagian', 'Pokok Pembahasan', 'Halaman'];
  const tocRows = [
    ['BAB 1: Arsitektur Sistem', 'Arsitektur berlapis, diagram komponen, AI Cascade Engine, pipeline OCR & visi', 'Halaman 3'],
    ['BAB 2: Standar Operasional Prosedur', 'SOP terperinci peran Admin, Guru Mapel, Siswa, dan Kepala Sekolah', 'Halaman 5'],
    ['BAB 3: Analisis Manfaat Stakeholder', 'Matriks manfaat bagi Guru, Siswa, Kepala Sekolah, dan Orang Tua Siswa', 'Halaman 7'],
    ['BAB 4: Kelebihan, Kekurangan & Mitigasi', 'Kelebihan sistem, 5 risiko operasional lapangan, dan 6 strategi mitigasi terukur', 'Halaman 9'],
    ['BAB 5: Kesimpulan & Roadmap Adopsi', 'Tahapan implementasi 4 minggu di sekolah dan komitmen penjaminan mutu', 'Halaman 11']
  ];
  drawTable(tocHeaders, tocRows, [160, 275, 70]);


  // ==========================================
  // PAGE 3: BAB 1 - ARSITEKTUR SISTEM
  // ==========================================
  doc.addPage();
  doc.y = 55;

  drawChapterHeader('BAB 1: ARSITEKTUR SISTEM & SPESIFIKASI TEKNIS', 'Desain Multi-Tier Berkinerja Tinggi, Skalabilitas Cloud, dan AI Vision Cascade');

  drawParagraph('Arsitektur Solusi Guru dibangun dengan pendekatan modern decoupled multi-tier berbasis Next.js 16 App Router dan TypeScript, dirancang untuk mendukung ribuan pengumpulan berkas tulisan tangan secara simultan dengan latensi rendah dan ketersediaan tinggi (high availability).');

  drawSubSection('1.1 Lapisan Arsitektur (Multi-Tier Architecture)');

  const archHeaders = ['Lapisan (Tier)', 'Teknologi Utama', 'Tanggung Jawab & Fungsi Sistem'];
  const archRows = [
    ['Presentation Tier (Klien)', 'Next.js 16, React 19, Tailwind CSS, Lucide Icons, JScanify', 'Antarmuka responsif ramah gawai, edge detection lembar kertas, kompresi gambar di browser, live student monitoring.'],
    ['Application Tier (Server)', 'Node.js 26, Next.js Server Actions, Route Handlers, NextAuth v4', 'Logika bisnis penugasan, otentikasi berbasis JWT multi-role (Admin, Guru, Siswa, Kepsek), kontrol akses RBAC.'],
    ['AI & Vision Pipeline Tier', 'Google Gemini 1.5 Flash, Groq Vision, OpenRouter, Tesseract.js, Sharp', 'Preprocessing kontras citra, ekstraksi tulisan tangan (OCR), pembedahan butir soal, kalkulasi rubrik, deteksi typo.'],
    ['Persistence Tier (Database)', 'MongoDB 6.x, Mongoose ODM, Relational Indexing', 'Penyimpanan dokumen terindeks: User, Assignment, Submission, AnswerAnalysis, Rubric, Attendance, TeacherJournal.']
  ];
  drawTable(archHeaders, archRows, [110, 140, 255]);

  drawSubSection('1.2 Diagram Alur Pemrosesan Tulisan Tangan (Image-to-Score Pipeline)');

  drawCard('Alur Pemrosesan Dari Lembar Fisik Hingga Terbit Nilai', [
    'Langkah 1 (Capture): Siswa memotret lembar jawaban fisik via kamera browser. Modul JScanify mendeteksi 4 sudut kertas dan melakukan perspective warping otomatis agar lembar tegak lurus.',
    'Langkah 2 (Client Compression): Modul browser-image-compression mengompresi gambar dari 5-8MB menjadi <350KB tanpa merusak keterbacaan teks guna menghemat kuota internet siswa.',
    'Langkah 3 (Server Preprocessing): Modul Sharp melakukan normalisasi kontras, grayscale, dan sharpening untuk memperjelas guratan tinta tulisan tangan.',
    'Langkah 4 (AI Multi-Cascade): Citra dikirim ke AI Vision Primary (Gemini 1.5). Jika kuota/rate-limit terlampaui, otomatis beralih (failover) ke Groq LLaMA 3.2 Vision atau OpenRouter.',
    'Langkah 5 (Rubric Decomposition): AI membaca soal nomor per nomor, membandingkan jawaban dengan kunci guru & kriteria rubrik, mencatat poin, serta menandai kata yang salah eja.',
    'Langkah 6 (Human Review Gate): Hasil masuk antrean review Guru berstatus NEEDS_TEACHER_REVIEW. Guru memeriksa dan menekan tombol Approve & Publish.',
    'Langkah 7 (Publication & Appeal): Nilai tampil di dasbor siswa. Siswa dapat melihat analisis detail dan memiliki opsi mengajukan sanggahan (Appeal).'
  ], 'blue');


  // ==========================================
  // PAGE 4: BAB 1 (LANJUTAN) - RESILIENSI & KEAMANAN
  // ==========================================
  doc.addPage();
  doc.y = 55;

  drawSubSection('1.3 Arsitektur AI Multi-Provider Cascade (Toleransi Gangguan)');
  drawParagraph('Salah satu keunggulan teknis mendasar dari Solusi Guru adalah ketiadaan ketergantungan pada satu penyedia AI tunggal (*Single Point of Failure*). Modul AI Cascade dirancang dengan skema failover berjenjang otomatis:');

  const cascadeHeaders = ['Tingkat Prioritas', 'Penyedia / Model', 'Karakteristik & Mekanisme Transisi'];
  const cascadeRows = [
    ['Tingkat 1 (Utama)', 'Google Gemini 1.5 Flash / Pro', 'Akurasi pemahaman tulisan tangan Latin dan rumus matematika tinggi, kecepatan inferensi 2-3 detik per halaman.'],
    ['Tingkat 2 (Failover 1)', 'Groq Cloud (LLaMA 3.2 Vision)', 'Aktif seketika saat kuota Gemini mencapai batas atau respon >8 detik. Inferensi ultra cepat dengan LPU Architecture.'],
    ['Tingkat 3 (Failover 2)', 'OpenRouter Multi-LLM API', 'Jembatan multi-model terpadu (Claude 3.5 Sonnet / Mistral Vision) sebagai cadangan sekunder ketersediaan cloud.'],
    ['Tingkat 4 (Resilient Offline)', 'Tesseract.js Engine (Local OCR)', 'Cadangan pemrosesan OCR lokal berbasis kata kunci saat koneksi cloud terputus total untuk menjamin antrean tetap jalan.']
  ];
  drawTable(cascadeHeaders, cascadeRows, [105, 145, 255]);

  drawSubSection('1.4 Keamanan Data, Privasi Siswa, & Penegakan Etika');
  drawParagraph('Perlindungan data anak didik merupakan prioritas tertinggi. Solusi Guru menerapkan serangkaian protokol keamanan komprehensif:');

  drawCard('Standar Keamanan dan Privasi Data', [
    '• Zero Data Retention for Model Training: API AI yang digunakan terikat klausul Enterprise di mana data citra dan jawaban siswa tidak dijadikan bahan pelatihan model publik penyedia AI.',
    '• Isolasi Hak Akses (RBAC): Token sesi JWT mengenkripsi role pengguna. Siswa hanya dapat mengakses tugas di kelasnya; Guru hanya mengelola mata pelajaran yang ditugaskan; Kepala Sekolah memiliki akses supervisi read-only eksekutif.',
    '• Kriptografi Kata Sandi: Seluruh password dienkripsi searah menggunakan algoritma Bcrypt dengan salt rounds 10.',
    '• Jejak Audit & Anti-Curang: Sistem mencatat timestamp penyerahan tugas, riwayat pengubahan lembar jawaban (hasChangedAnswer), serta alamat IP pengumpul.'
  ], 'purple');

  drawSubSection('1.5 Modul Pendukung: Gamifikasi Interaktif (Borneo Edu)');
  drawParagraph('Selain penilaian tulisan tangan, platform mengintegrasikan modul pembelajaran interaktif *Borneo Edu*. Mengusung pendekatan *gamified learning*, siswa menjelajahi dunia petualangan berbasis peta pulau Kalimantan, menuntaskan kuis per level, melawan Boss Monster materi, meraih combo koin, dan mengoleksi lencana prestasi (badges). Seluruh rekap skor kuis terdata langsung ke buku nilai guru.');


  // ==========================================
  // PAGE 5: BAB 2 - SOP PENGGUNAAN
  // ==========================================
  doc.addPage();
  doc.y = 55;

  drawChapterHeader('BAB 2: STANDAR OPERASIONAL PROSEDUR (SOP)', 'Panduan Langkah Demi Langkah Operasional Berdasarkan Peran Pengguna (Role)');

  drawParagraph('Agar implementasi Solusi Guru berjalan tertib, transparan, dan terstandarisasi, disusun Standar Operasional Prosedur (SOP) formal bagi setiap entitas pengguna: Administrator, Guru Mata Pelajaran, Siswa, dan Kepala Sekolah.');

  drawSubSection('2.1 SOP Administrator Sekolah (Pengelolaan Akun & Kurikulum)');

  drawWorkflowStep(1, 'ADMIN', 'Pendaftaran Pengguna & Guru', 'Mendaftarkan akun Guru dan Kepala Sekolah melalui menu Manajemen Pengguna. Menetapkan batas kuota kelas dan siswa.');
  drawWorkflowStep(2, 'ADMIN', 'Konfigurasi Kelas & Mata Pelajaran', 'Membuat daftar rombongan belajar (misal: Kelas X-A, XI-IPA) dan mendaftarkan master mata pelajaran.');
  drawWorkflowStep(3, 'ADMIN', 'Import Data Siswa (Batch NISN)', 'Mengunggah data siswa per rombel melalui template Excel/CSV. Sistem otomatis membuat username berbasis NIS dan password default.');
  drawWorkflowStep(4, 'ADMIN', 'Pemetaan Guru-Kelas (Mapping)', 'Menghubungkan Guru Pengampu dengan Rombel dan Mata Pelajaran yang diampu agar jadwal mengajar terhubung rapi.');

  doc.y += 5;
  drawSubSection('2.2 SOP Guru Mata Pelajaran (Perancangan, Pengawasan, & Verifikasi)');

  drawWorkflowStep(1, 'GURU', 'Login & Masuk Dasbor Guru', 'Masuk menggunakan username alias "guru" atau email dinas terdaftar beserta kata sandi pribadi.');
  drawWorkflowStep(2, 'GURU', 'Membuat Penugasan & Rubrik AI', 'Membuat tugas baru: masukkan judul, batas akhir (deadline), panduan jawaban (Kunci AI), dan kriteria rubrik (skor maks).');
  drawWorkflowStep(3, 'GURU', 'Memantau Penyerahan Berkas', 'Melihat daftar siswa yang telah mengumpulkan (Status SUBMITTED / AI_COMPLETED). Notifikasi otomatis muncul saat tugas siap ditinjau.');
  drawWorkflowStep(4, 'GURU', 'Human Review & Penyesuaian Skor', 'Membuka lembar koreksi: mencocokkan foto asli dengan transkripsi AI, memeriksa rekomendasi nilai, mengedit skor bila perlu, dan memberi catatan motivasi.');
  drawWorkflowStep(5, 'GURU', 'Penerbitan Nilai & Presensi', 'Mengklik "Approve & Publish" untuk merilis nilai resmi. Dilanjutkan mengisi Jurnal Mengajar Harian dan presensi kehadiran kelas.');


  // ==========================================
  // PAGE 6: BAB 2 (LANJUTAN) - SOP SISWA & KEPALA SEKOLAH
  // ==========================================
  doc.addPage();
  doc.y = 55;

  drawSubSection('2.3 SOP Siswa (Pengerjaan, Pemindaian, & Peninjauan Hasil)');

  drawWorkflowStep(1, 'SISWA', 'Login Menggunakan NIS', 'Siswa membuka portal login, memasukkan NIS (Nomor Induk Siswa) dan password. Pada login pertama, siswa diwajibkan memperbarui kata sandi.');
  drawWorkflowStep(2, 'SISWA', 'Pengerjaan di Lembar Fisik', 'Melihat rincian soal tugas di menu "Tugas Saya". Menuliskan jawaban esai di buku tulis atau kertas folio bergaris dengan tulisan tangan rapi.');
  drawWorkflowStep(3, 'SISWA', 'Pemotretan & Penyesuaian Sudut', 'Mengklik tombol "Kumpulkan Tugas". Menggunakan kamera ponsel untuk memotret lembar jawaban. Menyesuaikan batas bingkai kertas agar tidak terpotong.');
  drawWorkflowStep(4, 'SISWA', 'Kirim Berkas & Tunggu Hasil', 'Mengklik "Kirim Tugas". Sistem menampilkan status "Memproses AI". Siswa dapat beristirahat sembari sistem memproses analisis awal.');
  drawWorkflowStep(5, 'SISWA', 'Melihat Umpan Balik & Sanggahan', 'Setelah guru mempublikasikan nilai, siswa melihat rincian nilai per nomor dan deteksi typo. Jika terdapat ketidaksesuaian, siswa dapat menekan tombol "Ajukan Sanggahan" dengan menyertakan argumen.');

  doc.y += 10;
  drawSubSection('2.4 SOP Kepala Sekolah (Supervisi Akademik & Pengawasan Mutu)');

  drawWorkflowStep(1, 'KEPSEK', 'Login Dasbor Supervisi', 'Mengakses portal menggunakan akun resmi Kepala Sekolah (alias "kepsek"). Tampilan khusus dasbor eksekutif langsung disajikan.');
  drawWorkflowStep(2, 'KEPSEK', 'Monitoring Keterisian Jurnal Guru', 'Memeriksa agenda kegiatan belajar mengajar harian guru secara berkala. Memastikan seluruh jam pelajaran terisi materi dan deskripsi pembelajaran.');
  drawWorkflowStep(3, 'KEPSEK', 'Analisis Rekapitulasi Presensi', 'Mengevaluasi persentase kehadiran siswa per rombongan belajar guna mendeteksi kelas dengan angka ketidakhadiran (alpa/sakit) yang tidak wajar.');
  drawWorkflowStep(4, 'KEPSEK', 'Audit Mutu & Distribusi Nilai', 'Menelaah distribusi capaian kompetensi siswa lintas mata pelajaran untuk merumuskan kebijakan bimbingan remedial terarah atau apresiasi prestasi.');


  // ==========================================
  // PAGE 7: BAB 3 - ANALISIS MANFAAT STAKEHOLDER
  // ==========================================
  doc.addPage();
  doc.y = 55;

  drawChapterHeader('BAB 3: ANALISIS MANFAAT BAGI SELURUH STAKEHOLDER', 'Value Proposition Nyata Bagi Guru, Siswa, Kepala Sekolah, dan Orang Tua Siswa');

  drawParagraph('Implementasi Solusi Guru memberikan dampak positif yang terukur dan signifikan pada seluruh ekosistem sekolah. Berikut rincian manfaat strategis bagi masing-masing pihak:');

  drawSubSection('3.1 Manfaat untuk Guru Mata Pelajaran');
  drawCard('Dampak Nyata Terhadap Kinerja & Kesejahteraan Guru', [
    '• Penghematan Waktu Koreksi Hingga 75%: Menghilangkan kejenuhan mekanis membaca ratusan lembar esai tulisan tangan yang sulit dibaca. Guru hanya bertindak sebagai verifikator akhir.',
    '• Objektivitas Penilaian Bebas Bias Kelelahan: Menghilangkan kecenderungan nilai menurun pada lembar jawaban terakhir akibat guru kelelahan (grading fatigue). Rubrik diterapkan merata pada setiap siswa.',
    '• Deteksi Dini Typo & Salah Konsep: Sistem otomatis menandai kata yang salah eja dan menyajikan ringkasan kata kunci konsep yang terlewat oleh siswa.',
    '• Tertib Administrasi Tanpa Kertas: Buku nilai, riwayat presensi harian siswa, dan jurnal mengajar tersimpan rapi di cloud, siap diunduh ke Excel sewaktu-waktu.'
  ], 'teal');

  drawSubSection('3.2 Manfaat untuk Siswa');
  drawCard('Dampak Positif Terhadap Kualitas Belajar Siswa', [
    '• Menjaga Keterampilan Motorik Halus: Siswa tidak kehilangan budaya menulis tangan di atas kertas fisik, yang terbukti secara neuro-sains memperkuat retensi memori jangka panjang dibanding mengetik.',
    '• Umpan Balik Instan dan Transparan: Siswa menerima rincian skor per butir soal, bukan sekadar angka akhir, sehingga siswa mengerti persis letak kelemahan dan kekurangannya.',
    '• Ruang Diskusi dan Keadilan (Appeal System): Mengikis rasa ketidakadilan dalam pemberian nilai. Siswa dilatih berani berargumentasi secara santun dan ilmiah saat mengajukan sanggahan nilai.',
    '• Peningkatan Motivasi Melalui Borneo Edu: Variasi belajar kuis interaktif petualangan membuat proses belajar lebih mengasyikkan dan memicu semangat kompetisi positif.'
  ], 'blue');


  // ==========================================
  // PAGE 8: BAB 3 (LANJUTAN) - MANFAAT KEPALA SEKOLAH & ORANG TUA
  // ==========================================
  doc.addPage();
  doc.y = 55;

  drawSubSection('3.3 Manfaat untuk Kepala Sekolah & Manajemen');
  drawCard('Manfaat Manajerial & Supervisi Mutu Sekolah', [
    '• Real-Time Academic Visibility: Kepala sekolah dapat melihat peta capaian belajar sekolah secara langsung tanpa menunggu laporan akhir semester dari guru.',
    '• Supervisi Guru Tanpa Birokrasi Meja: Memantau kedisiplinan mengajar dan materi yang disampaikan guru melalui modul Jurnal Mengajar Digital secara transparan dan terukur.',
    '• Kesiapan Data Akreditasi (BAN-S/M): Seluruh artefak penugasan siswa, rubrik kurikulum, dan rekapitulasi penilaian terdokumentasi rapi dalam sistem cloud, siap dipresentasikan kepada asesor akreditasi.',
    '• Pengambilan Kebijakan Berbasis Data (Data-Driven Decision): Mempermudah identifikasi mata pelajaran atau kelas yang membutuhkan perhatian khusus atau program bimbingan remedial.'
  ], 'purple');

  drawSubSection('3.4 Manfaat untuk Orang Tua Siswa');
  drawCard('Ketenangan Pikiran & Transparansi Perkembangan Anak', [
    '• Kepastian Anak Belajar Nyata: Orang tua tenang karena anak tetap memegang pena dan menulis di buku catatan, meminimalisir risiko ketergantungan gawai yang pasif.',
    '• Transparansi Hasil Belajar: Orang tua dapat melihat progres nilai tugas anak secara jelas beserta catatan apresiasi maupun koreksi dari guru.',
    '• Pemantauan Kehadiran Akurat: Kehadiran siswa tercatat secara digital pada jam pelajaran berlangsung, meminimalisir potensi siswa membolos tanpa sepengetahuan wali murid.'
  ], 'amber');

  drawSubSection('3.5 Matriks Komparasi: Sebelum vs Sesudah Menggunakan Solusi Guru');

  const compHeaders = ['Parameter Penilaian', 'Metode Konvensional Manual', 'Dengan Solusi Guru'];
  const compRows = [
    ['Waktu Koreksi per Siswa', '8 - 12 menit per lembar esai', '1 - 2 menit (verifikasi rekomendasi AI)'],
    ['Kerapian Riwayat Tugas', 'Tumpukan kertas lemari, rawan hilang/rusak', 'Tersimpan digital di cloud selamanya'],
    ['Kecepatan Umpan Balik', '1 - 2 minggu setelah ujian', 'Hari yang sama atau 24 jam'],
    ['Keadilan Penilaian', 'Rentan bias subjektif akibat kelelahan', 'Objektif mengikuti rubrik kriteria tetap'],
    ['Supervisi Kepala Sekolah', 'Pemeriksaan buku jurnal fisik berkala', 'Dasbor online real-time 24/7'],
    ['Budaya Menulis Siswa', 'Tergusur oleh copy-paste jika tugas digital', 'Tetap terjaga kuat di kertas fisik']
  ];
  drawTable(compHeaders, compRows, [125, 185, 195]);


  // ==========================================
  // PAGE 9: BAB 4 - KELEBIHAN, KEKURANGAN & MITIGASI
  // ==========================================
  doc.addPage();
  doc.y = 55;

  drawChapterHeader('BAB 4: KELEBIHAN, KEKURANGAN, & STRATEGI MITIGASI', 'Analisis Kritis, Identifikasi Risiko Lapangan, dan Rencana Aksi Terukur');

  drawParagraph('Setiap penerapan teknologi baru di lingkungan pendidikan memerlukan analisis obyektif terhadap keunggulan komparatif maupun keterbatasan yang mungkin dihadapi di lapangan. Solusi Guru didesain secara transparan dengan strategi mitigasi yang konkret.');

  drawSubSection('4.1 Keunggulan Kompetitif Sistem');
  drawCard('Nilai Lebih Solusi Guru Dibanding Platform Lain', [
    '1. Menjembatani Jurang Fisik dan Digital: Menggabungkan kelebihan tulisan tangan fisik (stimulasi kognitif) dengan kelebihan digitalisasi (kecepatan & analisis data).',
    '2. Arsitektur Multi-AI Resilient: Uptime tinggi tanpa khawatir kuota Gemini habis berkat failover otomatis ke Groq Vision dan OpenRouter.',
    '3. Pengenalan Rumus & LaTeX: Mampu mengekstraksi notasi ilmiah dan rumus matematika serta menyajikannya dalam format LaTeX.',
    '4. Kompresi Sisi Klien Cerdas: Memastikan siswa dengan ponsel spek rendah dan koneksi internet terbatas tetap lancar mengunggah tugas.',
    '5. Hak Sanggahan (Student Appeal): Menghadirkan demokrasi kelas di mana siswa memiliki kanal resmi bila merasa jawaban benarnya terlewat.'
  ], 'teal');

  drawSubSection('4.2 Identifikasi 5 Risiko & Kekurangan Lapangan');

  const riskHeaders = ['No', 'Potensi Kendala / Risiko', 'Dampak Potensial di Lapangan'];
  const riskRows = [
    ['R-1', 'Tulisan Tangan Sangat Ekstrim / Coretan Berantakan', 'AI mungkin salah mengenali kata atau frasa yang tidak terbaca sama sekali.'],
    ['R-2', 'Kualitas Foto Buram / Sudut Miring / Pencahayaan Minim', 'Hasil pemindaian gelap atau blur dapat menurunkan akurasi ekstraksi OCR.'],
    ['R-3', 'Keterbatasan Sinyal Internet & Kuota Siswa di Daerah', 'Keterlambatan siswa dalam mengunggah foto tugas jika file berukuran besar.'],
    ['R-4', 'Resistensi Teknologi / Adaptasi Guru Senior', 'Kecanggungan awal sebagian pendidik yang belum terbiasa dengan dasbor digital.'],
    ['R-5', 'Potensi Halusinasi AI pada Jawaban Kreatif / Metaforis', 'AI mungkin menilai jawaban siswa kurang tepat jika sudut pandang esai di luar kunci baku.']
  ];
  drawTable(riskHeaders, riskRows, [30, 215, 260]);


  // ==========================================
  // PAGE 10: BAB 4 (LANJUTAN) - STRATEGI MITIGASI
  // ==========================================
  doc.addPage();
  doc.y = 55;

  drawSubSection('4.3 Matriks Solusi & Strategi Mitigasi Terukur');
  drawParagraph('Guna memastikan seluruh risiko di atas tidak mengganggu jalannya kegiatan belajar mengajar, sistem Solusi Guru menerapkan 6 lapisan mitigasi teknis dan prosedural:');

  const mitHeaders = ['Kode', 'Langkah Mitigasi Konkret', 'Implementasi Teknis & Operasional di Lapangan'];
  const mitRows = [
    ['M-1', 'Status Otomatis "UNREADABLE"', 'Jika tingkat kepercayaan OCR <60%, AI menandai status soal sebagai "UNREADABLE" dan tidak memotong nilai siswa menjadi 0. Soal tersebut dialihkan ke antrean koreksi manual guru.'],
    ['M-2', 'Edge-Detection & Auto-Enhance', 'Modul JScanify memotong otomatis tepi meja/latar dan meluruskan perspektif. Modul Sharp menaikkan kontras teks hitam-putih untuk menetralkan pencahayaan redup.'],
    ['M-3', 'Kompresi Klien Super Hemat', 'Foto dikompresi di memori browser gawai sebelum terkirim ke server (ukuran rata-rata <300 KB). Sangat hemat kuota dan sukses dikirim walau jaringan berkecepatan 3G/Edge.'],
    ['M-4', 'Human-in-the-Loop Approval', 'Nilai AI tidak pernah langsung diterbitkan tanpa persetujuan guru. Guru memiliki hak veto absolut menaikkan/menurunkan skor serta meluruskan penafsiran esai kreatif.'],
    ['M-5', 'Mekanisme Sanggahan (Appeal)', 'Siswa diberi hak mengajukan sanggahan tertulis jika merasa jawabannya benar. Sanggahan masuk ke dasbor guru lengkap dengan perbandingan lembar jawaban asli.'],
    ['M-6', 'Pelatihan Terstruktur & Buku Saku', 'Penyediaan modul panduan bergambar, video tutorial ringkas 2 menit, serta program pendampingan "Guru Penggerak Digital" di setiap sekolah.']
  ];
  drawTable(mitHeaders, mitRows, [40, 160, 305]);

  drawSubSection('4.4 Diagram Pohon Keputusan Verifikasi Guru (Decision Tree)');
  drawCard('Alur Penanganan Hasil Rekomendasi AI Oleh Guru', [
    'Kondisi A: Tulisan Jelas & Jawaban Sesuai -> AI merekomendasikan skor -> Guru memverifikasi sekilas -> Klik "Approve & Publish" (Waktu: 15 detik).',
    'Kondisi B: Status UNREADABLE (Tulisan kabur/rusak) -> Guru memeriksa foto asli di layar -> Menginput nilai manual berdasarkan penglihatan guru -> Klik "Simpan & Approve".',
    'Kondisi C: Jawaban Kreatif di Luar Kunci AI -> AI memberikan skor parsial -> Guru membaca konteks unik siswa -> Guru menambahkan skor apresiasi -> Klik "Publish".',
    'Kondisi D: Siswa Mengajukan Sanggahan (Appeal) -> Notifikasi masuk ke akun Guru -> Guru meninjau alasan siswa -> Jika terbukti benar, skor diperbarui dengan catatan transparansi.'
  ], 'blue');


  // ==========================================
  // PAGE 11: BAB 5 - PENUTUP & ROADMAP IMPLEMENTASI
  // ==========================================
  doc.addPage();
  doc.y = 55;

  drawChapterHeader('BAB 5: PENUTUP & ROADMAP IMPLEMENTASI SEKOLAH', 'Rencana Aksi 4 Minggu Transformasi Digital Menuju Sekolah Unggul & Berkarakter');

  drawParagraph('Penerapan Solusi Guru bukan semata-mata implementasi perangkat lunak baru, melainkan langkah strategis mewujudkan ekosistem sekolah yang adaptif teknologi tanpa mengikis nilai-nilai dasar pedagogis. Untuk memastikan keberhasilan adopsi, disusun roadmap implementasi 4 minggu yang terukur:');

  drawSubSection('5.1 Roadmap Adopsi 4 Minggu Pertama (Quick-Start Roadmap)');

  const roadHeaders = ['Fase / Pekan', 'Fokus Kegiatan', 'Indikator Keberhasilan (Milestone)'];
  const roadRows = [
    ['Minggu 1', 'Persiapan Data & Sosialisasi Awal', 'Import data master siswa (NISN), pendaftaran akun guru & mapel, sosialisasi singkat tata cara pengerjaan tugas kepada siswa.'],
    ['Minggu 2', 'Uji Coba Terbatas (Pilot Project)', 'Uji coba pada 2-3 kelas percontohan. Guru membuat 1 tugas latihan dan memvalidasi alur pemotretan serta koreksi AI.'],
    ['Minggu 3', 'Peluncuran Menyeluruh (Full Rollout)', 'Seluruh rombongan belajar mulai menggunakan Solusi Guru untuk penilaian harian dan pengisian jurnal mengajar harian guru.'],
    ['Minggu 4', 'Evaluasi Supervisi Kepala Sekolah', 'Kepala Sekolah menelaah dasbor keterisian jurnal guru, rekapitulasi kehadiran, dan tren nilai siswa untuk evaluasi bulanan.']
  ];
  drawTable(roadHeaders, roadRows, [85, 175, 245]);

  drawSubSection('5.2 Kata Penutup & Komitmen Penjaminan Mutu');
  drawParagraph('Dengan memadukan kecerdasan buatan terdepan dan sentuhan kemanusiaan seorang pendidik, Solusi Guru membuktikan bahwa modernisasi pendidikan tidak harus mengorbankan literasi fisik peserta didik. Solusi Guru siap mendampingi sekolah melangkah mantap menuju era Indonesia Emas dengan generasi yang cerdas, literat, dan berintegritas tinggi.');

  doc.y += 15;

  // Sign-off / Validation Box
  const signY = doc.y;
  doc.rect(45, signY, CONTENT_WIDTH, 120).fill(WHITE);
  doc.rect(45, signY, CONTENT_WIDTH, 120).strokeColor(BORDER_COLOR).lineWidth(1).stroke();
  doc.rect(45, signY, CONTENT_WIDTH, 24).fill(PRIMARY_LIGHT);

  doc.font('Helvetica-Bold').fontSize(9).fillColor(PRIMARY_DARK)
    .text('LEMBAR PENGESAHAN DOKUMEN SISTEM & KOMITMEN IMPLEMENTASI', 55, signY + 7, { width: CONTENT_WIDTH - 20, align: 'center' });

  const signCols = [
    { title: 'Mengetahui & Menyetujui,', subtitle: 'Kepala Sekolah', name: '(............................................)', nip: 'NIP. .....................................' },
    { title: 'Koordinator Kurikulum & IT,', subtitle: 'Admin Sistem', name: '(............................................)', nip: 'NIP. .....................................' },
    { title: 'Perwakilan Pendidik,', subtitle: 'Guru Mata Pelajaran', name: '(............................................)', nip: 'NIP. .....................................' }
  ];

  const colW = (CONTENT_WIDTH - 30) / 3;
  signCols.forEach((sc, idx) => {
    const xPos = 55 + idx * (colW + 10);
    doc.font('Helvetica').fontSize(8).fillColor(BODY_TEXT).text(sc.title, xPos, signY + 34, { width: colW, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(8).fillColor(DARK_TEXT).text(sc.subtitle, xPos, signY + 46, { width: colW, align: 'center' });

    doc.font('Helvetica').fontSize(8).fillColor(MUTED_TEXT).text(sc.name, xPos, signY + 88, { width: colW, align: 'center' });
    doc.font('Helvetica').fontSize(7.5).fillColor(MUTED_TEXT).text(sc.nip, xPos, signY + 100, { width: colW, align: 'center' });
  });


  // End PDFKit stream
  doc.end();

  // Wait for stream to finish writing
  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  // Now use pdf-lib to stamp clean headers and footers with accurate total page count
  const { PDFDocument: PDFLibDoc, rgb, StandardFonts } = require('pdf-lib');
  const existingPdfBytes = fs.readFileSync(OUTPUT_FILE);
  const pdfDoc = await PDFLibDoc.load(existingPdfBytes);

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  const tealColor = rgb(15 / 255, 118 / 255, 110 / 255); // #0f766e
  const grayColor = rgb(100 / 255, 116 / 255, 139 / 255); // #64748b
  const lightBorder = rgb(226 / 255, 232 / 255, 240 / 255); // #e2e8f0

  // Stamp headers and footers on page 2 to totalPages (index 1 to totalPages - 1)
  for (let i = 1; i < totalPages; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();

    // Top Header line
    page.drawLine({
      start: { x: 45, y: height - 42 },
      end: { x: width - 45, y: height - 42 },
      thickness: 0.7,
      color: lightBorder
    });

    // Top Header text
    page.drawText('SOLUSI GURU', {
      x: 45,
      y: height - 34,
      size: 7.5,
      font: fontBold,
      color: tealColor
    });

    page.drawText('—   Dokumen Arsitektur, SOP Penggunaan, Analisis Manfaat & Strategi Mitigasi', {
      x: 108,
      y: height - 34,
      size: 7.5,
      font: fontRegular,
      color: grayColor
    });

    // Bottom Footer line
    page.drawLine({
      start: { x: 45, y: 48 },
      end: { x: width - 45, y: 48 },
      thickness: 0.7,
      color: lightBorder
    });

    // Bottom Footer left text
    page.drawText('Solusi Guru Indonesia — Platform Penilaian Tulisan Tangan & Pembelajaran Interaktif', {
      x: 45,
      y: 34,
      size: 7.5,
      font: fontRegular,
      color: grayColor
    });

    // Bottom Footer right text: Halaman X dari Y
    const pageNumText = `Halaman ${i + 1} dari ${totalPages}`;
    const textWidth = fontBold.widthOfTextAtSize(pageNumText, 7.5);
    page.drawText(pageNumText, {
      x: width - 45 - textWidth,
      y: 34,
      size: 7.5,
      font: fontBold,
      color: tealColor
    });
  }

  const finalPdfBytes = await pdfDoc.save();
  fs.writeFileSync(OUTPUT_FILE, finalPdfBytes);

  return OUTPUT_FILE;
}

generatePDF()
  .then(filePath => {
    console.log('PDF generated successfully at:', filePath);
  })
  .catch(err => {
    console.error('Error generating PDF:', err);
    process.exit(1);
  });
