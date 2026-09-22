"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

export default function TeacherReviewPage({ 
  params 
}: { 
  params: Promise<{ id: string, submissionId: string }> 
}) {
  const resolvedParams = use(params);
  
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [finalScore, setFinalScore] = useState<number>(0);
  const [finalFeedback, setFinalFeedback] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [answerKey, setAnswerKey] = useState<string | null>(null);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  
  const [viewMode, setViewMode] = useState<"IMAGE" | "AI">("IMAGE");
  
  // State for manual edit per question
  const [editingAnalysisId, setEditingAnalysisId] = useState<string | null>(null);
  const [editScore, setEditScore] = useState<number>(0);
  const [editAnalysisText, setEditAnalysisText] = useState<string>("");
  const [isSavingAnalysis, setIsSavingAnalysis] = useState(false);

  useEffect(() => {
    fetch(`/api/submissions/${resolvedParams.submissionId}/review`)
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          // Sort analysis by questionNumber (assuming it's a number string)
          if (data.aiAssessment && data.aiAssessment.analysis) {
            data.aiAssessment.analysis.sort((a: any, b: any) => {
              const numA = parseInt(a.questionNumber.replace(/\D/g, '')) || 0;
              const numB = parseInt(b.questionNumber.replace(/\D/g, '')) || 0;
              return numA - numB;
            });
          }
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

    // Fetch answer key for this assignment
    fetch(`/api/assignments/${resolvedParams.id}/attachments`)
      .then(res => res.json())
      .then(data => {
        if (data.answerKey) {
          setAnswerKey(data.answerKey);
        }
      })
      .catch(() => {});
  }, [resolvedParams.submissionId, resolvedParams.id]);

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
        const updated = await res.json();
        if (publish) {
          alert(isPublished ? "Nilai berhasil diperbarui dan dipublish ulang ke siswa!" : "Nilai dipublish ke siswa!");
          // Update local state to reflect the new published review
          setSubmission({ ...submission, teacherReview: updated });
        } else {
          alert("Ulasan berhasil disimpan (Draft).");
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

  const handleStartEditAnalysis = (analysis: any) => {
    setEditingAnalysisId(analysis._id);
    setEditScore(analysis.score);
    setEditAnalysisText(analysis.analysis);
  };

  const handleSaveAnalysis = async (analysisId: string) => {
    setIsSavingAnalysis(true);
    try {
      const res = await fetch(`/api/submissions/${resolvedParams.submissionId}/review/analysis/${analysisId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: editScore,
          analysis: editAnalysisText
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        // Update local state
        const updatedSubmission = { ...submission };
        if (updatedSubmission.aiAssessment && updatedSubmission.aiAssessment.analysis) {
          const index = updatedSubmission.aiAssessment.analysis.findIndex((a: any) => a._id === analysisId);
          if (index !== -1) {
            updatedSubmission.aiAssessment.analysis[index] = data.updatedAnalysis;
          }
          updatedSubmission.aiAssessment.suggestedScore = data.newTotalScore;
        }
        if (updatedSubmission.teacherReview) {
          updatedSubmission.teacherReview.finalScore = data.newTotalScore;
        }
        setSubmission(updatedSubmission);
        setFinalScore(data.newTotalScore);
        setEditingAnalysisId(null);
      } else {
        alert("Gagal menyimpan perubahan analisis.");
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsSavingAnalysis(false);
    }
  };


  if (loading) return <div className="p-8 text-center text-gray-500">Memuat data submission...</div>;
  if (!submission) return <div className="p-8 text-center text-red-500">Data tidak ditemukan.</div>;

  const ocrText = submission.ocrResults?.[0]?.extractedText || "Tidak ada teks terbaca.";
  const ai = submission.aiAssessment;
  const isPublished = submission.teacherReview?.status === "PUBLISHED";

  return (
    <div className="flex flex-col h-auto lg:h-[calc(100vh-64px)] min-h-screen lg:min-h-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 shadow-sm z-10">
        <div>
          <div className="text-xs text-gray-500 mb-1 flex items-center space-x-2">
            <Link href={`/dashboard/assignments/${resolvedParams.id}`} className="hover:text-emerald-600">
              ← Kembali ke Daftar Pengumpulan
            </Link>
          </div>
          <h1 className="text-lg md:text-xl font-bold text-gray-800">
            Review: {submission.student.fullName} <span className="text-gray-500 text-sm md:text-base font-normal">({submission.student.studentNumber})</span>
          </h1>
        </div>
        
        <div className="flex space-x-2 md:space-x-3 w-full md:w-auto">
          {isPublished && (
            <span className="flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
              ✅ Sudah di-Publish
            </span>
          )}
          <button 
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex-1 md:flex-none px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Draft"}
          </button>
          <button 
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex-1 md:flex-none px-4 md:px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 shadow-sm whitespace-nowrap"
          >
            {isPublished ? "Update & Publish Ulang" : "Publish Nilai Akhir"}
          </button>
        </div>
      </div>

      {/* Split Screen Content */}
      <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden">
        {/* Left Pane: Document Viewer */}
        <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-gray-200 bg-gray-100 flex flex-col relative h-[60vh] lg:h-auto">
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
                  {page.highlightedStorageKey && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] px-2 py-1 rounded-full z-10 font-bold shadow-sm">
                      Koreksi AI (Stabilo)
                    </div>
                  )}
                  <img 
                    src={page.highlightedStorageKey || page.storageKey} 
                    alt={`Halaman ${page.pageNumber || index + 1}`} 
                    className="w-full h-auto object-contain cursor-zoom-in"
                    onClick={() => window.open(page.highlightedStorageKey || page.storageKey, '_blank')}
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
        <div className="w-full lg:w-1/2 bg-white flex flex-col lg:overflow-y-auto">
          {ai ? (
            <div className="p-8 space-y-8">
              
              {/* Grading Input */}
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2 mb-4">
                  <h3 className="font-bold text-gray-800">Penilaian Akhir</h3>
                  <div className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-medium">
                    Rekomendasi AI: {ai.suggestedScore}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-full sm:w-1/3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Skor Akhir (0-100)</label>
                    <input 
                      type="number" 
                      min="0" max="100"
                      value={finalScore}
                      onChange={(e) => setFinalScore(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl font-bold text-xl text-gray-900 text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
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
                  rows={4}
                  className="w-full p-4 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  placeholder="Tambahkan umpan balik tambahan atau edit saran dari AI di sini..."
                />
              </div>

              {/* AI Answer Key Reference */}
              {answerKey && (
                <div>
                  <button
                    onClick={() => setShowAnswerKey(!showAnswerKey)}
                    className="flex items-center gap-2 w-full text-left font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100 hover:text-purple-700 transition"
                  >
                    <span className={`transform transition-transform text-xs ${showAnswerKey ? "rotate-90" : ""}`}>
                      ▶
                    </span>
                    🔑 Kunci Jawaban Referensi (AI)
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-normal ml-auto">
                      Referensi Guru
                    </span>
                  </button>

                  {showAnswerKey && (
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 max-h-64 overflow-y-auto mb-2">
                      <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {answerKey}
                      </div>
                      <div className="mt-3 pt-2 border-t border-purple-100">
                        <p className="text-xs text-purple-500 italic">
                          ⚠️ Ini adalah referensi. Jawaban siswa dinilai berdasarkan kesesuaian konteks, bukan kesamaan kata per kata.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI Details Breakdown */}
              <div>
                <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">Analisis Jawaban Siswa</h3>
                <div className="space-y-4">
                  {ai.analysis?.map((a: any, idx: number) => {
                    const isEditing = editingAnalysisId === a._id;
                    return (
                      <div key={a._id || idx} className={`p-4 rounded-xl border ${a.status === 'UNREADABLE' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold text-sm ${a.status === 'UNREADABLE' ? 'text-red-800' : 'text-gray-800'}`}>Soal {a.questionNumber}</span>
                            {a.status === 'UNREADABLE' && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200 font-bold">⚠️ Tidak Terbaca AI</span>
                            )}
                            {a.status === 'MANUAL_EDIT' && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-bold">✏️ Diedit Guru</span>
                            )}
                          </div>
                          {!isEditing && (
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold bg-white px-2 py-1 rounded shadow-sm border border-gray-200 text-gray-800">
                                {a.score} <span className="text-gray-400 font-normal">/ {a.maxScore}</span>
                              </span>
                              <button 
                                onClick={() => handleStartEditAnalysis(a)}
                                className="text-xs text-blue-600 font-medium hover:text-blue-800 bg-white px-2 py-1 border border-blue-100 rounded shadow-sm"
                              >
                                Koreksi Manual
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {isEditing ? (
                          <div className="mt-4 bg-white p-4 rounded-lg border border-blue-200 shadow-inner">
                            <div className="mb-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Skor ({a.maxScore} max)</label>
                              <input 
                                type="number" 
                                min="0" max={a.maxScore}
                                value={editScore}
                                onChange={(e) => setEditScore(parseFloat(e.target.value) || 0)}
                                className="w-24 px-3 py-2 bg-gray-50 border border-gray-300 rounded font-bold text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div className="mb-4">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Analisis Guru</label>
                              <textarea
                                value={editAnalysisText}
                                onChange={(e) => setEditAnalysisText(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => setEditingAnalysisId(null)}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded"
                                disabled={isSavingAnalysis}
                              >
                                Batal
                              </button>
                              <button 
                                onClick={() => handleSaveAnalysis(a._id)}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm"
                                disabled={isSavingAnalysis}
                              >
                                {isSavingAnalysis ? 'Menyimpan...' : 'Simpan Koreksi'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className={`mt-2 p-3 border rounded-lg ${a.status === 'UNREADABLE' ? 'bg-red-50 border-red-100' : 'bg-white border-gray-200'}`}>
                              <p className="text-xs text-gray-500 font-medium mb-1">Jawaban Siswa Terbaca:</p>
                              <p className={`text-sm font-medium ${a.status === 'UNREADABLE' ? 'text-red-700' : 'text-gray-800'}`}>{a.studentAnswer}</p>
                            </div>
                            <p className="text-sm text-gray-600 mt-3 whitespace-pre-wrap"><span className="font-medium text-gray-700">Analisis:</span> {a.analysis}</p>
                          </>
                        )}
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
