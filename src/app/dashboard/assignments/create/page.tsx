"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Class {
  id: string;
  name: string;
}

export default function CreateAssignmentPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [form, setForm] = useState({
    title: "",
    classId: "",
    description: "",
    instructions: "",
    deadline: "",
    maxPages: 5
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/classes")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setClasses(data);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await res.json();
    
    if (res.ok) {
      router.push(`/dashboard/assignments/${data.id}`);
    } else {
      setError(data.error || "Gagal membuat tugas");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-6 space-x-2 text-sm">
        <Link href="/dashboard/assignments" className="text-gray-500 hover:text-blue-600">Manajemen Tugas</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-800 font-medium">Buat Tugas Baru</span>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Informasi Tugas</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Tugas *</label>
            <input 
              required
              type="text" 
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
              placeholder="Contoh: Esai Sejarah Kemerdekaan"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kelas *</label>
            <select 
              required
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
              value={form.classId}
              onChange={e => setForm({...form, classId: e.target.value})}
            >
              <option value="">-- Pilih Kelas --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Singkat</label>
            <textarea 
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm h-20"
              placeholder="Deskripsi singkat mengenai tujuan tugas ini..."
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instruksi Detail</label>
            <textarea 
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm h-32"
              placeholder="Instruksi pengerjaan untuk siswa. Contoh: Gunakan kertas folio bergaris, tulis nama di pojok kanan atas..."
              value={form.instructions}
              onChange={e => setForm({...form, instructions: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input 
                type="date" 
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                value={form.deadline}
                onChange={e => setForm({...form, deadline: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maksimal Halaman</label>
              <input 
                type="number" 
                min="1" max="10"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                value={form.maxPages}
                onChange={e => setForm({...form, maxPages: parseInt(e.target.value) || 5})}
              />
              <p className="text-xs text-gray-400 mt-1">Default: 5 halaman</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={() => router.back()}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-lg transition"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan & Lanjut ke Rubrik"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
