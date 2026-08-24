import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAdminStats } from "@/modules/admin/adminService";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const stats = await getAdminStats();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Panel Admin 🛡️
      </h1>
      <p className="text-gray-500 mb-8">
        Kelola guru, kuota siswa, dan kelas dari sini.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">👨‍🏫</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-700">Guru</h2>
          </div>
          <p className="text-3xl font-bold text-purple-600">{stats.teachers}</p>
          <p className="text-sm text-gray-400 mt-1">Total guru aktif</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">👨‍🎓</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-700">Siswa</h2>
          </div>
          <p className="text-3xl font-bold text-green-500">{stats.students}</p>
          <p className="text-sm text-gray-400 mt-1">Total siswa terdaftar</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🏫</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-700">Kelas</h2>
          </div>
          <p className="text-3xl font-bold text-blue-600">{stats.classes}</p>
          <p className="text-sm text-gray-400 mt-1">Total kelas</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">📋</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-700">Tugas</h2>
          </div>
          <p className="text-3xl font-bold text-orange-500">{stats.assignments}</p>
          <p className="text-sm text-gray-400 mt-1">Total tugas</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/dashboard/admin/teachers"
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-5 hover:from-purple-600 hover:to-purple-700 transition-all shadow hover:shadow-lg flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👨‍🏫</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Kelola Guru</h3>
              <p className="text-purple-100 text-sm">Tambah, hapus, dan atur kuota guru</p>
            </div>
          </a>
          <a
            href="/dashboard"
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-5 hover:from-blue-600 hover:to-blue-700 transition-all shadow hover:shadow-lg flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Lihat Semua Data</h3>
              <p className="text-blue-100 text-sm">Pantau aktivitas sistem secara keseluruhan</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
