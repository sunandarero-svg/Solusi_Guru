"use client";

import { useState, useEffect } from "react";
import { Users, UserX, FileText, Calendar, Clock, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";

interface RecordItem {
  teacherName: string;
  className: string;
  status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA';
  topic: string;
}

interface SummaryData {
  totalPresent: number;
  totalAbsent: number;
  totalRecords: number;
}

export default function PrincipalDashboardPage() {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (date) {
      setIsLoading(true);
      fetch(`/api/principal/dashboard?date=${date}`)
        .then(res => res.json())
        .then(data => {
          if (data.summary) {
            setSummary(data.summary);
            setRecords(data.records || []);
          } else {
            setSummary(null);
            setRecords([]);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [date]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HADIR': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'SAKIT': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'IZIN': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'ALPA': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HADIR': return <CheckCircle2 size={16} />;
      case 'SAKIT': return <AlertCircle size={16} />;
      case 'IZIN': return <Clock size={16} />;
      case 'ALPA': return <UserX size={16} />;
      default: return <UserX size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 relative overflow-hidden">
      {/* Decorative futuristic blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none mix-blend-multiply"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none mix-blend-multiply"></div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header Section */}
        <div className="glass rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl shadow-slate-200/50 border border-white/60">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold tracking-wide uppercase mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Sistem Pemantauan Aktif
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight">
              Command Center
            </h1>
            <p className="text-slate-500 font-medium mt-1">Pantau aktivitas, jurnal, dan kehadiran guru secara real-time.</p>
          </div>
          
          <div className="bg-white/50 backdrop-blur-md p-2 rounded-2xl border border-white flex items-center gap-3 shadow-inner">
            <div className="bg-white p-2 rounded-xl shadow-sm text-emerald-600">
              <Calendar size={20} />
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent border-none text-slate-700 font-bold focus:ring-0 cursor-pointer p-2 w-full md:w-auto outline-none"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-emerald-600">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-emerald-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="mt-4 font-bold text-slate-500 tracking-wider animate-pulse">SINKRONISASI DATA...</p>
          </div>
        ) : (
          <>
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Metric 1 */}
                <div className="group relative glass rounded-3xl p-6 overflow-hidden border border-white/60 shadow-lg shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400 to-emerald-600 opacity-10 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kehadiran Guru</p>
                      <div className="flex items-baseline gap-2 mt-2">
                        <h2 className="text-5xl font-black text-slate-800 tracking-tighter">{summary.totalPresent}</h2>
                        <span className="text-emerald-500 font-medium text-sm">Hadir</span>
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/30">
                      <Users size={28} />
                    </div>
                  </div>
                  <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: summary.totalRecords ? `${(summary.totalPresent / summary.totalRecords) * 100}%` : '0%' }}></div>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="group relative glass rounded-3xl p-6 overflow-hidden border border-white/60 shadow-lg shadow-rose-500/10 hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-400 to-rose-600 opacity-10 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Absen / Izin</p>
                      <div className="flex items-baseline gap-2 mt-2">
                        <h2 className="text-5xl font-black text-slate-800 tracking-tighter">{summary.totalAbsent}</h2>
                        <span className="text-rose-500 font-medium text-sm">Orang</span>
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-rose-400 to-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/30">
                      <UserX size={28} />
                    </div>
                  </div>
                  <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: summary.totalRecords ? `${(summary.totalAbsent / summary.totalRecords) * 100}%` : '0%' }}></div>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="group relative glass rounded-3xl p-6 overflow-hidden border border-white/60 shadow-lg shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400 to-emerald-600 opacity-10 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Jurnal Masuk</p>
                      <div className="flex items-baseline gap-2 mt-2">
                        <h2 className="text-5xl font-black text-slate-800 tracking-tighter">{summary.totalRecords}</h2>
                        <span className="text-emerald-500 font-medium text-sm">Laporan</span>
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/30">
                      <FileText size={28} />
                    </div>
                  </div>
                  <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-full"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Records Section */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <span className="p-2 bg-slate-200/50 rounded-lg text-slate-600"><BookOpen size={20} /></span>
                  Log Jurnal Hari Ini
                </h2>
                <div className="text-sm font-semibold text-slate-500 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                  {records.length} Entri Ditemukan
                </div>
              </div>

              {records.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {records.map((record, index) => (
                    <div key={index} className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/30 border border-slate-100 hover:border-emerald-200 transition-all duration-300 group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-black text-slate-500 text-lg shadow-inner group-hover:from-emerald-500 group-hover:to-teal-500 group-hover:text-white transition-colors duration-300">
                            {record.teacherName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 text-lg leading-tight">{record.teacherName}</h3>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{record.className}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold ${getStatusColor(record.status)}`}>
                          {getStatusIcon(record.status)}
                          {record.status}
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 group-hover:bg-emerald-50/50 transition-colors duration-300">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Materi / Topik</p>
                        <p className="text-slate-700 font-medium text-sm line-clamp-3 leading-relaxed">
                          {record.topic || "Tidak ada rincian materi."}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass rounded-3xl p-16 text-center border border-white/60 shadow-sm flex flex-col items-center justify-center">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <FileText size={48} className="text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-700 mb-2">Belum Ada Aktivitas</h3>
                  <p className="text-slate-500 font-medium max-w-md mx-auto">
                    Data jurnal atau laporan kehadiran guru pada tanggal ini belum tersedia atau belum diisi.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

