/** @type {import('next').NextConfig} */
const nextConfig = {
  // Abaikan error TS saat build di Railway agar build jauh lebih cepat & hemat RAM
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  
  // Mengurangi penggunaan memori saat kompilasi
  experimental: {
    memoryBasedWorkersCount: true,
  },

  // Fitur untuk memangkas ukuran build (Image Docker) secara drastis
  output: 'standalone',
  
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;
