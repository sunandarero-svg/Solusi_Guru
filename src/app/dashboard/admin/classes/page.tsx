"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, BookOpen, AlertTriangle } from "lucide-react";

interface ClassData {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
}

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [addLoading, setAddLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/classes");
      if (!res.ok) throw new Error("Gagal memuat data kelas");
      const data = await res.json();
      setClasses(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambahkan kelas");
      
      setSuccess("Kelas berhasil ditambahkan");
      setShowAddForm(false);
      setFormData({ name: "", description: "" });
      fetchClasses();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kelas ${name}?`)) return;
    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/classes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus kelas");
      }
      setSuccess("Kelas berhasil dihapus");
      fetchClasses();
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
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
            <BookOpen size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Manajemen Kelas</h1>
            <p className="text-slate-500">Kelola master data kelas untuk sistem</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-emerald-200"
        >
          {showAddForm ? "Batal" : <><Plus size={20} /> Tambah Kelas</>}
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
          <h2 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">Tambah Kelas Baru</h2>
          <form onSubmit={handleAdd} className="max-w-xl space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Kelas</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 bg-white"
                placeholder="Misal: Kelas X IPA 1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Deskripsi (Opsional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 bg-white"
                placeholder="Deskripsi singkat tentang kelas ini..."
                rows={3}
              />
            </div>
            <button
              type="submit"
              disabled={addLoading}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addLoading ? "Menyimpan..." : "Simpan Mata Pelajaran"}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-8 text-center text-slate-500">Memuat data...</div>
        ) : classes.length > 0 ? (
          classes.map((cls) => (
            <div key={cls.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 group-hover:bg-emerald-100 transition-all">
                  <BookOpen size={24} />
                </div>
                <button
                  onClick={() => handleDelete(cls.id, cls.name)}
                  disabled={deletingId === cls.id}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                  title="Hapus Kelas"
                >
                  {deletingId === cls.id ? (
                    <div className="w-5 h-5 border-2 border-slate-300 border-t-red-600 rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={20} />
                  )}
                </button>
              </div>
              
              <h3 className="font-bold text-lg text-slate-800 mb-2">{cls.name}</h3>
              {cls.description && (
                <p className="text-sm text-slate-500 line-clamp-2">{cls.description}</p>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-slate-100">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
              <BookOpen size={32} />
            </div>
            <p className="text-slate-500 font-medium">Belum ada kelas</p>
          </div>
        )}
      </div>
    </div>
  );
}

