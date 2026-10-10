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
  
  // SessionStorage key scoped to this assignment to persist state across camera app re-mounts
  const storageKey = `scan-student-${resolvedParams.id}`;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(`${storageKey}-student`);
        return saved || "";
      } catch { return ""; }
    }
    return "";
  });
  
  const [images, setImages] = useState<PageImage[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(`${storageKey}-images`);
        if (saved) {
          const parsed = JSON.parse(saved) as Array<{ id: string; dataUrl: string }>;
          return parsed.map(item => ({ id: item.id, file: null, dataUrl: item.dataUrl }));
        }
      } catch { /* ignore parse errors */ }
    }
    return [];
  });
  const [previewImageId, setPreviewImageId] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isReady, detectCorners, processImage } = useDocumentScanner();
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  
  const [fileQueue, setFileQueue] = useState<File[]>([]);
  const [pendingCrop, setPendingCrop] = useState<{ file: File, dataUrl: string, corners: CornerPoints | null } | null>(null);

  // Persist images to sessionStorage whenever they change (survives mobile camera re-mount)
  useEffect(() => {
    try {
      const toSave = images.map(img => ({ id: img.id, dataUrl: img.dataUrl }));
      sessionStorage.setItem(`${storageKey}-images`, JSON.stringify(toSave));
    } catch { /* quota exceeded — ignore */ }
  }, [images, storageKey]);

  // Persist selected student to sessionStorage
  useEffect(() => {
    try {
      if (selectedStudentId) {
        sessionStorage.setItem(`${storageKey}-student`, selectedStudentId);
      }
    } catch { /* ignore */ }
  }, [selectedStudentId, storageKey]);

  useEffect(() => {
    fetch(`/api/assignments/${resolvedParams.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setAssignment(data);
          fetch(`/api/assignments/${data.id}/submissions`)
            .then(res => res.json())
            .then(submissions => {
              if (Array.isArray(submissions)) {
                const unsubmittedStudents = submissions
                  .filter(sub => sub.status === "UNSUBMITTED")
                  .map(sub => ({
                    _id: sub.student._id || sub.student.id,
                    fullName: sub.student.fullName,
                    studentNumber: sub.student.studentNumber
                  }));
                setStudents(unsubmittedStudents);
              }
            });
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
      const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1280, useWebWorker: true };
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

  // Clear persisted scan state from sessionStorage
  const clearScanStorage = () => {
    try {
      sessionStorage.removeItem(`${storageKey}-images`);
      sessionStorage.removeItem(`${storageKey}-student`);
    } catch { /* ignore */ }
  };

  // Single action: send all images to API for background extract + grade
  const handleSubmitForGrading = async () => {
    if (!selectedStudentId) {
      alert("Pilih siswa terlebih dahulu.");
      return;
    }
    if (images.length === 0) {
      alert("Ambil setidaknya 1 foto halaman.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Collect all base64 images
      const base64Images = images.map(img => img.dataUrl);

      const res = await fetch(`/api/ai/grade-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Images,
          assignmentId: resolvedParams.id,
          studentId: selectedStudentId
        })
      });

      if (!res.ok) {
        throw new Error("Gagal mengirim tugas untuk dikoreksi.");
      }

      // Clear persisted state since this student is done
      clearScanStorage();

      // Navigate back to assignment detail
      router.push(`/dashboard/assignments/${resolvedParams.id}?grading=started`);
      
    } catch (err: any) {
      setIsSubmitting(false);
      alert(err.message || "Terjadi kesalahan saat mengirim tugas.");
    }
  };

  const previewImage = previewImageId ? images.find(img => img.id === previewImageId) : null;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col fixed inset-0 z-40">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-black shadow-md z-10 gap-4">
        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <button onClick={() => { clearScanStorage(); router.back(); }} className="p-2 text-gray-400 hover:text-white font-medium">
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

        <div className="flex items-center space-x-3">
          <span className="text-sm font-semibold text-gray-300 bg-gray-800 px-3 py-1 rounded-lg">{images.length} Halaman</span>
          
          {images.length > 0 && (
            <button 
              onClick={handleSubmitForGrading} 
              disabled={isSubmitting || !selectedStudentId}
              className="bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 px-5 py-2 rounded-full font-bold disabled:opacity-50 text-sm shadow-lg shadow-blue-500/30 transition transform hover:scale-105 active:scale-95"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  Mengirim...
                </span>
              ) : "✅ Koreksi Tugas"}
            </button>
          )}
        </div>
      </div>

      {/* Grid of scanned pages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-40">
        {images.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <span className="text-5xl mb-4">📄</span>
            <p className="text-center px-6 text-lg font-medium">Pilih nama siswa di atas, lalu tekan tombol Kamera di bawah untuk mulai memindai tugas mereka.</p>
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
            
            {/* Tambah Halaman Card */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedStudentId || isProcessingImage || !isReady}
              className="relative bg-gray-800/50 rounded-xl overflow-hidden aspect-[3/4] border-2 border-dashed border-gray-600 hover:border-emerald-500 hover:bg-gray-800 transition-all flex flex-col items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed group"
            >
              <div className="w-14 h-14 rounded-full bg-gray-700 group-hover:bg-emerald-600/20 flex items-center justify-center transition-colors">
                <span className="text-3xl">➕</span>
              </div>
              <span className="text-sm font-semibold text-gray-400 group-hover:text-emerald-400 transition-colors">Tambah Halaman</span>
            </button>
            </div>
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

      {/* Floating Action Buttons — Camera (initial capture) */}
      {images.length === 0 && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={!selectedStudentId || isProcessingImage || !isReady}
            className={`bg-white text-emerald-600 shadow-xl w-20 h-20 rounded-full flex items-center justify-center transition transform border-4 border-emerald-50 ${(!selectedStudentId || isProcessingImage || !isReady) ? 'opacity-50' : 'cursor-pointer pointer-events-auto hover:bg-gray-100 hover:scale-105'}`}
          >
            <span className="text-3xl">📷</span>
          </button>
        </div>
      )}
      
      {/* Hidden file input */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef} 
        onChange={handleCapture} 
        className="hidden" 
        multiple 
      />

      {/* Preview Modal */}
      {previewImage && (
        <ImagePreviewModal
          imageUrl={previewImage.dataUrl}
          onClose={() => setPreviewImageId(null)}
          onRotate={(newUrl) => handleRotate(previewImage.id, newUrl)}
          onDelete={() => handleDelete(previewImage.id)}
        />
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
