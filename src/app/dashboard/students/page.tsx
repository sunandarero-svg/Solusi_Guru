"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

interface Student {
  id: string;
  fullName: string;
  studentNumber: string;
  user: { email: string; createdAt: string };
  enrollments: { class: { id: string; name: string } }[];
}

interface Class {
  id: string;
  name: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    fullName: "", email: "", password: "password123",
    studentNumber: "", classId: "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [sRes, cRes] = await Promise.all([
      fetch("/api/students"),
      fetch("/api/classes"),
    ]);
    if (sRes.ok) setStudents(await sRes.json());
    if (cRes.ok) setClasses(await cRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleDeleteStudent = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data siswa ini? Seluruh data riwayat tugas dan nilainya akan dihapus permanen.")) return;

    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchData();
        setMessage({ type: "success", text: "Siswa berhasil dihapus." });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Gagal menghapus siswa." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Terjadi kesalahan sistem saat menghapus." });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage({ type: "success", text: "Siswa berhasil ditambahkan!" });
      setShowForm(false);
      setForm({ fullName: "", email: "", password: "password123", studentNumber: "", classId: "" });
      fetchData();
    } else {
      setMessage({ type: "error", text: data.error || "Gagal menambahkan siswa." });
    }
    setSubmitting(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manajemen Siswa</h1>
          <p className="text-gray-500 mt-1">Total: <span className="font-semibold text-blue-600">{students.length} siswa</span></p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          {showForm ? "✕ Tutup" : "+ Tambah Siswa"}
        </button>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Tambah Siswa Baru</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nama Lengkap</label>
              <input required className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-800"
                value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">NIS (Nomor Induk Siswa)</label>
              <input required className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-800"
                value={form.studentNumber} onChange={e => setForm({ ...form, studentNumber: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email Login</label>
              <input required type="email" className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-800"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Password Awal</label>
              <input required className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-800"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Masukkan ke Kelas (Opsional)</label>
              <select className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-800"
                value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })}>
                <option value="">-- Pilih Kelas --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" disabled={submitting}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50">
                {submitting ? "Menyimpan..." : "Simpan Siswa"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Memuat data siswa...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-4xl mb-2">👨‍🎓</p>
            <p>Belum ada siswa terdaftar. Tambahkan siswa baru atau jalankan seeder.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">NIS</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Nama Lengkap</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Email</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Kelas</th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s.id} className={`border-b border-gray-50 hover:bg-gray-50 transition ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                  <td className="px-6 py-3 font-mono text-gray-600">{s.studentNumber}</td>
                  <td className="px-6 py-3 font-medium text-gray-800">{s.fullName}</td>
                  <td className="px-6 py-3 text-gray-500">{s.user.email}</td>
                  <td className="px-6 py-3">
                    {s.enrollments.length > 0
                      ? s.enrollments.map(e => (
                        <span key={e.class.id} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs mr-1">{e.class.name}</span>
                      ))
                      : <span className="text-gray-400 text-xs">Belum terdaftar</span>}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button 
                      onClick={() => handleDeleteStudent(s.id)}
                      className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition"
                      title="Hapus Siswa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
