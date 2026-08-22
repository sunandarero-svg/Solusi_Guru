import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import NavLinks from "@/components/NavLinks";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="font-bold text-xl text-blue-600">AI Assessment</h1>
          <p className="text-xs text-gray-400 mt-1">Sistem Penilaian Cerdas</p>
        </div>

        <nav className="flex-1 p-4">
          <NavLinks role={role} />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Login sebagai</p>
            <p className="text-sm font-semibold text-gray-700 truncate">{session.user?.email}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${role === "TEACHER" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
              {role === "TEACHER" ? "Guru" : "Siswa"}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-end items-center">
          <LogoutButton />
        </header>
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
