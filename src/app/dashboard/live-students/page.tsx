"use client";

import { useState, useEffect } from "react";
import { Users, Activity, Search, Wifi, WifiOff } from "lucide-react";

interface LiveStudent {
  id: string;
  fullName: string;
  studentNumber: string;
  classes: string[];
  lastActiveAt: string | null;
  isOnline: boolean;
}

export default function LiveStudentsPage() {
  const [students, setStudents] = useState<LiveStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"ALL" | "ONLINE" | "OFFLINE">("ALL");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchLiveStudents = async () => {
    try {
      const res = await fetch("/api/teacher/live-students");
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch live students:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStudents();
    const interval = setInterval(fetchLiveStudents, 15000); // Poll every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          student.studentNumber.includes(searchQuery);
    
    if (filterMode === "ONLINE") return matchesSearch && student.isOnline;
    if (filterMode === "OFFLINE") return matchesSearch && !student.isOnline;
    return matchesSearch;
  });

  const onlineCount = students.filter(s => s.isOnline).length;
  const offlineCount = students.length - onlineCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full mix-blend-multiply filter blur-2xl opacity-70 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-50 rounded-full mix-blend-multiply filter blur-xl opacity-70 -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Status Live Siswa</h1>
              <p className="text-sm text-slate-500 mt-1">Pantau aktivitas siswa yang sedang login dan mengakses aplikasi.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 self-end sm:self-auto text-sm text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          Update terakhir: {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Users size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Siswa Anda</p>
            <p className="text-3xl font-bold text-slate-800">{students.length}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl relative z-10">
            <Wifi size={28} />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-500">Sedang Online</p>
            <p className="text-3xl font-bold text-emerald-600">{onlineCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-slate-100 text-slate-500 rounded-2xl">
            <WifiOff size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Sedang Offline</p>
            <p className="text-3xl font-bold text-slate-600">{offlineCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama atau NISN siswa..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            <button 
              onClick={() => setFilterMode("ALL")}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${filterMode === "ALL" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Semua
            </button>
            <button 
              onClick={() => setFilterMode("ONLINE")}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-2 justify-center ${filterMode === "ONLINE" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-emerald-600"}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online
            </button>
            <button 
              onClick={() => setFilterMode("OFFLINE")}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-2 justify-center ${filterMode === "OFFLINE" ? "bg-white text-slate-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-400"></span> Offline
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Nama Siswa</th>
                <th className="px-6 py-4">NISN</th>
                <th className="px-6 py-4">Kelas</th>
                <th className="px-6 py-4 text-right">Terakhir Aktif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Activity className="animate-spin mx-auto mb-3 text-emerald-500" size={32} />
                    <p>Memuat data siswa secara real-time...</p>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <p>Tidak ada siswa yang ditemukan.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      {student.isOnline ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 shadow-sm">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          Online
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                          Offline
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{student.fullName}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{student.studentNumber}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {student.classes.map((cls, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                            {cls}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {student.lastActiveAt ? (
                        <div className="flex flex-col text-xs">
                          <span className="font-medium text-slate-700">
                            {new Date(student.lastActiveAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-slate-400">
                            {new Date(student.lastActiveAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Belum pernah login</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
