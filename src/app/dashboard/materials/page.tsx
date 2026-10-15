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
  Copy,
  Sliders,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import InteractiveMaterialViewer from "@/components/InteractiveMaterialViewer";
import { MaterialDisplayFormat, IInteractiveData } from "@/models/Material";
import { extractInteractiveDataFromMaterial } from "@/modules/materials/interactiveDataExtractor";

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
  summary?: string;
  displayFormat?: MaterialDisplayFormat;
  interactiveData?: IInteractiveData;
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

  // Modal State: Duplikasi Materi ke Kelas Lain
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [selectedMaterialForDuplicate, setSelectedMaterialForDuplicate] = useState<MaterialItem | null>(null);
  const [duplicateClassId, setDuplicateClassId] = useState("");
  const [duplicateSubjectId, setDuplicateSubjectId] = useState("");
  const [duplicating, setDuplicating] = useState(false);

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
  const [aiInteractiveData, setAiInteractiveData] = useState<IInteractiveData | null>(null);
  const [selectedDisplayFormat, setSelectedDisplayFormat] = useState<MaterialDisplayFormat>("FLASHCARD");
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
    borneoQuestionsPerLevel: 4,
    borneoMode: "UNIFORM" as "UNIFORM" | "CUSTOM",
    borneoCustomPerLevel: {} as Record<number, number>,
    assignmentTitle: "",
    deadline: "",
    writtenTypes: {
      PILIHAN_GANDA: { enabled: true, count: 5 },
      BENAR_SALAH: { enabled: true, count: 3 },
      ISIAN_SINGKAT: { enabled: true, count: 2 },
      ESSAY: { enabled: true, count: 2 },
      PILIHAN_GANDA_KOMPLEKS: { enabled: false, count: 2 },
      SEBAB_AKIBAT: { enabled: false, count: 2 },
    },
  });
  const [showCustomLevelGrid, setShowCustomLevelGrid] = useState(false);
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
        const iData =
          data.interactiveData ||
          extractInteractiveDataFromMaterial(data.content, aiForm.title || aiForm.topic);
        setAiInteractiveData(iData);
        setSelectedDisplayFormat("FLASHCARD");
      } else {
        alert(data.error || "Gagal menghasilkan materi dari AI.");
      }
    } catch (err) {
      alert("Terjadi kesalahan saat memanggil AI.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleRefreshInteractiveData = () => {
    if (!aiGeneratedContent) return;
    const refreshed = extractInteractiveDataFromMaterial(
      aiGeneratedContent,
      aiForm.title || aiForm.topic
    );
    setAiInteractiveData(refreshed);
    alert("⚡ Flash Card, Slide, dan Peta Konsep berhasil diperbarui berdasarkan teks terkini!");
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
          displayFormat: selectedDisplayFormat,
          interactiveData: aiInteractiveData,
        }),
      });

      if (res.ok) {
        alert("✅ Materi berhasil dibuat dan disimpan!");
        setShowAiMaterialModal(false);
        setAiForm({ title: "", classId: "", subjectId: "", topic: "", instructions: "" });
        setAiGeneratedContent("");
        setAiInteractiveData(null);
        setSelectedDisplayFormat("FLASHCARD");
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
    setShowCustomLevelGrid(false);
    setQuestionForm({
      targetType: "BORNEO_EDU",
      borneoQuestionsPerLevel: 4,
      borneoMode: "UNIFORM",
      borneoCustomPerLevel: {},
      assignmentTitle: `Tugas Tulisan Tangan: ${material.title}`,
      deadline: "",
      writtenTypes: {
        PILIHAN_GANDA: { enabled: true, count: 5 },
        BENAR_SALAH: { enabled: true, count: 3 },
        ISIAN_SINGKAT: { enabled: true, count: 2 },
        ESSAY: { enabled: true, count: 2 },
        PILIHAN_GANDA_KOMPLEKS: { enabled: false, count: 2 },
        SEBAB_AKIBAT: { enabled: false, count: 2 },
      },
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

      const payload: any = {
        materialId: selectedMaterialForQuestions._id,
        classId: targetClassId,
        targetType: questionForm.targetType,
      };

      if (questionForm.targetType === "BORNEO_EDU") {
        payload.questionsPerLevel = questionForm.borneoQuestionsPerLevel;
        if (questionForm.borneoMode === "CUSTOM") {
          payload.levelQuestionsMap = questionForm.borneoCustomPerLevel;
        }
      } else {
        const typeConfig: Record<string, number> = {};
        for (const [key, val] of Object.entries(questionForm.writtenTypes)) {
          if (val.enabled && val.count > 0) {
            typeConfig[key] = val.count;
          }
        }
        if (Object.keys(typeConfig).length === 0) {
          alert("Pilih setidaknya satu jenis soal dengan jumlah minimal 1 butir.");
          setQuestionGenerating(false);
          return;
        }
        payload.assignmentTitle = questionForm.assignmentTitle || `Tugas Tulisan Tangan: ${selectedMaterialForQuestions.title}`;
        payload.deadline = questionForm.deadline || null;
        payload.questionTypesConfig = typeConfig;
        payload.questionCount = Object.values(typeConfig).reduce((a, b) => a + b, 0);
      }

      const res = await fetch("/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  // 5. Duplicate Handler
  const handleOpenDuplicateModal = (material: MaterialItem) => {
    setSelectedMaterialForDuplicate(material);
    const currentClassId = typeof material.classId === "object" ? material.classId?._id : material.classId;
    const otherClass = classes.find((c) => c.id !== currentClassId) || classes[0];
    const initialClassId = otherClass ? otherClass.id : "";
    setDuplicateClassId(initialClassId);
    setDuplicateSubjectId(otherClass?.subjects?.[0]?.id || "");
    setShowDuplicateModal(true);
  };

  const handleDuplicateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterialForDuplicate || !duplicateClassId) {
      alert("Harap pilih kelas tujuan duplikasi.");
      return;
    }

    setDuplicating(true);
    try {
      const res = await fetch(`/api/materials/${selectedMaterialForDuplicate._id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: duplicateClassId,
          subjectId: duplicateSubjectId || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`🎉 ${data.message || "Materi berhasil diduplikasi ke kelas tujuan!"}`);
        setShowDuplicateModal(false);
        fetchMaterials(selectedClassFilter);
      } else {
        alert(data.error || "Gagal menduplikasi materi.");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem saat menduplikasi materi.");
    } finally {
      setDuplicating(false);
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

                  {/* TOMBOL DUPLIKASI KE KELAS LAIN (TERUTAMA UNTUK MATERI AI) */}
                  <button
                    onClick={() => handleOpenDuplicateModal(mat)}
                    className="w-full py-2 px-4 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 hover:border-indigo-300 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    title="Duplikasi materi ini ke kelas lain"
                  >
                    <Copy size={14} className="text-indigo-600" />
                    <span>🔁 Duplikasi ke Kelas Lain</span>
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
          <div className={`bg-white rounded-3xl w-full ${aiGeneratedContent ? "max-w-4xl" : "max-w-2xl"} max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 transition-all duration-300`}>
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

            {/* Generated Content Preview, Flashcard Options & Save */}
            {aiGeneratedContent && (
              <div className="space-y-6 pt-6 border-t border-slate-200 animate-in fade-in duration-300">
                {/* Header Banner */}
                <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-xl space-y-2 border border-purple-500/30">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-sm">
                      <Sparkles size={13} />
                      <span>MATERI SELESAI DISUSUN OLEH AI</span>
                    </span>
                    <span className="text-xs text-purple-200 font-semibold">
                      Pratinjau Sebelum Publikasi
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    Pilihan Format Tampilan Materi Siswa
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    Sebelum materi disimpan dan dipublikasikan ke siswa, pastikan Anda meninjau atau memilih tampilan yang diinginkan. Anda dapat membuat materi tampil sebagai <strong>Flash Card Interaktif</strong>, <strong>Slide Presentasi</strong>, <strong>Peta Konsep</strong>, atau <strong>Teks Lengkap</strong>.
                  </p>
                </div>

                {/* Format Picker Cards */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Pilih Format Tampilan Utama untuk Siswa:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      {
                        id: "FLASHCARD" as const,
                        icon: "🗂️",
                        title: "Flash Card",
                        desc: "Kartu pintar bolak-balik 3D",
                        tag: "Direkomendasikan ⭐",
                      },
                      {
                        id: "SLIDES" as const,
                        icon: "📽️",
                        title: "Slide Presentasi",
                        desc: "Poin visual per topik",
                        tag: "Visual",
                      },
                      {
                        id: "MINDMAP" as const,
                        icon: "🧠",
                        title: "Peta Konsep",
                        desc: "Struktur hierarki materi",
                        tag: "Struktural",
                      },
                      {
                        id: "STANDARD" as const,
                        icon: "📄",
                        title: "Teks Dokumen",
                        desc: "Uraian kurikulum lengkap",
                        tag: "Lengkap",
                      },
                    ].map((fmt) => {
                      const isSelected = selectedDisplayFormat === fmt.id;
                      return (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => setSelectedDisplayFormat(fmt.id)}
                          className={`p-3 rounded-2xl border-2 text-left transition-all ${
                            isSelected
                              ? "border-purple-600 bg-purple-50/70 shadow-md scale-[1.02]"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xl">{fmt.icon}</span>
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                isSelected
                                  ? "bg-purple-600 text-white"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {fmt.tag}
                            </span>
                          </div>
                          <div className="font-black text-xs text-slate-800">{fmt.title}</div>
                          <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{fmt.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Viewer Component */}
                <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                  <InteractiveMaterialViewer
                    topicTitle={aiForm.title || aiForm.topic || "Materi Pembelajaran"}
                    content={aiGeneratedContent}
                    interactiveData={aiInteractiveData}
                    defaultFormat={selectedDisplayFormat}
                    editable={true}
                    onContentChange={(newTxt) => setAiGeneratedContent(newTxt)}
                    onInteractiveDataChange={(newData) => setAiInteractiveData(newData)}
                    onSelectDisplayFormat={(fmt) => setSelectedDisplayFormat(fmt)}
                  />

                  {/* Sync Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                    <span className="text-slate-500 text-[11px]">
                      💡 Ingin memperbarui Flash Card setelah mengubah teks?
                    </span>
                    <button
                      type="button"
                      onClick={handleRefreshInteractiveData}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
                    >
                      <Sparkles size={13} />
                      <span>⚡ Sinkronkan Ulang dari Teks</span>
                    </button>
                  </div>
                </div>

                {/* Save and Publish Button */}
                <button
                  type="button"
                  disabled={aiSaving}
                  onClick={handleSaveAiMaterial}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 transition shadow-xl shadow-emerald-500/25 active:scale-95"
                >
                  {aiSaving ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Menyimpan & Mempublikasikan ke Kelas...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      <span>
                        Simpan & Publikasikan Materi ke Kelas (Tampilan Utama: {
                          selectedDisplayFormat === "FLASHCARD"
                            ? "Flash Card"
                            : selectedDisplayFormat === "SLIDES"
                            ? "Slide Presentasi"
                            : selectedDisplayFormat === "MINDMAP"
                            ? "Peta Konsep"
                            : "Teks Lengkap"
                        })
                      </span>
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
                  onChange={(e) => {
                    const val = e.target.value as "BORNEO_EDU" | "NEW_ASSIGNMENT";
                    setQuestionForm({
                      ...questionForm,
                      targetType: val,
                    });
                  }}
                >
                  <option value="BORNEO_EDU" className="text-slate-900 bg-white">🎮 Game Borneo EDU (Paket Lengkap 101 Soal: World 1 - 5 & Boss)</option>
                  <option value="NEW_ASSIGNMENT" className="text-slate-900 bg-white">📝 Tugas Baru (Ditulis Tangan oleh Siswa di Buku Tulis)</option>
                </select>
              </div>

              {/* INFORMASI SESUAI OPSI TERPILIH */}
              {questionForm.targetType === "BORNEO_EDU" ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>🎮 Konfigurasi Soal Game Borneo Edu:</span>
                  </div>
                  <p className="leading-relaxed">
                    Atur terlebih dahulu jumlah soal yang ingin dibuat untuk setiap level (Level 1 s.d. Level 25). Soal bersumber <strong>100% dari materi &ldquo;{selectedMaterialForQuestions.title}&rdquo;</strong> dengan kunci jawaban bervariasi (A, B, C, D).
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>📝 Konfigurasi Tugas Tulis Tangan di Buku Tulis:</span>
                  </div>
                  <p className="leading-relaxed">
                    Atur jenis-jenis soal dan jumlahnya sesuai rancangan tugas Anda. AI akan menyusun soal beserta kunci jawaban terstruktur untuk dinilai otomatis oleh AI Grader saat siswa memotret hasil tulisan tangannya.
                  </p>
                </div>
              )}

              {/* ========================================================= */}
              {/* KONTROL 1: PENGATURAN SOAL GAME BORNEO EDU */}
              {/* ========================================================= */}
              {questionForm.targetType === "BORNEO_EDU" && (() => {
                const totalBorneoQuestions = Array.from({ length: 25 }, (_, i) => i + 1).reduce((acc, lvl) => {
                  const cnt = questionForm.borneoMode === "CUSTOM"
                    ? (questionForm.borneoCustomPerLevel[lvl] || questionForm.borneoQuestionsPerLevel)
                    : questionForm.borneoQuestionsPerLevel;
                  return acc + cnt;
                }, 0);

                const applyBorneoPreset = (count: number) => {
                  setQuestionForm({
                    ...questionForm,
                    borneoQuestionsPerLevel: count,
                    borneoMode: "UNIFORM",
                    borneoCustomPerLevel: {},
                  });
                };

                return (
                  <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders size={14} className="text-amber-600" />
                        <span>Jumlah Soal per Level Game (Level 1 - 25)</span>
                      </label>
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                        Total: {totalBorneoQuestions} Soal
                      </span>
                    </div>

                    {/* Presets Cepat */}
                    <div>
                      <span className="text-[11px] text-slate-500 font-semibold block mb-1.5">Pilihan Cepat (Preset):</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { label: "⚡ Kilat (2 Soal)", count: 2, desc: "50 Soal" },
                          { label: "🎯 Standar (3 Soal)", count: 3, desc: "75 Soal" },
                          { label: "🏆 Lengkap (4 Soal)", count: 4, desc: "100 Soal" },
                          { label: "🌟 Maksimal (5 Soal)", count: 5, desc: "125 Soal" },
                        ].map((preset) => {
                          const isSelected = questionForm.borneoMode === "UNIFORM" && questionForm.borneoQuestionsPerLevel === preset.count;
                          return (
                            <button
                              key={preset.count}
                              type="button"
                              onClick={() => applyBorneoPreset(preset.count)}
                              className={`p-2.5 rounded-xl text-left border transition ${
                                isSelected
                                  ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                                  : "bg-white text-slate-700 border-slate-200 hover:border-amber-300"
                              }`}
                            >
                              <div className="text-xs font-black">{preset.label}</div>
                              <div className={`text-[10px] ${isSelected ? "text-amber-100" : "text-slate-400"}`}>
                                Total {preset.desc}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Slider & Input Seragam */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-700">Jumlah Soal per Level:</span>
                        <span className="font-black text-amber-600 text-sm">
                          {questionForm.borneoQuestionsPerLevel} Soal / Level
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={1}
                          max={8}
                          value={questionForm.borneoQuestionsPerLevel}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setQuestionForm({
                              ...questionForm,
                              borneoQuestionsPerLevel: val,
                            });
                          }}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                        <input
                          type="number"
                          min={1}
                          max={8}
                          value={questionForm.borneoQuestionsPerLevel}
                          onChange={(e) => {
                            const val = Math.max(1, Math.min(8, Number(e.target.value) || 1));
                            setQuestionForm({
                              ...questionForm,
                              borneoQuestionsPerLevel: val,
                            });
                          }}
                          className="w-16 px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-black text-center text-slate-800"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Rentang: 1 sampai 8 soal untuk masing-masing level petualangan.
                      </p>
                    </div>

                    {/* Mode Toggle & Kustomisasi Level */}
                    <div className="pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          const nextMode = questionForm.borneoMode === "UNIFORM" ? "CUSTOM" : "UNIFORM";
                          setShowCustomLevelGrid(nextMode === "CUSTOM");
                          setQuestionForm({
                            ...questionForm,
                            borneoMode: nextMode,
                          });
                        }}
                        className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1.5"
                      >
                        <span>{showCustomLevelGrid ? "▼" : "▶"}</span>
                        <span>
                          {questionForm.borneoMode === "CUSTOM"
                            ? "Kustomisasi per Level Aktif (Klik untuk tutup rincian)"
                            : "Atur Jumlah Soal Spesifik Tiap Level (Opsional Kustom per Level)"}
                        </span>
                      </button>

                      {showCustomLevelGrid && (
                        <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200 space-y-3 animate-in fade-in max-h-56 overflow-y-auto">
                          <p className="text-[11px] text-slate-500">
                            Ubah jumlah soal untuk level tertentu (misalnya level tantangan Boss di Level 5, 10, 15, 20, atau 25):
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {Array.from({ length: 25 }, (_, i) => i + 1).map((lvl) => {
                              const isBoss = lvl % 5 === 0;
                              const currentVal = questionForm.borneoCustomPerLevel[lvl] || questionForm.borneoQuestionsPerLevel;
                              return (
                                <div
                                  key={lvl}
                                  className={`p-2 rounded-lg border text-center ${
                                    isBoss ? "bg-amber-50/70 border-amber-300" : "bg-slate-50 border-slate-200"
                                  }`}
                                >
                                  <div className="text-[10px] font-bold text-slate-600">
                                    Lvl {lvl} {isBoss ? "👑" : ""}
                                  </div>
                                  <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={currentVal}
                                    onChange={(e) => {
                                      const val = Math.max(1, Math.min(10, Number(e.target.value) || 1));
                                      setQuestionForm({
                                        ...questionForm,
                                        borneoMode: "CUSTOM",
                                        borneoCustomPerLevel: {
                                          ...questionForm.borneoCustomPerLevel,
                                          [lvl]: val,
                                        },
                                      });
                                    }}
                                    className="w-full mt-1 py-0.5 rounded border border-slate-300 text-xs font-black text-center text-slate-800"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ========================================================= */}
              {/* KONTROL 2: PENGATURAN JENIS & JUMLAH SOAL TULIS TANGAN */}
              {/* ========================================================= */}
              {questionForm.targetType === "NEW_ASSIGNMENT" && (() => {
                const totalWrittenQuestions = Object.values(questionForm.writtenTypes).reduce(
                  (sum, t) => sum + (t.enabled ? t.count : 0),
                  0
                );

                const questionTypeMeta: Record<string, { label: string; icon: string; desc: string }> = {
                  PILIHAN_GANDA: {
                    label: "Pilihan Ganda",
                    icon: "🔘",
                    desc: "Pilihan A, B, C, D (Siswa menuliskan huruf jawaban di buku tulis)",
                  },
                  BENAR_SALAH: {
                    label: "Benar - Salah",
                    icon: "⚖️",
                    desc: "Pernyataan faktual materi (Siswa menuliskan 'Benar' atau 'Salah' & alasan)",
                  },
                  ISIAN_SINGKAT: {
                    label: "Isian Singkat",
                    icon: "✏️",
                    desc: "Menanyakan istilah, nama bagian, atau kata kunci penting secara ringkas",
                  },
                  ESSAY: {
                    label: "Essay / Uraian",
                    icon: "📖",
                    desc: "Menuntut uraian lengkap, alur mekanisme, dan pemahaman analitis mendalam",
                  },
                  PILIHAN_GANDA_KOMPLEKS: {
                    label: "Pilihan Ganda Kompleks",
                    icon: "☑️",
                    desc: "Siswa memilih lebih dari satu opsi jawaban yang benar (misal: A dan C)",
                  },
                  SEBAB_AKIBAT: {
                    label: "Sebab - Akibat / Studi Kasus",
                    icon: "🔗",
                    desc: "Menganalisis hubungan sebab-akibat atau studi kasus konkret dari materi",
                  },
                };

                const applyWrittenPreset = (presetName: "mixed" | "objective" | "essay") => {
                  if (presetName === "mixed") {
                    setQuestionForm({
                      ...questionForm,
                      writtenTypes: {
                        PILIHAN_GANDA: { enabled: true, count: 5 },
                        BENAR_SALAH: { enabled: true, count: 3 },
                        ISIAN_SINGKAT: { enabled: true, count: 2 },
                        ESSAY: { enabled: true, count: 2 },
                        PILIHAN_GANDA_KOMPLEKS: { enabled: false, count: 0 },
                        SEBAB_AKIBAT: { enabled: false, count: 0 },
                      },
                    });
                  } else if (presetName === "objective") {
                    setQuestionForm({
                      ...questionForm,
                      writtenTypes: {
                        PILIHAN_GANDA: { enabled: true, count: 10 },
                        BENAR_SALAH: { enabled: true, count: 5 },
                        ISIAN_SINGKAT: { enabled: false, count: 0 },
                        ESSAY: { enabled: false, count: 0 },
                        PILIHAN_GANDA_KOMPLEKS: { enabled: false, count: 0 },
                        SEBAB_AKIBAT: { enabled: false, count: 0 },
                      },
                    });
                  } else {
                    setQuestionForm({
                      ...questionForm,
                      writtenTypes: {
                        PILIHAN_GANDA: { enabled: false, count: 0 },
                        BENAR_SALAH: { enabled: false, count: 0 },
                        ISIAN_SINGKAT: { enabled: true, count: 5 },
                        ESSAY: { enabled: true, count: 5 },
                        PILIHAN_GANDA_KOMPLEKS: { enabled: false, count: 0 },
                        SEBAB_AKIBAT: { enabled: false, count: 0 },
                      },
                    });
                  }
                };

                return (
                  <div className="space-y-4">
                    {/* Preset Cepat Tugas Tulis Tangan */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <span>📋</span>
                          <span>Pilih Komposisi Jenis Soal Tugas:</span>
                        </label>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                          Total: {totalWrittenQuestions} Soal Terpilih
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => applyWrittenPreset("mixed")}
                          className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/60 text-left transition"
                        >
                          <div className="text-xs font-bold text-emerald-900">🌟 Campuran Standar</div>
                          <div className="text-[10px] text-emerald-700">5 PG, 3 B-S, 2 Isian, 2 Essay (12 Soal)</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => applyWrittenPreset("objective")}
                          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-left transition"
                        >
                          <div className="text-xs font-bold text-slate-800">📝 Fokus Objektif</div>
                          <div className="text-[10px] text-slate-500">10 PG, 5 Benar-Salah (15 Soal)</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => applyWrittenPreset("essay")}
                          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-left transition"
                        >
                          <div className="text-xs font-bold text-slate-800">🧠 Uraian & Analisis</div>
                          <div className="text-[10px] text-slate-500">5 Isian Singkat, 5 Essay (10 Soal)</div>
                        </button>
                      </div>
                    </div>

                    {/* Daftar Jenis Soal & Jumlahnya */}
                    <div className="space-y-2.5">
                      {Object.entries(questionTypeMeta).map(([typeKey, meta]) => {
                        const current = questionForm.writtenTypes[typeKey as keyof typeof questionForm.writtenTypes];
                        const isEnabled = current?.enabled ?? false;
                        const countVal = current?.count ?? 0;

                        return (
                          <div
                            key={typeKey}
                            className={`p-3 rounded-2xl border transition ${
                              isEnabled
                                ? "bg-white border-emerald-300 shadow-sm"
                                : "bg-slate-50/70 border-slate-200 opacity-60"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                                <input
                                  type="checkbox"
                                  checked={isEnabled}
                                  onChange={(e) => {
                                    const nextChecked = e.target.checked;
                                    setQuestionForm({
                                      ...questionForm,
                                      writtenTypes: {
                                        ...questionForm.writtenTypes,
                                        [typeKey]: {
                                          enabled: nextChecked,
                                          count: nextChecked ? (countVal > 0 ? countVal : 3) : countVal,
                                        },
                                      },
                                    });
                                  }}
                                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                                />
                                <div>
                                  <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                    <span>{meta.icon}</span>
                                    <span>{meta.label}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                                    {meta.desc}
                                  </div>
                                </div>
                              </label>

                              {/* Counter Jumlah */}
                              {isEnabled && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Jumlah:</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuestionForm({
                                        ...questionForm,
                                        writtenTypes: {
                                          ...questionForm.writtenTypes,
                                          [typeKey]: {
                                            enabled: true,
                                            count: Math.max(1, countVal - 1),
                                          },
                                        },
                                      });
                                    }}
                                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm flex items-center justify-center transition"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={countVal}
                                    onChange={(e) => {
                                      const num = Math.max(1, Math.min(20, Number(e.target.value) || 1));
                                      setQuestionForm({
                                        ...questionForm,
                                        writtenTypes: {
                                          ...questionForm.writtenTypes,
                                          [typeKey]: {
                                            enabled: true,
                                            count: num,
                                          },
                                        },
                                      });
                                    }}
                                    className="w-12 py-1 rounded-lg border border-slate-300 text-xs font-black text-center text-slate-800"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuestionForm({
                                        ...questionForm,
                                        writtenTypes: {
                                          ...questionForm.writtenTypes,
                                          [typeKey]: {
                                            enabled: true,
                                            count: Math.min(20, countVal + 1),
                                          },
                                        },
                                      });
                                    }}
                                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm flex items-center justify-center transition"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Ringkasan Bobot */}
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 font-medium">
                      <span>🎯 Total Soal: <strong>{totalWrittenQuestions} Butir</strong></span>
                      <span className="text-[11px] text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-200 font-bold">
                        Bobot Total: 100 Poin (Otomatis Proporsional)
                      </span>
                    </div>

                    {/* Judul Tugas & Batas Waktu */}
                    <div className="space-y-3 pt-2 border-t border-slate-200">
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
                    </div>
                  </div>
                );
              })()}

              <button
                type="submit"
                disabled={questionGenerating}
                className={`w-full py-4 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 transition disabled:opacity-60 shadow-xl hover:scale-[1.01] ${
                  questionForm.targetType === "BORNEO_EDU"
                    ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/20"
                    : "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/20"
                }`}
              >
                {questionGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>
                      {questionForm.targetType === "BORNEO_EDU"
                        ? "AI sedang menyusun paket soal Borneo EDU dari materi..."
                        : "AI sedang merancang soal penugasan tulis tangan dari materi..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>
                      {questionForm.targetType === "BORNEO_EDU"
                        ? "🚀 Generate Soal & Masukkan ke Game Borneo EDU"
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
      {/* MODAL BARU: DUPLIKASI MATERI KE KELAS LAIN */}
      {/* ========================================================================= */}
      {showDuplicateModal && selectedMaterialForDuplicate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-black uppercase mb-1">
                  <Copy size={12} />
                  <span>Duplikasi Materi</span>
                </div>
                <h2 className="text-2xl font-black text-slate-800">Duplikasi ke Kelas Lain</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Salin materi <strong className="text-slate-800">"{selectedMaterialForDuplicate.title}"</strong> ke kelas lain tanpa perlu input ulang.
                </p>
              </div>
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleDuplicateMaterial} className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <span>ℹ️ Info Duplikasi Materi</span>
                </p>
                <p className="text-indigo-700 leading-relaxed">
                  Semua isi materi{selectedMaterialForDuplicate.sourceType === "AI" ? " yang disusun oleh AI" : ""}, ringkasan, dan lampiran file akan disalin utuh untuk siswa di kelas tujuan.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pilih Kelas Tujuan <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500/40 focus:outline-none bg-white text-slate-900"
                  value={duplicateClassId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    const cObj = classes.find((c) => c.id === cId);
                    setDuplicateClassId(cId);
                    setDuplicateSubjectId(cObj?.subjects?.[0]?.id || "");
                  }}
                >
                  <option value="" className="text-slate-900 bg-white">-- Pilih Kelas Tujuan --</option>
                  {classes.map((c) => {
                    const currentClassId = typeof selectedMaterialForDuplicate.classId === "object"
                      ? selectedMaterialForDuplicate.classId?._id
                      : selectedMaterialForDuplicate.classId;
                    const isCurrent = c.id === currentClassId;

                    return (
                      <option key={c.id} value={c.id} className="text-slate-900 bg-white">
                        {c.name} {isCurrent ? "(Kelas Saat Ini)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mata Pelajaran (Opsional)
                </label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500/40 focus:outline-none bg-white text-slate-900"
                  value={duplicateSubjectId}
                  onChange={(e) => setDuplicateSubjectId(e.target.value)}
                >
                  <option value="" className="text-slate-900 bg-white">-- Sama dengan Materi Asli / Umum --</option>
                  {classes
                    .find((c) => c.id === duplicateClassId)
                    ?.subjects?.map((s) => (
                      <option key={s.id} value={s.id} className="text-slate-900 bg-white">
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={duplicating || !duplicateClassId}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                >
                  {duplicating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Menduplikasi materi ke kelas tujuan...</span>
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      <span>Duplikasi Materi Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PREVIEW DETAIL MATERI */}
      {/* ========================================================================= */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                    {previewMaterial.className || "Kelas"}
                  </span>
                  {previewMaterial.displayFormat && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                      {previewMaterial.displayFormat === "FLASHCARD"
                        ? "🗂️ Flash Card"
                        : previewMaterial.displayFormat === "SLIDES"
                        ? "📽️ Slides"
                        : previewMaterial.displayFormat === "MINDMAP"
                        ? "🧠 Mind Map"
                        : "📄 Modul Standar"}
                    </span>
                  )}
                </div>
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
                <div className="pt-2">
                  <InteractiveMaterialViewer
                    topicTitle={previewMaterial.title}
                    content={previewMaterial.content}
                    interactiveData={
                      previewMaterial.interactiveData &&
                      previewMaterial.interactiveData.flashcards &&
                      previewMaterial.interactiveData.flashcards.length > 0
                        ? previewMaterial.interactiveData
                        : extractInteractiveDataFromMaterial(
                            previewMaterial.content,
                            previewMaterial.title
                          )
                    }
                    defaultFormat={previewMaterial.displayFormat || "FLASHCARD"}
                    editable={false}
                  />
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
