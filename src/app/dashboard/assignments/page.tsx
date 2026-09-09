"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Copy, X } from "lucide-react";

interface Subject {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
  subjects: Subject[];
}

interface Assignment {
  id: string;
  title: string;
  sessionName?: string;
  class: { id: string; name: string };
  deadline: string | null;
  status: string;
  _count: { submissions: number };
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Duplicate Modal State
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [selectedAssignmentForDuplicate, setSelectedAssignmentForDuplicate] = useState<Assignment | null>(null);
  const [teacherClasses, setTeacherClasses] = useState<Class[]>([]);
  const [duplicateForm, setDuplicateForm] = useState({ classId: "", subjectId: "", sessionName: "" });
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [duplicateError, setDuplicateError] = useState("");

  const fetchAssignments = () => {
    fetch("/api/assignments")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAssignments(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus tugas ini? Semua data terkait (termasuk tugas yang dikumpulkan siswa) akan ikut terhapus.")) return;

    try {
      const res = await fetch(`/api/assignments/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchAssignments();
      } else {
        alert("Gagal menghapus tugas.");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem.");
    }
  };

  const handleOpenDuplicateModal = (assignment: Assignment) => {
    setSelectedAssignmentForDuplicate(assignment);
    setIsDuplicateModalOpen(true);
    setDuplicateForm({ classId: "", subjectId: "", sessionName: "" });
    setAvailableSubjects([]);
    setDuplicateError("");
    if (teacherClasses.length === 0) {
      fetch("/api/teacher/classes")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setTeacherClasses(data);
        });
    }
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedClassId = e.target.value;
    const selectedClass = teacherClasses.find(c => c.id === selectedClassId);
    
    if (selectedClass) {
      setAvailableSubjects(selectedClass.subjects);
      if (selectedClass.subjects.length === 1) {
        setDuplicateForm(prev => ({ ...prev, classId: selectedClassId, subjectId: selectedClass.subjects[0].id }));
      } else {
        setDuplicateForm(prev => ({ ...prev, classId: selectedClassId, subjectId: "" }));
      }
    } else {
      setAvailableSubjects([]);
      setDuplicateForm(prev => ({ ...prev, classId: selectedClassId, subjectId: "" }));
    }
  };

  const submitDuplicate = async () => {
    if (!selectedAssignmentForDuplicate || !duplicateForm.classId || !duplicateForm.subjectId) return;
    
    // Validasi sesi jika kelas sama
    if (selectedAssignmentForDuplicate.class.id === duplicateForm.classId && !duplicateForm.sessionName.trim()) {
      setDuplicateError("Nama Sesi harus diisi karena Anda menduplikasi ke kelas yang sama (misal: Sesi 2).");
      return;
    }

    setIsDuplicating(true);
    setDuplicateError("");

    try {
      const res = await fetch(`/api/assignments/${selectedAssignmentForDuplicate.id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duplicateForm)
      });
      const data = await res.json();
      if (res.ok) {
        setIsDuplicateModalOpen(false);
        fetchAssignments();
      } else {
        setDuplicateError(data.error || "Gagal menduplikasi tugas");
      }
    } catch (err) {
      setDuplicateError("Terjadi kesalahan sistem");
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manajemen Nilai & Tugas</h1>
          <p className="text-gray-500 mt-1">Total: <span className="font-semibold text-emerald-600">{assignments.length} tugas</span></p>
        </div>
        <button
          onClick={() => router.push("/dashboard/assignments/create")}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition font-medium"
        >
          + Buat Tugas Baru
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Memuat data tugas...</div>
        ) : assignments.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-5xl mb-4">📋</p>
            <p>Belum ada tugas yang dibuat. Silakan buat tugas pertama Anda.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Judul Tugas</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Kelas</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Deadline</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Submisi</th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a, i) => (
                <tr key={a.id} className={`border-b border-gray-50 hover:bg-gray-50 transition ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {a.title}
                    {a.sessionName && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{a.sessionName}</span>}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs">
                      {a.class?.name || "Kelas Tidak Ditemukan"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {a.deadline ? new Date(a.deadline).toLocaleDateString("id-ID") : "Tidak ada"}
                  </td>
                  <td className="px-6 py-4">
                    {a.status === "PUBLISHED" ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">PUBLISHED</span>
                    ) : a.status === "DRAFT" ? (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">DRAFT</span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">{a.status}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">{a._count?.submissions || 0}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link href={`/dashboard/assignments/${a.id}`} className="text-emerald-600 hover:text-emerald-800 text-sm font-medium mr-2">
                        Detail →
                      </Link>
                      <button 
                        onClick={() => handleOpenDuplicateModal(a)}
                        className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded transition"
                        title="Duplikasi Tugas"
                      >
                        <Copy size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteAssignment(a.id)}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition"
                        title="Hapus Tugas"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isDuplicateModalOpen && selectedAssignmentForDuplicate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Duplikasi Tugas</h3>
              <button onClick={() => setIsDuplicateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                Duplikasi tugas <strong>"{selectedAssignmentForDuplicate.title}"</strong> ke kelas lain atau sesi berbeda. Tugas baru akan berstatus DRAFT.
              </p>

              {duplicateError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                  {duplicateError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kelas Tujuan *</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white text-gray-900"
                  value={duplicateForm.classId}
                  onChange={handleClassChange}
                >
                  <option value="">-- Pilih Kelas --</option>
                  {teacherClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sesi Tugas (Opsional, Wajib jika kelas sama)</label>
                <input 
                  type="text"
                  placeholder="Misal: Sesi 2, Pertemuan 3, dll"
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white text-gray-900"
                  value={duplicateForm.sessionName}
                  onChange={e => setDuplicateForm(prev => ({...prev, sessionName: e.target.value}))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran *</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white text-gray-900"
                  value={duplicateForm.subjectId}
                  onChange={e => setDuplicateForm(prev => ({...prev, subjectId: e.target.value}))}
                  disabled={!duplicateForm.classId || availableSubjects.length === 0}
                >
                  <option value="">-- Pilih Mata Pelajaran --</option>
                  {availableSubjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50">
              <button 
                onClick={() => setIsDuplicateModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Batal
              </button>
              <button 
                onClick={submitDuplicate}
                disabled={isDuplicating || !duplicateForm.classId || !duplicateForm.subjectId}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {isDuplicating ? "Menduplikasi..." : "Duplikasi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

