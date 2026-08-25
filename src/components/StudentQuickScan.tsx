"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, FileText, Loader2, X } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
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

  const handleSelect = (id: string) => {
    router.push(`/dashboard/my-assignments/${id}/scan`);
  };

  return (
    <>
      <button 
        onClick={handleOpen}
        className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-3xl p-6 flex items-center justify-between shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02]"
      >
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-4 rounded-2xl">
            <Camera size={32} />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold">Mulai Scan Tugas</h3>
            <p className="text-blue-100 text-sm">Foto lembar jawaban dan otomatis terkirim</p>
          </div>
        </div>
        <div className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold">
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
                      onClick={() => handleSelect(a.id)}
                      className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors flex gap-4 items-center group"
                    >
                      <div className="bg-blue-100 text-blue-600 p-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{a.title}</h4>
                        <p className="text-xs text-slate-500">Tenggat: {new Date(a.dueDate).toLocaleDateString('id-ID')}</p>
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
