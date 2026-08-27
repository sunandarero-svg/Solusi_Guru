"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Users, Upload, UserPlus, X, Download, ChevronLeft, Trash2 } from "lucide-react";
import Papa from "papaparse";

interface Student {
  _id: string;
  fullName: string;
  studentNumber: string;
}

interface ClassData {
  _id: string;
  name: string;
  description: string;
  enrollments: { student: Student }[];
}

export default function ClassDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"manual" | "csv">("manual");
  
  // Manual Input State
  const [manualName, setManualName] = useState("");
  const [manualNis, setManualNis] = useState("");
  
  // CSV Input State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchClassDetails = () => {
    setLoading(true);
    fetch(`/api/classes/${resolvedParams.id}`)
      .then(res => res.json())
      .then(data => {
        if (data._id) setClassData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchClassDetails();
  }, [resolvedParams.id]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualNis) return;
    
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`/api/classes/${resolvedParams.id}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          students: [{ fullName: manualName, studentNumber: manualNis }]
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: "success", text: data.message });
        setManualName("");
        setManualNis("");
        fetchClassDetails();
        setTimeout(() => setShowModal(false), 2000);
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Terjadi kesalahan server" });
    }
    setSubmitting(false);
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus siswa ini dari kelas?")) return;
    
    try {
      const res = await fetch(`/api/classes/${resolvedParams.id}/students/${studentId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchClassDetails();
      } else {
        alert("Gagal menghapus siswa");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem");
    }
  };

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCsvFile(file);
      
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          setCsvPreview(results.data.slice(0, 5)); // Preview first 5 rows
        }
      });
    }
  };

  const handleCsvSubmit = async () => {
    if (!csvFile) return;
    
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async function(results) {
        const parsedStudents = results.data.map((row: any) => ({
          fullName: row.NamaLengkap || row.Nama || row.name || Object.values(row)[0],
          studentNumber: row.NIS || row.nis || row.studentNumber || Object.values(row)[1]
        })).filter(s => s.fullName && s.studentNumber);

        if (parsedStudents.length === 0) {
          setMessage({ type: "error", text: "Format CSV tidak sesuai. Pastikan ada kolom NamaLengkap dan NIS." });
          setSubmitting(false);
          return;
        }

        try {
          const res = await fetch(`/api/classes/${resolvedParams.id}/students`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ students: parsedStudents })
          });
          const data = await res.json();
          
          if (res.ok) {
            setMessage({ type: "success", text: data.message });
            setCsvFile(null);
            setCsvPreview([]);
            fetchClassDetails();
            setTimeout(() => setShowModal(false), 2000);
          } else {
            setMessage({ type: "error", text: data.error });
          }
        } catch (err) {
          setMessage({ type: "error", text: "Terjadi kesalahan server saat mengunggah" });
        }
        setSubmitting(false);
      }
    });
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,NamaLengkap,NIS\nBudi Santoso,1001\nSiti Aminah,1002";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Template_Siswa.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat detail kelas...</div>;
  if (!classData) return <div className="p-8 text-center text-red-500">Kelas tidak ditemukan.</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center mb-6 space-x-2 text-sm">
        <Link href="/dashboard/classes" className="text-gray-500 hover:text-blue-600 flex items-center">
          <ChevronLeft size={16} className="mr-1"/> Manajemen Kelas
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-800 font-medium">Detail Kelas</span>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 p-6 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{classData.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{classData.description || 'Tidak ada deskripsi'}</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
        >
          <UserPlus size={18} /> Tambah Siswa
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <Users size={18} className="text-blue-500"/> 
            Daftar Siswa ({classData.enrollments.length})
          </h2>
        </div>
        
        {classData.enrollments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-gray-400" />
            </div>
            <p>Belum ada siswa di kelas ini.</p>
            <p className="text-sm mt-1">Klik tombol <strong>Tambah Siswa</strong> untuk memasukkan data.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="p-4 font-medium">No</th>
                  <th className="p-4 font-medium">Nomor Induk (NIS)</th>
                  <th className="p-4 font-medium">Nama Lengkap</th>
                  <th className="p-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {classData.enrollments.map((e, index) => (
                  <tr key={e.student._id} className="hover:bg-gray-50 transition">
                    <td className="p-4 text-gray-500">{index + 1}</td>
                    <td className="p-4 font-medium text-gray-700">{e.student.studentNumber}</td>
                    <td className="p-4 font-semibold text-gray-800">{e.student.fullName}</td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDeleteStudent(e.student._id)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition"
                        title="Hapus Siswa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah Siswa */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">Tambah Siswa</h3>
              <button onClick={() => {setShowModal(false); setMessage({type:"",text:""})}} className="text-gray-400 hover:text-gray-600 transition p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex border-b border-gray-100">
              <button 
                onClick={() => {setActiveTab("manual"); setMessage({type:"",text:""})}}
                className={`flex-1 py-3 text-sm font-medium transition ${activeTab === "manual" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/30" : "text-gray-500 hover:bg-gray-50"}`}
              >
                Input Manual
              </button>
              <button 
                onClick={() => {setActiveTab("csv"); setMessage({type:"",text:""})}}
                className={`flex-1 py-3 text-sm font-medium transition flex items-center justify-center gap-2 ${activeTab === "csv" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/30" : "text-gray-500 hover:bg-gray-50"}`}
              >
                <Upload size={16} /> Upload Massal (CSV)
              </button>
            </div>

            <div className="p-6">
              {message.text && (
                <div className={`mb-4 p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                  {message.text}
                </div>
              )}

              {activeTab === "manual" ? (
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                    <input 
                      required 
                      autoFocus
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                      placeholder="Masukkan nama lengkap siswa..." 
                      value={manualName}
                      onChange={e => setManualName(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Induk Siswa (NIS)</label>
                    <input 
                      required 
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                      placeholder="Masukkan NIS..." 
                      value={manualNis}
                      onChange={e => setManualNis(e.target.value)} 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 mt-2 shadow-sm"
                  >
                    {submitting ? "Menyimpan..." : "Simpan Siswa"}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                    <p className="text-sm text-blue-800 font-medium mb-2">Panduan Upload CSV</p>
                    <p className="text-xs text-blue-600/80 mb-3 leading-relaxed">
                      Siapkan data siswa Anda di Microsoft Excel, lalu simpan (Save As) dengan format CSV (Comma delimited). Pastikan terdapat 2 kolom utama: <strong>NamaLengkap</strong> dan <strong>NIS</strong>.
                    </p>
                    <button 
                      onClick={downloadTemplate}
                      className="text-xs bg-white text-blue-600 font-semibold px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 flex items-center gap-1 transition shadow-sm"
                    >
                      <Download size={14} /> Download Template CSV
                    </button>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition cursor-pointer relative">
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={handleCsvChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    />
                    <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      {csvFile ? csvFile.name : "Klik atau seret file CSV ke sini"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Maksimal 1000 baris</p>
                  </div>

                  {csvPreview.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Pratinjau Data (5 Baris Pertama)</p>
                      <table className="w-full text-xs text-left">
                        <thead className="text-gray-400 border-b border-gray-200">
                          <tr>
                            <th className="pb-1">Nama</th>
                            <th className="pb-1">NIS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {csvPreview.map((row, i) => (
                            <tr key={i}>
                              <td className="py-1 text-gray-700 truncate max-w-[120px]">{row.NamaLengkap || row.Nama || row.name || Object.values(row)[0]}</td>
                              <td className="py-1 text-gray-600">{row.NIS || row.nis || row.studentNumber || Object.values(row)[1]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <button 
                    onClick={handleCsvSubmit}
                    disabled={!csvFile || submitting}
                    className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 mt-2 shadow-sm"
                  >
                    {submitting ? "Memproses Data..." : "Mulai Upload Data"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
