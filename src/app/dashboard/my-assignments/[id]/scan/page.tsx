"use client";

import { useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import ImagePreviewModal from "@/components/ImagePreviewModal";
import { PDFDocument } from "pdf-lib";
import imageCompression from "browser-image-compression";

interface PageImage {
  id: string; // temp client id
  file: File | null; // actual file if just taken
  dataUrl: string; // for preview
}

export default function ScannerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [images, setImages] = useState<PageImage[]>([]);
  const [previewImageId, setPreviewImageId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [aiResultModal, setAiResultModal] = useState<{ type: 'success' | 'error', score: number, reason: string } | null>(null);

  // Handle file capture
  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const filesArray = Array.from(e.target.files);
    
    for (const file of filesArray) {
      try {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        // Tampilkan loading singkat jika perlu, atau andalkan async
        const compressedFile = await imageCompression(file, options);
        
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target && typeof event.target.result === "string") {
            setImages(prev => [
              ...prev, 
              {
                id: Math.random().toString(36).substring(7),
                file: compressedFile,
                dataUrl: event.target!.result as string
              }
            ]);
          }
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error("Compression error:", error);
      }
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Replace rotated image in state
  const handleRotate = (id: string, newDataUrl: string) => {
    // Note: To submit this rotated image, we need to convert DataURL to File
    const arr = newDataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return;
    
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
      u8arr[n] = bstr.charCodeAt(n);
    }
    const rotatedFile = new File([u8arr], `rotated_${Date.now()}.jpg`, { type: mime });

    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, dataUrl: newDataUrl, file: rotatedFile } : img
    ));
  };

  const handleDelete = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    setPreviewImageId(null);
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    if (direction === 'up' && index > 0) {
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    } else if (direction === 'down' && index < newImages.length - 1) {
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    }
    setImages(newImages);
  };

  const handleSubmit = async () => {
    if (images.length === 0) {
      alert("Ambil setidaknya 1 foto halaman.");
      return;
    }

    if (!confirm(`Kirim ${images.length} halaman ini? Anda tidak bisa menambah atau menghapus halaman setelah dikumpulkan.`)) return;

    setIsUploading(true);
    setUploadProgress(10);
    setElapsedTime(0);
    
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      setUploadProgress(prev => (prev < 90 ? prev + 1 : prev));
    }, 1000);
    
    try {
      // 1. Init submission
      const initRes = await fetch(`/api/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: resolvedParams.id })
      });
      if (!initRes.ok) throw new Error("Gagal inisialisasi tugas");
      const submission = await initRes.json();

      // 2. Clear existing pages to avoid accumulation on retries
      const clearRes = await fetch(`/api/submissions/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CLEAR_PAGES" })
      });
      if (!clearRes.ok) throw new Error("Gagal membersihkan sesi halaman sebelumnya");

      // 3. Upload each image as a page
      let finalAiScore: number | null = null;
      let finalAiReason: string | null = null;
      
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        
        let fileToUpload: File | Blob = img.file!;
        if (!fileToUpload && img.dataUrl) {
          const res = await fetch(img.dataUrl);
          fileToUpload = await res.blob();
        }

        const formData = new FormData();
        formData.append("file", fileToUpload, `page_${i + 1}.jpg`);
        formData.append("pageNumber", (i + 1).toString());

        const uploadRes = await fetch(`/api/submissions/${submission.id}/pages`, {
          method: "POST",
          body: formData
        });
        
        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(JSON.stringify(errData));
        }
      }

      setUploadProgress(70);

      // 4. Verify all pages at once with AI
      const verifyRes = await fetch(`/api/submissions/${submission.id}/verify`, {
        method: "POST"
      });
      
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        if (verifyData.error === "AI_REJECTION") {
          throw new Error(JSON.stringify(verifyData));
        }
        throw new Error(verifyData.error || "Gagal memverifikasi AI");
      }
      
      finalAiScore = verifyData.aiResult.readabilityScore;
      finalAiReason = verifyData.aiResult.reason;

      clearInterval(progressInterval);
      setUploadProgress(95);

      // 5. Finalize submission
      const submitRes = await fetch(`/api/submissions/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SUBMIT" })
      });

      if (!submitRes.ok) throw new Error("Gagal finalisasi");

      setUploadProgress(100);
      setIsUploading(false);

      if (finalAiScore !== null && finalAiReason !== null) {
        setAiResultModal({ type: 'success', score: finalAiScore, reason: finalAiReason });
      } else {
        // Redirect back to assignment detail if no AI result
        router.push(`/dashboard/my-assignments/${resolvedParams.id}?success=1`);
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setIsUploading(false);
      try {
        const parsedErr = JSON.parse(err.message);
        if (parsedErr.error === "AI_REJECTION") {
          setAiResultModal({ type: 'error', score: parsedErr.score, reason: parsedErr.reason });
          return;
        }
        alert(parsedErr.error || "Terjadi kesalahan saat mengunggah.");
      } catch(e) {
        alert(err.message || "Terjadi kesalahan saat mengunggah.");
      }
    }
  };

  const previewImage = previewImageId ? images.find(img => img.id === previewImageId) : null;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col fixed inset-0 z-40">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black shadow-md z-10">
        <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-white font-medium">
          Tutup
        </button>
        <span className="font-bold">{images.length} Halaman</span>
        <button 
          onClick={handleSubmit} 
          disabled={isUploading || images.length === 0}
          className="bg-blue-600 px-4 py-2 rounded-full font-medium disabled:opacity-50 text-sm"
        >
          {isUploading ? "Mengirim..." : "Kumpul"}
        </button>
      </div>

      {/* Grid of scanned pages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {images.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <span className="text-4xl mb-4">📄</span>
            <p className="text-center px-6">Tekan tombol Kamera di bawah untuk mulai memindai halaman tugas Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map((img, index) => (
              <div key={img.id} className="relative bg-gray-800 rounded-xl overflow-hidden aspect-[3/4] border border-gray-700">
                <img 
                  src={img.dataUrl} 
                  alt={`Halaman ${index + 1}`} 
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setPreviewImageId(img.id)}
                />
                
                <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-md">
                  Hal {index + 1}
                </div>

                {/* Reorder controls overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 flex justify-between">
                  <button 
                    onClick={() => moveImage(index, 'up')}
                    disabled={index === 0}
                    className="bg-black bg-opacity-50 p-2 rounded-full disabled:opacity-30"
                  >
                    ⬆️
                  </button>
                  <button 
                    onClick={() => setPreviewImageId(img.id)}
                    className="bg-blue-600 bg-opacity-80 p-2 rounded-full"
                  >
                    🔍
                  </button>
                  <button 
                    onClick={() => moveImage(index, 'down')}
                    disabled={index === images.length - 1}
                    className="bg-black bg-opacity-50 p-2 rounded-full disabled:opacity-30"
                  >
                    ⬇️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Progress Overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-black bg-opacity-80 z-20 flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-sm mb-4">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
          <p className="text-white font-medium mb-1">Menganalisis & Mengunggah... {uploadProgress}%</p>
          <p className="text-blue-400 text-sm font-mono font-bold mb-2">{elapsedTime} detik berlalu</p>
          <p className="text-gray-400 text-xs text-center">Tugas sedang dibaca oleh AI. Harap jangan tutup halaman ini.</p>
        </div>
      )}

      {/* Floating Action Button (Camera) */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
        <label className="bg-white text-blue-600 shadow-xl w-20 h-20 rounded-full flex items-center justify-center cursor-pointer pointer-events-auto hover:bg-gray-100 transition transform hover:scale-105 border-4 border-blue-50">
          <span className="text-3xl">📷</span>
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            capture="environment" 
            multiple
            onChange={handleCapture}
            className="hidden"
          />
        </label>
      </div>

      {/* Preview Modal */}
      {previewImage && (
        <ImagePreviewModal
          imageUrl={previewImage.dataUrl}
          onClose={() => setPreviewImageId(null)}
          onRotate={(newUrl) => handleRotate(previewImage.id, newUrl)}
          onDelete={() => handleDelete(previewImage.id)}
        />
      )}

      {/* AI Result Modal (Futuristic Modern Design) */}
      {aiResultModal && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={`bg-gray-900 border ${aiResultModal.type === 'error' ? 'border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.3)]' : 'border-green-500/50 shadow-[0_0_40px_rgba(34,197,94,0.3)]'} rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 relative`}>
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${aiResultModal.type === 'error' ? 'from-red-500 via-orange-500 to-red-500' : 'from-green-400 via-emerald-500 to-green-500'}`}></div>
            
            <div className="flex flex-col items-center text-center">
              <div className={`relative flex items-center justify-center w-24 h-24 rounded-full bg-gray-800 border-[3px] ${aiResultModal.type === 'error' ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]'} mb-4`}>
                <span className="text-3xl font-black text-white">{aiResultModal.score}%</span>
                <span className={`absolute -bottom-2 ${aiResultModal.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider`}>Score</span>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                {aiResultModal.type === 'error' ? 'Hampir Sempurna! Yuk, Perbaiki Sedikit Lagi 🚀' : 'Luar Biasa! Tugas Siap Diperiksa 🌟'}
              </h2>
              
              <div className={`${aiResultModal.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-200' : 'bg-green-500/10 border-green-500/20 text-green-200'} border text-sm p-4 rounded-xl mb-6 text-left w-full leading-relaxed`}>
                <p className="font-semibold mb-1 text-white">Pesan dari AI:</p>
                {aiResultModal.reason}
                {aiResultModal.type === 'error' && (
                  <p className="mt-3 text-orange-300 italic text-xs">Jangan menyerah! Tulisan yang rapi dan jelas akan sangat membantu bapak/ibu guru dalam memberikan nilai terbaik buat kamu. Ayo coba foto ulang!</p>
                )}
                {aiResultModal.type === 'success' && (
                  <p className="mt-3 text-emerald-300 italic text-xs">Tugas Anda sangat jelas dan rapi. Guru akan dengan mudah memeriksanya!</p>
                )}
              </div>
              
              <button 
                onClick={() => {
                  if (aiResultModal.type === 'error') {
                    setAiResultModal(null);
                    // Do not delete images, let user manually delete the blurry one
                  } else {
                    router.push(`/dashboard/my-assignments/${resolvedParams.id}?success=1`);
                  }
                }}
                className={`w-full ${aiResultModal.type === 'error' ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400' : 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400'} text-white font-bold py-3 rounded-xl shadow-lg transform transition hover:-translate-y-1`}
              >
                {aiResultModal.type === 'error' ? 'Tutup & Perbaiki Foto' : 'Lihat Hasil AI'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
