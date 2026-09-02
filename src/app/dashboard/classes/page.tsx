"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ClassData {
  id: string;
  name: string;
  description: string | null;
  enrollments: { student: { fullName: string } }[];
  teachers: { teacher: { fullName: string } }[];
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", subjectId: "" });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchClasses = async () => {
    setLoading(true);
    const [resClasses, resSubjects] = await Promise.all([
      fetch("/api/classes"),
      fetch("/api/subjects")
    ]);
    if (resClasses.ok) setClasses(await resClasses.json());
    if (resSubjects.ok) setSubjects(await resSubjects.json());
    setLoading(false);
  };

  useEffect(() => { fetchClasses(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage({ type: "success", text: "Kelas berhasil dibuat!" });
      setShowForm(false);
      setForm({ name: "", description: "", subjectId: "" });
      fetchClasses();
    } else {
      setMessage({ type: "error", text: data.error || "Gagal membuat kelas." });
    }
    setSubmitting(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manajemen Kelas</h1>
          <p className="text-gray-500 mt-1">Total: <span className="font-semibold text-emerald-600">{classes.length} kelas</span></p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition font-medium"
        >
          {showForm ? "✕ Tutup" : "+ Buat Kelas Baru"}
        </button>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Buat Kelas Baru</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nama Kelas</label>
              <input required className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-800"
                placeholder="contoh: Kelas XI IPA 2" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Mata Pelajaran Utama Anda di Kelas Ini *</label>
              <select required className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-800 bg-white"
                value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })}>
                <option value="">-- Pilih Mata Pelajaran --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Deskripsi (Opsional)</label>
              <input className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-800"
                placeholder="contoh: Tahun Ajaran 2025/2026" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={submitting}
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition font-medium disabled:opacity-50">
                {submitting ? "Menyimpan..." : "Simpan Kelas"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 p-8 text-center text-gray-400">Memuat data kelas...</div>
        ) : classes.length === 0 ? (
          <div className="col-span-3 bg-white rounded-xl shadow border border-gray-100 p-8 text-center text-gray-400">
            <p className="text-4xl mb-2">🏫</p>
            <p>Belum ada kelas. Buat kelas baru atau jalankan seeder.</p>
          </div>
        ) : (
          classes.map(c => (
            <Link href={`/dashboard/classes/${c.id}`} key={c.id} className="bg-white rounded-xl shadow border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-1 hover:border-emerald-200 transition duration-300 block cursor-pointer group">
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">{c.name}</h2>
                <span className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">➔</span>
              </div>
              {c.description && <p className="text-sm text-gray-400 mt-1">{c.description}</p>}
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  👨‍🎓 <span className="font-semibold text-gray-700">{c.enrollments.length}</span> siswa
                </span>
                <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded">
                  {c.teachers.length > 0 ? c.teachers[0].teacher.fullName : "Tanpa Guru"}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

