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
    const csvContent = "data:text/csv;charset=utf-8,NamaLengkap,NIS,Username,Password\nBudi Santoso,1001,1001@siswa.com,siswa123\nSiti Aminah,1002,1002@siswa.com,siswa123";
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
        <Link href="/dashboard/classes" className="text-gray-500 hover:text-emerald-600 flex items-center">
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
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <Users size={18} className="text-emerald-500"/> 
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
    </div>
  );
}
