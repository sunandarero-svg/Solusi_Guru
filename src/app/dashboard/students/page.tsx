"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Upload, Download, Trash2, Key, Check, AlertTriangle, X } from "lucide-react";
import Papa from "papaparse";

interface Student {
  id: string;
  fullName: string;
  studentNumber: string;
  email: string;
}

export default function StudentsManagementPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActioning, setBulkActioning] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual'|'csv'>('manual');
  const [selectedClassId, setSelectedClassId] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualNis, setManualNis] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/students");
      if (res.ok) {
        setStudents(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/teacher/classes");
      if (res.ok) {
        setClasses(await res.json());
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  const handleBulkAction = async (action: "reset-password" | "delete") => {
    if (selectedIds.length === 0) return;
    
    const actionText = action === "delete" ? "menghapus" : "mereset password";
    if (!confirm(`Apakah Anda yakin ingin ${actionText} ${selectedIds.length} siswa yang dipilih?`)) return;

    setBulkActioning(true);
    try {
      const res = await fetch("/api/students/bulk-action", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: selectedIds, action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert(data.message);
      setSelectedIds([]);
      fetchStudents();
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan");
    } finally {
      setBulkActioning(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: "", text: "" });
    
    try {
      const res = await fetch("/api/students/bulk-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          students: [{ fullName: manualName, studentNumber: manualNis }],
          classId: selectedClassId 
        })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setMessage({ type: "success", text: "Berhasil menambahkan siswa." });
        setManualName("");
        setManualNis("");
        fetchStudents();
      } else {
        setMessage({ type: "error", text: data.errors?.[0] || data.message || "Gagal menambah siswa" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Terjadi kesalahan server" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCsvFile(file);
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
          const res = await fetch("/api/students/bulk-add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ students: parsedStudents, classId: selectedClassId })
          });
          const data = await res.json();
          
          if (res.ok && data.success) {
            setMessage({ type: "success", text: data.message });
            setCsvFile(null);
            fetchStudents();
          } else {
            setMessage({ type: "error", text: data.message || "Beberapa siswa gagal ditambahkan" });
          }
        } catch (err) {
          setMessage({ type: "error", text: "Terjadi kesalahan server" });
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,NamaLengkap,NIS,Username,Password\nBudi Santoso,1001,1001@siswa.com,siswa123\nSiti Aminah,1002,1002@siswa.com,siswa123";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_siswa.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(students.map(s => s.id));
    else setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  return (
    <div className="mt-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-blue-500" /> Manajemen Akun Siswa
          </h1>
          <p className="text-slate-500 mt-1">Kelola data siswa, tambah siswa baru, dan reset password massal.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
        >
          <UserPlus size={18} /> Tambah Siswa
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800">Daftar Siswa Terdaftar</h2>
          
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4">
              <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                {selectedIds.length} dipilih
              </span>
              <button
                onClick={() => handleBulkAction("reset-password")}
                disabled={bulkActioning}
                className="px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Key size={16} /> Reset Password Massal
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                disabled={bulkActioning}
                className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 size={16} /> Hapus Massal
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 w-12 text-center">
                  <input 
                    type="checkbox"
                    checked={students.length > 0 && selectedIds.length === students.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-4 font-semibold text-slate-700">Nama Lengkap</th>
                <th className="px-6 py-4 font-semibold text-slate-700">NIS</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">Memuat data siswa...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">Belum ada siswa terdaftar.</td></tr>
              ) : (
                students.map(student => (
                  <tr key={student.id} className={`transition-colors ${selectedIds.includes(student.id) ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}>
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="checkbox"
                        checked={selectedIds.includes(student.id)}
                        onChange={() => toggleSelect(student.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{student.fullName}</td>
                    <td className="px-6 py-4 font-mono text-slate-500">{student.studentNumber}</td>
                    <td className="px-6 py-4 text-slate-500">{student.email}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">Tambah Siswa</h3>
              <button onClick={() => {setShowModal(false); setMessage({type:"",text:""})}} className="text-slate-400 hover:text-slate-600 transition p-1">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 border-b border-slate-100 bg-white">
              <label className="block text-sm font-bold text-slate-700 mb-2">Pilih Kelas <span className="text-red-500">*</span></label>
              <select 
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition appearance-none bg-white"
                required
              >
                <option value="" disabled>-- Pilih Kelas Tujuan --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex border-b border-slate-100">
              <button 
                onClick={() => {setActiveTab("manual"); setMessage({type:"",text:""})}}
                className={`flex-1 py-4 text-sm font-bold transition ${activeTab === "manual" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/30" : "text-slate-500 hover:bg-slate-50"}`}
              >
                Input Manual
              </button>
              <button 
                onClick={() => {setActiveTab("csv"); setMessage({type:"",text:""})}}
                className={`flex-1 py-4 text-sm font-bold transition flex items-center justify-center gap-2 ${activeTab === "csv" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/30" : "text-slate-500 hover:bg-slate-50"}`}
              >
                <Upload size={16} /> Upload Massal (CSV)
              </button>
            </div>

            <div className="p-8 overflow-y-auto">
              {message.text && (
                <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                  {message.type === "success" ? <Check size={20} /> : <AlertTriangle size={20} />}
                  {message.text}
                </div>
              )}

              {activeTab === "manual" ? (
                <form onSubmit={handleManualSubmit} className="space-y-5">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-2">
                    <p className="text-sm text-blue-800 font-medium text-center">
                      Password default: <span className="font-bold font-mono bg-white px-2 py-1 rounded ml-1">siswa123</span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nama Lengkap</label>
                    <input 
                      required 
                      autoFocus
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                      placeholder="Masukkan nama lengkap siswa..." 
                      value={manualName}
                      onChange={e => setManualName(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nomor Induk Siswa (NIS)</label>
                    <input 
                      required 
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                      placeholder="Masukkan NIS..." 
                      value={manualNis}
                      onChange={e => setManualNis(e.target.value)} 
                    />
                    <p className="text-xs text-slate-400 mt-2 font-medium">NIS digunakan sebagai identitas unik siswa.</p>
                  </div>
                  <button 
                    type="submit" 
                    disabled={!selectedClassId || submitting}
                    className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 mt-4 shadow-sm shadow-blue-200"
                  >
                    {submitting ? "Menyimpan..." : "Simpan Siswa"}
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100 text-center">
                    <p className="text-sm text-blue-800 font-bold mb-2">Panduan Upload CSV</p>
                    <p className="text-xs text-blue-600 mb-4 leading-relaxed">
                      Format CSV (Comma delimited) dengan 2 kolom: <strong>NamaLengkap</strong> dan <strong>NIS</strong>.<br/>
                      Password default: <strong className="font-mono">siswa123</strong>
                    </p>
                    <button 
                      onClick={downloadTemplate}
                      className="text-xs bg-white text-blue-600 font-bold px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-50 inline-flex items-center gap-2 transition shadow-sm"
                    >
                      <Download size={14} /> Download Template CSV
                    </button>
                  </div>
                  
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition cursor-pointer relative group">
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={handleCsvChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    />
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Upload size={28} />
                    </div>
                    <p className="text-sm font-bold text-slate-700">
                      {csvFile ? csvFile.name : "Klik atau seret file CSV ke sini"}
                    </p>
                  </div>

                  <button 
                    onClick={handleCsvSubmit}
                    disabled={!csvFile || !selectedClassId || submitting}
                    className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 mt-2 shadow-sm shadow-blue-200"
                  >
                    {submitting ? "Memproses Data..." : "Upload & Simpan"}
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
