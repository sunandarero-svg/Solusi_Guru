"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Presentation,
  GitFork,
  FileText,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Edit3,
  Plus,
  Trash2,
  Lightbulb,
  BookOpen,
} from "lucide-react";
import {
  MaterialDisplayFormat,
  IInteractiveData,
  IFlashcardItem,
  ISlideItem,
  IMindMapItem,
} from "@/models/Material";

interface InteractiveMaterialViewerProps {
  topicTitle: string;
  content: string;
  interactiveData?: IInteractiveData | null;
  defaultFormat?: MaterialDisplayFormat;
  editable?: boolean;
  onContentChange?: (newContent: string) => void;
  onInteractiveDataChange?: (newData: IInteractiveData) => void;
  onSelectDisplayFormat?: (format: MaterialDisplayFormat) => void;
}

export default function InteractiveMaterialViewer({
  topicTitle,
  content,
  interactiveData,
  defaultFormat = "FLASHCARD",
  editable = false,
  onContentChange,
  onInteractiveDataChange,
  onSelectDisplayFormat,
}: InteractiveMaterialViewerProps) {
  const [activeTab, setActiveTab] = useState<"flashcard" | "slides" | "mindmap" | "text">(
    defaultFormat === "FLASHCARD"
      ? "flashcard"
      : defaultFormat === "SLIDES"
      ? "slides"
      : defaultFormat === "MINDMAP"
      ? "mindmap"
      : "text"
  );

  // Data states
  const [flashcards, setFlashcards] = useState<IFlashcardItem[]>(
    interactiveData?.flashcards || []
  );
  const [slides, setSlides] = useState<ISlideItem[]>(interactiveData?.slides || []);
  const [mindmap, setMindmap] = useState<IMindMapItem[]>(
    interactiveData?.mindmap || []
  );

  // Sync if interactiveData props change
  useEffect(() => {
    if (interactiveData?.flashcards && interactiveData.flashcards.length > 0) {
      setFlashcards(interactiveData.flashcards);
    }
    if (interactiveData?.slides && interactiveData.slides.length > 0) {
      setSlides(interactiveData.slides);
    }
    if (interactiveData?.mindmap && interactiveData.mindmap.length > 0) {
      setMindmap(interactiveData.mindmap);
    }
  }, [interactiveData]);

  // Flashcard states
  const [currentFcIndex, setCurrentFcIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Record<number, boolean>>({});
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [editCategory, setEditCategory] = useState("");

  // Slide state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Notify parent of interactive data changes if editable
  const notifyChanges = (
    newFc: IFlashcardItem[],
    newSl: ISlideItem[],
    newMm: IMindMapItem[]
  ) => {
    if (onInteractiveDataChange) {
      onInteractiveDataChange({
        flashcards: newFc,
        slides: newSl,
        mindmap: newMm,
      });
    }
  };

  // Flashcard handlers
  const handleNextCard = () => {
    setIsFlipped(false);
    setCurrentFcIndex((prev) => (prev + 1) % Math.max(1, flashcards.length));
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCurrentFcIndex((prev) =>
      prev === 0 ? Math.max(0, flashcards.length - 1) : prev - 1
    );
  };

  const handleShuffleCards = () => {
    setIsFlipped(false);
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentFcIndex(0);
    notifyChanges(shuffled, slides, mindmap);
  };

  const handleToggleMastered = (idx: number) => {
    setMasteredCards((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // Editing flashcard
  const handleStartEditCard = (idx: number) => {
    const card = flashcards[idx];
    if (!card) return;
    setEditingCardIndex(idx);
    setEditFront(card.front);
    setEditBack(card.back);
    setEditCategory(card.category || "Konsep Kunci");
  };

  const handleSaveCardEdit = () => {
    if (editingCardIndex === null) return;
    const updated = [...flashcards];
    updated[editingCardIndex] = {
      ...updated[editingCardIndex],
      front: editFront.trim() || updated[editingCardIndex].front,
      back: editBack.trim() || updated[editingCardIndex].back,
      category: editCategory.trim() || updated[editingCardIndex].category,
    };
    setFlashcards(updated);
    setEditingCardIndex(null);
    notifyChanges(updated, slides, mindmap);
  };

  const handleAddCard = () => {
    const newCard: IFlashcardItem = {
      id: `fc-${Date.now()}`,
      front: `Pertanyaan baru mengenai ${topicTitle}...`,
      back: `Penjelasan atau jawaban kunci dari pertanyaan ini...`,
      category: "Konsep Tambahan",
    };
    const updated = [...flashcards, newCard];
    setFlashcards(updated);
    setCurrentFcIndex(updated.length - 1);
    setIsFlipped(false);
    notifyChanges(updated, slides, mindmap);
    handleStartEditCard(updated.length - 1);
  };

  const handleDeleteCard = (idx: number) => {
    if (flashcards.length <= 1) {
      alert("Minimal harus ada 1 kartu.");
      return;
    }
    const updated = flashcards.filter((_, i) => i !== idx);
    setFlashcards(updated);
    setCurrentFcIndex((prev) => Math.min(prev, updated.length - 1));
    setIsFlipped(false);
    notifyChanges(updated, slides, mindmap);
  };

  const currentCard = flashcards[currentFcIndex] || {
    front: `Belum ada flash card untuk topik ini.`,
    back: `Silakan tambahkan kartu atau klik perbarui dari teks.`,
    category: "Umum",
  };

  const currentSlide = slides[currentSlideIndex] || {
    title: topicTitle,
    points: ["Materi pembelajaran kurikulum nasional"],
    note: "Silakan pilih tab teks untuk melihat materi lengkap.",
  };

  return (
    <div className="space-y-4">
      {/* Tab Switcher & Format Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-slate-900 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab("flashcard");
              if (onSelectDisplayFormat) onSelectDisplayFormat("FLASHCARD");
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap shadow-sm ${
              activeTab === "flashcard"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Layers size={15} />
            <span>🗂️ Flash Card Interaktif</span>
            {flashcards.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
                {flashcards.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("slides");
              if (onSelectDisplayFormat) onSelectDisplayFormat("SLIDES");
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap shadow-sm ${
              activeTab === "slides"
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-indigo-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Presentation size={15} />
            <span>📽️ Slide Presentasi</span>
            {slides.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
                {slides.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("mindmap");
              if (onSelectDisplayFormat) onSelectDisplayFormat("MINDMAP");
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap shadow-sm ${
              activeTab === "mindmap"
                ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-teal-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <GitFork size={15} />
            <span>🧠 Peta Konsep</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("text");
              if (onSelectDisplayFormat) onSelectDisplayFormat("STANDARD");
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap shadow-sm ${
              activeTab === "text"
                ? "bg-slate-800 text-white border border-slate-700"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <FileText size={15} />
            <span>📄 Dokumen Teks</span>
          </button>
        </div>

        {/* Indicator if format selected for publish */}
        {editable && onSelectDisplayFormat && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 font-bold">
            <Sparkles size={12} className="text-amber-400" />
            <span>Format Utama Siswa:</span>
            <span className="uppercase font-black text-white">
              {activeTab === "flashcard"
                ? "Flash Card"
                : activeTab === "slides"
                ? "Slide Presentasi"
                : activeTab === "mindmap"
                ? "Peta Konsep"
                : "Teks Lengkap"}
            </span>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* VIEW 1: FLASH CARD INTERAKTIF */}
      {/* ===================================================================== */}
      {activeTab === "flashcard" && (
        <div className="space-y-4">
          {/* Progress & Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-700">
              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-black">
                Kartu {currentFcIndex + 1} dari {Math.max(1, flashcards.length)}
              </span>
              <span className="text-slate-500 hidden sm:inline">
                {masteredCards[currentFcIndex] ? "✅ Sudah Dipahami" : "⏳ Sedang Dipelajari"}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleShuffleCards}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition"
                title="Acak Urutan Kartu"
              >
                <Shuffle size={13} />
                <span>Acak</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentFcIndex(0);
                  setIsFlipped(false);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition"
                title="Ulang dari awal"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
              {editable && (
                <>
                  <button
                    type="button"
                    onClick={() => handleStartEditCard(currentFcIndex)}
                    className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center gap-1 transition"
                    title="Edit isi kartu ini"
                  >
                    <Edit3 size={13} />
                    <span>Edit Kartu</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCard}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center gap-1 transition"
                    title="Tambah kartu baru"
                  >
                    <Plus size={13} />
                    <span>+ Kartu</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Interactive Flashcard 3D Stage */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer group relative min-h-[300px] sm:min-h-[340px] rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl border-2 select-none active:scale-[0.99]"
            style={{
              background: isFlipped
                ? "linear-gradient(135deg, #064e3b 0%, #042f2e 100%)"
                : "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
              borderColor: isFlipped ? "#10b981" : "#6366f1",
            }}
          >
            {/* Top Bar inside Card */}
            <div className="flex items-center justify-between">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shadow-sm ${
                  isFlipped
                    ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40"
                    : "bg-indigo-500/25 text-indigo-300 border border-indigo-500/40"
                }`}
              >
                <span>{isFlipped ? "💡 JAWABAN & PENJELASAN" : "❓ TANYA / KONSEP KUNCI"}</span>
              </span>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white/10 text-slate-300">
                  {currentCard.category || "Konsep"}
                </span>
                <span className="p-1 rounded-full bg-white/10 text-white/70 group-hover:text-white transition">
                  <RotateCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                </span>
              </div>
            </div>

            {/* Main Center Content */}
            <div className="my-auto py-4 text-center">
              {!isFlipped ? (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="text-3xl mb-2">🤔</div>
                  <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-snug max-w-xl mx-auto drop-shadow-sm">
                    {currentCard.front}
                  </h3>
                  <p className="text-xs text-indigo-200/80 font-medium">
                    (Sentuh atau klik kartu untuk membalik & melihat jawaban)
                  </p>
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="text-3xl mb-2">🎯</div>
                  <div className="text-sm sm:text-base text-emerald-50 font-medium leading-relaxed max-w-2xl mx-auto whitespace-pre-wrap">
                    {currentCard.back}
                  </div>
                  <p className="text-xs text-emerald-200/80 font-medium pt-2 border-t border-emerald-500/20">
                    (Sentuh atau klik lagi untuk kembali ke pertanyaan)
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions inside Card */}
            <div className="flex items-center justify-between text-xs pt-3 border-t border-white/10">
              <span className="text-slate-400 text-[11px]">
                Topik: <strong className="text-white">{topicTitle}</strong>
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleMastered(currentFcIndex);
                }}
                className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition ${
                  masteredCards[currentFcIndex]
                    ? "bg-emerald-500 text-white"
                    : "bg-white/10 text-slate-300 hover:bg-white/20"
                }`}
              >
                <CheckCircle2 size={14} />
                <span>{masteredCards[currentFcIndex] ? "Sudah Paham" : "Tandai Paham"}</span>
              </button>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handlePrevCard}
              disabled={flashcards.length <= 1}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-black text-xs flex items-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              <span>Sebelumnya</span>
            </button>

            {/* Progress Dots */}
            <div className="flex items-center gap-1 max-w-[200px] overflow-x-auto py-1">
              {flashcards.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setIsFlipped(false);
                    setCurrentFcIndex(i);
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === currentFcIndex
                      ? "w-6 bg-amber-500"
                      : masteredCards[i]
                      ? "bg-emerald-400"
                      : "bg-slate-300 hover:bg-slate-400"
                  }`}
                  title={`Buka Kartu ${i + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNextCard}
              disabled={flashcards.length <= 1}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition active:scale-95 disabled:opacity-40"
            >
              <span>Selanjutnya</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Modal / In-place Form Edit Card */}
          {editingCardIndex !== null && (
            <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Edit3 size={14} />
                  <span>Edit Isi Flash Card {editingCardIndex + 1}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => handleDeleteCard(editingCardIndex)}
                  className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  <span>Hapus Kartu</span>
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Kategori Kartu:
                </label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-indigo-200 bg-white text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Pertanyaan Sisi Depan:
                </label>
                <textarea
                  rows={2}
                  value={editFront}
                  onChange={(e) => setEditFront(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-indigo-200 bg-white text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Jawaban & Penjelasan Sisi Belakang:
                </label>
                <textarea
                  rows={3}
                  value={editBack}
                  onChange={(e) => setEditBack(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-indigo-200 bg-white text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingCardIndex(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveCardEdit}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black"
                >
                  Simpan Perubahan Kartu
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 2: SLIDE PRESENTASI RINGKAS */}
      {/* ===================================================================== */}
      {activeTab === "slides" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>
              Slide {currentSlideIndex + 1} dari {Math.max(1, slides.length)}
            </span>
            <span className="text-[11px] text-slate-400">
              Format Presentasi Poin Kunci
            </span>
          </div>

          {/* Presentation Slide Canvas */}
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/40 text-white min-h-[300px] sm:min-h-[340px] flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

            {/* Slide Header */}
            <div className="flex items-center justify-between border-b border-indigo-500/30 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Presentation size={14} />
                <span>SLIDE {currentSlideIndex + 1}</span>
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 font-bold">
                {topicTitle}
              </span>
            </div>

            {/* Slide Body */}
            <div className="py-4 space-y-4 my-auto">
              <h3 className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight">
                {currentSlide.title}
              </h3>

              <div className="space-y-2.5">
                {currentSlide.points.map((pt, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
                  >
                    <span className="w-5 h-5 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      ✓
                    </span>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                      {pt}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Slide Note / Teacher Tip */}
            {currentSlide.note && (
              <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-[11px] text-indigo-200 flex items-start gap-2">
                <Lightbulb size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Catatan Intisari:</strong> {currentSlide.note}
                </p>
              </div>
            )}
          </div>

          {/* Slide Navigation Buttons */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() =>
                setCurrentSlideIndex((prev) =>
                  prev === 0 ? Math.max(0, slides.length - 1) : prev - 1
                )
              }
              disabled={slides.length <= 1}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-black text-xs flex items-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              <span>Slide Sebelumnya</span>
            </button>

            {/* Slide Dots */}
            <div className="flex items-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentSlideIndex(i)}
                  className={`h-2.5 rounded-full transition-all ${
                    i === currentSlideIndex
                      ? "w-7 bg-indigo-600"
                      : "w-2.5 bg-slate-300 hover:bg-slate-400"
                  }`}
                  title={`Lompat ke Slide ${i + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setCurrentSlideIndex((prev) => (prev + 1) % Math.max(1, slides.length))
              }
              disabled={slides.length <= 1}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-indigo-500/20 transition active:scale-95 disabled:opacity-40"
            >
              <span>Slide Selanjutnya</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 3: PETA KONSEP (MIND MAP) */}
      {/* ===================================================================== */}
      {activeTab === "mindmap" && (
        <div className="space-y-4">
          {/* Root Topic Node */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 text-white text-center shadow-lg border border-teal-500/40">
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-200 block mb-0.5">
              TOPIK UTAMA PEMBELAJARAN
            </span>
            <h3 className="text-lg sm:text-xl font-black">{topicTitle}</h3>
          </div>

          {/* Branches Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {mindmap.map((branch, bIdx) => (
              <div
                key={bIdx}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-teal-400 shadow-sm space-y-2.5 transition-all hover:shadow-md"
              >
                <div className="flex items-center gap-2 text-teal-800 font-black text-sm pb-2 border-b border-slate-100">
                  <span className="p-1 rounded-lg bg-teal-100 text-teal-800 text-xs font-black">
                    #{bIdx + 1}
                  </span>
                  <span>{branch.topic}</span>
                </div>

                <div className="space-y-1.5">
                  {branch.subtopics.map((sub, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 font-medium flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0"></span>
                      <span>{sub}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-500 text-center italic">
            💡 Peta konsep ini merangkum keterkaitan antar bagian materi untuk mempercepat pemahaman struktural.
          </p>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 4: TEKS DOKUMEN KURIKULUM LENGKAP */}
      {/* ===================================================================== */}
      {activeTab === "text" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <BookOpen size={14} className="text-emerald-600" />
              <span>Naskah Lengkap Materi Pembelajaran</span>
            </span>
            {editable && (
              <span className="text-[11px] text-purple-600 font-bold">
                ✏️ Guru dapat mengedit isi materi di bawah ini
              </span>
            )}
          </div>

          {editable ? (
            <textarea
              rows={12}
              value={content}
              onChange={(e) => {
                if (onContentChange) onContentChange(e.target.value);
              }}
              className="w-full p-4 rounded-2xl border border-slate-300 text-xs font-mono bg-white text-slate-900 leading-relaxed focus:ring-2 focus:ring-purple-500/40 focus:outline-none"
              placeholder="Isi materi teks lengkap..."
            />
          ) : (
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm leading-relaxed text-slate-800 whitespace-pre-wrap font-sans max-h-[60vh] overflow-y-auto">
              {content || "Tidak ada isi materi teks."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
