import { QuestionItem } from './types';

export const DEFAULT_QUESTIONS: QuestionItem[] = [
  // ==========================================
  // WORLD 1: KNOWLEDGE FOREST (Levels 1 - 5)
  // Tema: Pengetahuan Dasar, Sains Tropis, Flora-Fauna Borneo, Matematika Dasar
  // ==========================================
  {
    questionId: 'Q001',
    world: 1,
    level: 1,
    question: 'Pohon Ulin (Eusideroxylon zwageri) yang merupakan pohon khas Kalimantan terkenal karena sifat kayunya yang...',
    options: {
      A: 'Sangat keras dan tahan air sehingga dijuluki kayu besi',
      B: 'Sangat rapuh dan mudah patah saat terkena air',
      C: 'Berongga seperti bambu untuk menyimpan air',
      D: 'Hanya bisa tumbuh di dasar sungai berarus deras'
    },
    correctAnswer: 'A',
    difficulty: 'EASY',
    stage: 'Pengetahuan',
    explanation: 'Kayu ulin adalah flora endemik Kalimantan yang sangat padat dan tahan rayap serta air, sehingga dijuluki Kayu Besi Kalimantan.'
  },
  {
    questionId: 'Q002',
    world: 1,
    level: 1,
    question: 'Organel sel tumbuhan yang berfungsi sebagai tempat berlangsungnya proses fotosintesis adalah...',
    options: {
      A: 'Kloroplas',
      B: 'Mitokondria',
      C: 'Ribosom',
      D: 'Vakuola'
    },
    correctAnswer: 'A',
    difficulty: 'EASY',
    stage: 'Pengetahuan',
    explanation: 'Kloroplas mengandung klorofil (zat hijau daun) yang menangkap energi cahaya matahari untuk fotosintesis.'
  },
  {
    questionId: 'Q003',
    world: 1,
    level: 1,
    question: 'Hasil dari operasi hitung (-15) + 28 - (-7) adalah...',
    options: {
      A: '20',
      B: '26',
      C: '14',
      D: '32'
    },
    correctAnswer: 'A',
    difficulty: 'EASY',
    stage: 'Pengetahuan',
    explanation: '(-15) + 28 = 13. Kemudian 13 - (-7) = 13 + 7 = 20.'
  },
  {
    questionId: 'Q004',
    world: 1,
    level: 1,
    question: 'Sungai terpanjang di Indonesia yang melintasi provinsi Kalimantan Barat adalah Sungai...',
    options: {
      A: 'Kapuas',
      B: 'Mahakam',
      C: 'Barito',
      D: 'Musi'
    },
    correctAnswer: 'A',
    difficulty: 'EASY',
    stage: 'Pengetahuan',
    explanation: 'Sungai Kapuas memiliki panjang sekitar 1.143 km, menjadikannya sungai terpanjang di Indonesia.'
  },
  {
    questionId: 'Q005',
    world: 1,
    level: 2,
    question: 'Satuan Standar Internasional (SI) untuk mengukur intensitas cahaya adalah...',
    options: {
      A: 'Candela',
      B: 'Lumen',
      C: 'Kelvin',
      D: 'Ampere'
    },
    correctAnswer: 'A',
    difficulty: 'EASY',
    stage: 'Pengetahuan',
    explanation: 'Candela (cd) adalah satuan pokok SI untuk intensitas cahaya.'
  },
  {
    questionId: 'Q006',
    world: 1,
    level: 2,
    question: 'Orangutan Kalimantan (Pongo pygmaeus) termasuk dalam ordo primata yang berstatus kelestarian...',
    options: {
      A: 'Kritis (Critically Endangered)',
      B: 'Populasi Aman (Least Concern)',
      C: 'Punah di Alam Liar (Extinct in the Wild)',
      D: 'Hama Pertanian'
    },
    correctAnswer: 'A',
    difficulty: 'EASY',
    stage: 'Pengetahuan',
    explanation: 'Orangutan Kalimantan terancam punah dengan status Kritis (Critically Endangered) akibat hilangnya habitat hutan tropis.'
  },
  {
    questionId: 'Q007',
    world: 1,
    level: 2,
    question: 'Jika 3x + 7 = 22, maka nilai dari x adalah...',
    options: {
      A: '5',
      B: '6',
      C: '4',
      D: '7'
    },
    correctAnswer: 'A',
    difficulty: 'EASY',
    stage: 'Pengetahuan',
    explanation: '3x = 22 - 7 => 3x = 15 => x = 5.'
  },
  {
    questionId: 'Q008',
    world: 1,
    level: 2,
    question: 'Perangkat keras komputer (hardware) yang bertindak sebagai otak pemrosesan instruksi adalah...',
    options: {
      A: 'CPU (Central Processing Unit)',
      B: 'RAM (Random Access Memory)',
      C: 'Harddisk',
      D: 'Power Supply'
    },
    correctAnswer: 'A',
    difficulty: 'EASY',
    stage: 'Pengetahuan',
    explanation: 'CPU bertugas mengendalikan dan memproses seluruh instruksi aritmetika serta logika dalam komputer.'
  },
  {
    questionId: 'Q009',
    world: 1,
    level: 3,
    question: 'Gas utama di atmosfer bumi yang paling banyak diserap oleh hutan hujan tropis saat siang hari adalah...',
    options: {
      A: 'Karbon Dioksida (CO2)',
      B: 'Oksigen (O2)',
      C: 'Metana (CH4)',
      D: 'Helium (He)'
    },
    correctAnswer: 'A',
    difficulty: 'EASY',
    stage: 'Pengetahuan',
    explanation: 'Tumbuhan menyerap Karbon Dioksida (CO2) sebagai bahan baku fotosintesis untuk menghasilkan glukosa dan oksigen.'
  },
  {
    questionId: 'Q010',
    world: 1,
    level: 3,
    question: 'KPK (Kelipatan Persekutuan Terkecil) dari bilangan 12 dan 18 adalah...',
    options: {
      A: '36',
      B: '24',
      C: '72',
      D: '6'
    },
    correctAnswer: 'A',
    difficulty: 'EASY',
    stage: 'Pengetahuan',
    explanation: 'Faktorisasi: 12 = 2² × 3, 18 = 2 × 3². KPK = 2² × 3² = 4 × 9 = 36.'
  },
  {
    questionId: 'Q011',
    world: 1,
    level: 3,
    question: 'Tanaman karnivora yang banyak dijumpai di rawa gambut Kalimantan untuk menangkap serangga adalah...',
    options: {
      A: 'Kantong Semar (Nepenthes)',
      B: 'Kaktus',
      C: 'Bunga Bangkai (Rafflesia)',
      D: 'Eceng Gondok'
    },
    correctAnswer: 'A',
    difficulty: 'EASY',
    stage: 'Pengetahuan',
    explanation: 'Kantong Semar hidup di tanah gambut miskin nitrogen, beradaptasi menjebak serangga di dalam kantungnya untuk nutrisi.'
  },
  {
    questionId: 'Q012',
    world: 1,
    level: 3,
    question: 'Urutan metamorfosis sempurna pada kupu-kupu yang benar adalah...',
    options: {
      A: 'Telur -> Larva (Ulat) -> Pupa (Kepompong) -> Imago (Kupu-kupu)',
      B: 'Telur -> Nimfa -> Pupa -> Dewasa',
      C: 'Telur -> Pupa -> Larva -> Kupu-kupu',
      D: 'Larva -> Telur -> Kepompong -> Kupu-kupu'
    },
    correctAnswer: 'A',
    difficulty: 'EASY',
    stage: 'Pengetahuan',
    explanation: 'Metamorfosis sempurna melewati 4 fase bertahap: telur, ulat/larva, pupa/kepompong, hingga kupu-kupu dewasa.'
  },
  {
    questionId: 'Q013',
    world: 1,
    level: 4,
    question: 'Sebuah taman berbentuk persegi panjang berukuran panjang 14 meter dan lebar 8 meter. Keliling taman tersebut adalah...',
    options: {
      A: '44 meter',
      B: '112 meter',
      C: '52 meter',
      D: '28 meter'
    },
    correctAnswer: 'A',
    difficulty: 'EASY',
    stage: 'Pengetahuan',
    explanation: 'Keliling persegi panjang = 2 × (p + l) = 2 × (14 + 8) = 2 × 22 = 44 meter.'
  },
  {
    questionId: 'Q014',
    world: 1,
    level: 4,
    question: 'Bagian darah manusia yang berfungsi mengangkut oksigen ke seluruh sel tubuh adalah...',
    options: {
      A: 'Sel Darah Merah (Eritrosit)',
      B: 'Sel Darah Putih (Leukosit)',
      C: 'Keping Darah (Trombosit)',
      D: 'Plasma Darah'
    },
    correctAnswer: 'A',
    difficulty: 'EASY',
    stage: 'Pengetahuan',
    explanation: 'Eritrosit mengandung hemoglobin yang mengikat oksigen dari paru-paru dan membawanya ke seluruh jaringan tubuh.'
  },
  {
    questionId: 'Q015',
    world: 1,
    level: 4,
    question: 'Dalam bahasa komputer, 1 Byte terdiri dari berapa bit?',
    options: {
      A: '8 bit',
      B: '4 bit',
      C: '16 bit',
      D: '1024 bit'
    },
    correctAnswer: 'A',
    difficulty: 'EASY',
    stage: 'Pengetahuan',
    explanation: 'Satu Byte adalah unit digital dasar yang tersusun dari 8 buah bit (angka biner 0 dan 1).'
  },
  {
    questionId: 'Q016',
    world: 1,
    level: 4,
    question: 'Penyebab utama terjadinya pergantian siang dan malam di bumi adalah...',
    options: {
      A: 'Rotasi bumi pada porosnya',
      B: 'Revolusi bumi mengelilingi matahari',
      C: 'Pergerakan bulan mengitari bumi',
      D: 'Perubahan jarak bumi dengan matahari'
    },
    correctAnswer: 'A',
    difficulty: 'EASY',
    stage: 'Pengetahuan',
    explanation: 'Rotasi bumi adalah perputaran bumi pada porosnya selama 24 jam yang menyebabkan sisi bumi bergantian menghadap matahari.'
  },
  // Level 5: Boss Battle 1 - Forest Guardian (Urutan: Pengetahuan, Penerapan, HOTS + cadangan)
  {
    questionId: 'Q017',
    world: 1,
    level: 5,
    question: '[BOSS Q1] Hutan hujan tropis Kalimantan dijuluki sebagai "Paru-paru Dunia" karena peran ekologisnya dalam...',
    options: {
      A: 'Menghasilkan pasokan oksigen masif dan menyerap karbon global',
      B: 'Mencegah terjadinya rotasi bumi yang terlalu cepat',
      C: 'Mengubah air laut menjadi air tawar secara alami di atmosfer',
      D: 'Menghangatkan kutub utara agar es mencair perlahan'
    },
    correctAnswer: 'A',
    difficulty: 'BOSS',
    stage: 'Pengetahuan',
    isBossQuestion: true,
    explanation: 'Hutan tropis adalah bioma penyerap karbon terbesar di daratan yang menyeimbangkan kadar oksigen dan iklim dunia.'
  },
  {
    questionId: 'Q018',
    world: 1,
    level: 5,
    question: '[BOSS Q2] Jika laju deforestasi hutan mencapai 120 hektare per bulan, berapa total lahan yang hilang selama 1,5 tahun?',
    options: {
      A: '2.160 hektare',
      B: '1.440 hektare',
      C: '1.800 hektare',
      D: '2.400 hektare'
    },
    correctAnswer: 'A',
    difficulty: 'BOSS',
    stage: 'Penerapan',
    isBossQuestion: true,
    explanation: '1,5 tahun = 18 bulan. Total lahan = 120 × 18 = 2.160 hektare.'
  },
  {
    questionId: 'Q019',
    world: 1,
    level: 5,
    question: '[BOSS Q3] Mengapa hilangnya kanopi pohon di hutan hujan tropis dapat memicu longsor dan erosi parah saat musim hujan?',
    options: {
      A: 'Air hujan menghantam tanah secara langsung tanpa serapan akar dan vegetasi penahan',
      B: 'Hewan hutan akan menggali lubang di bawah tanah secara massal',
      C: 'Sinar matahari membuat air hujan menjadi terlalu panas dan memecah batu',
      D: 'Kanopi pohon sebenarnya adalah penyebab utama tanah menjadi gembur'
    },
    correctAnswer: 'A',
    difficulty: 'BOSS',
    stage: 'HOTS',
    isBossQuestion: true,
    explanation: 'Kanopi meredam energi kinetik air hujan dan sistem perakaran pohon mengikat partikel tanah agar tidak hanyut tererosi.'
  },
  {
    questionId: 'Q020',
    world: 1,
    level: 5,
    question: '[BOSS CADANGAN] Spesies burung endemik Kalimantan dengan paruh besar bertanduk yang menjadi lambang kesucian suku Dayak adalah...',
    options: {
      A: 'Burung Enggang Gading (Rangkong)',
      B: 'Burung Cendrawasih',
      C: 'Burung Jalak Bali',
      D: 'Burung Maleo'
    },
    correctAnswer: 'A',
    difficulty: 'BOSS',
    stage: 'Pengetahuan',
    isBossQuestion: true,
    explanation: 'Burung Enggang (Rangkong) adalah burung keramat khas Kalimantan yang melambangkan perdamaian dan kepemimpinan.'
  },

  // ==========================================
  // WORLD 2: CHALLENGE MOUNTAIN (Levels 6 - 10)
  // Tema: Penerapan Konsep, Fisika Terapan, Geografi, Matematika Aljabar
  // ==========================================
  {
    questionId: 'Q021',
    world: 2,
    level: 6,
    question: 'Sebuah mobil melaju dengan kecepatan konstan 72 km/jam. Berapakah kecepatan mobil tersebut jika dinyatakan dalam meter per sekon (m/s)?',
    options: {
      A: '20 m/s',
      B: '15 m/s',
      C: '25 m/s',
      D: '30 m/s'
    },
    correctAnswer: 'A',
    difficulty: 'MEDIUM',
    stage: 'Penerapan',
    explanation: '72 km/jam = (72 × 1.000 m) / 3.600 s = 72.000 / 3.600 = 20 m/s.'
  },
  {
    questionId: 'Q022',
    world: 2,
    level: 6,
    question: 'Pada pegunungan tinggi, air mendidih pada suhu di bawah 100°C. Prinsip sains yang menjelaskan fenomena ini adalah...',
    options: {
      A: 'Tekanan udara di dataran tinggi lebih rendah daripada di permukaan laut',
      B: 'Kandungan oksigen di gunung membuat air lebih mudah terbakar',
      C: 'Gravitasi bumi di puncak gunung menarik kalor lebih cepat',
      D: 'Suhu lingkungan gunung selalu membekukan molekul air'
    },
    correctAnswer: 'A',
    difficulty: 'MEDIUM',
    stage: 'Penerapan',
    explanation: 'Titik didih berbanding lurus dengan tekanan udara. Semakin tinggi suatu tempat, tekanan udaranya makin rendah sehingga air mendidih pada suhu lebih rendah.'
  },
  {
    questionId: 'Q023',
    world: 2,
    level: 6,
    question: 'Harga sepasang sepatu setelah didiskon 25% adalah Rp 150.000,-. Harga awal sepatu tersebut sebelum diskon adalah...',
    options: {
      A: 'Rp 200.000,-',
      B: 'Rp 187.500,-',
      C: 'Rp 225.000,-',
      D: 'Rp 175.000,-'
    },
    correctAnswer: 'A',
    difficulty: 'MEDIUM',
    stage: 'Penerapan',
    explanation: 'Harga setelah diskon = 75% dari harga awal. Harga awal = Rp 150.000 / 0,75 = Rp 200.000,-.'
  },
  {
    questionId: 'Q024',
    world: 2,
    level: 6,
    question: 'Gaya gesek yang menguntungkan bagi pendaki gunung saat mendaki tebing berbatu adalah...',
    options: {
      A: 'Gesekan antara sol sepatu bergerigi dengan permukaan batu cadas',
      B: 'Gesekan antara tali ransel dengan bahu pendaki',
      C: 'Gesekan antara udara dingin dengan wajah pendaki',
      D: 'Gesekan rantai gear sepeda gunung yang berkarat'
    },
    correctAnswer: 'A',
    difficulty: 'MEDIUM',
    stage: 'Penerapan',
    explanation: 'Sol sepatu gunung bermotif kasar memperbesar gaya gesek sehingga pendaki tidak mudah terpeleset.'
  },
  {
    questionId: 'Q025',
    world: 2,
    level: 7,
    question: 'Dua buah resistor masing-masing bernilai 6 Ohm dirangkai secara paralel. Hambatan total rangkaian tersebut adalah...',
    options: {
      A: '3 Ohm',
      B: '12 Ohm',
      C: '1 Ohm',
      D: '9 Ohm'
    },
    correctAnswer: 'A',
    difficulty: 'MEDIUM',
    stage: 'Penerapan',
    explanation: '1/R_total = 1/6 + 1/6 = 2/6 = 1/3 => R_total = 3 Ohm.'
  },
  {
    questionId: 'Q026',
    world: 2,
    level: 7,
    question: 'Gunung tertinggi di pulau Kalimantan (terletak di Sabah) yang berupa batuan granit raksasa adalah...',
    options: {
      A: 'Gunung Kinabalu (4.095 mdpl)',
      B: 'Gunung Bukit Raya',
      C: 'Gunung Semeru',
      D: 'Gunung Kerinci'
    },
    correctAnswer: 'A',
    difficulty: 'MEDIUM',
    stage: 'Penerapan',
    explanation: 'Gunung Kinabalu adalah puncak tertinggi di Pulau Kalimantan dengan elevasi 4.095 meter di atas permukaan laut.'
  },
  {
    questionId: 'Q027',
    world: 2,
    level: 7,
    question: 'Jika skala sebuah peta adalah 1 : 250.000 dan jarak dua pos pengamatan di peta adalah 6 cm, maka jarak sebenarnya adalah...',
    options: {
      A: '15 km',
      B: '25 km',
      C: '150 km',
      D: '1,5 km'
    },
    correctAnswer: 'A',
    difficulty: 'MEDIUM',
    stage: 'Penerapan',
    explanation: 'Jarak sebenarnya = 6 cm × 250.000 = 1.500.000 cm = 15.000 meter = 15 km.'
  },
  {
    questionId: 'Q028',
    world: 2,
    level: 7,
    question: 'Pesawat sederhana yang memanfaatkan prinsip bidang miring untuk mempermudah jalan melingkar menuju puncak gunung adalah...',
    options: {
      A: 'Jalan berkelok-kelok (serpentin)',
      B: 'Katrol gantung tambang',
      C: 'Tuas pengungkit batu',
      D: 'Roda berporos'
    },
    correctAnswer: 'A',
    difficulty: 'MEDIUM',
    stage: 'Penerapan',
    explanation: 'Jalan berkelok memperpanjang lintasan sehingga gaya kuasa yang dibutuhkan kendaraan untuk menanjak menjadi lebih kecil.'
  },
  {
    questionId: 'Q029',
    world: 2,
    level: 8,
    question: 'Sebuah balok bermassa 5 kg ditarik dengan percepatan 4 m/s². Menurut Hukum II Newton, gaya total yang bekerja adalah...',
    options: {
      A: '20 Newton',
      B: '9 Newton',
      C: '1,25 Newton',
      D: '40 Newton'
    },
    correctAnswer: 'A',
    difficulty: 'MEDIUM',
    stage: 'Penerapan',
    explanation: 'F = m × a = 5 kg × 4 m/s² = 20 Newton.'
  },
  {
    questionId: 'Q030',
    world: 2,
    level: 8,
    question: 'Dalam pemrograman web, struktur logika yang digunakan untuk mengeksekusi aksi jika kondisi tertentu terpenuhi adalah...',
    options: {
      A: 'IF - ELSE Statement',
      B: 'Array Indexing',
      C: 'HTML Tag Style',
      D: 'Database Drop'
    },
    correctAnswer: 'A',
    difficulty: 'MEDIUM',
    stage: 'Penerapan',
    explanation: 'Percabangan IF - ELSE menguji ekspresi logika boolean untuk menentukan blok kode mana yang akan dijalankan.'
  },
  {
    questionId: 'Q031',
    world: 2,
    level: 8,
    question: 'Pemanfaatan energi panas bumi (geothermal) di kawasan vulkanik bertujuan untuk menghasilkan...',
    options: {
      A: 'Uap bertekanan tinggi untuk memutar turbin listrik',
      B: 'Minyak bumi sintetis secara langsung',
      C: 'Gas nitrogen murni untuk pupuk',
      D: 'Batu bara muda instan'
    },
    correctAnswer: 'A',
    difficulty: 'MEDIUM',
    stage: 'Penerapan',
    explanation: 'Energi panas bumi memanaskan air bawah tanah menjadi uap bertekanan yang digunakan memutar turbin generator listrik ramah lingkungan.'
  },
  {
    questionId: 'Q032',
    world: 2,
    level: 8,
    question: 'Rasio perbandingan jumlah siswa laki-laki dan perempuan di kelas petualang adalah 3 : 5. Jika total siswa 40 orang, banyak siswa perempuan adalah...',
    options: {
      A: '25 orang',
      B: '15 orang',
      C: '20 orang',
      D: '30 orang'
    },
    correctAnswer: 'A',
    difficulty: 'MEDIUM',
    stage: 'Penerapan',
    explanation: 'Total bagian = 3 + 5 = 8. Siswa perempuan = (5/8) × 40 = 25 orang.'
  },
  {
    questionId: 'Q033',
    world: 2,
    level: 9,
    question: 'Energi potensial gravitasi sebuah batu 10 kg yang berada di bibir tebing setinggi 15 meter (g = 10 m/s²) adalah...',
    options: {
      A: '1.500 Joule',
      B: '150 Joule',
      C: '750 Joule',
      D: '3.000 Joule'
    },
    correctAnswer: 'A',
    difficulty: 'MEDIUM',
    stage: 'Penerapan',
    explanation: 'Ep = m × g × h = 10 × 10 × 15 = 1.500 Joule.'
  },
  {
    questionId: 'Q034',
    world: 2,
    level: 9,
    question: 'Ketika batu kapur (kalsium karbonat) terkena hujan asam berkepanjangan, reaksi kimia yang terjadi mengakibatkan...',
    options: {
      A: 'Pelapukan kimiawi yang mengikis dan melarutkan permukaan batu',
      B: 'Batu kapur membeku dan berubah menjadi es abadi',
      C: 'Batu memancarkan medan magnet yang sangat kuat',
      D: 'Kandungan emas di dalam batu muncul ke permukaan'
    },
    correctAnswer: 'A',
    difficulty: 'MEDIUM',
    stage: 'Penerapan',
    explanation: 'Asam sulfat/nitrat pada hujan asam bereaksi dengan kalsium karbonat menghasilkan kalsium sulfat larut air dan gas CO2, menyebabkan pelapukan.'
  },
  {
    questionId: 'Q035',
    world: 2,
    level: 9,
    question: 'Dalam basis data relasional, sebuah kolom unik yang digunakan untuk membedakan setiap baris data tanpa duplikasi disebut...',
    options: {
      A: 'Primary Key',
      B: 'Foreign Key',
      C: 'Index Column',
      D: 'Composite View'
    },
    correctAnswer: 'A',
    difficulty: 'MEDIUM',
    stage: 'Penerapan',
    explanation: 'Primary Key adalah kunci unik utama pada tabel yang menjamin setiap entitas tercatat secara tunggal dan tidak ambigu.'
  },
  {
    questionId: 'Q036',
    world: 2,
    level: 9,
    question: 'Benda bermassa 2 kg dilempar vertikal ke atas dengan kecepatan awal 20 m/s. Tinggi maksimum yang dicapai (g = 10 m/s²) adalah...',
    options: {
      A: '20 meter',
      B: '40 meter',
      C: '10 meter',
      D: '25 meter'
    },
    correctAnswer: 'A',
    difficulty: 'MEDIUM',
    stage: 'Penerapan',
    explanation: 'h_max = (v0)² / (2g) = (20)² / (2 × 10) = 400 / 20 = 20 meter.'
  },
  // Level 10: Boss Battle 2 - Mountain Titan (Urutan: Pengetahuan, Penerapan, HOTS + cadangan)
  {
    questionId: 'Q037',
    world: 2,
    level: 10,
    question: '[BOSS Q1] Jenis batuan beku ekstrusif yang terbentuk dari lava gunung berapi yang membeku sangat cepat di permukaan tanah adalah...',
    options: {
      A: 'Batu Basalt dan Andesit',
      B: 'Batu Marmer',
      C: 'Batu Gamping',
      D: 'Batu Bara'
    },
    correctAnswer: 'A',
    difficulty: 'BOSS',
    stage: 'Pengetahuan',
    isBossQuestion: true,
    explanation: 'Lava yang keluar saat erupsi mendingin cepat di udara terbuka membentuk batuan beku luar/efusif seperti basalt dan andesit.'
  },
  {
    questionId: 'Q038',
    world: 2,
    level: 10,
    question: '[BOSS Q2] Sebuah dongkrak hidrolik memiliki penampang kecil 10 cm² dan penampang besar 200 cm². Jika penampang kecil diberi gaya 50 N, gaya angkat yang dihasilkan pada penampang besar adalah...',
    options: {
      A: '1.000 Newton',
      B: '500 Newton',
      C: '2.000 Newton',
      D: '250 Newton'
    },
    correctAnswer: 'A',
    difficulty: 'BOSS',
    stage: 'Penerapan',
    isBossQuestion: true,
    explanation: 'Hukum Pascal: F1/A1 = F2/A2 => 50/10 = F2/200 => 5 = F2/200 => F2 = 1.000 Newton.'
  },
  {
    questionId: 'Q039',
    world: 2,
    level: 10,
    question: '[BOSS Q3] Bagaimana pembangunan jalur tambang terbuka di lereng gunung curam dapat memicu erosi berantai dan mengubah tata kelola air tanah di lembah?',
    options: {
      A: 'Pengupasan lapisan pucuk tanah (topsoil) mematikan infiltrasi air, memperbesar limpasan permukaan (runoff), dan mengeringkan mata air alami',
      B: 'Aktivitas alat berat meningkatkan gravitasi gunung sehingga air ditarik ke puncak',
      C: 'Debu tambang menyebabkan awan hujan berhenti turun di lereng gunung',
      D: 'Lereng batu menjadi lebih kokoh karena terkena getaran peledakan terus-menerus'
    },
    correctAnswer: 'A',
    difficulty: 'BOSS',
    stage: 'HOTS',
    isBossQuestion: true,
    explanation: 'Tanpa vegetasi dan topsoil, air hujan tidak dapat meresap menjadi air tanah (infiltrasi), menimbulkan banjir lumpur di lembah dan krisis air di musim kemarau.'
  },
  {
    questionId: 'Q040',
    world: 2,
    level: 10,
    question: '[BOSS CADANGAN] Jika tekanan gas di dalam kawah tertutup meningkat 2 kali lipat sementara suhunya dijaga konstan, maka volume gas tersebut menurut Hukum Boyle akan...',
    options: {
      A: 'Menyusut menjadi setengah dari volume awal',
      B: 'Mengembang menjadi 2 kali lipat',
      C: 'Tetap tidak berubah sama sekali',
      D: 'Menghilang seketika'
    },
    correctAnswer: 'A',
    difficulty: 'BOSS',
    stage: 'Penerapan',
    isBossQuestion: true,
    explanation: 'Hukum Boyle: P × V = konstan (pada T konstan). Jika tekanan P naik 2× lipat, maka volume V menyusut menjadi 1/2 kali.'
  },

  // ==========================================
  // WORLD 3: LOGIC OCEAN (Levels 11 - 15)
  // Tema: Analisis dan Penalaran, Ekosistem Pesisir & Sungai, Logika Algoritma
  // ==========================================
  {
    questionId: 'Q041',
    world: 3,
    level: 11,
    question: 'Hutan Mangrove di muara Sungai Mahakam dan pesisir Kalimantan memiliki peran analisis penting dalam rantai makanan sebagai...',
    options: {
      A: 'Produsen utama dan tempat pembibitan (nursery ground) bagi biota laut muda',
      B: 'Konsumen tersier yang memakan hiu dan lumba-lumba',
      C: 'Parasit yang menghisap mineral dari terumbu karang',
      D: 'Penghalang utama oksigen agar tidak masuk ke perairan'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Analisis',
    explanation: 'Mangrove menyediakan detritus organik bergizi tinggi dan jalinan akar napas yang aman bagi telur serta anakan ikan/udang untuk tumbuh.'
  },
  {
    questionId: 'Q042',
    world: 3,
    level: 11,
    question: 'Perhatikan algoritma: Nilai A = 10, B = 20. Kemudian A = A + B, B = A - B, A = A - B. Nilai akhir dari A dan B sekarang adalah...',
    options: {
      A: 'A = 20, B = 10 (Nilai berhasil ditukar)',
      B: 'A = 10, B = 20 (Nilai tetap sama)',
      C: 'A = 30, B = 20',
      D: 'A = 30, B = 30'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Analisis',
    explanation: 'A = 10+20=30. B = 30-20=10. A = 30-10=20. Ini adalah algoritma klasik pertukaran nilai dua variabel tanpa variabel penampung sementara.'
  },
  {
    questionId: 'Q043',
    world: 3,
    level: 11,
    question: 'Kapal selam dapat menyelam dan mengapung di lautan dengan menerapkan analisis Hukum Archimedes melalui mekanisme...',
    options: {
      A: 'Mengatur pengisian dan pengosongan air laut pada tangki pemberat (ballast tank)',
      B: 'Memutar baling-baling kapal secara terbalik untuk menyedot air',
      C: 'Membuka jendela kapal agar air masuk secara bertahap',
      D: 'Mengganti logam dinding kapal dengan bahan karet khusus saat di dalam laut'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Analisis',
    explanation: 'Dengan mengisi tangki ballast dengan air, massa jenis rata-rata kapal bertambah sehingga kapal tenggelam; memompa udara keluar membuat kapal mengapung kembali.'
  },
  {
    questionId: 'Q044',
    world: 3,
    level: 11,
    question: 'Pesut Mahakam (Orcaella brevirostris) adalah mamalia air tawar unik di Kalimantan Timur. Hewan ini bernapas menggunakan...',
    options: {
      A: 'Paru-paru dengan sesekali muncul ke permukaan air',
      B: 'Insang seperti ikan salmon',
      C: 'Lapisan kulit basah secara difusi langsung',
      D: 'Kantung udara di dalam sirip dada'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Analisis',
    explanation: 'Pesut adalah mamalia ordo Cetacea yang bernapas dengan paru-paru melalui lubang tiup (blowhole) di atas kepalanya.'
  },
  {
    questionId: 'Q045',
    world: 3,
    level: 12,
    question: 'Jika pernyataan: "Semua terumbu karang membutuhkan sinar matahari" bernilai BENAR, dan "Karang X hidup di palung laut tanpa cahaya" juga BENAR, maka kesimpulan logisnya adalah...',
    options: {
      A: 'Karang X bukanlah terumbu karang berfotosintesis (bukan karang hermatipik)',
      B: 'Karang X pasti akan menghasilkan mutiara bercahaya',
      C: 'Pernyataan pertama terbukti salah secara mutlak',
      D: 'Semua hewan laut di palung tidak membutuhkan oksigen'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Analisis',
    explanation: 'Penalaran silogisme: Karena terumbu karang dangkal bersimbiosis dengan alga zooxanthellae yang butuh sinar matahari, karang laut dalam memiliki adaptasi non-fotosintetik yang berbeda.'
  },
  {
    questionId: 'Q046',
    world: 3,
    level: 12,
    question: 'Dalam struktur data, prinsip penyimpanan elemen LIFO (Last In First Out) digunakan oleh...',
    options: {
      A: 'Stack (Tumpukan)',
      B: 'Queue (Antrean)',
      C: 'Graph (Grafik Jaringan)',
      D: 'Binary Search Tree'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Analisis',
    explanation: 'Stack menerapkan prinsip LIFO, di mana data terakhir yang dimasukkan (push) adalah data pertama yang dikeluarkan (pop).'
  },
  {
    questionId: 'Q047',
    world: 3,
    level: 12,
    question: 'Fenomena pemutihan karang (coral bleaching) di lautan secara ilmiah disebabkan oleh...',
    options: {
      A: 'Kenaikan suhu air laut yang memaksa alga simbion (zooxanthellae) keluar dari jaringan karang',
      B: 'Tumpahan garam berlebih akibat penguapan air di kutub',
      C: 'Karang membersihkan diri secara berkala setiap musim semi',
      D: 'Biota laut memakan pigmen warna karang sebagai makanan pokok'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Analisis',
    explanation: 'Stres termal akibat pemanasan global membuat alga simbiotik fotosintetik lepas dari karang, menyisakan rangka kalsium karbonat putih rentan mati.'
  },
  {
    questionId: 'Q048',
    world: 3,
    level: 12,
    question: 'Berapakah nilai biner dari bilangan desimal 45?',
    options: {
      A: '101101',
      B: '110011',
      C: '100101',
      D: '111001'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Analisis',
    explanation: '45 = 32 + 8 + 4 + 1 = 2⁵ + 2³ + 2² + 2⁰ => dalam biner: 101101₂.'
  },
  {
    questionId: 'Q049',
    world: 3,
    level: 13,
    question: 'Analisis jaring-jaring makanan laut: Fitoplankton -> Udang Kecil -> Ikan Tuna -> Hiu. Jika fitoplankton tercemar mikroplastik, konsentrasi racun tertinggi akan terakumulasi pada...',
    options: {
      A: 'Hiu (akibat proses Biomagnifikasi)',
      B: 'Fitoplankton',
      C: 'Udang Kecil',
      D: 'Semua organisme memiliki kadar yang persis sama'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Analisis',
    explanation: 'Biomagnifikasi menyebabkan polutan non-biodegradable terakumulasi semakin pekat pada tingkatan trofik puncak rantai makanan.'
  },
  {
    questionId: 'Q050',
    world: 3,
    level: 13,
    question: 'Sebuah fungsi rekursif f(n) didefinisikan: f(1) = 2, f(n) = 2 × f(n-1) + 1 untuk n > 1. Berapakah nilai dari f(4)?',
    options: {
      A: '23',
      B: '15',
      C: '31',
      D: '19'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Analisis',
    explanation: 'f(1)=2. f(2)=2(2)+1=5. f(3)=2(5)+1=11. f(4)=2(11)+1=23.'
  },
  {
    questionId: 'Q051',
    world: 3,
    level: 13,
    question: 'Mengapa air laut memiliki titik beku lebih rendah daripada air murni sungai pegunungan?',
    options: {
      A: 'Kandungan ion garam terlarut mengganggu pembentukan kisi kristal es (penurunan titik beku)',
      B: 'Air laut terus bergerak sehingga molekulnya tidak bisa diam',
      C: 'Suhu matahari di atas lautan selalu lebih panas',
      D: 'Massa jenis air laut lebih kecil daripada es murni'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Analisis',
    explanation: 'Sifat koligatif larutan: zat terlarut (NaCl dan mineral) menurunkan titik beku larutan di bawah 0°C (sekitar -2°C untuk air laut).'
  },
  {
    questionId: 'Q052',
    world: 3,
    level: 13,
    question: 'Protokol internet yang memastikan paket data terkirim secara berurutan, andal, dan bebas kesalahan (reliable) adalah...',
    options: {
      A: 'TCP (Transmission Control Protocol)',
      B: 'UDP (User Datagram Protocol)',
      C: 'ICMP',
      D: 'DNS'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Analisis',
    explanation: 'TCP menggunakan sistem 3-way handshake dan acknowledgment untuk menjamin setiap paket data tiba dengan utuh dan teratur.'
  },
  {
    questionId: 'Q053',
    world: 3,
    level: 14,
    question: 'Sebuah wadah berisi 12 bola bernomor 1 sampai 12. Peluang terambilnya bola bernomor bilangan prima atau kelipatan 4 adalah...',
    options: {
      A: '2/3',
      B: '1/2',
      C: '5/12',
      D: '3/4'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Analisis',
    explanation: 'Prima: {2, 3, 5, 7, 11} (5 bola). Kelipatan 4: {4, 8, 12} (3 bola). Karena saling lepas (irisan kosong): Total = 5 + 3 = 8 bola. Peluang = 8/12 = 2/3.'
  },
  {
    questionId: 'Q054',
    world: 3,
    level: 14,
    question: 'Analisislah dampak intrusi air laut ke dalam akuifer air tanah di pemukiman pesisir Kalimantan yang disebabkan oleh...',
    options: {
      A: 'Pengambilan air tanah dangkal secara berlebihan melampaui debit pengisian alaminya',
      B: 'Penanaman bibit pohon mangrove yang terlalu rapat di pantai',
      C: 'Pasang surut air laut yang berlangsung setiap 12 jam',
      D: 'Pembangunan dermaga terapung nelayan tradisional'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Analisis',
    explanation: 'Penyedotan air tanah berlebih menurunkan tinggi kerucut muka air tanah sehingga air asin laut menyusup masuk mencemari sumur air bersih warga.'
  },
  {
    questionId: 'Q055',
    world: 3,
    level: 14,
    question: 'Kompleksitas waktu (Big-O) terbaik dari algoritma pencarian Binary Search pada array terurut berukuran N elemen adalah...',
    options: {
      A: 'O(1) saat elemen berada tepat di posisi tengah pada iterasi pertama',
      B: 'O(N) untuk seluruh kasus',
      C: 'O(N log N) secara konstan',
      D: 'O(N²)'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Analisis',
    explanation: 'Best case Binary Search adalah O(1) ketika nilai yang dicari tepat berada di indeks tengah pertama kali diperiksa.'
  },
  {
    questionId: 'Q056',
    world: 3,
    level: 14,
    question: 'Mengapa hewan laut dalam seperti gurita bercahaya menggunakan bioluminesensi sebagai strategi bertahan hidup?',
    options: {
      A: 'Untuk menarik mangsa, berkomunikasi, dan menyamarkan bayangan tubuh (counter-illumination)',
      B: 'Untuk memanaskan air laut di sekelilingnya agar tidak membeku',
      C: 'Sebagai cadangan oksigen yang disimpan dalam bentuk cahaya',
      D: 'Untuk mengusir sinar matahari yang menembus palung'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Analisis',
    explanation: 'Bioluminesensi luciferase menghasilkan cahaya dingin yang digunakan untuk memikat mangsa, mengenali pasangan, atau memecah siluet tubuh dari predator bawah.'
  },
  // Level 15: Boss Battle 3 - Deep Sea Kraken (Urutan: Pengetahuan, Penerapan, HOTS + cadangan)
  {
    questionId: 'Q057',
    world: 3,
    level: 15,
    question: '[BOSS Q1] Bagian mata biota laut atau sistem sonar kapal yang digunakan mendeteksi pantulan gelombang suara di bawah air beroperasi berdasarkan asas...',
    options: {
      A: 'Ekolokasi dan Pantulan Gelombang Ultrasonik',
      B: 'Gelombang Radio Frekuensi Sangat Tinggi (VHF)',
      C: 'Radiasi Sinar Gamma',
      D: 'Pembiasan Cahaya Polarisasi'
    },
    correctAnswer: 'A',
    difficulty: 'BOSS',
    stage: 'Pengetahuan',
    isBossQuestion: true,
    explanation: 'Sonar (Sound Navigation and Ranging) memancarkan pulsa suara ultrasonik dan menganalisis gema pantulannya untuk memetakan rintangan di laut.'
  },
  {
    questionId: 'Q058',
    world: 3,
    level: 15,
    question: '[BOSS Q2] Sebuah kapal riset memancarkan sinyal sonar ke dasar samudra dan menerima pantulannya 4 detik kemudian. Jika cepat rambat bunyi di air laut adalah 1.500 m/s, kedalaman samudra tersebut adalah...',
    options: {
      A: '3.000 meter',
      B: '6.000 meter',
      C: '1.500 meter',
      D: '750 meter'
    },
    correctAnswer: 'A',
    difficulty: 'BOSS',
    stage: 'Penerapan',
    isBossQuestion: true,
    explanation: 'Kedalaman = (v × t) / 2 = (1.500 × 4) / 2 = 6.000 / 2 = 3.000 meter.'
  },
  {
    questionId: 'Q059',
    world: 3,
    level: 15,
    question: '[BOSS Q3] Bagaimana eutrofikasi dari limbah pupuk nitrogen di muara sungai dapat memicu timbulnya "Zona Mati" (Dead Zone) tanpa kehidupan hewani di laut lepas?',
    options: {
      A: 'Ledakan alga masif menghabiskan nutrisi lalu mati; dekomposisi jutaan bangkai alga oleh bakteri menyedot habis seluruh oksigen terlarut (anoksia)',
      B: 'Alga beracun menyerap seluruh air laut hingga mengering secara mendadak',
      C: 'Pupuk nitrogen menarik predator darat untuk berenang dan memburu ikan laut',
      D: 'Lapisan alga memblokir rotasi arus laut global'
    },
    correctAnswer: 'A',
    difficulty: 'BOSS',
    stage: 'HOTS',
    isBossQuestion: true,
    explanation: 'Dekomposisi biomasa alga pasca algal bloom memicu hipoksia ekstrem (kadar oksigen < 2 mg/L), sehingga ikan dan biota laut lainnya mati lemas.'
  },
  {
    questionId: 'Q060',
    world: 3,
    level: 15,
    question: '[BOSS CADANGAN] Sebuah tabel basis data relasional memiliki ketergantungan transitif. Proses dekomposisi tabel tersebut ke dalam bentuk normal ketiga (3NF) bertujuan untuk...',
    options: {
      A: 'Menghilangkan redundansi data dan anomali saat manipulasi (insert/update/delete)',
      B: 'Membuat ukuran file basis data berlipat ganda secara otomatis',
      C: 'Mencegah siswa mengakses komputer laboratorium',
      D: 'Mengganti seluruh angka dengan kode biner murni'
    },
    correctAnswer: 'A',
    difficulty: 'BOSS',
    stage: 'Analisis',
    isBossQuestion: true,
    explanation: 'Normalisasi hingga bentuk 3NF menghapus ketergantungan fungsional non-kunci terhadap non-kunci lain demi konsistensi dan integritas data.'
  },

  // ==========================================
  // WORLD 4: MYSTERY DESERT (Levels 16 - 20)
  // Tema: Soal HOTS (Higher Order Thinking Skills), Pemecahan Masalah Kompleks, Evaluasi
  // ==========================================
  {
    questionId: 'Q061',
    world: 4,
    level: 16,
    question: 'Di wilayah bekas tambang terbuka yang gersang mirip gurun di Kalimantan (Danau Kaolin), air danau sering berwarna biru toska cerah namun tidak dihuni ikan. Faktor kritis penyebab fenomena ini adalah...',
    options: {
      A: 'Kadar keasaman sangat ekstrem (pH < 4) dan kandungan logam berat terlarut tinggi yang toksik bagi organisme',
      B: 'Suhu air danau selalu berada di atas titik didih air secara alami',
      C: 'Ikan air tawar tidak menyukai air yang berwarna indah dan jernih',
      D: 'Danau tersebut terhubung langsung ke inti magma bumi'
    },
    correctAnswer: 'A',
    difficulty: 'HOTS',
    stage: 'HOTS',
    explanation: 'Air asam tambang (Acid Mine Drainage) melarutkan mineral sulfida dan logam berat beracun, menjadikannya jernih kebiruan karena tidak ada mikroorganisme dan alga yang sanggup hidup.'
  },
  {
    questionId: 'Q062',
    world: 4,
    level: 16,
    question: 'Sebuah sistem panel surya pintar di padang pasir mengoptimalkan sudut kemiringan mengikuti gerak semu harian matahari. Algoritma optimal untuk melacak efisiensi daya maksimum (MPPT) harus memprioritaskan...',
    options: {
      A: 'Evaluasi berkelanjutan terhadap arus (I) dan tegangan (V) titik puncak daya (P = V × I)',
      B: 'Mematikan panel setiap kali awan tipis melintas di atas sensor',
      C: 'Memutar panel ke arah angin terkuat untuk mendinginkan sel fotovoltaik',
      D: 'Mengunci posisi sudut tepat tegak lurus jam 12 sepanjang hari'
    },
    correctAnswer: 'A',
    difficulty: 'HOTS',
    stage: 'HOTS',
    explanation: 'MPPT (Maximum Power Point Tracking) menghitung produk tegangan dan arus secara real-time untuk memastikan daya listrik fotovoltaik selalu optimal.'
  },
  {
    questionId: 'Q063',
    world: 4,
    level: 16,
    question: 'Manakah dari strategi rekayasa ekologi berikut yang paling efektif merevitalisasi lahan kritis tandus berpasir menjadi hutan produktif berkelanjutan?',
    options: {
      A: 'Inokulasi mikoriza pada tanah, penanaman legum penambat nitrogen (pioneer), lalu reboisasi spesies lokal bertahap',
      B: 'Menyiram lahan dengan jutaan liter air garam setiap pagi hari',
      C: 'Membakar seluruh rumput kering agar abu menjadi lapisan pelindung pasir',
      D: 'Menebar bibit pohon jati tanpa perbaikan struktur bahan organik tanah'
    },
    correctAnswer: 'A',
    difficulty: 'HOTS',
    stage: 'HOTS',
    explanation: 'Suksesi terarah membutuhkan simbiotik fungi mikoriza dan tanaman penambat nitrogen untuk membentuk topsoil subur sebelum tanaman kanopi dapat bertahan.'
  },
  {
    questionId: 'Q064',
    world: 4,
    level: 16,
    question: 'Sebuah enkripsi kunci publik (Asymmetric Cryptography seperti RSA) menjamin integritas dan kerahasiaan pesan melalui prinsip matematika...',
    options: {
      A: 'Kesulitan komputasi memfaktorkan perkalian dua bilangan prima yang sangat besar',
      B: 'Menyembunyikan kata kunci di dalam tabel perkalian angka 1 sampai 10',
      C: 'Mengacak urutan abjad dengan menggeser 3 huruf ke kanan seperti sandi Caesar',
      D: 'Menghapus seluruh vokal di dalam pesan rahasia'
    },
    correctAnswer: 'A',
    difficulty: 'HOTS',
    stage: 'HOTS',
    explanation: 'RSA mengandalkan sifat "one-way function" di mana mengalikan dua bilangan prima raksasa sangat mudah, namun memfaktorkannya kembali membutuhkan waktu miliaran tahun komputasi.'
  },
  {
    questionId: 'Q065',
    world: 4,
    level: 17,
    question: 'Dalam mengevaluasi kebenaran sebuah informasi berita digital (literasi digital anti-hoaks), langkah metodologis paling sahih adalah...',
    options: {
      A: 'Memverifikasi kredibilitas sumber primer, memeriksa data faktual silang, dan menganalisis rekam jejak independen penyaji berita',
      B: 'Melihat seberapa banyak tanda seru dan huruf kapital yang digunakan penulis',
      C: 'Mempercayai informasi apabila pesan tersebut sudah diteruskan berkali-kali di grup perpesanan',
      D: 'Memilih berita yang hanya memvalidasi opini pribadi awal tanpa verifikasi'
    },
    correctAnswer: 'A',
    difficulty: 'HOTS',
    stage: 'HOTS',
    explanation: 'Evaluasi kritis informasi memerlukan triangulasi sumber primer, cek fakta lembaga independen, dan skeptisisme ilmiah terhadap konten sensasional.'
  },
  {
    questionId: 'Q066',
    world: 4,
    level: 17,
    question: 'Sebuah tangki penampungan air di padang pasir bocor. Debit air keluar berkurang secara proporsional terhadap akar kuadrat tinggi air tersisa (Hukum Torricelli). Implikasi fisika dari kondisi ini adalah...',
    options: {
      A: 'Laju pengurangan volume air di awal kebocoran jauh lebih deras dibanding saat air hampir habis',
      B: 'Air akan mengalir dengan laju konstan sempurna dari awal hingga kosong',
      C: 'Kebocoran akan berhenti mendadak saat air masih terisi setengahnya',
      D: 'Tinggi air di dalam tangki tidak mempengaruhi laju semprotan air'
    },
    correctAnswer: 'A',
    difficulty: 'HOTS',
    stage: 'HOTS',
    explanation: 'Kecepatan semprotan v = √(2gh). Saat tangki penuh (h tinggi), tekanan hidrostatis dan laju semprotan maksimum; saat h menurun, aliran melambat secara non-linear.'
  },
  {
    questionId: 'Q067',
    world: 4,
    level: 17,
    question: 'Manakah dari arsitektur perangkat lunak berikut yang paling tahan terhadap kegagalan titik tunggal (Single Point of Failure / SPOF)?',
    options: {
      A: 'Sistem Terdistribusi dengan replikasi multi-node dan mekanisme konsensus terdesentralisasi',
      B: 'Aplikasi monolitik tunggal yang di-hosting di satu komputer server lokal',
      C: 'Sistem yang seluruh datanya hanya tersimpan pada satu flashdisk admin',
      D: 'Arsitektur klien-server klasik tanpa server cadangan'
    },
    correctAnswer: 'A',
    difficulty: 'HOTS',
    stage: 'HOTS',
    explanation: 'Sistem terdistribusi dengan redundansi data dan algoritma konsensus menjamin sistem tetap beroperasi normal bahkan jika beberapa server node mengalami crash.'
  },
  {
    questionId: 'Q068',
    world: 4,
    level: 17,
    question: 'Seorang petani cerdas merancang irigasi tetes bertenaga surya. Jika efisiensi air irigasi tetes mencapai 90% sedangkan irigasi konvensional hanya 45%, maka untuk kebutuhan 1.800 liter air tanaman, penghematan air yang dicapai adalah...',
    options: {
      A: '2.000 liter air berhasil dihemat',
      B: '500 liter air berhasil dihemat',
      C: '1.000 liter air berhasil dihemat',
      D: '1.800 liter air berhasil dihemat'
    },
    correctAnswer: 'A',
    difficulty: 'HOTS',
    stage: 'HOTS',
    explanation: 'Konvensional butuh: 1.800 / 0,45 = 4.000 liter. Irigasi tetes butuh: 1.800 / 0,90 = 2.000 liter. Penghematan = 4.000 - 2.000 = 2.000 liter air.'
  },
  {
    questionId: 'Q069',
    world: 4,
    level: 18,
    question: 'Di ekosistem gurun atau lahan kering, tumbuhan seperti kaktus mengadopsi metabolisme CAM (Crassulacean Acid Metabolism). Keunggulan adaptasi ini adalah...',
    options: {
      A: 'Membuka stomata hanya pada malam hari untuk menyerap CO2 guna meminimalkan transpirasi air di siang terik',
      B: 'Menghentikan proses fotosintesis selamanya dan hidup dari memakan debu gurun',
      C: 'Menghasilkan lapisan es di permukaan daun saat siang hari',
      D: 'Menggandakan laju penguapan air agar sel tanaman tetap dingin'
    },
    correctAnswer: 'A',
    difficulty: 'HOTS',
    stage: 'HOTS',
    explanation: 'Tanaman CAM mengikat CO2 menjadi asam malat pada malam hari saat kelembapan lebih tinggi, lalu mengolahnya dengan fotosintesis saat stomata tertutup rapat di siang hari.'
  },
  {
    questionId: 'Q070',
    world: 4,
    level: 18,
    question: 'Diberikan premis: Jika model Machine Learning overfitting, maka model memiliki akurasi sangat tinggi pada data latih namun buruk pada data uji. Berdasarkan evaluasi ini, solusi paling tepat adalah...',
    options: {
      A: 'Menerapkan teknik regularisasi (L1/L2), Dropout, atau menambah diversitas data pelatihan',
      B: 'Menghapus data uji dan melatih ulang dengan data latih yang sama berulang kali',
      C: 'Memperbanyak jumlah layer hingga triliunan neuron tanpa batasan',
      D: 'Mengabaikan hasil data uji karena data latih sudah sempurna'
    },
    correctAnswer: 'A',
    difficulty: 'HOTS',
    stage: 'HOTS',
    explanation: 'Overfitting terjadi ketika model menghafal noise data latih. Solusinya adalah regularisasi, pruning, dropout, dan augmentasi data agar generalisasi model meningkat.'
  },
  {
    questionId: 'Q071',
    world: 4,
    level: 18,
    question: 'Sebuah jembatan gantung di atas ngarai padang pasir berguncang hebat hingga runtuh akibat hembusan angin sepoi-sepoi dengan frekuensi tertentu. Teori fisika yang menjelaskan bencana ini adalah...',
    options: {
      A: 'Resonansi mekanik (frekuensi alami jembatan bertepatan dengan frekuensi pusaran angin)',
      B: 'Perubahan massa gravitasi bumi secara mendadak di atas ngarai',
      C: 'Kekuatan gesek udara yang melarutkan baut jembatan menjadi gas',
      D: 'Baja jembatan menyusut akibat sinar ultraviolet'
    },
    correctAnswer: 'A',
    difficulty: 'HOTS',
    stage: 'HOTS',
    explanation: 'Resonansi terjadi saat frekuensi dorongan eksternal menyamai frekuensi natural struktur, menyebabkan amplitudo getaran membesar tak terkendali (seperti tragedi Jembatan Tacoma Narrows).'
  },
  {
    questionId: 'Q072',
    world: 4,
    level: 18,
    question: 'Dalam desain antarmuka pengguna (UI/UX), prinsip aksesibilitas WCAG (Web Content Accessibility Guidelines) mewajibkan rasio kontras warna teks terhadap latar belakang minimal 4,5 : 1 bertujuan untuk...',
    options: {
      A: 'Memastikan keterbacaan teks yang inklusif bagi pengguna dengan keterbatasan penglihatan atau gangguan persepsi warna',
      B: 'Menghemat konsumsi baterai layar monitor secara signifikan',
      C: 'Membuat halaman situs terlihat kuno dan membosankan',
      D: 'Mempercepat kecepatan internet pemrosesan server'
    },
    correctAnswer: 'A',
    difficulty: 'HOTS',
    stage: 'HOTS',
    explanation: 'Kontras minimal 4,5:1 adalah standar internasional aksesibilitas agar teks dapat dibaca dengan jelas oleh penyandang buta warna parsial dan pengguna dengan gangguan penglihatan.'
  },
  {
    questionId: 'Q073',
    world: 4,
    level: 19,
    question: 'Evaluasilah mengapa teknologi pengomposan anaerobik (tanpa oksigen) yang tidak terkelola dengan baik pada tempat pembuangan sampah dapat memperparah krisis iklim global dibanding dekomposisi aerobik?',
    options: {
      A: 'Proses anaerobik menghasilkan gas Metana (CH4) yang potensi pemanasan globalnya (GWP) lebih dari 28 kali lebih kuat dibanding CO2',
      B: 'Bakteri anaerobik melepaskan radiasi nuklir tingkat rendah',
      C: 'Metana mendinginkan atmosfer sehingga tumbuhan mati membeku',
      D: 'Dekomposisi anaerobik menyerap seluruh air hujan di planet bumi'
    },
    correctAnswer: 'A',
    difficulty: 'HOTS',
    stage: 'HOTS',
    explanation: 'Metana adalah gas rumah kaca poten dengan potensi pemanasan jangka pendek puluhan kali lebih masif dibanding karbon dioksida bila dibiarkan terlepas ke udara tanpa dibakar/ditangkap.'
  },
  {
    questionId: 'Q074',
    world: 4,
    level: 19,
    question: 'Sebuah algoritma rute terpendek (Dijkstra) digunakan memandu robot penjelajah gurun. Jika graf rute memiliki bobot tepi negatif, mengapa algoritma Dijkstra tidak dapat menjamin solusi optimal?',
    options: {
      A: 'Dijkstra mengasumsikan simpul yang sudah dikunjungi memiliki jarak permanen terkecil, asumsi yang runtuh bila ada pengurangan bobot negatif',
      B: 'Dijkstra hanya bisa berjalan pada graf yang memiliki tepat 3 simpul',
      C: 'Komputer akan kehabisan memori secara matematis saat membaca angka minus',
      D: 'Robot penjelajah tidak diizinkan bergerak mundur secara hukum fisika'
    },
    correctAnswer: 'A',
    difficulty: 'HOTS',
    stage: 'HOTS',
    explanation: 'Algoritma Dijkstra bersifat greedy: begitu simpul ditandai final, jaraknya tidak pernah diperbarui lagi. Kasus bobot negatif harus diselesaikan dengan Algoritma Bellman-Ford.'
  },
  {
    questionId: 'Q075',
    world: 4,
    level: 19,
    question: 'Mengapa pembuktian identitas menggunakan Zero-Knowledge Proof (ZKP) dalam sistem keamanan modern dianggap terobosan revolusioner?',
    options: {
      A: 'Pihak pembuktian dapat meyakinkan pihak verifikator bahwa suatu pernyataan benar tanpa membocorkan rahasia data aslinya sama sekali',
      B: 'Sistem tidak memerlukan algoritma sandi apapun dan mengandalkan kepercayaan murni',
      C: 'Pengguna tidak perlu memiliki akun dan identitas apapun di internet',
      D: 'Sandi diubah menjadi teks biasa agar mudah dibaca oleh semua orang'
    },
    correctAnswer: 'A',
    difficulty: 'HOTS',
    stage: 'HOTS',
    explanation: 'Zero-Knowledge Proof memungkinkan pembuktian kebenaran (misal: "saya tahu password") tanpa mengekspos informasi sensitif tersebut kepada siapapun dalam transaksi.'
  },
  {
    questionId: 'Q076',
    world: 4,
    level: 19,
    question: 'Di tengah cuaca terik gurun pasir, fenomena fatamorgana optik di mana jalanan tampak seperti berair disebabkan oleh...',
    options: {
      A: 'Pembiasan cahaya (refraksi) bertingkat pada lapisan udara panas di permukaan jalan yang kerapatannya lebih renggang dibanding udara di atasnya',
      B: 'Mata manusia mengalami halusinasi akibat kehausan tanpa dasar fisika',
      C: 'Uap air di bawah aspal mendidih dan membentuk cermin cair',
      D: 'Pantulan bayangan awan dari satelit luar angkasa'
    },
    correctAnswer: 'A',
    difficulty: 'HOTS',
    stage: 'HOTS',
    explanation: 'Gradien suhu menyebabkan indeks bias udara dekat aspal mengecil, membelokkan sinar langit ke atas mata pengamat hingga tampak seperti genangan air yang memantulkan langit.'
  },
  // Level 20: Boss Battle 4 - Desert Sphinx (Urutan: Pengetahuan, Penerapan, HOTS + cadangan)
  {
    questionId: 'Q077',
    world: 4,
    level: 20,
    question: '[BOSS Q1] Prinsip Termodinamika II menyatakan bahwa dalam sistem tertutup yang terisolasi, nilai entropi (derajat ketidakteraturan) akan selalu...',
    options: {
      A: 'Cenderung meningkat atau konstan menuju kesetimbangan termal',
      B: 'Menurun drastis hingga mencapai nol absolut secara spontan',
      C: 'Berubah menjadi energi kinetik tanpa ada kalor yang hilang',
      D: 'Kembali ke keadaan awal tanpa memerlukan usaha luar'
    },
    correctAnswer: 'A',
    difficulty: 'BOSS',
    stage: 'Pengetahuan',
    isBossQuestion: true,
    explanation: 'Hukum II Termodinamika menyatakan bahwa entropi total alam semesta selalu bertambah dalam setiap proses spontan alami (ΔS_alam semesta ≥ 0).'
  },
  {
    questionId: 'Q078',
    world: 4,
    level: 20,
    question: '[BOSS Q2] Sebuah piramida kuno memiliki volume 2.400 m³ dengan alas persegi berukuran sisi 12 meter. Berapakah tinggi tegak piramida tersebut?',
    options: {
      A: '50 meter',
      B: '40 meter',
      C: '60 meter',
      D: '30 meter'
    },
    correctAnswer: 'A',
    difficulty: 'BOSS',
    stage: 'Penerapan',
    isBossQuestion: true,
    explanation: 'Volume limas = (1/3) × Luas Alas × t => 2.400 = (1/3) × (12 × 12) × t => 2.400 = 48 × t => t = 2.400 / 48 = 50 meter.'
  },
  {
    questionId: 'Q079',
    world: 4,
    level: 20,
    question: '[BOSS Q3] Bagaimana strategi mitigasi perubahan iklim berbasis "Nature-based Solutions" (Solusi Berbasis Alam) di ekosistem lahan basah dan gambut tropis Borneo lebih berkelanjutan dibanding rekayasa geo-engineering kimiawi?',
    options: {
      A: 'Restorasi hidrologi gambut mempertahankan stok karbon purba ribuan tahun, menjaga biodiversitas endemik, serta menyediakan mata pencaharian ramah lingkungan bagi masyarakat adat secara lestari',
      B: 'Lahan gambut dapat dibakar secara berkala untuk mengubah karbon menjadi pupuk instan',
      C: 'Tanaman di lahan gambut menyerap seluruh panas matahari sehingga suhu bumi langsung dingin dalam semalam',
      D: 'Teknologi kimia sintetis terbukti tidak membutuhkan energi dan biaya sama sekali'
    },
    correctAnswer: 'A',
    difficulty: 'BOSS',
    stage: 'HOTS',
    isBossQuestion: true,
    explanation: 'Lahan gambut tropis adalah penyimpan karbon terpadat di bumi. Menjaga kebasahannya (rewetting) mencegah kebakaran, emisi gas rumah kaca raksasa, dan melindungi ekosistem holistik.'
  },
  {
    questionId: 'Q080',
    world: 4,
    level: 20,
    question: '[BOSS CADANGAN] Dalam teori komputasi dan kecerdasan buatan, Uji Turing (Turing Test) dirancang untuk menguji apakah...',
    options: {
      A: 'Sebuah mesin cerdas mampu menunjukkan perilaku komunikatif yang tidak dapat dibedakan dari manusia oleh penilai independen',
      B: 'Komputer dapat menghitung perkalian triliunan angka dalam waktu satu mikrodetik',
      C: 'Robot dapat berlari lebih kencang daripada atlet olimpiade',
      D: 'Perangkat keras komputer kebal terhadap virus dan korsleting listrik'
    },
    correctAnswer: 'A',
    difficulty: 'BOSS',
    stage: 'HOTS',
    isBossQuestion: true,
    explanation: 'Turing Test mengukur kapabilitas kecerdasan mesin dalam menghasilkan respon berbahasa alami sedemikian rupa sehingga penguji manusia tidak bisa membedakannya dari respon manusia.'
  },

  // ==========================================
  // WORLD 5: FINAL CASTLE (Levels 21 - 25)
  // Tema: Sintesis Pengetahuan Lintas Bidang & Final Boss 5-Tahap Pertanyaan
  // ==========================================
  {
    questionId: 'Q081',
    world: 5,
    level: 21,
    question: 'Dalam sintesis ilmu pengetahuan alam dan teknologi, konsep biomimikri terbukti menciptakan inovasi besar. Contoh nyata penerapan biomimikri adalah...',
    options: {
      A: 'Desain moncong kereta cepat Shinkansen yang meniru bentuk paruh burung raja udang (kingfisher) untuk meredam dentuman sonik di terowongan',
      B: 'Mengganti seluruh layar komputer dengan daun pisang kering',
      C: 'Membuat mobil dari kayu pohon ulin agar tidak membutuhkan bahan bakar',
      D: 'Mengecat menara pemancar radio dengan warna hijau hutan'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Penerapan',
    explanation: 'Biomimikri meniru solusi desain alam. Paruh kingfisher yang dirancang meluncur halus membelah udara dan air diadopsi untuk meniadakan gelombang tekanan udara kereta Shinkansen.'
  },
  {
    questionId: 'Q082',
    world: 5,
    level: 21,
    question: 'Jika nilai f(x) = 2x² - 3x + 5, berapakah nilai dari f(-3)?',
    options: {
      A: '32',
      B: '14',
      C: '26',
      D: '40'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Penerapan',
    explanation: 'f(-3) = 2(-3)² - 3(-3) + 5 = 2(9) + 9 + 5 = 18 + 9 + 5 = 32.'
  },
  {
    questionId: 'Q083',
    world: 5,
    level: 21,
    question: 'Prinsip kerja motor listrik yang mengubah energi listrik menjadi energi kinetik mekanik didasarkan pada penemuan Gaya Lorentz, yaitu...',
    options: {
      A: 'Kawat berarus listrik di dalam medan magnet akan mengalami gaya dorong magnetik',
      B: 'Panas dari kabel listrik membakar udara sehingga baling-baling berputar',
      C: 'Magnet menarik elektron keluar dari udara bebas tanpa kabel',
      D: 'Listrik statis menghasilkan gaya gravitasi baru'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Analisis',
    explanation: 'F = B × I × L × sin(θ). Interaksi medan magnet B dan arus listrik I memunculkan Gaya Lorentz yang memutar rotor motor.'
  },
  {
    questionId: 'Q084',
    world: 5,
    level: 21,
    question: 'Dalam etika kecerdasan buatan (AI Ethics), bias algoritma (algorithmic bias) paling sering timbul akibat...',
    options: {
      A: 'Data historis pelatihan yang tidak seimbang, mengandung prasangka sosial, atau tidak mewakili keragaman populasi nyata',
      B: 'Komputer terlalu pintar sehingga sengaja memberontak terhadap pembuatnya',
      C: 'Penggunaan bahasa pemrograman yang terlalu modern',
      D: 'Server komputer kehabisan ruang penyimpanan harddisk'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'HOTS',
    explanation: 'Model AI belajar dari data yang diberikan. Bila data latih tidak representatif atau mencerminkan bias historis manusia, model akan mengulang dan memperkuat bias tersebut.'
  },
  {
    questionId: 'Q085',
    world: 5,
    level: 22,
    question: 'Bagaimana keterkaitan erat antara konsep hukum kekekalan energi dan efisiensi konversi daya pada turbin pembangkit listrik tenaga air (PLTA)?',
    options: {
      A: 'Energi potensial air diubah menjadi energi kinetik lalu listrik, namun total daya listrik output selalu lebih kecil dari daya teoritis karena disipasi gesekan dan panas',
      B: 'Turbin air dapat menciptakan energi baru dari ketiadaan sehingga efisiensinya melebihi 150%',
      C: 'Energi air yang mengalir hilang total dan tidak dapat diubah menjadi bentuk lain',
      D: 'Air yang keluar dari turbin kehilangan massa molekulnya secara permanen'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Analisis',
    explanation: 'Hukum Kekekalan Energi: energi tidak dapat diciptakan atau dimusnahkan. Efisiensi nyata selalu < 100% karena adanya rugi-rugi mekanis dan gesekan fluida.'
  },
  {
    questionId: 'Q086',
    world: 5,
    level: 22,
    question: 'Nilai median dari sekumpulan data: 7, 12, 5, 8, 14, 9, 11, 6, 10 adalah...',
    options: {
      A: '9',
      B: '8',
      C: '10',
      D: '9,5'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Penerapan',
    explanation: 'Data diurutkan: 5, 6, 7, 8, 9, 10, 11, 12, 14 (9 data). Nilai tengah berada pada data ke-5, yaitu 9.'
  },
  {
    questionId: 'Q087',
    world: 5,
    level: 22,
    question: 'Penerapan konsep Internet of Things (IoT) pada sistem pertanian presisi (smart farming) memungkinkan efisiensi tinggi melalui...',
    options: {
      A: 'Integrasi sensor kelembapan tanah, cuaca, dan aktuator otomatis yang mengalirkan air dan pupuk sesuai kebutuhan riil tanaman',
      B: 'Penyiraman tanaman dilakukan 24 jam nonstop tanpa henti menggunakan robot',
      C: 'Mengganti bibit padi dengan modul mikrokontroler digital',
      D: 'Menghubungkan daun tanaman langsung ke jaringan WiFi rumah'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'HOTS',
    explanation: 'IoT presisi membaca data telemetri tanah secara real-time dan mengeksekusi irigasi tepat takaran, mencegah pemborosan air dan nutrisi.'
  },
  {
    questionId: 'Q088',
    world: 5,
    level: 22,
    question: 'Pemisahan campuran minyak bumi menjadi fraksi-fraksi seperti LPG, bensin, kerosin, dan aspal dilakukan melalui metode...',
    options: {
      A: 'Distilasi Bertingkat (berdasarkan perbedaan titik didih molekul hidrokarbon)',
      B: 'Filtrasi menggunakan kertas saring mikron',
      C: 'Sentrifugasi putaran tinggi',
      D: 'Kromatografi kertas sederhana'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Pengetahuan',
    explanation: 'Distilasi fraksionasi memisahkan rantai hidrokarbon dalam menara fraksinasi di mana fraksi ringan dengan titik didih rendah menguap ke puncak dan fraksi berat mengendap di dasar.'
  },
  {
    questionId: 'Q089',
    world: 5,
    level: 23,
    question: 'Dua dadu dilempar bersamaan satu kali. Peluang munculnya mata dadu yang berjumlah 9 atau 10 adalah...',
    options: {
      A: '7/36',
      B: '5/36',
      C: '1/6',
      D: '8/36'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Analisis',
    explanation: 'Jumlah 9: (3,6), (4,5), (5,4), (6,3) = 4 pasangan. Jumlah 10: (4,6), (5,5), (6,4) = 3 pasangan. Total kejadian = 4 + 3 = 7. Ruang sampel = 36. Peluang = 7/36.'
  },
  {
    questionId: 'Q090',
    world: 5,
    level: 23,
    question: 'Dalam komputasi awan (Cloud Computing), model layanan di mana penyedia menyediakan infrastruktur hardware dan sistem operasi sementara pengguna mengelola aplikasi dan data adalah...',
    options: {
      A: 'PaaS (Platform as a Service)',
      B: 'SaaS (Software as a Service)',
      C: 'IaaS (Infrastructure as a Service)',
      D: 'BaaS (Backend as a Service)'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Pengetahuan',
    explanation: 'PaaS menyediakan runtime environment, middleware, dan OS (seperti Vercel, Railway, Heroku) sehingga pengembang hanya fokus pada penulisan kode aplikasi.'
  },
  {
    questionId: 'Q091',
    world: 5,
    level: 23,
    question: 'Mengapa prinsip tata kelola data FAIR (Findable, Accessible, Interoperable, Reusable) sangat krusial dalam riset ilmiah dan sistem informasi global?',
    options: {
      A: 'Menjamin transparansi, reproduktifitas penelitian, serta integrasi pertukaran data antar-sistem komputasi yang heterogen secara terbuka',
      B: 'Mencegah orang lain membaca hasil penelitian agar rahasia tidak terbongkar',
      C: 'Mengubah seluruh dokumen riset menjadi format teks tanpa gambar',
      D: 'Mengharuskan setiap ilmuwan menggunakan satu merek laptop yang seragam'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'HOTS',
    explanation: 'Prinsip FAIR memastikan aset data digital dapat ditemukan, diakses, dioperasikan lintas platform mesin dan manusia, serta dapat digunakan kembali untuk kemajuan sains.'
  },
  {
    questionId: 'Q092',
    world: 5,
    level: 23,
    question: 'Suatu rekayasa genetika pada tanaman pangan bertujuan menghasilkan beras emas (Golden Rice). Modifikasi ini secara spesifik bertujuan untuk...',
    options: {
      A: 'Mensintesis beta-karoten (provitamin A) pada endosperma beras untuk mengatasi defisiensi vitamin A anak di negara berkembang',
      B: 'Menjadikan beras berkilau seperti emas mulia untuk dijual mahal',
      C: 'Membuat padi dapat tumbuh subur di dalam air laut murni',
      D: 'Meniadakan kebutuhan beras terhadap sinar matahari'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Pengetahuan',
    explanation: 'Golden Rice disisipi gen biosintesis beta-karoten sehingga menghasilkan beras kaya nutrisi provitamin A guna mencegah kebutaan dan malnutrisi anak.'
  },
  {
    questionId: 'Q093',
    world: 5,
    level: 24,
    question: 'Dalam arsitektur mikroprosesor, hukum Moore (Moore\'s Law) menyatakan kecenderungan bahwa...',
    options: {
      A: 'Jumlah transistor dalam sebuah sirkuit terpadu (IC) berlipat ganda kira-kira setiap dua tahun dengan biaya yang relatif tetap',
      B: 'Ukuran komputer akan membesar 2 kali lipat setiap dekade',
      C: 'Kecepatan internet akan melambat setiap bertambahnya pengguna',
      D: 'Baterai laptop akan habis setelah tepat dua jam pemakaian'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Pengetahuan',
    explanation: 'Diformulasikan oleh Gordon Moore (salah satu pendiri Intel), pengamatan ini menjadi panduan laju eksponensial inovasi industri semikonduktor dunia.'
  },
  {
    questionId: 'Q094',
    world: 5,
    level: 24,
    question: 'Jika x + 1/x = 5, maka nilai dari x² + 1/x² adalah...',
    options: {
      A: '23',
      B: '25',
      C: '27',
      D: '21'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'Analisis',
    explanation: '(x + 1/x)² = x² + 2 + 1/x² = 5² = 25 => x² + 1/x² = 25 - 2 = 23.'
  },
  {
    questionId: 'Q095',
    world: 5,
    level: 24,
    question: 'Konsep ekonomi sirkular (Circular Economy) berupaya menggantikan model ekonomi linear tradisional (Take-Make-Dispose) dengan berfokus pada...',
    options: {
      A: 'Redesain produk berkelanjutan, daur ulang tertutup, perbaikan (repair), dan regenerasi sumber daya alam tanpa menghasilkan limbah akhir (zero waste)',
      B: 'Menimbun barang bekas di tempat pembuangan akhir sedalam mungkin',
      C: 'Menghentikan seluruh transaksi perdagangan digital di dunia',
      D: 'Memproduksi kemasan plastik sekali pakai sebanyak-banyaknya'
    },
    correctAnswer: 'A',
    difficulty: 'HARD',
    stage: 'HOTS',
    explanation: 'Ekonomi sirkular merancang siklus tertutup di mana material terus beredar bernilai guna tinggi tanpa terbuang mencemari biosfer.'
  },

  // ==========================================
  // LEVEL 25: FINAL BOSS — FINAL CASTLE (5 STAGES)
  // Stage 1 (Q1): Pengetahuan (100 poin)
  // Stage 2 (Q2): Pemahaman (100 poin)
  // Stage 3 (Q3): Penerapan (150 poin)
  // Stage 4 (Q4): Analisis (150 poin)
  // Stage 5 (Q5): HOTS (200 poin)
  // Total: 700 poin pertanyaan!
  // ==========================================
  {
    questionId: 'Q096',
    world: 5,
    level: 25,
    question: '[FINAL BOSS — TAHAP 1: PENGETAHUAN] Pulau Kalimantan (Borneo) melintasi garis khatulistiwa dan memiliki salah satu ekosistem hutan hujan tertua di dunia yang diperkirakan berusia...',
    options: {
      A: 'Lebih dari 130–140 juta tahun, lebih tua dari hutan Amazon',
      B: 'Sekitar 500 tahun sejak masa kolonial',
      C: 'Baru terbentuk sekitar 1.000 tahun yang lalu',
      D: 'Tepat 10.000 tahun pasca zaman es'
    },
    correctAnswer: 'A',
    difficulty: 'BOSS',
    stage: 'Pengetahuan',
    isBossQuestion: true,
    explanation: 'Hutan hujan tropis Borneo terbentuk sejak zaman Cretaceous dan diperkirakan berusia 130–140 juta tahun, menjadikannya salah satu bioma tertua di muka bumi.'
  },
  {
    questionId: 'Q097',
    world: 5,
    level: 25,
    question: '[FINAL BOSS — TAHAP 2: PEMAHAMAN] Mengapa keanekaragaman genetik di dalam satu populasi spesies flora dan fauna sangat menentukan daya tahan spesies tersebut terhadap kepunahan?',
    options: {
      A: 'Variasi genetik yang kaya memperbesar peluang munculnya individu dengan alel adaptif ketika menghadapi patogen penyakit baru atau perubahan iklim ekstrem',
      B: 'Variasi genetik membuat setiap hewan memiliki warna bulu yang persis sama',
      C: 'Keanekaragaman genetik mencegah terjadinya proses reproduksi alami',
      D: 'Populasi tanpa variasi genetik terbukti paling kebal dari segala virus'
    },
    correctAnswer: 'A',
    difficulty: 'BOSS',
    stage: 'Pemahaman',
    isBossQuestion: true,
    explanation: 'Populasi yang monomorfik rentan musnah serentak bila diserang patogen baru. Variasi alel heterogen memberikan fleksibilitas seleksi alam agar spesies tetap sintas.'
  },
  {
    questionId: 'Q098',
    world: 5,
    level: 25,
    question: '[FINAL BOSS — TAHAP 3: PENERAPAN] Sebuah pusat data pendidikan hijau di Kalimantan menggunakan pendinginan evaporatif dengan daya input 12 kW dan COP (Coefficient of Performance) 4,0. Berapakah laju kalor pendinginan efektif yang dipindahkan sistem tersebut?',
    options: {
      A: '48 kW kalor berhasil dipindahkan',
      B: '3 kW kalor berhasil dipindahkan',
      C: '16 kW kalor berhasil dipindahkan',
      D: '24 kW kalor berhasil dipindahkan'
    },
    correctAnswer: 'A',
    difficulty: 'BOSS',
    stage: 'Penerapan',
    isBossQuestion: true,
    explanation: 'COP = Q_pendingin / W_input => Q_pendingin = COP × W_input = 4,0 × 12 kW = 48 kW.'
  },
  {
    questionId: 'Q099',
    world: 5,
    level: 25,
    question: '[FINAL BOSS — TAHAP 4: ANALISIS] Analisislah mengapa sistem desentralisasi energi terbarukan berbasis Microgrid (kombinasi panel surya, mikrohidro, dan baterai pintar) jauh lebih tangguh bagi sekolah-sekolah di pedalaman Borneo dibanding jaringan transmisi kabel terpusat tegangan tinggi?',
    options: {
      A: 'Microgrid memutus ketergantungan jarak transmisi ratusan kilometer yang rentan roboh di hutan lebat, serta menjamin suplai listrik mandiri dan andal dengan redundansi lokal',
      B: 'Microgrid tidak membutuhkan sinar matahari maupun aliran air sama sekali',
      C: 'Jaringan kabel tegangan tinggi tidak boleh melewati pohon apapun di dunia',
      D: 'Microgrid menghasilkan listrik tegangan DC yang dapat diminum'
    },
    correctAnswer: 'A',
    difficulty: 'BOSS',
    stage: 'Analisis',
    isBossQuestion: true,
    explanation: 'Geografi kepulauan dan rimba lebat membuat transmisi sentralistik mahal dan rentan padam total. Microgrid terdesentralisasi memberikan otonomi energi berketahanan tinggi.'
  },
  {
    questionId: 'Q100',
    world: 5,
    level: 25,
    question: '[FINAL BOSS — TAHAP 5: HOTS] Sebagai siswa petualang pembelajar abad ke-21, bagaimana perpaduan antara kearifan lokal konservasi nusantara dan penguasaan sains teknologi modern dapat mewujudkan pembangunan berkelanjutan masa depan?',
    options: {
      A: 'Mengharmoniskan nilai etika pelestarian alam tradisi leluhur dengan kecerdasan komputasi sains data untuk melindungi keanekaragaman hayati dan menyejahterakan generasi mendatang secara adil dan beradab',
      B: 'Meninggalkan seluruh kearifan tradisi dan mengganti alam liar dengan gedung beton serba digital',
      C: 'Menolak segala bentuk perkembangan teknologi komputer dan sains masa depan',
      D: 'Mengeksploitasi seluruh sumber daya alam Borneo secepat mungkin demi keuntungan sesaat'
    },
    correctAnswer: 'A',
    difficulty: 'BOSS',
    stage: 'HOTS',
    isBossQuestion: true,
    explanation: 'Sintesis paripurna pendidikan holistik: teknologi adalah instrumen berdaya guna tinggi, sedangkan kearifan nilai dan cinta alam adalah kompas moral pemandu kelestarian peradaban manusia.'
  },

  // Soal Pengganti Final Boss jika salah jawab
  {
    questionId: 'Q101',
    world: 5,
    level: 25,
    question: '[FINAL BOSS CADANGAN] Prinsip pemrograman fungsional "Pure Function" menyatakan bahwa sebuah fungsi harus selalu...',
    options: {
      A: 'Menghasilkan output yang sama untuk input yang sama persis dan tidak menimbulkan efek samping (side effects) ke luar lingkungan fungsi',
      B: 'Mengubah nilai variabel global setiap kali dipanggil',
      C: 'Hanya boleh memiliki maksimal satu baris kode pemrograman',
      D: 'Dijalankan tanpa memerlukan memori komputer'
    },
    correctAnswer: 'A',
    difficulty: 'BOSS',
    stage: 'Analisis',
    isBossQuestion: true,
    explanation: 'Pure function memiliki sifat deterministic dan referential transparency: outputnya hanya bergantung pada argumen inputnya tanpa memodifikasi state eksternal.'
  }
];

export const WORLD_DEFINITIONS = [
  {
    id: 1,
    name: 'KNOWLEDGE FOREST',
    themeTitle: 'Hutan Pengetahuan Tropis',
    description: 'Jelajahi rimba lebat, pepohonan ulin raksasa, sungai Kapuas, dan jembatan kayu!',
    materiTheme: 'Pengetahuan Dasar Sains, Flora-Fauna, dan Logika',
    levels: [1, 2, 3, 4, 5],
    bossLevel: 5,
    bossName: 'Forest Guardian Ent',
    bossTitle: 'Penjaga Rimba Purba',
    palette: {
      skyTop: '#134e4a',
      skyBottom: '#065f46',
      hills: '#047857',
      terrain: '#15803d',
      platform: '#854d0e',
      accent: '#22c55e'
    }
  },
  {
    id: 2,
    name: 'CHALLENGE MOUNTAIN',
    themeTitle: 'Pegunungan Cadas Berapi',
    description: 'Daki tebing granit curam, lava pijar, dan hadapi tantangan fisika terapan!',
    materiTheme: 'Penerapan Konsep Matematika Terapan & Fenomena Alam',
    levels: [6, 7, 8, 9, 10],
    bossLevel: 10,
    bossName: 'Mountain Titan Golem',
    bossTitle: 'Raksasa Batu Magma',
    palette: {
      skyTop: '#7c2d12',
      skyBottom: '#9a3412',
      hills: '#c2410c',
      terrain: '#ea580c',
      platform: '#78350f',
      accent: '#f97316'
    }
  },
  {
    id: 3,
    name: 'LOGIC OCEAN',
    themeTitle: 'Samudra Logika & Terumbu Karang',
    description: 'Menyelam ke samudra biru, temukan pesut Mahakam, dan pecahkan algoritma komputasi!',
    materiTheme: 'Analisis, Pemikiran Kritis & Logika Algoritma',
    levels: [11, 12, 13, 14, 15],
    bossLevel: 15,
    bossName: 'Deep Sea Kraken',
    bossTitle: 'Penguasa Palung Samudra',
    palette: {
      skyTop: '#0c4a6e',
      skyBottom: '#0369a1',
      hills: '#0284c7',
      terrain: '#0ea5e9',
      platform: '#0891b2',
      accent: '#38bdf8'
    }
  },
  {
    id: 4,
    name: 'MYSTERY DESERT',
    themeTitle: 'Gurun Misteri & Reruntuhan Kuil',
    description: 'Lintasi lautan pasir emas, pecahkan teka-teki piramida, dan taklukkan soal HOTS!',
    materiTheme: 'Soal HOTS, Evaluasi Kritis & Pemecahan Masalah Kompleks',
    levels: [16, 17, 18, 19, 20],
    bossLevel: 20,
    bossName: 'Desert Sphinx Sentinel',
    bossTitle: 'Penjaga Piramida Kebijaksanaan',
    palette: {
      skyTop: '#78350f',
      skyBottom: '#b45309',
      hills: '#d97706',
      terrain: '#f59e0b',
      platform: '#92400e',
      accent: '#fbbf24'
    }
  },
  {
    id: 5,
    name: 'FINAL CASTLE',
    themeTitle: 'Kastel Megah Mahkota Ilmu',
    description: 'Capai benteng tertinggi, lewati menara kristal, dan hadapi Raja Kegelapan Edukasi!',
    materiTheme: 'Sintesis Menyeluruh & Ujian Paripurna 5 Tahap',
    levels: [21, 22, 23, 24, 25],
    bossLevel: 25,
    bossName: 'Raja Kegelapan Edukasi (Dark Overlord)',
    bossTitle: 'Penguasa Kastel Ketidaktahuan',
    palette: {
      skyTop: '#1e1b4b',
      skyBottom: '#312e81',
      hills: '#4338ca',
      terrain: '#6366f1',
      platform: '#4f46e5',
      accent: '#a855f7'
    }
  }
];
