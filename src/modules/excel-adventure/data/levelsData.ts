import { LevelData } from '../types';

export const LEVELS_DATA: LevelData[] = [
  {
    id: 1,
    title: 'Kenali Dunia Excel',
    subtitle: 'Memahami Antarmuka, Baris, Kolom & Alamat Sel',
    icon: 'Compass',
    badgeName: 'Penjelajah Grid',
    color: 'from-emerald-500 to-teal-600',
    flashcards: [
      {
        id: '1-1',
        term: 'Apa itu Aplikasi Spreadsheet (Excel)?',
        visualType: 'app-overview',
        frontQuestion: 'Mengapa kita menggunakan aplikasi seperti Microsoft Excel di sekolah dan pekerjaan?',
        explanation: 'Aplikasi Spreadsheet seperti Microsoft Excel adalah program pengolah angka berbentuk tabel (baris dan kolom) yang memudahkan kita mencatat data, menghitung rumus otomatis, dan membuat laporan rapi.',
        example: 'Contoh penggunaan: Daftar nilai siswa, laporan kas kelas, dan jadwal piket.'
      },
      {
        id: '1-2',
        term: 'Workbook & Worksheet',
        visualType: 'sheet-tabs',
        frontQuestion: 'Apa perbedaan antara Workbook (Buku Kerja) dan Worksheet (Lembar Kerja)?',
        explanation: 'Workbook adalah keseluruhan file Excel (ibarat sebuah buku tulis), sedangkan Worksheet (Sheet) adalah halaman-halaman lembar kerja di dalamnya yang bisa dipilih melalui Sheet Tab di bagian bawah.',
        example: "Di bagian bawah layar terdapat tab 'Sheet1', 'Data Nilai', dll."
      },
      {
        id: '1-3',
        term: 'Kolom (Column) vs Baris (Row)',
        visualType: 'row-col',
        frontQuestion: 'Bagaimana cara membedakan Kolom dan Baris pada lembar kerja?',
        explanation: 'KOLOM (Column) memanjang secara vertikal (atas ke bawah) dan ditandai dengan HURUF (A, B, C, D...). BARIS (Row) memanjang secara horizontal (kiri ke kanan) dan ditandai dengan ANGKA (1, 2, 3, 4...).',
        example: 'Kolom B adalah deretan menurun di bawah huruf B. Baris 3 adalah deretan mendatar di samping angka 3.'
      },
      {
        id: '1-4',
        term: 'Sel (Cell) & Alamat Sel',
        visualType: 'cell-address',
        frontQuestion: 'Apa itu Sel (Cell) dan bagaimana cara membaca alamatnya?',
        explanation: 'Sel adalah kotak pertemuan antara Kolom dan Baris. Alamat sel selalu ditulis dengan HURUF KOLOM terlebih dahulu baru diikuti ANGKA BARIS (terlihat di Name Box).',
        example: 'Pertemuan Kolom B dan Baris 3 disebut sel B3 (bukan 3B).'
      },
      {
        id: '1-5',
        term: 'Ribbon, Name Box, & Formula Bar',
        visualType: 'interface-bars',
        frontQuestion: 'Apa fungsi dari Ribbon, Name Box, dan Formula Bar di bagian atas?',
        explanation: '1) Ribbon: Deretan tombol alat pemformatan (Bold, warna, dll).\n2) Name Box: Menampilkan alamat sel yang sedang aktif.\n3) Formula Bar (fx): Tempat melihat dan mengetik isi data atau rumus di dalam sel.',
        example: "Jika kamu klik sel C4, Name Box akan menampilkan tulisan 'C4'."
      }
    ],
    initialGrid: {
      A1: { value: 'No', style: { bold: true, bg: '#dcfce7', align: 'center' } },
      B1: { value: 'Komponen', style: { bold: true, bg: '#dcfce7', align: 'left' } },
      C1: { value: 'Skor', style: { bold: true, bg: '#dcfce7', align: 'center' } },
      A2: { value: '1', style: { align: 'center' } },
      B2: { value: 'Name Box', style: {} },
      C2: { value: '100', style: { align: 'center' } },
      A3: { value: '2', style: { align: 'center' } },
      B3: { value: 'Target Misi!', style: { bg: '#fef08a', bold: true } },
      C3: { value: '95', style: { align: 'center' } }
    },
    tasks: [
      {
        id: 't1-1',
        instruction: "Misi 1: Ketuk atau klik bagian 'Formula Bar (fx)' pada antarmuka simulasi di atas tabel!",
        type: 'click_ui',
        targetUI: 'FORMULA_BAR',
        hint: "Formula Bar terletak di bagian atas grid, tepat di sebelah kanan ikon 'fx'."
      },
      {
        id: 't1-2',
        instruction: 'Misi 2: Ketuk header KOLOM C (kotak huruf C di bagian atas tabel) untuk mengenali kolom!',
        type: 'click_ui',
        targetUI: 'COL_C',
        hint: "Cari huruf 'C' pada deretan huruf kolom A, B, C, D di bagian paling atas tabel."
      },
      {
        id: 't1-3',
        instruction: 'Misi 3: Temukan dan pilih sel B3 (pertemuan Kolom B dan Baris 3) pada lembar kerja!',
        type: 'select_cell',
        targetCell: 'B3',
        hint: "Lihat kolom B, lalu turun ke baris nomor 3 yang bertuliskan 'Target Misi!'."
      },
      {
        id: 't1-4',
        instruction: 'Misi 4: Sekarang pilih sel D4 dan ketik angka 100 lalu tekan tombol Simpan Sel / Enter!',
        type: 'cell_value',
        targetCell: 'D4',
        expectedValue: '100',
        hint: "Klik kotak pada kolom D baris 4, ketik 100 di Formula Bar atau langsung di sel, lalu klik 'Simpan Sel'."
      }
    ]
  },
  {
    id: 2,
    title: 'Navigasi & Mengisi Data',
    subtitle: 'Memilih Sel, Memperbaiki Data & Mengenal Rentang (Range)',
    icon: 'Grid',
    badgeName: 'Operator Data',
    color: 'from-blue-500 to-indigo-600',
    flashcards: [
      {
        id: '2-1',
        term: 'Memasukkan Teks dan Angka',
        visualType: 'data-types',
        frontQuestion: 'Apa perbedaan data Teks (Label) dan Angka (Value) saat diketik di sel?',
        explanation: 'Data Teks adalah huruf/kata seperti nama siswa atau mata pelajaran. Data Angka adalah nilai numerik yang nantinya dapat dihitung dengan rumus matematika.',
        example: "Nama 'Budi' adalah teks, sedangkan Nilai '85' adalah angka."
      },
      {
        id: '2-2',
        term: 'Mengedit & Memperbaiki Isi Sel',
        visualType: 'edit-cell',
        frontQuestion: 'Bagaimana jika kita salah mengetik data di dalam sel?',
        explanation: 'Kita cukup memilih sel yang salah tersebut, lalu mengetikkan nilai yang benar melalui Formula Bar atau langsung di kotak input sel, kemudian menekan Enter / Simpan.',
        example: "Mengubah angka '850' yang salah ketik menjadi '85'."
      },
      {
        id: '2-3',
        term: 'Memahami Rentang Sel (Range)',
        visualType: 'cell-range',
        frontQuestion: 'Apa yang dimaksud dengan Range seperti A1:C3?',
        explanation: 'Range (Rentang Sel) adalah kumpulan beberapa sel yang bersebelahan. Ditulis menggunakan tanda titik dua (:) dari sel pojok kiri atas hingga sel pojok kanan bawah.',
        example: 'B2:B5 berarti kumpulan sel B2, B3, B4, dan B5.'
      }
    ],
    initialGrid: {
      A1: { value: 'No', style: { bold: true, bg: '#dbeafe', align: 'center' } },
      B1: { value: 'Nama Siswa', style: { bold: true, bg: '#dbeafe' } },
      C1: { value: 'Kelas', style: { bold: true, bg: '#dbeafe', align: 'center' } },
      D1: { value: 'Nilai Tugas', style: { bold: true, bg: '#dbeafe', align: 'center' } },
      A2: { value: '1', style: { align: 'center' } },
      B2: { value: 'Andi Pratama', style: {} },
      C2: { value: '8A', style: { align: 'center' } },
      D2: { value: '88', style: { align: 'right' } },
      A3: { value: '2', style: { align: 'center' } },
      B3: { value: 'Siti Aminah', style: {} },
      C3: { value: '8A', style: { align: 'center' } },
      D3: { value: '920', style: { align: 'right', bg: '#fee2e2' } },
      A4: { value: '3', style: { align: 'center' } },
      B4: { value: '', style: { bg: '#fef9c3' } },
      C4: { value: '8A', style: { align: 'center' } },
      D4: { value: '', style: { bg: '#fef9c3' } }
    },
    tasks: [
      {
        id: 't2-1',
        instruction: 'Misi 1: Nilai Siti Aminah di sel D3 salah ketik menjadi 920! Perbaiki isi sel D3 menjadi 92.',
        type: 'cell_value',
        targetCell: 'D3',
        expectedValue: '92',
        hint: 'Klik sel D3 (berwarna merah muda), ubah angkanya menjadi 92, lalu tekan Simpan/Enter.'
      },
      {
        id: 't2-2',
        instruction: "Misi 2: Masukkan nama siswa 'Budi Santoso' pada kolom Nama Siswa baris ke-4 (sel B4).",
        type: 'cell_value',
        targetCell: 'B4',
        expectedValue: 'Budi Santoso',
        hint: 'Klik sel B4, ketik Budi Santoso (huruf besar/kecil tidak masalah), lalu tekan Simpan/Enter.'
      },
      {
        id: 't2-3',
        instruction: 'Misi 3: Masukkan nilai tugas 85 untuk Budi Santoso pada sel D4.',
        type: 'cell_value',
        targetCell: 'D4',
        expectedValue: '85',
        hint: 'Klik sel D4, ketik 85, lalu tekan Simpan/Enter.'
      },
      {
        id: 't2-4',
        instruction: "Misi 4: Blok/pilih rentang judul tabel dari A1 sampai D1 (gunakan tombol 'Pilih Rentang A1:D1').",
        type: 'select_range',
        targetRange: 'A1:D1',
        hint: "Klik tombol 'Pilih Rentang A1:D1' pada bilah alat bantu di atas tabel."
      }
    ]
  },
  {
    id: 3,
    title: 'Format Data Visual',
    subtitle: 'Bold, Italic, Perataan Teks, Warna & Format Mata Uang',
    icon: 'Sparkles',
    badgeName: 'Desainer Tabel',
    color: 'from-purple-500 to-fuchsia-600',
    flashcards: [
      {
        id: '3-1',
        term: 'Gaya Huruf: Bold, Italic, Underline',
        visualType: 'font-styles',
        frontQuestion: 'Kapan kita menggunakan Bold (B), Italic (I), dan Underline (U)?',
        explanation: 'Bold (Tebal) digunakan untuk menonjolkan judul tabel atau total nilai. Italic (Miring) untuk istilah asing/catatan, dan Underline (Garis Bawah) untuk penekanan khusus.',
        example: "Judul kolom 'DAFTAR INVENTARIS' biasanya dibuat Bold agar jelas."
      },
      {
        id: '3-2',
        term: 'Perataan Teks (Alignment)',
        visualType: 'alignment',
        frontQuestion: 'Bagaimana aturan perataan teks (Kiri, Tengah, Kanan) agar tabel mudah dibaca?',
        explanation: '1) Rata Tengah (Center): Cocok untuk Nomor Urut, Kode, atau Judul.\n2) Rata Kiri (Left): Cocok untuk Nama atau Deskripsi.\n3) Rata Kanan (Right): Standar untuk angka dan nominal uang.',
        example: 'Nomor urut 1, 2, 3 terlihat jauh lebih rapi jika dibuat Rata Tengah.'
      },
      {
        id: '3-3',
        term: 'Format Mata Uang (Currency) & Warna Latar',
        visualType: 'currency-color',
        frontQuestion: 'Mengapa kita memakai fitur Format Mata Uang (Rp) daripada mengetik huruf Rp secara manual?',
        explanation: "Jika kita mengetik 'Rp 5000' secara manual dengan huruf, komputer menganggapnya teks biasa sehingga tidak bisa dijumlahkan! Gunakan tombol Format Mata Uang agar tetap berupa angka tapi tampil sebagai Rp.",
        example: 'Angka 15000 dengan format Currency otomatis tampil sebagai Rp 15.000.'
      }
    ],
    initialGrid: {
      A1: { value: 'LAPORAN KAS KELAS', style: { bold: false, align: 'left' } },
      A2: { value: 'No', style: { bold: true, bg: '#f3e8ff' } },
      B2: { value: 'Keperluan', style: { bold: true, bg: '#f3e8ff' } },
      C2: { value: 'Biaya', style: { bold: true, bg: '#f3e8ff' } },
      A3: { value: '1', style: { align: 'left' } },
      B3: { value: 'Spidol Papan Tulis', style: {} },
      C3: { value: '15000', style: { format: 'number' } },
      A4: { value: '2', style: { align: 'center' } },
      B4: { value: 'Kertas Karton', style: {} },
      C4: { value: '12000', style: { format: 'currency' } }
    },
    tasks: [
      {
        id: 't3-1',
        instruction: "Misi 1: Buat judul utama di sel A1 ('LAPORAN KAS KELAS') menjadi huruf TEBAL (Bold)!",
        type: 'cell_style',
        targetCell: 'A1',
        styleKey: 'bold',
        expectedStyle: true,
        hint: "Pilih sel A1, lalu klik tombol ikon 'B' (Bold) pada Ribbon di bagian atas."
      },
      {
        id: 't3-2',
        instruction: 'Misi 2: Beri warna latar Kuning/Hijau/Biru (Highlight) pada judul di sel A1 agar menarik!',
        type: 'cell_style_any_bg',
        targetCell: 'A1',
        hint: 'Pilih sel A1, lalu klik salah satu tombol warna latar pada Ribbon.'
      },
      {
        id: 't3-3',
        instruction: "Misi 3: Nomor urut '1' pada sel A3 masih rata kiri. Ubah perataan sel A3 menjadi Rata Tengah (Center)!",
        type: 'cell_style',
        targetCell: 'A3',
        styleKey: 'align',
        expectedStyle: 'center',
        hint: 'Pilih sel A3, lalu klik tombol Rata Tengah (Align Center) pada Ribbon.'
      },
      {
        id: 't3-4',
        instruction: "Misi 4: Ubah tampilan angka 15000 pada sel C3 menjadi Format Mata Uang menggunakan tombol 'Format Rp'!",
        type: 'cell_style',
        targetCell: 'C3',
        styleKey: 'format',
        expectedStyle: 'currency',
        hint: "Pilih sel C3, lalu klik tombol 'Format Rp' pada deretan tombol Ribbon."
      }
    ]
  },
  {
    id: 4,
    title: 'Rumus Pertamaku',
    subtitle: 'Tanda Sama Dengan (=) & Operator Matematika (+, -, *, /)',
    icon: 'Terminal',
    badgeName: 'Arsitek Formula',
    color: 'from-amber-500 to-orange-600',
    flashcards: [
      {
        id: '4-1',
        term: 'Aturan Emas: Tanda Sama Dengan (=)',
        visualType: 'equals-sign',
        frontQuestion: 'Apa karakter pertama yang WAJIB diketik sebelum menulis rumus apa pun di Excel?',
        explanation: "Semua rumus di Excel WAJIB diawali dengan tanda sama dengan (=). Tanpa tanda '=', Excel hanya akan menganggap ketikanmu sebagai teks biasa dan tidak menghitungnya.",
        example: 'Mengetik =5+5 akan menghasilkan 10. Mengetik 5+5 tanpa = hanya menampilkan tulisan 5+5.'
      },
      {
        id: '4-2',
        term: '4 Operator Matematika Dasar',
        visualType: 'operators',
        frontQuestion: 'Simbol apa yang digunakan untuk Penjumlahan, Pengurangan, Perkalian, dan Pembagian?',
        explanation: '• Penjumlahan (+)\n• Pengurangan (-)\n• Perkalian (*), BUKAN huruf x\n• Pembagian (/)',
        example: '=A2*B2 untuk mengalikan isi sel A2 dengan B2.'
      },
      {
        id: '4-3',
        term: 'Referensi Sel vs Angka Langsung',
        visualType: 'cell-reference',
        frontQuestion: 'Mengapa sebaiknya kita menulis =B2*C2 daripada menulis angkanya langsung?',
        explanation: 'Dengan menulis alamat selnya (Referensi Sel), jika data di sel B2 atau C2 berubah, maka hasil perhitungannya akan ikut diperbarui secara otomatis!',
        example: 'Total Harga = Jumlah Barang (B2) * Harga Satuan (C2) -> ditulis =B2*C2.'
      }
    ],
    initialGrid: {
      A1: { value: 'Barang Koperasi', style: { bold: true, bg: '#fef3c7' } },
      B1: { value: 'Jumlah', style: { bold: true, bg: '#fef3c7', align: 'center' } },
      C1: { value: 'Harga Satuan', style: { bold: true, bg: '#fef3c7', align: 'right' } },
      D1: { value: 'Total Harga', style: { bold: true, bg: '#fef3c7', align: 'right' } },
      A2: { value: 'Buku Tulis', style: {} },
      B2: { value: '4', style: { align: 'center' } },
      C2: { value: '5000', style: { format: 'currency' } },
      D2: { value: '', style: { bg: '#fffbeb', format: 'currency' } },
      A3: { value: 'Pulpen Gel', style: {} },
      B3: { value: '3', style: { align: 'center' } },
      C3: { value: '4000', style: { format: 'currency' } },
      D3: { value: '', style: { bg: '#fffbeb', format: 'currency' } },
      A4: { value: 'Total Belanja', style: { bold: true } },
      D4: { value: '', style: { bg: '#fef08a', bold: true, format: 'currency' } },
      A5: { value: 'Uang Dibayar', style: {} },
      D5: { value: '50000', style: { format: 'currency' } },
      A6: { value: 'Kembalian', style: { bold: true } },
      D6: { value: '', style: { bg: '#dcfce7', bold: true, format: 'currency' } }
    },
    tasks: [
      {
        id: 't4-1',
        instruction: 'Misi 1: Hitung Total Harga Buku Tulis di sel D2 dengan mengalikan Jumlah (B2) dan Harga Satuan (C2). Gunakan rumus =B2*C2',
        type: 'formula_result',
        targetCell: 'D2',
        expectedValue: 20000,
        requireFormula: true,
        hint: 'Klik sel D2, ketik =B2*C2 lalu tekan Simpan/Enter.'
      },
      {
        id: 't4-2',
        instruction: 'Misi 2: Hitung Total Harga Pulpen Gel di sel D3 dengan rumus perkalian antara B3 dan C3!',
        type: 'formula_result',
        targetCell: 'D3',
        expectedValue: 12000,
        requireFormula: true,
        hint: 'Klik sel D3, ketik =B3*C3 lalu tekan Simpan/Enter.'
      },
      {
        id: 't4-3',
        instruction: 'Misi 3: Jumlahkan Total Belanja di sel D4 dengan menjumlahkan sel D2 dan D3 menggunakan operator tambah (+)!',
        type: 'formula_result',
        targetCell: 'D4',
        expectedValue: 32000,
        requireFormula: true,
        hint: 'Klik sel D4, ketik =D2+D3 lalu tekan Simpan/Enter.'
      },
      {
        id: 't4-4',
        instruction: 'Misi 4: Hitung uang Kembalian di sel D6 dengan mengurangkan Uang Dibayar (D5) dengan Total Belanja (D4)!',
        type: 'formula_result',
        targetCell: 'D6',
        expectedValue: 18000,
        requireFormula: true,
        hint: 'Klik sel D6, ketik =D5-D4 lalu tekan Simpan/Enter.'
      }
    ]
  },
  {
    id: 5,
    title: 'Fungsi Statistik Dasar',
    subtitle: 'Menguasai Fungsi SUM, AVERAGE, MIN, dan MAX',
    icon: 'BarChart2',
    badgeName: 'Analis Statistik',
    color: 'from-cyan-500 to-blue-600',
    flashcards: [
      {
        id: '5-1',
        term: 'Fungsi SUM (Menjumlahkan Rentang)',
        visualType: 'func-sum',
        frontQuestion: 'Bagaimana cara menjumlahkan puluhan baris data sekaligus tanpa mengetik + satu per satu?',
        explanation: 'Gunakan fungsi =SUM(rentang_sel). Fungsi SUM akan menjumlahkan seluruh angka di dalam rentang tersebut secara otomatis.',
        example: '=SUM(B2:B6) akan menjumlahkan isi sel B2, B3, B4, B5, dan B6.'
      },
      {
        id: '5-2',
        term: 'Fungsi AVERAGE (Nilai Rata-Rata)',
        visualType: 'func-avg',
        frontQuestion: 'Fungsi apakah yang digunakan untuk mencari nilai rata-rata kelas?',
        explanation: 'Gunakan fungsi =AVERAGE(rentang_sel). Excel akan menjumlahkan seluruh data lalu membaginya dengan banyaknya data.',
        example: '=AVERAGE(B2:B6) menghitung rata-rata dari B2 sampai B6.'
      },
      {
        id: '5-3',
        term: 'Fungsi MAX & MIN (Tertinggi & Terendah)',
        visualType: 'func-minmax',
        frontQuestion: 'Apa perbedaan antara fungsi MAX dan MIN?',
        explanation: '• =MAX(rentang) mencari nilai TERBESAR (tertinggi).\n• =MIN(rentang) mencari nilai TERKECIL (terendah).',
        example: '=MAX(B2:B6) menampilkan nilai ujian tertinggi di kelas.'
      }
    ],
    initialGrid: {
      A1: { value: 'Nama Siswa', style: { bold: true, bg: '#cffafe' } },
      B1: { value: 'Nilai Informatika', style: { bold: true, bg: '#cffafe', align: 'center' } },
      A2: { value: 'Aldi', style: {} },
      B2: { value: '80', style: { align: 'center' } },
      A3: { value: 'Bella', style: {} },
      B3: { value: '95', style: { align: 'center' } },
      A4: { value: 'Citra', style: {} },
      B4: { value: '85', style: { align: 'center' } },
      A5: { value: 'Dimas', style: {} },
      B5: { value: '70', style: { align: 'center' } },
      A6: { value: 'Eka', style: {} },
      B6: { value: '90', style: { align: 'center' } },
      A7: { value: 'Total Nilai (SUM)', style: { bold: true, bg: '#f1f5f9' } },
      B7: { value: '', style: { bold: true, bg: '#fef9c3', align: 'center' } },
      A8: { value: 'Rata-Rata (AVERAGE)', style: { bold: true, bg: '#f1f5f9' } },
      B8: { value: '', style: { bold: true, bg: '#fef9c3', align: 'center' } },
      A9: { value: 'Nilai Tertinggi (MAX)', style: { bold: true, bg: '#f1f5f9' } },
      B9: { value: '', style: { bold: true, bg: '#fef9c3', align: 'center' } },
      A10: { value: 'Nilai Terendah (MIN)', style: { bold: true, bg: '#f1f5f9' } },
      B10: { value: '', style: { bold: true, bg: '#fef9c3', align: 'center' } }
    },
    tasks: [
      {
        id: 't5-1',
        instruction: 'Misi 1: Hitung Total Nilai seluruh siswa pada sel B7 menggunakan fungsi SUM untuk rentang B2:B6!',
        type: 'formula_result',
        targetCell: 'B7',
        expectedValue: 420,
        expectedFunc: 'SUM',
        hint: 'Ketik =SUM(B2:B6) pada sel B7 lalu tekan Simpan/Enter.'
      },
      {
        id: 't5-2',
        instruction: 'Misi 2: Hitung Rata-Rata nilai siswa pada sel B8 menggunakan fungsi AVERAGE untuk rentang B2:B6!',
        type: 'formula_result',
        targetCell: 'B8',
        expectedValue: 84,
        expectedFunc: 'AVERAGE',
        hint: 'Ketik =AVERAGE(B2:B6) pada sel B8 lalu tekan Simpan/Enter.'
      },
      {
        id: 't5-3',
        instruction: 'Misi 3: Temukan Nilai Tertinggi pada sel B9 menggunakan fungsi MAX untuk rentang B2:B6!',
        type: 'formula_result',
        targetCell: 'B9',
        expectedValue: 95,
        expectedFunc: 'MAX',
        hint: 'Ketik =MAX(B2:B6) pada sel B9 lalu tekan Simpan/Enter.'
      },
      {
        id: 't5-4',
        instruction: 'Misi 4: Temukan Nilai Terendah pada sel B10 menggunakan fungsi MIN untuk rentang B2:B6!',
        type: 'formula_result',
        targetCell: 'B10',
        expectedValue: 70,
        expectedFunc: 'MIN',
        hint: 'Ketik =MIN(B2:B6) pada sel B10 lalu tekan Simpan/Enter.'
      }
    ]
  },
  {
    id: 6,
    title: 'Logika COUNT, COUNTA & IF',
    subtitle: 'Menghitung Banyak Data & Pengambilan Keputusan Otomatis',
    icon: 'Zap',
    badgeName: 'Ahli Logika',
    color: 'from-rose-500 to-pink-600',
    flashcards: [
      {
        id: '6-1',
        term: 'Perbedaan COUNT dan COUNTA',
        visualType: 'count-vs-counta',
        frontQuestion: 'Apa bedanya fungsi =COUNT(...) dengan =COUNTA(...)?',
        explanation: '• COUNT hanya menghitung sel berisi ANGKA.\n• COUNTA menghitung seluruh sel yang TIDAK KOSONG (teks maupun angka).',
        example: 'Untuk menghitung nama siswa gunakan COUNTA. Untuk menghitung yang sudah memiliki nilai angka gunakan COUNT.'
      },
      {
        id: '6-2',
        term: 'Fungsi Logika IF',
        visualType: 'func-if',
        frontQuestion: 'Bagaimana cara kerja fungsi =IF(kondisi, nilai_benar, nilai_salah)?',
        explanation: 'Fungsi IF menguji syarat. Jika syarat terpenuhi (Benar), menampilkan hasil pertama. Jika tidak (Salah), menampilkan hasil kedua.',
        example: '=IF(B2>=75, "Lulus", "Remedial")'
      },
      {
        id: '6-3',
        term: 'Tanda Kutip pada Teks di Dalam Rumus',
        visualType: 'quotes-rule',
        frontQuestion: 'Mengapa teks di rumus IF harus diapit tanda kutip dua (" ")?',
        explanation: 'Tanda kutip membedakan teks biasa dengan nama fungsi/rumus di Excel.',
        example: 'Benar: =IF(B2>=75,"Lulus","Remedial")'
      }
    ],
    initialGrid: {
      A1: { value: 'Nama Siswa', style: { bold: true, bg: '#ffe4e6' } },
      B1: { value: 'Nilai Ujian', style: { bold: true, bg: '#ffe4e6', align: 'center' } },
      C1: { value: 'Status Kelulusan', style: { bold: true, bg: '#ffe4e6', align: 'center' } },
      A2: { value: 'Farhan', style: {} },
      B2: { value: '82', style: { align: 'center' } },
      C2: { value: '', style: { bg: '#fff1f2', align: 'center' } },
      A3: { value: 'Gita', style: {} },
      B3: { value: '68', style: { align: 'center' } },
      C3: { value: '=IF(B3>=75,"Remedial","Lulus")', style: { bg: '#fee2e2', align: 'center' } },
      A4: { value: 'Hendra', style: {} },
      B4: { value: '', style: { align: 'center' } },
      C4: { value: 'Belum Ujian', style: { align: 'center' } },
      A5: { value: 'Indah', style: {} },
      B5: { value: '90', style: { align: 'center' } },
      C5: { value: '=IF(B5>=75,"Lulus","Remedial")', style: { align: 'center' } },
      A7: { value: 'Jumlah Siswa Terdaftar (COUNTA)', style: { bold: true } },
      B7: { value: '', style: { bg: '#fef9c3', align: 'center', bold: true } },
      A8: { value: 'Jumlah Nilai Masuk (COUNT)', style: { bold: true } },
      B8: { value: '', style: { bg: '#fef9c3', align: 'center', bold: true } }
    },
    tasks: [
      {
        id: 't6-1',
        instruction: 'Misi 1: Hitung jumlah seluruh nama siswa terdaftar di rentang A2:A5 pada sel B7 dengan fungsi COUNTA!',
        type: 'formula_result',
        targetCell: 'B7',
        expectedValue: 4,
        expectedFunc: 'COUNTA',
        hint: 'Klik sel B7, ketik =COUNTA(A2:A5) lalu tekan Simpan/Enter.'
      },
      {
        id: 't6-2',
        instruction: 'Misi 2: Hitung berapa siswa yang sudah punya nilai angka (rentang B2:B5) pada sel B8 dengan fungsi COUNT!',
        type: 'formula_result',
        targetCell: 'B8',
        expectedValue: 3,
        expectedFunc: 'COUNT',
        hint: 'Klik sel B8, ketik =COUNT(B2:B5) lalu tekan Simpan/Enter.'
      },
      {
        id: 't6-3',
        instruction: 'Misi 3: Tentukan status kelulusan Farhan di sel C2 menggunakan fungsi IF! Syarat lulus: B2>=75 menghasilkan "Lulus", jika kurang "Remedial".',
        type: 'formula_result',
        targetCell: 'C2',
        expectedValue: 'Lulus',
        expectedFunc: 'IF',
        hint: 'Ketik =IF(B2>=75,"Lulus","Remedial") pada sel C2.'
      },
      {
        id: 't6-4',
        instruction: 'Misi 4: Perbaiki rumus di sel C3 milik Gita menjadi =IF(B3>=75,"Lulus","Remedial")!',
        type: 'formula_result',
        targetCell: 'C3',
        expectedValue: 'Remedial',
        expectedFunc: 'IF',
        hint: 'Pilih sel C3, perbaiki urutan katanya menjadi =IF(B3>=75,"Lulus","Remedial").'
      }
    ]
  },
  {
    id: 7,
    title: 'Sort, Filter & Analisis Tabel',
    subtitle: 'Mengurutkan Data, Menyaring Kategori & Membaca Informasi',
    icon: 'Filter',
    badgeName: 'Manajer Tabel',
    color: 'from-indigo-500 to-violet-600',
    flashcards: [
      {
        id: '7-1',
        term: 'Mengurutkan Data (Sorting)',
        visualType: 'sorting',
        frontQuestion: 'Apa kegunaan fitur Sort A-Z dan Sort Z-A?',
        explanation: '• Sort A-Z: Mengurutkan dari terkecil ke terbesar.\n• Sort Z-A: Mengurutkan dari terbesar ke terkecil (peringkat nilai).',
        example: 'Untuk mencari peringkat 1 di kelas, urutkan kolom Nilai secara Descending (9→0).'
      },
      {
        id: '7-2',
        term: 'Menyaring Data (Filter)',
        visualType: 'filtering',
        frontQuestion: 'Bagaimana cara menampilkan hanya baris data tertentu saja?',
        explanation: 'Fitur Filter menyembunyikan sementara baris yang tidak sesuai kriteria sehingga kita fokus pada kategori yang dicari saja.',
        example: "Filter Ekskul = 'Robotik' hanya memunculkan siswa anggota Robotik."
      }
    ],
    initialGrid: {
      A1: { value: 'Nama Siswa', style: { bold: true, bg: '#e0e7ff' } },
      B1: { value: 'Ekskul', style: { bold: true, bg: '#e0e7ff', align: 'center' } },
      C1: { value: 'Skor Aktif', style: { bold: true, bg: '#e0e7ff', align: 'center' } },
      A2: { value: 'Zaki', style: {} },
      B2: { value: 'Futsal', style: { align: 'center' } },
      C2: { value: '78', style: { align: 'center' } },
      A3: { value: 'Nadia', style: {} },
      B3: { value: 'Robotik', style: { align: 'center' } },
      C3: { value: '96', style: { align: 'center' } },
      A4: { value: 'Bagas', style: {} },
      B4: { value: 'Robotik', style: { align: 'center' } },
      C4: { value: '88', style: { align: 'center' } },
      A5: { value: 'Rina', style: {} },
      B5: { value: 'Pramuka', style: { align: 'center' } },
      C5: { value: '91', style: { align: 'center' } },
      A7: { value: 'Jawaban Analisis:', style: { bold: true } },
      B7: { value: 'Siapa peraih skor tertinggi?', style: {} },
      C7: { value: '', style: { bg: '#fef08a', align: 'center', bold: true } }
    },
    tasks: [
      {
        id: 't7-1',
        instruction: "Misi 1: Urutkan tabel berdasarkan Skor Aktif (Kolom C) dari BESAR KE KECIL menggunakan tombol 'Sort Skor (9→0)'!",
        type: 'table_action',
        expectedAction: 'SORT_C_DESC',
        hint: "Klik tombol 'Sort Skor (9→0)' pada toolbar Ribbon."
      },
      {
        id: 't7-2',
        instruction: 'Misi 2: Setelah diurutkan, siapa nama siswa yang meraih skor tertinggi (96)? Ketik namanya pada sel C7!',
        type: 'cell_value',
        targetCell: 'C7',
        expectedValue: 'Nadia',
        hint: 'Lihat nama siswa pemilik skor 96, lalu ketik Nadia di sel C7.'
      },
      {
        id: 't7-3',
        instruction: "Misi 3: Gunakan fitur Filter pada toolbar untuk menyaring dan menampilkan hanya siswa ekskul 'Robotik'!",
        type: 'table_action',
        expectedAction: 'FILTER_Robotik',
        hint: "Pilih tombol 'Filter: Robotik' pada bagian kontrol Filter di toolbar."
      }
    ]
  },
  {
    id: 8,
    title: 'Proyek Akhir: Administrator Sekolah',
    subtitle: 'Misi Terpadu Pengolahan Raport & Laporan Kelas',
    icon: 'Trophy',
    badgeName: 'Excel Master',
    color: 'from-emerald-600 via-teal-600 to-cyan-700',
    flashcards: [
      {
        id: '8-1',
        term: 'Misi Puncak: Administrator Data Sekolah',
        visualType: 'master-project',
        frontQuestion: 'Apa saja tugas seorang Administrator Data Sekolah?',
        explanation: 'Seorang Excel Master menggabungkan keterampilan:\n1. Memastikan judul rapi\n2. Melengkapi data kosong\n3. Menghitung SUM & AVERAGE\n4. Status tuntas dengan IF\n5. Mencari nilai MAX.',
        example: 'Selesaikan misi proyek akhir ini untuk meraih gelar EXCEL MASTER!'
      }
    ],
    initialGrid: {
      A1: { value: 'REKAP NILAI INFORMATIKA KELAS 8', style: { bold: false, bg: '#d1fae5' } },
      A2: { value: 'Nama Siswa', style: { bold: true, bg: '#a7f3d0' } },
      B2: { value: 'Nilai Praktik', style: { bold: true, bg: '#a7f3d0', align: 'center' } },
      C2: { value: 'Status (KKM 75)', style: { bold: true, bg: '#a7f3d0', align: 'center' } },
      A3: { value: 'Aris', style: {} },
      B3: { value: '85', style: { align: 'center' } },
      C3: { value: '=IF(B3>=75,"Tuntas","Belum")', style: { align: 'center' } },
      A4: { value: 'Bunga', style: {} },
      B4: { value: '90', style: { align: 'center' } },
      C4: { value: '=IF(B4>=75,"Tuntas","Belum")', style: { align: 'center' } },
      A5: { value: 'Candra', style: {} },
      B5: { value: '70', style: { align: 'center' } },
      C5: { value: '=IF(B5>=75,"Tuntas","Belum")', style: { align: 'center' } },
      A6: { value: 'Dewi', style: {} },
      B6: { value: '', style: { bg: '#fef08a', align: 'center' } },
      C6: { value: '', style: { bg: '#fef08a', align: 'center' } },
      A8: { value: 'Total Nilai (SUM)', style: { bold: true } },
      B8: { value: '', style: { bg: '#e0f2fe', align: 'center', bold: true } },
      A9: { value: 'Rata-Rata Kelas (AVERAGE)', style: { bold: true } },
      B9: { value: '', style: { bg: '#e0f2fe', align: 'center', bold: true } },
      A10: { value: 'Nilai Tertinggi (MAX)', style: { bold: true } },
      B10: { value: '', style: { bg: '#e0f2fe', align: 'center', bold: true } }
    },
    tasks: [
      {
        id: 't8-1',
        instruction: 'Tugas 1: Format judul laporan di sel A1 menjadi huruf TEBAL (Bold)!',
        type: 'cell_style',
        targetCell: 'A1',
        styleKey: 'bold',
        expectedStyle: true,
        hint: 'Pilih sel A1 lalu tekan tombol B (Bold).'
      },
      {
        id: 't8-2',
        instruction: 'Tugas 2: Masukkan nilai praktik Dewi sebesar 95 pada sel B6!',
        type: 'cell_value',
        targetCell: 'B6',
        expectedValue: '95',
        hint: 'Pilih sel B6, ketik 95 lalu tekan Simpan/Enter.'
      },
      {
        id: 't8-3',
        instruction: 'Tugas 3: Buat rumus IF pada sel C6 untuk Dewi: jika B6>=75 maka "Tuntas", jika tidak "Belum"!',
        type: 'formula_result',
        targetCell: 'C6',
        expectedValue: 'Tuntas',
        expectedFunc: 'IF',
        hint: 'Ketik =IF(B6>=75,"Tuntas","Belum") pada sel C6.'
      },
      {
        id: 't8-4',
        instruction: 'Tugas 4: Hitung Total Nilai seluruh siswa (rentang B3:B6) pada sel B8 menggunakan fungsi SUM!',
        type: 'formula_result',
        targetCell: 'B8',
        expectedValue: 340,
        expectedFunc: 'SUM',
        hint: 'Ketik =SUM(B3:B6) pada sel B8.'
      },
      {
        id: 't8-5',
        instruction: 'Tugas 5: Hitung Rata-Rata nilai kelas (rentang B3:B6) pada sel B9 menggunakan fungsi AVERAGE!',
        type: 'formula_result',
        targetCell: 'B9',
        expectedValue: 85,
        expectedFunc: 'AVERAGE',
        hint: 'Ketik =AVERAGE(B3:B6) pada sel B9.'
      },
      {
        id: 't8-6',
        instruction: 'Tugas 6: Temukan Nilai Tertinggi dari rentang B3:B6 pada sel B10 menggunakan fungsi MAX!',
        type: 'formula_result',
        targetCell: 'B10',
        expectedValue: 95,
        expectedFunc: 'MAX',
        hint: 'Ketik =MAX(B3:B6) pada sel B10.'
      }
    ]
  },
  // =========================================================================
  // FITUR BARU: LEVEL 9 - VISUALISASI DATA & DIAGRAM SEKOLAH
  // =========================================================================
  {
    id: 9,
    title: 'Visualisasi Data & Diagram',
    subtitle: 'Membuat Diagram Batang, Garis, & Lingkaran Interaktif',
    icon: 'Layers',
    badgeName: 'Visualisator Data',
    color: 'from-pink-500 via-rose-500 to-amber-500',
    flashcards: [
      {
        id: '9-1',
        term: 'Mengapa Perlu Grafik / Diagram?',
        visualType: 'chart-types',
        frontQuestion: 'Mengapa laporan data angka sering diubah menjadi diagram atau grafik visual?',
        explanation: 'Grafik mempermudah pembaca memahami pola, perbandingan, dan tren sekilas tanpa harus membaca baris angka satu per satu.',
        example: 'Diagram batang memudahkan kepala sekolah melihat mata pelajaran mana yang nilainya paling tinggi.'
      },
      {
        id: '9-2',
        term: 'Jenis Grafik Populer (Batang, Garis, Lingkaran)',
        visualType: 'chart-comparison',
        frontQuestion: 'Kapan kita menggunakan Diagram Batang (Bar), Garis (Line), dan Lingkaran (Pie)?',
        explanation: '• Diagram Batang (Bar): Membandingkan jumlah/nilai antar kategori.\n• Diagram Garis (Line): Menunjukkan perubahan tren dari waktu ke waktu.\n• Diagram Lingkaran (Pie): Menunjukkan persentase atau bagian dari keseluruhan (100%).',
        example: 'Persentase pilihan ekskul paling tepat disajikan dengan Diagram Lingkaran (Pie).'
      }
    ],
    initialGrid: {
      A1: { value: 'Mata Pelajaran', style: { bold: true, bg: '#fce7f3' } },
      B1: { value: 'Rata-Rata Nilai', style: { bold: true, bg: '#fce7f3', align: 'center' } },
      A2: { value: 'Informatika', style: {} },
      B2: { value: '88', style: { align: 'center' } },
      A3: { value: 'Matematika', style: {} },
      B3: { value: '82', style: { align: 'center' } },
      A4: { value: 'Bahasa Indonesia', style: {} },
      B4: { value: '90', style: { align: 'center' } },
      A5: { value: 'IPA Terpadu', style: {} },
      B5: { value: '85', style: { align: 'center' } },
      A6: { value: 'Bahasa Inggris', style: {} },
      B6: { value: '92', style: { align: 'center' } },
      A8: { value: 'Mapel Tertinggi:', style: { bold: true } },
      B8: { value: '', style: { bg: '#fef08a', align: 'center', bold: true } }
    },
    tasks: [
      {
        id: 't9-1',
        instruction: "Misi 1: Buka fitur 'Buat Grafik' pada Ribbon di atas dan pilih jenis Diagram Batang (Bar Chart)!",
        type: 'create_chart',
        chartType: 'bar',
        hint: "Klik tombol '📊 Buat Grafik' pada bilah alat Ribbon, lalu pilih opsi Diagram Batang."
      },
      {
        id: 't9-2',
        instruction: 'Misi 2: Berdasarkan grafik dan data tabel, mata pelajaran apa yang meraih rata-rata tertinggi (92)? Ketik nama mapelnya pada sel B8!',
        type: 'cell_value',
        targetCell: 'B8',
        expectedValue: 'Bahasa Inggris',
        hint: 'Lihat bar batang tertinggi pada grafik atau angka 92 di sel B6, ketik Bahasa Inggris di sel B8.'
      }
    ]
  },
  // =========================================================================
  // FITUR BARU: LEVEL 10 - ANALISIS KRITERIA & VLOOKUP
  // =========================================================================
  {
    id: 10,
    title: 'Analisis Kriteria & VLOOKUP',
    subtitle: 'Menguasai COUNTIF, SUMIF, dan Pencarian Data Otomatis',
    icon: 'Search',
    badgeName: 'Grand Master Data',
    color: 'from-amber-600 via-orange-600 to-red-600',
    flashcards: [
      {
        id: '10-1',
        term: 'Fungsi COUNTIF & SUMIF',
        visualType: 'countif-sumif',
        frontQuestion: 'Bagaimana menghitung banyak siswa yang lulus atau total iuran ekskul tertentu saja?',
        explanation: '• =COUNTIF(rentang, kriteria): Menghitung berapa sel yang memenuhi syarat tertentu.\n• =SUMIF(rentang_kriteria, kriteria, [rentang_jumlah]): Menjumlahkan nilai hanya jika kriterianya cocok.',
        example: '=COUNTIF(C2:C6, "Lulus") menghitung berapa siswa yang lulus.'
      },
      {
        id: '10-2',
        term: 'Fungsi VLOOKUP (Vertical Lookup)',
        visualType: 'vlookup-flow',
        frontQuestion: 'Bagaimana cara mencari nama siswa atau harga barang secara otomatis berdasarkan kodenya?',
        explanation: 'Fungsi =VLOOKUP(nilai_kunci, tabel_rentang, nomor_kolom) mencari nilai kunci di kolom paling kiri tabel referensi, lalu mengambil data di kolom yang diminta pada baris yang sama.',
        example: '=VLOOKUP(A2, D1:E5, 2) mencari nama barang dari tabel kode D1:E5.'
      }
    ],
    initialGrid: {
      A1: { value: 'Nama', style: { bold: true, bg: '#fed7aa' } },
      B1: { value: 'Status', style: { bold: true, bg: '#fed7aa', align: 'center' } },
      C1: { value: 'Iuran', style: { bold: true, bg: '#fed7aa', align: 'right' } },
      A2: { value: 'Rian', style: {} },
      B2: { value: 'Lulus', style: { align: 'center' } },
      C2: { value: '20000', style: { format: 'currency' } },
      A3: { value: 'Sari', style: {} },
      B3: { value: 'Remedial', style: { align: 'center' } },
      C3: { value: '20000', style: { format: 'currency' } },
      A4: { value: 'Tomi', style: {} },
      B4: { value: 'Lulus', style: { align: 'center' } },
      C4: { value: '20000', style: { format: 'currency' } },
      A5: { value: 'Vina', style: {} },
      B5: { value: 'Lulus', style: { align: 'center' } },
      C5: { value: '20000', style: { format: 'currency' } },
      A7: { value: 'Jumlah Siswa Lulus (COUNTIF)', style: { bold: true } },
      B7: { value: '', style: { bg: '#fef9c3', align: 'center', bold: true } },
      A8: { value: 'Total Iuran Siswa Lulus (SUMIF)', style: { bold: true } },
      C8: { value: '', style: { bg: '#dcfce7', align: 'right', bold: true, format: 'currency' } }
    },
    tasks: [
      {
        id: 't10-1',
        instruction: 'Misi 1: Hitung berapa siswa yang berstatus "Lulus" di rentang B2:B5 pada sel B7 dengan rumus COUNTIF!',
        type: 'formula_result',
        targetCell: 'B7',
        expectedValue: 3,
        expectedFunc: 'COUNTIF',
        hint: 'Ketik =COUNTIF(B2:B5, "Lulus") pada sel B7 lalu tekan Simpan/Enter.'
      },
      {
        id: 't10-2',
        instruction: 'Misi 2: Jumlahkan Iuran (Kolom C) HANYA untuk siswa yang "Lulus" di sel C8 menggunakan fungsi SUMIF!',
        type: 'formula_result',
        targetCell: 'C8',
        expectedValue: 60000,
        expectedFunc: 'SUMIF',
        hint: 'Ketik =SUMIF(B2:B5, "Lulus", C2:C5) pada sel C8 lalu tekan Simpan/Enter.'
      }
    ]
  },
  // =========================================================================
  // LEVEL 11: MANIPULASI TEKS & PENGGABUNGAN DATA
  // =========================================================================
  {
    id: 11,
    title: 'Manipulasi Teks & Penggabungan',
    subtitle: 'Mengolah Teks dengan CONCAT, UPPER, LOWER, dan Potong Kode',
    icon: 'Type',
    badgeName: 'Spesialis Teks',
    color: 'from-teal-500 via-emerald-600 to-green-600',
    flashcards: [
      {
        id: '11-1',
        term: 'Fungsi CONCAT / CONCATENATE',
        visualType: 'text-functions',
        frontQuestion: 'Bagaimana cara menggabungkan teks dari beberapa sel menjadi satu kalimat utuh?',
        explanation: 'Fungsi =CONCAT(teks1, teks2, ...) menggabungkan beberapa potongan teks atau isi sel menjadi satu kesatuan. Untuk menambahkan spasi antar kata, sisipkan teks spasi berjarak " " di antara alamat sel.',
        example: '=CONCAT(B2, " ", C2) menggabungkan nama depan di B2 dan nama belakang di C2 dengan pemisah spasi.'
      },
      {
        id: '11-2',
        term: 'Fungsi UPPER & LOWER',
        visualType: 'text-functions',
        frontQuestion: 'Fungsi apa yang digunakan untuk mengubah tulisan menjadi huruf kapital atau huruf kecil semua?',
        explanation: '• =UPPER(teks): Mengubah seluruh huruf menjadi HURUF BESAR (KAPITAL).\n• =LOWER(teks): Mengubah seluruh huruf menjadi huruf kecil.',
        example: '=UPPER("smp") menghasilkan "SMP". =LOWER("JAKARTA") menghasilkan "jakarta".'
      },
      {
        id: '11-3',
        term: 'Fungsi LEFT & RIGHT',
        visualType: 'text-functions',
        frontQuestion: 'Bagaimana cara memotong atau mengambil karakter awal dan akhir dari sebuah kode?',
        explanation: '• =LEFT(teks, jumlah): Mengambil sejumlah karakter dari sisi paling KIRI.\n• =RIGHT(teks, jumlah): Mengambil sejumlah karakter dari sisi paling KANAN.',
        example: 'Jika sel A2 berisi "2024-RPL", maka =LEFT(A2, 4) mengambil "2024", dan =RIGHT(A2, 3) mengambil "RPL".'
      }
    ],
    initialGrid: {
      A1: { value: 'Kode Registrasi', style: { bold: true, bg: '#ccfbf1' } },
      B1: { value: 'Nama Depan', style: { bold: true, bg: '#ccfbf1' } },
      C1: { value: 'Nama Belakang', style: { bold: true, bg: '#ccfbf1' } },
      D1: { value: 'Nama Lengkap', style: { bold: true, bg: '#ccfbf1' } },
      E1: { value: 'Nama Huruf Besar', style: { bold: true, bg: '#ccfbf1' } },
      A2: { value: '2024-RPL', style: { align: 'center' } },
      B2: { value: 'Budi', style: {} },
      C2: { value: 'Santoso', style: {} },
      D2: { value: '', style: { bg: '#fef9c3' } },
      E2: { value: '', style: { bg: '#fef9c3' } },
      A3: { value: '2024-TKJ', style: { align: 'center' } },
      B3: { value: 'Siti', style: {} },
      C3: { value: 'Aminah', style: {} },
      D3: { value: '=CONCAT(B3," ",C3)', style: {} },
      E3: { value: '=UPPER(D3)', style: {} },
      A5: { value: 'Tahun Angkatan (LEFT)', style: { bold: true } },
      B5: { value: '', style: { bg: '#dcfce7', align: 'center', bold: true } },
      A6: { value: 'Kode Jurusan (RIGHT)', style: { bold: true } },
      B6: { value: '', style: { bg: '#dcfce7', align: 'center', bold: true } }
    },
    tasks: [
      {
        id: 't11-1',
        instruction: 'Misi 1: Gabungkan Nama Depan (B2) dan Nama Belakang (C2) dengan spasi di sel D2 menggunakan rumus =CONCAT(B2," ",C2)!',
        type: 'formula_result',
        targetCell: 'D2',
        expectedValue: 'Budi Santoso',
        expectedFunc: 'CONCAT',
        hint: 'Ketik =CONCAT(B2," ",C2) pada sel D2 lalu tekan Simpan/Enter.'
      },
      {
        id: 't11-2',
        instruction: 'Misi 2: Ubah Nama Lengkap di sel D2 menjadi HURUF BESAR (KAPITAL) pada sel E2 menggunakan fungsi UPPER!',
        type: 'formula_result',
        targetCell: 'E2',
        expectedValue: 'BUDI SANTOSO',
        expectedFunc: 'UPPER',
        hint: 'Ketik =UPPER(D2) pada sel E2 lalu tekan Simpan/Enter.'
      },
      {
        id: 't11-3',
        instruction: 'Misi 3: Ambil 4 karakter Tahun Angkatan dari sisi kiri kode di sel A2 ("2024-RPL") pada sel B5 menggunakan fungsi LEFT!',
        type: 'formula_result',
        targetCell: 'B5',
        expectedValue: '2024',
        expectedFunc: 'LEFT',
        hint: 'Ketik =LEFT(A2,4) pada sel B5 lalu tekan Simpan/Enter.'
      },
      {
        id: 't11-4',
        instruction: 'Misi 4: Ambil 3 karakter Kode Jurusan dari sisi kanan kode di sel A2 pada sel B6 menggunakan fungsi RIGHT!',
        type: 'formula_result',
        targetCell: 'B6',
        expectedValue: 'RPL',
        expectedFunc: 'RIGHT',
        hint: 'Ketik =RIGHT(A2,3) pada sel B6 lalu tekan Simpan/Enter.'
      }
    ]
  },
  // =========================================================================
  // LEVEL 12: PERHITUNGAN PERSENTASE & DISKON
  // =========================================================================
  {
    id: 12,
    title: 'Perhitungan Persentase & Diskon',
    subtitle: 'Menguasai Format Persen (%), Potongan Harga & Belanja Hemat',
    icon: 'Percent',
    badgeName: 'Analis Keuangan',
    color: 'from-emerald-600 via-teal-600 to-green-700',
    flashcards: [
      {
        id: '12-1',
        term: 'Konsep Persentase di Spreadsheet',
        visualType: 'percent-calc',
        frontQuestion: 'Bagaimana cara komputer menyimpan dan menghitung angka persentase (%)?',
        explanation: 'Nilai 10% sebenarnya bernilai desimal 0.1 di dalam sistem, dan 50% bernilai 0.5. Dengan menerapkan Format Persen (%), angka desimal akan tampil rapi dengan simbol % dan tetap dapat dikalikan secara langsung dengan nominal harga.',
        example: 'Ketik 0.1 lalu klik tombol %, tampilannya menjadi 10%.'
      },
      {
        id: '12-2',
        term: 'Rumus Menghitung Potongan Diskon & Harga Bersih',
        visualType: 'percent-calc',
        frontQuestion: 'Bagaimana rumus mencari besaran potongan harga dan harga akhir yang harus dibayar?',
        explanation: '• Potongan Diskon = Harga Asli * Persentase Diskon -> misal =B2*C2 atau =B2*0.1\n• Harga Bersih = Harga Asli - Potongan Diskon -> misal =B2-D2',
        example: 'Harga Rp 100.000 dengan diskon 10% mendapat potongan Rp 10.000, sehingga harga bayarnya Rp 90.000.'
      }
    ],
    initialGrid: {
      A1: { value: 'Nama Barang', style: { bold: true, bg: '#dcfce7' } },
      B1: { value: 'Harga Normal', style: { bold: true, bg: '#dcfce7', align: 'right' } },
      C1: { value: 'Diskon (%)', style: { bold: true, bg: '#dcfce7', align: 'center' } },
      D1: { value: 'Potongan (Rp)', style: { bold: true, bg: '#dcfce7', align: 'right' } },
      E1: { value: 'Harga Bayar', style: { bold: true, bg: '#dcfce7', align: 'right' } },
      A2: { value: 'Tas Sekolah', style: {} },
      B2: { value: '100000', style: { format: 'currency' } },
      C2: { value: '0.1', style: { align: 'center' } },
      D2: { value: '', style: { bg: '#fef9c3', format: 'currency' } },
      E2: { value: '', style: { bg: '#fef9c3', format: 'currency' } },
      A3: { value: 'Sepatu Olahraga', style: {} },
      B3: { value: '200000', style: { format: 'currency' } },
      C3: { value: '20', style: { align: 'center', format: 'percent' } },
      D3: { value: '=B3*0.2', style: { format: 'currency' } },
      E3: { value: '=B3-D3', style: { format: 'currency' } },
      A4: { value: 'Tempat Pensil', style: {} },
      B4: { value: '25000', style: { format: 'currency' } },
      C4: { value: '10', style: { align: 'center', format: 'percent' } },
      D4: { value: '2500', style: { format: 'currency' } },
      E4: { value: '22500', style: { format: 'currency' } },
      A6: { value: 'Total Tagihan Belanja', style: { bold: true } },
      E6: { value: '', style: { bg: '#bbf7d0', bold: true, align: 'right', format: 'currency' } }
    },
    tasks: [
      {
        id: 't12-1',
        instruction: 'Misi 1: Ubah tampilan angka desimal 0.1 di sel C2 menjadi format Persen (%) menggunakan tombol % di toolbar Ribbon!',
        type: 'cell_style',
        targetCell: 'C2',
        styleKey: 'format',
        expectedStyle: 'percent',
        hint: 'Pilih sel C2, lalu tekan tombol ikon % (Format Persen) pada Ribbon.'
      },
      {
        id: 't12-2',
        instruction: 'Misi 2: Hitung besaran potongan diskon Tas Sekolah di sel D2: kalikan Harga Normal (B2) dengan Diskon (C2 atau 0.1)! Rumus: =B2*C2',
        type: 'formula_result',
        targetCell: 'D2',
        expectedValue: 10000,
        requireFormula: true,
        hint: 'Ketik =B2*C2 atau =B2*0.1 pada sel D2 lalu tekan Simpan/Enter.'
      },
      {
        id: 't12-3',
        instruction: 'Misi 3: Hitung Harga Bayar Tas Sekolah di sel E2 dengan mengurangkan Harga Normal (B2) dengan Potongan (D2)! Rumus: =B2-D2',
        type: 'formula_result',
        targetCell: 'E2',
        expectedValue: 90000,
        requireFormula: true,
        hint: 'Ketik =B2-D2 pada sel E2 lalu tekan Simpan/Enter.'
      },
      {
        id: 't12-4',
        instruction: 'Misi 4: Hitung Total Tagihan Belanja seluruh barang di sel E6 dengan menjumlahkan rentang E2:E4 menggunakan fungsi SUM!',
        type: 'formula_result',
        targetCell: 'E6',
        expectedValue: 272500,
        expectedFunc: 'SUM',
        hint: 'Ketik =SUM(E2:E4) pada sel E6 lalu tekan Simpan/Enter.'
      }
    ]
  },
  // =========================================================================
  // LEVEL 13: LOGIKA BERTINGKAT & PREDIKAT NILAI
  // =========================================================================
  {
    id: 13,
    title: 'Logika Bertingkat & Predikat Nilai',
    subtitle: 'Menguasai IF Bersarang (Nested IF) untuk Menentukan Kategori A, B, & C',
    icon: 'Layers',
    badgeName: 'Logikawan Senior',
    color: 'from-violet-600 via-purple-600 to-indigo-700',
    flashcards: [
      {
        id: '13-1',
        term: 'Konsep IF Bertingkat (Nested IF)',
        visualType: 'nested-if',
        frontQuestion: 'Bagaimana cara membuat keputusan otomatis jika terdapat lebih dari 2 pilihan hasil (A, B, C)?',
        explanation: 'Kita memasukkan fungsi IF kedua di dalam bagian nilai salah dari IF pertama. Excel akan menguji syarat pertama, jika tidak terpenuhi akan langsung menguji syarat berikutnya.',
        example: '=IF(B2>=90, "A", IF(B2>=80, "B", "C"))'
      },
      {
        id: '13-2',
        term: 'Aturan Urutan Pengujian Nilai',
        visualType: 'nested-if',
        frontQuestion: 'Mengapa pengujian nilai lebih besar (>=) harus diurutkan dari angka tertinggi ke terendah?',
        explanation: 'Excel mengevaluasi rumus dari kiri ke kanan. Jika kita menguji B2>=80 sebelum B2>=90, maka nilai 95 akan langsung dianggap "B" karena 95 sudah lebih besar dari 80! Oleh karena itu, selalu uji nilai tertinggi terlebih dahulu (>=90 baru kemudian >=80).',
        example: 'Urutan benar: >=90 (A) -> >=80 (B) -> selain itu (C).'
      }
    ],
    initialGrid: {
      A1: { value: 'Nama Siswa', style: { bold: true, bg: '#ede9fe' } },
      B1: { value: 'Nilai Akhir', style: { bold: true, bg: '#ede9fe', align: 'center' } },
      C1: { value: 'Predikat (A/B/C)', style: { bold: true, bg: '#ede9fe', align: 'center' } },
      A2: { value: 'Ahmad', style: {} },
      B2: { value: '92', style: { align: 'center' } },
      C2: { value: '', style: { bg: '#fef9c3', align: 'center', bold: true } },
      A3: { value: 'Bilqis', style: {} },
      B3: { value: '84', style: { align: 'center' } },
      C3: { value: '', style: { bg: '#fef9c3', align: 'center', bold: true } },
      A4: { value: 'Chandra', style: {} },
      B4: { value: '72', style: { align: 'center' } },
      C4: { value: '', style: { bg: '#fef9c3', align: 'center', bold: true } },
      A5: { value: 'Dinda', style: {} },
      B5: { value: '95', style: { align: 'center' } },
      C5: { value: '=IF(B5>=90,"A",IF(B5>=80,"B","C"))', style: { align: 'center', bold: true } },
      A7: { value: 'Jumlah Peraih Predikat A', style: { bold: true } },
      C7: { value: '', style: { bg: '#dcfce7', align: 'center', bold: true } }
    },
    tasks: [
      {
        id: 't13-1',
        instruction: 'Misi 1: Buat rumus IF bersarang pada sel C2 untuk Ahmad (nilai 92): jika B2>=90 predikat "A", jika B2>=80 predikat "B", selain itu "C"!',
        type: 'formula_result',
        targetCell: 'C2',
        expectedValue: 'A',
        expectedFunc: 'IF',
        hint: 'Ketik =IF(B2>=90,"A",IF(B2>=80,"B","C")) pada sel C2 lalu tekan Simpan/Enter.'
      },
      {
        id: 't13-2',
        instruction: 'Misi 2: Terapkan rumus IF bersarang pada sel C3 untuk Bilqis (nilai 84)! Hasil yang diharapkan adalah "B".',
        type: 'formula_result',
        targetCell: 'C3',
        expectedValue: 'B',
        expectedFunc: 'IF',
        hint: 'Ketik =IF(B3>=90,"A",IF(B3>=80,"B","C")) pada sel C3.'
      },
      {
        id: 't13-3',
        instruction: 'Misi 3: Terapkan rumus IF bersarang pada sel C4 untuk Chandra (nilai 72)! Hasil yang diharapkan adalah "C".',
        type: 'formula_result',
        targetCell: 'C4',
        expectedValue: 'C',
        expectedFunc: 'IF',
        hint: 'Ketik =IF(B4>=90,"A",IF(B4>=80,"B","C")) pada sel C4.'
      },
      {
        id: 't13-4',
        instruction: 'Misi 4: Hitung berapa siswa yang meraih Predikat "A" (rentang C2:C5) pada sel C7 dengan fungsi COUNTIF!',
        type: 'formula_result',
        targetCell: 'C7',
        expectedValue: 2,
        expectedFunc: 'COUNTIF',
        hint: 'Ketik =COUNTIF(C2:C5,"A") pada sel C7 lalu tekan Simpan/Enter.'
      }
    ]
  },
  // =========================================================================
  // LEVEL 14: PEMBULATAN & MATEMATIKA PRESISI
  // =========================================================================
  {
    id: 14,
    title: 'Pembulatan & Matematika Presisi',
    subtitle: 'Menguasai ROUND, ROUNDUP, ROUNDDOWN, dan Perpangkatan',
    icon: 'Calculator',
    badgeName: 'Master Presisi',
    color: 'from-amber-500 via-orange-500 to-yellow-600',
    flashcards: [
      {
        id: '14-1',
        term: 'Fungsi ROUND, ROUNDUP & ROUNDDOWN',
        visualType: 'round-math',
        frontQuestion: 'Bagaimana cara mengatur pembulatan angka desimal di lembar kerja Excel?',
        explanation: '• =ROUND(angka, digit): Membulatkan sesuai aturan matematika (>=5 ke atas, <5 ke bawah).\n• =ROUNDUP(angka, digit): Selalu memaksa pembulatan KE ATAS.\n• =ROUNDDOWN(angka, digit): Selalu membulatkan KE BAWAH (memangkas desimal).',
        example: '=ROUND(85.67, 1) menghasilkan 85.7. =ROUND(85.67, 0) menghasilkan 86.'
      },
      {
        id: '14-2',
        term: 'Fungsi Perpangkatan (POWER & Simbol ^)',
        visualType: 'round-math',
        frontQuestion: 'Bagaimana cara menghitung bilangan berpangkat (misal 5 kuadrat)?',
        explanation: 'Gunakan operator pangkat (^) atau fungsi =POWER(bilangan, pangkat). Misalnya 5 dipangkatkan 2 ditulis =5^2 atau =POWER(5, 2).',
        example: '=B2^2 atau =POWER(B2, 2) menghasilkan nilai kuadrat dari sel B2.'
      }
    ],
    initialGrid: {
      A1: { value: 'Item Uji', style: { bold: true, bg: '#fef3c7' } },
      B1: { value: 'Nilai Mentah', style: { bold: true, bg: '#fef3c7', align: 'center' } },
      C1: { value: 'Hasil Pembulatan / Hitung', style: { bold: true, bg: '#fef3c7', align: 'center' } },
      A2: { value: 'Rata-rata Kelas (Bulatkan 1 Desimal)', style: {} },
      B2: { value: '87.666', style: { align: 'center' } },
      C2: { value: '', style: { bg: '#fef9c3', align: 'center', bold: true } },
      A3: { value: 'Skor Akhir (Bulatkan 0 Desimal)', style: {} },
      B3: { value: '74.8', style: { align: 'center' } },
      C3: { value: '', style: { bg: '#fef9c3', align: 'center', bold: true } },
      A4: { value: 'Tarif Taksi (ROUNDUP ke Atas)', style: {} },
      B4: { value: '15200.2', style: { align: 'center' } },
      C4: { value: '', style: { bg: '#fef9c3', align: 'center', bold: true } },
      A5: { value: 'Luas Persegi Sisi 8 (POWER 2)', style: {} },
      B5: { value: '8', style: { align: 'center' } },
      C5: { value: '', style: { bg: '#fef9c3', align: 'center', bold: true } }
    },
    tasks: [
      {
        id: 't14-1',
        instruction: 'Misi 1: Bulatkan nilai mentah 87.666 pada sel B2 menjadi 1 angka di belakang koma pada sel C2 menggunakan rumus =ROUND(B2, 1)!',
        type: 'formula_result',
        targetCell: 'C2',
        expectedValue: 87.7,
        expectedFunc: 'ROUND',
        hint: 'Ketik =ROUND(B2, 1) pada sel C2 lalu tekan Simpan/Enter.'
      },
      {
        id: 't14-2',
        instruction: 'Misi 2: Bulatkan skor mentah 74.8 pada sel B3 ke bilangan bulat utuh (0 desimal) pada sel C3 menggunakan rumus =ROUND(B3, 0)!',
        type: 'formula_result',
        targetCell: 'C3',
        expectedValue: 75,
        expectedFunc: 'ROUND',
        hint: 'Ketik =ROUND(B3, 0) pada sel C3 lalu tekan Simpan/Enter.'
      },
      {
        id: 't14-3',
        instruction: 'Misi 3: Bulatkan KE ATAS angka 15200.2 pada sel B4 menjadi bilangan bulat pada sel C4 menggunakan fungsi ROUNDUP!',
        type: 'formula_result',
        targetCell: 'C4',
        expectedValue: 15201,
        expectedFunc: 'ROUNDUP',
        hint: 'Ketik =ROUNDUP(B4, 0) pada sel C4 lalu tekan Simpan/Enter.'
      },
      {
        id: 't14-4',
        instruction: 'Misi 4: Hitung kuadrat dari panjang sisi 8 di sel B5 menggunakan rumus =POWER(B5, 2) atau =B5^2 pada sel C5!',
        type: 'formula_result',
        targetCell: 'C5',
        expectedValue: 64,
        requireFormula: true,
        hint: 'Ketik =POWER(B5, 2) atau =B5^2 pada sel C5 lalu tekan Simpan/Enter.'
      }
    ]
  },
  // =========================================================================
  // LEVEL 15: DATABASE & PENCARIAN DATA VLOOKUP
  // =========================================================================
  {
    id: 15,
    title: 'Database & Pencarian Data VLOOKUP',
    subtitle: 'Mengambil Informasi Siswa & Barang dari Tabel Referensi Master',
    icon: 'Search',
    badgeName: 'Database Master',
    color: 'from-blue-600 via-indigo-600 to-cyan-700',
    flashcards: [
      {
        id: '15-1',
        term: 'Mengenal Tabel Master & Tabel Transaksi',
        visualType: 'vlookup-database',
        frontQuestion: 'Mengapa data identitas atau barang sebaiknya disimpan dalam satu Tabel Master?',
        explanation: 'Dengan tabel master, kita tidak perlu mengetik nama atau harga berulang kali. Cukup masukkan Nomor Induk (NIS) atau Kode Barang, lalu fungsi VLOOKUP akan otomatis mengisi detail lainnya.',
        example: 'Ketik NIS 101, maka Nama "Aisyah Putri" otomatis terisi.'
      },
      {
        id: '15-2',
        term: 'Struktur Parameter VLOOKUP',
        visualType: 'vlookup-database',
        frontQuestion: 'Apa saja 3 parameter wajib di dalam rumus VLOOKUP?',
        explanation: '=VLOOKUP(lookup_value, table_range, col_index)\n1) Nilai Kunci yang dicari (misal sel A2)\n2) Rentang Tabel Master (misal D2:E5)\n3) Nomor Urut Kolom data yang ingin diambil (kolom 2 untuk nama).',
        example: '=VLOOKUP(A2, D2:E5, 2) mengambil kolom ke-2 dari tabel master.'
      }
    ],
    initialGrid: {
      A1: { value: 'NIS Input', style: { bold: true, bg: '#dbeafe', align: 'center' } },
      B1: { value: 'Nama Siswa Terpanggil', style: { bold: true, bg: '#dbeafe' } },
      D1: { value: 'NIS Master', style: { bold: true, bg: '#e2e8f0', align: 'center' } },
      E1: { value: 'Nama Master', style: { bold: true, bg: '#e2e8f0' } },
      A2: { value: '101', style: { align: 'center', bold: true } },
      B2: { value: '', style: { bg: '#fef9c3' } },
      D2: { value: '101', style: { align: 'center' } },
      E2: { value: 'Aisyah Putri', style: {} },
      A3: { value: '103', style: { align: 'center', bold: true } },
      B3: { value: '', style: { bg: '#fef9c3' } },
      D3: { value: '102', style: { align: 'center' } },
      E3: { value: 'Bambang Irawan', style: {} },
      A4: { value: '102', style: { align: 'center', bold: true } },
      B4: { value: '', style: { bg: '#fef9c3' } },
      D4: { value: '103', style: { align: 'center' } },
      E4: { value: 'Cindy Claudia', style: {} },
      D5: { value: '104', style: { align: 'center' } },
      E5: { value: 'Dedi Kurniawan', style: {} }
    },
    tasks: [
      {
        id: 't15-1',
        instruction: 'Misi 1: Panggil nama siswa pemilik NIS 101 pada sel B2 menggunakan rumus =VLOOKUP(A2, D2:E5, 2)!',
        type: 'formula_result',
        targetCell: 'B2',
        expectedValue: 'Aisyah Putri',
        expectedFunc: 'VLOOKUP',
        hint: 'Ketik =VLOOKUP(A2, D2:E5, 2) pada sel B2 lalu tekan Simpan/Enter.'
      },
      {
        id: 't15-2',
        instruction: 'Misi 2: Panggil nama siswa pemilik NIS 103 pada sel B3 menggunakan rumus VLOOKUP dari tabel master D2:E5!',
        type: 'formula_result',
        targetCell: 'B3',
        expectedValue: 'Cindy Claudia',
        expectedFunc: 'VLOOKUP',
        hint: 'Ketik =VLOOKUP(A3, D2:E5, 2) pada sel B3 lalu tekan Simpan/Enter.'
      },
      {
        id: 't15-3',
        instruction: 'Misi 3: Panggil nama siswa pemilik NIS 102 pada sel B4 menggunakan rumus VLOOKUP!',
        type: 'formula_result',
        targetCell: 'B4',
        expectedValue: 'Bambang Irawan',
        expectedFunc: 'VLOOKUP',
        hint: 'Ketik =VLOOKUP(A4, D2:E5, 2) pada sel B4 lalu tekan Simpan/Enter.'
      },
      {
        id: 't15-4',
        instruction: 'Misi 4: Format judul tabel input di sel A1 menjadi huruf TEBAL (Bold) agar tampilan tabel rapi!',
        type: 'cell_style',
        targetCell: 'A1',
        styleKey: 'bold',
        expectedStyle: true,
        hint: 'Pilih sel A1 lalu klik tombol B (Bold) pada Ribbon.'
      }
    ]
  },
  // =========================================================================
  // LEVEL 16: ANALISIS STATISTIK BERSYARAT (AVERAGEIF & SUMIF)
  // =========================================================================
  {
    id: 16,
    title: 'Analisis Statistik Bersyarat',
    subtitle: 'Menghitung Rata-rata Bersyarat dengan AVERAGEIF & Evaluasi Kriteria',
    icon: 'TrendingUp',
    badgeName: 'Analis Kriteria Ulung',
    color: 'from-orange-500 via-amber-600 to-red-600',
    flashcards: [
      {
        id: '16-1',
        term: 'Fungsi AVERAGEIF',
        visualType: 'averageif-flow',
        frontQuestion: 'Bagaimana cara menghitung rata-rata nilai khusus untuk kelompok atau kategori tertentu saja?',
        explanation: 'Gunakan fungsi =AVERAGEIF(rentang_kriteria, kriteria, [rentang_rata2]). Excel akan menyaring baris yang cocok dengan kriteria lalu menghitung nilai rata-ratanya.',
        example: '=AVERAGEIF(B2:B5, "P", C2:C5) menghitung rata-rata nilai khusus siswa Perempuan (P).'
      },
      {
        id: '16-2',
        term: 'Kriteria Angka pada COUNTIF',
        visualType: 'averageif-flow',
        frontQuestion: 'Bagaimana format penulisan kriteria perbandingan angka seperti "lebih besar sama dengan 80"?',
        explanation: 'Kriteria perbandingan angka wajib diapit tanda kutip dua. Misalnya ">=80" atau "<75".',
        example: '=COUNTIF(C2:C5, ">=80") menghitung jumlah siswa yang nilainya mencapai 80 atau lebih.'
      }
    ],
    initialGrid: {
      A1: { value: 'Nama Siswa', style: { bold: true, bg: '#ffedd5' } },
      B1: { value: 'Gender', style: { bold: true, bg: '#ffedd5', align: 'center' } },
      C1: { value: 'Nilai Ujian', style: { bold: true, bg: '#ffedd5', align: 'center' } },
      A2: { value: 'Adit', style: {} },
      B2: { value: 'L', style: { align: 'center' } },
      C2: { value: '80', style: { align: 'center' } },
      A3: { value: 'Bela', style: {} },
      B3: { value: 'P', style: { align: 'center' } },
      C3: { value: '90', style: { align: 'center' } },
      A4: { value: 'Coki', style: {} },
      B4: { value: 'L', style: { align: 'center' } },
      C4: { value: '70', style: { align: 'center' } },
      A5: { value: 'Dara', style: {} },
      B5: { value: 'P', style: { align: 'center' } },
      C5: { value: '100', style: { align: 'center' } },
      A7: { value: 'Jumlah Nilai >=80 (COUNTIF)', style: { bold: true } },
      C7: { value: '', style: { bg: '#fef9c3', align: 'center', bold: true } },
      A8: { value: 'Rata-rata Siswa Perempuan (AVERAGEIF)', style: { bold: true } },
      C8: { value: '', style: { bg: '#fef9c3', align: 'center', bold: true } },
      A9: { value: 'Rata-rata Siswa Laki-laki (AVERAGEIF)', style: { bold: true } },
      C9: { value: '', style: { bg: '#fef9c3', align: 'center', bold: true } },
      A10: { value: 'Total Nilai Perempuan (SUMIF)', style: { bold: true } },
      C10: { value: '', style: { bg: '#fef9c3', align: 'center', bold: true } }
    },
    tasks: [
      {
        id: 't16-1',
        instruction: 'Misi 1: Hitung berapa siswa yang nilainya >=80 pada rentang C2:C5 menggunakan fungsi COUNTIF di sel C7!',
        type: 'formula_result',
        targetCell: 'C7',
        expectedValue: 3,
        expectedFunc: 'COUNTIF',
        hint: 'Ketik =COUNTIF(C2:C5, ">=80") pada sel C7 lalu tekan Simpan/Enter.'
      },
      {
        id: 't16-2',
        instruction: 'Misi 2: Hitung Rata-Rata nilai khusus siswa Perempuan ("P") di sel C8 menggunakan fungsi AVERAGEIF!',
        type: 'formula_result',
        targetCell: 'C8',
        expectedValue: 95,
        expectedFunc: 'AVERAGEIF',
        hint: 'Ketik =AVERAGEIF(B2:B5, "P", C2:C5) pada sel C8 lalu tekan Simpan/Enter.'
      },
      {
        id: 't16-3',
        instruction: 'Misi 3: Hitung Rata-Rata nilai khusus siswa Laki-laki ("L") di sel C9 menggunakan fungsi AVERAGEIF!',
        type: 'formula_result',
        targetCell: 'C9',
        expectedValue: 75,
        expectedFunc: 'AVERAGEIF',
        hint: 'Ketik =AVERAGEIF(B2:B5, "L", C2:C5) pada sel C9 lalu tekan Simpan/Enter.'
      },
      {
        id: 't16-4',
        instruction: 'Misi 4: Jumlahkan TOTAL nilai khusus siswa Perempuan di sel C10 menggunakan fungsi SUMIF!',
        type: 'formula_result',
        targetCell: 'C10',
        expectedValue: 190,
        expectedFunc: 'SUMIF',
        hint: 'Ketik =SUMIF(B2:B5, "P", C2:C5) pada sel C10 lalu tekan Simpan/Enter.'
      }
    ]
  },
  // =========================================================================
  // LEVEL 17: INVENTARIS & SIMULASI STOK GUDANG
  // =========================================================================
  {
    id: 17,
    title: 'Inventaris & Simulasi Stok Gudang',
    subtitle: 'Monitoring Barang Masuk, Keluar, dan Status Restock Otomatis',
    icon: 'Package',
    badgeName: 'Manajer Logistik',
    color: 'from-emerald-600 via-teal-600 to-cyan-600',
    flashcards: [
      {
        id: '17-1',
        term: 'Manajemen Stok & Saldo Barang',
        visualType: 'inventory-stock',
        frontQuestion: 'Bagaimana rumus dasar menghitung sisa stok barang di gudang atau koperasi?',
        explanation: 'Sisa Stok Akhir dihitung dengan mengurangkan Stok Awal dengan Jumlah Terjual (atau Masuk - Keluar).\nContoh: Sisa Stok = Stok Awal (B2) - Terjual (C2).',
        example: '=B2-C2 menghitung sisa barang yang ada di rak toko.'
      },
      {
        id: '17-2',
        term: 'Peringatan Restock Otomatis dengan IF',
        visualType: 'inventory-stock',
        frontQuestion: 'Bagaimana membuat status peringatan otomatis jika stok barang hampir habis?',
        explanation: 'Gunakan fungsi IF dengan batas minimum. Misalnya jika sisa stok <= 10 maka tampilkan "Pesan Lagi", jika masih cukup tampilkan "Aman".',
        example: '=IF(D2<=10, "Pesan Lagi", "Aman")'
      }
    ],
    initialGrid: {
      A1: { value: 'Nama Barang', style: { bold: true, bg: '#ccfbf1' } },
      B1: { value: 'Stok Awal', style: { bold: true, bg: '#ccfbf1', align: 'center' } },
      C1: { value: 'Terjual', style: { bold: true, bg: '#ccfbf1', align: 'center' } },
      D1: { value: 'Sisa Stok', style: { bold: true, bg: '#ccfbf1', align: 'center' } },
      E1: { value: 'Status Gudang', style: { bold: true, bg: '#ccfbf1', align: 'center' } },
      A2: { value: 'Buku Gambar', style: {} },
      B2: { value: '50', style: { align: 'center' } },
      C2: { value: '42', style: { align: 'center' } },
      D2: { value: '', style: { bg: '#fef9c3', align: 'center', bold: true } },
      E2: { value: '', style: { bg: '#fef9c3', align: 'center', bold: true } },
      A3: { value: 'Penghapus 2B', style: {} },
      B3: { value: '100', style: { align: 'center' } },
      C3: { value: '30', style: { align: 'center' } },
      D3: { value: '', style: { bg: '#fef9c3', align: 'center', bold: true } },
      E3: { value: '', style: { bg: '#fef9c3', align: 'center', bold: true } },
      A4: { value: 'Penggaris 30cm', style: {} },
      B4: { value: '40', style: { align: 'center' } },
      C4: { value: '35', style: { align: 'center' } },
      D4: { value: '=B4-C4', style: { align: 'center', bold: true } },
      E4: { value: '=IF(D4<=10,"Pesan Lagi","Aman")', style: { align: 'center', bold: true } },
      A6: { value: 'Total Sisa Seluruh Barang', style: { bold: true } },
      D6: { value: '', style: { bg: '#dcfce7', align: 'center', bold: true } }
    },
    tasks: [
      {
        id: 't17-1',
        instruction: 'Misi 1: Hitung Sisa Stok Buku Gambar di sel D2 dengan rumus pengurangan antara Stok Awal (B2) dan Terjual (C2)! Rumus: =B2-C2',
        type: 'formula_result',
        targetCell: 'D2',
        expectedValue: 8,
        requireFormula: true,
        hint: 'Ketik =B2-C2 pada sel D2 lalu tekan Simpan/Enter.'
      },
      {
        id: 't17-2',
        instruction: 'Misi 2: Tentukan status gudang di sel E2: jika D2<=10 tampilkan "Pesan Lagi", jika tidak tampilkan "Aman"!',
        type: 'formula_result',
        targetCell: 'E2',
        expectedValue: 'Pesan Lagi',
        expectedFunc: 'IF',
        hint: 'Ketik =IF(D2<=10,"Pesan Lagi","Aman") pada sel E2.'
      },
      {
        id: 't17-3',
        instruction: 'Misi 3: Hitung Sisa Stok Penghapus di sel D3 menggunakan rumus =B3-C3!',
        type: 'formula_result',
        targetCell: 'D3',
        expectedValue: 70,
        requireFormula: true,
        hint: 'Ketik =B3-C3 pada sel D3 lalu tekan Simpan/Enter.'
      },
      {
        id: 't17-4',
        instruction: 'Misi 4: Tentukan status gudang Penghapus di sel E3 menggunakan rumus =IF(D3<=10,"Pesan Lagi","Aman")! Hasil: "Aman"',
        type: 'formula_result',
        targetCell: 'E3',
        expectedValue: 'Aman',
        expectedFunc: 'IF',
        hint: 'Ketik =IF(D3<=10,"Pesan Lagi","Aman") pada sel E3.'
      },
      {
        id: 't17-5',
        instruction: 'Misi 5: Hitung Total Sisa Seluruh Barang di sel D6 dengan menjumlahkan rentang D2:D4 menggunakan fungsi SUM!',
        type: 'formula_result',
        targetCell: 'D6',
        expectedValue: 83,
        expectedFunc: 'SUM',
        hint: 'Ketik =SUM(D2:D4) pada sel D6.'
      }
    ]
  },
  // =========================================================================
  // LEVEL 18: KAS KELAS & PEMBUKUAN KEUANGAN
  // =========================================================================
  {
    id: 18,
    title: 'Kas Kelas & Pembukuan Keuangan',
    subtitle: 'Saldo Berjalan, Pemasukan, Pengeluaran & Rekapitulasi Kas',
    icon: 'Wallet',
    badgeName: 'Bendahara Teladan',
    color: 'from-green-600 via-emerald-700 to-teal-800',
    flashcards: [
      {
        id: '18-1',
        term: 'Konsep Saldo Berjalan (Running Balance)',
        visualType: 'cashflow-balance',
        frontQuestion: 'Bagaimana cara bendahara menghitung saldo kas yang terus diperbarui setiap ada transaksi?',
        explanation: 'Saldo berjalan pada baris aktif dihitung dari:\nSaldo Baris Sebelumnya + Pemasukan Baris Ini - Pengeluaran Baris Ini.\nRumus pada baris 3: =D2+B3-C3.',
        example: 'Saldo kemarin Rp 100.000 + masuk Rp 0 - keluar Rp 25.000 = Saldo baru Rp 75.000.'
      },
      {
        id: '18-2',
        term: 'Prinsip Rekonsiliasi Kas',
        visualType: 'cashflow-balance',
        frontQuestion: 'Bagaimana cara membuktikan bahwa hitungan saldo akhir kas kelas sudah benar dan tidak ada selisih?',
        explanation: 'Saldo Kas Akhir WAJIB sama dengan:\nTotal Seluruh Pemasukan dikurangi Total Seluruh Pengeluaran.\nJika Saldo Akhir baris terakhir sama dengan =SUM(Pemasukan) - SUM(Pengeluaran), maka pembukuan terbukti akurat!',
        example: 'Total Pemasukan Rp 150.000 - Total Pengeluaran Rp 25.000 = Saldo Akhir Rp 125.000.'
      }
    ],
    initialGrid: {
      A1: { value: 'Keterangan Transaksi', style: { bold: true, bg: '#d1fae5' } },
      B1: { value: 'Masuk (Rp)', style: { bold: true, bg: '#d1fae5', align: 'right' } },
      C1: { value: 'Keluar (Rp)', style: { bold: true, bg: '#d1fae5', align: 'right' } },
      D1: { value: 'Saldo Kas (Rp)', style: { bold: true, bg: '#d1fae5', align: 'right' } },
      A2: { value: 'Saldo Awal Bulan', style: {} },
      B2: { value: '100000', style: { format: 'currency' } },
      C2: { value: '0', style: { format: 'currency' } },
      D2: { value: '100000', style: { bold: true, format: 'currency' } },
      A3: { value: 'Beli Spidol & Penghapus', style: {} },
      B3: { value: '0', style: { format: 'currency' } },
      C3: { value: '25000', style: { format: 'currency' } },
      D3: { value: '', style: { bg: '#fef9c3', format: 'currency', bold: true } },
      A4: { value: 'Iuran Kas Mingguan', style: {} },
      B4: { value: '50000', style: { format: 'currency' } },
      C4: { value: '0', style: { format: 'currency' } },
      D4: { value: '', style: { bg: '#fef9c3', format: 'currency', bold: true } },
      A6: { value: 'TOTAL REKAP', style: { bold: true } },
      B6: { value: '', style: { bg: '#dcfce7', bold: true, format: 'currency' } },
      C6: { value: '', style: { bg: '#fee2e2', bold: true, format: 'currency' } },
      D6: { value: '', style: { bg: '#bbf7d0', bold: true, format: 'currency' } }
    },
    tasks: [
      {
        id: 't18-1',
        instruction: 'Misi 1: Hitung Saldo Berjalan di sel D3 (Transaksi 2): Saldo sebelumnya (D2) + Masuk (B3) - Keluar (C3) menggunakan rumus =D2+B3-C3!',
        type: 'formula_result',
        targetCell: 'D3',
        expectedValue: 75000,
        requireFormula: true,
        hint: 'Ketik =D2+B3-C3 pada sel D3 lalu tekan Simpan/Enter.'
      },
      {
        id: 't18-2',
        instruction: 'Misi 2: Hitung Saldo Berjalan di sel D4 (Transaksi 3): Saldo sebelumnya (D3) + Masuk (B4) - Keluar (C4) menggunakan rumus =D3+B4-C4!',
        type: 'formula_result',
        targetCell: 'D4',
        expectedValue: 125000,
        requireFormula: true,
        hint: 'Ketik =D3+B4-C4 pada sel D4 lalu tekan Simpan/Enter.'
      },
      {
        id: 't18-3',
        instruction: 'Misi 3: Hitung Total Seluruh Uang Masuk pada sel B6 dengan fungsi SUM untuk rentang B2:B4!',
        type: 'formula_result',
        targetCell: 'B6',
        expectedValue: 150000,
        expectedFunc: 'SUM',
        hint: 'Ketik =SUM(B2:B4) pada sel B6.'
      },
      {
        id: 't18-4',
        instruction: 'Misi 4: Hitung Total Seluruh Uang Keluar pada sel C6 dengan fungsi SUM untuk rentang C2:C4!',
        type: 'formula_result',
        targetCell: 'C6',
        expectedValue: 25000,
        expectedFunc: 'SUM',
        hint: 'Ketik =SUM(C2:C4) pada sel C6.'
      },
      {
        id: 't18-5',
        instruction: 'Misi 5: Hitung Saldo Kas Akhir di sel D6 dengan rumus =B6-C6 (Total Masuk dikurangi Total Keluar)!',
        type: 'formula_result',
        targetCell: 'D6',
        expectedValue: 125000,
        requireFormula: true,
        hint: 'Ketik =B6-C6 pada sel D6.'
      }
    ]
  },
  // =========================================================================
  // LEVEL 19: TREN PENJUALAN & DASHBOARD VISUAL
  // =========================================================================
  {
    id: 19,
    title: 'Tren Penjualan & Dashboard Visual',
    subtitle: 'Membuat Diagram Garis (Line Chart), Analisis Pertumbuhan & Tren',
    icon: 'TrendingUp',
    badgeName: 'Analis Bisnis Visual',
    color: 'from-fuchsia-600 via-pink-600 to-rose-600',
    flashcards: [
      {
        id: '19-1',
        term: 'Analisis Tren dengan Diagram Garis (Line Chart)',
        visualType: 'trend-line-chart',
        frontQuestion: 'Kapan Diagram Garis (Line Chart) paling tepat digunakan dibandingkan diagram batang?',
        explanation: 'Diagram Garis dirancang khusus untuk memperlihatkan perubahan data secara berurutan dari waktu ke waktu (time series), seperti omset bulanan, grafik suhu, atau tren nilai rapor siswa.',
        example: 'Grafik omset dari Januari sampai April memperlihatkan garis yang menanjak saat bisnis berkembang.'
      },
      {
        id: '19-2',
        term: 'Menghitung Selisih Pertumbuhan Bulanan',
        visualType: 'trend-line-chart',
        frontQuestion: 'Bagaimana rumus menghitung peningkatan omset penjualan dari bulan sebelumnya?',
        explanation: 'Pertumbuhan = Nilai Bulan Berjalan - Nilai Bulan Sebelumnya.\nContoh untuk Februari dibanding Januari: =B3-B2.',
        example: 'Jika Januari 500.000 dan Februari 650.000, maka pertumbuhan = =B3-B2 menghasilkan 150.000.'
      }
    ],
    initialGrid: {
      A1: { value: 'Bulan', style: { bold: true, bg: '#fce7f3' } },
      B1: { value: 'Omset Koperasi (Rp)', style: { bold: true, bg: '#fce7f3', align: 'right' } },
      C1: { value: 'Pertumbuhan (Rp)', style: { bold: true, bg: '#fce7f3', align: 'right' } },
      A2: { value: 'Januari', style: {} },
      B2: { value: '500000', style: { format: 'currency' } },
      C2: { value: '-', style: { align: 'center' } },
      A3: { value: 'Februari', style: {} },
      B3: { value: '650000', style: { format: 'currency' } },
      C3: { value: '', style: { bg: '#fef9c3', format: 'currency' } },
      A4: { value: 'Maret', style: {} },
      B4: { value: '800000', style: { format: 'currency' } },
      C4: { value: '', style: { bg: '#fef9c3', format: 'currency' } },
      A5: { value: 'April', style: {} },
      B5: { value: '750000', style: { format: 'currency' } },
      C5: { value: '=B5-B4', style: { format: 'currency' } },
      A7: { value: 'Rekor Omset Tertinggi (MAX)', style: { bold: true } },
      B7: { value: '', style: { bg: '#dcfce7', bold: true, format: 'currency' } },
      A8: { value: 'Rata-rata Omset Bulanan (AVERAGE)', style: { bold: true } },
      B8: { value: '', style: { bg: '#dcfce7', bold: true, format: 'currency' } }
    },
    tasks: [
      {
        id: 't19-1',
        instruction: 'Misi 1: Buka menu "📊 Buat Grafik" pada Ribbon di atas dan pilih jenis Diagram Garis (Line Chart)!',
        type: 'create_chart',
        chartType: 'line',
        hint: 'Klik tombol "📊 Buat Grafik" pada bilah Ribbon lalu pilih Diagram Garis (Line).'
      },
      {
        id: 't19-2',
        instruction: 'Misi 2: Hitung pertumbuhan omset bulan Februari di sel C3 dengan mengurangkan Omset Februari (B3) dengan Januari (B2)! Rumus: =B3-B2',
        type: 'formula_result',
        targetCell: 'C3',
        expectedValue: 150000,
        requireFormula: true,
        hint: 'Ketik =B3-B2 pada sel C3 lalu tekan Simpan/Enter.'
      },
      {
        id: 't19-3',
        instruction: 'Misi 3: Hitung pertumbuhan omset bulan Maret di sel C4 dengan rumus =B4-B3!',
        type: 'formula_result',
        targetCell: 'C4',
        expectedValue: 150000,
        requireFormula: true,
        hint: 'Ketik =B4-B3 pada sel C4 lalu tekan Simpan/Enter.'
      },
      {
        id: 't19-4',
        instruction: 'Misi 4: Temukan Rekor Omset Tertinggi di sel B7 menggunakan fungsi MAX untuk rentang B2:B5!',
        type: 'formula_result',
        targetCell: 'B7',
        expectedValue: 800000,
        expectedFunc: 'MAX',
        hint: 'Ketik =MAX(B2:B5) pada sel B7.'
      },
      {
        id: 't19-5',
        instruction: 'Misi 5: Hitung Rata-rata Omset Bulanan di sel B8 menggunakan fungsi AVERAGE untuk rentang B2:B5!',
        type: 'formula_result',
        targetCell: 'B8',
        expectedValue: 675000,
        expectedFunc: 'AVERAGE',
        hint: 'Ketik =AVERAGE(B2:B5) pada sel B8.'
      }
    ]
  },
  // =========================================================================
  // LEVEL 20: GRAND FINAL: DIREKTUR DATA SEKOLAH
  // =========================================================================
  {
    id: 20,
    title: 'Grand Final: Direktur Data Sekolah',
    subtitle: 'Misi Puncak Penutup: VLOOKUP, Logika IF, Statistik & Pelaporan Lengkap',
    icon: 'Crown',
    badgeName: 'Legenda Spreadsheet',
    color: 'from-amber-500 via-rose-600 to-purple-800',
    flashcards: [
      {
        id: '20-1',
        term: 'Misi Puncak: Gelar Legenda Spreadsheet',
        visualType: 'master-capstone',
        frontQuestion: 'Apa saja kompetensi terpadu yang diuji pada Level 20 pamungkas ini?',
        explanation: 'Sebagai Direktur Data Sekolah, kamu akan menggabungkan:\n1. VLOOKUP untuk melengkapi nama siswa dari database NIS\n2. AVERAGE untuk rata-rata nilai ujian\n3. Logika IF untuk menentukan status kelulusan\n4. COUNTIF untuk merekap jumlah siswa lulus.',
        example: 'Selesaikan seluruh misi puncak ini untuk menyelesaikan seluruh 20 Level petualangan Excel Adventure!'
      },
      {
        id: '20-2',
        term: 'Kesiapan Uji Sertifikasi Spreadsheet',
        visualType: 'master-capstone',
        frontQuestion: 'Apa manfaat menguasai seluruh 20 level Excel Adventure ini bagi masa depanmu?',
        explanation: 'Keterampilan spreadsheet tabel, rumus matematika, logika kondisi, pengurutan, filter data, dan visualisasi grafik adalah keterampilan digital nomor 1 di seluruh dunia pendidikan dan industri modern.',
        example: 'Raih 3 Bintang di Level 20 dan buktikan kamu adalah Master Spreadsheet sejati!'
      }
    ],
    initialGrid: {
      A1: { value: 'NIS', style: { bold: true, bg: '#fef3c7', align: 'center' } },
      B1: { value: 'Nama Siswa', style: { bold: true, bg: '#fef3c7' } },
      C1: { value: 'Nilai Ujian', style: { bold: true, bg: '#fef3c7', align: 'center' } },
      D1: { value: 'Status (KKM 75)', style: { bold: true, bg: '#fef3c7', align: 'center' } },
      A2: { value: '201', style: { align: 'center' } },
      B2: { value: '', style: { bg: '#fffbeb' } },
      C2: { value: '85', style: { align: 'center' } },
      D2: { value: '', style: { bg: '#fffbeb', align: 'center' } },
      A3: { value: '202', style: { align: 'center' } },
      B3: { value: '', style: { bg: '#fffbeb' } },
      C3: { value: '70', style: { align: 'center' } },
      D3: { value: '', style: { bg: '#fffbeb', align: 'center' } },
      A4: { value: '203', style: { align: 'center' } },
      B4: { value: '=VLOOKUP(A4,A8:B10,2)', style: {} },
      C4: { value: '85', style: { align: 'center' } },
      D4: { value: '=IF(C4>=75,"Lulus","Remedial")', style: { align: 'center' } },
      A6: { value: 'Jumlah Siswa Lulus (COUNTIF)', style: { bold: true } },
      D6: { value: '', style: { bg: '#dcfce7', align: 'center', bold: true } },
      A7: { value: 'Rata-rata Nilai Kelas (AVERAGE)', style: { bold: true } },
      C7: { value: '', style: { bg: '#e0f2fe', align: 'center', bold: true } },
      A8: { value: '201', style: { align: 'center' } },
      B8: { value: 'Alif Pratama', style: {} },
      A9: { value: '202', style: { align: 'center' } },
      B9: { value: 'Binar Mentari', style: {} },
      A10: { value: '203', style: { align: 'center' } },
      B10: { value: 'Calista Putri', style: {} }
    },
    tasks: [
      {
        id: 't20-1',
        instruction: 'Tugas 1: Panggil nama siswa untuk NIS 201 di sel B2 menggunakan rumus VLOOKUP dari tabel master A8:B10! Rumus: =VLOOKUP(A2, A8:B10, 2)',
        type: 'formula_result',
        targetCell: 'B2',
        expectedValue: 'Alif Pratama',
        expectedFunc: 'VLOOKUP',
        hint: 'Ketik =VLOOKUP(A2, A8:B10, 2) pada sel B2 lalu tekan Simpan/Enter.'
      },
      {
        id: 't20-2',
        instruction: 'Tugas 2: Panggil nama siswa untuk NIS 202 di sel B3 menggunakan rumus =VLOOKUP(A3, A8:B10, 2)!',
        type: 'formula_result',
        targetCell: 'B3',
        expectedValue: 'Binar Mentari',
        expectedFunc: 'VLOOKUP',
        hint: 'Ketik =VLOOKUP(A3, A8:B10, 2) pada sel B3.'
      },
      {
        id: 't20-3',
        instruction: 'Tugas 3: Tentukan status kelulusan Alif di sel D2 dengan rumus IF: jika nilai C2>=75 maka "Lulus", jika tidak "Remedial"!',
        type: 'formula_result',
        targetCell: 'D2',
        expectedValue: 'Lulus',
        expectedFunc: 'IF',
        hint: 'Ketik =IF(C2>=75,"Lulus","Remedial") pada sel D2.'
      },
      {
        id: 't20-4',
        instruction: 'Tugas 4: Tentukan status kelulusan Binar di sel D3 dengan rumus IF: jika nilai C3>=75 maka "Lulus", jika tidak "Remedial"!',
        type: 'formula_result',
        targetCell: 'D3',
        expectedValue: 'Remedial',
        expectedFunc: 'IF',
        hint: 'Ketik =IF(C3>=75,"Lulus","Remedial") pada sel D3.'
      },
      {
        id: 't20-5',
        instruction: 'Tugas 5: Hitung berapa siswa yang Lulus di rentang D2:D4 pada sel D6 menggunakan fungsi COUNTIF!',
        type: 'formula_result',
        targetCell: 'D6',
        expectedValue: 2,
        expectedFunc: 'COUNTIF',
        hint: 'Ketik =COUNTIF(D2:D4, "Lulus") pada sel D6.'
      },
      {
        id: 't20-6',
        instruction: 'Tugas 6: Hitung Rata-Rata nilai kelas untuk rentang C2:C4 pada sel C7 menggunakan fungsi AVERAGE!',
        type: 'formula_result',
        targetCell: 'C7',
        expectedValue: 80,
        expectedFunc: 'AVERAGE',
        hint: 'Ketik =AVERAGE(C2:C4) pada sel C7.'
      }
    ]
  }
];
