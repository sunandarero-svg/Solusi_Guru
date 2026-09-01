"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TeacherReviewPage({ 
  params 
}: { 
  params: Promise<{ id: string, submissionId: string }> 
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [finalScore, setFinalScore] = useState<number>(0);
  const [finalFeedback, setFinalFeedback] = useState<string>("");
  const [saving, setSaving] = useState(false);
  
  const [viewMode, setViewMode] = useState<"IMAGE" | "AI">("IMAGE");

  useEffect(() => {
    fetch(`/api/submissions/${resolvedParams.submissionId}/review`)
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setSubmission(data);
          
          // Initialize form with teacher review if exists, otherwise AI assessment
          if (data.teacherReview) {
            setFinalScore(data.teacherReview.finalScore);
            setFinalFeedback(data.teacherReview.finalFeedback || "");
          } else if (data.aiAssessment) {
            setFinalScore(data.aiAssessment.suggestedScore);
            setFinalFeedback(data.aiAssessment.feedback || "");
          }
        }
        setLoading(false);
      });
  }, [resolvedParams.submissionId]);

  const handleSave = async (publish: boolean) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/submissions/${resolvedParams.submissionId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          finalScore,
          finalFeedback,
          publish
        })
      });
      
      if (res.ok) {
        alert(publish ? "Nilai dipublish ke siswa!" : "Ulasan berhasil disimpan (Draft).");
        if (publish) {
          router.push(`/dashboard/assignments/${resolvedParams.id}`);
        } else {
          // Update local state to reflect saved review
          const updated = await res.json();
          setSubmission({ ...submission, teacherReview: updated });
        }
      } else {
        alert("Gagal menyimpan ulasan.");
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat data submission...</div>;
  if (!submission) return <div className="p-8 text-center text-red-500">Data tidak ditemukan.</div>;

  const ocrText = submission.ocrResults?.[0]?.extractedText || "Tidak ada teks terbaca.";
  const ai = submission.aiAssessment;
  const isPublished = submission.teacherReview?.status === "PUBLISHED";

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0 shadow-sm z-10">
        <div>
          <div className="text-xs text-gray-500 mb-1 flex items-center space-x-2">
            <Link href={`/dashboard/assignments/${resolvedParams.id}`} className="hover:text-emerald-600">
              ← Kembali ke Daftar Pengumpulan
            </Link>
          </div>
          <h1 className="text-xl font-bold text-gray-800">
            Review: {submission.student.fullName} ({submission.student.studentNumber})
          </h1>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={() => handleSave(false)}
            disabled={saving || isPublished}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Draft"}
          </button>
          <button 
            onClick={() => handleSave(true)}
            disabled={saving || isPublished}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
          >
            {isPublished ? "Telah di-Publish" : "Publish Nilai Akhir"}
          </button>
        </div>
      </div>

      {/* Split Screen Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane: Document Viewer */}
        <div className="w-1/2 border-r border-gray-200 bg-gray-100 flex flex-col relative">
          <div className="bg-white px-4 py-3 border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
            <h3 className="font-bold text-gray-700">Foto Tugas Siswa</h3>
            <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-md">
              {submission.pages?.length || 0} Halaman
            </span>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-6">
            {submission.pages && submission.pages.length > 0 ? (
              submission.pages.map((page: any, index: number) => (
                <div key={page._id || index} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden relative group">
                  <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-3 py-1 rounded-lg z-10 shadow">
                    Hal {page.pageNumber || index + 1}
                  </div>
                  <img 
                    src={page.storageKey} 
                    alt={`Halaman ${page.pageNumber || index + 1}`} 
                    className="w-full h-auto object-contain cursor-zoom-in"
                    onClick={() => window.open(page.storageKey, '_blank')}
                  />
                  <div className="p-2 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <a 
                      href={page.storageKey} 
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                    >
                      Unduh Gambar
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <span className="text-4xl mb-4">📷</span>
                <p>Tidak ada foto tugas yang diunggah.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: AI Assessment & Grading */}
        <div className="w-1/2 bg-white flex flex-col overflow-y-auto">
          {ai ? (
            <div className="p-8 space-y-8">
              
              {/* Grading Input */}
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">Penilaian Akhir</h3>
                  <div className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-medium">
                    Rekomendasi AI: {ai.suggestedScore}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-1/3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Skor Akhir (0-100)</label>
                    <input 
                      type="number" 
                      min="0" max="100"
                      value={finalScore}
                      onChange={(e) => setFinalScore(parseInt(e.target.value) || 0)}
                      disabled={isPublished}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl font-bold text-xl text-gray-900 text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:bg-gray-100"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Skor ini akan dikirimkan ke siswa. Anda dapat mengubah skor ini jika Anda tidak setuju dengan rekomendasi AI.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feedback Input */}
              <div>
                <h3 className="font-bold text-gray-800 mb-3">Umpan Balik untuk Siswa</h3>
                <textarea
                  value={finalFeedback}
                  onChange={(e) => setFinalFeedback(e.target.value)}
                  disabled={isPublished}
                  rows={4}
                  className="w-full p-4 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:bg-gray-50"
                  placeholder="Tambahkan umpan balik tambahan atau edit saran dari AI di sini..."
                />
              </div>

              {/* AI Details Breakdown */}
              <div>
                <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">Rincian Penilaian AI Berdasarkan Rubrik</h3>
                <div className="space-y-4">
                  {ai.criteria?.map((c: any) => {
                    const rubricTitle = submission.assignment?.rubrics?.[0]?.criteria?.find((rc: any) => rc.id === c.rubricCriterionId)?.name || "Kriteria";
                    return (
                      <div key={c.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-sm text-gray-800">{rubricTitle}</span>
                          <span className="text-sm font-bold bg-white px-2 py-1 rounded shadow-sm border border-gray-200">
                            {c.score} <span className="text-gray-400 font-normal">/ {c.maxScore}</span>
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{c.reason}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 p-8 text-center">
              <div>
                <div className="text-4xl mb-4">🤖</div>
                <p>Data penilaian AI tidak tersedia untuk pengumpulan ini.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
