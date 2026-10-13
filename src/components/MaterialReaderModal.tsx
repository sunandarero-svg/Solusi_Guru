"use client";

import { useState } from "react";
import { X, CheckCircle, FileText, Video, Download, BookOpen, Loader2 } from "lucide-react";

interface MaterialItem {
  id: string;
  title: string;
  description?: string;
  className?: string;
  subjectName?: string;
  fileType?: string;
  sourceType?: string;
  fileUrl?: string;
  fileName?: string;
  content?: string;
  summary?: string;
}

interface MaterialReaderModalProps {
  material: MaterialItem;
  onClose: () => void;
  onCompleteReading: (materialId: string) => Promise<void>;
}

export default function MaterialReaderModal({
  material,
  onClose,
  onCompleteReading,
}: MaterialReaderModalProps) {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    try {
      await onCompleteReading(material.id);
      setCompleted(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      alert("Gagal memperbarui status membaca materi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider">
                {material.subjectName || "Materi Pelajaran"}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {material.className || "Kelas"}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              {material.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 text-slate-700">
          {material.description && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-600 italic">
              {material.description}
            </div>
          )}

          {/* Media Video View */}
          {material.fileType === "video" && material.fileUrl && (
            <div className="space-y-3">
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg">
                <video
                  controls
                  src={material.fileUrl}
                  className="w-full h-full object-contain"
                >
                  Browser Anda tidak mendukung pemutar video.
                </video>
              </div>
              <p className="text-xs text-slate-500 text-center">
                Tonton video penjelasan materi hingga selesai sebelum melanjutkan.
              </p>
            </div>
          )}

          {/* PDF View */}
          {material.fileType === "pdf" && material.fileUrl && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-600 text-white rounded-xl">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Dokumen Materi (PDF)</h4>
                    <p className="text-xs text-slate-500">{material.fileName || "File materi PDF"}</p>
                  </div>
                </div>
                <a
                  href={material.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Download size={14} />
                  <span>Buka / Unduh PDF</span>
                </a>
              </div>

              {material.content && (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {material.content}
                </div>
              )}
            </div>
          )}

          {/* DOCX / PPT View */}
          {(material.fileType === "docx" || material.fileType === "ppt") && material.fileUrl && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-600 text-white rounded-xl">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      Dokumen {material.fileType.toUpperCase()}
                    </h4>
                    <p className="text-xs text-slate-500">{material.fileName || "File materi ajar"}</p>
                  </div>
                </div>
                <a
                  href={material.fileUrl}
                  download
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Download size={14} />
                  <span>Unduh File</span>
                </a>
              </div>

              {material.content && (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {material.content}
                </div>
              )}
            </div>
          )}

          {/* AI Generated Text Content */}
          {material.content && material.fileType === "text" && (
            <div className="prose max-w-none text-slate-800 space-y-4 leading-relaxed whitespace-pre-wrap bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80">
              {material.content}
            </div>
          )}
        </div>

        {/* Footer with Completion Action */}
        <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500 hidden sm:block">
            Tekan tombol di samping setelah Anda selesai membaca untuk membuka game & penugasan.
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-semibold hover:bg-slate-200/60 transition"
            >
              Tutup Sementara
            </button>
            <button
              onClick={handleFinish}
              disabled={loading || completed}
              className={`px-6 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-lg transition-all ${
                completed
                  ? "bg-emerald-600 text-white"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white hover:scale-105 active:scale-95 shadow-emerald-500/20"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : completed ? (
                <>
                  <CheckCircle size={16} />
                  <span>Telah Selesai Dibaca!</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span>Saya Sudah Selesai Membaca</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
