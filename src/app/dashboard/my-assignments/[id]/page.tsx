"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Criterion {
  name: string;
  description: string;
  maxScore: number;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  deadline: string | null;
  maxPages: number;
  class: { name: string };
  rubrics?: {
    title: string;
    criteria: Criterion[];
  }[];
}

export default function StudentAssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch(`/api/assignments/${resolvedParams.id}`).then(res => res.json()),
      fetch(`/api/assignments/${resolvedParams.id}/submission`).then(res => res.json())
    ]).then(([assignmentData, submissionData]) => {
      if (assignmentData.id) setAssignment(assignmentData);
      if (submissionData && submissionData.id) setSubmission(submissionData);
      setLoading(false);
    });
  }, [resolvedParams.id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat detail tugas...</div>;
  if (!assignment) return <div className="p-8 text-center text-red-500">Tugas tidak ditemukan.</div>;

  const isOverdue = assignment.deadline && new Date(assignment.deadline) < new Date();

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center mb-6 space-x-2 text-sm">
        <Link href="/dashboard/my-assignments" className="text-gray-500 hover:text-blue-600">Tugas Saya</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-800 font-medium">Detail Tugas</span>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{assignment.title}</h1>
            <p className="text-sm text-gray-500">
              Kelas: <span className="font-semibold text-gray-700">{assignment.class.name}</span>
            </p>
          </div>

          <div className="flex space-x-3 w-full md:w-auto">
            {submission && submission.status !== "DRAFT" ? (
              <div 
                className="w-full md:w-auto bg-green-100 text-green-700 px-6 py-2 rounded-lg text-sm font-bold shadow-sm flex flex-col items-center justify-center transition"
              >
                <span>✅ Tugas Berhasil Dikumpul</span>
                {submission.aiAssessment && (
                  <span className="text-xs font-medium mt-1">Nilai AI: {submission.aiAssessment.suggestedScore}/100</span>
                )}
              </div>
            ) : (
              <Link 
                href={isOverdue ? '#' : `/dashboard/my-assignments/${resolvedParams.id}/scan`}
                className={`w-full md:w-auto px-6 py-2 rounded-lg text-sm font-medium transition shadow-sm flex items-center justify-center space-x-2 ${
                  isOverdue ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <span>📷 Scan & Kumpul Tugas</span>
              </Link>
            )}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Deskripsi</h3>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{assignment.description || "-"}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Instruksi Pengerjaan</h3>
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-blue-900 whitespace-pre-wrap leading-relaxed">
                {assignment.instructions || "Tidak ada instruksi khusus."}
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-4">
              <div>
                <span className="block text-xs text-gray-500 mb-1">Status Pengerjaan</span>
                {submission && submission.status !== "DRAFT" ? (
                  <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">✅ Selesai Dikumpul</span>
                ) : (
                  <span className="inline-block text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">Belum Dikumpul</span>
                )}
              </div>
              
              <div>
                <span className="block text-xs text-gray-500 mb-1">Batas Waktu (Deadline)</span>
                <span className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>
                  {assignment.deadline ? new Date(assignment.deadline).toLocaleString("id-ID", {
                    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                  }) : "Tidak ada batas waktu"}
                </span>
                {isOverdue && <p className="text-xs text-red-500 mt-1">Terlambat</p>}
              </div>

              <div>
                <span className="block text-xs text-gray-500 mb-1">Maksimal Halaman Scan</span>
                <span className="font-semibold text-gray-800">{assignment.maxPages} Halaman</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {submission && submission.teacherReview && submission.status === "PUBLISHED" && (
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl shadow border border-emerald-100 overflow-hidden mb-6">
          <div className="p-6 border-b border-emerald-100 flex items-center gap-3">
            <span className="text-2xl">🎓</span>
            <div>
              <h2 className="text-lg font-bold text-emerald-900">Nilai Akhir dari Guru</h2>
              <p className="text-sm text-emerald-700">Tugas Anda telah diperiksa dan disetujui oleh guru.</p>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            <div className="md:col-span-1 flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-emerald-100">
              <span className="text-5xl font-black text-emerald-600">{submission.teacherReview.finalScore}</span>
              <span className="text-xs font-bold text-gray-500 uppercase mt-2">Nilai Akhir</span>
            </div>
            <div className="md:col-span-3 bg-white p-5 rounded-xl shadow-sm border border-emerald-100">
              <h3 className="text-sm font-bold text-gray-700 mb-2">Ulasan Guru:</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{submission.teacherReview.feedback || "Tugas diterima dengan baik."}</p>
            </div>
          </div>
        </div>
      )}

      {submission && submission.aiAssessment && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow border border-blue-100 overflow-hidden mb-6">
          <div className="p-6 border-b border-blue-100 flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h2 className="text-lg font-bold text-blue-900">Hasil Penilaian Cerdas (AI)</h2>
              <p className="text-sm text-blue-700">Berikut adalah evaluasi otomatis berdasarkan rubrik penilaian.</p>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            <div className="md:col-span-1 flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-blue-100">
              <span className="text-5xl font-black text-blue-600">{submission.aiAssessment.suggestedScore}</span>
              <span className="text-xs font-bold text-gray-500 uppercase mt-2">Skor AI</span>
            </div>
            <div className="md:col-span-3 bg-white p-5 rounded-xl shadow-sm border border-blue-100">
              <h3 className="text-sm font-bold text-gray-700 mb-2">Umpan Balik AI:</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{submission.aiAssessment.feedback || "Tidak ada umpan balik."}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
