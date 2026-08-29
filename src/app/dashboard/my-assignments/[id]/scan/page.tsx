"use client";

import { useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import ImagePreviewModal from "@/components/ImagePreviewModal";
import { PDFDocument } from "pdf-lib";

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

  // Handle file capture
  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const filesArray = Array.from(e.target.files);
    
    // Convert files to dataURLs for preview
    filesArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === "string") {
          setImages(prev => [
            ...prev, 
            {
              id: Math.random().toString(36).substring(7),
              file: file,
              dataUrl: event.target!.result as string
            }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
    
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
    
    try {
      // 1. Init submission
      const initRes = await fetch(`/api/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: resolvedParams.id })
      });
      if (!initRes.ok) throw new Error("Gagal inisialisasi tugas");
      const submission = await initRes.json();

      // 2. Upload each image as a page
      for (let i = 0; i < images.length; i++) {
        setUploadProgress(10 + Math.round((i / images.length) * 80));
        const img = images[i];
        
        // Ensure we have a File/Blob to upload
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
          throw new Error(errData.error || `Gagal mengunggah halaman ${i + 1}.`);
        }
      }

      setUploadProgress(95);

      // 3. Finalize submission
      const submitRes = await fetch(`/api/submissions/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SUBMIT" })
      });

      if (!submitRes.ok) throw new Error("Gagal finalisasi");

      setUploadProgress(100);

      // Redirect back to assignment detail
      router.push(`/dashboard/my-assignments/${resolvedParams.id}?success=1`);
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan saat mengunggah.");
      setIsUploading(false);
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
          <p className="text-white font-medium">Mengunggah... {uploadProgress}%</p>
          <p className="text-gray-400 text-sm text-center mt-2">Harap jangan tutup halaman ini.</p>
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
    </div>
  );
}
