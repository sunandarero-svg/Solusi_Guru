"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RubricEditor from "@/components/RubricEditor";
import SubmissionsTable from "@/components/SubmissionsTable";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  deadline: string | null;
  maxPages: number;
  status: string;
  class: { name: string };
  rubrics: any[];
}

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const router = useRouter();

  const fetchAssignment = () => {
    fetch(`/api/assignments/${resolvedParams.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.id) setAssignment(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAssignment();
  }, [resolvedParams.id]);

  const handlePublish = async () => {
    if (!assignment?.rubrics || assignment.rubrics.length === 0 || assignment.rubrics[0].totalScore !== 100) {
      alert("Harap melengkapi Rubrik Penilaian dengan total skor persis 100 sebelum mempublikasikan tugas.");
      return;
    }

    if (!confirm("Apakah Anda yakin ingin mempublikasikan tugas ini? Setelah dipublish, rubrik tidak bisa diubah.")) return;

    setPublishing(true);
    const res = await fetch(`/api/assignments/${resolvedParams.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PUBLISHED" })
    });

    if (res.ok) {
      fetchAssignment();
    } else {
      alert("Gagal mempublikasikan tugas.");
    }
    setPublishing(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat detail tugas...</div>;
  if (!assignment) return <div className="p-8 text-center text-red-500">Tugas tidak ditemukan.</div>;

  const isPublished = assignment.status === "PUBLISHED";

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center mb-6 space-x-2 text-sm">
        <Link href="/dashboard/assignments" className="text-gray-500 hover:text-blue-600">Manajemen Tugas</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-800 font-medium">Detail</span>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-800">{assignment.title}</h1>
              {isPublished ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">PUBLISHED</span>
              ) : (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">DRAFT</span>
              )}
            </div>
            <p className="text-sm text-gray-500">Kelas: <span className="font-semibold text-gray-700">{assignment.class.name}</span></p>
          </div>

          {!isPublished && (
            <div className="flex space-x-3">
              <Link
                href={`/dashboard/assignments/${assignment.id}/edit`}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-sm"
              >
                ✏️ Edit Info Tugas
              </Link>
              <button 
                onClick={handlePublish}
                disabled={publishing}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50 shadow-sm"
              >
                {publishing ? "Mempublikasikan..." : "🚀 Publish Tugas"}
              </button>
            </div>
          )}
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Deskripsi</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{assignment.description || "-"}</p>
            
            <h3 className="font-semibold text-gray-700 mt-6 mb-2">Instruksi</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{assignment.instructions || "-"}</p>
          </div>
          <div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Deadline:</span>
                <span className="font-medium text-gray-800">
                  {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString("id-ID") : "Tidak ada batas waktu"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Maks. Halaman:</span>
                <span className="font-medium text-gray-800">{assignment.maxPages} Halaman</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RubricEditor assignmentId={assignment.id} isPublished={isPublished} initialRubric={assignment.rubrics && assignment.rubrics[0]} onSaved={fetchAssignment} />

      {isPublished && (
        <SubmissionsTable assignmentId={assignment.id} />
      )}
    </div>
  );
}
