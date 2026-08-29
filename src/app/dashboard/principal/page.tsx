"use client";

import { useState, useEffect } from "react";

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

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">📊 Dashboard Kepala Sekolah</h1>
          <p className="text-gray-500 text-sm">Pantau kehadiran dan jurnal guru per hari</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Pilih Tanggal</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-700 bg-gray-50"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500 flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          Memuat data...
        </div>
      ) : (
        <>
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 flex items-center gap-4">
                <div className="p-4 bg-green-50 text-green-600 rounded-lg">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Guru Masuk / Hadir</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.totalPresent}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 flex items-center gap-4">
                <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Guru Tidak Masuk</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.totalAbsent}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 flex items-center gap-4">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-lg">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Jurnal Dibuat</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.totalRecords}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="font-semibold text-gray-800">Rekapan Kehadiran per Kelas</h2>
            </div>
            {records.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Guru</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status Kehadiran</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topik/Materi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.teacherName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.className}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          record.status === 'HADIR' ? 'bg-green-100 text-green-800' 
                            : record.status === 'SAKIT' ? 'bg-yellow-100 text-yellow-800'
                            : record.status === 'IZIN' ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs" title={record.topic}>{record.topic}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500 bg-gray-50 border-t border-gray-100">
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Belum ada data jurnal atau kehadiran guru untuk tanggal ini.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
