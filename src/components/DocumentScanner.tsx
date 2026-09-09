"use client";

import React, { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";

interface DocumentScannerProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
  allowGalleryUpload?: boolean;
}

export default function DocumentScanner({ onCapture, onClose, allowGalleryUpload = false }: DocumentScannerProps) {
  const [mode, setMode] = useState<"camera" | "preview">("camera");
  const [finalImage, setFinalImage] = useState<string | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  
  const webcamRef = useRef<Webcam>(null);

  const handleCapture = useCallback(() => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      processCapturedImage(imageSrc);
    }
  }, [webcamRef]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          processCapturedImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const processCapturedImage = (base64Str: string) => {
    setIsProcessing(true);
    setFinalImage(base64Str);
    setMode("preview");
    setIsProcessing(false);
  };

  const confirmAndSave = () => {
    if (finalImage) {
      onCapture(finalImage);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900 text-white shadow-md z-10">
        <button onClick={onClose} className="text-gray-400 hover:text-white px-3 py-1 font-medium">
          Batal
        </button>
        <span className="font-bold text-lg">
          {mode === "camera" ? "Ambil Foto" : "Pratinjau Hasil"}
        </span>
        <div className="w-16">
          {/* Spacer */}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center bg-gray-950">
        
        {/* Loading Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-emerald-400 mt-4 font-medium">Memproses Foto...</p>
          </div>
        )}

        {/* Camera Mode */}
        {mode === "camera" && (
          <div className="relative w-full h-full flex items-center justify-center">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment", width: 1920, height: 1080 }}
              className="w-full h-full object-cover"
            />
            
            {/* Camera Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 flex justify-center items-center bg-gradient-to-t from-black via-black/80 to-transparent">
              <div className="flex items-center gap-12">
                {allowGalleryUpload ? (
                  <label className="text-white bg-gray-800 p-4 rounded-full cursor-pointer hover:bg-gray-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                ) : <div className="w-14"></div>}
                
                <button 
                  onClick={handleCapture}
                  className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center hover:bg-gray-200 transition-transform active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                  <div className="w-16 h-16 rounded-full border-2 border-black"></div>
                </button>

                <div className="w-14"></div> {/* Spacer balance */}
              </div>
            </div>
          </div>
        )}

        {/* Preview Mode */}
        {mode === "preview" && finalImage && (
          <div className="w-full h-full flex flex-col">
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-gray-950">
               <img src={finalImage} alt="Final Scanned" className="max-h-[75vh] object-contain shadow-2xl border border-gray-800" />
            </div>
            <div className="p-4 bg-gray-900 border-t border-gray-800 flex items-center justify-between">
               <button onClick={() => setMode("camera")} className="px-4 py-2 text-gray-300 hover:text-white font-medium">Foto Ulang</button>
               
               <button onClick={confirmAndSave} className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition">
                 Simpan
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
