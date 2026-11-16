"use client";

import React, { useState, useEffect } from "react";
import { getDefaultPresetIndicators, QuestionIndicator } from "@/modules/grading/indicators";

export interface QuestionIndicatorItem {
  name: string;
  weight: number; // Dalam persentase (%)
}

interface Question {
  order: number;
  questionType: string;
  maxScore: number;
  correctAnswer?: string;
  indicators?: QuestionIndicatorItem[];
}

interface QuestionConfiguratorProps {
  assignmentId: string;
  initialQuestions?: Question[];
  onSaveSuccess?: () => void;
}

const QUESTION_TYPES = [
  "PILIHAN_GANDA",
  "BENAR_SALAH",
  "ISIAN_SINGKAT",
  "ESSAY",
  "PILIHAN_GANDA_KOMPLEKS"
];

const QUESTION_TYPE_LABELS: Record<string, string> = {
  PILIHAN_GANDA: "Pilihan Ganda",
  BENAR_SALAH: "Benar-Salah",
  ISIAN_SINGKAT: "Isian Singkat",
  ESSAY: "Essay",
  PILIHAN_GANDA_KOMPLEKS: "Pilihan Ganda Kompleks"
};

// Tipe soal yang dinilai oleh sistem (bukan AI)
const OBJECTIVE_TYPES = ["PILIHAN_GANDA", "BENAR_SALAH", "PILIHAN_GANDA_KOMPLEKS"];

const PG_OPTIONS = ["A", "B", "C", "D", "E"];

/**
 * Render input kunci jawaban berdasarkan tipe soal.
 */
