"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Upload,
  BookOpen,
  FileText,
  Video,
  Trash2,
  Eye,
  Plus,
  Gamepad2,
  CheckCircle,
  Clock,
  Loader2,
  X,
  Layers,
  ArrowRight,
  Filter,
  Download,
} from "lucide-react";

interface ClassItem {
  id: string;
  name: string;
  subjects?: { id: string; name: string }[];
}

interface MaterialItem {
  _id: string;
  id?: string;
  title: string;
  description?: string;
  className?: string;
  classId?: any;
  subjectId?: any;
  sourceType: "AI" | "MANUAL_UPLOAD";
  fileType: "video" | "pdf" | "docx" | "ppt" | "text" | "other";
  fileUrl?: string;
  fileName?: string;
  content?: string;
  readByStudents?: any[];
  createdAt: string;
}

export default function TeacherMaterialsPage() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAiMaterialModal, setShowAiMaterialModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showQuestionGenModal, setShowQuestionGenModal] = useState(false);
  const [selectedMaterialForQuestions, setSelectedMaterialForQuestions] = useState<MaterialItem | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<MaterialItem | null>(null);

  // Form State: Buat Materi dari AI
  const [aiForm, setAiForm] = useState({
    title: "",
    classId: "",
    subjectId: "",
    topic: "",
    instructions: "",
  });
  const [aiGeneratedContent, setAiGeneratedContent] = useState("");
  const [aiGeneratedSummary, setAiGeneratedSummary] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);

  // Form State: Upload Manual
  const [uploadForm, setUploadForm] = useState({
    title: "",
    classId: "",
    subjectId: "",
    description: "",
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form State: Generator Soal AI
  const [questionForm, setQuestionForm] = useState({
    targetType: "BORNEO_EDU" as "BORNEO_EDU" | "NEW_ASSIGNMENT",
    questionCount: 10,
    assignmentTitle: "",
    deadline: "",
  });
  const [questionGenerating, setQuestionGenerating] = useState(false);

  // Fetch initial classes and materials
  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/teacher/classes");
      const data = await res.json();
      if (Array.isArray(data)) {
        setClasses(data);
      }
    } catch (err) {
      console.error("Gagal memuat kelas", err);
    }
  };

  const fetchMaterials = async (classId?: string) => {
    setLoading(true);
    try {
      const url = classId && classId !== "all" ? `/api/materials?classId=${classId}` : "/api/materials";
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setMaterials(data);
      }
    } catch (err) {
      console.error("Gagal memuat materi", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchMaterials();
  }, []);

  const handleFilterChange = (classId: string) => {
    setSelectedClassFilter(classId);
    fetchMaterials(classId);
  };

  // 1. Submit Handler: Generate Materi via AI
  const handleGenerateAiMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiForm.title || !aiForm.classId || !aiForm.topic) {
      alert("Harap isi Judul, Tujuan Kelas, dan Topik Materi terlebih dahulu.");
      return;
    }

    setAiGenerating(true);
    try {
      const selectedClass = classes.find((c) => c.id === aiForm.classId);
      const selectedSubject = selectedClass?.subjects?.find((s) => s.id === aiForm.subjectId);

      const res = await fetch("/api/ai/generate-material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiForm.topic,
          className: selectedClass?.name,
          subjectName: selectedSubject?.name,
          instructions: aiForm.instructions,
        }),
      });

      const data = await res.json();
      if (res.ok && data.content) {
        setAiGeneratedContent(data.content);
        setAiGeneratedSummary(data.summary || "");
      } else {
        alert(data.error || "Gagal menghasilkan materi dari AI.");
      }
    } catch (err) {
      alert("Terjadi kesalahan saat memanggil AI.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveAiMaterial = async () => {
    if (!aiGeneratedContent) return;
    setAiSaving(true);
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: aiForm.title,
          classId: aiForm.classId,
          subjectId: aiForm.subjectId || null,
          content: aiGeneratedContent,
          summary: aiGeneratedSummary,
        }),
      });

      if (res.ok) {
        alert("✅ Materi berhasil dibuat dan disimpan!");
        setShowAiMaterialModal(false);
        setAiForm({ title: "", classId: "", subjectId: "", topic: "", instructions: "" });
        setAiGeneratedContent("");
        fetchMaterials(selectedClassFilter);
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menyimpan materi.");
      }
    } catch (err) {
      alert("Terjadi kesalahan server.");
    } finally {
      setAiSaving(false);
    }
  };

  // 2. Submit Handler: Upload Manual (Video, PDF, DOCX, PPT)
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title || !uploadForm.classId || !uploadFile) {
      alert("Harap isi Judul, Tujuan Kelas, dan pilih file yang ingin diunggah.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", uploadForm.title);
      formData.append("classId", uploadForm.classId);
      if (uploadForm.subjectId) formData.append("subjectId", uploadForm.subjectId);
      if (uploadForm.description) formData.append("description", uploadForm.description);
      formData.append("file", uploadFile);

      const res = await fetch("/api/materials", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert("✅ Berhasil mengunggah materi!");
        setShowUploadModal(false);
        setUploadForm({ title: "", classId: "", subjectId: "", description: "" });
        setUploadFile(null);
        fetchMaterials(selectedClassFilter);
      } else {
        const data = await res.json();
        alert(data.error || "Gagal mengunggah materi.");
      }
    } catch (err) {
      alert("Terjadi kesalahan upload.");
    } finally {
      setUploading(false);
    }
  };

  // 3. Submit Handler: Generator Soal AI (Borneo Edu vs Tugas Baru)
  const handleOpenQuestionModal = (material: MaterialItem) => {
    setSelectedMaterialForQuestions(material);
    setQuestionForm({
      targetType: "BORNEO_EDU",
      questionCount: 10,
      assignmentTitle: `Tugas Tulisan Tangan: ${material.title}`,
      deadline: "",
    });
    setShowQuestionGenModal(true);
  };

  const handleGenerateQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterialForQuestions) return;

    setQuestionGenerating(true);
    try {
      const targetClassId =
        typeof selectedMaterialForQuestions.classId === "object"
          ? selectedMaterialForQuestions.classId._id
          : selectedMaterialForQuestions.classId;

      const res = await fetch("/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: selectedMaterialForQuestions._id,
          classId: targetClassId,
          targetType: questionForm.targetType,
          questionCount: questionForm.questionCount,
          assignmentTitle: questionForm.assignmentTitle,
          deadline: questionForm.deadline || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`🎉 ${data.message}`);
        setShowQuestionGenModal(false);
      } else {
        alert(data.error || "Gagal membuat soal dari AI.");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem saat generate soal.");
    } finally {
      setQuestionGenerating(false);
    }
  };

  // 4. Delete Handler
  const handleDeleteMaterial = async (id: string, title: string) => {
    if (!confirm(`Hapus materi "${title}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      const res = await fetch(`/api/materials/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchMaterials(selectedClassFilter);
      } else {
        alert("Gagal menghapus materi.");
      }
    } catch (err) {
      alert("Terjadi kesalahan server.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider mb-2">
            <BookOpen size={13} />
            <span>Manajemen Pembelajaran Guru</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Materi Pelajaran & Generator Soal AI
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Buat materi pembelajaran via AI atau Upload Manual (Video, PDF, DOCX, PPT), serta generate soal ke Borneo Edu & Buku Tulis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowAiMaterialModal(true)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Sparkles size={18} className="text-yellow-300" />
            <span>✨ Buat Materi dari AI</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Upload size={18} />
            <span>📤 Upload Manual</span>
          </button>
        </div>
      </div>

      {/* Filter by Class */}
      <div className="glass rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
          <Filter size={16} className="text-emerald-600" />
          <span>Filter Kelas Tujuan:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => handleFilterChange("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedClassFilter === "all"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Semua Kelas
          </button>
          {classes.map((c) => (
            <button
              key={c.id}
              onClick={() => handleFilterChange(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedClassFilter === c.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Materials List */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 space-y-3">
          <Loader2 className="animate-spin mx-auto text-emerald-500" size={32} />
          <p className="text-sm font-medium">Memuat data materi...</p>
        </div>
      ) : materials.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center space-y-4 border border-dashed border-slate-300">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <BookOpen size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Belum Ada Materi Pembelajaran</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Mulai buat materi untuk kelas Anda menggunakan bantuan AI kurikulum atau unggah file dokumen/video secara langsung.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => setShowAiMaterialModal(true)}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
            >
              ✨ Buat via AI
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              📤 Upload Manual
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((mat) => {
            const className = mat.className || (typeof mat.classId === "object" ? mat.classId?.name : "Kelas");
            const subjectName = typeof mat.subjectId === "object" ? mat.subjectId?.name : "Umum";
            const readCount = mat.readByStudents?.length || 0;

            return (
              <div
                key={mat._id}
                className="glass rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                        {className}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                        {subjectName}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          mat.sourceType === "AI"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {mat.sourceType === "AI" ? "✨ AI Generated" : `📁 ${mat.fileType.toUpperCase()}`}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteMaterial(mat._id, mat.title)}
                      className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition"
                      title="Hapus Materi"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight group-hover:text-emerald-700 transition">
                      {mat.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {mat.description || mat.content || "Tidak ada deskripsi tambahan."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <CheckCircle size={14} className="text-emerald-500" />
                    <span>
                      Dibaca oleh <strong className="text-slate-800">{readCount}</strong> siswa
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-5 mt-4 space-y-2">
                  {/* TOMBOL UTAMA: GENERATE SOAL AI BERDASARKAN MATERI INI */}
                  <button
                    onClick={() => handleOpenQuestionModal(mat)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <Sparkles size={15} className="text-yellow-200" />
                    <span>🤖 Buat Soal dari AI</span>
                  </button>

                  <button
                    onClick={() => setPreviewMaterial(mat)}
                    className="w-full py-2 px-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye size={14} />
                    <span>Lihat & Preview Materi</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: BUAT MATERI DARI AI */}
      {/* ========================================================================= */}
      {showAiMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-black uppercase mb-1">
                  <Sparkles size={12} />
                  <span>AI Curriculum Assistant</span>
                </div>
                <h2 className="text-2xl font-black text-slate-800">Buat Materi dengan AI</h2>
              </div>
              <button
                onClick={() => setShowAiMaterialModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGenerateAiMaterial} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  1. Judul Materi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ekosistem Flora dan Fauna Kalimantan"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-purple-500/40 focus:outline-none text-slate-900 bg-white placeholder:text-slate-400"
                  value={aiForm.title}
                  onChange={(e) => setAiForm({ ...aiForm, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    2. Tujuan Kelas <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-purple-500/40 focus:outline-none bg-white text-slate-900"
                    value={aiForm.classId}
                    onChange={(e) => {
                      const cId = e.target.value;
                      const cObj = classes.find((c) => c.id === cId);
                      setAiForm({
                        ...aiForm,
                        classId: cId,
                        subjectId: cObj?.subjects?.[0]?.id || "",
                      });
                    }}
                  >
                    <option value="" className="text-slate-900 bg-white">-- Pilih Kelas --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id} className="text-slate-900 bg-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    3. Mata Pelajaran
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-purple-500/40 focus:outline-none bg-white text-slate-900"
                    value={aiForm.subjectId}
                    onChange={(e) => setAiForm({ ...aiForm, subjectId: e.target.value })}
                  >
                    <option value="" className="text-slate-900 bg-white">-- Umum / Default --</option>
                    {classes
                      .find((c) => c.id === aiForm.classId)
                      ?.subjects?.map((s) => (
                        <option key={s.id} value={s.id} className="text-slate-900 bg-white">
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  4. Topik / Pokok Bahasan Utama <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rantai makanan, habitat hutan hujan tropis, dan konservasi bekantan"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-purple-500/40 focus:outline-none text-slate-900 bg-white placeholder:text-slate-400"
                  value={aiForm.topic}
                  onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  5. Instruksi Khusus untuk AI (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Sertakan analogi mudah dipahami siswa SMP dan 3 studi kasus lokal."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-purple-500/40 focus:outline-none text-slate-900 bg-white placeholder:text-slate-400"
                  value={aiForm.instructions}
                  onChange={(e) => setAiForm({ ...aiForm, instructions: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={aiGenerating}
                className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-60 shadow-lg shadow-purple-500/20"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>AI sedang menyusun materi kurikulum...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Generate Materi Sekarang</span>
                  </>
                )}
              </button>
            </form>

            {/* Generated Content Preview & Save */}
            {aiGeneratedContent && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm">Preview Materi yang Disusun AI:</h4>
                  <span className="text-xs text-purple-600 font-semibold">Dapat diedit manual</span>
                </div>
                <textarea
                  rows={8}
                  className="w-full p-4 rounded-xl border border-slate-200 text-xs font-mono bg-white text-slate-900 leading-relaxed focus:ring-2 focus:ring-purple-500/40 focus:outline-none"
                  value={aiGeneratedContent}
                  onChange={(e) => setAiGeneratedContent(e.target.value)}
                />
                <button
                  type="button"
                  disabled={aiSaving}
                  onClick={handleSaveAiMaterial}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20"
                >
                  {aiSaving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Menyimpan ke Kelas...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      <span>Simpan & Publikasikan Materi ke Kelas</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: UPLOAD MATERI MANUAL (VIDEO, PDF, DOCX, PPT) */}
      {/* ========================================================================= */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase mb-1">
                  <Upload size={12} />
                  <span>Manual Upload</span>
                </div>
                <h2 className="text-2xl font-black text-slate-800">Upload Materi Pembelajaran</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mendukung file <strong>Video (.mp4, .webm)</strong>, <strong>PDF</strong>, <strong>DOCX</strong>, dan <strong>PPT</strong>
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  1. Judul Materi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Modul Struktur Sel & Video Pembelajaran"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500/40 focus:outline-none text-slate-900 bg-white placeholder:text-slate-400"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    2. Tujuan Kelas <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500/40 focus:outline-none bg-white text-slate-900"
                    value={uploadForm.classId}
                    onChange={(e) => {
                      const cId = e.target.value;
                      const cObj = classes.find((c) => c.id === cId);
                      setUploadForm({
                        ...uploadForm,
                        classId: cId,
                        subjectId: cObj?.subjects?.[0]?.id || "",
                      });
                    }}
                  >
                    <option value="" className="text-slate-900 bg-white">-- Pilih Kelas --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id} className="text-slate-900 bg-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    3. Mata Pelajaran
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500/40 focus:outline-none bg-white text-slate-900"
                    value={uploadForm.subjectId}
                    onChange={(e) => setUploadForm({ ...uploadForm, subjectId: e.target.value })}
                  >
                    <option value="" className="text-slate-900 bg-white">-- Umum / Default --</option>
                    {classes
                      .find((c) => c.id === uploadForm.classId)
                      ?.subjects?.map((s) => (
                        <option key={s.id} value={s.id} className="text-slate-900 bg-white">
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  4. Ringkasan / Deskripsi Materi
                </label>
                <textarea
                  rows={2}
                  placeholder="Tuliskan petunjuk atau rangkuman materi untuk siswa..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500/40 focus:outline-none text-slate-900 bg-white placeholder:text-slate-400"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  5. Pilih File Materi (Video / PDF / DOCX / PPT) <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-2xl p-6 text-center transition-colors bg-slate-50/60">
                  <input
                    type="file"
                    required
                    accept=".mp4,.webm,.mov,.pdf,.docx,.doc,.pptx,.ppt,video/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
                  />
                  {uploadFile && (
                    <div className="mt-3 text-xs font-bold text-emerald-700">
                      ✓ File terpilih: {uploadFile.name} ({(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 transition disabled:opacity-60 shadow-lg shadow-emerald-500/20"
              >
                {uploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Sedang mengunggah & memproses file...</span>
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    <span>Upload & Publikasikan Materi</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: GENERATOR SOAL AI DARI MATERI KELAS (BORNEO EDU VS TUGAS BARU) */}
      {/* ========================================================================= */}
      {showQuestionGenModal && selectedMaterialForQuestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black uppercase mb-1">
                  <Sparkles size={12} />
                  <span>AI Question Generator</span>
                </div>
                <h2 className="text-2xl font-black text-slate-800">Generate Soal dari Materi</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Materi terpilih: <strong className="text-slate-800">{selectedMaterialForQuestions.title}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowQuestionGenModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGenerateQuestions} className="space-y-5">
              {/* DROPDOWN TUJUAN PENUGASAN (BORNEO EDU VS TUGAS BARU) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Pilih Tujuan Penugasan Soal AI: <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-amber-300 text-sm font-bold text-slate-900 bg-amber-50/50 focus:ring-2 focus:ring-amber-500/40 focus:outline-none"
                  value={questionForm.targetType}
                  onChange={(e) =>
                    setQuestionForm({
                      ...questionForm,
                      targetType: e.target.value as "BORNEO_EDU" | "NEW_ASSIGNMENT",
                    })
                  }
                >
                  <option value="BORNEO_EDU" className="text-slate-900 bg-white">🎮 Game Borneo EDU (Dimasukkan ke Level Game Kelas Ini)</option>
                  <option value="NEW_ASSIGNMENT" className="text-slate-900 bg-white">📝 Tugas Baru (Ditulis Tangan oleh Siswa di Buku Tulis)</option>
                </select>
              </div>

              {/* INFORMASI SESUAI OPSI TERPILIH */}
              {questionForm.targetType === "BORNEO_EDU" ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>🎮 Penjelasan Tujuan Borneo Edu:</span>
                  </div>
                  <p className="leading-relaxed">
                    Soal pilihan ganda bergradasi (Pengetahuan, Pemahaman, Penerapan, Analisis, HOTS, hingga Boss) akan digenerate otomatis dan dimasukkan ke dalam game petualangan <strong>khusus untuk kelas ini</strong>. Setiap kelas memiliki bank soal masing-masing sesuai materi yang diajarkan!
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>📝 Penjelasan Tugas Baru (Tulisan Tangan):</span>
                  </div>
                  <p className="leading-relaxed">
                    AI akan membuat soal uraian/pemahaman mendalam yang langsung diterbitkan menjadi penugasan kelas baru. Siswa akan menyalin dan menjawab di buku tulis, lalu mengunggahnya lewat fitur <strong>Kamera Kumpulkan Tugas</strong>.
                  </p>
                </div>
              )}

              {/* Jumlah Soal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Jumlah Soal yang Digenerate:
                </label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-amber-500/40 focus:outline-none bg-white text-slate-900"
                  value={questionForm.questionCount}
                  onChange={(e) => setQuestionForm({ ...questionForm, questionCount: Number(e.target.value) })}
                >
                  <option value={5} className="text-slate-900 bg-white">5 Soal</option>
                  <option value={10} className="text-slate-900 bg-white">10 Soal (Direkomendasikan)</option>
                  <option value={15} className="text-slate-900 bg-white">15 Soal</option>
                  <option value={20} className="text-slate-900 bg-white">20 Soal</option>
                  <option value={25} className="text-slate-900 bg-white">25 Soal (Mencakup Semua Level 1 s.d. 25 & Boss)</option>
                </select>
              </div>

              {/* Judul Tugas Khusus Jika Tugas Baru */}
              {questionForm.targetType === "NEW_ASSIGNMENT" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Judul Tugas Baru:
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500/40 focus:outline-none text-slate-900 bg-white placeholder:text-slate-400"
                      value={questionForm.assignmentTitle}
                      onChange={(e) => setQuestionForm({ ...questionForm, assignmentTitle: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Batas Waktu Pengumpulan (Deadline):
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500/40 focus:outline-none text-slate-900 bg-white"
                      value={questionForm.deadline}
                      onChange={(e) => setQuestionForm({ ...questionForm, deadline: e.target.value })}
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={questionGenerating}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm flex items-center justify-center gap-2 transition disabled:opacity-60 shadow-xl shadow-amber-500/20 hover:scale-[1.01]"
              >
                {questionGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>AI sedang merancang soal berdasarkan materi...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>
                      {questionForm.targetType === "BORNEO_EDU"
                        ? "🚀 Masukkan Soal ke Game Borneo EDU"
                        : "📝 Buat Penugasan Buku Tulis Baru"}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PREVIEW DETAIL MATERI */}
      {/* ========================================================================= */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                  {previewMaterial.className || "Kelas"}
                </span>
                <h2 className="text-2xl font-black text-slate-800 mt-1">{previewMaterial.title}</h2>
              </div>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-700">
              {previewMaterial.fileType === "video" && previewMaterial.fileUrl && (
                <div className="aspect-video rounded-2xl overflow-hidden bg-black">
                  <video controls src={previewMaterial.fileUrl} className="w-full h-full object-contain" />
                </div>
              )}

              {previewMaterial.fileUrl && (previewMaterial.fileType === "pdf" || previewMaterial.fileType === "docx" || previewMaterial.fileType === "ppt") && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={24} className="text-emerald-600" />
                    <div>
                      <p className="font-bold text-slate-800 text-sm">Dokumen {previewMaterial.fileType.toUpperCase()}</p>
                      <p className="text-xs text-slate-500">{previewMaterial.fileName || "File materi"}</p>
                    </div>
                  </div>
                  <a
                    href={previewMaterial.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <Download size={14} />
                    <span>Unduh / Buka</span>
                  </a>
                </div>
              )}

              {previewMaterial.content && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs leading-relaxed font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {previewMaterial.content}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setPreviewMaterial(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
