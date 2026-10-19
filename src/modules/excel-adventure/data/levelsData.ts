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
  }
];
