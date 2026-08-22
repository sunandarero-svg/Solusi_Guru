"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinksProps {
  role: string;
}

export default function NavLinks({ role }: NavLinksProps) {
  const pathname = usePathname();

  const teacherLinks = [
    { href: "/dashboard", label: "🏠 Dashboard" },
    { href: "/dashboard/students", label: "👨‍🎓 Siswa" },
    { href: "/dashboard/classes", label: "🏫 Kelas" },
    { href: "/dashboard/assignments", label: "📋 Tugas" },
  ];

  const studentLinks = [
    { href: "/dashboard", label: "🏠 Dashboard" },
    { href: "/dashboard/my-assignments", label: "📚 Tugas Saya" },
  ];

  const links = role === "TEACHER" ? teacherLinks : studentLinks;

  return (
    <ul className="space-y-1">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
