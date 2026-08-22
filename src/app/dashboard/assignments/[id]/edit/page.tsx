"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Class {
  id: string;
  name: string;
}

export default function EditAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [classes, setClasses] = useState<Class[]>([]);
  const [form, setForm] = useState({
    title: "",
    classId: "",
    description: "",
    instructions: "",
    deadline: "",
    maxPages: 5
  });
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Fetch classes and assignment in parallel
    Promise.all([
      fetch("/api/classes").then(res => res.json()),
      fetch(`/api/assignments/${resolvedParams.id}`).then(res => res.json())
    ]).then(([classesData, assignmentData]) => {
      if (Array.isArray(classesData)) setClasses(classesData);
      
      if (assignmentData && assignmentData.id) {
        // Cannot edit if already published
        if (assignmentData.status === "PUBLISHED") {
          alert("Tugas sudah di-publish dan tidak bisa diedit.");
          router.push(`/dashboard/assignments/${resolvedParams.id}`);
          return;
        }
        
        setForm({
          title: assignmentData.title || "",
          classId: assignmentData.classId || "",
          description: assignmentData.description || "",
          instructions: assignmentData.instructions || "",
          deadline: assignmentData.deadline ? new Date(assignmentData.deadline).toISOString().split('T')[0] : "",
          maxPages: assignmentData.maxPages || 5
        });
        setLoadingData(false);
      } else {
        setError("Tugas tidak ditemukan.");
        setLoadingData(false);
      }
    });
  }, [resolvedParams.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch(`/api/assignments/${resolvedParams.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (res.ok) {
      router.push(`/dashboard/assignments/${resolvedParams.id}`);
    } else {
      const data = await res.json();
      setError(data.error || "Gagal menyimpan tugas");
      setSaving(false);
    }
  };

  if (loadingData) return <div className="p-8 text-center text-gray-500">Memuat data...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-6 space-x-2 text-sm">
        <Link href="/dashboard/assignments" className="text-gray-500 hover:text-blue-600">Manajemen Tugas</Link>
        <span className="text-gray-400">/</span>
        <Link href={`/dashboard/assignments/${resolvedParams.id}`} className="text-gray-500 hover:text-blue-600">Detail</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-800 font-medium">Edit Tugas</span>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Informasi Tugas</h1>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Kelas (Tidak bisa diubah)</label>
            <select 
              disabled
              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-gray-50 text-gray-500"
              value={form.classId}
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
              placeholder="Instruksi pengerjaan untuk siswa..."
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
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={() => router.push(`/dashboard/assignments/${resolvedParams.id}`)}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-lg transition"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={saving}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
