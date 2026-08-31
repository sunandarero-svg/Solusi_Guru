"use client";

import { useState, useEffect, useCallback } from "react";

interface Teacher {
  id: string;
  fullName: string;
  maxStudents: number;
  maxClasses: number;
  deletedAt: string | null;
  user: {
    email: string;
    createdAt: string;
  };
  actualStudents: number;
  actualClasses: number;
  _count: {
    classes: number;
    assignments: number;
  };
}

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state for adding teacher
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    maxStudents: 310,
    maxClasses: 10,
  });
  const [addLoading, setAddLoading] = useState(false);

  // Quota editing state
  const [editingQuota, setEditingQuota] = useState<string | null>(null);
  const [quotaData, setQuotaData] = useState({ maxStudents: 0, maxClasses: 0 });

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/teachers");
      if (!res.ok) throw new Error("Gagal memuat data guru");
      const data = await res.json();
      setTeachers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // Add teacher
  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setAddLoading(true);

    try {
      const res = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambahkan guru");

      setSuccess(`Guru "${formData.fullName}" berhasil ditambahkan!`);
      setFormData({ email: "", password: "", fullName: "", maxStudents: 310, maxClasses: 10 });
      setShowAddForm(false);
      fetchTeachers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  // Delete teacher (soft-delete)
  const handleDeleteTeacher = async (teacherId: string) => {
    clearMessages();

    try {
      const res = await fetch(`/api/admin/teachers/${teacherId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus guru");

      setSuccess("Guru berhasil dihapus!");
      setDeletingId(null);
      fetchTeachers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Update quota
  const handleUpdateQuota = async (teacherId: string) => {
    clearMessages();

    try {
      const res = await fetch(`/api/admin/teachers/${teacherId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quotaData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengupdate kuota");

      setSuccess("Kuota guru berhasil diupdate!");
      setEditingQuota(null);
      fetchTeachers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Reset Password
  const handleResetPassword = async (teacherId: string) => {
    if (!confirm("Apakah Anda yakin ingin mereset password guru ini menjadi 'guru123'?")) return;
    clearMessages();
    
    try {
      const res = await fetch(`/api/admin/teachers/${teacherId}/reset-password`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mereset password");
      
      setSuccess("Password berhasil direset menjadi 'guru123'");
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 flex items-center gap-2">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Memuat data guru...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Kelola Guru 👨‍🏫</h1>
          <p className="text-gray-500 mt-1">Tambah, hapus, dan atur kuota guru</p>
        </div>
        <button
          id="btn-add-teacher"
          onClick={() => {
            setShowAddForm(!showAddForm);
            clearMessages();
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-all shadow hover:shadow-lg flex items-center gap-2"
        >
          {showAddForm ? "✕ Batal" : "＋ Tambah Guru"}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 text-sm px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      {/* Add Teacher Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Tambah Guru Baru</h2>
          <form onSubmit={handleAddTeacher} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nama Lengkap</label>
              <input
                id="input-teacher-name"
                type="text"
                required
                placeholder="Nama lengkap guru"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <input
                id="input-teacher-email"
                type="email"
                required
                placeholder="guru@sekolah.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
              <input
                id="input-teacher-password"
                type="password"
                required
                placeholder="Password awal"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Maks. Siswa</label>
                <input
                  id="input-max-students"
                  type="number"
                  min={1}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition"
                  value={formData.maxStudents}
                  onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Maks. Kelas</label>
                <input
                  id="input-max-classes"
                  type="number"
                  min={1}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition"
                  value={formData.maxClasses}
                  onChange={(e) => setFormData({ ...formData, maxClasses: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-5 py-2.5 text-gray-600 hover:text-gray-800 transition"
              >
                Batal
              </button>
              <button
                id="btn-submit-teacher"
                type="submit"
                disabled={addLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all disabled:opacity-60"
              >
                {addLoading ? "Menyimpan..." : "Simpan Guru"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Teachers Table */}
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Guru</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Siswa</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kelas</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tugas</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    Belum ada guru terdaftar. Klik &quot;Tambah Guru&quot; untuk menambahkan.
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => (
                  <tr key={teacher.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-semibold text-sm">
                            {teacher.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-gray-800">{teacher.fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{teacher.user.email}</td>
                    <td className="px-5 py-4 text-center">
                      {editingQuota === teacher.id ? (
                        <input
                          type="number"
                          min={1}
                          className="w-20 border border-purple-300 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-400 text-slate-900 bg-white"
                          value={quotaData.maxStudents}
                          onChange={(e) => setQuotaData({ ...quotaData, maxStudents: parseInt(e.target.value) || 1 })}
                        />
                      ) : (
                        <div>
                          <span className={`font-semibold ${teacher.actualStudents >= teacher.maxStudents ? "text-red-500" : "text-gray-800"}`}>
                            {teacher.actualStudents}
                          </span>
                          <span className="text-gray-400 text-sm"> / {teacher.maxStudents}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {editingQuota === teacher.id ? (
                        <input
                          type="number"
                          min={1}
                          className="w-20 border border-purple-300 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-400 text-slate-900 bg-white"
                          value={quotaData.maxClasses}
                          onChange={(e) => setQuotaData({ ...quotaData, maxClasses: parseInt(e.target.value) || 1 })}
                        />
                      ) : (
                        <div>
                          <span className={`font-semibold ${teacher.actualClasses >= teacher.maxClasses ? "text-red-500" : "text-gray-800"}`}>
                            {teacher.actualClasses}
                          </span>
                          <span className="text-gray-400 text-sm"> / {teacher.maxClasses}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="font-semibold text-gray-800">{teacher._count.assignments}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {editingQuota === teacher.id ? (
                          <>
                            <button
                              onClick={() => handleUpdateQuota(teacher.id)}
                              className="text-green-600 hover:text-green-800 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-green-50 transition"
                            >
                              ✓ Simpan
                            </button>
                            <button
                              onClick={() => setEditingQuota(null)}
                              className="text-gray-400 hover:text-gray-600 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
                            >
                              ✕ Batal
                            </button>
                          </>
                        ) : deletingId === teacher.id ? (
                          <>
                            <button
                              onClick={() => handleDeleteTeacher(teacher.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                            >
                              Yakin Hapus?
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="text-gray-400 hover:text-gray-600 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
                            >
                              Batal
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingQuota(teacher.id);
                                setQuotaData({
                                  maxStudents: teacher.maxStudents,
                                  maxClasses: teacher.maxClasses,
                                });
                                clearMessages();
                              }}
                              className="text-purple-600 hover:text-purple-800 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-purple-50 transition"
                              title="Edit kuota"
                            >
                              ✏️ Kuota
                            </button>
                            <button
                              onClick={() => handleResetPassword(teacher.id)}
                              className="text-blue-500 hover:text-blue-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
                              title="Reset password"
                            >
                              🔑 Reset PW
                            </button>
                            <button
                              onClick={() => {
                                setDeletingId(teacher.id);
                                clearMessages();
                              }}
                              className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                              title="Hapus guru"
                            >
                              🗑️ Hapus
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
