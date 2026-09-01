"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckSquare, Trash2 } from "lucide-react";

interface Submission {
  id: string;
  student: {
    fullName: string;
    studentNumber: string;
  };
  status: string;
  aiAssessment?: {
    suggestedScore: number;
  };
  teacherReview?: {
    finalScore: number;
    status: string;
  };
  updatedAt: string;
}

export default function SubmissionsTable({ assignmentId }: { assignmentId: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Bulk actions state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkActioning, setIsBulkActioning] = useState(false);

  // Class filtering state (Mocked/Derived from assignments since an assignment is for 1 class currently)
  const [selectedClassId, setSelectedClassId] = useState("all");

  const fetchSubmissions = () => {
    setLoading(true);
    fetch(`/api/assignments/${assignmentId}/submissions`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSubmissions(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSubmissions();
  }, [assignmentId]);

  const handleDelete = async (submissionId: string, studentName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus tugas dari ${studentName}?\n\nSemua data terkait tugas ini akan dihapus secara permanen.`)) {
      return;
    }
    
    setDeletingId(submissionId);
    try {
      const res = await fetch(`/api/submissions/${submissionId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus tugas");
      fetchSubmissions();
      setSelectedIds(prev => prev.filter(id => id !== submissionId));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkAction = async (action: "approve" | "publish") => {
    if (selectedIds.length === 0) return;
    
    const actionText = action === "approve" ? "menyetujui" : "mempublish";
    if (!confirm(`Apakah Anda yakin ingin ${actionText} ${selectedIds.length} tugas yang dipilih?`)) return;

    setIsBulkActioning(true);
    try {
      const res = await fetch(`/api/submissions/bulk`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionIds: selectedIds, action })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal melakukan aksi massal");
      
      alert(data.message);
      setSelectedIds([]);
      fetchSubmissions();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsBulkActioning(false);
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(submissions.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  if (loading) return <div className="text-sm text-slate-500 p-6">Memuat daftar pengumpulan...</div>;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mt-8 animate-in fade-in">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Antrean Review Guru</h2>
          <p className="text-sm text-slate-500 mt-1">{submissions.length} Pengumpulan Total</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Mock Dropdown for Class Filtering as requested */}
          <select 
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-700"
          >
            <option value="all">Semua Kelas</option>
            <option value="class-current">Kelas Saat Ini</option>
          </select>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
              <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                {selectedIds.length} dipilih
              </span>
              <button
                onClick={() => handleBulkAction("approve")}
                disabled={isBulkActioning}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <CheckSquare size={16} /> Approve Massal
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 w-12 text-center">
                <input 
                  type="checkbox"
                  checked={submissions.length > 0 && selectedIds.length === submissions.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
              </th>
              <th className="px-6 py-4 font-semibold text-slate-700">Siswa</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Rekomendasi AI</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Nilai Akhir</th>
              <th className="px-6 py-4 font-semibold text-slate-700 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  Belum ada siswa yang mengumpulkan tugas.
                </td>
              </tr>
            ) : (
              submissions.map(sub => (
                <tr key={sub.id} className={`transition-colors ${selectedIds.includes(sub.id) ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'}`}>
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="checkbox"
                      checked={selectedIds.includes(sub.id)}
                      onChange={() => toggleSelect(sub.id)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{sub.student.fullName}</div>
                    <div className="text-xs text-slate-500 font-mono mt-1">{sub.student.studentNumber}</div>
                  </td>
                  <td className="px-6 py-4">
                    {sub.status === "NEEDS_TEACHER_REVIEW" && <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-1 rounded-full text-xs font-bold">Perlu Diulas</span>}
                    {sub.status === "APPROVED" && <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">Disetujui</span>}
                    {sub.status === "PUBLISHED" && <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">Selesai</span>}
                    {!["NEEDS_TEACHER_REVIEW", "APPROVED", "PUBLISHED"].includes(sub.status) && (
                      <span className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold">{sub.status}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {sub.aiAssessment ? (
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-100">
                        {sub.aiAssessment.suggestedScore}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {sub.teacherReview ? (
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-100">
                        {sub.teacherReview.finalScore}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end space-x-3">
                    <Link 
                      href={`/dashboard/assignments/${assignmentId}/submissions/${sub.id}/review`}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg font-semibold text-xs transition-colors shadow-sm"
                    >
                      {["APPROVED", "PUBLISHED"].includes(sub.status) ? "Lihat Hasil" : "Edit ✏️"}
                    </Link>
                    <button
                      onClick={() => handleDelete(sub.id, sub.student.fullName)}
                      disabled={deletingId === sub.id}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Hapus Tugas"
                    >
                      {deletingId === sub.id ? "⏳" : <Trash2 size={16} />}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

