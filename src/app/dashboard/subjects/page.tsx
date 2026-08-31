"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, User as UserIcon, Building } from "lucide-react";

interface SubjectData {
  id: string;
  subject: {
    id: string;
    name: string;
  };
  teacher: {
    id: string;
    fullName: string;
  };
  class: {
    id: string;
    name: string;
  };
}

export default function StudentSubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/subjects")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSubjects(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat daftar mata pelajaran...</div>;

  return (
    <div className="mt-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="text-blue-500" /> Mata Pelajaran Saya
        </h1>
        <p className="text-slate-500 mt-1 font-medium">Daftar mata pelajaran yang Anda ambil di kelas Anda.</p>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Mata Pelajaran</h2>
          <p className="text-slate-500">Anda belum terdaftar pada mata pelajaran apapun.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map(item => (
            <div key={item.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300 group">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <BookOpen size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">{item.subject.name}</h2>
              
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <UserIcon size={16} className="text-slate-400" />
                  <span className="font-medium">{item.teacher.fullName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Building size={16} className="text-slate-400" />
                  <span>Kelas {item.class.name}</span>
                </div>
              </div>

              <Link 
                href={`/dashboard/my-assignments?subjectId=${item.subject.id}`}
                className="mt-6 block text-center bg-blue-50 text-blue-600 font-bold py-2.5 rounded-xl hover:bg-blue-100 transition-colors"
              >
                Lihat Tugas
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
