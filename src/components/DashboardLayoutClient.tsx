"use client";

import { useState } from "react";
import { Menu, X, LogOut, LayoutDashboard, Users, BookOpen, FileText, CheckSquare, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  userEmail: string;
  role: string;
}

export default function DashboardLayoutClient({ children, userEmail, role }: DashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const getLinks = () => {
    if (role === "ADMIN") {
      return [
        { href: "/dashboard/admin", label: "Dashboard Admin", icon: ShieldCheck },
        { href: "/dashboard/admin/classes", label: "Manajemen Kelas", icon: BookOpen },
        { href: "/dashboard/admin/teachers", label: "Kelola Guru", icon: Users },
        { href: "/dashboard/admin/subjects", label: "Mata Pelajaran", icon: BookOpen },
        { href: "/dashboard/admin/teaching", label: "Tautkan Guru", icon: LayoutDashboard },
      ];
    }
    if (role === "TEACHER") {
      return [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/dashboard/classes", label: "Manajemen Kelas", icon: BookOpen },
        { href: "/dashboard/students", label: "Akun Siswa", icon: Users },
        { href: "/dashboard/assignments", label: "Tugas", icon: FileText },
        { href: "/dashboard/attendance", label: "Absensi", icon: CheckSquare },
        { href: "/dashboard/journal", label: "Jurnal Guru", icon: FileText },
        { href: "/dashboard/settings", label: "Profil Guru", icon: ShieldCheck },
      ];
    }
    if (role === "PRINCIPAL") {
      return [
        { href: "/dashboard/principal", label: "Dashboard Utama", icon: LayoutDashboard },
      ];
    }
    return [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/subjects", label: "Mata Pelajaran", icon: BookOpen },
      { href: "/dashboard/my-assignments", label: "Tugas Saya", icon: CheckSquare },
    ];
  };

  const links = getLinks();
  const roleLabel = role === "ADMIN" ? "Admin" : role === "TEACHER" ? "Guru" : role === "PRINCIPAL" ? "Kepala Sekolah" : "Siswa";
  const roleColor = role === "ADMIN" ? "bg-purple-100 text-purple-700" : role === "TEACHER" ? "bg-blue-100 text-blue-700" : role === "PRINCIPAL" ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700";

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 shadow-lg lg:shadow-none transform transition-transform duration-300 ease-in-out flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-6 border-b border-slate-100/50 flex items-center justify-between">
          <div>
            <h1 className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              AssessAI
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide">Sistem Penilaian Cerdas</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={18} className={isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500 transition-colors"} strokeWidth={isActive ? 2.5 : 2} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-100/50">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-4 border border-slate-200/50 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-50 translate-x-1/2 -translate-y-1/2"></div>
            
            <p className="text-xs text-slate-500 font-medium mb-1 relative z-10">Login sebagai</p>
            <p className="text-sm font-bold text-slate-800 truncate relative z-10">{userEmail}</p>
            <div className="mt-3 flex items-center justify-between relative z-10">
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold shadow-sm ${roleColor}`}>
                {roleLabel}
              </span>
              
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 group"
                title="Keluar"
              >
                <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Subtle decorative background for main area */}
        <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none -z-10"></div>
        
        <header className="bg-white/70 backdrop-blur-md border-b border-slate-200/60 px-4 sm:px-8 py-4 flex items-center lg:justify-end justify-between sticky top-0 z-30 shadow-sm">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sistem Aktif
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
