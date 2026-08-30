"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, BookOpen, AlertTriangle } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [addLoading, setAddLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/subjects");
      if (!res.ok) throw new Error("Gagal memuat data mata pelajaran");
      const data = await res.json();
      setSubjects(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambahkan mata pelajaran");
      
      setSuccess("Mata pelajaran berhasil ditambahkan");
      setShowAddForm(false);
      setFormData({ name: "", description: "" });
      fetchSubjects();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus mata pelajaran ${name}?`)) return;
    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/subjects/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus mata pelajaran");
      }
      setSuccess("Mata pelajaran berhasil dihapus");
      fetchSubjects();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
            <BookOpen size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Manajemen Mata Pelajaran</h1>
            <p className="text-slate-500">Kelola master data mata pelajaran untuk sistem</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-blue-200"
        >
          {showAddForm ? "Batal" : <><Plus size={20} /> Tambah Mata Pelajaran</>}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3">
          <AlertTriangle size={20} />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl">
          <p>{success}</p>
        </div>
      )}

      {showAddForm && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-in slide-in-from-top-4">
          <h2 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">Tambah Mata Pelajaran Baru</h2>
          <form onSubmit={handleAdd} className="max-w-xl space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Mata Pelajaran</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Misal: Matematika, Bahasa Indonesia"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Deskripsi (Opsional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Deskripsi singkat tentang mata pelajaran ini..."
                rows={3}
              />
            </div>
            <button
              type="submit"
              disabled={addLoading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addLoading ? "Menyimpan..." : "Simpan Mata Pelajaran"}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Nama Mata Pelajaran</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Deskripsi</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">Memuat data...</td>
                </tr>
              ) : subjects.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
                      <BookOpen size={32} />
                    </div>
                    <p className="text-slate-500 font-medium">Belum ada mata pelajaran</p>
                  </td>
                </tr>
              ) : (
                subjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{subject.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-600 text-sm truncate max-w-md">{subject.description || "-"}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(subject.id, subject.name)}
                        disabled={deletingId === subject.id}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Hapus"
                      >
                        <Trash2 size={18} />
                      </button>
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
