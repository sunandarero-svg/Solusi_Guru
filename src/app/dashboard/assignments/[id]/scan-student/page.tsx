"use client";

import { useState, useRef, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import ImagePreviewModal from "@/components/ImagePreviewModal";
import imageCompression from "browser-image-compression";
import { useDocumentScanner } from "@/hooks/useDocumentScanner";
import ManualCropper, { CornerPoints } from "@/components/ManualCropper";

interface PageImage {
  id: string;
  file: File | null;
  dataUrl: string;
}

interface Student {
  _id: string;
  fullName: string;
  studentNumber: string;
}

interface Assignment {
  id: string;
  title: string;
  class: { _id: string; name: string };
}

export default function TeacherScanPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  
  const [images, setImages] = useState<PageImage[]>([]);
  const [previewImageId, setPreviewImageId] = useState<string | null>(null);
  
  // New Flow States
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [isGrading, setIsGrading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  
  const [aiResultModal, setAiResultModal] = useState<{ type: 'success' | 'error', score: number, reason: string } | null>(null);

  const { isReady, detectCorners, processImage } = useDocumentScanner();
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  
  const [fileQueue, setFileQueue] = useState<File[]>([]);
  const [pendingCrop, setPendingCrop] = useState<{ file: File, dataUrl: string, corners: CornerPoints | null } | null>(null);

  useEffect(() => {
    // Fetch assignment details to get class ID
    fetch(`/api/assignments/${resolvedParams.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setAssignment(data);
          // Fetch students for this class
          if (data.class && data.class._id) {
            fetch(`/api/classes/${data.class._id}/students`)
              .then(res => res.json())
              .then(studentData => {
                if (studentData.students) {
                  setStudents(studentData.students);
                }
              });
          }
        }
      });
  }, [resolvedParams.id]);

  // Proses antrean file
  useEffect(() => {
    if (!pendingCrop && fileQueue.length > 0) {
      const nextFile = fileQueue[0];
      const dataUrl = URL.createObjectURL(nextFile);
      setIsProcessingImage(true);
      detectCorners(dataUrl).then(corners => {
        setIsProcessingImage(false);
        setPendingCrop({ file: nextFile, dataUrl, corners });
      });
    }
  }, [fileQueue, pendingCrop, detectCorners]);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    setFileQueue(prev => [...prev, ...filesArray]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropComplete = async (corners: CornerPoints) => {
    if (!pendingCrop) return;
    setIsProcessingImage(true);
    
    setFileQueue(prev => prev.slice(1));
    const currentCrop = pendingCrop;
    setPendingCrop(null); 
    
    try {
      const processedFile = await processImage(currentCrop.dataUrl, corners, currentCrop.file.name);
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true };
      const compressedFile = await imageCompression(processedFile, options);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === "string") {
          setImages(prev => [
            ...prev, 
            { id: Math.random().toString(36).substring(7), file: compressedFile, dataUrl: event.target!.result as string }
          ]);
        }
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingImage(false);
      URL.revokeObjectURL(currentCrop.dataUrl);
    }
  };

  const handleCropCancel = () => {
    if (!pendingCrop) return;
    setFileQueue(prev => prev.slice(1));
    URL.revokeObjectURL(pendingCrop.dataUrl);
    setPendingCrop(null);
  };

  const handleRotate = (id: string, newDataUrl: string) => {
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

  const handleExtractText = async () => {
    if (!selectedStudentId) {
      alert("Pilih siswa terlebih dahulu.");
      return;
    }

    if (images.length === 0) {
      alert("Ambil setidaknya 1 foto halaman.");
      return;
    }

    setIsExtracting(true);
    try {
      let combinedText = "";
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        
        let fileToUpload: File | Blob = img.file!;
        let base64Image = img.dataUrl;

        // Ensure we have a base64
        if (!base64Image && fileToUpload) {
            const reader = new FileReader();
            base64Image = await new Promise((resolve) => {
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsDataURL(fileToUpload);
            });
        }

        const res = await fetch(`/api/ai/extract-text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64Image })
        });
        
        if (!res.ok) {
          throw new Error("Gagal mengekstrak teks dari gambar.");
        }
        
        const data = await res.json();
        if (data.text) {
          combinedText += `\n\n--- Halaman ${i + 1} ---\n${data.text}`;
        }
      }
      
      setExtractedText(combinedText.trim());
      setIsExtracting(false);
      setIsDone(true);
    } catch (err: any) {
      setIsExtracting(false);
      alert(err.message || "Terjadi kesalahan saat mengekstrak teks.");
    }
  };

  const handleGrade = async () => {
    setIsGrading(true);
    try {
      const res = await fetch(`/api/ai/grade-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extractedText,
          assignmentId: resolvedParams.id,
          studentId: selectedStudentId
        })
      });

      if (!res.ok) {
        throw new Error("Gagal mengoreksi tugas.");
      }

      const data = await res.json();
      setIsGrading(false);
      
      setAiResultModal({
        type: 'success',
        score: data.score,
        reason: data.feedback || "Tugas berhasil dikoreksi dan dinilai!"
      });
      
    } catch (err: any) {
      setIsGrading(false);
      alert(err.message || "Terjadi kesalahan saat mengoreksi tugas.");
    }
  };

  const previewImage = previewImageId ? images.find(img => img.id === previewImageId) : null;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col fixed inset-0 z-40">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-black shadow-md z-10 gap-4">
        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-white font-medium">
            Tutup
          </button>
          
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">{assignment?.title || "Memuat tugas..."}</span>
            <select 
              value={selectedStudentId} 
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 text-sm focus:ring-emerald-500 focus:border-emerald-500 w-full max-w-[200px]"
            >
              <option value="" disabled>-- Pilih Siswa --</option>
              {students.map(student => (
                <option key={student._id} value={student._id}>
                  {student.fullName} ({student.studentNumber})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="font-bold hidden sm:inline">{images.length} Halaman</span>
          {!isDone && (
            <button 
              onClick={handleExtractText} 
              disabled={isExtracting || images.length === 0 || !selectedStudentId}
              className="bg-emerald-600 px-4 py-2 rounded-full font-medium disabled:opacity-50 text-sm"
            >
              {isExtracting ? "Mengekstrak Teks..." : "Ekstrak Teks & Periksa"}
            </button>
          )}
          {isDone && (
            <button 
              onClick={handleGrade} 
              disabled={isGrading || !extractedText || !selectedStudentId}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-full font-medium disabled:opacity-50 text-sm shadow-lg shadow-blue-500/50"
            >
              {isGrading ? "Mengoreksi..." : "Koreksi Tugas"}
            </button>
          )}
        </div>
      </div>

      {/* Grid of scanned pages and Textarea */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {images.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <span className="text-4xl mb-4">📄</span>
            <p className="text-center px-6">Pilih nama siswa di atas, lalu tekan tombol Kamera di bawah untuk mulai memindai tugas mereka.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
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
                    className="bg-emerald-600 bg-opacity-80 p-2 rounded-full"
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
            
            {/* TEXTAREA FOR EXTRACTED TEXT */}
            {isDone && (
              <div className="flex flex-col space-y-2 mt-4 bg-gray-800 p-4 rounded-xl border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-emerald-400 font-bold flex items-center">
                    <span>📝 Teks Terbaca</span>
                  </h3>
                  <span className="text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded-md">Edit jika ada yang salah</span>
                </div>
                <textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  className="w-full h-64 bg-slate-50 text-slate-900 p-4 rounded-lg border-2 border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm font-medium resize-y"
                  placeholder="Teks dari gambar akan muncul di sini..."
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Processing Image Overlay */}
      {isProcessingImage && (
        <div className="absolute inset-0 bg-black bg-opacity-80 z-20 flex flex-col items-center justify-center p-8">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white font-medium">Memproses Kertas...</p>
          <p className="text-emerald-400 text-xs mt-2 text-center max-w-xs">Mendeteksi ujung kertas, memotong otomatis, dan mengatur pencahayaan.</p>
        </div>
      )}

      {/* Floating Action Button (Camera) */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={!selectedStudentId || isProcessingImage || !isReady}
          className={`bg-white text-emerald-600 shadow-xl w-20 h-20 rounded-full flex items-center justify-center transition transform border-4 border-emerald-50 ${(!selectedStudentId || isProcessingImage || !isReady) ? 'opacity-50' : 'cursor-pointer pointer-events-auto hover:bg-gray-100 hover:scale-105'}`}
        >
          <span className="text-3xl">📷</span>
        </button>
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          ref={fileInputRef} 
          onChange={handleCapture} 
          className="hidden" 
          multiple 
        />
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

      {/* AI Result Modal */}
      {aiResultModal && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={`bg-gray-900 border ${aiResultModal.type === 'error' ? 'border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.3)]' : 'border-green-500/50 shadow-[0_0_40px_rgba(34,197,94,0.3)]'} rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 relative`}>
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${aiResultModal.type === 'error' ? 'from-red-500 via-orange-500 to-red-500' : 'from-green-400 via-emerald-500 to-green-500'}`}></div>
            
            <div className="flex flex-col items-center text-center">
              <div className="flex flex-col items-center mb-6 w-full p-4 bg-gray-800/50 border border-gray-700 rounded-2xl">
                <span className="text-xl font-extrabold text-white mb-2">Nilai Rekomendasi AI</span>
                <div className={`flex items-center justify-center px-4 py-1.5 rounded-full bg-gray-900 border-2 ${aiResultModal.type === 'error' ? 'border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]'}`}>
                  <span className="text-xl font-bold">{aiResultModal.score}</span>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                {aiResultModal.type === 'error' ? 'Kualitas Foto Kurang Baik 🚀' : 'Berhasil Dikumpulkan! 🌟'}
              </h2>
              
              <div className={`${aiResultModal.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-200' : 'bg-green-500/10 border-green-500/20 text-green-200'} border text-sm p-4 rounded-xl mb-6 text-left w-full leading-relaxed`}>
                <p className="font-semibold mb-1 text-white">Pesan dari AI:</p>
                {aiResultModal.reason}
                {aiResultModal.type === 'error' && (
                  <p className="mt-3 text-orange-300 italic text-xs">Akurasi penilaian mungkin tidak maksimal dengan kualitas foto ini. Silakan ambil ulang gambar jika perlu.</p>
                )}
                {aiResultModal.type === 'success' && (
                  <div className="mt-4 p-3 bg-blue-900/40 border border-blue-500/50 rounded-lg">
                    <p className="text-blue-200 text-sm font-medium leading-relaxed">
                      💡 <strong>Pemberitahuan:</strong> Nilai ini bukan nilai Akhir. Masih ada Nilai Sikap serta Perilaku untuk menentukan Nilai Akhir dan itu hanya bisa dinilai oleh Guru.
                    </p>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => {
                  if (aiResultModal.type === 'error') {
                    setAiResultModal(null);
                  } else {
                    router.push(`/dashboard/assignments/${resolvedParams.id}?success=1`);
                  }
                }}
                className={`w-full ${aiResultModal.type === 'error' ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400' : 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400'} text-white font-bold py-3 rounded-xl shadow-lg transform transition hover:-translate-y-1`}
              >
                {aiResultModal.type === 'error' ? 'Tutup & Perbaiki Foto' : 'Kembali ke Daftar Tugas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Cropper Modal */}
      {pendingCrop && (
        <ManualCropper
          imageSrc={pendingCrop.dataUrl}
          initialCorners={pendingCrop.corners}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

    </div>
  );
}
