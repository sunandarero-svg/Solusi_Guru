"use client";

import { useState, useEffect } from "react";
import { Users, AlertCircle, CheckCircle, HelpCircle } from "lucide-react";

interface StudentProgress {
  id: string;
  fullName: string;
  studentNumber: string;
  averageScore: number;
  status: string;
  latestFeedback: string;
}

interface ClassProgress {
  id: string;
  name: string;
  description: string;
  progress: {
    sudahPaham: number;
    mulaiPaham: number;
    belumPaham: number;
    total: number;
  };
  tracker: {
    kumpul: number;
    belumKumpul: number;
    missingDetails: { id: string; name: string; missing: string[] }[];
    activeAssignmentsCount: number;
  };
  students: StudentProgress[];
}

export default function TeacherProgressDashboard() {
  const [data, setData] = useState<ClassProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<ClassProgress | null>(null);
  const [selectedTracker, setSelectedTracker] = useState<ClassProgress | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/teacher/progress")
      .then(res => res.json())
      .then(d => {
        if (Array.isArray(d)) {
          setData(d);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load progress:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="mt-8 bg-white/50 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/50 shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded-md mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="text-blue-500" /> Progress Kemajuan Siswa Per Kelas
        </h2>
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
        >
          <option value="all">Semua Kelas</option>
          {data.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data
          .filter(cls => selectedClassId === "all" || cls.id === selectedClassId)
          .map(cls => {
          const { sudahPaham, mulaiPaham, belumPaham, total } = cls.progress;
          
          // Calculate percentages for progress bar
          const sudahPct = total > 0 ? (sudahPaham / total) * 100 : 0;
          const mulaiPct = total > 0 ? (mulaiPaham / total) * 100 : 0;
          const belumPct = total > 0 ? (belumPaham / total) * 100 : 0;

          return (
            <div key={cls.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{cls.name}</h3>
                  <p className="text-sm text-slate-500">{total} Siswa Terdaftar</p>
                </div>
                <button 
                  onClick={() => setSelectedClass(cls)}
                  className="px-4 py-2 bg-blue-50 text-blue-600 text-sm font-semibold rounded-xl hover:bg-blue-100 transition-colors"
                >
                  Detail Progress
                </button>
              </div>

              {total > 0 ? (
                <>
                  <div className="flex w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-4">
                    <div style={{ width: `${sudahPct}%` }} className="bg-emerald-500 transition-all duration-500"></div>
                    <div style={{ width: `${mulaiPct}%` }} className="bg-amber-400 transition-all duration-500"></div>
                    <div style={{ width: `${belumPct}%` }} className="bg-rose-500 transition-all duration-500"></div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <div className="font-bold text-emerald-600">{sudahPaham}</div>
                      <div className="text-slate-500 text-xs">Sudah Paham</div>
                    </div>
                    <div>
                      <div className="font-bold text-amber-500">{mulaiPaham}</div>
                      <div className="text-slate-500 text-xs">Mulai Paham</div>
                    </div>
                    <div>
                      <div className="font-bold text-rose-500">{belumPaham}</div>
                      <div className="text-slate-500 text-xs">Belum Paham</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-400 py-4 text-sm">
                  Belum ada data evaluasi AI di kelas ini.
                </div>
              )}

              {/* Status Pengumpulan Tugas Section */}
              {cls.tracker && cls.tracker.activeAssignmentsCount > 0 ? (
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-slate-700">Status Pengumpulan Tugas Aktif</h4>
                    <button 
                      onClick={() => setSelectedTracker(cls)}
                      className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      Lihat Siswa Bolong
                    </button>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center">
                      <div className="text-xl font-black text-emerald-600">{cls.tracker.kumpul}</div>
                      <div className="text-[10px] uppercase font-bold text-emerald-700 mt-1">Lengkap</div>
                    </div>
                    <div className="flex-1 bg-rose-50 rounded-xl p-3 border border-rose-100 text-center relative overflow-hidden group">
                      <div className="text-xl font-black text-rose-600">{cls.tracker.belumKumpul}</div>
                      <div className="text-[10px] uppercase font-bold text-rose-700 mt-1">Belum Kumpul</div>
                      {cls.tracker.belumKumpul > 0 && (
                        <div className="absolute top-0 right-0 w-8 h-8 bg-rose-500 rounded-bl-full flex items-center justify-center opacity-20">
                          <AlertCircle size={14} className="text-white ml-2 mb-2" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 pt-4 border-t border-slate-100 text-center text-slate-400 text-xs">
                  Tidak ada tugas aktif di kelas ini.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selectedClass && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Detail Progress: {selectedClass.name}</h3>
                <p className="text-sm text-slate-500">Ringkasan AI berdasarkan evaluasi tugas siswa</p>
              </div>
              <button 
                onClick={() => setSelectedClass(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {selectedClass.students.length === 0 ? (
                <div className="text-center py-12 text-slate-500">Tidak ada siswa terdaftar.</div>
              ) : (
                <div className="space-y-4">
                  {selectedClass.students.map(student => {
                    let statusColor = "bg-slate-100 text-slate-600";
                    let Icon = HelpCircle;
                    
                    if (student.status === "Sudah Paham") {
                      statusColor = "bg-emerald-100 text-emerald-700";
                      Icon = CheckCircle;
                    } else if (student.status === "Mulai Paham") {
                      statusColor = "bg-amber-100 text-amber-700";
                      Icon = AlertCircle;
                    } else if (student.status === "Belum Paham") {
                      statusColor = "bg-rose-100 text-rose-700";
                      Icon = AlertCircle;
                    }

                    return (
                      <div key={student.id} className="border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 hover:border-blue-200 transition-colors bg-white">
                        <div className="md:w-1/3 shrink-0">
                          <h4 className="font-bold text-slate-800 text-lg">{student.fullName}</h4>
                          <p className="text-slate-500 text-sm mb-3">NIS: {student.studentNumber}</p>
                          
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${statusColor}`}>
                              <Icon size={14} />
                              {student.status}
                            </span>
                            <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                              Skor: {student.averageScore || '-'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="md:w-2/3 bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ringkasan AI Terakhir</p>
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {student.latestFeedback}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setSelectedClass(null)}
                className="px-6 py-2 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-900 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tracker Missing Modal */}
      {selectedTracker && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-rose-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Daftar Siswa Belum Kumpul</h3>
                  <p className="text-sm text-slate-500">Kelas: {selectedTracker.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTracker(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {selectedTracker.tracker.missingDetails.length === 0 ? (
                <div className="text-center py-12 text-slate-500 flex flex-col items-center">
                  <CheckCircle size={48} className="text-emerald-400 mb-4" />
                  <p className="font-medium text-lg">Hebat! Semua siswa sudah mengumpulkan tugas.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedTracker.tracker.missingDetails.map((student) => (
                    <div key={student.id} className="p-4 rounded-2xl border border-slate-200 hover:border-rose-200 transition-colors bg-white">
                      <h4 className="font-bold text-slate-800 mb-2">{student.name}</h4>
                      <div className="flex flex-wrap gap-2">
                        {student.missing.map((taskName, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                            <AlertCircle size={12} />
                            {taskName}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setSelectedTracker(null)}
                className="px-6 py-2 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-900 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
