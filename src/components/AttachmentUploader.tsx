"use client";

import { useState, useEffect, useRef } from "react";

interface Attachment {
  id: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  storageKey: string;
  extractedText?: string;
  description?: string;
  order: number;
}

interface AttachmentUploaderProps {
  assignmentId: string;
  isPublished: boolean;
}

const ALLOWED_EXTENSIONS = ".pdf,.docx,.xlsx,.jpg,.jpeg,.png";
const MAX_FILE_SIZE_KB = 300;
const MAX_ATTACHMENTS = 5;

function getFileIcon(mimeType: string): string {
  if (mimeType === "application/pdf") return "📄";
  if (mimeType.includes("wordprocessingml")) return "📝";
  if (mimeType.includes("spreadsheetml")) return "📊";
  if (mimeType.startsWith("image/")) return "🖼️";
  return "📎";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function AttachmentUploader({ assignmentId, isPublished }: AttachmentUploaderProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [answerKey, setAnswerKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAttachments = async () => {
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/attachments`);
      if (res.ok) {
        const data = await res.json();
        setAttachments(data.attachments || []);
        setAnswerKey(data.answerKey || null);
      }
    } catch (err) {
      console.error("Failed to fetch attachments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [assignmentId]);

  const handleUpload = async (files: FileList | File[]) => {
    setError("");
    setSuccessMsg("");

    const fileArray = Array.from(files);
    
    if (attachments.length + fileArray.length > MAX_ATTACHMENTS) {
      setError(`Maksimal ${MAX_ATTACHMENTS} lampiran. Sisa slot: ${MAX_ATTACHMENTS - attachments.length}`);
      return;
    }

    for (const file of fileArray) {
      if (file.size > MAX_FILE_SIZE_KB * 1024) {
        setError(`File "${file.name}" melebihi batas ${MAX_FILE_SIZE_KB}KB.`);
        return;
      }
    }

    setUploading(true);

    for (const file of fileArray) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`/api/assignments/${assignmentId}/attachments`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || `Gagal upload ${file.name}`);
          break;
        }
      } catch (err) {
        setError(`Gagal upload ${file.name}`);
        break;
      }
    }

    await fetchAttachments();
    setUploading(false);
    if (!error) setSuccessMsg("Lampiran berhasil diupload!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleDelete = async (attachmentId: string, fileName: string) => {
    if (!confirm(`Hapus lampiran "${fileName}" secara permanen?`)) return;

    try {
      const res = await fetch(`/api/assignments/${assignmentId}/attachments/${attachmentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchAttachments();
        setSuccessMsg("Lampiran berhasil dihapus.");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Gagal menghapus lampiran.");
      }
    } catch (err) {
      setError("Gagal menghapus lampiran.");
    }
  };

  const handleUpdateDescription = async (attachmentId: string, description: string) => {
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/attachments/${attachmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) {
        console.error("Failed to update description");
      } else {
        // Update local state without fetching again to avoid UI jump
        setAttachments((prev) =>
          prev.map((att) => (att.id === attachmentId ? { ...att, description } : att))
        );
      }
    } catch (err) {
      console.error("Failed to update description", err);
    }
  };

  const handleGenerateAnswerKey = async () => {
    if (attachments.length === 0) {
      setError("Upload setidaknya satu lampiran soal terlebih dahulu.");
      return;
    }

    setGenerating(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/assignments/${assignmentId}/attachments/generate-answer-key`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setAnswerKey(data.answerKey);
        setShowAnswerKey(true);
        setSuccessMsg("Kunci jawaban AI berhasil di-generate!");
        setTimeout(() => setSuccessMsg(""), 5000);
      } else {
        const data = await res.json();
        setError(data.error || "Gagal generate kunci jawaban.");
      }
    } catch (err) {
      setError("Gagal generate kunci jawaban. Periksa koneksi internet.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow border border-gray-100 p-6 mt-6">
        <div className="text-center text-gray-500 py-4">Memuat lampiran...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 p-6 mt-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            📎 Lampiran Soal / Tugas
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Upload dokumen soal (PDF, DOCX, XLSX, gambar). AI akan menganalisis soal dan membuat kunci jawaban referensi.
          </p>
        </div>
        <div className="text-sm text-gray-400 font-medium">
          {attachments.length} / {MAX_ATTACHMENTS}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-100">
          ⚠️ {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-100">
          ✅ {successMsg}
        </div>
      )}

      {/* Drop Zone */}
      {attachments.length < MAX_ATTACHMENTS && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mb-4 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
            ${dragOver
              ? "border-emerald-500 bg-emerald-50"
              : "border-gray-200 hover:border-emerald-400 hover:bg-gray-50"
            }
            ${uploading ? "opacity-50 pointer-events-none" : ""}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_EXTENSIONS}
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
          />
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-sm text-gray-600">Mengupload...</p>
            </div>
          ) : (
            <div>
              <div className="text-3xl mb-2">📤</div>
              <p className="text-sm text-gray-600 font-medium">
                Klik atau seret file ke sini untuk upload
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PDF, DOCX, XLSX, JPG, PNG • Maks {MAX_FILE_SIZE_KB}KB per file
              </p>
            </div>
          )}
        </div>
      )}

      {/* Attachment List */}
      {attachments.length > 0 && (
        <div className="space-y-2 mb-4">
          {attachments.map((att) => (
            <div key={att.id} className="flex flex-col">
              <div
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group hover:bg-gray-100 transition"
              >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl flex-shrink-0">{getFileIcon(att.mimeType)}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {att.originalFileName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(att.fileSize)}
                    {att.extractedText && att.extractedText.length > 0 && (
                      <span className="ml-2 text-emerald-600">• Teks terekstrak</span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {att.mimeType.startsWith("image/") && (
                  <a
                    href={att.storageKey}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Lihat
                  </a>
                )}
                <button
                  onClick={() => handleDelete(att.id, att.originalFileName)}
                  className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition"
                  title="Hapus lampiran"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Description Input for Images */}
            {att.mimeType.startsWith("image/") && (
              <div className="mt-1 ml-10 mb-3">
                <input
                  type="text"
                  placeholder="Keterangan gambar (misal: Gambar untuk soal nomor 3)..."
                  defaultValue={att.description || ""}
                  onBlur={(e) => {
                    if (e.target.value !== att.description) {
                      handleUpdateDescription(att.id, e.target.value);
                    }
                  }}
                  className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none transition"
                />
              </div>
            )}
            </div>
          ))}
        </div>
      )}

      {/* Generate Answer Key Button */}
      {attachments.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">
                🤖 Kunci Jawaban AI
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                AI akan menganalisis soal dari lampiran dan menghasilkan kunci jawaban referensi
              </p>
            </div>
            <button
              onClick={handleGenerateAnswerKey}
              disabled={generating || attachments.length === 0}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  ✨ {answerKey ? "Re-generate Kunci Jawaban" : "Generate Kunci Jawaban"}
                </>
              )}
            </button>
          </div>

          {/* Answer Key Display */}
          {answerKey && (
            <div className="mt-4">
              <button
                onClick={() => setShowAnswerKey(!showAnswerKey)}
                className="flex items-center gap-2 text-sm font-medium text-purple-700 hover:text-purple-900 transition"
              >
                <span className={`transform transition-transform ${showAnswerKey ? "rotate-90" : ""}`}>
                  ▶
                </span>
                {showAnswerKey ? "Sembunyikan" : "Lihat"} Kunci Jawaban AI
              </button>

              {showAnswerKey && (
                <div className="mt-3 p-4 bg-purple-50 rounded-xl border border-purple-100 max-h-96 overflow-y-auto">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-purple-100">
                    <span className="text-purple-600 font-bold text-sm">🔑 Kunci Jawaban Referensi</span>
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                      Dibuat oleh AI
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {answerKey}
                  </div>
                  <div className="mt-3 pt-2 border-t border-purple-100">
                    <p className="text-xs text-purple-500 italic">
                      ⚠️ Kunci jawaban ini adalah referensi yang dihasilkan AI. Jawaban siswa tidak harus sama persis, 
                      yang dinilai adalah kesesuaian konsep.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {attachments.length === 0 && !uploading && (
        <div className="text-center py-4 text-gray-400 text-sm">
          Belum ada lampiran soal. Upload dokumen soal untuk memulai.
        </div>
      )}
    </div>
  );
}
