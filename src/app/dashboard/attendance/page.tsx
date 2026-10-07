"use client";

import { useState, useEffect } from "react";

interface Student {
  _id: string;
  fullName: string;
  studentNumber: string;
}

interface Class {
  _id: string;
  name: string;
}

interface AttendanceRecord {
  studentId: string;
  status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA';
}

export default function AttendancePage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA'>>({});
  const [isLoading, setIsLoading] = useState(false);

  const [isExporting, setIsExporting] = useState(false);
  const [exportFilter, setExportFilter] = useState<'all' | 'date' | 'month' | 'year'>('all');
  const [exportDate, setExportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [exportMonth, setExportMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [exportYear, setExportYear] = useState<string>(new Date().getFullYear().toString());

  useEffect(() => {
    fetch('/api/classes')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setClasses(data);
        } else if (data.classes) {
          setClasses(data.classes);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (selectedClass && date) {
      setIsLoading(true);
      Promise.all([
        fetch(`/api/classes/${selectedClass}/students`).then(res => res.ok ? res.json() : { students: [] }),
        fetch(`/api/teacher/attendance?classId=${selectedClass}&date=${date}`).then(res => res.ok ? res.json() : { records: [] })
      ])
      .then(([studentsData, attendanceData]) => {
        if (!isMounted) return;
        
        // Handle potentially malformed data safely
        const fetchedStudents = Array.isArray(studentsData?.students) ? studentsData.students : 
                                (Array.isArray(studentsData) ? studentsData : []);
                                
        // Filter out any null or invalid students to prevent React render crash
        const validStudents = fetchedStudents.filter((s: any) => s && typeof s === 'object' && s._id);
        
        setStudents(validStudents);
        
        const newAttendance: Record<string, 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA'> = {};
        const records = attendanceData?.records || [];
        
        if (Array.isArray(records) && records.length > 0) {
          records.forEach((record: any) => {
            if (record?.studentId) {
              newAttendance[record.studentId] = record.status || 'HADIR';
            }
          });
        } else {
          // Default to HADIR
          validStudents.forEach((student: any) => {
            if (student?._id) {
              newAttendance[student._id] = 'HADIR';
            }
          });
        }
        setAttendance(newAttendance);
      })
      .catch(err => {
        console.error("Error fetching data:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    } else {
      if (isMounted) setStudents([]);
    }
    
    return () => { isMounted = false; };
  }, [selectedClass, date]);

  const handleStatusChange = (studentId: string, status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA') => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status
      }));

      const res = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClass,
          date,
          records
        })
      });

      if (res.ok) {
        alert("Absensi berhasil disimpan!");
      } else {
        alert("Gagal menyimpan absensi.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let url = `/api/teacher/attendance/export?filter=${exportFilter}`;
      if (exportFilter === 'date') url += `&value=${exportDate}`;
      else if (exportFilter === 'month') url += `&value=${exportMonth}`;
      else if (exportFilter === 'year') url += `&value=${exportYear}`;
      
      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || "Gagal mengunduh data. Mungkin tidak ada data untuk filter tersebut.");
        return;
      }
      
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const val = exportFilter === 'date' ? exportDate : exportFilter === 'month' ? exportMonth : exportFilter === 'year' ? exportYear : 'semua';
      a.download = `Laporan_Absensi_${exportFilter}_${val}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan jaringan saat mengunduh.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">📝 Absensi Siswa</h1>
      
      <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-xl mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-emerald-800 mb-3 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Unduh Rekap Absensi
        </h2>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-emerald-700 mb-2">Pilih Filter</label>
            <select
              value={exportFilter}
              onChange={(e) => setExportFilter(e.target.value as any)}
              className="w-full p-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white"
            >
              <option value="all">Semua Data</option>
              <option value="date">Berdasarkan Tanggal</option>
              <option value="month">Berdasarkan Bulan</option>
              <option value="year">Berdasarkan Tahun</option>
            </select>
          </div>
          
          {exportFilter === 'date' && (
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-emerald-700 mb-2">Tanggal</label>
              <input
                type="date"
                value={exportDate}
                onChange={(e) => setExportDate(e.target.value)}
                className="w-full p-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white"
              />
            </div>
          )}
          
          {exportFilter === 'month' && (
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-emerald-700 mb-2">Bulan</label>
              <input
                type="month"
                value={exportMonth}
                onChange={(e) => setExportMonth(e.target.value)}
                className="w-full p-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white"
              />
            </div>
          )}
          
          {exportFilter === 'year' && (
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-emerald-700 mb-2">Tahun</label>
              <input
                type="number"
                min="2020"
                max="2100"
                value={exportYear}
                onChange={(e) => setExportYear(e.target.value)}
                className="w-full p-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white"
              />
            </div>
          )}
          
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-[42px]"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Mengunduh...
              </>
            ) : (
              "Download Excel"
            )}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 md:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Kelas</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
          >
            <option value="">-- Pilih Kelas --</option>
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Memuat data...</div>
      ) : selectedClass ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIS</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status Kehadiran</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student, index) => (
                <tr key={student._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.fullName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.studentNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex justify-center gap-2">
                    {['HADIR', 'SAKIT', 'IZIN', 'ALPA'].map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(student._id, status as any)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          attendance[student._id] === status
                            ? status === 'HADIR' ? 'bg-green-100 text-green-800 border-green-200' 
                              : status === 'SAKIT' ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              : status === 'IZIN' ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-red-100 text-red-800 border-red-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } border`}
                      >
                        {status}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm"
            >
              Simpan Absensi
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border-dashed border-2 border-gray-300">
          Silakan pilih kelas terlebih dahulu
        </div>
      )}
    </div>
  );
}

