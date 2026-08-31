"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, LayoutDashboard, AlertTriangle } from "lucide-react";

interface Teacher {
  id: string;
  fullName: string;
}

interface Class {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Mapping {
  id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
}

export default function AdminTeachingPage() {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [success, setSuccess] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ teacherId: "", classId: "", subjectId: "" });
  const [addLoading, setAddLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      const [mapsRes, teachRes, classRes, subRes] = await Promise.all([
        fetch("/api/admin/teaching"),
        fetch("/api/admin/teachers"),
        fetch("/api/admin/classes"),
        fetch("/api/admin/subjects")
      ]);
      
      const mapsData = await mapsRes.json();
      const teachData = await teachRes.json();
      const classData = await classRes.json();
      const subData = await subRes.json();

      setMappings(Array.isArray(mapsData) ? mapsData : []);
      setTeachers(Array.isArray(teachData) ? teachData : []);
      setClasses(Array.isArray(classData) ? classData : []);
      setSubjects(Array.isArray(subData) ? subData : []);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleAdd = async (e: React.FormEvent, force: boolean = false) => {
    e.preventDefault();
    setAddLoading(true);
    setError("");
    setWarning("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/teaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, force }),
      });
      const data = await res.json();
      
      if (res.status === 409) {
        setWarning(data.message);
        setAddLoading(false);
        return;
      }
      
      if (!res.ok) throw new Error(data.error || "Gagal menautkan guru");
      
      setSuccess("Guru berhasil ditautkan ke kelas dan mata pelajaran");
      setShowAddForm(false);
      setFormData({ teacherId: "", classId: "", subjectId: "" });
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus tautan ini?`)) return;
    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/teaching/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus tautan");
      }
      setSuccess("Tautan berhasil dihapus");
      fetchAllData();
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
          <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
            <LayoutDashboard size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Tautkan Guru</h1>
            <p className="text-slate-500">Petakan Guru dengan Mata Pelajaran di Kelas tertentu</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-purple-200"
        >
          {showAddForm ? "Batal" : <><Plus size={20} /> Tambah Tautan</>}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3">
          <AlertTriangle size={20} />
          <p>{error}</p>
        </div>
      )}

      {warning && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl space-y-3">
          <div className="flex items-center gap-3 font-semibold">
            <AlertTriangle size={20} />
            <p>{warning}</p>
          </div>
          <div className="flex gap-3 pl-8">
            <button
              onClick={(e) => handleAdd(e, true)}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Ya, Lanjutkan
            </button>
            <button
              onClick={() => setWarning("")}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl">
          <p>{success}</p>
        </div>
      )}

      {showAddForm && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-in slide-in-from-top-4">
          <h2 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">Tambah Tautan Baru</h2>
          <form onSubmit={(e) => handleAdd(e, false)} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Pilih Guru</label>
              <select
                required
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-slate-900 bg-white"
              >
                <option value="">-- Pilih Guru --</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Pilih Mata Pelajaran</label>
              <select
                required
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-slate-900 bg-white"
              >
                <option value="">-- Pilih Mata Pelajaran --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Pilih Kelas</label>
              <select
                required
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-slate-900 bg-white"
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </form>
          <button
            onClick={(e) => handleAdd(e as any, false)}
            disabled={addLoading || !formData.teacherId || !formData.subjectId || !formData.classId}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
          >
            {addLoading ? "Menyimpan..." : "Simpan Tautan"}
          </button>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Guru</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Mata Pelajaran</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Kelas</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Memuat data...</td>
                </tr>
              ) : mappings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
                      <LayoutDashboard size={32} />
                    </div>
                    <p className="text-slate-500 font-medium">Belum ada tautan yang dibuat</p>
                  </td>
                </tr>
              ) : (
                mappings.map((mapping) => (
                  <tr key={mapping.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{mapping.teacherName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-600">{mapping.subjectName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                        {mapping.className}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(mapping.id)}
                        disabled={deletingId === mapping.id}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Hapus Tautan"
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
