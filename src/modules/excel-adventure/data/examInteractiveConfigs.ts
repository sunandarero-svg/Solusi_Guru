export interface InteractiveExperiment {
  label: string;
  formula: string;
  explanation: string;
  expectedResult: string | number;
  autoFillOptionKey?: string; // e.g. 'A' for MC or 'BENAR' for TF
  targetEssaySubLabel?: string; // e.g. 'A. Rumus pada Sel G2'
}

export interface QuestionInteractiveConfig {
  questionId: number;
  badgeTitle: string;
  focusTitle: string;
  promptGuide: string;
  highlightCols?: string[];  // e.g. ['B', 'C', 'F']
  highlightRows?: number[];  // e.g. [2, 4, 7]
  highlightCells?: string[]; // e.g. ['A2', 'F7']
  experiments: InteractiveExperiment[];
  interactiveMiniTable?: {
    caption: string;
    headers: string[];
    rows: (string | number)[][];
  };
  tipsNote: string;
}

export const EXAM_INTERACTIVE_CONFIGS: Record<number, QuestionInteractiveConfig> = {
  // ==========================================
  // BAGIAN I: PILIHAN GANDA (1 s.d. 10)
  // ==========================================
  1: {
    questionId: 1,
    badgeTitle: 'Uji Coba Sel & Tipe Data',
    focusTitle: 'Eksperimen Fungsi COUNT vs COUNTA (A1:A5)',
    promptGuide:
      'Perhatikan 5 sel di bawah ini. COUNT hanya menghitung sel bertipe angka murni, sedangkan COUNTA menghitung semua sel yang tidak kosong. Coba kedua rumus di bawah:',
    interactiveMiniTable: {
      caption: 'Potongan Lembar Kerja (Sel A1 s.d. A5)',
      headers: ['Sel', 'Nilai / Isi', 'Tipe Data Excel', 'Dihitung COUNT?', 'Dihitung COUNTA?'],
      rows: [
        ['A1', 150, 'Angka (Numeric)', '✓ Ya (1)', '✓ Ya (1)'],
        ['A2', 'Lulus', 'Teks (String)', '✗ Tidak', '✓ Ya (2)'],
        ['A3', 0, 'Angka (Numeric 0)', '✓ Ya (2)', '✓ Ya (3)'],
        ['A4', '(Kosong)', 'Empty Cell', '✗ Tidak', '✗ Tidak'],
        ['A5', '75', 'Teks (Format Teks)', '✗ Tidak', '✓ Ya (4)']
      ]
    },
    experiments: [
      {
        label: 'Uji =COUNT(A1:A5)',
        formula: '=COUNT(A1:A5)',
        expectedResult: 2,
        explanation: 'COUNT menghasilkan 2 karena hanya sel A1 (150) dan A3 (0) yang merupakan angka asli.',
        autoFillOptionKey: 'A'
      },
      {
        label: 'Uji =COUNTA(A1:A5)',
        formula: '=COUNTA(A1:A5)',
        expectedResult: 4,
        explanation: 'COUNTA menghasilkan 4 karena ada 4 sel yang terisi (A1, A2, A3, dan A5).',
        autoFillOptionKey: 'A'
      }
    ],
    tipsNote: 'Hasil berurutan adalah 2 dan 4. Teks "75" berformat string tidak dihitung oleh COUNT.'
  },

  2: {
    questionId: 2,
    badgeTitle: 'Uji Coba Penguncian Rumus',
    focusTitle: 'Eksperimen Referensi Sel Absolut (F$1 vs F1)',
    promptGuide:
      'Harga barang ada di kolom C (C5:C25) dan PPN tersimpan tunggal di F1. Coba rumus di bawah untuk melihat perbedaan saat rumus disalin ke bawah:',
    interactiveMiniTable: {
      caption: 'Simulasi Salin Rumus Baris 5 ke Baris 6',
      headers: ['Rumus di D5', 'Hasil jika di-copy ke D6', 'Keterangan'],
      rows: [
        ['=C5*F$1', '=C6*F$1', '✓ Benar: Baris F$1 tetap terkunci mengacu ke tarif PPN!'],
        ['=C5*F1', '=C6*F2', '✗ Salah: F1 bergeser ke F2 (sel kosong), pajak jadi 0!'],
        ['=$C$5*F1', '=$C$5*F2', '✗ Salah: Harga C5 terkunci dan PPN bergeser!']
      ]
    },
    experiments: [
      {
        label: 'Uji =C5*F$1 (Kunci Baris PPN)',
        formula: '=1000000*0.11',
        expectedResult: 110000,
        explanation: 'Dengan tanda $ sebelum angka 1 (F$1), posisi baris 1 terkunci saat disalin ke bawah.',
        autoFillOptionKey: 'D'
      },
      {
        label: 'Uji Rumus Tanpa Dollar (=C5*F1)',
        formula: '=1000000*0',
        expectedResult: 0,
        explanation: 'Jika tanpa $, saat disalin ke D6 rumusnya menjadi C6*F2 yang bernilai 0!',
        autoFillOptionKey: 'D'
      }
    ],
    tipsNote: 'Tanda dollar tepat di depan angka baris ($1) mengunci baris agar tidak bergeser saat disalin menurun.'
  },

  3: {
    questionId: 3,
    badgeTitle: 'Uji Coba Pencarian Data',
    focusTitle: 'Eksperimen VLOOKUP Exact Match (Pencarian Presisi)',
    promptGuide:
      'Mencari data Nama Barang dari Kode Barang pada tabel referensi H3:J15 (H=Kolom 1, I=Kolom 2, J=Kolom 3). Coba jalankan rumus berikut:',
    interactiveMiniTable: {
      caption: 'Struktur Tabel Referensi H3:J15',
      headers: ['Kolom H (Index 1)', 'Kolom I (Index 2)', 'Kolom J (Index 3)'],
      rows: [
        ['BRG-01', 'Monitor LED 24"', 'Rp1.750.000'],
        ['BRG-02', 'Keyboard Mekanikal', 'Rp450.000'],
        ['BRG-03', 'Mouse Wireless', 'Rp180.000']
      ]
    },
    experiments: [
      {
        label: 'Uji =VLOOKUP("BRG-02"; H3:J15; 2; FALSE)',
        formula: '=VLOOKUP("BRG-02"; H3:J15; 2; FALSE)',
        expectedResult: 'Keyboard Mekanikal',
        explanation: 'Index kolom 2 mengambil Nama Barang pada kolom I, dan FALSE memastikan pencarian presisi.',
        autoFillOptionKey: 'B'
      },
      {
        label: 'Uji Index Kolom 3 (Harga Barang)',
        formula: '=VLOOKUP("BRG-02"; H3:J15; 3; FALSE)',
        expectedResult: 450000,
        explanation: 'Index kolom 3 mengambil Harga Satuan pada kolom J, bukan Nama Barang.',
        autoFillOptionKey: 'B'
      }
    ],
    tipsNote: 'Sintaks: =VLOOKUP(lookup_value; table_array; col_index; FALSE). Gunakan kolom 2 untuk Nama Barang.'
  },

  4: {
    questionId: 4,
    badgeTitle: 'Uji Coba Pencarian Kiri',
    focusTitle: 'Eksperimen INDEX & MATCH (Left-Lookup)',
    promptGuide:
      'VLOOKUP tidak bisa mencari data ke arah kiri (kolom ID di D, Nama di B). INDEX & MATCH memecahkan keterbatasan ini:',
    interactiveMiniTable: {
      caption: 'Struktur Kolom Karyawan',
      headers: ['Kolom B (Nama)', 'Kolom C (Departemen)', 'Kolom D (ID Karyawan)'],
      rows: [
        ['Ahmad Dahlan', 'IT Support', 'ID-101'],
        ['Dewi Sartika', 'Keuangan', 'ID-102'],
        ['Budi Santoso', 'Logistik', 'ID-103']
      ]
    },
    experiments: [
      {
        label: 'Uji =INDEX(B2:B50; MATCH(G2; D2:D50; 0))',
        formula: '=INDEX(B2:B50; MATCH("ID-102"; D2:D50; 0))',
        expectedResult: 'Dewi Sartika',
        explanation: 'MATCH menemukan nomor baris ID-102 di kolom D, lalu INDEX mengambil nama pada baris tersebut di kolom B.',
        autoFillOptionKey: 'C'
      }
    ],
    tipsNote: 'Rumus: =INDEX(rentang_hasil; MATCH(kunci; rentang_kunci; 0)). Sangat fleksibel mencari ke kiri maupun kanan.'
  },

  5: {
    questionId: 5,
    badgeTitle: 'Uji Coba Tabel PT Nusantara Niaga',
    focusTitle: 'Eksperimen SUMIFS Multi-Kriteria (Wilayah & Kategori)',
    promptGuide:
      'Perhatikan tabel PT Nusantara Niaga. Kita ingin menghitung Total Omzet (F) untuk Wilayah Balikpapan DAN Kategori Laptop:',
    highlightCols: ['B', 'C', 'F'],
    highlightRows: [2],
    highlightCells: ['B2', 'C2', 'F2'],
    experiments: [
      {
        label: 'Uji =SUMIFS(F2:F7; B2:B7; "Balikpapan"; C2:C7; "Laptop")',
        formula: '=SUMIFS(F2:F7; B2:B7; "Balikpapan"; C2:C7; "Laptop")',
        expectedResult: 185000000,
        explanation: 'Menjumlahkan omzet kolom F khusus cabang Balikpapan dan kategori Laptop (Baris 2 = Rp185.000.000).',
        autoFillOptionKey: 'C'
      },
      {
        label: 'Uji =SUMIFS(F2:F7; B2:B7; "Kalimantan"; C2:C7; "Elektronik")',
        formula: '=SUMIFS(F2:F7; B2:B7; "Kalimantan"; C2:C7; "Elektronik")',
        expectedResult: 345000000,
        explanation: 'Menjumlahkan omzet cabang Kalimantan kategori Elektronik (Baris 2 + Baris 4 = Rp345.000.000).',
        autoFillOptionKey: 'C'
      }
    ],
    tipsNote: 'Pada fungsi SUMIFS, rentang angka yang dijumlahkan (sum_range) SELALU diletakkan pada argumen PERTAMA.'
  },

  6: {
    questionId: 6,
    badgeTitle: 'Uji Coba Logika Majemuk',
    focusTitle: 'Eksperimen Fungsi IF dengan Logika AND (Dua Syarat)',
    promptGuide:
      'Syarat LULUS: Nilai Tes Tulis (C3) minimal 75 (>=75) DAN Wawancara (D3) lebih dari 80 (>80). Coba kedua kasus berikut:',
    interactiveMiniTable: {
      caption: 'Simulasi Nilai Peserta',
      headers: ['Peserta', 'Tes Tulis (C)', 'Wawancara (D)', 'Rumus Logika', 'Hasil'],
      rows: [
        ['Peserta 1', 80, 85, '=IF(AND(80>=75; 85>80); "LULUS"; "GAGAL")', 'LULUS'],
        ['Peserta 2', 74, 95, '=IF(AND(74>=75; 95>80); "LULUS"; "GAGAL")', 'GAGAL (Tes Tulis < 75)'],
        ['Peserta 3', 85, 80, '=IF(AND(85>=75; 80>80); "LULUS"; "GAGAL")', 'GAGAL (Wawancara tidak > 80)']
      ]
    },
    experiments: [
      {
        label: 'Uji =IF(AND(C3>=75; D3>80); "LULUS"; "GAGAL")',
        formula: '=IF(AND(80>=75; 85>80); "LULUS"; "GAGAL")',
        expectedResult: 'LULUS',
        explanation: 'Kondisi AND bernilai TRUE hanya jika kedua syarat terpenuhi sekaligus.',
        autoFillOptionKey: 'C'
      }
    ],
    tipsNote: 'Minimal 75 ditulis >=75. Lebih dari 80 ditulis >80. Hubungan DAN ditulis AND(syarat1; syarat2).'
  },

  7: {
    questionId: 7,
    badgeTitle: 'Uji Coba Manipulasi Teks',
    focusTitle: 'Eksperimen Fungsi MID & Konversi Angka VALUE',
    promptGuide:
      'Kode sel A2: "PST-24-089". Karakter "24" berada pada posisi ke-5 sebanyak 2 digit. Coba perbedaan fungsi teks murni vs VALUE:',
    experiments: [
      {
        label: 'Uji =MID("PST-24-089"; 5; 2) [Hasilkan Teks]',
        formula: '=MID("PST-24-089"; 5; 2)',
        expectedResult: '24',
        explanation: 'Fungsi MID menghasilkan nilai bertipe TEKS "24", belum bisa dipakai untuk matematika lanjutan.',
        autoFillOptionKey: 'B'
      },
      {
        label: 'Uji =VALUE(MID("PST-24-089"; 5; 2)) [Konversi Angka]',
        formula: '=VALUE(MID("PST-24-089"; 5; 2))',
        expectedResult: 24,
        explanation: 'Fungsi VALUE mengubah teks "24" menjadi angka murni 24 yang siap dihitung.',
        autoFillOptionKey: 'B'
      }
    ],
    tipsNote: 'Gunakan VALUE() untuk mengubah teks angka hasil fungsi LEFT, MID, atau RIGHT menjadi nilai numerik.'
  },

  8: {
    questionId: 8,
    badgeTitle: 'Uji Coba Audit Rumus',
    focusTitle: 'Eksperimen Kesalahan Rumus #REF! (Reference Error)',
    promptGuide:
      'Error #REF! muncul ketika rumus merujuk ke alamat sel atau tabel yang baris/kolomnya sudah terhapus. Coba uji rumus berikut:',
    experiments: [
      {
        label: 'Uji Rumus Rusak: =B5+C5+#REF!',
        formula: '=B5+C5+#REF!',
        expectedResult: '#REF!',
        explanation: 'Excel menampilkan #REF! karena salah satu sel yang dijumlahkan telah dihapus dari worksheet.',
        autoFillOptionKey: 'D'
      }
    ],
    tipsNote: '#REF! berarti Invalid Reference (sel acuan telah dihapus atau hilang).'
  },

  9: {
    questionId: 9,
    badgeTitle: 'Uji Coba Pengurutan Data',
    focusTitle: 'Eksperimen Fitur Custom Sort (Pengurutan Bertingkat)',
    promptGuide:
      'Mengurutkan 2 level: Tingkat 1 Divisi (A ke Z), Tingkat 2 Gaji Pokok (Largest to Smallest). Lihat simulasi dialog di bawah:',
    interactiveMiniTable: {
      caption: 'Pengaturan Dialog Custom Sort di Excel',
      headers: ['Level Pengurutan', 'Kolom Acuan', 'Urutan (Order)'],
      rows: [
        ['Level 1 (Sort by)', 'Divisi', 'A to Z (Abjad dari A ke Z)'],
        ['Level 2 (Then by)', 'Gaji Pokok', 'Largest to Smallest (Tertinggi ke Terendah)']
      ]
    },
    experiments: [
      {
        label: 'Cek Menu Custom Sort & Add Level',
        formula: '="Custom Sort: Divisi (A-Z) -> Then by Gaji Pokok (Desc)"',
        expectedResult: 'Custom Sort: Divisi (A-Z) -> Then by Gaji Pokok (Desc)',
        explanation: 'Gunakan dialog Custom Sort lalu klik "Add Level" untuk menambah tingkat pengurutan kedua.',
        autoFillOptionKey: 'B'
      }
    ],
    tipsNote: 'Pengurutan bertingkat memerlukan menu Custom Sort dan tombol Add Level.'
  },

  10: {
    questionId: 10,
    badgeTitle: 'Uji Coba Laporan Bisnis',
    focusTitle: 'Eksperimen Area Field PivotTable (Rows, Columns, Values)',
    promptGuide:
      'Untuk menampilkan Wilayah ke bawah, Kuartal ke samping kanan, dan Total Pendapatan di tengah tabel, pelajari struktur berikut:',
    interactiveMiniTable: {
      caption: 'Matriks Ringkasan PivotTable',
      headers: ['Area PivotTable', 'Field yang Ditempatkan', 'Tampilan Hasil'],
      rows: [
        ['Rows', 'Wilayah Cabang', 'Tampil menurun secara vertikal per baris'],
        ['Columns', 'Kuartal', 'Tampil menyamping secara horizontal per kolom'],
        ['Values', 'Sum of Total Pendapatan', 'Nilai angka dihitung dan diringkas di tengah']
      ]
    },
    experiments: [
      {
        label: 'Uji Layout: Rows Wilayah | Columns Kuartal | Values Omzet',
        formula: '="PivotTable: Rows(Wilayah), Cols(Kuartal), Values(Sum Pendapatan)"',
        expectedResult: 'PivotTable: Rows(Wilayah), Cols(Kuartal), Values(Sum Pendapatan)',
        explanation: 'Susunan ini membentuk matriks silang 2 dimensi yang rapi dan informatif.',
        autoFillOptionKey: 'C'
      }
    ],
    tipsNote: 'Rows = Judul Baris, Columns = Judul Kolom, Values = Nilai Akumulasi Angka.'
  },

  // ==========================================
  // BAGIAN II: BENAR / SALAH (11 s.d. 20)
  // ==========================================
  11: {
    questionId: 11,
    badgeTitle: 'Uji Coba Hirarki Operator',
    focusTitle: 'Eksperimen Urutan Matematika (=10+5*2)',
    promptGuide:
      'Perkalian (*) dieksekusi lebih dahulu daripada penjumlahan (+). Buktikan dengan menjalankan kalkulasi di bawah:',
    experiments: [
      {
        label: 'Uji =10+5*2 (Perkalian Lebih Dulu)',
        formula: '=10+5*2',
        expectedResult: 20,
        explanation: 'Langkah: 5*2 dihitung terlebih dahulu = 10, baru ditambah 10 = 20. Pernyataan BENAR!',
        autoFillOptionKey: 'BENAR'
      },
      {
        label: 'Bandingkan dengan =(10+5)*2 (Tanda Kurung)',
        formula: '=(10+5)*2',
        expectedResult: 30,
        explanation: 'Jika diberi kurung, penjumlahan 10+5=15 dihitung lebih dulu, lalu dikali 2 = 30.',
        autoFillOptionKey: 'BENAR'
      }
    ],
    tipsNote: 'Rumus =10+5*2 menghasilkan 20. Pernyataan soal bernilai BENAR.'
  },

  12: {
    questionId: 12,
    badgeTitle: 'Uji Coba Filter vs Agregasi',
    focusTitle: 'Eksperimen SUM vs SUBTOTAL pada Baris Terfilter',
    promptGuide:
      'Fungsi SUM biasa tetap menjumlahkan baris yang tersembunyi. Hanya fungsi SUBTOTAL yang dapat mengabaikan baris tersembunyi:',
    experiments: [
      {
        label: 'Uji =SUM(D2:D7) [Menjumlahkan Seluruh Baris]',
        formula: '=SUM(D2:D7)',
        expectedResult: 970,
        explanation: 'Fungsi SUM menjumlahkan 970 unit baik baris ditampilkan maupun disembunyikan oleh AutoFilter.',
        autoFillOptionKey: 'SALAH'
      },
      {
        label: 'Bandingkan dengan =SUBTOTAL(9; D2:D7)',
        formula: '=SUBTOTAL(9; D2:D7)',
        expectedResult: 970,
        explanation: 'SUBTOTAL adalah fungsi khusus yang hanya menjumlahkan baris yang terlihat (visible cells).',
        autoFillOptionKey: 'SALAH'
      }
    ],
    tipsNote: 'SUM tidak otomatis mengabaikan baris tersembunyi. Harus menggunakan SUBTOTAL. Pernyataan SALAH.'
  },

  13: {
    questionId: 13,
    badgeTitle: 'Uji Coba Logika Bertingkat',
    focusTitle: 'Eksperimen Alur Evaluasi Nested IF (Kiri ke Kanan)',
    promptGuide:
      'Excel mengevaluasi syarat Nested IF secara berurutan. Begitu syarat pertama bernilai TRUE, Excel langsung memberikan hasilnya:',
    experiments: [
      {
        label: 'Uji Nested IF Nilai 85: =IF(85>=90; "A"; IF(85>=75; "B"; "C"))',
        formula: '=IF(85>=90; "A"; IF(85>=75; "B"; "C"))',
        expectedResult: 'B',
        explanation: 'Karena 85>=90 bernilai FALSE, Excel beralih ke 85>=75 yang bernilai TRUE, lalu langsung mengambil hasil "B".',
        autoFillOptionKey: 'BENAR'
      }
    ],
    tipsNote: 'Nested IF dievaluasi berurutan dari kiri ke kanan. Pernyataan soal bernilai BENAR.'
  },

  14: {
    questionId: 14,
    badgeTitle: 'Uji Coba Pengendalian Error',
    focusTitle: 'Eksperimen Fungsi IFERROR Mengganti #N/A',
    promptGuide:
      'Coba uji pencarian kode transaksi yang tidak ada di tabel PT Nusantara Niaga menggunakan fungsi IFERROR:',
    experiments: [
      {
        label: 'Uji =IFERROR(VLOOKUP("KODE-PALSU"; A2:F7; 2; FALSE); "Data Tidak Ditemukan")',
        formula: '=IFERROR(VLOOKUP("KODE-PALSU"; A2:F7; 2; FALSE); "Data Tidak Ditemukan")',
        expectedResult: 'Data Tidak Ditemukan',
        explanation: 'Pesan error #N/A berhasil ditangkap dan diubah menjadi pesan ramah "Data Tidak Ditemukan".',
        autoFillOptionKey: 'BENAR'
      }
    ],
    tipsNote: 'IFERROR menggantikan error rumus menjadi pesan teks yang ramah pengguna. Pernyataan BENAR.'
  },

  15: {
    questionId: 15,
    badgeTitle: 'Uji Coba Statistik Deskriptif',
    focusTitle: 'Eksperimen Pengaruh Outlier pada AVERAGE vs MEDIAN',
    promptGuide:
      'Perhatikan sel F7 (Omzet Rp980 Juta). Nilai ekstrem ini merusak nilai AVERAGE tetapi tidak mempengaruhi MEDIAN:',
    highlightCols: ['F'],
    highlightRows: [7],
    highlightCells: ['F7'],
    experiments: [
      {
        label: 'Uji =AVERAGE(F2:F7) [Sensitif terhadap Outlier]',
        formula: '=AVERAGE(F2:F7)',
        expectedResult: 272500000,
        explanation: 'Rata-rata melonjak menjadi Rp272.500.000 (padahal 5 dari 6 cabang omzetnya di bawah Rp185 Juta!).',
        autoFillOptionKey: 'SALAH'
      },
      {
        label: 'Uji =MEDIAN(F2:F7) [Tahan terhadap Outlier]',
        formula: '=MEDIAN(F2:F7)',
        expectedResult: 145000000,
        explanation: 'MEDIAN menghasilkan Rp145.000.000 yang tepat mewakili nilai tengah mayoritas cabang normal.',
        autoFillOptionKey: 'SALAH'
      }
    ],
    tipsNote: 'Ketika ada outlier, MEDIAN lebih akurat dibandingkan AVERAGE. Maka pernyataan bahwa AVERAGE lebih akurat adalah SALAH.'
  },

  16: {
    questionId: 16,
    badgeTitle: 'Uji Coba COUNTIF vs SUMIF',
    focusTitle: 'Eksperimen Perbedaan Menghitung (Count) vs Menjumlahkan (Sum)',
    promptGuide:
      'COUNTIF menghitung banyaknya kemunculan baris, BUKAN menjumlahkan angka di dalamnya:',
    highlightCols: ['D'],
    experiments: [
      {
        label: 'Uji =COUNTIF(D2:D7; ">100") [Hitung Jumlah Baris]',
        formula: '=COUNTIF(D2:D7; ">100")',
        expectedResult: 4,
        explanation: 'COUNTIF menghasilkan 4 (ada 4 cabang yang targetnya > 100). Bukan menjumlahkan nilainya!',
        autoFillOptionKey: 'SALAH'
      },
      {
        label: 'Bandingkan dengan =SUMIF(D2:D7; ">100") [Jumlahkan Angkanya]',
        formula: '=SUMIF(D2:D7; ">100")',
        expectedResult: 690,
        explanation: 'SUMIF menjumlahkan total angka target di atas 100 yaitu 150+120+120+300 = 690 unit.',
        autoFillOptionKey: 'SALAH'
      }
    ],
    tipsNote: 'Fungsi COUNTIF menghitung frekuensi sel, bukan menjumlahkan nilai angka. Pernyataan SALAH.'
  },

  17: {
    questionId: 17,
    badgeTitle: 'Uji Coba Tipe Data Formula',
    focusTitle: 'Eksperimen Format Angka vs Teks dalam Fungsi IF',
    promptGuide:
      'Di Excel, nilai angka murni TIDAK boleh diapit tanda kutip agar tetap bisa dipakai dalam perhitungan matematika lanjutan:',
    experiments: [
      {
        label: 'Uji =IF(100>70; 100; 0) [Angka Murni]',
        formula: '=IF(100>70; 100; 0)',
        expectedResult: 100,
        explanation: 'Keluaran bertipe Angka numerik 100 (tanpa kutip), bisa langsung dihitung dan diformat mata uang.',
        autoFillOptionKey: 'BENAR'
      },
      {
        label: 'Uji =IF(100>70; "100"; "0") [Teks]',
        formula: '=IF(100>70; "100"; "0")',
        expectedResult: '100',
        explanation: 'Keluaran bertipe Teks "100", Excel menganggapnya sebagai tulisan dan bukan besaran angka.',
        autoFillOptionKey: 'BENAR'
      }
    ],
    tipsNote: 'Angka murni pada fungsi IF tidak perlu diapit tanda kutip. Pernyataan BENAR.'
  },

  18: {
    questionId: 18,
    badgeTitle: 'Uji Coba Mixed Reference',
    focusTitle: 'Eksperimen Kunci Kolom Campuran ($B4)',
    promptGuide:
      'Pada penulisan $B4, simbol $ hanya diletakkan di depan huruf B sehingga mengunci kolom B secara absolut, sedangkan baris 4 bersifat relatif:',
    interactiveMiniTable: {
      caption: 'Efek Salin Sel $B4',
      headers: ['Arah Salin (Copy)', 'Rumus Awal', 'Hasil Perubahan Rumus', 'Keterangan'],
      rows: [
        ['Disalin ke bawah (vertikal)', '=$B4', '=$B5, =$B6, =$B7', 'Baris bertambah karena tanpa tanda $'],
        ['Disalin ke kanan (horizontal)', '=$B4', '=$B4, =$B4, =$B4', 'Kolom tetap B karena dikunci dengan $B']
      ]
    },
    experiments: [
      {
        label: 'Uji Konsep Referensi Campuran: =$B4',
        formula: '="Kolom B terkunci ($B), Baris 4 bebas bertambah"',
        expectedResult: 'Kolom B terkunci ($B), Baris 4 bebas bertambah',
        explanation: 'Referensi $B4 adalah referensi campuran (mixed reference).',
        autoFillOptionKey: 'BENAR'
      }
    ],
    tipsNote: 'Tanda dollar sebelum kolom B ($B4) mengunci kolom, baris 4 bebas berubah. Pernyataan BENAR.'
  },

  19: {
    questionId: 19,
    badgeTitle: 'Uji Coba Fungsi Teks',
    focusTitle: 'Eksperimen RIGHT vs LEFT pada Kata "KALIMANTAN"',
    promptGuide:
      'Fungsi RIGHT mengambil karakter dari kanan. Uji perbedaan kata yang dihasilkan di bawah:',
    experiments: [
      {
        label: 'Uji =RIGHT("KALIMANTAN"; 6) [Dari Ujung Kanan]',
        formula: '=RIGHT("KALIMANTAN"; 6)',
        expectedResult: 'MANTAN',
        explanation: '6 huruf dari kanan pada "KALIMANTAN" adalah M-A-N-T-A-N, BUKAN KALIMA!',
        autoFillOptionKey: 'SALAH'
      },
      {
        label: 'Uji =LEFT("KALIMANTAN"; 6) [Dari Ujung Kiri]',
        formula: '=LEFT("KALIMANTAN"; 6)',
        expectedResult: 'KALIMA',
        explanation: '6 huruf dari kiri barulah menghasilkan kata "KALIMA".',
        autoFillOptionKey: 'SALAH'
      }
    ],
    tipsNote: 'RIGHT("KALIMANTAN"; 6) menghasilkan "MANTAN", bukan "KALIMA". Pernyataan SALAH.'
  },

  20: {
    questionId: 20,
    badgeTitle: 'Uji Coba Data Cleaning',
    focusTitle: 'Eksperimen Fitur Remove Duplicates',
    promptGuide:
      'Fitur Remove Duplicates di tab Data memindai tabel dan menghapus baris duplikat secara permanen sehingga hanya menyisakan data unik pertama:',
    experiments: [
      {
        label: 'Cek Fungsi Remove Duplicates',
        formula: '="Data > Remove Duplicates: Menghapus data ganda permanen"',
        expectedResult: 'Data > Remove Duplicates: Menghapus data ganda permanen',
        explanation: 'Remove Duplicates menyaring dan menghapus rekaman ganda secara permanen dari lembar kerja.',
        autoFillOptionKey: 'BENAR'
      }
    ],
    tipsNote: 'Remove Duplicates menghapus baris ganda permanen dan menyisakan data unik. Pernyataan BENAR.'
  },

  // ==========================================
  // BAGIAN III: ESSAY & STUDI KASUS (21 s.d. 25)
  // ==========================================
  21: {
    questionId: 21,
    badgeTitle: 'Studi Kasus 1: Predikat Kinerja',
    focusTitle: 'Uji Coba Rumus Predikat Cabang (Kolom G)',
    promptGuide:
      'Aturan Predikat: Jika Realisasi (E) >= Target (D) DAN Omzet (F) >= 150jt -> "Sangat Baik". Jika Realisasi >= Target saja -> "Baik". Selain itu -> "Perlu Evaluasi". Uji rumus pada masing-masing cabang:',
    highlightCols: ['D', 'E', 'F', 'G'],
    highlightRows: [2, 3, 5],
    highlightCells: ['E2', 'D2', 'F2', 'E3', 'D3', 'F3', 'E5', 'D5', 'F5'],
    experiments: [
      {
        label: 'Uji Baris 2 (ELK-BPP-01): Realisasi 125 >= 100 & Omzet 185jt >= 150jt',
        formula: '=IF(AND(125>=100; 185000000>=150000000); "Sangat Baik"; IF(125>=100; "Baik"; "Perlu Evaluasi"))',
        expectedResult: 'Sangat Baik',
        explanation: 'Cabang Balikpapan memenuhi kedua syarat: target terlampaui dan omzet di atas 150 juta!',
        targetEssaySubLabel: 'A. Rumus pada Sel G2'
      },
      {
        label: 'Uji Baris 3 (FRN-SRG-02): Realisasi 75 < Target 80',
        formula: '=IF(AND(75>=80; 92000000>=150000000); "Sangat Baik"; IF(75>=80; "Baik"; "Perlu Evaluasi"))',
        expectedResult: 'Perlu Evaluasi',
        explanation: 'Cabang Semarang tidak mencapai target penjualan sehingga mendapat predikat "Perlu Evaluasi".',
        targetEssaySubLabel: 'C. Hasil Baris 3 (FRN-2026-SRG-02)'
      },
      {
        label: 'Uji Baris 5 (ATK-MKS-04): Realisasi 160 >= 150 tetapi Omzet 88jt < 150jt',
        formula: '=IF(AND(160>=150; 88000000>=150000000); "Sangat Baik"; IF(160>=150; "Baik"; "Perlu Evaluasi"))',
        expectedResult: 'Baik',
        explanation: 'Cabang Makassar mencapai target unit tetapi omzetnya di bawah 150 juta, maka predikatnya "Baik".',
        targetEssaySubLabel: 'D. Hasil Baris 5 (ATK-2026-MKS-04)'
      }
    ],
    tipsNote: 'Rumus G2: =IF(AND(E2>=D2; F2>=150000000); "Sangat Baik"; IF(E2>=D2; "Baik"; "Perlu Evaluasi")).'
  },

  22: {
    questionId: 22,
    badgeTitle: 'Studi Kasus 2: Agregasi Bersyarat',
    focusTitle: 'Uji Coba SUMIFS & COUNTIFS pada PT Nusantara Niaga',
    promptGuide:
      'a) Hitung total omzet Wilayah Kalimantan, Kategori Elektronik, Realisasi >= 100. b) Hitung cabang dengan Omzet > 100 Juta:',
    highlightCols: ['B', 'C', 'E', 'F'],
    highlightRows: [2, 4, 6, 7],
    experiments: [
      {
        label: 'Uji Rumus Sub A: =SUMIFS(F2:F7; B2:B7; "Kalimantan"; C2:C7; "Elektronik"; E2:E7; ">=100")',
        formula: '=SUMIFS(F2:F7; B2:B7; "Kalimantan"; C2:C7; "Elektronik"; E2:E7; ">=100")',
        expectedResult: 345000000,
        explanation: 'Baris yang cocok adalah Baris 2 (185jt) dan Baris 4 (160jt). Total = Rp345.000.000.',
        targetEssaySubLabel: 'A. Rumus Total Omzet Kalimantan, Elektronik, Realisasi >= 100'
      },
      {
        label: 'Uji Rumus Sub B: =COUNTIFS(F2:F7; ">100000000")',
        formula: '=COUNTIFS(F2:F7; ">100000000")',
        expectedResult: 4,
        explanation: 'Ada 4 transaksi dengan omzet di atas 100 juta: Baris 2 (185jt), Baris 4 (160jt), Baris 6 (130jt), dan Baris 7 (980jt).',
        targetEssaySubLabel: 'B. Rumus Jumlah Transaksi Omzet > 100 Juta'
      }
    ],
    tipsNote: 'Sub A menghasilkan 345000000. Sub B menghasilkan 4 transaksi.'
  },

  23: {
    questionId: 23,
    badgeTitle: 'Studi Kasus 3: Audit Rumus VLOOKUP',
    focusTitle: 'Eksperimen Perbaikan Rumus VLOOKUP & IFERROR',
    promptGuide:
      'Rumus awal staf =VLOOKUP(A2; J2:L10; 4; FALSE) salah karena tabel J:L hanya 3 kolom (error #REF!) dan tabel belum dikunci ($J$2:$L$10). Coba perbaikannya:',
    experiments: [
      {
        label: 'Uji Rumus Rusak Awal: =VLOOKUP(A2; J2:L10; 4; FALSE)',
        formula: '=VLOOKUP(A2; J2:L10; 4; FALSE)',
        expectedResult: '#REF!',
        explanation: 'Index kolom 4 memicu error #REF! karena tabel referensi J:L hanya memiliki 3 kolom.',
        targetEssaySubLabel: 'A. Identifikasi 2 Kesalahan Fatal'
      },
      {
        label: 'Uji Rumus Perbaikan dengan IFERROR pada Kolom ke-3',
        formula: '=IFERROR(VLOOKUP(A2; $J$2:$L$10; 3; FALSE); "Kode Tidak Terdaftar")',
        expectedResult: 'Kode Tidak Terdaftar',
        explanation: 'Rumus yang benar: tabel dikunci absolut $J$2:$L$10, index kolom 3, dan dibungkus fungsi IFERROR.',
        targetEssaySubLabel: 'B. Rumus Perbaikan dengan IFERROR'
      }
    ],
    tipsNote: 'Kesalahan: kolom 4 melebihi batas tabel dan tabel J2:L10 belum absolut. Perbaikan: =IFERROR(VLOOKUP(A2; $J$2:$L$10; 3; FALSE); "Kode Tidak Terdaftar").'
  },

  24: {
    questionId: 24,
    badgeTitle: 'Studi Kasus 4: Ekstraksi Teks',
    focusTitle: 'Uji Coba Ekstraksi Kode Transaksi A2 ("ELK-2026-BPP-01")',
    promptGuide:
      'Uji rumus untuk mengekstrak informasi Kategori di awal, Kota Cabang di tengah, dan Nomor Urut angka murni di akhir sel A2:',
    highlightCols: ['A'],
    highlightRows: [2],
    highlightCells: ['A2'],
    experiments: [
      {
        label: 'Uji Sub A: =LEFT(A2; 3) [Ambil 3 Karakter Kategori]',
        formula: '=LEFT("ELK-2026-BPP-01"; 3)',
        expectedResult: 'ELK',
        explanation: 'Mengambil 3 karakter pertama dari kiri menghasilkan "ELK".',
        targetEssaySubLabel: 'A. Kode Kategori ("ELK")'
      },
      {
        label: 'Uji Sub B: =MID(A2; 10; 3) [Ambil 3 Karakter Kota]',
        formula: '=MID("ELK-2026-BPP-01"; 10; 3)',
        expectedResult: 'BPP',
        explanation: 'Huruf B berada pada karakter ke-10, mengambil 3 huruf menghasilkan "BPP".',
        targetEssaySubLabel: 'B. Kode Kota Cabang ("BPP")'
      },
      {
        label: 'Uji Sub C: =VALUE(RIGHT(A2; 2)) [Ambil 2 Digit Numerik]',
        formula: '=VALUE(RIGHT("ELK-2026-BPP-01"; 2))',
        expectedResult: 1,
        explanation: 'RIGHT mengambil teks "01", lalu VALUE mengubahnya menjadi angka numerik 1 murni.',
        targetEssaySubLabel: 'C. Nomor Urut Numerik (Angka 1)'
      }
    ],
    tipsNote: 'Sub A =LEFT(A2; 3), Sub B =MID(A2; 10; 3), Sub C =VALUE(RIGHT(A2; 2)).'
  },

  25: {
    questionId: 25,
    badgeTitle: 'Studi Kasus 5: Analisis Outlier',
    focusTitle: 'Uji Coba Outlier Omzet Rp980 Juta (MEDIAN vs AVERAGE)',
    promptGuide:
      'Perhatikan baris ke-7 (JKT-06 Rp980 Juta). Nilai outlier ini menarik AVERAGE jauh di atas rata-rata cabang riil. Uji perhitungannya:',
    highlightCols: ['F'],
    highlightRows: [7],
    highlightCells: ['F7'],
    experiments: [
      {
        label: 'Uji =MEDIAN(F2:F7) [Nilai Tengah yang Representatif]',
        formula: '=MEDIAN(F2:F7)',
        expectedResult: 145000000,
        explanation: 'MEDIAN menghasilkan Rp145.000.000 yang stabil dan mencerminkan omzet cabang umum.',
        targetEssaySubLabel: 'A. Alasan Pemilihan MEDIAN Dibanding AVERAGE'
      },
      {
        label: 'Uji =AVERAGE(F2:F7) [Rata-rata Terdistorsi Outlier]',
        formula: '=AVERAGE(F2:F7)',
        expectedResult: 272500000,
        explanation: 'AVERAGE melonjak ke Rp272.500.000 karena adanya omzet ekstrem 980 juta pada baris 7.',
        targetEssaySubLabel: 'A. Alasan Pemilihan MEDIAN Dibanding AVERAGE'
      }
    ],
    tipsNote: 'Outlier 980jt membuat AVERAGE melonjak ke 272,5jt. MEDIAN bernilai 145jt jauh lebih merepresentasikan kondisi umum 5 cabang lainnya.'
  }
};

