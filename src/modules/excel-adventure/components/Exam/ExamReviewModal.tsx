import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, BookOpen, ChevronRight, ChevronLeft, Filter } from 'lucide-react';
import { EXAM_QUESTIONS_DATA } from '../../data/examQuestionsData';
import { ExamOverallResult } from '../../engine/examGrader';

interface ExamReviewModalProps {
  result: ExamOverallResult;
  onClose: () => void;
}

export const ExamReviewModal: React.FC<ExamReviewModalProps> = ({ result, onClose }) => {
  const [filter, setFilter] = useState<'ALL' | 'CORRECT' | 'INCORRECT' | 'PART_I' | 'PART_II' | 'PART_III'>('ALL');
  const [selectedQuestionId, setSelectedQuestionId] = useState<number>(1);

  const evalMap = new Map<number, any>();
  result.evaluatedQuestions.forEach((eq) => evalMap.set(eq.questionId, eq));

  const filteredQuestions = EXAM_QUESTIONS_DATA.filter((q) => {
    const eq = evalMap.get(q.id);
    if (filter === 'CORRECT') return eq?.isCorrect;
    if (filter === 'INCORRECT') return !eq?.isCorrect;
    if (filter === 'PART_I') return q.part === 'I';
    if (filter === 'PART_II') return q.part === 'II';
    if (filter === 'PART_III') return q.part === 'III';
    return true;
  });

  const currentQ = EXAM_QUESTIONS_DATA.find((q) => q.id === selectedQuestionId) || EXAM_QUESTIONS_DATA[0];
  const currentEval = evalMap.get(currentQ.id);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col p-2 sm:p-6 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl max-w-6xl w-full mx-auto flex flex-col h-full max-h-[92vh] shadow-2xl overflow-hidden">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Bedah Soal & Pembahasan
              </span>
              <span className="text-xs text-slate-400 font-bold">
                Skor: {result.totalScore}/100
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
              Pembahasan Evaluasi Sumatif Excel Data Adventure
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-5 py-2.5 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center gap-1.5 text-xs overflow-x-auto">
          <span className="text-slate-400 font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {[
            { id: 'ALL', label: 'Semua (25)' },
            { id: 'CORRECT', label: 'Benar' },
            { id: 'INCORRECT', label: 'Salah / Belum Tepat' },
            { id: 'PART_I', label: 'Bagian I (PG)' },
            { id: 'PART_II', label: 'Bagian II (B/S)' },
            { id: 'PART_III', label: 'Bagian III (Studi Kasus)' }
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                filter === f.id
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Body Split-View */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Kolom Kiri: Navigasi Nomor Soal */}
          <div className="md:col-span-4 border-r border-slate-800 p-3 sm:p-4 overflow-y-auto bg-slate-950/40 space-y-1.5">
            <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2">
              Daftar Soal ({filteredQuestions.length})
            </div>
            {filteredQuestions.map((q) => {
              const eq = evalMap.get(q.id);
              const isSelected = selectedQuestionId === q.id;
              const isCorrect = eq?.isCorrect;

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setSelectedQuestionId(q.id)}
                  className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between text-xs ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center font-black text-[11px]">
                      {q.id}
                    </span>
                    <span className="line-clamp-1">{q.partTitle.replace('Bagian ', '')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-slate-400">
                      {eq?.earnedPoints ?? 0}/{q.points}p
                    </span>
                    {isCorrect ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Kolom Kanan: Detail Pembahasan Soal Terpilih */}
          <div className="md:col-span-8 p-4 sm:p-6 overflow-y-auto space-y-5 bg-slate-900/40">
            {/* Header Soal */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {currentQ.partTitle} • Nomor {currentQ.id}
                </span>
                <span className="ml-2 text-xs text-slate-400 font-bold">
                  Bobot: {currentQ.points} Poin
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Poin Anda:</span>
                <span className={`text-sm font-black px-2.5 py-1 rounded-lg ${
                  currentEval?.isCorrect
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {currentEval?.earnedPoints ?? 0} / {currentQ.points} Poin
                </span>
              </div>
            </div>

            {/* Teks Soal */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
              <div className="text-sm font-semibold text-slate-100 whitespace-pre-line leading-relaxed">
                {currentQ.question}
              </div>
            </div>

            {/* Jawaban Siswa & Kunci Jawaban */}
            {currentQ.type === 'MULTIPLE_CHOICE' && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pilihan Jawaban:</div>
                <div className="grid grid-cols-1 gap-2">
                  {currentQ.options?.map((opt) => {
                    const isStudentPick = String(currentEval?.studentAnswer).toUpperCase() === opt.key;
                    const isKeyPick = currentQ.correctAnswer === opt.key;

                    let cardClass = 'bg-slate-950/40 border-slate-800 text-slate-300';
                    if (isKeyPick) cardClass = 'bg-emerald-950/50 border-emerald-500 text-emerald-200 font-bold';
                    else if (isStudentPick && !isKeyPick) cardClass = 'bg-rose-950/50 border-rose-500 text-rose-200';

                    return (
                      <div
                        key={opt.key}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between ${cardClass}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-slate-800 font-black flex items-center justify-center">
                            {opt.key}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                        <div className="text-[11px] font-bold">
                          {isKeyPick && <span className="text-emerald-400">✓ KUNCI JAWABAN</span>}
                          {isStudentPick && !isKeyPick && <span className="text-rose-400">✗ PILIHAN ANDA</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {currentQ.type === 'TRUE_FALSE' && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Jawaban Anda:</span>
                  <span className={`font-black px-2 py-0.5 rounded ${
                    currentEval?.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {String(currentEval?.studentAnswer || 'Kosong').toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Kunci Jawaban yang Benar:</span>
                  <span className="font-black text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded">
                    {currentQ.correctAnswer}
                  </span>
                </div>
              </div>
            )}

            {currentQ.type === 'ESSAY' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Evaluasi Sub-Pertanyaan & Kunci Rumus:
                </div>
                {currentEval?.subEvaluations?.map((sub: any, idx: number) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-white">{sub.label}</span>
                      <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                        sub.isCorrect ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {sub.earnedPoints} / {sub.maxPoints} Poin
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-mono">
                      <span className="text-slate-500">Jawaban Anda: </span>
                      {currentEval?.studentAnswer?.[sub.label] || '[Tidak Terjawab]'}
                    </div>
                    <div className="text-[11px] text-emerald-300/90 font-sans leading-relaxed">
                      💡 {sub.feedback}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pembahasan Lengkap & Konsep */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-2 shadow-lg">
              <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider">
                <BookOpen className="w-4 h-4" /> Pembahasan & Kunci Jawaban Lengkap
              </div>
              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                {currentQ.explanation}
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <span>Rekomendasi Materi Ulang:</span>
                <span className="text-cyan-400 font-bold">{currentQ.recommendationTopic}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Navigasi Antar-Soal */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            disabled={selectedQuestionId <= 1}
            onClick={() => setSelectedQuestionId((prev) => Math.max(1, prev - 1))}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1 disabled:opacity-40 transition"
          >
            <ChevronLeft className="w-4 h-4" /> Soal Sebelumnya
          </button>
          <span className="text-xs text-slate-400 font-semibold">
            {selectedQuestionId} / 25
          </span>
          <button
            type="button"
            disabled={selectedQuestionId >= 25}
            onClick={() => setSelectedQuestionId((prev) => Math.min(25, prev + 1))}
            className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 disabled:opacity-40 transition"
          >
            Soal Berikutnya <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

