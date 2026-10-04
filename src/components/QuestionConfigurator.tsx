"use client";

import { useState, useEffect } from "react";

interface Question {
  order: number;
  questionType: string;
  maxScore: number;
  correctAnswer?: string;
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
 * - PG: dropdown A-E
 * - BS: dropdown Benar/Salah
 * - PG Kompleks: multi-checkbox A-E (disimpan sebagai "A,C,E")
 */
function CorrectAnswerInput({ question, onChange }: { question: Question; onChange: (val: string) => void }) {
  const { questionType, correctAnswer } = question;

  if (questionType === "PILIHAN_GANDA") {
    return (
      <select
        value={correctAnswer || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white text-sm"
      >
        <option value="">-- Pilih --</option>
        {PG_OPTIONS.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  if (questionType === "BENAR_SALAH") {
    return (
      <select
        value={correctAnswer || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white text-sm"
      >
        <option value="">-- Pilih --</option>
        <option value="Benar">Benar</option>
        <option value="Salah">Salah</option>
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

  // Untuk ESSAY dan ISIAN_SINGKAT: tidak ada input kunci jawaban
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
    setQuestions([...questions, { order: nextOrder, questionType: "PILIHAN_GANDA", maxScore: 10, correctAnswer: "" }]);
  };

  const handleRemoveQuestion = (index: number) => {
    const newQs = [...questions];
    newQs.splice(index, 1);
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

  const handleSave = async () => {
    // Validasi: soal objektif wajib punya kunci jawaban
    const missingKeys = questions.filter(q =>
      OBJECTIVE_TYPES.includes(q.questionType) && (!q.correctAnswer || q.correctAnswer.trim() === "")
    );
    if (missingKeys.length > 0) {
      const nums = missingKeys.map(q => q.order).join(", ");
      setMessage({ type: 'error', text: `Kunci jawaban belum diisi untuk soal nomor: ${nums}` });
      return;
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
        setMessage({ type: 'success', text: "Konfigurasi soal berhasil disimpan!" });
        setIsExpanded(false);
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
            ⚙️ Konfigurasi Soal & Bobot Nilai
          </button>
          <p className="text-sm text-gray-500 mt-1">
            Atur tipe soal, kunci jawaban, dan bobot nilai per nomor. Soal objektif (PG, Benar/Salah, PG Kompleks) dinilai otomatis oleh sistem.
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
                    <th className="px-4 py-3 font-semibold w-20">Nomor</th>
                    <th className="px-4 py-3 font-semibold">Tipe Soal</th>
                    <th className="px-4 py-3 font-semibold w-40">Kunci Jawaban</th>
                    <th className="px-4 py-3 font-semibold w-28">Bobot Nilai</th>
                    <th className="px-4 py-3 font-semibold w-16 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q, index) => (
                    <tr key={index} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                      <td className="px-4 py-2">
                        <input 
                          type="number" 
                          value={q.order}
                          onChange={(e) => handleChange(index, 'order', parseInt(e.target.value) || 0)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none text-center"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select 
                          value={q.questionType}
                          onChange={(e) => handleChange(index, 'questionType', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                        >
                          {QUESTION_TYPES.map(type => (
                            <option key={type} value={type}>{QUESTION_TYPE_LABELS[type]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <CorrectAnswerInput
                          question={q}
                          onChange={(val) => handleCorrectAnswerChange(index, val)}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input 
                          type="number" 
                          value={q.maxScore}
                          onChange={(e) => handleChange(index, 'maxScore', parseInt(e.target.value) || 0)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button 
                          onClick={() => handleRemoveQuestion(index)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition"
                          title="Hapus"
                        >
                          ❌
                        </button>
                      </td>
                    </tr>
                  ))}
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
                className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "💾 Simpan Konfigurasi"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
