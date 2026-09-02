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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">📝 Absensi Siswa</h1>
      
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

