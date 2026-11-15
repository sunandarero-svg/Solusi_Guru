import { ExcelQuestion } from '../types';

export const EXCEL_QUESTIONS: ExcelQuestion[] = [
  // ============================================================
  // LEVEL 1: EXCEL BEGINNER (10 SOAL: 1 - 10)
  // Tema: Pengenalan Microsoft Excel
  // ============================================================
  {
    id: 1,
    level: 1,
    questionNumberInLevel: 1,
    theme: 'Pengertian Microsoft Excel',
    question: 'Apakah pengertian dan fungsi utama dari Microsoft Excel?',
    options: {
      A: 'Program pengolah kata untuk menyusun surat dan dokumen teks resmi',
      B: 'Program pengolah lembar kerja (spreadsheet) untuk mengolah, menghitung, dan menyajikan data angka',
      C: 'Aplikasi peramban web untuk menjelajahi situs internet',
      D: 'Perangkat lunak editor video dan pembuatan animasi 3 dimensi'
    },
    correctAnswer: 'B',
    hint: 'Pikirkan jenis data utama yang sering dimasukkan ke dalam baris dan kolom berpetak.',
    explanation:
      'Microsoft Excel adalah program aplikasi spreadsheet (lembar kerja elektronik) yang khusus digunakan untuk mengolah data berupa angka, melakukan perhitungan matematis, dan menyajikan data dalam bentuk tabel maupun grafik.'
  },
  {
    id: 2,
    level: 1,
    questionNumberInLevel: 2,
    theme: 'Fungsi Microsoft Excel',
    question: 'Di antara pilihan berikut, manakah tugas yang PALING TEPAT diselesaikan dengan Microsoft Excel?',
    options: {
      A: 'Membuat rekapitulasi anggaran belanja bulanan beserta rumus perhitungan total otomatis',
      B: 'Menulis naskah novel cerita fiksi 300 halaman',
      C: 'Mengedit foto profil agar latar belakangnya menjadi transparan',
      D: 'Memutar rekaman musik format MP3 secara berulang'
    },
    correctAnswer: 'A',
    hint: 'Excel paling unggul dalam menangani angka, anggaran, tabel, dan perhitungan otomatis.',
    explanation:
      'Rekapitulasi anggaran belanja melibatkan angka, operasi penambahan, pengurangan, dan kalkulasi otomatis, yang merupakan fungsi inti dari Microsoft Excel.'
  },
  {
    id: 3,
    level: 1,
    questionNumberInLevel: 3,
    theme: 'Kegunaan dalam Kehidupan Sehari-hari',
    question: 'Seorang bendahara OSIS ingin mencatat uang kas masuk dan keluar setiap minggu. Mengapa ia sebaiknya menggunakan Microsoft Excel dibandingkan mencatat manual di buku kertas?',
    options: {
      A: 'Karena buku kertas tidak bisa ditulisi menggunakan pulpen warna hitam',
      B: 'Karena Excel dapat menghitung saldo akhir otomatis dengan rumus, mudah dikoreksi, dan datanya aman tersimpan rapi',
      C: 'Karena Excel hanya bisa digunakan saat ada jaringan internet di sekolah',
      D: 'Karena Excel secara otomatis mencetak uang kas ke dalam bentuk fisik'
    },
    correctAnswer: 'B',
    hint: 'Excel mencegah kesalahan hitung manual berulang-ulang melalui formula otomatis.',
    explanation:
      'Menggunakan Excel membuat pencatatan kas lebih akurat, saldo otomatis diperbarui ketika ada angka baru yang dimasukkan, dan data dapat disimpan atau dicadangkan secara digital.'
  },
  {
    id: 4,
    level: 1,
    questionNumberInLevel: 4,
    theme: 'Jenis Data dalam Excel',
    question: 'Ketika Anda mengetik kata "Sekolah" pada sel A1 dan angka "2026" pada sel B1 tanpa mengubah format perataan (alignment), bagaimanakah posisi default kedua data tersebut di dalam sel?',
    miniTable: {
      headers: ['A', 'B'],
      rows: [['Sekolah', 2026]]
    },
    options: {
      A: 'Teks rata kiri, sedangkan angka rata kanan',
      B: 'Teks rata kanan, sedangkan angka rata kiri',
      C: 'Keduanya otomatis berada di posisi tengah (center)',
      D: 'Keduanya otomatis rata atas tanpa spasi'
    },
    correctAnswer: 'A',
    hint: 'Secara bawaan, Excel membedakan tipe data teks (label) dan tipe data angka (nilai) melalui posisinya di dalam sel.',
    explanation:
      'Secara default di Microsoft Excel, data bertipe teks (label) akan selalu rata kiri (left align), sedangkan data bertipe angka (numerik/value) akan selalu rata kanan (right align).'
  },
  {
    id: 5,
    level: 1,
    questionNumberInLevel: 5,
    theme: 'Perbedaan Workbook dan Worksheet',
    question: 'Apakah perbedaan mendasar antara "Workbook" dan "Worksheet" pada Microsoft Excel?',
    options: {
      A: 'Workbook adalah lembar kerja tunggal, sedangkan Worksheet adalah kumpulan seluruh file di komputer',
      B: 'Workbook adalah file keseluruhan (buku kerja), sedangkan Worksheet adalah satu lembar kerja di dalam Workbook tersebut',
      C: 'Workbook hanya berisi gambar, sedangkan Worksheet hanya berisi rumus matematika',
      D: 'Tidak ada perbedaan, keduanya adalah istilah yang sama persis'
    },
    correctAnswer: 'B',
    hint: 'Ibaratkan Workbook sebagai buku tulis fisik, dan Worksheet sebagai lembar-lembar halaman di dalam buku tersebut.',
    explanation:
      'Workbook adalah file dokumen Excel secara keseluruhan (biasanya bereksistensi .xlsx). Di dalam satu Workbook dapat terdapat satu atau banyak Worksheet (lembar kerja seperti Sheet1, Sheet2, dst).'
  },
  {
    id: 6,
    level: 1,
    questionNumberInLevel: 6,
    theme: 'Format File Excel',
    question: 'Format ekstensi file standar yang digunakan saat menyimpan lembar kerja pada Microsoft Excel versi modern (2007 hingga 2021/365) adalah...',
    options: {
      A: '.docx',
      B: '.pptx',
      C: '.xlsx',
      D: '.mp4'
    },
    correctAnswer: 'C',
    hint: 'Huruf "x" di akhir melambangkan format OpenXML spreadsheet modern.',
    explanation:
      'Ekstensi file standar untuk Microsoft Excel modern adalah .xlsx. Sedangkan .docx adalah untuk Microsoft Word, dan .pptx untuk Microsoft PowerPoint.'
  },
  {
    id: 7,
    level: 1,
    questionNumberInLevel: 7,
    theme: 'Penerapan Excel dalam Pendidikan',
    question: 'Pak Guru Budi memiliki data nilai ulangan dari 36 siswa. Ia ingin mencari nilai rata-rata kelas dan nilai tertinggi dalam waktu singkat. Fitur apakah yang paling membantu Pak Budi?',
    options: {
      A: 'Menggunakan rumus fungsi statistik seperti AVERAGE dan MAX di Excel',
      B: 'Mengetik ulang seluruh nama siswa di aplikasi pengolah grafis',
      C: 'Menghitung satu per satu menggunakan coretan tangan di papan tulis',
      D: 'Menghapus siswa yang nilainya di bawah KKM'
    },
    correctAnswer: 'A',
    hint: 'Excel menyediakan fungsi built-in untuk kalkulasi rata-rata dan pencarian nilai maksimum.',
    explanation:
      'Fungsi AVERAGE digunakan untuk menghitung rata-rata dan MAX digunakan untuk mencari nilai tertinggi secara instan dari puluhan data siswa.'
  },
  {
    id: 8,
    level: 1,
    questionNumberInLevel: 8,
    theme: 'Shortcut Dasar Excel',
    question: 'Kombinasi tombol keyboard (shortcut) standar untuk menyimpan perubahan pada lembar kerja Excel yang sedang aktif adalah...',
    options: {
      A: 'Ctrl + P',
      B: 'Ctrl + S',
      C: 'Ctrl + C',
      D: 'Ctrl + Z'
    },
    correctAnswer: 'B',
    hint: 'Huruf "S" berasal dari kata bahasa Inggris "Save" yang berarti menyimpan.',
    explanation:
      'Kombinasi Ctrl + S digunakan untuk menyimpan (Save) dokumen. Ctrl + P untuk Print (mencetak), Ctrl + C untuk Copy (menyalin), dan Ctrl + Z untuk Undo (membatalkan aksi terakhir).'
  },
  {
    id: 9,
    level: 1,
    questionNumberInLevel: 9,
    theme: 'Konsep Kisi-kisi Grid',
    question: 'Tampilan lembar kerja Microsoft Excel tersusun atas kotak-kotak kecil yang terbentuk dari perpotongan garis horizontal dan vertikal. Struktur ini dinamakan...',
    options: {
      A: 'Canvas Lukis',
      B: 'Grid / Kisi-kisi Baris dan Kolom',
      C: 'Slide Presentasi',
      D: 'Halaman Paragraf Teks'
    },
    correctAnswer: 'B',
    hint: 'Struktur ini membagi lembar kerja menjadi ribuan kotak kecil untuk meletakkan data angka.',
    explanation:
      'Lembar kerja Excel menggunakan sistem grid (kisi-kisi) yang tersusun atas baris mendatar (rows) dan kolom menurun (columns).'
  },
  {
    id: 10,
    level: 1,
    questionNumberInLevel: 10,
    theme: 'Mengenal Format CSV',
    question: 'Selain format .xlsx, Excel juga sering membuka file berformat .csv. Apakah kepanjangan dari singkatan CSV tersebut?',
    options: {
      A: 'Computer System Visual',
      B: 'Comma Separated Values',
      C: 'Central Sheet Version',
      D: 'Calculate Super Variable'
    },
    correctAnswer: 'B',
    hint: 'Format teks sederhana ini memisahkan data antarkolom menggunakan tanda koma atau titik koma.',
    explanation:
      'CSV adalah singkatan dari Comma Separated Values, yaitu format teks biasa yang menyimpan data tabular di mana setiap nilai data dipisahkan oleh tanda koma.'
  },

  // ============================================================
  // LEVEL 2: EXCEL EXPLORER (10 SOAL: 11 - 20)
  // Tema: Bagian-bagian dan Fungsi pada Excel
  // ============================================================
  {
    id: 11,
    level: 2,
    questionNumberInLevel: 1,
    theme: 'Ribbon',
    question: 'Bagian area di bagian atas jendela Excel yang memuat berbagai tab menu seperti Home, Insert, Page Layout, dan Formulas beserta grup tombol perintahnya disebut...',
    options: {
      A: 'Status Bar',
      B: 'Ribbon',
      C: 'Task Manager',
      D: 'Scroll Bar'
    },
    correctAnswer: 'B',
    hint: 'Pita menu utama yang mengelompokkan tombol alat berdasarkan fungsinya.',
    explanation:
      'Ribbon adalah area bilah menu di bagian atas Excel yang mengorganisir tombol-tombol perintah ke dalam tab-tab tematik (Home, Insert, Page Layout, Formulas, Data, Review, View).'
  },
  {
    id: 12,
    level: 2,
    questionNumberInLevel: 2,
    theme: 'Quick Access Toolbar',
    question: 'Di pojok kiri atas jendela Excel terdapat deretan ikon kecil seperti Save (disket), Undo, dan Redo. Bagian ini dinamakan...',
    options: {
      A: 'Formula Bar',
      B: 'Quick Access Toolbar',
      C: 'Sheet Tab',
      D: 'Name Box'
    },
    correctAnswer: 'B',
    hint: 'Bilah alat akses cepat yang letaknya dapat diubah dan tombolnya dapat dikustomisasi.',
    explanation:
      'Quick Access Toolbar (QAT) dirancang untuk memberikan akses cepat satu kali klik ke perintah-perintah yang paling sering digunakan, seperti Save, Undo, dan Redo.'
  },
  {
    id: 13,
    level: 2,
    questionNumberInLevel: 3,
    theme: 'Formula Bar',
    question: 'Perhatikan gambar antarmuka Excel. Bilah panjang yang terletak di sebelah kanan simbol "fx" yang berfungsi untuk menampilkan isi sel atau mengetikkan rumus secara leluasa disebut...',
    miniTable: {
      headers: ['Name Box', 'fx', 'Bilah Panjang Tempat Menulis Rumus'],
      rows: [['B4', 'fx', '=SUM(A1:A5)']]
    },
    options: {
      A: 'Formula Bar',
      B: 'Title Bar',
      C: 'Status Bar',
      D: 'Navigation Bar'
    },
    correctAnswer: 'A',
    hint: 'Nama bilah ini sesuai dengan kata bahasa Inggris untuk "rumus".',
    explanation:
      'Formula Bar adalah bilah tempat pengguna dapat melihat, memasukkan, atau menyunting rumus matematika maupun isi teks dari sel yang sedang dipilih.'
  },
  {
    id: 14,
    level: 2,
    questionNumberInLevel: 4,
    theme: 'Name Box',
    question: 'Kotak kecil yang terletak di sebelah kiri Formula Bar yang menampilkan alamat sel yang sedang aktif (misalnya tertulis "C5") disebut...',
    options: {
      A: 'Ribbon Box',
      B: 'Name Box (Kotak Nama)',
      C: 'Search Box',
      D: 'Toolbox'
    },
    correctAnswer: 'B',
    hint: 'Kotak ini bertugas memberi nama atau menunjukkan koordinat sel aktif.',
    explanation:
      'Name Box berfungsi menampilkan alamat koordinat sel aktif (misal A1, C5), dan juga dapat digunakan untuk memberi nama rentang sel (named range).'
  },
  {
    id: 15,
    level: 2,
    questionNumberInLevel: 5,
    theme: 'Row dan Column',
    question: 'Dalam penamaan koordinat di Microsoft Excel, manakah pernyataan berikut yang BENAR mengenai Baris (Row) dan Kolom (Column)?',
    options: {
      A: 'Kolom berjajar mendatar dengan angka, sedangkan Baris menurun dengan huruf',
      B: 'Kolom membentang vertikal (tegak) ditandai dengan huruf (A, B, C...), sedangkan Baris membentang horizontal (mendatar) ditandai dengan angka (1, 2, 3...)',
      C: 'Baris dan Kolom sama-sama diberi tanda menggunakan simbol matematika',
      D: 'Kolom tidak memiliki nama dan hanya diberi warna warni'
    },
    correctAnswer: 'B',
    hint: 'Ingat tiang kolom bangunan itu berdiri tegak (vertikal), sedangkan barisan siswa berbaris mendatar (horizontal).',
    explanation:
      'Kolom (Column) membentang secara vertikal dan diberi label huruf (A, B, C, ... XFD), sedangkan Baris (Row) membentang secara horizontal dan diberi label angka (1, 2, 3, ... 1048576).'
  },
  {
    id: 16,
    level: 2,
    questionNumberInLevel: 6,
    theme: 'Cell dan Alamat Sel',
    question: 'Jika kursor Anda berada pada pertemuan kolom D dan baris ke-8, maka nama alamat sel yang terbentuk adalah...',
    options: {
      A: '8D',
      B: 'D8',
      C: 'D+8',
      D: 'Cell-8'
    },
    correctAnswer: 'B',
    hint: 'Aturan penamaan sel di Excel selalu menuliskan huruf kolom terlebih dahulu, baru diikuti nomor baris.',
    explanation:
      'Alamat sel di Excel selalu diawali dengan huruf kolom kemudian nomor baris. Pertemuan kolom D dan baris 8 dinamakan sel D8.'
  },
  {
    id: 17,
    level: 2,
    questionNumberInLevel: 7,
    theme: 'Konsep Range',
    question: 'Sekumpulan sel yang dipilih bersama-sama dari sel B2 sampai sel E5 dituliskan dalam notasi Excel sebagai...',
    miniTable: {
      headers: ['A', 'B', 'C', 'D', 'E'],
      rows: [
        ['1', '-', '-', '-', '-'],
        ['2', '-', '[B2]', '[C2]', '[D2]', '[E2]'],
        ['3', '-', '[B3]', '[C3]', '[D3]', '[E3]'],
        ['4', '-', '[B4]', '[C4]', '[D4]', '[E4]'],
        ['5', '-', '[B5]', '[C5]', '[D5]', '[E5]']
      ]
    },
    options: {
      A: 'B2 - E5',
      B: 'B2:E5',
      C: 'B2 s/d E5',
      D: 'B2+E5'
    },
    correctAnswer: 'B',
    hint: 'Di Excel, tanda pemisah rentang sel adalah tanda titik dua (:).',
    explanation:
      'Notasi Range di Excel menggunakan tanda titik dua (:). Jadi rentang sel dari B2 hingga E5 ditulis B2:E5.'
  },
  {
    id: 18,
    level: 2,
    questionNumberInLevel: 8,
    theme: 'Sheet Tab',
    question: 'Di bagian kiri bawah area lembar kerja terdapat tulisan "Sheet1", "Sheet2", serta tombol bertanda tambah (+). Bagian ini disebut...',
    options: {
      A: 'Sheet Tab',
      B: 'Ribbon Tab',
      C: 'Title Tab',
      D: 'File Tab'
    },
    correctAnswer: 'A',
    hint: 'Bagian ini digunakan untuk berpindah antar lembar kerja atau menambahkan lembar kerja baru.',
    explanation:
      'Sheet Tab terletak di bagian bawah jendela Excel, berfungsi untuk beralih antar lembar kerja, mengganti nama sheet (rename), memberi warna tab, serta menambah sheet baru melalui tombol (+).'
  },
  {
    id: 19,
    level: 2,
    questionNumberInLevel: 9,
    theme: 'Status Bar',
    question: 'Ketika Anda menyorot beberapa sel berisi angka di Excel, di bagian bilah paling bawah jendela layar akan muncul informasi otomatis seperti Average (rata-rata), Count (jumlah data), dan Sum (total penjumlahan). Bilah ini dinamakan...',
    options: {
      A: 'Status Bar',
      B: 'Formula Bar',
      C: 'Menu Bar',
      D: 'Address Bar'
    },
    correctAnswer: 'A',
    hint: 'Bilah ini menampilkan status kerja dan ringkasan kalkulasi cepat data yang sedang disorot.',
    explanation:
      'Status Bar terletak di bagian paling bawah antarmuka Excel. Selain menampilkan status kesiapan aplikasi dan pengatur Zoom/Tampilan, Status Bar secara otomatis menghitung Sum, Average, dan Count dari sel yang sedang diseleksi.'
  },
  {
    id: 20,
    level: 2,
    questionNumberInLevel: 10,
    theme: 'Tombol Select All',
    question: 'Di manakah posisi tombol kecil berbentuk segitiga abu-abu yang dapat diklik satu kali untuk memilih (menyorot) SELURUH sel yang ada di lembar kerja?',
    options: {
      A: 'Di tengah-tengah Formula Bar',
      B: 'Di sudut kiri atas persimpangan antara kepala kolom A dan kepala baris 1',
      C: 'Di pojok kanan bawah dekat pengatur Zoom',
      D: 'Di dalam menu File cetak dokumen'
    },
    correctAnswer: 'B',
    hint: 'Posisinya berada tepat di atas angka 1 dan di sebelah kiri huruf A.',
    explanation:
      'Tombol Select All terletak di sudut kiri atas persimpangan kepala baris 1 dan kepala kolom A. Mengekliknya akan menyorot seluruh sel dalam worksheet sekaligus (sama fungsinya dengan Ctrl + A).'
  },

  // ============================================================
  // LEVEL 3: FORMULA MASTER (10 SOAL: 21 - 30)
  // Tema: Rumus Dasar Pengolahan Data
  // ============================================================
  {
    id: 21,
    level: 3,
    questionNumberInLevel: 1,
    theme: 'Tanda Awal Rumus',
    question: 'Apakah karakter pertama yang WAJIB diketikkan di dalam sel Excel agar Excel mengenali bahwa yang Anda tuliskan adalah rumus perhitungan dan bukan teks biasa?',
    options: {
      A: 'Tanda sama dengan ( = )',
      B: 'Tanda pagar ( # )',
      C: 'Tanda tanya ( ? )',
      D: 'Tanda seru ( ! )'
    },
    correctAnswer: 'A',
    hint: 'Tanpa tanda ini di awal, teks 10+5 hanya akan tampil sebagai teks biasa "10+5", bukan hasil hitung 15.',
    explanation:
      'Setiap rumus atau formula di Excel WAJIB diawali dengan tanda sama dengan (=). Tanda ini memberi instruksi kepada mesin Excel untuk mengevaluasi perhitungan matematika.'
  },
  {
    id: 22,
    level: 3,
    questionNumberInLevel: 2,
    theme: 'Fungsi SUM',
    question: 'Diberikan data nilai tabungan siswa pada sel C2 sampai C6. Rumus manakah yang benar untuk menghitung JUMLAH TOTAL seluruh tabungan tersebut?',
    miniTable: {
      headers: ['Baris', 'C (Tabungan)'],
      rows: [
        ['2', '10.000'],
        ['3', '15.000'],
        ['4', '20.000'],
        ['5', '25.000'],
        ['6', '30.000']
      ]
    },
    options: {
      A: '=TOTAL(C2:C6)',
      B: '=SUM(C2:C6)',
      C: '=SUM(C2+C6)',
      D: '=JUMLAH(C2..C6)'
    },
    correctAnswer: 'B',
    hint: 'Kata "SUM" berasal dari istilah matematika Summary/Summation untuk menjumlahkan sekumpulan data.',
    explanation:
      'Fungsi SUM digunakan untuk menjumlahkan sekumpulan data dalam rentang tertentu. Sintaks yang benar adalah =SUM(C2:C6).'
  },
  {
    id: 23,
    level: 3,
    questionNumberInLevel: 3,
    theme: 'Fungsi AVERAGE',
    question: 'Seorang guru ingin menghitung nilai rata-rata ulangan harian siswa yang tersimpan pada sel D1 sampai D10. Rumus fungsi yang harus digunakan adalah...',
    options: {
      A: '=MEAN(D1:D10)',
      B: '=RATARATA(D1:D10)',
      C: '=AVERAGE(D1:D10)',
      D: '=COUNT(D1:D10)'
    },
    correctAnswer: 'C',
    hint: 'Istilah baku bahasa Inggris untuk nilai rata-rata hitung pada software spreadsheet.',
    explanation:
      'Fungsi AVERAGE di Excel digunakan khusus untuk menghitung rata-rata aritmetika dari suatu rentang sel numerik, yaitu =AVERAGE(D1:D10).'
  },
  {
    id: 24,
    level: 3,
    questionNumberInLevel: 4,
    theme: 'Fungsi MAX',
    question: 'Perhatikan data skor turnamen game berikut. Sel B2 bernilai 70, B3 bernilai 95, B4 bernilai 82, dan B5 bernilai 88. Hasil dari rumus =MAX(B2:B5) adalah...',
    miniTable: {
      headers: ['Siswa', 'B (Skor)'],
      rows: [
        ['Asep', 70],
        ['Beni', 95],
        ['Citra', 82],
        ['Doni', 88]
      ]
    },
    options: {
      A: '70',
      B: '82',
      C: '95',
      D: '335'
    },
    correctAnswer: 'C',
    hint: 'Fungsi MAX mencari angka yang paling tinggi / paling besar.',
    explanation:
      'Fungsi MAX mencari nilai tertinggi dalam rentang data yang dipilih. Di antara angka 70, 95, 82, dan 88, nilai tertingginya adalah 95 (skor Beni).'
  },
  {
    id: 25,
    level: 3,
    questionNumberInLevel: 5,
    theme: 'Fungsi MIN',
    question: 'Dari rentang data nilai pada soal sebelumnya (70, 95, 82, 88), hasil dari penulisan rumus =MIN(B2:B5) adalah...',
    options: {
      A: '70',
      B: '95',
      C: '82',
      D: '0'
    },
    correctAnswer: 'A',
    hint: 'Fungsi MIN mencari angka yang paling kecil / paling rendah.',
    explanation:
      'Fungsi MIN mencari nilai terendah (minimum) dalam rentang data. Dari kumpulan angka tersebut, nilai terkecilnya adalah 70.'
  },
  {
    id: 26,
    level: 3,
    questionNumberInLevel: 6,
    theme: 'Fungsi COUNT',
    question: 'Apakah fungsi dari rumus =COUNT(A1:A10) pada lembar kerja Microsoft Excel?',
    options: {
      A: 'Menjumlahkan seluruh angka dari A1 sampai A10',
      B: 'Menghitung berapa banyak sel dalam rentang A1 sampai A10 yang berisi data angka (numerik)',
      C: 'Mencari sel yang tulisannya paling panjang',
      D: 'Menghapus sel yang berisi angka 0'
    },
    correctAnswer: 'B',
    hint: 'COUNT menghitung frekuensi / banyaknya sel yang memuat bilangan numerik.',
    explanation:
      'Fungsi COUNT digunakan untuk menghitung jumlah sel yang memuat data angka (numerik). Jika dalam rentang terdapat sel kosong atau teks, sel tersebut tidak akan dihitung oleh fungsi COUNT.'
  },
  {
    id: 27,
    level: 3,
    questionNumberInLevel: 7,
    theme: 'Operasi Perkalian',
    question: 'Simbol operator matematika apakah yang digunakan di Microsoft Excel untuk melakukan perhitungan PERKALIAN?',
    options: {
      A: 'Huruf x kecil ( x )',
      B: 'Tanda bintang ( * )',
      C: 'Tanda titik dua ( : )',
      D: 'Tanda panah atas ( ^ )'
    },
    correctAnswer: 'B',
    hint: 'Tombol keyboard ini biasanya terletak di atas angka 8 (Shift + 8).',
    explanation:
      'Di Excel dan bahasa pemrograman, perkalian selalu menggunakan simbol tanda bintang (*), contoh: =A1*B1. Tanda (^) digunakan untuk perpangkatan.'
  },
  {
    id: 28,
    level: 3,
    questionNumberInLevel: 8,
    theme: 'Operasi Pembagian',
    question: 'Jika sel A1 bernilai 100 dan sel B1 bernilai 4, penulisan rumus pembagian yang benar untuk menghasilkan angka 25 adalah...',
    options: {
      A: '=A1 : B1',
      B: '=A1 div B1',
      C: '=A1 / B1',
      D: '=A1 \\ B1'
    },
    correctAnswer: 'C',
    hint: 'Gunakan garis miring (slash) ke depan.',
    explanation:
      'Operasi pembagian di Microsoft Excel menggunakan operator garis miring (forward slash /). Jadi rumusnya adalah =A1/B1.'
  },
  {
    id: 29,
    level: 3,
    questionNumberInLevel: 9,
    theme: 'Urutan Operasi Matematika (KABATAKU)',
    question: 'Berapakah hasil dari rumus Excel berikut: =10 + 5 * 2 ?',
    options: {
      A: '30',
      B: '20',
      C: '25',
      D: '17'
    },
    correctAnswer: 'B',
    hint: 'Ingat aturan derajat matematika: operasi perkalian selalu dikerjakan lebih dahulu sebelum penjumlahan!',
    explanation:
      'Sesuai aturan matematika, perkalian (5 * 2 = 10) dikerjakan terlebih dahulu, baru kemudian dijumlahkan dengan 10. Maka 10 + 10 = 20. Jika ingin 30, harus diberi tanda kurung: =(10+5)*2.'
  },
  {
    id: 30,
    level: 3,
    questionNumberInLevel: 10,
    theme: 'Penerapan Tanda Kurung dalam Rumus',
    question: 'Seorang kasir ingin menghitung harga setelah mendapat diskon. Jika harga barang di sel A2 adalah 50.000 dan diskon di B2 adalah 10.000, lalu pembeli membeli 3 buah barang tersebut, rumus yang tepat adalah...',
    options: {
      A: '=A2 - B2 * 3',
      B: '=(A2 - B2) * 3',
      C: '=A2 * 3 - B2',
      D: '=(A2 * B2) - 3'
    },
    correctAnswer: 'B',
    hint: 'Hitung dulu selisih harga setelah diskon di dalam tanda kurung, baru dikalikan dengan jumlah 3 barang.',
    explanation:
      'Tanda kurung memaksa Excel menyelesaikan pengurangan harga barang dengan diskon terlebih dahulu (50.000 - 10.000 = 40.000), baru kemudian mengalikannya dengan 3 buah (40.000 * 3 = 120.000).'
  },

  // ============================================================
  // LEVEL 4: LOGIC & TEXT EXPERT (10 SOAL: 31 - 40)
  // Tema: Fungsi Logika dan Pengolahan Teks
  // ============================================================
  {
    id: 31,
    level: 4,
    questionNumberInLevel: 1,
    theme: 'Struktur Fungsi IF',
    question: 'Bagaimanakah urutan sintaks yang BENAR dari fungsi logika IF di Microsoft Excel?',
    options: {
      A: '=IF(nilai_jika_benar, nilai_jika_salah, tes_logika)',
      B: '=IF(tes_logika, nilai_jika_benar, nilai_jika_salah)',
      C: '=IF(tes_logika, hasil)',
      D: '=IF(kondisi_1 + kondisi_2)'
    },
    correctAnswer: 'B',
    hint: 'Pertama tentukan syarat/kondisi yang diuji, kedua apa hasilnya jika syarat benar, ketiga apa hasilnya jika syarat salah.',
    explanation:
      'Sintaks baku fungsi IF di Microsoft Excel adalah =IF(logical_test, [value_if_true], [value_if_false]).'
  },
  {
    id: 32,
    level: 4,
    questionNumberInLevel: 2,
    theme: 'Penerapan Fungsi IF Kelulusan',
    question: 'Jika batas KKM adalah 75 dan nilai siswa berada di sel C2 (bernilai 80), apakah output dari rumus: =IF(C2>=75, "LULUS", "REMEDIAL") ?',
    miniTable: {
      headers: ['Nama', 'Nilai (C2)', 'Hasil Rumus'],
      rows: [['Rudi', 80, '=IF(C2>=75, "LULUS", "REMEDIAL")']]
    },
    options: {
      A: 'REMEDIAL',
      B: 'LULUS',
      C: 'TRUE',
      D: 'ERROR'
    },
    correctAnswer: 'B',
    hint: 'Apakah 80 lebih besar atau sama dengan 75? Ya, maka ambil opsi nilai_jika_benar.',
    explanation:
      'Karena nilai 80 memenuhi syarat C2 >= 75 (bernilai Benar/True), maka Excel akan menampilkan teks "LULUS".'
  },
  {
    id: 33,
    level: 4,
    questionNumberInLevel: 3,
    theme: 'Fungsi Logika AND',
    question: 'Kapan fungsi logika =AND(kondisi1, kondisi2) akan menghasilkan nilai TRUE (Benar)?',
    options: {
      A: 'Hanya jika SALAH SATU kondisi bernilai TRUE',
      B: 'Hanya jika SEMUA kondisi yang diuji bernilai TRUE',
      C: 'Jika kedua kondisi bernilai FALSE',
      D: 'Fungsi AND tidak pernah menghasilkan nilai TRUE'
    },
    correctAnswer: 'B',
    hint: 'Kata "AND" (DAN) menuntut semua persyaratan harus terpenuhi secara serentak.',
    explanation:
      'Fungsi AND hanya akan menghasilkan nilai TRUE jika seluruh pengujian logika di dalamnya terpenuhi (bernilai TRUE). Jika ada satu saja yang salah, hasilnya menjadi FALSE.'
  },
  {
    id: 34,
    level: 4,
    questionNumberInLevel: 4,
    theme: 'Fungsi Logika OR',
    question: 'Kapan fungsi logika =OR(kondisi1, kondisi2) menghasilkan nilai TRUE (Benar)?',
    options: {
      A: 'Cukup jika minimal SALAH SATU kondisi bernilai TRUE',
      B: 'Hanya jika semua kondisi bernilai salah',
      C: 'Hanya jika semua kondisi berisi angka ganjil',
      D: 'Jika tidak ada data sama sekali'
    },
    correctAnswer: 'A',
    hint: 'Kata "OR" (ATAU) memberikan kelonggaran: salah satu benar saja sudah cukup.',
    explanation:
      'Fungsi OR akan bernilai TRUE jika setidaknya salah satu dari kondisi logika yang diuji terpenuhi (TRUE). Fungsi ini hanya bernilai FALSE jika semua kondisi bernilai FALSE.'
  },
  {
    id: 35,
    level: 4,
    questionNumberInLevel: 5,
    theme: 'Fungsi Teks LEFT',
    question: 'Apakah hasil yang dikeluarkan oleh rumus teks Excel berikut: =LEFT("NUSANTARA", 4) ?',
    options: {
      A: 'TARA',
      B: 'NUSA',
      C: 'SANTA',
      D: 'N'
    },
    correctAnswer: 'B',
    hint: 'Fungsi LEFT memotong sejumlah karakter dari sisi paling kiri kata.',
    explanation:
      'Fungsi LEFT("NUSANTARA", 4) mengambil 4 karakter pertama dari sebelah kiri, yaitu huruf N-U-S-A sehingga hasilnya "NUSA".'
  },
  {
    id: 36,
    level: 4,
    questionNumberInLevel: 6,
    theme: 'Fungsi Teks RIGHT',
    question: 'Di sebuah toko, kode barang di sel A1 adalah "BARANG-2026". Rumus manakah yang digunakan untuk mengambil 4 angka tahun "2026" dari sisi kanan?',
    options: {
      A: '=RIGHT(A1, 4)',
      B: '=LEFT(A1, 4)',
      C: '=MID(A1, 4)',
      D: '=END(A1, 4)'
    },
    correctAnswer: 'A',
    hint: 'Gunakan fungsi pemotong karakter dari sisi kanan kata.',
    explanation:
      'Fungsi RIGHT mengambil sejumlah karakter dari sisi paling kanan string teks. Rumus =RIGHT(A1, 4) akan mengambil 4 huruf terakhir, yaitu "2026".'
  },
  {
    id: 37,
    level: 4,
    questionNumberInLevel: 7,
    theme: 'Fungsi Teks MID',
    question: 'Jika pada sel B2 tertulis teks "INDONESIA", apakah hasil dari penulisan rumus =MID(B2, 3, 5) ?',
    options: {
      A: 'DONES',
      B: 'INDON',
      C: 'NESIA',
      D: 'DON'
    },
    correctAnswer: 'A',
    hint: 'Mulai ambil dari karakter urutan ke-3 (huruf D), lalu ambil sebanyak 5 karakter ke depan.',
    explanation:
      'Sintaks MID adalah =MID(teks, nomor_mulai, jumlah_karakter). Karakter ke-3 dari "INDONESIA" adalah "D". Mengambil 5 karakter mulai dari D: D-O-N-E-S menghasilkan "DONES".'
  },
  {
    id: 38,
    level: 4,
    questionNumberInLevel: 8,
    theme: 'Fungsi Teks LEN',
    question: 'Apakah hasil dari rumus penghitung panjang teks berikut: =LEN("EXCEL 2026") ?',
    options: {
      A: '9',
      B: '10',
      C: '8',
      D: '5'
    },
    correctAnswer: 'B',
    hint: 'Perhatian: Spasi di tengah kata JUGA dihitung sebagai satu karakter oleh fungsi LEN!',
    explanation:
      'Fungsi LEN menghitung seluruh karakter termasuk spasi: "E"(1), "X"(2), "C"(3), "E"(4), "L"(5), " "(6/spasi), "2"(7), "0"(8), "2"(9), "6"(10). Total ada 10 karakter.'
  },
  {
    id: 40,
    level: 4,
    questionNumberInLevel: 9,
    theme: 'Fungsi Penggabungan Teks (CONCAT / Operator &)',
    question: 'Sel A1 berisi kata "Solusi" dan sel B1 berisi kata "Guru". Rumus apakah yang menghasilkan teks "Solusi Guru" (dengan spasi di tengahnya)?',
    options: {
      A: '=A1 + B1',
      B: '=A1 & " " & B1',
      C: '=CONCAT(A1, B1)',
      D: '=A1 & B1'
    },
    correctAnswer: 'B',
    hint: 'Operator (&) menggabungkan teks. Untuk memberi spasi di tengah, selipkan tanda petik dua dengan spasi " " di antara keduanya.',
    explanation:
      'Operator (&) berfungsi menggabungkan string. =A1 & " " & B1 akan menggabungkan kata di A1, karakter spasi, dan kata di B1 menghasilkan "Solusi Guru". Jika hanya =A1 & B1 hasilnya tanpa spasi: "SolusiGuru".'
  },
  {
    id: 39,
    level: 4,
    questionNumberInLevel: 10,
    theme: 'Fungsi UPPER dan LOWER',
    question: 'Jika pada sel A1 tertulis "belajar excel", rumus apakah yang digunakan untuk mengubah teks tersebut menjadi huruf besar semua ("BELAJAR EXCEL")?',
    options: {
      A: '=LOWER(A1)',
      B: '=UPPER(A1)',
      C: '=CAPITAL(A1)',
      D: '=BIG(A1)'
    },
    correctAnswer: 'B',
    hint: 'Kata "UPPERCASE" berarti huruf besar kapital dalam tipografi komputer.',
    explanation:
      'Fungsi UPPER digunakan untuk mengubah semua huruf dalam teks menjadi huruf kapital. Sebaliknya, fungsi LOWER mengubah teks menjadi huruf kecil semua.'
  },

  // ============================================================
  // LEVEL 5: DATA ANALYST (10 SOAL: 41 - 50)
  // Tema: Latihan Perhitungan dan Analisis Data Sederhana
  // ============================================================
  {
    id: 41,
    level: 5,
    questionNumberInLevel: 1,
    theme: 'Menghitung Total Pendapatan Penjualan',
    question: 'Perhatikan tabel penjualan toko perlengkapan komputer. Rumus apakah yang harus diketikkan pada sel E2 untuk menghitung Total Pendapatan Flashdisk?',
    miniTable: {
      headers: ['A (No)', 'B (Barang)', 'C (Jumlah Terjual)', 'D (Harga Satuan)', 'E (Total)'],
      rows: [
        ['1', 'Flashdisk 32GB', 5, 60000, '...']
      ]
    },
    options: {
      A: '=C2 + D2',
      B: '=C2 * D2',
      C: '=SUM(C2:D2)',
      D: '=C2 / D2'
    },
    correctAnswer: 'B',
    hint: 'Total pendapatan didapat dari Jumlah Barang yang terjual dikalikan Harga Satuan per buah.',
    explanation:
      'Untuk menghitung total penjualan, kalikan jumlah barang (sel C2) dengan harga satuan (sel D2) menggunakan rumus =C2*D2 (5 * 60.000 = 300.000).'
  },
  {
    id: 42,
    level: 5,
    questionNumberInLevel: 2,
    theme: 'Menghitung Total Seluruh Omset',
    question: 'Jika pada kolom Total Pendapatan (Kolom E) terisi data penjualan dari sel E2 hingga E6, rumus apakah yang ditulis di sel E7 untuk menghitung Total Seluruh Omset Toko?',
    miniTable: {
      headers: ['Baris', 'E (Total Tiap Barang)'],
      rows: [
        ['2', '300.000'],
        ['3', '150.000'],
        ['4', '200.000'],
        ['5', '500.000'],
        ['6', '250.000'],
        ['7', 'Grand Total: [ ? ]']
      ]
    },
    options: {
      A: '=COUNT(E2:E6)',
      B: '=AVERAGE(E2:E6)',
      C: '=SUM(E2:E6)',
      D: '=MAX(E2:E6)'
    },
    correctAnswer: 'C',
    hint: 'Gunakan fungsi penjumlahan seluruh rentang angka dari E2 sampai E6.',
    explanation:
      'Fungsi =SUM(E2:E6) akan menjumlahkan seluruh subtotal penjualan dari baris 2 sampai baris 6 untuk menghasilkan total omset keseluruhan toko.'
  },
  {
    id: 43,
    level: 5,
    questionNumberInLevel: 3,
    theme: 'Menghitung Rata-rata Penjualan',
    question: 'Berdasarkan tabel pada soal sebelumnya, manajer toko ingin mengetahui Rata-rata Pendapatan per jenis barang. Rumus yang tepat adalah...',
    options: {
      A: '=AVERAGE(E2:E6)',
      B: '=SUM(E2:E6) / 10',
      C: '=MEDIAN(E2*E6)',
      D: '=MIN(E2:E6)'
    },
    correctAnswer: 'A',
    hint: 'Fungsi AVERAGE secara otomatis membagi total nilai dengan banyaknya data dalam rentang.',
    explanation:
      'Fungsi =AVERAGE(E2:E6) menjumlahkan seluruh data di E2:E6 lalu membaginya dengan jumlah item (5 item) secara otomatis untuk memperoleh rata-rata pendapatan.'
  },
  {
    id: 44,
    level: 5,
    questionNumberInLevel: 4,
    theme: 'Menentukan Nilai Tertinggi dan Terendah',
    question: 'Dari rentang data penjualan (300.000, 150.000, 200.000, 500.000, 250.000), produk manakah yang menjadi penyumbang omset TERTINGGI dan TERENDAH?',
    options: {
      A: 'Tertinggi: 500.000, Terendah: 150.000',
      B: 'Tertinggi: 300.000, Terendah: 200.000',
      C: 'Tertinggi: 250.000, Terendah: 300.000',
      D: 'Semua produk menyumbang omset yang sama besar'
    },
    correctAnswer: 'A',
    hint: 'Periksa angka paling besar dan angka paling kecil di antara kelima angka tersebut.',
    explanation:
      'Melalui rumus =MAX(E2:E6) didapat angka tertinggi 500.000, dan melalui rumus =MIN(E2:E6) didapat angka terendah 150.000.'
  },
  {
    id: 45,
    level: 5,
    questionNumberInLevel: 5,
    theme: 'Perbedaan COUNT dan COUNTA',
    question: 'Pada kolom nama pelanggan (sel B2:B10) terdapat 8 nama orang berupa teks dan 1 sel kosong. Jika Anda menuliskan rumus =COUNT(B2:B10), berapakah hasil yang akan ditampilkan oleh Excel?',
    options: {
      A: '8',
      B: '0',
      C: '9',
      D: 'Error #VALUE!'
    },
    correctAnswer: 'B',
    hint: 'Fungsi COUNT HANYA menghitung angka! Untuk menghitung teks/nama, fungsi yang tepat adalah COUNTA.',
    explanation:
      'Fungsi COUNT hanya menghitung sel yang memuat data angka numerik. Karena kolom B2:B10 berisi teks nama dan sel kosong tanpa satu pun angka, hasilnya adalah 0. Jika ingin menghitung nama teks, gunakan =COUNTA(B2:B10).'
  },
  {
    id: 46,
    level: 5,
    questionNumberInLevel: 6,
    theme: 'Menghitung Persentase Diskon',
    question: 'Sebuah jaket memiliki harga asli Rp 200.000 pada sel A2 dan mendapat diskon sebesar 20% pada sel B2 (tertulis 20%). Rumus yang benar untuk menghitung HARGA AKHIR yang harus dibayar pembeli adalah...',
    miniTable: {
      headers: ['A (Harga Asli)', 'B (Diskon)', 'C (Harga Akhir)'],
      rows: [['200.000', '20%', '[ ? ]']]
    },
    options: {
      A: '=A2 * B2',
      B: '=A2 - (A2 * B2)',
      C: '=A2 + B2',
      D: '=A2 / B2'
    },
    correctAnswer: 'B',
    hint: 'Harga akhir adalah harga asli dikurangi dengan besaran potongan diskonnya.',
    explanation:
      'Besaran potongan diskon adalah A2*B2 (200.000 * 20% = 40.000). Harga akhir setelah diskon adalah =A2 - (A2*B2) yang menghasilkan Rp 160.000. Rumus alternatif yang sama validnya adalah =A2*(1-B2).'
  },
  {
    id: 47,
    level: 5,
    questionNumberInLevel: 7,
    theme: 'Membaca Pola Data Tabel',
    question: 'Perhatikan tabel data jumlah kehadiran siswa kelas 8A selama 5 hari berikut. Pada hari apakah tingkat kehadiran siswa PALING RENDAH?',
    miniTable: {
      headers: ['Hari', 'Jumlah Siswa Hadir (Total Siswa 32)'],
      rows: [
        ['Senin', 32],
        ['Selasa', 30],
        ['Rabu', 28],
        ['Kamis', 31],
        ['Jumat', 26]
      ]
    },
    options: {
      A: 'Senin',
      B: 'Rabu',
      C: 'Jumat',
      D: 'Selasa'
    },
    correctAnswer: 'C',
    hint: 'Cari hari dengan angka kehadiran siswa terkecil.',
    explanation:
      'Pada hari Jumat jumlah siswa yang hadir adalah 26 orang (6 siswa tidak hadir), yang merupakan angka kehadiran paling rendah dibandingkan hari lainnya.'
  },
  {
    id: 48,
    level: 5,
    questionNumberInLevel: 8,
    theme: 'Membandingkan Data dengan KKM',
    question: 'Seorang guru menetapkan KKM nilai Informatika = 75. Perhatikan tabel nilai 4 siswa berikut. Berapa banyakkah siswa yang dinyatakan LULUS (nilai >= 75)?',
    miniTable: {
      headers: ['Nama Siswa', 'Nilai Ujian'],
      rows: [
        ['Alif', 72],
        ['Bella', 85],
        ['Candra', 75],
        ['Dinda', 90]
      ]
    },
    options: {
      A: '1 Siswa',
      B: '2 Siswa',
      C: '3 Siswa',
      D: '4 Siswa'
    },
    correctAnswer: 'C',
    hint: 'Ingat syarat: nilai >= 75. Nilai tepat 75 termasuk lulus!',
    explanation:
      'Siswa yang lulus adalah Bella (85), Candra (75), dan Dinda (90), sehingga total ada 3 siswa yang lulus. Alif (72) tidak lulus karena nilainya di bawah 75.'
  },
  {
    id: 49,
    level: 5,
    questionNumberInLevel: 9,
    theme: 'Studi Kasus Bonus Karyawan',
    question: 'Sebuah perusahaan memberikan bonus 5% dari total penjualan jika seorang sales berhasil menjual barang di atas Rp 10.000.000, jika tidak maka bonusnya 0. Jika total penjualan sales berada di sel D2, rumus IF yang benar adalah...',
    options: {
      A: '=IF(D2 > 10000000, D2 * 5%, 0)',
      B: '=IF(D2 < 10000000, D2 * 5%, 0)',
      C: '=IF(D2 = 10000000, 5%, 0)',
      D: '=IF(D2 * 5% > 10000000, "Bonus", "Tidak")'
    },
    correctAnswer: 'A',
    hint: 'Kondisi tes logika adalah D2 > 10000000. Jika benar, beri bonus D2*5%. Jika tidak, beri 0.',
    explanation:
      'Rumus yang tepat adalah =IF(D2 > 10000000, D2 * 5%, 0). Jika penjualan di D2 lebih dari 10 juta, sales menerima 5% dari penjualannya, jika tidak menerima 0.'
  },
  {
    id: 50,
    level: 5,
    questionNumberInLevel: 10,
    theme: 'Rumus Evaluasi Komprehensif (IF + AVERAGE)',
    question: 'Untuk menentukan kelulusan akhir, nilai rata-rata dari 3 tugas (sel C2, D2, E2) harus mencapai minimal 75. Rumus gabungan manakah yang PALING EFEKTIF dan PROFESIONAL?',
    miniTable: {
      headers: ['Siswa', 'Tugas 1 (C)', 'Tugas 2 (D)', 'Tugas 3 (E)', 'Hasil Evaluasi'],
      rows: [
        ['Kevin', 80, 75, 85, '=IF(AVERAGE(C2:E2)>=75, "TUNTAS", "REMEDIAL")']
      ]
    },
    options: {
      A: '=IF(C2+D2+E2 >= 75, "TUNTAS", "REMEDIAL")',
      B: '=IF(AVERAGE(C2:E2) >= 75, "TUNTAS", "REMEDIAL")',
      C: '=AVERAGE(IF(C2:E2 >= 75, "TUNTAS"))',
      D: '=SUM(C2:E2) / 75'
    },
    correctAnswer: 'B',
    hint: 'Gabungkan fungsi AVERAGE di dalam tes logika fungsi IF.',
    explanation:
      'Rumus =IF(AVERAGE(C2:E2) >= 75, "TUNTAS", "REMEDIAL") adalah formula komprehensif yang secara otomatis menghitung nilai rata-rata dari C2 hingga E2, lalu membandingkannya dengan angka 75 untuk menentukan status TUNTAS atau REMEDIAL.'
  }
];

export const EXCEL_MASTER_QUESTIONS = EXCEL_QUESTIONS;

