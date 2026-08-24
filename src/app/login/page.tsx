"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GraduationCap, Mail, Lock, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError("Email atau password salah. Silakan coba lagi.");
      setLoading(false);
    } else {
      sessionStorage.setItem("app_session", "active");
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-premium-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Brand */}
        <div className="text-center mb-8 transform transition-all duration-500 hover:scale-105">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl shadow-lg mb-4 text-white">
            <GraduationCap size={40} strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">AI Assessment</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Sistem Penilaian Tugas Berbasis AI</p>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500"></div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Selamat Datang 👋</h2>

          {error && (
            <div className="bg-red-50/80 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <span className="text-red-500 bg-red-100 p-1 rounded-full text-xs font-bold px-2">!</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-600">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="nama@sekolah.com"
                  className="w-full bg-white/50 border border-slate-200/60 rounded-xl pl-11 pr-4 py-3.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition-all duration-200 shadow-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-slate-600">Password</label>
                <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                  Lupa Password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-white/50 border border-slate-200/60 rounded-xl pl-11 pr-4 py-3.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition-all duration-200 shadow-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              id="login-button"
              type="submit"
              disabled={loading}
              className="w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed mt-4 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span className="relative z-10">Masuk ke Akun</span>
                  <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-8 font-medium">
          Belum punya akun? <a href="#" className="text-blue-600 hover:text-blue-700 hover:underline transition-colors">Hubungi Admin</a>
        </p>
      </div>
    </div>
  );
}
