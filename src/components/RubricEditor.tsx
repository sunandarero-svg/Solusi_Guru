"use client";

import { useState, useEffect } from "react";

interface Criterion {
  name: string;
  description: string;
  maxScore: number;
  order: number;
}

interface RubricEditorProps {
  assignmentId: string;
  isPublished: boolean;
  initialRubric?: { title: string; criteria: Criterion[] };
  onSaved: () => void;
}

export default function RubricEditor({ assignmentId, isPublished, initialRubric, onSaved }: RubricEditorProps) {
  const [title, setTitle] = useState(initialRubric?.title || "Rubrik Penilaian");
  const [criteria, setCriteria] = useState<Criterion[]>(
    initialRubric?.criteria || [
      { name: "Kriteria 1", description: "", maxScore: 50, order: 1 },
      { name: "Kriteria 2", description: "", maxScore: 50, order: 2 }
    ]
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const totalScore = criteria.reduce((sum, c) => sum + c.maxScore, 0);
  const isValid = totalScore === 100;

  const addCriterion = () => {
    setCriteria([
      ...criteria, 
      { name: `Kriteria ${criteria.length + 1}`, description: "", maxScore: 0, order: criteria.length + 1 }
    ]);
  };

  const removeCriterion = (index: number) => {
    const newCriteria = [...criteria];
    newCriteria.splice(index, 1);
    setCriteria(newCriteria.map((c, i) => ({ ...c, order: i + 1 })));
  };

  const updateCriterion = (index: number, field: keyof Criterion, value: any) => {
    const newCriteria = [...criteria];
    newCriteria[index] = { ...newCriteria[index], [field]: value };
    setCriteria(newCriteria);
  };

  const handleSave = async () => {
    if (!isValid) {
      setMessage({ type: "error", text: "Total skor maksimal harus tepat 100." });
      return;
    }

    setSaving(true);
    setMessage({ type: "", text: "" });

    const res = await fetch(`/api/assignments/${assignmentId}/rubric`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, criteria })
    });

    if (res.ok) {
      setMessage({ type: "success", text: "Rubrik berhasil disimpan!" });
      onSaved();
    } else {
      const data = await res.json();
      setMessage({ type: "error", text: data.error || "Gagal menyimpan rubrik." });
    }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Rubrik Penilaian</h2>
          <p className="text-sm text-gray-500">AI akan menggunakan rubrik ini sebagai panduan penilaian OCR.</p>
        </div>
        <div className={`px-4 py-2 rounded-lg font-bold text-lg ${isValid ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          Total: {totalScore} / 100
        </div>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {isPublished && (
        <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm mb-6 border border-blue-100">
          ℹ️ Tugas sudah di-publish. Rubrik ini bersifat read-only untuk menjaga konsistensi penilaian.
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Rubrik</label>
        <input 
          type="text" 
          value={title}
          disabled={isPublished}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-2 text-sm disabled:bg-gray-50"
        />
      </div>

      <div className="space-y-4 mb-6">
        {criteria.map((c, idx) => (
          <div key={idx} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="font-mono text-gray-400 pt-2">{idx + 1}.</div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <input 
                  placeholder="Nama Kriteria (misal: Ejaan)"
                  value={c.name}
                  disabled={isPublished}
                  onChange={e => updateCriterion(idx, "name", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm disabled:bg-gray-100"
                />
              </div>
              <div className="md:col-span-6">
                <input 
                  placeholder="Deskripsi (misal: Tidak ada typo)"
                  value={c.description}
                  disabled={isPublished}
                  onChange={e => updateCriterion(idx, "description", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm disabled:bg-gray-100"
                />
              </div>
              <div className="md:col-span-2">
                <div className="relative">
                  <input 
                    type="number"
                    min="1" max="100"
                    value={c.maxScore}
                    disabled={isPublished}
                    onChange={e => updateCriterion(idx, "maxScore", parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg p-2 pr-8 text-sm font-bold text-blue-600 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                  <span className="absolute right-3 top-2 text-sm text-gray-400">Poin</span>
                </div>
              </div>
            </div>
            {!isPublished && (
              <button 
                onClick={() => removeCriterion(idx)}
                className="text-red-400 hover:text-red-600 p-2"
                title="Hapus kriteria"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {!isPublished && (
        <div className="flex justify-between items-center border-t border-gray-100 pt-4">
          <button 
            onClick={addCriterion}
            className="text-blue-600 text-sm font-medium hover:text-blue-800"
          >
            + Tambah Kriteria
          </button>
          
          <button 
            onClick={handleSave}
            disabled={saving || !isValid}
            className="bg-gray-800 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 transition disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Rubrik"}
          </button>
        </div>
      )}
    </div>
  );
}
