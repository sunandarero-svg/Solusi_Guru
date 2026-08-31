"use client";

import { useState, useEffect } from "react";
import { User, Lock, Save, Camera, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    avatarUrl: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then(res => res.json())
      .then(data => {
        if (data.fullName) {
          setFormData({
            fullName: data.fullName,
            email: data.email,
            password: "",
            avatarUrl: data.avatarUrl || ""
          });
        }
        setLoading(false);
      })
      .catch(err => {
        setError("Gagal memuat profil");
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload: any = {
        fullName: formData.fullName,
        avatarUrl: formData.avatarUrl,
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui profil");

      setSuccess("Profil berhasil diperbarui!");
      setFormData(prev => ({ ...prev, password: "" })); // Clear password field
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat profil...</div>;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <h1 className="text-2xl font-bold text-slate-800">Profil Akun</h1>
          <p className="text-slate-500 mt-1">Kelola informasi pribadi dan keamanan akun Anda</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl flex items-center gap-3">
              <AlertTriangle size={20} />
              <p>{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
              <p className="font-medium">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center relative group">
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} className="text-slate-300" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={24} />
                  </div>
                </div>
                <div className="mt-4 w-full">
                  <label className="block text-xs font-semibold text-slate-500 text-center mb-1">URL Foto Profil</label>
                  <input
                    type="url"
                    value={formData.avatarUrl}
                    onChange={e => setFormData({ ...formData, avatarUrl: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg text-center focus:outline-none focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex-1 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    disabled
                    value={formData.email}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 outline-none cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 mt-1">Email tidak dapat diubah.</p>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Password Baru</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="Kosongkan jika tidak ingin mengubah password"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm shadow-blue-200 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? "Menyimpan..." : <><Save size={20} /> Simpan Perubahan</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
