"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Assignment {
  id: string;
  title: string;
  class: { name: string };
  deadline: string | null;
  status: string;
  _count: { submissions: number };
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/assignments")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAssignments(data);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manajemen Tugas</h1>
          <p className="text-gray-500 mt-1">Total: <span className="font-semibold text-blue-600">{assignments.length} tugas</span></p>
        </div>
        <button
          onClick={() => router.push("/dashboard/assignments/create")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          + Buat Tugas Baru
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Memuat data tugas...</div>
        ) : assignments.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-5xl mb-4">📋</p>
            <p>Belum ada tugas yang dibuat. Silakan buat tugas pertama Anda.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Judul Tugas</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Kelas</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Deadline</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Submisi</th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a, i) => (
                <tr key={a.id} className={`border-b border-gray-50 hover:bg-gray-50 transition ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                  <td className="px-6 py-4 font-medium text-gray-800">{a.title}</td>
                  <td className="px-6 py-4 text-gray-600">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                      {a.class.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {a.deadline ? new Date(a.deadline).toLocaleDateString("id-ID") : "Tidak ada"}
                  </td>
                  <td className="px-6 py-4">
                    {a.status === "PUBLISHED" ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">PUBLISHED</span>
                    ) : a.status === "DRAFT" ? (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">DRAFT</span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">{a.status}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">{a._count.submissions}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/dashboard/assignments/${a.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Detail →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
