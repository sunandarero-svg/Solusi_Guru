# Deployment Guide (Next.js App Router + Prisma + PostgreSQL)

Dokumen ini berisi panduan teknis langkah demi langkah untuk melakukan peluncuran (*deployment*) aplikasi **AI Assessment MVP** ke lingkungan produksi (*Production*).

## Prasyarat Infrastruktur
- Server Node.js (misal: VPS Linux, AWS EC2, atau Vercel)
- Database PostgreSQL >= 14
- Storage (misal: AWS S3 untuk menyimpan file PDF secara persisten, *opsional* untuk Vercel, *wajib* jika *local storage* terhapus)
- Domain / SSL

## Variabel Environment (.env)
Pastikan berkas `.env` atau *Environment Variables* di peladen telah diatur dengan konfigurasi nyata:
```env
# URL Database (WAJIB menggunakan pooler seperti PgBouncer jika menggunakan Serverless Vercel)
DATABASE_URL="postgresql://user:password@host:6543/mydb?pgbouncer=true&connection_limit=50"

# Autentikasi
NEXTAUTH_SECRET="buat-string-acak-panjang-di-sini"
NEXTAUTH_URL="https://namadomainanda.com"
NEXT_PUBLIC_APP_URL="https://namadomainanda.com"

# API Generatif (Setelah dihubungkan dengan Real Provider)
OPENAI_API_KEY="sk-..."
```

## Langkah Deployment (Node.js/VPS)

1. **Clone & Install Dependencies**
   ```bash
   git clone <repo_url>
   cd ai-assessment
   npm install
   ```

2. **Migrasi Database**
   Langkah ini akan membangun tabel-tabel di PostgreSQL sesuai dengan Skema Prisma.
   ```bash
   npx prisma migrate deploy
   ```

3. **Inisialisasi Data (Seeding)**
   Jalankan ini hanya SEKALI untuk membuat akun Admin/Guru pertama.
   ```bash
   npm run seed
   ```

4. **Build Aplikasi Next.js**
   Pastikan tidak ada peringatan atau galat selama proses ini.
   ```bash
   npm run build
   ```

5. **Start Service (menggunakan PM2)**
   Sangat disarankan menggunakan Process Manager seperti PM2 agar aplikasi hidup kembali (*restart*) secara otomatis.
   ```bash
   npm install -g pm2
   pm2 start npm --name "ai-assessment" -- start
   pm2 save
   ```

## Catatan Tambahan (High Concurrency & Queue)
Pada **Phase 9**, kita telah mengubah alur unggahan (PDF ➡ OCR ➡ AI) menjadi sistem *"Fire-and-forget"* asinkron (layaknya sebuah antrean/Queue) di dalam Node.js. 
- Jika menggunakan **VPS / Container / EC2**: Pendekatan ini aman dan proses latar belakang tidak akan dibunuh *(killed)* oleh sistem operasi.
- Jika menggunakan **Vercel (Serverless)**: Fungsi yang berjalan di latar belakang akan otomatis "dihentikan" oleh Vercel begitu fungsi `NextResponse.json()` dikirimkan. Untuk Vercel, kita perlu mempertimbangkan fungsi `waitUntil()` atau bermigrasi ke antrean eksternal (Inngest / Upstash / AWS SQS).
