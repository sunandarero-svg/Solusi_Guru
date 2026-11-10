export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'ESSAY';

export interface ExamQuestion {
  id: number;
  part: 'I' | 'II' | 'III';
  partTitle: string;
  type: QuestionType;
  points: number;
  question: string;
  contextSnippet?: string;
  options?: { key: string; text: string }[];
  correctAnswer: string; // for MC: "A", for TF: "BENAR" | "SALAH", for Essay: reference formula/explanation
  explanation: string;
  recommendationTopic: string;
  essaySubQuestions?: {
    label: string;
    prompt: string;
    placeholder: string;
    expectedFormulaOrAnswer: string;
    points: number;
  }[];
}

export const EXAM_QUESTIONS_DATA: ExamQuestion[] = [
  // ==========================================
  // BAGIAN I: SOAL PILIHAN GANDA (1 s.d. 10) - 2 poin tiap soal
  // ==========================================
  {
    id: 1,
    part: 'I',
    partTitle: 'Bagian I: Pilihan Ganda',
    type: 'MULTIPLE_CHOICE',
    points: 2,
    question:
      'Perhatikan potongan data pada lembar kerja Microsoft Excel berikut: sel A1 berisi angka 150, sel A2 berisi teks "Lulus", sel A3 berisi angka 0, sel A4 dibiarkan kosong, dan sel A5 berisi teks "75" (diformat sebagai teks). Jika pada sel A6 dituliskan rumus =COUNT(A1:A5) dan pada sel A7 dituliskan rumus =COUNTA(A1:A5), maka nilai yang dihasilkan secara berturut-turut pada sel A6 dan A7 adalah ....',
    options: [
      { key: 'A', text: '2 dan 4' },
      { key: 'B', text: '3 dan 4' },
      { key: 'C', text: '2 dan 5' },
      { key: 'D', text: '3 dan 5' },
      { key: 'E', text: '4 dan 4' }
    ],
    correctAnswer: 'A',
    explanation:
      'COUNT hanya menghitung sel yang bertipe angka asli (sel A1=150 dan A3=0, total 2). Teks "75" yang berformat teks tidak dihitung oleh COUNT. Sedangkan COUNTA menghitung semua sel yang tidak kosong (A1, A2, A3, dan A5, total 4 sel).',
    recommendationTopic: 'World 1 (Data Detective) — Level 6: Logika COUNT & COUNTA'
  },
  {
    id: 2,
    part: 'I',
    partTitle: 'Bagian I: Pilihan Ganda',
    type: 'MULTIPLE_CHOICE',
    points: 2,
    question:
      'Seorang staf keuangan sedang menghitung besaran potongan pajak pada kolom D (mulai baris D5 hingga D25). Nilai Harga Barang berada pada kolom C (C5:C25), sedangkan persentase tarif PPN disimpan secara terpusat pada satu sel saja, yaitu sel F1. Agar rumus perhitungan pajak pada sel D5 dapat disalin (copy-paste / drag) ke bawah hingga sel D25 tanpa mengubah posisi sel acuan tarif PPN, maka penulisan rumus yang tepat pada sel D5 adalah ....',
    options: [
      { key: 'A', text: '=C5*F1' },
      { key: 'B', text: '=$C$5*F1' },
      { key: 'C', text: '=C5*$F1' },
      { key: 'D', text: '=C5*F$1' },
      { key: 'E', text: '=$C5*$F1' }
    ],
    correctAnswer: 'D',
    explanation:
      'Ketika rumus disalin ke bawah (vertikal antar-baris), nomor baris akan bertambah. Dengan mengunci baris pada sel F1 menjadi F$1 (atau $F$1), acuan tarif PPN akan tetap terkunci pada baris 1 sementara C5 akan bergeser relatif ke C6, C7, dst.',
    recommendationTopic: 'World 2 (Formula Master) — Level 4: Referensi Relatif & Absolut'
  },
  {
    id: 3,
    part: 'I',
    partTitle: 'Bagian I: Pilihan Ganda',
    type: 'MULTIPLE_CHOICE',
    points: 2,
    question:
      'Pada lembar kerja pencatatan transaksi, sel B4 berisi Kode Barang yang ingin dicari namanya. Tabel referensi daftar barang terletak pada rentang H3:J15, di mana kolom H memuat Kode Barang, kolom I memuat Nama Barang, dan kolom J memuat Harga Satuan. Jika kode barang pada tabel referensi tidak tersusun secara urut dan Anda ingin mencari Nama Barang secara presisi (exact match), rumus yang harus dituliskan adalah ....',
    options: [
      { key: 'A', text: '=VLOOKUP(B4; $H$3:$J$15; 2; TRUE)' },
      { key: 'B', text: '=VLOOKUP(B4; $H$3:$J$15; 2; FALSE)' },
      { key: 'C', text: '=VLOOKUP(B4; $H$3:$J$15; 3; FALSE)' },
      { key: 'D', text: '=HLOOKUP(B4; $H$3:$J$15; 2; FALSE)' },
      { key: 'E', text: '=VLOOKUP($H$3:$J$15; B4; 2; 0)' }
    ],
    correctAnswer: 'B',
    explanation:
      'Sintaks VLOOKUP: =VLOOKUP(lookup_value; table_array; col_index_num; range_lookup). Karena Nama Barang berada pada kolom ke-2 dari rentang H3:J15, dan pencarian harus persis (exact match), gunakan col_index=2 dan range_lookup=FALSE (atau 0).',
    recommendationTopic: 'World 3 (Lookup Lab) — Level 10 & 15: VLOOKUP Database'
  },
  {
    id: 4,
    part: 'I',
    partTitle: 'Bagian I: Pilihan Ganda',
    type: 'MULTIPLE_CHOICE',
    points: 2,
    question:
      'Seorang analis data ingin mencari "Nama Karyawan" yang terletak pada kolom B (B2:B50) berdasarkan "ID Karyawan" yang terletak di sebelah kanannya, yaitu pada kolom D (D2:D50). ID Karyawan yang dicari diketikkan pada sel G2. Mengingat fungsi VLOOKUP tidak dapat mencari data ke sebelah kiri kolom kunci, kombinasi rumus paling tepat untuk menyelesaikan kasus tersebut adalah ....',
    options: [
      { key: 'A', text: '=INDEX(D2:D50; MATCH(G2; B2:B50; 0))' },
      { key: 'B', text: '=MATCH(G2; INDEX(B2:B50; D2:D50; 0))' },
      { key: 'C', text: '=INDEX(B2:B50; MATCH(G2; D2:D50; 0))' },
      { key: 'D', text: '=VLOOKUP(G2; D2:B50; -2; FALSE)' },
      { key: 'E', text: '=INDEX(B2:D50; G2; 1)' }
    ],
    correctAnswer: 'C',
    explanation:
      'Kombinasi INDEX dan MATCH dapat melakukan pencarian data ke arah kiri (left-lookup). MATCH(G2; D2:D50; 0) mencari nomor baris posisi ID Karyawan pada kolom D, lalu INDEX(B2:B50; ...) mengambil Nama Karyawan pada posisi baris yang sama di kolom B.',
    recommendationTopic: 'World 3 (Lookup Lab) — Pencarian Dinamis INDEX & MATCH'
  },
  {
    id: 5,
    part: 'I',
    partTitle: 'Bagian I: Pilihan Ganda',
    type: 'MULTIPLE_CHOICE',
    points: 2,
    question:
      'Sebuah tabel rekapitulasi penjualan memiliki struktur: Kolom B (B2:B100) berisi Nama Cabang, Kolom C (C2:C100) berisi Kategori Produk, dan Kolom E (E2:E100) berisi Nilai Omzet (Rp). Untuk menghitung total Nilai Omzet khusus dari cabang "Balikpapan" DAN hanya untuk kategori produk "Laptop", rumus yang paling tepat digunakan adalah ....',
    options: [
      { key: 'A', text: '=SUMIF(B2:B100; "Balikpapan"; C2:C100; "Laptop"; E2:E100)' },
      { key: 'B', text: '=SUMIFS(B2:B100; "Balikpapan"; C2:C100; "Laptop"; E2:E100)' },
      { key: 'C', text: '=SUMIFS(E2:E100; B2:B100; "Balikpapan"; C2:C100; "Laptop")' },
      { key: 'D', text: '=COUNTIFS(E2:E100; B2:B100; "Balikpapan"; C2:C100; "Laptop")' },
      { key: 'E', text: '=SUM(IF(B2:B100="Balikpapan"; C2:C100="Laptop"; E2:E100))' }
    ],
    correctAnswer: 'C',
    explanation:
      'Sintaks fungsi SUMIFS menempatkan rentang angka yang akan dijumlahkan (sum_range) pada argumen pertama: =SUMIFS(sum_range; criteria_range1; criteria1; criteria_range2; criteria2). Jadi rumus yang benar adalah =SUMIFS(E2:E100; B2:B100; "Balikpapan"; C2:C100; "Laptop").',
    recommendationTopic: 'World 1 (Data Detective) — Level 10 & 16: SUMIFS Kriteria Ganda'
  },
  {
    id: 6,
    part: 'I',
    partTitle: 'Bagian I: Pilihan Ganda',
    type: 'MULTIPLE_CHOICE',
    points: 2,
    question:
      'Dalam seleksi penerimaan pegawai, seorang peserta dinyatakan "LULUS" apabila memenuhi dua syarat sekaligus: Nilai Tes Tulis (sel C3) minimal 75 DAN Nilai Wawancara (sel D3) lebih dari 80. Jika salah satu atau kedua syarat tidak terpenuhi, maka peserta dinyatakan "GAGAL". Rumus Excel yang benar untuk mengekspresikan logika tersebut adalah ....',
    options: [
      { key: 'A', text: '=IF(OR(C3>=75; D3>80); "LULUS"; "GAGAL")' },
      { key: 'B', text: '=IF(AND(C3>75; D3>=80); "LULUS"; "GAGAL")' },
      { key: 'C', text: '=IF(AND(C3>=75; D3>80); "LULUS"; "GAGAL")' },
      { key: 'D', text: '=AND(IF(C3>=75; D3>80); "LULUS"; "GAGAL")' },
      { key: 'E', text: '=IF(C3>=75 AND D3>80; "LULUS"; "GAGAL")' }
    ],
    correctAnswer: 'C',
    explanation:
      'Kata "minimal 75" berarti lebih besar atau sama dengan (>=75), sedangkan "lebih dari 80" berarti (>80). Karena kedua syarat wajib dipenuhi sekaligus, fungsi logika yang tepat adalah AND(C3>=75; D3>80) di dalam struktur fungsi IF.',
    recommendationTopic: 'World 2 (Formula Master) — Level 6 & 13: Logika IF & AND'
  },
  {
    id: 7,
    part: 'I',
    partTitle: 'Bagian I: Pilihan Ganda',
    type: 'MULTIPLE_CHOICE',
    points: 2,
    question:
      'Sel A2 menyimpan kode peserta ujian dengan format teks "PST-24-089". Anda diminta mengambil angka kode angkatan "24" yang berada di tengah kode tersebut, lalu mengonversinya menjadi tipe data numerik (angka) agar dapat dihitung dalam operasi matematika. Rumus yang tepat untuk kebutuhan tersebut adalah ....',
    options: [
      { key: 'A', text: '=MID(A2; 5; 2)' },
      { key: 'B', text: '=VALUE(MID(A2; 5; 2))' },
      { key: 'C', text: '=VALUE(MID(A2; 4; 2))' },
      { key: 'D', text: '=TEXT(MID(A2; 5; 2); "0")' },
      { key: 'E', text: '=VALUE(LEFT(A2; 5; 2))' }
    ],
    correctAnswer: 'B',
    explanation:
      'Karakter pada "PST-24-089": P(1), S(2), T(3), -(4), 2(5), 4(6). Karakter "24" dimulai dari posisi ke-5 sebanyak 2 karakter dengan fungsi MID(A2; 5; 2). Karena fungsi teks menghasilkan teks ("24"), fungsi VALUE() diperlukan untuk mengubahnya menjadi tipe data numerik 24.',
    recommendationTopic: 'World 4 (Text Decoder) — Level 11: Manipulasi Teks MID & VALUE'
  },
  {
    id: 8,
    part: 'I',
    partTitle: 'Bagian I: Pilihan Ganda',
    type: 'MULTIPLE_CHOICE',
    points: 2,
    question:
      'Ketika Anda membuka sebuah file laporan Excel, terdapat sel yang menampilkan pesan kesalahan #REF! pada rumus =B5+C5+#REF!. Penyebab utama munculnya pesan kesalahan #REF! tersebut adalah ....',
    options: [
      { key: 'A', text: 'Lebar kolom terlalu sempit untuk menampilkan angka hasil perhitungan' },
      { key: 'B', text: 'Terdapat penulisan nama fungsi rumus yang salah ketik (typo)' },
      { key: 'C', text: 'Sel yang dijumlahkan berisi tipe data teks yang tidak dapat dihitung' },
      { key: 'D', text: 'Kolom atau baris yang menjadi referensi sel di dalam rumus telah dihapus' },
      { key: 'E', text: 'Rumus mencoba melakukan pembagian suatu nilai dengan angka nol (0)' }
    ],
    correctAnswer: 'D',
    explanation:
      'Error #REF! (Reference Error) terjadi ketika sel, baris, atau kolom yang dirujuk oleh rumus telah terhapus, terpotong, atau tidak lagi valid di dalam lembar kerja.',
    recommendationTopic: 'World 2 (Formula Master) — Audit Rumus & Troubleshooting Error'
  },
  {
    id: 9,
    part: 'I',
    partTitle: 'Bagian I: Pilihan Ganda',
    type: 'MULTIPLE_CHOICE',
    points: 2,
    question:
      'Seorang manajer ingin mengurutkan tabel data kepegawaian dengan dua tingkatan: pertama diurutkan berdasarkan kolom "Divisi" sesuai abjad (A ke Z), kemudian bagi karyawan di divisi yang sama diurutkan kembali berdasarkan kolom "Gaji Pokok" dari nilai tertinggi ke terendah. Langkah pengurutan yang tepat di Microsoft Excel adalah ....',
    options: [
      { key: 'A', text: 'Menggunakan tombol Sort A to Z pada kolom Divisi lalu menekan tombol Sort Z to A pada kolom Gaji Pokok secara terpisah' },
      { key: 'B', text: 'Membuka menu Custom Sort, memilih Sort by "Divisi" (A to Z), lalu menekan Add Level dan memilih Then by "Gaji Pokok" (Largest to Smallest)' },
      { key: 'C', text: 'Menggunakan fitur Filter pada kolom Divisi lalu memilih Sort by Color pada kolom Gaji Pokok' },
      { key: 'D', text: 'Menggunakan fungsi =SORTBY() secara manual pada baris judul tabel' },
      { key: 'E', text: 'Membuka menu Conditional Formatting lalu memilih aturan Top/Bottom Rules' }
    ],
    correctAnswer: 'B',
    explanation:
      'Pengurutan data bertingkat (multi-level sort) di Excel dilakukan melalui dialog Custom Sort. Pengurutan pertama ditentukan pada "Sort by", kemudian gunakan tombol "Add Level" untuk menentukan kriteria pengurutan kedua pada "Then by".',
    recommendationTopic: 'World 1 (Data Detective) — Level 7: Sort & Filter Bertingkat'
  },
  {
    id: 10,
    part: 'I',
    partTitle: 'Bagian I: Pilihan Ganda',
    type: 'MULTIPLE_CHOICE',
    points: 2,
    question:
      'Dalam pembuatan laporan ringkasan menggunakan PivotTable, Anda memiliki kolom data: "Wilayah Cabang", "Kuartal", dan "Total Pendapatan". Jika Anda ingin menampilkan daftar Wilayah Cabang menurun ke bawah (sebagai judul baris), daftar Kuartal menyamping ke kanan (sebagai judul kolom), dan jumlah akumulasi Total Pendapatan di bagian tengah tabel, maka penempatan field pada panel PivotTable Fields yang tepat adalah ....',
    options: [
      { key: 'A', text: 'Rows: Kuartal | Columns: Wilayah Cabang | Values: Sum of Total Pendapatan' },
      { key: 'B', text: 'Filters: Wilayah Cabang | Rows: Kuartal | Values: Count of Total Pendapatan' },
      { key: 'C', text: 'Rows: Wilayah Cabang | Columns: Kuartal | Values: Sum of Total Pendapatan' },
      { key: 'D', text: 'Columns: Wilayah Cabang & Kuartal | Rows: Total Pendapatan | Values: Average' },
      { key: 'E', text: 'Rows: Wilayah Cabang | Values: Kuartal & Sum of Total Pendapatan' }
    ],
    correctAnswer: 'C',
    explanation:
      'Area Rows menampilkan kategori data secara vertikal (menurun per baris), Columns menampilkan kategori secara horizontal (ke kanan per kolom), dan Values menghitung akumulasi numerik (Sum of Total Pendapatan).',
    recommendationTopic: 'World 5 (Data Analyst Arena) — PivotTable & Laporan Bisnis'
  },

  // ==========================================
  // BAGIAN II: SOAL BENAR / SALAH (11 s.d. 20) - 2 poin tiap soal
  // ==========================================
  {
    id: 11,
    part: 'II',
    partTitle: 'Bagian II: Benar / Salah',
    type: 'TRUE_FALSE',
    points: 2,
    question:
      'Dalam hierarki operator aritmatika Microsoft Excel, operasi perkalian (*) memiliki prioritas lebih tinggi dibandingkan penjumlahan (+), sehingga rumus =10+5*2 akan menghasilkan nilai 20, bukan 30.',
    correctAnswer: 'BENAR',
    explanation:
      'Sesuai aturan urutan operasi matematika (BODMAS/PEMDAS), perkalian (5*2 = 10) dieksekusi lebih dulu daripada penjumlahan (10 + 10 = 20).',
    recommendationTopic: 'World 2 (Formula Master) — Level 4: Hierarki Operator Aritmatika'
  },
  {
    id: 12,
    part: 'II',
    partTitle: 'Bagian II: Benar / Salah',
    type: 'TRUE_FALSE',
    points: 2,
    question:
      'Apabila sebuah tabel data sedang disaring menggunakan fitur AutoFilter, maka fungsi =SUM(D2:D50) secara otomatis hanya akan menjumlahkan baris yang terlihat saja dan mengabaikan baris yang tersembunyi.',
    correctAnswer: 'SALAH',
    explanation:
      'Fungsi SUM standar tetap menjumlahkan seluruh baris di rentang sel termasuk baris yang disembunyikan oleh AutoFilter. Untuk menjumlahkan hanya baris yang terlihat (visible cells), harus menggunakan fungsi =SUBTOTAL(9; D2:D50) atau =SUBTOTAL(109; D2:D50).',
    recommendationTopic: 'World 1 (Data Detective) — Level 7: Filter & Agregasi Data'
  },
  {
    id: 13,
    part: 'II',
    partTitle: 'Bagian II: Benar / Salah',
    type: 'TRUE_FALSE',
    points: 2,
    question:
      'Dalam penulisan fungsi logika IF bertingkat (Nested IF), Excel mengevaluasi syarat logika secara berurutan dari kiri ke kanan dan akan langsung mengambil hasil pada kondisi pertama yang bernilai TRUE.',
    correctAnswer: 'BENAR',
    explanation:
      'Excel mengevaluasi logika Nested IF secara sekuensial dari kiri ke kanan. Begitu suatu kondisi menghasilkan nilai TRUE, Excel langsung memberikan nilai return tersebut dan mengabaikan evaluasi kondisi di belakangnya.',
    recommendationTopic: 'World 2 (Formula Master) — Level 13: Logika Bertingkat (Nested IF)'
  },
  {
    id: 14,
    part: 'II',
    partTitle: 'Bagian II: Benar / Salah',
    type: 'TRUE_FALSE',
    points: 2,
    question:
      'Rumus =IFERROR(VLOOKUP(A2; $E$2:$G$10; 2; FALSE); "Data Tidak Ditemukan") berfungsi mengganti tampilan pesan error #N/A menjadi teks "Data Tidak Ditemukan" apabila nilai pada sel A2 tidak ada di tabel referensi.',
    correctAnswer: 'BENAR',
    explanation:
      'Fungsi IFERROR mendeteksi jika rumus VLOOKUP menghasilkan nilai error (seperti #N/A, #VALUE!, #REF!) dan menggantikannya dengan pesan kustom yang lebih bersahabat, yaitu "Data Tidak Ditemukan".',
    recommendationTopic: 'World 2 & 3 — Penanganan Error Rumus IFERROR'
  },
  {
    id: 15,
    part: 'II',
    partTitle: 'Bagian II: Benar / Salah',
    type: 'TRUE_FALSE',
    points: 2,
    question:
      'Ketika menganalisis sekumpulan data gaji karyawan yang memiliki satu nilai ekstrem (outlier) sangat tinggi (misalnya gaji direktur utama), fungsi AVERAGE lebih akurat mewakili nilai tengah mayoritas karyawan dibandingkan fungsi MEDIAN.',
    correctAnswer: 'SALAH',
    explanation:
      'Fungsi AVERAGE sangat sensitif terhadap nilai ekstrem (outlier) sehingga nilainya akan tertarik melonjak ke atas. Dalam statistika deskriptif, fungsi MEDIAN (nilai tengah posisi) jauh lebih representatif untuk menggambarkan kondisi data mayoritas ketika terdapat outlier.',
    recommendationTopic: 'World 5 (Data Analyst Arena) — Statistik Deskriptif: AVERAGE vs MEDIAN'
  },
  {
    id: 16,
    part: 'II',
    partTitle: 'Bagian II: Benar / Salah',
    type: 'TRUE_FALSE',
    points: 2,
    question:
      'Fungsi =COUNTIF(C2:C30; ">80") digunakan untuk menjumlahkan seluruh nilai angka yang lebih besar dari 80 pada rentang sel C2 sampai C30.',
    correctAnswer: 'SALAH',
    explanation:
      'Fungsi COUNTIF berfungsi untuk menghitung banyaknya kemunculan sel (frekuensi) yang memenuhi kriteria, bukan menjumlahkan nilai angkanya. Jika ingin menjumlahkan angka di atas 80, rumus yang benar adalah =SUMIF(C2:C30; ">80").',
    recommendationTopic: 'World 1 (Data Detective) — Level 6 & 10: Perbedaan COUNTIF dan SUMIF'
  },
  {
    id: 17,
    part: 'II',
    partTitle: 'Bagian II: Benar / Salah',
    type: 'TRUE_FALSE',
    points: 2,
    question:
      'Saat menuliskan hasil keluaran berupa angka murni di dalam fungsi IF (misalnya =IF(A1>70; 100; 0)), angka 100 dan 0 tidak perlu diapit tanda kutip ganda (" ") agar hasilnya tetap bertipe numerik.',
    correctAnswer: 'BENAR',
    explanation:
      'Di Excel, angka yang diapit tanda kutip (seperti "100") akan diperlakukan sebagai teks. Agar angka dapat dihitung dalam operasi matematika lanjutan, angka tidak boleh diapit tanda kutip.',
    recommendationTopic: 'World 2 (Formula Master) — Sintaks Angka & Teks pada Formula'
  },
  {
    id: 18,
    part: 'II',
    partTitle: 'Bagian II: Benar / Salah',
    type: 'TRUE_FALSE',
    points: 2,
    question:
      'Penulisan referensi sel $B4 disebut sebagai referensi campuran (mixed reference), di mana kolom B bersifat terkunci (absolut) sedangkan baris 4 bersifat relatif dan dapat berubah saat rumus disalin ke baris di bawahnya.',
    correctAnswer: 'BENAR',
    explanation:
      'Tanda dollar ($) tepat sebelum huruf kolom B ($B4) berarti mengunci kolom B secara absolut, sedangkan angka 4 tanpa dollar bersifat relatif sehingga akan otomatis bergeser menjadi 5, 6, dst saat disalin ke bawah.',
    recommendationTopic: 'World 2 (Formula Master) — Level 4: Mixed References'
  },
  {
    id: 19,
    part: 'II',
    partTitle: 'Bagian II: Benar / Salah',
    type: 'TRUE_FALSE',
    points: 2,
    question:
      'Jika sel A1 berisi teks "KALIMANTAN", maka penulisan rumus =RIGHT(A1; 6) akan menghasilkan keluaran teks "KALIMA".',
    correctAnswer: 'SALAH',
    explanation:
      'Fungsi RIGHT mengambil karakter dari ujung sebelah kanan teks. Mengambil 6 karakter dari kanan pada kata "KALIMANTAN" (10 huruf) menghasilkan teks "MANTAN", bukan "KALIMA" (yang merupakan hasil =LEFT(A1; 6)).',
    recommendationTopic: 'World 4 (Text Decoder) — Level 11: Fungsi Teks LEFT, MID, RIGHT'
  },
  {
    id: 20,
    part: 'II',
    partTitle: 'Bagian II: Benar / Salah',
    type: 'TRUE_FALSE',
    points: 2,
    question:
      'Fitur Remove Duplicates yang terdapat pada tab Data berfungsi untuk menghapus baris data ganda secara permanen dari tabel kerja dan hanya menyisakan data yang unik.',
    correctAnswer: 'BENAR',
    explanation:
      'Fitur Data > Remove Duplicates memindai kolom yang ditentukan dan menghapus baris duplikat secara permanen sehingga hanya menyisakan satu rekaman unik pertama.',
    recommendationTopic: 'World 1 (Data Detective) — Data Cleaning & Remove Duplicates'
  },

  // ==========================================
  // BAGIAN III: ESSAY & STUDI KASUS (21 s.d. 25) - 12 poin tiap nomor (Total 60 poin)
  // ==========================================
  {
    id: 21,
    part: 'III',
    partTitle: 'Bagian III: Studi Kasus Terapan',
    type: 'ESSAY',
    points: 12,
    question:
      'Studi Kasus 1: Fungsi Logika Majemuk & IF Bertingkat\n\nGunakan data PT Nusantara Niaga. Manajemen ingin mengisi kolom Predikat (sel G2 sampai G7) secara otomatis berdasarkan capaian cabang dengan aturan:\na) Jika Realisasi Unit (Kolom E) >= Target Unit (Kolom D) DAN Total Omzet (Kolom F) minimal Rp150.000.000, maka mendapat predikat "Sangat Baik".\nb) Jika Realisasi Unit (Kolom E) >= Target Unit (Kolom D) tetapi Total Omzet di bawah Rp150.000.000, maka mendapat predikat "Baik".\nc) Selain kondisi di atas (jika Realisasi Unit < Target Unit), maka mendapat predikat "Perlu Evaluasi".\n\nTuliskan rumus Excel lengkap pada sel G2 serta tentukan hasil keluaran predikat untuk baris ke-2, ke-3, dan ke-5!',
    contextSnippet: 'Tabel Penjualan Cabang PT Nusantara Niaga (Baris 2 s.d. 7)',
    correctAnswer:
      '=IF(AND(E2>=D2; F2>=150000000); "Sangat Baik"; IF(E2>=D2; "Baik"; "Perlu Evaluasi"))\n- Baris 2: Sangat Baik\n- Baris 3: Perlu Evaluasi\n- Baris 5: Baik',
    explanation:
      'Rumus pada G2: =IF(AND(E2>=D2; F2>=150000000); "Sangat Baik"; IF(E2>=D2; "Baik"; "Perlu Evaluasi")).\nAnalisis:\n- Baris 2 (BPP-01): Realisasi 125 >= 100 dan Omzet 185jt >= 150jt -> "Sangat Baik"\n- Baris 3 (SRG-02): Realisasi 75 < 80 (kurang dari target) -> "Perlu Evaluasi"\n- Baris 5 (MKS-04): Realisasi 160 >= 150 tetapi Omzet 88jt < 150jt -> "Baik"',
    recommendationTopic: 'World 2 (Formula Master) — Level 6 & 13: Nested IF & AND',
    essaySubQuestions: [
      {
        label: 'A. Rumus pada Sel G2',
        prompt: 'Tuliskan sintaks rumus Excel lengkap yang harus diketikkan pada sel G2:',
        placeholder: '=IF(AND(E2>=D2; F2>=150000000); "Sangat Baik"; ...)',
        expectedFormulaOrAnswer:
          '=IF(AND(E2>=D2; F2>=150000000); "Sangat Baik"; IF(E2>=D2; "Baik"; "Perlu Evaluasi"))',
        points: 6
      },
      {
        label: 'B. Hasil Baris 2 (ELK-2026-BPP-01)',
        prompt: 'Tentukan predikat yang keluar pada Baris 2:',
        placeholder: 'Contoh: Sangat Baik / Baik / Perlu Evaluasi',
        expectedFormulaOrAnswer: 'Sangat Baik',
        points: 2
      },
      {
        label: 'C. Hasil Baris 3 (FRN-2026-SRG-02)',
        prompt: 'Tentukan predikat yang keluar pada Baris 3:',
        placeholder: 'Contoh: Sangat Baik / Baik / Perlu Evaluasi',
        expectedFormulaOrAnswer: 'Perlu Evaluasi',
        points: 2
      },
      {
        label: 'D. Hasil Baris 5 (ATK-2026-MKS-04)',
        prompt: 'Tentukan predikat yang keluar pada Baris 5:',
        placeholder: 'Contoh: Sangat Baik / Baik / Perlu Evaluasi',
        expectedFormulaOrAnswer: 'Baik',
        points: 2
      }
    ]
  },
  {
    id: 22,
    part: 'III',
    partTitle: 'Bagian III: Studi Kasus Terapan',
    type: 'ESSAY',
    points: 12,
    question:
      'Studi Kasus 2: Agregasi Bersyarat (SUMIFS & COUNTIFS)\n\nBerdasarkan tabel PT Nusantara Niaga pada rentang baris 2 sampai 7, tuliskan rumus Excel lengkap untuk menghitung:\na) Total Omzet (Rp) khusus untuk Wilayah "Kalimantan" pada Kategori "Elektronik" yang berhasil mencapai Realisasi Unit >= 100.\nb) Banyaknya transaksi (jumlah baris cabang) dari seluruh wilayah yang memiliki Total Omzet di atas Rp100.000.000.',
    contextSnippet: 'Tabel Penjualan Cabang PT Nusantara Niaga (Rentang B2:F7)',
    correctAnswer:
      'a) =SUMIFS(F2:F7; B2:B7; "Kalimantan"; C2:C7; "Elektronik"; E2:E7; ">=100") -> Hasil: Rp345.000.000\nb) =COUNTIFS(F2:F7; ">100000000") -> Hasil: 4 transaksi',
    explanation:
      'a) Baris yang memenuhi Wilayah "Kalimantan", Kategori "Elektronik", dan Realisasi >= 100 adalah Baris 2 (185jt) dan Baris 4 (160jt). Total = 185jt + 160jt = Rp345.000.000.\nb) Baris dengan omzet > 100jt adalah Baris 2 (185jt), Baris 4 (160jt), Baris 6 (130jt), dan Baris 7 (980jt) = 4 transaksi.',
    recommendationTopic: 'World 1 (Data Detective) — Level 10 & 16: SUMIFS & COUNTIFS',
    essaySubQuestions: [
      {
        label: 'A. Rumus Total Omzet Kalimantan, Elektronik, Realisasi >= 100',
        prompt: 'Tuliskan rumus SUMIFS lengkap beserta hasil perhitungannya:',
        placeholder: '=SUMIFS(F2:F7; B2:B7; "Kalimantan"; ...)',
        expectedFormulaOrAnswer:
          '=SUMIFS(F2:F7; B2:B7; "Kalimantan"; C2:C7; "Elektronik"; E2:E7; ">=100")',
        points: 6
      },
      {
        label: 'B. Rumus Jumlah Transaksi Omzet > 100 Juta',
        prompt: 'Tuliskan rumus COUNTIFS lengkap beserta hasil perhitungannya:',
        placeholder: '=COUNTIFS(F2:F7; ">100000000")',
        expectedFormulaOrAnswer: '=COUNTIFS(F2:F7; ">100000000")',
        points: 6
      }
    ]
  },
  {
    id: 23,
    part: 'III',
    partTitle: 'Bagian III: Studi Kasus Terapan',
    type: 'ESSAY',
    points: 12,
    question:
      'Studi Kasus 3: Audit Rumus & Penanganan Error (Troubleshooting VLOOKUP)\n\nSeorang staf administrasi menuliskan rumus =VLOOKUP(A2; J2:L10; 4; FALSE) pada sel H2 untuk mengambil data nama supervisor dari tabel referensi yang terletak pada rentang J2:L10 (terdiri atas 3 kolom: Kolom J, K, dan L), lalu menyalin rumus tersebut ke bawah hingga sel H7.\na) Identifikasi 2 (dua) kesalahan fatal pada penulisan rumus tersebut yang menyebabkan rumus gagal bekerja dengan benar saat disalin ke bawah!\nb) Tuliskan kembali rumus perbaikan yang benar (asumsikan data yang diambil berada pada kolom ke-3 tabel referensi) dan lengkapi dengan fungsi IFERROR agar menampilkan teks "Kode Tidak Terdaftar" jika data tidak ditemukan!',
    contextSnippet: 'Tabel Referensi Supervisor: J2:L10 (3 kolom: J, K, L)',
    correctAnswer:
      'a) 2 Kesalahan: (1) Nomor kolom 4 tidak valid karena rentang J2:L10 hanya terdiri dari 3 kolom; (2) Rentang tabel referensi J2:L10 belum dikunci absolut ($J$2:$L$10) sehingga akan bergeser saat di-copy ke bawah.\nb) Rumus perbaikan: =IFERROR(VLOOKUP(A2; $J$2:$L$10; 3; FALSE); "Kode Tidak Terdaftar")',
    explanation:
      'Kesalahan 1: col_index_num bernilai 4 melebihi jumlah kolom pada tabel array J:L (hanya 3 kolom: J=1, K=2, L=3), memicu error #REF!. Kesalahan 2: rentang J2:L10 tidak absolut, sehingga baris berikutnya menjadi J3:L11, J4:L12 yang menyebabkan data tidak ditemukan. Perbaikan: =IFERROR(VLOOKUP(A2; $J$2:$L$10; 3; FALSE); "Kode Tidak Terdaftar").',
    recommendationTopic: 'World 3 (Lookup Lab) — Level 10 & 15: VLOOKUP & IFERROR',
    essaySubQuestions: [
      {
        label: 'A. Identifikasi 2 Kesalahan Fatal',
        prompt: 'Jelaskan 2 kesalahan pada rumus =VLOOKUP(A2; J2:L10; 4; FALSE):',
        placeholder: '1. Nomor kolom 4 ... 2. Referensi tabel belum dikunci ...',
        expectedFormulaOrAnswer:
          'Nomor kolom 4 melebihi jumlah kolom referensi (hanya 3 kolom) dan tabel referensi J2:L10 tidak dikunci absolut ($J$2:$L$10).',
        points: 6
      },
      {
        label: 'B. Rumus Perbaikan dengan IFERROR',
        prompt: 'Tuliskan rumus perbaikan lengkap menggunakan kolom ke-3 dan fungsi IFERROR:',
        placeholder: '=IFERROR(VLOOKUP(A2; $J$2:$L$10; 3; FALSE); "Kode Tidak Terdaftar")',
        expectedFormulaOrAnswer:
          '=IFERROR(VLOOKUP(A2; $J$2:$L$10; 3; FALSE); "Kode Tidak Terdaftar")',
        points: 6
      }
    ]
  },
  {
    id: 24,
    part: 'III',
    partTitle: 'Bagian III: Studi Kasus Terapan',
    type: 'ESSAY',
    points: 12,
    question:
      'Studi Kasus 4: Ekstraksi Data Teks (LEFT, MID, RIGHT, & VALUE)\n\nPerhatikan format Kode Transaksi pada sel A2 yaitu "ELK-2026-BPP-01". Setiap bagian kode dipisahkan oleh tanda hubung (-). Tuliskan masing-masing rumus Excel untuk mengekstrak informasi berikut dari sel A2:\na) Mengambil 3 huruf Kode Kategori di awal ("ELK").\nb) Mengambil 3 huruf Kode Kota Cabang di tengah ("BPP").\nc) Mengambil 2 digit Nomor Urut di akhir ("01") sekaligus mengubahnya menjadi nilai angka murni (numerik).',
    contextSnippet: 'Format Kode Sel A2: "ELK-2026-BPP-01"',
    correctAnswer:
      'a) =LEFT(A2; 3)\nb) =MID(A2; 10; 3)\nc) =VALUE(RIGHT(A2; 2))',
    explanation:
      'a) =LEFT(A2; 3) mengambil 3 karakter dari kiri menghasilkan "ELK".\nb) Pada teks "ELK-2026-BPP-01", huruf "B" berada pada karakter ke-10, sehingga =MID(A2; 10; 3) menghasilkan "BPP".\nc) =VALUE(RIGHT(A2; 2)) mengambil 2 digit dari kanan ("01") lalu mengubahnya menjadi angka 1 murni.',
    recommendationTopic: 'World 4 (Text Decoder) — Level 11: LEFT, MID, RIGHT, & VALUE',
    essaySubQuestions: [
      {
        label: 'A. Kode Kategori ("ELK")',
        prompt: 'Rumus untuk mengambil 3 huruf kode kategori di awal:',
        placeholder: '=LEFT(A2; 3)',
        expectedFormulaOrAnswer: '=LEFT(A2; 3)',
        points: 4
      },
      {
        label: 'B. Kode Kota Cabang ("BPP")',
        prompt: 'Rumus untuk mengambil 3 huruf kode kota cabang di tengah:',
        placeholder: '=MID(A2; 10; 3)',
        expectedFormulaOrAnswer: '=MID(A2; 10; 3)',
        points: 4
      },
      {
        label: 'C. Nomor Urut Numerik (Angka 1)',
        prompt: 'Rumus untuk mengambil 2 digit akhir dan mengubahnya menjadi angka murni:',
        placeholder: '=VALUE(RIGHT(A2; 2))',
        expectedFormulaOrAnswer: '=VALUE(RIGHT(A2; 2))',
        points: 4
      }
    ]
  },
  {
    id: 25,
    part: 'III',
    partTitle: 'Bagian III: Studi Kasus Terapan',
    type: 'ESSAY',
    points: 12,
    question:
      'Studi Kasus 5: Analisis Statistik Deskriptif (AVERAGE vs MEDIAN) & PivotTable\n\nPerhatikan kolom Total Omzet (F2:F7) pada tabel di atas. Lima cabang memiliki omzet di kisaran Rp88 juta hingga Rp185 juta, namun satu cabang pada baris ke-7 (JKT-06) memiliki omzet sangat tinggi sebesar Rp980.000.000 (nilai ekstrem / outlier).\na) Jelaskan mengapa penggunaan fungsi =MEDIAN(F2:F7) lebih direkomendasikan dibandingkan =AVERAGE(F2:F7) untuk menggambarkan performa omzet cabang secara umum pada kasus tersebut!\nb) Jika direktur meminta laporan matriks ringkasan yang menampilkan total Realisasi Unit dan rata-rata Total Omzet berdasarkan Wilayah, jelaskan bagaimana Anda menyusun field pada area Rows dan Values di dalam fitur PivotTable!',
    contextSnippet: 'Data Omzet (F2:F7): 185jt, 92jt, 160jt, 88jt, 130jt, 980jt',
    correctAnswer:
      'a) Nilai omzet 980jt merupakan outlier (ekstrem) yang membuat AVERAGE melonjak ke 272,5 juta (jauh di atas mayoritas 5 cabang lain). MEDIAN (145 juta) tidak terpengaruh outlier sehingga lebih akurat menggambarkan performa umum.\nb) Susunan PivotTable: Rows = Wilayah; Values = Sum of Realisasi Unit dan Average of Total Omzet.',
    explanation:
      'a) Outlier Rp980jt mendistorsi nilai rata-rata (AVERAGE = 272,5 juta) sehingga tampak seolah rata-rata cabang beromzet di atas 200 juta padahal 5 dari 6 cabang hanya di bawah 185 juta. MEDIAN bernilai 145 juta mencerminkan nilai tengah yang kokoh (robust). b) Field Wilayah ditempatkan pada Rows, Realisasi Unit pada Values dengan fungsi SUM, dan Total Omzet pada Values dengan fungsi AVERAGE.',
    recommendationTopic: 'World 5 (Data Analyst Arena) — Outlier, MEDIAN vs AVERAGE, & PivotTable',
    essaySubQuestions: [
      {
        label: 'A. Alasan Pemilihan MEDIAN Dibanding AVERAGE',
        prompt: 'Jelaskan mengapa fungsi MEDIAN lebih direkomendasikan pada kasus adanya nilai outlier Rp980 juta:',
        placeholder: 'Karena adanya nilai ekstrem (outlier) Rp980jt yang menarik rata-rata ...',
        expectedFormulaOrAnswer:
          'Nilai ekstrem (outlier) 980 juta mendistorsi nilai AVERAGE menjadi terlalu tinggi (272,5 jt). Fungsi MEDIAN (145 jt) lebih tahan terhadap outlier dan mencerminkan nilai tengah yang representatif untuk mayoritas cabang.',
        points: 6
      },
      {
        label: 'B. Pengaturan Field PivotTable',
        prompt: 'Jelaskan penyusunan field pada area Rows dan Values pada panel PivotTable:',
        placeholder: 'Rows: Wilayah, Values: Sum of Realisasi Unit dan Average of Total Omzet',
        expectedFormulaOrAnswer:
          'Rows diisi field Wilayah. Values diisi field Sum of Realisasi Unit dan Average of Total Omzet.',
        points: 6
      }
    ]
  }
];

