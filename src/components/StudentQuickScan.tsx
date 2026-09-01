"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, FileText, Loader2, X } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  isSubmitted?: boolean;
}

export default function StudentQuickScan() {
  const [isOpen, setIsOpen] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleOpen = async () => {
    setIsOpen(true);
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/student/assignments");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAssignments(data);
      }
    } catch (err) {
      console.error("Gagal mengambil tugas aktif", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (id: string, isSubmitted?: boolean) => {
    if (isSubmitted) return;
    router.push(`/dashboard/my-assignments/${id}/scan`);
  };

  return (
    <>
      <button 
        onClick={handleOpen}
        className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-3xl p-6 flex items-center justify-between shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02]"
      >
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-4 rounded-2xl">
            <Camera size={32} />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold">Mulai Scan Tugas</h3>
            <p className="text-emerald-100 text-sm">Foto lembar jawaban dan otomatis terkirim</p>
          </div>
        </div>
        <div className="bg-white text-emerald-600 px-6 py-3 rounded-xl font-bold">
          Buka Kamera
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Pilih Tugas</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <Loader2 className="animate-spin mb-2" size={24} />
                  <p className="text-sm">Memuat tugas aktif...</p>
                </div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Tidak ada tugas aktif yang bisa dikerjakan.
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map(a => (
                    <button
                      key={a.id}
                      onClick={() => handleSelect(a.id, a.isSubmitted)}
                      disabled={a.isSubmitted}
                      className={`w-full text-left p-4 rounded-2xl border transition-colors flex gap-4 items-center group ${
                        a.isSubmitted 
                          ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed' 
                          : 'border-slate-200 hover:border-emerald-500 hover:bg-emerald-50'
                      }`}
                    >
                      <div className={`p-3 rounded-xl transition-colors ${
                        a.isSubmitted 
                          ? 'bg-slate-200 text-slate-500' 
                          : 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
                      }`}>
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{a.title}</h4>
                        <p className="text-xs text-slate-500">
                          {a.isSubmitted ? 'Sudah Dikumpulkan' : `Tenggat: ${new Date(a.dueDate).toLocaleDateString('id-ID')}`}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

