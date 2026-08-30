"use client";

import { useState, useEffect } from "react";

interface Class {
  _id: string;
  name: string;
}

export default function JournalPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceStatus, setAttendanceStatus] = useState<'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA'>('HADIR');
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
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
    if (selectedClass && date) {
      setIsLoading(true);
      fetch(`/api/teacher/journal?classId=${selectedClass}&date=${date}`)
        .then(res => res.json())
        .then(data => {
          if (data && data._id) {
            setAttendanceStatus(data.attendanceStatus);
            setTopic(data.topic);
            setDescription(data.description);
          } else {
            setAttendanceStatus('HADIR');
            setTopic("");
            setDescription("");
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [selectedClass, date]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !date || !topic || !description) {
      alert("Harap lengkapi semua field yang diperlukan.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/teacher/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClass,
          date,
          attendanceStatus,
          topic,
          description
        })
      });

      if (res.ok) {
        alert("Jurnal harian berhasil disimpan!");
      } else {
        alert("Gagal menyimpan jurnal.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">📔 Jurnal Harian Guru</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Kelas</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-900"
                required
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status Kehadiran Guru</label>
            <div className="flex gap-4">
              {['HADIR', 'SAKIT', 'IZIN', 'ALPA'].map(status => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="attendanceStatus"
                    value={status}
                    checked={attendanceStatus === status}
                    onChange={(e) => setAttendanceStatus(e.target.value as any)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className={`text-sm font-medium ${
                    attendanceStatus === status ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {status}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Topik / Materi Pokok</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Contoh: Aljabar Linier, Tata Bahasa..."
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi Kegiatan / Keterangan</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan secara singkat kegiatan belajar mengajar hari ini..."
              rows={4}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              required
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !selectedClass}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-8 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
            >
              {isLoading ? "Menyimpan..." : "Simpan Jurnal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