function CorrectAnswerInput({ question, onChange }: { question: Question; onChange: (val: string) => void }) {
  const { questionType, correctAnswer } = question;

  if (questionType === "PILIHAN_GANDA") {
    return (
      <select
        value={correctAnswer || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white text-gray-900 text-sm"
      >
        <option value="" className="text-gray-900 bg-white">-- Pilih --</option>
        {PG_OPTIONS.map(opt => (
          <option key={opt} value={opt} className="text-gray-900 bg-white">{opt}</option>
        ))}
      </select>
    );
  }

  if (questionType === "BENAR_SALAH") {
    return (
      <select
        value={correctAnswer || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white text-gray-900 text-sm"
      >
        <option value="" className="text-gray-900 bg-white">-- Pilih --</option>
        <option value="Benar" className="text-gray-900 bg-white">Benar</option>
        <option value="Salah" className="text-gray-900 bg-white">Salah</option>
      </select>
    );
  }

  if (questionType === "PILIHAN_GANDA_KOMPLEKS") {
    const selectedAnswers = correctAnswer ? correctAnswer.split(",").map(s => s.trim()).filter(Boolean) : [];

    const toggleOption = (opt: string) => {
      let newSelected: string[];
      if (selectedAnswers.includes(opt)) {
        newSelected = selectedAnswers.filter(a => a !== opt);
      } else {
        newSelected = [...selectedAnswers, opt].sort();
      }
      onChange(newSelected.join(","));
    };

    return (
      <div className="flex gap-1.5 flex-wrap">
        {PG_OPTIONS.map(opt => (
          <label
            key={opt}
            className={`flex items-center gap-1 px-2 py-1 rounded-md border cursor-pointer text-xs font-medium transition-all ${
              selectedAnswers.includes(opt)
                ? "bg-blue-100 border-blue-400 text-blue-700"
                : "bg-white border-gray-300 text-gray-500 hover:border-gray-400"
            }`}
          >
            <input
              type="checkbox"
              checked={selectedAnswers.includes(opt)}
              onChange={() => toggleOption(opt)}
              className="sr-only"
            />
            {opt}
          </label>
        ))}
      </div>
    );
  }

  // Untuk ISIAN_SINGKAT
  if (questionType === "ISIAN_SINGKAT") {
    return (
      <div className="space-y-1">
        <input
          type="text"
          value={correctAnswer || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="cth: Proklamasi, Kemerdekaan"
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white text-gray-900 text-sm placeholder:text-gray-400"
        />
        <span className="text-[10px] text-gray-400 italic">Opsional — pisah koma untuk multi-jawaban</span>
      </div>
    );
  }

  // Untuk ESSAY
  if (questionType === "ESSAY") {
    return (
      <div className="space-y-1">
        <textarea
          value={correctAnswer || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Poin kunci yang harus ada..."
          rows={2}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white text-gray-900 text-sm resize-y placeholder:text-gray-400"
        />
        <span className="text-[10px] text-gray-400 italic">Opsional — panduan poin kunci untuk AI</span>
      </div>
    );
  }

  return (
    <span className="text-xs text-gray-400 italic">Dinilai AI</span>
  );
}

export default function QuestionConfigurator({ assignmentId, initialQuestions = [], onSaveSuccess }: QuestionConfiguratorProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(initialQuestions.length === 0);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // State untuk melacak nomor baris soal yang indikatornya sedang dibuka untuk diedit
  const [openIndicatorIndex, setOpenIndicatorIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialQuestions.length > 0) {
      setQuestions(initialQuestions);
      setLoading(false);
      return;
    }

    const fetchQuestions = async () => {
      try {
        const res = await fetch(`/api/assignments/${assignmentId}/questions`);
        if (res.ok) {
          const data = await res.json();
          setQuestions(data.questions || []);
          if (data.questions && data.questions.length > 0) {
            setIsExpanded(false);
          }
        }
      } catch (err) {
        console.error("Failed to fetch questions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [assignmentId, initialQuestions]);

  const handleAddQuestion = () => {
    const nextOrder = questions.length > 0 ? Math.max(...questions.map(q => q.order)) + 1 : 1;
    setQuestions([
      ...questions,
      {
        order: nextOrder,
        questionType: "PILIHAN_GANDA",
        maxScore: 10,
        correctAnswer: "",
        indicators: [] // Default: tidak ada indikator kustom (berarti nilai default 100%)
      }
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    const newQs = [...questions];
    newQs.splice(index, 1);
    if (openIndicatorIndex === index) {
      setOpenIndicatorIndex(null);
    } else if (openIndicatorIndex !== null && openIndicatorIndex > index) {
      setOpenIndicatorIndex(openIndicatorIndex - 1);
    }
    setQuestions(newQs);
  };

  const handleChange = (index: number, field: keyof Question, value: any) => {
    const newQs = [...questions];
    newQs[index] = { ...newQs[index], [field]: value };
    // Reset correctAnswer saat tipe soal berubah
    if (field === 'questionType') {
      newQs[index].correctAnswer = "";
    }
    setQuestions(newQs);
  };

  const handleCorrectAnswerChange = (index: number, value: string) => {
    const newQs = [...questions];
    newQs[index] = { ...newQs[index], correctAnswer: value };
    setQuestions(newQs);
  };

  // === Indikator Handlers ===
  const handleApplyPresetIndicators = (index: number) => {
    const q = questions[index];
    const presets = getDefaultPresetIndicators(q.questionType);
    const newQs = [...questions];
    newQs[index] = {
      ...newQs[index],
      indicators: presets.map(p => ({ ...p }))
    };
    setQuestions(newQs);
  };

  const handleResetToDefaultIndicator = (index: number) => {
    const newQs = [...questions];
    newQs[index] = {
      ...newQs[index],
      indicators: [] // Kosong berarti kembali ke Nilai Default 100%
    };
    setQuestions(newQs);
  };

  const handleAddCustomIndicator = (index: number) => {
    const newQs = [...questions];
    const current = newQs[index].indicators || [];
    const currentTotal = current.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
    const remaining = Math.max(0, 100 - currentTotal);
    
    newQs[index] = {
      ...newQs[index],
      indicators: [
        ...current,
        { name: "Indikator Baru", weight: remaining > 0 ? remaining : 10 }
      ]
    };
    setQuestions(newQs);
  };

  const handleUpdateIndicator = (questionIndex: number, indicatorIndex: number, field: keyof QuestionIndicatorItem, value: any) => {
    const newQs = [...questions];
    const current = [...(newQs[questionIndex].indicators || [])];
    current[indicatorIndex] = {
      ...current[indicatorIndex],
      [field]: field === 'weight' ? (parseFloat(value) || 0) : value
    };
    newQs[questionIndex] = {
      ...newQs[questionIndex],
      indicators: current
    };
    setQuestions(newQs);
  };

  const handleRemoveIndicator = (questionIndex: number, indicatorIndex: number) => {
    const newQs = [...questions];
    const current = [...(newQs[questionIndex].indicators || [])];
    current.splice(indicatorIndex, 1);
    newQs[questionIndex] = {
      ...newQs[questionIndex],
      indicators: current
    };
    setQuestions(newQs);
  };

  const handleSave = async () => {
    // 1. Validasi: soal objektif wajib punya kunci jawaban
    const missingKeys = questions.filter(q =>
      OBJECTIVE_TYPES.includes(q.questionType) && (!q.correctAnswer || q.correctAnswer.trim() === "")
    );
    if (missingKeys.length > 0) {
      const nums = missingKeys.map(q => q.order).join(", ");
      setMessage({ type: 'error', text: `Kunci jawaban belum diisi untuk soal nomor: ${nums}` });
      return;
    }

    // 2. Validasi: Jika guru menambahkan indikator pada soal, total bobot indikator harus 100%
    for (const q of questions) {
      if (q.indicators && q.indicators.length > 0) {
        const totalWeight = q.indicators.reduce((sum, ind) => sum + (Number(ind.weight) || 0), 0);
        if (Math.round(totalWeight) !== 100) {
          setMessage({
            type: 'error',
            text: `Soal nomor ${q.order} memiliki total bobot indikator ${totalWeight}%. Total bobot indikator wajib 100%!`
          });
          setOpenIndicatorIndex(questions.indexOf(q));
          return;
        }

        const emptyName = q.indicators.some(ind => !ind.name || ind.name.trim() === "");
        if (emptyName) {
          setMessage({
            type: 'error',
            text: `Soal nomor ${q.order} memiliki nama indikator yang masih kosong.`
          });
          setOpenIndicatorIndex(questions.indexOf(q));
          return;
        }
      }
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/questions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions })
      });
      if (res.ok) {
        setMessage({ type: 'success', text: "Konfigurasi soal dan indikator penilaian berhasil disimpan!" });
        setIsExpanded(false);
        setOpenIndicatorIndex(null);
        if (onSaveSuccess) onSaveSuccess();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || "Gagal menyimpan konfigurasi" });
      }
    } catch (err) {
      setMessage({ type: 'error', text: "Terjadi kesalahan jaringan" });
    } finally {
      setSaving(false);
    }
  };

  const totalScore = questions.reduce((sum, q) => sum + (Number(q.maxScore) || 0), 0);
  const objectiveCount = questions.filter(q => OBJECTIVE_TYPES.includes(q.questionType)).length;

  if (loading) {
    return <div className="text-sm text-gray-500 py-4 text-center">Memuat konfigurasi soal...</div>;
  }

  return (
    <div className="mt-6 border-t border-gray-100 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-lg font-bold text-gray-800 flex items-center gap-2 hover:text-emerald-700 transition"
          >
            <span className={`transform transition-transform text-sm ${isExpanded ? "rotate-90" : ""}`}>
              ▶
            </span>
            ⚙️ Konfigurasi Soal, Bobot & Indikator Penilaian
          </button>
          <p className="text-sm text-gray-500 mt-1">
            Atur tipe soal, kunci jawaban, bobot nilai, serta <strong>indikator penilaian (%)</strong> per nomor soal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {objectiveCount > 0 && (
            <div className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
              🔧 {objectiveCount} soal auto-grade
            </div>
          )}
          <div className={`px-3 py-1 rounded-lg text-sm font-bold ${totalScore === 100 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            Total Bobot: {totalScore}
          </div>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
          {message.type === 'success' ? '✅' : '⚠️'} {message.text}
        </div>
      )}

      {isExpanded && (
        <>
          {questions.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-gray-500 text-sm mb-3">Belum ada konfigurasi soal. Silakan tambah atau gunakan hasil tebakan AI.</p>
              <button 
                onClick={handleAddQuestion}
                className="text-sm bg-white border border-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
              >
                + Tambah Soal Manual
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                  <tr>
                    <th className="px-3 py-3 font-semibold w-14 text-center">No</th>
                    <th className="px-3 py-3 font-semibold w-36">Tipe Soal</th>
                    <th className="px-3 py-3 font-semibold w-36">Kunci Jawaban</th>
                    <th className="px-3 py-3 font-semibold w-24 text-center">Bobot Nilai</th>
                    <th className="px-3 py-3 font-semibold">Indikator Penilaian (Bobot %)</th>
                    <th className="px-3 py-3 font-semibold w-14 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {questions.map((q, index) => {
                    const isIndicatorOpen = openIndicatorIndex === index;
                    const hasCustomIndicators = Array.isArray(q.indicators) && q.indicators.length > 0;
                    const totalWeight = hasCustomIndicators 
                      ? q.indicators!.reduce((sum, ind) => sum + (Number(ind.weight) || 0), 0)
                      : 100;

                    return (
                      <React.Fragment key={index}>
                        <tr className={`hover:bg-gray-50/50 transition-colors ${isIndicatorOpen ? 'bg-emerald-50/30' : ''}`}>
                          <td className="px-3 py-2 text-center">
                            <input 
                              type="number" 
                              value={q.order}
                              onChange={(e) => handleChange(index, 'order', parseInt(e.target.value) || 0)}
                              className="w-full p-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none text-center bg-white text-gray-900 font-bold"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select 
                              value={q.questionType}
                              onChange={(e) => handleChange(index, 'questionType', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white text-gray-900 text-xs font-medium"
                            >
                              {QUESTION_TYPES.map(type => (
                                <option key={type} value={type} className="text-gray-900 bg-white">{QUESTION_TYPE_LABELS[type]}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <CorrectAnswerInput
                              question={q}
                              onChange={(val) => handleCorrectAnswerChange(index, val)}
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input 
                              type="number" 
                              value={q.maxScore}
                              onChange={(e) => handleChange(index, 'maxScore', parseInt(e.target.value) || 0)}
                              className="w-full p-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white text-gray-900 text-center font-bold"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {hasCustomIndicators ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {q.indicators!.map((ind, i) => (
                                    <span 
                                      key={i} 
                                      className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-semibold border border-emerald-200"
                                      title={ind.name}
                                    >
                                      {ind.name.length > 22 ? `${ind.name.slice(0, 20)}...` : ind.name} ({ind.weight}%)
                                    </span>
                                  ))}
                                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${totalWeight === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    Total: {totalWeight}%
                                  </span>
                                </div>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
                                  🎯 Nilai Default (100%)
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => setOpenIndicatorIndex(isIndicatorOpen ? null : index)}
                                className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                                  hasCustomIndicators 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                                }`}
                              >
                                {isIndicatorOpen 
                                  ? '▲ Tutup' 
                                  : hasCustomIndicators 
                                    ? '⚙️ Edit Indikator' 
                                    : '+ Atur Indikator'}
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button 
                              onClick={() => handleRemoveQuestion(index)}
                              className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition"
                              title="Hapus Soal"
                            >
                              ❌
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Indicator Editor Drawer */}
                        {isIndicatorOpen && (
                          <tr className="bg-emerald-50/40">
                            <td colSpan={6} className="px-4 py-3 border-b border-emerald-100">
                              <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                                      <span>📊 Pengaturan Indikator Penilaian — Soal #{q.order}</span>
                                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold normal-case">
                                        {QUESTION_TYPE_LABELS[q.questionType]}
                                      </span>
                                    </h4>
                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                      Jika tidak ditambahkan indikator kustom, sistem menggunakan nilai default 100%.
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleApplyPresetIndicators(index)}
                                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1"
                                      title="Terapkan pembagian bobot standar sesuai jenis soal"
                                    >
                                      <span>⚡ Terapkan Template Standar ({q.questionType})</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleResetToDefaultIndicator(index)}
                                      className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition"
                                      title="Hapus indikator kustom dan gunakan default 100%"
                                    >
                                      🔄 Reset Default (100%)
                                    </button>
                                  </div>
                                </div>

                                {/* Indicator Table / Rows */}
                                {hasCustomIndicators ? (
                                  <div className="space-y-2">
                                    {q.indicators!.map((ind, indIdx) => (
                                      <div key={indIdx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                                        <span className="w-5 text-center text-xs font-bold text-gray-400">
                                          {indIdx + 1}.
                                        </span>
                                        <div className="flex-1">
                                          <input
                                            type="text"
                                            value={ind.name}
                                            onChange={(e) => handleUpdateIndicator(index, indIdx, 'name', e.target.value)}
                                            placeholder="Nama indikator (contoh: Pilihan jawaban benar)"
                                            className="w-full p-1.5 bg-white border border-gray-300 rounded-md text-xs text-gray-900 focus:ring-1 focus:ring-emerald-500 outline-none"
                                          />
                                        </div>
                                        <div className="w-28 flex items-center gap-1">
                                          <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={ind.weight}
                                            onChange={(e) => handleUpdateIndicator(index, indIdx, 'weight', e.target.value)}
                                            className="w-16 p-1.5 bg-white border border-gray-300 rounded-md text-xs text-center font-bold text-gray-900 focus:ring-1 focus:ring-emerald-500 outline-none"
                                          />
                                          <span className="text-xs font-bold text-gray-600">%</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveIndicator(index, indIdx)}
                                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                          title="Hapus indikator ini"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ))}

                                    <div className="flex items-center justify-between pt-1">
                                      <button
                                        type="button"
                                        onClick={() => handleAddCustomIndicator(index)}
                                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                      >
                                        + Tambah Baris Indikator Kustom
                                      </button>

                                      <div className={`text-xs font-black px-3 py-1 rounded-lg border ${
                                        totalWeight === 100 
                                          ? 'bg-green-100 text-green-800 border-green-200' 
                                          : 'bg-red-100 text-red-800 border-red-200'
                                      }`}>
                                        Total Bobot: {totalWeight}% {totalWeight === 100 ? '✅ (Pas 100%)' : '⚠️ (Wajib 100%)'}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="py-4 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200 space-y-2">
                                    <p className="text-xs text-gray-600">
                                      Soal ini saat ini menggunakan <strong>Nilai Default 100%</strong> tanpa pembagian sub-indikator.
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => handleApplyPresetIndicators(index)}
                                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5"
                                    >
                                      <span>⚡ Aktifkan Indikator Standar ({QUESTION_TYPE_LABELS[q.questionType]})</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {questions.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <button 
                onClick={handleAddQuestion}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded transition hover:bg-emerald-50"
              >
                + Tambah Baris Soal
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>{saving ? "Menyimpan..." : "💾 Simpan Konfigurasi & Indikator"}</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
