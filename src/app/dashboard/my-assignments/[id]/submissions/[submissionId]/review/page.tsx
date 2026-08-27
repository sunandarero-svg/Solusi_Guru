"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StudentReviewPage({ 
  params 
}: { 
  params: Promise<{ id: string, submissionId: string }> 
}) {
  const resolvedParams = use(params);
  
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState<"PDF" | "OCR">("PDF");

  useEffect(() => {
    fetch(`/api/submissions/${resolvedParams.submissionId}/student-review`)
      .then(res => {
        if (!res.ok) {
          throw new Error("Failed to fetch");
        }
        return res.json();
      })
      .then(data => {
        if (data.id) {
          setSubmission(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [resolvedParams.submissionId]);

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat data submission...</div>;
  if (!submission) return <div className="p-8 text-center text-red-500">Data tidak ditemukan atau Anda tidak memiliki akses.</div>;

  const ocrText = submission.ocrResults?.[0]?.extractedText || "Tidak ada teks terbaca.";
  const ai = submission.aiAssessment;
  const teacherReview = submission.teacherReview;
  const isPublished = teacherReview?.status === "PUBLISHED";

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0 shadow-sm z-10">
        <div>
          <div className="text-xs text-gray-500 mb-1 flex items-center space-x-2">
            <Link href={`/dashboard/my-assignments/${resolvedParams.id}`} className="hover:text-blue-600">
              ← Kembali ke Detail Tugas
            </Link>
          </div>
          <h1 className="text-xl font-bold text-gray-800">
            Review Tugas: {submission.assignment?.title || 'Pengumpulan Anda'}
          </h1>
        </div>
        
        <div className="flex space-x-3 items-center">
          {isPublished ? (
            <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200 shadow-sm">
              <span className="font-bold text-sm">Nilai Akhir:</span>
              <span className="text-xl font-black">{teacherReview.finalScore}</span>
            </div>
          ) : (
            <div className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg border border-yellow-200 text-sm font-medium shadow-sm">
              ⏳ Menunggu Ulasan Guru
            </div>
          )}
        </div>
      </div>

      {/* Split Screen Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane: Document Viewer */}
        <div className="w-1/2 border-r border-gray-200 bg-gray-100 flex flex-col relative">
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-md p-1 flex space-x-1 z-10">
            <button 
              onClick={() => setViewMode("PDF")}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${viewMode === "PDF" ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              PDF Anda
            </button>
            <button 
              onClick={() => setViewMode("OCR")}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${viewMode === "OCR" ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Teks Terbaca
            </button>
          </div>

          {submission.document?.storageKey && viewMode === "PDF" && (
            <div className="absolute top-4 right-4 z-10">
              <a 
                href={submission.document.storageKey} 
                download
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-gray-700 px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 text-xs font-semibold hover:bg-gray-50 flex items-center space-x-1 transition"
              >
                <span>📥 Unduh PDF</span>
              </a>
            </div>
          )}

          <div className="flex-1 overflow-auto p-4 pt-16">
            {viewMode === "PDF" ? (
              submission.document?.storageKey ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <iframe 
                  src={submission.document.storageKey} 
                  className="w-full h-full rounded-xl border border-gray-300 shadow-sm bg-white"
                  title="PDF Viewer"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  PDF tidak tersedia
                </div>
              )
            ) : (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-300 min-h-full whitespace-pre-wrap font-mono text-sm text-gray-800">
                {ocrText}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: AI Assessment & Feedback */}
        <div className="w-1/2 bg-white flex flex-col overflow-y-auto p-8 space-y-8">
          
          {/* Teacher Feedback (if published) */}
          {isPublished && (
            <div className="bg-green-50 p-6 rounded-2xl border border-green-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center space-x-2">
                <span>👨‍🏫 Umpan Balik Guru</span>
              </h3>
              <div className="bg-white p-4 rounded-xl border border-green-200 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed shadow-sm">
                {teacherReview.finalFeedback || "Tidak ada pesan dari guru."}
              </div>
            </div>
          )}

          {/* AI Feedback */}
          {ai ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 flex items-center space-x-2">
                  <span>🤖 Analisis Otomatis AI</span>
                </h3>
                {!isPublished && (
                  <div className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                    Estimasi Skor AI: {ai.suggestedScore}
                  </div>
                )}
              </div>
              
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
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{c.reason}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-center p-12">
              <div className="text-5xl mb-4">⚙️</div>
              <p className="font-medium text-gray-500">Tugas Anda sedang diproses oleh sistem...</p>
              <p className="text-sm mt-2">Silakan kembali lagi nanti untuk melihat hasil analisis otomatis.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
