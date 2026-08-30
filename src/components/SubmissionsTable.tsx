"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
    if (!confirm(`Apakah Anda yakin ingin menghapus tugas dari ${studentName}?\n\nSemua data terkait tugas ini (file, nilai AI, review) akan dihapus secara permanen.`)) {
      return;
    }
    
    setDeletingId(submissionId);
    try {
      const res = await fetch(`/api/submissions/${submissionId}`, {
        method: "DELETE"
      });
      
      if (!res.ok) {
        throw new Error("Gagal menghapus tugas");
      }
      
      // Refresh list
      fetchSubmissions();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="text-sm text-gray-500">Memuat daftar pengumpulan...</div>;

  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden mt-8">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h2 className="text-lg font-bold text-gray-800">Antrean Ulasan (Submissions)</h2>
        <span className="text-sm text-gray-500">{submissions.length} Pengumpulan</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-700">Siswa</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Rekomendasi AI</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Nilai Akhir</th>
              <th className="px-6 py-4 font-semibold text-gray-700 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Belum ada siswa yang mengumpulkan tugas.</td>
              </tr>
            ) : (
              submissions.map(sub => (
                <tr key={sub.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">{sub.student.fullName}</div>
                    <div className="text-xs text-gray-500">{sub.student.studentNumber}</div>
                  </td>
                  <td className="px-6 py-4">
                    {sub.status === "NEEDS_TEACHER_REVIEW" && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">Perlu Diulas</span>}
                    {sub.status === "APPROVED" && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">Disetujui</span>}
                    {sub.status === "PUBLISHED" && <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Selesai (Published)</span>}
                    {!["NEEDS_TEACHER_REVIEW", "APPROVED", "PUBLISHED"].includes(sub.status) && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">{sub.status}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {sub.aiAssessment ? (
                      <span className="font-semibold text-blue-600">{sub.aiAssessment.suggestedScore}</span>
                    ) : "-"}
                  </td>
                  <td className="px-6 py-4">
                    {sub.teacherReview ? (
                      <span className="font-bold text-green-600">{sub.teacherReview.finalScore}</span>
                    ) : "-"}
                  </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end space-x-4">
                    <Link 
                      href={`/dashboard/assignments/${assignmentId}/submissions/${sub.id}/review`}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      {["APPROVED", "PUBLISHED"].includes(sub.status) ? "Lihat Hasil" : "Edit ✏️"}
                    </Link>
                    <button
                      onClick={() => handleDelete(sub.id, sub.student.fullName)}
                      disabled={deletingId === sub.id}
                      className="text-red-500 hover:text-red-700 font-medium text-sm disabled:opacity-50"
                      title="Hapus Tugas"
                    >
                      {deletingId === sub.id ? "⏳" : "🗑️ Hapus"}
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
