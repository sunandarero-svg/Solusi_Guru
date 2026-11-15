import { ExcelFlashcard } from '../types';

export const FLASHCARDS_DATA: Record<number, ExcelFlashcard> = {
  1: {
    level: 1,
    title: 'LEVEL 1: EXCEL BEGINNER',
    subtitle: 'Mengenal Dunia Spreadsheet Microsoft Excel',
    concept:
      'Microsoft Excel adalah program aplikasi lembar kerja (spreadsheet) yang dikembangkan oleh Microsoft untuk mengolah, menganalisis, dan memvisualisasikan data angka dalam bentuk baris dan kolom.',
    keyPoints: [
      '📊 Fungsi Utama: Perhitungan matematis, analisis keuangan, pembuatan grafik, dan pengorganisasian data terstruktur.',
      '📁 Workbook vs Worksheet: Workbook adalah file Excel keseluruhan (seperti sebuah buku), sedangkan Worksheet adalah lembar kerja di dalamnya (seperti halaman buku).',
      '🔤 Jenis Data: Teks/Label (otomatis rata kiri), Angka/Numeric (otomatis rata kanan), dan Rumus/Formula (diawali tanda =).',
      '💾 Ekstensi File: Standar modern menggunakan .xlsx (XML Spreadsheet), versi lama .xls, dan teks tabel ringkas .csv (Comma Separated Values).'
    ],
    visualMiniTable: {
      headers: ['A (Teks - Rata Kiri)', 'B (Angka - Rata Kanan)', 'C (Rumus)'],
      rows: [
        ['Buku Tulis', 15000, '=B2*2'],
        ['Pulpen Gel', 5000, '=B3*5'],
        ['Penggaris 30cm', 4000, '=SUM(B2:B4)']
      ]
    },
    formulaTip: 'Data teks selalu diapit tanda kutip ganda jika digunakan di rumus, contoh: "LULUS".',
    realWorldExample:
      'Di sekolah, guru memakai Excel untuk merekap nilai harian siswa. Di rumah, keluarga menggunakannya untuk mencatat pengeluaran bulanan agar tidak boros!'
  },
  2: {
    level: 2,
    title: 'LEVEL 2: EXCEL EXPLORER',
    subtitle: 'Menjelajahi Bagian dan Antarmuka Microsoft Excel',
    concept:
      'Antarmuka Excel dirancang dengan sistem grid koordinat dan bilah alat modern (Ribbon) agar pengguna dapat mengakses ratusan fitur kalkulasi dan formatting dengan cepat.',
    keyPoints: [
      '🎀 Ribbon: Kumpulan tab menu di bagian atas (Home, Insert, Page Layout, Formulas, Data, dll) yang berisi grup tombol perintah.',
      '⚡ Quick Access Toolbar (QAT): Tombol pintas di pojok kiri atas untuk akses instan perintah sering dipakai (Save, Undo, Redo).',
      '📝 Formula Bar: Bilah panjang tempat melihat dan mengetik isi sesungguhnya serta rumus sel yang aktif.',
      '📍 Name Box (Kotak Nama): Menunjukkan alamat koordinat sel aktif (misal: B4) atau nama rentang sel.',
      '📐 Row & Column: Row (Baris) horizontal diberi tanda angka (1, 2, 3...), Column (Kolom) vertikal diberi tanda huruf (A, B, C...).',
      '🎯 Cell & Range: Cell adalah perpotongan baris & kolom (C5). Range adalah kumpulan sel yang dipisahkan titik dua (contoh: A1:D10).'
    ],
    visualMiniTable: {
      headers: ['Name Box: [ B2 ]', 'Formula Bar: [ =SUM(B2:B4) ]', 'Status: Siap'],
      rows: [
        ['A1: Judul Barang', 'B1: Harga', 'C1: Jumlah'],
        ['A2: Pensil 2B', 'B2: 3000', 'C2: 10'],
        ['A3: Penghapus', 'B3: 2000', 'C3: 5']
      ]
    },
    formulaTip: 'Range A1:B3 mencakup seluruh sel dari kolom A baris 1 sampai kolom B baris 3 (total 6 sel).',
    realWorldExample:
      'Ketika kamu mengeklik sel pertemuan kolom D dan baris 7, Name Box akan langsung bertuliskan "D7". Sangat mudah melacak posisi data!'
  },
  3: {
    level: 3,
    title: 'LEVEL 3: FORMULA MASTER',
    subtitle: 'Menguasai Rumus Dasar dan Perhitungan Matematis',
    concept:
      'Kekuatan terbesar Excel ada pada kalkulasi otomatis. Anda hanya perlu menuliskan rumus satu kali, dan Excel akan menghitung ribuan data dalam hitungan milidetik.',
    keyPoints: [
      '⭐ Aturan Emas: Setiap penulisan rumus atau fungsi di Excel WAJIB diawali dengan tanda sama dengan (=).',
      '➕ Penjumlahan & Pengurangan: Menggunakan tanda (+) dan (-), misal: =A1+B1-C1.',
      '✖️ Perkalian & Pembagian: Perkalian menggunakan tanda bintang (*), pembagian menggunakan garis miring (/), misal: =A1*B1 atau =A1/2.',
      '📊 Fungsi SUM: Menjumlahkan seluruh angka dalam rentang, sintaks: =SUM(A1:A5).',
      '📈 Fungsi AVERAGE: Menghitung rata-rata, sintaks: =AVERAGE(B2:B10).',
      '🏆 Fungsi MAX & MIN: =MAX(...) mencari nilai tertinggi, =MIN(...) mencari nilai terendah.',
      '🔢 Fungsi COUNT: Menghitung banyaknya sel yang berisi data numerik/angka.'
    ],
    visualMiniTable: {
      headers: ['Siswa', 'Nilai Tugas (A)', 'Nilai Ujian (B)', 'Total (=A2+B2)'],
      rows: [
        ['Budi', 80, 90, 170],
        ['Siti', 85, 95, 180],
        ['Rata-rata', '=AVERAGE(B2:B3)', '=AVERAGE(C2:C3)', '=AVERAGE(D2:D3)']
      ]
    },
    formulaTip: 'Urutan pengerjaan matematika mengikuti aturan PEMDAS / KABATAKU: tanda kurung () dikerjakan lebih dahulu daripada perkalian atau penjumlahan!',
    realWorldExample:
      'Untuk mencari rata-rata nilai rapor kelas, guru tidak perlu menghitung manual dengan kalkulator. Cukup ketik =AVERAGE(C2:C35) dan hasilnya langsung keluar!'
  },
  4: {
    level: 4,
    title: 'LEVEL 4: LOGIC & TEXT EXPERT',
    subtitle: 'Fungsi Pengambilan Keputusan (IF) dan Manipulasi Teks',
    concept:
      'Excel dapat membuat keputusan otomatis menggunakan fungsi logika IF dan merapikan data teks yang berantakan menggunakan fungsi string.',
    keyPoints: [
      '🧠 Fungsi IF: Mengevaluasi syarat logika. Sintaks: =IF(tes_logika, nilai_jika_benar, nilai_jika_salah).',
      'Contoh: =IF(B2>=75, "LULUS", "REMEDIAL").',
      '🤝 Logika AND & OR: AND bernilai TRUE jika SEMUA kondisi benar. OR bernilai TRUE jika SALAH SATU kondisi benar.',
      '✂️ Fungsi LEFT(teks, n): Mengambil n karakter dari sisi kiri. Contoh: =LEFT("INDONESIA", 4) menghasilkan "INDO".',
      '✂️ Fungsi RIGHT(teks, n): Mengambil n karakter dari sisi kanan. Contoh: =RIGHT("EXCEL2026", 4) menghasilkan "2026".',
      '✂️ Fungsi MID(teks, mulai, n): Mengambil n karakter dari tengah teks.',
      '📏 Fungsi LEN(teks): Menghitung panjang karakter termasuk spasi.',
      '🔠 UPPER & LOWER: =UPPER("hebat") jadi "HEBAT", =LOWER("DATA") jadi "data".',
      '🔗 CONCAT / &: Menggabungkan dua sel atau lebih, contoh: =A1 & " " & B1.'
    ],
    visualMiniTable: {
      headers: ['Nama Depan', 'Nama Belakang', 'Nilai', 'Status (=IF(C2>=75,"Lulus","Remedial"))'],
      rows: [
        ['Ahmad', 'Fauzi', 88, 'Lulus'],
        ['Dewi', 'Lestari', 70, 'Remedial'],
        ['Gabungan', '=A2 & " " & B2', 'Hasil:', 'Ahmad Fauzi']
      ]
    },
    formulaTip: 'Jika teks diapit tanda kutip ganda seperti "Lulus", Excel menganggapnya sebagai kata teks, bukan nama variabel atau rumus.',
    realWorldExample:
      'Di bandara atau toko online, kode resi atau ID produk seperti "JKT-2026-99" dipisahkan menggunakan fungsi LEFT dan RIGHT untuk mengetahui kode kota dan tahun pesanan secara otomatis!'
  },
  5: {
    level: 5,
    title: 'LEVEL 5: DATA ANALYST',
    subtitle: 'Membaca Tabel, Menghitung Persentase, dan Studi Kasus Nyata',
    concept:
      'Seorang analis data menggunakan Excel untuk menyimpulkan tren, membandingkan performa penjualan, menghitung diskon dan keuntungan, serta mengambil keputusan bisnis berbasis data.',
    keyPoints: [
      '💰 Menghitung Total Belanja: Jumlah Barang (Qty) dikalikan Harga Satuan: =Qty * HargaSatuan (contoh: =C2*D2).',
      '🏷️ Menghitung Persentase Diskon: Harga setelah diskon = Harga Asli * (1 - Diskon) atau =A2 - (A2 * B2).',
      '📊 COUNT vs COUNTA: COUNT hanya menghitung sel berisi angka. COUNTA menghitung semua sel yang ada isinya (angka maupun teks).',
      '📈 Pola Data: Menganalisis baris dan kolom untuk menemukan hari penjualan teramai, produk paling laris, atau cabang dengan performa tertinggi.',
      '💡 Kombinasi Rumus Analitik: Menggabungkan rumus logika dan statistik, contoh: =IF(AVERAGE(B2:D2)>=80, "SANGAT BAIK", "CUKUP").'
    ],
    visualMiniTable: {
      headers: ['Produk', 'Terjual (C)', 'Harga Satuan (D)', 'Subtotal (=C*D)', 'Diskon 10% (=Subtotal*90%)'],
      rows: [
        ['Laptop Pro', 5, 8000000, 40000000, 36000000],
        ['Mouse Wireless', 20, 150000, 3000000, 2700000],
        ['Total Omset', '=SUM(B2:B3)', '-', '=SUM(D2:D3)', '=SUM(E2:E3)']
      ]
    },
    formulaTip: 'Untuk menghitung persentase di Excel, kamu bisa langsung menulis 10% atau 0.1 di dalam rumus kalkulasi.',
    realWorldExample:
      'Manajer restoran melihat data penjualan harian di Excel untuk mengetahui menu mana yang paling disukai pelanggan dan kapan waktu paling ramai pengunjung!'
  }
};

export const EXCEL_FLASHCARDS = FLASHCARDS_DATA;

